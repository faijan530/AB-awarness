import { Router } from 'express';
import { NewsController } from './news.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// Protected routes for story creation & contributor submission
router.get('/my-submissions', authenticateToken, NewsController.getMySubmissions);

// Public routes for content discovery (accessible by guests & authenticated users)
router.get('/', NewsController.getNewsFeed);
router.get('/featured', NewsController.getFeaturedNews);
router.get('/breaking', NewsController.getBreakingNews);
router.get('/trending', NewsController.getTrendingNews);
router.get('/:slug', NewsController.getArticleBySlug);
router.get('/:id/related', NewsController.getRelatedNews);

// Protected routes for story creation & contributor submission
router.post('/', authenticateToken, NewsController.createNews);
router.patch('/:id', authenticateToken, NewsController.updateNews);
router.put('/:id', authenticateToken, NewsController.updateNews);
router.post('/:id/submit', authenticateToken, NewsController.submitForReview);
router.get('/:id/revisions', authenticateToken, NewsController.getRevisions);

export const newsRoutes = router;
