/**
 * Alert Engine — Evaluates health snapshots against pregnancy-safe thresholds.
 * Fires alerts only on first threshold crossing (debounced, no spamming).
 */
import { HealthSnapshot } from './processingEngine';
import { HealthStatus } from './sensorProcessors';
import healthLocalStore, { StoredAlert } from './healthLocalStore';

export interface ActiveAlert {
  type: string;
  severity: 'attention' | 'urgent';
  message: string;
  value: number;
  timestamp: number;
}

type AlertCallback = (alert: ActiveAlert) => void;

class AlertEngine {
  private activeAlerts = new Map<string, number>(); // type → timestamp
  private readonly cooldownMs = 60000; // 1 minute between same alert type
  private onAlert: AlertCallback | null = null;

  setAlertCallback(cb: AlertCallback | null) {
    this.onAlert = cb;
  }

  evaluate(snapshot: HealthSnapshot): ActiveAlert[] {
    const fired: ActiveAlert[] = [];
    const now = Date.now();

    // Heart Rate
    if (snapshot.heartRate != null) {
      if (snapshot.heartRate > 120 || snapshot.heartRate < 50) {
        this.tryFire(fired, now, 'heart_rate_urgent', 'urgent',
          `Heart rate is ${snapshot.heartRate > 120 ? 'dangerously high' : 'dangerously low'} (${snapshot.heartRate} bpm)`,
          snapshot.heartRate);
      } else if (snapshot.heartRate > 100 || snapshot.heartRate < 60) {
        this.tryFire(fired, now, 'heart_rate_attention', 'attention',
          `Heart rate needs attention (${snapshot.heartRate} bpm)`,
          snapshot.heartRate);
      }
    }

    // SpO2
    if (snapshot.spO2 != null) {
      if (snapshot.spO2 < 92) {
        this.tryFire(fired, now, 'spo2_urgent', 'urgent',
          `Blood oxygen is critically low (${snapshot.spO2}%)`, snapshot.spO2);
      } else if (snapshot.spO2 < 95) {
        this.tryFire(fired, now, 'spo2_attention', 'attention',
          `Blood oxygen is below normal (${snapshot.spO2}%)`, snapshot.spO2);
      }
    }

    // Temperature
    if (snapshot.temperature != null) {
      if (snapshot.temperature > 38.0 || snapshot.temperature < 35.5) {
        this.tryFire(fired, now, 'temperature_urgent', 'urgent',
          `Body temperature is ${snapshot.temperature > 38.0 ? 'high (fever)' : 'very low'} (${snapshot.temperature}°C)`,
          snapshot.temperature);
      } else if (snapshot.temperature > 37.5 || snapshot.temperature < 36.1) {
        this.tryFire(fired, now, 'temperature_attention', 'attention',
          `Body temperature needs attention (${snapshot.temperature}°C)`,
          snapshot.temperature);
      }
    }

    // Stress
    if (snapshot.stressScore != null) {
      if (snapshot.stressScore > 70) {
        this.tryFire(fired, now, 'stress_urgent', 'urgent',
          `Stress level is very high (${snapshot.stressScore}/100)`, snapshot.stressScore);
      } else if (snapshot.stressScore > 40) {
        this.tryFire(fired, now, 'stress_attention', 'attention',
          `Stress level is elevated (${snapshot.stressScore}/100)`, snapshot.stressScore);
      }
    }

    // Fall Detection
    if (snapshot.fallDetected) {
      this.tryFire(fired, now, 'fall_detected', 'urgent',
        'A fall has been detected! Please check if you are okay.', 1);
    }

    // Contraction Frequency
    if (snapshot.contractionFrequency > 6) {
      this.tryFire(fired, now, 'contraction_frequent', 'urgent',
        `Contractions are very frequent (${snapshot.contractionFrequency}/hr)`,
        snapshot.contractionFrequency);
    } else if (snapshot.contractionFrequency >= 4) {
      this.tryFire(fired, now, 'contraction_attention', 'attention',
        `Contraction frequency is increasing (${snapshot.contractionFrequency}/hr)`,
        snapshot.contractionFrequency);
    }

    // Contraction Duration
    if (snapshot.contractionActive && snapshot.contractionDuration > 90) {
      this.tryFire(fired, now, 'contraction_long', 'urgent',
        `Current contraction has lasted ${snapshot.contractionDuration}s (>90s)`,
        snapshot.contractionDuration);
    }

    // Store alerts in local storage
    for (const alert of fired) {
      healthLocalStore.storeAlert({
        timestamp: alert.timestamp,
        type: alert.type,
        value: alert.value,
        message: alert.message,
      });
    }

    return fired;
  }

  private tryFire(
    fired: ActiveAlert[],
    now: number,
    type: string,
    severity: 'attention' | 'urgent',
    message: string,
    value: number,
  ) {
    const lastFired = this.activeAlerts.get(type) || 0;
    if (now - lastFired < this.cooldownMs) return;

    const alert: ActiveAlert = { type, severity, message, value, timestamp: now };
    this.activeAlerts.set(type, now);
    fired.push(alert);
    this.onAlert?.(alert);
  }

  clearAll() {
    this.activeAlerts.clear();
  }
}

export const alertEngine = new AlertEngine();
export default alertEngine;
