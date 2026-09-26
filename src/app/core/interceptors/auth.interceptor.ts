import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** On a 401 from the API, drop the local session and bounce to login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err?.status === 401 && !req.url.includes('/auth/login')) {
        authService.clearUser();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
