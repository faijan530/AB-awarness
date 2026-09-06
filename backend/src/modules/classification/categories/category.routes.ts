import { Router } from 'express';
import { CategoryController } from './category.controller';

const router = Router();

router.get('/', CategoryController.getCategories);
router.get('/tree', CategoryController.getCategoryTree);
router.get('/:slug', CategoryController.getCategoryBySlug);
router.get('/:slug/news', CategoryController.getNewsByCategorySlug);

export const categoryRoutes = router;
