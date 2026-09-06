import { Router } from 'express';
import { AdvertisingController } from './advertising.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/authorize.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

router.use(authenticateToken, requireRoles(RoleName.SUPER_ADMIN));

// Advertisers
router.get('/advertisers', AdvertisingController.getAdvertisers);
router.post('/advertisers', AdvertisingController.createAdvertiser);
router.patch('/advertisers/:id', AdvertisingController.updateAdvertiser);

// Campaigns
router.get('/campaigns', AdvertisingController.getCampaigns);
router.post('/campaigns', AdvertisingController.createCampaign);
router.patch('/campaigns/:id', AdvertisingController.updateCampaign);
router.post('/campaigns/:id/activate', AdvertisingController.activateCampaign);
router.post('/campaigns/:id/pause', AdvertisingController.pauseCampaign);
router.delete('/campaigns/:id', AdvertisingController.deleteCampaign);

// Creatives
router.get('/ad-creatives', AdvertisingController.getCreatives);
router.post('/ad-creatives', AdvertisingController.createCreative);
router.patch('/ad-creatives/:id', AdvertisingController.updateCreative);

// Placements
router.get('/ad-placements', AdvertisingController.getPlacements);
router.patch('/ad-placements/:id', AdvertisingController.updatePlacement);

export default router;
