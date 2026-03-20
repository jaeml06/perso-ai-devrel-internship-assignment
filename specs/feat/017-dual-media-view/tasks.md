# Tasks: 듀얼 미디어 뷰 (원본 + 더빙 비교 재생)

**Input**: Design documents from `/specs/feat/017-dual-media-view/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md
**Tests**: TDD (Red-Green-Refactor) — plan.md에 명시됨. 모든 변경은 실패 테스트 작성 → 구현 → 리팩터 순서.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- Tests: `src/__tests__/features/dubbing-create/`
- Feature: `src/features/dubbing-create/`

---

## Phase 1: Setup

**Purpose**: 신규 파일 생성 및 기존 파일 구조 확인

- [x] T001 Verify existing project structure and dependencies (clsx, tailwind-merge) are installed
- [x] T002 Create empty placeholder files for new modules: `src/features/dubbing-create/lib/mediaType.ts`, `src/features/dubbing-create/ui/VideoPlayer.tsx`, `src/features/dubbing-create/ui/MediaPlayer.tsx`, `src/features/dubbing-create/ui/DualMediaView.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 핵심 유틸리티 — `getMediaType` 순수 함수

**⚠️ CRITICAL**: US1~US5 모두 mediaType 판별에 의존하므로 이 Phase 완료 전까지 User Story 작업 불가

### Tests (RED)

- [x] T003 Write failing tests for `getMediaType` in `src/__tests__/features/dubbing-create/lib/mediaType.test.ts`: `video/mp4` → `'video'`, `video/quicktime` → `'video'`, `video/webm` → `'video'`, `audio/mpeg` → `'audio'`, `audio/wav` → `'audio'`, 빈 MIME + `.mp4` 확장자 → `'video'` 폴백

### Implementation (GREEN + REFACTOR)

- [x] T004 Implement `getMediaType(file: File): MediaType` in `src/features/dubbing-create/lib/mediaType.ts` — `file.type.startsWith('video/')` → `'video'`, else `'audio'`. 빈 MIME 시 확장자 폴백 (`.mp4`, `.mov`, `.webm` → `'video'`)
- [x] T005 Run tests and verify all pass, refactor if needed

**Checkpoint**: `getMediaType` 순수 함수 완성 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 — 영상 파일 업로드 시 비디오로 재생 (Priority: P1) 🎯 MVP

**Goal**: 영상 파일을 업로드하고 더빙 완료 후, 원본 영상이 비디오 플레이어로 재생된다 (오디오 플레이어가 아닌)

**Independent Test**: mp4 영상 파일 업로드 → 더빙 완료 → 원본 영상이 `<video>` 요소로 재생되는지 확인

### Tests (RED)

