# Tasks: Vercel 자동 배포 연동

**Input**: Design documents from `/specs/feat/012-vercel-auto-deploy/`
**Prerequisites**: plan.md ✅, spec.md ✅
**Note**: 이 feature는 소스 코드 변경 없음 — Vercel CLI 설정 + 가이드 문서 작성이 주된 작업.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- 의존성 순서: vercel link → Google Console → env vars → 배포 트리거 → 검증

---

## Phase 1: Setup

**Purpose**: 로컬 빌드 무결성 사전 확인 및 Vercel CLI 준비

- [x] T001 [US2] 로컬에서 `npm run build` 실행하여 컴파일·타입 오류 없이 빌드 성공 확인 (프로젝트 루트에서 실행)
- [x] T002 Vercel CLI 설치 확인 또는 설치: `npm i -g vercel && vercel --version`

**Checkpoint**: 로컬 빌드 성공 + Vercel CLI 준비 완료 → Phase 2 진행 가능

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Vercel 프로젝트 연결로 프로덕션 URL 확정 — 이후 모든 설정의 선행 조건

**⚠️ CRITICAL**: 이 단계가 완료되어야 Google Console 등록(US3) 및 배포 검증(US1)이 가능

- [ ] T003 `vercel link` 실행하여 GitHub 저장소와 Vercel 프로젝트 연결 후 프로젝트 이름 및 `https://<project-name>.vercel.app` URL 확정

**Checkpoint**: 프로덕션 URL 확정 → US3 환경변수 설정 및 Google Console 등록 진행 가능

---

## Phase 3: User Story 3 — 프로덕션 환경변수 설정 (Priority: P2)

**Goal**: Vercel 프로젝트에 7개 환경변수를 설정하고 Google OAuth redirect URI를 등록하여 배포 후 모든 핵심 기능(인증, AI 더빙, DB)이 작동하도록 준비한다.

**Independent Test**: 배포된 Production URL에서 Google 로그인 → 더빙 요청 → 결과 다운로드 전체 플로우가 오류 없이 완료되면 검증 완료.

**⚠️ NOTE**: US3은 US1(배포 검증)의 선행 조건 — 환경변수 없이 배포 시 런타임 오류 발생

### Implementation for User Story 3

- [ ] T004 [US3] Google Cloud Console에서 Authorized redirect URIs에 `https://<project-name>.vercel.app/api/auth/callback/google` 등록 (T003 완료 후 URL 확정된 시점에 진행)
- [ ] T005 [P] [US3] `vercel env add ELEVENLABS_API_KEY` 실행하여 Production + Preview 범위로 AI 더빙 API 키 설정
- [ ] T006 [P] [US3] `vercel env add GEMINI_API_KEY` 실행하여 Production + Preview 범위로 Gemini API 키 설정
- [ ] T007 [P] [US3] `vercel env add AUTH_SECRET` 실행하여 Production + Preview + Development 범위로 next-auth 세션 암호화 시크릿 설정
- [ ] T008 [P] [US3] `vercel env add AUTH_GOOGLE_ID` 실행하여 Production + Preview 범위로 Google OAuth Client ID 설정
- [ ] T009 [P] [US3] `vercel env add AUTH_GOOGLE_SECRET` 실행하여 Production + Preview 범위로 Google OAuth Secret 설정
- [ ] T010 [P] [US3] `vercel env add TURSO_DATABASE_URL` 실행하여 Production + Preview 범위로 Turso DB 연결 URL 설정
- [ ] T011 [P] [US3] `vercel env add TURSO_AUTH_TOKEN` 실행하여 Production + Preview 범위로 Turso 인증 토큰 설정

**Checkpoint**: 7개 환경변수 모두 설정 + Google OAuth redirect URI 등록 완료 → US1 배포 트리거 및 검증 진행 가능

---

## Phase 4: User Story 1 — GitHub 푸시 시 자동 배포 트리거 (Priority: P1) 🎯 MVP

**Goal**: `feat/#12-vercel-auto-deploy`를 main에 머지하여 Vercel Native Git Integration을 통한 Production 자동 배포를 트리거하고, 배포 완료 후 전체 플로우를 검증한다.

**Independent Test**: main 브랜치에 푸시(또는 PR 머지) 후 Vercel 대시보드에서 새 배포가 시작되고, Production URL에서 서비스에 접근 가능하면 검증 완료.

**⚠️ NOTE**: T003(vercel link) + T004~T011(env vars) 완료 후 진행

### Implementation for User Story 1

