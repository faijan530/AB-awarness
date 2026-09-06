import { apiClient } from './api-client';
import { UserProfile, UserSession } from '@/types/common.types';

export interface LoginPayload {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponseData {
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
}

export class AuthService {
  public static async login(payload: LoginPayload): Promise<AuthResponseData> {
    const response = await apiClient.post<AuthResponseData>('/auth/login', payload);
    if (response.data.accessToken) {
      localStorage.setItem('ab_access_token', response.data.accessToken);
    }
    return response.data;
  }

  public static async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const response = await apiClient.post<AuthResponseData>('/auth/register', payload);
    if (response.data.accessToken) {
      localStorage.setItem('ab_access_token', response.data.accessToken);
    }
    return response.data;
  }

  public static async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  public static async resetPassword(token: string, newPassword?: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  }

  public static async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post('/auth/change-password', payload);
  }

  public static async getSessions(): Promise<UserSession[]> {
    const response = await apiClient.get<UserSession[]>('/auth/sessions');
    return response.data;
  }

  public static async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  }

  public static async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      localStorage.removeItem('ab_access_token');
    }
  }

  public static async resendVerification(): Promise<string> {
    const response = await apiClient.post<{ message?: string }>('/auth/resend-verification');
    return response.message || 'Verification link re-sent successfully';
  }

  public static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Best-effort logout API notification
    } finally {
      localStorage.removeItem('ab_access_token');
    }
  }

  public static async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  }

  public static async updateProfile(payload: { fullName?: string; bio?: string; avatarUrl?: string }): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>('/users/me', payload);
    return response.data;
  }
}
