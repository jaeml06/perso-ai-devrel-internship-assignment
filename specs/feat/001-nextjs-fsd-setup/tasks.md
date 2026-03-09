# Tasks: Next.js 초기 세팅 및 FSD 아키텍처 기반 설정

**Input**: Design documents from `/specs/feat/001-nextjs-fsd-setup/`
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: TDD 접근 — 각 User Story 내에서 테스트를 먼저 작성하고 실패 확인 후 구현합니다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (프로젝트 초기화)

**Purpose**: Next.js 프로젝트 생성 및 기본 구조 설정

- [x] T001 `npx create-next-app@latest`로 프로젝트 초기화 (TypeScript, Tailwind CSS, ESLint, App Router, src/ 디렉토리, import alias `@/*`)
- [x] T002 FSD 디렉토리 구조 생성: `src/features/.gitkeep`, `src/entities/.gitkeep`, `src/shared/ui/.gitkeep`, `src/shared/lib/.gitkeep`
- [x] T003 Vitest + React Testing Library 설치: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`를 devDependencies로 추가
- [x] T004 Vitest 설정 파일 생성: `vitest.config.ts` (jsdom 환경, src/ alias, setup 파일 연결)
- [x] T005 Vitest 전역 설정 파일 생성: `vitest.setup.ts` (`@testing-library/jest-dom/vitest` import)
- [x] T006 `package.json`에 테스트 스크립트 추가: `"test": "vitest"`, `"test:run": "vitest run"`
- [x] T007 스모크 테스트 작성 및 실행 확인: `src/__tests__/setup.test.ts` (Vitest가 정상 동작하는지 `expect(true).toBe(true)` 수준의 확인 테스트)

**Checkpoint**: `npm run dev`로 개발 서버가 정상 실행되고, `npm run test:run`으로 스모크 테스트가 통과함

---

## Phase 2: Foundational (공통 유틸리티)

**Purpose**: 모든 User Story에서 사용하는 공통 유틸리티 구현 (TDD)

- [x] T008 cn() 유틸리티 테스트 작성: `src/__tests__/shared/lib/cn.test.ts` — 클래스 결합, 조건부 클래스, Tailwind 클래스 충돌 해결 케이스 검증
- [x] T009 `clsx`, `tailwind-merge` 설치 및 cn() 유틸리티 구현: `src/shared/lib/cn.ts`

**Checkpoint**: `npm run test:run` — cn() 관련 테스트가 모두 통과

---

## Phase 3: User Story 1 — 프로젝트 개발 환경 구축 (Priority: P1) 🎯 MVP

**Goal**: 개발자가 프로젝트를 클론 후 `npm install && npm run dev`로 기본 페이지를 확인할 수 있고, FSD 디렉토리 구조가 갖춰져 있다.

**Independent Test**: `npm install && npm run dev` 실행 시 기본 페이지 렌더링, `npm run build` 에러 없이 완료, FSD 디렉토리 존재 확인

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [US1] 홈페이지 렌더링 테스트 작성: `src/__tests__/app/page.test.tsx` — 홈페이지 컴포넌트가 렌더링되고 서비스 제목("AI 더빙" 등)이 표시되는지 검증

### Implementation for User Story 1

- [x] T011 [US1] `src/app/page.tsx`를 AI 더빙 서비스 기본 홈페이지로 교체 (create-next-app 기본 콘텐츠 제거, 서비스 소개 텍스트 표시)
- [x] T012 [US1] `src/app/globals.css`에서 create-next-app 기본 스타일 정리 (Tailwind directives만 유지)
- [x] T013 [US1] 빌드 검증: `npm run build` 에러 없이 완료 확인

**Checkpoint**: 홈페이지 렌더링 테스트 통과, 빌드 성공, FSD 디렉토리 구조 확인

---

## Phase 4: User Story 2 — 일관된 디자인 시스템 토큰 적용 (Priority: P2)

**Goal**: 개발자가 사전 정의된 디자인 토큰(색상, 타이포그래피, 간격)을 사용하여 UI 컴포넌트를 일관되게 개발할 수 있다.

**Independent Test**: 디자인 토큰이 CSS 변수로 정의되어 있고, Tailwind 유틸리티 클래스에서 참조 가능하며, 토큰을 사용한 컴포넌트가 올바르게 렌더링됨

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T014 [US2] 디자인 토큰 존재 검증 테스트 작성: `src/__tests__/shared/design-tokens.test.ts` — globals.css 파일에 색상, 타이포그래피, 간격 관련 CSS 변수(@theme 블록)가 정의되어 있는지 파일 내용을 읽어 검증

### Implementation for User Story 2

- [x] T015 [US2] `src/app/globals.css`에 Tailwind v4 `@theme` 블록으로 디자인 토큰 정의: 색상 팔레트(primary, secondary, background, foreground, muted, accent, destructive), 타이포그래피 스케일(font-family, font-size), 간격 스케일
- [x] T016 [US2] 홈페이지(`src/app/page.tsx`)에 디자인 토큰 적용하여 실제 참조 가능함을 확인

**Checkpoint**: 디자인 토큰 테스트 통과, 홈페이지에서 토큰 기반 스타일 적용 확인

---

## Phase 5: User Story 3 — 공통 레이아웃 셸 제공 (Priority: P3)

**Goal**: 모든 페이지에 일관된 레이아웃(상단 네비게이션 헤더 + 중앙 메인 콘텐츠 영역)이 적용된다.

**Independent Test**: 기본 페이지에 접근 시 헤더와 메인 콘텐츠 영역이 렌더링되고, 320px~1920px 뷰포트에서 정상 동작

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [US3] LayoutShell 컴포넌트 렌더링 테스트 작성: `src/__tests__/shared/ui/LayoutShell.test.tsx` — 헤더 영역(navigation role)이 렌더링되는지, 메인 콘텐츠 영역(main role)이 렌더링되는지, children이 메인 영역 내부에 표시되는지 검증

### Implementation for User Story 3

- [x] T018 [US3] LayoutShell 컴포넌트 구현: `src/shared/ui/LayoutShell.tsx` — 상단 네비게이션 헤더(서비스 로고/이름) + 중앙 메인 콘텐츠 영역, 반응형(320px~1920px), function 선언문 사용, 디자인 토큰 활용
- [x] T019 [US3] `src/app/layout.tsx`에서 LayoutShell 적용: LayoutShell로 children을 감싸도록 수정
- [x] T020 [US3] 빌드 검증: `npm run build` 에러 없이 완료 확인

**Checkpoint**: LayoutShell 테스트 통과, 모든 페이지에 레이아웃 적용, 빌드 성공

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 통합 검증 및 정리

- [x] T021 모든 테스트 일괄 실행: `npm run test:run` — 전체 테스트 통과 확인
- [x] T022 프로덕션 빌드 최종 검증: `npm run build` — 경고 없이 완료
- [x] T023 ESLint 검증: `npm run lint` — 린트 에러 없음 확인
- [x] T024 create-next-app 불필요 파일 정리 (사용하지 않는 아이콘, 기본 이미지 등 제거)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 바로 시작
- **Foundational (Phase 2)**: Phase 1 완료 후 시작 — 모든 User Story의 전제조건
- **User Story 1 (Phase 3)**: Phase 2 완료 후 시작
- **User Story 2 (Phase 4)**: Phase 3 완료 후 시작 (홈페이지에 토큰 적용하므로)
- **User Story 3 (Phase 5)**: Phase 4 완료 후 시작 (디자인 토큰 활용하므로)
- **Polish (Phase 6)**: 모든 User Story 완료 후 시작

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 독립 실행 가능
- **US2 (P2)**: US1 완료 후 시작 (globals.css 수정, 홈페이지에 토큰 적용)
- **US3 (P3)**: US2 완료 후 시작 (디자인 토큰을 LayoutShell에서 사용)

### Within Each User Story (TDD Cycle)

1. 테스트 작성 → 실패 확인 (RED)
2. 최소 구현 → 테스트 통과 (GREEN)
3. 리팩토링 (REFACTOR)
4. 다음 태스크로 이동

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001~T007)
2. Complete Phase 2: Foundational (T008~T009)
3. Complete Phase 3: User Story 1 (T010~T013)
4. **STOP and VALIDATE**: `npm run dev`, `npm run build`, `npm run test:run` 모두 정상

### Incremental Delivery

1. Setup + Foundational → 개발 환경 기반 완성
2. + User Story 1 → MVP (기본 홈페이지 동작)
3. + User Story 2 → 디자인 시스템 토큰 적용
4. + User Story 3 → 레이아웃 셸 적용, 전체 구조 완성
5. + Polish → 최종 검증 후 PR 생성 가능

---

## Notes

- 모든 컴포넌트는 `function` 선언문 사용 (arrow function + const 지양)
- 배럴 익스포트(`index.ts`) 금지 — 직접 파일 경로로 import
- 서버 컴포넌트가 기본, 클라이언트 컴포넌트는 `'use client'` 명시
- 조건부 렌더링은 삼항 연산자 사용 (`&&` 지양)
- 테스트 파일은 `src/__tests__/` 디렉토리에 소스 구조를 미러링하여 배치
