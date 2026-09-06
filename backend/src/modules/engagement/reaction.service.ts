import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { NewsStatus, ReactionType } from '@prisma/client';
import { ReactionSummaryDTO } from './engagement.types';

export class ReactionService {
  /**
   * Toggle or update user reaction on a published news story
   */
  public static async toggleReaction(
    userId: string,
    newsId: string,
    type: ReactionType = ReactionType.LIKE
  ): Promise<ReactionSummaryDTO> {
    if (!Object.values(ReactionType).includes(type)) {
      throw new AppError(`Invalid reaction type: ${type}`, 400, 'INVALID_REACTION_TYPE');
    }

    // 1. Verify news story exists, is published, and not deleted
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!news || news.deletedAt) {
      throw new AppError('News story not found', 404, 'NEWS_NOT_FOUND');
    }

    if (news.status !== NewsStatus.PUBLISHED) {
      throw new AppError('Reactions are only allowed on published news articles', 400, 'NEWS_NOT_PUBLISHED');
    }

    // 2. Check existing reaction
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_newsId: { userId, newsId },
      },
    });

    let activeUserReaction: ReactionType | null = type;

    if (existing) {
      if (existing.type === type) {
        // Toggle OFF (remove reaction)
        await prisma.reaction.delete({
          where: { id: existing.id },
        });
        await prisma.news.update({
          where: { id: newsId },
          data: { reactionCount: { decrement: 1 } },
        }).catch(() => {});
        activeUserReaction = null;
      } else {
        // Switch reaction type
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
        activeUserReaction = type;
      }
    } else {
      // Insert new reaction
      await prisma.reaction.create({
        data: { userId, newsId, type },
      });
      await prisma.news.update({
        where: { id: newsId },
        data: { reactionCount: { increment: 1 } },
      }).catch(() => {});
      activeUserReaction = type;
    }

    // 3. Return aggregated summary
    return this.getNewsReactions(newsId, userId, activeUserReaction);
  }

  /**
   * Explicitly remove user reaction (DELETE /api/v1/news/:newsId/reactions)
   */
  public static async removeReaction(userId: string, newsId: string): Promise<ReactionSummaryDTO> {
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_newsId: { userId, newsId },
      },
    });

    if (existing) {
      await prisma.reaction.delete({
        where: { id: existing.id },
      });
      await prisma.news.update({
        where: { id: newsId },
        data: { reactionCount: { decrement: 1 } },
      }).catch(() => {});
    }

    return this.getNewsReactions(newsId, userId, null);
  }

  /**
   * Get reaction breakdown and counts for a news article
   */
  public static async getNewsReactions(
    newsId: string,
    userId?: string,
    knownUserReaction?: ReactionType | null
  ): Promise<ReactionSummaryDTO> {
    const defaultCounts: Record<ReactionType, number> = {
      LIKE: 0,
      LOVE: 0,
      INSIGHTFUL: 0,
      SAD: 0,
      ANGRY: 0,
    };

    // Group by reaction type
    const grouped = await prisma.reaction.groupBy({
      by: ['type'],
      where: { newsId },
      _count: { type: true },
    });

    let totalReactions = 0;
    grouped.forEach((g) => {
      const count = g._count.type;
      defaultCounts[g.type] = count;
      totalReactions += count;
    });

    let userReaction: ReactionType | null = knownUserReaction !== undefined ? knownUserReaction : null;

    if (userId && userReaction === undefined) {
      const userRecord = await prisma.reaction.findUnique({
        where: {
          userId_newsId: { userId, newsId },
        },
        select: { type: true },
      });
      userReaction = userRecord ? userRecord.type : null;
    }

    return {
      newsId,
      totalReactions,
      counts: defaultCounts,
      userReaction: userReaction ?? null,
    };
  }
}
