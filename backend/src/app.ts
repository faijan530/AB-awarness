import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config';
import { correlationMiddleware } from './middlewares/correlation.middleware';
import { globalErrorMiddleware } from './middlewares/error.middleware';
import { apiV1Router } from './routes/api.v1.routes';
import { ApiResponse } from './utils/api-response';

export const app = express();

// Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation & Request Context
app.use(correlationMiddleware);

// Welcome Root & Root Health Endpoints
app.get('/', (_req, res) =>
  ApiResponse.success(res, 'Welcome to Abhishek Bhardwaj Media API Platform', {
    platform: 'Abhishek Bhardwaj Media — Dynamic Digital Media Platform',
    version: '1.0.0',
    environment: env.NODE_ENV,
    endpoints: {
      health: '/health',
      apiV1: '/api/v1',
    },
  })
);

app.get('/health', (_req, res) => ApiResponse.success(res, 'Root health status', { status: 'UP' }));

app.get('/api', (_req, res) =>
  ApiResponse.success(res, 'API Gateway Information', {
    currentVersion: 'v1',
    basePath: '/api/v1',
  })
);

// Mount Versioned API
app.use('/api/v1', apiV1Router);

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  ApiResponse.error(
    res,
    `Requested endpoint '${req.method} ${req.originalUrl}' was not found on this server`,
    'NOT_FOUND',
    {
      requestedUrl: req.originalUrl,
      method: req.method,
      availableEndpoints: ['/', '/health', '/api/v1'],
    },
    404
  );
});

// Centralized Global Error Handler
app.use(globalErrorMiddleware);
