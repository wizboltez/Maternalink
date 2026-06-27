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

export interface ChatMessagePayload {
  message: string;
  sensorData: any;
}

export interface ChatMessageResponse {
  success: boolean;
  reply: string;
  sensorContext: any;
}

export interface ExerciseRecommendationResponse {
  success: boolean;
  emergency: boolean;
  reasons: string[];
  recommendations: any[];
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

  /**
   * Send a message to the AI chatbot
   */
  sendMessage: async (payload: ChatMessagePayload): Promise<ChatMessageResponse> => {
    if (getOfflineModeSync()) {
      return {
        success: true,
        reply: "Hello! This is a simulated offline response from the Maternalink AI assistant. I can see your heart rate is " + (payload.sensorData.heartRate || "normal") + " bpm.",
        sensorContext: payload.sensorData,
      };
    }
    const res = await apiClient.post('/chat/message', payload);
    return res.data;
  },

  /**
   * Get dynamic exercise recommendations based on current vitals
   */
  getRecommendations: async (sensorData: any): Promise<ExerciseRecommendationResponse> => {
    if (getOfflineModeSync()) {
      return {
        success: true,
        emergency: false,
        reasons: ["Offline mock: Your vitals look stable. Staying active with light mobility is recommended."],
        recommendations: [
          {
            category: "mobility",
            label: "Mobility",
            color: "#378ADD",
            icon: "🌀",
            description: "Daily movement for joint health",
            videos: [
              { id: "mo1", title: "Hip Circles", url: "https://youtube.com/shorts/GrN1mittrUk", duration: "5 min" }
            ]
          }
        ]
      };
    }
    const res = await apiClient.post('/exercise/recommend', sensorData);
    return res.data;
  },
};

export default guidanceApi;
