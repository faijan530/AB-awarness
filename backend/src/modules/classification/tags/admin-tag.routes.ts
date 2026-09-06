import { Router } from 'express';
import { AdminTagController } from './admin-tag.controller';
import { authenticateToken } from '../../../middlewares/auth.middleware';
import { requireRoles } from '../../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protect all admin tag routes with Super Admin authorization
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.post('/', AdminTagController.createTag);
router.patch('/:id', AdminTagController.updateTag);
router.delete('/:id', AdminTagController.deleteTag);

export const adminTagRoutes = router;
