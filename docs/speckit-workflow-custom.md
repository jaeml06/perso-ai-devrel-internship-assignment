# Speckit 워크플로우 커스텀 구현 계획

## Context

현재 프로젝트에는 speckit 도구가 설치되어 있으나 실제 사용된 적이 없다. 기존 speckit 커맨드(9개)는 `.claude/commands/speckit.*.md`에 flat 파일로 존재하며, 프로젝트의 실제 브랜치 규칙(`feat/#17` 등)과 맞지 않는 `001-feature-name` 패턴을 기대한다.

이번 작업의 목표는:

1. 모든 speckit 커맨드를 `.claude/commands/speckits/`로 재구성 (심링크 없이 직접 배치)
2. `/specify` 실행 시 GitHub Issue 생성 → 브랜치 생성 → 스펙 작성 → 자동 clarify 통합
3. `/plan`, `/tasks`, `/implement` 커맨드를 프로젝트 실정(FSD, 모노레포, Tailwind 등)에 맞게 커스텀
4. 스펙 산출물을 `specs/feat/{NNN}-{slug}/`에 저장 (NNN = 이슈번호 zero-pad)

## 주요 충돌 해결 사항

| 항목           | 기존 상태                               | 사용자 계획                  | 해결                                 |
| -------------- | --------------------------------------- | ---------------------------- | ------------------------------------ |
| Issue Template | `feat-template.md` 존재                 | `feature_request.md` 신규    | **별도 신규 생성** (speckit 전용)    |
| Issue Label    | `feat`                                  | `Feature`                    | **`feat` 사용** (기존 레포 일관성)   |
| 브랜치 규칙    | 스크립트: `001-slug` / 실제: `feat/#17` | `feat/#{ISSUE}-{slug}`       | **스크립트 수정** (실제 규칙에 맞춤) |
| NNN 번호       | 스크립트 자동 증가                      | GitHub 이슈번호              | **이슈번호 기반**으로 변경           |
| 스펙 경로      | `specs/{NNN}-{slug}/`                   | `specs/feat/{NNN}-{slug}/`   | **`specs/feat/` 하위**로 변경        |
| 커맨드 위치    | `.claude/commands/speckit.*.md`         | `.claude/commands/speckits/` | **직접 배치** (심링크 없음)          |

---

## 수정/생성할 파일 목록

### Phase 0: 인프라 (스크립트 수정)

#### 0-1. `.specify/scripts/bash/common.sh` 수정

현재 `check_feature_branch()`가 `^[0-9]{3}-` 패턴만 허용 → `feat/#NNN-slug` 패턴도 허용하도록 수정.

변경사항:

- `check_feature_branch()`: `^[0-9]{3}-` 뿐 아니라 `feat/#[0-9]+-` 패턴도 유효한 feature 브랜치로 인식
- `get_current_branch()`: 반환값이 `feat/#96-social-login` 형태일 때 정상 처리
- `find_feature_dir_by_prefix()`: `specs/feat/` 하위에서 검색하도록 경로 변경. 브랜치명 `feat/#96-social-login`에서 이슈번호 `096`을 추출하여 `specs/feat/096-*` 패턴으로 매칭
- `get_feature_dir()`: `specs/feat/` 경로 반영
- `get_feature_paths()`: `FEATURE_DIR`이 `specs/feat/{NNN}-{slug}/`를 가리키도록 수정

#### 0-2. `.specify/scripts/bash/create-new-feature.sh` 수정

변경사항:

- `--no-branch` 플래그 추가: 설정 시 `git checkout -b` 건너뜀 (specify 커맨드에서 직접 브랜치를 먼저 만들기 때문)
- `--type-prefix <prefix>` 플래그 추가: `SPECS_DIR`을 `$REPO_ROOT/specs/$TYPE_PREFIX`로 변경
- `--issue-number <number>` 플래그 추가: JSON 출력에 `ISSUE_NUMBER` 필드 포함
- `SPECS_DIR` 계산: `$REPO_ROOT/specs${TYPE_PREFIX:+/$TYPE_PREFIX}`
- `FEATURE_DIR` 계산: `$SPECS_DIR/$BRANCH_NAME`
- 기존 자동 번호 매기기 로직은 `--number` 플래그로 override 가능 (기존 동작 유지)

#### 0-3. `.specify/scripts/bash/check-prerequisites.sh` 텍스트 수정

`common.sh` 변경이 cascade되므로 별도 수정 불필요. 단, 에러 메시지의 `/speckit.specify` → `/speckits/specify`로 텍스트 수정.

