import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { VerificationStatus, VerificationType, NewsStatus } from '@prisma/client';
import { OriginalityEngine } from './originality.engine';
import { FactCheckEngine } from './fact-check.engine';
import {
  VerificationDetailResult,
  VerificationScores,
  OriginalityAnalysis,
  FactCheckAnalysis,
  EditorialDecisionType,
  ClaimStatus,
  VerificationAuditItem,
  ModeratorNoteItem,
} from './verification.types';

export class VerificationService {
  /**
   * Helper: Calculate composite verification score and overall assessment
   */
  private static calculateScores(
    originality: OriginalityAnalysis,
    factCheck: FactCheckAnalysis
  ): VerificationScores {
    const orig = originality.originalityScore;
    const fact = factCheck.factSupportScore;
    const sources = factCheck.sourceCoverageScore;

    const overallScore = Math.round(orig * 0.35 + fact * 0.45 + sources * 0.2);

    let overallAssessment: 'VERIFIED' | 'REVIEW_REQUIRED' | 'NEEDS_REVISION' | 'FAILED' = 'REVIEW_REQUIRED';

    if (originality.duplicateLevel === 'EXACT_DUPLICATE') {
      overallAssessment = 'FAILED';
    } else if (orig >= 75 && fact >= 75 && sources >= 60) {
      overallAssessment = 'VERIFIED';
    } else if (orig < 50 || factCheck.claims.some((c) => c.status === 'CONTRADICTED')) {
      overallAssessment = 'NEEDS_REVISION';
    } else {
      overallAssessment = 'REVIEW_REQUIRED';
    }

    return {
      originality: orig,
      factSupport: fact,
      sourceCoverage: sources,
      overallScore,
      overallAssessment,
    };
  }

  /**
   * Helper: Parse findings JSON safely
   */
  private static parseFindings(findingsText: string | null) {
    if (!findingsText) return null;
    try {
      return JSON.parse(findingsText);
    } catch {
      return null;
    }
  }

