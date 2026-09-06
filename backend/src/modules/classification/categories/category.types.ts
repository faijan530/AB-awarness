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

export interface CategoryDTO {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode extends CategoryDTO {
  children: CategoryTreeNode[];
}
