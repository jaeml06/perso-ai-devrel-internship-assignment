---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
---

## Overview
This workflow updates the project constitution (`.specify/memory/constitution.md`) filling in placeholder tokens and ensuring version propagation.

**Usage:** `/constitution [new principle or update]`

## Execution Steps

### Step 1: Load and Parse
Read the template at `.specify/memory/constitution.md`.
Identify all `[ALL_CAPS_IDENTIFIER]` placeholders.

### Step 2: Value Collection & Derivation
- Use input from `$ARGUMENTS` to fill placeholders.
- Handle versioning: `CONSTITUTION_VERSION` (MAJOR for removals/redef, MINOR for additions, PATCH for wording).
- Set `LAST_AMENDED_DATE` to today.

### Step 3: Draft Updates
- Replace placeholders with concrete text (or explicitly mark `TODO(<FIELD>)` if genuinely unknown).
- Retain Markdown hierarchy.

### Step 4: Consistency Validation
Verify no outdated agent references (like Claude) remain. Ensure rules still apply.

### Step 5: Sync Impact Report
Prepend an HTML comment at the top of the file:
```html
<!-- Sync Impact Report
Version: old -> new
Modified principles...
-->
```

### Step 6: Write to Disk
Overwrite `.specify/memory/constitution.md`.

### Step 7: Final Summary
Notify the user of the new version, bump rationale, and suggest a commit message (e.g. `docs: amend constitution to vX.Y.Z`).
