# Implementation Plan: Next.js 초기 세팅 및 FSD 아키텍처 기반 설정

**Branch**: `feat/#1-nextjs-fsd-setup` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feat/001-nextjs-fsd-setup/spec.md`

## Summary

AI 더빙 웹 서비스를 위한 Next.js App Router 프로젝트를 초기화하고, FSD(Feature-Sliced Design) 아키텍처 기반 디렉토리 구조를 설정한다. Tailwind CSS v4 스타일링 시스템, 글로벌 디자인 토큰, 공통 레이아웃 셸(헤더 + 메인 콘텐츠), 그리고 TDD를 위한 Vitest + React Testing Library 환경을 구성한다.

## Technical Context

**Language/Version**: TypeScript 5.x
**Framework**: Next.js 15 (App Router), React 19
**Styling**: Tailwind CSS v4 (create-next-app 기본 내장)
**Testing**: Vitest + React Testing Library + @testing-library/jest-dom
**Target Platform**: Web (Vercel 배포)
**Project Type**: Single web application
**Performance Goals**: 프로덕션 빌드 에러 없이 완료, 개발 서버 3분 이내 구동
**Constraints**: Node.js v20+, FSD 아키텍처 준수
**Scale/Scope**: 소규모 인턴 과제 프로젝트 (4개 PR 범위)

## Constitution Check

_GATE: 별도 constitution.md가 없으므로 프로젝트 과제 요구사항 기반으로 검증._

| Gate | Status | Notes |
|------|--------|-------|
| Next.js 프레임워크 사용 | PASS | 과제 요구사항에 명시됨 |
| FSD 계층 분리 | PASS | app, features, entities, shared 계층 구성 |
| 배럴 익스포트 금지 | PASS | Vercel best practices `bundle-barrel-imports` 준수 |
| 단방향 의존성 | PASS | shared → entities → features → app 방향만 허용 |
| TDD 환경 구축 | PASS | Vitest + RTL 설정 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/001-nextjs-fsd-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A for this PR)
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router (FSD app layer)
│   ├── layout.tsx                # Root layout with LayoutShell
│   ├── page.tsx                  # Home page (thin routing)
│   └── globals.css               # Tailwind directives + design tokens
│
├── features/                     # FSD features layer (비어있음 - 후속 PR에서 추가)
│   └── .gitkeep
│
├── entities/                     # FSD entities layer (비어있음 - 후속 PR에서 추가)
│   └── .gitkeep
│
├── shared/                       # FSD shared layer
│   ├── ui/
│   │   └── LayoutShell.tsx       # 공통 레이아웃 셸 (헤더 + 메인)
│   └── lib/
│       └── cn.ts                 # clsx + tailwind-merge 유틸리티
│
├── __tests__/                    # 테스트 파일
│   ├── shared/
│   │   └── ui/
│   │       └── LayoutShell.test.tsx
│   └── app/
│       └── page.test.tsx
│
├── vitest.config.ts              # Vitest 설정
└── vitest.setup.ts               # Testing Library 전역 설정
```

**Structure Decision**: Next.js App Router의 `src/` 디렉토리 모드를 사용하고, FSD 계층(`features/`, `entities/`, `shared/`)을 `src/` 내부에 배치한다. `app/` 디렉토리는 Next.js 라우팅 전용으로 유지하며, 실제 비즈니스 로직과 UI는 FSD 계층에서 관리한다.

## Architecture Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| 프로젝트 초기화 도구 | create-next-app, 수동 설정 | create-next-app | 과제 명세에 명시, Tailwind v4 자동 포함, 검증된 기본 설정 |
| CSS 유틸리티 | clsx만 사용, tailwind-merge + clsx | tailwind-merge + clsx (`cn` 함수) | Tailwind 클래스 충돌 방지, shadcn/ui 패턴과 호환 |
| 디자인 토큰 관리 | CSS Variables, Tailwind config 확장, 별도 토큰 파일 | CSS Variables (globals.css) | Tailwind v4의 CSS-first 설정과 자연스럽게 통합, 서버/클라이언트 양쪽에서 접근 가능 |
| 테스트 배치 | 소스 옆 co-location, 별도 `__tests__/` 디렉토리 | `__tests__/` 디렉토리 (소스 구조 미러링) | FSD 디렉토리를 깔끔하게 유지, 테스트 파일이 소스 탐색을 방해하지 않음 |
| 레이아웃 셸 위치 | app/layout.tsx에 직접 작성, shared/ui로 분리 | shared/ui/LayoutShell.tsx | FSD 원칙에 따라 재사용 가능한 UI는 shared 계층에 배치, app/layout.tsx는 얇게 유지 |
| 린터/포맷터 | ESLint만 사용, ESLint + Prettier | ESLint (Next.js 기본 내장) | create-next-app이 ESLint 자동 설정, 프로젝트 규모상 Prettier 추가는 과도함 |

## Implementation Phases

### Phase 1: 프로젝트 초기화 (TDD: 테스트 환경 먼저)

1. `npx create-next-app@latest` 실행 (TypeScript, Tailwind CSS, App Router, src/ 디렉토리 사용)
2. FSD 디렉토리 구조 생성 (`src/features/`, `src/entities/`, `src/shared/`)
3. Vitest + React Testing Library 설치 및 설정
4. 기본 스모크 테스트 작성 (홈페이지 렌더링 검증)

### Phase 2: 디자인 시스템 토큰

1. 디자인 토큰 테스트 작성 (토큰 정의 존재 여부 검증)
2. `globals.css`에 CSS 변수 기반 디자인 토큰 정의 (색상, 타이포그래피, 간격)
3. `cn()` 유틸리티 함수 구현 및 테스트

### Phase 3: 공통 레이아웃 셸

1. LayoutShell 컴포넌트 테스트 작성 (헤더, 메인 영역 렌더링 검증)
2. `shared/ui/LayoutShell.tsx` 구현
3. `app/layout.tsx`에서 LayoutShell 적용
4. 빌드 검증 (`npm run build`)

## Key Constraints & Rules (from Vercel Best Practices)

- **No barrel exports**: 각 모듈은 직접 경로로 import (`bundle-barrel-imports`)
- **Server Components by default**: 클라이언트 컴포넌트는 `'use client'` 명시 필요
- **Suspense boundaries**: 비동기 데이터 로딩 시 Suspense 사용 (`async-suspense-boundaries`)
- **Conditional rendering**: `&&` 대신 삼항 연산자 사용 (`rendering-conditional-render`)
- **Function declaration**: 컴포넌트는 `function` 선언문 사용 (arrow function + const 지양)
