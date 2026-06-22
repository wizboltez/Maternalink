const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/alerts
// @desc    Get alerts for current user
// @access  Private
router.get('/', authMiddleware, alertController.getAlerts);

// @route   POST /api/alerts/:alertId/acknowledge
// @desc    Acknowledge an alert
// @access  Private
router.post('/:alertId/acknowledge', authMiddleware, alertController.acknowledgeAlert);

module.exports = router;
