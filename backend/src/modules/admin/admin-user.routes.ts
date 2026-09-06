import { Router } from 'express';
import { AdminUserController } from './admin-user.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Require JWT Token and SUPER_ADMIN Role for all admin endpoints
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.get('/', AdminUserController.getUsers);
router.get('/statistics', AdminUserController.getUserStatistics);
router.get('/:userId', AdminUserController.getUserDetails);

router.post('/:userId/warn', AdminUserController.warnUser);
router.post('/:userId/suspend', AdminUserController.suspendUser);
router.post('/:userId/unsuspend', AdminUserController.unsuspendUser);
router.post('/:userId/block', AdminUserController.blockUser);
router.post('/:userId/unblock', AdminUserController.unblockUser);
router.post('/:userId/activate', AdminUserController.activateUser);

router.post('/:userId/roles', AdminUserController.assignRole);
router.delete('/:userId/roles/:roleName', AdminUserController.removeRole);

export const adminUserRoutes = router;
