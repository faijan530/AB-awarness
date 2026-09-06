import { apiClient } from './api-client';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  status: string;
  viewCount: number;
  isFeatured: boolean;
  isBreaking: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}

export interface NewsFeedResponse {
  articles: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  search?: string;
  featured?: boolean;
}

export interface CreateNewsPayload {
  title: string;
  shortDescription?: string;
  content: string;
  categoryIds?: string[];
  locationIds?: string[];
  tagIds?: string[];
  coverImageUrl?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
}

export class NewsService {
  public static async getNewsFeed(params: NewsQueryParams = {}): Promise<NewsFeedResponse> {
    const response = await apiClient.get<NewsFeedResponse>('/news', params);
    return response.data;
  }

  public static async getFeaturedNews(): Promise<NewsArticle | null> {
    const response = await apiClient.get<NewsArticle | null>('/news/featured');
    return response.data;
  }

  public static async getBreakingNews(): Promise<NewsArticle[]> {
    const response = await apiClient.get<NewsArticle[]>('/news/breaking');
    return response.data;
  }

  public static async getTrendingNews(limit = 5): Promise<NewsArticle[]> {
    const response = await apiClient.get<NewsArticle[]>('/news/trending', { params: { limit } });
    return response.data;
  }

  public static async getArticleBySlug(slug: string): Promise<NewsArticle> {
    const response = await apiClient.get<NewsArticle>(`/news/${slug}`);
    return response.data;
  }

  public static async getRelatedNews(articleId: string, limit = 4): Promise<NewsArticle[]> {
    const response = await apiClient.get<NewsArticle[]>(`/news/${articleId}/related`, { params: { limit } });
    return response.data;
  }

  public static async createNews(payload: CreateNewsPayload): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>('/news', payload);
    return response.data;
  }

  public static async submitForReview(id: string): Promise<NewsArticle> {
    const response = await apiClient.post<NewsArticle>(`/news/${id}/submit`);
    return response.data;
  }
}
