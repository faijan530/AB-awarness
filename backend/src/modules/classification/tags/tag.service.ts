import { NewsStatus } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middlewares/error.middleware';
import { TagDTO, CreateTagPayload, UpdateTagPayload } from './tag.types';

export class TagService {
  /**
   * Generate clean slug for tag
   */
  public static async generateUniqueSlug(name: string, currentId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'tag';
    let counter = 1;

    while (true) {
      const existing = await prisma.tag.findUnique({ where: { slug } });
      if (!existing || (currentId && existing.id === currentId)) {
        return slug;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * List all tags with usage count
   */
  public static async getTags(): Promise<TagDTO[]> {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { newsTags: true },
        },
      },
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      articleCount: t._count.newsTags,
    }));
  }

  /**
   * Get tag details by slug
   */
  public static async getTagBySlug(slug: string): Promise<TagDTO> {
    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { newsTags: true },
        },
      },
    });

    if (!tag) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      articleCount: tag._count.newsTags,
    };
  }

  /**
   * Get news articles by tag slug
   */
  public static async getNewsByTagSlug(slug: string, page = 1, limit = 10): Promise<any> {
    const tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    const skip = (page - 1) * limit;

    const [newsItems, total] = await Promise.all([
      prisma.newsTag.findMany({
        where: {
          tagId: tag.id,
          news: { status: NewsStatus.PUBLISHED },
        },
        skip,
        take: limit,
        orderBy: { news: { publishedAt: 'desc' } },
        include: {
          news: {
            include: {
              categories: { include: { category: true } },
              locations: { include: { location: true } },
              author: true,
              featuredImage: true,
            },
          },
        },
      }),
      prisma.newsTag.count({
        where: {
          tagId: tag.id,
          news: { status: NewsStatus.PUBLISHED },
        },
      }),
    ]);

    const articles = newsItems.map((item) => ({
      id: item.news.id,
      title: item.news.title,
      slug: item.news.slug,
      summary: item.news.shortDescription,
      content: item.news.content,
      coverImageUrl: item.news.featuredImage?.url || null,
      status: item.news.status,
      viewCount: Number(item.news.viewCount),
      isFeatured: item.news.isFeatured,
      isBreaking: item.news.isBreaking,
      publishedAt: item.news.publishedAt,
      createdAt: item.news.createdAt,
      category: item.news.categories.find((c) => c.isPrimary)?.category || item.news.categories[0]?.category || null,
      location: item.news.locations.find((l) => l.isPrimary)?.location || item.news.locations[0]?.location || null,
      author: item.news.author
        ? { id: item.news.author.id, fullName: item.news.author.fullName, avatarUrl: item.news.author.avatarUrl }
        : null,
    }));

    return {
      tag,
      articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Create Tag
   */
  public static async createTag(payload: CreateTagPayload): Promise<TagDTO> {
    if (!payload.name || !payload.name.trim()) {
      throw new AppError('Tag name is required', 400, 'TAG_NAME_REQUIRED');
    }

    const name = payload.name.trim();

    const existingName = await prisma.tag.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existingName) {
      throw new AppError(`Tag '${name}' already exists`, 409, 'TAG_DUPLICATE');
    }

    const slug = await this.generateUniqueSlug(name);

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
      },
    });

    return tag;
  }

  /**
   * Admin: Update Tag
   */
  public static async updateTag(id: string, payload: UpdateTagPayload): Promise<TagDTO> {
    if (!payload.name || !payload.name.trim()) {
      throw new AppError('Tag name is required', 400, 'TAG_NAME_REQUIRED');
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    const name = payload.name.trim();
    let slug = existing.slug;
    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.tag.findFirst({
        where: {
          id: { not: id },
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (duplicate) {
        throw new AppError(`Tag '${name}' already exists`, 409, 'TAG_DUPLICATE');
      }
      slug = await this.generateUniqueSlug(name, id);
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    return updated;
  }

  /**
   * Admin: Delete Tag
   */
  public static async deleteTag(id: string): Promise<TagDTO> {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    const deleted = await prisma.tag.delete({ where: { id } });
    return deleted;
  }
}
