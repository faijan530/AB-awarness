import { apiClient } from './api-client';

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'COMMENT_REPLY' | 'COMMENT_REACTION' | 'NEWS_UPDATE' | 'BREAKING_NEWS' | 'REPORT_UPDATE' | 'MODERATION_ACTION' | 'SYSTEM' | 'SECURITY';
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  data?: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreferences {
  breakingNews: boolean;
  commentReplies: boolean;
  commentReactions: boolean;
  newsUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export class NotificationService {
  public static async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationListResponse> {
    const response = await apiClient.get<NotificationListResponse>('/notifications', { params });
    return response.data;
  }

  public static async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.data;
  }

  public static async markAsRead(id: string): Promise<NotificationItem> {
    const response = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  }

  public static async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.post<{ count: number }>('/notifications/read-all');
    return response.data;
  }

  public static async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<NotificationPreferences>('/users/me/notification-preferences');
    return response.data;
  }

  public static async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.patch<NotificationPreferences>('/users/me/notification-preferences', data);
    return response.data;
  }

  public static async broadcastNotification(payload: {
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }): Promise<{ sentCount: number }> {
    const response = await apiClient.post<{ sentCount: number }>('/admin/notifications/broadcast', payload);
    return response.data;
  }
}
