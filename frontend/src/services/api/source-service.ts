import { apiClient } from './api-client';

export type SourceType =
  | 'OFFICIAL'
  | 'GOVERNMENT'
  | 'NEWS_ORGANIZATION'
  | 'PRESS_RELEASE'
  | 'SOCIAL_MEDIA'
  | 'EYEWITNESS'
  | 'DOCUMENT'
  | 'OTHER';

export type CredibilityStatus = 'VERIFIED' | 'QUESTIONABLE' | 'UNVERIFIED' | 'BANNED';

export interface SourceItem {
  id: string;
  name: string;
  sourceType: SourceType;
  url?: string | null;
  description?: string | null;
  contactInfo?: string | null;
  credibilityStatus: CredibilityStatus;
  _count?: {
    newsSources: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourcePayload {
  name: string;
  sourceType: SourceType;
  url?: string;
  description?: string;
  contactInfo?: string;
  credibilityStatus?: CredibilityStatus;
}

export class SourceService {
  public static async listSources(params?: {
    type?: string;
    credibility?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: SourceItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await apiClient.get<any>('/sources', params);
    const data = (response as any).data || response;
    return {
      items: Array.isArray(data) ? data : data.items || [],
      meta: (response as any).meta || data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }

  public static async getSourceById(id: string): Promise<SourceItem> {
    const response = await apiClient.get<SourceItem>(`/sources/${id}`);
    return (response as any).data || response;
  }

  public static async createSource(payload: CreateSourcePayload): Promise<SourceItem> {
    const response = await apiClient.post<SourceItem>('/admin/sources', payload);
    return (response as any).data || response;
  }

  public static async updateSource(id: string, payload: Partial<CreateSourcePayload>): Promise<SourceItem> {
    const response = await apiClient.patch<SourceItem>(`/admin/sources/${id}`, payload);
    return (response as any).data || response;
  }

  public static async deleteSource(id: string): Promise<void> {
    await apiClient.delete(`/admin/sources/${id}`);
  }
}
