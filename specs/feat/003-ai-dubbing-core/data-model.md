# Data Model: AI 더빙 코어 기능 (파일 업로드 → STT → 번역 → TTS)

**Phase**: 1 — Design (Updated for full pipeline)
**Date**: 2026-03-10

---

## Entities

### 1. Voice (음성 프로필)

**Source**: ElevenLabs 프리메이드 음성 6개를 정적 구성
**Location**: `src/entities/voice/dto/voice.dto.ts` _(기존, 변경 없음)_

```typescript
export type VoiceGender = 'male' | 'female';
export type VoiceAgeGroup = 'young' | 'middle';

export interface Voice {
  id: string;              // ElevenLabs voice_id
  name: string;            // 표시 이름
  gender: VoiceGender;
  ageGroup: VoiceAgeGroup;
  previewUrl: string;      // 미리듣기 URL
  description: string;     // 한국어 설명
}

export interface VoiceListResponse {
  voices: Voice[];
}
```

---

### 2. DubbingLanguage (지원 언어)

**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
export type DubbingLanguage = 'ko' | 'en';
```

---

### 3. FileUploadInput (파일 업로드 입력)

**Source**: 사용자 파일 선택
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
// 지원 오디오/비디오 확장자
export const SUPPORTED_EXTENSIONS = [
  '.mp3', '.wav', '.ogg', '.flac', '.m4a',
  '.mp4', '.mov', '.webm',
] as const;

// 지원 MIME 타입
export const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export interface FileValidationErrors {
  file?: string;      // "파일을 업로드해주세요" | "지원하지 않는 파일 형식입니다" | "파일 크기가 25MB를 초과합니다"
  voiceId?: string;   // "음성을 선택해주세요"
  language?: string;  // "타겟 언어를 선택해주세요"
}

export interface FileValidationResult {
  isValid: boolean;
  errors: FileValidationErrors;
}
```

---

### 4. TranscriptionResult (STT 결과)

**Source**: ElevenLabs STT API 응답
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
export interface TranscriptionResult {
  text: string;           // 전사된 텍스트
  languageCode: string;   // 감지된 언어 코드 (e.g., "en", "ko")
  languageProbability: number; // 언어 감지 신뢰도 (0~1)
}
```

**서버 측 응답 (ElevenLabs 원본)**:

```json
{
  "text": "transcribed text",
  "language_code": "en",
  "language_probability": 0.99,
  "words": [...]
}
```

---

### 5. TranslationResult (번역 결과)

**Source**: Google Gemini API 응답
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
// sourceLanguage: ElevenLabs STT가 반환하는 언어 코드는 임의의 문자열(e.g., 'fr', 'ja')일 수 있다.
// 'ko' | 'en'이 아닌 경우 Route Handler 내에서 'auto'로 정규화하여 Gemini에게 자동 감지를 위임한다.
export type TranslationSourceLanguage = DubbingLanguage | 'auto';

export interface TranslationResult {
  translatedText: string;             // 번역된 텍스트
  sourceLanguage: TranslationSourceLanguage; // 원본 언어 ('ko' | 'en' | 'auto')
  targetLanguage: DubbingLanguage;    // 타겟 언어
  wasSkipped: boolean;                // true if source == target (번역 건너뜀)
}
```

---

### 6. DubbingPipelineStatus (파이프라인 상태)

**Source**: 파이프라인 진행 상태 추적
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
export type DubbingPipelineStatus =
  | 'idle'          // 초기 상태, 사용자 입력 대기
  | 'transcribing'  // STT 처리 중 ("음성을 텍스트로 변환 중...")
  | 'translating'   // 번역 처리 중 ("텍스트를 번역 중...")
  | 'synthesizing'  // TTS 처리 중 ("음성을 합성 중...")
  | 'complete'      // 완료, 오디오 재생 가능
  | 'error';        // 오류 발생, 재시도 가능

