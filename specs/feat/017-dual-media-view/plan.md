# Implementation Plan: 듀얼 미디어 뷰 (원본 + 더빙 비교 재생)

**Branch**: `feat/#17-dual-media-view` | **Date**: 2026-03-19 | **Spec**: `specs/feat/017-dual-media-view/spec.md`
**Input**: Feature specification from `/specs/feat/017-dual-media-view/spec.md`
**Approach**: TDD (Red-Green-Refactor) — 모든 변경은 실패 테스트 작성 → 구현 → 리팩터 순서

## Summary

영상 파일 업로드 시 오디오 플레이어로만 표시되는 버그를 수정하고, 더빙 완료 후 원본 미디어와 더빙 오디오를 나란히 비교할 수 있는 듀얼 미디어 뷰를 구현한다. 파일 업로드 직후 원본 미리보기도 제공한다. MIME 타입 기반으로 video/audio를 구분하여 적절한 플레이어를 렌더링하며, 원본 파일의 Blob URL 생명주기를 관리한다.

## Technical Context

**Language/Version**: TypeScript 5
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS 4, clsx, tailwind-merge, @ffmpeg/ffmpeg, @ffmpeg/util
**Storage**: N/A (클라이언트 Blob URL — 서버 저장 없음)
**Testing**: Vitest + @testing-library/react (jsdom)
**Target Platform**: Web (데스크톱 + 모바일 반응형)
**Project Type**: single (Next.js App Router)
**Performance Goals**: 파일 업로드 후 1초 이내 미리보기 표시
**Constraints**: Blob URL 메모리 누수 방지, 브라우저 기본 미디어 컨트롤 활용
**Scale/Scope**: 기존 dubbing-create feature 확장 (신규 feature 불필요)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| FSD 레이어 준수 | PASS | 기존 `features/dubbing-create/` 내 확장. 신규 레이어 불필요 |
| 배럴 export 금지 | PASS | 모든 import는 개별 파일 직접 참조 |
| 단방향 의존성 | PASS | `lib → model → ui → app` 방향 유지 |
| function declaration | PASS | 모든 컴포넌트 function declaration 사용 |
| 디자인 토큰 우선 | PASS | Tailwind CSS 변수/토큰 사용 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/017-dual-media-view/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckits:tasks)
```

### Source Code (변경 대상)

```text
src/
├── features/dubbing-create/
│   ├── lib/
│   │   ├── validateFileInput.ts       # (기존) 변경 없음
│   │   ├── pipelineStatus.ts          # (기존) 변경 없음
│   │   └── mediaType.ts              # (신규) MIME 타입 → 미디어 종류 판별
│   ├── model/
│   │   └── useDubbingCreate.ts        # (수정) 원본 Blob URL 관리, mediaType 상태 추가
│   └── ui/
│       ├── DubbingDashboardPage.tsx   # (수정) 듀얼 미디어 뷰 레이아웃 조립
│       ├── DubbingForm.tsx            # (수정) 업로드 직후 원본 미리보기 표시
│       ├── AudioPlayer.tsx            # (기존) 더빙 결과 오디오 재생 (변경 최소화)
│       ├── VideoPlayer.tsx            # (신규) 원본 비디오 재생
│       ├── MediaPlayer.tsx            # (신규) mediaType에 따라 Video/Audio 분기 렌더링
│       ├── DualMediaView.tsx          # (신규) 원본 + 더빙 나란히 비교 레이아웃
│       ├── VoiceSelector.tsx          # (기존) 변경 없음
│       └── PipelineProgress.tsx       # (기존) 변경 없음
│
└── __tests__/features/dubbing-create/
    ├── lib/
    │   ├── validateFileInput.test.ts  # (기존) 변경 없음
    │   └── mediaType.test.ts          # (신규) MIME 판별 로직 테스트
    ├── model/
    │   └── useDubbingCreate.test.tsx   # (수정) 원본 Blob URL 관리 테스트 추가
    └── ui/
        ├── DubbingDashboardPage.test.tsx # (수정) 듀얼 뷰 렌더링 테스트
        ├── DubbingForm.test.tsx        # (수정) 미리보기 표시 테스트
        ├── AudioPlayer.test.tsx        # (기존) 변경 없음
        ├── VideoPlayer.test.tsx        # (신규) 비디오 플레이어 테스트
        ├── MediaPlayer.test.tsx        # (신규) 미디어 타입 분기 테스트
        └── DualMediaView.test.tsx      # (신규) 듀얼 레이아웃 + 레이블 테스트
