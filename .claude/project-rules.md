# Project Architecture Rules

## FSD (Feature-Sliced Design) Architecture

This project follows FSD architecture principles. All code changes MUST follow this structure.

## Directory Structure

```
src/
├─ app/                         # Next.js routing only (keep as thin as possible)
│  ├─ layout.tsx
│  ├─ page.tsx                  # (optional) landing page
│  ├─ create/
│  │  └─ page.tsx               # Create meeting start
│  └─ meet/
│     └─ [meetId]/
│        ├─ page.tsx            # Participant: view meeting/options
│        ├─ vote/
│        │  └─ page.tsx         # Participant: vote
│        └─ manage/
│           └─ page.tsx         # Host: manage meeting
│
├─ app-providers/               # Global providers (theme/query/toast)
│  ├─ Providers.tsx
│  └─ index.ts
│
├─ features/                    # Action-based features (UI/state/flow)
│  ├─ meet-create/              # Create meeting
│  │  ├─ ui/
│  │  │  └─ MeetCreatePage.tsx  # 조립 담당 Page
│  │  └─ model/
│  │     └─ useMeetCreateForm.ts # 상태 / 검증 / 흐름
│  │
│  ├─ meet-create-date/         # Date selection for meeting
│  │  ├─ ui/
│  │  │  └─ DateSelectPage.tsx  # 조립 담당 Page
│  │  └─ model/
│  │     └─ useDateSelect.ts    # 상태 / 흐름
│  │
│  ├─ host-range-selector/      # Host date range selection
│  │  ├─ lib/
│  │  │  └─ dateUtils.ts        # 순수 연산 / 유틸
│  │  ├─ model/
│  │  │  ├─ useDateSelection.ts # 상태 / 행동 흐름
│  │  │  └─ types.ts
│  │  └─ ui/
│  │     └─ ReactDatepickerAdapter.tsx # UI 컴포넌트
│  │
│  ├─ vote-results-calendar/    # Vote results calendar display
│  │  └─ ui/
│  │     ├─ VoteResultsShell.tsx # 조립 담당 Page
│  │     └─ ReactDatepicker.tsx # UI 컴포넌트
│  │
│  ├─ meet-view/                # Participant: view meeting details/options
│  │  ├─ ui/
│  │  │  ├─ MeetViewPageView.tsx
│  │  │  ├─ MeetInfoCard.tsx
│  │  │  └─ OptionList.tsx
│  │  └─ model/
│  │     └─ useMeetView.ts
│  │
│  ├─ meet-vote/                # Participant: voting
│  │  ├─ ui/
│  │  │  ├─ MeetVotePageView.tsx
│  │  │  ├─ VoteForm.tsx
│  │  │  └─ OptionCard.tsx
│  │  └─ model/
│  │     └─ useMeetVote.ts
│  │
│  ├─ meet-manage/              # Host: add/delete/close/share options
│  │  ├─ ui/
│  │  │  ├─ MeetManagePageView.tsx
│  │  │  ├─ ManagePanel.tsx
│  │  │  ├─ AddOptionModal.tsx
│  │  │  └─ CloseVoteButton.tsx
│  │  └─ model/
│  │     └─ useMeetManage.ts
│  │
│  └─ meet-share/               # Share link/invite
│     ├─ ui/
│     │  └─ ShareLinkButton.tsx
│     └─ lib/
│        └─ buildShareUrl.ts
│
├─ entities/                    # API + DTO (types) layer only
│  ├─ meet/
│  │  ├─ dto/
│  │  │  ├─ meet.dto.ts         # MeetResponse, MeetOptionResponse...
│  │  │  └─ vote.dto.ts         # SubmitVoteRequest/Response...
│  │  └─ api/
│  │     ├─ getMeetingById.ts   # GET /api/v1/meeting?meetId=xxx
│  │     ├─ createMeeting.ts    # POST /api/v1/meeting
│  │     ├─ voteMeeting.ts
│  │     ├─ updateVote.ts
│  │     └─ checkParticipantExist.ts
│  │
│  └─ voteDateStat/            # Vote date statistics
│     ├─ api/
│     │  └─ fetchVoteDateStat.ts
│     ├─ dto/
│     │  └─ voteDateStat.dto.ts
│     └─ lib/
│        └─ mock.ts             # mock/fixture
│
├─ shared/                      # Domain-agnostic reusable code
│  ├─ ui/                       # Common components (Button/Modal/Dropdown/Chip/Calendar)
│  │  ├─ Button/
│  │  ├─ Modal/
│  │  ├─ Dropdown/
│  │  ├─ Chip/
│  │  └─ Calendar/
│  │
│  ├─ lib/                      # General utilities
│  │  ├─ formatDate.ts
│  │  ├─ cn.ts
│  │  └─ debounce.ts
│  │
│  ├─ hooks/                    # General hooks
│  │  └─ useOutsideClick.ts
│  │
│  ├─ api/                      # API common wrapper
│  │  ├─ client.ts              # fetch wrapper, baseURL, headers
│  │  └─ errors.ts
│  │
│  ├─ config/
│  │  └─ env.ts
│  │
│  └─ types/
│     └─ common.ts
│
├─ widgets/                     # Composite UI sections (combining features/shared)
│  ├─ calendar-demo/
│  │  └─ ui.tsx
│  └─ vote-result/
│     └─ ui/
│        └─ VoteResultDataView.tsx
│
├─ styles/
│  └─ globals.css
│
└─ middleware.ts                # (if needed) auth/redirect
```

