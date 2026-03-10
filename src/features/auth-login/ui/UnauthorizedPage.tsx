export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-background">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive bg-destructive/10 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-destructive">접근이 제한된 페이지입니다</h1>
        <p className="text-sm text-destructive/80">
          이 서비스는 허가된 사용자만 이용할 수 있습니다.
          <br />
          이메일 화이트리스트에 등록된 계정으로 로그인해 주세요.
        </p>
        <a
          href="/login"
          className="mt-2 rounded-lg bg-destructive px-6 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          로그인 페이지로 돌아가기
        </a>
      </div>
    </main>
  );
}