```

**Structure Decision**: 기존 `features/dubbing-create/` feature를 확장한다. 별도 feature를 만들지 않는 이유는 듀얼 미디어 뷰가 dubbing-create의 결과 표시에 해당하며, 상태(파일, pipelineStatus, URL)를 공유하기 때문이다.

---

## TDD Strategy

### Red-Green-Refactor 원칙

모든 변경은 아래 순서를 따른다:

1. **RED**: 원하는 동작을 검증하는 실패 테스트를 먼저 작성
2. **GREEN**: 테스트를 통과하는 최소한의 코드 구현
3. **REFACTOR**: 중복 제거, 네이밍 개선 (테스트는 계속 통과해야 함)

### 테스트 피라미드

```
       ╱╲
      ╱  ╲        Integration (3): DubbingDashboardPage 조립 테스트
     ╱────╲       - 영상 파일 → 비디오 플레이어 렌더링
    ╱      ╲      - 더빙 완료 → 듀얼 미디어 뷰 표시
   ╱────────╲     - 파일 업로드 → 미리보기 표시
  ╱          ╲
 ╱   Unit (15+) ╲  순수 함수 + 컴포넌트 단위 테스트
╱────────────────╲  mediaType.ts, VideoPlayer, MediaPlayer, DualMediaView, useDubbingCreate
```

---

## Phase 0 — Research

### 미지 사항 없음

기존 프로젝트의 패턴(Blob URL, HTML5 미디어 요소, Vitest + RTL)을 그대로 활용하므로 별도 연구가 불필요하다.

| 항목 | 결정 | 근거 |
|------|------|------|
| 비디오 플레이어 | HTML5 `<video>` + 브라우저 기본 컨트롤 | 스펙 가정사항. 커스텀 UI 불필요 |
| 미디어 타입 판별 | `file.type.startsWith('video/')` | MIME 타입이 가장 신뢰할 수 있는 소스 |
| 원본 파일 저장 | Blob URL (`URL.createObjectURL`) | 기존 더빙 결과와 동일 패턴 |
| 듀얼 레이아웃 | CSS Grid/Flex + Tailwind 반응형 | 데스크톱 좌우, 모바일 상하 |

---

## Phase 1 — Design & Contracts

### 1.1 Data Model

#### MediaType (신규)

```typescript
// features/dubbing-create/lib/mediaType.ts
type MediaType = 'video' | 'audio';

