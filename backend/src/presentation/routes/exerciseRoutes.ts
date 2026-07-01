import { Router } from 'express';
import { getAllExercises, getRecommendations } from '../controllers/ExerciseController';

const router = Router();

router.post('/recommend', (req, res) => {
  try {
    const sensorData = req.body;

    if (!sensorData || typeof sensorData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body must be a JSON object with sensor data.',
      });
    }

    const result = getRecommendations(sensorData);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Exercise recommendation error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/all', (_req, res) => {
  try {
    return res.status(200).json(getAllExercises());
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Exercise service running.' });
});

export default router;