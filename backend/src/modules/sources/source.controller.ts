import { Request, Response, NextFunction } from 'express';
import { SourceService } from './source.service';
import { ApiResponse } from '../../utils/api-response';

export class SourceController {
  /**
   * GET /api/v1/sources
   */
  public static async listSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, credibility, search, page, limit } = req.query;

      const result = await SourceService.listSources({
        type: type as string,
        credibility: credibility as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      ApiResponse.success(res, 'Sources list retrieved', result.items, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sources/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const source = await SourceService.getSourceById(id);
      ApiResponse.success(res, 'Source retrieved', source);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/sources
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await SourceService.createSource(req.body);
      ApiResponse.success(res, 'Source created successfully', source, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/sources/:id
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const source = await SourceService.updateSource(id, req.body);
      ApiResponse.success(res, 'Source updated successfully', source);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/sources/:id
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await SourceService.deleteSource(id);
      ApiResponse.success(res, 'Source deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
