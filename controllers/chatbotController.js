// controllers/chatbotController.js
// Uses Groq API 

async function getChatResponse(userMessage, sensorData) {
  const {
    heartRate      = "—",
    restingHR      = "—",
    spo2           = "—",
    temperature    = "—",
    hrv            = "—",
    stressScore    = "—",
    activityIndex  = "—",
    sleepScore     = "—",
    posture        = "—",
    fallDetected   = false,
    bellyExpansion = "—",
    mws            = "—",
    pregnancyWeek  = "—",
  } = sensorData;

  const systemPrompt = `You are a caring maternal health assistant for a Smart Maternal Belt app.

Current real-time readings:
- Heart rate: ${heartRate} bpm (resting: ${restingHR} bpm)
- Blood oxygen: ${spo2}%
- Temperature: ${temperature}°C
- HRV: ${hrv} ms
- Stress score: ${stressScore}/100
- Activity index: ${activityIndex}
- Sleep quality: ${sleepScore}/100
- Posture: ${posture}
- Fall detected: ${fallDetected ? "YES — EMERGENCY" : "No"}
- Belly expansion: ${bellyExpansion}%
- Maternal Wellness Score: ${mws}/100
- Pregnancy week: ${pregnancyWeek}

Always refer to the exact numbers above. Keep answers short — 2 to 4 sentences. Speak directly to the mother as "you". Do not diagnose — suggest consulting a doctor for serious concerns.`;

  // ── Groq API call ─────────────────────────────────────────────────────────
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",   // free, fast — change to "llama3-70b-8192" for smarter replies
      max_tokens: 300,
      messages: [
        { role: "system",  content: systemPrompt },
        { role: "user",    content: userMessage  },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const replyText = data.choices[0].message.content;

  return {
    success: true,
    reply: replyText,
    sensorContext: { heartRate, stressScore, mws, pregnancyWeek },
  };
}

module.exports = { getChatResponse };