import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import { Category, CategorySeo, CategoryTreeNode } from '../models/category.model';

export interface CategoryPayload {
  name: string;
  parent?: string | null;
  description?: string;
  icon?: string;
  image?: string;
  seo?: CategorySeo;
  order?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  getAll(params?: { parent?: string | null }): Observable<ApiSuccess<Category[]>> {
    let url = this.baseUrl;
    if (params?.parent !== undefined) {
      url += `?parent=${params.parent === null ? 'null' : params.parent}`;
    }
    return this.http.get<ApiSuccess<Category[]>>(url);
  }

  getTree(): Observable<ApiSuccess<CategoryTreeNode[]>> {
    return this.http.get<ApiSuccess<CategoryTreeNode[]>>(`${this.baseUrl}/tree`);
  }

  getById(id: string): Observable<ApiSuccess<Category>> {
    return this.http.get<ApiSuccess<Category>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CategoryPayload): Observable<ApiSuccess<Category>> {
    return this.http.post<ApiSuccess<Category>>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<CategoryPayload>): Observable<ApiSuccess<Category>> {
    return this.http.put<ApiSuccess<Category>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }
}
