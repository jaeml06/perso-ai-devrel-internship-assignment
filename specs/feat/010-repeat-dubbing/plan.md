# Implementation Plan: 연속 더빙 생성 복구

**Branch**: `feat/#10-repeat-dubbing` | **Date**: 2026-03-10 | **Spec**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/spec.md`
**Input**: Feature specification from `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/spec.md` + user directive `TDD관점에서`

## Summary

더빙 생성 완료 후 `useDubbingCreate()`의 `submit()` 가드가 `complete` 상태를 재실행 가능 상태로 보지 않아, 같은 세션에서 두 번째 생성이 차단되고 있다. 이번 계획은 서버 API를 추가하지 않고 `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/features/dubbing-create/model/useDubbingCreate.ts`를 "입력은 유지하고 실행 상태만 새 세션으로 초기화"하는 구조로 재설계해, 완료/실패 후 즉시 재생성과 재시도를 허용한다.

TDD 관점에서는 훅 테스트를 먼저 확장해 `complete → submit`, `error → retry`, `same input → new attempt`, `new submit → old result hidden` 동작을 Red로 고정한 뒤, 훅과 조립 UI를 Green으로 맞춘다.

## Technical Context

**Language/Version**: TypeScript 5  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS 4, CVA, clsx, tailwind-merge, ky, zod, Radix UI, vaul  
**Storage**: N/A (클라이언트 메모리 상태 + Blob URL)  
**Testing**: Vitest + Testing Library + Playwright  
**Target Platform**: 브라우저 클라이언트 + Next.js Route Handlers  
**Project Type**: single web application at `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src`  
**Performance Goals**: 페이지 새로고침 없이 연속 두 번 이상 더빙 생성을 시작하고 완료할 수 있어야 함  
**Constraints**: 기존 `/api/stt`, `/api/translate`, `/api/tts` 계약 유지, 진행 중에만 중복 요청 차단, 입력값은 완료/실패 후 유지, Blob URL 수명 정리 필요  
**Scale/Scope**: 단일 사용자 세션의 단일 더빙 파이프라인, 서버 영속화 없음  

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
| --- | --- | --- |
| FSD layer compliance | ✅ PASS | 구현 대상은 `/src/app/dashboard/page.tsx` → `/src/features/dubbing-create/*` → `/src/entities/dubbing/*` 흐름이며 역방향 import 필요 없음 |
| No barrel exports | ✅ PASS | 기존 구조와 동일하게 개별 파일 직접 import만 사용 |
| Unidirectional dependencies | ✅ PASS | 상태 초기화 로직은 `features/dubbing-create/model` 안에 유지, API 호출은 계속 `entities/dubbing/api`로 제한 |
| Function declaration style | ✅ PASS | 신규/수정 컴포넌트는 function declaration 유지 가능 |
| TDD-first change slices | ✅ PASS | 훅/UI 테스트 추가 후 구현하는 순서로 계획 수립 |
| Clarification status | ✅ PASS | 스펙의 핵심 행동이 모두 명시됨, unresolved clarification 없음 |

## Project Structure

### Documentation (this feature)

```text
/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── POST-stt.md
│   ├── POST-translate.md
│   └── POST-tts.md
└── tasks.md                # created later by /speckits/tasks
```

### Source Code (repository root)

```text
/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/
├── app/
│   ├── dashboard/page.tsx
│   └── api/
│       ├── stt/route.ts
│       ├── translate/route.ts
│       └── tts/route.ts
├── entities/
│   ├── dubbing/
│   │   ├── api/
│   │   │   ├── transcribeFile.ts
│   │   │   ├── translateText.ts
│   │   │   └── createDubbing.ts
│   │   └── dto/dubbing.dto.ts
│   └── voice/
│       ├── api/getVoices.ts
│       └── dto/voice.dto.ts
├── features/
│   ├── auth-login/
│   │   ├── lib/
│   │   ├── model/
│   │   └── ui/
│   └── dubbing-create/
│       ├── lib/validateFileInput.ts
│       ├── model/useDubbingCreate.ts
│       └── ui/
│           ├── DubbingDashboardPage.tsx
│           ├── DubbingForm.tsx
│           ├── PipelineProgress.tsx
│           ├── AudioPlayer.tsx
│           └── VoiceSelector.tsx
├── shared/
│   ├── config/
│   ├── lib/
│   └── ui/
└── __tests__/
    ├── features/dubbing-create/
    ├── entities/dubbing/api/
    └── app/api/
```

**Structure Decision**: 스펙 템플릿이 가정한 `apps/moit`, `apps/weddin`, `packages/shared` 모노레포 구조는 현재 리포에 존재하지 않는다. 이 기능은 단일 Next.js 앱의 `/src` 아래에서 구현되며, 페이지 엔트리는 `/src/app/dashboard/page.tsx`, 행동 로직은 `/src/features/dubbing-create`, API 호출과 DTO는 `/src/entities/dubbing`, 공용 코드는 `/src/shared`에 유지한다.

## Phase 0 — Outline & Research

### Codebase Exploration Findings

1. **Target app**
   - `apps/moit` / `apps/weddin` 대상이 아니라 단일 앱(`/src`) 대상이다.
   - 실제 사용자 진입점은 `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/app/dashboard/page.tsx`다.
2. **Existing features**
   - `/src/features/auth-login`
   - `/src/features/dubbing-create`
3. **Existing entities**
   - `/src/entities/dubbing`
   - `/src/entities/voice`
   - `/src/entities/user`
4. **Shared components/utilities**
   - 모노레포 `packages/shared/src`는 없고 실제 공용 계층은 `/src/shared/{config,lib,ui}`다.
5. **Existing patterns**
   - `dubbing-create`는 `ui/`에서 조립하고 `model/useDubbingCreate.ts`가 전체 오케스트레이션을 담당한다.
   - API 호출은 `entities/*/api/*.ts`에서 `ky`로 `/api/*` Route Handler를 호출한다.
   - 테스트는 `/src/__tests__/` 아래 중앙 집중형 구조를 사용한다.

### Research Focus

- 완료 상태를 재실행 가능 상태로 바꾸면서도 "진행 중 중복 제출 차단"을 유지하는 방법
- 새 작업 시작 시 이전 성공 결과, 오류, 단계 표시를 어떤 단위로 초기화할지
- Blob URL을 반복 생성 시 안전하게 교체/해제하는 책임 위치
- 동일 입력 반복 제출을 별도 시도로 인식하도록 테스트와 상태 모델을 맞추는 방법

**Phase 0 Output**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/research.md`

## Phase 1 — Design & Contracts

### Data Model Output

이번 기능은 서버 DTO 추가보다 클라이언트 세션 상태 재정의가 핵심이다. 따라서 기존 `DubbingRequest`, `TranscriptionResult`, `TranslationResult`는 유지하고, 설계 문서에서 다음 개념을 명시한다.

- `PersistentInputs`: 파일, 타겟 언어, 음성 선택값
- `GenerationAttempt`: 각 submit/retry마다 증가하는 개별 실행 단위
- `GenerationSessionState`: 현재 attempt 기준의 진행 상태, 결과, 오류, 표시 여부
- `VisibleResult`: 현재 세션에 노출 가능한 오디오 결과와 attempt 연계 정보

**Phase 1 Output**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/data-model.md`

### API Contracts

서버 API 자체의 request/response schema는 바꾸지 않는다. 대신 반복 생성 시에도 기존 `ky` 호출 체인이 매번 새 attempt로 실행되어야 한다는 계약을 문서화한다.

- `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/contracts/POST-stt.md`
- `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/contracts/POST-translate.md`
- `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/contracts/POST-tts.md`

### FSD Component Structure (implementation target)

```text
/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/src/
├── app/dashboard/page.tsx                         # thin route entry
├── features/dubbing-create/
│   ├── ui/DubbingDashboardPage.tsx               # page assembly, hides previous result on new attempt
│   ├── ui/DubbingForm.tsx                        # persistent inputs, disabled only while processing
│   ├── ui/PipelineProgress.tsx                   # current attempt progress/error only
│   ├── ui/AudioPlayer.tsx                        # visible only for current completed attempt
│   └── model/useDubbingCreate.ts                 # attempt lifecycle + reset orchestration
├── entities/dubbing/
│   ├── api/transcribeFile.ts
│   ├── api/translateText.ts
│   ├── api/createDubbing.ts
│   └── dto/dubbing.dto.ts                        # optional internal state types if promotion needed
└── __tests__/features/dubbing-create/
    ├── model/useDubbingCreate.test.tsx
    ├── ui/DubbingDashboardPage.test.tsx
    └── ui/PipelineProgress.test.tsx
```

### TDD Implementation Slices

1. **Hook re-entry guard**
   - Red: `complete` 상태에서 `submit()` 호출 시 새 파이프라인이 시작되는 테스트 추가
   - Green: `submit()` 가드를 "processing states only" 기준으로 수정
2. **Session reset behavior**
   - Red: 새 submit/retry 시 이전 `audioUrl`, `transcription`, `translation`, `errorMessage`가 즉시 초기화되는 테스트 추가
   - Green: 새 attempt 시작 전에 파생 상태를 공통 reset 함수로 정리
3. **Same-input repeat handling**
   - Red: 입력 변경 없이 연속 submit해도 API 체인이 다시 호출되는 테스트 추가
   - Green: completed/error 상태를 잠금으로 보지 않고 attempt를 증가시켜 재실행 허용
4. **UI visibility rules**
   - Red: 새 작업 시작 시 `AudioPlayer`가 숨겨지고 진행 상태가 현재 attempt 기준으로만 보이는 테스트 추가
   - Green: `DubbingDashboardPage` 표시 조건을 current session state 기반으로 유지
5. **Blob URL lifecycle**
   - Red: 이전 오디오 URL이 새 결과로 교체되거나 훅이 정리될 때 revoke 되는 테스트 추가
   - Green: `useEffect` cleanup 또는 reset helper에 `URL.revokeObjectURL` 책임 추가

## Architecture Decision Table

| Decision | Options Considered | Chosen Option | Rationale | FSD Impact |
| --- | --- | --- | --- | --- |
| 완료 후 재실행 허용 방식 | `complete`를 `idle`로 강제 복귀, `submit` 가드 완화, 별도 `canSubmit` 플래그 | `submit` 가드를 processing 상태에만 적용 | 완료/실패 후 입력 유지 요구와 가장 직접적으로 일치하며 상태 전이 수를 최소화함 | 변경은 `features/dubbing-create/model`에 국한 |
| 새 작업 시작 시 상태 초기화 위치 | UI에서 초기화, 각 단계별 수동 초기화, 공통 reset helper | 훅 내부 공통 reset helper | 중복을 줄이고 submit/retry가 동일 규칙을 따르게 함 | `features/model` 책임 명확화 |
| 동일 입력 반복 생성 표현 | 입력 변경 감지 필요, request hash 저장, attempt counter 증가 | attempt counter를 세션 내부에서 증가 | FR-006을 가장 단순하게 만족, 동일 입력도 새 작업으로 명시 가능 | DTO 확장 없이 feature state로 유지 가능 |
| 이전 결과 숨김 시점 | 완료 후 수동 dismiss, 새 STT 성공 후 숨김, submit 직후 숨김 | submit/retry accepted 직후 숨김 | 스펙의 FR-003a와 정확히 일치 | `DubbingDashboardPage`는 기존 조건만 유지, 실질 로직은 훅이 담당 |
| Blob URL 관리 | 관리 안 함, `AudioPlayer` 책임, 훅 책임 | 훅 책임 | 생성/교체 시점을 훅이 알고 있어 누수 방지에 유리 | `entities/api/createDubbing.ts`는 순수 API 함수로 유지 |
| API 변경 범위 | 단일 `/api/dubbing` 신규 엔드포인트, 기존 3단계 유지 | 기존 3단계 유지 | 버그 범위가 클라이언트 재진입 제어이므로 서버 변경이 불필요 | `entities/dubbing/api`와 `app/api/*` 변경 최소화 |

## Post-Design Constitution Check

| Gate | Status | Notes |
| --- | --- | --- |
| FSD layer compliance | ✅ PASS | 설계상 추가 책임은 모두 기존 feature/entity 경계 내에 배치 |
| No barrel exports | ✅ PASS | 신규 산출물과 예정 구현 모두 직접 경로 import 기준 |
| Unidirectional dependencies | ✅ PASS | `app`는 계속 thin entry, reset/orchestration은 feature 내부, API는 entity 내부 |
| ERROR on unresolved clarifications | ✅ PASS | 미해결 항목 없음 |

## Complexity Tracking

해당 없음. Constitution 위반 없이 해결 가능하다.
