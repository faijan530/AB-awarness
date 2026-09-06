export interface UpdateProfilePayload {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangeEmailPayload {
  newEmail: string;
}

export interface ChangePhonePayload {
  newPhone: string;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivitySummary {
  registrationDate: Date;
  lastLoginAt: Date | null;
  commentsCount: number;
  bookmarksCount: number;
  reactionsCount: number;
  reportsCount: number;
  activeSessionsCount: number;
}
