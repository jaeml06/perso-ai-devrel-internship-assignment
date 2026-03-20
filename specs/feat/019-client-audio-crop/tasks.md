# Tasks: 클라이언트 측 1분 미디어 크롭

**Input**: Design documents from `/specs/feat/019-client-audio-crop/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md
**Tests**: TDD 접근 — 모든 구현 전 테스트 작성 (Red → Green → Refactor)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: DTO 타입 확장 및 상수 정의 — 이후 모든 단계의 타입 기반

- [x] T001 `DubbingPipelineStatus` 타입에 `'cropping'` 추가 및 `PIPELINE_STATUS_MESSAGES`에 `cropping: '미디어를 1분으로 자르는 중...'` 추가, `MAX_MEDIA_DURATION_SECONDS = 60` 상수 추가 in `src/entities/dubbing/dto/dubbing.dto.ts`
- [x] T002 `isProcessingPipelineStatus`에 `'cropping'` 조건 추가 in `src/features/dubbing-create/lib/pipelineStatus.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 크롭 핵심 유틸리티 — 모든 User Story가 이 유틸에 의존함

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (TDD — Red first)

- [x] T003 [P] `getMediaDuration` 단위 테스트 작성 in `src/__tests__/features/dubbing-create/lib/getMediaDuration.test.ts` — 테스트 케이스: (1) 오디오 파일 duration 반환, (2) 비디오 파일 duration 반환, (3) 손상된 파일 시 `'미디어 메타데이터를 읽을 수 없습니다'` throw, (4) Blob URL revokeObjectURL 호출 확인. HTMLMediaElement를 mock하여 `loadedmetadata`/`error` 이벤트 시뮬레이션.
- [x] T004 [P] `cropMedia` 단위 테스트 작성 in `src/__tests__/features/dubbing-create/lib/cropMedia.test.ts` — 기존 `mergeVideoAudio.test.ts`와 동일한 FFmpeg mock 패턴 사용. 테스트 케이스: (1) 45초 파일 → `wasCropped: false`, 원본 반환, (2) 60초 정확히 → `wasCropped: false`, (3) 120초 → `wasCropped: true`, FFmpeg `-t 60 -c copy` 호출 확인, (4) 오디오 → 오디오 MIME 유지, (5) 비디오 → 비디오 MIME 유지, (6) FFmpeg 로드 실패 → `'미디어 크롭에 실패했습니다'` throw, (7) FFmpeg exec 실패 → 동일 에러 throw, (8) `originalDuration` 값 반환 확인. `getMediaDuration`을 mock하여 duration 값 주입.

### Implementation (Green)

- [x] T005 [P] `getMediaDuration` 구현 in `src/features/dubbing-create/lib/getMediaDuration.ts` — `HTMLMediaElement`(`audio`/`video`)의 `loadedmetadata` 이벤트에서 `duration` 읽기. Blob URL 생성 후 메타데이터 로드, 완료/실패 시 `URL.revokeObjectURL` 정리. T003 테스트 통과 확인.
- [x] T006 [P] `cropMedia` 구현 in `src/features/dubbing-create/lib/cropMedia.ts` — `CropMediaParams`, `CropResult` 인터페이스 정의. (1) `getMediaDuration`으로 재생 시간 확인, (2) `maxDurationSeconds` 이하이면 `{ file, wasCropped: false, originalDuration }` 반환, (3) 초과이면 FFmpeg 로드 → `writeFile` → `exec(['-i', inputName, '-t', String(maxDurationSeconds), '-c', 'copy', outputName])` → `readFile` → 새 `File` 생성하여 반환. 입력 파일 확장자/MIME 보존. T004 테스트 통과 확인.

**Checkpoint**: `getMediaDuration`과 `cropMedia` 유틸이 모든 테스트를 통과하고, 이후 User Story에서 사용 가능한 상태

---

## Phase 3: User Story 1 — 1분 초과 미디어 자동 크롭 (Priority: P1) 🎯 MVP

**Goal**: 1분 초과 파일 업로드 시 클라이언트에서 처음 1분만 크롭하여 더빙 파이프라인에 전달

**Independent Test**: 2분짜리 오디오 파일을 업로드하고, STT API로 전송되는 파일이 1분 분량인지 확인

### Tests for User Story 1 (TDD — Red first) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [US1] `useDubbingCreate` 훅 크롭 통합 테스트 추가 in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx` — 기존 테스트 파일에 `describe('크롭 통합')` 블록 추가. `cropMedia`를 mock. 테스트 케이스: (1) 120초 파일 submit 시 `pipelineStatus`가 `'cropping'` → `'transcribing'` 순서로 전환, (2) 45초 파일 submit 시 원본 파일 그대로 `transcribeFile`에 전달 (크롭 건너뜀), (3) 크롭 성공 시 크롭된 파일이 `transcribeFile`에 전달됨 확인, (4) 크롭 실패 시 `pipelineStatus: 'error'` 및 `errorMessage` 설정

