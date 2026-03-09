---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: speckits/tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckits/checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

### Step 1: Setup & Path Resolution

1. Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.

   The script resolves the current branch name (e.g., `feat/#96-social-login`) to find the matching spec directory under `specs/feat/`.

   For single quotes in args, use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### Step 2: Load Context

1. Read FEATURE_SPEC (spec.md)
2. Read `.specify/memory/constitution.md` for project principles and tech stack
3. Read `.claude/project-rules.md` for FSD architecture rules
4. Load IMPL_PLAN template (already copied by setup script)

### Step 3: Codebase Exploration

Before planning, explore the existing codebase to understand patterns:

1. **Identify target app**: Determine if this feature is for `apps/moit` or `apps/weddin` (or both)
2. **Scan existing features**: List directories under `apps/{app}/src/features/` to understand naming and structure patterns
3. **Check existing entities**: List directories under `apps/{app}/src/entities/` for reusable API/DTO
4. **Check shared components**: List `packages/shared/src/` for reusable utilities
5. **Note existing patterns**: Look at 1-2 existing features to understand:
   - How `ui/`, `model/`, `lib/` are structured
   - How hooks are organized
   - How API calls are made (ky client usage)

### Step 4: Execute Plan Workflow

Follow the structure in IMPL_PLAN template to:

1. **Fill Technical Context**:
   - Language: TypeScript 5
   - Framework: Next.js 16 (App Router), React 19
   - Styling: Tailwind CSS 4 + CVA + clsx + tailwind-merge
   - HTTP: ky
   - Validation: zod
   - UI Primitives: Radix UI, vaul
   - Testing: Vitest + Playwright
   - Mark unknowns as "NEEDS CLARIFICATION"

2. **Fill Constitution Check** from `.specify/memory/constitution.md`:
   - Verify FSD layer compliance
   - Verify no barrel exports
   - Verify unidirectional dependencies
   - Evaluate gates (ERROR if violations unjustified)

3. **Phase 0 — Outline & Research**:
   - Extract unknowns from Technical Context
   - For each unknown → research task
   - Consolidate findings in `research.md`:
     - Decision: [what was chosen]
     - Rationale: [why chosen]
     - Alternatives considered: [what else evaluated]

4. **Phase 1 — Design & Contracts**:
   - Extract entities from spec → `data-model.md`
   - Generate API contracts from functional requirements:
     - For each user action → endpoint
     - Use REST patterns with ky (NOT GraphQL)
     - Output to `/contracts/`
   - **FSD Component Structure** (project-specific):
     ```
     apps/{app}/src/
     ├── app/{route}/page.tsx          # Thin routing only
     ├── features/{feature-name}/
     │   ├── ui/{Page}.tsx             # Assembly page
     │   ├── ui/{Component}.tsx        # UI components
     │   ├── model/use{Hook}.ts        # State/business logic
     │   └── lib/{util}.ts             # Pure utilities
     ├── entities/{entity}/
     │   ├── api/{action}.ts           # API functions (ky)
     │   └── dto/{entity}.dto.ts       # Type definitions
     └── shared/                       # Domain-agnostic (from packages/shared or app-local)
     ```
   - Run `.specify/scripts/bash/update-agent-context.sh claude`

5. **Architecture Decision Table**: For each decision, document:
   - Decision name
   - Options considered
   - Chosen option with rationale
   - Impact on FSD structure

### Step 5: Stop & Report

Command ends after Phase 1 planning. Report:

- Branch name and spec path
- IMPL_PLAN path
- Generated artifacts (research.md, data-model.md, contracts/)
- Constitution compliance status
- Suggested next: `/speckits/tasks`

## Key Rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
- All component paths must follow FSD structure from `.claude/project-rules.md`
- No barrel exports (import directly from source files)
- function declaration style for components (not arrow functions with const)
