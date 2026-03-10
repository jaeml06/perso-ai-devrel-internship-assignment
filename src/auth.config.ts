import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: '/login',
    error: '/unauthorized',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith('/dashboard');
      const isRoot = nextUrl.pathname === '/';

      if (isRoot) {
        const redirectUrl = new URL(isLoggedIn ? '/dashboard' : '/login', nextUrl.origin);
        return Response.redirect(redirectUrl);
      }

      if (nextUrl.pathname === '/login' && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl.origin));
      }

      if (isProtected && !isLoggedIn) {
        const loginUrl = new URL('/login', nextUrl.origin);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
};
