import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.auth?.roles || req.user?.roles || [];

    if (!roles.length) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const hasRole = roles.some((role) => allowedRoles.includes(role) || role === 'SUPER_ADMIN');
    if (!hasRole) {
      return next(new AppError('Access denied: insufficient privileges', 403, 'FORBIDDEN'));
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.auth?.roles || req.user?.roles || [];
    const userPermissions = req.auth?.permissions || [];

    if (!roles.length) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // Super Admin bypasses individual permission checks
    if (roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));
    if (!hasAllPermissions) {
      return next(new AppError('Access denied: missing required permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
}

export const requireRoles = requireRole;
export const requirePermissions = requirePermission;
