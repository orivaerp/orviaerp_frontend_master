import { PageMeta } from './pagination.model';

export type UserRole = 'admin' | 'user' | 'vendor' | 'sales';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  /** Present only on paginated list responses. */
  meta?: PageMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
}
