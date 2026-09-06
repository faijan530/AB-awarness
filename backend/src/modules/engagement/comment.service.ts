import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { CommentStatus, NewsStatus, Prisma } from '@prisma/client';
import {
  CreateCommentPayload,
  UpdateCommentPayload,
  CommentResponseDTO,
  CommentListResponse,
  AdminCommentQueryParams,
  AdminCommentModerationPayload,
} from './engagement.types';

export class CommentService {
  /**
   * Basic HTML & script tag stripper for spam and XSS protection
   */
  public static sanitizeContent(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
      .replace(/(.)\1{15,}/g, '$1$1$1') // Compress excessive repeating characters
      .trim();
  }

  /**
   * Helper to format a Prisma comment object into a safe DTO
   */
  private static formatComment(comment: any): CommentResponseDTO {
    return {
      id: comment.id,
      newsId: comment.newsId,
      userId: comment.userId,
      user: {
        id: comment.user?.id || comment.userId,
        fullName: comment.user?.fullName || 'Anonymous Reader',
        avatarUrl: comment.user?.avatarUrl || null,
      },
      parentId: comment.parentId || null,
      content: comment.deletedAt ? '[This comment has been removed]' : comment.content,
      status: comment.status,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replyCount: comment._count?.replies ?? (comment.replies ? comment.replies.length : 0),
      replies: comment.replies ? comment.replies.map((r: any) => this.formatComment(r)) : undefined,
    };
  }

