import { Request, Response, NextFunction } from 'express';
import { TagService } from './tag.service';
import { ApiResponse } from '../../../utils/api-response';

export class AdminTagController {
  /**
   * POST /api/v1/admin/tags
   */
  public static async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await TagService.createTag(req.body);
      ApiResponse.success(res, 'Tag created successfully', tag, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/tags/:id
   */
  public static async updateTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tag = await TagService.updateTag(id, req.body);
      ApiResponse.success(res, 'Tag updated successfully', tag);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/tags/:id
   */
  public static async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tag = await TagService.deleteTag(id);
      ApiResponse.success(res, 'Tag deleted successfully', tag);
    } catch (error) {
      next(error);
    }
  }
}