- [x] T006 [P] [US1] Write failing tests for VideoPlayer in `src/__tests__/features/dubbing-create/ui/VideoPlayer.test.tsx`: `<video>` 요소 렌더링, `src` 속성에 URL 바인딩, `controls` 속성 존재, `preload="metadata"` 속성
- [x] T007 [P] [US1] Write failing tests for MediaPlayer in `src/__tests__/features/dubbing-create/ui/MediaPlayer.test.tsx`: `mediaType='video'` → VideoPlayer 렌더링(`<video>` 존재), `mediaType='audio'` → `<audio>` 요소 렌더링
- [x] T008 [US1] Write failing tests for useDubbingCreate sourceUrl/mediaType in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`: 파일 설정 시 `sourceUrl`이 Blob URL, `mediaType`이 올바르게 설정, 파일 변경 시 이전 `sourceUrl` 해제 (`URL.revokeObjectURL` 호출), unmount 시 `sourceUrl` 해제

### Implementation (GREEN)

- [x] T009 [P] [US1] Implement VideoPlayer component in `src/features/dubbing-create/ui/VideoPlayer.tsx` — `<video controls preload="metadata" src={videoUrl}>` 렌더링, Tailwind 스타일 적용 (`w-full rounded-lg`)
- [x] T010 [P] [US1] Implement MediaPlayer component in `src/features/dubbing-create/ui/MediaPlayer.tsx` — `mediaType === 'video'` → `<VideoPlayer>`, `'audio'` → `<audio controls>` 분기 렌더링
- [x] T011 [US1] Modify useDubbingCreate hook in `src/features/dubbing-create/model/useDubbingCreate.ts` — `sourceUrl`, `mediaType` 상태 추가. `setFile` 시 `URL.createObjectURL(file)` + `getMediaType(file)`. 이전 `sourceUrl` `revokeObjectURL`. unmount cleanup
- [x] T012 [US1] Run all US1 tests and verify pass, refactor if needed

**Checkpoint**: 영상 파일 업로드 시 비디오 플레이어로 렌더링되는 기반 완성

---

## Phase 4: User Story 2 — 파일 업로드 직후 원본 미디어 미리보기 (Priority: P1)

**Goal**: 파일 업로드 직후, 더빙 시작 전에 원본 미디어를 미리보기로 표시 (영상→비디오 플레이어, 오디오→오디오 플레이어)

**Independent Test**: 파일 업로드 직후 더빙 시작 전, 원본 미디어가 적절한 플레이어로 재생되는지 확인

### Tests (RED)

- [x] T013 [US2] Write failing tests for DubbingDashboardPage preview in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`: 파일 업로드 후 + pipelineStatus가 `idle`/진행 중일 때 원본 미리보기 MediaPlayer가 표시됨, 영상 파일 → `<video>` 미리보기, 오디오 파일 → `<audio>` 미리보기

### Implementation (GREEN)

- [x] T014 [US2] Modify DubbingDashboardPage in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx` — `sourceUrl && mediaType`이 존재하고 파이프라인 미완료 시 `<MediaPlayer mediaUrl={sourceUrl} mediaType={mediaType} />` 원본 미리보기 렌더링
- [x] T0\1 [US2] Run all US2 tests and verify pass, refactor if needed

**Checkpoint**: 파일 업로드 직후 원본 미리보기 표시 완성

---

## Phase 5: User Story 3 — 원본 영상과 더빙 오디오 나란히 비교 (Priority: P1)

**Goal**: 더빙 완료 후 원본 영상(비디오 플레이어)과 더빙 오디오(오디오 플레이어)를 나란히 비교 — 데스크톱 좌우, 모바일 상하

**Independent Test**: 영상 업로드 → 더빙 완료 → 화면에 원본 비디오 + 더빙 오디오 플레이어 동시 표시 확인

### Tests (RED)

- [x] T0\1 [P] [US3] Write failing tests for DualMediaView in `src/__tests__/features/dubbing-create/ui/DualMediaView.test.tsx`: "원본" 레이블 표시, "더빙" 레이블 표시, 원본 MediaPlayer 렌더링, 더빙 AudioPlayer 렌더링, 반응형 클래스 존재 (`flex-col md:flex-row` 또는 동등)
- [x] T0\1 [US3] Write failing integration test in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`: 영상 파일 + pipelineStatus `complete` + audioUrl 존재 → DualMediaView 렌더링 (기존 단독 AudioPlayer 대신)

### Implementation (GREEN)

