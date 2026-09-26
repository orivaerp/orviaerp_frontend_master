import { HttpInterceptorFn } from '@angular/common/http';

/** Ensures every API call sends the session cookie (connect.sid) to the backend. */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
