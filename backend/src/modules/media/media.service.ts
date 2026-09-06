import path from 'path';
import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { MediaType, MediaRole } from '@prisma/client';
import { StorageService } from './storage.service';
import { InitUploadPayload, CompleteUploadPayload, MediaDto } from './media.types';

export class MediaService {
  /**
   * Safe serializer to convert BigInt sizeBytes and Decimal durationSeconds
   */
  private static formatMedia(r: any): MediaDto {
    return {
      ...r,
      sizeBytes: Number(r.sizeBytes),
      durationSeconds: r.durationSeconds != null ? Number(r.durationSeconds) : null,
    };
  }

  /**
   * Direct Upload: Processes multipart uploaded file into Media record
   */
  public static async uploadFile(file: Express.Multer.File, userId: string): Promise<MediaDto> {
    if (!file) {
      throw new AppError('No file uploaded', 400, 'MEDIA_UPLOAD_FAILED');
    }

    const type = StorageService.resolveMediaType(file.mimetype);

    // Extract relative storage key and public URL from the saved multer file
    const uploadsBase = path.join(process.cwd(), 'uploads');
    const relativeToUploads = path.relative(uploadsBase, file.path).replace(/\\/g, '/');
    const storageKey = relativeToUploads;
    const publicUrl = `/uploads/${relativeToUploads}`;

    const media = await prisma.media.create({
      data: {
        uploadedBy: userId,
        type,
        originalName: file.originalname,
        storageKey,
        url: publicUrl,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        status: 'READY',
      },
      include: {
        uploader: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return this.formatMedia(media);
  }

  /**
   * Two-step Flow Step 1: Initialize upload target
   */
  public static async initUpload(payload: InitUploadPayload, userId: string): Promise<{
    mediaId: string;
    storageKey: string;
    uploadUrl: string;
  }> {
    const { storageKey, publicUrl } = StorageService.generateStoragePath(payload.fileName);

    const media = await prisma.media.create({
      data: {
        uploadedBy: userId,
        type: payload.type,
        originalName: payload.fileName,
        storageKey,
        url: publicUrl,
        mimeType: payload.mimeType,
        sizeBytes: BigInt(payload.sizeBytes),
        status: 'UPLOADING',
      },
    });

    return {
      mediaId: media.id,
      storageKey,
      uploadUrl: publicUrl,
    };
  }

  /**
   * Two-step Flow Step 2: Complete upload
   */
  public static async completeUpload(payload: CompleteUploadPayload, userId: string): Promise<MediaDto> {
    const media = await prisma.media.findUnique({
      where: { id: payload.mediaId },
      include: { uploader: { select: { id: true, fullName: true, email: true } } },
    });

    if (!media) {
      throw new AppError('Media target not found', 404, 'MEDIA_NOT_FOUND');
    }

    if (media.uploadedBy !== userId) {
      throw new AppError('Unauthorized to finalize this media upload', 403, 'FORBIDDEN');
    }

    const updated = await prisma.media.update({
      where: { id: payload.mediaId },
      data: {
        status: 'READY',
        width: payload.width || null,
        height: payload.height || null,
        durationSeconds: payload.durationSeconds || null,
      },
      include: {
        uploader: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.formatMedia(updated);
  }

  /**
   * Get Media by ID
   */
  public static async getMediaById(id: string): Promise<MediaDto> {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null },
      include: { uploader: { select: { id: true, fullName: true, email: true } } },
    });

    if (!media) {
      throw new AppError('Media item not found', 404, 'MEDIA_NOT_FOUND');
    }

    return this.formatMedia(media);
  }

  /**
   * List user's own media library
   */
  public static async listUserMedia(
    userId: string,
    params: { type?: string; page?: number; limit?: number }
  ): Promise<{
    items: MediaDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {
      uploadedBy: userId,
      deletedAt: null,
      status: { not: 'DELETED' },
    };

    if (params.type && params.type !== 'ALL') {
      where.type = params.type as MediaType;
    }

    const [total, records] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { id: true, fullName: true, email: true } } },
      }),
    ]);

    return {
      items: records.map((r) => this.formatMedia(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Super Admin: List all platform media with filters
   */
  public static async listAdminMedia(params: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: MediaDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.type && params.type !== 'ALL') {
      where.type = params.type as MediaType;
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search && params.search.trim() !== '') {
      where.originalName = { contains: params.search.trim(), mode: 'insensitive' };
    }

    const [total, records] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { id: true, fullName: true, email: true } } },
      }),
    ]);

    return {
      items: records.map((r) => this.formatMedia(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Super Admin: Quarantine suspicious media
   */
  public static async quarantineMedia(id: string): Promise<MediaDto> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');

    const updated = await prisma.media.update({
      where: { id },
      data: { status: 'QUARANTINED' },
      include: { uploader: { select: { id: true, fullName: true, email: true } } },
    });

    return this.formatMedia(updated);
  }

  /**
   * Super Admin: Restore quarantined media
   */
  public static async restoreMedia(id: string): Promise<MediaDto> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');

    const updated = await prisma.media.update({
      where: { id },
      data: { status: 'READY' },
      include: { uploader: { select: { id: true, fullName: true, email: true } } },
    });

    return this.formatMedia(updated);
  }

  /**
   * Delete media (soft delete)
   */
  public static async deleteMedia(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const media = await prisma.media.findUnique({
      where: { id },
      include: { newsMedia: true },
    });

    if (!media) throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');

    if (!isAdmin && media.uploadedBy !== userId) {
      throw new AppError('Unauthorized to delete this media', 403, 'FORBIDDEN');
    }

    if (media.newsMedia.length > 0) {
      throw new AppError(
        'Cannot delete media attached to active news stories. Detach from stories first.',
        400,
        'MEDIA_IN_USE'
      );
    }

    await prisma.media.update({
      where: { id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
  }

  /**
   * Update media metadata
   */
  public static async updateMediaMetadata(
    id: string,
    data: { originalName?: string }
  ): Promise<MediaDto> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');

    const updated = await prisma.media.update({
      where: { id },
      data: {
        originalName: data.originalName ? data.originalName.trim() : media.originalName,
      },
      include: { uploader: { select: { id: true, fullName: true, email: true } } },
    });

    return this.formatMedia(updated);
  }

  /**
   * Super Admin: Inspect media usage across articles
   */
  public static async getMediaUsage(id: string): Promise<{
    id: string;
    totalUsage: number;
    articles: Array<{ id: string; title: string; slug: string; role: string }>;
  }> {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        featuredInNews: {
          select: { id: true, title: true, slug: true },
        },
        newsMedia: {
          include: {
            news: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    if (!media) throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');

    const usageMap = new Map<string, { id: string; title: string; slug: string; role: string }>();

    media.featuredInNews.forEach((news) => {
      usageMap.set(news.id, {
        id: news.id,
        title: news.title,
        slug: news.slug,
        role: 'FEATURED_IMAGE',
      });
    });

    media.newsMedia.forEach((nm) => {
      if (!usageMap.has(nm.news.id)) {
        usageMap.set(nm.news.id, {
          id: nm.news.id,
          title: nm.news.title,
          slug: nm.news.slug,
          role: nm.mediaRole,
        });
      }
    });

    const articles = Array.from(usageMap.values());

    return {
      id,
      totalUsage: articles.length,
      articles,
    };
  }

  /**
   * Attach media to a news story
   */
  public static async attachMediaToNews(
    newsId: string,
    mediaId: string,
    mediaRole: MediaRole = 'FEATURED',
    caption?: string,
    displayOrder = 0
  ): Promise<any> {
    return prisma.newsMedia.upsert({
      where: {
        newsId_mediaId: { newsId, mediaId },
      },
      update: {
        mediaRole,
        caption: caption || undefined,
        displayOrder,
      },
      create: {
        newsId,
        mediaId,
        mediaRole,
        caption: caption || undefined,
        displayOrder,
      },
      include: {
        media: true,
      },
    });
  }

  /**
   * Get all media attached to a news story (gallery, inline, attachments)
   */
  public static async getNewsMedia(newsId: string): Promise<any[]> {
    return prisma.newsMedia.findMany({
      where: { newsId },
      orderBy: { displayOrder: 'asc' },
      include: {
        media: true,
      },
    });
  }

  /**
   * Detach media from a news story
   */
  public static async detachMediaFromNews(newsId: string, mediaId: string): Promise<void> {
    await prisma.newsMedia.deleteMany({
      where: { newsId, mediaId },
    });
  }
}
