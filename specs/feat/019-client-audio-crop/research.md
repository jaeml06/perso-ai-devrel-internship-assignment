# Research: 클라이언트 측 1분 미디어 크롭

**Feature**: `019-client-audio-crop` | **Date**: 2026-03-20

---

## R-001: FFmpeg WASM 크롭 명령어

### Decision
`-t 60 -c copy` 옵션으로 처음 60초를 스트림 복사 모드로 크롭한다.

### Rationale
- `-c copy`는 재인코딩 없이 스트림을 그대로 복사하므로 품질 손실이 없고 처리 속도가 매우 빠르다.
- 시작점이 항상 0초이므로 키프레임 경계 문제가 발생하지 않는다.
- 기존 프로젝트에서 이미 `@ffmpeg/ffmpeg@0.12.15` + `@ffmpeg/util@0.12.2`를 사용 중이므로 추가 의존성이 필요 없다.

### 명령어

**오디오 (MP3, WAV, OGG, FLAC, M4A)**:
```
ffmpeg -i input.ext -t 60 -c copy output.ext
```

**비디오 (MP4, MOV, WEBM)**:
```
ffmpeg -i input.ext -t 60 -c copy output.ext
```

### Alternatives Considered
| 방안 | 장점 | 단점 | 기각 사유 |
|------|------|------|-----------|
| `-c:a aac` 재인코딩 | 정밀한 시간 커팅 | 처리 시간 10배+, WASM 메모리 부담 | 성능 비용 대비 이점 없음 |
| Web Audio API | 경량, 추가 의존성 없음 | 오디오만 지원, 비디오 불가 | 비디오 크롭 미지원 |
| MediaStream Recording API | 네이티브 | 실시간 재생 필요 (1분 대기) | UX 불가 |

---

## R-002: 클라이언트 측 미디어 재생 시간 감지

### Decision
`HTMLMediaElement`(`<audio>` / `<video>`)의 `loadedmetadata` 이벤트에서 `duration` 프로퍼티를 읽는다.

### Rationale
- 브라우저 네이티브 API로 모든 지원 미디어 포맷의 메타데이터를 파싱할 수 있다.
- Blob URL을 생성하여 엘리먼트에 할당하면 파일 전체를 로드하지 않고 메타데이터만 읽는다.
- 추가 라이브러리 불필요.

### 구현 패턴
```typescript
function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const el = isVideo ? document.createElement('video') : document.createElement('audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('미디어 메타데이터를 읽을 수 없습니다'));
    };
    el.src = url;
  });
}
```

### Alternatives Considered
| 방안 | 장점 | 단점 | 기각 사유 |
|------|------|------|-----------|
| FFmpeg probe 에뮬레이션 | FFmpeg 내 통합 | WASM 로딩 필요, 느림 | 메타데이터만 읽는데 FFmpeg 전체 로딩은 과도 |
| `music-metadata-browser` | 정밀한 메타데이터 | 추가 의존성 (번들 크기 증가) | 불필요한 복잡성 |

---

## R-003: 크롭 기준 시간 상수화

### Decision
`MAX_MEDIA_DURATION_SECONDS = 60`을 `dubbing.dto.ts`에 정의한다.

### Rationale
기존 `MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024`와 동일한 위치에 배치하여 파일 제약 관련 상수를 한 곳에서 관리한다.

### Alternatives Considered
| 방안 | 장점 | 단점 | 기각 사유 |
|------|------|------|-----------|
| `cropMedia.ts` 내 로컬 상수 | 간단 | 테스트 및 UI에서 재사용 불가 | 여러 곳에서 참조 필요 |
| 환경 변수 | 동적 변경 가능 | 클라이언트 코드에서 불필요한 복잡성 | 고정 값이므로 불필요 |

---

## R-004: 크롭 시 파일 확장자/MIME 매핑

### Decision
입력 파일의 확장자와 MIME 타입을 보존하여 출력 파일을 생성한다.

### 매핑 테이블

| 입력 확장자 | FFmpeg 입출력 파일명 | 출력 MIME |
|------------|---------------------|-----------|
| .mp3 | input.mp3 → output.mp3 | audio/mpeg |
| .wav | input.wav → output.wav | audio/wav |
| .ogg | input.ogg → output.ogg | audio/ogg |
| .flac | input.flac → output.flac | audio/flac |
| .m4a | input.m4a → output.m4a | audio/mp4 |
| .mp4 | input.mp4 → output.mp4 | video/mp4 |
| .mov | input.mov → output.mov | video/quicktime |
| .webm | input.webm → output.webm | video/webm |

### Rationale
FFmpeg `-c copy`는 코덱을 변경하지 않으므로, 입력과 동일한 컨테이너 포맷으로 출력해야 한다. 확장자를 올바르게 매핑해야 FFmpeg가 올바른 muxer를 선택한다.
