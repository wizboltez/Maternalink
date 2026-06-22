const express = require('express');
const router = express.Router();
const sensorDataController = require('../controllers/sensorDataController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/sensor-data/reading
// @desc    Post a new sensor reading
// @access  Private
router.post('/reading', authMiddleware, sensorDataController.postReading);

// @route   GET /api/sensor-data/readings
// @desc    Get sensor readings (with optional filters)
// @access  Private
router.get('/readings', authMiddleware, sensorDataController.getReadings);

// @route   GET /api/sensor-data/latest
// @desc    Get latest sensor reading
// @access  Private
router.get('/latest', authMiddleware, sensorDataController.getLatestReading);

module.exports = router;
