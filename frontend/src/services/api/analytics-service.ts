import { apiClient } from './api-client';

export interface TrackEventDTO {
  event: string;
  entityType?: string;
  entityId?: string;
  anonymousId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  location?: string;
  author?: string;
  page?: number;
  limit?: number;
}

export class AnalyticsService {
  /**
   * Public or Authenticated Event Tracking
   */
  static async trackEvent(dto: TrackEventDTO) {
    const response = await apiClient.post('/analytics/events', dto);
    return (response as any)?.data;
  }

  /**
   * Super Admin Consolidated Dashboard Overview
   */
  static async getDashboard() {
    const response = await apiClient.get('/admin/dashboard');
    return (response as any)?.data;
  }

  /**
   * News Performance Analytics
   */
  static async getNewsAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/news', { params });
    return (response as any)?.data;
  }

  /**
   * Category Analytics
   */
  static async getCategoryAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/categories', { params });
    return (response as any)?.data;
  }

  /**
   * Location & Local Journalism Analytics
   */
  static async getLocationAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/locations', { params });
    return (response as any)?.data;
  }

  /**
   * User Growth Analytics
   */
  static async getUserAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/users', { params });
    return (response as any)?.data;
  }

  /**
   * Engagement Analytics
   */
  static async getEngagementAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/engagement', { params });
    return (response as any)?.data;
  }

  /**
   * Search Analytics & Zero-Result Query Insights
   */
  static async getSearchAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/search', { params });
    return (response as any)?.data;
  }

  /**
   * Advertising Analytics
   */
  static async getAdAnalytics(params?: AnalyticsFilters) {
    const response = await apiClient.get('/admin/analytics/advertising', { params });
    return (response as any)?.data;
  }

  /**
   * Export Analytics Data (CSV or JSON)
   */
  static async exportAnalytics(format: 'csv' | 'json' = 'csv', filters?: AnalyticsFilters) {
    if (format === 'csv') {
      const response = await apiClient.post('/admin/analytics/export', { format, ...filters }, { responseType: 'blob' });
      return response;
    }
    const response = await apiClient.post('/admin/analytics/export', { format, ...filters });
    return (response as any)?.data;
  }
}
