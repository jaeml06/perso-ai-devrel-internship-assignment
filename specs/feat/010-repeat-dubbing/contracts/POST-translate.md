# Contract: POST /api/translate

**Purpose**: 현재 attempt의 전사 텍스트를 타겟 언어로 번역한다  
**Layer**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/app/api/translate/route.ts`  
**Caller**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/entities/dubbing/api/translateText.ts`

## Request

**Method**: `POST`  
**Content-Type**: `application/json`

```json
{
  "text": "Hello",
  "sourceLanguage": "en",
  "targetLanguage": "ko"
}
```

## Response

### 200 OK

```json
{
  "translatedText": "안녕하세요",
  "wasSkipped": false
}
```

## Repeat-attempt Rules

- 새 submit/retry마다 현재 attempt의 전사 결과로 다시 호출한다.
- 동일 입력 조합이어도 이전 attempt의 번역 결과를 캐시된 성공값으로 재노출하지 않는다.
- `sourceLanguage === targetLanguage`인 경우에도 현재 attempt에 대해 `wasSkipped` 응답을 다시 계산한다.

## Error Responses

| Status | Meaning |
| --- | --- |
| `400` | 필수 필드 누락 또는 잘못된 언어 값 |
| `500` | 서버 설정 오류 |
| `502` | 번역 처리 실패 |
