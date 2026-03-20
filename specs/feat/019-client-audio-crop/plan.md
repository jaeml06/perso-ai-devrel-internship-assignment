# Implementation Plan: 클라이언트 측 1분 미디어 크롭

**Branch**: `feat/#19-client-audio-crop` | **Date**: 2026-03-20 | **Spec**: `specs/feat/019-client-audio-crop/spec.md`
**Input**: Feature specification from `/specs/feat/019-client-audio-crop/spec.md`
**Approach**: TDD (Test-Driven Development) — 모든 구현은 테스트 작성 → 실패 확인 → 구현 → 통과 순서로 진행

## Summary

1분 초과 미디어 파일을 클라이언트(브라우저)에서 FFmpeg WASM으로 자동 크롭하여 더빙 파이프라인 부하를 줄인다.
기존 FFmpeg 인프라(`mergeVideoAudio.ts`)와 동일한 패턴으로 `cropMedia.ts` 유틸을 추가하고, `useDubbingCreate` 훅의 `runPipeline` 시작 부분에 크롭 단계를 삽입한다.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 (App Router), React 19, `@ffmpeg/ffmpeg@0.12.15`, `@ffmpeg/util@0.12.2`
**Storage**: N/A (클라이언트 Blob URL — 서버 저장 없음)
**Testing**: Vitest + @testing-library/react (jsdom)
**Target Platform**: 브라우저 (WASM 지원 환경)
**Project Type**: Single Next.js app with FSD architecture
**Performance Goals**: 크롭 처리 < 10초 (일반적 1-5분 미디어 기준)
**Constraints**: 기존 25MB 파일 크기 제한 유지, 원본 품질 보존 (재인코딩 시 동일 비트레이트)

## Constitution Check

_GATE: PASS_

| 원칙 | 준수 여부 | 비고 |
|------|-----------|------|
| FSD 레이어 | PASS | 크롭 유틸은 `features/dubbing-create/lib/`, 미디어 감지 로직도 동일 레이어 |
| 배럴 export 금지 | PASS | 모든 import는 개별 파일 직접 참조 |
| 단방향 의존성 | PASS | `lib → model → ui → app` 방향 유지 |
| function declaration | PASS | 모든 함수는 function declaration 사용 |
| 코드 스타일 | PASS | camelCase, PascalCase, UPPER_SNAKE_CASE 규칙 준수 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/019-client-audio-crop/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckits:tasks)
```

### Source Code (변경/추가 예정 파일)

```text
src/
├── features/dubbing-create/
│   ├── lib/
│   │   ├── cropMedia.ts           # [NEW] FFmpeg 기반 1분 크롭 유틸
│   │   ├── getMediaDuration.ts    # [NEW] 미디어 재생 시간 감지 유틸
│   │   └── pipelineStatus.ts      # [MODIFY] 'cropping' 상태 추가
│   ├── model/
│   │   └── useDubbingCreate.ts    # [MODIFY] runPipeline에 크롭 단계 삽입
│   └── ui/
│       └── DubbingForm.tsx        # [MODIFY] 크롭 안내 메시지 표시
│
├── entities/dubbing/dto/
│   └── dubbing.dto.ts             # [MODIFY] DubbingPipelineStatus에 'cropping' 추가
│
└── __tests__/features/dubbing-create/
    ├── lib/
    │   ├── cropMedia.test.ts          # [NEW] 크롭 유틸 단위 테스트
    │   └── getMediaDuration.test.ts   # [NEW] 재생 시간 감지 테스트
    └── model/
        └── useDubbingCreate.test.tsx  # [MODIFY] 크롭 단계 통합 테스트

