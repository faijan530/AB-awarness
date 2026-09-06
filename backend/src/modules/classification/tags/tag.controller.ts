import { Request, Response, NextFunction } from 'express';
import { TagService } from './tag.service';
import { ApiResponse } from '../../../utils/api-response';

export class TagController {
  /**
   * GET /api/v1/tags
   */
  public static async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await TagService.getTags();
      ApiResponse.success(res, 'Tags retrieved successfully', tags);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tags/:slug
   */
  public static async getTagBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const tag = await TagService.getTagBySlug(slug);
      ApiResponse.success(res, 'Tag details retrieved successfully', tag);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tags/:slug/news
   */
  public static async getNewsByTagSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await TagService.getNewsByTagSlug(slug, page, limit);
      ApiResponse.success(res, `News for tag ${slug} retrieved successfully`, result.articles, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
