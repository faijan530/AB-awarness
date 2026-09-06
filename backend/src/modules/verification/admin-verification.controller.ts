import { Request, Response, NextFunction } from 'express';
import { VerificationService } from './verification.service';
import { ModerationService } from './moderation.service';
import { ApiResponse } from '../../utils/api-response';

export class AdminVerificationController {
  /**
   * GET /api/v1/admin/verification/dashboard
   */
  public static async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await VerificationService.getAdminDashboard();
      ApiResponse.success(res, 'Verification dashboard metrics retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/verification/queue
   */
  public static async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, type, priority, search, page, limit } = req.query;
      const result = await VerificationService.getAdminVerificationQueue({
        status: status as string,
        type: type as string,
        priority: priority as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      ApiResponse.success(res, 'Verification queue retrieved', result.items, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/verification/:id
   */
  public static async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await VerificationService.getVerificationResult(id, true);
      ApiResponse.success(res, 'Verification detail retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/verification/:id/claim-review
   */
  public static async reviewClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { claimId, decision, adminNotes } = req.body;
      const adminId = (req as any).user.id;

      const result = await VerificationService.reviewClaim(id, claimId, decision, adminNotes, adminId);
      ApiResponse.success(res, 'Claim review decision recorded', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/verification/:id/decision
   */
  public static async submitDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { decision, comments, requiredChanges } = req.body;
      const adminId = (req as any).user.id;

      const result = await VerificationService.submitEditorialDecision(id, decision, comments, requiredChanges, adminId);
      ApiResponse.success(res, 'Editorial decision submitted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/verification/:id/notes
   */
  public static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const adminId = (req as any).user.id;

      const result = await VerificationService.addModeratorNote(id, content, adminId);
      ApiResponse.success(res, 'Internal moderator note added', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/moderation/queue
   */
  public static async getModerationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, page, limit } = req.query;
      const result = await ModerationService.getModerationQueue({
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      ApiResponse.success(res, 'Moderation queue retrieved', result.items, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/moderation/:id
   */
  public static async getModerationDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ModerationService.getModerationDetail(id);
      ApiResponse.success(res, 'Moderation incident detail retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/moderation/:id/action
   */
  public static async takeModerationAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { action, reason, resolutionNote } = req.body;
      const adminId = (req as any).user.id;

      const result = await ModerationService.takeModerationAction(id, action, reason, resolutionNote, adminId);
      ApiResponse.success(res, 'Moderation action applied successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
