import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { SourceType, CredibilityStatus } from '@prisma/client';

export interface CreateSourcePayload {
  name: string;
  sourceType: SourceType;
  url?: string;
  description?: string;
  contactInfo?: string;
  credibilityStatus?: CredibilityStatus;
}

export interface UpdateSourcePayload {
  name?: string;
  sourceType?: SourceType;
  url?: string;
  description?: string;
  contactInfo?: string;
  credibilityStatus?: CredibilityStatus;
}

export class SourceService {
  /**
   * List Sources with search & filters
   */
  public static async listSources(params: {
    type?: string;
    credibility?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.type && params.type !== 'ALL') {
      where.sourceType = params.type as SourceType;
    }

    if (params.credibility && params.credibility !== 'ALL') {
      where.credibilityStatus = params.credibility as CredibilityStatus;
    }

    if (params.search && params.search.trim() !== '') {
      where.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' } },
        { description: { contains: params.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.source.count({ where }),
      prisma.source.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { newsSources: true } },
        },
      }),
    ]);

    return {
      items: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Source by ID
   */
  public static async getSourceById(id: string): Promise<any> {
    const source = await prisma.source.findUnique({
      where: { id },
      include: {
        newsSources: {
          include: {
            news: { select: { id: true, title: true, slug: true, status: true, publishedAt: true } },
          },
          take: 10,
        },
      },
    });

    if (!source) throw new AppError('Source record not found', 404, 'SOURCE_NOT_FOUND');
    return source;
  }

  /**
   * Create Source
   */
  public static async createSource(payload: CreateSourcePayload): Promise<any> {
    return prisma.source.create({
      data: {
        name: payload.name.trim(),
        sourceType: payload.sourceType,
        url: payload.url?.trim() || null,
        description: payload.description?.trim() || null,
        contactInfo: payload.contactInfo?.trim() || null,
        credibilityStatus: payload.credibilityStatus || 'UNVERIFIED',
      },
    });
  }

  /**
   * Update Source
   */
  public static async updateSource(id: string, payload: UpdateSourcePayload): Promise<any> {
    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) throw new AppError('Source record not found', 404, 'SOURCE_NOT_FOUND');

    return prisma.source.update({
      where: { id },
      data: {
        name: payload.name !== undefined ? payload.name.trim() : undefined,
        sourceType: payload.sourceType,
        url: payload.url !== undefined ? payload.url?.trim() || null : undefined,
        description: payload.description !== undefined ? payload.description?.trim() || null : undefined,
        contactInfo: payload.contactInfo !== undefined ? payload.contactInfo?.trim() || null : undefined,
        credibilityStatus: payload.credibilityStatus,
      },
    });
  }

  /**
   * Delete Source
   */
  public static async deleteSource(id: string): Promise<void> {
    const count = await prisma.newsSource.count({ where: { sourceId: id } });
    if (count > 0) {
      throw new AppError(
        'Cannot delete source referenced by active published news. Remove citation references first.',
        400,
        'SOURCE_RESTRICTED'
      );
    }

    await prisma.source.delete({ where: { id } });
  }

  /**
   * Link Source to News Story
   */
  public static async attachSourceToNews(
    newsId: string,
    sourceId: string,
    referenceUrl?: string,
    sourceNote?: string
  ): Promise<any> {
    return prisma.newsSource.upsert({
      where: {
        newsId_sourceId: { newsId, sourceId },
      },
      update: {
        referenceUrl: referenceUrl || undefined,
        sourceNote: sourceNote || undefined,
      },
      create: {
        newsId,
        sourceId,
        referenceUrl: referenceUrl || undefined,
        sourceNote: sourceNote || undefined,
      },
      include: {
        source: true,
      },
    });
  }
}
