import { apiClient } from './api-client';

export type DuplicateClassification = 'LOW_SIMILARITY' | 'RELATED_STORY' | 'HIGHLY_SIMILAR' | 'EXACT_DUPLICATE';
export type ClaimStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNVERIFIED' | 'CONTRADICTED' | 'NEEDS_REVIEW';
export type EditorialDecisionType = 'APPROVE' | 'REQUEST_REVISION' | 'REJECT';
export type ModerationActionType = 'APPROVE' | 'REJECT' | 'REQUEST_REVISION' | 'HIDE' | 'RESTORE' | 'ESCALATE';

export interface SimilarStoryMatch {
  articleId: string;
  title: string;
  slug: string;
  similarityScore: number;
  duplicateLevel: DuplicateClassification;
  matchedPassages: {
    submittedSnippet: string;
    matchedSnippet: string;
    similarity: number;
  }[];
  authorName?: string;
  publishedAt?: string | null;
}

export interface OriginalityAnalysis {
  originalityScore: number;
  similarityScore: number;
  duplicateLevel: DuplicateClassification;
  matchAreas: string[];
  similarArticles: SimilarStoryMatch[];
  analyzedAt: string;
}

export interface ClaimEvidence {
  sourceId?: string;
  sourceName: string;
  sourceType: string;
  referenceUrl?: string;
  reliability: string;
  notes?: string;
  assessment: 'SUPPORTS' | 'DISPUTES' | 'NEUTRAL';
}

export interface FactClaim {
  id: string;
  claimText: string;
  status: ClaimStatus;
  systemAssessment: ClaimStatus;
  adminDecision?: ClaimStatus;
  confidenceScore: number;
  evidence: ClaimEvidence[];
  adminNotes?: string;
}

export interface FactCheckAnalysis {
  factSupportScore: number;
  sourceCoverageScore: number;
  claims: FactClaim[];
  identifiedSourcesCount: number;
  analyzedAt: string;
}

export interface VerificationScores {
  originality: number;
  factSupport: number;
  sourceCoverage: number;
  overallScore: number;
  overallAssessment: 'VERIFIED' | 'REVIEW_REQUIRED' | 'NEEDS_REVISION' | 'FAILED';
}

export interface ModeratorNoteItem {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface VerificationAuditItem {
  timestamp: string;
  stage: string;
  action: string;
  actorName: string;
  details?: string;
}

export interface VerificationDetailResult {
  id: string;
  newsId: string;
  article: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string | null;
    content: string;
    status: string;
    author: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl?: string | null;
    };
    category?: { id: string; name: string } | null;
    location?: { id: string; name: string } | null;
    createdAt: string;
    publishedAt?: string | null;
  };
  status: string;
  verificationType: string;
  scores: VerificationScores;
  originality: OriginalityAnalysis;
  factCheck: FactCheckAnalysis;
  editorialDecision?: {
    decision: EditorialDecisionType;
    decidedBy: string;
    decidedByName: string;
    decidedAt: string;
    comments?: string;
    requiredChanges?: string;
  } | null;
  moderatorNotes: ModeratorNoteItem[];
  auditTrail: VerificationAuditItem[];
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationDashboardMetrics {
  pendingCount: number;
  inReviewCount: number;
  verifiedCount: number;
  needsRevisionCount: number;
  rejectedCount: number;
  totalCount: number;
  highSimilarityAlertsCount: number;
}

export interface VerificationQueueItem {
  id: string;
  newsId: string;
  articleTitle: string;
  articleSlug: string;
  articleStatus: string;
  author?: { id: string; fullName: string; email: string };
  verificationStatus: string;
  verificationType: string;
  originalityScore: number;
  factSupportScore: number;
  overallScore: number;
  duplicateLevel: DuplicateClassification;
  claimsCount: number;
  updatedAt: string;
}

export interface ModerationQueueItem {
  id: string;
  targetType: 'NEWS_ARTICLE' | 'COMMENT';
  targetTitle: string;
  targetSlug?: string | null;
  targetStatus?: string | null;
  authorName: string;
  reason: string;
  description?: string | null;
  status: string;
  reporterName: string;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
}

