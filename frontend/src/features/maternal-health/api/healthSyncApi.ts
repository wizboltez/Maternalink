/**
 * Health Sync API — HTTP client for cloud sync endpoints.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../core/config/api';

export interface SyncPayload {
  deviceId: string;
  sessionStart: string;
  sessionEnd: string;
  readings: any[];
  alerts: any[];
  summary: any;
}

class HealthSyncApi {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('@maternalink_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async syncBatch(payload: SyncPayload): Promise<{ success: boolean; batchId?: string; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/health/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { success: false, error: error.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, batchId: data.batchId };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  }

  async getHistory(days = 7): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/health/history?days=${days}`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.batches || [];
    } catch {
      return [];
    }
  }

  async getLatest(): Promise<any | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/health/latest`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.batch || null;
    } catch {
      return null;
    }
  }
}

export const healthSyncApi = new HealthSyncApi();
export default healthSyncApi;
