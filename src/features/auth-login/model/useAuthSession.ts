'use client';

import { useSession } from 'next-auth/react';

export function useAuthSession() {
  const { data: session, status } = useSession();

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
