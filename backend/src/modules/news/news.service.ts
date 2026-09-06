import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { NewsStatus, EditorialActionType, Prisma } from '@prisma/client';
import { NewsArticleDTO, NewsFeedQueryParams, NewsFeedResponse } from './news.types';
import {
  AdminNewsQueryParams,
  CreateNewsPayload,
  EditorialActionDTO,
  NewsRevisionDTO,
  UpdateNewsPayload,
} from './news-editorial.types';

export class NewsService {
  /**
   * Helper to format Prisma News entity to DTO
   */
  private static formatNewsArticle(article: any): NewsArticleDTO {
    const primaryCategory = article.categories && article.categories.length > 0 ? article.categories[0].category : null;
    const primaryLocation = article.locations && article.locations.length > 0 ? article.locations[0].location : null;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.shortDescription || article.excerpt || null,
      content: article.content,
      coverImageUrl: article.featuredImage ? article.featuredImage.url : (article.coverImageUrl || null),
      status: article.status,
      viewCount: Number(article.viewCount || 0),
      isFeatured: article.isFeatured || false,
      isBreaking: article.isBreaking || false,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      category: primaryCategory ? { id: primaryCategory.id, name: primaryCategory.name, slug: primaryCategory.slug } : null,
      location: primaryLocation ? { id: primaryLocation.id, name: primaryLocation.name, slug: primaryLocation.slug } : null,
      author: article.author ? { id: article.author.id, fullName: article.author.fullName, avatarUrl: article.author.avatarUrl } : null,
      sources: article.sources && article.sources.length > 0
        ? article.sources.map((s: any) => ({
            id: s.source?.id || s.sourceId || s.id,
            name: s.source?.name || 'Verified Source',
            sourceType: s.source?.sourceType || 'OFFICIAL',
            credibilityStatus: s.source?.credibilityStatus || 'VERIFIED',
            referenceUrl: s.referenceUrl || null,
            sourceNote: s.sourceNote || null,
          }))
        : undefined,
    };
  }

  /**
   * Deterministic Slug Generator with Collision Handling
   */
  private static async generateUniqueSlug(title: string, excludeNewsId?: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = 'news-story';

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.news.findFirst({
        where: {
          slug,
          id: excludeNewsId ? { not: excludeNewsId } : undefined,
        },
      });

      if (!existing) break;

      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  // =========================================================================
  // PUBLIC DISCOVERY ENDPOINTS
  // =========================================================================

  public static async getNewsFeed(params: NewsFeedQueryParams): Promise<NewsFeedResponse> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.NewsWhereInput = {
      status: NewsStatus.PUBLISHED,
    };

    if (params.category && params.category.trim() !== '') {
      const catTerm = params.category.trim().toLowerCase();
      const matchingCat = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: catTerm },
            { name: { equals: params.category.trim(), mode: 'insensitive' } },
          ],
        },
        include: { children: true },
      });

      if (matchingCat) {
        const targetCategoryIds = [matchingCat.id, ...matchingCat.children.map((c) => c.id)];
        where.categories = {
          some: {
            categoryId: { in: targetCategoryIds },
          },
        };
      } else {
        where.categories = {
          some: {
            category: {
              OR: [
                { slug: catTerm },
                { name: { equals: params.category.trim(), mode: 'insensitive' } },
              ],
            },
          },
        };
      }
    }

    if (params.location && params.location.trim() !== '') {
      const locTerm = params.location.trim().toLowerCase();
      const matchingLoc = await prisma.location.findFirst({
        where: {
          OR: [
            { slug: locTerm },
            { name: { equals: params.location.trim(), mode: 'insensitive' } },
          ],
        },
        include: { children: true },
      });

      if (matchingLoc) {
        const targetLocationIds = [matchingLoc.id, ...matchingLoc.children.map((c) => c.id)];
        where.locations = {
          some: {
            locationId: { in: targetLocationIds },
          },
        };
      } else {
        where.locations = {
          some: {
            location: {
              OR: [
                { slug: locTerm },
                { name: { equals: params.location.trim(), mode: 'insensitive' } },
              ],
            },
          },
        };
      }
    }

    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.featured !== undefined) {
      where.isFeatured = params.featured;
    }

    const [total, articles] = await Promise.all([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          categories: { include: { category: true } },
          locations: { include: { location: true } },
          author: true,
          featuredImage: true,
        },
      }),
    ]);

    return {
      articles: articles.map((a) => this.formatNewsArticle(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async getFeaturedNews(): Promise<NewsArticleDTO | null> {
    const article = await prisma.news.findFirst({
      where: {
        status: NewsStatus.PUBLISHED,
        isFeatured: true,
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    if (!article) {
      const fallback = await prisma.news.findFirst({
        where: { status: NewsStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        include: {
          categories: { include: { category: true } },
          locations: { include: { location: true } },
          author: true,
          featuredImage: true,
        },
      });
      return fallback ? this.formatNewsArticle(fallback) : null;
    }

    return this.formatNewsArticle(article);
  }

  public static async getBreakingNews(): Promise<NewsArticleDTO[]> {
    const articles = await prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        isBreaking: true,
      },
      take: 5,
      orderBy: { publishedAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    return articles.map((a) => this.formatNewsArticle(a));
  }

  public static async getTrendingNews(limit = 5): Promise<NewsArticleDTO[]> {
    const articles = await prisma.news.findMany({
      where: { status: NewsStatus.PUBLISHED },
      take: Math.min(20, limit),
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    return articles.map((a) => this.formatNewsArticle(a));
  }

  /**
   * Contributor: Get user's own submissions with status filtering & editorial remarks
   */
  public static async getMySubmissions(
    authorId: string,
    status?: NewsStatus,
    page = 1,
    limit = 10
  ): Promise<{ articles: any[]; meta: any }> {
    const where: any = { authorId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          categories: { include: { category: true } },
          locations: { include: { location: true } },
          author: true,
          featuredImage: true,
          actions: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      prisma.news.count({ where }),
    ]);

    const formatted = articles.map((a) => ({
      ...this.formatNewsArticle(a),
      actions: a.actions,
    }));

    return {
      articles: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getArticleBySlug(slugOrId: string): Promise<NewsArticleDTO> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slugOrId);

    let article = await prisma.news.findFirst({
      where: isUuid
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }] }
        : { slug: slugOrId },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    // Fallback to latest article if exact slug/id is not found
    if (!article) {
      article = await prisma.news.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { include: { category: true } },
          locations: { include: { location: true } },
          author: true,
          featuredImage: true,
        },
      });
    }

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    await prisma.news.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    return this.formatNewsArticle({ ...article, viewCount: Number(article.viewCount) + 1 });
  }

  public static async getRelatedNews(articleId: string, limit = 4): Promise<NewsArticleDTO[]> {
    const target = await prisma.news.findUnique({
      where: { id: articleId },
      include: { categories: true, locations: true },
    });
    if (!target) return [];

    const categoryId = target.categories[0]?.categoryId;
    const locationId = target.locations[0]?.locationId;

    const articles = await prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        id: { not: articleId },
        OR: [
          categoryId ? { categories: { some: { categoryId } } } : {},
          locationId ? { locations: { some: { locationId } } } : {},
        ],
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    return articles.map((a) => this.formatNewsArticle(a));
  }

  // =========================================================================
  // AUTHOR / CONTRIBUTOR SELF-SERVICE EDITORIAL ENDPOINTS
  // =========================================================================

  public static async createNews(authorId: string, payload: CreateNewsPayload): Promise<NewsArticleDTO> {
    if (!payload.title || !payload.title.trim()) {
      throw new AppError('News headline title is required', 400, 'NEWS_TITLE_REQUIRED');
    }

    if (!payload.content || !payload.content.trim()) {
      throw new AppError('Article body content is required', 400, 'NEWS_CONTENT_REQUIRED');
    }

    const slug = await this.generateUniqueSlug(payload.title);

    const article = await prisma.news.create({
      data: {
        title: payload.title.trim(),
        slug,
        shortDescription: payload.shortDescription ? payload.shortDescription.trim() : null,
        content: payload.content.trim(),
        excerpt: payload.excerpt ? payload.excerpt.trim() : null,
        status: NewsStatus.DRAFT,
        isBreaking: payload.isBreaking || false,
        isFeatured: payload.isFeatured || false,
        featuredImageId: payload.featuredMediaId || null,
        authorId,
      },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    // Link Categories
    if (payload.categoryIds && payload.categoryIds.length > 0) {
      for (let i = 0; i < payload.categoryIds.length; i++) {
        await prisma.newsCategory.create({
          data: {
            newsId: article.id,
            categoryId: payload.categoryIds[i],
            isPrimary: i === 0,
          },
        });
      }
    }

    // Link Locations
    if (payload.locationIds && payload.locationIds.length > 0) {
      for (let i = 0; i < payload.locationIds.length; i++) {
        await prisma.newsLocation.create({
          data: {
            newsId: article.id,
            locationId: payload.locationIds[i],
            isPrimary: i === 0,
          },
        });
      }
    }

    // Link Sources
    if (payload.sources && payload.sources.length > 0) {
      for (const s of payload.sources) {
        if (s.sourceId) {
          await prisma.newsSource.create({
            data: {
              newsId: article.id,
              sourceId: s.sourceId,
              referenceUrl: s.referenceUrl || null,
              sourceNote: s.sourceNote || null,
            },
          });
        }
      }
    }

    // Log Initial Revision v1
    await prisma.newsRevision.create({
      data: {
        newsId: article.id,
        versionNumber: 1,
        title: article.title,
        content: article.content,
        changedBy: authorId,
        changeSummary: 'Initial draft creation',
      },
    });

    const refreshed = await prisma.news.findUnique({
      where: { id: article.id },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
        sources: { include: { source: true } },
      },
    });

    return this.formatNewsArticle(refreshed);
  }

  public static async updateNews(
    newsId: string,
    userId: string,
    isSuperAdmin: boolean,
    payload: UpdateNewsPayload
  ): Promise<NewsArticleDTO> {
    const existing = await prisma.news.findUnique({ where: { id: newsId } });
    if (!existing) {
      throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');
    }

    if (!isSuperAdmin && existing.authorId !== userId) {
      throw new AppError('You are not authorized to edit this news article', 403, 'FORBIDDEN');
    }

    if (existing.status === NewsStatus.ARCHIVED) {
      throw new AppError('Archived articles cannot be edited directly', 400, 'NEWS_NOT_EDITABLE');
    }

    let newSlug = existing.slug;
    if (payload.title && payload.title.trim() !== existing.title) {
      newSlug = await this.generateUniqueSlug(payload.title, newsId);
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: {
        title: payload.title ? payload.title.trim() : undefined,
        slug: newSlug,
        shortDescription: payload.shortDescription !== undefined ? payload.shortDescription : undefined,
        content: payload.content ? payload.content.trim() : undefined,
        excerpt: payload.excerpt !== undefined ? payload.excerpt : undefined,
        isBreaking: payload.isBreaking !== undefined ? payload.isBreaking : undefined,
        isFeatured: payload.isFeatured !== undefined ? payload.isFeatured : undefined,
        featuredImageId: payload.featuredMediaId !== undefined ? payload.featuredMediaId : undefined,
      },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
        sources: { include: { source: true } },
      },
    });

    // Update Sources if provided
    if (payload.sources) {
      await prisma.newsSource.deleteMany({ where: { newsId } });
      for (const s of payload.sources) {
        if (s.sourceId) {
          await prisma.newsSource.create({
            data: {
              newsId,
              sourceId: s.sourceId,
              referenceUrl: s.referenceUrl || null,
              sourceNote: s.sourceNote || null,
            },
          });
        }
      }
    }

    // Create next revision snapshot
    const lastRevision = await prisma.newsRevision.findFirst({
      where: { newsId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersion = (lastRevision?.versionNumber || 0) + 1;

    await prisma.newsRevision.create({
      data: {
        newsId,
        versionNumber: nextVersion,
        title: updated.title,
        content: updated.content,
        changedBy: userId,
        changeSummary: payload.changeSummary || `Article update (v${nextVersion})`,
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async submitForReview(newsId: string, userId: string): Promise<NewsArticleDTO> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    if (news.authorId !== userId) {
      throw new AppError('Only the article author can submit this draft for review', 403, 'FORBIDDEN');
    }

    if (news.status !== NewsStatus.DRAFT && news.status !== NewsStatus.REJECTED) {
      throw new AppError(`Cannot submit article in current state (${news.status})`, 400, 'NEWS_INVALID_TRANSITION');
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { status: NewsStatus.SUBMITTED },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.SUBMITTED,
        performedBy: userId,
        remarks: 'Article submitted for editorial review',
      },
    });

    return this.formatNewsArticle(updated);
  }

  // =========================================================================
  // SUPER ADMIN EDITORIAL GOVERNANCE ENDPOINTS
  // =========================================================================

  public static async getAdminNewsList(params: AdminNewsQueryParams): Promise<NewsFeedResponse> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.NewsWhereInput = {
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.isBreaking !== undefined) {
      where.isBreaking = params.isBreaking;
    }

    if (params.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    const [total, articles] = await Promise.all([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          categories: { include: { category: true } },
          locations: { include: { location: true } },
          author: true,
          featuredImage: true,
        },
      }),
    ]);

    return {
      articles: articles.map((a) => this.formatNewsArticle(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async startReview(newsId: string, adminId: string): Promise<NewsArticleDTO> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    if (news.status !== NewsStatus.SUBMITTED) {
      throw new AppError(`Cannot start review on article in status ${news.status}`, 400, 'NEWS_INVALID_TRANSITION');
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { status: NewsStatus.UNDER_REVIEW },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.REVIEWED,
        performedBy: adminId,
        remarks: 'Super Admin started editorial review',
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async approveNews(newsId: string, adminId: string): Promise<NewsArticleDTO> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    if (news.status !== NewsStatus.UNDER_REVIEW && news.status !== NewsStatus.SUBMITTED) {
      throw new AppError(`Cannot approve article in status ${news.status}`, 400, 'NEWS_INVALID_TRANSITION');
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { status: NewsStatus.APPROVED },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.APPROVED,
        performedBy: adminId,
        remarks: 'Article passed editorial verification & approved',
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async rejectNews(newsId: string, adminId: string, reason: string): Promise<NewsArticleDTO> {
    if (!reason || !reason.trim()) {
      throw new AppError('Rejection remarks reason is required', 400, 'REJECTION_REASON_REQUIRED');
    }

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { status: NewsStatus.REJECTED },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.REJECTED,
        performedBy: adminId,
        remarks: reason.trim(),
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async publishNews(newsId: string, adminId: string): Promise<NewsArticleDTO> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    if (news.status === NewsStatus.ARCHIVED) {
      throw new AppError('Cannot publish archived article directly', 400, 'NEWS_INVALID_TRANSITION');
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: {
        status: NewsStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledAt: null,
      },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.PUBLISHED,
        performedBy: adminId,
        remarks: 'Article published live to public news portal',
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async scheduleNews(newsId: string, adminId: string, scheduledAt: Date): Promise<NewsArticleDTO> {
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      throw new AppError('Scheduled publication date must be in the future', 400, 'NEWS_SCHEDULE_INVALID');
    }

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: {
        status: NewsStatus.SCHEDULED,
        scheduledAt,
      },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.APPROVED,
        performedBy: adminId,
        remarks: `Article scheduled for release on ${scheduledAt.toISOString()}`,
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async unpublishNews(newsId: string, adminId: string): Promise<NewsArticleDTO> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    if (news.status !== NewsStatus.PUBLISHED) {
      throw new AppError('Only published articles can be unpublished', 400, 'NEWS_INVALID_TRANSITION');
    }

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { status: NewsStatus.DRAFT },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.UNPUBLISHED,
        performedBy: adminId,
        remarks: 'Article unpublished and reverted to draft status',
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async archiveNews(newsId: string, adminId: string): Promise<NewsArticleDTO> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');

    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { status: NewsStatus.ARCHIVED },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });

    await prisma.editorialAction.create({
      data: {
        newsId,
        action: EditorialActionType.ARCHIVED,
        performedBy: adminId,
        remarks: 'Article archived',
      },
    });

    return this.formatNewsArticle(updated);
  }

  public static async toggleBreaking(newsId: string, _adminId: string, isBreaking: boolean): Promise<NewsArticleDTO> {
    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { isBreaking },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });
    return this.formatNewsArticle(updated);
  }

  public static async toggleFeatured(newsId: string, _adminId: string, isFeatured: boolean): Promise<NewsArticleDTO> {
    const updated = await prisma.news.update({
      where: { id: newsId },
      data: { isFeatured },
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: true } },
        author: true,
        featuredImage: true,
      },
    });
    return this.formatNewsArticle(updated);
  }

  public static async getRevisions(newsId: string): Promise<NewsRevisionDTO[]> {
    const revisions = await prisma.newsRevision.findMany({
      where: { newsId },
      orderBy: { versionNumber: 'desc' },
    });

    return revisions.map((r) => ({
      id: r.id,
      newsId: r.newsId,
      versionNumber: r.versionNumber,
      title: r.title,
      content: r.content,
      changeSummary: r.changeSummary,
      createdAt: r.createdAt,
    }));
  }

  public static async getEditorialHistory(newsId: string): Promise<EditorialActionDTO[]> {
    const actions = await prisma.editorialAction.findMany({
      where: { newsId },
      orderBy: { createdAt: 'desc' },
      include: { performer: true },
    });

    return actions.map((a) => ({
      id: a.id,
      newsId: a.newsId,
      action: a.action,
      performedBy: { id: a.performer.id, fullName: a.performer.fullName },
      remarks: a.remarks,
      createdAt: a.createdAt,
    }));
  }
}
