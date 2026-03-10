# Tasks: UI/UX 폴리싱 — 반응형 레이아웃 & 일관된 디자인 시스템

**Input**: Design documents from `/specs/feat/008-ui-ux-polish/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: TDD approach requested in plan.md — tests are included and MUST be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single Next.js app**: `src/` at repository root
- Tests: `src/__tests__/` mirroring source structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 디자인 토큰 확장 및 테스트 환경 준비

- [x] T001 globals.css `@theme` 블록에 `--color-success`, `--color-success-foreground`, `--color-warning`, `--color-warning-foreground`, `--color-info`, `--color-info-foreground`, `--color-card`, `--color-card-foreground` 토큰 추가 in `src/app/globals.css`
- [x] T002 디자인 토큰 테스트 — globals.css에 success, warning, info, card 토큰이 정의되어 있는지 검증하는 테스트 작성 in `src/__tests__/shared/design-tokens.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 없음 — 이 기능은 기존 컴포넌트 스타일링이므로 Phase 1(토큰 확장) 완료 후 바로 User Story 진행 가능

**⚠️ CRITICAL**: Phase 1 토큰 확장이 완료되어야 User Story에서 해당 토큰 사용 가능

**Checkpoint**: 디자인 토큰 확장 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 — 대시보드 페이지 스타일 완성 (Priority: P1) 🎯 MVP

**Goal**: `/dashboard`에 카드 레이아웃, 폼 스타일링, 반응형 레이아웃을 적용하여 핵심 UI를 완성한다.

**Independent Test**: `/dashboard`를 방문하여 폼 UI가 카드 레이아웃으로 렌더링되고, 모바일(375px) 및 데스크톱(1280px)에서 레이아웃이 올바르게 보이는지 확인.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] DubbingDashboardPage 테스트 작성 — `main` 역할 존재, heading "AI 더빙 생성" 렌더, DubbingForm이 카드 컨테이너 내 렌더 확인 in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`
- [x] T004 [P] [US1] DubbingForm 스타일 테스트 추가 — 에러 메시지 `aria-live="polite"` 속성, 긴 파일명 truncate 구조, disabled 버튼 시각 구분 확인 in `src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx`

### Implementation for User Story 1

- [x] T005 [US1] DubbingDashboardPage 스타일링 — `<main>` 중앙 정렬, `max-w-2xl mx-auto`, 세로 카드 배치, 제목 heading 추가, 모바일 full-width 패딩 in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx`
- [x] T006 [US1] DubbingForm 스타일링 — 카드 컨테이너(`rounded-2xl border bg-card shadow-sm p-6`), 필드 그룹(`flex flex-col gap-2`), label/input 스타일, 에러 메시지 `aria-live="polite"`, 파일명 truncate, 제출 버튼 스타일(hover/disabled/focus) in `src/features/dubbing-create/ui/DubbingForm.tsx`
- [x] T007 [US1] VoiceSelector 스타일링 — DubbingForm과 동일한 select 스타일, 미리듣기 버튼 스타일 in `src/features/dubbing-create/ui/VoiceSelector.tsx`

**Checkpoint**: 대시보드 폼 UI가 카드 레이아웃으로 완성, 모바일/데스크톱 반응형 동작 확인

---

## Phase 4: User Story 2 — 파이프라인 로딩 및 에러 화면 최적화 (Priority: P2)

**Goal**: 더빙 생성 중 각 처리 단계(STT → 번역 → TTS)를 시각적으로 표시하고, 에러 시 재시도 UX를 제공한다.

**Independent Test**: 더빙 생성 버튼 클릭 후 파이프라인 진행 화면이 단계별로 시각적 진행상태를 표시하는지, 에러 시 에러 메시지와 재시도 버튼이 명확하게 표시되는지 확인.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US2] PipelineProgress 테스트 작성 — idle 미렌더, transcribing 시 STT `data-state="active"`, translating 시 STT `data-state="done"` + 번역 `data-state="active"`, complete 시 모든 `data-state="done"`, error 시 에러 메시지/재시도 버튼, 재시도 클릭 시 onRetry 호출, `aria-live` 진행 메시지 확인 in `src/__tests__/features/dubbing-create/ui/PipelineProgress.test.tsx`
- [x] T009 [P] [US2] AudioPlayer 테스트 추가 — 재생/일시정지 버튼 접근성, 시크바(range) 레이블, 다운로드 링크 존재, 로딩 중 비활성 상태 확인 in `src/__tests__/features/dubbing-create/ui/AudioPlayer.test.tsx`

