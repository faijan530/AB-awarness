import { NotificationType } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, any>;
}

export interface NotificationResponseDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  data?: any;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationListResponse {
  notifications: NotificationResponseDTO[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdatePreferencesDTO {
  breakingNews?: boolean;
  commentReplies?: boolean;
  commentReactions?: boolean;
  newsUpdates?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface RegisterDeviceDTO {
  deviceType: 'WEB' | 'ANDROID' | 'IOS';
  pushToken: string;
}

export interface BroadcastNotificationDTO {
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}
