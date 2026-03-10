# Contract: POST /api/translate

**Purpose**: 전사된 텍스트를 타겟 언어로 번역 (Google Gemini API 위임)
**Layer**: `app/api/translate/route.ts` (Next.js Route Handler)
**Caller**: `src/entities/dubbing/api/translateText.ts`

---

## Request

**Method**: `POST`
**Content-Type**: `application/json`

```json
{
  "text": "Hello, this is a test recording.",
  "sourceLanguage": "en",
  "targetLanguage": "ko"
}
```

| Field            | Type                     | Required | Description                                      |
| ---------------- | ------------------------ | -------- | ------------------------------------------------ |
| `text`           | string (min 1)           | ✅       | 번역할 원본 텍스트                               |
| `sourceLanguage` | `"ko" \| "en" \| "auto"` | ✅       | 원본 언어 (`"auto"` = ElevenLabs 감지 결과 사용) |
| `targetLanguage` | `"ko" \| "en"`           | ✅       | 타겟 언어                                        |

---

## Response

### 200 OK — 번역 성공

```json
{
  "translatedText": "안녕하세요, 테스트 녹음입니다.",
  "wasSkipped": false
}
```

| Field            | Type    | Description                              |
| ---------------- | ------- | ---------------------------------------- |
| `translatedText` | string  | 번역된 텍스트 (동일 언어 시 원문 그대로) |
| `wasSkipped`     | boolean | `true` = 동일 언어로 번역 건너뜀         |

**동일 언어 처리**: `sourceLanguage === targetLanguage`이면 Gemini를 호출하지 않고 원문을 `translatedText`로 반환, `wasSkipped: true`

---

## Error Responses

| Status | Error Message                              | Trigger                             |
| ------ | ------------------------------------------ | ----------------------------------- |
| `400`  | `"입력값이 유효하지 않습니다"`             | zod 검증 실패 (필드 누락/형식 오류) |
| `500`  | `"서버 설정 오류가 발생했습니다"`          | `GEMINI_API_KEY` 미설정             |
| `502`  | `"번역에 실패했습니다. 다시 시도해주세요"` | Gemini API 오류                     |

---

## Implementation Notes

- zod 스키마로 입력 검증: `text` (min 1), `sourceLanguage` (enum), `targetLanguage` (enum)
- 동일 언어 단락 처리: `sourceLanguage === targetLanguage` → Gemini 호출 없이 바로 반환
- Gemini 프롬프트:

  ```
  Translate the following text to {targetLanguage}.
  Return only the translated text, no explanations or additional content.

  Text: {text}
  ```

- 환경변수: `GEMINI_API_KEY`
- 패키지: `@google/genai` (`GoogleGenAI` 클래스 사용)
- 모델: `gemini-3.1-flash-lite-preview`

---

## TDD Test Cases

```typescript
// src/__tests__/app/api/translate.route.test.ts
describe('POST /api/translate', () => {
  it('필드 누락 → 400');
  it('동일 언어(en→en) → 원문 반환, wasSkipped: true');
  it('유효한 요청 → 번역 텍스트 반환');
  it('API 키 미설정 → 500');
  it('Gemini API 오류 → 502');
});
```
