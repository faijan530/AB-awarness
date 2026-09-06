export interface CreateTagPayload {
  name: string;
}

export interface UpdateTagPayload {
  name: string;
}

export interface TagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  articleCount?: number;
}
