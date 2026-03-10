import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { checkWhitelist } from '@/features/auth-login/lib/checkWhitelist';
import { isEmailWhitelisted } from '@/shared/lib/whitelist';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile }) {
      return checkWhitelist(profile?.email, isEmailWhitelisted);
    },
  },
});
