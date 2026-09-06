import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { ApiResponse } from '../../../utils/api-response';

export class CategoryController {
  /**
   * GET /api/v1/categories
   */
  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getCategories(true);
      ApiResponse.success(res, 'Active categories retrieved successfully', categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/categories/tree
   */
  public static async getCategoryTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await CategoryService.getCategoryTree(true);
      ApiResponse.success(res, 'Category hierarchy tree retrieved successfully', tree);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/categories/:slug
   */
  public static async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const category = await CategoryService.getCategoryBySlug(slug);
      ApiResponse.success(res, 'Category details retrieved successfully', category);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/categories/:slug/news
   */
  public static async getNewsByCategorySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await CategoryService.getNewsByCategorySlug(slug, page, limit);
      ApiResponse.success(res, `News for category ${slug} retrieved successfully`, {
        category: result.category,
        articles: result.articles,
      }, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