  /**
   * Create a new comment or reply on a published news story
   */
  public static async createComment(
    userId: string,
    newsId: string,
    payload: CreateCommentPayload
  ): Promise<CommentResponseDTO> {
    const sanitized = this.sanitizeContent(payload.content);
    if (!sanitized) {
      throw new AppError('Comment content cannot be empty or contain only unsafe tags', 400, 'COMMENT_EMPTY');
    }
    if (sanitized.length > 2000) {
      throw new AppError('Comment exceeds maximum allowed length of 2,000 characters', 400, 'COMMENT_TOO_LONG');
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
      throw new AppError('Comments can only be posted on published news articles', 400, 'NEWS_NOT_PUBLISHED');
    }

    // 2. If replying, verify parent comment exists on the same news article
    let parentId: string | undefined = undefined;
    if (payload.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: payload.parentId },
        select: { id: true, newsId: true, deletedAt: true },
      });

      if (!parent || parent.deletedAt) {
        throw new AppError('Parent comment does not exist or has been deleted', 404, 'PARENT_COMMENT_NOT_FOUND');
      }

      if (parent.newsId !== newsId) {
        throw new AppError('Parent comment does not belong to this article', 400, 'INVALID_PARENT_RELATION');
      }

      parentId = parent.id;
    }

    // 3. Create comment & increment news commentCount
    const comment = await prisma.comment.create({
      data: {
        newsId,
        userId,
        parentId,
        content: sanitized,
        status: CommentStatus.APPROVED, // Direct publication with reactive admin moderation
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    // Update news comment count sequentially
    await prisma.news.update({
      where: { id: newsId },
      data: { commentCount: { increment: 1 } },
    });

    return this.formatComment(comment);
  }

  /**
   * Create reply to a specific comment (POST /comments/:commentId/replies)
   */
  public static async createReply(
    userId: string,
    commentId: string,
    content: string
  ): Promise<CommentResponseDTO> {
    const parent = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, newsId: true, deletedAt: true },
    });

    if (!parent || parent.deletedAt) {
      throw new AppError('Parent comment does not exist or has been deleted', 404, 'PARENT_COMMENT_NOT_FOUND');
    }

    return this.createComment(userId, parent.newsId, {
      content,
      parentId: parent.id,
    });
  }

  /**
   * Get replies for a specific comment (GET /comments/:commentId/replies)
   */
  public static async getCommentReplies(
    commentId: string,
    page = 1,
    limit = 20
  ): Promise<CommentListResponse> {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.CommentWhereInput = {
      parentId: commentId,
      status: { notIn: [CommentStatus.FLAGGED, CommentStatus.REJECTED] },
    };

    const [total, replies] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      }),
    ]);

    return {
      comments: replies.map((r) => this.formatComment(r)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get comments on a published article with replies
   */
  public static async getArticleComments(
    newsId: string,
    page = 1,
    limit = 20,
    sort: 'LATEST' | 'OLDEST' | 'POPULAR' = 'LATEST'
  ): Promise<CommentListResponse> {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    // Filter out FLAGGED, REJECTED comments from public view
    const where: Prisma.CommentWhereInput = {
      newsId,
      parentId: null, // Top-level comments only
      status: { notIn: [CommentStatus.FLAGGED, CommentStatus.REJECTED] },
    };

    let orderBy: Prisma.CommentOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'OLDEST') {
      orderBy = { createdAt: 'asc' };
    }

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          replies: {
            where: {
              status: { notIn: [CommentStatus.FLAGGED, CommentStatus.REJECTED] },
            },
            take: 5,
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
    ]);

    return {
      comments: comments.map((c) => this.formatComment(c)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get single comment by ID
   */
  public static async getCommentById(id: string): Promise<any> {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        news: { select: { id: true, title: true, slug: true } },
        replies: {
          take: 10,
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    return this.formatComment(comment);
  }

  /**
   * Edit own comment
   */
  public static async updateComment(
    commentId: string,
    userId: string,
    payload: UpdateCommentPayload
  ): Promise<CommentResponseDTO> {
    const sanitized = this.sanitizeContent(payload.content);
    if (!sanitized) {
      throw new AppError('Comment content cannot be empty', 400, 'COMMENT_EMPTY');
    }
    if (sanitized.length > 2000) {
      throw new AppError('Comment exceeds maximum allowed length of 2,000 characters', 400, 'COMMENT_TOO_LONG');
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    if (comment.userId !== userId) {
      throw new AppError('You are not authorized to edit this comment', 403, 'FORBIDDEN');
    }

    if (comment.deletedAt) {
      throw new AppError('Deleted comments cannot be edited', 400, 'COMMENT_ALREADY_DELETED');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: sanitized },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return this.formatComment(updated);
  }

  /**
   * Soft delete a comment (author or admin)
   */
  public static async deleteComment(
    commentId: string,
    userId: string,
    isAdmin = false
  ): Promise<{ message: string }> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    if (comment.userId !== userId && !isAdmin) {
      throw new AppError('You are not authorized to delete this comment', 403, 'FORBIDDEN');
    }

    if (comment.deletedAt) {
      return { message: 'Comment already removed' };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        status: CommentStatus.DELETED,
      },
    });

    // Decrement news comment count safely
    await prisma.news.update({
      where: { id: comment.newsId },
      data: { commentCount: { decrement: 1 } },
    }).catch(() => {});

    return { message: 'Comment deleted successfully' };
  }

  /**
   * Super Admin: Query all comments across platform with moderation status filter
   */
  public static async adminGetComments(params: AdminCommentQueryParams): Promise<CommentListResponse> {
    const pageNum = Math.max(1, params.page || 1);
    const limitNum = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.CommentWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.newsId) {
      where.newsId = params.newsId;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.search && params.search.trim()) {
      where.content = { contains: params.search.trim(), mode: 'insensitive' };
    }

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          news: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
    ]);

    return {
      comments: comments.map((c) => this.formatComment(c)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Super Admin: Moderate comment (approve, reject, flag, delete)
   */
  public static async adminModerateComment(
    commentId: string,
    adminId: string,
    payload: AdminCommentModerationPayload
  ): Promise<CommentResponseDTO> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    const isDeleted = payload.status === CommentStatus.DELETED;

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: payload.status,
        deletedAt: isDeleted ? new Date() : comment.deletedAt,
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return this.formatComment(updated);
  }

  /**
   * Super Admin: Hide Comment (POST /api/v1/admin/comments/:id/hide)
   */
  public static async hideComment(id: string, adminId: string, reason?: string): Promise<CommentResponseDTO> {
    return this.adminModerateComment(id, adminId, {
      status: CommentStatus.FLAGGED,
      moderationRemarks: reason || 'Hidden by Administrator',
    });
  }

  /**
   * Super Admin: Restore Comment (POST /api/v1/admin/comments/:id/restore)
   */
  public static async restoreComment(id: string, adminId: string): Promise<CommentResponseDTO> {
    return this.adminModerateComment(id, adminId, {
      status: CommentStatus.APPROVED,
      moderationRemarks: 'Restored by Administrator',
    });
  }

  /**
   * Super Admin: Reject Comment (POST /api/v1/admin/comments/:id/reject)
   */
  public static async rejectComment(id: string, adminId: string, reason?: string): Promise<CommentResponseDTO> {
    return this.adminModerateComment(id, adminId, {
      status: CommentStatus.REJECTED,
      moderationRemarks: reason || 'Rejected by Administrator due to policy violation',
    });
  }
}
