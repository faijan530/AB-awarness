import { prisma } from '../config/database';
import { AuditLog, Prisma } from '@prisma/client';

export class AuditRepository {
  public static async logAction(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId: string | null = null,
    oldValues: Prisma.InputJsonValue | null = null,
    newValues: Prisma.InputJsonValue | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null
  ): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        oldValues: oldValues ?? undefined,
        newValues: newValues ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  }
}
