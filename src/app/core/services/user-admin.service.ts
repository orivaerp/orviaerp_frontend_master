import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess, User, UserRole, UserStatus } from '../models/user.model';

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

/** Admin-side user management (list/create/delete) — distinct from AuthService,
 *  which only manages the current logged-in session. */
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getAll(): Observable<ApiSuccess<User[]>> {
    return this.http.get<ApiSuccess<User[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiSuccess<User>> {
    return this.http.get<ApiSuccess<User>>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateUserPayload): Observable<ApiSuccess<User>> {
    return this.http.post<ApiSuccess<User>>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateUserPayload): Observable<ApiSuccess<User>> {
    return this.http.put<ApiSuccess<User>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.baseUrl}/${id}`);
  }
}
