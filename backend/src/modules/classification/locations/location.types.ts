import { LocationType } from '@prisma/client';

export interface CreateLocationPayload {
  name: string;
  type: LocationType;
  parentId?: string | null;
  stateCode?: string | null;
  districtCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}

export interface UpdateLocationPayload {
  name?: string;
  type?: LocationType;
  parentId?: string | null;
  stateCode?: string | null;
  districtCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}

export interface LocationDTO {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  type: LocationType;
  stateCode: string | null;
  districtCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationTreeNode extends LocationDTO {
  children: LocationTreeNode[];
}
