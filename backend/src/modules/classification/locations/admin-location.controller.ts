import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';
import { ApiResponse } from '../../../utils/api-response';

export class AdminLocationController {
  /**
   * GET /api/v1/admin/locations
   */
  public static async getAdminLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = await LocationService.getLocations(false);
      ApiResponse.success(res, 'All locations (active & inactive) retrieved', locations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/locations
   */
  public static async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const location = await LocationService.createLocation(req.body);
      ApiResponse.success(res, 'Location created successfully', location, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/locations/:id
   */
  public static async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await LocationService.updateLocation(id, req.body);
      ApiResponse.success(res, 'Location updated successfully', location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/locations/:id/activate
   */
  public static async activateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await LocationService.toggleActive(id, true);
      ApiResponse.success(res, 'Location activated successfully', location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/locations/:id/deactivate
   */
  public static async deactivateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await LocationService.toggleActive(id, false);
      ApiResponse.success(res, 'Location deactivated successfully', location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/locations/:id
   */
  public static async deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await LocationService.deleteLocation(id);
      ApiResponse.success(res, 'Location processed for deletion/deactivation successfully', location);
    } catch (error) {
      next(error);
    }
  }
}
