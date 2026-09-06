import { Router } from 'express';
import { MediaController } from './media.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { StorageService } from './storage.service';

const router = Router();
const upload = StorageService.getMulterUpload();

// Protected routes for authenticated users/reporters
router.use(authenticateToken);

router.post('/upload', upload.single('file'), MediaController.uploadFile);
router.post('/upload/init', MediaController.initUpload);
router.post('/upload/complete', MediaController.completeUpload);
router.get('/', MediaController.listMyMedia);
router.get('/news/:newsId', MediaController.getNewsMedia);
router.post('/news/:newsId', MediaController.attachMedia);
router.delete('/news/:newsId/:mediaId', MediaController.detachMedia);
router.get('/:id', MediaController.getById);
router.delete('/:id', MediaController.deleteMedia);

export const mediaRoutes = router;
