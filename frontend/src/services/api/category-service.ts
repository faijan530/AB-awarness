import { apiClient } from './api-client';

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

export class CategoryService {
  public static async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return (response as any).data || response;
  }

  public static async getAdminCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/admin/categories');
    return (response as any).data || response;
  }

  public static async getCategoryTree(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories/tree');
    return (response as any).data || response;
  }

  public static async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${slug}`);
    return (response as any).data || response;
  }

  public static async getNewsByCategorySlug(slug: string, page = 1, limit = 10): Promise<any> {
    const response = await apiClient.get<any>(`/categories/${slug}/news`, { page, limit });
    return response;
  }

  public static async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    const response = await apiClient.post<Category>('/admin/categories', payload);
    return (response as any).data || response;
  }

  public static async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    const response = await apiClient.patch<Category>(`/admin/categories/${id}`, payload);
    return (response as any).data || response;
  }

  public static async activateCategory(id: string): Promise<Category> {
    const response = await apiClient.post<Category>(`/admin/categories/${id}/activate`);
    return (response as any).data || response;
  }

  public static async deactivateCategory(id: string): Promise<Category> {
    const response = await apiClient.post<Category>(`/admin/categories/${id}/deactivate`);
    return (response as any).data || response;
  }

  public static async deleteCategory(id: string): Promise<Category> {
    const response = await apiClient.delete<Category>(`/admin/categories/${id}`);
    return (response as any).data || response;
  }
}
