import { Router } from 'express';
import { TagController } from './tag.controller';

const router = Router();

router.get('/', TagController.getTags);
router.get('/:slug', TagController.getTagBySlug);
router.get('/:slug/news', TagController.getNewsByTagSlug);

export const tagRoutes = router;
