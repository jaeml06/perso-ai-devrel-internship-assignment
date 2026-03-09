# Tasks: 인증 시스템 및 화이트리스트 접근 제어

**Input**: Design documents from `/specs/feat/005-auth-whitelist/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included — plan.md specifies TDD strategy (사용자 요구: TDD 관점)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Next.js app**: `src/` at repository root (FSD architecture)
- `src/auth.ts`, `src/auth.config.ts` — NextAuth v5 convention (root-level, justified exception)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for auth feature

- [ ] T001 Install auth dependencies: `npm install next-auth@beta @libsql/client`
- [ ] T002 [P] Create environment variables template in `.env.example` for `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- [ ] T003 [P] Add environment variables to `.env.local` (actual values)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create AllowedUser DTO type in `src/entities/user/dto/user.dto.ts`
- [ ] T005 [P] Create Turso client singleton in `src/shared/lib/turso.ts`
- [ ] T006 Create DB whitelist query functions (`isEmailWhitelisted`, `addAllowedUser`) in `src/shared/lib/whitelist.ts` (depends on T005)
- [ ] T007 Create Edge-safe auth config with Google provider, custom pages (`/login`, `/unauthorized`), and `authorized` callback in `src/auth.config.ts`
- [ ] T008 Create main NextAuth config extending `auth.config.ts` with stub `signIn` callback (returns `true`) in `src/auth.ts` — whitelist wiring deferred to T018
- [ ] T009 Create NextAuth route handler (`export { GET, POST }` from `@/auth`) in `src/app/api/auth/[...nextauth]/route.ts`
- [ ] T010 Create middleware for route protection importing `auth.config.ts` with matcher config in `src/middleware.ts`
- [ ] T011 Create Turso DB seed script to initialize `allowed_users` table and insert `kts123@estsoft.com` in `scripts/seed.ts`

**Checkpoint**: Foundation ready — auth infrastructure in place, user story implementation can now begin

---

## Phase 3: User Story 1 & 2 — 화이트리스트 로그인 허용 & 차단 (Priority: P1) 🎯 MVP

**Goal**: 화이트리스트에 등록된 사용자는 Google 로그인 후 서비스에 접근, 미등록 사용자는 차단 페이지로 리다이렉트

**Independent Test**: Google 계정으로 로그인 시 화이트리스트 여부에 따라 `/dashboard` 또는 `/unauthorized`로 분기되는지 확인

> **Note**: US1(허용)과 US2(차단)는 동일한 `signIn` callback + `checkWhitelist` 로직의 양면이므로 하나의 Phase로 통합

### Tests for User Story 1 & 2 (TDD — write FIRST, ensure they FAIL) ⚠️

- [ ] T012 [P] [US1] Write pure function tests for `isProtectedRoute` in `src/__tests__/features/auth-login/lib/isProtectedRoute.test.ts` — `/dashboard` → true, `/login` → false, `/` → false, `/api/auth/*` → false
- [ ] T013 [P] [US2] Write pure function tests for `checkWhitelist` in `src/__tests__/features/auth-login/lib/checkWhitelist.test.ts` — 허용 이메일 → true, 미등록 → false, null 이메일 → false, DB 에러 → false (fail-closed)
- [ ] T014 [P] [US1] Write unit tests for `isEmailWhitelisted` with mocked Turso in `src/__tests__/shared/lib/whitelist.test.ts` — 존재 이메일 → true, 미존재 → false, DB 에러 throw
- [ ] T015 [P] [US2] Write render test for `UnauthorizedPage` in `src/__tests__/features/auth-login/ui/UnauthorizedPage.test.tsx` — 차단 메시지 표시, 로그인 페이지 링크 확인

### Implementation for User Story 1 & 2

- [ ] T016 [P] [US1] Implement `isProtectedRoute(pathname): boolean` pure function in `src/features/auth-login/lib/isProtectedRoute.ts`
- [ ] T017 [P] [US2] Implement `checkWhitelist(email, isWhitelistedFn): Promise<boolean>` pure function in `src/features/auth-login/lib/checkWhitelist.ts`
- [ ] T018 [US1] Wire `checkWhitelist` into `signIn` callback in `src/auth.ts` — replace stub with `checkWhitelist(profile.email, isEmailWhitelisted)`, import from `shared/lib/whitelist.ts`
- [ ] T019 [US2] Create `UnauthorizedPage` component with 차단 안내 메시지 and 로그인 페이지 링크 in `src/features/auth-login/ui/UnauthorizedPage.tsx`
- [ ] T020 [US2] Create `/unauthorized` route page (thin routing → `UnauthorizedPage`) in `src/app/unauthorized/page.tsx`
- [ ] T021 [US1] Verify `authorized` callback in `src/auth.config.ts` redirects unauthenticated users to `/login` for protected routes
- [ ] T022 [US1] Write route handler integration test in `src/__tests__/app/api/auth/nextauth.route.test.ts` — verify GET/POST handlers export from `@/auth`
- [ ] T023 [US1] Run tests for US1 & US2 — all T012–T015, T022 must PASS (green)

**Checkpoint**: 화이트리스트 기반 인증 핵심 로직 완성 — 허용/차단 플로우 모두 동작

---

## Phase 4: User Story 3 — 로그인 페이지 진입 (Priority: P2)

**Goal**: 비로그인 사용자에게 Google 로그인 버튼이 있는 미니멀 로그인 페이지 표시

**Independent Test**: 비로그인 상태에서 보호된 페이지 접근 시 로그인 페이지 표시 확인

### Tests for User Story 3 (TDD — write FIRST) ⚠️

