/**
 * Local signal processing algorithms for maternal health sensors.
 * All processing runs on-device without internet.
 *
 * Adapted for ESP32 firmware JSON format:
 * {"ir":544,"temp":-127.00,"gsr":2518,"flex1":4095,"flex2":809,
 *  "ax":424,"ay":88,"az":18716,"gx":-1068,"gy":388,"gz":-250}
 */

export type HealthStatus = 'normal' | 'attention' | 'urgent';
export type ActivityType = 'lying' | 'sitting' | 'standing' | 'walking' | 'unknown';
export type ContractionPhase = 'none' | 'rise' | 'peak' | 'fall';

// ------------- Heart Rate Processor (from IR signal peak detection) ----------
export class HeartRateProcessor {
  private irBuffer: number[] = [];
  private bpmBuffer: number[] = [];
  private lastPeakTime = 0;
  private lastIr = 0;
  private readonly irWindowSize = 30; // ~30 samples at 1Hz
  private readonly bpmSmoothing = 5;

  /**
   * Accepts either a direct heartRate value OR an IR signal value.
   * If heartRate is provided directly, it is smoothed and returned.
   * If only irValue is provided, BPM is estimated via peak detection.
   */
  process(heartRate: number | undefined, irValue?: number): { bpm: number; status: HealthStatus } | null {
    // Direct heart rate value from sensor
    if (heartRate != null && heartRate > 0) {
      this.bpmBuffer.push(heartRate);
      if (this.bpmBuffer.length > this.bpmSmoothing) this.bpmBuffer.shift();
      const smoothed = Math.round(this.bpmBuffer.reduce((a, b) => a + b, 0) / this.bpmBuffer.length);
      return { bpm: smoothed, status: this.classifyBpm(smoothed) };
    }

    // Estimate BPM from IR signal (peak-to-peak interval detection)
    if (irValue != null && irValue > 0) {
      this.irBuffer.push(irValue);
      if (this.irBuffer.length > this.irWindowSize) this.irBuffer.shift();
      if (this.irBuffer.length < 5) return null;

      // Simple peak detection: current value is a local maximum
      const len = this.irBuffer.length;
      const prev = this.irBuffer[len - 2] ?? 0;
      const curr = this.irBuffer[len - 1];
      const mean = this.irBuffer.reduce((a, b) => a + b, 0) / len;

      // Detect peaks above the mean
      if (curr > prev && curr > mean && this.lastIr <= prev) {
        const now = Date.now();
        if (this.lastPeakTime > 0) {
          const intervalMs = now - this.lastPeakTime;
          if (intervalMs > 300 && intervalMs < 2000) { // 30-200 BPM range
            const instantBpm = Math.round(60000 / intervalMs);
            this.bpmBuffer.push(instantBpm);
            if (this.bpmBuffer.length > this.bpmSmoothing) this.bpmBuffer.shift();
          }
        }
        this.lastPeakTime = now;
      }
      this.lastIr = curr;

      if (this.bpmBuffer.length > 0) {
        const smoothed = Math.round(this.bpmBuffer.reduce((a, b) => a + b, 0) / this.bpmBuffer.length);
        return { bpm: smoothed, status: this.classifyBpm(smoothed) };
      }

      return null;
    }

    return null;
  }

  private classifyBpm(bpm: number): HealthStatus {
    if (bpm < 50 || bpm > 120) return 'urgent';
    if (bpm < 60 || bpm > 100) return 'attention';
    return 'normal';
  }

  reset() { this.irBuffer = []; this.bpmBuffer = []; this.lastPeakTime = 0; this.lastIr = 0; }
}

// ------------- SpO2 Estimator (from IR signal) ----------
export class SpO2Estimator {
  private irBuffer: number[] = [];
  private redBuffer: number[] = [];
  private readonly windowSize = 10;