## Key Principles

### 1. Layer Responsibilities

- **app/**: 라우팅 엔트리(가능하면 **Server Component 지향**). URL params/searchParams를 읽고, feature의 Page(조립 컴포넌트)에 props만 전달.
- **features/**: "행동(동사)" 단위 기능.
  - Naming: Use verb-based names (meet-create, meet-vote, meet-manage)
  - Structure:
    - `ui/*Page.tsx`(또는 \*PageView): **화면 조립 담당(사실상 pages 레이어 역할)**
    - `ui/*`: 그 외 UI 컴포넌트
    - `model/*`: **상태/행동흐름/비즈니스 로직/파생상태**
    - `lib/*`: **순수 연산/변환/유틸/헬퍼(가능하면 UI 비의존)**
  - **의존성 방향(권장)**: `lib → model → ui(Page 포함) → app`
- **entities/**: 도메인(명사) 단위. **API 호출 + DTO 타입**.
  - Structure: `dto/` (types), `api/` (API functions), `lib/` (optional: mock/fixture)
- **shared/**: 도메인 모르는 공용 코드(ui/lib/api/config/types 등). Should not import from app/features/entities.
- **widgets/**: 여러 feature/shared를 **조합한 섹션/블록 단위 UI**(필요할 때만). widgets → features/shared 방향으로 import.

### 2. Import Rules

- ✅ Cross-layer: `app` → `features` → `entities` → `shared`
- ✅ Within features: `lib → model → ui(Page 포함) → app`
- ✅ Widgets: `widgets → features/shared`
- ❌ NEVER reverse imports (e.g., `entities` importing from `features`)
- ❌ NEVER `shared` importing from domain layers
- ❌ NEVER use `adapters/` subfolder in features - place UI components directly in `ui/`

### 3. File Naming Conventions

- Components: PascalCase (e.g., `MeetCreateForm.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useMeetCreateForm.ts`)
- Utils/Libs: camelCase (e.g., `formatDate.ts`)
- Types/DTOs: camelCase with '.dto' suffix (e.g., `meet.dto.ts`)

### 4. Export Pattern

- **배럴 패턴(index.ts 재-export) 사용 금지**
- **항상 개별 파일에서 직접 import**
- 각 파일은 자기 파일에서 직접 export

```typescript
// ✅ Correct - Direct import from source file
import { MeetCreatePage } from '@/features/meet-create/ui/MeetCreatePage';
import { useMeetCreateForm } from '@/features/meet-create/model/useMeetCreateForm';
import { VoteDateStat } from '@/entities/voteDateStat/dto/voteDateStat.dto';
import { ReactDatepickerAdapter } from '@/features/host-range-selector/ui/ReactDatepickerAdapter';

// ❌ Incorrect - Barrel pattern (index.ts 사용)
import { MeetCreatePage } from '@/features/meet-create'; // from index.ts
import { VoteDateStat } from '@/entities/voteDateStat'; // from index.ts
```

### 5. Code Organization Rules

- Keep page components (in `app/`) minimal - only routing and composition
- Business logic belongs in `features/model/`
- Pure utilities/helpers belong in `features/lib/` (UI 비의존)
- API calls belong in `entities/*/api/`
- DTO types belong in `entities/*/dto/`
- UI components in `features/*/ui/` can use hooks from same feature's `model/` and utilities from `lib/`
- **NEVER create `adapters/` subfolder** - place UI components directly in `ui/`
- Shared components in `shared/ui/` should be truly generic (no domain knowledge)
- Widgets combine multiple features/shared into composite UI sections

### 6. Code Writing Conventions

#### Function Declaration Style

- **Always use function declaration**: `export default function FunctionName() {}`
- **NEVER use arrow function with const for components**: ❌ `export const FunctionName = () => {}`

```typescript
// ✅ Correct
export default function CreateMeetingPage() {
  return <div>...</div>;
}

