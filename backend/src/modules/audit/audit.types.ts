export const AUDIT_ACTIONS = {
  // User Actions
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',

  // News & Editorial Actions
  NEWS_CREATED: 'NEWS_CREATED',
  NEWS_UPDATED: 'NEWS_UPDATED',
  NEWS_APPROVED: 'NEWS_APPROVED',
  NEWS_REJECTED: 'NEWS_REJECTED',
  NEWS_PUBLISHED: 'NEWS_PUBLISHED',
  NEWS_UNPUBLISHED: 'NEWS_UNPUBLISHED',
  NEWS_ARCHIVED: 'NEWS_ARCHIVED',

  // Verification & Moderation Actions
  VERIFICATION_STARTED: 'VERIFICATION_STARTED',
  VERIFICATION_COMPLETED: 'VERIFICATION_COMPLETED',
  VERIFICATION_OVERRIDDEN: 'VERIFICATION_OVERRIDDEN',
  COMMENT_HIDDEN: 'COMMENT_HIDDEN',
  COMMENT_RESTORED: 'COMMENT_RESTORED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',

  // System & Settings Actions
  SETTING_CHANGED: 'SETTING_CHANGED',
  FEATURE_FLAG_CHANGED: 'FEATURE_FLAG_CHANGED',
  MAINTENANCE_MODE_CHANGED: 'MAINTENANCE_MODE_CHANGED',
} as const;

export type AuditActionType = keyof typeof AUDIT_ACTIONS | string;

export interface RecordAuditDTO {
  actorId?: string;
  action: AuditActionType;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditQueryFilters {
  actor?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const AUDIT_ERROR_CODES = {
  NOT_FOUND: 'AUDIT_LOG_NOT_FOUND',
  ACCESS_DENIED: 'AUDIT_ACCESS_DENIED',
  INVALID_FILTER: 'AUDIT_INVALID_FILTER',
  IMMUTABLE: 'AUDIT_IMMUTABLE',
} as const;
