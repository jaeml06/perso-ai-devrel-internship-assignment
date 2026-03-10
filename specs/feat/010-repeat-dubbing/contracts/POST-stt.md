# Contract: POST /api/stt

**Purpose**: 반복 더빙 생성 시에도 매 attempt마다 업로드 파일을 새 STT 작업으로 전사한다  
**Layer**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/app/api/stt/route.ts`  
**Caller**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/entities/dubbing/api/transcribeFile.ts`

## Request

**Method**: `POST`  
**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | File | ✅ | 현재 attempt에 선택된 오디오/비디오 파일 |

## Response

### 200 OK

```json
{
  "text": "Hello, this is a test recording.",
  "languageCode": "en",
  "languageProbability": 0.99
}
```

## Repeat-attempt Rules

- 완료 후 같은 파일로 다시 요청해도 새 STT 요청으로 처리한다.
- 실패 후 retry가 호출되어도 동일한 request schema를 그대로 사용한다.
- 클라이언트는 이전 attempt의 STT 결과를 재사용하지 않고 항상 새 요청을 보낸다.

## Error Responses

| Status | Meaning |
| --- | --- |
| `400` | 파일 누락 또는 전사 결과가 비어 있음 |
| `429` | 크레딧 부족 |
| `500` | 서버 설정 오류 |
| `502` | STT 처리 실패 |
| `503` | 외부 인증/가용성 문제 |
