import { Response } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/web/middlewares';
import { CalibrationService } from '../../application/services/CalibrationService';
import { CalibrationSession } from '../../infrastructure/database/models';

export class CalibrationController {
  /**
   * Processes the relaxation readings (Step 2 of the Calibration Wizard)
   */
  public static processRelaxation(req: AuthenticatedRequest, res: Response) {
    try {
      const { readings } = req.body;

      if (!readings || !Array.isArray(readings) || readings.length < 5) {
        return res.status(400).json({
          error: 'Invalid input. Please provide an array of at least 5 readings for the relaxation baseline.',
        });
      }

      const results = CalibrationService.processRelaxationPhase(readings);

      return res.status(200).json({
        message: 'Relaxation baseline calculated.',
        data: results,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error processing relaxation parameters.' });
    }
  }

  /**
   * Saves the final calibration results (Step 4 of the Wizard)
   */
  public static async saveCalibration(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { deviceId, flexMin, flexMax, baseline, sensorNoise, confidence } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      if (!deviceId || flexMin === undefined || flexMax === undefined || baseline === undefined || sensorNoise === undefined || confidence === undefined) {
        return res.status(400).json({ error: 'Missing required calibration parameters.' });
      }

      const calibration = await CalibrationService.saveCalibrationSession({
        userId,
        deviceId,
        flexMin,
        flexMax,
        baseline,
        sensorNoise,
        confidence,
      });

      return res.status(201).json({
        message: 'Calibration parameters saved successfully.',
        calibration,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Failed to save calibration session.' });
    }
  }

  /**
   * Retrieves the latest active calibration parameters for a device
   */
  public static async getLatestCalibration(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { deviceId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const calibration = await CalibrationSession.findOne({
        userId,
        deviceId,
        status: 'success',
      }).sort({ timestamp: -1 });

      if (!calibration) {
        return res.status(444).json({ error: 'No valid calibration parameters found. Please calibrate your belt.' });
      }

      return res.status(200).json({ calibration });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error fetching calibration parameters.' });
    }
  }
}