  /**
   * Accepts IR and optionally Red LED values.
   * If Red is not available, estimates SpO2 from IR signal variability alone
   * using a simplified perfusion-index approach.
   */
  process(irValue: number | undefined, redValue: number | undefined): { spO2: number; status: HealthStatus } | null {
    if (irValue == null || irValue <= 0) return null;

    this.irBuffer.push(irValue);
    if (this.irBuffer.length > this.windowSize) this.irBuffer.shift();
    if (this.irBuffer.length < 3) return null;

    // Compute AC and DC components for IR
    const irDC = this.irBuffer.reduce((a, b) => a + b, 0) / this.irBuffer.length;
    const irAC = Math.max(...this.irBuffer) - Math.min(...this.irBuffer);
    if (irDC === 0) return null;

    let spO2: number;

    if (redValue != null && redValue > 0) {
      // Full R-ratio calculation when both IR and Red are available
      this.redBuffer.push(redValue);
      if (this.redBuffer.length > this.windowSize) this.redBuffer.shift();

      const redDC = this.redBuffer.reduce((a, b) => a + b, 0) / this.redBuffer.length;
      const redAC = Math.max(...this.redBuffer) - Math.min(...this.redBuffer);
      if (redDC === 0) return null;

      const R = (redAC / redDC) / (irAC / irDC || 1);
      spO2 = Math.round(Math.max(0, Math.min(100, 110 - 25 * R)));
    } else {
      // IR-only estimation: use perfusion index (PI = irAC / irDC * 100)
      // Higher PI generally correlates with good perfusion and SpO2 > 95%
      const PI = (irAC / irDC) * 100;
      // Empirical mapping: healthy PI (0.5-5%) → SpO2 94-99%
      if (PI > 0.3) {
        spO2 = Math.round(Math.min(99, Math.max(90, 94 + PI * 1.2)));
      } else {
        // Very low perfusion — finger may not be placed correctly
        spO2 = 95; // default to healthy estimate
      }
    }

    let status: HealthStatus = 'normal';
    if (spO2 < 92) status = 'urgent';
    else if (spO2 < 95) status = 'attention';

    return { spO2, status };
  }

  reset() { this.irBuffer = []; this.redBuffer = []; }
}

// ------------- Temperature Processor ----------
export class TemperatureProcessor {
  private buffer: number[] = [];
  private readonly windowSize = 5;

  /**
   * Processes temperature in °C. Ignores invalid readings like -127.0
   * which the DS18B20 returns when not connected.
   */
  process(temperature: number | undefined): { tempC: number; status: HealthStatus } | null {
    // DS18B20 returns -127 when disconnected or errored
    if (temperature == null || temperature <= -40 || temperature > 50) return null;

    this.buffer.push(temperature);
    if (this.buffer.length > this.windowSize) this.buffer.shift();

    const smoothed = parseFloat((this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length).toFixed(1));

    let status: HealthStatus = 'normal';
    if (smoothed < 35.5 || smoothed > 38.0) status = 'urgent';
    else if (smoothed > 37.5 || smoothed < 36.1) status = 'attention';

    return { tempC: smoothed, status };
  }

  reset() { this.buffer = []; }
}

// ------------- Stress Analyzer (GSR-based) ----------
export class StressAnalyzer {
  private buffer: number[] = [];
  private baseline: number | null = null;
  private calibrationCount = 0;
  private readonly calibrationSamples = 30;
  private readonly windowSize = 20;

  process(gsrRaw: number | undefined): { stressScore: number; status: HealthStatus } | null {
    if (gsrRaw == null || gsrRaw <= 0) return null;

    // Calibration phase: collect baseline from first N readings
    if (this.calibrationCount < this.calibrationSamples) {
      this.buffer.push(gsrRaw);
      this.calibrationCount++;
      if (this.calibrationCount === this.calibrationSamples) {
        this.baseline = this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
        this.buffer = [];
      }
      return { stressScore: 0, status: 'normal' };
    }

    if (this.baseline === null) return null;

    this.buffer.push(gsrRaw);
    if (this.buffer.length > this.windowSize) this.buffer.shift();

    const smoothed = this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;

    // GSR changes with stress — normalize deviation to 0-100 scale
    const deviation = Math.abs(this.baseline - smoothed);
    const rawScore = (deviation / this.baseline) * 100;
    const stressScore = Math.round(Math.max(0, Math.min(100, rawScore)));

    let status: HealthStatus = 'normal';
    if (stressScore > 70) status = 'urgent';
    else if (stressScore > 40) status = 'attention';

    return { stressScore, status };
  }

