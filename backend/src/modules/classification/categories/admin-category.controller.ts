import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { ApiResponse } from '../../../utils/api-response';

export class AdminCategoryController {
  /**
   * GET /api/v1/admin/categories
   */
  public static async getAdminCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getCategories(false);
      ApiResponse.success(res, 'All categories (active & inactive) retrieved', categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/categories
   */
  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.createCategory(req.body);
      ApiResponse.success(res, 'Category created successfully', category, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/categories/:id
   */
  public static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body);
      ApiResponse.success(res, 'Category updated successfully', category);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/categories/:id/activate
   */
  public static async activateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.toggleActive(id, true);
      ApiResponse.success(res, 'Category activated successfully', category);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/categories/:id/deactivate
   */
  public static async deactivateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.toggleActive(id, false);
      ApiResponse.success(res, 'Category deactivated successfully', category);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/categories/:id
   */
  public static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.deleteCategory(id);
      ApiResponse.success(res, 'Category processed for deletion/deactivation successfully', category);
    } catch (error) {
      next(error);
    }
  }
}
