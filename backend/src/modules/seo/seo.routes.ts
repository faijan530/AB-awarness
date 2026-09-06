import { Router } from 'express';
import { SeoController } from './seo.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Public SEO Packet for article
router.get('/news/:slug', SeoController.getNewsSeoPacket);

// Super Admin SEO Management
router.get('/admin/news/:id', authenticateToken, requireRoles(RoleName.SUPER_ADMIN), SeoController.getNewsSeo);
router.patch('/admin/news/:id', authenticateToken, requireRoles(RoleName.SUPER_ADMIN), SeoController.updateNewsSeo);

export default router;
