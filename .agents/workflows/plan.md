---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

## Overview
This workflow generates technical planning documents (`plan.md`, `research.md`, `data-model.md`, `contracts/`) based on an existing specification file.

**Usage:** `/plan`

## Execution Steps

### Step 1: Setup & Path Resolution
1. Run the setup script to resolve the current branch (e.g. `feat/#96-social-login`) to find the spec directory.
// turbo
```bash
.specify/scripts/bash/setup-plan.sh --json
```
2. Extract `FEATURE_SPEC`, `IMPL_PLAN`, `SPECS_DIR`, and `BRANCH` from the output.

### Step 2: Load Context
1. Read the `FEATURE_SPEC` (`spec.md`).
2. Read `.specify/memory/constitution.md` for project principles.
3. Read `.claude/project-rules.md` for FSD directory rules.
4. Load the `IMPL_PLAN` template (which setup-plan.sh already copied).

### Step 3: Codebase Exploration
Explore the codebase to understand conventions:
1. Examine `apps/moit/src/features/` or `apps/weddin/src/features/` to see existing FSD feature structues (`ui/`, `model/`, `lib/`).
2. Examine `apps/*/src/entities/` for existing type definitions (`dto/`) and API clients (`api/`).

### Step 4: Execute Plan Workflow
1. **Fill Technical Context** in the `IMPL_PLAN`:
   - Enforce: TypeScript 5, Next.js 16 (App Router), React 19, Tailwind CSS 4, ky, zod.
2. **Constitution Check**: Ensure adherence to `.claude/project-rules.md` (no barrel exports, correct FSD routing).
3. **Phase 0 — Outline & Research**: Generate `research.md` resolving unknown variables.
4. **Phase 1 — Design & Contracts**: 
   - Extract entities into `data-model.md`.
   - Write API contracts in `contracts/` using REST patterns.
   - Outline the FSD component structure (e.g., `apps/moit/src/features/{name}/ui/{Page}.tsx`).

### Step 5: Stop & Report
Report the generated artifact paths (`plan.md`, `research.md`, etc.) and suggest the user run `/tasks` next.
