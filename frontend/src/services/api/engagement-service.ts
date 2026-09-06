import { apiClient } from './api-client';

export type ReactionType = 'LIKE' | 'LOVE' | 'INSIGHTFUL' | 'SAD' | 'ANGRY';
export type CommentStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED' | 'DELETED';
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type SharePlatform = 'WHATSAPP' | 'FACEBOOK' | 'X' | 'TELEGRAM' | 'COPY_LINK' | 'OTHER';

export interface ReactionSummary {
  newsId: string;
  totalReactions: number;
  counts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
}

export interface CommentUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: string;
  newsId: string;
  userId: string;
  user: CommentUser;
  parentId: string | null;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
  replies?: CommentItem[];
}

export interface CommentListResult {
  comments: CommentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BookmarkItem {
  id: string;
  newsId: string;
  userId: string;
  createdAt: string;
  news?: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    publishedAt: string | null;
    category?: { id: string; name: string; slug: string } | null;
    location?: { id: string; name: string; slug: string } | null;
    author?: { id: string; fullName: string } | null;
  };
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'NEWS' | 'COMMENT';
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  reporter?: { id: string; fullName: string; email: string | null };
  news?: { id: string; title: string; slug: string } | null;
  comment?: { id: string; content: string } | null;
}

export interface UserEngagementSummary {
  commentsCount: number;
  bookmarksCount: number;
  reactionsCount: number;
  reportsCount: number;
}

export class EngagementService {
  // ==========================================
  // REACTIONS
  // ==========================================
  public static async getNewsReactions(newsId: string): Promise<ReactionSummary> {
    const res = await apiClient.get<ReactionSummary>(`/news/${newsId}/reactions`);
    return res.data;
  }

  public static async toggleReaction(newsId: string, type: ReactionType = 'LIKE'): Promise<ReactionSummary> {
    const res = await apiClient.post<ReactionSummary>(`/news/${newsId}/reactions`, { type });
    return res.data;
  }

  public static async removeReaction(newsId: string): Promise<ReactionSummary> {
    const res = await apiClient.delete<ReactionSummary>(`/news/${newsId}/reactions`);
    return res.data;
  }

  // ==========================================
  // COMMENTS
  // ==========================================
  public static async getArticleComments(
    newsId: string,
    params?: { page?: number; limit?: number; sort?: 'LATEST' | 'OLDEST' | 'POPULAR' }
  ): Promise<CommentListResult> {
    const res = await apiClient.get<CommentListResult>(`/news/${newsId}/comments`, { params });
    return res.data;
  }

  public static async createComment(newsId: string, content: string): Promise<CommentItem> {
    const res = await apiClient.post<CommentItem>(`/news/${newsId}/comments`, { content });
    return res.data;
  }

  public static async createReply(commentId: string, content: string): Promise<CommentItem> {
    const res = await apiClient.post<CommentItem>(`/comments/${commentId}/replies`, { content });
    return res.data;
  }

  public static async getCommentReplies(
    commentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<CommentListResult> {
    const res = await apiClient.get<CommentListResult>(`/comments/${commentId}/replies`, { params });
    return res.data;
  }

  public static async updateComment(commentId: string, content: string): Promise<CommentItem> {
    const res = await apiClient.patch<CommentItem>(`/comments/${commentId}`, { content });
    return res.data;
  }

  public static async deleteComment(commentId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/comments/${commentId}`);
    return res.data;
  }

  // Admin Comments
  public static async adminGetComments(params?: {
    status?: CommentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CommentListResult> {
    const res = await apiClient.get<CommentListResult>('/admin/comments', { params });
    return res.data;
  }

  public static async adminHideComment(id: string, reason?: string): Promise<CommentItem> {
    const res = await apiClient.post<CommentItem>(`/admin/comments/${id}/hide`, { reason });
    return res.data;
  }

  public static async adminRestoreComment(id: string): Promise<CommentItem> {
    const res = await apiClient.post<CommentItem>(`/admin/comments/${id}/restore`);
    return res.data;
  }

  public static async adminRejectComment(id: string, reason?: string): Promise<CommentItem> {
    const res = await apiClient.post<CommentItem>(`/admin/comments/${id}/reject`, { reason });
    return res.data;
  }

  public static async adminDeleteComment(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/admin/comments/${id}`);
    return res.data;
  }

  // ==========================================
  // BOOKMARKS
  // ==========================================
  public static async addBookmark(newsId: string): Promise<{ isBookmarked: boolean; message: string }> {
    const res = await apiClient.post<{ isBookmarked: boolean; message: string }>(`/news/${newsId}/bookmark`);
    return res.data;
  }

  public static async removeBookmark(newsId: string): Promise<{ isBookmarked: boolean; message: string }> {
    const res = await apiClient.delete<{ isBookmarked: boolean; message: string }>(`/news/${newsId}/bookmark`);
    return res.data;
  }

  public static async toggleBookmark(newsId: string): Promise<{ isBookmarked: boolean; message: string }> {
    const res = await apiClient.post<{ isBookmarked: boolean; message: string }>(`/news/${newsId}/bookmarks`);
    return res.data;
  }

  public static async checkBookmarkStatus(newsId: string): Promise<{ isBookmarked: boolean }> {
    const res = await apiClient.get<{ isBookmarked: boolean }>(`/news/${newsId}/bookmarks/status`);
    return res.data;
  }

  public static async getUserBookmarks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
  }): Promise<{ bookmarks: BookmarkItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const res = await apiClient.get<{
      bookmarks: BookmarkItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/users/me/bookmarks', { params });
    return res.data;
  }

  // ==========================================
  // REPORTS
  // ==========================================
  public static async reportNews(
    newsId: string,
    payload: { reason: string; description?: string }
  ): Promise<ReportItem> {
    const res = await apiClient.post<ReportItem>(`/news/${newsId}/report`, payload);
    return res.data;
  }

  public static async reportComment(
    commentId: string,
    payload: { reason: string; description?: string }
  ): Promise<ReportItem> {
    const res = await apiClient.post<ReportItem>(`/comments/${commentId}/report`, payload);
    return res.data;
  }

  // Admin Reports
  public static async adminGetReports(params?: {
    targetType?: 'NEWS' | 'COMMENT';
    status?: ReportStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ReportItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const res = await apiClient.get<{
      items: ReportItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/admin/reports', { params });
    return res.data;
  }

  public static async adminReviewReport(id: string): Promise<ReportItem> {
    const res = await apiClient.post<ReportItem>(`/admin/reports/${id}/review`);
    return res.data;
  }

  public static async adminResolveReport(
    id: string,
    payload: { resolution: string; note?: string }
  ): Promise<ReportItem> {
    const res = await apiClient.post<ReportItem>(`/admin/reports/${id}/resolve`, payload);
    return res.data;
  }

  public static async adminDismissReport(id: string, note?: string): Promise<ReportItem> {
    const res = await apiClient.post<ReportItem>(`/admin/reports/${id}/dismiss`, { note });
    return res.data;
  }

  // ==========================================
  // SHARES & USER ENGAGEMENT
  // ==========================================
  public static async recordShare(
    newsId: string,
    platform: SharePlatform
  ): Promise<{ newsId: string; platform: SharePlatform; shareCount: number }> {
    const res = await apiClient.post<{ newsId: string; platform: SharePlatform; shareCount: number }>(
      `/news/${newsId}/share`,
      { platform }
    );
    return res.data;
  }

  public static async getUserEngagement(): Promise<UserEngagementSummary> {
    const res = await apiClient.get<UserEngagementSummary>('/users/me/engagement');
    return res.data;
  }
}
