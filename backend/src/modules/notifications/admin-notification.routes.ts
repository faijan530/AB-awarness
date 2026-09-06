import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

router.use(authenticateToken, requireRoles(RoleName.SUPER_ADMIN));

router.post('/broadcast', NotificationController.broadcastNotification);

export default router;
