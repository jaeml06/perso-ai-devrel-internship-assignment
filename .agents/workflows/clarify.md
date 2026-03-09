---
description: Identify underspecified areas in the current feature spec by asking targeted clarification questions and encoding answers back into the spec.
---

## Overview
This workflow runs an interactive session to clarify ambiguous or underspecified parts of `spec.md` before planning. It uses `notify_user` to ask up to 5 targeted questions and updates the spec file incrementally.

**Usage:** `/clarify [optional context]`

## Execution Steps

### Step 1: Initialize Context
Run the prerequisite check to find the active feature directory.
// turbo
```bash
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```
Extract `FEATURE_DIR` and `FEATURE_SPEC`.

### Step 2: Spec Analysis
Read `FEATURE_SPEC`. Scan across categories: Functional Scope, Data Model, UX Flow, Non-Functional, External Dependencies, Edge Cases. Mark them as Clear, Partial, or Missing.

### Step 3: Question Generation
Internal generation: form up to 5 prioritized, high-impact questions for Partial/Missing categories. Questions must be answerable by multiple-choice or short phrases (<=5 words).

### Step 4: Interactive Clarification Loop
For each question:
1. Provide a recommendation/suggestion and a list of options using `notify_user` with `BlockedOnUser: true`.
2. Wait for the user's response.
3. If they accept or provide an answer, record it in memory.

### Step 5: Spec Updating
After EACH accepted answer, update `FEATURE_SPEC` directly.
- Ensure `## Clarifications` exists.
- Add `- Q: <question> → A: <final answer>`.
- Modify the corresponding relevant section (e.g. Edge Cases, Data Model) to incorporate the new constraint. Do not leave placeholder text.

### Step 6: Completion Report
Once up to 5 questions are answered, or the user says they are done, report the updated sections and suggest running `/plan`.