#### 0-4. `.specify/scripts/bash/setup-plan.sh` 검증

`common.sh` 변경이 cascade됨. 별도 수정 불필요.

---

### Phase 1: GitHub Issue Template 생성

#### 1-1. `.github/ISSUE_TEMPLATE/feature_request.md` 신규 생성

```yaml
---
name: "기능 요청"
about: "새로운 기능 개발을 위한 이슈 템플릿 (speckit)"
title: "[FEAT] "
labels: feat
assignees: ""
---

## 개요
> 기능에 대한 간단한 설명

## 목표
- [ ] 핵심 목표 1

## 상세 요구사항
> 기능의 상세 요구사항

## 관련 명세
> `specs/feat/NNN-feature-name/spec.md`

## 참고사항
> 참고할 사항
```

---

### Phase 2: 커맨드 파일 생성 (`.claude/commands/speckits/`)

#### 2-1. `specify.md` — 기존 로직 유지 + 확장

**기반**: `.claude/commands/speckit.specify.md` 전체 내용 보존

**변경 후 전체 흐름**:

1. **[수정]** Context — 페르소나. 서비스 개요 참조 경로를 실제 위치로 수정: `docs/moit/SERVICE_OVERVIEW.md` (moit 앱). weddin 앱의 경우 `docs/weddin/SERVICE_OVERVIEW.md`가 존재하면 참조, 없으면 건너뜀.
2. **[유지]** User Input 분석 (Case 1: 파일, Case 2: 텍스트)
3. **[신규] GitHub Issue & 브랜치 설정**:
   - Step 3.1: 입력에서 영문 kebab-case 슬러그 추출 (기존 `generate_branch_name` 로직 활용)
   - Step 3.2: `gh issue create --title "[FEAT] {FEATURE_SLUG}" --body "..." --label "feat"` → 이슈 번호 캡처
   - Step 3.3: 사용자에게 브랜치 분기 기준 질문 (현재 브랜치 vs develop)
   - Step 3.4: `git checkout -b "feat/#{ISSUE_NUMBER}-{FEATURE_SLUG}"`
   - Step 3.5: `create-new-feature.sh --json --no-branch --type-prefix feat --number {ISSUE_NUMBER} --short-name "{SLUG}" "{DESCRIPTION}"` → `specs/feat/{NNN}-{SLUG}/` 생성
4. **[유지]** CREATE/UPDATE 워크플로우 — 경로만 `specs/feat/{NNN}-{slug}/spec.md`로 변경
   - UPDATE 모드: `specs/feat/` 하위에서 키워드 검색 또는 현재 브랜치 이슈번호로 매칭
5. **[신규] 자동 명확화 루프 (Auto-Clarify)**:
   - 스펙 초안을 6개 카테고리로 스캔: 기능 범위 / 데이터 모델 / UX 플로우 / 엣지 케이스 / 비기능 요구사항 / 외부 연동
   - 모호한 부분에 대해 최대 5개 질문 생성 (선택지 포함, AskUserQuestion 활용)
   - 사용자 응답 → 스펙에 반영 → 다음 질문 (루프)
   - 종료 조건: 5개 질문 완료 / 사용자가 "완료" / 모든 카테고리 명확
   - 명확화 이력을 spec.md `## Clarifications` 섹션에 기록
6. **[유지]** Quality Validation — 기존 체크리스트 생성 로직 보존
7. **[신규] 완료 안내**:
   ```
   📁 specs/feat/{NNN}-{slug}/spec.md
   🔗 GitHub Issue: #{ISSUE_NUMBER}
   🌿 브랜치: feat/#{ISSUE_NUMBER}-{slug}
   👉 다음 단계: /speckits/plan
   ```

#### 2-2. `plan.md` — 기존 로직 + 프로젝트 맞춤

**기반**: `.claude/commands/speckit.plan.md`

**변경사항**:

- **스펙 경로 결정**: 현재 브랜치명 `feat/#{ISSUE_NUMBER}-{slug}` → 이슈번호 추출 → `specs/feat/{NNN}-*/` 폴더 찾기 → `spec.md` 로드 (기존 `setup-plan.sh` 활용, common.sh 수정으로 자동 지원)
- **코드베이스 탐색 단계 추가**: Phase 0 전에 `.claude/project-rules.md` + `.specify/memory/constitution.md` 로드하여 FSD 구조, 기존 features/ 패턴 분석
- **plan.md 생성 내용**: 기술 컨텍스트 (실제 스택), 아키텍처 결정 테이블, FSD 컴포넌트 구조, 데이터 모델, API 계약 (ky 기반 REST), 구현 순서
- **handoff 참조**: `speckit.tasks` → `speckits/tasks`, `speckit.checklist` → `speckits/checklist`

