import { BeltTelemetry } from '../../../core/services/bluetoothService';

export interface HealthSnapshot {
  timestamp: number;
  batteryLevel: number | null;
  heartRate: number | null;
  heartRateStatus: any;
  spO2: number | null;
  spO2Status: any;
  temperature: number | null;
  temperatureStatus: any;
  stressScore: number | null;
  stressStatus: any;
  activity: string;
  fallDetected: boolean;
  isSleeping: boolean;
  accelMagnitude: number;
  contractionActive: boolean;
  contractionPhase: string;
  contractionIntensity: number;
  contractionDuration: number;
  contractionInterval: number;
  contractionFrequency: number;
  smoothedFlex: number;
  flex1Raw: number;
  flex2Raw: number;
  gsrRaw: number;
}

class ProcessingEngine {
  process(telemetry: BeltTelemetry): HealthSnapshot {
    const hr = telemetry.heartRateValid ? telemetry.heartRate! : 0;
    const spo2 = telemetry.spo2Valid ? telemetry.spo2! : 0;
    const temp = telemetry.tempC ?? 36.5;
    
    // Fake stress based on GSR
    const gsr = telemetry.gsr ?? 0;
    const stress = Math.min(100, Math.max(0, 100 - (gsr / 40)));
    
    return {
      timestamp: Date.now(),
      batteryLevel: telemetry.batteryLevel ?? 100,
      heartRate: hr,
      heartRateStatus: 'normal',
      spO2: spo2,
      spO2Status: 'normal',
      temperature: temp,
      temperatureStatus: 'normal',
      stressScore: Math.round(stress),
      stressStatus: 'normal',
      activity: telemetry.motion === 'IDLE' ? 'sitting' : 'walking',
      fallDetected: (telemetry.jerk ?? 0) > 2.0,
      isSleeping: false,
      accelMagnitude: telemetry.jerk ?? 0,
      contractionActive: telemetry.flexStatus === 'CONTRACTION',
      contractionPhase: 'none',
      contractionIntensity: Math.abs((telemetry.flex1 ?? 330) - 330),
      contractionDuration: 0,
      contractionInterval: 0,
      contractionFrequency: 0,
      smoothedFlex: telemetry.flex1 ?? 0,
      flex1Raw: telemetry.flex1 ?? 0,
      flex2Raw: telemetry.flex2 ?? 0,
      gsrRaw: telemetry.gsr ?? 0
    };
  }

  reset() {}
}

export const processingEngine = new ProcessingEngine();
export default processingEngine;