**Structure Decision**: 기존 `dubbing-create` feature 내에 추가. 크롭은 독립 feature가 아니라 더빙 파이프라인의 전처리 단계이므로 동일 feature 내 `lib/`에 배치.
```

---

## Phase 0 — Research

### R-001: FFmpeg WASM 오디오/비디오 크롭 명령어

**Decision**: `-t 60` 옵션으로 처음 60초 크롭 (스트림 복사 모드)

**Rationale**: `-ss 0 -t 60 -c copy`는 재인코딩 없이 스트림을 그대로 복사하므로 품질 손실이 없고 처리 속도가 빠르다. 다만, 키프레임 경계가 아닌 위치에서 자를 경우 약간의 오차가 생길 수 있으나, 시작점이 0이므로 문제없다.

**FFmpeg 명령어 (오디오)**:
```
ffmpeg -i input.mp3 -t 60 -c copy output.mp3
```

**FFmpeg 명령어 (비디오)**:
```
ffmpeg -i input.mp4 -t 60 -c copy output.mp4
```

**Alternatives considered**:
- `-c:a aac` 재인코딩 방식: 품질은 보장되지만 처리 시간이 크게 증가. 기각.
- Web Audio API: 오디오만 지원, 비디오 불가. 이미 FFmpeg 사용 중이므로 기각.

### R-002: 클라이언트 측 미디어 재생 시간 감지

**Decision**: `HTMLMediaElement` (Audio/Video 객체)의 `duration` 프로퍼티 사용

**Rationale**: 브라우저 네이티브 API로 추가 의존성 없이 재생 시간을 감지할 수 있다. Blob URL을 생성하여 `loadedmetadata` 이벤트에서 `duration`을 읽는다.

```typescript
function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = file.type.startsWith('video/') ? document.createElement('video') : document.createElement('audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(el.duration); };
    el.onerror = () => { URL.revokeObjectURL(url); reject(new Error('미디어 메타데이터를 읽을 수 없습니다')); };
    el.src = url;
  });
}
```

**Alternatives considered**:
- FFmpeg `ffprobe` 에뮬레이션: FFmpeg WASM에서 probe가 제한적이고 로딩 오버헤드 큼. 기각.
- 파일 헤더 파싱 라이브러리 (`music-metadata-browser`): 추가 의존성. 기각.

### R-003: 크롭 기준 시간 상수

**Decision**: `MAX_MEDIA_DURATION_SECONDS = 60` 상수를 `dubbing.dto.ts`에 정의

**Rationale**: 기존 `MAX_FILE_SIZE_BYTES`와 동일한 위치에 배치하여 검증 관련 상수의 일관성 유지.

---

## Phase 1 — Design & Contracts

### 1.1 Data Model

신규 엔티티 없음. 기존 DTO에 상수 및 타입 추가만 필요.

#### `dubbing.dto.ts` 변경

```typescript
// 추가 상수
export const MAX_MEDIA_DURATION_SECONDS = 60;

// DubbingPipelineStatus에 'cropping' 추가
export type DubbingPipelineStatus =
  | 'idle'
  | 'cropping'       // [NEW]
  | 'transcribing'
  | 'translating'
  | 'synthesizing'
  | 'merging'
  | 'complete'
  | 'error';

// PIPELINE_STATUS_MESSAGES에 추가
export const PIPELINE_STATUS_MESSAGES: Record<DubbingPipelineStatus, string> = {
  idle: '',
  cropping: '미디어를 1분으로 자르는 중...',   // [NEW]
  transcribing: '음성을 텍스트로 변환 중...',
  translating: '텍스트를 번역 중...',
  synthesizing: '음성을 합성 중...',
  merging: '영상 합성 중...',
  complete: '더빙 완료',
  error: '오류가 발생했습니다',
};
```

### 1.2 신규 유틸 함수 설계

#### `getMediaDuration.ts` — 미디어 재생 시간 감지

```typescript
// Input: File
// Output: Promise<number> (초 단위)
// 실패 시: Error('미디어 메타데이터를 읽을 수 없습니다')
export function getMediaDuration(file: File): Promise<number>;
```

#### `cropMedia.ts` — FFmpeg 기반 1분 크롭

```typescript
export interface CropMediaParams {
  file: File;
  maxDurationSeconds: number;
}

