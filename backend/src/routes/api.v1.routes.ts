import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { ApiResponse } from '../utils/api-response';

const router = Router();

// Base API v1 index endpoint
router.get('/', (_req, res) =>
  ApiResponse.success(res, 'Abhishek Bhardwaj Media API v1 Index', {
    version: '1.0.0',
    availableModules: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      news: '/api/v1/news',
      categories: '/api/v1/categories',
      locations: '/api/v1/locations',
    },
  })
);

// Mount Domain Modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', (_req, res) => ApiResponse.success(res, 'Users module endpoint initialized', { module: 'users' }));
router.use('/news', (_req, res) => ApiResponse.success(res, 'News module endpoint initialized', { module: 'news' }));
router.use('/categories', (_req, res) => ApiResponse.success(res, 'Categories module endpoint initialized', { module: 'categories' }));
router.use('/locations', (_req, res) => ApiResponse.success(res, 'Locations module endpoint initialized', { module: 'locations' }));

export const apiV1Router = router;
