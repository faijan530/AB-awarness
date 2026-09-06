import { Request, Response, NextFunction } from 'express';
import { NewsService } from './news.service';
import { ApiResponse } from '../../utils/api-response';
import { NewsStatus } from '@prisma/client';

export class AdminNewsController {
  /**
   * GET /api/v1/admin/news
   */
  public static async getAdminNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, search, isBreaking, isFeatured } = req.query;

      const result = await NewsService.getAdminNewsList({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as NewsStatus,
        search: search as string,
        isBreaking: isBreaking !== undefined ? isBreaking === 'true' : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
      });

      ApiResponse.success(res, 'Admin news listing retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/review
   */
  public static async startReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const article = await NewsService.startReview(id, adminId);
      ApiResponse.success(res, 'Article review initiated', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/approve
   */
  public static async approveNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const article = await NewsService.approveNews(id, adminId);
      ApiResponse.success(res, 'Article approved successfully', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/reject
   */
  public static async rejectNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { reason } = req.body;
      const article = await NewsService.rejectNews(id, adminId, reason);
      ApiResponse.success(res, 'Article rejected with remarks', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/publish
   */
  public static async publishNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const article = await NewsService.publishNews(id, adminId);
      ApiResponse.success(res, 'Article published live', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/schedule
   */
  public static async scheduleNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { scheduledAt } = req.body;
      const article = await NewsService.scheduleNews(id, adminId, new Date(scheduledAt));
      ApiResponse.success(res, 'Article publication scheduled', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/unpublish
   */
  public static async unpublishNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const article = await NewsService.unpublishNews(id, adminId);
      ApiResponse.success(res, 'Article unpublished', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/archive
   */
  public static async archiveNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const article = await NewsService.archiveNews(id, adminId);
      ApiResponse.success(res, 'Article archived', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/breaking
   */
  public static async toggleBreaking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { isBreaking } = req.body;
      const article = await NewsService.toggleBreaking(id, adminId, isBreaking !== false);
      ApiResponse.success(res, 'Breaking news status updated', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/news/:id/feature
   */
  public static async toggleFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { isFeatured } = req.body;
      const article = await NewsService.toggleFeatured(id, adminId, isFeatured !== false);
      ApiResponse.success(res, 'Featured news status updated', article);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/news/:id/history
   */
  public static async getEditorialHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const history = await NewsService.getEditorialHistory(id);
      ApiResponse.success(res, 'Editorial action history retrieved', history);
    } catch (error) {
      next(error);
    }
  }
}
