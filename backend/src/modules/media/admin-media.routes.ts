import { Router } from 'express';
import { AdminMediaController } from './admin-media.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protected admin routes
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.get('/', AdminMediaController.listAllMedia);
router.get('/:id', AdminMediaController.getMediaDetail);
router.get('/:id/usage', AdminMediaController.getMediaUsage);
router.patch('/:id', AdminMediaController.updateMetadata);
router.post('/:id/quarantine', AdminMediaController.quarantine);
router.post('/:id/restore', AdminMediaController.restore);
router.delete('/:id', AdminMediaController.deleteMedia);

export const adminMediaRoutes = router;
