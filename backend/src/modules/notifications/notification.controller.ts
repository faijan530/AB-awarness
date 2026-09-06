import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { AppError } from '../../middlewares/error.middleware';

export class NotificationController {
  public static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await NotificationService.getUserNotifications(userId, { page, limit, unreadOnly });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const notification = await NotificationService.markAsRead(req.params.id, userId);
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  public static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const result = await NotificationService.markAllAsRead(userId);
      res.status(200).json({ success: true, message: 'All notifications marked as read', data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const result = await NotificationService.getUnreadCount(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const prefs = await NotificationService.getPreferences(userId);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const updated = await NotificationService.updatePreferences(userId, req.body);
      res.status(200).json({ success: true, message: 'Notification preferences updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  public static async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const { deviceType, pushToken } = req.body;
      if (!pushToken) throw new AppError('pushToken is required', 400, 'BAD_REQUEST');

      const device = await NotificationService.registerDevice(userId, {
        deviceType: deviceType || 'WEB',
        pushToken,
      });

      res.status(200).json({ success: true, message: 'Device token registered', data: device });
    } catch (error) {
      next(error);
    }
  }

  public static async broadcastNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      const { type, title, message, entityType, entityId } = req.body;
      if (!title || !message) throw new AppError('Title and message are required', 400, 'BAD_REQUEST');

      const result = await NotificationService.broadcastNotification(adminId, {
        type,
        title,
        message,
        entityType,
        entityId,
      });

      res.status(200).json({ success: true, message: 'Broadcast notification dispatched', data: result });
    } catch (error) {
      next(error);
    }
  }
}
