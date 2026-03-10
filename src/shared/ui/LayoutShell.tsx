import { auth } from '@/auth';
import { LogoutButton } from '@/features/auth-login/ui/LogoutButton';

export default async function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className='min-h-screen flex flex-col'>
      <nav className='h-16 border-b border-border flex items-center justify-between px-6'>
        <span className='text-lg font-semibold text-foreground'>AI 더빙</span>
        {session?.user && <LogoutButton />}
      </nav>
      <main className='flex-1'>{children}</main>
    </div>
  );
}
