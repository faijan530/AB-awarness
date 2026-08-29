import { RoleName, UserStatus, VerificationTokenType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { PasswordService } from '../../services/password.service';
import { TokenService } from '../../services/token.service';
import { SecurityAuditService } from '../../services/security-audit.service';

export interface RegisterInput {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
}

export interface AuthResult {
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    roles: string[];
    permissions: string[];
    avatarUrl: string | null;
    bio: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    status: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  public static async register(input: RegisterInput, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { fullName, email, password, phone } = input;

    if (!fullName || !fullName.trim()) {
      throw new AppError('Full name is required', 400, 'VALIDATION_ERROR');
    }
    if (!email || !email.trim()) {
      throw new AppError('Email address is required', 400, 'VALIDATION_ERROR');
    }
    if (!password) {
      throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
    }

    // Validate password complexity
    PasswordService.validatePasswordPolicy(password);

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null },
    });
    if (existingEmail) {
      throw new AppError('An account with this email address already exists', 409, 'DUPLICATE_EMAIL');
    }

    // Check duplicate phone if provided
    let cleanPhone: string | undefined;
    if (phone && phone.trim()) {
      cleanPhone = phone.trim();
      const existingPhone = await prisma.user.findFirst({
        where: { phone: cleanPhone, deletedAt: null },
      });
      if (existingPhone) {
        throw new AppError('An account with this phone number already exists', 409, 'DUPLICATE_PHONE');
      }
    }

    // Hash password with Argon2id
    const passwordHash = await PasswordService.hashPassword(password);

    // Get default USER role
    let userRole = await prisma.role.findUnique({
      where: { name: RoleName.USER },
    });
    if (!userRole) {
      userRole = await prisma.role.create({
        data: {
          name: RoleName.USER,
          description: 'Standard end-user citizen account',
        },
      });
    }

    // Create user and user_role in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: cleanPhone || null,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.userRole.create({
        data: {
          userId: u.id,
          roleId: userRole.id,
        },
      });

      return u;
    });

    // Generate initial verification token
    const rawVerificationToken = TokenService.generateRandomToken();
    const tokenHash = await TokenService.hashToken(rawVerificationToken);
    await prisma.verificationToken.create({
      data: {
        userId: newUser.id,
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    return AuthService.generateAuthResult(newUser.id, ipAddress, userAgent);
  }

  public static async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password } = input;

    if (!email || !email.trim()) {
      throw new AppError('Email address is required', 400, 'VALIDATION_ERROR');
    }
    if (!password) {
      throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null },
    });

    // Anti-enumeration: if user doesn't exist, log attempt and throw generic error
    if (!user || !user.passwordHash) {
      await SecurityAuditService.logSecurityEvent('LOGIN_FAILED', null, null, { email: cleanEmail, reason: 'User not found' }, ipAddress, userAgent);
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check brute-force temporary lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      await SecurityAuditService.logSecurityEvent('LOGIN_FAILED', user.id, user.id, { reason: 'Account locked' }, ipAddress, userAgent);
      throw new AppError(
        `Account is temporarily locked due to consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    // Check account status
    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      await SecurityAuditService.logSecurityEvent('LOGIN_FAILED', user.id, user.id, { reason: 'Account disabled' }, ipAddress, userAgent);
      throw new AppError('Your account has been suspended or blocked. Please contact support.', 403, 'ACCOUNT_DISABLED');
    }

    const isValid = await PasswordService.verifyPassword(user.passwordHash, password);
    if (!isValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutUntil: Date | null = null;

      if (failedAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
        await SecurityAuditService.logSecurityEvent('ACCOUNT_LOCKED', user.id, user.id, { failedAttempts, lockoutUntil }, ipAddress, userAgent);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockoutUntil,
        },
      });

      await SecurityAuditService.logSecurityEvent('LOGIN_FAILED', user.id, user.id, { failedAttempts }, ipAddress, userAgent);
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Successful login: reset failed attempts & update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await SecurityAuditService.logSecurityEvent('LOGIN_SUCCESS', user.id, user.id, {}, ipAddress, userAgent);

    return AuthService.generateAuthResult(user.id, ipAddress, userAgent);
  }

  public static async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400, 'VALIDATION_ERROR');
    }

    let payload: { id: string };
    try {
      payload = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: payload.id },
    });

    let matchedTokenRecord = null;
    let isReusedToken = false;

    for (const record of activeTokens) {
      const match = await TokenService.verifyTokenHash(record.tokenHash, refreshToken);
      if (match) {
        if (record.revokedAt !== null) {
          isReusedToken = true;
        } else {
          matchedTokenRecord = record;
        }
        break;
      }
    }

    // Token reuse detection: if a revoked token is used, revoke all sessions for security
    if (isReusedToken) {
      await AuthService.logoutAll(payload.id, ipAddress, userAgent);
      await SecurityAuditService.logSecurityEvent('REFRESH_TOKEN_REUSE_DETECTED', payload.id, payload.id, { reason: 'Attempted reuse of revoked token' }, ipAddress, userAgent);
      throw new AppError('Security alert: Refresh token reuse detected. All active sessions have been revoked.', 401, 'TOKEN_REUSE_DETECTED');
    }

    if (!matchedTokenRecord || matchedTokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Revoke old refresh token (Token Rotation)
    await prisma.refreshToken.update({
      where: { id: matchedTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return AuthService.generateAuthResult(payload.id, ipAddress, userAgent);
  }

  public static async logout(userId: string, refreshToken?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    if (refreshToken) {
      const tokens = await prisma.refreshToken.findMany({ where: { userId, revokedAt: null } });
      for (const t of tokens) {
        const match = await TokenService.verifyTokenHash(t.tokenHash, refreshToken);
        if (match) {
          await prisma.refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
          break;
        }
      }
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await SecurityAuditService.logSecurityEvent('LOGOUT', userId, userId, {}, ipAddress, userAgent);
  }

  public static async logoutAll(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await SecurityAuditService.logSecurityEvent('LOGOUT_ALL', userId, userId, {}, ipAddress, userAgent);
  }

  public static async changePassword(userId: string, currentPassword: string, newPassword: string, ipAddress?: string, userAgent?: string): Promise<void> {
    if (!currentPassword) {
      throw new AppError('Current password is required', 400, 'VALIDATION_ERROR');
    }
    PasswordService.validatePasswordPolicy(newPassword);

    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user || !user.passwordHash) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await PasswordService.verifyPassword(user.passwordHash, currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await PasswordService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all sessions on password change
    await AuthService.logoutAll(userId, ipAddress, userAgent);
    await SecurityAuditService.logSecurityEvent('PASSWORD_CHANGED', userId, userId, {}, ipAddress, userAgent);
  }

  public static async forgotPassword(email: string, ipAddress?: string, userAgent?: string): Promise<{ message: string; devToken?: string }> {
    if (!email || !email.trim()) {
      throw new AppError('Email address is required', 400, 'VALIDATION_ERROR');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({ where: { email: cleanEmail, deletedAt: null } });

    let devToken: string | undefined;

    if (user) {
      const rawToken = TokenService.generateRandomToken();
      const tokenHash = await TokenService.hashToken(rawToken);

      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          type: VerificationTokenType.PASSWORD_RESET,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        },
      });

      devToken = rawToken;
      await SecurityAuditService.logSecurityEvent('PASSWORD_RESET', user.id, user.id, { action: 'requested' }, ipAddress, userAgent);
    }

    return {
      message: 'If an account with that email exists, reset instructions have been processed.',
      ...(process.env.NODE_ENV !== 'production' && devToken ? { devToken } : {}),
    };
  }

  public static async resetPassword(token: string, newPassword: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    if (!token) {
      throw new AppError('Reset token is required', 400, 'VALIDATION_ERROR');
    }
    PasswordService.validatePasswordPolicy(newPassword);

    const activeTokens = await prisma.verificationToken.findMany({
      where: {
        type: VerificationTokenType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenRecord = null;
    for (const record of activeTokens) {
      const isMatch = await TokenService.verifyTokenHash(record.tokenHash, token);
      if (isMatch) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new AppError('Invalid or expired password reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const newPasswordHash = await PasswordService.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: matchedTokenRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.verificationToken.update({
        where: { id: matchedTokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await AuthService.logoutAll(matchedTokenRecord.userId, ipAddress, userAgent);
    await SecurityAuditService.logSecurityEvent('PASSWORD_RESET', matchedTokenRecord.userId, matchedTokenRecord.userId, { action: 'completed' }, ipAddress, userAgent);

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }

  public static async verifyEmail(token: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    if (!token) {
      throw new AppError('Verification token is required', 400, 'VALIDATION_ERROR');
    }

    const activeTokens = await prisma.verificationToken.findMany({
      where: {
        type: VerificationTokenType.EMAIL_VERIFICATION,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenRecord = null;
    for (const record of activeTokens) {
      const isMatch = await TokenService.verifyTokenHash(record.tokenHash, token);
      if (isMatch) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new AppError('Invalid or expired email verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: matchedTokenRecord.userId },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.update({
        where: { id: matchedTokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await SecurityAuditService.logSecurityEvent('EMAIL_VERIFIED', matchedTokenRecord.userId, matchedTokenRecord.userId, {}, ipAddress, userAgent);

    return { message: 'Email address verified successfully.' };
  }

  public static async resendVerification(userId: string, ipAddress?: string, userAgent?: string): Promise<{ message: string; devToken?: string }> {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
    }

    if (user.emailVerified) {
      throw new AppError('Email address is already verified', 400, 'ALREADY_VERIFIED');
    }

    const rawVerificationToken = TokenService.generateRandomToken();
    const tokenHash = await TokenService.hashToken(rawVerificationToken);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return {
      message: 'Verification email has been re-sent.',
      ...(process.env.NODE_ENV !== 'production' ? { devToken: rawVerificationToken } : {}),
    };
  }

  public static async getSessions(userId: string) {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        deviceInfo: true,
        ipAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  public static async revokeSession(userId: string, sessionId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const session = await prisma.refreshToken.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });

    if (!session) {
      throw new AppError('Session not found or already revoked', 404, 'SESSION_NOT_FOUND');
    }

    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await SecurityAuditService.logSecurityEvent('SESSION_REVOKED', userId, sessionId, {}, ipAddress, userAgent);
  }

  public static async getProfile(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
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
      throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code)))
    );

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roles,
      permissions,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  private static async generateAuthResult(userId: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const profile = await AuthService.getProfile(userId);
    const accessToken = TokenService.generateAccessToken({ id: profile.id, email: profile.email, roles: profile.roles });
    const refreshToken = TokenService.generateRefreshToken(profile.id);

    const tokenHash = await TokenService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: profile.id,
        tokenHash,
        expiresAt,
        deviceInfo: userAgent || 'Unknown Device',
        ipAddress: ipAddress || 'Unknown IP',
      },
    });

    return {
      user: profile,
      accessToken,
      refreshToken,
    };
  }
}
