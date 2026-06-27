// controllers/exerciseController.js
// Decision engine — uses PROCESSED values from  hardware branch
// NOT raw sensor values — those are already calculated before reaching here

const exercises = require("../data/exercises");

// ─── Thresholds 
// stressScore  : 0–100  ( calculates using GSR + HRV formula)
// activityIndex: 0–1    ( calculates using MPU6500 data)
// heartRate    : BPM    ( calculates from MAX30102 peaks)
// temperature  : °C     ( averages DS18B20 readings)
// sleepScore   : 0–100  ( calculates from night movement + HRV)
// mws          : 0–100  ( Maternal Wellness Score formula)
// posture      : string — "Standing" | "Left Side" | "Right Side"
// fallDetected : boolean

const THRESHOLDS = {
  stress: {
    high: 70,       // stressScore above this → stress relief first
    moderate: 45,   // above this → include breathing suggestions
  },
  heartRate: {
    high: 110,      // BPM — only rest recommended above this
    elevated: 95,   // BPM — avoid intense activity
  },
  temperature: {
    high: 37.8,     // °C — rest recommended above this
  },
  activity: {
    veryLow: 0.05,  // activityIndex — almost no movement
    low: 0.15,      // activityIndex — sedentary
  },
  sleep: {
    poor: 60,       // sleepScore below this → recovery prioritised
  },
  sitting: {
    long: 30,       // minutes — posture correction triggers
  },
  mws: {
    low: 60,        // mws below this → wellness-focused recommendations
  },
};

// ─── Main recommendation function ────────────────────────────────────────────

// {
//   heartRate      : number   — BPM
//   spo2           : number   — % (0–100)
//   temperature    : number   — °C
//   hrv            : number   — RMSSD in ms
//   restingHR      : number   — BPM when still
//   gsrConductance : number   — µS value
//   stressScore    : number   — 0–100 (friend's formula: 0.7*GSR + 0.3*(1-HRV))
//   activityIndex  : number   — 0–1 (friend's formula: sum|A-1g|/N)
//   sleepScore     : number   — 0–100
//   posture        : string   — "Standing" | "Left Side" | "Right Side"
//   fallDetected   : boolean
//   bellyExpansion : number   — % change from calibration
//   mws            : number   — 0–100 Maternal Wellness Score
//   pregnancyWeek  : number   — entered by user in app
//   minutesSitting : number   — estimated by app timer
// }

