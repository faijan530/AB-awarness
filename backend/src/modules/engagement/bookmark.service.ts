import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { NewsStatus } from '@prisma/client';
import { BookmarkListResponse, BookmarkResponseDTO } from './engagement.types';

export class BookmarkService {
  /**
   * Toggle bookmark for an authenticated reader
   */
  public static async toggleBookmark(
    userId: string,
    newsId: string
  ): Promise<{ isBookmarked: boolean; message: string }> {
    // 1. Verify news story exists, is published, and not deleted
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!news || news.deletedAt) {
      throw new AppError('News story not found', 404, 'NEWS_NOT_FOUND');
    }

    if (news.status !== NewsStatus.PUBLISHED) {
      throw new AppError('Only published stories can be bookmarked', 400, 'NEWS_NOT_PUBLISHED');
    }

    // 2. Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_newsId: { userId, newsId },
      },
    });

    if (existing) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      await prisma.news.update({
        where: { id: newsId },
        data: { bookmarkCount: { decrement: 1 } },
      }).catch(() => {});

      return { isBookmarked: false, message: 'Article removed from your bookmarks' };
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: { userId, newsId },
      });
      await prisma.news.update({
        where: { id: newsId },
        data: { bookmarkCount: { increment: 1 } },
      }).catch(() => {});

      return { isBookmarked: true, message: 'Article saved to your bookmarks' };
    }
  }

  /**
   * Add bookmark (POST /api/v1/news/:newsId/bookmark)
   */
  public static async addBookmark(userId: string, newsId: string): Promise<{ isBookmarked: boolean; message: string }> {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_newsId: { userId, newsId } },
    });

    if (existing) {
      return { isBookmarked: true, message: 'Article is already in your bookmarks' };
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!news || news.deletedAt || news.status !== NewsStatus.PUBLISHED) {
      throw new AppError('News story not found or not accessible', 404, 'NEWS_NOT_FOUND');
    }

    await prisma.bookmark.create({
      data: { userId, newsId },
    });

    await prisma.news.update({
      where: { id: newsId },
      data: { bookmarkCount: { increment: 1 } },
    }).catch(() => {});

    return { isBookmarked: true, message: 'Article saved to your bookmarks' };
  }

  /**
   * Remove bookmark (DELETE /api/v1/news/:newsId/bookmark)
   */
  public static async removeBookmark(userId: string, newsId: string): Promise<{ isBookmarked: boolean; message: string }> {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_newsId: { userId, newsId } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      await prisma.news.update({
        where: { id: newsId },
        data: { bookmarkCount: { decrement: 1 } },
      }).catch(() => {});
    }

    return { isBookmarked: false, message: 'Article removed from your bookmarks' };
  }

  /**
   * Check if an article is bookmarked by a user
   */
  public static async isBookmarked(userId: string, newsId: string): Promise<boolean> {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_newsId: { userId, newsId },
      },
      select: { id: true },
    });
    return !!existing;
  }

  /**
   * Get user's saved bookmarks with pagination
   */
  public static async getUserBookmarks(
    userId: string,
    page = 1,
    limit = 10,
    categorySlug?: string,
    locationSlug?: string
  ): Promise<BookmarkListResponse> {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(50, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
      news: {
        deletedAt: null,
        status: NewsStatus.PUBLISHED,
      },
    };

    if (categorySlug) {
      where.news.categories = {
        some: { category: { slug: categorySlug } },
      };
    }
    if (locationSlug) {
      where.news.locations = {
        some: { location: { slug: locationSlug } },
      };
    }

    const [total, bookmarks] = await Promise.all([
      prisma.bookmark.count({ where }),
      prisma.bookmark.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          news: {
            include: {
              categories: { include: { category: true } },
              locations: { include: { location: true } },
              author: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
    ]);

    const formatted: BookmarkResponseDTO[] = bookmarks.map((b) => {
      const news = b.news;
      const primaryCategory = news.categories && news.categories.length > 0 ? news.categories[0].category : null;
      const primaryLocation = news.locations && news.locations.length > 0 ? news.locations[0].location : null;

      return {
        id: b.id,
        newsId: b.newsId,
        userId: b.userId,
        createdAt: b.createdAt,
        news: {
          id: news.id,
          title: news.title,
          slug: news.slug,
          summary: news.shortDescription,
          coverImageUrl: null,
          publishedAt: news.publishedAt,
          category: primaryCategory ? { id: primaryCategory.id, name: primaryCategory.name, slug: primaryCategory.slug } : null,
          location: primaryLocation ? { id: primaryLocation.id, name: primaryLocation.name, slug: primaryLocation.slug } : null,
          author: news.author ? { id: news.author.id, fullName: news.author.fullName } : null,
        },
      };
    });

    return {
      bookmarks: formatted,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
