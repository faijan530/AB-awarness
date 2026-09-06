import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/authorize.middleware';

const publicRouter = Router();
const adminRouter = Router();

// Public / Authenticated event submission
publicRouter.post('/events', AnalyticsController.trackEvent);

// Super Admin Analytics & Dashboard Routes
adminRouter.use(authenticate, requireRole('SUPER_ADMIN'));

adminRouter.get('/dashboard', AnalyticsController.getDashboard);
adminRouter.get('/analytics/news', AnalyticsController.getNewsAnalytics);
adminRouter.get('/analytics/categories', AnalyticsController.getCategoryAnalytics);
adminRouter.get('/analytics/locations', AnalyticsController.getLocationAnalytics);
adminRouter.get('/analytics/users', AnalyticsController.getUserAnalytics);
adminRouter.get('/analytics/engagement', AnalyticsController.getEngagementAnalytics);
adminRouter.get('/analytics/search', AnalyticsController.getSearchAnalytics);
adminRouter.get('/analytics/advertising', AnalyticsController.getAdAnalytics);
adminRouter.post('/analytics/export', AnalyticsController.exportAnalytics);
adminRouter.post('/analytics/aggregate', AnalyticsController.triggerAggregation);

export const analyticsPublicRoutes = publicRouter;
export const analyticsAdminRoutes = adminRouter;