function getRecommendations(data) {
  const {
    heartRate      = 80,
    temperature    = 36.5,
    stressScore    = 30,
    activityIndex  = 0.5,
    sleepScore     = 80,
    posture        = "Standing",
    fallDetected   = false,
    mws            = 85,
    pregnancyWeek  = 20,
    minutesSitting = 0,
  } = data;

  const recommendations = [];
  const reasons = [];

  // ── Rule 1: Safety first — fall detected ────────────────────────────────────
  if (fallDetected) {
    return {
      success: true,
      emergency: true,
      timestamp: new Date().toISOString(),
      sensorSummary: buildSensorSummary(data),
      reasons: ["Fall detected! Please rest immediately and call for help if needed."],
      recommendations: [buildCategory("recovery_rest")],
      totalCategories: 1,
      totalVideos: exercises.recovery_rest.videos.length,
    };
  }

  // ── Rule 2: High HR or high temperature — rest only, stop here ──────────────
  if (heartRate >= THRESHOLDS.heartRate.high || temperature >= THRESHOLDS.temperature.high) {
    const reason =
      heartRate >= THRESHOLDS.heartRate.high
        ? `Heart rate is ${heartRate} bpm — too elevated for activity. Rest is advised.`
        : `Temperature is ${temperature}°C — above normal range. Rest and hydrate.`;
    return buildResponse(["recovery_rest"], [reason], data);
  }

  // ── Rule 3: High stress score — breathing and meditation first ──────────────
  if (stressScore >= THRESHOLDS.stress.high) {
    recommendations.push("stress_relief");
    reasons.push(
      `Stress score is ${stressScore}/100 — high. Breathing and meditation recommended.`
    );
  } else if (stressScore >= THRESHOLDS.stress.moderate) {
    recommendations.push("stress_relief");
    reasons.push(
      `Stress score is ${stressScore}/100 — moderate. Light breathing exercises suggested.`
    );
  }

  // ── Rule 4: Low activity — movement needed ──────────────────────────────────
  if (activityIndex <= THRESHOLDS.activity.veryLow) {
    recommendations.push("low_activity");
    recommendations.push("stretching");
    reasons.push(
      `Activity index is ${activityIndex} — very low movement detected. Light activity will help circulation.`
    );
  } else if (activityIndex <= THRESHOLDS.activity.low) {
    recommendations.push("stretching");
    recommendations.push("low_activity");
    reasons.push(
      `Activity index is ${activityIndex} — sedentary. Gentle stretching and walking suggested.`
    );
  }

  // ── Rule 5: Long sitting or poor posture ────────────────────────────────────
  const poorPosture = posture === "Left Side" || posture === "Right Side";
  if (minutesSitting >= THRESHOLDS.sitting.long || poorPosture) {
    if (!recommendations.includes("posture_correction")) {
      recommendations.push("posture_correction");
    }
    if (minutesSitting >= THRESHOLDS.sitting.long) {
      reasons.push(`Sitting for ${minutesSitting} minutes — posture correction recommended.`);
    }
    if (poorPosture) {
      reasons.push(`Posture detected as "${posture}" — correction exercises advised.`);
    }
  }

  // ── Rule 6: Poor sleep score — prioritise recovery ──────────────────────────
  if (sleepScore < THRESHOLDS.sleep.poor) {
    if (!recommendations.includes("recovery_rest")) {
      recommendations.push("recovery_rest");
    }
    reasons.push(
      `Sleep score was ${sleepScore}/100 last night — recovery rest recommended today.`
    );
  }

  // ── Rule 7: Third trimester — add mobility alongside other activities ────────
  if (pregnancyWeek >= 28 && !recommendations.includes("mobility")) {
    recommendations.push("mobility");
    reasons.push(
      `Week ${pregnancyWeek} — gentle mobility exercises added for third trimester.`
    );
  }

  // ── Rule 8: Low MWS — focus on wellness ─────────────────────────────────────
  if (mws < THRESHOLDS.mws.low) {
    if (!recommendations.includes("recovery_rest")) {
      recommendations.push("recovery_rest");
    }
    reasons.push(
      `Maternal Wellness Score is ${mws}/100 — below normal. Rest and gentle recovery today.`
    );
  }

  // ── Rule 9: Pelvic floor — always, every day, all trimesters ────────────────
  if (!recommendations.includes("pelvic_floor")) {
    recommendations.push("pelvic_floor");
    reasons.push("Daily pelvic floor exercises are recommended for all trimesters.");
  }

  // ── Rule 10: Nothing triggered — normal state, suggest mobility ──────────────
  if (recommendations.length === 1 && recommendations[0] === "pelvic_floor") {
    recommendations.unshift("mobility");
    reasons.unshift(
      `All vitals look good — MWS: ${mws}/100, stress: ${stressScore}/100. Daily mobility routine recommended.`
    );
  }

  return buildResponse(recommendations, reasons, data);
}

// ─── Build a single category object for response ─────────────────────────────
function buildCategory(key) {
  return {
    category: key,
    ...exercises[key],
  };
}

// ─── Build sensor summary shown in app ───────────────────────────────────────
function buildSensorSummary(data) {
  return {
    heartRate:      data.heartRate     ?? "—",
    spo2:           data.spo2          ?? "—",
    temperature:    data.temperature   ?? "—",
    hrv:            data.hrv           ?? "—",
    stressScore:    data.stressScore   ?? "—",
    activityIndex:  data.activityIndex ?? "—",
    sleepScore:     data.sleepScore    ?? "—",
    posture:        data.posture       ?? "—",
    mws:            data.mws           ?? "—",
    pregnancyWeek:  data.pregnancyWeek ?? "—",
    bellyExpansion: data.bellyExpansion ?? "—",
  };
}

// ─── Build full API response ──────────────────────────────────────────────────
function buildResponse(categoryKeys, reasons, data) {
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
    totalVideos: recommendedExercises.reduce((sum, r) => sum + r.videos.length, 0),
  };
}

// ─── Get all exercises — for browse screen ────────────────────────────────────
function getAllExercises() {
  return {
    success: true,
    categories: Object.entries(exercises).map(([key, val]) => ({
      category: key,
      ...val,
    })),
  };
}

module.exports = { getRecommendations, getAllExercises };
