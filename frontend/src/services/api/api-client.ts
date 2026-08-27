import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiSuccessResponse } from '@/types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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

// Interceptor for 401 session expiration handling
let onSessionExpiredCallback: (() => void) | null = null;

export const setOnSessionExpired = (callback: () => void) => {
  onSessionExpiredCallback = callback;
};

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response && error.response.status === 401) {
      if (onSessionExpiredCallback) {
        onSessionExpiredCallback();
      }
    }
    return Promise.reject(error);
  }
);

export class ApiClient {
  public async get<T>(url: string, params?: Record<string, any>): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.get<ApiSuccessResponse<T>>(url, { params });
    return response.data;
  }

  public async post<T>(url: string, data?: any): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.post<ApiSuccessResponse<T>>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: any): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.put<ApiSuccessResponse<T>>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<ApiSuccessResponse<T>> {
    const response = await httpClient.delete<ApiSuccessResponse<T>>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
