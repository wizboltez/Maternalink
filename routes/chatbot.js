// routes/chatbot.js

const express = require("express");
const router = express.Router();
const { getChatResponse } = require("../controllers/chatbotController");

// ── POST /api/chat/message ────────────────────────────────────────────────────
// Body: { message: string, sensorData: object }

router.post("/message", async (req, res) => {
  try {
    const { message, sensorData } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Field 'message' is required and must be a non-empty string.",
      });
    }

    if (!sensorData || typeof sensorData !== "object") {
      return res.status(400).json({
        success: false,
        error: "Field 'sensorData' is required and must be an object.",
      });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_api_key_here") {
      if (process.env.NODE_ENV === "development") {
        const { heartRate = "—", stressScore = "—", mws = "—", pregnancyWeek = "—" } = sensorData;
        return res.status(200).json({
          success: true,
          reply: `[Dev mode — set GROQ_API_KEY in backend/.env for live AI] Your heart rate is ${heartRate} bpm, stress score is ${stressScore}/100, and you're in week ${pregnancyWeek}. Everything looks stable — keep listening to your body and reach out to your care team if anything feels off.`,
          sensorContext: { heartRate, stressScore, mws, pregnancyWeek },
        });
      }
      return res.status(503).json({
        success: false,
        error: "GROQ_API_KEY not configured. Add it to backend/.env (or root .env for standalone app.js).",
      });
    }

    const result = await getChatResponse(message.trim(), sensorData);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Chatbot error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to get AI response." });
  }
});

module.exports = router;
