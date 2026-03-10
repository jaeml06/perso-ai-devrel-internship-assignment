# Research: AI 더빙 코어 기능

**Phase**: 0 — Research
**Date**: 2026-03-09
**Branch**: `feat/#3-ai-dubbing-core`

---

## 1. ElevenLabs TTS API

### Decision: `POST /v1/text-to-speech/{voice_id}`

**Rationale**: ElevenLabs 공식 REST API. 서버 Route Handler에서 `Authorization: xi-api-key {key}` 헤더와 함께 호출.

**Request**:
```json
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
Content-Type: application/json
xi-api-key: {ELEVENLABS_API_KEY}

{
  "text": "안녕하세요",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Response**: Binary audio stream (`audio/mpeg`)

**Alternatives considered**:
- ElevenLabs Node.js SDK (`elevenlabs` npm 패키지): 의존성 추가로 단순 fetch보다 무겁고, SDK 내부 변경에 취약함 → 거절
- 스트리밍 모드 (`/v1/text-to-speech/{voice_id}/stream`): 실시간 스트리밍은 구현 복잡도가 높음, 현재 요구사항에서 불필요 → 거절

### Model 선택: `eleven_multilingual_v2`

**Rationale**: 한국어 + 영어 모두 지원하는 최신 다국어 모델. 무료 플랜에서 사용 가능.

---

## 2. 음성 목록 관리 방식

### Decision: 6개 프리메이드 음성 정적 구성 (VOICES 상수)

**Rationale**:
- ElevenLabs `/v1/voices` API 호출 시 무료 플랜 크레딧을 소모하지 않고 빠르게 반환
- spec 기준 4~5개에서 중년 여성(Dorothy) 추가 요청으로 6개로 확장
- 안정적: API 의존 없이 항상 동일한 목록 보장

**선택된 6개 음성 (ElevenLabs Premade)**:

| ID | 이름 | 성별 | 나이대 | 언어 |
|----|------|------|--------|------|
| `21m00Tcm4TlvDq8ikWAM` | Rachel | female | young | 영어/다국어 |
| `TxGEqnHWrfWFTfGW9XjX` | Josh | male | young | 영어/다국어 |
| `pNInz6obpgDQGcFmaJgB` | Adam | male | middle | 영어/다국어 |
| `EXAVITQu4vr4xnSDxMaL` | Bella | female | young | 영어/다국어 |
| `MF3mGyEYCl7XYWbV9V6O` | Elli | female | young | 영어/다국어 |
| `ThT5KcBeYPX3keUQqHPh` | Dorothy | female | middle | 영어/다국어 |

**Alternatives considered**:
- 동적 API 호출 (`GET /v1/voices`): 페이지 로드마다 API 호출 → 속도 저하, 크레딧 낭비 → 거절
- 사용자 정의 음성 업로드: 무료 플랜 범위 초과 → 거절

---

## 3. 오디오 전달 방식 (Route Handler → 클라이언트)

### Decision: Blob Stream (`application/octet-stream`) → 클라이언트 `URL.createObjectURL(blob)`

**Flow**:
1. Route Handler: ElevenLabs로부터 audio/mpeg 바이너리 수신
2. Route Handler: `new Response(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg' } })` 반환
3. 클라이언트 Entity: `response.blob()` → `URL.createObjectURL(blob)` → `audioUrl` string
4. UI: `<audio src={audioUrl}>` 또는 `audioRef.current.src = audioUrl`

**Rationale**: 별도 파일 저장 불필요, 메모리 효율적, 구현 단순

**Alternatives considered**:
- Base64 JSON `{ "audio": "..." }`: 데이터 크기 33% 증가, 추가 파싱 필요 → 거절
- Signed URL (S3 등): 파일 저장 인프라 필요, 요구사항에 없음 → 거절

---

## 4. HTTP 클라이언트 선택

### Decision: `ky` (클라이언트 entity API) + 네이티브 `fetch` (서버 Route Handler)

**Rationale**:
- `ky`: constitution 표준 HTTP 클라이언트. 에러 처리, timeout, 재시도가 편리
- 서버 `fetch`: Next.js App Router의 서버 컴포넌트/Route Handler에서 `fetch`가 기본 제공되고 추가 의존성 없음

**Alternatives considered**:
- axios: 번들 사이즈 크고, ky가 더 현대적 → 거절
- ky 서버에서도 사용: 가능하지만 서버 환경에서 불필요한 의존성 → 거절

---

## 5. 입력 검증 전략

### Decision: 클라이언트 (순수 함수) + 서버 (zod 스키마) 이중 검증

**Rationale**:
- 클라이언트: `validateDubbingInput` 순수 함수로 즉각적 UX 피드백 (에러 메시지 표시)
- 서버: zod로 Route Handler 입력 검증 (보안, 무결성)

**검증 규칙**:
```
text: string, minLength(1), maxLength(5000)
voiceId: string, min(1)
language: enum(['ko', 'en'])
```

---

## 6. 오디오 플레이어 구현

### Decision: HTML5 `<audio>` 엘리먼트 + React `useRef`

**Rationale**:
- 추가 의존성 없음
- 재생/일시정지/시크/다운로드 기능 모두 네이티브 지원
- `URL.createObjectURL`로 생성된 Blob URL 직접 연결 가능

**구현 패턴**:
```typescript
const audioRef = useRef<HTMLAudioElement>(null);
// 재생: audioRef.current?.play()
// 일시정지: audioRef.current?.pause()
// 다운로드: <a href={audioUrl} download="dubbing.mp3">
```

---

## 7. 테스트 전략 (TDD)

### Decision: `src/__tests__/` 중앙화 구조 (기존 패턴 유지)

**테스트 레이어별 전략**:

| 레이어 | 테스트 유형 | 도구 | 모킹 대상 |
|--------|------------|------|-----------|
| `lib/` 순수 함수 | 단위 테스트 | Vitest | 없음 |
| `entities/api/` | 단위 테스트 | Vitest + `vi.mock` | ky (fetch) |
| `app/api/route.ts` | 통합 테스트 | Vitest + `vi.mock` | fetch (ElevenLabs 호출) |
| `features/model/` | 훅 테스트 | Vitest + RTL | entity API 함수 |
| `features/ui/` | 컴포넌트 테스트 | Vitest + RTL | 훅 모킹 |

**Alternatives considered**:
- MSW (Mock Service Worker): 현재 package.json에 없음, 설치 필요. 이번 iteration에서는 `vi.mock`으로 단순화 → 차후 도입 가능

---

## 8. 환경변수 보안

### Decision: `src/shared/config/env.ts` — 서버 전용 환경변수 접근 모듈

```typescript
// src/shared/config/env.ts
export function getElevenLabsApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set');
  return key;
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}
```

**Rationale**: 미설정 시 서버 시작 단계에서 즉시 에러 → FR-011 충족. `NEXT_PUBLIC_` 접두사 없이 클라이언트 번들에서 제외.

---

## 9. ElevenLabs Speech-to-Text (STT) API

### Decision: `POST https://api.elevenlabs.io/v1/speech-to-text` (multipart/form-data)

**Request**:
```
POST https://api.elevenlabs.io/v1/speech-to-text
Content-Type: multipart/form-data
xi-api-key: {ELEVENLABS_API_KEY}

file: <binary file data>  (audio/video)
model_id: scribe_v1
```

**Response**:
```json
{
  "text": "transcribed text here",
  "language_code": "en",
  "language_probability": 0.99,
  "words": [...]
}
```

**Supported formats**: mp3, wav, ogg, flac, m4a, mp4, mov, webm (ElevenLabs가 직접 처리, 서버 변환 불필요)

**File size limit**: 25MB (ElevenLabs 제한)

**Empty transcription handling**: `text`가 비어 있으면 "음성을 감지하지 못했습니다" 에러 반환

**Route Handler 구현 방식**: Next.js `request.formData()`로 파일 수신 → 네이티브 `fetch`로 ElevenLabs 전달
- `FormData.get('file')` → `File` 객체 → ElevenLabs로 전달

**Alternatives considered**:
- ElevenLabs Node.js SDK: 추가 의존성, 직접 fetch로 충분 → 거절
- 서버에서 파일 임시 저장 후 전달: 불필요한 I/O, in-memory 처리로 충분 → 거절

---

## 10. Google Gemini Translation API

### Decision: 직접 REST API (`@google/genai` SDK 사용)

**Package**: `@google/genai` (Google 통합 JS SDK — Gemini 2.0+부터 권장, 레거시 `@google/generative-ai` 대체)

**Model**: `gemini-3.1-flash-lite-preview` (spec 명시, 무료 플랜 사용 가능)

**Request pattern**:
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-lite-preview',
  contents: prompt,
});
const translatedText = response.text;
```

**Same-language optimization**: 소스 언어 = 타겟 언어인 경우 Gemini 호출 없이 원문 그대로 반환 (불필요한 API 호출 방지)

**Route Handler**: `POST /api/translate` → Gemini 호출 → `{ translatedText: string }` 반환

**Language detection**: ElevenLabs STT 응답의 `language_code`로 소스 언어 자동 감지

**Alternatives considered**:
- 직접 REST API (fetch): SDK가 인증/에러처리 편의성 제공 → SDK 채택
- DeepL / LibreTranslate: 별도 API 키, spec에서 Gemini 지정 → 거절
- Claude Haiku for translation: 무료 플랜 없음, Gemini 지정 → 거절

---

## 11. 파일 업로드 (Next.js 16 App Router)

### Decision: `request.formData()` → `FormData.get('file')` → `File` 객체

**Next.js 16 App Router Route Handler 패턴**:
```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '파일을 업로드해주세요' }, { status: 400 });

  // ElevenLabs에 전달할 FormData 재구성
  const elevenLabsForm = new FormData();
  elevenLabsForm.append('file', file);
  elevenLabsForm.append('model_id', 'scribe_v1');
  // ...
}
```

**클라이언트 전송 방식**:
```typescript
// entities/dubbing/api/transcribeFile.ts
const formData = new FormData();
formData.append('file', file);
const response = await ky.post('/api/stt', { body: formData });
```

**파일 검증 (클라이언트 lib)**:
- 허용 MIME types: `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`, `audio/mp4`, `audio/x-m4a`, `video/mp4`, `video/quicktime`, `video/webm`
- 허용 확장자 (MIME이 불명확한 경우 fallback): `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.mp4`, `.mov`, `.webm`
- 최대 크기: 25MB (= 25 * 1024 * 1024 bytes)

**Rationale**: `formData()` API는 Next.js 16 기본 지원, 추가 패키지 불필요. 서버 측 파일 임시 저장 없이 메모리에서 처리.

**Alternatives considered**:
- `multer` 미들웨어: App Router와 호환성 복잡 → 거절
- `busboy`: 직접 스트림 처리, formData()보다 복잡 → 거절
