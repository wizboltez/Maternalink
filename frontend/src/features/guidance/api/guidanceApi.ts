import { apiClient } from '../../contraction-monitoring/api/contractionApi';

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
    const res = await apiClient.post('/profile', payload);
    return res.data;
  },

  /**
   * Updates an existing pregnancy profile by ID
   */
  updateProfile: async (id: string, payload: UpdateProfilePayload) => {
    const res = await apiClient.put(`/profile/${id}`, payload);
    return res.data;
  },

  /**
   * Gets week-by-week pregnancy guidance for a user
   */
  getGuidance: async (userId: string): Promise<GuidanceData> => {
    const res = await apiClient.get(`/guidance/${userId}`);
    return res.data;
  },
};

export default guidanceApi;
