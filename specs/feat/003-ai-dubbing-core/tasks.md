# Tasks: AI 더빙 코어 (파일 업로드 → STT → 번역 → TTS)

**Input**: Design documents from `/specs/feat/003-ai-dubbing-core/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, research.md ✅, contracts/POST-stt.md ✅, contracts/POST-translate.md ✅
**TDD**: Tests are REQUIRED — spec.md and plan.md explicitly mandate TDD (Red → Green per stage)

> **Context**: 이전 스펙(텍스트 → TTS)은 이미 구현 완료(T001–T031 ✅). 이번 태스크는 요구사항 변경으로 인해 전체 파이프라인(파일 업로드 → STT → 번역 → TTS)으로 교체하는 작업이다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in each description

## Path Conventions

Single Next.js project at repository root. FSD architecture:

```text
src/app/api/                              → Next.js Route Handlers (server)
src/entities/dubbing/dto/                 → TypeScript DTOs
src/entities/dubbing/api/                 → Entity API functions (ky client)
src/features/dubbing-create/lib/          → Pure utility functions
src/features/dubbing-create/model/        → React hooks (pipeline state)
src/features/dubbing-create/ui/           → UI components
src/shared/config/                        → Server-only config
src/__tests__/                            → Centralized test files
```

---

## Phase 1: Setup

**Purpose**: Install new dependency required by all subsequent phases

- [x] T001 Install `@google/genai` package: `npm install @google/genai`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Updated DTOs and env config needed by ALL new user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update `src/entities/dubbing/dto/dubbing.dto.ts` — add new pipeline types: `TranscriptionResult`, `TranslationResult`, `DubbingPipelineStatus`, `FileValidationErrors`, `FileValidationResult`, `AudioResult`; add constants `SUPPORTED_EXTENSIONS`, `SUPPORTED_MIME_TYPES`, `MAX_FILE_SIZE_BYTES`, `PIPELINE_STATUS_MESSAGES` (as specified in data-model.md)
- [x] T003 [P] Write RED test: add `getGeminiApiKey()` cases to `src/__tests__/shared/config/env.test.ts` — throws when `GEMINI_API_KEY` unset, returns value when set
- [x] T004 [P] Update `src/shared/config/env.ts` — add `getGeminiApiKey(): string` that throws `Error('GEMINI_API_KEY is not set')` when env var missing (GREEN for T003)

**Checkpoint**: DTOs and env config updated — user story implementation can now begin

---

## Phase 3: User Story 1 — 파일 업로드 및 언어 선택 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 오디오/비디오 파일을 업로드하고 타겟 언어와 음성을 선택한다. 클라이언트 검증이 즉각적인 피드백을 제공한다. 모든 입력이 유효할 때 "더빙 생성" 버튼이 활성화된다.

**Independent Test**: mp3 파일 업로드 + 언어 선택 + 음성 선택 → 버튼 활성화. pdf 업로드 → "지원하지 않는 파일 형식입니다". 파일 없이 제출 → "파일을 업로드해주세요".

### Tests for User Story 1 (TDD — write FIRST, must FAIL before implementation)

- [x] T005 Write RED test `src/__tests__/features/dubbing-create/lib/validateFileInput.test.ts` — cases: no file → `errors.file = "파일을 업로드해주세요"`, unsupported format (pdf) → `errors.file = "지원하지 않는 파일 형식입니다"`, >25MB → `errors.file = "파일 크기가 25MB를 초과합니다"`, no voiceId → `errors.voiceId = "음성을 선택해주세요"`, no language → `errors.language = "타겟 언어를 선택해주세요"`, valid mp3+voiceId+language → `isValid: true`, valid mp4 (video) → `isValid: true`

### Implementation for User Story 1

- [x] T006 [US1] Implement `src/features/dubbing-create/lib/validateFileInput.ts` — pure function: MIME type check → extension fallback (for files with ambiguous MIME) → file size → voiceId/language presence; returns `FileValidationResult` (GREEN for T005)
- [x] T007 [US1] Replace `src/features/dubbing-create/ui/DubbingForm.tsx` — swap textarea for `<input type="file" accept=".mp3,.wav,.ogg,.flac,.m4a,.mp4,.mov,.webm">`, display selected filename, show `validationErrors.file` inline, use function declaration

- [x] T027 Delete `src/features/dubbing-create/lib/validateDubbingInput.ts` — superseded by `validateFileInput.ts` (T006); no longer used in main flow per plan.md

**Checkpoint**: File upload form validates correctly and independently — no API calls needed to test US1

---

## Phase 4: User Story 2 — 음성 전사(STT) (Priority: P1)

**Goal**: 업로드된 파일을 `/api/stt` Route Handler로 전달하면 ElevenLabs STT API가 텍스트로 전사한다. Route Handler와 Entity API 각각 독립적으로 테스트 가능하다.

**Independent Test**: 알려진 내용의 오디오를 POST `/api/stt` → `{ text, languageCode, languageProbability }` 반환. 파일 없음 → 400. ElevenLabs 429 → 429. 무음 파일 → 400 "음성을 감지하지 못했습니다".

### Tests for User Story 2 (TDD — write FIRST, must FAIL before implementation)

- [x] T008 [P] Write RED test `src/__tests__/app/api/stt.route.test.ts` — cases: no `file` field → 400, valid file → 200 `{ text, languageCode, languageProbability }`, empty transcription text → 400 "음성을 감지하지 못했습니다", ElevenLabs 429 → 429 "크레딧이 부족합니다", ElevenLabs 401 → 503 "서비스를 일시적으로 사용할 수 없습니다", `ELEVENLABS_API_KEY` unset → 500, other ElevenLabs error → 502
- [x] T009 [P] Write RED test `src/__tests__/entities/dubbing/api/transcribeFile.test.ts` — cases: success → returns `TranscriptionResult`, error response → throws

### Implementation for User Story 2

- [x] T010 [US2] Implement `src/app/api/stt/route.ts` — `POST`: `request.formData()` → get `file` → construct new FormData with `file` and `model_id: "scribe_v1"` → native `fetch` to ElevenLabs `POST /v1/speech-to-text` with `xi-api-key` header → parse response, map `language_code`→`languageCode`, check empty text; handle all error cases per contracts/POST-stt.md (GREEN for T008)
- [x] T011 [US2] Implement `src/entities/dubbing/api/transcribeFile.ts` — `ky.post('/api/stt', { body: formData })` → parse JSON → return `TranscriptionResult`; throw on non-2xx (GREEN for T009)

**Checkpoint**: POST `/api/stt` handles all error scenarios — STT layer independently testable

---

## Phase 5: User Story 3 — 텍스트 번역 (Priority: P1)

**Goal**: 전사 텍스트를 `/api/translate`를 통해 Google Gemini로 타겟 언어로 번역한다. 동일 언어 요청은 Gemini 호출 없이 `wasSkipped: true`로 반환한다.

**Independent Test**: POST `{ text: "Hello", sourceLanguage: "en", targetLanguage: "ko" }` to `/api/translate` → `{ translatedText: "...", wasSkipped: false }`. 동일 언어(en→en) → `{ translatedText: original, wasSkipped: true }`. 필드 누락 → 400.

### Tests for User Story 3 (TDD — write FIRST, must FAIL before implementation)

- [x] T012 [P] Write RED test `src/__tests__/app/api/translate.route.test.ts` — cases: missing required fields → 400, same language (en→en) → 200 `{ translatedText: original, wasSkipped: true }`, valid request → 200 `{ translatedText, wasSkipped: false }`, `GEMINI_API_KEY` unset → 500, Gemini SDK error → 502
- [x] T013 [P] Write RED test `src/__tests__/entities/dubbing/api/translateText.test.ts` — cases: success → returns `{ translatedText, wasSkipped }`, error response → throws

### Implementation for User Story 3

- [x] T014 [US3] Implement `src/app/api/translate/route.ts` — `POST`: parse JSON body with zod schema (`text` min 1, `sourceLanguage` enum `['ko','en','auto']`, `targetLanguage` enum `['ko','en']`); if `sourceLanguage === targetLanguage` return `{ translatedText: text, wasSkipped: true }`; otherwise call `@google/genai` SDK (`GoogleGenAI`) with model `gemini-3.1-flash-lite-preview` and prompt from contracts/POST-translate.md; handle 400/500/502 per contract (GREEN for T012)
- [x] T015 [US3] Implement `src/entities/dubbing/api/translateText.ts` — `ky.post('/api/translate', { json: { text, sourceLanguage, targetLanguage } })` → parse JSON → return `{ translatedText, wasSkipped }`; throw on non-2xx (GREEN for T013)

**Checkpoint**: Translation layer independently testable — same-language skip and Gemini errors handled correctly

---

## Phase 6: User Story 4 — 음성 합성(TTS) 파이프라인 (Priority: P1)

**Goal**: `useDubbingCreate` 훅이 STT → 번역 → TTS를 순서대로 실행하며 `pipelineStatus`를 `transcribing → translating → synthesizing → complete`로 업데이트한다. 각 단계 실패 시 `pipelineStatus: 'error'`로 전환하고 `retry()` 제공한다.

**Independent Test**: 유효 파일+음성+언어 제출 → 훅이 모든 파이프라인 상태를 순서대로 통과 → `audioUrl` 설정 + `pipelineStatus === 'complete'`. STT 실패 → `pipelineStatus === 'error'` + `errorMessage`. `retry()` 동일 입력으로 재시작. 파이프라인 진행 중 중복 제출 차단.

### Tests for User Story 4 (TDD — write FIRST, must FAIL before implementation)

- [x] T016 Write RED test `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx` — full rewrite: initial state `{ file: null, pipelineStatus: 'idle', audioUrl: null }`, no file → `validationErrors.file` no API call, no voiceId → `validationErrors.voiceId`, valid submit → status sequence `transcribing → translating → synthesizing → complete`, STT failure → `pipelineStatus: 'error'` + `errorMessage`, translate failure → error, TTS failure → error, in-progress submit blocked, `retry()` restarts with same inputs, **STT returns unsupported languageCode (e.g. 'fr') → `translateText` called with `sourceLanguage: 'auto'`**

### Implementation for User Story 4

- [x] T017 [US4] Replace `src/features/dubbing-create/model/useDubbingCreate.ts` — pipeline state machine: validate via `validateFileInput` → `setPipelineStatus('transcribing')` → `transcribeFile(file)` → **normalize `sourceLanguage`: `(['ko','en'] as string[]).includes(transcription.languageCode) ? transcription.languageCode : 'auto'`** → `setPipelineStatus('translating')` → `translateText({ text, sourceLanguage: normalizedSourceLanguage, targetLanguage })` → `setPipelineStatus('synthesizing')` → `createDubbing({ text: translatedText, voiceId, language })` → `setPipelineStatus('complete')` + `setAudioUrl`; catch → `setPipelineStatus('error')` + `setErrorMessage`; expose `submit()`, `retry()`, `setFile`, `setTargetLanguage`, `setVoiceId`, `transcription`, `translation`, `audioUrl`, `pipelineStatus`, `errorMessage`, `validationErrors`, `voices`, `voicesError` per `UseDubbingCreateReturn` interface in plan.md (GREEN for T016)
- [x] T018 [US4] Create `src/features/dubbing-create/ui/PipelineProgress.tsx` — 4-step progress indicator (STT / 번역 / TTS / 완료); each step shows active/done/idle state using `pipelineStatus` and `PIPELINE_STATUS_MESSAGES`; show `errorMessage` and retry button when `pipelineStatus === 'error'`; use function declaration
- [x] T019 [US4] Update `src/features/dubbing-create/ui/DubbingDashboardPage.tsx` — assemble DubbingForm (file input) + VoiceSelector + PipelineProgress + AudioPlayer; wire all hook state/handlers; disable form inputs when `pipelineStatus !== 'idle'`

**Checkpoint**: Full end-to-end pipeline functional — all 4 pipeline stages testable as a unit

---

## Phase 7: User Story 5 — 더빙된 결과물 재생 및 다운로드 (Priority: P2)

**Goal**: 파이프라인 완료 후 사용자가 더빙 오디오를 브라우저에서 재생(재생/일시정지/탐색)하고 파일로 다운로드할 수 있다.

**Independent Test**: `audioUrl` (Blob URL) 설정 후 AudioPlayer 렌더링 → play/pause 동작, 다운로드 버튼 `<a download="dubbing.mp3">` 존재.

### Implementation for User Story 5

- [x] T020 [US5] Verify `src/features/dubbing-create/ui/AudioPlayer.tsx` — confirm `<audio>` element uses `audioUrl` prop, play/pause/seek controls present, `<a href={audioUrl} download="dubbing.mp3">` download button exists; update if any of these are missing

**Checkpoint**: Playback and download independently functional with Blob URL

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 전체 플로우 검증, 환경변수 경로 점검

- [x] T021 [P] Run `npm test` — confirm all new tests pass (T005–T016); fix any failures
- [x] T022 [P] Run `npm run lint` — fix lint errors across all new/modified files
- [ ] T023 Verify API key error paths: unset `ELEVENLABS_API_KEY` → `/api/stt` returns 500; unset `GEMINI_API_KEY` → `/api/translate` returns 500
- [ ] T024 Verify same-language optimization: English audio + English target language → `wasSkipped: true` in hook `translation` state, TTS called with original transcription text
- [ ] T025 Verify duplicate-submit guard: while `pipelineStatus !== 'idle'`, form inputs are disabled and calling `submit()` is a no-op
- [x] T026 Add `GEMINI_API_KEY=your_api_key_here` to `.env.example` if not already present

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup: npm install @google/generative-ai)
    ↓
Phase 2 (Foundational: DTOs + getGeminiApiKey) ← BLOCKS ALL
    ↓                   ↓                   ↓
Phase 3 (US1)      Phase 4 (US2)       Phase 5 (US3)
    ↓                   ↓                   ↓
    └───────────────────┴───────────────────┘
                        ↓
            Phase 6 (US4: pipeline hook + PipelineProgress)
                        ↓
            Phase 7 (US5: AudioPlayer verify)
                        ↓
            Phase 8 (Polish)
```

