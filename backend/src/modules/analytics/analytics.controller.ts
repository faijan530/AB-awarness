import { Request, Response } from 'express';
import { EventService } from './event.service';
import { AnalyticsService } from './analytics.service';
import { AggregationService } from './aggregation.service';
import { ApiResponse } from '../../utils/api-response';

export class AnalyticsController {
  /**
   * POST /api/v1/analytics/events
   * Track event (Public / Authenticated)
   */
  static async trackEvent(req: Request, res: Response) {
    const result = await EventService.recordEvent(req.body, {
      userId: req.user?.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, 'Event recorded successfully', result, undefined, 201);
  }

  /**
   * GET /api/v1/admin/dashboard
   * Super Admin Consolidated Dashboard
   */
  static async getDashboard(_req: Request, res: Response) {
    const dashboard = await AnalyticsService.getConsolidatedDashboard();
    return ApiResponse.success(res, 'Consolidated dashboard metrics retrieved', dashboard);
  }

  /**
   * GET /api/v1/admin/analytics/news
   */
  static async getNewsAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getNewsAnalytics(req.query as any);
    return ApiResponse.success(res, 'News analytics retrieved', analytics);
  }

  /**
   * GET /api/v1/admin/analytics/categories
   */
  static async getCategoryAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getCategoryAnalytics(req.query as any);
    return ApiResponse.success(res, 'Category analytics retrieved', analytics);
  }

  /**
   * GET /api/v1/admin/analytics/locations
   */
  static async getLocationAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getLocationAnalytics(req.query as any);
    return ApiResponse.success(res, 'Location & Local Journalism analytics retrieved', analytics);
  }

  /**
   * GET /api/v1/admin/analytics/users
   */
  static async getUserAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getUserAnalytics(req.query as any);
    return ApiResponse.success(res, 'User growth & status analytics retrieved', analytics);
  }

  /**
   * GET /api/v1/admin/analytics/engagement
   */
  static async getEngagementAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getEngagementAnalytics(req.query as any);
    return ApiResponse.success(res, 'Engagement analytics retrieved', analytics);
  }

  /**
   * GET /api/v1/admin/analytics/search
   */
  static async getSearchAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getSearchAnalytics(req.query as any);
    return ApiResponse.success(res, 'Search & Zero-Result search analytics retrieved', analytics);
  }

  /**
   * GET /api/v1/admin/analytics/advertising
   */
  static async getAdAnalytics(req: Request, res: Response) {
    const analytics = await AnalyticsService.getAdAnalytics(req.query as any);
    return ApiResponse.success(res, 'Advertising analytics retrieved', analytics);
  }

  /**
   * POST /api/v1/admin/analytics/export
   */
  static async exportAnalytics(req: Request, res: Response) {
    const format = (req.body.format || 'json').toLowerCase();
    const exportResult = await AnalyticsService.exportAnalytics(format as any, req.body);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      return res.status(200).send(exportResult.data);
    }

    return ApiResponse.success(res, 'Analytics exported successfully', exportResult.data);
  }

  /**
   * POST /api/v1/admin/analytics/aggregate (Trigger daily aggregation job)
   */
  static async triggerAggregation(_req: Request, res: Response) {
    const result = await AggregationService.runDailyAggregation();
    return ApiResponse.success(res, 'Daily analytics aggregation completed', result);
  }
}
