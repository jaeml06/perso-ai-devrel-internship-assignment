---
description: Create a PR from current branch to develop branch with automated title and body
---

## Goal

Create a pull request from the current branch to `develop` branch with:

- Title: `{current-branch} {issue-title}`
- Body: Based on PR template with automated issue reference and work summary

## Execution Steps

### 1. Extract Issue Number from Current Branch

Parse the current branch name to extract the issue number. For example, `design/#16` → issue number is `16`.

### 2. Fetch Issue Information

Use `gh issue view {issue-number}` to get the issue title.

### 3. Generate PR Title

Combine current branch name and issue title:

- Format: `{branch-name} {issue-title-without-prefix}`
- Example: `design/#16` + `[DESIGN] 모바일 레이아웃` → `design/#16 모바일 레이아웃`
- Remove the category prefix like `[DESIGN]` from the issue title

### 4. Analyze Branch Changes

Run `git log develop...HEAD` and `git diff develop...HEAD` to understand what work was done in this branch.

### 5. Generate PR Body

Use the template from `.github/PULL_REQUEST_TEMPLATE.md`:

- Fill in `closed #{issue-number}` in the 연관 이슈 section
- Summarize the branch changes in the 작업 내용 section
- Keep the 리뷰 요구사항 section empty (user can fill it if needed)

### 6. Create PR

Run `gh pr create --base develop --title "{title}" --body "{body}"` to create the pull request.

### 7. Return PR URL

Output the created PR URL to the user.

## Important Notes

- Always push current branch to remote if not already pushed
- Handle cases where issue number cannot be extracted from branch name
- Ensure gh CLI is authenticated
- Use heredoc for multi-line PR body to preserve formatting

## User Input

```text
$ARGUMENTS
```