  reset() {
    this.buffer = [];
    this.baseline = null;
    this.calibrationCount = 0;
  }
}

// ------------- Activity Classifier (MPU6050-based) ----------
//
// The ESP32 sends RAW MPU6050 register values (not in g units).
// At ±2g sensitivity: 1g ≈ 16384 LSB
// We convert raw values to g before classifying.
//
const MPU6050_SCALE = 16384.0; // LSB per g at ±2g

export class ActivityClassifier {
  private accelHistory: { magnitude: number; angle: number; timestamp: number }[] = [];
  private readonly historySize = 60; // 60 seconds at 1Hz
  private inactivityStart: number | null = null;
  private readonly sleepThresholdMinutes = 20;
  private lastMagnitude = 0;
  private fallCooldown = 0;

  process(
    rawAx: number | undefined,
    rawAy: number | undefined,
    rawAz: number | undefined,
    rawGx: number | undefined,
    rawGy: number | undefined,
    rawGz: number | undefined,
  ): {
    activity: ActivityType;
    fallDetected: boolean;
    isSleeping: boolean;
    accelMagnitude: number;
  } | null {
    if (rawAx == null || rawAy == null || rawAz == null) return null;

    // Convert raw MPU6050 values to g (gravity units)
    const ax = rawAx / MPU6050_SCALE;
    const ay = rawAy / MPU6050_SCALE;
    const az = rawAz / MPU6050_SCALE;

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const gravityAngle = Math.atan2(Math.sqrt(ax * ax + ay * ay), az) * (180 / Math.PI);
    const now = Date.now();

    this.accelHistory.push({ magnitude, angle: gravityAngle, timestamp: now });
    if (this.accelHistory.length > this.historySize) this.accelHistory.shift();

    // --- Fall Detection ---
    let fallDetected = false;
    if (this.fallCooldown > 0) {
      this.fallCooldown--;
    } else {
      const magnitudeSpike = Math.abs(magnitude - this.lastMagnitude) > 2.0; // >2g sudden change
      const orientationChange = this.accelHistory.length >= 2 &&
        Math.abs(this.accelHistory[this.accelHistory.length - 1].angle -
                 this.accelHistory[this.accelHistory.length - 2].angle) > 45;
      if (magnitudeSpike && orientationChange) {
        fallDetected = true;
        this.fallCooldown = 30; // 30-second cooldown after fall detection
      }
    }
    this.lastMagnitude = magnitude;

    // --- Activity Classification ---
    const recentMagnitudes = this.accelHistory.slice(-10).map(h => h.magnitude);
    const variance = this.computeVariance(recentMagnitudes);
    const avgAngle = this.accelHistory.slice(-10).reduce((sum, h) => sum + h.angle, 0) /
                     Math.min(this.accelHistory.length, 10);

    let activity: ActivityType = 'unknown';
    if (variance < 0.02) {
      // Very still
      if (avgAngle > 60) activity = 'lying';
      else if (avgAngle > 30) activity = 'sitting';
      else activity = 'standing';
    } else if (variance < 0.5) {
      activity = 'standing'; // minor movements
    } else {
      activity = 'walking';
    }

    // --- Sleep Detection ---
    if (variance < 0.05 && activity === 'lying') {
      if (this.inactivityStart === null) this.inactivityStart = now;
    } else {
      this.inactivityStart = null;
    }

    const inactiveMinutes = this.inactivityStart
      ? (now - this.inactivityStart) / 60000
      : 0;
    const isSleeping = inactiveMinutes >= this.sleepThresholdMinutes;

    return {
      activity,
      fallDetected,
      isSleeping,
      accelMagnitude: parseFloat(magnitude.toFixed(2)),
    };
  }

  private computeVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  }

  reset() {
    this.accelHistory = [];
    this.inactivityStart = null;
    this.lastMagnitude = 0;
    this.fallCooldown = 0;
  }
}

