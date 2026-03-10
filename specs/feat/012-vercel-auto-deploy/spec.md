# Feature Specification: Vercel 자동 배포 연동

**Feature Branch**: `feat/#12-vercel-auto-deploy`
**Created**: 2026-03-10
**Status**: Draft
**GitHub Issue**: #12

## User Scenarios & Testing _(mandatory)_

### User Story 1 - GitHub 푸시 시 자동 배포 트리거 (Priority: P1)

개발자가 main 브랜치에 코드를 푸시하면, 별도의 수동 개입 없이 Vercel에 자동으로 새 버전이 배포된다.

**Why this priority**: 배포 자동화의 핵심 기능으로, 수동 배포의 번거로움을 제거하고 개발 사이클을 단축시킨다. 이 기능이 없으면 나머지 배포 관련 기능이 의미가 없다.

**Independent Test**: main 브랜치에 임의의 코드 변경을 커밋·푸시(또는 PR 머지)한 후, Vercel 대시보드에서 새 배포가 시작되는지 확인하면 독립적으로 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 개발자가 main 브랜치에 코드 변경을 완료했을 때, **When** `git push origin main` 또는 PR을 main에 머지하면, **Then** 수분 이내에 Vercel에서 자동 빌드 및 배포가 시작된다
2. **Given** Vercel 배포가 완료됐을 때, **When** 프로덕션 URL에 접속하면, **Then** 최신 코드가 반영된 서비스에 접근할 수 있다
3. **Given** 빌드 중 오류가 발생했을 때, **When** 배포가 실패하면, **Then** 이전 성공한 버전이 계속 서비스되며 빌드 실패 알림이 발생한다

---

### User Story 2 - 로컬 빌드 무결성 사전 검증 (Priority: P2)

배포 전 로컬 환경에서 `npm run build`를 실행하여 빌드 오류 없이 프로덕션 빌드가 성공하는지 확인한다.

**Why this priority**: Vercel 자동 배포 전에 빌드 오류를 사전에 발견하여 배포 실패를 방지한다. 배포 파이프라인의 신뢰성을 높이는 선행 단계다.

**Independent Test**: 로컬에서 `npm run build`를 실행하여 오류 없이 완료되는지 확인하면 독립적으로 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 현재 프로젝트 코드베이스가 있을 때, **When** 빌드 명령어를 실행하면, **Then** 컴파일 오류나 타입 오류 없이 빌드가 완료된다
2. **Given** 빌드가 성공했을 때, **When** 빌드 결과물을 확인하면, **Then** 프로덕션 최적화된 정적 파일들이 생성된다

---

### User Story 3 - 프로덕션 환경변수 설정 (Priority: P2)

Vercel 프로젝트에 필요한 모든 환경변수(ElevenLabs API Key, Google OAuth 시크릿, Turso DB URL 등)가 올바르게 설정되어 서비스가 정상 작동한다.

**Why this priority**: 환경변수가 누락되면 배포 후 서비스 핵심 기능(AI 더빙, 인증, DB)이 동작하지 않는다. 빌드 자체는 성공하더라도 런타임에서 실패한다.

**Independent Test**: 배포된 URL에서 로그인 → 더빙 기능 → 결과 확인 전체 플로우를 실행하여 오류 없이 작동하면 검증 완료다.

**Acceptance Scenarios**:

1. **Given** Vercel 대시보드에 환경변수가 설정됐을 때, **When** 배포된 서비스에서 Google 로그인을 시도하면, **Then** OAuth 인증이 정상적으로 처리된다
2. **Given** 인증된 사용자가 배포 서비스에 접속했을 때, **When** 오디오 파일을 업로드하여 더빙을 요청하면, **Then** ElevenLabs API를 통해 더빙 결과가 반환된다
3. **Given** 환경변수가 누락됐을 때, **When** 관련 기능에 접근하면, **Then** 서버가 크래시되지 않고 사용자에게 명확한 에러 메시지가 표시된다

---

### Edge Cases

