import { Router } from 'express';
import { VerificationController } from './verification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protected contributor & user routes
router.use(authenticate);

router.post('/request', VerificationController.requestVerification);
router.get('/status/:id', VerificationController.getVerificationStatus);
router.get('/result/:id', VerificationController.getVerificationResult);
router.get('/my-history', VerificationController.getMyVerificationHistory);

export const verificationRoutes = router;
