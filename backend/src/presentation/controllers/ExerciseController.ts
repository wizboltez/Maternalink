import { exercises } from '../../infrastructure/data/exercises';

type ExerciseSensorData = {
  heartRate?: number;
  temperature?: number;
  stressScore?: number;
  activityIndex?: number;
  sleepScore?: number;
  posture?: string;
  fallDetected?: boolean;
  mws?: number;
  pregnancyWeek?: number;
  minutesSitting?: number;
  spo2?: number;
  hrv?: number;
  restingHR?: number;
  bellyExpansion?: number;
};

type RecommendedExercise = {
  category: string;
} & (typeof exercises)[string];

const THRESHOLDS = {
  stress: { high: 70, moderate: 45 },
  heartRate: { high: 110, elevated: 95 },
  temperature: { high: 37.8 },
  activity: { veryLow: 0.05, low: 0.15 },
  sleep: { poor: 60 },
  sitting: { long: 30 },
  mws: { low: 60 },
};

export function getRecommendations(data: ExerciseSensorData) {
  const {
    heartRate = 80,
    temperature = 36.5,
    stressScore = 30,
    activityIndex = 0.5,
    sleepScore = 80,
    posture = 'Standing',
    fallDetected = false,
    mws = 85,
    pregnancyWeek = 20,
    minutesSitting = 0,
  } = data;

  const recommendations: string[] = [];
  const reasons: string[] = [];

  if (fallDetected) {
    return {
      success: true,
      emergency: true,
      timestamp: new Date().toISOString(),
      sensorSummary: buildSensorSummary(data),
      reasons: ['Fall detected! Please rest immediately and call for help if needed.'],
      recommendations: [buildCategory('recovery_rest')],
      totalCategories: 1,
      totalVideos: exercises.recovery_rest.videos.length,
    };
  }

  if (heartRate >= THRESHOLDS.heartRate.high || temperature >= THRESHOLDS.temperature.high) {
    const reason =
      heartRate >= THRESHOLDS.heartRate.high
        ? `Heart rate is ${heartRate} bpm — too elevated for activity. Rest is advised.`
        : `Temperature is ${temperature}°C — above normal range. Rest and hydrate.`;
    return buildResponse(['recovery_rest'], [reason], data);
  }

  if (stressScore >= THRESHOLDS.stress.high) {
    recommendations.push('stress_relief');
    reasons.push(`Stress score is ${stressScore}/100 — high. Breathing and meditation recommended.`);
  } else if (stressScore >= THRESHOLDS.stress.moderate) {
    recommendations.push('stress_relief');
    reasons.push(`Stress score is ${stressScore}/100 — moderate. Light breathing exercises suggested.`);
  }

  if (activityIndex <= THRESHOLDS.activity.veryLow) {
    recommendations.push('low_activity');
    recommendations.push('stretching');
    reasons.push(`Activity index is ${activityIndex} — very low movement detected. Light activity will help circulation.`);
  } else if (activityIndex <= THRESHOLDS.activity.low) {
    recommendations.push('stretching');
    recommendations.push('low_activity');
    reasons.push(`Activity index is ${activityIndex} — sedentary. Gentle stretching and walking suggested.`);
  }

  const poorPosture = posture === 'Left Side' || posture === 'Right Side';
  if (minutesSitting >= THRESHOLDS.sitting.long || poorPosture) {
    if (!recommendations.includes('posture_correction')) {
      recommendations.push('posture_correction');
    }
    if (minutesSitting >= THRESHOLDS.sitting.long) {
      reasons.push(`Sitting for ${minutesSitting} minutes — posture correction recommended.`);
    }
    if (poorPosture) {
      reasons.push(`Posture detected as "${posture}" — correction exercises advised.`);
    }
  }

  if (sleepScore < THRESHOLDS.sleep.poor) {
    if (!recommendations.includes('recovery_rest')) {
      recommendations.push('recovery_rest');
    }
    reasons.push(`Sleep score was ${sleepScore}/100 last night — recovery rest recommended today.`);
  }

  if (pregnancyWeek >= 28 && !recommendations.includes('mobility')) {
    recommendations.push('mobility');
    reasons.push(`Week ${pregnancyWeek} — gentle mobility exercises added for third trimester.`);
  }

  if (mws < THRESHOLDS.mws.low) {
    if (!recommendations.includes('recovery_rest')) {
      recommendations.push('recovery_rest');
    }
    reasons.push(`Maternal Wellness Score is ${mws}/100 — below normal. Rest and gentle recovery today.`);
  }

  if (!recommendations.includes('pelvic_floor')) {
    recommendations.push('pelvic_floor');
    reasons.push('Daily pelvic floor exercises are recommended for all trimesters.');
  }

  if (recommendations.length === 1 && recommendations[0] === 'pelvic_floor') {
    recommendations.unshift('mobility');
    reasons.unshift(`All vitals look good — MWS: ${mws}/100, stress: ${stressScore}/100. Daily mobility routine recommended.`);
  }

  return buildResponse(recommendations, reasons, data);
}

export function getAllExercises() {
  return {
    success: true,
    categories: Object.entries(exercises).map(([category, value]) => ({
      category,
      ...value,
    })),
  };
}

function buildCategory(key: string): RecommendedExercise {
  return {
    category: key,
    ...exercises[key],
  };
}

function buildSensorSummary(data: ExerciseSensorData) {
  return {
    heartRate: data.heartRate ?? '—',
    spo2: data.spo2 ?? '—',
    temperature: data.temperature ?? '—',
    hrv: data.hrv ?? '—',
    stressScore: data.stressScore ?? '—',
    activityIndex: data.activityIndex ?? '—',
    sleepScore: data.sleepScore ?? '—',
    posture: data.posture ?? '—',
    mws: data.mws ?? '—',
    pregnancyWeek: data.pregnancyWeek ?? '—',
    bellyExpansion: data.bellyExpansion ?? '—',
  };
}

function buildResponse(categoryKeys: string[], reasons: string[], data: ExerciseSensorData) {
  const uniqueKeys = [...new Set(categoryKeys)];
  const recommendedExercises = uniqueKeys.map((key) => buildCategory(key));

  return {
    success: true,
    emergency: false,
    timestamp: new Date().toISOString(),
    sensorSummary: buildSensorSummary(data),
    reasons,
    recommendations: recommendedExercises,
    totalCategories: recommendedExercises.length,
    totalVideos: recommendedExercises.reduce((sum, recommendation) => sum + recommendation.videos.length, 0),
  };
}