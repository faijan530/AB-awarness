import { apiClient } from './api-client';
import { UserProfile } from '@/types/common.types';

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
}
