# Implementation Plan: AI 더빙 코어 (파일 업로드 → STT → 번역 → TTS)

**Branch**: `feat/#3-ai-dubbing-core` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: 파일 업로드 → ElevenLabs STT → Gemini 번역 → ElevenLabs TTS 전체 파이프라인. TDD 방식: 각 단계 테스트 먼저(Red) → 구현(Green) → 리팩터.

## Summary

사용자가 오디오/비디오 파일을 업로드하면 3단계 파이프라인(STT → 번역 → TTS)을 통해 더빙된 오디오를 생성한다.

- **STT**: ElevenLabs `POST /v1/speech-to-text` (multipart, 비디오 직접 지원)
- **번역**: Google Gemini `gemini-3.1-flash-lite-preview` (동일 언어 시 건너뜀)
- **TTS**: ElevenLabs `POST /v1/text-to-speech/{voice_id}` (기존 구현 재사용)
- **TDD**: 각 파이프라인 단계를 독립적으로 테스트 가능하도록 설계

기존 구현(텍스트 → TTS)은 이 PR에서 파일 업로드 → 전체 파이프라인으로 교체한다.

## Technical Context

**Language/Version**: TypeScript 5
**Primary Dependencies**: Next.js 16 (App Router), React 19, ky 1.x, zod 4.x, `@google/genai` (신규 추가)
**Storage**: N/A (세션 내 메모리, Blob URL)
**Testing**: Vitest 4 + @testing-library/react (jsdom, 기존 설정 유지)
**Target Platform**: Next.js 서버(Route Handlers) + 브라우저 클라이언트
**Performance Goals**: 3분 이하 파일 기준 전체 파이프라인 완료
**Constraints**: ElevenLabs 무료 크레딧, 25MB 파일 제한, 클라이언트 API 키 노출 금지
**Scale/Scope**: 단일 사용자 세션, 서버리스 Route Handlers

## Constitution Check

GATE: FSD 레이어 준수, 배럴 패턴 금지, 단방향 의존성

| Gate | Status | Notes |
| --- | --- | --- |
| FSD 레이어 (`app → features → entities → shared`) | ✅ PASS | Route Handlers(app), 파이프라인 훅(features), API 함수(entities) 분리 |
| 배럴 패턴 금지 (index.ts re-export 없음) | ✅ PASS | 모든 import는 개별 파일 경로 사용 |
| 단방향 의존성 | ✅ PASS | shared → entities → features → app 방향 유지 |
| 컴포넌트 function declaration | ✅ PASS | `export default function Component()` 사용 |
| 환경변수 서버 전용 | ✅ PASS | `NEXT_PUBLIC_` 접두사 없음, shared/config/env.ts 경유 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/003-ai-dubbing-core/
├── plan.md              # This file
├── research.md          # Phase 0: API 결정 (ElevenLabs STT, Gemini, 파일업로드)
├── data-model.md        # Phase 1: 타입 정의 (새 파이프라인 엔티티 포함)
├── contracts/
│   ├── GET-voices.md    # 기존
│   ├── POST-tts.md      # 기존
│   ├── POST-stt.md      # 신규
│   └── POST-translate.md # 신규
└── tasks.md             # /speckits:tasks 명령으로 생성
```

### Source Code (TDD 관점 — 파일별 Red/Green 순서)

```text
src/
├── app/
│   └── api/
│       ├── stt/route.ts              # [신규] ElevenLabs STT Route Handler
│       ├── translate/route.ts        # [신규] Gemini 번역 Route Handler
│       ├── tts/route.ts              # [기존] 변경 없음
│       └── voices/route.ts           # [기존] 변경 없음
│
├── entities/
│   └── dubbing/
│       ├── dto/dubbing.dto.ts        # [업데이트] 새 파이프라인 타입 추가
│       └── api/
│           ├── transcribeFile.ts     # [신규] client → /api/stt (ky)
│           ├── translateText.ts      # [신규] client → /api/translate (ky)
│           └── createDubbing.ts      # [기존] 변경 없음
│
├── features/
│   └── dubbing-create/
│       ├── lib/
│       │   ├── validateFileInput.ts  # [신규] 파일 포맷/크기 검증 (순수 함수)
│       │   └── validateDubbingInput.ts # [기존] 더 이상 메인 플로우 미사용
│       ├── model/
│       │   └── useDubbingCreate.ts   # [교체] 파이프라인 상태 머신으로 전면 교체
│       └── ui/
│           ├── DubbingDashboardPage.tsx # [업데이트] 파일 업로드 UI
│           ├── DubbingForm.tsx          # [교체] textarea → file input
│           ├── PipelineProgress.tsx     # [신규] 단계별 진행 상태 표시
│           ├── VoiceSelector.tsx        # [기존] 변경 없음
│           └── AudioPlayer.tsx          # [기존] 변경 없음
│
└── shared/
    └── config/
        └── env.ts                    # [업데이트] getGeminiApiKey() 추가

