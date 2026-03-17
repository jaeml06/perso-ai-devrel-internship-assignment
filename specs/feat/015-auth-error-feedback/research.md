# Research: 로그인 오류 원인 구분 안내

**Phase**: 0 — Outline & Research
**Branch**: `feat/#15-auth-error-feedback`

## 조사 항목

### 1. NextAuth v5 (Auth.js v5) signIn 콜백 반환 타입

**Decision**: `signIn` 콜백에서 `string` (URL) 반환 시 해당 URL로 리다이렉트
**Rationale**: Auth.js v5 공식 문서에 따르면 `signIn` 콜백은 `boolean | string`을 반환할 수 있다. `false` 반환 시 `pages.error`로 리다이렉트되지만, 문자열 URL 반환 시 해당 URL로 직접 리다이렉트된다. 이를 활용해 `?error=not_whitelisted`, `?error=server_error`, `?error=no_email` 쿼리 파라미터를 직접 제어할 수 있다.
**Alternatives considered**:
- NextAuth 에러 코드(`AccessDenied`, `Configuration` 등) 활용 → 기존 NextAuth 에러 URL(`?error=AccessDenied`)이 자동 추가되어 커스텀 파라미터와 충돌 가능
- 별도 `/unauthorized/[type]` 경로 분리 → spec 가정("같은 URL, 쿼리 파라미터로 구분")에 위배

### 2. Server-side Logging (FR-006, SC-005)

**Decision**: `checkWhitelist.ts`에서 DB 오류 발생 시 `console.error`로 오류 유형 + ISO 타임스탬프 기록
**Rationale**: Vercel은 서버 컴포넌트/Route Handler에서 발생하는 `console.error` 출력을 Functions 로그로 자동 캡처한다. 별도 로깅 라이브러리 불필요. 이메일 등 PII는 로그에 포함하지 않는다(FR-006).
**Alternatives considered**:
- Sentry/Datadog 등 외부 서비스 → 과도한 의존성 추가, 현재 범위 초과
- `logger.ts` 공통 유틸 신설 → 단일 호출 지점이므로 불필요한 추상화

### 3. UnauthorizedPage의 searchParams 수신 방식

**Decision**: `app/unauthorized/page.tsx`를 Server Component로 유지하여 `searchParams` prop을 받고, `UnauthorizedPage` feature 컴포넌트에 `errorType` prop으로 전달
**Rationale**: Next.js App Router에서 `page.tsx`는 자동으로 `searchParams`를 prop으로 받는다. FSD 원칙에 따라 `app/` 레이어는 URL params를 읽어 feature Page에 전달하는 얇은 역할만 한다.
**Alternatives considered**:
- `useSearchParams()` hook 사용(Client Component) → 불필요한 클라이언트 번들 증가
- `UnauthorizedPage` 내부에서 직접 searchParams 읽기 → `app/` 레이어 책임과 혼재

### 4. 오류 유형 타입 정의

**Decision**: `features/auth-login/lib/authErrorType.ts`에 `AuthErrorType` 리터럴 유니온 타입 정의
**Rationale**: `checkWhitelist.ts`와 `UnauthorizedPage.tsx` 양쪽에서 참조하는 타입이므로 같은 feature의 `lib/`에 위치시켜 공유. entities 레이어까지 끌어올릴 도메인 엔티티가 아니므로 feature 내부 유지.
**Alternatives considered**:
- `shared/types/`에 배치 → auth-login 도메인 특화 타입이므로 과도한 일반화
- 인라인 string literal → 오타 위험, 자동완성 미지원
