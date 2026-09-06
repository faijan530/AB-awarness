import { apiClient } from './api-client';

export interface NewsSeoPacket {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  openGraph: {
    title: string;
    description: string;
    image: string | null;
    url: string;
    type: string;
    siteName: string;
  };
  twitterCard: {
    card: string;
    title: string;
    description: string;
    image: string | null;
  };
  structuredData: Record<string, any>;
}

export interface SeoMetadataDTO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export class SeoService {
  public static async getNewsSeoPacket(slug: string): Promise<NewsSeoPacket> {
    const response = await apiClient.get<NewsSeoPacket>(`/seo/news/${slug}`);
    return response.data;
  }

  public static async getNewsSeo(newsId: string): Promise<any> {
    const response = await apiClient.get<any>(`/seo/admin/news/${newsId}`);
    return response.data;
  }

  public static async updateNewsSeo(newsId: string, data: SeoMetadataDTO): Promise<any> {
    const response = await apiClient.patch<any>(`/seo/admin/news/${newsId}`, data);
    return response.data;
  }
}
