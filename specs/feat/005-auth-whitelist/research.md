# Research: 인증 시스템 및 화이트리스트 접근 제어

**Branch**: `feat/#5-auth-whitelist` | **Date**: 2026-03-10

## Research Task 1: Auth Library 선택

### Decision: NextAuth.js v5 (Auth.js)

### Rationale

- Next.js App Router 공식 지원 (v5부터 `auth()` 서버 함수, middleware 통합)
- Google OAuth provider 내장 — 별도 OAuth 플로우 구현 불필요
- JWT 세션 전략 지원 — DB에 세션 저장 불필요 (화이트리스트만 Turso에 저장)
- `signIn` callback에서 화이트리스트 체크를 깔끔하게 처리 가능
- `authorized` callback으로 middleware 라우트 보호 내장

### Alternatives Considered

| Option | 장점 | 탈락 사유 |
| --- | --- | --- |
| Lucia Auth | 경량, 세밀한 제어 | v3 이후 deprecation 방향, Next.js 16 통합 미검증 |
| 직접 구현 (OAuth2 + JWT) | 완전한 제어권 | 보안 취약점 위험, 개발 시간 과다, 스펙 대비 과잉 |

## Research Task 2: Database (Turso) 연결

### Decision: `@libsql/client` 직접 사용 (ORM 없이)

### Rationale

- 스펙 요구사항 FR-005에서 Turso 명시
- 화이트리스트 테이블 1개만 필요 — ORM 도입은 과잉
- `@libsql/client`의 `execute({ sql, args })` API가 간결하고 테스트하기 쉬움
- `vi.mock`으로 `turso.execute`를 쉽게 대체 가능

### Alternatives Considered

| Option | 장점 | 탈락 사유 |
| --- | --- | --- |
| Drizzle ORM + Turso adapter | 타입 안전한 쿼리 | 테이블 1개에 ORM은 과잉, 의존성 증가 |
| Prisma + libSQL adapter | 마이그레이션 관리 | 번들 사이즈 증가, Edge 런타임 비호환 |

## Research Task 3: Middleware 구조 (Edge Runtime 제약)

### Decision: `auth.config.ts` / `auth.ts` 분리 패턴

### Rationale

- Next.js middleware는 Edge Runtime에서 실행
- `@libsql/client`는 Node.js API 의존 — Edge에서 import 불가
- `auth.config.ts` (Edge-safe): providers + `authorized` callback만 포함
- `auth.ts` (Node.js): `auth.config.ts` 확장 + `signIn` callback (Turso 화이트리스트 체크)
- `middleware.ts`는 `auth.config.ts`만 import → Edge 호환 유지

### Alternatives Considered

| Option | 장점 | 탈락 사유 |
| --- | --- | --- |
| 단일 auth.ts | 파일 수 감소 | Edge runtime에서 Turso import 시 빌드 에러 |
| API route에서 화이트리스트 체크 | middleware 간소화 | signIn 콜백에서 처리하는 것이 더 자연스러운 플로우 |

## Research Task 4: TDD 테스트 전략

### Decision: 로직을 순수 함수로 추출하여 Layer별 테스트

### Rationale

- NextAuth 내부를 직접 테스트하기 어려움 (v5의 Vitest 지원 제한적)
- 핵심 로직을 순수 함수로 추출하면 mock 없이 테스트 가능
- `isProtectedRoute(pathname)`: string → boolean (순수)
- `checkWhitelist(email, isWhitelisted)`: signIn 로직 래퍼 (순수)
- DB 함수(`isEmailWhitelisted`)는 `vi.mock('@/shared/lib/turso')`로 테스트
- UI 컴포넌트는 `@testing-library/react`로 렌더링 + `vi.mock('@/auth')`

### Test Coverage Target

| Layer | 테스트 파일 | 핵심 시나리오 |
| --- | --- | --- |
| 순수 함수 | `isProtectedRoute.test.ts` | `/dashboard` → true, `/login` → false, `/` → false |
| 순수 함수 | `checkWhitelist.test.ts` | 허용 이메일 → true, 미등록 → false, null 이메일 → false, DB 에러 → false |
| DB 조회 | `whitelist.test.ts` | 존재하는 이메일 → true, 미존재 → false, DB 에러 throw |
| UI | `LoginPage.test.tsx` | Google 로그인 버튼 렌더링 확인 |
| UI | `UnauthorizedPage.test.tsx` | 차단 메시지 표시 확인 |
| UI | `GoogleLoginButton.test.tsx` | 클릭 시 signIn("google") 호출 |
