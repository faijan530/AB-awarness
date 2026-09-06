import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { NotificationType } from '@prisma/client';
import {
  CreateNotificationDTO,
  NotificationResponseDTO,
  NotificationListResponse,
  UpdatePreferencesDTO,
  RegisterDeviceDTO,
  BroadcastNotificationDTO,
} from './notification.types';

export class NotificationService {
  /**
   * Helper to format Notification model
   */
  private static formatNotification(n: any): NotificationResponseDTO {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      entityType: n.entityType,
      entityId: n.entityId,
      data: n.data,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    };
  }

  /**
   * Create an event-driven notification (checks user preferences)
   */
  public static async createNotification(payload: CreateNotificationDTO): Promise<NotificationResponseDTO | null> {
    // 1. Check user preferences for non-security/non-system notifications
    if (payload.type !== NotificationType.SECURITY && payload.type !== NotificationType.SYSTEM) {
      const prefs = await this.getPreferences(payload.userId);
      if (payload.type === NotificationType.BREAKING_NEWS && !prefs.breakingNews) return null;
      if (payload.type === NotificationType.COMMENT_REPLY && !prefs.commentReplies) return null;
      if (payload.type === NotificationType.COMMENT_REACTION && !prefs.commentReactions) return null;
      if (payload.type === NotificationType.NEWS_UPDATE && !prefs.newsUpdates) return null;
    }

    const created = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType || null,
        entityId: payload.entityId || null,
        data: payload.data || undefined,
        isRead: false,
      },
    });

    return this.formatNotification(created);
  }

  /**
   * Query user's notifications (GET /api/v1/notifications)
   */
  public static async getUserNotifications(
    userId: string,
    params?: { page?: number; limit?: number; unreadOnly?: boolean }
  ): Promise<NotificationListResponse> {
    const pageNum = Math.max(1, params?.page || 1);
    const limitNum = Math.min(100, Math.max(1, params?.limit || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (params?.unreadOnly) {
      where.isRead = false;
    }

    const [total, unreadCount, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      notifications: items.map((n) => this.formatNotification(n)),
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Mark single notification as read (PATCH /api/v1/notifications/:id/read)
   */
  public static async markAsRead(id: string, userId: string): Promise<NotificationResponseDTO> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized access to notification', 403, 'FORBIDDEN');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.formatNotification(updated);
  }

  /**
   * Mark all notifications as read (POST /api/v1/notifications/read-all)
   */
  public static async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Get unread notifications count (GET /api/v1/notifications/unread-count)
   */
  public static async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Get user's notification preferences (GET /api/v1/users/me/notification-preferences)
   */
  public static async getPreferences(userId: string): Promise<any> {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          breakingNews: true,
          commentReplies: true,
          commentReactions: true,
          newsUpdates: true,
          emailNotifications: true,
          pushNotifications: true,
        },
      });
    }

    return prefs;
  }

  /**
   * Update user's notification preferences (PATCH /api/v1/users/me/notification-preferences)
   */
  public static async updatePreferences(userId: string, data: UpdatePreferencesDTO): Promise<any> {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        breakingNews: data.breakingNews ?? true,
        commentReplies: data.commentReplies ?? true,
        commentReactions: data.commentReactions ?? true,
        newsUpdates: data.newsUpdates ?? true,
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
      },
    });
  }

  /**
   * Register push device token (POST /api/v1/users/me/devices)
   */
  public static async registerDevice(userId: string, payload: RegisterDeviceDTO): Promise<any> {
    return prisma.userDevice.upsert({
      where: {
        userId_pushToken: { userId, pushToken: payload.pushToken },
      },
      update: {
        deviceType: payload.deviceType,
        lastSeenAt: new Date(),
        isActive: true,
      },
      create: {
        userId,
        deviceType: payload.deviceType,
        pushToken: payload.pushToken,
        isActive: true,
      },
    });
  }

  /**
   * Super Admin Broadcast Announcement (POST /api/v1/admin/notifications/broadcast)
   */
  public static async broadcastNotification(
    adminId: string,
    payload: BroadcastNotificationDTO
  ): Promise<{ sentCount: number }> {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    if (users.length === 0) return { sentCount: 0 };

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: payload.type || NotificationType.SYSTEM,
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType || null,
        entityId: payload.entityId || null,
        isRead: false,
      })),
    });

    return { sentCount: users.length };
  }
}
