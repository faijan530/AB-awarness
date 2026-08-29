import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { env } from '../config/env.config';

export interface TokenPayload {
  id: string;
  email: string | null;
  roles: string[];
}

export class TokenService {
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        sub: payload.id,
        id: payload.id,
        email: payload.email,
        roles: payload.roles,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );
  }

  public static generateRefreshToken(userId: string): string {
    return jwt.sign(
      {
        sub: userId,
        id: userId,
        jti: crypto.randomUUID(),
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );
  }

  public static generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public static async hashToken(rawToken: string): Promise<string> {
    return argon2.hash(rawToken, {
      type: argon2.argon2id,
      memoryCost: 2 ** 14,
      timeCost: 2,
    });
  }

  public static async verifyTokenHash(hash: string, rawToken: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, rawToken);
    } catch {
      return false;
    }
  }

  public static verifyAccessToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    return {
      id: decoded.id || decoded.sub,
      email: decoded.email || null,
      roles: decoded.roles || [],
    };
  }

  public static verifyRefreshToken(token: string): { id: string; jti?: string } {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
    return {
      id: decoded.id || decoded.sub,
      jti: decoded.jti,
    };
  }
}
