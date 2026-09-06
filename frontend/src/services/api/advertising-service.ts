import { apiClient } from './api-client';

export interface AdvertiserItem {
  id: string;
  name: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
  _count?: { campaigns: number };
}

export interface CampaignItem {
  id: string;
  advertiserId: string;
  name: string;
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startAt: string;
  endAt: string;
  budget: number | null;
  dailyBudget: number | null;
  targetLocation: string | null;
  targetCategory: string | null;
  advertiser?: { id: string; name: string };
  _count?: { creatives: number; metrics: number };
}

export interface AdCreativeItem {
  id: string;
  campaignId: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'TEXT';
  mediaUrl: string | null;
  headline: string;
  description: string | null;
  destinationUrl: string;
  status: string;
  campaign?: { id: string; name: string; status: string };
}

export interface AdPlacementItem {
  id: string;
  name: string;
  code: string;
  dimensions: string | null;
  isActive: boolean;
  priority: number;
}

export class AdvertisingService {
  // Public Ad Serving
  public static async serveAd(placementCode: string, location?: string, category?: string) {
    const response = await apiClient.get<any>('/ads/serve', {
      params: { placementCode, location, category },
    });
    return response.data;
  }

  public static async recordImpression(creativeId: string, placementCode: string) {
    await apiClient.post(`/ads/${creativeId}/impression`, { placementCode });
  }

  // Super Admin Management
  public static async getAdvertisers(params?: { search?: string; status?: string }): Promise<AdvertiserItem[]> {
    const response = await apiClient.get<AdvertiserItem[]>('/admin/advertisers', { params });
    return response.data;
  }

  public static async createAdvertiser(data: { name: string; contactName?: string; email: string; phone?: string; status?: string }): Promise<AdvertiserItem> {
    const response = await apiClient.post<AdvertiserItem>('/admin/advertisers', data);
    return response.data;
  }

  public static async getCampaigns(params?: { advertiserId?: string; status?: string }): Promise<CampaignItem[]> {
    const response = await apiClient.get<CampaignItem[]>('/admin/campaigns', { params });
    return response.data;
  }

  public static async createCampaign(data: any): Promise<CampaignItem> {
    const response = await apiClient.post<CampaignItem>('/admin/campaigns', data);
    return response.data;
  }

  public static async updateCampaign(id: string, data: any): Promise<CampaignItem> {
    const response = await apiClient.patch<CampaignItem>(`/admin/campaigns/${id}`, data);
    return response.data;
  }

  public static async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete(`/admin/campaigns/${id}`);
  }

  public static async activateCampaign(id: string): Promise<CampaignItem> {
    const response = await apiClient.post<CampaignItem>(`/admin/campaigns/${id}/activate`);
    return response.data;
  }

  public static async pauseCampaign(id: string): Promise<CampaignItem> {
    const response = await apiClient.post<CampaignItem>(`/admin/campaigns/${id}/pause`);
    return response.data;
  }

  public static async getCreatives(params?: { campaignId?: string }): Promise<AdCreativeItem[]> {
    const response = await apiClient.get<AdCreativeItem[]>('/admin/ad-creatives', { params });
    return response.data;
  }

  public static async createCreative(data: any): Promise<AdCreativeItem> {
    const response = await apiClient.post<AdCreativeItem>('/admin/ad-creatives', data);
    return response.data;
  }

  public static async updateCreative(id: string, data: any): Promise<AdCreativeItem> {
    const response = await apiClient.patch<AdCreativeItem>(`/admin/ad-creatives/${id}`, data);
    return response.data;
  }

  public static async getPlacements(): Promise<AdPlacementItem[]> {
    const response = await apiClient.get<AdPlacementItem[]>('/admin/ad-placements');
    return response.data;
  }
}
