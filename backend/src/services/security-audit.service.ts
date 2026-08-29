import { AuditRepository } from '../repositories/audit.repository';
import { logger } from '../config/logger';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFIED'
  | 'PHONE_VERIFIED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SESSION_REVOKED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'REFRESH_TOKEN_REUSE_DETECTED';

export class SecurityAuditService {
  public static async logSecurityEvent(
    event: SecurityEventType,
    actorId: string | null,
    entityId: string | null = null,
    details: Record<string, any> = {},
    ipAddress: string | null = null,
    userAgent: string | null = null
  ): Promise<void> {
    try {
      // Ensure no passwords or raw tokens exist in details
      const safeDetails = { ...details };
      delete safeDetails.password;
      delete safeDetails.rawToken;
      delete safeDetails.token;

      logger.info(`SECURITY_EVENT [${event}] actorId=${actorId || 'anonymous'}`, {
        event,
        actorId,
        ipAddress,
      });

      await AuditRepository.logAction(
        actorId,
        event,
        'SECURITY',
        entityId,
        null,
        safeDetails,
        ipAddress,
        userAgent
      );
    } catch (err) {
      logger.error(`Failed to record security audit log for event ${event}:`, err);
    }
  }
}
