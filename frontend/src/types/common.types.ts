export type UserRole = 'SUPER_ADMIN' | 'USER';

export type PermissionCode =
  | 'NEWS_READ'
  | 'NEWS_CREATE'
  | 'NEWS_UPDATE'
  | 'NEWS_DELETE'
  | 'NEWS_PUBLISH'
  | 'NEWS_VERIFY'
  | 'USER_READ'
  | 'USER_UPDATE'
  | 'MEDIA_MANAGE'
  | 'COMMENT_MODERATE'
  | 'REPORT_MANAGE'
  | 'ADVERTISEMENT_MANAGE'
  | 'ANALYTICS_READ'
  | 'SYSTEM_SETTINGS_MANAGE';

export interface UserProfile {
  id: string;
  email: string | null;
  phone?: string | null;
  fullName: string;
  roles: UserRole[];
  permissions: PermissionCode[];
  avatarUrl?: string | null;
  bio?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  status?: string;
  createdAt?: string;
}

export type SessionStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'EXPIRED';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
