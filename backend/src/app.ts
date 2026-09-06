import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config';
import { correlationMiddleware } from './middlewares/correlation.middleware';
import { globalErrorMiddleware } from './middlewares/error.middleware';
import { apiV1Router } from './routes/api.v1.routes';
import { SeoController } from './modules/seo/seo.controller';
import { SystemController } from './modules/system/system.controller';
import { ApiResponse } from './utils/api-response';
import { docsRouter } from './docs/docs.router';
import { authRateLimiter } from './middlewares/rate-limit.middleware';
import { initBackgroundWorkers } from './jobs/workers';

export const app = express();

// Initialize Module 12 Background Queue Workers
initBackgroundWorkers();

// Security Headers & CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
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

// Static Uploads Serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Module 12: OpenAPI / Swagger Documentation
app.use('/api-docs', docsRouter);

// Welcome Root & Root Health Endpoints
app.get('/', (_req, res) =>
  ApiResponse.success(res, 'Welcome to Abhishek Bhardwaj Media API Platform', {
    platform: 'Abhishek Bhardwaj Media — Dynamic Digital Media Platform',
    version: '1.0.0',
    environment: env.NODE_ENV,
    endpoints: {
      health: '/health',
      liveness: '/health/live',
      readiness: '/health/ready',
      apiDocs: '/api-docs',
      apiV1: '/api/v1',
    },
  })
);

app.get('/health', (_req, res) => ApiResponse.success(res, 'Root health status', { status: 'UP' }));
app.get('/health/live', SystemController.getLiveness);
app.get('/health/ready', SystemController.getReadiness);

app.get('/api', (_req, res) =>
  ApiResponse.success(res, 'API Gateway Information', {
    currentVersion: 'v1',
    basePath: '/api/v1',
    documentation: '/api-docs',
  })
);

// Module 10: Root SEO Endpoints (Sitemaps & Robots)
app.get('/sitemap.xml', SeoController.getSitemapXml);
app.get('/news-sitemap.xml', SeoController.getNewsSitemapXml);
app.get('/robots.txt', SeoController.getRobotsTxt);

// Apply Auth Rate Limiter to Auth Endpoints
app.use('/api/v1/auth', authRateLimiter);

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
      availableEndpoints: ['/', '/health', '/api-docs', '/api/v1'],
    },
    404
  );
});

// Centralized Global Error Handler
app.use(globalErrorMiddleware);
