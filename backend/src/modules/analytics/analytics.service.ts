import { PrismaClient, NewsStatus } from '@prisma/client';
import { AnalyticsQueryFilters, ANALYTICS_ERROR_CODES } from './analytics.types';
import { AppError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * News Performance Analytics
   */
  static async getNewsAnalytics(filters: AnalyticsQueryFilters) {
    const { dateFrom, dateTo, category, location, author } = filters;

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const whereNews: any = {
      status: NewsStatus.PUBLISHED,
    };

    if (dateFrom || dateTo) whereNews.publishedAt = dateFilter;
    if (author) whereNews.authorId = author;

    if (category) {
      whereNews.categories = {
        some: {
          category: {
            OR: [{ id: category }, { slug: category }],
          },
        },
      };
    }

    if (location) {
      whereNews.locations = {
        some: {
          location: {
            OR: [{ id: location }, { slug: location }],
          },
        },
      };
    }

    const totalPublished = await prisma.news.count({ where: whereNews });

    const articles = await prisma.news.findMany({
      where: whereNews,
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        viewCount: true,
        commentCount: true,
        reactionCount: true,
        bookmarkCount: true,
        author: { select: { id: true, fullName: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 50,
    });

    let totalViews = BigInt(0);
    let totalReactions = 0;
    let totalComments = 0;
    let totalBookmarks = 0;

    articles.forEach((a) => {
      totalViews += BigInt(a.viewCount || 0);
      totalReactions += a.reactionCount || 0;
      totalComments += a.commentCount || 0;
      totalBookmarks += a.bookmarkCount || 0;
    });

    const averageViewsPerArticle = totalPublished > 0 ? Number(totalViews) / totalPublished : 0;

    return {
      totalPublishedArticles: totalPublished,
      totalViews: totalViews.toString(),
      totalReactions,
      totalComments,
      totalBookmarks,
      averageViewsPerArticle,
      topArticles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        authorName: a.author?.fullName,
        publishedAt: a.publishedAt,
        views: a.viewCount.toString(),
        reactions: a.reactionCount,
        comments: a.commentCount,
        bookmarks: a.bookmarkCount,
      })),
    };
  }

  /**
   * Category Analytics
   */
  static async getCategoryAnalytics(filters: AnalyticsQueryFilters) {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        newsCategories: {
          select: {
            news: {
              select: {
                viewCount: true,
                commentCount: true,
                reactionCount: true,
              },
            },
          },
        },
      },
    });

    const result = categories.map((cat) => {
      const articleCount = cat.newsCategories.length;
      let totalViews = BigInt(0);
      let totalEngagement = 0;

      cat.newsCategories.forEach((nc) => {
        totalViews += BigInt(nc.news.viewCount || 0);
        totalEngagement += (nc.news.commentCount || 0) + (nc.news.reactionCount || 0);
      });

      const avgViews = articleCount > 0 ? Number(totalViews) / articleCount : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        slug: cat.slug,
        articleCount,
        views: totalViews.toString(),
        engagement: totalEngagement,
        averageViews: Math.round(avgViews),
      };
    });

    return result.sort((a, b) => Number(b.views) - Number(a.views));
  }

  /**
   * Location Analytics & Local Journalism Dashboard
   */
  static async getLocationAnalytics(filters: AnalyticsQueryFilters) {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        districtCode: true,
        newsLocations: {
          select: {
            news: {
              select: {
                viewCount: true,
                commentCount: true,
                reactionCount: true,
              },
            },
          },
        },
      },
    });

    const result = locations.map((loc) => {
      const articleCount = loc.newsLocations.length;
      let totalViews = BigInt(0);
      let totalEngagement = 0;

      loc.newsLocations.forEach((nl) => {
        totalViews += BigInt(nl.news.viewCount || 0);
        totalEngagement += (nl.news.commentCount || 0) + (nl.news.reactionCount || 0);
      });

      return {
        locationId: loc.id,
        name: loc.name,
        slug: loc.slug,
        type: loc.type,
        districtCode: loc.districtCode,
        articleCount,
        views: totalViews.toString(),
        engagement: totalEngagement,
      };
    });

    // Dynamically filter local district locations directly from DB Location types
    const districtBreakdown = result.filter(
      (r) => r.type === 'DISTRICT' || r.type === 'SUBDIVISION' || r.type === 'CITY' || r.type === 'LOCAL_AREA'
    );

    return {
      allLocations: result.sort((a, b) => Number(b.views) - Number(a.views)),
      localJournalismDashboard: {
        totalDistrictArticles: districtBreakdown.reduce((acc, curr) => acc + curr.articleCount, 0),
        totalDistrictViews: districtBreakdown.reduce((acc, curr) => acc + Number(curr.views), 0).toString(),
        districts: districtBreakdown,
      },
    };
  }

  /**
   * User Growth & User Analytics
   */
  static async getUserAnalytics(filters: AnalyticsQueryFilters) {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });
    const blockedUsers = await prisma.user.count({ where: { status: 'BLOCKED' } });
    const verifiedUsers = await prisma.user.count({ where: { emailVerified: true } });

    // Aggregated growth timeline
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      select: { createdAt: true },
    });

    const growthMap: Record<string, number> = {};
    recentUsers.forEach((u) => {
      const dateStr = u.createdAt.toISOString().split('T')[0];
      growthMap[dateStr] = (growthMap[dateStr] || 0) + 1;
    });

    const userGrowthTimeline = Object.keys(growthMap)
      .sort()
      .map((date) => ({ date, newUsers: growthMap[date] }));

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      blockedUsers,
      verifiedUsers,
      userGrowthTimeline,
    };
  }

  /**
   * Engagement Analytics
   */
  static async getEngagementAnalytics(filters: AnalyticsQueryFilters) {
    const totalComments = await prisma.comment.count();
    const totalReactions = await prisma.reaction.count();
    const totalBookmarks = await prisma.bookmark.count();
    const totalReports = await prisma.contentReport.count();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    const todayComments = await prisma.comment.count({ where: { createdAt: { gte: todayStart } } });
    const yesterdayComments = await prisma.comment.count({
      where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
    });

    const todayReactions = await prisma.reaction.count({ where: { createdAt: { gte: todayStart } } });
    const yesterdayReactions = await prisma.reaction.count({
      where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
    });

    return {
      summary: {
        totalComments,
        totalReactions,
        totalBookmarks,
        totalReports,
      },
      comparison: {
        comments: { today: todayComments, yesterday: yesterdayComments, trend: todayComments >= yesterdayComments ? 'UP' : 'DOWN' },
        reactions: { today: todayReactions, yesterday: yesterdayReactions, trend: todayReactions >= yesterdayReactions ? 'UP' : 'DOWN' },
      },
    };
  }

  /**
   * Search Analytics & Zero-Result Searches
   */
  static async getSearchAnalytics(filters: AnalyticsQueryFilters) {
    const searchEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: { in: ['SEARCH_PERFORMED', 'SEARCH_RESULT_CLICKED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const searchVolume = searchEvents.length;
    const searchMap: Record<string, { count: number; clicks: number; zeroResults: boolean }> = {};
    const zeroResultSearches: { query: string; count: number }[] = [];

    searchEvents.forEach((ev) => {
      const meta = (ev.metadata as any) || {};
      const query = meta.query || 'unknown';
      if (!searchMap[query]) {
        searchMap[query] = { count: 0, clicks: 0, zeroResults: meta.resultCount === 0 };
      }
      searchMap[query].count += 1;
      if (ev.eventType === 'SEARCH_RESULT_CLICKED') {
        searchMap[query].clicks += 1;
      }
    });

    const topSearches = Object.keys(searchMap)
      .map((q) => ({ query: q, ...searchMap[q] }))
      .sort((a, b) => b.count - a.count);

    topSearches
      .filter((s) => s.zeroResults)
      .forEach((s) => zeroResultSearches.push({ query: s.query, count: s.count }));

    return {
      searchVolume,
      topSearches: topSearches.slice(0, 20),
      zeroResultSearches,
    };
  }

  /**
   * Advertising Analytics
   */
  static async getAdAnalytics(filters: AnalyticsQueryFilters) {
    const totalImpressions = await prisma.adMetric.count({ where: { eventType: 'IMPRESSION' } });
    const totalClicks = await prisma.adMetric.count({ where: { eventType: 'CLICK' } });
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const campaigns = await prisma.campaign.findMany({
      include: {
        advertiser: { select: { name: true } },
        _count: { select: { metrics: true } },
      },
      take: 20,
    });

    return {
      totalImpressions,
      totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        advertiserName: c.advertiser.name,
        status: c.status,
        metricsCount: c._count.metrics,
      })),
    };
  }

  /**
   * Consolidated Super Admin Dashboard Response
   */
  static async getConsolidatedDashboard() {
    const totalUsers = await prisma.user.count();
    const totalNews = await prisma.news.count({ where: { status: NewsStatus.PUBLISHED } });
    const pendingVerifications = await prisma.verificationRecord.count({ where: { status: 'PENDING' } });
    const pendingReports = await prisma.contentReport.count({ where: { status: 'PENDING' } });
    const activeAds = await prisma.campaign.count({ where: { status: 'ACTIVE' } });

    const recentEvents = await prisma.analyticsEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    let dbStatus = 'CONNECTED';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'DEGRADED';
    }

    return {
      users: { totalUsers },
      content: { publishedNewsCount: totalNews },
      engagement: { recent24hEvents: recentEvents },
      moderation: { pendingReports, pendingVerifications },
      advertising: { activeCampaigns: activeAds },
      systemHealth: { status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED', database: dbStatus, timestamp: new Date().toISOString() },
    };
  }

  /**
   * Export Analytics Data (CSV or JSON format)
   */
  static async exportAnalytics(format: 'csv' | 'json' = 'json', filters: AnalyticsQueryFilters) {
    const newsAnalytics = await this.getNewsAnalytics(filters);

    if (format === 'csv') {
      const header = 'ID,Title,Slug,Author,Views,Reactions,Comments\n';
      const rows = newsAnalytics.topArticles
        .map((a) => `"${a.id}","${a.title.replace(/"/g, '""')}","${a.slug}","${a.authorName || ''}",${a.views},${a.reactions},${a.comments}`)
        .join('\n');
      return { contentType: 'text/csv', data: header + rows, filename: 'analytics_export.csv' };
    }

    return { contentType: 'application/json', data: newsAnalytics, filename: 'analytics_export.json' };
  }
}
