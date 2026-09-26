export type BlogStatus = 'draft' | 'published' | 'archived';

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: { _id: string; firstName: string; lastName?: string } | string;
  category?: string;
  tags?: string[];
  status: BlogStatus;
  publishedAt?: string;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}