- GitHub 푸시 후 Vercel 빌드가 10분 이상 진행되지 않는 경우
- 빌드는 성공했지만 런타임 환경변수 누락으로 인해 특정 기능만 실패하는 경우
- main 브랜치가 아닌 feature 브랜치에 푸시했을 때 (Preview 배포만 생성되어야 함)
- 이전 배포 버전으로 롤백이 필요한 경우
- Preview 배포 URL에서 Google OAuth 로그인 시도 시 — Google Console에 등록되지 않은 URL이므로 로그인 불가 (허용된 제약, Preview는 UI 확인 용도로만 사용)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST 로컬 `npm run build` 실행 시 오류 없이 빌드가 완료되어야 한다
- **FR-002**: System MUST GitHub 저장소와 Vercel 프로젝트가 연동되어 main 브랜치 푸시 또는 PR 머지 시 자동 배포가 트리거되어야 한다
- **FR-003**: System MUST 배포 완료 후 프로덕션 URL로 서비스가 실제로 접근 가능해야 한다
- **FR-004**: System MUST Vercel 프로젝트에 모든 필수 환경변수(API 키, OAuth 시크릿, DB 연결 정보)가 설정되어야 한다
- **FR-005**: System MUST 배포된 서비스에서 Google OAuth 로그인, AI 더빙, Turso DB 연동이 모두 정상 작동해야 한다
- **FR-006**: System MUST main 외 모든 브랜치(feat/\*, fix/\*, refactor/\* 등) 푸시 시 Preview 배포가 자동 생성되고, main 브랜치만 프로덕션으로 배포되어야 한다

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: main 브랜치에 푸시 후 5분 이내에 Vercel 자동 배포가 완료된다
- **SC-002**: 프로덕션 URL이 100% 가용 상태로 외부에서 접근 가능하다
- **SC-003**: 배포된 서비스에서 Google 로그인 → 더빙 파이프라인 → 결과 다운로드 전체 플로우가 오류 없이 완료된다
- **SC-004**: 로컬 빌드(`npm run build`)가 오류 없이 성공적으로 완료된다

## Clarifications

### Session 2026-03-10

- Q: 배포 자동화는 Vercel 대시보드에서 수동으로 설정하는가, 아니면 코드로 관리하는가? → A: Vercel CLI로 프로젝트 연결 및 환경변수 설정, GitHub App 승인(1회)만 브라우저에서 처리. 코드베이스에는 설정 가이드 문서를 작성한다.
- Q: 빌드 검증은 어느 브랜치 기준인가? → A: 현재 브랜치(feat/#12-vercel-auto-deploy) 기준으로 빌드 검증 진행
- Q: 배포 자동화 메커니즘은 GitHub Actions를 사용하는가, Vercel Native Git Integration을 사용하는가? → A: Vercel Native Git Integration만 사용 — `vercel link`로 GitHub repo 연동 후 main 푸시/PR 머지 시 프로덕션 자동 배포, main 외 모든 브랜치(feat/\*, fix/\*, refactor/\* 등) 푸시 시 Preview 배포 자동 생성. GitHub Actions 불필요.
- Q: 빌드 실패 시 알림 방식은 무엇인가? → A: Vercel 기본 이메일 알림만 사용 (별도 Slack/Discord 연동 없음)
- Q: Google OAuth redirect URI 설정 순서 문제(배포 URL을 사전에 알 수 없는 문제)는 어떻게 해결하는가? → A: `vercel link` 실행 시 프로젝트 이름이 확정되어 `<project-name>.vercel.app` URL이 예측 가능해진다. 따라서 순서는 ① vercel link로 프로젝트 이름 확정 → ② Google Cloud Console에 `https://<project-name>.vercel.app/api/auth/callback/google` 등록 → ③ 환경변수 설정 → ④ 배포.
- Q: PR 머지도 Production 배포를 트리거하는가? → A: 그렇다. PR 머지는 main 브랜치에 머지 커밋을 push하는 것과 동일하므로 Vercel이 Production 배포를 자동 트리거한다.
- Q: Preview 배포에서 Google OAuth 로그인이 동작하는가? → A: 동작하지 않는다. Preview URL(`<project>-<hash>.vercel.app`)은 매번 달라지므로 Google Console에 등록 불가. Preview는 UI 시각 확인 용도로만 사용하며, 전체 플로우 검증은 Production에서만 진행한다.

## Assumptions

- Vercel 계정이 이미 생성되어 있으며 GitHub 저장소에 접근 권한이 있다
- 필요한 외부 서비스(ElevenLabs, Google OAuth, Turso) API 키 및 시크릿이 이미 발급되어 있다
- 프로덕션 배포 브랜치는 `main`으로 설정된다
- Vercel 무료 플랜을 사용하며 서버리스 함수 실행 제한 내에서 운영된다
- Preview 배포에서 Google OAuth 로그인이 동작하지 않는 것은 허용된 제약이다 (Production에서만 전체 플로우 검증)
- `vercel link` 실행 시 확정된 프로젝트 이름으로 `<project-name>.vercel.app` URL이 결정되며, 이를 Google Cloud Console에 사전 등록한다
