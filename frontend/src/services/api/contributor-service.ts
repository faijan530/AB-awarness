import { apiClient } from './api-client';
import { NewsArticle } from './news-service';

export interface ContributorSummary {
  draftsCount: number;
  pendingCount: number;
  revisionCount: number;
  approvedCount: number;
}

export interface CreateSubmissionPayload {
  title: string;
  shortDescription?: string;
  content: string;
  categoryIds?: string[];
  locationIds?: string[];
  tags?: string[];
  featuredMediaId?: string;
  sources?: { sourceId: string; referenceUrl?: string; sourceNote?: string }[];
}

export interface UpdateSubmissionPayload {
  title?: string;
  shortDescription?: string;
  content?: string;
  categoryIds?: string[];
  locationIds?: string[];
  tags?: string[];
  featuredMediaId?: string;
  sources?: { sourceId: string; referenceUrl?: string; sourceNote?: string }[];
}

export class ContributorService {
  /**
   * Get user's own submissions list
   */
  public static async getMySubmissions(params?: { status?: string; page?: number; limit?: number }): Promise<{
    articles: NewsArticle[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await apiClient.get<any>('/news/my-submissions', params);
    const data = (response as any).data || response;
    return {
      articles: data.articles || data || [],
      meta: data.meta || { total: (data.articles || data || []).length, page: 1, limit: 10, totalPages: 1 },
    };
  }

  /**
   * Get submission details by ID
   */
  public static async getSubmissionById(id: string): Promise<NewsArticle> {
    const response = await apiClient.get<NewsArticle>(`/news/${id}`);
    return (response as any).data || response;
  }

  /**
   * Create new story draft
   */
  public static async createDraft(payload: CreateSubmissionPayload): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>('/news', payload);
    return (response as any).data || response;
  }

  /**
   * Update story draft
   */
  public static async updateDraft(id: string, payload: UpdateSubmissionPayload): Promise<NewsArticle> {
    const response = await apiClient.patch<NewsArticle>(`/news/${id}`, payload);
    return (response as any).data || response;
  }

  /**
   * Submit draft for editorial review
   */
  public static async submitForReview(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/news/${id}/submit`);
    return (response as any).data || response;
  }

  /**
   * Resubmit article after requested revision
   */
  public static async resubmitForReview(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/news/${id}/submit`);
    return (response as any).data || response;
  }
}
