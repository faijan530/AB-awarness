import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { ApiResponse } from '../../utils/api-response';
import { ReportReason, ReportStatus } from '@prisma/client';
import { ReportTargetType } from './engagement.types';

export class ReportController {
  /**
   * POST /api/v1/news/:newsId/report
   */
  public static async reportNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const reporterId = req.user!.id;
      const { reason, description } = req.body;

      const report = await ReportService.reportNews(reporterId, newsId, { reason, description });
      ApiResponse.success(res, 'Report submitted successfully. Editorial desk will review.', report, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/comments/:commentId/report
   */
  public static async reportComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const reporterId = req.user!.id;
      const { reason, description } = req.body;

      const report = await ReportService.reportComment(reporterId, commentId, { reason, description });
      ApiResponse.success(res, 'Comment reported successfully. Moderators will review.', report, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/reports
   */
  public static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetType, reason, status, page, limit, search } = req.query;

      const result = await ReportService.getReports({
        targetType: targetType as ReportTargetType | undefined,
        reason: reason as ReportReason | undefined,
        status: status as ReportStatus | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        search: search as string | undefined,
      });

      ApiResponse.success(res, 'Admin reports queue retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/reports/:id
   */
  public static async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const report = await ReportService.getReportById(id);
      ApiResponse.success(res, 'Report details retrieved', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/reports/:id/review
   */
  public static async reviewReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const report = await ReportService.reviewReport(id, adminId);
      ApiResponse.success(res, 'Report marked as under review', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/reports/:id/resolve
   */
  public static async resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { resolution, note } = req.body;

      const report = await ReportService.resolveReport(id, adminId, { resolution, note });
      ApiResponse.success(res, 'Report resolved successfully', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/reports/:id/dismiss
   */
  public static async dismissReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { note } = req.body;

      const report = await ReportService.dismissReport(id, adminId, note);
      ApiResponse.success(res, 'Report dismissed', report);
    } catch (error) {
      next(error);
    }
  }
}
