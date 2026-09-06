import { Router } from 'express';
import { AdminCategoryController } from './admin-category.controller';
import { authenticateToken } from '../../../middlewares/auth.middleware';
import { requireRoles } from '../../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protect all admin category routes with Super Admin authorization
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

router.get('/', AdminCategoryController.getAdminCategories);
router.post('/', AdminCategoryController.createCategory);
router.patch('/:id', AdminCategoryController.updateCategory);
router.post('/:id/activate', AdminCategoryController.activateCategory);
router.post('/:id/deactivate', AdminCategoryController.deactivateCategory);
router.delete('/:id', AdminCategoryController.deleteCategory);

export const adminCategoryRoutes = router;
