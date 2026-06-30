export interface SensorData {
  maternalHeartRate?: number;
  fetalHeartRate?: number;
  stressLevel?: number;
  contractionIntensity?: number;
  contractionFrequency?: number;
  fallDetected?: boolean;
  [key: string]: any;
}

export interface RuleResult {
  isTriggered: boolean;
  triggerType: 'SOS_BUTTON' | 'HIGH_STRESS' | 'HIGH_HEART_RATE' | 'STRONG_CONTRACTIONS' | 'ABNORMAL_FETAL_HEARTBEAT' | 'FALL_DETECTED' | 'MULTIPLE_RISK_FACTORS';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface AlertRule {
  name: string;
  check: (data: SensorData) => RuleResult | null;
}

// 1. High Heart Rate Rule
const HighHeartRateRule: AlertRule = {
  name: 'High Maternal Heart Rate',
  check: (data) => {
    if (data.maternalHeartRate && data.maternalHeartRate > 120) {
      return {
        isTriggered: true,
        triggerType: 'HIGH_HEART_RATE',
        severity: 'high',
        message: `High maternal heart rate: ${data.maternalHeartRate} bpm.`,
      };
    }
    return null;
  },
};

// 2. Abnormal Fetal Heartbeat Rule
const AbnormalFetalHeartbeatRule: AlertRule = {
  name: 'Abnormal Fetal Heartbeat',
  check: (data) => {
    if (data.fetalHeartRate) {
      if (data.fetalHeartRate < 110) {
        return {
          isTriggered: true,
          triggerType: 'ABNORMAL_FETAL_HEARTBEAT',
          severity: 'critical',
          message: `Low fetal heart rate: ${data.fetalHeartRate} bpm (Normal: 110-160).`,
        };
      }
      if (data.fetalHeartRate > 160) {
        return {
          isTriggered: true,
          triggerType: 'ABNORMAL_FETAL_HEARTBEAT',
          severity: 'high',
          message: `High fetal heart rate: ${data.fetalHeartRate} bpm (Normal: 110-160).`,
        };
      }
    }
    return null;
  },
};

// 3. High Stress Rule
const HighStressRule: AlertRule = {
  name: 'High Maternal Stress',
  check: (data) => {
    if (data.stressLevel && data.stressLevel >= 80) {
      return {
        isTriggered: true,
        triggerType: 'HIGH_STRESS',
        severity: 'medium',
        message: `High stress levels detected: ${data.stressLevel}%.`,
      };
    }
    return null;
  },
};

// 4. Strong Contractions Rule
const StrongContractionsRule: AlertRule = {
  name: 'Strong Contractions',
  check: (data) => {
    if (data.contractionIntensity && data.contractionIntensity >= 80) {
      return {
        isTriggered: true,
        triggerType: 'STRONG_CONTRACTIONS',
        severity: 'high',
        message: `Strong contraction intensity: ${data.contractionIntensity}%.`,
      };
    }
    if (data.contractionFrequency && data.contractionFrequency >= 12) {
      return {
        isTriggered: true,
        triggerType: 'STRONG_CONTRACTIONS',
        severity: 'high',
        message: `High contraction frequency: ${data.contractionFrequency} per hour.`,
      };
    }
    return null;
  },
};

// 5. Fall Detected Rule
const FallDetectedRule: AlertRule = {
  name: 'Fall Detected',
  check: (data) => {
    if (data.fallDetected === true) {
      return {
        isTriggered: true,
        triggerType: 'FALL_DETECTED',
        severity: 'critical',
        message: 'Accident/Fall detected by the maternal belt sensors.',
      };
    }
    return null;
  },
};

/**
 * Alert Engine Class managing rules list and checking sensor readings
 */
export class AlertEngine {
  // Modular list of active biometric rules. New rules can be appended here.
  private static rules: AlertRule[] = [
    HighHeartRateRule,
    AbnormalFetalHeartbeatRule,
    HighStressRule,
    StrongContractionsRule,
    FallDetectedRule,
  ];

  /**
   * Process sensor snapshot data to run through registered rules
   */
  public static analyze(sensorData: SensorData): RuleResult | null {
    const triggeredResults: RuleResult[] = [];

    // Evaluate each rule
    for (const rule of this.rules) {
      try {
        const result = rule.check(sensorData);
        if (result) triggeredResults.push(result);
      } catch (err) {
        console.error(`Error running rule "${rule.name}":`, err);
      }
    }

    if (triggeredResults.length === 0) {
      return null;
    }

    // Rule aggregation: "Multiple abnormal parameters together" -> MULTIPLE_RISK_FACTORS
    if (triggeredResults.length >= 2) {
      const messages = triggeredResults.map((r) => r.message).join(' AND ');
      return {
        isTriggered: true,
        triggerType: 'MULTIPLE_RISK_FACTORS',
        severity: 'critical',
        message: `Multiple abnormal parameters detected: ${messages}`,
      };
    }

    // If only one rule is triggered, return its result
    return triggeredResults[0];
  }
}
export default AlertEngine;
