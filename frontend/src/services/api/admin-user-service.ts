import { apiClient } from './api-client';

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'DELETED';
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserStatistics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  blockedUsers: number;
  deletedUsers: number;
  verifiedEmailUsers: number;
  newUsersLast30Days: number;
}

export interface AdminUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  emailVerified?: boolean;
}

export class AdminUserService {
  public static async getUsers(params: AdminUserQueryParams): Promise<AdminUserListResponse> {
    const response = await apiClient.get<AdminUserListResponse>('/admin/users', { params });
    return response.data;
  }

  public static async getUserStatistics(): Promise<AdminUserStatistics> {
    const response = await apiClient.get<AdminUserStatistics>('/admin/users/statistics');
    return response.data;
  }

  public static async getUserDetails(userId: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/users/${userId}`);
    return response.data;
  }

  public static async warnUser(userId: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/warn`, { reason });
  }

  public static async suspendUser(userId: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/suspend`, { reason });
  }

  public static async unsuspendUser(userId: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/unsuspend`);
  }

  public static async blockUser(userId: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/block`, { reason });
  }

  public static async unblockUser(userId: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/unblock`);
  }

  public static async activateUser(userId: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/activate`);
  }

  public static async assignRole(userId: string, roleName: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/roles`, { roleName });
  }

  public static async removeRole(userId: string, roleName: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}/roles/${roleName}`);
  }
}