src/__tests__/
├── features/dubbing-create/lib/
│   └── validateFileInput.test.ts     # [신규 RED→GREEN]
├── entities/dubbing/api/
│   ├── transcribeFile.test.ts        # [신규 RED→GREEN]
│   └── translateText.test.ts         # [신규 RED→GREEN]
├── app/api/
│   ├── stt.route.test.ts             # [신규 RED→GREEN]
│   └── translate.route.test.ts       # [신규 RED→GREEN]
├── features/dubbing-create/model/
│   └── useDubbingCreate.test.tsx     # [교체 RED→GREEN — 파이프라인 훅]
└── shared/config/
    └── env.test.ts                   # [업데이트] getGeminiApiKey() 추가
```

**Structure Decision**: 단일 Next.js 프로젝트 (리포지토리 루트의 `src/`). FSD 아키텍처를 따르며 Route Handlers가 서버 레이어 역할.

## Architecture Decision Table

| Decision | Options Considered | Chosen | Rationale / FSD Impact |
| --- | --- | --- | --- |
| **파이프라인 구조** | 단일 `/api/dubbing` vs 분리 라우트 | **분리 라우트** (stt/translate/tts) | SC-002: 각 단계 독립 테스트. 분리된 Route Handler → 분리된 entities/api 함수 |
| **STT API 클라이언트** | ElevenLabs SDK vs 직접 fetch | **직접 fetch** (서버측) | 기존 TTS Route Handler 패턴과 일관성, 추가 의존성 없음 |
| **번역 API 클라이언트** | `@google/genai` SDK vs fetch | **SDK** | 공식 SDK로 인증/에러 처리 편의. 서버 전용(Route Handler 내) |
| **파이프라인 오케스트레이션** | 서버(단일 API) vs 클라이언트(훅) | **클라이언트 훅** | 단계별 진행 상태 UI 표시 필수 (FR-006). 각 단계 에러/재시도 UX |
| **동일 언어 처리** | 항상 번역 vs 건너뜀 | **건너뜀** (`wasSkipped: true`) | Gemini 불필요 호출 방지, `/api/translate`에서 처리 |
| **파일 수신 방식** | `request.formData()` vs busboy | **`request.formData()`** | Next.js 16 기본 지원, 추가 패키지 불필요 |
| **테스트 구조** | 파일 옆(co-located) vs 중앙화 | **중앙화** (`src/__tests__/`) | 기존 프로젝트 패턴 유지 |

## TDD 구현 순서 (Red → Green per stage)

각 단계는 반드시 **테스트 작성(RED) → 구현(GREEN)** 순서를 따른다.

### Stage 1: 파일 검증 (순수 함수 — 의존성 없음)

**RED** `validateFileInput.test.ts` 작성:

- 파일 없음 → `errors.file = "파일을 업로드해주세요"`
- 지원하지 않는 포맷(pdf) → `errors.file = "지원하지 않는 파일 형식입니다"`
- 25MB 초과 → `errors.file = "파일 크기가 25MB를 초과합니다"`
- voiceId 미선택 → `errors.voiceId = "음성을 선택해주세요"`
- 타겟 언어 미선택 → `errors.language = "타겟 언어를 선택해주세요"`
- 유효한 mp3 + voiceId + language → `isValid: true`
- 유효한 mp4(비디오) → `isValid: true`

**GREEN** `validateFileInput.ts`: MIME type 검사 → 확장자 fallback → 파일 크기 → voiceId/language 검증

---

### Stage 2: 환경변수

**RED** `env.test.ts` 업데이트: `getGeminiApiKey()` 미설정 시 에러 throw, 설정 시 값 반환

**GREEN** `env.ts` 업데이트: `getGeminiApiKey()` 추가

---

### Stage 3: STT Route Handler

**RED** `stt.route.test.ts` 작성:

- `file` 필드 없음 → 400
- 유효한 파일 → 200 `{ text, languageCode, languageProbability }`
- STT 결과 `text` 빈 문자열 → 400 "음성을 감지하지 못했습니다"
- ElevenLabs 429 → 429 "크레딧이 부족합니다..."
- ElevenLabs 401 → 503 "서비스를 일시적으로 사용할 수 없습니다"
- API 키 미설정 → 500
- ElevenLabs 기타 오류 → 502 "음성 인식에 실패했습니다..."

**GREEN** `app/api/stt/route.ts`: `request.formData()` → ElevenLabs STT 전달 → 응답 파싱

---

### Stage 4: STT Entity API

**RED** `transcribeFile.test.ts` 작성:

- 성공 시 `{ text, languageCode, languageProbability }` 반환
- 에러 응답 시 throw

**GREEN** `entities/dubbing/api/transcribeFile.ts`: `ky.post('/api/stt', { body: formData })`

---

### Stage 5: 번역 Route Handler

**RED** `translate.route.test.ts` 작성:

- 필드 누락 → 400
- 동일 언어(`en→en`) → 200 `{ translatedText: 원문, wasSkipped: true }`
- 유효한 요청 → 200 `{ translatedText, wasSkipped: false }`
- API 키 미설정 → 500
- Gemini 오류 → 502

**GREEN** `app/api/translate/route.ts`: Gemini SDK 호출

---

### Stage 6: 번역 Entity API

**RED** `translateText.test.ts` 작성:

- 성공 시 `{ translatedText, wasSkipped }` 반환
- 에러 시 throw

**GREEN** `entities/dubbing/api/translateText.ts`: `ky.post('/api/translate', { json: request })`

---

### Stage 7: DTO 업데이트

> **실행 순서 주의**: 이 문서의 스테이지 번호는 TDD 내러티브(Red→Green 흐름)를 설명하기 위한 것으로, 실제 실행 순서와 다르다. **DTO 업데이트는 tasks.md Phase 2에서 가장 먼저 실행**해야 한다 (모든 타입 참조의 선행 조건).

신규 타입 `dubbing.dto.ts` 추가:

- `TranscriptionResult`, `TranslationResult`, `DubbingPipelineStatus`
- `FileValidationErrors`, `FileValidationResult`
- 상수: `SUPPORTED_EXTENSIONS`, `SUPPORTED_MIME_TYPES`, `MAX_FILE_SIZE_BYTES`
- `PIPELINE_STATUS_MESSAGES` 맵

---

### Stage 8: 파이프라인 훅 (전면 교체)

**RED** `useDubbingCreate.test.tsx` (전면 재작성):

- 초기 상태: `file: null, pipelineStatus: 'idle', audioUrl: null`
- 파일 미선택 제출 → `validationErrors.file` 설정, API 미호출
- voiceId 미선택 제출 → `validationErrors.voiceId` 설정, API 미호출
- 정상 제출 시 `pipelineStatus` 순서: `transcribing → translating → synthesizing → complete`
- STT 실패 → `pipelineStatus: 'error'`, `errorMessage` 설정
- 번역 실패 → `pipelineStatus: 'error'`, `errorMessage` 설정
- TTS 실패 → `pipelineStatus: 'error'`, `errorMessage` 설정
- 진행 중 중복 제출 방지
- `retry()` 호출 시 동일 입력으로 파이프라인 재시작

**GREEN** `useDubbingCreate.ts`: 파이프라인 상태 머신

```typescript
// 파이프라인 오케스트레이션 흐름 (의사코드)
async function runPipeline() {
  const validation = validateFileInput(file, voiceId, targetLanguage);
  if (!validation.isValid) { setValidationErrors(validation.errors); return; }

  setPipelineStatus('transcribing');
  const transcription = await transcribeFile(file);

  setPipelineStatus('translating');
  const translation = await translateText({
    text: transcription.text,
    sourceLanguage: transcription.languageCode,
    targetLanguage,
  });

  setPipelineStatus('synthesizing');
  const audioUrl = await createDubbing({
    text: translation.translatedText,
    voiceId,
    language: targetLanguage,
  });

  setPipelineStatus('complete');
  setAudioUrl(audioUrl);
}
```

훅 반환값:

```typescript
interface UseDubbingCreateReturn {
  file: File | null;
  setFile: (file: File | null) => void;
  targetLanguage: DubbingLanguage;
  setTargetLanguage: (lang: DubbingLanguage) => void;
  voiceId: string;
  setVoiceId: (id: string) => void;
  pipelineStatus: DubbingPipelineStatus;
  transcription: TranscriptionResult | null;
  translation: TranslationResult | null;
  audioUrl: string | null;
  errorMessage: string | null;
  validationErrors: FileValidationErrors;
  submit: () => Promise<void>;
  retry: () => Promise<void>;
  voices: Voice[];
  voicesError: string | null;
}
```

---

### Stage 9: UI 컴포넌트 업데이트

- **`DubbingForm.tsx`** 교체: textarea → `<input type="file">` + 선택된 파일명 표시
- **`PipelineProgress.tsx`** 신규: 4단계 진행 바 (STT / 번역 / TTS / 완료), 각 단계 상태 시각화
- **`DubbingDashboardPage.tsx`** 업데이트: DubbingForm + PipelineProgress + VoiceSelector + AudioPlayer 조립

---

### Stage 10: 의존성 설치 (먼저 실행)

```bash
npm install @google/generative-ai
```

---

## Complexity Tracking

_No FSD violations identified._