// ❌ Incorrect
export const CreateMeetingPage = () => {
  return <div>...</div>;
};
```

#### Naming Conventions

- **Variables/Functions**: camelCase (e.g., `userName`, `handleClick`)
- **Components**: PascalCase (e.g., `MeetCreateForm`, `CreateMeetingPage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRY_COUNT`)
- **Boolean variables**: `is`, `has`, `should` prefix (e.g., `isLoading`, `hasError`, `shouldRender`)
- **Event handlers**: `handle` prefix (e.g., `handleSubmit`, `handleClick`)
- **Custom hooks**: `use` prefix (e.g., `useMeetCreateForm`, `useOutsideClick`)

#### Variable Declaration

- **Always use `const`** by default
- **Use `let`** only when reassignment is necessary
- **NEVER use `var`**

```typescript
// ✅ Correct
const userName = 'John';
let count = 0;

// ❌ Incorrect
var userName = 'John';
```

#### Import/Export Conventions

- **DO NOT use barrel pattern (index.ts re-exports)**
- **Always import directly from the source file**

```typescript
// ✅ Correct - Direct import
import Button from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';
import { getMeetingById } from '@/entities/meet/api/getMeetingById';

// ❌ Incorrect - Barrel pattern
import Button from '@/shared/ui/button'; // from index.ts
import { Input } from '@/shared/ui/input'; // from index.ts
import { fetchMeet } from '@/entities/meet/api'; // from index.ts
```

**Reasons for avoiding barrel pattern:**

- Increases bundle size due to unnecessary imports
- Slower build times
- Tree-shaking becomes less effective
- Harder to trace import origins
- Can cause circular dependency issues

### 7. Styling Conventions

디자인 시스템 일관성을 위해 아래 규칙을 따른다.

- **디자인 토큰 우선**: 색상값을 하드코딩(`#FAF8F8`, `bg-white` 등)하지 않고 globals.css에 정의된 디자인 토큰(`bg-gray-50`, `bg-gray-0`, `text-text-primary` 등)을 사용한다.
- **Tailwind 클래스 우선**: 인라인 `style={{ }}` 대신 Tailwind 유틸리티 클래스를 사용한다 (e.g., `style={{ width: 121 }}` → `w-[121px]`).
- **Typography 유틸리티 사용**: `fontSize`, `lineHeight`, `letterSpacing` 인라인 스타일 대신 globals.css에 정의된 typography 클래스(`text-body-4` 등)를 사용한다.
- **아이콘 색상에 CSS 변수 사용**: Icon 컴포넌트의 color prop에 hex 하드코딩 대신 `var(--color-gray-400)` 등 CSS 변수를 사용한다.
- **동일 로직 함수 통합**: 조건만 다르고 로직이 동일한 함수는 매개변수를 받는 하나의 함수로 통합한다.

## When Creating New Features

1. Create feature directory under `features/` with verb-based name
2. Add `ui/`, `model/`, and optionally `lib/` subdirectories
   - `ui/*Page.tsx`: 조립 담당 Page 컴포넌트
   - `ui/*`: 그 외 UI 컴포넌트 (adapters 폴더 사용 금지)
   - `model/*`: 상태/행동흐름/비즈니스 로직 훅
   - `lib/*`: 순수 연산/유틸 (UI 비의존)
3. Create corresponding API functions in `entities/*/api/` if needed
4. Create corresponding DTOs in `entities/*/dto/` if needed
5. **배럴 패턴 사용 금지** - 각 파일에서 직접 export하고, import도 구체 파일 경로 사용
6. Import and use in `app/` pages (또는 widgets에서 조합)

## Questions or Exceptions

If architectural decisions are unclear, ask the user before proceeding.
