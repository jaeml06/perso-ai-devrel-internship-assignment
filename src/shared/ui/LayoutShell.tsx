export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='min-h-screen flex flex-col'>
      <nav className='h-16 border-b border-border flex items-center px-6'>
        <span className='text-lg font-semibold text-foreground'>AI 더빙</span>
      </nav>
      <main className='flex-1'>{children}</main>
    </div>
  );
}
