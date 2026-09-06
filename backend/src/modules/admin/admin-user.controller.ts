import { Request, Response, NextFunction } from 'express';
import { AdminUserService } from './admin-user.service';
import { ApiResponse } from '../../utils/api-response';
import { UserStatus, RoleName } from '@prisma/client';

export class AdminUserController {
  /**
   * GET /api/v1/admin/users
   */
  public static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, status, role, emailVerified, sortBy, sortOrder } = req.query;

      const result = await AdminUserService.getUsers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as UserStatus,
        role: role as RoleName,
        emailVerified: emailVerified !== undefined ? emailVerified === 'true' : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      ApiResponse.success(res, 'User list retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users/statistics
   */
  public static async getUserStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminUserService.getUserStatistics();
      ApiResponse.success(res, 'User statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users/:userId
   */
  public static async getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const details = await AdminUserService.getUserDetails(userId);
      ApiResponse.success(res, 'User details retrieved successfully', details);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/suspend
   */
  public static async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;
      const { reason, expiresAt } = req.body;

      const result = await AdminUserService.suspendUser(adminId, userId, { reason, expiresAt });
      ApiResponse.success(res, 'User suspended successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/unsuspend
   */
  public static async unsuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;

      const result = await AdminUserService.unsuspendUser(adminId, userId);
      ApiResponse.success(res, 'User unsuspended successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/block
   */
  public static async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;
      const { reason } = req.body;

      const result = await AdminUserService.blockUser(adminId, userId, { reason });
      ApiResponse.success(res, 'User blocked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/unblock
   */
  public static async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;

      const result = await AdminUserService.unblockUser(adminId, userId);
      ApiResponse.success(res, 'User unblocked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/warn
   */
  public static async warnUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;
      const { reason, severity } = req.body;

      const result = await AdminUserService.warnUser(adminId, userId, { reason, severity });
      ApiResponse.success(res, 'Official warning issued to user', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/activate
   */
  public static async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;

      const result = await AdminUserService.activateUser(adminId, userId);
      ApiResponse.success(res, 'User activated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/roles
   */
  public static async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId } = req.params;
      const { roleName } = req.body;

      const result = await AdminUserService.assignRole(adminId, userId, roleName);
      ApiResponse.success(res, `Role ${roleName} assigned successfully`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/users/:userId/roles/:roleName
   */
  public static async removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.auth!.userId;
      const { userId, roleName } = req.params;

      const result = await AdminUserService.removeRole(adminId, userId, roleName as RoleName);
      ApiResponse.success(res, `Role ${roleName} removed successfully`, result);
    } catch (error) {
      next(error);
    }
  }
}
