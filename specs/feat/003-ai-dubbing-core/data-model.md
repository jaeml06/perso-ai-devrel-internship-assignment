# Data Model: AI 더빙 코어 기능

**Phase**: 1 — Design
**Date**: 2026-03-09

---

## Entities

### 1. Voice (음성 프로필)

**Source**: ElevenLabs 프리메이드 음성 5개를 정적 구성
**Location**: `src/entities/voice/dto/voice.dto.ts`

```typescript
export type VoiceGender = 'male' | 'female';
export type VoiceAgeGroup = 'young' | 'middle';

export interface Voice {
  id: string;           // ElevenLabs voice_id (e.g., "21m00Tcm4TlvDq8ikWAM")
  name: string;         // 표시 이름 (e.g., "Rachel")
  gender: VoiceGender;  // 성별 분류
  ageGroup: VoiceAgeGroup; // 나이대 분류
  previewUrl: string;   // 미리듣기 오디오 URL (ElevenLabs CDN)
  description: string;  // 한국어 설명 (e.g., "젊은 여성, 차분하고 명확한 발음")
}

export interface VoiceListResponse {
  voices: Voice[];
}
```

**정적 데이터 (VOICES 상수)**:
```typescript
// src/app/api/voices/route.ts 내부 또는 별도 상수 파일
export const PREMADE_VOICES: Voice[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    ageGroup: 'young',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/voices/21m00Tcm4TlvDq8ikWAM/21m00Tcm4TlvDq8ikWAM.mp3',
    description: '젊은 여성 · 차분하고 명확한 발음',
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    gender: 'male',
    ageGroup: 'young',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/voices/TxGEqnHWrfWFTfGW9XjX/TxGEqnHWrfWFTfGW9XjX.mp3',
    description: '젊은 남성 · 자연스럽고 친근한 목소리',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'male',
    ageGroup: 'middle',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/voices/pNInz6obpgDQGcFmaJgB/pNInz6obpgDQGcFmaJgB.mp3',
    description: '중년 남성 · 깊고 안정적인 목소리',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    gender: 'female',
    ageGroup: 'young',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/voices/EXAVITQu4vr4xnSDxMaL/EXAVITQu4vr4xnSDxMaL.mp3',
    description: '젊은 여성 · 활기차고 에너지 넘치는 목소리',
  },
  {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    gender: 'female',
    ageGroup: 'young',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/voices/MF3mGyEYCl7XYWbV9V6O/MF3mGyEYCl7XYWbV9V6O.mp3',
    description: '젊은 여성 · 따뜻하고 감성적인 목소리',
  },
  {
    id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    gender: 'female',
    ageGroup: 'middle',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/voices/ThT5KcBeYPX3keUQqHPh/ThT5KcBeYPX3keUQqHPh.mp3',
    description: '중년 여성 · 차분하고 신뢰감 있는 목소리',
  },
];
```

---

### 2. DubbingRequest (TTS 변환 요청)

**Source**: 클라이언트 폼 입력
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts`

```typescript
export type DubbingLanguage = 'ko' | 'en';

export interface DubbingRequest {
  text: string;              // 변환할 텍스트 (1~5000자)
  voiceId: string;           // 선택된 Voice.id
  language: DubbingLanguage; // 언어 선택 ('ko' | 'en')
}

export interface DubbingResponse {
  audioUrl: string;          // Blob URL (URL.createObjectURL 결과)
  format: 'mp3';
}

export type DubbingStatus = 'idle' | 'loading' | 'success' | 'error';
```

**서버 측 zod 스키마** (`app/api/tts/route.ts` 내부):
```typescript
import { z } from 'zod';

const ttsRequestSchema = z.object({
  text: z.string().min(1, '텍스트를 입력해주세요').max(5000, '텍스트는 5,000자를 초과할 수 없습니다'),
  voiceId: z.string().min(1, '음성을 선택해주세요'),
  language: z.enum(['ko', 'en']),
});

export type TtsRequest = z.infer<typeof ttsRequestSchema>;
```

---

### 3. ValidationError (유효성 검증 오류)

**Source**: `features/dubbing-create/lib/validateDubbingInput.ts`
**Location**: `src/entities/dubbing/dto/dubbing.dto.ts` (공유 타입) 또는 feature 내부

```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: {
    text?: string;
    voiceId?: string;
    language?: string;
  };
}
```

---

## State Shape (useDubbingCreate 훅 내부)

```typescript
interface DubbingCreateState {
  text: string;              // 입력 텍스트
  voiceId: string;           // 선택된 voiceId ('': 미선택)
  language: DubbingLanguage; // 선택된 언어 (기본: 'ko')
  isLoading: boolean;        // API 요청 진행 중
  audioUrl: string | null;   // 생성된 오디오 Blob URL
  errorMessage: string | null; // API 에러 메시지
  validationErrors: {        // 클라이언트 유효성 에러
    text?: string;
    voiceId?: string;
  };
}
```

---

## 의존성 그래프

```
shared/config/env.ts
    ↑
app/api/voices/route.ts ─── (PREMADE_VOICES 상수)
app/api/tts/route.ts ─────── ElevenLabs API (외부)
    ↑                              ↑
entities/voice/api/getVoices.ts    │
entities/dubbing/api/createDubbing.ts (ky)
    ↑
features/dubbing-create/lib/validateDubbingInput.ts
features/dubbing-create/model/useDubbingCreate.ts
    ↑
features/dubbing-create/ui/DubbingDashboardPage.tsx
features/dubbing-create/ui/DubbingForm.tsx
features/dubbing-create/ui/VoiceSelector.tsx
features/dubbing-create/ui/AudioPlayer.tsx
    ↑
app/dashboard/page.tsx
```
