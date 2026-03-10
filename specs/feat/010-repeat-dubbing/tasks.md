# Tasks: 연속 더빙 생성 복구

**Input**: Design documents from `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/`
**Prerequisites**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/plan.md`, `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/spec.md`, `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/research.md`, `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/data-model.md`, `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/contracts/`

**Tests**: TDD is explicitly requested in the implementation plan, so each user story starts with failing regression tests.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently inside the single Next.js app rooted at `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: Maps the task to a specific user story (`[US1]`, `[US2]`, `[US3]`)
- Every task below includes the exact file path or directory it changes or validates

## Phase 1: Setup (Regression Harness)

**Purpose**: Prepare repeat-generation test fixtures and UI mocks before changing behavior

- [x] T001 [P] Add repeat-generation fixture builders and deferred pipeline helpers in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`
- [x] T002 [P] Expand mocked `useDubbingCreate` scenario fixtures for repeat-attempt states in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared hook primitives required by every user story

**⚠️ CRITICAL**: Complete this phase before changing user-story behavior

- [x] T003 [P] Define shared processing-state and session-reset helpers in `src/features/dubbing-create/model/useDubbingCreate.ts`
- [x] T004 [P] Add Blob URL mock and cleanup scaffolding for repeat-attempt coverage in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`

**Checkpoint**: The hook has a common foundation for repeat-attempt orchestration and cleanup

---

## Phase 3: User Story 1 - 새로고침 없이 다음 더빙 생성 (Priority: P1) 🎯 MVP

**Goal**: Allow a completed dubbing session to start a fresh generation immediately without a page refresh

**Independent Test**: Complete one dubbing run, change the file, language, or voice in the same session, and confirm a second pipeline starts without reloading `/src/app/dashboard/page.tsx`

### Tests for User Story 1

- [x] T005 [P] [US1] Add failing hook regressions for `complete -> submit` and changed-input resubmission in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`
- [x] T006 [P] [US1] Add a dashboard regression for starting a second generation after success in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`

### Implementation for User Story 1

- [x] T007 [US1] Update the `submit()` guard and accepted-attempt start flow in `src/features/dubbing-create/model/useDubbingCreate.ts`
- [x] T008 [US1] Keep dashboard submit wiring and completed-state rendering aligned with re-entry behavior in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx`

**Checkpoint**: User Story 1 is independently testable and no longer requires refresh to start the next generation

---

## Phase 4: User Story 2 - 이전 작업 상태의 안전한 초기화 (Priority: P2)

**Goal**: Clear stale success, error, and progress state as soon as a new attempt begins

**Independent Test**: Start a second generation from a completed or failed state and verify stale audio, stale errors, and stale progress indicators disappear immediately

### Tests for User Story 2

- [x] T009 [P] [US2] Add failing hook regressions for clearing `audioUrl`, `transcription`, `translation`, and `errorMessage` on new submit or retry in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`
- [x] T010 [P] [US2] Add UI regressions for hiding previous audio and showing only current pipeline state in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx` and `src/__tests__/features/dubbing-create/ui/PipelineProgress.test.tsx`

### Implementation for User Story 2

- [x] T011 [US2] Implement shared session reset before each accepted attempt in `src/features/dubbing-create/model/useDubbingCreate.ts`
- [x] T012 [US2] Update current-attempt visibility rules in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx` and `src/features/dubbing-create/ui/PipelineProgress.tsx`
- [x] T013 [US2] Revoke superseded Blob URLs on attempt reset and hook unmount in `src/features/dubbing-create/model/useDubbingCreate.ts`

**Checkpoint**: User Story 2 is independently testable and stale state no longer leaks into the next run

---

## Phase 5: User Story 3 - 반복 생성 중 예측 가능한 입력 제어 (Priority: P3)

**Goal**: Lock inputs only while the pipeline is actively running and allow retry or same-input repeat generation afterward

**Independent Test**: Confirm duplicate submit is blocked only during `transcribing`, `translating`, or `synthesizing`, and that `complete` or `error` immediately allows retry or same-input resubmission

### Tests for User Story 3

