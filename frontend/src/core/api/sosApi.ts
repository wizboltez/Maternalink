import { apiClient } from '../../features/contraction-monitoring/api/contractionApi';

export interface SosResponse {
  success: boolean;
  message?: string;
  error?: string;
  sid?: string;
  mocked?: boolean;
}

export const sosApi = {
  activateSos: async (userId?: string, location?: string): Promise<SosResponse> => {
    try {
      const response = await apiClient.post('/sos/activate', { userId, location });
      return response.data;
    } catch (error: any) {
      console.error('SOS Activation error:', error);
      throw error;
    }
  },
};

export default sosApi;
