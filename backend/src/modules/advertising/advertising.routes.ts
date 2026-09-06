import { Router } from 'express';
import { AdvertisingController } from './advertising.controller';

const router = Router();

// Public Ad Endpoints
router.get('/serve', AdvertisingController.serveAd);
router.post('/:creativeId/impression', AdvertisingController.recordImpression);
router.get('/:creativeId/click', AdvertisingController.recordClick);

export default router;
