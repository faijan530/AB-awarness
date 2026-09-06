import { PrismaClient, NewsStatus } from '@prisma/client';
import crypto from 'crypto';
import { TrackEventDTO, AnalyticsEventType, ANALYTICS_ERROR_CODES } from './analytics.types';
import { AppError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();
const VIEW_DEDUPLICATION_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class EventService {
  /**
   * Record a raw analytics event with validation and deduplication
   */
  static async recordEvent(
    dto: TrackEventDTO,
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ) {
    const { event, entityType, entityId, anonymousId, metadata } = dto;
    const { userId, ipAddress } = options;

    if (!event) {
      throw new AppError('Event type is required', 400, ANALYTICS_ERROR_CODES.INVALID_EVENT);
    }

    const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;

    // Validate NEWS entity if specified
    if (entityType === 'NEWS' && entityId) {
      const news = await prisma.news.findUnique({
        where: { id: entityId },
        select: { id: true, status: true },
      });

      if (!news || news.status !== NewsStatus.PUBLISHED) {
        throw new AppError('Target news article does not exist or is not publicly available', 404, ANALYTICS_ERROR_CODES.INVALID_EVENT);
      }

      // Deduplication for NEWS_VIEWED
      if (event === AnalyticsEventType.NEWS_VIEWED) {
        const isDuplicate = await this.isDuplicateNewsView(entityId, userId, anonymousId, ipHash);
        if (isDuplicate) {
          return { recorded: false, deduplicated: true };
        }

        // Increment view counters
        await prisma.news.update({
          where: { id: entityId },
          data: { viewCount: { increment: 1 } },
        });

        await prisma.newsStatistics.upsert({
          where: { newsId: entityId },
          create: { newsId: entityId, views: BigInt(1), uniqueViews: BigInt(1) },
          update: { views: { increment: BigInt(1) } },
        });
      }
    }

    // Persist event in DB
    const eventRecord = await prisma.analyticsEvent.create({
      data: {
        eventType: event,
        entityType: entityType || null,
        entityId: entityId || null,
        userId: userId || null,
        anonymousId: anonymousId || null,
        metadata: metadata || undefined,
        ipHash: ipHash || null,
      },
    });

    return { recorded: true, eventId: eventRecord.id };
  }

  /**
   * Deduplication check for news views within window
   */
  private static async isDuplicateNewsView(
    newsId: string,
    userId?: string,
    anonymousId?: string,
    ipHash?: string | null
  ): Promise<boolean> {
    const windowStart = new Date(Date.now() - VIEW_DEDUPLICATION_WINDOW_MS);

    const conditions: any[] = [];
    if (userId) conditions.push({ userId });
    if (anonymousId) conditions.push({ anonymousId });
    if (ipHash) conditions.push({ ipHash });

    if (conditions.length === 0) return false;

    const recentEvent = await prisma.analyticsEvent.findFirst({
      where: {
        eventType: AnalyticsEventType.NEWS_VIEWED,
        entityType: 'NEWS',
        entityId: newsId,
        createdAt: { gte: windowStart },
        OR: conditions,
      },
    });

    return !!recentEvent;
  }
}