### Implementation for User Story 2

- [x] T010 [US2] PipelineProgress 스타일링 — 스텝 리스트 flex 배치, `data-state` 속성별 스타일(`done`=`text-success`+체크, `active`=`text-primary`+`animate-spin`, `idle`=`text-muted-foreground`), 에러 블록(`bg-destructive/10 border-destructive rounded-lg p-4`), 재시도 버튼, `aria-live` 영역 in `src/features/dubbing-create/ui/PipelineProgress.tsx`
- [x] T011 [US2] AudioPlayer 스타일링 — 카드 컨테이너(`rounded-2xl border bg-card p-4`), 재생/일시정지 아이콘 버튼, range input `accent-primary`, 다운로드 링크(`text-primary underline`), 로딩 비활성(`opacity-50 pointer-events-none`) in `src/features/dubbing-create/ui/AudioPlayer.tsx`

**Checkpoint**: 파이프라인 진행 시각화 완성, 에러/재시도 UX 동작 확인

---

## Phase 5: User Story 3 — 모든 페이지 디자인 일관성 (Priority: P3)

**Goal**: 로그인/미인가/대시보드/네비게이션이 동일한 디자인 토큰을 사용하여 통일된 경험을 제공한다.

**Independent Test**: 로그인 → 대시보드 → 미인가 페이지를 순서대로 방문하여 색상·폰트·버튼 스타일이 일관되게 보이는지 시각적으로 확인.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US3] LayoutShell 스타일 테스트 추가 — `bg-background` 명시 확인, 로그아웃 버튼 hover/focus 스타일 관련 접근성 확인 in `src/__tests__/shared/ui/LayoutShell.test.tsx`
- [x] T013 [P] [US3] VoiceSelector 에러/재시도 테스트 추가 — 에러 시 에러 메시지 접근 가능 영역 표시, 재시도 버튼 렌더 확인 in `src/__tests__/features/dubbing-create/ui/VoiceSelector.test.tsx`

### Implementation for User Story 3

- [x] T014 [US3] LayoutShell 스타일 보강 — `bg-background` 명시, 로그아웃 버튼에 `hover:bg-muted focus:ring-2 focus:ring-ring` 추가 in `src/shared/ui/LayoutShell.tsx`
- [x] T015 [US3] VoiceSelector 에러 상태 스타일링 — 에러 상태(`bg-destructive/10 rounded-lg p-3`), 재시도 버튼, 에러 메시지 `aria-live` 영역 in `src/features/dubbing-create/ui/VoiceSelector.tsx`
- [x] T016 [US3] 전체 페이지 디자인 토큰 일관성 검증 — 로그인/미인가/대시보드 페이지에서 `bg-card`, `text-foreground`, `bg-primary` 등 동일 토큰 사용 확인 및 불일치 수정 in `src/features/auth-login/ui/LoginPage.tsx`, `src/features/auth-login/ui/UnauthorizedPage.tsx`

**Checkpoint**: 모든 페이지 간 디자인 일관성 확보

---

## Phase 6: User Story 4 — 모션 및 전환 애니메이션 (Priority: P4)

**Goal**: 버튼 호버·페이지 요소 등장·파이프라인 상태 전환에 부드러운 마이크로 인터랙션을 추가한다.

**Independent Test**: 버튼에 마우스를 올렸을 때 호버 효과, 파이프라인 단계 전환 시 부드러운 상태 변화 확인.

### Implementation for User Story 4