- [x] T0\1 [US3] Implement DualMediaView component in `src/features/dubbing-create/ui/DualMediaView.tsx` — 좌우(데스크톱)/상하(모바일) Flex 레이아웃. 왼쪽: "원본" 레이블 + `<MediaPlayer>`. 오른쪽: "더빙" 레이블 + `<AudioPlayer>` + 다운로드
- [x] T0\1 [US3] Modify DubbingDashboardPage in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx` — pipelineStatus `complete` + sourceUrl + audioUrl 시 기존 단독 AudioPlayer를 `<DualMediaView sourceUrl={sourceUrl} sourceMediaType={mediaType} dubbedUrl={audioUrl} />`로 교체
- [x] T0\1 [US3] Run all US3 tests and verify pass, refactor if needed

**Checkpoint**: 영상 업로드 후 더빙 완료 시 원본 영상 + 더빙 오디오 듀얼 뷰 표시 완성

---

## Phase 6: User Story 4 — 원본 오디오와 더빙 오디오 나란히 비교 (Priority: P2)

**Goal**: 오디오 파일 업로드 → 더빙 완료 후 원본 오디오 + 더빙 오디오 나란히 표시

**Independent Test**: 오디오 파일 업로드 → 더빙 완료 → 원본 오디오와 더빙 오디오 플레이어가 함께 표시되는지 확인

### Tests (RED)

- [x] T0\1 [US4] Write failing tests in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`: 오디오 파일(mp3) + pipelineStatus `complete` + audioUrl → DualMediaView 렌더링, 원본 측에 `<audio>` 플레이어 표시

### Implementation (GREEN)

- [x] T0\1 [US4] Verify DualMediaView already handles `sourceMediaType='audio'` via MediaPlayer — 오디오 파일 시 원본 측에 `<audio controls>` 렌더링. 필요 시 DubbingDashboardPage 조건 로직 확인/수정
- [x] T0\1 [US4] Run all US4 tests and verify pass

**Checkpoint**: 오디오 파일 더빙 완료 시에도 듀얼 뷰 정상 동작

---

## Phase 7: User Story 5 — 원본과 더빙 미디어 레이블 구분 (Priority: P3)

**Goal**: 각 플레이어에 "원본" / "더빙" 레이블을 명확히 표시하여 혼동 방지

**Independent Test**: 결과 화면에서 "원본", "더빙" 레이블이 각 플레이어에 표시되는지 확인

### Tests (RED)

- [x] T0\1 [US5] Write failing tests in `src/__tests__/features/dubbing-create/ui/DualMediaView.test.tsx`: 레이블 텍스트 "원본"과 "더빙"이 정확히 표시되는지 확인 (Phase 5 T016에서 기본 확인 포함되었으나, 접근성 등 세부 검증)

### Implementation (GREEN)

- [x] T0\1 [US5] Verify/refine DualMediaView labels — "원본", "더빙" 레이블이 시각적으로 명확한지 확인. 필요 시 폰트 크기, 색상, 간격 조정. 접근성 (`aria-label` 등) 추가
- [x] T0\1 [US5] Run all US5 tests and verify pass

**Checkpoint**: 레이블 구분이 명확하여 사용자가 3초 이내에 원본/더빙 식별 가능

---

## Phase 8: User Story 6 — 영상 더빙 시 영상 형태로 결과 제공 (Priority: P1) 🎯

**Goal**: 영상 파일 더빙 완료 시 FFmpeg.wasm으로 원본 영상 + 더빙 오디오를 합성하여 영상 형태로 결과 제공

**Independent Test**: 영상 파일 업로드 → 더빙 완료 → 더빙 결과가 영상(비디오 플레이어)으로 재생되며 영상 파일로 다운로드 가능한지 확인

### Setup

- [x] T031 Install FFmpeg.wasm dependencies: `npm install @ffmpeg/ffmpeg @ffmpeg/util`
- [x] T032 Add `'merging'` to `DubbingPipelineStatus` type in `src/entities/dubbing/dto/dubbing.dto.ts` and update `isProcessingPipelineStatus` in `src/features/dubbing-create/lib/pipelineStatus.ts`

### Tests (RED)

