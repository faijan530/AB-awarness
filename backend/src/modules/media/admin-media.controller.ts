import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service';
import { ApiResponse } from '../../utils/api-response';

export class AdminMediaController {
  /**
   * GET /api/v1/admin/media
   */
  public static async listAllMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, status, search, page, limit } = req.query;

      const result = await MediaService.listAdminMedia({
        type: type as string,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      ApiResponse.success(res, 'Admin media registry retrieved', result.items, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/media/:id
   */
  public static async getMediaDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const media = await MediaService.getMediaById(id);
      ApiResponse.success(res, 'Media detail retrieved', media);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/media/:id/quarantine
   */
  public static async quarantine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const media = await MediaService.quarantineMedia(id);
      ApiResponse.success(res, 'Media quarantined successfully', media);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/media/:id/restore
   */
  public static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const media = await MediaService.restoreMedia(id);
      ApiResponse.success(res, 'Media restored to ready status', media);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/media/:id
   */
  public static async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      await MediaService.deleteMedia(id, user.id, true);
      ApiResponse.success(res, 'Media deleted by Super Admin');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/media/:id
   */
  public static async updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { originalName } = req.body;
      const media = await MediaService.updateMediaMetadata(id, { originalName });
      ApiResponse.success(res, 'Media metadata updated successfully', media);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/media/:id/usage
   */
  public static async getMediaUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const usage = await MediaService.getMediaUsage(id);
      ApiResponse.success(res, 'Media usage statistics retrieved', usage);
    } catch (error) {
      next(error);
    }
  }
}
