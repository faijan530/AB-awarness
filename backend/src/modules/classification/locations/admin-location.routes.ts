import { Router } from 'express';
import { AdminLocationController } from './admin-location.controller';
import { authenticateToken } from '../../../middlewares/auth.middleware';
import { requireRoles } from '../../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protect all admin location routes with Super Admin authorization
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.get('/', AdminLocationController.getAdminLocations);
router.post('/', AdminLocationController.createLocation);
router.patch('/:id', AdminLocationController.updateLocation);
router.post('/:id/activate', AdminLocationController.activateLocation);
router.post('/:id/deactivate', AdminLocationController.deactivateLocation);
router.delete('/:id', AdminLocationController.deleteLocation);

export const adminLocationRoutes = router;
