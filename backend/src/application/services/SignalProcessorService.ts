import { ICalibrationSession, IContractionReading, ContractionReading, MonitoringSession } from '../../infrastructure/database/models';

export interface DetectionConfig {
  riseThreshold: number; // e.g. 15% increase in flex% above baseline
  fallThreshold: number; // e.g. 5% above baseline
  minDurationSeconds: number; // e.g. 20 seconds
  maxDurationSeconds: number; // e.g. 120 seconds
  smoothingWindowSize: number; // number of readings for moving average
}

const DEFAULT_CONFIG: DetectionConfig = {
  riseThreshold: 12.0,
  fallThreshold: 4.0,
  minDurationSeconds: 20,
  maxDurationSeconds: 120,
  smoothingWindowSize: 5,
};

// In-Memory state tracker for active monitoring sessions
interface SessionState {
  isContractionActive: boolean;
  startTime?: Date;
  peakFlexPercent: number;
  peakTime?: Date;
  flexBuffer: number[];
}

export class SignalProcessorService {
  private static sessionStates: Map<string, SessionState> = new Map();

  /**
   * Cleans or initializes session tracking state when a session starts/stops
   */
  public static initSessionState(sessionId: string): void {
    this.sessionStates.set(sessionId, {
      isContractionActive: false,
      peakFlexPercent: 0,
      flexBuffer: [],
    });
  }

  public static removeSessionState(sessionId: string): void {
    this.sessionStates.delete(sessionId);
  }

