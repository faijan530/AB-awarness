import { VerificationStatus, VerificationType } from '@prisma/client';

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
  publishedAt?: Date | null;
}

export interface OriginalityAnalysis {
  originalityScore: number; // 0 - 100%
  similarityScore: number;  // 0 - 100%
  duplicateLevel: DuplicateClassification;
  matchAreas: string[];     // e.g. ['Headline', 'Paragraph 2', 'Paragraph 5']
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
  confidenceScore: number; // 0 - 100%
  evidence: ClaimEvidence[];
  adminNotes?: string;
}

export interface FactCheckAnalysis {
  factSupportScore: number;   // 0 - 100%
  sourceCoverageScore: number; // 0 - 100%
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
    createdAt: Date;
    publishedAt?: Date | null;
  };
  status: VerificationStatus;
  verificationType: VerificationType;
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
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestVerificationPayload {
  newsId: string;
  verificationType?: VerificationType;
}

export interface ReviewClaimPayload {
  claimId: string;
  decision: ClaimStatus;
  adminNotes?: string;
}

export interface EditorialDecisionPayload {
  decision: EditorialDecisionType;
  comments?: string;
  requiredChanges?: string;
}

export interface ModerationActionPayload {
  action: ModerationActionType;
  reason?: string;
  resolutionNote?: string;
}

export interface AddModeratorNotePayload {
  content: string;
}
