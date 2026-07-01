import { Router } from 'express';
import { env } from '../../config/env';
import { getChatResponse } from '../controllers/ChatbotController';

const router = Router();

router.post('/message', async (req, res) => {
  try {
    const { message, sensorData } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Field 'message' is required and must be a non-empty string.",
      });
    }

    if (!sensorData || typeof sensorData !== 'object') {
      return res.status(400).json({
        success: false,
        error: "Field 'sensorData' is required and must be an object.",
      });
    }

    const groqApiKey = env.GROQ_API_KEY?.trim();

    if (!groqApiKey || groqApiKey === 'your_api_key_here') {
      if (env.NODE_ENV === 'development') {
        const { heartRate = '—', stressScore = '—', mws = '—', pregnancyWeek = '—' } = sensorData;
        return res.status(200).json({
          success: true,
          reply: `[Dev mode — set GROQ_API_KEY in backend/.env for live AI] Your heart rate is ${heartRate} bpm, stress score is ${stressScore}/100, and you're in week ${pregnancyWeek}. Everything looks stable — keep listening to your body and reach out to your care team if anything feels off.`,
          sensorContext: { heartRate, stressScore, mws, pregnancyWeek },
        });
      }

      return res.status(503).json({
        success: false,
        error: 'GROQ_API_KEY not configured. Add it to backend/.env (or root .env for standalone app.js).',
      });
    }

    const result = await getChatResponse(message.trim(), sensorData);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chatbot error:', message);
    return res.status(500).json({ success: false, error: 'Failed to get AI response.' });
  }
});

export default router;