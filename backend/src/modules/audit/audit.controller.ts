import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { ApiResponse } from '../../utils/api-response';

export class AuditController {
  /**
   * GET /api/v1/admin/audit-logs
   */
  static async getAuditLogs(req: Request, res: Response) {
    const result = await AuditService.getAuditLogs(req.query as any);
    return ApiResponse.success(res, 'Audit logs retrieved successfully', result);
  }

  /**
   * GET /api/v1/admin/audit-logs/actions/distinct
   */
  static async getDistinctActions(_req: Request, res: Response) {
    const actions = await AuditService.getDistinctActions();
    return ApiResponse.success(res, 'Distinct audit actions retrieved', actions);
  }

  /**
   * GET /api/v1/admin/audit-logs/:id
   */
  static async getAuditLogById(req: Request, res: Response) {
    const { id } = req.params;
    const log = await AuditService.getAuditLogById(id);
    return ApiResponse.success(res, 'Audit log detail retrieved', log);
  }
}
