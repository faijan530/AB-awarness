import argon2 from 'argon2';
import { AppError } from '../middlewares/error.middleware';

export class PasswordService {
  /**
   * Hashes plain text password using Argon2id
   */
  public static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verifies plain text password against Argon2id hash
   */
  public static async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Validates password against production security policy:
   * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
   */
  public static validatePasswordPolicy(password: string): void {
    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new AppError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400,
        'WEAK_PASSWORD'
      );
    }
  }
}
