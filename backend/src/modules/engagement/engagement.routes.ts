import { Router } from 'express';
import { CommentController } from './comment.controller';
import { ReactionController } from './reaction.controller';
import { BookmarkController } from './bookmark.controller';
import { ReportController } from './report.controller';
import { ShareController } from './share.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

// ==========================================
// 1. COMMENTS ROUTES
// ==========================================
// Public comments reading on a story
router.get('/news/:newsId/comments', CommentController.getArticleComments);

// Single comment & replies reading
router.get('/comments/:id', CommentController.getCommentById);
router.get('/comments/:commentId/replies', CommentController.getReplies);

// Authenticated reader actions
router.post('/news/:newsId/comments', authenticateToken, CommentController.createComment);
router.post('/comments/:commentId/replies', authenticateToken, CommentController.createReply);
router.patch('/comments/:id', authenticateToken, CommentController.updateComment);
router.delete('/comments/:id', authenticateToken, CommentController.deleteComment);

// ==========================================
// 2. REACTIONS ROUTES
// ==========================================
// Public read reaction summary (with optional user reaction if logged in)
router.get('/news/:newsId/reactions', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authenticateToken(req, res, () => ReactionController.getReactions(req, res, next));
  }
  return ReactionController.getReactions(req, res, next);
});

// Authenticated reaction actions
router.post('/news/:newsId/reactions', authenticateToken, ReactionController.toggleReaction);
router.delete('/news/:newsId/reactions', authenticateToken, ReactionController.removeReaction);

// ==========================================
// 3. BOOKMARKS ROUTES
// ==========================================
// Authenticated user reading list
router.get('/bookmarks', authenticateToken, BookmarkController.getMyBookmarks);
router.get('/users/me/bookmarks', authenticateToken, BookmarkController.getMyBookmarks);

// Add / Remove / Toggle bookmarks
router.post('/news/:newsId/bookmark', authenticateToken, BookmarkController.addBookmark);
router.delete('/news/:newsId/bookmark', authenticateToken, BookmarkController.removeBookmark);
router.post('/news/:newsId/bookmarks', authenticateToken, BookmarkController.toggleBookmark);
router.get('/news/:newsId/bookmarks/status', authenticateToken, BookmarkController.checkBookmarkStatus);

// ==========================================
// 4. REPORTS ROUTES
// ==========================================
router.post('/news/:newsId/report', authenticateToken, ReportController.reportNews);
router.post('/comments/:commentId/report', authenticateToken, ReportController.reportComment);

// ==========================================
// 5. SHARES & ENGAGEMENT METRICS ROUTES
// ==========================================
router.post('/news/:newsId/share', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authenticateToken(req, res, () => ShareController.recordShare(req, res, next));
  }
  return ShareController.recordShare(req, res, next);
});

router.get('/users/me/engagement', authenticateToken, ShareController.getUserEngagement);

export const engagementRoutes = router;