### Key Sequential Dependencies

- T002 (DTO update) must complete before T005, T008, T012, T016 (all need new types)
- T003/T004 (env test/impl) can parallelize with T002 if env.ts is edited separately
- T005 (validateFileInput test) → T006 (validateFileInput impl)
- T008 (stt route test) → T010 (stt route impl)
- T009 (transcribeFile test) → T011 (transcribeFile impl)
- T012 (translate route test) → T014 (translate route impl)
- T013 (translateText test) → T015 (translateText impl)
- T016 (hook test) → T017 (hook impl); T017 depends on T006, T011, T015
- T018, T019 can parallelize after T017

### Parallel Opportunities Within Phases

| Phase | Parallel Group |
| ----- | -------------- |
| Phase 2 | T003 + T004 after T002 |
| Phases 3, 4, 5 | All three phases after Phase 2 |
| Phase 4 internal | T008 + T009 (tests); T010 + T011 (impl) |
| Phase 5 internal | T012 + T013 (tests); T014 + T015 (impl) |
| Phase 8 | T021 + T022 |

---

## Parallel Example: Phases 4 & 5

```bash
# Phases 4 and 5 have zero cross-file dependency — run in parallel:

# Agent A: US2 (STT)
Task: "Write stt.route.test.ts (RED) — T008"
Task: "Write transcribeFile.test.ts (RED) — T009"
Task: "Implement src/app/api/stt/route.ts (GREEN) — T010"
Task: "Implement src/entities/dubbing/api/transcribeFile.ts (GREEN) — T011"

# Agent B: US3 (Translation)
Task: "Write translate.route.test.ts (RED) — T012"
Task: "Write translateText.test.ts (RED) — T013"
Task: "Implement src/app/api/translate/route.ts (GREEN) — T014"
Task: "Implement src/entities/dubbing/api/translateText.ts (GREEN) — T015"
```

