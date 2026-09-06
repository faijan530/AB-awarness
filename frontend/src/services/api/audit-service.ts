import { apiClient } from './api-client';

export interface AuditFilters {
  actor?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor?: {
    id: string;
    fullName: string;
    email: string | null;
  } | null;
}

export class AuditService {
  /**
   * Fetch paginated audit logs with search/filtering
   */
  static async getAuditLogs(params?: AuditFilters) {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return (response as any)?.data;
  }

  /**
   * Fetch distinct recorded audit actions dynamically
   */
  static async getDistinctActions() {
    const response = await apiClient.get('/admin/audit-logs/actions/distinct');
    return (response as any)?.data || [];
  }

  /**
   * Fetch single audit log entry details by ID
   */
  static async getAuditLogById(id: string) {
    const response = await apiClient.get(`/admin/audit-logs/${id}`);
    return (response as any)?.data;
  }
}