- [ ] T024 [P] [US3] Write render test for `LoginPage` in `src/__tests__/features/auth-login/ui/LoginPage.test.tsx` — Google 로그인 버튼 렌더링 확인
- [ ] T025 [P] [US3] Write test for `GoogleLoginButton` in `src/__tests__/features/auth-login/ui/GoogleLoginButton.test.tsx` — 클릭 시 `signIn("google")` 호출 확인

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create `GoogleLoginButton` component (Server Action calling `signIn("google")`) in `src/features/auth-login/ui/GoogleLoginButton.tsx`
- [ ] T027 [US3] Create `LoginPage` component — 미니멀 중앙 정렬 카드 + 서비스 로고 + Google 로그인 버튼 in `src/features/auth-login/ui/LoginPage.tsx`
- [ ] T028 [US3] Create `/login` route page (thin routing → `LoginPage`) in `src/app/login/page.tsx`
- [ ] T029 [US3] Run tests for US3 — T024, T025 must PASS (green)

**Checkpoint**: 로그인 UI 완성 — 비로그인 → 로그인 페이지 → Google OAuth 플로우 연결

---

## Phase 5: User Story 4 — 로그아웃 (Priority: P3)

**Goal**: 로그인된 사용자가 로그아웃하여 세션 종료 후 로그인 페이지로 이동

**Independent Test**: 로그인 상태에서 로그아웃 버튼 클릭 후 세션 종료 및 `/login` 리다이렉트 확인

### Implementation for User Story 4

- [ ] T030 [US4] Create `useAuthSession` hook for session state management in `src/features/auth-login/model/useAuthSession.ts`
- [ ] T031 [US4] Add logout button/action (Server Action calling `signOut()`) to existing dashboard or layout — redirect to `/login` after signOut

**Checkpoint**: 로그아웃 기능 완성 — 전체 인증 플로우(로그인 → 서비스 이용 → 로그아웃) 완결

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, security hardening, validation

- [ ] T032 [P] Handle edge case: DB connection failure → fail-closed (접근 차단) — verify in `checkWhitelist` and `whitelist.ts`
- [ ] T033 [P] Handle edge case: Google OAuth 취소 → `/login` 복귀 확인
- [ ] T034 [P] Handle edge case: 세션 만료 시 보호 페이지 접근 → `/login` 리다이렉트 확인
- [ ] T035 Run full test suite (`npm test`) and verify all tests pass
- [ ] T036 Run linter (`npm run lint`) and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 & US2 (Phase 3)**: Depends on Foundational (Phase 2) — core MVP
- **US3 (Phase 4)**: Depends on Foundational (Phase 2) — can run in parallel with Phase 3
- **US4 (Phase 5)**: Depends on Phase 3 (auth session needed for logout)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 + US2 (P1)**: Start after Phase 2 — no dependencies on other stories
- **US3 (P2)**: Start after Phase 2 — can run in parallel with US1+US2 (independent UI)
- **US4 (P3)**: Start after Phase 3 — needs auth session to exist for logout

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Pure functions before integration logic
- Models → Services → UI → Integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003 can run in parallel (Phase 1)
- T004, T005 can run in parallel (Phase 2 — DTO + Turso client); T006 depends on T005
- T012, T013, T014, T015 can all run in parallel (Phase 3 tests — different files)
- T016, T017 can run in parallel (Phase 3 pure functions — different files)
- T024, T025 can run in parallel (Phase 4 tests — different files)
- **Phase 3 and Phase 4 can run in parallel** (US1+US2 backend vs US3 UI)
- T032, T033, T034 can run in parallel (Phase 6 edge cases — validation only)

---

## Parallel Example: User Story 1 & 2

```bash
# Launch all TDD tests for US1+US2 together:
Task: "Write isProtectedRoute tests in src/__tests__/features/auth-login/lib/isProtectedRoute.test.ts"
Task: "Write checkWhitelist tests in src/__tests__/features/auth-login/lib/checkWhitelist.test.ts"
Task: "Write whitelist.ts tests in src/__tests__/shared/lib/whitelist.test.ts"
Task: "Write UnauthorizedPage tests in src/__tests__/features/auth-login/ui/UnauthorizedPage.test.tsx"

# Launch pure function implementations together:
Task: "Implement isProtectedRoute in src/features/auth-login/lib/isProtectedRoute.ts"
Task: "Implement checkWhitelist in src/features/auth-login/lib/checkWhitelist.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (install deps, env vars)
2. Complete Phase 2: Foundational (Turso client, auth config, middleware, route handler)
3. Complete Phase 3: User Story 1 & 2 (whitelist check + 차단 페이지)
4. **STOP and VALIDATE**: Test whitelist allow/deny flow independently
5. Deploy/demo if ready — core security feature operational

### Incremental Delivery

1. Setup + Foundational → Auth infrastructure ready
2. US1 + US2 → Whitelist auth works → Deploy/Demo (**MVP!**)
3. US3 → Login page UI polished → Deploy/Demo
4. US4 → Logout feature → Deploy/Demo
5. Polish → Edge cases, security hardening → Final Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US2 (backend auth logic + 차단 페이지)
   - Developer B: US3 (로그인 페이지 UI)
3. After Phase 3 complete:
   - Developer A or B: US4 (로그아웃)
4. Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are combined because they share identical infrastructure (signIn callback)
- TDD approach: Write failing tests (Red) → Implement (Green) → Refactor
- `auth.ts`/`auth.config.ts` at `src/` root is a justified FSD exception (NextAuth v5 convention)
- All DB errors → fail-closed (block access) per security requirement SC-002
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
