import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// User Notifications (all require authentication)
router.use(authenticateToken);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.post('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markRead);

export default router;