  /**
   * Helper: Format a VerificationRecord into VerificationDetailResult
   */
  private static formatResult(record: any, isStaff: boolean): VerificationDetailResult {
    const parsed = this.parseFindings(record.findings) || {};

    const originality: OriginalityAnalysis = parsed.originality || {
      originalityScore: 100,
      similarityScore: 0,
      duplicateLevel: 'LOW_SIMILARITY',
      matchAreas: [],
      similarArticles: [],
      analyzedAt: record.createdAt.toISOString(),
    };

    const factCheck: FactCheckAnalysis = parsed.factCheck || {
      factSupportScore: 100,
      sourceCoverageScore: 100,
      claims: [],
      identifiedSourcesCount: 0,
      analyzedAt: record.createdAt.toISOString(),
    };

    const scores: VerificationScores = parsed.scores || this.calculateScores(originality, factCheck);
    const auditTrail: VerificationAuditItem[] = parsed.auditTrail || [];
    const moderatorNotes: ModeratorNoteItem[] = isStaff ? parsed.moderatorNotes || [] : [];
    const editorialDecision = parsed.editorialDecision || null;

    const primaryCategory = record.news?.categories?.find((c: any) => c.isPrimary)?.category || record.news?.categories?.[0]?.category || null;
    const primaryLocation = record.news?.locations?.find((l: any) => l.isPrimary)?.location || record.news?.locations?.[0]?.location || null;

    return {
      id: record.id,
      newsId: record.newsId,
      article: {
        id: record.news?.id,
        title: record.news?.title,
        slug: record.news?.slug,
        shortDescription: record.news?.shortDescription,
        content: record.news?.content,
        status: record.news?.status,
        author: {
          id: record.news?.author?.id,
          fullName: record.news?.author?.fullName,
          email: record.news?.author?.email,
          avatarUrl: record.news?.author?.avatarUrl,
        },
        category: primaryCategory ? { id: primaryCategory.id, name: primaryCategory.name } : null,
        location: primaryLocation ? { id: primaryLocation.id, name: primaryLocation.name } : null,
        createdAt: record.news?.createdAt,
        publishedAt: record.news?.publishedAt,
      },
      status: record.status,
      verificationType: record.verificationType,
      scores,
      originality,
      factCheck,
      editorialDecision,
      moderatorNotes,
      auditTrail,
      verifiedAt: record.verifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Request / Run Verification on an article
   */
  public static async requestVerification(
    newsId: string,
    verificationType: VerificationType = 'FACT_CHECK',
    requestedByUserId: string
  ): Promise<VerificationDetailResult> {
    const article = await prisma.news.findUnique({
      where: { id: newsId },
      include: {
        author: true,
        categories: { include: { category: true } },
        locations: { include: { location: true } },
      },
    });

    if (!article) {
      throw new AppError('News article not found', 404, 'NEWS_NOT_FOUND');
    }

    const requester = await prisma.user.findUnique({ where: { id: requestedByUserId } });
    const actorName = requester?.fullName || 'System Automated Desk';

    const nowIso = new Date().toISOString();
    const auditTrail: VerificationAuditItem[] = [
      {
        timestamp: nowIso,
        stage: 'REQUESTED',
        action: 'Verification initiated',
        actorName,
        details: `Requested ${verificationType} analysis`,
      },
    ];

    // 1. Run Originality Engine
    const originality = await OriginalityEngine.analyzeArticle(article.id, article.title, article.content);
    auditTrail.push({
      timestamp: new Date().toISOString(),
      stage: 'ORIGINALITY',
      action: 'Originality analysis completed',
      actorName: 'Algorithmic Engine',
      details: `Originality Score: ${originality.originalityScore}%, Classification: ${originality.duplicateLevel}`,
    });

    // 2. Run Fact Check Engine
    const factCheck = await FactCheckEngine.analyzeArticle(article.id, article.title, article.content);
    auditTrail.push({
      timestamp: new Date().toISOString(),
      stage: 'FACT_CHECK',
      action: 'Fact claim extraction and evidence cross-check completed',
      actorName: 'Verification Engine',
      details: `Fact Support: ${factCheck.factSupportScore}%, Claims extracted: ${factCheck.claims.length}`,
    });

    // 3. Calculate Scores & Status
    const scores = this.calculateScores(originality, factCheck);
    let recordStatus: VerificationStatus = 'IN_REVIEW';
    if (scores.overallAssessment === 'VERIFIED') {
      recordStatus = 'VERIFIED';
    } else if (scores.overallAssessment === 'FAILED') {
      recordStatus = 'REJECTED';
    } else if (scores.overallAssessment === 'NEEDS_REVISION') {
      recordStatus = 'PARTIALLY_VERIFIED';
    }

    const findingsPayload = {
      originality,
      factCheck,
      scores,
      moderatorNotes: [],
      editorialDecision: null,
      auditTrail,
    };

    // Check if verification record already exists for this news
    let record = await prisma.verificationRecord.findFirst({
      where: { newsId },
      orderBy: { createdAt: 'desc' },
    });

    if (record) {
      record = await prisma.verificationRecord.update({
        where: { id: record.id },
        data: {
          status: recordStatus,
          verificationType,
          findings: JSON.stringify(findingsPayload),
          evidence: JSON.stringify({ sources: factCheck.claims.flatMap((c) => c.evidence) }),
          verifiedAt: recordStatus === 'VERIFIED' ? new Date() : null,
        },
        include: {
          news: {
            include: {
              author: true,
              categories: { include: { category: true } },
              locations: { include: { location: true } },
            },
          },
        },
      });
    } else {
      record = await prisma.verificationRecord.create({
        data: {
          newsId,
          verifierId: requestedByUserId,
          status: recordStatus,
          verificationType,
          findings: JSON.stringify(findingsPayload),
          evidence: JSON.stringify({ sources: factCheck.claims.flatMap((c) => c.evidence) }),
          verifiedAt: recordStatus === 'VERIFIED' ? new Date() : null,
        },
        include: {
          news: {
            include: {
              author: true,
              categories: { include: { category: true } },
              locations: { include: { location: true } },
            },
          },
        },
      });
    }

    return this.formatResult(record, true);
  }

  /**
   * Get verification status by ID or news ID
   */
  public static async getVerificationStatus(identifier: string): Promise<{
    id: string;
    newsId: string;
    status: VerificationStatus;
    overallScore: number;
    assessment: string;
    updatedAt: Date;
  }> {
    const record = await prisma.verificationRecord.findFirst({
      where: {
        OR: [{ id: identifier }, { newsId: identifier }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    }

    const parsed = this.parseFindings(record.findings) || {};
    const scores = parsed.scores || { overallScore: 70, overallAssessment: 'REVIEW_REQUIRED' };

    return {
      id: record.id,
      newsId: record.newsId,
      status: record.status,
      overallScore: scores.overallScore,
      assessment: scores.overallAssessment,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Get full verification result
   */
  public static async getVerificationResult(
    recordIdOrNewsId: string,
    isStaff: boolean,
    userId?: string
  ): Promise<VerificationDetailResult> {
    const record = await prisma.verificationRecord.findFirst({
      where: {
        OR: [{ id: recordIdOrNewsId }, { newsId: recordIdOrNewsId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        news: {
          include: {
            author: true,
            categories: { include: { category: true } },
            locations: { include: { location: true } },
          },
        },
      },
    });

    if (!record) {
      throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    }

    // Security guard: If user is not staff, verify they are the author of the article
    if (!isStaff && userId && record.news?.authorId !== userId) {
      throw new AppError('Unauthorized to inspect this verification report', 403, 'FORBIDDEN');
    }

    return this.formatResult(record, isStaff);
  }

  /**
   * Contributor: Get own verification history
   */
  public static async getMyVerificationHistory(userId: string): Promise<any[]> {
    const records = await prisma.verificationRecord.findMany({
      where: {
        news: { authorId: userId },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        news: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            createdAt: true,
            publishedAt: true,
          },
        },
      },
    });

    return records.map((rec) => {
      const parsed = this.parseFindings(rec.findings) || {};
      const scores = parsed.scores || { originality: 85, factSupport: 80, overallScore: 82, overallAssessment: 'REVIEW_REQUIRED' };
      const decision = parsed.editorialDecision || null;

      return {
        id: rec.id,
        newsId: rec.newsId,
        title: rec.news.title,
        slug: rec.news.slug,
        newsStatus: rec.news.status,
        verificationStatus: rec.status,
        scores,
        editorialDecision: decision?.decision || null,
        requiredChanges: decision?.requiredChanges || null,
        updatedAt: rec.updatedAt,
      };
    });
  }

  /**
   * Super Admin: Get verification dashboard metric counters
   */
  public static async getAdminDashboard(): Promise<{
    pendingCount: number;
    inReviewCount: number;
    verifiedCount: number;
    needsRevisionCount: number;
    rejectedCount: number;
    totalCount: number;
    highSimilarityAlertsCount: number;
  }> {
    const [pending, inReview, verified, partiallyVerified, rejected, allRecords] = await Promise.all([
      prisma.verificationRecord.count({ where: { status: 'PENDING' } }),
      prisma.verificationRecord.count({ where: { status: 'IN_REVIEW' } }),
      prisma.verificationRecord.count({ where: { status: 'VERIFIED' } }),
      prisma.verificationRecord.count({ where: { status: 'PARTIALLY_VERIFIED' } }),
      prisma.verificationRecord.count({ where: { status: 'REJECTED' } }),
      prisma.verificationRecord.findMany({
        select: { findings: true },
        take: 200,
      }),
    ]);

    let highSimilarityAlertsCount = 0;
    allRecords.forEach((r) => {
      const parsed = this.parseFindings(r.findings);
      if (parsed?.originality?.duplicateLevel === 'HIGHLY_SIMILAR' || parsed?.originality?.duplicateLevel === 'EXACT_DUPLICATE') {
        highSimilarityAlertsCount++;
      }
    });

    return {
      pendingCount: pending,
      inReviewCount: inReview,
      verifiedCount: verified,
      needsRevisionCount: partiallyVerified,
      rejectedCount: rejected,
      totalCount: pending + inReview + verified + partiallyVerified + rejected,
      highSimilarityAlertsCount,
    };
  }

  /**
   * Super Admin: Get paginated verification queue with filters
   */
  public static async getAdminVerificationQueue(params: {
    status?: string;
    type?: string;
    priority?: string;
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
      where.status = params.status as VerificationStatus;
    }
    if (params.type && params.type !== 'ALL') {
      where.verificationType = params.type as VerificationType;
    }
    if (params.search && params.search.trim() !== '') {
      where.news = {
        title: { contains: params.search.trim(), mode: 'insensitive' },
      };
    }

    const [total, records] = await Promise.all([
      prisma.verificationRecord.count({ where }),
      prisma.verificationRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          news: {
            include: {
              author: { select: { id: true, fullName: true, email: true } },
              categories: { include: { category: true } },
              locations: { include: { location: true } },
            },
          },
        },
      }),
    ]);

    const items = records.map((rec) => {
      const parsed = this.parseFindings(rec.findings) || {};
      const scores = parsed.scores || { originality: 85, factSupport: 80, overallScore: 82, overallAssessment: 'REVIEW_REQUIRED' };
      const originality = parsed.originality || { duplicateLevel: 'LOW_SIMILARITY', similarityScore: 0 };
      const claimsCount = parsed.factCheck?.claims?.length || 0;

      return {
        id: rec.id,
        newsId: rec.newsId,
        articleTitle: rec.news?.title,
        articleSlug: rec.news?.slug,
        articleStatus: rec.news?.status,
        author: rec.news?.author,
        verificationStatus: rec.status,
        verificationType: rec.verificationType,
        originalityScore: scores.originality,
        factSupportScore: scores.factSupport,
        overallScore: scores.overallScore,
        duplicateLevel: originality.duplicateLevel,
        claimsCount,
        updatedAt: rec.updatedAt,
      };
    });

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
   * Super Admin: Review and override individual claim status
   */
  public static async reviewClaim(
    recordId: string,
    claimId: string,
    decision: ClaimStatus,
    adminNotes: string | undefined,
    adminId: string
  ): Promise<VerificationDetailResult> {
    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId },
      include: { news: true },
    });

    if (!record) {
      throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const adminName = admin?.fullName || 'Super Admin';

    const parsed = this.parseFindings(record.findings) || {};
    const claims: any[] = parsed.factCheck?.claims || [];

    const targetClaim = claims.find((c) => c.id === claimId);
    if (!targetClaim) {
      throw new AppError(`Claim with ID "${claimId}" not found`, 404, 'CLAIM_NOT_FOUND');
    }

    targetClaim.adminDecision = decision;
    targetClaim.status = decision;
    if (adminNotes) {
      targetClaim.adminNotes = adminNotes;
    }

    // Recompute factSupportScore based on overrides
    let supported = 0;
    claims.forEach((c) => {
      if (c.status === 'SUPPORTED') supported++;
      else if (c.status === 'PARTIALLY_SUPPORTED') supported += 0.5;
    });
    parsed.factCheck.factSupportScore = Math.min(100, Math.round((supported / Math.max(1, claims.length)) * 100));

    // Recompute overall scores
    parsed.scores = this.calculateScores(parsed.originality, parsed.factCheck);

    // Append to audit trail
    parsed.auditTrail = parsed.auditTrail || [];
    parsed.auditTrail.push({
      timestamp: new Date().toISOString(),
      stage: 'CLAIM_REVIEW',
      action: `Admin updated claim #${claimId} to ${decision}`,
      actorName: adminName,
      details: adminNotes || undefined,
    });

    const updated = await prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        findings: JSON.stringify(parsed),
        status: parsed.scores.overallAssessment === 'VERIFIED' ? 'VERIFIED' : record.status,
      },
      include: {
        news: {
          include: {
            author: true,
            categories: { include: { category: true } },
            locations: { include: { location: true } },
          },
        },
      },
    });

    return this.formatResult(updated, true);
  }

