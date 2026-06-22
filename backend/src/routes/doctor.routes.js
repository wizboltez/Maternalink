const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/doctor/contacts
// @desc    Get doctor contacts for current user
// @access  Private
router.get('/contacts', authMiddleware, doctorController.getDoctorContacts);

// @route   POST /api/doctor/emergency
// @desc    Request emergency assistance
// @access  Private
router.post('/emergency', authMiddleware, doctorController.requestEmergencyAssistance);

module.exports = router;
