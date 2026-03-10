# API Contracts: 인증 시스템

**Branch**: `feat/#5-auth-whitelist` | **Date**: 2026-03-10

## Overview

인증 관련 API는 NextAuth v5가 자동 생성하는 route handler를 통해 처리된다. 별도의 커스텀 API route는 불필요하다.

## NextAuth Route Handler

### `GET /api/auth/[...nextauth]`

NextAuth v5 내부 라우트 — OAuth 플로우 (redirect, callback), CSRF 토큰, 세션 조회 등을 자동 처리.

### `POST /api/auth/[...nextauth]`

NextAuth v5 내부 라우트 — signIn, signOut 등의 Server Action을 처리.

**Route Handler**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

## Server Actions (직접 호출하는 인증 함수)

### `signIn("google")`

- **호출 위치**: `GoogleLoginButton` 컴포넌트 (Server Action)
- **동작**: Google OAuth 인증 화면으로 리다이렉트
- **성공 시**: `signIn` callback 실행 → 화이트리스트 체크
  - 허용: `/dashboard`로 리다이렉트
  - 차단: `/unauthorized`로 리다이렉트
- **취소 시**: `/login`으로 복귀

### `signOut()`

- **호출 위치**: 대시보드 내 로그아웃 버튼 (Server Action)
- **동작**: JWT 세션 삭제 → `/login`으로 리다이렉트

### `auth()`

- **호출 위치**: Server Component에서 세션 읽기
- **반환**: `Session | null`
- **용도**: 현재 로그인 사용자 정보 조회

## Proxy Route Protection

> **Note**: Next.js 16에서 `middleware.ts`가 `proxy.ts`로 rename됨. export명도 `middleware` → `proxy`로 변경.

### `src/proxy.ts`

| Route Pattern | 비로그인 사용자 | 로그인 사용자 |
| --- | --- | --- |
| `/login` | 접근 허용 | 접근 허용 |
| `/unauthorized` | 접근 허용 | 접근 허용 |
| `/api/auth/*` | 접근 허용 (NextAuth) | 접근 허용 |
| `/_next/*`, `/favicon.ico` | 접근 허용 (정적 자원) | 접근 허용 |
| `/dashboard` | `/login`으로 리다이렉트 | 접근 허용 |
| `/dashboard/*` | `/login`으로 리다이렉트 | 접근 허용 |
| `/` | 접근 허용 | 접근 허용 |

### Matcher Config

```typescript
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login|unauthorized).*)"],
};
```

## Internal Functions (테스트 대상)

### `isEmailWhitelisted(email: string): Promise<boolean>`

- **위치**: `src/shared/lib/whitelist.ts`
- **의존**: `@libsql/client` (Turso)
- **쿼리**: `SELECT 1 FROM allowed_users WHERE email = ? LIMIT 1`
- **반환**: `rows.length > 0`
- **에러 시**: throw (호출자가 fail-closed 처리)

### `isProtectedRoute(pathname: string): boolean`

- **위치**: `src/features/auth-login/lib/isProtectedRoute.ts`
- **로직**: `pathname.startsWith("/dashboard")`
- **순수 함수**: 외부 의존 없음

### `checkWhitelist(email: string | null | undefined, isWhitelistedFn: (email: string) => Promise<boolean>): Promise<boolean>`

- **위치**: `src/features/auth-login/lib/checkWhitelist.ts`
- **로직**: null/undefined → false, isWhitelistedFn 호출, 에러 → false (fail-closed)
- **순수 함수**: DB 의존을 함수 파라미터로 주입
