# 인턴 과제 수행 태스크 (Task Checklist)

## PR 1: Next.js 초기 세팅 및 FSD 아키텍처 기반 설정

- [ ] 1. Next.js App Router 프로젝트 초기화 및 Tailwind CSS 세팅 (`npx create-next-app@latest`).
- [ ] 2. `vercel-react-best-practices` 및 `web-design-guidelines` 스킬 분석 및 적용 준비.
- [ ] 3. FSD(Feature-Sliced Design) 아키텍처에 맞춘 디렉토리 기반 구조 설정 (`app/`, `features/`, `entities/`, `shared/` 등).
- [ ] 4. 글로벌 디자인 시스템 토큰 생성 및 공통 레이아웃 셸(Shell) 구성 (`shared/ui/`).

## PR 2: AI 더빙 코어 기능 구현 (ElevenLabs API)

- [ ] 1. 오디오/비디오 파일 업로드 UI 및 타겟 언어 선택 인터페이스 구현 (`features/dubbing-create/ui/DubbingDashboard.tsx`).
- [ ] 2. 서버 사이드 ElevenLabs API를 활용한 음성 추출 및 전사(Speech-to-Text) 로직 구현 (`entities/dubbing/api/transcribeSpeech.ts`).
- [ ] 3. 전사된 텍스트를 타겟 언어로 번역하는 AI 번역 로직 구현 (`entities/dubbing/api/translateText.ts`).
- [ ] 4. 번역된 텍스트를 타겟 언어 음성으로 합성하는 ElevenLabs TTS 로직 구현 (`entities/dubbing/api/synthesizeSpeech.ts`).
- [ ] 5. 더빙 생성 폼(파일 업로드, 언어 선택, 상태 관리, 로딩 처리 등) 비즈니스 로직 훅 구현 (`features/dubbing-create/model/useDubbingForm.ts`).
- [ ] 6. 더빙된 결과물 재생 Audio Player UI 및 다운로드 기능 구현 (`features/dubbing-view/ui/AudioPlayer.tsx`).

## PR 3: 인증 시스템 및 Turso DB 세팅 (Google OAuth + Whitelist 제어)

- [ ] 1. Turso DB 환경 변수 설정 및 스키마/접속 클라이언트(`@libsql/client`) 구성. (이메일 화이트리스트 `users` 스키마 검증용)
- [ ] 2. NextAuth (Auth.js)를 활용한 Google OAuth 로그인 연동 설정.
- [ ] 3. 화이트리스트 기반 미들웨어/라우트 보호 로직 구현 (지정된 이메일만 허용 처리, `kts123@estsoft.com` 필수 포함).
- [ ] 4. 로그인 페이지 및 인가되지 않은 사용자를 위한 접근 차단(Blocked Access) 페이지 UI 퍼블리싱.

## PR 4: UI 폴리싱, Vercel 배포 준비 및 정리 (README.md)

- [ ] 1. UI/UX 개선 (반응형 모바일/데스크톱 레이아웃 최적화, 모션/애니메이션 추가, 로딩 및 에러 화면 최적화).
- [ ] 2. Vercel 배포를 위한 로컬 빌드 무결성 점검 (`npm run build`).
- [ ] 3. 프로젝트 개요, 기술 스택 선정 이유, _에이전트 주도적 활용 경험 및 문제해결 과정_, 로컬 환경 셋업 방법 등을 담은 고품질 `README.md` 작성.
- [ ] 4. 문서화 완료 및 최종 소스코드 레포지토리 제출 점검.
