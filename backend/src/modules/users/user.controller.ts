import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '../../utils/api-response';

export class UserController {
  /**
   * GET /api/v1/users/me
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const profile = await UserService.getProfile(userId);
      ApiResponse.success(res, 'User profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/me
   */
  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const { fullName, bio, avatarUrl } = req.body;
      const updated = await UserService.updateProfile(userId, { fullName, bio, avatarUrl });
      ApiResponse.success(res, 'Profile updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/me/avatar
   */
  public static async setAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const { avatarUrl } = req.body;
      const updated = await UserService.setAvatar(userId, avatarUrl);
      ApiResponse.success(res, 'Avatar updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me/avatar
   */
  public static async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const updated = await UserService.removeAvatar(userId);
      ApiResponse.success(res, 'Avatar removed successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/activity
   */
  public static async getUserActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const activity = await UserService.getUserActivity(userId);
      ApiResponse.success(res, 'User activity summary retrieved', activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me
   */
  public static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth!.userId;
      await UserService.deleteAccount(userId);
      ApiResponse.success(res, 'Account successfully deleted & anonymized');
    } catch (error) {
      next(error);
    }
  }
}