#### 2-3. `tasks.md` — 기존 로직 + 모노레포 경로 규칙

**기반**: `.claude/commands/speckit.tasks.md`

**변경사항**:

- **경로 규칙**: 모노레포 구조 반영
  ```
  apps/{appName}/src/features/{feature-name}/ui/
  apps/{appName}/src/features/{feature-name}/model/
  apps/{appName}/src/entities/{entity}/api/
  apps/{appName}/src/entities/{entity}/dto/
  packages/shared/src/ui/
  ```
- **태스크 포맷**: `- [ ] [T001] [P] [Setup] description \`path\`` (기존 유지)
- **handoff**: `speckit.analyze` → `speckits/analyze`, `speckit.implement` → `speckits/implement`

#### 2-4. `implement.md` — 기존 로직 + FSD 컨벤션 준수

**기반**: `.claude/commands/speckit.implement.md`

**변경사항**:

- **프로젝트 설정 검증**: 기존 generic 패턴(Node.js/Python/Docker) → 이 프로젝트 전용으로 단순화
  - FSD 구조 준수 검증
  - 배럴 패턴 미사용 검증
  - import 방향 검증 (app → features → entities → shared)
  - function declaration 스타일 검증
- **spec.md의 testId 적용** 보장
- **handoff**: `speckits/tasks` 참조

#### 2-5. `clarify.md` — 기존 그대로 이전

**기반**: `.claude/commands/speckit.clarify.md` 그대로 복사

**변경사항**: handoff 참조만 `speckit.plan` → `speckits/plan`으로 수정

#### 2-6. `checklist.md` — 기존 그대로 이전

**기반**: `.claude/commands/speckit.checklist.md` 그대로 복사 (변경 없음)

#### 2-7. `analyze.md` — 기존 그대로 이전

**기반**: `.claude/commands/speckit.analyze.md` 그대로 복사 (변경 없음)

#### 2-8. `constitution.md` — 기존 그대로 이전

**기반**: `.claude/commands/speckit.constitution.md` 그대로 복사

**변경사항**: handoff 참조만 `speckit.specify` → `speckits/specify`로 수정

#### 2-9. `taskstoissues.md` — 기존 그대로 이전

**기반**: `.claude/commands/speckit.taskstoissues.md` 그대로 복사 (변경 없음)

---

### Phase 3: 구 파일 정리

삭제 대상 (`.claude/commands/` 내 flat 파일들):

- `speckit.specify.md`
- `speckit.plan.md`
- `speckit.tasks.md`
- `speckit.implement.md`
- `speckit.clarify.md`
- `speckit.checklist.md`
- `speckit.analyze.md`
- `speckit.constitution.md`
- `speckit.taskstoissues.md`

유지: `pr-develop.md` (speckit과 무관)

---

## 구현 순서 요약

```
Phase 0: 스크립트 수정
  0-1  common.sh — 브랜치 패턴 + 경로 규칙 수정
  0-2  create-new-feature.sh — --no-branch, --type-prefix, --issue-number 플래그
  0-3  check-prerequisites.sh — 에러 메시지 텍스트 수정

Phase 1: Issue Template
  1-1  .github/ISSUE_TEMPLATE/feature_request.md 생성

Phase 2: 커맨드 파일 생성 (.claude/commands/speckits/)
  2-1  specify.md (기존 확장)
  2-2  plan.md (기존 확장)
  2-3  tasks.md (기존 확장)
  2-4  implement.md (기존 확장)
  2-5~2-9  clarify, checklist, analyze, constitution, taskstoissues (이전 + handoff 수정)

Phase 3: 구 파일 정리
  .claude/commands/speckit.*.md 9개 삭제
```

## 검증 방법

1. **스크립트 검증**: `create-new-feature.sh --json --no-branch --type-prefix feat --number 96 --short-name "test-feature" "테스트"` 실행 → `specs/feat/096-test-feature/` 생성 확인
2. **커맨드 확인**: `ls .claude/commands/speckits/` → 9개 md 파일 존재 확인
3. **E2E 테스트**: `/speckits/specify 소셜 로그인 기능 추가` 실행 → Issue 생성, 브랜치 생성, spec.md 경로, auto-clarify 루프 동작 확인
4. **후속 커맨드**: `/speckits/plan` → `/speckits/tasks` → `/speckits/implement` 순서로 실행하여 파이프라인 전체 동작 확인
