import { Router } from 'express';
import { AdminNewsController } from './admin-news.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protect all Super Admin editorial endpoints
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.get('/', AdminNewsController.getAdminNews);
router.post('/:id/review', AdminNewsController.startReview);
router.post('/:id/approve', AdminNewsController.approveNews);
router.post('/:id/reject', AdminNewsController.rejectNews);
router.post('/:id/publish', AdminNewsController.publishNews);
router.post('/:id/schedule', AdminNewsController.scheduleNews);
router.post('/:id/unpublish', AdminNewsController.unpublishNews);
router.post('/:id/archive', AdminNewsController.archiveNews);
router.post('/:id/breaking', AdminNewsController.toggleBreaking);
router.post('/:id/feature', AdminNewsController.toggleFeatured);
router.get('/:id/history', AdminNewsController.getEditorialHistory);

export const adminNewsRoutes = router;
