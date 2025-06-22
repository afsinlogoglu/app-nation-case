import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDatabase, disconnectDatabase } from './utils/database';
import { connectRedis, disconnectRedis } from './utils/redis';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import weatherRoutes from './routes/weather';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, try again later.',
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', error);
  
  res.status(500).json({
    success: false,
    error: process.env['NODE_ENV'] === 'production' ? 'Server error' : error.message,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Shutdown error:', error);
    process.exit(1);
  }
}

// Start server
if (process.env['NODE_ENV'] !== 'test') {
  startServer();
}

async function startServer() {
  try {
    // Connect to database and Redis
    await connectDatabase();
    await connectRedis();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
} 