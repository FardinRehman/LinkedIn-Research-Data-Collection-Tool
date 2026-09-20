import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';
import jobRoutes from './routes/jobRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'LinkedIn Research & Data Collection API'
  });
});

// Mount Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/jobs', resultRoutes);
app.use('/api/jobs', exportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err instanceof AppError ? err.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  logger.error(`[${statusCode}] ${message}`, {
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    details: err.details
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: err.details || null
    }
  });
});

// Start Server
const server = app.listen(config.port, () => {
  logger.info(`LinkedIn Research API server running on port ${config.port} [${config.nodeEnv}]`);
  logger.info(`Health check: http://localhost:${config.port}/api/health`);
});

export default app;