// 각 단계의 진행 상태 메시지
export const PIPELINE_STATUS_MESSAGES: Record<DubbingPipelineStatus, string> = {
  idle: '',
  transcribing: '음성을 텍스트로 변환 중...',
  translating: '텍스트를 번역 중...',
  synthesizing: '음성을 합성 중...',
  complete: '더빙 완료',
  error: '오류가 발생했습니다',
};
```

---

### 7. AudioResult (TTS 합성 결과)

**Source**: `/api/tts` Route Handler → Blob URL
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
export interface AudioResult {
  audioUrl: string;  // Blob URL (URL.createObjectURL 결과)
  format: 'mp3';
}
```

---

### 8. API Route 요청/응답 타입

**Location**: 각 Route Handler 파일 내부 (zod 스키마)

```typescript
// POST /api/stt (multipart/form-data, zod 검증은 파일 존재 여부만)
// Request: FormData { file: File }
// Response: { text: string, languageCode: string, languageProbability: number }
// 주의: languageCode는 ElevenLabs가 감지한 임의 언어 코드(string)임.
//       클라이언트 훅에서 'ko'/'en' 이외의 값은 'auto'로 정규화하여 /api/translate로 전달한다.

// POST /api/translate
const translateRequestSchema = z.object({
  text: z.string().min(1),
  sourceLanguage: z.enum(['ko', 'en', 'auto']), // 'auto' = STT 감지 언어가 ko/en 이외일 때
  targetLanguage: z.enum(['ko', 'en']),
});
// Response: { translatedText: string, sourceLanguage: 'ko' | 'en' | 'auto', wasSkipped: boolean }

// POST /api/tts (기존, 변경 없음)
const ttsRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1),
  language: z.enum(['ko', 'en']),
});
// Response: audio/mpeg binary
```

---

## State Shape (useDubbingCreate 훅 내부 — 업데이트)

```typescript
interface DubbingCreateState {
  // 입력 필드
  file: File | null;                        // 업로드된 파일 (null = 미선택)
  targetLanguage: DubbingLanguage;          // 타겟 언어 (기본: 'ko')
  voiceId: string;                          // 선택된 음성 ID

  // 파이프라인 상태
  pipelineStatus: DubbingPipelineStatus;    // 현재 단계

  // 파이프라인 결과 (단계별 누적)
  transcription: TranscriptionResult | null;  // STT 결과
  translation: TranslationResult | null;      // 번역 결과
  audioUrl: string | null;                    // 최종 오디오 URL

  // 에러/검증
  errorMessage: string | null;              // 파이프라인 에러 메시지
  validationErrors: FileValidationErrors;   // 클라이언트 유효성 에러

  // 음성 목록
  voices: Voice[];
  voicesError: string | null;
}
```

---

## 의존성 그래프 (Updated)

```text
shared/config/env.ts (getElevenLabsApiKey, getGeminiApiKey)
    ↑
app/api/stt/route.ts ──────── ElevenLabs STT API (외부)
app/api/translate/route.ts ── Gemini API (외부)
app/api/tts/route.ts ──────── ElevenLabs TTS API (외부)
app/api/voices/route.ts ───── PREMADE_VOICES (정적)
    ↑
entities/dubbing/api/transcribeFile.ts  (ky → /api/stt)
entities/dubbing/api/translateText.ts   (ky → /api/translate)
entities/dubbing/api/createDubbing.ts   (ky → /api/tts)  [기존]
entities/voice/api/getVoices.ts         (ky → /api/voices) [기존]
    ↑
features/dubbing-create/lib/validateFileInput.ts   (순수 함수)
features/dubbing-create/lib/validateDubbingInput.ts [기존, 미사용 예정]
features/dubbing-create/model/useDubbingCreate.ts  (파이프라인 오케스트레이터)
    ↑
features/dubbing-create/ui/DubbingDashboardPage.tsx
features/dubbing-create/ui/DubbingForm.tsx          (파일 업로드 UI)
features/dubbing-create/ui/PipelineProgress.tsx     (진행 상태 표시)
features/dubbing-create/ui/VoiceSelector.tsx        [기존]
features/dubbing-create/ui/AudioPlayer.tsx          [기존]
    ↑
app/dashboard/page.tsx
```
