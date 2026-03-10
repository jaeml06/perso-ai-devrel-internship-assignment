# Implementation Plan: 인증 시스템 및 화이트리스트 접근 제어

**Branch**: `feat/#5-auth-whitelist` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feat/005-auth-whitelist/spec.md`

## Summary

Google OAuth 2.0 기반 인증과 Turso DB 화이트리스트를 사용한 접근 제어 시스템을 구현한다. NextAuth.js v5(Auth.js)를 사용하여 인증을 처리하고, `@libsql/client`로 Turso에 저장된 허용 이메일 목록을 조회하여 비인가 사용자를 차단한다. TDD 관점에서 화이트리스트 검증 로직, signIn 콜백, 미들웨어 라우트 보호를 각각 독립적으로 테스트 가능한 순수 함수로 분리하여 구현한다.

## Technical Context

**Language/Version**: TypeScript 5.x
**Framework**: Next.js 16.1.6 (App Router), React 19.2.3
**Primary Dependencies**: next-auth@beta (Auth.js v5), @libsql/client (Turso)
**Styling**: Tailwind CSS 4 + clsx + tailwind-merge
**Validation**: zod
**Storage**: Turso (libSQL) — 화이트리스트 이메일 저장
**Testing**: Vitest 4 + @testing-library/react 16 + jsdom
**Target Platform**: Web (Node.js server runtime)
**Project Type**: Single Next.js app with FSD architecture
**Performance Goals**: 로그인 완료 후 10초 이내 서비스 접근 (SC-001)
**Constraints**: 화이트리스트에 없는 사용자 100% 차단 (SC-002), DB 장애 시 fail-closed
**Scale/Scope**: 소규모 허용 사용자 목록 (수십 명 수준), 관리자 UI 불필요

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
| --- | --- | --- |
| FSD 레이어 준수 | PASS | auth 설정은 `src/` 루트, 화이트리스트 로직은 `shared/lib/`, 로그인 UI는 `features/auth-login/`, 엔티티는 `entities/user/` |
| 배럴 export 금지 | PASS | 모든 import는 직접 파일 경로 사용 |
| 단방향 의존성 | PASS | `shared/lib` → `features/model` → `features/ui` → `app/` 방향 유지 |
| function declaration 스타일 | PASS | 모든 컴포넌트에 function declaration 사용 |
| `auth.ts`/`auth.config.ts` 위치 | JUSTIFIED | NextAuth v5 컨벤션상 `src/` 루트에 배치 필요. FSD 레이어 외부이나, 프레임워크 설정 파일로 허용 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/005-auth-whitelist/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckits/tasks command)
```

### Source Code (repository root)

```text
src/
├── auth.ts                              # NextAuth v5 main config (server-only, Turso import)
├── auth.config.ts                       # Edge-safe config (providers, pages, authorized callback)
├── proxy.ts                             # Route protection (imports auth.config only) — Next.js 16 proxy convention
│
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts            # NextAuth route handler (GET/POST)
│   ├── login/
│   │   └── page.tsx                    # 로그인 페이지 (thin routing → features)
│   └── unauthorized/
│       └── page.tsx                    # 접근 차단 페이지 (thin routing → features)
│
├── features/
│   └── auth-login/
│       ├── ui/
│       │   ├── LoginPage.tsx           # 로그인 조립 Page
│       │   ├── GoogleLoginButton.tsx   # Google 로그인 버튼 UI
│       │   └── UnauthorizedPage.tsx    # 접근 차단 안내 UI
│       ├── model/
│       │   └── useAuthSession.ts       # 세션 상태 관리 훅
│       └── lib/
│           ├── isProtectedRoute.ts     # 보호 대상 경로 판별 (순수 함수)
│           └── checkWhitelist.ts       # signIn 콜백 로직 (순수 함수, 테스트 핵심)
│
├── entities/
│   └── user/
│       └── dto/
│           └── user.dto.ts             # AllowedUser, Session 관련 타입
│
├── shared/
│   └── lib/
│       ├── turso.ts                    # Turso createClient 싱글톤
│       └── whitelist.ts               # DB 조회 함수 (isEmailWhitelisted, addAllowedUser)
│
└── __tests__/
    ├── features/
    │   └── auth-login/
    │       ├── lib/
    │       │   ├── isProtectedRoute.test.ts     # 경로 판별 순수 함수 테스트
    │       │   └── checkWhitelist.test.ts        # signIn 콜백 로직 테스트
    │       └── ui/
    │           ├── LoginPage.test.tsx            # 로그인 페이지 렌더링 테스트
    │           ├── GoogleLoginButton.test.tsx    # 로그인 버튼 동작 테스트
    │           └── UnauthorizedPage.test.tsx     # 차단 페이지 렌더링 테스트
    ├── shared/
    │   └── lib/
    │       └── whitelist.test.ts                # DB 조회 함수 단위 테스트
    └── app/
        └── api/
            └── auth/
                └── nextauth.route.test.ts       # Route handler 통합 테스트
```

