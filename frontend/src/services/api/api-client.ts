import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiSuccessResponse } from '@/types/api.types';

const getNormalizedBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!envUrl) return '/api/v1';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api/v1')) return cleanUrl;
  return `${cleanUrl}/api/v1`;
};

const API_BASE_URL = getNormalizedBaseUrl();

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// Interceptor for Bearer auth tokens
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ab_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 session expiration handling & auto-refresh
let onSessionExpiredCallback: (() => void) | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

export const setOnSessionExpired = (callback: () => void) => {
  onSessionExpiredCallback = callback;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;

    if (error.response && error.response.status === 401) {
      const url = originalRequest?.url || '';

      // Ignore auth endpoints and auth pages so login/register attempts don't trigger session expired modal
      const isAuthPage = typeof window !== 'undefined' && 
        (window.location.pathname === '/login' || window.location.pathname === '/register');
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token') || isAuthPage) {
        return Promise.reject(error);
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(httpClient(originalRequest));
              },
              reject: (err: any) => reject(err),
            });
          });
        }

        isRefreshing = true;

        try {
          // Attempt to refresh access token using HTTP-only cookie with fast 3500ms timeout
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true, timeout: 3500 });
          const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;

          if (newAccessToken) {
            localStorage.setItem('ab_access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            isRefreshing = false;
            return httpClient(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          if (onSessionExpiredCallback) {
            onSessionExpiredCallback();
          }
          return Promise.reject(refreshErr);
        }
      }

      if (onSessionExpiredCallback && !isRefreshing) {
        onSessionExpiredCallback();
      }
    }

    return Promise.reject(error);
  }
);

export class ApiClient {
  public async get<T>(url: string, params?: Record<string, any>): Promise<ApiSuccessResponse<T>> {
    let finalParams = params;
    if (params && typeof params === 'object' && 'params' in params && Object.keys(params).length === 1) {
      finalParams = (params as any).params;
    }
    const response = await httpClient.get<ApiSuccessResponse<T>>(url, { params: finalParams });
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.post<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.put<ApiSuccessResponse<T>>(url, data);
    return response.data;
  }

  public async patch<T>(url: string, data?: any): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.patch<ApiSuccessResponse<T>>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.delete<ApiSuccessResponse<T>>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
