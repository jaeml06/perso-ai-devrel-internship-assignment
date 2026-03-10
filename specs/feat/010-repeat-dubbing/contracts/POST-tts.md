# Contract: POST /api/tts

**Purpose**: 현재 attempt의 번역 텍스트와 선택 음성으로 새 오디오 Blob을 생성한다  
**Layer**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/app/api/tts/route.ts`  
**Caller**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/entities/dubbing/api/createDubbing.ts`

## Request

**Method**: `POST`  
**Content-Type**: `application/json`

```json
{
  "text": "안녕하세요",
  "voiceId": "voice_123",
  "language": "ko"
}
```

## Response

### 200 OK

Binary `audio/mpeg` payload returned as a new Blob URL by the caller.

## Repeat-attempt Rules

- 완료 후 같은 `text`, `voiceId`, `language` 조합으로 다시 호출해도 별도 오디오 생성 요청으로 취급한다.
- 클라이언트는 새 attempt 시작 시 이전 Blob URL 표시를 즉시 숨기고, 새 응답이 오면 교체한다.
- 실패 후 retry도 동일 request body를 재사용할 수 있어야 한다.

## Error Responses

| Status | Meaning |
| --- | --- |
| `400` | 요청 본문 검증 실패 |
| `500` | 서버 설정 오류 |
| `502` | TTS 처리 실패 |
