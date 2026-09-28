import { CategoryRef } from './category.model';

export type PricingType = 'fixed' | 'starting-from' | 'custom-quote' | 'monthly';
export type ProductStatus = 'draft' | 'published' | 'archived';

export interface ProductPlan {
  _id?: string;
  name: string;
  price: number;
  features?: string[];
  deliveryDays?: number;
  revisions?: number;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductAddon {
  label: string;
  value?: string;
}

export interface ProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  code: string;
  label?: string;
  shortDescription?: string;
  description?: string;
  category: CategoryRef | string;
  subCategory?: CategoryRef | string | null;
  subSubCategory?: CategoryRef | string | null;
  tags?: string[];
  pricingType: PricingType;
  price?: number;
  currency: string;
  discount: number;
  plans?: ProductPlan[];
  features?: string[];
  deliverables?: string[];
  faqs?: ProductFaq[];
  addons?: ProductAddon[];
  notes?: string[];
  thumbnail?: string;
  gallery?: string[];
  demoUrl?: string;
  seo?: ProductSeo;
  status: ProductStatus;
  isFeatured: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}
