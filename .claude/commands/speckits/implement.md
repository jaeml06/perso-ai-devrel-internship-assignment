---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args, use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count total, completed, and incomplete items
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | requirements.md | 12 | 12   | 0          | ✓ PASS |
     ```

   - **If any checklist is incomplete**: STOP and ask user for confirmation
   - **If all checklists are complete**: Automatically proceed

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications
   - **IF EXISTS**: Read research.md for technical decisions

4. **Project Convention Verification** (before each task):

   This is a Next.js + FSD monorepo. Verify compliance with `.claude/project-rules.md`:
   - **FSD Structure**: All code must be in the correct FSD layer:
     - `app/` → routing only (thin Server Components)
     - `features/` → verb-based feature modules with `ui/`, `model/`, `lib/`
     - `entities/` → noun-based domain modules with `api/`, `dto/`
     - `shared/` → domain-agnostic reusable code

   - **No Barrel Exports**: NEVER create `index.ts` re-export files. Import directly:

     ```typescript
     // ✅ import { X } from '@/features/meet-create/ui/MeetCreatePage'
     // ❌ import { X } from '@/features/meet-create'
     ```

   - **Import Direction**: Only `app → features → entities → shared` (NEVER reverse)

   - **Component Style**: Use function declarations, NOT arrow function const:

     ```typescript
     // ✅ export default function MeetCreatePage() {}
     // ❌ export const MeetCreatePage = () => {}
     ```

   - **Naming**: Components PascalCase, hooks `use` prefix camelCase, utils camelCase, DTOs `.dto.ts` suffix

   - **Variables**: `const` by default, `let` only for reassignment, NEVER `var`

5. Parse tasks.md structure and extract:
   - Task phases, dependencies, parallel markers [P]
   - Execution flow and order requirements

6. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

7. Progress tracking:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - **IMPORTANT**: For completed tasks, mark as `- [x]` in the tasks.md file
   - Apply `testId` attributes from spec.md where applicable

8. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass (if tests were written)
   - Confirm the implementation follows FSD structure and project conventions
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/speckits/tasks` first to regenerate the task list.
