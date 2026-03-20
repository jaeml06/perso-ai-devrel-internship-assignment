# Data Model: 듀얼 미디어 뷰

**Feature**: `feat/#17-dual-media-view`
**Date**: 2026-03-19 (Updated: 2026-03-20)

## Entities

### MediaType (신규 타입)

```typescript
// src/features/dubbing-create/lib/mediaType.ts

type MediaType = 'video' | 'audio';
```

**판별 규칙**: `File.type`이 `'video/'`로 시작하면 `'video'`, 그 외 `'audio'`.
MIME 타입이 비어있으면 파일 확장자로 폴백: `.mp4`, `.mov`, `.webm` → `'video'`.

### DubbingPipelineStatus 확장

```typescript
// 기존 상태에 'merging' 추가
type DubbingPipelineStatus = 'idle' | 'transcribing' | 'translating' | 'synthesizing' | 'merging' | 'complete' | 'error';
```

- `'merging'`: FFmpeg.wasm으로 영상 + 오디오 합성 중 (영상 입력일 때만 진행)

### useDubbingCreate 확장 상태

```typescript
// 기존 상태 (변경 없음)
file: File | null
targetLanguage: DubbingLanguage        // 'ko' | 'en'
voiceId: string
pipelineStatus: DubbingPipelineStatus  // 'idle' | ... | 'merging' | 'complete' | 'error'
audioUrl: string | null                // 더빙 결과 오디오 Blob URL (TTS 원본)
// ...기타 기존 상태

// 신규 상태
sourceUrl: string | null               // 원본 파일 Blob URL
mediaType: MediaType | null            // 'video' | 'audio'
dubbedVideoUrl: string | null          // 합성 영상 Blob URL (영상 입력 시에만)
```

### 상태 전이 (State Transitions)

```
[파일 없음] --setFile(file)--> [sourceUrl 생성, mediaType 설정]
[sourceUrl 있음] --setFile(newFile)--> [이전 sourceUrl 해제, 새 sourceUrl 생성]
[sourceUrl 있음] --setFile(null)--> [sourceUrl 해제, null로 리셋]
[sourceUrl 있음] --unmount--> [sourceUrl 해제]
[sourceUrl 있음] --submit--> [sourceUrl 유지 (파이프라인 진행)]

// 영상 입력 시 합성 흐름
[synthesizing 완료] --audioUrl 설정--> [mediaType === 'video' ? merging : complete]
[merging] --FFmpeg 합성--> [dubbedVideoUrl 생성, complete]
[merging] --FFmpeg 실패--> [dubbedVideoUrl = null, complete (audioUrl 폴백)]

// Blob URL 정리
[dubbedVideoUrl 있음] --새 파이프라인 시작--> [dubbedVideoUrl 해제]
[dubbedVideoUrl 있음] --unmount--> [dubbedVideoUrl 해제]
```

### Blob URL 생명주기

| 이벤트 | sourceUrl | audioUrl | dubbedVideoUrl |
|--------|-----------|----------|----------------|
| 파일 업로드 | `createObjectURL(file)` | (변화 없음) | (변화 없음) |
| 파일 변경 | 이전 revoke → 새로 create | (변화 없음) | (변화 없음) |
| 파이프라인 시작 | 유지 | 이전 revoke | 이전 revoke |
| TTS 완료 (synthesizing→) | 유지 | `createObjectURL(ttsBlob)` | (변화 없음) |
| 영상 합성 완료 (merging→complete) | 유지 | 유지 | `createObjectURL(mergedBlob)` |
| 영상 합성 실패 (merging→complete) | 유지 | 유지 (폴백) | null |
| 재제출 (retry) | 유지 | 이전 revoke → 새로 create | 이전 revoke → 새로 create |
| 새 파일로 재제출 | 이전 revoke → 새로 create | 이전 revoke | 이전 revoke |
| 컴포넌트 unmount | revoke | revoke | revoke |

## Component Props (Contracts)

### VideoPlayer

```typescript
interface VideoPlayerProps {
  videoUrl: string;
}
```

### MediaPlayer

```typescript
interface MediaPlayerProps {
  mediaUrl: string;
  mediaType: MediaType;  // 'video' → VideoPlayer, 'audio' → <audio controls>
}
```

### DualMediaView

```typescript
interface DualMediaViewProps {
  sourceUrl: string;
  sourceMediaType: MediaType;
  dubbedUrl: string;
  dubbedMediaType: MediaType;  // 영상 입력 시 'video' (합성 영상), 오디오 입력 시 'audio'
}
```

### AudioPlayer (기존 — 변경 없음)

```typescript
interface AudioPlayerProps {
  audioUrl: string;
}
```

## FFmpeg.wasm 합성 함수 Contract

```typescript
// src/features/dubbing-create/lib/mergeVideoAudio.ts

interface MergeVideoAudioParams {
  videoFile: File;         // 원본 영상 파일
  audioBlob: Blob;         // 더빙 오디오 Blob
}

interface MergeResult {
  url: string;             // 합성 영상 Blob URL
  blob: Blob;              // 합성 영상 Blob (다운로드용)
}

function mergeVideoAudio(params: MergeVideoAudioParams): Promise<MergeResult>;
```
