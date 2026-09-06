import { Request, Response, NextFunction } from 'express';
import { ReactionService } from './reaction.service';
import { ApiResponse } from '../../utils/api-response';
import { ReactionType } from '@prisma/client';

export class ReactionController {
  /**
   * GET /api/v1/news/:newsId/reactions
   */
  public static async getReactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user?.id;

      const result = await ReactionService.getNewsReactions(newsId, userId);
      ApiResponse.success(res, 'Article reactions retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/news/:newsId/reactions
   */
  public static async toggleReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;
      const type = (req.body?.type as ReactionType) || ReactionType.LIKE;

      const result = await ReactionService.toggleReaction(userId, newsId, type);
      ApiResponse.success(res, 'Reaction updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/news/:newsId/reactions
   */
  public static async removeReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;

      const result = await ReactionService.removeReaction(userId, newsId);
      ApiResponse.success(res, 'Reaction removed successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
