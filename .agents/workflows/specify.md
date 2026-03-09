---
description: Create or update the feature specification with GitHub issue tracking and auto-clarification.
---

## Overview
This workflow sets up a new feature by creating a GitHub issue, branching, and generating a specification file `spec.md`. It also optionally runs an auto-clarification loop.

**Usage:** `/specify [Feature Description]`
**Example:** `/specify 소셜 로그인 기능 추가`

## Execution Steps

### Step 1: Generate Slug
Based on the user's `$ARGUMENTS` (which is the feature description), generate a concise 2-4 word kebab-case slug (e.g., `social-login`). Do this internally before proceeding.

### Step 2: GitHub Issue Setup
1. Verify `gh` CLI is authenticated (you can auto-run `gh auth status`).
2. Ask the user using `notify_user` if they want to create a new issue or use an existing one:
   - **Option 1 (New Issue):** Run `gh issue create --title "[FEAT] {FEATURE_SLUG}" --body "## 개요\n{feature description}\n\n## 관련 명세\n> \`specs/feat/NNN-{slug}/spec.md\`" --label "feat"`. Capture the generated issue number (e.g., `#96`).
   - **Option 2 (Existing Issue):** Ask user for issue number, verify with `gh issue view {ISSUE_NUMBER} --json number,title,state`.

### Step 3: Branch Setup
1. Ask the user using `notify_user` whether to branch from `develop` or the current branch.
2. If `develop` (recommended):
// turbo
```bash
git checkout develop && git pull origin develop
git checkout -b "feat/#{ISSUE_NUMBER}-{FEATURE_SLUG}"
```
Note: Ensure you are running shell commands with quotes around branch names that contain `#`.

### Step 4: Spec Directory & File Creation
Run the existing specify script to create the directory structure:
// turbo
```bash
.specify/scripts/bash/create-new-feature.sh --json --no-branch --type-prefix feat --number {ISSUE_NUMBER} --short-name "{SLUG}" --issue-number {ISSUE_NUMBER} "{FEATURE_DESCRIPTION}"
```
This will output `SPEC_FILE`, `FEATURE_DIR`, `FEATURE_NUM` in JSON format to the terminal. Read it carefully.

### Step 5: Write Specification
1. Read `.specify/templates/spec-template.md`.
2. Based on the user's description, write the specification to `SPEC_FILE` (e.g., `specs/feat/096-social-login/spec.md`). Use reasonable defaults where unspecified. If there's missing context, use `[NEEDS CLARIFICATION: question]` tags but limit to max 3. Ensure the criteria are measurable.

### Step 6: Auto-Clarify Loop
Run an internal scan on the newly created `spec.md` for 6 categories:
- Functional Scope
- Data Model
- UX Flow
- Edge Cases
- Non-Functional
- External Integration
Mark them Clear/Partial/Missing. If any are Partial/Missing, generate up to 5 questions using `notify_user`. As the user answers, update `spec.md` inline and append the Q&A to the `## Clarifications` section.

### Step 7: Quality Validation
Create `FEATURE_DIR/checklists/requirements.md` to validate the spec against standard checks (no implementation details, unambiguous). If items fail, fix the spec.

### Step 8: Completion Report
Output a summary message indicating success, showing locations of `spec.md`, the branch name, the issue number, and advising the next step (running `/plan`).
