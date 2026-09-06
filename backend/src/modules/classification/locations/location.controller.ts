import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';
import { ApiResponse } from '../../../utils/api-response';
import { LocationType } from '@prisma/client';

export class LocationController {
  /**
   * GET /api/v1/locations
   */
  public static async getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as LocationType | undefined;
      const locations = await LocationService.getLocations(true, type);
      ApiResponse.success(res, 'Active locations retrieved successfully', locations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/locations/tree
   */
  public static async getLocationTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await LocationService.getLocationTree(true);
      ApiResponse.success(res, 'Geographic location tree retrieved successfully', tree);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/locations/search
   */
  public static async searchLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const limit = Number(req.query.limit) || 15;
      const results = await LocationService.searchLocations(query, limit);
      ApiResponse.success(res, `Location search results for '${query}'`, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/locations/:slug
   */
  public static async getLocationBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const location = await LocationService.getLocationBySlug(slug);
      ApiResponse.success(res, 'Location details retrieved successfully', location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/locations/:slug/news
   */
  public static async getNewsByLocationSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await LocationService.getNewsByLocationSlug(slug, page, limit);
      ApiResponse.success(res, `News for location ${slug} retrieved successfully`, {
        location: result.location,
        articles: result.articles,
      }, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
