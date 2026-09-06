import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service';
import { ApiResponse } from '../../utils/api-response';

export class MediaController {
  /**
   * POST /api/v1/media/upload
   */
  public static async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const userId = (req as any).user.id;

      const media = await MediaService.uploadFile(file as any, userId);
      ApiResponse.success(res, 'File uploaded and media processed successfully', media, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/media/upload/init
   */
  public static async initUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const result = await MediaService.initUpload(req.body, userId);
      ApiResponse.success(res, 'Upload initialized', result, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/media/upload/complete
   */
  public static async completeUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const media = await MediaService.completeUpload(req.body, userId);
      ApiResponse.success(res, 'Upload completed and media ready', media);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/media/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const media = await MediaService.getMediaById(id);
      ApiResponse.success(res, 'Media retrieved', media);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/media
   */
  public static async listMyMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { type, page, limit } = req.query;

      const result = await MediaService.listUserMedia(userId, {
        type: type as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      ApiResponse.success(res, 'User media library retrieved', result.items, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/media/:id
   */
  public static async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const isAdmin = user.roles.includes('SUPER_ADMIN');

      await MediaService.deleteMedia(id, user.id, isAdmin);
      ApiResponse.success(res, 'Media deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/media/news/:newsId
   */
  public static async getNewsMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const mediaList = await MediaService.getNewsMedia(newsId);
      ApiResponse.success(res, 'News media items retrieved', mediaList);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/media/news/:newsId
   */
  public static async attachMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId } = req.params;
      const { mediaId, mediaRole, caption, displayOrder } = req.body;
      const attached = await MediaService.attachMediaToNews(newsId, mediaId, mediaRole, caption, displayOrder);
      ApiResponse.success(res, 'Media attached to news story', attached);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/media/news/:newsId/:mediaId
   */
  public static async detachMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId, mediaId } = req.params;
      await MediaService.detachMediaFromNews(newsId, mediaId);
      ApiResponse.success(res, 'Media detached from news story');
    } catch (error) {
      next(error);
    }
  }
}
