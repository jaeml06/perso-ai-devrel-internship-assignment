# Data Model: 인증 시스템 및 화이트리스트 접근 제어

**Branch**: `feat/#5-auth-whitelist` | **Date**: 2026-03-10

## Entities

### AllowedUser (화이트리스트 사용자)

Turso DB 테이블: `allowed_users`

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 고유 식별자 |
| email | TEXT | NOT NULL, UNIQUE | 허용된 이메일 주소 |
| name | TEXT | nullable | 사용자 이름 (선택) |
| created_at | TEXT | DEFAULT datetime('now') | 등록 일시 |

#### SQL DDL

```sql
CREATE TABLE IF NOT EXISTS allowed_users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  name       TEXT,
  created_at TEXT    DEFAULT (datetime('now'))
);
```

#### Seed Data (FR-006)

```sql
INSERT OR IGNORE INTO allowed_users (email, name) VALUES ('kts123@estsoft.com', '관리자');
```

### Session (NextAuth JWT)

NextAuth v5 JWT 전략 사용 — DB 저장 없음.

| Field | Type | Source | Description |
| --- | --- | --- | --- |
| user.id | string | Google OAuth `sub` claim | 사용자 고유 ID |
| user.email | string | Google OAuth profile | 이메일 주소 |
| user.name | string | Google OAuth profile | 표시 이름 |
| user.image | string | Google OAuth profile | 프로필 이미지 URL |
| expires | string | NextAuth JWT expiry | 세션 만료 시점 (ISO 8601) |

## TypeScript DTO 정의

### `src/entities/user/dto/user.dto.ts`

```typescript
export interface AllowedUser {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}
```

## Entity Relationships

```text
AllowedUser (Turso DB)
  └── email ──matches──> Google OAuth profile.email
                            └── Session (JWT, in-memory)
                                  └── 보호된 페이지 접근 허용
```

## Data Flow

1. 사용자가 Google OAuth 로그인 완료
2. NextAuth `signIn` callback에서 `profile.email` 추출
3. `isEmailWhitelisted(email)` → Turso `allowed_users` 테이블 조회
4. 존재하면 `true` → JWT 세션 생성 → `/dashboard` 리다이렉트
5. 미존재하면 `false` → `/unauthorized` 리다이렉트
