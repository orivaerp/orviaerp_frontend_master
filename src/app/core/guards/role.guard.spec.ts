import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';
import { dashboardHomeGuard, homeFor, roleGuard } from './role.guard';

const ROLES: UserRole[] = ['admin', 'user', 'vendor', 'sales'];

function stubAuth(role: UserRole) {
  return {
    role: () => role,
    hasRole: (...allowed: UserRole[]) => allowed.includes(role),
    isEnquiryOnly: () => role === 'vendor' || role === 'sales',
  };
}

/** Runs a guard as `role` and returns `true` or the redirect URL it produced. */
function runGuard(role: UserRole, guard: (route: never, state: never) => unknown): true | string {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: stubAuth(role) }] });
  const router = TestBed.inject(Router);
  const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
  return result instanceof UrlTree ? router.serializeUrl(result) : (result as true);
}

describe('role guards', () => {
  it('sends each role to its own home', () => {
    expect(homeFor('admin')).toBe('/dashboard');
    expect(homeFor('user')).toBe('/dashboard');
    expect(homeFor('vendor')).toBe('/dashboard/enquiries');
    expect(homeFor('sales')).toBe('/dashboard/enquiries');
  });

  it('redirects vendor and sales away from the dashboard overview, but not admin or user', () => {
    expect(runGuard('vendor', dashboardHomeGuard as never)).toBe('/dashboard/enquiries');
    expect(runGuard('sales', dashboardHomeGuard as never)).toBe('/dashboard/enquiries');
    expect(runGuard('admin', dashboardHomeGuard as never)).toBe(true);
    expect(runGuard('user', dashboardHomeGuard as never)).toBe(true);
  });

  it('the enquiries route admits admin, vendor and sales but not a regular user', () => {
    const guard = roleGuard('admin', 'vendor', 'sales') as never;
    expect(runGuard('admin', guard)).toBe(true);
    expect(runGuard('vendor', guard)).toBe(true);
    expect(runGuard('sales', guard)).toBe(true);
    expect(runGuard('user', guard)).toBe('/dashboard');
  });

  it('admin-only routes (users, contacts, WhatsApp) bounce vendor and sales back to enquiries', () => {
    const guard = roleGuard('admin') as never;
    expect(runGuard('admin', guard)).toBe(true);
    expect(runGuard('vendor', guard)).toBe('/dashboard/enquiries');
    expect(runGuard('sales', guard)).toBe('/dashboard/enquiries');
    expect(runGuard('user', guard)).toBe('/dashboard');
  });

  it('blog/product routes are closed to vendor and sales', () => {
    const guard = roleGuard('admin', 'user') as never;
    for (const role of ROLES) {
      const allowed = role === 'admin' || role === 'user';
      expect(runGuard(role, guard) === true).toBe(allowed);
    }
  });
});
