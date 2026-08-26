import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiSuccessResponse, ApiErrorResponse } from '@/types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor: Attach Auth token if available
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('ab_media_access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: Normalize backend standard envelopes
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiSuccessResponse>) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const normalizedError = {
          message: error.response?.data?.message || error.message || 'An unexpected API error occurred',
          code: error.response?.data?.error?.code || 'NETWORK_ERROR',
          statusCode: error.response?.status || 500,
          details: error.response?.data?.error?.details || null,
        };
        return Promise.reject(normalizedError);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    const response = await this.instance.get<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    const response = await this.instance.post<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    const response = await this.instance.put<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    const response = await this.instance.delete<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
