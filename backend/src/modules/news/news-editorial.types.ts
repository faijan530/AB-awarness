import { NewsStatus } from '@prisma/client';

export interface CreateNewsPayload {
  title: string;
  shortDescription?: string;
  content: string;
  excerpt?: string;
  categoryIds?: string[];
  locationIds?: string[];
  tagIds?: string[];
  coverImageUrl?: string;
  featuredMediaId?: string;
  sources?: { sourceId: string; referenceUrl?: string; sourceNote?: string }[];
  isBreaking?: boolean;
  isFeatured?: boolean;
}

export interface UpdateNewsPayload {
  title?: string;
  shortDescription?: string;
  content?: string;
  excerpt?: string;
  categoryIds?: string[];
  locationIds?: string[];
  tagIds?: string[];
  coverImageUrl?: string;
  featuredMediaId?: string;
  sources?: { sourceId: string; referenceUrl?: string; sourceNote?: string }[];
  isBreaking?: boolean;
  isFeatured?: boolean;
  changeSummary?: string;
}

export interface RejectNewsPayload {
  reason: string;
}

export interface ScheduleNewsPayload {
  scheduledAt: string; // ISO Date String
}

export interface AdminNewsQueryParams {
  page?: number;
  limit?: number;
  status?: NewsStatus;
  search?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
}

export interface EditorialActionDTO {
  id: string;
  newsId: string;
  action: string;
  performedBy: {
    id: string;
    fullName: string;
  };
  remarks: string | null;
  createdAt: Date;
}

export interface NewsRevisionDTO {
  id: string;
  newsId: string;
  versionNumber: number;
  title: string;
  content: string;
  changeSummary: string | null;
  createdAt: Date;
}
