import { apiClient } from './api-client';

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface MediaItem {
  id: string;
  uploadedBy: string;
  type: MediaType;
  originalName: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  status: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class MediaService {
  /**
   * Upload file via multipart/form-data
   */
  public static async uploadFile(file: File): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<MediaItem>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return (response as any).data || response;
  }

  /**
   * List reporter's own media library
   */
  public static async listMyMedia(params?: {
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: MediaItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await apiClient.get<any>('/media', params);
    const data = (response as any).data || response;
    return {
      items: Array.isArray(data) ? data : data.items || [],
      meta: (response as any).meta || data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }

  /**
   * Super Admin: List all media across platform
   */
  public static async listAdminMedia(params?: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: MediaItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await apiClient.get<any>('/admin/media', params);
    const data = (response as any).data || response;
    return {
      items: Array.isArray(data) ? data : data.items || [],
      meta: (response as any).meta || data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }

  /**
   * Super Admin: Quarantine suspicious media
   */
  public static async quarantineMedia(id: string): Promise<MediaItem> {
    const response = await apiClient.post<MediaItem>(`/admin/media/${id}/quarantine`, {});
    return (response as any).data || response;
  }

  /**
   * Super Admin: Restore quarantined media
   */
  public static async restoreMedia(id: string): Promise<MediaItem> {
    const response = await apiClient.post<MediaItem>(`/admin/media/${id}/restore`, {});
    return (response as any).data || response;
  }

  /**
   * Super Admin: Update media metadata
   */
  public static async updateMediaMetadata(id: string, data: { originalName: string }): Promise<MediaItem> {
    const response = await apiClient.patch<MediaItem>(`/admin/media/${id}`, data);
    return (response as any).data || response;
  }

  /**
   * Super Admin: Inspect media usage across articles
   */
  public static async getMediaUsage(id: string): Promise<{
    id: string;
    totalUsage: number;
    articles: Array<{ id: string; title: string; slug: string; role: string }>;
  }> {
    const response = await apiClient.get<any>(`/admin/media/${id}/usage`);
    return (response as any).data || response;
  }

  /**
   * Get media attached to a news story
   */
  public static async getNewsMedia(newsId: string): Promise<Array<{
    id: string;
    newsId: string;
    mediaId: string;
    mediaRole: string;
    caption: string | null;
    displayOrder: number;
    media: MediaItem;
  }>> {
    const response = await apiClient.get<any>(`/media/news/${newsId}`);
    return (response as any).data || response || [];
  }

  /**
   * Attach media to a news story
   */
  public static async attachMediaToNews(newsId: string, payload: {
    mediaId: string;
    mediaRole?: string;
    caption?: string;
    displayOrder?: number;
  }): Promise<any> {
    const response = await apiClient.post<any>(`/media/news/${newsId}`, payload);
    return (response as any).data || response;
  }

  /**
   * Detach media from a news story
   */
  public static async detachMediaFromNews(newsId: string, mediaId: string): Promise<void> {
    await apiClient.delete(`/media/news/${newsId}/${mediaId}`);
  }

  /**
   * Delete media item
   */
  public static async deleteMedia(id: string, isAdmin = false): Promise<void> {
    const endpoint = isAdmin ? `/admin/media/${id}` : `/media/${id}`;
    await apiClient.delete(endpoint);
  }
}
