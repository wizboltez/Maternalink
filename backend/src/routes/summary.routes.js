const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/summary/daily/:date
// @desc    Get daily summary for a specific date
// @access  Private
router.get('/daily/:date', authMiddleware, summaryController.getDailySummary);

// @route   GET /api/summary/weekly/:week
// @desc    Get weekly summary
// @access  Private
router.get('/weekly/:week', authMiddleware, summaryController.getWeeklySummary);

module.exports = router;
