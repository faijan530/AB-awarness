import { PrismaClient } from '@prisma/client';
import { RecordAuditDTO, AuditQueryFilters, AUDIT_ERROR_CODES } from './audit.types';
import { AppError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'secretKey', 'otp'];

export class AuditService {
  /**
   * Redact sensitive fields from JSON payload before audit storage
   */
  private static redactSensitiveData(data?: Record<string, any>): Record<string, any> | null {
    if (!data) return null;
    const redacted = { ...data };

    for (const key of Object.keys(redacted)) {
      if (SENSITIVE_FIELDS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }
    return redacted;
  }

  /**
   * Record an immutable audit log entry
   */
  static async record(dto: RecordAuditDTO) {
    const { actorId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent } = dto;

    const safeOld = this.redactSensitiveData(oldValues);
    const safeNew = this.redactSensitiveData(newValues);

    const log = await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId: entityId || null,
        oldValues: safeOld || undefined,
        newValues: safeNew || undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return log;
  }

  /**
   * Fetch paginated audit logs with filtering
   */
  static async getAuditLogs(filters: AuditQueryFilters) {
    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.actor) where.actorId = filters.actor;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }

  /**
   * Get single audit log details by ID
   */
  static async getAuditLogById(id: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      throw new AppError('Audit log entry not found', 404, AUDIT_ERROR_CODES.NOT_FOUND);
    }

    return log;
  }

  /**
   * Fetch distinct action types recorded in audit logs dynamically
   */
  static async getDistinctActions() {
    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { action: 'asc' },
    });
    return actions.map((a) => a.action);
  }

  /**
   * Enforce Audit Immutability Guard
   */
  static preventMutation() {
    throw new AppError('Audit logs are immutable append-only records and cannot be altered or deleted', 403, AUDIT_ERROR_CODES.IMMUTABLE);
  }
}
