const ERROR_CONTENT = {
  server_error: {
    title: '일시적인 서비스 오류입니다',
    body: '서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    buttonText: '다시 시도하기',
    buttonHref: '/login',
  },
  no_email: {
    title: '이메일 정보를 확인할 수 없습니다',
    body: 'Google 계정에서 이메일 정보를 가져올 수 없습니다. Google 계정 설정을 확인해 주세요.',
    buttonText: '로그인 페이지로 돌아가기',
    buttonHref: '/login',
  },
  not_whitelisted: {
    title: '접근이 제한된 페이지입니다',
    body: '이 서비스는 허가된 사용자만 이용할 수 있습니다. 이메일 화이트리스트에 등록된 계정으로 로그인해 주세요.',
    buttonText: '로그인 페이지로 돌아가기',
    buttonHref: '/login',
  },
} as const;

const DEFAULT_CONTENT = ERROR_CONTENT.not_whitelisted;

export function UnauthorizedPage({ errorType }: { errorType?: string }) {
  const content =
    errorType && errorType in ERROR_CONTENT
      ? ERROR_CONTENT[errorType as keyof typeof ERROR_CONTENT]
      : DEFAULT_CONTENT;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-background">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive bg-destructive/10 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-destructive">{content.title}</h1>
        <p className="text-sm text-destructive/80">{content.body}</p>
        <a
          href={content.buttonHref}
          className="mt-2 rounded-lg bg-destructive px-6 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {content.buttonText}
        </a>
      </div>
    </main>
  );
}
