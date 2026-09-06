import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { prisma } from '../config/database';
import { UserStatus } from '@prisma/client';
import { AppError } from './error.middleware';

export interface AuthContext {
  userId: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        roles: string[];
      };
      auth?: AuthContext;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Bearer token missing.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub?: string;
      id?: string;
      email: string | null;
      roles: string[];
    };

    const userId = decoded.id || decoded.sub;
    if (!userId) {
      return next(new AppError('Invalid token claims', 401, 'UNAUTHORIZED'));
    }

    // Verify current account status from database
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        status: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: { code: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return next(new AppError('User account not found or deleted', 401, 'USER_NOT_FOUND'));
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      return next(new AppError('Your account has been suspended or blocked', 403, 'ACCOUNT_DISABLED'));
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code)))
    );

    req.user = {
      id: user.id,
      email: user.email,
      roles,
    };

    req.auth = {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired access token', 401, 'UNAUTHORIZED'));
  }
}

export const authenticateToken = authenticate;

