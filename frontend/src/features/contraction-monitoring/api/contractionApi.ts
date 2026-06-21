import axios from 'axios';
import { API_BASE_URL } from '../../../core/config/api';

const apiClient = axios.create({
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
    const res = await apiClient.post('/auth/register', payload);
    if (res.data.token) setAuthToken(res.data.token);
    return res.data;
  },

  login: async (payload: any) => {
    const res = await apiClient.post('/auth/login', payload);
    if (res.data.token) setAuthToken(res.data.token);
    return res.data;
  },

  getProfile: async () => {
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
    const res = await apiClient.post('/device/sync', payload);
    return res.data;
  },

  getDevices: async () => {
    const res = await apiClient.get('/device/list');
    return res.data;
  },

  updateDeviceStatus: async (deviceId: string, status: 'online' | 'offline' | 'maintenance') => {
    const res = await apiClient.put(`/device/${deviceId}/status`, { status });
    return res.data;
  },

  // --- Calibration ---
  processRelaxation: async (readings: number[]) => {
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
    const res = await apiClient.post('/calibration/save', payload);
    return res.data;
  },

  getLatestCalibration: async (deviceId: string) => {
    const res = await apiClient.get(`/calibration/latest/${deviceId}`);
    return res.data;
  },

  // --- Monitoring Session ---
  startSession: async (deviceId: string, calibrationSessionId: string) => {
    const res = await apiClient.post('/monitoring/start', { deviceId, calibrationSessionId });
    return res.data;
  },

  stopSession: async (sessionId: string) => {
    const res = await apiClient.post(`/monitoring/stop/${sessionId}`);
    return res.data;
  },

  postReading: async (sessionId: string, payload: any) => {
    const res = await apiClient.post(`/monitoring/reading/${sessionId}`, payload);
    return res.data;
  },

  getSessions: async (params?: { limit?: number; startDate?: string; endDate?: string; search?: string }) => {
    const res = await apiClient.get('/monitoring/sessions', { params });
    return res.data;
  },

  getSessionDetails: async (sessionId: string) => {
    const res = await apiClient.get(`/monitoring/session/${sessionId}`);
    return res.data;
  },

  // --- PDF & CSV Downloads ---
  getPdfReportUrl: (sessionId: string) => {
    return `${API_BASE_URL}/monitoring/export/pdf/${sessionId}?token=${userToken}`;
  },

  getCsvReportUrl: (sessionId: string) => {
    return `${API_BASE_URL}/monitoring/export/csv/${sessionId}?token=${userToken}`;
  },
};

export default contractionApi;
