import { Router } from 'express';
import { AdminVerificationController } from './admin-verification.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Protected admin routes: Super Admin
router.use(authenticate);
router.use(requireRoles(RoleName.SUPER_ADMIN));

// Verification Workbench
router.get('/dashboard', AdminVerificationController.getDashboard);
router.get('/queue', AdminVerificationController.getQueue);
router.get('/:id', AdminVerificationController.getDetail);
router.post('/:id/claim-review', AdminVerificationController.reviewClaim);
router.post('/:id/decision', AdminVerificationController.submitDecision);
router.post('/:id/notes', AdminVerificationController.addNote);

export const adminVerificationRoutes = router;

const modRouter = Router();
modRouter.use(authenticate);
modRouter.use(requireRoles(RoleName.SUPER_ADMIN));

modRouter.get('/queue', AdminVerificationController.getModerationQueue);
modRouter.get('/:id', AdminVerificationController.getModerationDetail);
modRouter.post('/:id/action', AdminVerificationController.takeModerationAction);

export const adminModerationRoutes = modRouter;
