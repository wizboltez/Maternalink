import { apiClient } from '../../contraction-monitoring/api/contractionApi';

export interface EmergencyContact {
  _id?: string;
  name: string;
  relation: string;
  phone: string;
  whatsapp: string;
  priority: number;
}

export interface EmergencySettings {
  _id?: string;
  userId: string;
  whatsappAlertsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  autoAlertsEnabled: boolean;
  sosButtonEnabled: boolean;
}

export interface EmergencyAlert {
  _id: string;
  userId: string;
  triggerType: 'SOS_BUTTON' | 'HIGH_STRESS' | 'HIGH_HEART_RATE' | 'STRONG_CONTRACTIONS' | 'ABNORMAL_FETAL_HEARTBEAT' | 'FALL_DETECTED' | 'MULTIPLE_RISK_FACTORS';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  sensorSnapshot: Record<string, any>;
  createdAt: string;
  status: 'active' | 'resolved';
  notificationsSent: {
    push: boolean;
    whatsapp: boolean;
  };
}

export const emergencyService = {
  // --- Contacts ---
  getContacts: async (): Promise<EmergencyContact[]> => {
    const res = await apiClient.get<EmergencyContact[]>('/emergency/contacts');
    return res.data;
  },

  addContact: async (contact: Omit<EmergencyContact, '_id'>): Promise<EmergencyContact[]> => {
    const res = await apiClient.post<EmergencyContact[]>('/emergency/contacts', contact);
    return res.data;
  },

  updateContact: async (contactId: string, contact: Partial<EmergencyContact>): Promise<EmergencyContact[]> => {
    const res = await apiClient.put<EmergencyContact[]>(`/emergency/contacts/${contactId}`, contact);
    return res.data;
  },

  deleteContact: async (contactId: string): Promise<EmergencyContact[]> => {
    const res = await apiClient.delete<EmergencyContact[]>(`/emergency/contacts/${contactId}`);
    return res.data;
  },

  // --- Settings ---
  getSettings: async (): Promise<EmergencySettings> => {
    const res = await apiClient.get<EmergencySettings>('/emergency/settings');
    return res.data;
  },

  updateSettings: async (settings: Partial<EmergencySettings>): Promise<EmergencySettings> => {
    const res = await apiClient.put<EmergencySettings>('/emergency/settings', settings);
    return res.data;
  },

  // --- History ---
  getAlertHistory: async (userId: string): Promise<EmergencyAlert[]> => {
    const res = await apiClient.get<EmergencyAlert[]>(`/emergency/history/${userId}`);
    return res.data;
  },

  // --- SOS Simulation (For testing via App) ---
  triggerManualSos: async (payload: {
    userId: string;
    deviceId: string;
    latitude: number;
    longitude: number;
  }): Promise<any> => {
    const res = await apiClient.post('/emergency/sos', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    return res.data;
  },

  // --- Auto Trigger Simulation (For testing via App) ---
  triggerAutoSimulation: async (payload: {
    userId: string;
    triggerType?: string;
    sensorData?: {
      maternalHeartRate?: number;
      fetalHeartRate?: number;
      stressLevel?: number;
      contractionIntensity?: number;
      contractionFrequency?: number;
      fallDetected?: boolean;
    };
  }): Promise<any> => {
    const res = await apiClient.post('/emergency/auto', payload);
    return res.data;
  },
};

export default emergencyService;
