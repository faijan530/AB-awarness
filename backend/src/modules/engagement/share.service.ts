import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { NewsStatus } from '@prisma/client';
import { SharePlatform, ShareResponseDTO, UserEngagementSummaryDTO } from './engagement.types';

export class ShareService {
  /**
   * Track article share event (POST /api/v1/news/:newsId/share)
   */
  public static async recordShare(
    newsId: string,
    platform: SharePlatform,
    userId?: string
  ): Promise<ShareResponseDTO> {
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!news || news.deletedAt || news.status !== NewsStatus.PUBLISHED) {
      throw new AppError('News article not found or not publicly accessible', 404, 'NEWS_NOT_FOUND');
    }

    // Update news statistics table sequentially
    const stats = await prisma.newsStatistics.upsert({
      where: { newsId },
      update: {
        shares: { increment: 1 },
      },
      create: {
        newsId,
        shares: 1,
      },
    });

    return {
      newsId,
      platform,
      shareCount: Number(stats.shares),
    };
  }

  /**
   * Get user engagement counts for profile / dashboard (GET /api/v1/users/me/engagement)
   */
  public static async getUserEngagementSummary(userId: string): Promise<UserEngagementSummaryDTO> {
    const [commentsCount, bookmarksCount, reactionsCount, reportsCount] = await Promise.all([
      prisma.comment.count({ where: { userId, deletedAt: null } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.reaction.count({ where: { userId } }),
      prisma.contentReport.count({ where: { reporterId: userId } }),
    ]);

    return {
      commentsCount,
      bookmarksCount,
      reactionsCount,
      reportsCount,
    };
  }
}
