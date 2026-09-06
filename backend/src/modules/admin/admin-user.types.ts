import { UserStatus, RoleName } from '@prisma/client';

export interface AdminUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: RoleName;
  emailVerified?: boolean;
  sortBy?: 'createdAt' | 'fullName' | 'lastLoginAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface SuspendUserPayload {
  reason: string;
  expiresAt?: Date;
}

export interface BlockUserPayload {
  reason: string;
}

export interface AssignRolePayload {
  roleName: RoleName;
}
