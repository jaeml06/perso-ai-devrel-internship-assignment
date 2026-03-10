# Implementation Plan: UI/UX 폴리싱 — 반응형 레이아웃 & 일관된 디자인 시스템

**Branch**: `feat/#8-ui-ux-polish` | **Date**: 2026-03-10 | **Spec**: `specs/feat/008-ui-ux-polish/spec.md`
**Input**: Feature specification from `specs/feat/008-ui-ux-polish/spec.md`

## Summary

대시보드의 DubbingForm, PipelineProgress, AudioPlayer, VoiceSelector 컴포넌트에 Tailwind CSS 스타일을 적용하고, 모든 페이지(로그인/미인가/대시보드)가 동일한 디자인 토큰(primary blue, gray 배경, 흰 카드)을 사용하도록 통일한다. 모바일/데스크톱 반응형 레이아웃, 파이프라인 진행 시각화, 에러/재시도 UX, 마이크로 인터랙션을 포함한다.

**접근 방식**: TDD — 각 UI 컴포넌트의 스타일링 전 테스트(접근성, 반응형 클래스 존재, 상태별 시각적 구분)를 먼저 작성하고, 테스트를 통과하도록 구현한다.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS 4 (순수 — shadcn/ui 미사용)
**Storage**: N/A (UI-only feature)
**Testing**: Vitest + @testing-library/react (컴포넌트 단위 TDD), Playwright (선택: E2E 시각 검증)
**Target Platform**: Web (모바일 375px ~ 데스크톱 1280px+)
**Project Type**: Single Next.js app
**Performance Goals**: N/A (CSS-only 변경, JS 번들 증가 없음)
**Constraints**: 순수 Tailwind CSS만 사용, 추가 UI 라이브러리 금지
**Scale/Scope**: 5개 UI 컴포넌트 스타일링 + globals.css 디자인 토큰 확장

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| FSD 레이어 준수 | PASS | 모든 변경이 기존 features/dubbing-create/ui/, features/auth-login/ui/, shared/ui/ 내에서 이루어짐 |
| 배럴 export 금지 | PASS | 새 파일 추가 없음, 기존 직접 import 유지 |
| 단방향 의존성 | PASS | UI 스타일링만 변경, import 구조 변경 없음 |
| function declaration 스타일 | PASS | 기존 컴포넌트가 이미 function declaration 사용 |
| 디자인 토큰 우선 | CHECK | globals.css 디자인 토큰 확장 후 해당 토큰만 사용 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/008-ui-ux-polish/
├── plan.md              # This file
├── research.md          # Phase 0: TDD 전략 및 Tailwind CSS 4 연구
├── data-model.md        # Phase 1: N/A (UI-only, 데이터 모델 변경 없음)
└── tasks.md             # Phase 2 output (/speckits.tasks command)
```

### Source Code (affected files)

```text
src/
├── app/globals.css                                    # 디자인 토큰 확장
├── shared/ui/LayoutShell.tsx                          # 네비게이션 스타일 보강
├── features/dubbing-create/ui/
│   ├── DubbingDashboardPage.tsx                       # 카드 레이아웃 + 반응형
│   ├── DubbingForm.tsx                                # 폼 스타일링 + 접근성
│   ├── PipelineProgress.tsx                           # 단계별 시각화 + 애니메이션
│   ├── AudioPlayer.tsx                                # 플레이어 스타일링
│   └── VoiceSelector.tsx                              # 셀렉트 + 에러 상태
└── __tests__/
    ├── features/dubbing-create/ui/
    │   ├── DubbingDashboardPage.test.tsx               # [NEW] 카드 레이아웃 TDD
    │   ├── DubbingForm.test.tsx                        # [UPDATE] 스타일 관련 테스트 추가
    │   ├── PipelineProgress.test.tsx                   # [NEW] 단계 상태별 시각 TDD
    │   ├── AudioPlayer.test.tsx                        # [UPDATE] 비활성 상태 테스트 추가
    │   └── VoiceSelector.test.tsx                      # [UPDATE] 에러/재시도 테스트 추가
    ├── shared/ui/LayoutShell.test.tsx                  # [UPDATE] 네비게이션 스타일 테스트
    └── shared/design-tokens.test.ts                   # [UPDATE] 새 토큰 검증
