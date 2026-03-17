# Tasks: 로그인 오류 원인 구분 안내

**Input**: Design documents from `/specs/feat/015-auth-error-feedback/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Organization**: 3개 User Story + Foundation으로 구성. US1·US2는 P1(동일 우선순위), US3은 P2. 모든 User Story는 Foundation 완료 후 독립적으로 검증 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 서로 다른 파일 작업, 의존성 없음 → 병렬 실행 가능
- **[Story]**: 해당 작업이 속한 User Story (US1, US2, US3)
- 각 작업에 정확한 파일 경로 포함

---

## Phase 1: Setup (없음)

기존 프로젝트 구조를 그대로 활용. 신규 환경 구성 불필요.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 `AuthErrorType` 타입과 라우팅 wiring을 확립한다. 이 단계 완료 전까지 어떤 User Story도 시작할 수 없다.

**⚠️ CRITICAL**: US1·US2·US3 모두 이 단계에 의존

- [x] T001 `AuthErrorType` 유니온 타입과 `AUTH_ERROR_REDIRECT` 상수 객체를 `src/features/auth-login/lib/authErrorType.ts`에 신규 생성 (값: `'not_whitelisted' | 'server_error' | 'no_email'`)
- [x] T002 `src/app/unauthorized/page.tsx`를 async Server Component로 수정하여 `searchParams: Promise<{ error?: string }>`를 받고 `errorType` prop으로 `UnauthorizedPage`에 전달

**Checkpoint**: `authErrorType.ts` 생성 완료 및 `page.tsx` searchParams wiring 확인 → User Story 구현 시작 가능

---

## Phase 3: User Story 1 — 미등록 사용자에게 명확한 접근 거부 안내 (Priority: P1) 🎯 MVP

**Goal**: 화이트리스트에 없는 이메일로 로그인 시도 시 미등록 전용 메시지("이 서비스는 허가된 사용자만 이용할 수 있습니다")가 표시된다.

**Independent Test**: 미등록 이메일로 `checkWhitelist` 호출 → `/unauthorized?error=not_whitelisted` URL 반환 확인. `<UnauthorizedPage errorType="not_whitelisted" />` 렌더링 → "이 서비스는 허가된 사용자만 이용할 수 있습니다" 문구 및 "로그인 페이지로 돌아가기" 버튼 렌더링 확인.

### Implementation for User Story 1

- [x] T003 [US1] `src/features/auth-login/lib/checkWhitelist.ts`에서 `isWhitelistedFn` 결과가 `false`일 때 `AUTH_ERROR_REDIRECT.not_whitelisted`를 반환하도록 분기 추가 (반환 타입: `Promise<true | string>`)
- [x] T004 [P] [US1] `src/features/auth-login/ui/UnauthorizedPage.tsx`에 `errorType?: string` prop 추가하고, `not_whitelisted` 케이스에 대한 제목·본문·버튼 텍스트 렌더링 분기 구현 (기본 fallback도 `not_whitelisted`와 동일 메시지 사용)
- [x] T005 [P] [US1] `src/__tests__/features/auth-login/lib/checkWhitelist.test.ts`에서 기존 `'returns false for a non-whitelisted email'` 테스트를 `/unauthorized?error=not_whitelisted` 반환값 검증으로 수정
- [x] T006 [P] [US1] `src/__tests__/features/auth-login/ui/UnauthorizedPage.test.tsx`에 `errorType="not_whitelisted"` prop 전달 시 "이 서비스는 허가된 사용자만" 문구와 "로그인 페이지로 돌아가기" 버튼 렌더링 테스트 추가

**Checkpoint**: `npm test -- checkWhitelist` + `npm test -- UnauthorizedPage` 통과 → US1 독립 검증 완료

---

## Phase 4: User Story 2 — 서버 오류 시 사용자 친화적 오류 안내 (Priority: P1)

**Goal**: 화이트리스트에 등록된 사용자가 DB 오류 등 서버 내부 오류로 차단될 때 미등록 메시지와 **다른** 메시지("서비스에 일시적 문제가 발생했습니다")를 받으며, 서버 로그에 오류 유형·타임스탬프가 기록된다.

**Independent Test**: `checkWhitelist` 내부에서 DB 오류 throw 시 → `/unauthorized?error=server_error` 반환 확인. `console.error` 호출에 `[auth][server_error]` 패턴과 ISO 타임스탬프 포함 확인. `<UnauthorizedPage errorType="server_error" />` 렌더링 → "서비스에 일시적 문제가 발생했습니다" 문구와 "다시 시도하기" 버튼 확인.

### Implementation for User Story 2

- [x] T007 [US2] `src/features/auth-login/lib/checkWhitelist.ts`의 `catch` 블록을 수정하여 `console.error('[auth][server_error]', new Date().toISOString(), error)` 로그 추가 후 `AUTH_ERROR_REDIRECT.server_error` 반환 (이메일 등 PII 로그 미포함)
- [x] T008 [P] [US2] `src/features/auth-login/ui/UnauthorizedPage.tsx`에 `server_error` 케이스 추가: 제목 "일시적인 서비스 오류입니다", 본문 "서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", 버튼 "다시 시도하기" (href="/login")
- [x] T009 [P] [US2] `src/__tests__/features/auth-login/lib/checkWhitelist.test.ts`에서 기존 `'returns false when DB throws'` 테스트를 `/unauthorized?error=server_error` 반환값 검증으로 수정하고, `vi.spyOn(console, 'error')` 로 `[auth][server_error]` 로그 호출 검증 추가
- [x] T010 [P] [US2] `src/__tests__/features/auth-login/ui/UnauthorizedPage.test.tsx`에 `errorType="server_error"` prop 전달 시 "서비스에 일시적 문제" 문구와 "다시 시도하기" 버튼 렌더링 테스트 추가

**Checkpoint**: `npm test -- checkWhitelist` + `npm test -- UnauthorizedPage` 통과 → US2 독립 검증 완료. 이 시점에서 US1·US2 모두 동작 확인 가능.

---

## Phase 5: User Story 3 — 이메일 미제공 시 안내 (Priority: P2)

**Goal**: Google 계정에서 이메일 정보를 제공하지 않은 경우 별도 안내 메시지("Google 계정에서 이메일 정보를 가져올 수 없습니다")가 표시된다.

**Independent Test**: `checkWhitelist(null, ...)` 또는 `checkWhitelist(undefined, ...)` 호출 시 `/unauthorized?error=no_email` 반환 확인. `<UnauthorizedPage errorType="no_email" />` 렌더링 → "이메일 정보를 가져올 수 없습니다" 문구 확인.

### Implementation for User Story 3

- [x] T011 [US3] `src/features/auth-login/lib/checkWhitelist.ts`에서 `!email` 분기를 `return false`에서 `return AUTH_ERROR_REDIRECT.no_email`로 변경
- [x] T012 [P] [US3] `src/features/auth-login/ui/UnauthorizedPage.tsx`에 `no_email` 케이스 추가: 제목 "이메일 정보를 확인할 수 없습니다", 본문 "Google 계정에서 이메일 정보를 가져올 수 없습니다. Google 계정 설정을 확인해 주세요."
- [x] T013 [P] [US3] `src/__tests__/features/auth-login/lib/checkWhitelist.test.ts`에서 `null`/`undefined` email 테스트를 `/unauthorized?error=no_email` 반환값 검증으로 수정
- [x] T014 [P] [US3] `src/__tests__/features/auth-login/ui/UnauthorizedPage.test.tsx`에 `errorType="no_email"` prop 전달 시 "이메일 정보를 가져올 수 없습니다" 문구 렌더링 테스트 추가

**Checkpoint**: 모든 User Story 독립 동작 확인 완료

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T015 [P] `src/__tests__/features/auth-login/ui/UnauthorizedPage.test.tsx`에서 기존 `renders 차단 안내 메시지` 테스트를 errorType 없음(fallback) 케이스로 업데이트하여 이전 동작 호환성 검증
- [x] T016 `npm test && npm run lint` 전체 실행하여 회귀 없음 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: 즉시 시작 가능 — 모든 User Story를 BLOCK
- **US1 (Phase 3)**: Phase 2 완료 후 시작 — US2·US3와 독립
- **US2 (Phase 4)**: Phase 2 완료 후 시작 — T007은 T003이 수정한 `checkWhitelist.ts`에 이어 작성 (순차)
- **US3 (Phase 5)**: Phase 2 완료 후 시작 — T011은 T007이 수정한 `checkWhitelist.ts`에 이어 작성 (순차)
- **Polish (Phase 6)**: 원하는 User Story 완료 후 실행

### User Story Dependencies

- **US1 (P1)**: Foundation → T003 → T004/T005/T006 (T004·T005·T006 병렬)
- **US2 (P1)**: Foundation → T007 → T008/T009/T010 (T008·T009·T010 병렬)
- **US3 (P2)**: Foundation → T011 → T012/T013/T014 (T012·T013·T014 병렬)

> ⚠️ `checkWhitelist.ts`를 수정하는 T003 → T007 → T011은 동일 파일 충돌 방지를 위해 **순차 실행** 필요. 단, 각 User Story의 UI·테스트 태스크(`[P]` 표시)는 병렬 실행 가능.

---

## Parallel Example: User Story 1

```bash
# T003 완료 후 아래 3개 병렬 실행 가능:
Task T004: UnauthorizedPage.tsx - not_whitelisted UI 분기
Task T005: checkWhitelist.test.ts - not_whitelisted 반환값 테스트
Task T006: UnauthorizedPage.test.tsx - not_whitelisted 렌더링 테스트
```

## Parallel Example: User Story 2

```bash
# T007 완료 후 아래 3개 병렬 실행 가능:
Task T008: UnauthorizedPage.tsx - server_error UI 분기
Task T009: checkWhitelist.test.ts - server_error + 로그 테스트
Task T010: UnauthorizedPage.test.tsx - server_error 렌더링 테스트
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundation (T001, T002)
2. Complete Phase 3: User Story 1 (T003 → T004/T005/T006)
3. **STOP and VALIDATE**: `npm test && npm run lint`
4. 미등록 사용자 메시지 분리 동작 확인 → 배포 가능

### Incremental Delivery

1. Foundation → US1(미등록 안내) → 검증 → MVP 배포
2. US2(서버 오류 안내) → 검증 → 배포 (핵심 버그 수정 완료)
3. US3(이메일 미제공 안내) → 검증 → 배포

### 단독 개발자 순서 (권장)

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016

---

## Notes

- `checkWhitelist.ts`를 수정하는 T003·T007·T011은 **순차 실행** 필수 (동일 파일)
- `UnauthorizedPage.tsx`를 수정하는 T004·T008·T012는 동일 파일이므로 US1 완료 후 순차 작업
- `[P]` 태스크 = 서로 다른 파일, 의존성 없음
- 각 Checkpoint에서 `npm test` 실행으로 독립 검증
- PII(이메일) 절대 로그에 포함 금지 (FR-006)
