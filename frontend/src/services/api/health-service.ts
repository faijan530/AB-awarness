import { apiClient } from './api-client';

export interface HealthData {
  status: string;
  timestamp?: string;
  services?: {
    database: string;
    redis: string;
  };
}

export class HealthService {
  public static async getHealth(): Promise<HealthData> {
    const response = await apiClient.get<HealthData>('/health');
    return response.data;
  }

  public static async getApiIndex(): Promise<any> {
    const response = await apiClient.get<any>('/');
    return response.data;
  }
}
