import { apiClient } from './api-client';

export interface TagItem {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
}

export class TagService {
  public static async getTags(): Promise<TagItem[]> {
    const response = await apiClient.get<TagItem[]>('/tags');
    return (response as any).data || response;
  }

  public static async getTagBySlug(slug: string): Promise<TagItem> {
    const response = await apiClient.get<TagItem>(`/tags/${slug}`);
    return (response as any).data || response;
  }

  public static async getNewsByTagSlug(slug: string, page = 1, limit = 10): Promise<any> {
    const response = await apiClient.get<any>(`/tags/${slug}/news`, { page, limit });
    return response;
  }

  public static async createTag(name: string): Promise<TagItem> {
    const response = await apiClient.post<TagItem>('/admin/tags', { name });
    return (response as any).data || response;
  }

  public static async updateTag(id: string, name: string): Promise<TagItem> {
    const response = await apiClient.patch<TagItem>(`/admin/tags/${id}`, { name });
    return (response as any).data || response;
  }

  public static async deleteTag(id: string): Promise<TagItem> {
    const response = await apiClient.delete<TagItem>(`/admin/tags/${id}`);
    return (response as any).data || response;
  }
}
