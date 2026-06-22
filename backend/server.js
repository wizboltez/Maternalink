require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/sensor-data', require('./src/routes/sensorData.routes'));
app.use('/api/summary', require('./src/routes/summary.routes'));
app.use('/api/alerts', require('./src/routes/alerts.routes'));
app.use('/api/doctor', require('./src/routes/doctor.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(require('./src/middleware/errorHandler'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
