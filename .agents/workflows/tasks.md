---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

## Overview
This workflow creates `tasks.md` from the documents (plan.md, spec.md, data-model.md) under the specified feature directory. The output is a checklist structured by user story.

**Usage:** `/tasks`

## Execution Steps

### Step 1: Setup
Run the script to verify prerequisites and locate the feature directory.
// turbo
```bash
.specify/scripts/bash/check-prerequisites.sh --json
```
Extract `FEATURE_DIR` and `AVAILABLE_DOCS` list from the JSON output. All paths must be absolute.

### Step 2: Load design documents
Read from `FEATURE_DIR`:
- **Required**: `plan.md` (tech stack, libraries, structure), `spec.md` (user stories with priorities)
- **Optional**: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

### Step 3: Execute task generation workflow
Analyze the documents:
- Extract user stories and priorities from `spec.md`.
- Extract tech stack and patterns from `plan.md`.
- Group tasks by story (Models -> Services -> UI -> Integration).
- Identify dependencies and parallelizable tasks.

### Step 4: Generate tasks.md
Structure the generated `tasks.md` inside `FEATURE_DIR` as follows:
- Phase 1: Setup (project initialization)
- Phase 2: Foundational (blocking prerequisites for all user stories)
- Phase 3+: User Stories (prioritized, independent execution chunks)
- Final Phase: Polish & cross-cutting concerns

**Critical File Generation Rules**:
1. Every task must be in checkbox format: `- [ ] [TaskID] [P] [Story] Description with path`
2. Sequential IDs: T001, T002...
3. Use `[P]` if the task can run in parallel without blocking others.
4. Specify precise file paths complying with monorepo FSD rules (`apps/{app}/src/features/`, etc.).

### Step 5: Report
Notify the user with the path to the newly generated `tasks.md` and basic metrics (total task count, parallel opportunities).
