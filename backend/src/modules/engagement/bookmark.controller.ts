import { Request, Response, NextFunction } from 'express';
import { BookmarkService } from './bookmark.service';
import { ApiResponse } from '../../utils/api-response';

export class BookmarkController {
  /**
   * GET /api/v1/users/me/bookmarks or /api/v1/bookmarks
   */
  public static async getMyBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit, category, location } = req.query;

      const result = await BookmarkService.getUserBookmarks(
        userId,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 10,
        category as string | undefined,
        location as string | undefined
      );

      ApiResponse.success(res, 'User bookmarks retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/news/:newsId/bookmark
   */
  public static async addBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;

      const result = await BookmarkService.addBookmark(userId, newsId);
      ApiResponse.success(res, result.message, result, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/news/:newsId/bookmark
   */
  public static async removeBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;

      const result = await BookmarkService.removeBookmark(userId, newsId);
      ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/news/:newsId/bookmarks (toggle bookmark)
   */
  public static async toggleBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;

      const result = await BookmarkService.toggleBookmark(userId, newsId);
      ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/news/:newsId/bookmarks/status (check if bookmarked)
   */
  public static async checkBookmarkStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const userId = req.user!.id;

      const isBookmarked = await BookmarkService.isBookmarked(userId, newsId);
      ApiResponse.success(res, 'Bookmark status retrieved', { isBookmarked });
    } catch (error) {
      next(error);
    }
  }
}
