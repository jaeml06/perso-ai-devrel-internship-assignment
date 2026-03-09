Before writing specifications:

- Read `docs/moit/SERVICE_OVERVIEW.md` for moit domain rules
- If `docs/weddin/SERVICE_OVERVIEW.md` exists, read it for weddin domain rules

---

description: Create or update the feature specification with GitHub issue tracking and auto-clarification.
handoffs:

- label: Build Technical Plan
  agent: speckits/plan
  prompt: Create a plan for the spec. I am building with...
- label: Clarify Spec Requirements
  agent: speckits/clarify
  prompt: Clarify specification requirements
  send: true

---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/speckits/specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

### Step 1: Generate Slug

Generate a concise short name (2-4 words, kebab-case) for the feature:

- Analyze the feature description and extract the most meaningful keywords
- Use action-noun format when possible (e.g., "social-login", "vote-results")
- Preserve technical terms and acronyms
- Examples:
  - "소셜로그인 기능 추가" → "social-login"
  - "투표 결과 캘린더 표시" → "vote-results-calendar"
  - "모임 생성 플로우 개선" → "meet-create-flow"

### Step 2: GitHub Issue Setup

1. Verify `gh` CLI is authenticated:

   ```bash
   gh auth status
   ```

   If not authenticated, ERROR and instruct user to run `gh auth login`.

2. **MUST ask the user** whether to create a new issue or use an existing one:

   > GitHub 이슈를 어떻게 설정할까요?
   >
   > 1. 새 이슈 생성 (Recommended)
   > 2. 기존 이슈 사용

   **If option 1 (new issue)**:

   ```bash
   gh issue create --title "[FEAT] {FEATURE_SLUG}" --body "## 개요\n{feature description}\n\n## 관련 명세\n> \`specs/feat/NNN-{slug}/spec.md\`" --label "feat"
   ```

   Capture the returned issue number (e.g., `#96`).

   **If option 2 (existing issue)**:
   - Ask user for the issue number (e.g., `96`, `#96`, or a URL like `https://github.com/.../issues/96`)
   - Verify the issue exists: `gh issue view {ISSUE_NUMBER} --json number,title,state`
   - If the issue does not exist, ERROR and ask again
   - Use the provided issue number for all subsequent steps

### Step 3: Branch Setup

**MUST ask the user** which base branch to use:

> 브랜치 분기 기준을 선택해주세요:
>
> 1. 현재 브랜치 ({current_branch})에서 분기
> 2. develop 브랜치에서 분기 (Recommended)

Based on selection:

```bash
# If option 2 (recommended):
git checkout develop && git pull origin develop
# Then create feature branch:
git checkout -b "feat/#{ISSUE_NUMBER}-{FEATURE_SLUG}"
```

**Note**: Shell commands must quote `#` in branch names (e.g., `"feat/#96-social-login"`).

### Step 4: Spec Directory & File Creation

Run the script to create the spec directory structure:

```bash
.specify/scripts/bash/create-new-feature.sh --json --no-branch --type-prefix feat --number {ISSUE_NUMBER} --short-name "{SLUG}" --issue-number {ISSUE_NUMBER} "{FEATURE_DESCRIPTION}"
```

This creates `specs/feat/{NNN}-{SLUG}/` and copies the spec template.
Parse JSON output for `SPEC_FILE`, `FEATURE_DIR`, `FEATURE_NUM`.

**NNN zero-padding rule**: 96 → `096`, 306 → `306`, 1024 → `1024`.

**IMPORTANT**:

- You must only ever run this script once per feature.
- The JSON is provided in the terminal as output — always refer to it to get the actual content.
- For single quotes in args, use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot")

### Step 5: Write Specification (CREATE Mode)

1. Load `.specify/templates/spec-template.md` to understand required sections.

2. Follow this execution flow:
   1. Parse user description from Input
      If empty: ERROR "No feature description provided"
   2. Extract key concepts from description
      Identify: actors, actions, data, constraints
   3. For unclear aspects:
      - Make informed guesses based on context and industry standards
      - Only mark with [NEEDS CLARIFICATION: specific question] if:
        - The choice significantly impacts feature scope or user experience
        - Multiple reasonable interpretations exist with different implications
        - No reasonable default exists
      - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
      - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
   4. Fill User Scenarios & Testing section
      If no clear user flow: ERROR "Cannot determine user scenarios"
   5. Generate Functional Requirements
      Each requirement must be testable
      Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
   6. Define Success Criteria
      Create measurable, technology-agnostic outcomes
   7. Identify Key Entities (if data involved)
   8. Return: SUCCESS (spec ready for clarification)

3. Write the specification to SPEC_FILE using the template structure.

### Step 5-B: UPDATE Mode

If the user specifies they want to update an existing spec:

- Search `specs/feat/` for directories matching the keyword or current branch issue number.
- Load the existing spec and apply the requested changes.
- Preserve existing clarifications and structure.

### Step 6: Auto-Clarify Loop

After writing the initial spec, automatically run a lightweight clarification pass:

1. **Scan** the spec across 6 categories:
   - 기능 범위 (Functional Scope)
   - 데이터 모델 (Data Model)
   - UX 플로우 (UX Flow)
   - 엣지 케이스 (Edge Cases)
   - 비기능 요구사항 (Non-Functional)
   - 외부 연동 (External Integration)

2. For each category, mark status: **Clear** / **Partial** / **Missing**

3. Generate **max 5 questions** for Partial/Missing categories:
   - Each question must be answerable with multiple-choice (2-4 options) or short phrase
   - Prioritize by impact on architecture, data model, or task decomposition
   - Present one question at a time using AskUserQuestion

4. **Loop**:
   - Present question → receive answer → update spec.md inline → next question
   - **Exit conditions**: 5 questions complete / user says "완료" / all categories Clear

5. Record clarification history in spec.md under `## Clarifications` section:

   ```markdown
   ## Clarifications

   ### Session YYYY-MM-DD

   - Q: {question} → A: {answer}
   ```

6. For **UPDATE mode**: Ask user "명확화 루프를 실행하시겠습니까?" before running.

### Step 7: Quality Validation

Generate a checklist file at `FEATURE_DIR/checklists/requirements.md`:

```markdown
# Specification Quality Checklist: [FEATURE NAME]

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: [DATE]
**Feature**: [Link to spec.md]

## Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Success criteria are technology-agnostic (no implementation details)
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

## Feature Readiness

- [ ] All functional requirements have clear acceptance criteria
- [ ] User scenarios cover primary flows
- [ ] Feature meets measurable outcomes defined in Success Criteria
- [ ] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckits/clarify` or `/speckits/plan`
```

Validate the spec against each checklist item (max 3 iterations).

### Step 8: Completion Report

```
✅ 명세 생성 완료!

📁 specs/feat/{NNN}-{slug}/spec.md
🔗 GitHub Issue: #{ISSUE_NUMBER}
🌿 브랜치: feat/#{ISSUE_NUMBER}-{slug}
✅ 체크리스트: specs/feat/{NNN}-{slug}/checklists/requirements.md
📊 명확화: {N}개 질문 완료, {M}개 카테고리 Partial/Missing

👉 다음 단계: /speckits/plan 을 실행하여 구현 계획을 수립하세요.
```

---

## General Guidelines

### Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: RESTful APIs unless specified otherwise

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"

**Bad examples** (implementation-focused):

- "API response time is under 200ms"
- "Database can handle 1000 TPS"
- "React components render efficiently"
