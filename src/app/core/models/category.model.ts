export interface CategorySeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: CategoryRef | string | null;
  ancestors?: CategoryRef[];
  level: number;
  path?: string;
  description?: string;
  icon?: string;
  image?: string;
  seo?: CategorySeo;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}
