---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## Overview
This workflow analyzes `spec.md`, `plan.md`, and `tasks.md` for consistency, duplications, and coverage gaps without modifying the files.

**Usage:** `/analyze`

## Execution Steps

### Step 1: Initialize Analysis Context
Run the prerequisite script to safely find the artifacts.
// turbo
```bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```
Locate `FEATURE_DIR/spec.md`, `FEATURE_DIR/plan.md`, `FEATURE_DIR/tasks.md`, and `.specify/memory/constitution.md`.

### Step 2: Load progressive context
Read the artifacts focusing on functional requirements, constraints, task IDs, and phase groupings.

### Step 3: Detection Passes
Analyze for:
- **Duplication**: Similar requirements.
- **Ambiguity**: Vague terms (fast, scalable).
- **Underspecification**: Tasks referencing undefined files.
- **Coverage**: Requirements missing tasks.
- **Constitution Alignment**: Check against project rules.

### Step 4: Produce Compact Report
Output a Markdown table via `notify_user` summarizing findings by severity (CRITICAL, HIGH, MEDIUM, LOW) along with metrics (Coverage %, Ambiguity Count, etc.).

### Step 5: Offer Remediation
Ask the user if they'd like automated remediation edits for the top issues. Wait for their response before making any changes.
