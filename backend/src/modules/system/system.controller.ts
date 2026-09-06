import { Request, Response } from 'express';
import { SystemService } from './system.service';
import { ApiResponse } from '../../utils/api-response';

export class SystemController {
  /**
   * GET /api/v1/admin/settings
   */
  static async getSettings(_req: Request, res: Response) {
    const settings = await SystemService.getSettings();
    return ApiResponse.success(res, 'System settings retrieved', settings);
  }

  /**
   * GET /api/v1/admin/settings/:key
   */
  static async getSettingByKey(req: Request, res: Response) {
    const { key } = req.params;
    const setting = await SystemService.getSettingByKey(key);
    return ApiResponse.success(res, 'System setting detail retrieved', setting);
  }

  /**
   * PATCH /api/v1/admin/settings/:key
   */
  static async updateSetting(req: Request, res: Response) {
    const { key } = req.params;
    const updatedBy = req.user?.id;
    const setting = await SystemService.updateSetting(key, req.body, updatedBy);
    return ApiResponse.success(res, `System setting '${key}' updated successfully`, setting);
  }

  /**
   * GET /api/v1/config/public
   */
  static async getPublicConfig(_req: Request, res: Response) {
    const config = await SystemService.getPublicConfig();
    return ApiResponse.success(res, 'Public system configuration retrieved', config);
  }

  /**
   * GET /api/v1/admin/feature-flags
   */
  static async getFeatureFlags(_req: Request, res: Response) {
    const flags = await SystemService.getFeatureFlags();
    return ApiResponse.success(res, 'Feature flags retrieved', flags);
  }

  /**
   * POST /api/v1/admin/feature-flags
   */
  static async createFeatureFlag(req: Request, res: Response) {
    const updatedBy = req.user?.id;
    const flag = await SystemService.createFeatureFlag(req.body, updatedBy);
    return ApiResponse.success(res, `Feature flag '${flag.key}' created`, flag, undefined, 201);
  }

  /**
   * PATCH /api/v1/admin/feature-flags/:key
   */
  static async updateFeatureFlag(req: Request, res: Response) {
    const { key } = req.params;
    const updatedBy = req.user?.id;
    const flag = await SystemService.updateFeatureFlag(key, req.body, updatedBy);
    return ApiResponse.success(res, `Feature flag '${key}' updated`, flag);
  }

  /**
   * POST /api/v1/admin/feature-flags/:key/enable
   */
  static async enableFeatureFlag(req: Request, res: Response) {
    const { key } = req.params;
    const updatedBy = req.user?.id;
    const flag = await SystemService.updateFeatureFlag(key, { enabled: true }, updatedBy);
    return ApiResponse.success(res, `Feature flag '${key}' enabled`, flag);
  }

  /**
   * POST /api/v1/admin/feature-flags/:key/disable
   */
  static async disableFeatureFlag(req: Request, res: Response) {
    const { key } = req.params;
    const updatedBy = req.user?.id;
    const flag = await SystemService.updateFeatureFlag(key, { enabled: false }, updatedBy);
    return ApiResponse.success(res, `Feature flag '${key}' disabled`, flag);
  }

  /**
   * GET /health/live
   */
  static getLiveness(_req: Request, res: Response) {
    const liveness = SystemService.getLiveness();
    return ApiResponse.success(res, 'Liveness check passed', liveness);
  }

  /**
   * GET /health/ready
   */
  static async getReadiness(_req: Request, res: Response) {
    const readiness = await SystemService.getReadiness();
    return ApiResponse.success(res, 'Readiness check passed', readiness);
  }
}
