import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { ReportStatus, NewsStatus } from '@prisma/client';
import { ModerationActionType } from './verification.types';

export class ModerationService {
  /**
   * Super Admin: Get unified Moderation Queue
   */
  public static async getModerationQueue(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as ReportStatus;
    }
    if (params.search && params.search.trim() !== '') {
      where.OR = [
        { news: { title: { contains: params.search.trim(), mode: 'insensitive' } } },
        { description: { contains: params.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.contentReport.count({ where }),
      prisma.contentReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          reviewer: { select: { id: true, fullName: true } },
          news: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              author: { select: { id: true, fullName: true } },
            },
          },
          comment: {
            select: { id: true, content: true, user: { select: { fullName: true } } },
          },
        },
      }),
    ]);

    const items = reports.map((r) => ({
      id: r.id,
      targetType: r.newsId ? 'NEWS_ARTICLE' : 'COMMENT',
      targetTitle: r.news?.title || r.comment?.content?.slice(0, 60) || 'Unknown Content',
      targetSlug: r.news?.slug || null,
      targetStatus: r.news?.status || null,
      authorName: r.news?.author?.fullName || r.comment?.user?.fullName || 'Contributor',
      reason: r.reason,
      description: r.description,
      status: r.status,
      reporterName: r.reporter?.fullName || 'Citizen Reporter',
      reviewerName: r.reviewer?.fullName || null,
      reviewedAt: r.reviewedAt,
      resolutionNote: r.resolutionNote,
      createdAt: r.createdAt,
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Super Admin: Get Moderation Item Detail
   */
  public static async getModerationDetail(id: string): Promise<any> {
    const report = await prisma.contentReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
        news: {
          include: {
            author: { select: { id: true, fullName: true, email: true } },
            verifications: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        comment: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Moderation report not found', 404, 'REPORT_NOT_FOUND');
    }

    return report;
  }

  /**
   * Super Admin: Take Moderation Action on Content
   */
  public static async takeModerationAction(
    id: string,
    action: ModerationActionType,
    reason: string | undefined,
    resolutionNote: string | undefined,
    adminId: string
  ): Promise<any> {
    const report = await prisma.contentReport.findUnique({
      where: { id },
      include: { news: true, comment: true },
    });

    if (!report) {
      throw new AppError('Moderation report not found', 404, 'REPORT_NOT_FOUND');
    }

    let reportStatus: ReportStatus = ReportStatus.RESOLVED;

    if (action === 'ESCALATE') {
      reportStatus = ReportStatus.UNDER_REVIEW;
    } else if (action === 'REJECT') {
      reportStatus = ReportStatus.DISMISSED;
    }

    // Apply action to targeted news article if present
    if (report.newsId && report.news) {
      if (action === 'HIDE') {
        await prisma.news.update({
          where: { id: report.newsId },
          data: { status: NewsStatus.ARCHIVED },
        });
      } else if (action === 'RESTORE' || action === 'APPROVE') {
        await prisma.news.update({
          where: { id: report.newsId },
          data: { status: NewsStatus.PUBLISHED },
        });
      } else if (action === 'REQUEST_REVISION') {
        await prisma.news.update({
          where: { id: report.newsId },
          data: { status: NewsStatus.DRAFT },
        });
      }
    }

    // Update the ContentReport record
    const updatedReport = await prisma.contentReport.update({
      where: { id },
      data: {
        status: reportStatus,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resolutionNote: resolutionNote || reason || `Action taken: ${action}`,
      },
      include: {
        reporter: true,
        reviewer: true,
        news: true,
      },
    });

    return updatedReport;
  }
}
