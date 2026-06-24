import { PregnancyProfileController } from './PregnancyProfileController';
import { GuidanceController } from './GuidanceController';
import { PregnancyProfile, GuidanceRule } from '../../infrastructure/database/models';

jest.mock('../../infrastructure/database/models', () => ({
  PregnancyProfile: {
    findOne: jest.fn(),
  },
  GuidanceRule: {
    findOne: jest.fn(),
  },
}));

describe('Pregnancy Guidance Logic Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Trimester Calculation', () => {
    it('should assign trimester 1 for weeks 1 to 13', () => {
      // Accessing the private static method via index signature to verify it
      const calculateTrimester = (PregnancyProfileController as any).calculateTrimester;
      expect(calculateTrimester(1)).toBe(1);
      expect(calculateTrimester(12)).toBe(1);
      expect(calculateTrimester(13)).toBe(1);
    });

    it('should assign trimester 2 for weeks 14 to 27', () => {
      const calculateTrimester = (PregnancyProfileController as any).calculateTrimester;
      expect(calculateTrimester(14)).toBe(2);
      expect(calculateTrimester(22)).toBe(2);
      expect(calculateTrimester(27)).toBe(2);
    });

    it('should assign trimester 3 for weeks 28 and above', () => {
      const calculateTrimester = (PregnancyProfileController as any).calculateTrimester;
      expect(calculateTrimester(28)).toBe(3);
      expect(calculateTrimester(36)).toBe(3);
      expect(calculateTrimester(40)).toBe(3);
    });
  });

  describe('Guidance Rules Matching', () => {
    it('should query guidance rule matching the user pregnancy week', async () => {
      const mockUserId = '6678229b4df12a205d56a768';
      const mockProfile = {
        userId: mockUserId,
        pregnancyWeek: 22,
        trimester: 2,
        expectedDeliveryDate: new Date('2026-10-15'),
        weight: 68,
        bloodGroup: 'O+',
      };

      const mockRule = {
        minWeek: 21,
        maxWeek: 24,
        nutritionTips: ['Eat iron-rich foods'],
        hydrationTips: ['Drink 10 cups of water'],
        exerciseTips: ['Squats and walking'],
        medicalTests: ['Glucose check'],
        doctorVisits: ['Fundal height check'],
        precautions: ['Avoid heavy weights'],
      };

      // Mock DB return values
      (PregnancyProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);
      (GuidanceRule.findOne as jest.Mock).mockResolvedValue(mockRule);

      const mockReq = {
        params: { userId: mockUserId },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await GuidanceController.getGuidance(mockReq, mockRes);

      // Verify profile is searched by userId
      expect(PregnancyProfile.findOne).toHaveBeenCalledWith({ userId: mockUserId });

      // Verify guidance rule is searched within range
      expect(GuidanceRule.findOne).toHaveBeenCalledWith({
        minWeek: { $lte: 22 },
        maxWeek: { $gte: 22 },
      });

      // Verify the response is correctly structured
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        pregnancyWeek: 22,
        nutritionTips: mockRule.nutritionTips,
        hydrationTips: mockRule.hydrationTips,
        exerciseTips: mockRule.exerciseTips,
        medicalTests: mockRule.medicalTests,
        doctorVisits: mockRule.doctorVisits,
        precautions: mockRule.precautions,
      });
    });

    it('should return empty guidance arrays if no rules match', async () => {
      const mockUserId = '6678229b4df12a205d56a768';
      const mockProfile = {
        userId: mockUserId,
        pregnancyWeek: 45, // past standard guidelines
        trimester: 3,
      };

      (PregnancyProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);
      (GuidanceRule.findOne as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        params: { userId: mockUserId },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await GuidanceController.getGuidance(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        pregnancyWeek: 45,
        nutritionTips: [],
        hydrationTips: [],
        exerciseTips: [],
        medicalTests: [],
        doctorVisits: [],
        precautions: [],
      });
    });
  });
});
