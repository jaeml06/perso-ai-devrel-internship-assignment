# Contract: POST /api/stt

**Purpose**: 업로드된 오디오/비디오 파일에서 음성을 텍스트로 전사 (ElevenLabs STT API 위임)
**Layer**: `app/api/stt/route.ts` (Next.js Route Handler)
**Caller**: `src/entities/dubbing/api/transcribeFile.ts`

---

## Request

**Method**: `POST`
**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File (binary) | ✅ | 오디오/비디오 파일 |

**지원 포맷**: mp3, wav, ogg, flac, m4a, mp4, mov, webm
**최대 크기**: 25MB (서버 측에서도 검증)

---

## Response

### 200 OK — 전사 성공

```json
{
  "text": "Hello, this is a test recording.",
  "languageCode": "en",
  "languageProbability": 0.99
}
```

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | 전사된 텍스트 |
| `languageCode` | string | 감지된 언어 코드 (e.g., `"en"`, `"ko"`) |
| `languageProbability` | number | 언어 감지 신뢰도 (0~1) |

---

## Error Responses

| Status | Error Message | Trigger |
|--------|---------------|---------|
| `400` | `"파일을 업로드해주세요"` | `file` 필드 없음 |
| `400` | `"음성을 감지하지 못했습니다"` | STT 결과 텍스트가 비어 있음 |
| `429` | `"크레딧이 부족합니다. 잠시 후 다시 시도해주세요"` | ElevenLabs 429 |
| `500` | `"서버 설정 오류가 발생했습니다"` | `ELEVENLABS_API_KEY` 미설정 |
| `502` | `"음성 인식에 실패했습니다. 다시 시도해주세요"` | ElevenLabs API 오류 |
| `503` | `"서비스를 일시적으로 사용할 수 없습니다"` | ElevenLabs 401 (인증 실패) |

---

## Implementation Notes

- `request.formData()`로 파일 수신
- ElevenLabs `POST /v1/speech-to-text`로 multipart 재전송
- `model_id: "scribe_v1"` 고정
- ElevenLabs 응답의 `language_code`는 camelCase(`languageCode`)로 변환하여 반환
- API 키 미설정 시 `getElevenLabsApiKey()` 에서 throw → 500 반환

---

## TDD Test Cases

```typescript
// src/__tests__/app/api/stt.route.test.ts
describe('POST /api/stt', () => {
  it('파일 없음 → 400')
  it('유효한 파일 → 전사 텍스트 반환')
  it('빈 전사 결과 → 400 "음성을 감지하지 못했습니다"')
  it('ElevenLabs 401 → 503')
  it('ElevenLabs 429 → 429')
  it('API 키 미설정 → 500')
  it('ElevenLabs 기타 오류 → 502')
})
```