- [ ] T012 [US1] `feat/#12-vercel-auto-deploy` → `main` PR 생성 및 머지하여 Vercel Production 자동 배포 트리거
- [ ] T013 [US1] Vercel 대시보드에서 Production 배포가 5분 이내에 시작되고 성공적으로 완료되는지 확인 (SC-001 검증)
- [ ] T014 [US1] 브라우저에서 `https://<project-name>.vercel.app` 접속하여 프로덕션 URL 100% 가용 상태 확인 (SC-002 검증)
- [ ] T015 [US1] Production URL에서 Google 로그인 → 오디오 파일 업로드 → AI 더빙 요청 → 결과 다운로드 전체 플로우 오류 없이 완료 확인 (SC-003 검증)

**Checkpoint**: Production 자동 배포 동작 + 전체 플로우 검증 완료 → MVP 달성

---

## Phase 5: Polish & 문서화

**Purpose**: 재현 가능한 배포 절차 문서화 및 엣지 케이스 확인

- [x] T016 `docs/vercel-deploy.md` 작성 — 사전 준비 체크리스트, Step-by-step Vercel CLI 가이드(vercel link → Google Console → env vars → 배포 확인 → 검증), 트러블슈팅 섹션 포함
- [ ] T017 [P] feature 브랜치(main 외)에 임의 push하여 Preview 배포 자동 생성 확인 (FR-006 검증)
- [x] T018 [P] `vercel.json` 필요 여부 최종 확인 — Zero-config로 정상 배포 시 불필요, 빌드 오류 발생 시 추가 (`vercel.json` in repository root)

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1: Setup (T001, T002)
  ↓
Phase 2: Foundational (T003) — BLOCKS all other phases
  ↓
Phase 3: US3 Env Vars (T004~T011) — BLOCKS US1 production verification
  ↓
Phase 4: US1 Deploy & Verify (T012~T015) — Production MVP
  ↓
Phase 5: Polish (T016~T018) — Documentation & edge case verification
```

### User Story Dependencies

- **User Story 2 (P2)**: Phase 1 — 의존성 없음, 즉시 시작 가능
- **User Story 3 (P2)**: Phase 2(T003) 완료 후 시작 가능 — US1 검증의 선행 조건
- **User Story 1 (P1)**: Phase 3(T003~T011) 완료 후 시작 가능

### Within Phase 3 (US3)

- T004(Google Console)는 T003(vercel link) 완료 직후 진행
- T005~T011(vercel env add)은 서로 독립적이므로 순서 무관, 병렬 실행 가능

### Parallel Opportunities

- T005~T011: 각각 다른 환경변수 — 동시 실행 가능 (단, 터미널 입력이 필요하므로 순차 실행 현실적)
- T017, T018: 서로 독립적 — 동시 진행 가능

---

## Parallel Example: User Story 3 (Env Vars)

```bash
# T005~T011은 서로 독립적 — 하나씩 순차 실행 (CLI 입력 필요):
vercel env add ELEVENLABS_API_KEY   # T005
vercel env add GEMINI_API_KEY       # T006
vercel env add AUTH_SECRET          # T007
vercel env add AUTH_GOOGLE_ID       # T008
vercel env add AUTH_GOOGLE_SECRET   # T009
vercel env add TURSO_DATABASE_URL   # T010
vercel env add TURSO_AUTH_TOKEN     # T011
```

---

## Implementation Strategy

### MVP First (User Story 1 — Production 자동 배포)

1. Complete Phase 1: Setup (로컬 빌드 확인 + Vercel CLI 준비)
2. Complete Phase 2: Foundational (vercel link → URL 확정)
3. Complete Phase 3: US3 (Google Console + 7개 env vars)
4. Complete Phase 4: US1 (PR 머지 → 자동 배포 → 전체 플로우 검증)
5. **STOP and VALIDATE**: Production URL에서 SC-001~004 모두 충족 확인

### Incremental Delivery

1. T001~T002: 로컬 빌드 무결성 확인 (US2 완료)
2. T003: vercel link → 프로덕션 URL 확정
3. T004~T011: 환경변수 + Google Console → 배포 준비 완료 (US3 완료)
4. T012~T015: 배포 트리거 → 전체 플로우 검증 → **MVP 달성** (US1 완료)
5. T016~T018: 문서화 + 엣지 케이스 검증

---

## Notes

- 이 feature는 소스 코드 변경 없음 — 모든 작업은 CLI 명령 + 문서 작성
- Preview 배포에서 Google OAuth 로그인 미동작은 허용된 제약 (Google Console에 동적 URL 등록 불가)
- vercel env add 실행 시 값을 직접 입력하므로 `.env` 파일 등 시크릿 보관소 사전 준비 권장
- 빌드 실패 알림은 Vercel 기본 이메일만 사용 (별도 Slack/Discord 연동 없음)
- [P] 표시 태스크도 CLI 입력이 필요한 경우 현실적으로 순차 실행
