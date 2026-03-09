# Tasks: AI 더빙 코어 기능 (ElevenLabs TTS)

**Input**: Design documents from `/specs/feat/003-ai-dubbing-core/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD 접근 명시 (plan.md) — 각 레이어별 테스트 먼저(Red-Green-Refactor) 포함

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (Next.js 16 App Router + FSD)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 의존성 추가 및 기본 환경 구성

- [x] T001 Install required dependencies: `npm install ky zod`
- [x] T002 [P] Create `.env.local` with `ELEVENLABS_API_KEY` placeholder and add `.env.local` to `.gitignore` (if not already)
- [x] T003 [P] Create `.env.example` with `ELEVENLABS_API_KEY=your_api_key_here` for documentation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 공통 타입, 환경변수 모듈, 유효성 검증 함수

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [P] Write env config test in `src/__tests__/shared/config/env.test.ts` — `getElevenLabsApiKey()` 미설정 시 에러 throw 확인, 설정 시 값 반환 확인
- [x] T005 [P] Write validation test in `src/__tests__/features/dubbing-create/lib/validateDubbingInput.test.ts` — 빈 텍스트 거부, 5000자 초과 거부, voiceId 미선택 거부, 유효하지 않은 language 거부, 유효한 입력 통과

### Implementation for Foundational

- [x] T006 [P] Create Voice entity DTOs in `src/entities/voice/dto/voice.dto.ts` — `Voice`, `VoiceGender`, `VoiceAgeGroup`, `VoiceListResponse` 타입
- [x] T007 [P] Create Dubbing entity DTOs in `src/entities/dubbing/dto/dubbing.dto.ts` — `DubbingRequest`, `DubbingResponse`, `DubbingStatus`, `DubbingLanguage`, `ValidationResult` 타입
- [x] T008 [P] Implement env config module in `src/shared/config/env.ts` — `getElevenLabsApiKey()` 서버 전용 환경변수 접근 (미설정 시 에러 throw)
- [x] T009 Implement validation function in `src/features/dubbing-create/lib/validateDubbingInput.ts` — 순수 함수: text (1~5000자), voiceId (필수), language (`ko`|`en`) 검증 (depends on T007)

**Checkpoint**: Foundation ready — 공통 타입, 환경변수, 유효성 검증 함수가 모두 준비됨. T004, T005 테스트 GREEN 확인.

---

## Phase 3: User Story 1 — ElevenLabs API 키 준비 (Priority: P1) 🎯 MVP

**Goal**: 개발자가 ElevenLabs API 키를 환경 변수에 설정하면 TTS 기능이 동작할 수 있는 기반이 마련된다. API 키 미설정 시 명확한 에러를 반환한다.

**Independent Test**: 환경 변수 설정 후 `GET /api/voices` 호출 시 200 응답을 받고, API 키 미설정 상태에서 `POST /api/tts` 호출 시 500 에러와 명확한 메시지를 받는다.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Write GET /api/voices route test in `src/__tests__/app/api/voices.route.test.ts` — 200 반환, 6개 음성 반환, 필수 필드(id, name, gender, ageGroup, previewUrl, description) 확인, female/male 포함, young/middle 포함
- [x] T011 [P] [US1] Write POST /api/tts route test (API key error cases) in `src/__tests__/app/api/tts.route.test.ts` — API 키 미설정 시 500, 빈 텍스트 400, 5001자 400, voiceId 빈값 400, 잘못된 language 400

### Implementation for User Story 1

- [x] T012 [US1] Implement GET /api/voices route handler in `src/app/api/voices/route.ts` — `PREMADE_VOICES` 6개 정적 상수 + `NextResponse.json()` 반환 (depends on T006)
- [x] T013 [US1] Implement POST /api/tts route handler (zod validation + env check) in `src/app/api/tts/route.ts` — zod 스키마 검증, `getElevenLabsApiKey()` 호출, ElevenLabs API fetch + 에러 핸들링 (401→503, 429→429, 기타→502), 성공 시 `audio/mpeg` 반환 (depends on T008, T009)

**Checkpoint**: `GET /api/voices` → 200 + 6개 음성. `POST /api/tts` → 키 미설정 시 500. T010, T011 테스트 GREEN 확인.

---

## Phase 4: User Story 3 — 사용 가능한 음성 목록 조회 (Priority: P1)

**Goal**: 사용자가 대시보드에서 성별·나이대로 분류된 6개 음성을 드롭다운으로 보고, 선택 시 미리듣기로 샘플을 재생할 수 있다.

**Independent Test**: 대시보드 로드 시 드롭다운에 6개 음성 표시, 선택 시 미리듣기 재생, API 에러 시 에러 메시지와 재시도 버튼 표시.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T014 [P] [US3] Write getVoices entity API test in `src/__tests__/entities/voice/api/getVoices.test.ts` — `/api/voices` 호출 → 음성 배열 반환, API 에러 시 예외 throw
- [x] T015 [P] [US3] Write VoiceSelector component test in `src/__tests__/features/dubbing-create/ui/VoiceSelector.test.tsx` — 음성 목록 드롭다운 표시, 선택 시 onChange 호출, 미리듣기 버튼 표시, 미리듣기 클릭 시 오디오 재생, API 에러 시 에러 메시지와 재시도 버튼 표시

### Implementation for User Story 3

- [x] T016 [US3] Implement getVoices entity API in `src/entities/voice/api/getVoices.ts` — ky로 `GET /api/voices` 호출, `VoiceListResponse` 반환 (depends on T006)
- [x] T017 [US3] Implement VoiceSelector component in `src/features/dubbing-create/ui/VoiceSelector.tsx` — 드롭다운 (성별·나이대 라벨), 미리듣기 버튼 (`<audio>` + previewUrl), 에러 표시 + 재시도, function declaration (depends on T016)

**Checkpoint**: VoiceSelector 렌더링 → 6개 음성 드롭다운 표시, 선택 후 미리듣기 재생. T014, T015 테스트 GREEN 확인.

---

## Phase 5: User Story 2 — 텍스트를 음성으로 변환 (Priority: P1)

**Goal**: 사용자가 텍스트를 입력하고 음성·언어를 선택하여 "더빙 생성"을 누르면 오디오가 생성된다. 유효성 에러 시 즉각 피드백을 제공한다.

**Independent Test**: 대시보드에서 텍스트 입력 + 음성 선택 + 더빙 생성 → 오디오 생성됨. 빈 텍스트/음성 미선택 시 에러 메시지 표시.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T018 [P] [US2] Write POST /api/tts route test (success + ElevenLabs error cases) in `src/__tests__/app/api/tts.route.test.ts` — 유효 요청 → 200 + audio/mpeg, ElevenLabs 401 → 503, ElevenLabs 429 → 429, ElevenLabs 500 → 502 (T011에서 validation 테스트 이미 작성됨, 여기서 추가 케이스)
- [x] T019 [P] [US2] Write createDubbing entity API test in `src/__tests__/entities/dubbing/api/createDubbing.test.ts` — `/api/tts` POST 호출, 오디오 Blob 반환, 400 에러 시 메시지 포함 예외 throw
- [x] T020 [P] [US2] Write useDubbingCreate hook test in `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx` — 초기 상태, 빈 텍스트 제출 시 유효성 에러, 음성 미선택 제출 시 에러, 제출 중 isLoading true, 성공 시 audioUrl 설정, 성공 후 isLoading false, API 에러 시 errorMessage, 중복 제출 방지
- [x] T021 [P] [US2] Write DubbingForm component test in `src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx` — 텍스트 입력란 + 음성 선택 + 언어 선택 + 제출 버튼 렌더링, 글자 수 카운터 "0/5000", 빈 텍스트 제출 시 에러 메시지, 로딩 중 제출 버튼 비활성화

### Implementation for User Story 2

- [x] T022 [US2] Implement createDubbing entity API in `src/entities/dubbing/api/createDubbing.ts` — ky로 `POST /api/tts` 호출, `response.blob()` → `URL.createObjectURL(blob)` → audioUrl 반환 (depends on T007)
- [x] T023 [US2] Implement useDubbingCreate hook in `src/features/dubbing-create/model/useDubbingCreate.ts` — text/voiceId/language 상태, 제출 시 validateDubbingInput → createDubbing 호출, isLoading/audioUrl/errorMessage/validationErrors 관리, 중복 제출 방지 (depends on T009, T016, T022)
- [x] T024 [US2] Implement DubbingForm component in `src/features/dubbing-create/ui/DubbingForm.tsx` — textarea + VoiceSelector + 언어 드롭다운(ko/en) + 글자 수 카운터 + 제출 버튼 + 에러 메시지 표시 + 로딩 상태, function declaration (depends on T017, T023)

**Checkpoint**: DubbingForm → 텍스트 입력 + 음성/언어 선택 + 제출 → 오디오 URL 생성. 유효성 에러 표시. T018~T021 테스트 GREEN 확인.

---

## Phase 6: User Story 4 — 생성된 오디오 재생 및 다운로드 (Priority: P2)

**Goal**: 사용자가 생성된 오디오를 브라우저에서 재생(재생/일시정지/탐색)하거나 파일로 다운로드할 수 있다.

**Independent Test**: 오디오 생성 후 플레이어에서 재생/일시정지/탐색 가능, 다운로드 버튼으로 mp3 파일 저장 가능.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T025 [P] [US4] Write AudioPlayer component test in `src/__tests__/features/dubbing-create/ui/AudioPlayer.test.tsx` — 재생 버튼 렌더링, 재생 클릭 시 오디오 재생, 다운로드 버튼 렌더링

### Implementation for User Story 4

- [x] T026 [US4] Implement AudioPlayer component in `src/features/dubbing-create/ui/AudioPlayer.tsx` — HTML5 `<audio>` + `useRef`, 재생/일시정지 토글, 진행 바 (currentTime/duration), 다운로드 버튼 (`<a href={audioUrl} download="dubbing.mp3">`), function declaration (depends on T023 audioUrl output)

**Checkpoint**: AudioPlayer → 재생/일시정지/탐색/다운로드 기능 동작. T025 테스트 GREEN 확인.

---

## Phase 7: Assembly & Integration

**Purpose**: 페이지 조립 및 라우팅 연결

- [x] T027 Implement DubbingDashboardPage in `src/features/dubbing-create/ui/DubbingDashboardPage.tsx` — DubbingForm + AudioPlayer 조합, useDubbingCreate 훅으로 상태 공유, function declaration (depends on T024, T026)
- [x] T028 Create dashboard route page in `src/app/dashboard/page.tsx` — thin page: `<DubbingDashboardPage />` 렌더링 (depends on T027)

**Checkpoint**: `/dashboard` 접속 → 텍스트 입력 → 음성 선택 → 더빙 생성 → 오디오 재생/다운로드 전체 플로우 동작.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 전체 플로우 점검, 에러 처리 강화, 코드 정리

- [x] T029 [P] Verify all tests pass: `npm test` — 전체 테스트 GREEN 확인
- [x] T030 [P] Verify lint passes: `npm run lint` — 코드 스타일 확인
- [x] T031 Review FSD layer dependencies — `app → features → entities → shared` 단방향 의존성 준수 확인, 배럴 export 없음 확인
- [ ] T032 End-to-end manual test with real ElevenLabs API key — `.env.local`에 실제 키 설정 후 `/dashboard`에서 전체 플로우 동작 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (ky, zod 설치) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (DTOs, env.ts)
- **US3 (Phase 4)**: Depends on Phase 3 (GET /api/voices route)
- **US2 (Phase 5)**: Depends on Phase 3 (POST /api/tts route) + Phase 4 (VoiceSelector)
- **US4 (Phase 6)**: Depends on Phase 5 (useDubbingCreate hook의 audioUrl)
- **Assembly (Phase 7)**: Depends on Phase 5 + Phase 6
- **Polish (Phase 8)**: Depends on Phase 7

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational: DTOs + env + validation)
    ↓
Phase 3 (US1: API Key + Route Handlers)
    ↓
Phase 4 (US3: Voice List + VoiceSelector)
    ↓
Phase 5 (US2: TTS Conversion + DubbingForm)
    ↓
Phase 6 (US4: Audio Player)
    ↓
Phase 7 (Assembly: Dashboard Page)
    ↓
Phase 8 (Polish)
```

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD Red-Green-Refactor)
- DTOs before API functions
- API functions before hooks
- Hooks before UI components
- Core implementation before integration

