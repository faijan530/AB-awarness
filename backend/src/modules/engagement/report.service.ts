import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { ReportReason, ReportStatus, CommentStatus, NewsStatus } from '@prisma/client';
import {
  CreateReportPayload,
  ReportResponseDTO,
  AdminReportQueryParams,
  AdminReportResolvePayload,
} from './engagement.types';

export class ReportService {
  /**
   * Helper to map Prisma ContentReport to clean DTO
   */
  private static formatReport(report: any): ReportResponseDTO {
    return {
      id: report.id,
      reporterId: report.reporterId,
      targetType: report.newsId ? 'NEWS' : 'COMMENT',
      targetId: report.newsId || report.commentId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      resolutionNote: report.resolutionNote,
      createdAt: report.createdAt,
      reporter: report.reporter
        ? {
            id: report.reporter.id,
            fullName: report.reporter.fullName,
            email: report.reporter.email,
          }
        : undefined,
      news: report.news
        ? {
            id: report.news.id,
            title: report.news.title,
            slug: report.news.slug,
          }
        : null,
      comment: report.comment
        ? {
            id: report.comment.id,
            content: report.comment.content,
          }
        : null,
    };
  }

  /**
   * Report an article (POST /api/v1/news/:newsId/report)
   */
  public static async reportNews(
    reporterId: string,
    newsId: string,
    payload: CreateReportPayload
  ): Promise<ReportResponseDTO> {
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!news || news.deletedAt) {
      throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');
    }

    // Check duplicate pending reports
    const existing = await prisma.contentReport.findFirst({
      where: {
        reporterId,
        newsId,
        status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
      },
    });

    if (existing) {
      throw new AppError(
        'You have already submitted a pending report for this news article',
        400,
        'DUPLICATE_REPORT'
      );
    }

    const reasonVal = (payload.reason in ReportReason)
      ? (payload.reason as ReportReason)
      : ReportReason.OTHER;

    const report = await prisma.contentReport.create({
      data: {
        reporterId,
        newsId,
        reason: reasonVal,
        description: payload.description?.trim() || null,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        news: { select: { id: true, title: true, slug: true } },
      },
    });

    return this.formatReport(report);
  }

  /**
   * Report a comment (POST /api/v1/comments/:commentId/report)
   */
  public static async reportComment(
    reporterId: string,
    commentId: string,
    payload: CreateReportPayload
  ): Promise<ReportResponseDTO> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, newsId: true, deletedAt: true },
    });

    if (!comment || comment.deletedAt) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    // Check duplicate pending reports
    const existing = await prisma.contentReport.findFirst({
      where: {
        reporterId,
        commentId,
        status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
      },
    });

    if (existing) {
      throw new AppError(
        'You have already submitted a pending report for this comment',
        400,
        'DUPLICATE_REPORT'
      );
    }

    const reasonVal = (payload.reason in ReportReason)
      ? (payload.reason as ReportReason)
      : ReportReason.OTHER;

    const report = await prisma.contentReport.create({
      data: {
        reporterId,
        commentId,
        reason: reasonVal,
        description: payload.description?.trim() || null,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    return this.formatReport(report);
  }

  /**
   * Super Admin: Get report queue
   */
  public static async getReports(params: AdminReportQueryParams): Promise<{
    items: ReportResponseDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, params.page || 1);
    const limitNum = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.reason) where.reason = params.reason;

    if (params.targetType === 'NEWS') {
      where.newsId = { not: null };
    } else if (params.targetType === 'COMMENT') {
      where.commentId = { not: null };
    }

    if (params.search && params.search.trim()) {
      where.OR = [
        { description: { contains: params.search.trim(), mode: 'insensitive' } },
        { news: { title: { contains: params.search.trim(), mode: 'insensitive' } } },
        { comment: { content: { contains: params.search.trim(), mode: 'insensitive' } } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.contentReport.count({ where }),
      prisma.contentReport.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          reviewer: { select: { id: true, fullName: true } },
          news: { select: { id: true, title: true, slug: true } },
          comment: { select: { id: true, content: true } },
        },
      }),
    ]);

    return {
      items: reports.map((r) => this.formatReport(r)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Super Admin: Get specific report details
   */
  public static async getReportById(id: string): Promise<ReportResponseDTO> {
    const report = await prisma.contentReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
        news: { select: { id: true, title: true, slug: true, status: true } },
        comment: { select: { id: true, content: true, status: true } },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    return this.formatReport(report);
  }

  /**
   * Super Admin: Start review of report (moves to UNDER_REVIEW)
   */
  public static async reviewReport(id: string, adminId: string): Promise<ReportResponseDTO> {
    const report = await prisma.contentReport.findUnique({ where: { id } });
    if (!report) throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');

    const updated = await prisma.contentReport.update({
      where: { id },
      data: {
        status: ReportStatus.UNDER_REVIEW,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
        news: { select: { id: true, title: true, slug: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    return this.formatReport(updated);
  }

  /**
   * Super Admin: Resolve report with resolution action
   */
  public static async resolveReport(
    id: string,
    adminId: string,
    payload: AdminReportResolvePayload
  ): Promise<ReportResponseDTO> {
    const report = await prisma.contentReport.findUnique({
      where: { id },
      include: { news: true, comment: true },
    });

    if (!report) throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');

    const resolution = payload.resolution || 'RESOLVED';
    const note = payload.note || `Resolved with action: ${resolution}`;

    // Apply action on target if applicable
    if (resolution === 'COMMENT_HIDDEN' && report.commentId) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { status: CommentStatus.FLAGGED },
      }).catch(() => {});
    } else if (resolution === 'CONTENT_HIDDEN' && report.newsId) {
      await prisma.news.update({
        where: { id: report.newsId },
        data: { status: NewsStatus.ARCHIVED },
      }).catch(() => {});
    }

    const updated = await prisma.contentReport.update({
      where: { id },
      data: {
        status: ReportStatus.RESOLVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resolutionNote: note,
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
        news: { select: { id: true, title: true, slug: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    return this.formatReport(updated);
  }

  /**
   * Super Admin: Dismiss report
   */
  public static async dismissReport(
    id: string,
    adminId: string,
    note?: string
  ): Promise<ReportResponseDTO> {
    const report = await prisma.contentReport.findUnique({ where: { id } });
    if (!report) throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');

    const updated = await prisma.contentReport.update({
      where: { id },
      data: {
        status: ReportStatus.DISMISSED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resolutionNote: note || 'Dismissed: Content does not violate platform rules',
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
        news: { select: { id: true, title: true, slug: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    return this.formatReport(updated);
  }
}
