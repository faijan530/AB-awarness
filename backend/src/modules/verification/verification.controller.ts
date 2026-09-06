import { Request, Response, NextFunction } from 'express';
import { VerificationService } from './verification.service';
import { ApiResponse } from '../../utils/api-response';

export class VerificationController {
  /**
   * POST /api/v1/verification/request
   */
  public static async requestVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newsId, verificationType } = req.body;
      const userId = (req as any).user.id;

      const result = await VerificationService.requestVerification(newsId, verificationType, userId);
      ApiResponse.success(res, 'Verification initiated successfully', result, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/verification/status/:id
   */
  public static async getVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await VerificationService.getVerificationStatus(id);
      ApiResponse.success(res, 'Verification status retrieved', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/verification/result/:id
   */
  public static async getVerificationResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const isStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'CHIEF_EDITOR' || user?.role === 'EDITOR';

      const result = await VerificationService.getVerificationResult(id, isStaff, user?.id);
      ApiResponse.success(res, 'Verification result report retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/verification/my-history
   */
  public static async getMyVerificationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const history = await VerificationService.getMyVerificationHistory(userId);
      ApiResponse.success(res, 'Verification history retrieved', history);
    } catch (error) {
      next(error);
    }
  }
}
