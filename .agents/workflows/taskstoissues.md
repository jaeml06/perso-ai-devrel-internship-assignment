---
description: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts.
---

## Overview
This workflow turns the generated `tasks.md` items into actual GitHub issues.

**Usage:** `/taskstoissues`

## Execution Steps

### Step 1: Initialize
Run the prerequisite check to find `FEATURE_DIR`.
// turbo
```bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

### Step 2: Validate Remote
Get the Git remote URL to ensure it is a GitHub repository.
// turbo
```bash
git config --get remote.origin.url
```
If this is not a GitHub URL, ABORT.

### Step 3: Create GitHub Issues
For each `- [ ]` task inside `tasks.md`, create a GitHub issue using `run_command` via `gh issue create`.
Format: `gh issue create --title "[Task] <Task Description>" --body "<Body content>"` 
**CAUTION**: Never create issues in repositories that do not match the remote URL.
