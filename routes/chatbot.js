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

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_api_key_here") {
      return res.status(503).json({
        success: false,
        error: "ANTHROPIC_API_KEY not configured. Add it to your .env file.",
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