function getMediaType(file: File): MediaType;
```

#### DubbingPipelineStatus 확장

```typescript
// 'merging' 단계 추가 — 영상 입력 시 FFmpeg.wasm 합성
type DubbingPipelineStatus = 'idle' | 'transcribing' | 'translating' | 'synthesizing' | 'merging' | 'complete' | 'error';
```

#### useDubbingCreate 상태 확장

```typescript
// 기존 상태에 추가
sourceUrl: string | null;         // 원본 파일 Blob URL
mediaType: MediaType | null;      // 'video' | 'audio'
dubbedVideoUrl: string | null;    // 합성 영상 Blob URL (영상 입력 시)
```

### 1.2 컴포넌트 Contracts

#### `mediaType.ts` — 순수 함수

```typescript
// Input: File 객체
// Output: 'video' | 'audio'
// Rule: file.type이 'video/'로 시작하면 'video', 나머지 'audio'
function getMediaType(file: File): MediaType
```

#### `VideoPlayer` — UI 컴포넌트

```typescript
// Props
interface VideoPlayerProps {
  videoUrl: string;   // Blob URL
}
// Renders: <video> with controls, preload="metadata"
```

#### `MediaPlayer` — 분기 컴포넌트

```typescript
// Props
interface MediaPlayerProps {
  mediaUrl: string;
  mediaType: MediaType;
}
// Renders: mediaType === 'video' → VideoPlayer, 'audio' → AudioPlayer (controls only)
```

#### `DualMediaView` — 레이아웃 컴포넌트

```typescript
// Props
interface DualMediaViewProps {
  sourceUrl: string;
  sourceMediaType: MediaType;
  dubbedUrl: string;
  dubbedMediaType: MediaType;  // 영상 입력 시 'video' (합성 영상), 오디오 입력 시 'audio'
}
// Renders: 좌우(데스크톱)/상하(모바일) 레이아웃
//   - 왼쪽: "원본" 레이블 + MediaPlayer(sourceUrl, sourceMediaType)
//   - 오른쪽: "더빙" 레이블 + MediaPlayer(dubbedUrl, dubbedMediaType) + 다운로드
```

#### `mergeVideoAudio` — FFmpeg.wasm 합성 함수

```typescript
// features/dubbing-create/lib/mergeVideoAudio.ts
interface MergeVideoAudioParams {
  videoFile: File;
  audioBlob: Blob;
}
interface MergeResult {
  url: string;
  blob: Blob;
}
function mergeVideoAudio(params: MergeVideoAudioParams): Promise<MergeResult>;
```

### 1.3 useDubbingCreate 변경 Contract

```typescript
// 신규 동작:
// 1. setFile 호출 시 → sourceUrl = URL.createObjectURL(file), mediaType = getMediaType(file)
// 2. 이전 sourceUrl이 있으면 → URL.revokeObjectURL(이전 URL)
// 3. 파일 변경 시 → 이전 sourceUrl 해제, 새 sourceUrl 생성
// 4. unmount 시 → sourceUrl 해제
// 5. submit 시 → sourceUrl 유지 (새 파일이 아니므로)
```

### 1.4 DubbingDashboardPage 변경 Contract

```typescript
// 현재: 파이프라인 완료 → AudioPlayer(audioUrl)
// 변경: 파이프라인 완료 → DualMediaView(sourceUrl, mediaType, audioUrl)
// 추가: 파일 업로드 후 → 원본 미리보기 (MediaPlayer in DubbingForm 영역)
```

---

## Architecture Decision Table

| Decision | Options | Chosen | Rationale | FSD Impact |
|----------|---------|--------|-----------|------------|
| 미디어 타입 판별 위치 | (A) lib/mediaType.ts (B) model/useDubbingCreate 내부 | A: lib | 순수 함수로 분리하면 단위 테스트 용이, FSD `lib → model` 방향 준수 | `lib/mediaType.ts` 신규 |
| VideoPlayer vs 기존 AudioPlayer 확장 | (A) 별도 VideoPlayer (B) AudioPlayer에 video 모드 추가 | A: 별도 | 관심사 분리. audio/video는 HTML 요소 자체가 다름 | `ui/VideoPlayer.tsx` 신규 |
| 듀얼 뷰 컴포넌트 분리 | (A) DualMediaView 독립 (B) DubbingDashboardPage에 인라인 | A: 독립 | 테스트 격리, 재사용성, 레이아웃 로직 캡슐화 | `ui/DualMediaView.tsx` 신규 |
| 원본 Blob URL 관리 주체 | (A) useDubbingCreate (B) 별도 useSourceMedia 훅 | A: 기존 훅 확장 | 파일 상태와 라이프사이클이 밀접. 훅 분리는 과도한 추상화 | `model/useDubbingCreate.ts` 수정 |
| 원본 미리보기 위치 | (A) DubbingForm 내부 (B) DubbingDashboardPage에서 별도 렌더 | B: DashboardPage | Form은 입력 담당, 미리보기는 결과 표시. 관심사 분리 | `ui/DubbingDashboardPage.tsx` 수정 |
| 더빙 결과 AudioPlayer 재사용 | (A) 기존 AudioPlayer 그대로 (B) DualMediaView 전용으로 래핑 | A: 그대로 | 다운로드 기능 포함된 기존 AudioPlayer를 더빙 쪽에 유지 | 변경 없음 |

---

## TDD Implementation Phases (Red-Green-Refactor)

### Phase A: 미디어 타입 판별 (lib 레이어)

**RED**: `mediaType.test.ts` 작성
- `video/mp4` → `'video'`
- `video/quicktime` → `'video'`
- `video/webm` → `'video'`
- `audio/mpeg` → `'audio'`
- `audio/wav` → `'audio'`
- 빈 MIME → 확장자 기반 폴백 (`.mp4` → `'video'`)

**GREEN**: `mediaType.ts` 최소 구현
**REFACTOR**: 필요 시 상수 추출

### Phase B: VideoPlayer 컴포넌트 (ui 레이어)

**RED**: `VideoPlayer.test.tsx` 작성
- `<video>` 요소 렌더링 확인
- `src` 속성에 전달된 URL 바인딩
- `controls` 속성 존재
- `preload="metadata"` 속성

**GREEN**: `VideoPlayer.tsx` 최소 구현
**REFACTOR**: 스타일 정리

### Phase C: MediaPlayer 분기 컴포넌트 (ui 레이어)

**RED**: `MediaPlayer.test.tsx` 작성
- `mediaType='video'` → VideoPlayer 렌더링
- `mediaType='audio'` → `<audio>` 요소 렌더링

**GREEN**: `MediaPlayer.tsx` 최소 구현
**REFACTOR**: 불필요한 래퍼 제거 검토

### Phase D: DualMediaView 레이아웃 (ui 레이어)

**RED**: `DualMediaView.test.tsx` 작성
- "원본" 레이블 표시
- "더빙" 레이블 표시
- 원본 MediaPlayer 렌더링
- 더빙 AudioPlayer 렌더링
- 반응형 클래스 존재 확인 (`flex-col md:flex-row` 또는 동등)

**GREEN**: `DualMediaView.tsx` 최소 구현
**REFACTOR**: 레이아웃 클래스 정리

### Phase E: useDubbingCreate 원본 URL 관리 (model 레이어)

**RED**: `useDubbingCreate.test.tsx` 테스트 추가
- 파일 설정 시 `sourceUrl`이 Blob URL로 설정됨
- 파일 설정 시 `mediaType`이 올바르게 설정됨
- 파일 변경 시 이전 `sourceUrl`이 해제됨 (`URL.revokeObjectURL` 호출)
- 파일을 null로 설정 시 `sourceUrl`이 해제되고 null로 설정됨
- unmount 시 `sourceUrl`이 해제됨
- submit 후에도 `sourceUrl`이 유지됨

**GREEN**: `useDubbingCreate.ts` 수정
**REFACTOR**: URL 관리 로직 정리

### Phase F: DubbingDashboardPage 통합 (ui 레이어)

**RED**: `DubbingDashboardPage.test.tsx` 테스트 수정/추가
- 파일 업로드 후 원본 미리보기 표시
- 영상 파일 → 비디오 플레이어 미리보기
- 오디오 파일 → 오디오 플레이어 미리보기
- 더빙 완료 → DualMediaView 렌더링 (기존 단독 AudioPlayer 대신)
- 더빙 완료 전에는 DualMediaView 미표시

**GREEN**: `DubbingDashboardPage.tsx` 수정
**REFACTOR**: 조건부 렌더링 로직 정리

### Phase G: FFmpeg.wasm 영상 합성 (lib 레이어)

**RED**: `mergeVideoAudio.test.ts` 작성
- FFmpeg 로딩 및 합성 호출 검증 (FFmpeg mock)
- 합성 결과 Blob URL 반환
- FFmpeg 로딩 실패 시 에러 throw
- 합성 실패 시 에러 throw

**GREEN**: `mergeVideoAudio.ts` 최소 구현
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` 사용
- `-c:v copy -map 0:v -map 1:a -shortest` 명령어
- 합성 결과를 Blob으로 반환