- [x] T017 [P] [US4] 버튼 호버/포커스 트랜지션 적용 — 모든 버튼에 `transition-colors duration-150`, 호버 시 색상/스케일 변화 in `src/features/dubbing-create/ui/DubbingForm.tsx`, `src/features/dubbing-create/ui/PipelineProgress.tsx`, `src/features/dubbing-create/ui/AudioPlayer.tsx`
- [x] T018 [P] [US4] 파이프라인 상태 전환 CSS 트랜지션 — `motion-safe:transition-all motion-safe:duration-300`, `motion-reduce:transition-none` 적용 in `src/features/dubbing-create/ui/PipelineProgress.tsx`
- [x] T019 [US4] 페이지 콘텐츠 등장 애니메이션 — 메인 콘텐츠에 페이드인/슬라이드업 CSS 애니메이션(`motion-safe:animate-fade-in`), `@keyframes` 정의 in `src/app/globals.css`, `src/features/dubbing-create/ui/DubbingDashboardPage.tsx`

**Checkpoint**: 모든 마이크로 인터랙션 적용, `prefers-reduced-motion` 존중 확인

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 통합 검증 및 마무리

- [x] T020 전체 테스트 실행 및 실패 테스트 수정 (`npm test`)
- [x] T021 모바일(375px) / 데스크톱(1280px) 반응형 레이아웃 수동 검증
- [x] T022 접근성 점검 — 색상 대비 4.5:1, focus 링, aria-label 전체 확인
- [x] T023 `prefers-reduced-motion` 미디어 쿼리 존중 확인 — 모션 비활성화 시 애니메이션 제거 검증

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 디자인 토큰 확장
- **User Story 1 (Phase 3)**: Phase 1 완료 후 시작 가능 (토큰 사용)
- **User Story 2 (Phase 4)**: Phase 1 완료 후 시작 가능, US1과 독립적으로 구현 가능하나 US1 이후 순차 권장 (동일 대시보드 페이지)
- **User Story 3 (Phase 5)**: US1, US2 완료 후 시작 권장 (일관성 검증에 전체 컴포넌트 필요)
- **User Story 4 (Phase 6)**: US1, US2 완료 후 시작 (트랜지션 대상 스타일이 확정되어야 함)
- **Polish (Phase 7)**: 모든 User Story 완료 후

### User Story Dependencies

- **US1 (P1)**: Phase 1 이후 독립 시작 가능 — MVP
- **US2 (P2)**: Phase 1 이후 독립 시작 가능 — US1과 병렬 가능하나 순차 권장
- **US3 (P3)**: US1 + US2 완료 후 권장 — 일관성 검증 필요
- **US4 (P4)**: US1 + US2 완료 후 — 트랜지션 대상 확정 필요

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- 테스트 → 구현 → 검증 순서
- Checkpoint에서 독립 검증

### Parallel Opportunities

- T003, T004: US1 테스트 병렬 작성
- T008, T009: US2 테스트 병렬 작성
- T012, T013: US3 테스트 병렬 작성
- T017, T018: US4 버튼 트랜지션 + 파이프라인 트랜지션 병렬

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "T003 DubbingDashboardPage 테스트 in DubbingDashboardPage.test.tsx"
Task: "T004 DubbingForm 스타일 테스트 in DubbingForm.test.tsx"

# After tests fail, implement:
Task: "T005 DubbingDashboardPage 스타일링"
Task: "T006 DubbingForm 스타일링"
Task: "T007 VoiceSelector 스타일링"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: 디자인 토큰 확장 (T001-T002)
2. Complete Phase 3: User Story 1 — 대시보드 폼 스타일 (T003-T007)
3. **STOP and VALIDATE**: 대시보드 폼 UI 독립 테스트
4. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 (토큰) → 토큰 준비 완료
2. US1 (대시보드 폼) → 테스트 → MVP 배포 가능
3. US2 (파이프라인) → 테스트 → 진행 시각화 추가
4. US3 (디자인 일관성) → 테스트 → 전체 브랜드 통일
5. US4 (모션) → 마이크로 인터랙션 추가
6. Polish → 최종 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- TDD 적용: 각 User Story의 테스트를 먼저 작성하고 실패 확인 후 구현
- 순수 Tailwind CSS만 사용 — 추가 UI 라이브러리 금지
- `motion-safe:` / `motion-reduce:` variant로 모션 접근성 보장
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
