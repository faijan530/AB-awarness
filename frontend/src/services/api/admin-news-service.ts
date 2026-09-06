import { apiClient } from './api-client';
import { NewsArticle } from './news-service';

export interface AdminNewsListResponse {
  articles: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminNewsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
}

export class AdminNewsService {
  public static async getAdminNews(params: AdminNewsQueryParams = {}): Promise<AdminNewsListResponse> {
    const response = await apiClient.get<AdminNewsListResponse>('/admin/news', { params });
    return response.data;
  }

  public static async startReview(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/review`);
    return response.data;
  }

  public static async approveNews(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/approve`);
    return response.data;
  }

  public static async rejectNews(id: string, reason: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/reject`, { reason });
    return response.data;
  }

  public static async publishNews(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/publish`);
    return response.data;
  }

  public static async scheduleNews(id: string, scheduledAt: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/schedule`, { scheduledAt });
    return response.data;
  }

  public static async unpublishNews(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/unpublish`);
    return response.data;
  }

  public static async archiveNews(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/archive`);
    return response.data;
  }

  public static async toggleBreaking(id: string, isBreaking: boolean): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/breaking`, { isBreaking });
    return response.data;
  }

  public static async toggleFeatured(id: string, isFeatured: boolean): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/admin/news/${id}/feature`, { isFeatured });
    return response.data;
  }
}
