# Implementation Plan: Vercel 자동 배포 연동

**Branch**: `feat/#12-vercel-auto-deploy` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)

## Summary

Vercel CLI로 프로젝트를 연결하고 환경변수를 설정하여 main 브랜치 push/PR 머지 시 Production 자동 배포, 그 외 브랜치는 Preview 배포가 동작하도록 구성한다. Google OAuth redirect URI는 `vercel link`로 프로젝트 이름 확정 후 사전 등록하여 순서 문제를 해결한다. 코드 변경 없이 CLI 설정 + 가이드 문서 작성이 주된 작업이다.

## Technical Context

**Language/Version**: TypeScript 5 + Next.js 16.1.6 (App Router)
**Primary Dependencies**: next, next-auth@beta, @libsql/client, @google/genai
**Storage**: Turso (libSQL) — 화이트리스트 이메일 관리
**Testing**: Vitest (unit), 수동 E2E (배포 후 Production 플로우 검증)
**Target Platform**: Vercel (서버리스, Node.js 런타임)
**Project Type**: Single Next.js web application (`src/` 단일 구조)
**Performance Goals**: main push/PR 머지 후 5분 이내 배포 완료 (SC-001)
**Constraints**: Vercel 무료 플랜 서버리스 함수 실행 제한 준수. Preview 배포에서 Google OAuth 미동작 허용.
**Scale/Scope**: 소규모 서비스, 단일 팀 운영

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

이 feature는 **인프라/배포 설정 + 문서화** 작업으로 소스 코드를 신규 추가하지 않는다.

| Gate | Status | Notes |
|---|---|---|
| FSD 레이어 준수 | ✅ PASS | 신규 UI/로직 코드 없음 |
| 배럴 export 없음 | ✅ PASS | 신규 파일 없음 |
| 단방향 의존성 | ✅ PASS | 신규 파일 없음 |
| 로컬 빌드 (`npm run build`) | ✅ PASS | 오류 없이 성공 (10개 라우트, Turbopack, 3.0s) |

**결론**: 모든 게이트 통과.

## Project Structure

### Documentation (this feature)

```text
specs/feat/012-vercel-auto-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output — Vercel 연동 가이드
└── tasks.md             # Phase 2 output (/speckits:tasks 커맨드)
```

### Source Code (repository root)

```text
# 기존 구조 유지 — 신규 소스 파일 없음
src/                     # 기존 코드 변경 없음

# 신규 추가 파일
vercel.json              # (research 결과에 따라 필요 시) 빌드 설정 override
docs/
└── vercel-deploy.md     # Vercel CLI 기반 연동 단계별 가이드
```

**Structure Decision**: 배포 인프라 feature이므로 FSD 소스 구조 변경 없음. 신규 파일은 `vercel.json`(필요 시)과 `docs/vercel-deploy.md`로 한정.

## Phase 0 — Outline & Research

### Unknowns

1. **`vercel.json` 필요 여부**: Next.js 16 + Turbopack 프로젝트가 Vercel에서 Zero-config로 동작하는지 확인 (Turbopack은 dev 전용이므로 프로덕션 빌드에 영향 없을 것으로 예상).
2. **환경변수 서버/클라이언트 범위**: `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `AUTH_*`, `TURSO_*` 모두 서버 전용인지 — `vercel env add` 시 "Sensitive" 설정 여부.
3. **`AUTH_URL` 필요 여부**: next-auth@beta(Auth.js v5)가 Vercel 환경에서 `AUTH_URL`을 요구하는지, 아니면 자동 감지하는지.

### Research Tasks

| Unknown | Research Method | Output |
|---|---|---|
| `vercel.json` 필요 여부 | Vercel Next.js 배포 가이드 확인 | research.md §1 |
| 환경변수 범위 | next-auth v5 Vercel 배포 문서 확인 | research.md §2 |
| `AUTH_URL` 필요 여부 | Auth.js v5 공식 문서 확인 | research.md §3 |

## Phase 1 — Design & Contracts

### Data Model

해당 없음. DB 스키마/API 엔드포인트 변경 없음.

### 배포 설정 순서 (의존성 고려)

Google OAuth redirect URI 문제를 해결하기 위해 아래 순서를 엄격히 따른다:

```
① vercel link
   → 프로젝트 이름 확정 → https://<project-name>.vercel.app URL 확정

