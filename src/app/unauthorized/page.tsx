import { UnauthorizedPage } from '@/features/auth-login/ui/UnauthorizedPage';

export default async function UnauthorizedRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <UnauthorizedPage errorType={error} />;
}