- [x] T033 [P] [US6] Write tests for `mergeVideoAudio` in `src/__tests__/features/dubbing-create/lib/mergeVideoAudio.test.ts`: FFmpeg mock으로 합성 호출 검증, 결과 Blob URL 반환, FFmpeg 로딩 실패 시 에러, 합성 실패 시 에러
- [x] T034 [P] [US6] Write tests for useDubbingCreate merging in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`: 영상 파일 + TTS 완료 → pipelineStatus `'merging'`, merging 완료 → `dubbedVideoUrl` 설정 + `'complete'`, merging 실패 → `dubbedVideoUrl=null` + `'complete'` (audioUrl 폴백), 오디오 파일 → merging 건너뜀
- [x] T035 [P] [US6] Write tests for DualMediaView with video result in `src/__tests__/features/dubbing-create/ui/DualMediaView.test.tsx`: `dubbedMediaType='video'` → VideoPlayer 렌더링, `dubbedMediaType='audio'` → AudioPlayer 렌더링
- [x] T036 [US6] Write tests for DubbingDashboardPage merging in `src/__tests__/features/dubbing-create/ui/DubbingDashboardPage.test.tsx`: pipelineStatus `'merging'` → "영상 합성 중..." 표시, 영상 + dubbedVideoUrl → `dubbedMediaType='video'` 전달, 영상 + dubbedVideoUrl=null → `dubbedMediaType='audio'` 폴백

### Implementation (GREEN)

- [x] T037 [US6] Implement `mergeVideoAudio` in `src/features/dubbing-create/lib/mergeVideoAudio.ts` — FFmpeg.wasm 로딩 + `-c:v copy -map 0:v -map 1:a -shortest` 합성 + Blob 반환
- [x] T038 [US6] Modify useDubbingCreate in `src/features/dubbing-create/model/useDubbingCreate.ts` — synthesizing 완료 후 `mediaType === 'video'`이면 `mergeVideoAudio` 호출, `dubbedVideoUrl` 상태 + Blob URL 생명주기 관리. `createDubbing` API를 `{ url, blob }` 반환으로 확장하여 fetch 없이 blob 전달
- [x] T039 [US6] Modify DualMediaView in `src/features/dubbing-create/ui/DualMediaView.tsx` — `dubbedMediaType` prop 추가, 더빙 쪽 렌더링을 `MediaPlayer(dubbedUrl, dubbedMediaType)` + 다운로드 버튼으로 변경
- [x] T040 [US6] Modify DubbingDashboardPage in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx` — `dubbedVideoUrl` 연동, DualMediaView에 `dubbedMediaType` 전달, merging 상태 표시
- [x] T041 [US6] Modify PipelineProgress in `src/features/dubbing-create/ui/PipelineProgress.tsx` — `'merging'` 상태에 "영상 합성 중..." 메시지 표시
- [x] T042 [US6] Run all US6 tests and verify pass, refactor if needed

**Checkpoint**: 영상 파일 더빙 시 결과가 영상 형태(비디오 플레이어)로 제공됨

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 여러 User Story에 걸친 개선 및 엣지 케이스 처리

