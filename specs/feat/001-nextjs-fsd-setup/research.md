# Research: Next.js 초기 세팅 및 FSD 아키텍처 기반 설정

**Date**: 2026-03-09
**Feature**: [spec.md](./spec.md)

## Research Topics

### 1. FSD 아키텍처 + Next.js App Router 통합

**Decision**: `src/` 내부에 FSD 계층을 배치하되, `app/` 디렉토리는 Next.js 라우팅 전용으로 유지

**Rationale**:
- Next.js App Router는 `app/` 디렉토리를 파일 기반 라우팅에 사용
- FSD에서 `app` 계층은 "앱 전체 설정"을 의미하지만, Next.js의 `app/`과 역할이 겹침
- 해결: `app/`은 Next.js 라우팅 + 레이아웃만 담당하고, 페이지 컴포넌트의 실제 구현은 `features/` 계층에 배치
- `app/page.tsx`는 thin wrapper로만 동작 (features의 Page 컴포넌트를 import하여 렌더링)

**Alternatives considered**:
- `app/` 내부에 FSD 구조 중첩 → 라우팅과 비즈니스 로직 혼재, 관심사 분리 실패
- `pages/` (Pages Router) 사용 → 과제에서 최신 기술 활용이 유리, App Router가 표준

### 2. Tailwind CSS v4 디자인 토큰 전략

**Decision**: CSS 변수(`@theme`)를 활용한 디자인 토큰 정의

**Rationale**:
- Tailwind CSS v4는 CSS-first 설정 방식으로 전환됨
- `tailwind.config.js` 대신 `globals.css`에서 `@theme` 블록으로 커스텀 토큰 정의
- CSS 변수 기반이므로 서버/클라이언트 컴포넌트 양쪽에서 접근 가능
- 런타임 오버헤드 없음

**Alternatives considered**:
- JavaScript 기반 토큰 파일 → Tailwind v4와 이중 관리, 불필요한 복잡성
- `tailwind.config.ts` 확장 → v4에서는 CSS-first가 권장 패턴

### 3. cn() 유틸리티 함수 구성

**Decision**: `clsx` + `tailwind-merge`를 결합한 `cn()` 함수

**Rationale**:
- `clsx`: 조건부 클래스 결합에 최적화
- `tailwind-merge`: Tailwind 클래스 충돌 자동 해결 (e.g., `px-2 px-4` → `px-4`)
- shadcn/ui 등 커뮤니티 표준 패턴으로 널리 사용됨
- 구현이 단순함 (3줄 함수)

**Alternatives considered**:
- `clsx`만 사용 → Tailwind 클래스 충돌 시 예상치 못한 스타일 적용
- `classnames` 패키지 → `clsx`보다 번들 크기가 큼

### 4. 테스트 전략 (Vitest + RTL)

**Decision**: Vitest를 테스트 러너로, React Testing Library를 컴포넌트 테스트에 사용

**Rationale**:
- Vitest: Vite 기반으로 빠른 실행 속도, ESM 네이티브 지원, Jest 호환 API
- React Testing Library: 사용자 관점 테스트, React 공식 권장
- Next.js의 서버 컴포넌트는 API Route/Server Action 레벨에서 Vitest 단위 테스트로 커버
- 프로젝트 규모상 E2E 테스트(Playwright)는 불필요

**Alternatives considered**:
- Jest + RTL → ESM 설정이 복잡, 속도가 느림
- Vitest + RTL + Playwright → 과제 규모 대비 오버 엔지니어링

### 5. 린팅/포맷팅 전략

**Decision**: create-next-app 기본 ESLint 설정 활용

**Rationale**:
- `create-next-app`이 `eslint` + `eslint-config-next` 자동 설정
- Next.js 전용 린트 규칙 (이미지 최적화, 링크 사용 등) 포함
- 프로젝트 규모상 Prettier 추가는 과도함

**Alternatives considered**:
- ESLint + Prettier → 설정 충돌 해결 비용, 소규모 프로젝트에 과도
- Biome → 아직 Next.js 생태계와의 통합이 미성숙
