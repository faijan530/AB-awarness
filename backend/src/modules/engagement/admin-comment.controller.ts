import { Request, Response, NextFunction } from 'express';
import { CommentService } from './comment.service';
import { ApiResponse } from '../../utils/api-response';
import { CommentStatus } from '@prisma/client';

export class AdminCommentController {
  /**
   * GET /api/v1/admin/comments
   */
  public static async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, newsId, userId, search, page, limit } = req.query;

      const result = await CommentService.adminGetComments({
        status: status as CommentStatus | undefined,
        newsId: newsId as string | undefined,
        userId: userId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      ApiResponse.success(res, 'Admin comments retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/comments/:id
   */
  public static async getCommentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const comment = await CommentService.getCommentById(id);
      ApiResponse.success(res, 'Comment details retrieved', comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/comments/:id/hide
   */
  public static async hideComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { reason } = req.body;

      const result = await CommentService.hideComment(id, adminId, reason);
      ApiResponse.success(res, 'Comment hidden successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/comments/:id/restore
   */
  public static async restoreComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const result = await CommentService.restoreComment(id, adminId);
      ApiResponse.success(res, 'Comment restored successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/comments/:id/reject
   */
  public static async rejectComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { reason } = req.body;

      const result = await CommentService.rejectComment(id, adminId, reason);
      ApiResponse.success(res, 'Comment rejected successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/comments/:id/moderate
   */
  public static async moderateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { status, moderationRemarks, reason } = req.body;

      const result = await CommentService.adminModerateComment(id, adminId, {
        status: status as CommentStatus,
        moderationRemarks: moderationRemarks || reason,
      });

      ApiResponse.success(res, 'Comment moderation updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/comments/:id
   */
  public static async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const result = await CommentService.deleteComment(id, adminId, true);
      ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}
