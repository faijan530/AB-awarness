import { Request, Response, NextFunction } from 'express';
import { ShareService } from './share.service';
import { ApiResponse } from '../../utils/api-response';
import { SharePlatform } from './engagement.types';

export class ShareController {
  /**
   * POST /api/v1/news/:newsId/share
   */
  public static async recordShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const { platform } = req.body;
      const userId = req.user?.id;

      const validPlatforms: SharePlatform[] = ['WHATSAPP', 'FACEBOOK', 'X', 'TELEGRAM', 'COPY_LINK', 'OTHER'];
      const resolvedPlatform = validPlatforms.includes(platform) ? platform : 'OTHER';

      const result = await ShareService.recordShare(newsId, resolvedPlatform, userId);
      ApiResponse.success(res, 'Share tracked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/engagement
   */
  public static async getUserEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await ShareService.getUserEngagementSummary(userId);
      ApiResponse.success(res, 'User engagement summary retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}
