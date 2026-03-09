# MOIT / WEDDIN Constitution

## Core Principles

### I. Feature-Sliced Design (FSD)

모든 코드는 FSD 아키텍처를 따른다. 레이어 간 의존성 방향은 단방향이며 역방향 import는 금지한다.

- **레이어 계층**: `app` → `widgets` → `features` → `entities` → `shared`
- **app/**: 라우팅 엔트리만 담당 (Server Component 지향). URL params를 읽고 feature Page에 props 전달.
- **features/**: 행동(동사) 단위 기능. `ui/` (조립 Page + UI 컴포넌트), `model/` (상태/비즈니스 로직), `lib/` (순수 연산/유틸).
- **entities/**: 도메인(명사) 단위. `api/` (API 호출), `dto/` (타입 정의), `lib/` (mock/fixture).
- **shared/**: 도메인 비의존 공용 코드 (`ui/`, `lib/`, `hooks/`, `api/`, `config/`, `types/`).
- **widgets/**: 여러 feature/shared를 조합한 섹션/블록 단위 UI (필요 시에만 생성).

### II. Monorepo Structure

npm workspaces 기반 모노레포로, 두 개의 Next.js 앱과 공유 패키지로 구성된다.

- `apps/moit` — 모임 투표 서비스 (port 3000)
- `apps/weddin` — 웨딩 서비스 (port 3001)
- `packages/shared` — 앱 간 공유 컴포넌트/유틸 (`@repo/shared`)

### III. No Barrel Exports

배럴 패턴(index.ts 재-export)을 사용하지 않는다. 항상 개별 파일에서 직접 import한다.

- 번들 사이즈 증가, 빌드 속도 저하, tree-shaking 효과 감소, 순환 의존성 위험을 방지하기 위함.
- `import { X } from '@/features/some-feature'` (X) → `import { X } from '@/features/some-feature/ui/SomeComponent'` (O)

### IV. Unidirectional Dependencies

레이어 간, 레이어 내부 모두 단방향 의존만 허용한다.

- **레이어 간**: `app → features → entities → shared` (역방향 절대 금지)
- **features 내부**: `lib → model → ui(Page 포함) → app`
- **widgets**: `widgets → features/shared` 방향으로만 import
- `shared`는 `app`, `features`, `entities`를 절대 import하지 않는다.

### V. Consistent Code Style

일관된 코드 작성 규칙을 프로젝트 전체에 적용한다.

- **컴포넌트**: function declaration 사용 (`export default function Component() {}`), arrow function const 금지.
- **변수 선언**: `const` 기본, 재할당 필요 시에만 `let`, `var` 절대 금지.
- **네이밍**: 변수/함수 camelCase, 컴포넌트 PascalCase, 상수 UPPER_SNAKE_CASE.
- **Boolean**: `is`/`has`/`should` 접두사 (e.g., `isLoading`, `hasError`).
- **이벤트 핸들러**: `handle` 접두사 (e.g., `handleSubmit`).
- **커스텀 훅**: `use` 접두사 (e.g., `useMeetCreateForm`).
- **파일명**: 컴포넌트 PascalCase, 훅 camelCase(`use` prefix), 유틸 camelCase, DTO camelCase(`.dto` suffix).

### VI. Styling Conventions

디자인 시스템 일관성을 위해 아래 규칙을 따른다.

- **디자인 토큰 우선**: 색상값을 하드코딩(`#FAF8F8`, `bg-white` 등)하지 않고 globals.css에 정의된 디자인 토큰(`bg-gray-50`, `bg-gray-0`, `text-text-primary` 등)을 사용한다.
- **Tailwind 클래스 우선**: 인라인 `style={{ }}` 대신 Tailwind 유틸리티 클래스를 사용한다 (e.g., `style={{ width: 121 }}` → `w-[121px]`).
- **Typography 유틸리티 사용**: `fontSize`, `lineHeight`, `letterSpacing` 인라인 스타일 대신 globals.css에 정의된 typography 클래스(`text-body-4` 등)를 사용한다.
- **아이콘 색상에 CSS 변수 사용**: Icon 컴포넌트의 color prop에 hex 하드코딩 대신 `var(--color-gray-400)` 등 CSS 변수를 사용한다.
- **동일 로직 함수 통합**: 조건만 다르고 로직이 동일한 함수(e.g., `getMinusColor`/`getPlusColor`)는 매개변수를 받는 하나의 함수로 통합한다.

## Technology Stack

| Category        | Technology                                                               |
| --------------- | ------------------------------------------------------------------------ |
| Framework       | Next.js 16 (App Router)                                                  |
| Language        | TypeScript 5                                                             |
| UI              | React 19                                                                 |
| Styling         | Tailwind CSS 4 + CVA + clsx + tailwind-merge                             |
| UI Primitives   | Radix UI                                                                 |
| Bottom Sheet    | vaul                                                                     |
| HTTP Client     | ky                                                                       |
| Validation      | zod                                                                      |
| Date            | date-fns + react-datepicker                                              |
| Analytics       | Amplitude                                                                |
| Testing         | Vitest + Playwright                                                      |
| Storybook       | Storybook 10                                                             |
| API Mocking     | MSW 2                                                                    |
| Linting         | ESLint 9 + Prettier + lint-staged + lefthook + commitlint (conventional) |
| Package Manager | npm workspaces                                                           |

## Development Workflow

### Feature 생성 절차

1. `features/` 아래에 동사 기반 이름으로 디렉토리 생성 (e.g., `meet-create`, `meet-vote`)
2. `ui/`, `model/`, (선택) `lib/` 하위 디렉토리 구성
3. 필요 시 `entities/*/api/`에 API 함수, `entities/*/dto/`에 타입 정의 추가
4. `app/` 페이지에서 feature의 Page 컴포넌트를 import하여 사용
5. `adapters/` 폴더 사용 금지 — UI 컴포넌트는 `ui/`에 직접 배치

### Commit Convention

commitlint + conventional commits 규칙을 따른다. lefthook을 통해 pre-commit(lint-staged)과 commit-msg(commitlint)가 자동 실행된다.

### Quality Gates

- **lint-staged**: 커밋 전 ESLint + Prettier 자동 검사
- **commitlint**: conventional commit 메시지 형식 강제
- **TypeScript**: `tsc --noEmit`으로 타입 체크
- **Storybook**: 컴포넌트 문서화 및 시각적 검증

## Governance

- 이 Constitution은 프로젝트의 모든 코드 작성 및 리뷰의 기준이 된다.
- 아키텍처 결정이 불명확할 경우, 코드 작성 전 팀원과 논의한다.
- Constitution 변경 시 팀 합의 및 문서 업데이트가 필요하다.
- 상세 런타임 가이드는 `.claude/project-rules.md`를 참조한다.

**Version**: 1.0.0 | **Ratified**: 2026-02-13 | **Last Amended**: 2026-02-13
