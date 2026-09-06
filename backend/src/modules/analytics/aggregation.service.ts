import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AggregationService {
  /**
   * Run daily metric aggregation for a target date
   */
  static async runDailyAggregation(targetDate: Date = new Date()) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Aggregate Daily User Metrics
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });

    const activeUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const logins = await prisma.analyticsEvent.count({
      where: {
        eventType: 'USER_LOGIN',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const verifiedUsers = await prisma.user.count({
      where: { status: 'ACTIVE', emailVerified: true },
    });

    await prisma.dailyUserMetrics.upsert({
      where: { date: startOfDay },
      create: {
        date: startOfDay,
        newUsers,
        activeUsers: activeUsers.length,
        verifiedUsers,
        logins,
      },
      update: {
        newUsers,
        activeUsers: activeUsers.length,
        verifiedUsers,
        logins,
      },
    });

    // 2. Aggregate Daily News Metrics
    const newsViewEvents = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      _count: { _all: true },
      where: {
        eventType: 'NEWS_VIEWED',
        entityType: 'NEWS',
        entityId: { not: null },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    for (const item of newsViewEvents) {
      if (!item.entityId) continue;
      const newsId = item.entityId;

      const viewsCount = item._count._all;
      const reactions = await prisma.reaction.count({
        where: { newsId, createdAt: { gte: startOfDay, lte: endOfDay } },
      });
      const comments = await prisma.comment.count({
        where: { newsId, createdAt: { gte: startOfDay, lte: endOfDay } },
      });
      const bookmarks = await prisma.bookmark.count({
        where: { newsId, createdAt: { gte: startOfDay, lte: endOfDay } },
      });
      const reports = await prisma.contentReport.count({
        where: { newsId, createdAt: { gte: startOfDay, lte: endOfDay } },
      });

      await prisma.dailyNewsMetrics.upsert({
        where: { date_newsId: { date: startOfDay, newsId } },
        create: {
          date: startOfDay,
          newsId,
          views: BigInt(viewsCount),
          uniqueViews: BigInt(viewsCount),
          reactions,
          comments,
          bookmarks,
          reports,
        },
        update: {
          views: BigInt(viewsCount),
          reactions,
          comments,
          bookmarks,
          reports,
        },
      });
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      aggregated: true,
    };
  }

  /**
   * Raw Analytics Event Retention Cleanup
   */
  static async cleanupRawEvents(retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleted = await prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    return { deletedCount: deleted.count, cutoffDate };
  }
}
