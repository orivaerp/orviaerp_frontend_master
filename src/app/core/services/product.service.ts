import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import { Product, ProductFaq, ProductPlan, ProductSeo, PricingType, ProductStatus } from '../models/product.model';

export interface ProductPayload {
  name: string;
  /** Optional — auto-generated from the category on create when left blank. */
  code?: string;
  shortDescription?: string;
  description?: string;
  category: string;
  subCategory?: string | null;
  subSubCategory?: string | null;
  tags?: string[];
  pricingType?: PricingType;
  price?: number;
  currency?: string;
  discount?: number;
  plans?: ProductPlan[];
  features?: string[];
  deliverables?: string[];
  faqs?: ProductFaq[];
  thumbnail?: string;
  gallery?: string[];
  demoUrl?: string;
  seo?: ProductSeo;
  status?: ProductStatus;
  isFeatured?: boolean;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  getAll(params?: { category?: string; subCategory?: string; status?: string }): Observable<ApiSuccess<Product[]>> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.subCategory) query.set('subCategory', params.subCategory);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return this.http.get<ApiSuccess<Product[]>>(qs ? `${this.baseUrl}?${qs}` : this.baseUrl);
  }

  getById(id: string): Observable<ApiSuccess<Product>> {
    return this.http.get<ApiSuccess<Product>>(`${this.baseUrl}/${id}`);
  }

  create(payload: ProductPayload): Observable<ApiSuccess<Product>> {
    return this.http.post<ApiSuccess<Product>>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<ProductPayload>): Observable<ApiSuccess<Product>> {
    return this.http.put<ApiSuccess<Product>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }
}
