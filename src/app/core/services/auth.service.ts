import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess, User } from '../models/user.model';

const STORAGE_KEY = 'oerp.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<ApiSuccess<User>> {
    return this.http
      .post<ApiSuccess<User>>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap((res) => this.setUser(res.data)));
  }

  register(payload: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    password: string;
  }): Observable<ApiSuccess<User>> {
    return this.http.post<ApiSuccess<User>>(this.usersUrl, payload);
  }

  logout(): Observable<ApiSuccess<null>> {
    return this.http
      .post<ApiSuccess<null>>(`${this.baseUrl}/logout`, {})
      .pipe(tap(() => this.clearUser()));
  }

  forgotPassword(email: string): Observable<ApiSuccess<{ resetToken?: string }>> {
    return this.http.post<ApiSuccess<{ resetToken?: string }>>(`${this.baseUrl}/forgot-password`, {
      email,
    });
  }

  resetPassword(token: string, password: string): Observable<ApiSuccess<null>> {
    return this.http.patch<ApiSuccess<null>>(`${this.baseUrl}/reset-password/${token}`, {
      password,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiSuccess<null>> {
    return this.http.patch<ApiSuccess<null>>(`${this.baseUrl}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  /** Called by the auth interceptor when a request comes back 401. */
  clearUser(): void {
    this.currentUserSignal.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private setUser(user: User): void {
    this.currentUserSignal.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }

  private readStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
