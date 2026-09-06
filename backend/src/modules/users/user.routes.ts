import { Router } from 'express';
import { UserController } from './user.controller';
import { NotificationController } from '../notifications/notification.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all self-service endpoints
router.use(authenticateToken);

router.get('/me', UserController.getProfile);
router.patch('/me', UserController.updateProfile);
router.post('/me/avatar', UserController.setAvatar);
router.delete('/me/avatar', UserController.removeAvatar);
router.get('/me/activity', UserController.getUserActivity);
router.delete('/me', UserController.deleteAccount);

// Module 10: Notification preferences and device tokens
router.get('/me/notification-preferences', NotificationController.getPreferences);
router.patch('/me/notification-preferences', NotificationController.updatePreferences);
router.post('/me/devices', NotificationController.registerDevice);

export const userRoutes = router;
