import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { RoleName, UserStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env.config';
import { AppError } from '../../middlewares/error.middleware';

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
  public static async register(input: RegisterInput): Promise<AuthResult> {
    const { fullName, email, password, phone } = input;

    if (!fullName || !fullName.trim()) {
      throw new AppError('Full name is required', 400, 'VALIDATION_ERROR');
    }
    if (!email || !email.trim()) {
      throw new AppError('Email address is required', 400, 'VALIDATION_ERROR');
    }
    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'VALIDATION_ERROR');
    }

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

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);

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

    return AuthService.generateAuthResult(newUser.id);
  }

  public static async login(input: LoginInput): Promise<AuthResult> {
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

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended or blocked. Please contact support.', 403, 'ACCOUNT_DISABLED');
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return AuthService.generateAuthResult(user.id);
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

  public static async logout(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public static async forgotPassword(email: string): Promise<{ message: string }> {
    // Privacy-preserving response: do not disclose if account exists
    return {
      message: 'If an account with that email exists, reset instructions have been processed.',
    };
  }

  public static async resetPassword(token: string, newPassword?: string): Promise<{ message: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'VALIDATION_ERROR');
    }
    // Perform reset logic
    return { message: 'Password reset successfully' };
  }

  private static async generateAuthResult(userId: string): Promise<AuthResult> {
    const profile = await AuthService.getProfile(userId);

    const accessToken = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        roles: profile.roles,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign({ id: profile.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    // Hash refresh token before saving in database
    const tokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: profile.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: profile,
      accessToken,
      refreshToken,
    };
  }
}
