# Research: 듀얼 미디어 뷰

**Feature**: `feat/#17-dual-media-view`
**Date**: 2026-03-19 (Updated: 2026-03-20)

## 연구 항목: FFmpeg.wasm을 이용한 영상 + 오디오 합성

### 배경

TTS API(ElevenLabs)는 더빙 결과를 MP3 오디오로만 반환한다. 영상 파일을 더빙한 경우, 사용자는 결과가 영상 형태로 제공되기를 기대한다. 클라이언트에서 원본 영상의 비디오 트랙과 더빙 오디오를 합성하여 새로운 영상 파일을 생성해야 한다.

### FFmpeg.wasm 개요

- **@ffmpeg/ffmpeg**: 브라우저에서 동작하는 FFmpeg WebAssembly 빌드
- **@ffmpeg/util**: 파일 변환 유틸리티 (`fetchFile`, `toBlobURL` 등)
- 서버 없이 클라이언트에서 비디오/오디오 처리 가능
- WASM 파일 크기: ~31MB (core), CDN에서 로딩 가능

### 핵심 FFmpeg 명령어

```bash
ffmpeg -i original.mp4 -i dubbed.mp3 -c:v copy -map 0:v -map 1:a -shortest output.mp4
```

- `-c:v copy`: 비디오 트랙은 재인코딩 없이 복사 (빠름)
- `-map 0:v`: 첫 번째 입력(원본 영상)의 비디오 트랙 사용
- `-map 1:a`: 두 번째 입력(더빙 오디오)의 오디오 트랙 사용
- `-shortest`: 더 짧은 스트림 기준으로 출력 길이 결정

### 구현 패턴

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

// 1. WASM 로드 (CDN에서)
await ffmpeg.load({
  coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
});

// 2. 파일 쓰기
await ffmpeg.writeFile('input.mp4', await fetchFile(originalVideoFile));
await ffmpeg.writeFile('dubbed.mp3', await fetchFile(dubbedAudioBlob));

// 3. 합성 실행
await ffmpeg.exec(['-i', 'input.mp4', '-i', 'dubbed.mp3', '-c:v', 'copy', '-map', '0:v', '-map', '1:a', '-shortest', 'output.mp4']);

// 4. 결과 읽기
const data = await ffmpeg.readFile('output.mp4');
const blob = new Blob([data], { type: 'video/mp4' });
const url = URL.createObjectURL(blob);
```

### 주의사항

| 항목 | 설명 | 대응 방안 |
|------|------|-----------|
| WASM 로딩 시간 | 초기 로딩 ~수초 (31MB) | 더빙 파이프라인 시작 시 미리 로딩 시작 |
| 메모리 제한 | 큰 영상 파일은 브라우저 메모리 초과 가능 | 에러 핸들링 + 오디오 폴백 |
| SharedArrayBuffer | 일부 환경에서 미지원 | 단일 스레드 모드 폴백 |
| CORS 헤더 | SharedArrayBuffer 사용 시 필요 | Next.js 헤더 설정 또는 단일 스레드 모드 |
| 출력 포맷 | 입력 코덱에 따라 호환성 차이 | `-c:v copy`로 재인코딩 회피, MP4 출력 고정 |

### 결정 사항

| Decision | Chosen | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| 영상+오디오 합성 도구 | FFmpeg.wasm (클라이언트) | 서버 불필요, 브라우저에서 직접 처리 | 서버 FFmpeg (인프라 필요), MediaRecorder API (복잡도 높음) |
| WASM 로딩 전략 | 더빙 파이프라인 시작 시 병렬 로딩 | 사용자 대기 시간 최소화 | 페이지 로드 시 즉시 (불필요한 로딩), 합성 시점에 로딩 (대기 시간 증가) |
| 합성 실패 시 대응 | 오디오 플레이어 폴백 | 완전 실패보다 나은 UX | 에러만 표시 (사용자에게 결과 없음) |
| 비디오 인코딩 | `-c:v copy` (재인코딩 없음) | 속도 최적화, 품질 보존 | 재인코딩 (느림, 불필요) |
| 합성 상태 표시 | pipelineStatus에 'merging' 단계 추가 | 기존 파이프라인 UX와 일관적 | 별도 상태 관리 (복잡도 증가) |

---

## 확인된 기존 패턴 재활용

| 항목 | 기존 사용처 | 이번 기능 적용 |
|------|------------|--------------|
| Blob URL 생성/해제 | `createDubbing.ts`, `useDubbingCreate.ts` | 원본 파일 sourceUrl 관리 + 합성 영상 URL 관리 |
| HTML5 `<audio>` 요소 | `AudioPlayer.tsx` | 더빙 결과 재생 (오디오 입력 시 기존 유지) |
| HTML5 `<video>` 요소 | `VideoPlayer.tsx` | 원본 영상 + 합성 영상 재생 |
| MIME 타입 체크 | `validateFileInput.ts` (SUPPORTED_MIME_TYPES) | `getMediaType()` 함수로 video/audio 분기 |
| Tailwind 반응형 | 프로젝트 전반 | `flex-col md:flex-row` 듀얼 레이아웃 |
| Vitest + RTL 테스트 | `__tests__/features/dubbing-create/` | 동일 패턴 확장 |
