import { AUTH_ERROR_REDIRECT } from '@/features/auth-login/lib/authErrorType';

export async function checkWhitelist(
  email: string | null | undefined,
  isWhitelistedFn: (email: string) => Promise<boolean>,
): Promise<true | string> {
  if (!email) return AUTH_ERROR_REDIRECT.no_email;

  try {
    const isWhitelisted = await isWhitelistedFn(email);
    if (!isWhitelisted) return AUTH_ERROR_REDIRECT.not_whitelisted;
    return true;
  } catch (error) {
    console.error('[auth][server_error]', new Date().toISOString(), error);
    return AUTH_ERROR_REDIRECT.server_error;
  }
}
