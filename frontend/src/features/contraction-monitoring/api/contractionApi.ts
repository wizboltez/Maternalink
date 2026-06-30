import axios from 'axios';
import { API_BASE_URL, getOfflineModeSync } from '../../../core/config/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple memory token store
let userToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  userToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const contractionApi = {
  // --- Auth ---
  register: async (payload: any) => {
    if (getOfflineModeSync()) return { token: 'mock-token', user: { id: 'mock-user-id', email: payload.email, name: payload.name, role: 'user' }, profile: { gestationalAgeWeeks: payload.gestationalAgeWeeks, dueDate: payload.dueDate, doctorName: payload.doctorName, emergencyContact: payload.emergencyContact } };
    const res = await apiClient.post('/auth/register', payload);
    if (res.data.token) setAuthToken(res.data.token);
    return res.data;
  },

  login: async (payload: any) => {
    if (getOfflineModeSync()) return { token: 'mock-token', user: { id: 'mock-user-id', email: payload.email, name: 'Test Mother', role: 'user' }, profile: { gestationalAgeWeeks: 28, dueDate: '2026-09-15', doctorName: 'Dr. Jane Smith', emergencyContact: '+123456789' } };
    const res = await apiClient.post('/auth/login', payload);
    if (res.data.token) setAuthToken(res.data.token);
    return res.data;
  },

  getProfile: async () => {
    if (getOfflineModeSync()) return { user: { id: 'mock-user-id', email: 'test@maternalink.com', name: 'Test Mother', role: 'user' }, profile: { gestationalAgeWeeks: 28, dueDate: '2026-09-15', doctorName: 'Dr. Jane Smith', emergencyContact: '+123456789' } };
    const res = await apiClient.get('/auth/profile');
    return res.data;
  },

  logout: () => {
    setAuthToken(null);
  },

  // --- Device ---
  syncDevice: async (payload: {
    serialNumber: string;
    name: string;
    firmwareVersion?: string;
    batteryLevel?: number;
    capabilities?: string[];
  }) => {
    if (getOfflineModeSync()) return { success: true, device: { id: 'mock-device-id', ...payload } };
    const res = await apiClient.post('/device/sync', payload);
    return res.data;
  },

  getDevices: async () => {
    if (getOfflineModeSync()) return { devices: [{ id: 'mock-device-id', serialNumber: 'ML-123456', name: 'Smart Belt v1', status: 'online' }] };
    const res = await apiClient.get('/device/list');
    return res.data;
  },

  updateDeviceStatus: async (deviceId: string, status: 'online' | 'offline' | 'maintenance') => {
    if (getOfflineModeSync()) return { success: true, deviceId, status };
    const res = await apiClient.put(`/device/${deviceId}/status`, { status });
    return res.data;
  },

  // --- Calibration ---
  processRelaxation: async (readings: number[]) => {
    if (getOfflineModeSync()) {
      const avg = readings.reduce((a, b) => a + b, 0) / (readings.length || 1);
      return { baseline: parseFloat(avg.toFixed(1)), noise: 1.5 };
    }
    const res = await apiClient.post('/calibration/relaxation', { readings });
    return res.data;
  },

  saveCalibration: async (payload: {
    deviceId: string;
    flexMin: number;
    flexMax: number;
    baseline: number;
    sensorNoise: number;
    confidence: number;
  }) => {
    if (getOfflineModeSync()) return { success: true, calibrationSessionId: 'mock-cal-id', ...payload };
    const res = await apiClient.post('/calibration/save', payload);
    return res.data;
  },

  getLatestCalibration: async (deviceId: string) => {
    if (getOfflineModeSync()) return { deviceId, flexMin: 100, flexMax: 900, baseline: 500, sensorNoise: 2.0, confidence: 95 };
    const res = await apiClient.get(`/calibration/latest/${deviceId}`);
    return res.data;
  },

  // --- Monitoring Session ---
  startSession: async (deviceId: string, calibrationSessionId: string) => {
    if (getOfflineModeSync()) return { success: true, sessionId: 'mock-session-id', deviceId, calibrationSessionId };
    const res = await apiClient.post('/monitoring/start', { deviceId, calibrationSessionId });
    return res.data;
  },

  stopSession: async (sessionId: string) => {
    if (getOfflineModeSync()) return { success: true, sessionId, message: 'Session stopped successfully' };
    const res = await apiClient.post(`/monitoring/stop/${sessionId}`);
    return res.data;
  },

  postReading: async (sessionId: string, payload: any) => {
    if (getOfflineModeSync()) return { success: true, sessionId, payload };
    const res = await apiClient.post(`/monitoring/reading/${sessionId}`, payload);
    return res.data;
  },

  getSessions: async (params?: { limit?: number; startDate?: string; endDate?: string; search?: string }) => {
    if (getOfflineModeSync()) return { sessions: [] };
    const res = await apiClient.get('/monitoring/sessions', { params });
    return res.data;
  },

  getSessionDetails: async (sessionId: string) => {
    if (getOfflineModeSync()) return { session: { id: sessionId, startTime: Date.now() - 3600000, endTime: Date.now(), deviceId: 'mock-device-id' } };
    const res = await apiClient.get(`/monitoring/session/${sessionId}`);
    return res.data;
  },

  getAuthToken: () => userToken,

  downloadSessionPdf: async (sessionId: string): Promise<ArrayBuffer> => {
    const res = await apiClient.get(`/monitoring/export/pdf/${sessionId}`, {
      responseType: 'arraybuffer',
    });
    return res.data;
  },
};

export default contractionApi;
