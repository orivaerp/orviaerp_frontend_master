import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/user.model';
import { Blog, BlogStatus } from '../models/blog.model';

export interface CreateBlogPayload {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  status?: BlogStatus;
  metaTitle?: string;
  metaDescription?: string;
}

export type UpdateBlogPayload = Partial<CreateBlogPayload>;

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = `${environment.apiUrl}/blogs`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiSuccess<Blog[]>> {
    return this.http.get<ApiSuccess<Blog[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiSuccess<Blog>> {
    return this.http.get<ApiSuccess<Blog>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateBlogPayload): Observable<ApiSuccess<Blog>> {
    return this.http.post<ApiSuccess<Blog>>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateBlogPayload): Observable<ApiSuccess<Blog>> {
    return this.http.put<ApiSuccess<Blog>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }
}
