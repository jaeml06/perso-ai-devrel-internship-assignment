---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## Overview
This workflow implements the tasks defined in `tasks.md` for a given feature.

**Usage:** `/implement`

## Execution Steps

### Step 1: Setup
Check prerequisites and locate the feature directory.
// turbo
```bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```
Extract `FEATURE_DIR`.

### Step 2: Check checklists status
If `FEATURE_DIR/checklists/` exists, scan the checklists to verify they are all completed. If not, notify the user with a table of Checklist Status and wait for permission to proceed.

### Step 3: Load context
Read:
- `tasks.md` (Execution instructions)
- `plan.md` (Tech stack, architecture constraints)
- `data-model.md` and `contracts/` (if exist)

### Step 4: Validate FSD Conventions Before Execution
Verify that all code changes will follow the project-rules:
- No Barrel Exports (`index.ts` re-exports). Always import paths directly.
- Unidirectional Imports (app -> features -> entities -> shared).
- Component Style: MUST be `export default function Name() {}` instead of `export const Name = () => {}`.

### Step 5: Execute Implementation
Use the codebase modification tools (write_to_file, run_command, replace_file_content) to implement the specific tasks from `tasks.md` one by one.
- Handle sequential tasks one at a time.
- Handle `[P]` parallel tasks collectively if safe.
- **CRITICAL**: Mark `- [x]` in `tasks.md` by replacing the content after each task is successfully completed.
- Ensure any tests requested are written.

### Step 6: Completion Report
Validate all tasks are complete and summarize exactly what was achieved in this workflow execution.
