# Contract: POST /api/tts

**Method**: POST
**Path**: `/api/tts`
**Location**: `src/app/api/tts/route.ts`
**Auth**: 없음 (인증은 PR3에서 구현)

---

## Request

**Content-Type**: `application/json`

```json
{
  "text": "안녕하세요, 더빙 테스트입니다.",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "language": "ko"
}
```

**필드 정의**:

| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `text` | string | ✅ | 1 ~ 5,000자 | 변환할 텍스트 |
| `voiceId` | string | ✅ | min 1자 | ElevenLabs voice_id |
| `language` | `'ko' \| 'en'` | ✅ | enum | 선택 언어 |

---

## Success Response

**Status**: `200 OK`
**Content-Type**: `audio/mpeg`
**Body**: Binary audio stream (MP3)

클라이언트에서 처리:
```typescript
const res = await ky.post('/api/tts', { json: request });
const blob = await res.blob();
const audioUrl = URL.createObjectURL(blob);
```

---

## Error Responses

| 상태 코드 | 조건 | 응답 바디 예시 |
|-----------|------|--------------|
| `400 Bad Request` | 입력 유효성 검증 실패 | `{ "error": "텍스트를 입력해주세요" }` |
| `400 Bad Request` | 5,000자 초과 | `{ "error": "텍스트는 5,000자를 초과할 수 없습니다" }` |
| `400 Bad Request` | 음성 미선택 | `{ "error": "음성을 선택해주세요" }` |
| `500 Internal Server Error` | API 키 미설정 | `{ "error": "서버 설정 오류가 발생했습니다" }` |
| `503 Service Unavailable` | ElevenLabs 401 (키 무효) | `{ "error": "서비스를 일시적으로 사용할 수 없습니다" }` |
| `429 Too Many Requests` | ElevenLabs 429 (크레딧 소진) | `{ "error": "크레딧이 부족합니다. 잠시 후 다시 시도해주세요" }` |
| `502 Bad Gateway` | 기타 ElevenLabs API 오류 | `{ "error": "오디오 생성에 실패했습니다" }` |

---

## Server Implementation Outline

```typescript
// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getElevenLabsApiKey } from '@/shared/config/env';

const ttsRequestSchema = z.object({
  text: z.string().min(1, '텍스트를 입력해주세요').max(5000, '텍스트는 5,000자를 초과할 수 없습니다'),
  voiceId: z.string().min(1, '음성을 선택해주세요'),
  language: z.enum(['ko', 'en']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. 입력 파싱 및 zod 검증
  // 2. API 키 가져오기 (없으면 500)
  // 3. ElevenLabs API 호출 (eleven_multilingual_v2 모델)
  // 4. 응답 status별 에러 처리 (401, 429, 기타)
  // 5. audio binary → NextResponse 반환 (Content-Type: audio/mpeg)
}
```

---

## Consumer

- `src/entities/dubbing/api/createDubbing.ts` — ky로 이 엔드포인트 POST 호출
- `src/features/dubbing-create/model/useDubbingCreate.ts` — 폼 제출 시 호출

---

## TDD Tests

```typescript
// src/__tests__/app/api/tts.route.test.ts
import { POST } from '@/app/api/tts/route';

// ElevenLabs fetch 모킹
vi.mock('node-fetch', ...); // 또는 global.fetch 모킹

describe('POST /api/tts', () => {
  describe('입력 유효성 검증', () => {
    it('빈 텍스트 → 400 반환', async () => {
      const req = new Request('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '', voiceId: 'abc', language: 'ko' }),
      });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('텍스트를 입력해주세요');
    });

    it('5001자 텍스트 → 400 반환', async () => {
      const req = new Request('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: 'a'.repeat(5001), voiceId: 'abc', language: 'ko' }),
      });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it('voiceId 빈값 → 400 반환', async () => {
      const req = new Request('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕', voiceId: '', language: 'ko' }),
      });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it('잘못된 language → 400 반환', async () => {
      const req = new Request('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕', voiceId: 'abc', language: 'fr' }),
      });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe('API 키 오류', () => {
    it('ELEVENLABS_API_KEY 미설정 → 500 반환', async () => {
      const originalKey = process.env.ELEVENLABS_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;
      const req = new Request('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕', voiceId: 'abc', language: 'ko' }),
      });
      const res = await POST(req as any);
      expect(res.status).toBe(500);
      process.env.ELEVENLABS_API_KEY = originalKey;
    });
  });

  describe('ElevenLabs API 에러 처리', () => {
    it('ElevenLabs 401 → 503 반환', async () => { /* fetch 모킹 */ });
    it('ElevenLabs 429 → 429 반환 (크레딧 부족)', async () => { /* fetch 모킹 */ });
    it('ElevenLabs 500 → 502 반환', async () => { /* fetch 모킹 */ });
  });

  describe('성공', () => {
    it('유효한 요청 → 200 + audio/mpeg 반환', async () => {
      // fetch를 모킹하여 더미 오디오 Blob 반환
      global.fetch = vi.fn().mockResolvedValue(
        new Response(new Uint8Array([0xFF, 0xFB]).buffer, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        })
      );
      const req = new Request('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text: '안녕하세요', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'ko' }),
      });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    });
  });
});
```
