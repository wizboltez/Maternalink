import { env } from '../../config/env';

type ChatSensorData = Record<string, unknown> & {
  heartRate?: string | number;
  restingHR?: string | number;
  spo2?: string | number;
  temperature?: string | number;
  hrv?: string | number;
  stressScore?: string | number;
  activityIndex?: string | number;
  activity?: string;
  sleepScore?: string | number;
  posture?: string;
  fallDetected?: boolean;
  bellyExpansion?: string | number;
  mws?: string | number;
  pregnancyWeek?: string | number;
  isSleeping?: boolean;
  contractionActive?: boolean;
  contractionPhase?: string;
  contractionIntensity?: string | number;
  contractionDuration?: string | number;
  contractionInterval?: string | number;
  contractionFrequency?: string | number;
};

export async function getChatResponse(userMessage: string, sensorData: ChatSensorData) {
  const {
    heartRate = '—',
    restingHR = '—',
    spo2 = '—',
    temperature = '—',
    hrv = '—',
    stressScore = '—',
    activityIndex = '—',
    activity = '—',
    sleepScore = '—',
    posture = '—',
    fallDetected = false,
    bellyExpansion = '—',
    mws = '—',
    pregnancyWeek = '—',
    isSleeping = false,
    contractionActive = false,
    contractionPhase = '—',
    contractionIntensity = '—',
    contractionDuration = '—',
    contractionInterval = '—',
    contractionFrequency = '—',
  } = sensorData;

  const systemPrompt = `You are a caring maternal health assistant for a Smart Maternal Belt app.

Current real-time readings:
- Heart rate: ${heartRate} bpm (resting: ${restingHR} bpm)
- Blood oxygen: ${spo2}%
- Temperature: ${temperature}°C
- HRV: ${hrv} ms
- Stress score: ${stressScore}/100
- Activity index: ${activityIndex}
- Activity state: ${activity}
- Sleep quality: ${sleepScore}/100
- Sleeping now: ${isSleeping ? 'Yes' : 'No'}
- Posture: ${posture}
- Fall detected: ${fallDetected ? 'YES — EMERGENCY' : 'No'}
- Belly expansion: ${bellyExpansion}%
- Maternal Wellness Score: ${mws}/100
- Pregnancy week: ${pregnancyWeek}
- Contraction active: ${contractionActive ? 'Yes' : 'No'}
- Contraction phase: ${contractionPhase}
- Contraction intensity: ${contractionIntensity}
- Contraction duration: ${contractionDuration}
- Contraction interval: ${contractionInterval}
- Contraction frequency: ${contractionFrequency}

Always refer to the exact numbers above. Keep answers short — 2 to 4 sentences. Speak directly to the mother as "you". Do not diagnose — suggest consulting a doctor for serious concerns.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY?.trim() ?? ''}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };
  const replyText = data.choices[0].message.content as string;

  return {
    success: true,
    reply: replyText,
    sensorContext: { heartRate, stressScore, mws, pregnancyWeek },
  };
}