/**
 * Health Local Store — Offline-first local storage for health snapshots.
 * Uses AsyncStorage with daily rolling buffers (7-day retention).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthSnapshot } from './processingEngine';

const SNAPSHOT_PREFIX = '@mhl_snapshots_';
const ALERTS_KEY = '@mhl_alerts';
const BASELINES_KEY = '@mhl_baselines';
const RETENTION_DAYS = 7;
const SAMPLE_INTERVAL_MS = 5000; // Store 1 reading per 5 seconds

export interface StoredAlert {
  timestamp: number;
  type: string;
  value: number;
  message: string;
}

class HealthLocalStore {
  private lastStoreTime = 0;

  /**
   * Store a health snapshot if enough time has passed since the last store.
   * Subsamples the 1Hz stream to 1 reading per 5 seconds to limit storage.
   */
  async storeSnapshot(snapshot: HealthSnapshot): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastStoreTime < SAMPLE_INTERVAL_MS) {
      return false; // Skip — too soon
    }
    this.lastStoreTime = now;

    const dateKey = this.getDateKey(now);
    const key = SNAPSHOT_PREFIX + dateKey;

    try {
      const existing = await AsyncStorage.getItem(key);
      const snapshots: HealthSnapshot[] = existing ? JSON.parse(existing) : [];
      snapshots.push(snapshot);
      await AsyncStorage.setItem(key, JSON.stringify(snapshots));
      return true;
    } catch (error) {
      console.error('Failed to store health snapshot:', error);
      return false;
    }
  }

  /**
   * Store an alert event.
   */
  async storeAlert(alert: StoredAlert): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(ALERTS_KEY);
      const alerts: StoredAlert[] = existing ? JSON.parse(existing) : [];
      alerts.push(alert);
      // Keep last 200 alerts
      if (alerts.length > 200) alerts.splice(0, alerts.length - 200);
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  /**
   * Get health snapshots for the last N hours.
   */
  async getHistory(hours: number): Promise<HealthSnapshot[]> {
    const now = Date.now();
    const since = now - hours * 3600000;
    const results: HealthSnapshot[] = [];

    // Determine which date keys to check
    const dates = this.getDateRange(since, now);

    try {
      for (const dateKey of dates) {
        const key = SNAPSHOT_PREFIX + dateKey;
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const snapshots: HealthSnapshot[] = JSON.parse(data);
          results.push(...snapshots.filter(s => s.timestamp >= since));
        }
      }
    } catch (error) {
      console.error('Failed to read health history:', error);
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get the most recent snapshot.
   */
  async getLatestSnapshot(): Promise<HealthSnapshot | null> {
    const dateKey = this.getDateKey(Date.now());
    const key = SNAPSHOT_PREFIX + dateKey;

    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;
      const snapshots: HealthSnapshot[] = JSON.parse(data);
      return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get stored alerts.
   */
  async getAlerts(limit = 50): Promise<StoredAlert[]> {
    try {
      const data = await AsyncStorage.getItem(ALERTS_KEY);
      if (!data) return [];
      const alerts: StoredAlert[] = JSON.parse(data);
      return alerts.slice(-limit).reverse();
    } catch {
      return [];
    }
  }

  /**
   * Get all snapshots for a specific date (for sync batching).
   */
  async getSnapshotsForDate(dateKey: string): Promise<HealthSnapshot[]> {
    try {
      const key = SNAPSHOT_PREFIX + dateKey;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear snapshots for a specific date (after successful sync).
   */
  async clearDate(dateKey: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(SNAPSHOT_PREFIX + dateKey);
    } catch (error) {
      console.error('Failed to clear date:', error);
    }
  }

  /**
   * Purge data older than RETENTION_DAYS.
   */
  async purgeOldData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
      const cutoffKey = this.getDateKey(cutoffDate.getTime());

      for (const key of keys) {
        if (key.startsWith(SNAPSHOT_PREFIX)) {
          const dateKey = key.replace(SNAPSHOT_PREFIX, '');
          if (dateKey < cutoffKey) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to purge old data:', error);
    }
  }

  /**
   * Save calibration baselines.
   */
  async saveBaselines(baselines: Record<string, number>): Promise<void> {
    try {
      await AsyncStorage.setItem(BASELINES_KEY, JSON.stringify(baselines));
    } catch (error) {
      console.error('Failed to save baselines:', error);
    }
  }

  /**
   * Load calibration baselines.
   */
  async loadBaselines(): Promise<Record<string, number> | null> {
    try {
      const data = await AsyncStorage.getItem(BASELINES_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // --- Helpers ---

  private getDateKey(timestamp: number): string {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private getDateRange(from: number, to: number): string[] {
    const dates: string[] = [];
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      dates.push(this.getDateKey(current.getTime()));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}

export const healthLocalStore = new HealthLocalStore();
export default healthLocalStore;
