import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/** Where each role lands when it opens a page it isn't allowed to see. */
export function homeFor(role: UserRole | null): string {
  return role === 'vendor' || role === 'sales' ? '/dashboard/enquiries' : '/dashboard';
}

/** Allows the route only for the given roles; everyone else is sent to their own home. */
export const roleGuard =
  (...allowed: UserRole[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole(...allowed)) {
      return true;
    }
    return router.createUrlTree([homeFor(authService.role())]);
  };

/** The bare /dashboard home: vendor and sales have no overview, so send them to enquiries. */
export const dashboardHomeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isEnquiryOnly() ? router.createUrlTree(['/dashboard/enquiries']) : true;
};
