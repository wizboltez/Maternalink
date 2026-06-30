// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const exerciseRoutes = require("./routes/exercise");
const chatbotRoutes = require("./routes/chatbot");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/exercise", exerciseRoutes);
app.use("/api/chat", chatbotRoutes);

// ── Root health check ─────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Smart Maternal Belt — Exercise & Chat API",
    routes: {
      exercise_recommend: "POST /api/exercise/recommend",
      exercise_all:       "GET  /api/exercise/all",
      exercise_health:    "GET  /api/exercise/health",
      chat:               "POST /api/chat/message",
    },
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log("Routes ready:");
  console.log("  POST /api/exercise/recommend");
  console.log("  GET  /api/exercise/all");
  console.log("  POST /api/chat/message\n");
});

module.exports = app;