**REFACTOR**: 에러 메시지 정리

### Phase H: 파이프라인에 merging 단계 통합 (model 레이어)

**RED**: `useDubbingCreate.test.tsx` 테스트 추가
- 영상 파일 + TTS 완료 시 → pipelineStatus가 `'merging'`으로 전환
- merging 완료 시 → `dubbedVideoUrl` 설정 + `'complete'`
- merging 실패 시 → `dubbedVideoUrl = null` + `'complete'` (audioUrl 폴백)
- 오디오 파일 입력 시 → merging 단계 건너뜀

**GREEN**: `useDubbingCreate.ts` 수정
- synthesizing 완료 후 `mediaType === 'video'`이면 `mergeVideoAudio` 호출
- `dubbedVideoUrl` 상태 추가 및 Blob URL 생명주기 관리

**REFACTOR**: 파이프라인 흐름 정리

### Phase I: DualMediaView 영상 결과 표시 (ui 레이어)

**RED**: `DualMediaView.test.tsx` 테스트 추가
- `dubbedMediaType='video'` → 더빙 쪽에 VideoPlayer 렌더링
- `dubbedMediaType='audio'` → 더빙 쪽에 AudioPlayer 렌더링 (기존)

**GREEN**: `DualMediaView.tsx` 수정
- `dubbedMediaType` prop 추가
- 더빙 쪽 렌더링을 `MediaPlayer(dubbedUrl, dubbedMediaType)` + 다운로드 버튼으로 변경

**REFACTOR**: 다운로드 버튼 로직 정리

### Phase J: DubbingDashboardPage 통합 (ui 레이어)

**RED**: `DubbingDashboardPage.test.tsx` 테스트 추가
- 영상 파일 + complete + dubbedVideoUrl → DualMediaView에 `dubbedMediaType='video'` 전달
- 영상 파일 + complete + dubbedVideoUrl=null (폴백) → DualMediaView에 `dubbedMediaType='audio'` 전달
- pipelineStatus `'merging'` 시 → "영상 합성 중..." 표시

**GREEN**: `DubbingDashboardPage.tsx` 수정
**REFACTOR**: 조건부 렌더링 정리

---

## Complexity Tracking

> 위반 사항 없음 — Constitution Check 통과

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|-----------|--------------------------------------|
| (없음) | — | — |
