# Speckits 워크플로우 가이드

> 기능 명세부터 구현까지의 전체 파이프라인을 관리하는 Claude Code 커맨드 모음

## 전체 파이프라인

```
/speckits/specify  →  /speckits/clarify  →  /speckits/plan  →  /speckits/tasks  →  /speckits/analyze  →  /speckits/implement
      ①                    ②(선택)              ③                   ④                    ⑤(선택)              ⑥
```

보조 커맨드:

- `/speckits/checklist` — 명세 품질 체크리스트 생성 (③ 이후 아무 때나)
- `/speckits/constitution` — 프로젝트 헌법 수정 (독립 실행)
- `/speckits/taskstoissues` — 태스크를 GitHub Issue로 변환 (④ 이후)

---

## 산출물 구조

모든 산출물은 `specs/feat/{NNN}-{slug}/` 하위에 생성됩니다.
(`NNN` = GitHub 이슈번호 zero-pad, 예: 이슈 #96 → `096`)

```
specs/feat/096-social-login/
├── spec.md                    # ① 기능 명세서
├── plan.md                    # ③ 구현 계획서
├── research.md                # ③ 기술 리서치 결과
├── data-model.md              # ③ 데이터 모델 정의
├── tasks.md                   # ④ 실행 태스크 목록
├── contracts/                 # ③ API 계약 명세
│   ├── auth.contract.md
│   └── user.contract.md
└── checklists/                # ①⑦ 품질 체크리스트
    ├── requirements.md        #   (specify 시 자동 생성)
    ├── ux.md                  #   (checklist 커맨드로 생성)
    └── security.md
```

---

## ① `/speckits/specify` — 기능 명세 생성

### 사용법

```
/speckits/specify 소셜 로그인 기능 추가
/speckits/specify 투표 결과를 캘린더에 표시하는 기능
```

### 실행 흐름

| 단계 | 동작                                                 | 사용자 개입                                   |
| ---- | ---------------------------------------------------- | --------------------------------------------- |
| 1    | 기능 설명에서 영문 slug 자동 생성 (`social-login`)   | 없음                                          |
| 2    | GitHub 이슈 설정                                     | **선택 필요** (새 이슈 생성 / 기존 이슈 사용) |
| 3    | 브랜치 분기 기준 선택                                | **선택 필요** (현재 브랜치 / develop)         |
| 4    | `git checkout -b "feat/#96-social-login"`            | 없음                                          |
| 5    | `specs/feat/096-social-login/` 디렉토리 생성         | 없음                                          |
| 6    | spec.md 초안 작성 (기능 범위, 유저 스토리, 요구사항) | 없음                                          |
| 7    | Auto-Clarify 루프 (최대 5개 질문)                    | **답변 필요**                                 |
| 8    | 품질 체크리스트 생성                                 | 없음                                          |

### 산출물

| 파일                                                 | 설명                                           |
| ---------------------------------------------------- | ---------------------------------------------- |
| `specs/feat/{NNN}-{slug}/spec.md`                    | 기능 명세서 (유저 스토리, 요구사항, 성공 기준) |
| `specs/feat/{NNN}-{slug}/checklists/requirements.md` | 명세 품질 체크리스트                           |
| GitHub Issue `#{NNN}`                                | `[FEAT] {slug}` 제목의 이슈                    |
| Git Branch `feat/#{NNN}-{slug}`                      | 피처 브랜치                                    |

### spec.md 주요 섹션

```markdown
# Feature: {기능명}

## User Scenarios & Testing # P1/P2/P3 우선순위별 유저 스토리

## Functional Requirements # 테스트 가능한 기능 요구사항

## Success Criteria # 측정 가능한 성공 기준 (기술 비의존적)

## Edge Cases # 엣지 케이스

## Assumptions # 합리적 기본값/가정

## Clarifications # 명확화 이력 (자동 기록)
```

### UPDATE 모드

기존 스펙 수정 시에는 현재 브랜치의 이슈번호로 자동 매칭합니다.

```
/speckits/specify 소셜 로그인에 카카오톡 추가    # 현재 feat/#96 브랜치에 있으면 자동 매칭
```

---

## ② `/speckits/clarify` — 명세 명확화 (선택)

> specify에 Auto-Clarify가 내장되어 있으므로, 추가 명확화가 필요할 때만 실행

### 사용법

```
/speckits/clarify
/speckits/clarify 보안 관련 요구사항 중심으로
```

### 실행 흐름

| 단계 | 동작                                 |
| ---- | ------------------------------------ |
| 1    | 현재 브랜치의 spec.md 로드           |
| 2    | 10개 카테고리로 모호성 스캔          |
| 3    | 최대 5개 질문 (하나씩 순차 제시)     |
| 4    | 각 답변을 spec.md에 즉시 반영        |
| 5    | `## Clarifications` 섹션에 이력 기록 |

### 스캔 카테고리

| 카테고리          | 검사 내용                            |
| ----------------- | ------------------------------------ |
| 기능 범위         | 핵심 목표, out-of-scope, 사용자 역할 |
| 데이터 모델       | 엔티티, 관계, 상태 전이              |
| UX 플로우         | 유저 저니, 에러/빈 상태              |
| 비기능            | 성능, 확장성, 보안                   |
| 외부 연동         | 외부 API, 실패 모드                  |
| 엣지 케이스       | 부정 시나리오, 충돌 해결             |
| 제약/트레이드오프 | 기술 제약, 명시적 트레이드오프       |
| 용어 일관성       | 표준 용어, 사용 금지 동의어          |

### 산출물

| 파일             | 설명                                              |
| ---------------- | ------------------------------------------------- |
| `spec.md` (수정) | 명확화된 요구사항 반영 + Clarifications 섹션 추가 |

---

## ③ `/speckits/plan` — 구현 계획 수립

### 사용법

```
/speckits/plan
/speckits/plan TDD 접근으로
```

### 실행 흐름

| 단계 | 동작                                                           |
| ---- | -------------------------------------------------------------- |
| 1    | spec.md, constitution.md, project-rules.md 로드                |
| 2    | 기존 코드베이스 탐색 (features/, entities/, shared/ 패턴 분석) |
| 3    | 기술 컨텍스트 정의 (실제 스택 반영)                            |
| 4    | Constitution 준수 검증                                         |
| 5    | Phase 0: 리서치 → research.md 생성                             |
| 6    | Phase 1: 설계 → data-model.md, contracts/ 생성                 |
| 7    | 아키텍처 결정 테이블 작성                                      |

### 자동 반영되는 기술 스택

| 항목          | 기술                                         |
| ------------- | -------------------------------------------- |
| 언어          | TypeScript 5                                 |
| 프레임워크    | Next.js 16 (App Router), React 19            |
| 스타일링      | Tailwind CSS 4 + CVA + clsx + tailwind-merge |
| HTTP          | ky                                           |
| 유효성 검증   | zod                                          |
| UI 프리미티브 | Radix UI, vaul                               |
| 테스팅        | Vitest + Playwright                          |

### 산출물

| 파일            | 설명                                              |
| --------------- | ------------------------------------------------- |
| `plan.md`       | 기술 컨텍스트, 아키텍처 결정, FSD 구조, 구현 순서 |
| `research.md`   | 기술 리서치 결과 (결정 + 근거 + 대안)             |
| `data-model.md` | 엔티티 정의, 관계, 속성                           |
| `contracts/`    | API 엔드포인트별 계약 명세 (ky 기반 REST)         |

### plan.md 주요 섹션

```markdown
# Implementation Plan: {기능명}

## Technical Context # 사용 기술 + 의존성

## Constitution Check # FSD/배럴 등 규칙 준수 확인

## Project Structure # FSD 컴포넌트 구조

apps/{app}/src/
├── app/{route}/page.tsx # 얇은 라우팅
├── features/{name}/
│ ├── ui/ # 페이지 + UI 컴포넌트
│ ├── model/ # 훅 (상태/비즈니스 로직)
│ └── lib/ # 순수 유틸리티
├── entities/{entity}/
│ ├── api/ # API 함수 (ky)
│ └── dto/ # 타입 정의
└── shared/ # 도메인 무관 공유 코드

## Architecture Decisions # 결정 테이블 (선택지 + 근거)
```

---

## ④ `/speckits/tasks` — 실행 태스크 생성

### 사용법

```
/speckits/tasks
/speckits/tasks TDD 포함
```

### 실행 흐름

| 단계 | 동작                                             |
| ---- | ------------------------------------------------ |
| 1    | plan.md, spec.md, data-model.md, contracts/ 로드 |
| 2    | 유저 스토리별 우선순위 추출 (P1, P2, P3)         |
| 3    | 엔티티-스토리-엔드포인트 매핑                    |
| 4    | Phase별 태스크 생성                              |
| 5    | 의존성 그래프 + 병렬 실행 기회 식별              |

### 태스크 포맷

```markdown
- [ ] T001 Create project structure per implementation plan
- [ ] T005 [P] Implement auth middleware in apps/moit/src/features/auth/model/useAuth.ts
- [ ] T012 [P] [US1] Create User model in apps/moit/src/entities/user/dto/user.dto.ts
```

| 요소    | 설명                                   |
| ------- | -------------------------------------- |
| `- [ ]` | 체크박스 (완료 시 `- [x]`)             |
| `T001`  | 순차 태스크 ID                         |
| `[P]`   | 병렬 실행 가능 표시 (선택)             |
| `[US1]` | 유저 스토리 매핑 (스토리 페이즈에서만) |
| 설명    | 정확한 파일 경로 포함                  |

### Phase 구조

| Phase    | 내용                                   | [P] 여부  |
| -------- | -------------------------------------- | --------- |
| Phase 1  | Setup (프로젝트 초기화)                | 순차      |
| Phase 2  | Foundational (모든 스토리의 전제 조건) | 순차      |
| Phase 3+ | User Story별 (P1 → P2 → P3 순서)       | 병렬 가능 |
| Final    | Polish & 공통 관심사                   | 순차      |

### 모노레포 경로 규칙

```
apps/{appName}/src/app/          → Next.js 라우팅 (얇은 페이지)
apps/{appName}/src/features/     → FSD 피처 (동사 기반: meet-create, meet-vote)
  {feature}/ui/                  → 페이지 + UI 컴포넌트
  {feature}/model/               → 훅 (상태/비즈니스 로직)
  {feature}/lib/                 → 순수 유틸리티
apps/{appName}/src/entities/     → 도메인 엔티티 (명사 기반: meet, voteDateStat)
  {entity}/api/                  → API 함수 (ky 기반)
  {entity}/dto/                  → TypeScript 타입/인터페이스
  {entity}/lib/                  → 목/픽스처 데이터
apps/{appName}/src/shared/       → 앱 로컬 공유 코드
packages/shared/src/             → 크로스앱 공유 컴포넌트
```

### 산출물

| 파일       | 설명                                              |
| ---------- | ------------------------------------------------- |
| `tasks.md` | Phase별 실행 태스크 목록 (의존성, 병렬 표시 포함) |

---

## ⑤ `/speckits/analyze` — 일관성 분석 (선택)

> 구현 전 spec ↔ plan ↔ tasks 간 불일치를 사전에 발견

### 사용법

```
/speckits/analyze
```

### 검사 항목

| 카테고리          | 검사 내용                                  | 심각도       |
| ----------------- | ------------------------------------------ | ------------ |
| 중복              | 유사 요구사항 중복                         | HIGH         |
| 모호성            | "빠른", "확장 가능한" 등 정량화 없는 표현  | MEDIUM       |
| 미명세            | 측정 가능한 결과 없는 요구사항             | MEDIUM       |
| Constitution 위반 | MUST 원칙 충돌                             | **CRITICAL** |
| 커버리지          | 태스크 없는 요구사항, 요구사항 없는 태스크 | HIGH         |
| 불일치            | 용어 혼용, 데이터 모델 불일치, 순서 모순   | MEDIUM       |

### 산출물

| 출력        | 설명                                                 |
| ----------- | ---------------------------------------------------- |
| 콘솔 리포트 | 발견사항 테이블 (최대 50건) + 커버리지 요약 + 메트릭 |

파일 수정 없음 (읽기 전용 분석).

### 리포트 예시

```markdown
| ID  | Category     | Severity | Location         | Summary           | Recommendation     |
| --- | ------------ | -------- | ---------------- | ----------------- | ------------------ |
| A1  | Duplication  | HIGH     | spec.md:L120-134 | 유사 요구사항 2건 | 병합 권장          |
| D1  | Constitution | CRITICAL | plan.md:L45      | 배럴 export 사용  | 직접 import로 변경 |

커버리지: 92% (24/26 요구사항에 태스크 매핑됨)
```

---

## ⑥ `/speckits/implement` — 구현 실행

### 사용법

```
/speckits/implement
/speckits/implement Phase 3부터 시작
```

### 실행 흐름

| 단계 | 동작                                              | 중단 조건                           |
| ---- | ------------------------------------------------- | ----------------------------------- |
| 1    | 체크리스트 완료 상태 확인                         | 미완료 항목 있으면 사용자 확인 요청 |
| 2    | tasks.md, plan.md, data-model.md, contracts/ 로드 | 필수 파일 누락 시 에러              |
| 3    | Phase별 순차 실행                                 | -                                   |
| 4    | 각 태스크 실행 전 FSD 컨벤션 검증                 | 위반 시 경고                        |
| 5    | 완료된 태스크를 `- [x]`로 표시                    | -                                   |
| 6    | 최종 검증                                         | 테스트 실패 시 보고                 |

### 태스크 실행 전 컨벤션 검증

| 규칙            | 검증 내용                                                  |
| --------------- | ---------------------------------------------------------- |
| FSD 구조        | 코드가 올바른 레이어에 위치 (app/features/entities/shared) |
| 배럴 금지       | `index.ts` 재export 파일 미사용                            |
| Import 방향     | `app → features → entities → shared` (역방향 금지)         |
| 컴포넌트 스타일 | `export default function X()` (arrow function const 금지)  |
| 네이밍          | 컴포넌트 PascalCase, 훅 `use*` camelCase, DTO `.dto.ts`    |
| 변수            | `const` 기본, `let` 재할당만, `var` 금지                   |

### 산출물

| 파일              | 설명                             |
| ----------------- | -------------------------------- |
| 소스 코드         | tasks.md에 정의된 모든 구현 파일 |
| `tasks.md` (수정) | 완료된 태스크에 `[x]` 표시       |

---

## ⑦ `/speckits/checklist` — 명세 품질 체크리스트

> 요구사항의 품질을 검증하는 체크리스트를 생성 (구현 검증이 아님)

### 사용법

```
/speckits/checklist UX 관점
/speckits/checklist 보안 요구사항 검증
/speckits/checklist API 명세 품질
```

### 핵심 개념

```
명세가 "영어로 쓴 코드"라면, 체크리스트는 그 코드의 "단위 테스트"
→ 구현이 잘 동작하는지가 아니라, 요구사항이 잘 쓰여졌는지를 검증
```

| 올바른 예                                                      | 잘못된 예                    |
| -------------------------------------------------------------- | ---------------------------- |
| "모든 인터랙티브 요소에 호버 상태 요구사항이 정의되어 있는가?" | "호버 상태가 잘 동작하는가?" |
| "'빠른 로딩'이 구체적인 시간 기준으로 정량화되어 있는가?"      | "로딩이 빠른가?"             |
| "에러 응답 형식이 모든 실패 시나리오에 대해 명세되어 있는가?"  | "에러 처리가 잘 되는가?"     |

### 체크리스트 유형별 파일명

| 도메인   | 파일명            | 설명                                    |
| -------- | ----------------- | --------------------------------------- |
| UX       | `ux.md`           | UI/UX 요구사항 품질                     |
| API      | `api.md`          | API 명세 품질                           |
| 보안     | `security.md`     | 보안 요구사항 품질                      |
| 성능     | `performance.md`  | 성능 요구사항 품질                      |
| 요구사항 | `requirements.md` | 전반적 명세 품질 (specify 시 자동 생성) |

### 산출물

| 파일                     | 설명                               |
| ------------------------ | ---------------------------------- |
| `checklists/{domain}.md` | 도메인별 품질 체크리스트 (CHK001~) |

---

## ⑧ `/speckits/constitution` — 프로젝트 헌법 관리

> 프로젝트의 핵심 원칙과 규칙을 정의/수정

### 사용법

```
/speckits/constitution
/speckits/constitution 새로운 원칙 추가: 모든 API 응답에 에러 코드 포함
```

### 현재 헌법 원칙 (v1.0.0)

| 원칙                        | 내용                                          |
| --------------------------- | --------------------------------------------- |
| FSD Architecture            | 코드는 반드시 올바른 FSD 레이어에 위치        |
| Monorepo Structure          | npm workspaces 기반 모노레포 구조 준수        |
| No Barrel Exports           | index.ts 재export 금지, 직접 import           |
| Unidirectional Dependencies | app → features → entities → shared 방향만     |
| Consistent Code Style       | function declaration, const 기본, 네이밍 규칙 |

### 산출물

| 파일                                     | 설명                                 |
| ---------------------------------------- | ------------------------------------ |
| `.specify/memory/constitution.md` (수정) | 업데이트된 헌법 + Sync Impact Report |

버전은 시맨틱 버저닝으로 관리: MAJOR(원칙 제거/재정의) / MINOR(원칙 추가) / PATCH(문구 수정)

---

## ⑨ `/speckits/taskstoissues` — 태스크 → GitHub Issues

### 사용법

```
/speckits/taskstoissues
```

### 실행 흐름

| 단계 | 동작                                  |
| ---- | ------------------------------------- |
| 1    | tasks.md 로드                         |
| 2    | Git remote URL 확인 (GitHub인지 검증) |
| 3    | 각 태스크를 GitHub Issue로 생성       |

### 산출물

| 출력          | 설명                                   |
| ------------- | -------------------------------------- |
| GitHub Issues | tasks.md의 각 태스크에 대응하는 이슈들 |

---

## 빠른 참조: 커맨드 의존성

```
/speckits/constitution ─────────────── (독립, 언제든 실행 가능)

/speckits/specify ──┬── /speckits/clarify ──── /speckits/plan ──┬── /speckits/tasks ──┬── /speckits/analyze
                    │        (선택)                              │       │              │      (선택)
                    │                                            │       │              │
                    └────────────────────────────────────────────-┘       │              └── /speckits/implement
                                                                         │
                                                                         └── /speckits/taskstoissues
                                                                                (선택)

/speckits/checklist ─────────────────── (specify 이후 아무 때나)
```

### 필수 순서

```
specify → plan → tasks → implement
```

### 권장 순서 (풀 파이프라인)

```
specify → (clarify) → plan → tasks → (analyze) → implement
```

---

## 자주 묻는 질문

### Q: specify 실행 시 GitHub 인증이 필요한가요?

`gh auth status`로 확인됩니다. 미인증 시 `gh auth login`을 먼저 실행하세요.

### Q: 이미 브랜치와 이슈가 있는 상태에서 specify를 실행하면?

UPDATE 모드로 동작하여 기존 spec.md를 수정합니다. 현재 브랜치의 이슈번호로 자동 매칭합니다.

### Q: clarify를 반드시 실행해야 하나요?

아닙니다. specify에 Auto-Clarify가 내장되어 있어 기본적인 명확화는 자동으로 수행됩니다. 추가 정제가 필요할 때만 실행하세요.

### Q: 테스트 코드도 자동 생성되나요?

기본적으로 태스크에 테스트는 포함되지 않습니다. TDD가 필요하면 `/speckits/tasks TDD 포함`처럼 명시하세요.

### Q: moit과 weddin 앱 모두에 걸친 기능은?

specify 시 기능 설명에 대상 앱을 명시하면, plan 단계에서 양쪽 앱의 기존 패턴을 모두 분석하여 계획을 세웁니다.

### Q: 중간에 실패하면 어디서부터 다시 시작하나요?

각 커맨드는 독립적으로 재실행 가능합니다. implement의 경우 tasks.md의 `[x]` 표시를 보고 미완료 태스크부터 이어서 실행합니다.
