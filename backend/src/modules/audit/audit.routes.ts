import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/authorize.middleware';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', AuditController.getAuditLogs);
router.get('/actions/distinct', AuditController.getDistinctActions);
router.get('/:id', AuditController.getAuditLogById);

export const auditAdminRoutes = router;
