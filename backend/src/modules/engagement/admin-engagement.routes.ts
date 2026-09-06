import { Router } from 'express';
import { AdminCommentController } from './admin-comment.controller';
import { ReportController } from './report.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protect all admin engagement routes for Super Admin
router.use(authenticateToken);
router.use(requireRoles(RoleName.SUPER_ADMIN));

// ==========================================
// 1. ADMIN COMMENTS MODERATION DESK
// ==========================================
router.get('/comments', AdminCommentController.getComments);
router.get('/comments/:id', AdminCommentController.getCommentById);
router.post('/comments/:id/hide', AdminCommentController.hideComment);
router.post('/comments/:id/restore', AdminCommentController.restoreComment);
router.post('/comments/:id/reject', AdminCommentController.rejectComment);
router.patch('/comments/:id/moderate', AdminCommentController.moderateComment);
router.delete('/comments/:id', AdminCommentController.deleteComment);

// ==========================================
// 2. ADMIN REPORTS & COMMUNITY SAFETY QUEUE
// ==========================================
router.get('/reports', ReportController.getReports);
router.get('/reports/:id', ReportController.getReportById);
router.post('/reports/:id/review', ReportController.reviewReport);
router.post('/reports/:id/resolve', ReportController.resolveReport);
router.post('/reports/:id/dismiss', ReportController.dismissReport);

export const adminEngagementRoutes = router;