**Structure Decision**: 단일 Next.js 앱 (FSD 구조). `auth.ts`/`auth.config.ts`는 NextAuth v5 컨벤션에 따라 `src/` 루트에 배치. 비즈니스 로직은 `features/auth-login/lib/`에서 순수 함수로 분리하여 TDD 가능하게 구성.

## TDD Strategy (사용자 요구: TDD 관점)

### Red-Green-Refactor 순서

TDD 관점에서 **테스트 먼저 작성** 후 구현하는 순서:

#### Layer 1: 순수 함수 (가장 먼저 테스트)

1. `isProtectedRoute(pathname)` — 보호 경로 판별
2. `checkWhitelist(email, isWhitelisted)` — signIn 콜백 로직 (DB 의존 없음)

#### Layer 2: DB 조회 함수 (mock Turso)

1. `isEmailWhitelisted(email)` — Turso 쿼리 래퍼
2. `addAllowedUser(email, name)` — 시드 함수

#### Layer 3: UI 컴포넌트 (mock auth)

1. `LoginPage` — Google 로그인 버튼 렌더링
2. `UnauthorizedPage` — 차단 메시지 렌더링
3. `GoogleLoginButton` — client component, 클릭 시 `signIn("google", { callbackUrl: "/dashboard" })` 호출
4. `LayoutShell` — async server component, `auth()`로 세션 확인 후 `LogoutButton` 조건부 렌더링

#### Layer 4: 통합 (middleware + NextAuth 콜백)

1. `authorized` callback — 양방향 리다이렉트: 비로그인 사용자 보호 경로 → `/login`, 로그인 사용자 `/login` → `/dashboard`
2. `signIn` callback — 화이트리스트 체크 + fail-closed

### 테스트 가능성을 위한 설계 원칙

| 원칙 | 적용 |
| --- | --- |
| **로직과 인프라 분리** | `checkWhitelist(email, isWhitelisted)` 순수 함수로 추출 → `isEmailWhitelisted` mock 불필요 |
| **Dependency Injection** | Turso 클라이언트를 직접 import하되, `vi.mock`으로 테스트 시 대체 |
| **Fail-Closed 기본값** | DB 에러 → `false` 반환 → 접근 차단 (보안 테스트 용이) |
| **경로 판별 순수 함수화** | `isProtectedRoute(pathname): boolean` → 단순 string 매칭, 테스트 최우선 |

## Architecture Decision Table

| Decision | Options Considered | Chosen | Rationale | FSD Impact |
| --- | --- | --- | --- | --- |
| Auth Library | NextAuth v5, Lucia Auth, 직접 구현 | **NextAuth v5** | Next.js 16 공식 지원, Google provider 내장, middleware 통합 용이 | `src/auth.ts` (루트), `app/api/auth/` (route handler) |
| DB | Turso, Supabase, PlanetScale | **Turso (libSQL)** | 스펙 요구사항 (FR-005), SQLite 호환, 서버리스 Edge 지원 | `shared/lib/turso.ts` (싱글톤) |
| Session Strategy | JWT, Database sessions | **JWT** | Turso에 세션 테이블 불필요, 간단한 화이트리스트만 관리 | 추가 entity 불필요 |
| Middleware 구조 | 단일 auth.ts, auth.config.ts 분리 | **auth.config.ts 분리** | Edge runtime에서 DB import 불가, 경량 config 분리 필요 | `src/auth.config.ts` (Edge-safe) |
| 화이트리스트 체크 위치 | middleware, signIn callback, API route | **signIn callback** | OAuth 완료 직후 1회 체크, middleware는 세션 유무만 확인 | `features/auth-login/lib/checkWhitelist.ts` |
| 로그인 UI | 별도 페이지, 모달 | **별도 /login 페이지** | 스펙 요구사항 (미니멀 스타일, 중앙 정렬 카드) | `features/auth-login/ui/LoginPage.tsx` |
| 차단 UI | 에러 페이지 재사용, 별도 페이지 | **별도 /unauthorized 페이지** | NextAuth의 error 리다이렉트와 구분, 명확한 UX | `features/auth-login/ui/UnauthorizedPage.tsx` |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| `auth.ts`/`auth.config.ts`를 `src/` 루트에 배치 (FSD 레이어 외부) | NextAuth v5 컨벤션 필수. `proxy.ts`가 `auth.config.ts`를 같은 레벨에서 import해야 함 | `shared/config/`에 넣으면 NextAuth의 `handlers` export 패턴과 충돌 |
| `middleware.ts` → `proxy.ts` 변경 (Next.js 16) | Next.js 16에서 `middleware` 파일 컨벤션이 deprecated되어 `proxy`로 rename됨. export명도 `middleware` → `proxy`로 변경 | — |
