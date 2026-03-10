import { GoogleLoginButton } from '@/features/auth-login/ui/GoogleLoginButton';

export function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border border-border bg-card p-10 shadow-lg">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Perso AI</h1>
          <p className="text-sm text-muted-foreground">AI 더빙 서비스에 오신 것을 환영합니다</p>
        </div>
        <div className="w-full">
          <GoogleLoginButton />
        </div>
      </div>
    </main>
  );
}
