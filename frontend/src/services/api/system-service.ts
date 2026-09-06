import { apiClient } from './api-client';

export interface SystemSettingItem {
  id: string;
  key: string;
  value: any;
  description: string | null;
  isPublic: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercentage: number;
  updatedBy: string | null;
  updatedAt: string;
}

export class SystemService {
  /**
   * Fetch public system configuration
   */
  static async getPublicConfig() {
    const response = await apiClient.get('/config/public');
    return (response as any)?.data;
  }

  /**
   * Fetch system settings (Super Admin)
   */
  static async getSettings() {
    const response = await apiClient.get('/admin/settings');
    return (response as any)?.data;
  }

  /**
   * Update whitelisted system setting
   */
  static async updateSetting(key: string, value: any, description?: string, isPublic?: boolean) {
    const response = await apiClient.patch(`/admin/settings/${key}`, { value, description, isPublic });
    return (response as any)?.data;
  }

  /**
   * Fetch feature flags (Super Admin)
   */
  static async getFeatureFlags() {
    const response = await apiClient.get('/admin/feature-flags');
    return (response as any)?.data;
  }

  /**
   * Create feature flag
   */
  static async createFeatureFlag(dto: { key: string; enabled?: boolean; description?: string; rolloutPercentage?: number }) {
    const response = await apiClient.post('/admin/feature-flags', dto);
    return (response as any)?.data;
  }

  /**
   * Update feature flag
   */
  static async updateFeatureFlag(key: string, dto: { enabled?: boolean; description?: string; rolloutPercentage?: number }) {
    const response = await apiClient.patch(`/admin/feature-flags/${key}`, dto);
    return (response as any)?.data;
  }

  /**
   * Enable feature flag
   */
  static async enableFeatureFlag(key: string) {
    const response = await apiClient.post(`/admin/feature-flags/${key}/enable`);
    return (response as any)?.data;
  }

  /**
   * Disable feature flag
   */
  static async disableFeatureFlag(key: string) {
    const response = await apiClient.post(`/admin/feature-flags/${key}/disable`);
    return (response as any)?.data;
  }

  /**
   * System Health Checks
   */
  static async getLiveness() {
    const response = await apiClient.get('/health/live');
    return (response as any)?.data;
  }

  static async getReadiness() {
    const response = await apiClient.get('/health/ready');
    return (response as any)?.data;
  }
}