---

## Implementation Strategy

### MVP First (User Stories 1–4, P1 only)

1. Complete Phase 1: `npm install @google/generative-ai`
2. Complete Phase 2: DTOs + `getGeminiApiKey()` — **blocks everything**
3. Run Phases 3, 4, 5 in parallel: US1 (validation) + US2 (STT) + US3 (Translation)
4. Complete Phase 6: US4 (pipeline hook + progress UI)
5. **STOP and VALIDATE**: `npm test` → all green; manual test with real API keys
6. Demo/deploy if ready

### Incremental Delivery

1. Setup + Foundational → types and config ready
2. US1 alone → file validation testable without any server calls
3. US2 + US3 (parallel) → server-side pipeline stages independently testable via curl
4. US4 → full pipeline working end-to-end in browser
5. US5 → audio playback and download confirmed working
6. Polish → all tests green, lint clean

---

## Summary

| Phase | Tasks | Parallel? |
| ----- | ----- | --------- |
| Phase 1: Setup | 1 | — |
| Phase 2: Foundational | 3 | T003+T004 parallel |
| Phase 3: US1 (파일 업로드/검증) | 4 | — |
| Phase 4: US2 (STT) | 4 | T008+T009 / T010+T011 parallel |
| Phase 5: US3 (번역) | 4 | T012+T013 / T014+T015 parallel |
| Phase 6: US4 (파이프라인 훅+UI) | 4 | T018+T019 after T017 |
| Phase 7: US5 (재생/다운로드) | 1 | — |
| Phase 8: Polish | 6 | T021+T022 parallel |
| **Total** | **27** | |

**Suggested MVP scope**: Phases 1–6 (US1–US4, all P1 stories)
