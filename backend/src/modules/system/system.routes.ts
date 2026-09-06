import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/authorize.middleware';

const publicRouter = Router();
const adminRouter = Router();
const healthRouter = Router();

// Public Configuration Route
publicRouter.get('/public', SystemController.getPublicConfig);

// Health Liveness & Readiness Routes
healthRouter.get('/live', SystemController.getLiveness);
healthRouter.get('/ready', SystemController.getReadiness);

// Super Admin System Routes
adminRouter.use(authenticate, requireRole('SUPER_ADMIN'));

// Settings Endpoints
adminRouter.get('/settings', SystemController.getSettings);
adminRouter.get('/settings/:key', SystemController.getSettingByKey);
adminRouter.patch('/settings/:key', SystemController.updateSetting);

// Feature Flags Endpoints
adminRouter.get('/feature-flags', SystemController.getFeatureFlags);
adminRouter.post('/feature-flags', SystemController.createFeatureFlag);
adminRouter.patch('/feature-flags/:key', SystemController.updateFeatureFlag);
adminRouter.post('/feature-flags/:key/enable', SystemController.enableFeatureFlag);
adminRouter.post('/feature-flags/:key/disable', SystemController.disableFeatureFlag);

export const systemPublicRoutes = publicRouter;
export const systemAdminRoutes = adminRouter;
export const systemHealthRoutes = healthRouter;
