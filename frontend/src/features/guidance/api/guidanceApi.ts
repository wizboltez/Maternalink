import { apiClient } from '../../contraction-monitoring/api/contractionApi';
import { getOfflineModeSync } from '../../../core/config/api';

export interface CreateProfilePayload {
  pregnancyWeek: number;
  expectedDeliveryDate: string;
  weight: number;
  bloodGroup: string;
}

export interface UpdateProfilePayload {
  pregnancyWeek?: number;
  expectedDeliveryDate?: string;
  weight?: number;
  bloodGroup?: string;
}

export interface GuidanceData {
  pregnancyWeek: number;
  nutritionTips: string[];
  hydrationTips: string[];
  exerciseTips: string[];
  medicalTests: string[];
  doctorVisits: string[];
  precautions: string[];
}

export const guidanceApi = {
  /**
   * Creates a new pregnancy profile
   */
  createProfile: async (payload: CreateProfilePayload) => {
    if (getOfflineModeSync()) {
      return { success: true, profile: { id: 'mock-profile-id', ...payload } };
    }
    const res = await apiClient.post('/profile', payload);
    return res.data;
  },

  /**
   * Updates an existing pregnancy profile by ID
   */
  updateProfile: async (id: string, payload: UpdateProfilePayload) => {
    if (getOfflineModeSync()) {
      return { success: true, profile: { id, ...payload } };
    }
    const res = await apiClient.put(`/profile/${id}`, payload);
    return res.data;
  },

  /**
   * Gets week-by-week pregnancy guidance for a user
   */
  getGuidance: async (userId: string): Promise<GuidanceData> => {
    if (getOfflineModeSync()) {
      return {
        pregnancyWeek: 28,
        nutritionTips: [
          'Increase iron intake with leafy greens',
          'Take 600mcg of folic acid daily',
          'Stay hydrated: aim for 10 glasses of water'
        ],
        hydrationTips: [
          'Drink water before, during, and after exercise'
        ],
        exerciseTips: [
          '30 minutes of moderate walking daily',
          'Prenatal yoga for flexibility'
        ],
        medicalTests: [
          'Glucose screening test',
          'Complete blood count (CBC)'
        ],
        doctorVisits: [
          'Schedule bi-weekly checkups'
        ],
        precautions: [
          'Avoid sleeping on your back',
          'Avoid strenuous lifting'
        ]
      };
    }
    const res = await apiClient.get(`/guidance/${userId}`);
    return res.data;
  },
};

export default guidanceApi;
