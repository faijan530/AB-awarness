import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { UserStatus, RoleName, Prisma } from '@prisma/client';
import {
  AdminUserListResponse,
  AdminUserQueryParams,
  AdminUserStatistics,
  SuspendUserPayload,
  BlockUserPayload,
} from './admin-user.types';
import { SecurityAuditService } from '../../services/security-audit.service';

export class AdminUserService {
  /**
   * Helper: Verify if target user is the LAST active Super Admin
   */
  private static async isLastSuperAdmin(targetUserId: string): Promise<boolean> {
    const targetIsSuperAdmin = await prisma.userRole.findFirst({
      where: {
        userId: targetUserId,
        role: { name: RoleName.SUPER_ADMIN },
      },
    });

    if (!targetIsSuperAdmin) return false;

    // Count all active Super Admins excluding deleted/blocked/suspended
    const activeSuperAdminsCount = await prisma.userRole.count({
      where: {
        role: { name: RoleName.SUPER_ADMIN },
        user: {
          status: UserStatus.ACTIVE,
        },
      },
    });

    return activeSuperAdminsCount <= 1;
  }

  /**
   * List users with pagination, search, filters & sorting
   */
  public static async getUsers(params: AdminUserQueryParams): Promise<AdminUserListResponse> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Search by name, email, or phone
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (params.status) {
      where.status = params.status;
    }

    // Filter by role
    if (params.role) {
      where.userRoles = {
        some: {
          role: {
            name: params.role,
          },
        },
      };
    }

    // Filter by email verified
    if (params.emailVerified !== undefined) {
      where.emailVerified = params.emailVerified;
    }

    // Whitelist sorting fields
    const validSortFields = ['createdAt', 'fullName', 'lastLoginAt', 'email'];
    const sortBy = validSortFields.includes(params.sortBy || '') ? params.sortBy! : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
    ]);

    const items = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      status: u.status,
      emailVerified: u.emailVerified,
      phoneVerified: u.phoneVerified,
      roles: u.userRoles.map((r) => r.role.name),
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      users: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Super Admin Dashboard Metrics
   */
  public static async getUserStatistics(): Promise<AdminUserStatistics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      blockedUsers,
      deletedUsers,
      verifiedEmailUsers,
      newUsersLast30Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      prisma.user.count({ where: { status: UserStatus.BLOCKED } }),
      prisma.user.count({ where: { status: UserStatus.DELETED } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      blockedUsers,
      deletedUsers,
      verifiedEmailUsers,
      newUsersLast30Days,
    };
  }

  /**
   * Get single user details for admin
   */
  public static async getUserDetails(userId: string) {
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

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
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
      failedLoginAttempts: user.failedLoginAttempts,
      lockoutUntil: user.lockoutUntil,
      roles,
      permissions: Array.from(permissionsSet),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  /**
   * Suspend user
   */
  public static async suspendUser(adminId: string, targetUserId: string, payload: SuspendUserPayload) {
    if (adminId === targetUserId) {
      throw new AppError('You cannot suspend your own admin account', 400, 'USER_CANNOT_MODIFY_SELF');
    }

    if (await this.isLastSuperAdmin(targetUserId)) {
      throw new AppError('Cannot suspend the last remaining Super Admin', 403, 'LAST_SUPER_ADMIN_PROTECTED');
    }

    // Revoke all active sessions
    await prisma.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.SUSPENDED },
    });

    await SecurityAuditService.logSecurityEvent('ACCOUNT_LOCKED', adminId, targetUserId, { reason: payload.reason, expiresAt: payload.expiresAt });

    return this.getUserDetails(updated.id);
  }

  /**
   * Unsuspend user
   */
  public static async unsuspendUser(adminId: string, targetUserId: string) {
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockoutUntil: null },
    });

    await SecurityAuditService.logSecurityEvent('ACCOUNT_UNLOCKED', adminId, targetUserId, { action: 'UNSUSPEND' });

    return this.getUserDetails(updated.id);
  }

  /**
   * Block user
   */
  public static async blockUser(adminId: string, targetUserId: string, payload: BlockUserPayload) {
    if (adminId === targetUserId) {
      throw new AppError('You cannot block your own admin account', 400, 'USER_CANNOT_MODIFY_SELF');
    }

    if (await this.isLastSuperAdmin(targetUserId)) {
      throw new AppError('Cannot block the last remaining Super Admin', 403, 'LAST_SUPER_ADMIN_PROTECTED');
    }

    await prisma.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.BLOCKED },
    });

    await SecurityAuditService.logSecurityEvent('ACCOUNT_LOCKED', adminId, targetUserId, { reason: payload.reason });

    return this.getUserDetails(updated.id);
  }

  /**
   * Unblock user
   */
  public static async unblockUser(adminId: string, targetUserId: string) {
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockoutUntil: null },
    });

    await SecurityAuditService.logSecurityEvent('ACCOUNT_UNLOCKED', adminId, targetUserId, { action: 'UNBLOCK' });

    return this.getUserDetails(updated.id);
  }

  /**
   * Issue warning to user (Section 43 of Module 9 spec)
   */
  public static async warnUser(adminId: string, targetUserId: string, payload: { reason: string; severity?: string }) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    await SecurityAuditService.logSecurityEvent('USER_WARNED', adminId, targetUserId, {
      reason: payload.reason,
      severity: payload.severity || 'MEDIUM',
    });

    return {
      message: 'Official warning issued to user',
      userId: targetUserId,
      reason: payload.reason,
      severity: payload.severity || 'MEDIUM',
    };
  }

  /**
   * Activate inactive account
   */
  public static async activateUser(adminId: string, targetUserId: string) {
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockoutUntil: null },
    });

    await SecurityAuditService.logSecurityEvent('ACCOUNT_UNLOCKED', adminId, targetUserId, { action: 'ACTIVATE' });

    return this.getUserDetails(updated.id);
  }

  /**
   * Assign Role
   */
  public static async assignRole(adminId: string, targetUserId: string, roleName: RoleName) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new AppError(`Role ${roleName} does not exist`, 404, 'ROLE_NOT_FOUND');
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: targetUserId,
          roleId: role.id,
        },
      },
      create: {
        userId: targetUserId,
        roleId: role.id,
      },
      update: {},
    });

    await SecurityAuditService.logSecurityEvent('ROLE_CHANGED', adminId, targetUserId, { roleName, action: 'ASSIGN' });

    return this.getUserDetails(targetUserId);
  }

  /**
   * Remove Role
   */
  public static async removeRole(adminId: string, targetUserId: string, roleName: RoleName) {
    if (roleName === RoleName.SUPER_ADMIN && (await this.isLastSuperAdmin(targetUserId))) {
      throw new AppError('Cannot remove SUPER_ADMIN role from the last remaining Super Admin', 403, 'LAST_SUPER_ADMIN_PROTECTED');
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new AppError(`Role ${roleName} does not exist`, 404, 'ROLE_NOT_FOUND');
    }

    await prisma.userRole.deleteMany({
      where: {
        userId: targetUserId,
        roleId: role.id,
      },
    });

    await SecurityAuditService.logSecurityEvent('ROLE_CHANGED', adminId, targetUserId, { roleName, action: 'REMOVE' });

    return this.getUserDetails(targetUserId);
  }
}
