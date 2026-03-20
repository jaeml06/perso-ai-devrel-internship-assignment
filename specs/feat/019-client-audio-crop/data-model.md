# Data Model: 클라이언트 측 1분 미디어 크롭

**Feature**: `019-client-audio-crop` | **Date**: 2026-03-20

---

## 신규 엔티티

없음. 이 기능은 클라이언트 측 전처리로, 서버 데이터 모델 변경이 필요 없다.

---

## DTO 변경 사항

### `dubbing.dto.ts`

#### 추가 상수

```typescript
/** 클라이언트 크롭 기준 시간 (초) */
export const MAX_MEDIA_DURATION_SECONDS = 60;
```

#### 타입 변경

```typescript
// Before
export type DubbingPipelineStatus =
  | 'idle'
  | 'transcribing'
  | 'translating'
  | 'synthesizing'
  | 'merging'
  | 'complete'
  | 'error';

// After
export type DubbingPipelineStatus =
  | 'idle'
  | 'cropping'        // [NEW] 클라이언트 미디어 크롭 단계
  | 'transcribing'
  | 'translating'
  | 'synthesizing'
  | 'merging'
  | 'complete'
  | 'error';
```

#### 메시지 추가

```typescript
export const PIPELINE_STATUS_MESSAGES: Record<DubbingPipelineStatus, string> = {
  idle: '',
  cropping: '미디어를 1분으로 자르는 중...',  // [NEW]
  transcribing: '음성을 텍스트로 변환 중...',
  // ... 나머지 동일
};
```

---

## 신규 인터페이스

### `CropMediaParams`

```typescript
export interface CropMediaParams {
  file: File;
  maxDurationSeconds: number;
}
```

### `CropResult`

```typescript
export interface CropResult {
  file: File;              // 크롭된 파일 또는 원본
  wasCropped: boolean;     // 크롭 수행 여부
  originalDuration: number; // 원본 재생 시간 (초)
}
```

---

## 상태 변경 (useDubbingCreate)

### 추가 상태

| State | Type | Default | 설명 |
|-------|------|---------|------|
| `fileDuration` | `number \| null` | `null` | 선택된 파일의 재생 시간 (초). 크롭 안내 메시지 표시에 사용 |

### 파이프라인 흐름

```
idle
  ↓ (submit)
cropping          ← [NEW] duration > 60초일 때만 실제 FFmpeg 처리
  ↓
transcribing      ← 크롭된 파일 또는 원본 파일로 STT
  ↓
translating
  ↓
synthesizing
  ↓
merging           ← 비디오인 경우에만
  ↓
complete
```