### Implementation for User Story 1

- [x] T008 [US1] `useDubbingCreate` 훅의 `runPipeline`에 크롭 단계 삽입 in `src/features/dubbing-create/model/useDubbingCreate.ts` — validation 통과 직후, `transcribing` 전에: (1) `cropMedia` import, (2) `setPipelineStatus('cropping')`, (3) `const cropResult = await cropMedia({ file: currentFile!, maxDurationSeconds: MAX_MEDIA_DURATION_SECONDS })`, (4) `cropResult.wasCropped`이면 크롭된 파일로 이후 파이프라인 진행, (5) 실패 시 catch에서 error 처리. T007 테스트 통과 확인.
- [x] T009 [US1] Edge case 검증 — 60초 정확히 파일, 61초 파일에 대한 동작이 spec 명세와 일치하는지 기존 테스트에서 확인. 필요시 T007 테스트에 edge case 추가.

**Checkpoint**: 1분 초과 파일이 자동 크롭되어 파이프라인에 전달됨. 1분 이하 파일은 기존과 동일하게 동작.

---

## Phase 4: User Story 2 — 크롭 진행 상태 피드백 (Priority: P2)

**Goal**: 크롭 진행 중 사용자에게 "미디어를 1분으로 자르는 중..." 시각적 피드백 제공

**Independent Test**: 1분 초과 파일 업로드 시 크롭 단계에서 진행 상태 메시지가 표시되는지 확인

### Tests for User Story 2 (TDD — Red first) ⚠️

- [x] T010 [US2] `PipelineProgress` 컴포넌트 테스트 추가 in `src/__tests__/features/dubbing-create/ui/PipelineProgress.test.tsx` — 기존 테스트에 `cropping` 상태 관련 케이스 추가: (1) `pipelineStatus='cropping'`일 때 `'미디어를 1분으로 자르는 중...'` 텍스트 표시 확인, (2) `cropping` → `transcribing` 전환 시 메시지 자연스럽게 변경

### Implementation for User Story 2

- [x] T011 [US2] Phase 1의 T001에서 이미 `PIPELINE_STATUS_MESSAGES`에 `cropping` 메시지를 추가했으므로, `PipelineProgress` 컴포넌트가 기존 `PIPELINE_STATUS_MESSAGES[status]` 렌더링 로직으로 `cropping` 상태를 자동 지원하는지 확인. 추가 변경이 필요하면 `src/features/dubbing-create/ui/PipelineProgress.tsx`에서 수정. T010 테스트 통과 확인.

**Checkpoint**: 크롭 진행 중 "미디어를 1분으로 자르는 중..." 메시지가 표시되고, 크롭 완료 후 전사 단계로 자연스럽게 전환됨.

---

## Phase 5: User Story 3 — 크롭 알림 및 원본 길이 안내 (Priority: P3)

**Goal**: 1분 초과 파일 선택 시 사전 안내 메시지 표시 ("원본 길이: X분 Y초 → 처음 1분만 처리됩니다")

**Independent Test**: 5분짜리 파일 선택 시 안내 메시지가 표시되고, 30초짜리 파일 선택 시 안내 미표시 확인

### Tests for User Story 3 (TDD — Red first) ⚠️

