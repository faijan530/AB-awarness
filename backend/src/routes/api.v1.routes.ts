import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/users/user.routes';
import { adminUserRoutes } from '../modules/admin/admin-user.routes';
import { newsRoutes } from '../modules/news/news.routes';
import { adminNewsRoutes } from '../modules/news/admin-news.routes';
import { categoryRoutes } from '../modules/classification/categories/category.routes';
import { adminCategoryRoutes } from '../modules/classification/categories/admin-category.routes';
import { locationRoutes } from '../modules/classification/locations/location.routes';
import { adminLocationRoutes } from '../modules/classification/locations/admin-location.routes';
import { tagRoutes } from '../modules/classification/tags/tag.routes';
import { adminTagRoutes } from '../modules/classification/tags/admin-tag.routes';
import { verificationRoutes } from '../modules/verification/verification.routes';
import { adminVerificationRoutes, adminModerationRoutes } from '../modules/verification/admin-verification.routes';
import { mediaRoutes } from '../modules/media/media.routes';
import { adminMediaRoutes } from '../modules/media/admin-media.routes';
import { sourceRoutes } from '../modules/sources/source.routes';
import { adminSourceRoutes } from '../modules/sources/admin-source.routes';
import { engagementRoutes } from '../modules/engagement/engagement.routes';
import { adminEngagementRoutes } from '../modules/engagement/admin-engagement.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import adminNotificationRoutes from '../modules/notifications/admin-notification.routes';
import advertisingRoutes from '../modules/advertising/advertising.routes';
import adminAdvertisingRoutes from '../modules/advertising/admin-advertising.routes';
import seoRoutes from '../modules/seo/seo.routes';
import { analyticsPublicRoutes, analyticsAdminRoutes } from '../modules/analytics/analytics.routes';
import { auditAdminRoutes } from '../modules/audit/audit.routes';
import { systemPublicRoutes, systemAdminRoutes, systemHealthRoutes } from '../modules/system/system.routes';
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
      adminUsers: '/api/v1/admin/users',
      news: '/api/v1/news',
      adminNews: '/api/v1/admin/news',
      categories: '/api/v1/categories',
      adminCategories: '/api/v1/admin/categories',
      locations: '/api/v1/locations',
      adminLocations: '/api/v1/admin/locations',
      tags: '/api/v1/tags',
      adminTags: '/api/v1/admin/tags',
      verification: '/api/v1/verification',
      adminVerification: '/api/v1/admin/verification',
      adminModeration: '/api/v1/admin/moderation',
      media: '/api/v1/media',
      adminMedia: '/api/v1/admin/media',
      sources: '/api/v1/sources',
      adminSources: '/api/v1/admin/sources',
      comments: '/api/v1/news/:newsId/comments',
      reactions: '/api/v1/news/:newsId/reactions',
      bookmarks: '/api/v1/users/me/bookmarks',
      reports: '/api/v1/news/:newsId/report',
      shares: '/api/v1/news/:newsId/share',
      userEngagement: '/api/v1/users/me/engagement',
      adminComments: '/api/v1/admin/comments',
      adminReports: '/api/v1/admin/reports',
      analytics: '/api/v1/analytics/events',
      adminAnalytics: '/api/v1/admin/analytics/news',
      adminDashboard: '/api/v1/admin/dashboard',
      adminAuditLogs: '/api/v1/admin/audit-logs',
      adminSettings: '/api/v1/admin/settings',
      adminFeatureFlags: '/api/v1/admin/feature-flags',
    },
  })
);

// Mount Domain Modules
router.use('/health', healthRoutes);
router.use('/health', systemHealthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/news', newsRoutes);
router.use('/admin/news', adminNewsRoutes);

// Mount Module 6 Classification Domain Routes
router.use('/categories', categoryRoutes);
router.use('/admin/categories', adminCategoryRoutes);
router.use('/locations', locationRoutes);
router.use('/admin/locations', adminLocationRoutes);
router.use('/tags', tagRoutes);
router.use('/admin/tags', adminTagRoutes);

// Mount Module 7 Media, Sources & Verification Domain Routes
router.use('/media', mediaRoutes);
router.use('/admin/media', adminMediaRoutes);
router.use('/sources', sourceRoutes);
router.use('/admin/sources', adminSourceRoutes);
router.use('/verification', verificationRoutes);
router.use('/admin/verification', adminVerificationRoutes);
router.use('/admin/moderation', adminModerationRoutes);

// Mount Module 8 Engagement Domain Routes (Comments, Reactions, Bookmarks, Moderation)
router.use('/', engagementRoutes);
router.use('/engagement', engagementRoutes);
router.use('/admin', adminEngagementRoutes);
router.use('/admin/engagement', adminEngagementRoutes);

// Mount Module 10 Notifications, Advertising & SEO Domain Routes
router.use('/notifications', notificationRoutes);
router.use('/admin/notifications', adminNotificationRoutes);
router.use('/ads', advertisingRoutes);
router.use('/admin/advertising', adminAdvertisingRoutes);
router.use('/admin/ads', adminAdvertisingRoutes);
router.use('/admin', adminAdvertisingRoutes); // allows /admin/advertisers, /admin/campaigns, etc.
router.use('/seo', seoRoutes);

// Mount Module 11 Analytics, Audit & System Management Domain Routes
router.use('/analytics', analyticsPublicRoutes);
router.use('/admin', analyticsAdminRoutes);
router.use('/admin/audit-logs', auditAdminRoutes);
router.use('/config', systemPublicRoutes);
router.use('/admin', systemAdminRoutes);

export const apiV1Router = router;

