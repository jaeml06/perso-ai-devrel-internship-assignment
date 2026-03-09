# Contract: GET /api/voices

**Method**: GET
**Path**: `/api/voices`
**Location**: `src/app/api/voices/route.ts`
**Auth**: 없음 (인증은 PR3에서 구현)

---

## Request

```http
GET /api/voices HTTP/1.1
```

파라미터 없음.

---

## Success Response

**Status**: `200 OK`
**Content-Type**: `application/json`

```json
{
  "voices": [
    {
      "id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "gender": "female",
      "ageGroup": "young",
      "previewUrl": "https://storage.googleapis.com/eleven-public-prod/voices/21m00Tcm4TlvDq8ikWAM/21m00Tcm4TlvDq8ikWAM.mp3",
      "description": "젊은 여성 · 차분하고 명확한 발음"
    },
    {
      "id": "TxGEqnHWrfWFTfGW9XjX",
      "name": "Josh",
      "gender": "male",
      "ageGroup": "young",
      "previewUrl": "https://storage.googleapis.com/eleven-public-prod/voices/TxGEqnHWrfWFTfGW9XjX/TxGEqnHWrfWFTfGW9XjX.mp3",
      "description": "젊은 남성 · 자연스럽고 친근한 목소리"
    },
    {
      "id": "pNInz6obpgDQGcFmaJgB",
      "name": "Adam",
      "gender": "male",
      "ageGroup": "middle",
      "previewUrl": "https://storage.googleapis.com/eleven-public-prod/voices/pNInz6obpgDQGcFmaJgB/pNInz6obpgDQGcFmaJgB.mp3",
      "description": "중년 남성 · 깊고 안정적인 목소리"
    },
    {
      "id": "EXAVITQu4vr4xnSDxMaL",
      "name": "Bella",
      "gender": "female",
      "ageGroup": "young",
      "previewUrl": "https://storage.googleapis.com/eleven-public-prod/voices/EXAVITQu4vr4xnSDxMaL/EXAVITQu4vr4xnSDxMaL.mp3",
      "description": "젊은 여성 · 활기차고 에너지 넘치는 목소리"
    },
    {
      "id": "MF3mGyEYCl7XYWbV9V6O",
      "name": "Elli",
      "gender": "female",
      "ageGroup": "young",
      "previewUrl": "https://storage.googleapis.com/eleven-public-prod/voices/MF3mGyEYCl7XYWbV9V6O/MF3mGyEYCl7XYWbV9V6O.mp3",
      "description": "젊은 여성 · 따뜻하고 감성적인 목소리"
    },
    {
      "id": "ThT5KcBeYPX3keUQqHPh",
      "name": "Dorothy",
      "gender": "female",
      "ageGroup": "middle",
      "previewUrl": "https://storage.googleapis.com/eleven-public-prod/voices/ThT5KcBeYPX3keUQqHPh/ThT5KcBeYPX3keUQqHPh.mp3",
      "description": "중년 여성 · 차분하고 신뢰감 있는 목소리"
    }
  ]
}
```

---

## Error Response

이 엔드포인트는 정적 데이터를 반환하므로 에러 없음. 예외: 서버 오류 시 500.

---

## Consumer

- `src/entities/voice/api/getVoices.ts` — ky로 이 엔드포인트 호출
- `src/features/dubbing-create/model/useDubbingCreate.ts` — 마운트 시 음성 목록 로드

---

## TDD Tests

```typescript
// src/__tests__/app/api/voices.route.test.ts
import { GET } from '@/app/api/voices/route';

describe('GET /api/voices', () => {
  it('200 상태코드를 반환한다', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('6개의 음성 목록을 반환한다', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.voices).toHaveLength(6);
  });

  it('각 음성은 필수 필드를 포함한다', async () => {
    const res = await GET();
    const data = await res.json();
    data.voices.forEach((voice: Voice) => {
      expect(voice).toHaveProperty('id');
      expect(voice).toHaveProperty('name');
      expect(voice).toHaveProperty('gender');
      expect(voice).toHaveProperty('ageGroup');
      expect(voice).toHaveProperty('previewUrl');
      expect(voice).toHaveProperty('description');
    });
  });

  it('성별: female과 male이 모두 포함된다', async () => {
    const res = await GET();
    const data = await res.json();
    const genders = data.voices.map((v: Voice) => v.gender);
    expect(genders).toContain('female');
    expect(genders).toContain('male');
  });

  it('나이대: young과 middle이 모두 포함된다', async () => {
    const res = await GET();
    const data = await res.json();
    const ageGroups = data.voices.map((v: Voice) => v.ageGroup);
    expect(ageGroups).toContain('young');
    expect(ageGroups).toContain('middle');
  });
});
```
