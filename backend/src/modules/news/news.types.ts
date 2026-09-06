import { NewsStatus } from '@prisma/client';

export interface NewsFeedQueryParams {
  page?: number;
  limit?: number;
  category?: string; // category slug or name
  location?: string; // location slug or name
  search?: string;
  featured?: boolean;
}

export interface NewsArticleDTO {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  status: NewsStatus;
  viewCount: number;
  isFeatured: boolean;
  isBreaking: boolean;
  publishedAt: Date | null;
  createdAt: Date;
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
  sources?: {
    id: string;
    name: string;
    sourceType: string;
    credibilityStatus: string;
    referenceUrl?: string | null;
    sourceNote?: string | null;
  }[];
}

export interface NewsFeedResponse {
  articles: NewsArticleDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
