import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { env } from './config/env';
import router from './presentation/routes';
import { SocketServer } from './infrastructure/socket/socketServer';
import { errorHandler } from './infrastructure/web/middlewares';

const app = express();
const httpServer = createServer(app);

// 1. Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. Register REST API Routes
app.use('/api', router);

// 3. Fallback Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date(),
  });
});

// 4. Global Error Handling Middleware
app.use(errorHandler);

// 5. Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully.');

    // Initialize WebSockets
    SocketServer.init(httpServer);
    console.log('🔌 Socket.IO Server initialized.');

    httpServer.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Maternalink Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