② Google Cloud Console
   → Authorized redirect URIs에 추가:
     https://<project-name>.vercel.app/api/auth/callback/google

③ vercel env add (7개 환경변수 설정)
   → Production + Preview + Development 범위 각각 설정

④ git push origin main 또는 PR 머지
   → Vercel Production 자동 배포 트리거

⑤ Production URL에서 전체 플로우 검증
   → Google 로그인 → 더빙 → 결과 다운로드
```

### 환경변수 목록

| 변수명 | 범위 | 용도 |
|---|---|---|
| `ELEVENLABS_API_KEY` | Production, Preview | AI 더빙 API |
| `GEMINI_API_KEY` | Production, Preview | Gemini AI API |
| `AUTH_SECRET` | Production, Preview, Development | next-auth 세션 암호화 |
| `AUTH_GOOGLE_ID` | Production, Preview | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Production, Preview | Google OAuth Secret |
| `TURSO_DATABASE_URL` | Production, Preview | Turso DB 연결 URL |
| `TURSO_AUTH_TOKEN` | Production, Preview | Turso 인증 토큰 |

### Preview 배포 제약

- Preview URL(`<project>-<hash>.vercel.app`)은 매번 달라져 Google Console 등록 불가
- **Preview에서 Google OAuth 로그인 미동작** — 허용된 제약
- Preview는 UI 시각 확인 용도로만 사용, 전체 플로우 검증은 Production에서만 진행

### Deliverable: `docs/vercel-deploy.md` 구성

1. **사전 준비 체크리스트**: 필요한 API 키 목록, Vercel CLI 설치 (`npm i -g vercel`)
2. **Step 1 — vercel link**: 프로젝트 연결 + 프로젝트 이름 확정
3. **Step 2 — Google Console 설정**: redirect URI 등록 (URL 확정 후 진행)
4. **Step 3 — 환경변수 설정**: `vercel env add` 명령어로 각 변수 설정
5. **Step 4 — 배포 확인**: PR 머지 → Production 자동 배포 확인
6. **Step 5 — 배포 후 검증**: 전체 플로우 테스트 체크리스트
7. **트러블슈팅**: 빌드 실패, 환경변수 누락, OAuth 오류 대응

### Architecture Decision Table

| Decision | Options | Chosen | Rationale |
|---|---|---|---|
| 배포 메커니즘 | GitHub Actions vs Vercel Native Git Integration | **Vercel Native Git Integration** | 스펙 결정. 추가 설정 불필요, Next.js 자동 감지. |
| 설정 방식 | 대시보드 수동 vs Vercel CLI | **Vercel CLI** (`vercel link`, `vercel env add`) | 재현 가능하고 문서화하기 용이. GitHub App 승인(1회)만 브라우저 필요. |
| OAuth redirect URI 순서 | 배포 후 등록 vs 프로젝트명 확정 후 사전 등록 | **프로젝트명 확정 후 사전 등록** | `vercel link` 시 URL이 확정되므로 배포 전 Google Console 등록 가능. |
| Preview OAuth | 와일드카드 등록 시도 vs 제약 허용 | **제약 허용** | Google Console이 와일드카드 미지원. Preview는 UI 확인 용도로만 사용. |
| 빌드 실패 알림 | Slack/Discord vs Vercel 기본 이메일 | **Vercel 기본 이메일** | 스펙 결정. 추가 연동 불필요. |
| vercel.json | Zero-config vs 명시적 설정 | **Zero-config 우선 (Research 후 결정)** | Next.js 16은 Vercel에서 자동 감지. |

## Complexity Tracking

> Constitution Check 위반 없음 — 해당 없음
