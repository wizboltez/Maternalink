import mongoose from 'mongoose';
import { CalibrationSession, Device, ICalibrationSession } from '../../infrastructure/database/models';

export class CalibrationService {
  /**
   * Processes a list of raw readings (collected over 10-15s during Step 2)
   * to calculate baseline, sensor noise (standard deviation), and confidence.
   */
  public static processRelaxationPhase(readings: number[]): {
    baseline: number;
    flexMin: number;
    sensorNoise: number;
    confidence: number;
  } {
    if (readings.length === 0) {
      throw new Error('No readings provided for calibration relaxation phase.');
    }

    // 1. Calculate Mean (Baseline)
    const sum = readings.reduce((a, b) => a + b, 0);
    const baseline = sum / readings.length;

    // 2. Calculate Standard Deviation (Noise)
    const variance = readings.reduce((a, b) => a + Math.pow(b - baseline, 2), 0) / readings.length;
    const sensorNoise = Math.sqrt(variance);

    // 3. Compute Confidence Score
    // Assumes sensor scale is 0-4095. A standard deviation of >150 is very noisy.
    // Map standard deviation to a 0-100 confidence scale.
    const noiseFactor = (sensorNoise / 150) * 100;
    const confidence = Math.max(0, Math.min(100, Math.round(100 - noiseFactor)));

    // FlexMin is typically the baseline reading minus a tiny noise buffer
    const flexMin = Math.max(0, Math.round(baseline - 1.96 * sensorNoise));

    return {
      baseline: Math.round(baseline),
      flexMin,
      sensorNoise: parseFloat(sensorNoise.toFixed(2)),
      confidence,
    };
  }

  /**
   * Saves a validated calibration session.
   */
  public static async saveCalibrationSession(params: {
    userId: string;
    deviceId: string;
    flexMin: number;
    flexMax: number;
    baseline: number;
    sensorNoise: number;
    confidence: number;
  }): Promise<ICalibrationSession> {
    const { userId, deviceId, flexMin, flexMax, baseline, sensorNoise, confidence } = params;

    // Validation checks
    if (flexMax <= flexMin) {
      throw new Error('Maximum stretch calibration value (flexMax) must be greater than minimum calibration value (flexMin).');
    }

    const minGap = 200; // Minimum ADC delta to guarantee contraction readability
    if (flexMax - flexMin < minGap) {
      throw new Error(`The calibration dynamic range is too small (${flexMax - flexMin} ADC steps). Please tighten the belt more during maximum stretch and retry.`);
    }

    // Verify device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new Error('Device not found.');
    }

    // Create Calibration Session
    const calibration = new CalibrationSession({
      userId: new mongoose.Types.ObjectId(userId),
      deviceId: new mongoose.Types.ObjectId(deviceId),
      flexMin,
      flexMax,
      baseline,
      sensorNoise,
      confidence,
      status: confidence >= 50 ? 'success' : 'failed',
    });

    await calibration.save();

    // If calibration was successful, let's update device connected time and status
    if (calibration.status === 'success') {
      device.status = 'online';
      device.lastConnectedAt = new Date();
      await device.save();
    }

    return calibration;
  }
}
