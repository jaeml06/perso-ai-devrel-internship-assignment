import { describe, it, expect } from 'vitest';
import { isProtectedRoute } from '@/features/auth-login/lib/isProtectedRoute';

describe('isProtectedRoute', () => {
  it('returns true for /dashboard', () => {
    expect(isProtectedRoute('/dashboard')).toBe(true);
  });

  it('returns true for /dashboard/settings', () => {
    expect(isProtectedRoute('/dashboard/settings')).toBe(true);
  });

  it('returns false for /login', () => {
    expect(isProtectedRoute('/login')).toBe(false);
  });

  it('returns false for /', () => {
    expect(isProtectedRoute('/')).toBe(false);
  });

  it('returns false for /api/auth/callback/google', () => {
    expect(isProtectedRoute('/api/auth/callback/google')).toBe(false);
  });

  it('returns false for /unauthorized', () => {
    expect(isProtectedRoute('/unauthorized')).toBe(false);
  });
});
