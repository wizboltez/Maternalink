// routes/exercise.js

const express = require("express");
const router = express.Router();
const { getRecommendations, getAllExercises } = require("../controllers/exerciseController");

// ── POST /api/exercise/recommend ──────────────────────────────────────────────
// Send processed sensor data, receive exercise recommendations

router.post("/recommend", (req, res) => {
  try {
    const sensorData = req.body;

    if (!sensorData || typeof sensorData !== "object") {
      return res.status(400).json({
        success: false,
        error: "Request body must be a JSON object with sensor data.",
      });
    }

    const result = getRecommendations(sensorData);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Exercise recommendation error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── GET /api/exercise/all ─────────────────────────────────────────────────────
// Returns every category and video — used for Browse/Explore screen
router.get("/all", (req, res) => {
  try {
    return res.status(200).json(getAllExercises());
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── GET /api/exercise/health ──────────────────────────────────────────────────
// Ping — React Native calls this to confirm server is alive
router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Exercise service running." });
});

module.exports = router;
