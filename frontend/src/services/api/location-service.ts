import { apiClient } from './api-client';

export type LocationType =
  | 'COUNTRY'
  | 'STATE'
  | 'DIVISION'
  | 'DISTRICT'
  | 'SUBDIVISION'
  | 'BLOCK'
  | 'CITY'
  | 'TOWN'
  | 'VILLAGE'
  | 'LOCAL_AREA';

export interface LocationItem {
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
  createdAt: string;
  updatedAt: string;
  children?: LocationItem[];
}

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

export class LocationService {
  public static async getLocations(type?: LocationType): Promise<LocationItem[]> {
    const response = await apiClient.get<LocationItem[]>('/locations', { type });
    return (response as any).data || response;
  }

  public static async getAdminLocations(): Promise<LocationItem[]> {
    const response = await apiClient.get<LocationItem[]>('/admin/locations');
    return (response as any).data || response;
  }

  public static async getLocationTree(): Promise<LocationItem[]> {
    const response = await apiClient.get<LocationItem[]>('/locations/tree');
    return (response as any).data || response;
  }

  public static async searchLocations(q: string): Promise<LocationItem[]> {
    const response = await apiClient.get<LocationItem[]>('/locations/search', { q });
    return (response as any).data || response;
  }

  public static async getLocationBySlug(slug: string): Promise<LocationItem> {
    const response = await apiClient.get<LocationItem>(`/locations/${slug}`);
    return (response as any).data || response;
  }

  public static async getNewsByLocationSlug(slug: string, page = 1, limit = 10): Promise<any> {
    const response = await apiClient.get<any>(`/locations/${slug}/news`, { page, limit });
    return response;
  }

  public static async createLocation(payload: CreateLocationPayload): Promise<LocationItem> {
    const response = await apiClient.post<LocationItem>('/admin/locations', payload);
    return (response as any).data || response;
  }

  public static async updateLocation(id: string, payload: UpdateLocationPayload): Promise<LocationItem> {
    const response = await apiClient.patch<LocationItem>(`/admin/locations/${id}`, payload);
    return (response as any).data || response;
  }

  public static async activateLocation(id: string): Promise<LocationItem> {
    const response = await apiClient.post<LocationItem>(`/admin/locations/${id}/activate`);
    return (response as any).data || response;
  }

  public static async deactivateLocation(id: string): Promise<LocationItem> {
    const response = await apiClient.post<LocationItem>(`/admin/locations/${id}/deactivate`);
    return (response as any).data || response;
  }

  public static async deleteLocation(id: string): Promise<LocationItem> {
    const response = await apiClient.delete<LocationItem>(`/admin/locations/${id}`);
    return (response as any).data || response;
  }
}