### Parallel Opportunities

**Phase 2 내부**:
- T004, T005 (테스트 작성) — 병렬 가능
- T006, T007, T008 (DTOs + env) — 병렬 가능

**Phase 3 내부**:
- T010, T011 (테스트 작성) — 병렬 가능

**Phase 4 내부**:
- T014, T015 (테스트 작성) — 병렬 가능

**Phase 5 내부**:
- T018, T019, T020, T021 (테스트 작성) — 병렬 가능

**Phase 8 내부**:
- T029, T030 — 병렬 가능

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch tests in parallel:
Task: "Write env config test in src/__tests__/shared/config/env.test.ts"
Task: "Write validation test in src/__tests__/features/dubbing-create/lib/validateDubbingInput.test.ts"

# Launch DTOs + env in parallel (after tests written):
Task: "Create Voice entity DTOs in src/entities/voice/dto/voice.dto.ts"
Task: "Create Dubbing entity DTOs in src/entities/dubbing/dto/dubbing.dto.ts"
Task: "Implement env config module in src/shared/config/env.ts"
```

## Parallel Example: Phase 5 (User Story 2)

```bash
# Launch all tests in parallel:
Task: "Write POST /api/tts route test (success cases) in src/__tests__/app/api/tts.route.test.ts"
Task: "Write createDubbing entity API test in src/__tests__/entities/dubbing/api/createDubbing.test.ts"
Task: "Write useDubbingCreate hook test in src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx"
Task: "Write DubbingForm component test in src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 3 + 2)