- [x] T012 [US3] `useDubbingCreate` 훅 `fileDuration` 상태 테스트 추가 in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx` — `getMediaDuration` mock. 테스트 케이스: (1) 파일 선택 시 `fileDuration`이 업데이트됨, (2) 파일 제거 시 `fileDuration`이 `null`로 리셋, (3) `getMediaDuration` 실패 시 `fileDuration`이 `null` (에러 무시, 파일 선택은 정상 진행)
- [x] T013 [P] [US3] `DubbingForm` 크롭 안내 메시지 테스트 추가 in `src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx` — 테스트 케이스: (1) `fileDuration=300` (5분) 전달 시 "처음 1분만 처리됩니다" 텍스트 포함 안내 메시지 표시, (2) `fileDuration=30` (30초) 전달 시 크롭 안내 미표시, (3) `fileDuration=null` (파일 미선택) 시 크롭 안내 미표시, (4) `fileDuration=60` (정확히 1분) 시 크롭 안내 미표시

### Implementation for User Story 3

- [x] T014 [US3] `useDubbingCreate` 훅에 `fileDuration` 상태 추가 in `src/features/dubbing-create/model/useDubbingCreate.ts` — (1) `const [fileDuration, setFileDuration] = useState<number | null>(null)` 추가, (2) `handleSetFile`에서 파일 선택 시 `getMediaDuration(newFile).then(setFileDuration).catch(() => setFileDuration(null))` 호출, (3) 파일 제거 시 `setFileDuration(null)`, (4) return에 `fileDuration` 추가. T012 테스트 통과 확인.
- [x] T015 [US3] `DubbingForm`에 크롭 안내 메시지 UI 추가 in `src/features/dubbing-create/ui/DubbingForm.tsx` — (1) props에 `fileDuration: number | null` 추가, (2) 파일 정보 영역 아래에 `fileDuration !== null && fileDuration > MAX_MEDIA_DURATION_SECONDS`일 때 안내 메시지 렌더링: `"원본 길이: {분}분 {초}초 → 처음 1분만 처리됩니다"`, (3) `MAX_MEDIA_DURATION_SECONDS` import from `dubbing.dto.ts`. T013 테스트 통과 확인.
- [x] T016 [US3] `DubbingDashboardPage` (또는 상위 조합 컴포넌트)에서 `fileDuration` prop을 `DubbingForm`에 전달하도록 연결 확인

**Checkpoint**: 1분 초과 파일 선택 시 사전 안내 메시지 표시. 1분 이하 또는 미선택 시 미표시.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case 처리 및 코드 정리

- [x] T017 [P] Edge case 테스트 보강 in `src/__tests__/features/dubbing-create/lib/cropMedia.test.ts` — (1) 손상된 미디어 파일의 크롭 실패 시 에러 메시지 확인, (2) 지원하지 않는 코덱 파일의 크롭 실패 시 에러 메시지 확인
- [x] T018 [P] Blob URL 메모리 누수 검증 — `useDubbingCreate` 훅의 cleanup에서 크롭 과정 중 생성된 임시 Blob URL이 올바르게 revoke되는지 확인
- [x] T019 전체 테스트 스위트 실행 (`npm test`) 및 기존 테스트 회귀 없음 확인
- [x] T020 `npm run lint` 통과 확인 및 타입 체크 (`npx tsc --noEmit`) 통과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 DTO 타입) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (`cropMedia` 유틸)
- **US2 (Phase 4)**: Depends on Phase 1 (T001 `PIPELINE_STATUS_MESSAGES`) — Phase 2와 병렬 가능
- **US3 (Phase 5)**: Depends on Phase 2 (`getMediaDuration` 유틸)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 가능. 다른 US에 의존하지 않음. **MVP 범위.**
- **US2 (P2)**: Phase 1 T001 완료 후 시작 가능. US1과 병렬 가능 (다른 파일).
- **US3 (P3)**: Phase 2 T005 (`getMediaDuration`) 완료 후 시작 가능. US1/US2와 병렬 가능.

### Within Each User Story (TDD)

1. **RED**: 테스트 작성 → 실패 확인
2. **GREEN**: 최소 구현으로 테스트 통과
3. **REFACTOR**: 코드 정리 (동작 변경 없이)
4. Checkpoint에서 독립 검증

### Parallel Opportunities

```
Phase 1 완료 후:
├── Phase 2: T003 + T004 (테스트 병렬) → T005 + T006 (구현 병렬)
│
Phase 2 완료 후:
├── US1: T007 → T008 → T009
├── US2: T010 → T011           (US1과 병렬 가능)
└── US3: T012 + T013 (병렬) → T014 + T015 (병렬) → T016
```

---

## Parallel Example: Phase 2 (Foundational)

```
# TDD Red — 테스트 동시 작성 (서로 다른 파일):
Agent 1: T003 "getMediaDuration 테스트 in src/__tests__/.../getMediaDuration.test.ts"
Agent 2: T004 "cropMedia 테스트 in src/__tests__/.../cropMedia.test.ts"

# TDD Green — 구현 동시 작성 (서로 다른 파일):
Agent 1: T005 "getMediaDuration 구현 in src/features/.../getMediaDuration.ts"
Agent 2: T006 "cropMedia 구현 in src/features/.../cropMedia.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002) — DTO 타입 확장
2. Complete Phase 2: Foundational (T003–T006) — 크롭 유틸 TDD
3. Complete Phase 3: User Story 1 (T007–T009) — 파이프라인 크롭 통합 TDD
4. **STOP and VALIDATE**: 1분 초과 파일 업로드 → 크롭 후 STT 전달 확인
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 크롭 유틸 준비
2. **US1** → 자동 크롭 동작 → Test → **MVP Deploy** 🎯
3. **US2** → 진행 상태 피드백 → Test → Deploy
4. **US3** → 사전 안내 메시지 → Test → Deploy
5. Polish → Edge case + 회귀 테스트 → Final Deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- TDD 순서 엄격 준수: 테스트 실패 확인 → 구현 → 통과 확인
- 각 Checkpoint에서 `npm test` 실행하여 회귀 확인
- FFmpeg mock 패턴은 기존 `mergeVideoAudio.test.ts` 참조
- 크롭 기준: `duration > 60초`이면 크롭, `<= 60초`이면 원본 유지