  /**
   * Super Admin: Submit editorial decision (Approve, Request Revision, Reject)
   */
  public static async submitEditorialDecision(
    recordId: string,
    decision: EditorialDecisionType,
    comments: string | undefined,
    requiredChanges: string | undefined,
    adminId: string
  ): Promise<VerificationDetailResult> {
    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId },
      include: { news: true },
    });

    if (!record) {
      throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const adminName = admin?.fullName || 'Super Admin';

    const parsed = this.parseFindings(record.findings) || {};

    parsed.editorialDecision = {
      decision,
      decidedBy: adminId,
      decidedByName: adminName,
      decidedAt: new Date().toISOString(),
      comments: comments || undefined,
      requiredChanges: requiredChanges || undefined,
    };

    let newRecordStatus: VerificationStatus = 'IN_REVIEW';
    let newNewsStatus: NewsStatus = record.news.status;

    if (decision === 'APPROVE') {
      newRecordStatus = 'VERIFIED';
      newNewsStatus = NewsStatus.PUBLISHED; // Live publish
    } else if (decision === 'REQUEST_REVISION') {
      newRecordStatus = 'PARTIALLY_VERIFIED';
      newNewsStatus = NewsStatus.DRAFT;
    } else if (decision === 'REJECT') {
      newRecordStatus = 'REJECTED';
      newNewsStatus = NewsStatus.REJECTED;
    }

    parsed.auditTrail = parsed.auditTrail || [];
    parsed.auditTrail.push({
      timestamp: new Date().toISOString(),
      stage: 'EDITORIAL_DECISION',
      action: `Editorial decision submitted: ${decision}`,
      actorName: adminName,
      details: comments ? `Remarks: ${comments}` : undefined,
    });

    // Update VerificationRecord and News article in a transaction
    const [updatedRecord] = await prisma.$transaction([
      prisma.verificationRecord.update({
        where: { id: recordId },
        data: {
          status: newRecordStatus,
          findings: JSON.stringify(parsed),
          verifiedAt: decision === 'APPROVE' ? new Date() : record.verifiedAt,
        },
        include: {
          news: {
            include: {
              author: true,
              categories: { include: { category: true } },
              locations: { include: { location: true } },
            },
          },
        },
      }),
      prisma.news.update({
        where: { id: record.newsId },
        data: {
          status: newNewsStatus,
          publishedAt: decision === 'APPROVE' ? new Date() : record.news.publishedAt,
        },
      }),
    ]);

    return this.formatResult(updatedRecord, true);
  }

  /**
   * Super Admin: Add internal moderator note
   */
  public static async addModeratorNote(
    recordId: string,
    content: string,
    adminId: string
  ): Promise<VerificationDetailResult> {
    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const adminName = admin?.fullName || 'Super Admin';

    const parsed = this.parseFindings(record.findings) || {};
    parsed.moderatorNotes = parsed.moderatorNotes || [];

    const noteItem: ModeratorNoteItem = {
      id: `note-${Date.now()}`,
      authorId: adminId,
      authorName: adminName,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    parsed.moderatorNotes.push(noteItem);

    parsed.auditTrail = parsed.auditTrail || [];
    parsed.auditTrail.push({
      timestamp: new Date().toISOString(),
      stage: 'MODERATOR_NOTE',
      action: 'Internal moderator note added',
      actorName: adminName,
    });

    const updated = await prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        findings: JSON.stringify(parsed),
      },
      include: {
        news: {
          include: {
            author: true,
            categories: { include: { category: true } },
            locations: { include: { location: true } },
          },
        },
      },
    });

    return this.formatResult(updated, true);
  }
}
