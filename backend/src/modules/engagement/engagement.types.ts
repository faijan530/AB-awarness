import { CommentStatus, ReactionType, ReportReason, ReportStatus } from '@prisma/client';

export interface CreateCommentPayload {
  content: string;
  parentId?: string;
}

export interface UpdateCommentPayload {
  content: string;
}

export interface CommentUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface CommentResponseDTO {
  id: string;
  newsId: string;
  userId: string;
  user: CommentUserSummary;
  parentId: string | null;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  likeCount?: number;
  replyCount?: number;
  replies?: CommentResponseDTO[];
}

export interface CommentListResponse {
  comments: CommentResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ToggleReactionPayload {
  type?: ReactionType;
}

export interface ReactionSummaryDTO {
  newsId: string;
  totalReactions: number;
  counts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
}

export interface BookmarkResponseDTO {
  id: string;
  newsId: string;
  userId: string;
  createdAt: Date;
  news?: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    coverImageUrl: string | null;
    publishedAt: Date | null;
    category?: { id: string; name: string; slug: string } | null;
    location?: { id: string; name: string; slug: string } | null;
    author?: { id: string; fullName: string } | null;
  };
}

export interface BookmarkListResponse {
  bookmarks: BookmarkResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminCommentQueryParams {
  status?: CommentStatus;
  newsId?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminCommentModerationPayload {
  status: CommentStatus;
  moderationRemarks?: string;
  reason?: string;
}

// Module 9: Reports & Moderation Queue Types
export type ReportTargetType = 'NEWS' | 'COMMENT';

export interface CreateReportPayload {
  reason: ReportReason | string;
  description?: string;
}

export interface ReportResponseDTO {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolutionNote: string | null;
  createdAt: Date;
  reporter?: {
    id: string;
    fullName: string;
    email: string | null;
  };
  news?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  comment?: {
    id: string;
    content: string;
  } | null;
}

export interface AdminReportQueryParams {
  targetType?: ReportTargetType;
  reason?: ReportReason;
  status?: ReportStatus;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminReportResolvePayload {
  resolution: string;
  note?: string;
}

// Module 9: Share Tracking & Analytics Types
export type SharePlatform = 'WHATSAPP' | 'FACEBOOK' | 'X' | 'TELEGRAM' | 'COPY_LINK' | 'OTHER';

export interface RecordSharePayload {
  platform: SharePlatform;
}

export interface ShareResponseDTO {
  newsId: string;
  platform: SharePlatform;
  shareCount: number;
}

// Module 9: User Engagement Summary
export interface UserEngagementSummaryDTO {
  commentsCount: number;
  bookmarksCount: number;
  reactionsCount: number;
  reportsCount: number;
}