  /**
   * Main processor logic mapping various hardware inputs to standard normalized metrics
   */
  public static async processIncomingReading(
    sessionId: string,
    inputData: {
      rawAdc?: number;
      flexPercent?: number;
      intensity?: number;
      duration?: number;
      interval?: number;
      frequency?: number;
      timestamp?: number;
    },
    calibration: ICalibrationSession,
    config: DetectionConfig = DEFAULT_CONFIG
  ): Promise<Partial<IContractionReading>> {
    const timestamp = inputData.timestamp ? new Date(inputData.timestamp) : new Date();

    // 1. Resolve State
    if (!this.sessionStates.has(sessionId)) {
      this.initSessionState(sessionId);
    }
    const state = this.sessionStates.get(sessionId)!;

    // 2. Compute Flex% if missing, or normalize Raw ADC
    let flexPercent = 0;
    if (inputData.flexPercent !== undefined) {
      flexPercent = Math.max(0, Math.min(100, inputData.flexPercent));
    } else if (inputData.rawAdc !== undefined) {
      const min = calibration.flexMin;
      const max = calibration.flexMax;
      if (max - min !== 0) {
        flexPercent = ((inputData.rawAdc - min) / (max - min)) * 100;
        flexPercent = Math.max(0, Math.min(100, flexPercent));
      } else {
        flexPercent = 0;
      }
    } else if (inputData.intensity !== undefined) {
      // Hardware Option 3: Only intensity. Approximate flex percent.
      flexPercent = inputData.intensity;
    } else {
      // Fallback to baseline
      flexPercent = calibration.baseline;
    }

    // 3. Smooth flex percentage values to avoid noise triggering
    state.flexBuffer.push(flexPercent);
    if (state.flexBuffer.length > config.smoothingWindowSize) {
      state.flexBuffer.shift();
    }
    const smoothedFlex = state.flexBuffer.reduce((a, b) => a + b, 0) / state.flexBuffer.length;

    // 4. Run wave detection triggers (unless hardware fully provides duration/intensity)
    let isContraction = false;
    let detectedPhase: 'none' | 'rise' | 'peak' | 'fall' = 'none';
    let duration = inputData.duration;
    let computedIntensity = inputData.intensity;

    const baseline = calibration.baseline;

    // If hardware doesn't already give intensity, we detect contractions dynamically
    if (inputData.intensity === undefined || inputData.duration === undefined) {
      const flexDelta = smoothedFlex - baseline;

      if (!state.isContractionActive) {
        // Checking for RISE
        if (flexDelta >= config.riseThreshold) {
          state.isContractionActive = true;
          state.startTime = timestamp;
          state.peakFlexPercent = smoothedFlex;
          state.peakTime = timestamp;
          detectedPhase = 'rise';
        }
      } else {
        // Checking during active contraction
        const elapsed = (timestamp.getTime() - state.startTime!.getTime()) / 1000;

        if (elapsed > config.maxDurationSeconds) {
          // Timeout - reset state
          state.isContractionActive = false;
          state.peakFlexPercent = 0;
          detectedPhase = 'none';
        } else {
          // Track peak amplitude
          if (smoothedFlex > state.peakFlexPercent) {
            state.peakFlexPercent = smoothedFlex;
            state.peakTime = timestamp;
            detectedPhase = 'peak';
          } else {
            detectedPhase = 'fall';
          }

          // Checking for FALL completion
          if (flexDelta <= config.fallThreshold) {
            // Contraction ended!
            if (elapsed >= config.minDurationSeconds) {
              isContraction = true;
              duration = elapsed;
              // Map flexMax delta to intensity scale (0-100)
              computedIntensity = Math.min(100, Math.max(0, ((state.peakFlexPercent - baseline) / (100 - baseline)) * 100));
            }
            // Reset active track
            state.isContractionActive = false;
            state.peakFlexPercent = 0;
          }
        }
      }
    } else {
      // Hardware provides details
      computedIntensity = inputData.intensity;
      duration = inputData.duration;
      isContraction = true; // Hardware flags contraction explicitly
    }

    // 5. Calculate Interval & Frequency
    let interval = inputData.interval;
    let frequency = inputData.frequency;

    if (isContraction && (interval === undefined || frequency === undefined)) {
      // Find the start time of this contraction
      const currentStart = state.startTime || timestamp;

      // Look up previous contraction starting time in the DB
      const previousContraction = await ContractionReading.findOne({
        monitoringSessionId: sessionId,
        isContraction: true,
        timestamp: { $lt: currentStart },
      }).sort({ timestamp: -1 });

      if (previousContraction) {
        // Interval = current start - previous start
        interval = (currentStart.getTime() - previousContraction.timestamp.getTime()) / 1000;
      }

      // Calculate Rolling Frequencies
      const rollingStats = await this.calculateRollingFrequencies(sessionId, currentStart);
      frequency = rollingStats.freq60; // default primary frequency is hourly based on 60 min window
    }

    return {
      monitoringSessionId: sessionId as any,
      timestamp,
      rawAdc: inputData.rawAdc,
      flexPercent,
      intensity: computedIntensity,
      duration,
      interval,
      frequency,
      source: inputData.rawAdc !== undefined ? 'hardware' : 'manual',
      isConfirmed: false,
      isContraction,
      phase: state.isContractionActive
        ? (detectedPhase === 'none' ? 'rise' : detectedPhase)
        : 'none',
    };
  }

  /**
   * Helper to calculate rolling frequencies for 10, 30, and 60 minutes
   */
  public static async calculateRollingFrequencies(
    sessionId: string,
    currentTime: Date
  ): Promise<{ freq10: number; freq30: number; freq60: number }> {
    const timeMs = currentTime.getTime();

    // Query historical counts within specific windows
    const getCountForWindow = async (minutes: number): Promise<number> => {
      const windowStart = new Date(timeMs - minutes * 60000);
      return await ContractionReading.countDocuments({
        monitoringSessionId: sessionId,
        isContraction: true,
        timestamp: { $gte: windowStart, $lte: currentTime },
      });
    };

    const count10 = await getCountForWindow(10);
    const count30 = await getCountForWindow(30);
    const count60 = await getCountForWindow(60);

    // Convert count in window to hourly projection: (count / minutes) * 60
    return {
      freq10: (count10 / 10) * 60,
      freq30: (count30 / 30) * 60,
      freq60: (count60 / 60) * 60,
    };
  }
}
