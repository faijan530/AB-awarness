import { Router } from 'express';
import { SourceController } from './source.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protected admin routes: Super Admin
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.get('/', SourceController.listSources);
router.get('/:id', SourceController.getById);
router.post('/', SourceController.create);
router.patch('/:id', SourceController.update);
router.delete('/:id', SourceController.delete);

export const adminSourceRoutes = router;
