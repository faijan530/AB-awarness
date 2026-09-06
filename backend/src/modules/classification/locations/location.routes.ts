import { Router } from 'express';
import { LocationController } from './location.controller';

const router = Router();

router.get('/', LocationController.getLocations);
router.get('/tree', LocationController.getLocationTree);
router.get('/search', LocationController.searchLocations);
router.get('/:slug', LocationController.getLocationBySlug);
router.get('/:slug/news', LocationController.getNewsByLocationSlug);

export const locationRoutes = router;
