import { Request, Response, NextFunction } from 'express';
import { CommentService } from './comment.service';
import { ApiResponse } from '../../utils/api-response';

export class CommentController {
  /**
   * GET /api/v1/news/:newsId/comments
   */
  public static async getArticleComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const { page, limit, sort } = req.query;

      const result = await CommentService.getArticleComments(
        newsId,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 20,
        (sort as 'LATEST' | 'OLDEST' | 'POPULAR') || 'LATEST'
      );

      ApiResponse.success(res, 'Article comments retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/comments/:id
   */
  public static async getCommentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const comment = await CommentService.getCommentById(id);
      ApiResponse.success(res, 'Comment retrieved successfully', comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/news/:newsId/comments
   */
  public static async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;
      const { content, parentId } = req.body;

      const comment = await CommentService.createComment(userId, newsId, { content, parentId });
      ApiResponse.success(res, 'Comment posted successfully', comment, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/comments/:commentId/replies
   */
  public static async createReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;
      const { content } = req.body;

      const reply = await CommentService.createReply(userId, commentId, content);
      ApiResponse.success(res, 'Reply posted successfully', reply, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/comments/:commentId/replies
   */
  public static async getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const { page, limit } = req.query;

      const result = await CommentService.getCommentReplies(
        commentId,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 20
      );

      ApiResponse.success(res, 'Replies retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/comments/:id
   */
  public static async updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { content } = req.body;

      const updated = await CommentService.updateComment(id, userId, { content });
      ApiResponse.success(res, 'Comment updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/comments/:id
   */
  public static async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.roles?.includes('SUPER_ADMIN') || false;

      const result = await CommentService.deleteComment(id, userId, isAdmin);
      ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}