```

## TDD Strategy

### 원칙

1. **Red**: 스타일링/접근성/상태 구분에 대한 테스트를 먼저 작성 (실패)
2. **Green**: 최소한의 Tailwind 클래스를 추가하여 테스트 통과
3. **Refactor**: 디자인 토큰으로 통합, 중복 제거

### 테스트 가능한 스타일 검증 방식

UI 스타일은 직접 CSS를 테스트하기 어려우므로, 다음 방식으로 TDD를 적용:

| 검증 대상 | 테스트 방법 |
|-----------|------------|
| 접근성 (aria-label, role) | `getByRole()`, `getByLabelText()` |
| 포커스 링 존재 | `focus-visible` 클래스 존재 확인 또는 `toHaveFocus()` |
| 에러 상태 시각 구분 | `data-state`, `aria-invalid`, 에러 메시지 텍스트 확인 |
| 파이프라인 단계 상태 | `data-state="done|active|idle"` attribute 확인 |
| disabled 상태 | `toBeDisabled()`, `aria-disabled` |
| `prefers-reduced-motion` | CSS 수준이므로 Playwright E2E로 검증 (옵션) |
| 반응형 레이아웃 | 구조적 마크업(semantic HTML) 테스트 + Playwright viewport 테스트 |

## Phase 0 — Research

### R-001: Tailwind CSS 4 @theme 디자인 토큰 확장

- **Decision**: globals.css `@theme` 블록에 `--color-success`, `--color-warning`, `--color-info` 추가
- **Rationale**: 스펙 FR-005에서 "동일한 색상 의미론(빨강=에러, 초록=성공, 파랑=정보)" 요구. 기존 `--color-destructive`(빨강)은 있으나 성공/정보 토큰 부재
- **Alternatives**: CSS 변수 직접 선언 → Tailwind 유틸리티로 사용 불가하여 `@theme` 내 정의가 적절

### R-002: CSS 트랜지션 전략

- **Decision**: Tailwind의 `transition-*` 유틸리티 + `motion-safe:` / `motion-reduce:` variant 활용
- **Rationale**: 스펙에서 `prefers-reduced-motion` 미디어 쿼리 존중 요구 (Edge Case). Tailwind 4는 `motion-safe:`, `motion-reduce:` variant 내장
- **Alternatives**: framer-motion → 추가 라이브러리 금지 조건에 위배

### R-003: 파이프라인 스피너 구현

- **Decision**: CSS `@keyframes spin` + Tailwind `animate-spin` 유틸리티
- **Rationale**: 순수 Tailwind로 구현 가능, JS 불필요
- **Alternatives**: SVG 스피너 라이브러리 → 추가 의존성 불필요

## Phase 1 — Design & Contracts

### 1.1 디자인 토큰 확장 (globals.css)

추가할 토큰:

```css
@theme {
  /* 기존 토큰 유지 + 아래 추가 */
  --color-success: #22c55e;
  --color-success-foreground: #ffffff;
  --color-warning: #f59e0b;
  --color-warning-foreground: #ffffff;
  --color-info: #3b82f6;
  --color-info-foreground: #ffffff;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
}
```

### 1.2 컴포넌트별 디자인 계획

#### DubbingDashboardPage

- `<main>` → 중앙 정렬, 최대 너비 제한, 세로 배치
- 구조: 제목 + DubbingForm (카드) + PipelineProgress (카드) + AudioPlayer (카드)
- 반응형: 모바일 단일 컬럼 full-width 패딩, 데스크톱 `max-w-2xl mx-auto`

#### DubbingForm

- 카드 컨테이너: `rounded-2xl border bg-card shadow-sm p-6`
- 각 필드 그룹: `flex flex-col gap-2`
- label: `text-sm font-medium text-foreground`
- input/select: `rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring`
- 에러 메시지: `text-sm text-destructive` + `aria-live="polite"`
- 제출 버튼: `bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50`
- 파일명 truncation: `truncate max-w-[200px]`

#### PipelineProgress

- 스텝 리스트: flex 가로 또는 세로 배치, 각 스텝 사이 연결선
- `data-state="done"`: `text-success` + 체크 아이콘
- `data-state="active"`: `text-primary` + 스피너 `animate-spin`
- `data-state="idle"`: `text-muted-foreground`
- 에러 블록: `bg-destructive/10 border-destructive text-destructive rounded-lg p-4`
- 재시도 버튼: `bg-destructive text-destructive-foreground`
- 트랜지션: `motion-safe:transition-all motion-safe:duration-300`

#### AudioPlayer

- 카드: `rounded-2xl border bg-card p-4`
- 재생/일시정지 버튼: 아이콘 스타일 버튼
- range input: 커스텀 `accent-primary` 또는 Tailwind slider 스타일
- 다운로드 링크: `text-primary underline hover:text-primary/80`
- 로딩 중 비활성: `opacity-50 pointer-events-none`

#### VoiceSelector

- select: DubbingForm과 동일한 스타일
- 에러 상태: `bg-destructive/10 rounded-lg p-3`
- 미리듣기 버튼: `text-sm text-primary hover:underline`

#### LayoutShell (네비게이션)

- 기존 스타일 유지 + `bg-background` 명시 추가
- 로그아웃 버튼에 hover/focus 스타일 추가

### 1.3 TDD 테스트 명세 (Phase 2 tasks에서 구체화)

#### DubbingDashboardPage 테스트

1. `main` 역할이 존재한다
2. 제목 "AI 더빙 생성"이 heading으로 렌더된다
3. DubbingForm이 카드 컨테이너 내에 렌더된다

#### DubbingForm 테스트 (기존 + 추가)

4. 에러 메시지에 `aria-live="polite"` 속성이 있다
5. 파일명이 긴 경우 truncate 클래스가 적용된다 (구조적으로 span에 truncate)
6. 제출 버튼이 disabled일 때 시각적으로 구분된다

#### PipelineProgress 테스트

7. idle 상태에서 아무것도 렌더하지 않는다
8. transcribing 상태에서 STT 단계가 `data-state="active"`이다
9. translating 상태에서 STT가 `data-state="done"`, 번역이 `data-state="active"`이다
10. complete 상태에서 모든 단계가 `data-state="done"`이다
11. error 상태에서 에러 메시지와 재시도 버튼이 표시된다
12. 재시도 버튼 클릭 시 onRetry가 호출된다
13. 진행 상태 메시지가 `aria-live` 영역에 표시된다

#### AudioPlayer 테스트

14. 재생/일시정지 버튼이 접근 가능하다
15. 시크바(range)가 레이블이 있다
16. 다운로드 링크가 존재한다

#### VoiceSelector 테스트 (기존 + 추가)

17. 에러 시 에러 메시지가 접근 가능한 영역에 표시된다
18. 재시도 버튼이 에러 시 렌더된다

#### 디자인 토큰 테스트 (design-tokens.test.ts 확장)

19. globals.css에 success, warning, info 토큰이 정의되어 있다

### 1.4 Architecture Decision Table

| Decision | Options | Chosen | Rationale | FSD Impact |
|----------|---------|--------|-----------|------------|
| 스타일링 방식 | 순수 Tailwind / shadcn/ui / CSS modules | 순수 Tailwind | 스펙 Assumption: "추가 UI 라이브러리 사용하지 않음" | 영향 없음 |
| 스피너 구현 | CSS animate-spin / SVG 라이브러리 / Lottie | CSS animate-spin | 추가 의존성 없음, Tailwind 내장 | 영향 없음 |
| 모션 접근성 | motion-safe/reduce variant / JS media query | Tailwind variant | CSS 수준 처리, 성능 우수 | 영향 없음 |
| 색상 의미론 | Tailwind 기본 색상 / 커스텀 토큰 | 커스텀 토큰 확장 | 일관된 디자인 시스템, `@theme` 활용 | globals.css만 수정 |
| 카드 레이아웃 | div + Tailwind / 별도 Card 컴포넌트 | div + Tailwind 직접 | 5개 미만 사용처, 추상화 불필요 | 영향 없음 |
| 테스트 전략 | data attributes + aria / className 직접 검증 | data attributes + aria | className은 구현 세부사항, 행동 기반 테스트 | __tests__/ 내 기존 패턴 유지 |

## Complexity Tracking

> 위반 사항 없음. 모든 변경이 기존 FSD 구조 내에서 이루어짐.

## Stop & Report

- **Branch**: `feat/#8-ui-ux-polish`
- **Spec path**: `specs/feat/008-ui-ux-polish/spec.md`
- **IMPL_PLAN path**: `specs/feat/008-ui-ux-polish/plan.md`
- **Generated artifacts**:
  - `plan.md` — 이 파일 (Phase 0 연구 + Phase 1 설계 포함)
  - `research.md` — 별도 생성 불필요 (R-001~R-003이 plan.md 내 Phase 0에 포함)
  - `data-model.md` — N/A (UI-only feature, 데이터 모델 변경 없음)
  - `contracts/` — N/A (API 변경 없음)
- **Constitution compliance**: PASS (모든 게이트 통과)
- **Suggested next**: `/speckits:tasks`
