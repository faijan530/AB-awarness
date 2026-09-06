import { AdvertiserStatus, CampaignStatus, AdCreativeType } from '@prisma/client';

export interface CreateAdvertiserDTO {
  name: string;
  contactName?: string;
  email: string;
  phone?: string;
  status?: AdvertiserStatus;
}

export interface UpdateAdvertiserDTO {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  status?: AdvertiserStatus;
}

export interface CreateCampaignDTO {
  advertiserId: string;
  name: string;
  startAt: string | Date;
  endAt: string | Date;
  budget?: number;
  dailyBudget?: number;
  targetLocation?: string;
  targetCategory?: string;
  status?: CampaignStatus;
  headline?: string;
  mediaUrl?: string;
  destinationUrl?: string;
  description?: string;
  creativeType?: AdCreativeType;
}

export interface UpdateCampaignDTO {
  name?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  budget?: number;
  dailyBudget?: number;
  targetLocation?: string;
  targetCategory?: string;
  status?: CampaignStatus;
}

export interface CreateCreativeDTO {
  campaignId: string;
  name: string;
  type?: AdCreativeType;
  mediaUrl?: string;
  headline: string;
  description?: string;
  destinationUrl: string;
  status?: string;
}

export interface UpdateCreativeDTO {
  name?: string;
  type?: AdCreativeType;
  mediaUrl?: string;
  headline?: string;
  description?: string;
  destinationUrl?: string;
  status?: string;
}

export interface UpdatePlacementDTO {
  name?: string;
  dimensions?: string;
  isActive?: boolean;
  priority?: number;
}

export interface AdServeQuery {
  placementCode: string;
  location?: string;
  category?: string;
}

export interface ServedAdResponse {
  creativeId: string;
  campaignId: string;
  placementCode: string;
  name: string;
  type: AdCreativeType;
  headline: string;
  description: string | null;
  mediaUrl: string | null;
  clickUrl: string;
  impressionUrl: string;
  allAds?: ServedAdResponse[];
}
