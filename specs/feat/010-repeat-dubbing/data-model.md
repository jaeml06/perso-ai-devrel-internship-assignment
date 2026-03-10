# Data Model: 연속 더빙 생성 복구

**Phase**: 1 — Design  
**Date**: 2026-03-10

## Scope

이번 기능은 새로운 백엔드 저장 모델을 추가하지 않는다. 데이터 모델 변경의 핵심은 `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/features/dubbing-create/model/useDubbingCreate.ts` 안에서 "입력 상태"와 "실행 세션 상태"를 명확히 분리하는 것이다.

## Entities

### 1. PersistentInputs

**Purpose**: 완료/실패 후에도 유지되는 사용자 선택값  
**Location**: feature state in `/src/features/dubbing-create/model/useDubbingCreate.ts`

```ts
interface PersistentInputs {
  file: File | null;
  targetLanguage: DubbingLanguage;
  voiceId: string;
}
```

**Rules**:
- 새 submit/retry가 시작되어도 유지된다.
- 유효성 검증 실패 시 그대로 유지된다.
- 사용자가 직접 변경할 때만 값이 바뀐다.

### 2. GenerationAttempt

**Purpose**: 각 더빙 요청을 독립적인 실행 단위로 표현  
**Location**: feature-internal state or ref in `/src/features/dubbing-create/model/useDubbingCreate.ts`

```ts
interface GenerationAttempt {
  attemptId: number;
  trigger: 'submit' | 'retry';
  requestedAt: number;
  inputsSnapshot: {
    fileName: string | null;
    targetLanguage: DubbingLanguage;
    voiceId: string;
  };
}
```

**Rules**:
- submit 또는 retry가 수락될 때마다 `attemptId`가 증가한다.
- 동일 입력 조합이어도 새로운 attempt로 간주한다.
- 현재 UI는 가장 최근 accepted attempt만 표시 대상으로 삼는다.

### 3. GenerationSessionState

**Purpose**: 현재 화면에서 보이는 파이프라인 상태를 현재 attempt 기준으로 관리  
**Location**: feature state in `/src/features/dubbing-create/model/useDubbingCreate.ts`

```ts
interface GenerationSessionState {
  pipelineStatus: DubbingPipelineStatus;
  transcription: TranscriptionResult | null;
  translation: TranslationResult | null;
  audioUrl: string | null;
  errorMessage: string | null;
  activeAttemptId: number | null;
}
```

**Rules**:
- 새 attempt가 시작되면 `transcription`, `translation`, `audioUrl`, `errorMessage`를 즉시 초기화한다.
- `pipelineStatus`는 `transcribing | translating | synthesizing | complete | error` 중 하나로 이동한다.
- 화면에 보이는 진행 상태와 오류는 항상 `activeAttemptId` 기준 하나만 존재한다.

### 4. VisibleResult

**Purpose**: 성공한 결과가 화면에 노출 가능한지 정의  
**Location**: derived UI state from `GenerationSessionState`

```ts
interface VisibleResult {
  attemptId: number;
  audioUrl: string;
  isVisible: boolean;
}
```

**Rules**:
- `pipelineStatus === 'complete'` 이고 `audioUrl`이 있을 때만 visible 하다.
- 새 attempt가 accepted 되는 순간 기존 `VisibleResult.isVisible`은 `false`가 된다.
- 이전 결과 재생 중이어도 새 attempt 시작은 허용된다.

### 5. RetryCapability

**Purpose**: 실패 후 즉시 재시도 가능 조건을 명시  
**Location**: derived behavior in feature model

```ts
interface RetryCapability {
  canRetry: boolean;
  retryUsesCurrentInputs: boolean;
}
```

**Rules**:
- `pipelineStatus === 'error'`일 때 `canRetry`는 `true`다.
- retry는 항상 현재 유지 중인 `PersistentInputs`를 사용한다.
- retry도 새로운 `GenerationAttempt`를 만든다.

## Existing DTOs Reused Without API Schema Change

### DubbingRequest

```ts
interface DubbingRequest {
  text: string;
  voiceId: string;
  language: DubbingLanguage;
}
```

- `/src/entities/dubbing/api/createDubbing.ts`에서 계속 사용한다.
- 반복 생성 지원 때문에 request schema를 바꿀 필요는 없다.

### TranscriptionResult

```ts
interface TranscriptionResult {
  text: string;
  languageCode: string;
  languageProbability: number;
}
```

- 새 attempt가 시작되면 이전 값은 즉시 폐기된다.

### TranslationResult

```ts
interface TranslationResult {
  translatedText: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: DubbingLanguage;
  wasSkipped: boolean;
}
```

- 현재 attempt의 번역 결과만 유지한다.

### DubbingPipelineStatus

```ts
type DubbingPipelineStatus =
  | 'idle'
  | 'transcribing'
  | 'translating'
  | 'synthesizing'
  | 'complete'
  | 'error';
```

- `complete`와 `error`는 잠금 상태가 아니라 재진입 가능한 상태로 해석한다.
- 중복 차단은 `transcribing | translating | synthesizing`에서만 적용한다.

## State Transition Model

```text
idle
  └─ submit accepted → transcribing
transcribing
  ├─ success → translating
  └─ failure → error
translating
  ├─ success → synthesizing
  └─ failure → error
synthesizing
  ├─ success → complete
  └─ failure → error
complete
  └─ submit accepted → transcribing   # same or changed inputs both allowed
error
  ├─ retry accepted → transcribing
  └─ submit accepted → transcribing
```

## Blob URL Lifecycle

```ts
interface AudioUrlLifecycle {
  previousUrl: string | null;
  currentUrl: string | null;
  shouldRevokePrevious: boolean;
}
```

**Rules**:
- 새 attempt 시작 전 `previousUrl`이 있으면 revoke 대상이 된다.
- 새 오디오 생성 성공 시 `currentUrl`로 교체한다.
- 훅 unmount 시 `currentUrl`이 남아 있으면 revoke 한다.

## Dependency Mapping

```text
/src/app/dashboard/page.tsx
    -> /src/features/dubbing-create/ui/DubbingDashboardPage.tsx
        -> /src/features/dubbing-create/model/useDubbingCreate.ts
            -> /src/features/dubbing-create/lib/validateFileInput.ts
            -> /src/entities/dubbing/api/transcribeFile.ts
            -> /src/entities/dubbing/api/translateText.ts
            -> /src/entities/dubbing/api/createDubbing.ts
            -> /src/entities/voice/api/getVoices.ts
```

이 구조는 `app -> features -> entities` 단방향 의존을 그대로 유지한다.