- [x] T014 [P] [US3] Add failing hook regressions for processing-only lock behavior, `retry()` reuse, and same-input repeat submit in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`
- [x] T015 [P] [US3] Add UI regressions for disabling inputs only while processing in `src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx`

### Implementation for User Story 3

- [x] T016 [US3] Allow `submit()` from `complete` and `error` while keeping `retry()` bound to persisted inputs in `src/features/dubbing-create/model/useDubbingCreate.ts`
- [x] T017 [US3] Align input disabled state and retry-triggered submit UX in `src/features/dubbing-create/ui/DubbingForm.tsx` and `src/features/dubbing-create/ui/DubbingDashboardPage.tsx`

**Checkpoint**: User Story 3 is independently testable and input locking now matches the specified repeat-generation rules

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Harden cross-cutting regressions and run the targeted validation suite

- [x] T018 [P] Add repeat-attempt contract regressions for `POST /api/stt`, `POST /api/translate`, and `POST /api/tts` in `src/__tests__/entities/dubbing/api/transcribeFile.test.ts`, `src/__tests__/entities/dubbing/api/translateText.test.ts`, and `src/__tests__/entities/dubbing/api/createDubbing.test.ts`
- [x] T019 Run `npm run test:run -- src/__tests__/features/dubbing-create src/__tests__/entities/dubbing/api` and resolve any remaining failures in `src/features/dubbing-create/` and `src/entities/dubbing/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: No dependencies
- **Phase 2: Foundational**: Depends on Phase 1 and blocks all story work
- **Phase 3: US1**: Depends on Phase 2
- **Phase 4: US2**: Depends on Phase 2 and should follow US1 because both stories modify `src/features/dubbing-create/model/useDubbingCreate.ts`
- **Phase 5: US3**: Depends on Phase 2 and should follow US2 because it finalizes the same hook and form control rules
- **Phase 6: Polish**: Depends on all selected user stories being complete

### User Story Dependency Graph

```text
Phase 1 Setup
  -> Phase 2 Foundational
    -> US1 (P1: re-entry after success)
      -> US2 (P2: reset stale state)
        -> US3 (P3: predictable input control and retry)
          -> Phase 6 Polish
```

### Within Each User Story

- Write the listed regression tests first and confirm they fail before changing implementation
- Update `src/features/dubbing-create/model/useDubbingCreate.ts` before adjusting UI rendering for the same story
- Re-run the story-specific tests before moving to the next priority slice

### Parallel Opportunities

- T001 and T002 can proceed in parallel during setup
- T003 and T004 can proceed in parallel after setup completes
- Within each user story, the test task in the hook file and the test task in the UI file can proceed in parallel
- T018 can run in parallel with final feature-level cleanup before T019 executes the full validation pass

---

## Parallel Example: User Story 1

```bash
Task: "T005 [US1] Add failing hook regressions for complete -> submit and changed-input resubmission in src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx"
Task: "T006 [US1] Add a dashboard regression for starting a second generation after success in src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T009 [US2] Add failing hook regressions for clearing audioUrl, transcription, translation, and errorMessage on new submit or retry in src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx"
Task: "T010 [US2] Add UI regressions for hiding previous audio and showing only current pipeline state in src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx and src/__tests__/features/dubbing-create/ui/PipelineProgress.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T014 [US3] Add failing hook regressions for processing-only lock behavior, retry reuse, and same-input repeat submit in src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx"
Task: "T015 [US3] Add UI regressions for disabling inputs only while processing in src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete T005-T008 for User Story 1
3. Run the targeted US1 regressions in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx` and `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`
4. Validate that a second generation starts without refreshing the dashboard

### Incremental Delivery

1. Finish Setup + Foundational so repeat-attempt helpers are stable
2. Deliver US1 to restore the core repeated-generation path
3. Deliver US2 to remove stale result and error leakage
4. Deliver US3 to finalize lock and retry semantics
5. Finish with contract regressions and the targeted `vitest` pass

### Suggested MVP Scope

- User Story 1 only (`T005-T008`) after Phase 1 and Phase 2 complete

---

## Notes

- This repository uses a single-app `/src` layout, so the monorepo path examples in the generic command spec were adapted to the actual structure documented in `plan.md`
- No new server route is planned; the existing `POST /api/stt`, `POST /api/translate`, and `POST /api/tts` contracts are preserved and only regression-tested
- Every checklist item above follows the required `- [ ] T### [P?] [Story?] Description` format
