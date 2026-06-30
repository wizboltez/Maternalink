/**
 * Processing Engine — Orchestrates all 6 sensor processors.
 * Receives raw BeltTelemetry, runs through each processor, outputs a unified HealthSnapshot.
 */
import { BeltTelemetry } from '../../../core/services/bluetoothService';
import {
  HeartRateProcessor,
  SpO2Estimator,
  TemperatureProcessor,
  StressAnalyzer,
  ActivityClassifier,
  ContractionAnalyzer,
  HealthStatus,
  ActivityType,
  ContractionPhase,
} from './sensorProcessors';

export interface HealthSnapshot {
  timestamp: number;
  // Heart Rate
  heartRate: number | null;
  heartRateStatus: HealthStatus;
  // SpO2
  spO2: number | null;
  spO2Status: HealthStatus;
  // Temperature
  temperature: number | null;
  temperatureStatus: HealthStatus;
  // Stress
  stressScore: number | null;
  stressStatus: HealthStatus;
  // Activity
  activity: ActivityType;
  fallDetected: boolean;
  isSleeping: boolean;
  accelMagnitude: number | null;
  // Contractions
  contractionActive: boolean;
  contractionPhase: ContractionPhase;
  contractionIntensity: number;
  contractionDuration: number;
  contractionInterval: number;
  contractionFrequency: number;
  smoothedFlex: number;
  // Raw values for sync
  flex1Raw: number | null;
  flex2Raw: number | null;
  gsrRaw: number | null;
  batteryLevel: number | null;
}

class ProcessingEngine {
  private heartRateProcessor = new HeartRateProcessor();
  private spO2Estimator = new SpO2Estimator();
  private temperatureProcessor = new TemperatureProcessor();
  private stressAnalyzer = new StressAnalyzer();
  private activityClassifier = new ActivityClassifier();
  private contractionAnalyzer = new ContractionAnalyzer();

  process(telemetry: BeltTelemetry): HealthSnapshot {
    const hrResult = this.heartRateProcessor.process(telemetry.heartRate, telemetry.irValue);
    const spO2Result = this.spO2Estimator.process(telemetry.irValue, telemetry.redValue);
    const tempResult = this.temperatureProcessor.process(telemetry.temperature);
    const stressResult = this.stressAnalyzer.process(telemetry.gsrRaw);
    const activityResult = this.activityClassifier.process(
      telemetry.accelX, telemetry.accelY, telemetry.accelZ,
      telemetry.gyroX, telemetry.gyroY, telemetry.gyroZ,
    );
    const contractionResult = this.contractionAnalyzer.process(telemetry.flex1, telemetry.flex2);

    return {
      timestamp: Date.now(),
      // Heart Rate
      heartRate: hrResult?.bpm ?? null,
      heartRateStatus: hrResult?.status ?? 'normal',
      // SpO2
      spO2: spO2Result?.spO2 ?? null,
      spO2Status: spO2Result?.status ?? 'normal',
      // Temperature
      temperature: tempResult?.tempC ?? null,
      temperatureStatus: tempResult?.status ?? 'normal',
      // Stress
      stressScore: stressResult?.stressScore ?? null,
      stressStatus: stressResult?.status ?? 'normal',
      // Activity
      activity: activityResult?.activity ?? 'unknown',
      fallDetected: activityResult?.fallDetected ?? false,
      isSleeping: activityResult?.isSleeping ?? false,
      accelMagnitude: activityResult?.accelMagnitude ?? null,
      // Contractions
      contractionActive: contractionResult?.contractionActive ?? false,
      contractionPhase: contractionResult?.phase ?? 'none',
      contractionIntensity: contractionResult?.intensity ?? 0,
      contractionDuration: contractionResult?.duration ?? 0,
      contractionInterval: contractionResult?.interval ?? 0,
      contractionFrequency: contractionResult?.frequency ?? 0,
      smoothedFlex: contractionResult?.smoothedFlex ?? 0,
      // Raw values
      flex1Raw: telemetry.flex1 ?? null,
      flex2Raw: telemetry.flex2 ?? null,
      gsrRaw: telemetry.gsrRaw ?? null,
      batteryLevel: telemetry.batteryLevel ?? null,
    };
  }

  reset() {
    this.heartRateProcessor.reset();
    this.spO2Estimator.reset();
    this.temperatureProcessor.reset();
    this.stressAnalyzer.reset();
    this.activityClassifier.reset();
    this.contractionAnalyzer.reset();
  }
}

export const processingEngine = new ProcessingEngine();
export default processingEngine;
