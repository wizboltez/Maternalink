/**
 * Sync Queue Manager — Batches health readings into 30-minute chunks
 * and computes summary statistics per batch for efficient cloud upload.
 */
import { HealthSnapshot } from './processingEngine';
import healthLocalStore, { StoredAlert } from './healthLocalStore';
import cloudSyncService from './cloudSyncService';
import { SyncPayload } from '../api/healthSyncApi';

const BATCH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

class SyncQueueManager {
  private batchBuffer: HealthSnapshot[] = [];
  private batchStartTime: number | null = null;
  private deviceId: string = 'unknown';
  private batchTimerId: ReturnType<typeof setInterval> | null = null;

  setDeviceId(id: string) {
    this.deviceId = id;
  }

  /**
   * Add a snapshot to the current batch.
   */
  addReading(snapshot: HealthSnapshot) {
    if (this.batchStartTime === null) {
      this.batchStartTime = snapshot.timestamp;
    }
    this.batchBuffer.push(snapshot);
  }

  /**
   * Start automatic batch flushing every 30 minutes.
   */
  startAutoBatching() {
    if (this.batchTimerId) return;
    this.batchTimerId = setInterval(() => this.flushBatch(), BATCH_INTERVAL_MS);
  }

  /**
   * Stop automatic batching.
   */
  stopAutoBatching() {
    if (this.batchTimerId) {
      clearInterval(this.batchTimerId);
      this.batchTimerId = null;
    }
    // Flush remaining data
    this.flushBatch();
  }

  /**
   * Flush the current batch to the sync queue.
   */
  async flushBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) return;

    const readings = this.batchBuffer;
    const startTime = this.batchStartTime || readings[0].timestamp;
    const endTime = readings[readings.length - 1].timestamp;

    // Reset buffer
    this.batchBuffer = [];
    this.batchStartTime = null;

    // Get alerts for this time period
    const allAlerts = await healthLocalStore.getAlerts(100);
    const periodAlerts = allAlerts.filter(
      (a) => a.timestamp >= startTime && a.timestamp <= endTime
    );

    // Compute summary
    const summary = this.computeSummary(readings);

    // Build payload
    const payload: SyncPayload = {
      deviceId: this.deviceId,
      sessionStart: new Date(startTime).toISOString(),
      sessionEnd: new Date(endTime).toISOString(),
      readings: readings.map((r) => ({
        timestamp: new Date(r.timestamp).toISOString(),
        heartRate: r.heartRate,
        spO2: r.spO2,
        temperature: r.temperature,
        stressScore: r.stressScore,
        activity: r.activity,
        contractionActive: r.contractionActive,
        contractionIntensity: r.contractionIntensity,
        contractionDuration: r.contractionDuration,
        contractionInterval: r.contractionInterval,
        contractionFrequency: r.contractionFrequency,
        flex1Raw: r.flex1Raw,
        flex2Raw: r.flex2Raw,
        accelMagnitude: r.accelMagnitude,
        gsrRaw: r.gsrRaw,
        batteryLevel: r.batteryLevel,
      })),
      alerts: periodAlerts.map((a) => ({
        timestamp: new Date(a.timestamp).toISOString(),
        type: a.type,
        value: a.value,
        message: a.message,
      })),
      summary,
    };

    // Enqueue for sync
    await cloudSyncService.enqueue(payload);
  }

  /**
   * Compute summary statistics for a batch of readings.
   */
  private computeSummary(readings: HealthSnapshot[]): any {
    const validHR = readings.filter((r) => r.heartRate != null).map((r) => r.heartRate!);
    const validSpO2 = readings.filter((r) => r.spO2 != null).map((r) => r.spO2!);
    const validTemp = readings.filter((r) => r.temperature != null).map((r) => r.temperature!);
    const validStress = readings.filter((r) => r.stressScore != null).map((r) => r.stressScore!);
    const contractions = readings.filter((r) => r.contractionActive);
    const falls = readings.filter((r) => r.fallDetected);
    const sleeping = readings.filter((r) => r.isSleeping);

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : undefined;

    // Dominant activity
    const activityCounts: Record<string, number> = {};
    readings.forEach((r) => {
      activityCounts[r.activity] = (activityCounts[r.activity] || 0) + 1;
    });
    const dominantActivity = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Contraction stats
    const contractionDurations = contractions
      .filter((r) => r.contractionDuration > 0)
      .map((r) => r.contractionDuration);
    const contractionIntervals = contractions
      .filter((r) => r.contractionInterval > 0)
      .map((r) => r.contractionInterval);

    return {
      avgHeartRate: avg(validHR),
      avgSpO2: avg(validSpO2),
      avgTemperature: validTemp.length > 0
        ? parseFloat((validTemp.reduce((a, b) => a + b, 0) / validTemp.length).toFixed(1))
        : undefined,
      avgStressScore: avg(validStress),
      totalContractions: new Set(contractions.map((r) => Math.floor(r.timestamp / 60000))).size, // unique per-minute
      avgContractionDuration: avg(contractionDurations),
      avgContractionInterval: avg(contractionIntervals),
      dominantActivity,
      fallsDetected: falls.length,
      sleepMinutes: Math.round((sleeping.length * 5) / 60), // each reading ~5s apart, convert to minutes approx
    };
  }
}

export const syncQueueManager = new SyncQueueManager();
export default syncQueueManager;
