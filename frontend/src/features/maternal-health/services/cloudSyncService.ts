/**
 * Cloud Sync Service — Network-aware uploader that sends health data to the cloud.
 * Monitors connectivity and flushes the sync queue when internet is available.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import healthSyncApi, { SyncPayload } from '../api/healthSyncApi';

const PENDING_SYNC_KEY = '@mhl_pending_sync';
const SYNC_STATUS_KEY = '@mhl_sync_status';

export interface SyncStatus {
  lastSyncTime: number | null;
  pendingBatches: number;
  isSyncing: boolean;
  lastError: string | null;
}

class CloudSyncService {
  private isSyncing = false;
  private retryDelayMs = 5000;
  private maxRetryDelayMs = 300000; // 5 minutes
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Start periodic sync checks (every 30 seconds).
   */
  startPeriodicSync() {
    if (this.syncIntervalId) return;
    this.syncIntervalId = setInterval(() => this.attemptSync(), 30000);
    // Also try immediately
    this.attemptSync();
  }

  /**
   * Stop periodic sync.
   */
  stopPeriodicSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Add a batch to the pending sync queue.
   */
  async enqueue(payload: SyncPayload): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const queue: SyncPayload[] = existing ? JSON.parse(existing) : [];
      queue.push(payload);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to enqueue sync batch:', error);
    }
  }

  /**
   * Get the current sync queue.
   */
  async getPendingQueue(): Promise<SyncPayload[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Attempt to sync all pending batches.
   */
  async attemptSync(): Promise<void> {
    if (this.isSyncing) return;

    // Check internet connectivity
    const isOnline = await this.checkConnectivity();
    if (!isOnline) return;

    this.isSyncing = true;

    try {
      const queue = await this.getPendingQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      const remaining: SyncPayload[] = [];
      let successCount = 0;

      for (const payload of queue) {
        const result = await healthSyncApi.syncBatch(payload);
        if (result.success) {
          successCount++;
          this.retryDelayMs = 5000; // Reset retry delay on success
        } else {
          remaining.push(payload);
          console.warn('Sync failed for batch:', result.error);
        }
      }

      // Update queue with remaining items
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));

      // Update sync status
      await this.updateStatus({
        lastSyncTime: successCount > 0 ? Date.now() : null,
        pendingBatches: remaining.length,
        isSyncing: false,
        lastError: remaining.length > 0 ? 'Some batches failed to sync' : null,
      });

      if (remaining.length > 0) {
        // Exponential backoff for retries
        this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.maxRetryDelayMs);
      }
    } catch (error: any) {
      console.error('Sync attempt failed:', error);
      await this.updateStatus({
        lastSyncTime: null,
        pendingBatches: -1,
        isSyncing: false,
        lastError: error.message,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get current sync status.
   */
  async getStatus(): Promise<SyncStatus> {
    try {
      const data = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      const queue = await this.getPendingQueue();
      const status = data ? JSON.parse(data) : {
        lastSyncTime: null,
        pendingBatches: 0,
        isSyncing: false,
        lastError: null,
      };
      status.pendingBatches = queue.length;
      status.isSyncing = this.isSyncing;
      return status;
    } catch {
      return {
        lastSyncTime: null,
        pendingBatches: 0,
        isSyncing: this.isSyncing,
        lastError: null,
      };
    }
  }

  /**
   * Check internet connectivity by making a lightweight request.
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }

  private async updateStatus(status: SyncStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
    } catch {
      // Ignore storage errors for status updates
    }
  }

  /**
   * Force clear the sync queue (for debugging or user action).
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_SYNC_KEY);
  }
}

export const cloudSyncService = new CloudSyncService();
export default cloudSyncService;
