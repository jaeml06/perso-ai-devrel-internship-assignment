# Vercel 배포 가이드

이 문서는 Perso AI 프로젝트를 Vercel에 연동하고 Production 자동 배포를 구성하는 단계별 가이드입니다.

---

## 사전 준비 체크리스트

배포 전 아래 정보를 준비해주세요:

- [x] Vercel 계정 (https://vercel.com)
- [x] GitHub 저장소 접근 권한
- [x] Google Cloud Console 접근 권한 (OAuth 앱 관리)
- [x] 아래 API 키/시크릿 보관소 준비:
  - `ELEVENLABS_API_KEY` — ElevenLabs AI 더빙 API 키
  - `GEMINI_API_KEY` — Google Gemini AI API 키
  - `AUTH_SECRET` — 랜덤 시크릿 (생성: `openssl rand -base64 32`)
  - `AUTH_GOOGLE_ID` — Google OAuth Client ID
  - `AUTH_GOOGLE_SECRET` — Google OAuth Client Secret
  - `TURSO_DATABASE_URL` — Turso DB 연결 URL (`libsql://...`)
  - `TURSO_AUTH_TOKEN` — Turso 인증 토큰

---

## Step 1 — 로컬 빌드 확인

배포 전 로컬에서 빌드가 정상적으로 완료되는지 확인합니다.

```bash
npm run build
```

**기대 결과**: `✓ Generating static pages (10/10)` 출력 및 오류 없음.

---

## Step 2 — Vercel CLI 설치

```bash
npm i -g vercel
vercel --version  # 설치 확인
```

---

## Step 3 — Vercel 프로젝트 연결 (`vercel link`)

> **중요**: 이 단계에서 Production URL이 확정됩니다. Google Console 등록(Step 4) 전에 반드시 완료하세요.

```bash
vercel link
```

프롬프트 응답 예시:

- `Set up and deploy?` → `N` (설정만 연결, 배포는 나중에)
- `Which scope?` → 본인 계정 선택
- `Link to existing project?` → `N` (신규 프로젝트)
- `What's your project's name?` → `perso-ai` (원하는 이름 입력)
- `In which directory is your code located?` → `./` (기본값)

완료 후 `.vercel/project.json`에 `projectId`와 `orgId`가 저장됩니다.

**프로덕션 URL 확정**: `https://<project-name>.vercel.app`

---

## Step 4 — Google Cloud Console OAuth 설정

> **중요**: Step 3에서 프로젝트 이름을 확정한 후 진행하세요.

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. `APIs & Services` → `Credentials` → OAuth 2.0 클라이언트 선택
3. `Authorized redirect URIs` 섹션에서 아래 URI 추가:
   ```
   https://<project-name>.vercel.app/api/auth/callback/google
   ```
4. `Save` 클릭

> **Preview 배포 제약**: Preview URL은 매번 달라지므로 Google Console에 등록할 수 없습니다. Preview에서 Google OAuth 로그인은 동작하지 않으며, 이는 허용된 제약입니다.

---

## Step 5 — 환경변수 설정 (`vercel env add`)

7개 환경변수를 Vercel 프로젝트에 추가합니다. 각 명령어 실행 후 프롬프트에서 값을 입력하세요.

### AI / 외부 API 키

```bash
# ElevenLabs AI 더빙 API 키 (Production, Preview)
vercel env add ELEVENLABS_API_KEY
# → "Which environments?" 선택: Production, Preview
# → 값 입력 후 Enter

# Gemini AI API 키 (Production, Preview)
vercel env add GEMINI_API_KEY
# → "Which environments?" 선택: Production, Preview
# → 값 입력 후 Enter
```

### 인증 (next-auth v5)

```bash
# 세션 암호화 시크릿 (Production, Preview, Development)
vercel env add AUTH_SECRET
# → "Which environments?" 선택: Production, Preview, Development
# → 값 입력 후 Enter
# (생성: openssl rand -base64 32)

# Google OAuth Client ID (Production, Preview)
vercel env add AUTH_GOOGLE_ID
# → "Which environments?" 선택: Production, Preview
# → 값 입력 후 Enter

# Google OAuth Client Secret (Production, Preview)
vercel env add AUTH_GOOGLE_SECRET
# → "Which environments?" 선택: Production, Preview
# → 값 입력 후 Enter
```

### 데이터베이스 (Turso)

```bash
# Turso DB 연결 URL (Production, Preview)
vercel env add TURSO_DATABASE_URL
# → "Which environments?" 선택: Production, Preview
# → 값 입력 후 Enter (형식: libsql://...)

# Turso 인증 토큰 (Production, Preview)
vercel env add TURSO_AUTH_TOKEN
# → "Which environments?" 선택: Production, Preview
# → 값 입력 후 Enter
```

### 설정 확인

```bash
vercel env ls
```

7개 변수가 모두 표시되면 완료입니다.

---

## Step 6 — GitHub PR 머지 → 자동 배포 트리거

`feat/#12-vercel-auto-deploy` 브랜치를 `main`에 머지하면 Vercel이 자동으로 Production 배포를 시작합니다.

```bash
# PR 생성 (GitHub CLI 사용)
gh pr create --base main --title "feat: Vercel 자동 배포 연동"

# 또는 GitHub 웹에서 PR 생성 후 머지
```

---

## Step 7 — 배포 확인

1. [Vercel 대시보드](https://vercel.com/dashboard)에서 프로젝트 선택
2. `Deployments` 탭에서 새 배포가 시작되었는지 확인
3. 상태가 `Ready`로 바뀔 때까지 대기 (보통 2~5분)

---

## Step 8 — 배포 후 전체 플로우 검증

Production URL(`https://<project-name>.vercel.app`)에서 아래 플로우를 순서대로 검증합니다:

- [x] **SC-001**: 브라우저에서 Production URL 접속 → 정상 로드 확인
- [x] **SC-002**: Google 로그인 버튼 클릭 → OAuth 팝업 → 로그인 성공 후 대시보드 이동
- [x] **SC-003**: 오디오 파일 업로드 → AI 더빙 요청 → 결과 다운로드 오류 없이 완료
- [x] **SC-004**: main 머지 후 5분 이내 Production 배포 완료 확인 (Vercel 대시보드)

---

## Preview 배포 확인 (선택)

`main` 외 브랜치에 push하면 Preview 배포가 자동 생성됩니다:

```bash
git checkout -b test/preview-check
git commit --allow-empty -m "test: Preview 배포 확인"
git push origin test/preview-check
```

Vercel 대시보드 → `Deployments`에서 Preview URL 확인. (Google OAuth 로그인은 Preview에서 동작하지 않음)

---

## 트러블슈팅

### 빌드 실패

**증상**: Vercel 대시보드에서 배포 상태 `Error`

1. Vercel 대시보드 → `Deployments` → 실패한 배포 클릭 → `Build Logs` 확인
2. 로컬에서 재현: `npm run build`
3. TypeScript 오류인 경우: `npx tsc --noEmit`으로 타입 오류 확인

### 환경변수 누락으로 런타임 오류

**증상**: 배포는 성공했지만 특정 기능 동작 안 함 (500 오류, API 실패)

1. `vercel env ls`로 7개 변수 모두 설정되었는지 확인
2. 환경 범위 확인 (Production/Preview/Development)
3. 변수 추가 후 재배포 필요: Vercel 대시보드 → `Redeploy`

### Google OAuth 오류 (`redirect_uri_mismatch`)

**증상**: Google 로그인 시 `Error 400: redirect_uri_mismatch`

1. Google Cloud Console에서 등록된 redirect URI 확인
2. 형식 확인: `https://<project-name>.vercel.app/api/auth/callback/google`
3. 오타 없이 정확히 일치하는지 확인 (trailing slash 없음)

### Preview에서 Google 로그인 실패

이는 정상 동작입니다. Preview URL은 동적으로 생성되어 Google Console에 사전 등록이 불가능합니다. 전체 플로우는 Production에서만 검증하세요.

### Vercel CLI `vercel link` 실패

```bash
vercel logout
vercel login
vercel link
```

---

## 참고

- **Vercel 대시보드**: https://vercel.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com
- **Auth.js v5 문서**: https://authjs.dev/getting-started/deployment
- **빌드 실패 알림**: Vercel 기본 이메일 알림 사용 (별도 Slack/Discord 연동 없음)
