import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { UpdateProfilePayload, UserActivitySummary, UserProfileResponse } from './user.types';
import { UserStatus } from '@prisma/client';
import { SecurityAuditService } from '../../services/security-audit.service';

export class UserService {
  /**
   * Get current authenticated user profile with roles & permissions
   */
  public static async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status === UserStatus.DELETED) {
      throw new AppError('User profile not found or account has been deleted', 404, 'USER_NOT_FOUND');
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      throw new AppError(`Account is currently ${user.status.toLowerCase()}`, 403, 'USER_RESTRICTED');
    }

    const roles = user.userRoles.map((r) => r.role.name);
    const permissionsSet = new Set<string>();

    user.userRoles.forEach((r) => {
      r.role.rolePermissions.forEach((p) => {
        permissionsSet.add(p.permission.code);
      });
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      roles,
      permissions: Array.from(permissionsSet),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update self profile (fullName, bio, avatarUrl)
   */
  public static async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === UserStatus.DELETED) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: payload.fullName !== undefined ? payload.fullName.trim() : undefined,
        bio: payload.bio !== undefined ? payload.bio.trim() : undefined,
        avatarUrl: payload.avatarUrl !== undefined ? payload.avatarUrl : undefined,
      },
    });

    await SecurityAuditService.logSecurityEvent('ROLE_CHANGED', userId, userId, { updatedFields: Object.keys(payload) });

    return this.getProfile(updated.id);
  }

  /**
   * Upload / Set Avatar URL
   */
  public static async setAvatar(userId: string, avatarUrl: string): Promise<UserProfileResponse> {
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return this.getProfile(userId);
  }

  /**
   * Remove Avatar
   */
  public static async removeAvatar(userId: string): Promise<UserProfileResponse> {
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    return this.getProfile(userId);
  }

  /**
   * Get user activity summary
   */
  public static async getUserActivity(userId: string): Promise<UserActivitySummary> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const [commentsCount, bookmarksCount, reactionsCount, reportsCount, activeSessionsCount] = await Promise.all([
      prisma.comment.count({ where: { userId } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.reaction.count({ where: { userId } }),
      prisma.contentReport.count({ where: { reporterId: userId } }),
      prisma.refreshToken.count({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } } }),
    ]);

    return {
      registrationDate: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      commentsCount,
      bookmarksCount,
      reactionsCount,
      reportsCount,
      activeSessionsCount,
    };
  }

  /**
   * Request account deletion (Soft delete & PII Anonymization)
   */
  public static async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Revoke all active refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Soft delete & anonymize PII
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        fullName: 'Deleted User',
        email: `deleted_${userId.substring(0, 8)}@deleted.abmedia.in`,
        phone: null,
        avatarUrl: null,
        bio: null,
        deletedAt: new Date(),
      },
    });

    await SecurityAuditService.logSecurityEvent('LOGOUT_ALL', userId, userId, { message: 'User initiated account deletion' });
  }
}
