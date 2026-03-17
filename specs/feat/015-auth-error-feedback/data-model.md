# Data Model: 로그인 오류 원인 구분 안내

**Phase**: 1 — Design & Contracts
**Branch**: `feat/#15-auth-error-feedback`

## 엔티티 및 타입 정의

### AuthErrorType (신규)

```typescript
// src/features/auth-login/lib/authErrorType.ts
export type AuthErrorType = 'not_whitelisted' | 'server_error' | 'no_email';
```

**출처**: spec.md Assumptions — "쿼리 파라미터 값에 따라 표시 메시지를 달리한다"
**사용처**: `checkWhitelist.ts` (URL 생성 시), `UnauthorizedPage.tsx` (메시지 분기 시)

---

### AuthSignInResult (변경)

`checkWhitelist.ts`의 반환 타입 변경:

```typescript
// 기존
Promise<boolean>

// 변경 후
Promise<true | `/unauthorized?error=${AuthErrorType}`>
```

실제 반환 값:
| 조건 | 반환값 |
|------|--------|
| 화이트리스트 등록됨 | `true` |
| 화이트리스트 미등록 | `"/unauthorized?error=not_whitelisted"` |
| DB / 서버 오류 | `"/unauthorized?error=server_error"` |
| 이메일 미제공 | `"/unauthorized?error=no_email"` |

---

### 오류 메시지 매핑

| `error` 쿼리 파라미터 | 제목 | 본문 메시지 |
|---|---|---|
| `not_whitelisted` | 접근이 제한된 페이지입니다 | 이 서비스는 허가된 사용자만 이용할 수 있습니다. 이메일 화이트리스트에 등록된 계정으로 로그인해 주세요. |
| `server_error` | 일시적인 서비스 오류입니다 | 서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해 주세요. |
| `no_email` | 이메일 정보를 확인할 수 없습니다 | Google 계정에서 이메일 정보를 가져올 수 없습니다. Google 계정 설정을 확인해 주세요. |
| (없음 / 기타) | 접근이 제한된 페이지입니다 | 이 서비스는 허가된 사용자만 이용할 수 있습니다. (fallback) |

---

### 서버 로그 구조

DB 오류 발생 시 기록 (이메일 등 PII 미포함):

```
[auth][server_error] 2026-03-17T10:30:00.000Z DB query failed: Error: Connection timeout
```

포맷: `[auth][${errorType}] ${new Date().toISOString()} ${errorMessage}`
