export type UserRole = 'admin' | 'user' | 'vendor';
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
}

export interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
}