1. Complete Phase 1: Setup (install ky, zod)
2. Complete Phase 2: Foundational (DTOs, env, validation)
3. Complete Phase 3: US1 — API Key + Route Handlers
4. Complete Phase 4: US3 — Voice List
5. Complete Phase 5: US2 — TTS Conversion
6. **STOP and VALIDATE**: 텍스트 입력 → 음성 선택 → 더빙 생성 전체 플로우 테스트
7. Deploy/demo if ready (오디오 재생은 브라우저 기본 기능으로 가능)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (API Key + Routes) → 서버 API 동작 확인 (curl 테스트 가능)
3. US3 (Voice List) → 음성 선택 UI 동작 확인
4. US2 (TTS Conversion) → 핵심 기능 완성 (텍스트→오디오)
5. US4 (Audio Player) → 재생/다운로드 UX 완성
6. Assembly → 전체 페이지 통합
7. Polish → 최종 점검

### Total Tasks: 32

| Phase | Task Count | Parallel Opportunities |
|-------|-----------|----------------------|
| Phase 1: Setup | 3 | 2 tasks parallel |
| Phase 2: Foundational | 6 | 5 tasks parallel (2 tests + 3 impl) |
| Phase 3: US1 | 4 | 2 tests parallel |
| Phase 4: US3 | 4 | 2 tests parallel |
| Phase 5: US2 | 7 | 4 tests parallel |
| Phase 6: US4 | 2 | 1 test |
| Phase 7: Assembly | 2 | sequential |
| Phase 8: Polish | 4 | 2 tasks parallel |
