---
description: Generate a custom checklist for the current feature based on user requirements.
---

## Overview
Checklists are "Unit Tests for Requirements". This workflow generates a checklist (`checklists/[domain].md`) that validates the completeness and clarity of the specification, NOT the implementation.

**Usage:** `/checklist [domain/focus]`
**Example:** `/checklist UX 관점`

## Execution Steps

### Step 1: Setup
Run the setup script.
// turbo
```bash
.specify/scripts/bash/check-prerequisites.sh --json
```

### Step 2: Dynamic Clarification
If the intent is unclear, ask up to 3 context clarifying questions (e.g. Audience? Depth? Scope?) via `notify_user`. 

### Step 3: Load Context
Load the relevant portions of `spec.md`, `plan.md`, `tasks.md`.

### Step 4: Generate Checklist
Create `FEATURE_DIR/checklists/[domain].md` (e.g., `ux.md`, `api.md`, `security.md`).
- Items must test the spec itself (e.g. "Is fast loading quantified?" instead of "Does the page load fast?").
- Use dimensions like [Completeness], [Clarity], [Consistency].
- Start numbering at `CHK001`.

### Step 5: Report
Write the checklist to the file and notify the user of its path.