export class VerificationService {
  /**
   * Contributor / User: Initiate verification on an article
   */
  public static async requestVerification(newsId: string, verificationType = 'FACT_CHECK'): Promise<VerificationDetailResult> {
    const response = await apiClient.post<VerificationDetailResult>('/verification/request', {
      newsId,
      verificationType,
    });
    return (response as any).data || response;
  }

  /**
   * Contributor / User: Get real-time status of verification
   */
  public static async getVerificationStatus(id: string): Promise<{
    id: string;
    newsId: string;
    status: string;
    overallScore: number;
    assessment: string;
    updatedAt: string;
  }> {
    const response = await apiClient.get<any>(`/verification/status/${id}`);
    return (response as any).data || response;
  }

  /**
   * Contributor / User: Get allowed verification report
   */
  public static async getVerificationResult(id: string): Promise<VerificationDetailResult> {
    const response = await apiClient.get<VerificationDetailResult>(`/verification/result/${id}`);
    return (response as any).data || response;
  }

  /**
   * Contributor: Get own verification history
   */
  public static async getMyVerificationHistory(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/verification/my-history');
    return (response as any).data || response;
  }

  /**
   * Super Admin: Get verification dashboard metrics
   */
  public static async getAdminDashboard(): Promise<VerificationDashboardMetrics> {
    const response = await apiClient.get<VerificationDashboardMetrics>('/admin/verification/dashboard');
    return (response as any).data || response;
  }

  /**
   * Super Admin: Get paginated verification queue with filters
   */
  public static async getAdminQueue(params?: {
    status?: string;
    type?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: VerificationQueueItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await apiClient.get<any>('/admin/verification/queue', params);
    const data = (response as any).data || response;
    return {
      items: Array.isArray(data) ? data : data.items || [],
      meta: (response as any).meta || data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  }

  /**
   * Super Admin: Get full verification detail
   */
  public static async getAdminVerificationDetail(id: string): Promise<VerificationDetailResult> {
    const response = await apiClient.get<VerificationDetailResult>(`/admin/verification/${id}`);
    return (response as any).data || response;
  }

  /**
   * Super Admin: Review / override claim status
   */
  public static async reviewClaim(
    recordId: string,
    payload: { claimId: string; decision: ClaimStatus; adminNotes?: string }
  ): Promise<VerificationDetailResult> {
    const response = await apiClient.post<VerificationDetailResult>(
      `/admin/verification/${recordId}/claim-review`,
      payload
    );
    return (response as any).data || response;
  }

  /**
   * Super Admin: Submit editorial decision (Approve, Request Revision, Reject)
   */
  public static async submitEditorialDecision(
    recordId: string,
    payload: { decision: EditorialDecisionType; comments?: string; requiredChanges?: string }
  ): Promise<VerificationDetailResult> {
    const response = await apiClient.post<VerificationDetailResult>(
      `/admin/verification/${recordId}/decision`,
      payload
    );
    return (response as any).data || response;
  }

  /**
   * Super Admin: Add internal moderator note
   */
  public static async addModeratorNote(recordId: string, content: string): Promise<VerificationDetailResult> {
    const response = await apiClient.post<VerificationDetailResult>(
      `/admin/verification/${recordId}/notes`,
      { content }
    );
    return (response as any).data || response;
  }

  /**
   * Super Admin: Get Moderation Queue
   */
  public static async getModerationQueue(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: ModerationQueueItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await apiClient.get<any>('/admin/moderation/queue', params);
    const data = (response as any).data || response;
    return {
      items: Array.isArray(data) ? data : data.items || [],
      meta: (response as any).meta || data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  }

  /**
   * Super Admin: Get Moderation Incident Detail
   */
  public static async getModerationDetail(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/moderation/${id}`);
    return (response as any).data || response;
  }

  /**
   * Super Admin: Apply moderation action
   */
  public static async takeModerationAction(
    id: string,
    payload: { action: ModerationActionType; reason?: string; resolutionNote?: string }
  ): Promise<any> {
    const response = await apiClient.post<any>(`/admin/moderation/${id}/action`, payload);
    return (response as any).data || response;
  }
}