- [x] T0\1 [P] Blob URL cleanup verification — 반복 더빙(재제출) 시 이전 sourceUrl이 올바르게 해제되는지 테스트 추가 in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`
- [x] T0\1 [P] Edge case: 파일을 null로 설정 시 sourceUrl 해제 및 null 리셋, submit 후 sourceUrl 유지 테스트 in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx`
- [x] T0\1 [P] Verify responsive layout — 모바일에서 상하 배치, 데스크톱에서 좌우 배치 Tailwind 클래스 확인
- [x] T043 [P] Blob URL cleanup for dubbedVideoUrl — 반복 더빙 시 이전 dubbedVideoUrl이 해제되는지 테스트 추가 (T034에서 포함)
- [x] T044 [P] FFmpeg.wasm 로딩 실패 시 오디오 폴백 검증 (T034 merging 실패 테스트에서 포함)
- [x] T045 Run full test suite (`npm test`) and verify all tests pass — 191 tests passed
- [x] T046 Run lint (`npm run lint`) and fix any issues — lint clean

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — `getMediaType` 구현이 모든 US를 BLOCK
- **US1 (Phase 3)**: Phase 2 완료 후 — VideoPlayer, MediaPlayer, useDubbingCreate 확장
- **US2 (Phase 4)**: Phase 3 완료 후 — DubbingDashboardPage에서 sourceUrl/mediaType 사용
- **US3 (Phase 5)**: Phase 3 완료 후 — DualMediaView 신규 구현 (US2와 병렬 가능)
- **US4 (Phase 6)**: Phase 5 완료 후 — DualMediaView가 오디오도 처리하는지 확인
- **US5 (Phase 7)**: Phase 5 완료 후 — DualMediaView 레이블 세부 조정
- **US6 (Phase 8)**: Phase 5 완료 후 — FFmpeg.wasm 영상 합성 (DualMediaView + useDubbingCreate 필요)
- **Polish (Phase 9)**: 모든 US 완료 후

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 시작 — 다른 Story의 기반
- **US2 (P1)**: US1 완료 후 시작 — sourceUrl/mediaType 상태를 사용
- **US3 (P1)**: US1 완료 후 시작 — VideoPlayer, MediaPlayer, useDubbingCreate 필요
- **US4 (P2)**: US3 완료 후 시작 — DualMediaView 오디오 케이스 검증
- **US5 (P3)**: US3 완료 후 시작 — DualMediaView 레이블 정제
- **US6 (P1)**: US3 완료 후 시작 — FFmpeg.wasm 합성 + DualMediaView 확장

### Within Each User Story

- Tests (RED) MUST be written and FAIL before implementation (GREEN)
- lib → model → ui 순서 (FSD 단방향 의존성)
- 각 Story 완료 후 Checkpoint에서 독립 검증

### Parallel Opportunities

- **Phase 3**: T006, T007 병렬 가능 (다른 파일), T009, T010 병렬 가능 (다른 파일)
- **Phase 4 & 5**: US2와 US3는 둘 다 US1 완료 후 병렬 시작 가능
- **Phase 5**: T016은 T017과 병렬 가능 (다른 테스트 파일)
- **Phase 8**: T027, T028, T029 모두 병렬 가능

---

## Parallel Example: User Story 1

```bash
# RED — 테스트 먼저 작성 (병렬 가능):
Task T006: "VideoPlayer tests in src/__tests__/.../ui/VideoPlayer.test.tsx"
Task T007: "MediaPlayer tests in src/__tests__/.../ui/MediaPlayer.test.tsx"

# GREEN — 구현 (병렬 가능):
Task T009: "VideoPlayer in src/features/dubbing-create/ui/VideoPlayer.tsx"
Task T010: "MediaPlayer in src/features/dubbing-create/ui/MediaPlayer.tsx"

# 순차: T008 → T011 (useDubbingCreate는 상태 변경이므로 테스트→구현 순서)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (`getMediaType`)
3. Complete Phase 3: User Story 1 (VideoPlayer + MediaPlayer + useDubbingCreate 확장)
4. **STOP and VALIDATE**: 영상 파일 업로드 → 비디오 플레이어로 재생되는지 확인
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → `getMediaType` 준비 완료
2. US1 → 영상 파일 비디오 재생 버그 수정 (MVP!)
3. US2 → 파일 업로드 직후 미리보기
4. US3 → 듀얼 미디어 뷰 (원본 + 더빙 비교)
5. US4 → 오디오 파일 듀얼 비교
6. US5 → 레이블 정제
7. Polish → 엣지 케이스 및 최종 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- TDD 접근: 모든 Phase에서 RED → GREEN → REFACTOR 순서 준수
- Blob URL 메모리 누수 방지가 핵심 — unmount/파일 변경 시 `revokeObjectURL` 필수
- 기존 AudioPlayer는 변경하지 않음 — 더빙 결과 재생에 그대로 사용
- 브라우저 기본 미디어 컨트롤 활용 — 커스텀 플레이어 UI 불필요
