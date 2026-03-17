# Implementation Plan: 로그인 오류 원인 구분 안내

**Branch**: `feat/#15-auth-error-feedback` | **Date**: 2026-03-17 | **Spec**: `specs/feat/015-auth-error-feedback/spec.md`
**Input**: DB 오류로 로그인이 차단된 경우와 미등록 사용자가 차단된 경우가 동일한 오류 화면을 보여줘 사용자가 원인을 파악할 수 없는 문제

## Summary

`checkWhitelist.ts`의 반환 타입을 `boolean`에서 `true | redirect-URL`로 변경해 오류 종류(미등록·서버 오류·이메일 미제공)를 쿼리 파라미터(`?error=`)로 인코딩하고, `UnauthorizedPage`에서 파라미터 값에 따라 다른 메시지를 렌더링한다.

## Technical Context

**Language/Version**: TypeScript 5
**Primary Dependencies**: Next.js 16 (App Router), React 19, next-auth@beta (Auth.js v5), @libsql/client (Turso)
**Storage**: Turso (libSQL) — 화이트리스트 조회 (기존)
**Testing**: Vitest + @testing-library/react
**Target Platform**: Vercel (Node.js 서버리스)
**Project Type**: Web (Next.js single project)
**Performance Goals**: N/A (auth redirect path)
**Constraints**: PII(이메일) 로그 미포함. 재시도 횟수 제한 없음.
**Scale/Scope**: 기존 auth 흐름의 오류 분기 확장 — 신규 파일 2개, 기존 파일 4개 수정

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| FSD 레이어 준수 | ✅ PASS | 변경 범위: `features/auth-login/`, `app/unauthorized/`. 역방향 import 없음 |
| 배럴 export 금지 | ✅ PASS | 신규 파일(`authErrorType.ts`)도 직접 import 경로 사용 |
| 단방향 의존성 | ✅ PASS | `lib → model/ui → app` 방향 유지. `shared`에서 신규 import 없음 |
| 함수 선언 스타일 | ✅ PASS | `UnauthorizedPage`는 function declaration 유지 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/015-auth-error-feedback/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckits:tasks 실행 후 생성)
```

### Source Code (변경 대상)

```text
src/
├── app/
│   └── unauthorized/
│       └── page.tsx                          # [수정] searchParams → errorType 전달
│
├── features/
│   └── auth-login/
│       ├── lib/
│       │   ├── authErrorType.ts              # [신규] AuthErrorType 타입 + 상수
│       │   ├── checkWhitelist.ts             # [수정] 반환 타입 변경 + 서버 로그
│       │   └── isProtectedRoute.ts           # [변경 없음]
│       └── ui/
│           └── UnauthorizedPage.tsx          # [수정] errorType prop 수신 + 메시지 분기
│
└── __tests__/
    └── features/
        └── auth-login/
            ├── lib/
            │   └── checkWhitelist.test.ts    # [수정] 반환값 문자열로 변경
            └── ui/
                └── UnauthorizedPage.test.tsx # [수정] errorType별 메시지 테스트 추가
```

**Structure Decision**: 단일 Next.js 프로젝트 (`src/` 루트). auth-login feature 내부 변경으로 완결되며 entities 레이어 변경 불필요.

## Architecture Decision Table

| 결정 | 검토한 옵션 | 선택 | 이유 |
|------|-----------|------|------|
| 오류 유형 전달 방법 | (A) `?error=` 쿼리 파라미터 / (B) `/unauthorized/[type]` 동적 경로 / (C) 기존 NextAuth error 코드 | (A) | spec Assumptions에 "같은 URL, 쿼리 파라미터로 구분" 명시 |
| `signIn` 콜백 제어 | (A) URL 문자열 반환 / (B) 에러 throw / (C) redirect() | (A) | Auth.js v5에서 `string` 반환 시 해당 URL로 리다이렉트 — 가장 명시적이고 테스트 용이 |
| AuthErrorType 위치 | (A) `features/auth-login/lib/` / (B) `shared/types/` | (A) | auth-login 도메인 특화 타입. shared로 올릴 범용성 없음 |
| 서버 로그 구현 | (A) `console.error` / (B) 외부 로깅 서비스 | (A) | Vercel Functions 로그에 자동 캡처. PII 제외 조건 충족. 추가 의존성 불필요 |
| `UnauthorizedPage` searchParams 수신 | (A) Server Component prop (page.tsx → UnauthorizedPage) / (B) `useSearchParams()` | (A) | App Router `page.tsx`가 자연스럽게 searchParams 보유. 불필요한 Client Component 전환 방지 |

## Phase 0 — Unknowns & Research

모든 항목 해소됨. 상세 내용: `research.md` 참조.

| 항목 | 상태 |
|------|------|
| Auth.js v5 signIn 콜백 URL 반환 | ✅ 확인 |
| Vercel 서버 로그 캡처 방법 | ✅ 확인 |
| searchParams Server Component 전달 패턴 | ✅ 확인 |

## Phase 1 — Design & Contracts

### 파일별 변경 명세

#### 1. `src/features/auth-login/lib/authErrorType.ts` (신규)

```typescript
export type AuthErrorType = 'not_whitelisted' | 'server_error' | 'no_email';

export const AUTH_ERROR_REDIRECT = {
  not_whitelisted: '/unauthorized?error=not_whitelisted',
  server_error: '/unauthorized?error=server_error',
  no_email: '/unauthorized?error=no_email',
} as const satisfies Record<AuthErrorType, string>;
```

#### 2. `src/features/auth-login/lib/checkWhitelist.ts` (수정)

- 반환 타입: `Promise<boolean>` → `Promise<true | string>`
- `!email` 분기: `AUTH_ERROR_REDIRECT.no_email` 반환
- `isWhitelistedFn` 결과 `false`: `AUTH_ERROR_REDIRECT.not_whitelisted` 반환
- `catch` 블록: `console.error`로 오류 유형+타임스탬프 로그 후 `AUTH_ERROR_REDIRECT.server_error` 반환
- `isWhitelistedFn` 결과 `true`: `true` 반환

#### 3. `src/features/auth-login/ui/UnauthorizedPage.tsx` (수정)

- Props: `{ errorType?: string }` 추가
- 메시지 맵: `errorType` 값에 따라 제목/본문 분기 (data-model.md 메시지 테이블 참조)
- 버튼 텍스트: `not_whitelisted` / 기본 → "로그인 페이지로 돌아가기", `server_error` → "다시 시도하기"

#### 4. `src/app/unauthorized/page.tsx` (수정)

```typescript
export default async function UnauthorizedRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <UnauthorizedPage errorType={error} />;
}
```

#### 5. 테스트 업데이트

- `checkWhitelist.test.ts`: 반환값 `false` → URL 문자열로 변경, 로그 호출 검증 추가
- `UnauthorizedPage.test.tsx`: `errorType` prop별 메시지 렌더링 테스트 추가 (3개 케이스 + fallback)