export interface CropResult {
  file: File;           // 크롭된 파일 (또는 원본 그대로)
  wasCropped: boolean;  // 크롭 수행 여부
  originalDuration: number;  // 원본 재생 시간
}

// 흐름:
// 1. getMediaDuration으로 재생 시간 확인
// 2. maxDurationSeconds 이하이면 원본 반환 (wasCropped: false)
// 3. 초과이면 FFmpeg로 크롭 후 새 File 반환 (wasCropped: true)
export async function cropMedia(params: CropMediaParams): Promise<CropResult>;
```

### 1.3 파이프라인 흐름 변경

**기존**: `idle → transcribing → translating → synthesizing → [merging] → complete`

**변경**: `idle → cropping → transcribing → translating → synthesizing → [merging] → complete`

`useDubbingCreate.ts`의 `runPipeline` 함수에서:
1. validation 통과 후 `setPipelineStatus('cropping')`
2. `cropMedia({ file, maxDurationSeconds: MAX_MEDIA_DURATION_SECONDS })` 호출
3. `wasCropped`이면 크롭된 파일로 교체하여 이후 파이프라인에 전달
4. 1분 이하이면 원본 그대로 진행 (cropping 상태는 건너뜀 또는 빠르게 통과)

### 1.4 UI 변경

#### `DubbingForm.tsx` — 크롭 안내 메시지 (P3)

파일 선택 후 재생 시간이 1분 초과이면 안내 메시지 표시:
```
"원본 길이: {분}분 {초}초 → 처음 1분만 처리됩니다"
```

이를 위해 파일 선택 시 `getMediaDuration`을 호출하고, `useDubbingCreate` 훅에서 `fileDuration` 상태를 관리한다.

---

## TDD 전략

### 테스트 작성 순서 (Red → Green → Refactor)

각 단계에서 **테스트를 먼저 작성**하고, 실패를 확인한 뒤, 최소한의 구현으로 통과시킨다.

#### TDD Cycle 1: `getMediaDuration` 유틸

**테스트 파일**: `src/__tests__/features/dubbing-create/lib/getMediaDuration.test.ts`

| # | 테스트 케이스 | 기대 결과 |
|---|--------------|-----------|
| 1 | 유효한 오디오 파일의 duration 반환 | `number` (초) 반환 |
| 2 | 유효한 비디오 파일의 duration 반환 | `number` (초) 반환 |
| 3 | 손상된 파일 → 에러 | `'미디어 메타데이터를 읽을 수 없습니다'` throw |
| 4 | Blob URL 정리 확인 | `URL.revokeObjectURL` 호출 |

**구현 파일**: `src/features/dubbing-create/lib/getMediaDuration.ts`

#### TDD Cycle 2: `cropMedia` 유틸

**테스트 파일**: `src/__tests__/features/dubbing-create/lib/cropMedia.test.ts`

| # | 테스트 케이스 | 기대 결과 |
|---|--------------|-----------|
| 1 | 45초 파일 → 크롭 없이 원본 반환 | `{ wasCropped: false, file: originalFile }` |
| 2 | 60초 정확히 → 크롭 없이 원본 반환 | `{ wasCropped: false }` |
| 3 | 120초 파일 → 크롭 수행 | `{ wasCropped: true }`, FFmpeg `-t 60` 호출 확인 |
| 4 | 오디오 파일 → 오디오 포맷 유지 | 출력 MIME type이 `audio/*` |
| 5 | 비디오 파일 → 비디오 포맷 유지 | 출력 MIME type이 `video/*` |
| 6 | FFmpeg 로딩 실패 → 에러 | `'미디어 크롭에 실패했습니다'` throw |
| 7 | FFmpeg exec 실패 → 에러 | `'미디어 크롭에 실패했습니다'` throw |
| 8 | `originalDuration` 반환 확인 | 원본 재생 시간 값 반환 |

**구현 파일**: `src/features/dubbing-create/lib/cropMedia.ts`
**모킹 패턴**: 기존 `mergeVideoAudio.test.ts`와 동일 (FFmpeg 클래스 mock)

#### TDD Cycle 3: `pipelineStatus` 업데이트

**테스트 파일**: 기존 테스트에 추가

| # | 테스트 케이스 | 기대 결과 |
|---|--------------|-----------|
| 1 | `isProcessingPipelineStatus('cropping')` | `true` |

#### TDD Cycle 4: `useDubbingCreate` 훅 — 크롭 통합

**테스트 파일**: `src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx` (기존 파일 수정)

| # | 테스트 케이스 | 기대 결과 |
|---|--------------|-----------|
| 1 | 1분 초과 파일 → 'cropping' 상태 거침 | `pipelineStatus`가 `'cropping'` → `'transcribing'` 순서 |
| 2 | 1분 이하 파일 → 크롭 건너뜀 | 원본 파일 그대로 STT 전달 |
| 3 | 크롭 실패 → 에러 상태 | `pipelineStatus: 'error'`, `errorMessage` 설정 |
| 4 | 크롭 후 STT에 크롭된 파일 전달 | `transcribeFile`에 크롭된 파일 전달 확인 |
| 5 | `fileDuration` 상태 관리 | 파일 선택 시 duration 업데이트 |

#### TDD Cycle 5: `DubbingForm` UI — 크롭 안내 (P3)

**테스트 파일**: `src/__tests__/features/dubbing-create/ui/DubbingForm.test.tsx` (기존 파일 수정)

| # | 테스트 케이스 | 기대 결과 |
|---|--------------|-----------|
| 1 | 1분 초과 파일 선택 시 안내 메시지 표시 | 텍스트에 "처음 1분만 처리됩니다" 포함 |
| 2 | 1분 이하 파일 선택 시 안내 메시지 미표시 | 안내 메시지 없음 |
| 3 | 파일 미선택 시 안내 메시지 미표시 | 안내 메시지 없음 |

---

## Architecture Decision Table

| Decision | Options Considered | Chosen | Rationale | FSD Impact |
|----------|-------------------|--------|-----------|------------|
| 크롭 유틸 위치 | (A) `features/dubbing-create/lib/` (B) `shared/lib/` (C) 새 feature `media-crop/` | (A) | 더빙 파이프라인 전용 전처리이므로 동일 feature 내 배치. 재사용 가능성 없음 | `lib/` 레이어에 추가. 의존 방향 변경 없음 |
| Duration 감지 방식 | (A) HTMLMediaElement API (B) FFmpeg probe (C) `music-metadata-browser` | (A) | 브라우저 네이티브, 추가 의존성 없음, 빠름 | 없음 |
| 크롭 실행 방식 | (A) `-c copy` 스트림 복사 (B) 재인코딩 | (A) | 품질 보존 + 빠른 처리. 시작점이 0이므로 키프레임 문제 없음 | 없음 |
| `cropping` 상태 | (A) 별도 파이프라인 상태 추가 (B) `transcribing`에 포함 | (A) | 사용자에게 진행 상태를 명확히 전달 (FR-006). 기존 상태 메시지 체계와 일관 | `dubbing.dto.ts` 타입 확장 |
| 크롭 안내 시점 | (A) 파일 선택 직후 (B) submit 시 | (A) | 사용자가 파일 선택 즉시 인지 가능 (P3 요구사항) | `useDubbingCreate`에 `fileDuration` 상태 추가 |
| 1분 기준 판정 | (A) > 60초이면 크롭 (B) >= 60초이면 크롭 | (A) | 스펙: "정확히 60초인 경우 크롭 없이 원본 처리" | 없음 |

---

## Complexity Tracking

위반 사항 없음. 모든 변경은 기존 FSD 구조 내에서 이루어짐.