// ------------- Contraction Analyzer (Dual Flex Sensors / Belly Expansion) ----------
export class ContractionAnalyzer {
  private smoothedBuffer: number[] = [];
  private baseline = 0;
  private baselineBuffer: number[] = [];
  private readonly baselineCalibrationCount = 20;
  private calibrated = false;

  private isContracting = false;
  private contractionStartTime = 0;
  private peakIntensity = 0;
  private lastContractionEndTime = 0;
  private contractionTimestamps: number[] = [];

  private readonly alpha = 0.3; // EMA smoothing factor
  private readonly thresholdMultiplier = 1.25; // baseline * 1.25 = threshold
  private lastSmoothed = 0;

  process(
    flex1: number | undefined,
    flex2: number | undefined,
  ): {
    contractionActive: boolean;
    phase: ContractionPhase;
    intensity: number;
    duration: number;
    interval: number;
    frequency: number;
    smoothedFlex: number;
  } | null {
    if (flex1 == null && flex2 == null) return null;

    // Average of both flex sensors (or use whichever is available)
    const rawFlex = flex1 != null && flex2 != null
      ? (flex1 + flex2) / 2
      : (flex1 ?? flex2 ?? 0);

    // Calibration phase
    if (!this.calibrated) {
      this.baselineBuffer.push(rawFlex);
      if (this.baselineBuffer.length >= this.baselineCalibrationCount) {
        this.baseline = this.baselineBuffer.reduce((a, b) => a + b, 0) / this.baselineBuffer.length;
        this.calibrated = true;
        this.lastSmoothed = this.baseline;
      }
      return {
        contractionActive: false,
        phase: 'none',
        intensity: 0,
        duration: 0,
        interval: 0,
        frequency: 0,
        smoothedFlex: rawFlex,
      };
    }

    // Exponential Moving Average smoothing
    const smoothed = this.alpha * rawFlex + (1 - this.alpha) * this.lastSmoothed;
    this.lastSmoothed = smoothed;

    this.smoothedBuffer.push(smoothed);
    if (this.smoothedBuffer.length > 60) this.smoothedBuffer.shift();

    const threshold = this.baseline * this.thresholdMultiplier;
    const now = Date.now();

    let phase: ContractionPhase = 'none';
    let duration = 0;
    let interval = 0;

    if (!this.isContracting && smoothed > threshold) {
      // Contraction starting (rise)
      this.isContracting = true;
      this.contractionStartTime = now;
      this.peakIntensity = 0;
      phase = 'rise';
    } else if (this.isContracting) {
      duration = Math.round((now - this.contractionStartTime) / 1000);

      // Track peak
      const currentIntensity = Math.round(
        Math.min(100, ((smoothed - this.baseline) / (this.baseline * 0.5)) * 100)
      );
      if (currentIntensity > this.peakIntensity) {
        this.peakIntensity = currentIntensity;
        phase = 'peak';
      } else if (smoothed <= threshold) {
        // Contraction ending (fall)
        phase = 'fall';
        this.isContracting = false;
        this.lastContractionEndTime = now;
        this.contractionTimestamps.push(now);
        // Clean old timestamps (keep last hour)
        const oneHourAgo = now - 3600000;
        this.contractionTimestamps = this.contractionTimestamps.filter(t => t > oneHourAgo);
      } else {
        phase = smoothed > this.lastSmoothed ? 'rise' : 'fall';
      }
    }

    if (this.lastContractionEndTime > 0 && this.contractionStartTime > this.lastContractionEndTime) {
      interval = Math.round((this.contractionStartTime - this.lastContractionEndTime) / 1000);
    }

    const frequency = this.contractionTimestamps.length;

    return {
      contractionActive: this.isContracting,
      phase,
      intensity: Math.max(0, Math.min(100, this.peakIntensity)),
      duration,
      interval,
      frequency,
      smoothedFlex: parseFloat(smoothed.toFixed(1)),
    };
  }

  reset() {
    this.smoothedBuffer = [];
    this.baselineBuffer = [];
    this.baseline = 0;
    this.calibrated = false;
    this.isContracting = false;
    this.contractionStartTime = 0;
    this.peakIntensity = 0;
    this.lastContractionEndTime = 0;
    this.contractionTimestamps = [];
    this.lastSmoothed = 0;
  }
}
