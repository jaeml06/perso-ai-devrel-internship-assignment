---
description: Create a PR from current branch to develop branch with automated title and body
---

## Goal
Create a pull request from the current branch to `develop` branch with an automated title and body.

**Usage:** `/pr-develop`

## Execution Steps

### Step 1: Extract Issue Number
Determine the current branch name (e.g., `git rev-parse --abbrev-ref HEAD`).
Parse the branch name for the issue number (`design/#16` -> `16`).

### Step 2: Fetch Issue Information
// turbo
```bash
gh issue view {issue-number}
```
Extract the issue title.

### Step 3: Generate PR Title
Format: `{branch-name} {issue-title-without-prefix}` (e.g. `design/#16 모바일 레이아웃`).

### Step 4: Analyze Branch Changes
// turbo
```bash
git log origin/develop...HEAD
git diff origin/develop...HEAD
```
Analyze changes to formulate a summary.

### Step 5: Generate PR Body
Use `.github/PULL_REQUEST_TEMPLATE.md` if it exists.
Fill in `closed #{issue-number}` in the 연관 이슈 (Linked Issue) section.
Add the summary of changes.

### Step 6: Create PR
Ensure the branch is pushed to remote:
// turbo
```bash
git push -u origin HEAD
gh pr create --base develop --title "{title}" --body "{body}"
```

### Step 7: Report
Output the PR URL to the user.
