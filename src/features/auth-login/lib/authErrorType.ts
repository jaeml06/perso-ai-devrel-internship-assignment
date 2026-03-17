export type AuthErrorType = 'not_whitelisted' | 'server_error' | 'no_email';

export const AUTH_ERROR_REDIRECT = {
  not_whitelisted: '/unauthorized?error=not_whitelisted',
  server_error: '/unauthorized?error=server_error',
  no_email: '/unauthorized?error=no_email',
} as const satisfies Record<AuthErrorType, string>;
