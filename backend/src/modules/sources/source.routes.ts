import { Router } from 'express';
import { SourceController } from './source.controller';

const router = Router();

// Publicly readable sources for article citation and validation
router.get('/', SourceController.listSources);
router.get('/:id', SourceController.getById);

export const sourceRoutes = router;
