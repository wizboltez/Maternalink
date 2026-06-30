import { Response } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/web/middlewares';
import { PregnancyProfile, GuidanceRule } from '../../infrastructure/database/models';

export class GuidanceController {
  /**
   * Retrieves the pregnancy guidance rules for a given user based on their pregnancy week
   */
  public static async getGuidance(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Find user's pregnancy profile
      const profile = await PregnancyProfile.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: 'Pregnancy profile not found for this user.' });
      }

      const week = profile.pregnancyWeek;

      // Find guidance rule matching the week
      const matchedRule = await GuidanceRule.findOne({
        minWeek: { $lte: week },
        maxWeek: { $gte: week },
      });

      if (!matchedRule) {
        // Return structured empty arrays if no rule matches
        return res.status(200).json({
          pregnancyWeek: week,
          nutritionTips: [],
          hydrationTips: [],
          exerciseTips: [],
          medicalTests: [],
          doctorVisits: [],
          precautions: [],
        });
      }

      // Return matching guidance rules
      return res.status(200).json({
        pregnancyWeek: week,
        nutritionTips: matchedRule.nutritionTips,
        hydrationTips: matchedRule.hydrationTips,
        exerciseTips: matchedRule.exerciseTips,
        medicalTests: matchedRule.medicalTests,
        doctorVisits: matchedRule.doctorVisits,
        precautions: matchedRule.precautions,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred while fetching guidance.' });
    }
  }
}
