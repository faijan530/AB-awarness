import { MediaType, MediaRole } from '@prisma/client';

export type MediaStatusType = 'ACTIVE' | 'PROCESSING' | 'READY' | 'FAILED' | 'QUARANTINED' | 'DELETED';

export interface InitUploadPayload {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: MediaType;
}

export interface CompleteUploadPayload {
  mediaId: string;
  storageKey: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface AttachNewsMediaPayload {
  newsId: string;
  mediaId: string;
  mediaRole: MediaRole;
  displayOrder?: number;
  caption?: string;
}

export interface MediaDto {
  id: string;
  uploadedBy: string;
  type: MediaType;
  originalName: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  status: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
