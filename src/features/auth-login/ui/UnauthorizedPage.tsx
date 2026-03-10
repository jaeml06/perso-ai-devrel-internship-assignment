export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-red-700">접근이 제한된 페이지입니다</h1>
        <p className="text-sm text-red-600">
          이 서비스는 허가된 사용자만 이용할 수 있습니다.
          <br />
          이메일 화이트리스트에 등록된 계정으로 로그인해 주세요.
        </p>
        <a
          href="/login"
          className="mt-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          로그인 페이지로 돌아가기
        </a>
      </div>
    </main>
  );
}
