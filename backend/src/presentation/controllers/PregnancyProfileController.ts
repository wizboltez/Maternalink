import { Response } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/web/middlewares';
import { PregnancyProfile } from '../../infrastructure/database/models';

export class PregnancyProfileController {
  /**
   * Calculates the trimester based on the pregnancy week
   */
  private static calculateTrimester(week: number): number {
    if (week >= 1 && week <= 13) return 1;
    if (week >= 14 && week <= 27) return 2;
    return 3;
  }

  /**
   * Creates a new pregnancy profile for the authenticated user
   */
  public static async createProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. User context missing.' });
      }

      // Check if profile already exists
      const existingProfile = await PregnancyProfile.findOne({ userId });
      if (existingProfile) {
        return res.status(400).json({ error: 'Pregnancy profile already exists for this user.' });
      }

      const { pregnancyWeek, expectedDeliveryDate, weight, bloodGroup } = req.body;

      const trimester = PregnancyProfileController.calculateTrimester(pregnancyWeek);

      // Create new profile with compatibility fields
      const profile = new PregnancyProfile({
        userId,
        pregnancyWeek,
        trimester,
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        weight,
        bloodGroup,
        gestationalAgeWeeks: pregnancyWeek,
        dueDate: new Date(expectedDeliveryDate),
        doctorName: req.body.doctorName || 'Not specified',
        emergencyContact: req.body.emergencyContact || 'Not specified',
      });

      await profile.save();

      return res.status(201).json(profile);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred while creating pregnancy profile.' });
    }
  }

  /**
   * Updates an existing pregnancy profile
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const profile = await PregnancyProfile.findById(id);
      if (!profile) {
        return res.status(404).json({ error: 'Pregnancy profile not found.' });
      }

      // Authorization check (ensure user is updating their own profile)
      if (profile.userId.toString() !== userId?.toString()) {
        return res.status(403).json({ error: 'Forbidden. You do not own this profile.' });
      }

      const { pregnancyWeek, expectedDeliveryDate, weight, bloodGroup } = req.body;

      if (pregnancyWeek !== undefined) {
        profile.pregnancyWeek = pregnancyWeek;
        profile.gestationalAgeWeeks = pregnancyWeek;
        profile.trimester = PregnancyProfileController.calculateTrimester(pregnancyWeek);
      }

      if (expectedDeliveryDate !== undefined) {
        profile.expectedDeliveryDate = new Date(expectedDeliveryDate);
        profile.dueDate = new Date(expectedDeliveryDate);
      }

      if (weight !== undefined) {
        profile.weight = weight;
      }

      if (bloodGroup !== undefined) {
        profile.bloodGroup = bloodGroup;
      }

      // Maintain other fields if provided in request for compatibility
      if (req.body.doctorName !== undefined) {
        profile.doctorName = req.body.doctorName;
      }
      if (req.body.emergencyContact !== undefined) {
        profile.emergencyContact = req.body.emergencyContact;
      }

      await profile.save();

      return res.status(200).json(profile);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred while updating pregnancy profile.' });
    }
  }
}
