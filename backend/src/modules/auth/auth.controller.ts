import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/api-response';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, 'Account registered successfully', result, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, 'Login successful', result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      const result = await AuthService.refresh(refreshToken, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, 'Tokens refreshed successfully', result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (!userId) {
        return next(new Error('Unauthenticated user context'));
      }
      const profile = await AuthService.getProfile(userId);
      ApiResponse.success(res, 'Current user profile retrieved', profile, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (userId) {
        const refreshToken = req.body.refreshToken;
        await AuthService.logout(userId, refreshToken, req.ip, req.headers['user-agent']);
      }
      ApiResponse.success(res, 'Logged out successfully', {}, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (userId) {
        await AuthService.logoutAll(userId, req.ip, req.headers['user-agent']);
      }
      ApiResponse.success(res, 'Logged out from all devices successfully', {}, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (!userId) {
        return next(new Error('Unauthenticated user context'));
      }
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(userId, currentPassword, newPassword, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, 'Password changed successfully. Please log in with your new password.', {}, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, result.message, { ...(result.devToken ? { devToken: result.devToken } : {}) }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, result.message, {}, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const result = await AuthService.verifyEmail(token, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, result.message, {}, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (!userId) {
        return next(new Error('Unauthenticated user context'));
      }
      const result = await AuthService.resendVerification(userId, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, result.message, { ...(result.devToken ? { devToken: result.devToken } : {}) }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (!userId) {
        return next(new Error('Unauthenticated user context'));
      }
      const sessions = await AuthService.getSessions(userId);
      ApiResponse.success(res, 'Active sessions retrieved', sessions, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      if (!userId) {
        return next(new Error('Unauthenticated user context'));
      }
      const { id } = req.params;
      await AuthService.revokeSession(userId, id, req.ip, req.headers['user-agent']);
      ApiResponse.success(res, 'Session revoked successfully', {}, undefined, 200);
    } catch (error) {
      next(error);
    }
  }
}
