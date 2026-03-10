export function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}
