# Research: 연속 더빙 생성 복구

**Feature**: `/Users/jaemin/Desktop/career-docs/coding-tests/perso-ai-devrel-internship-assignment/specs/feat/010-repeat-dubbing/spec.md`  
**Date**: 2026-03-10

## Decision 1: 버그 수정 범위는 클라이언트 세션 상태 재설계로 한정한다

**Decision**: 서버 Route Handler나 entity API contract를 바꾸지 않고, `/src/features/dubbing-create/model/useDubbingCreate.ts`의 상태 전이 규칙을 수정한다.

**Rationale**:
- 현재 재생성 차단 원인은 `submit()`의 `pipelineStatus` 가드가 `complete` 상태를 거부하는 클라이언트 로직이다.
- 스펙의 FR-001, FR-003, FR-004는 모두 "같은 화면에서 다시 시작"과 "이전 상태 정리"에 초점을 둔다.
- 기존 `/api/stt`, `/api/translate`, `/api/tts`는 각 요청을 독립 처리하며, 반복 요청 자체를 막는 서버 규칙은 없다.

**Alternatives considered**:
- 신규 `/api/dubbing` 통합 엔드포인트 추가: 버그 범위보다 변경 폭이 크고 TDD 범위를 불필요하게 확장한다.
- 페이지 강제 새로고침/route refresh: 문제를 우회할 뿐 세션 UX 문제를 해결하지 못한다.

## Decision 2: submit 가능 조건은 "진행 중이 아님"으로 단순화한다

**Decision**: `submit()`은 `idle`, `complete`, `error`에서 허용하고 `transcribing`, `translating`, `synthesizing`에서만 차단한다.

**Rationale**:
- FR-004와 SC-005가 명시적으로 "진행 중 상태에서만" 중복 요청 차단을 요구한다.
- 완료와 실패를 별도 잠금 상태로 유지하면 반복 생성 흐름과 충돌한다.
- 별도 `canSubmit` 상태를 두지 않아도 `pipelineStatus`만으로 테스트와 구현을 설명할 수 있다.

**Alternatives considered**:
- `complete` 진입 직후 자동으로 `idle`로 되돌리기: 완료 UI를 즉시 잃어버려 FR-003a 이전 시점의 결과 확인과 충돌할 수 있다.
- `isLocked` 같은 추가 boolean 도입: 상태 표현이 중복되고 테스트 조합이 늘어난다.

## Decision 3: 새 attempt 시작 시 입력은 보존하고 파생 상태만 초기화한다

**Decision**: 새 submit/retry가 수락되는 즉시 `audioUrl`, `transcription`, `translation`, `errorMessage`, 완료 표시를 초기화하고, `file`, `targetLanguage`, `voiceId`는 유지한다.

**Rationale**:
- FR-003, FR-003a, FR-005a를 동시에 만족하려면 입력과 결과를 분리한 상태 모델이 필요하다.
- 이전 성공 결과와 실패 메시지를 남겨두면 현재 실행 중 단계와 혼동된다.
- retry와 fresh submit이 같은 reset 경로를 공유하면 행동 규칙이 일관된다.

**Alternatives considered**:
- 모든 상태를 전부 초기화: 입력 유지 요구를 깨뜨린다.
- 이전 결과를 STT 성공 이후까지 유지: 새 작업이 이미 시작된 뒤에도 오래된 결과가 노출되어 SC-004에 어긋난다.

## Decision 4: 반복 생성은 attempt 단위로 표현한다

**Decision**: 내부 설계에서 각 submit/retry를 별도 `GenerationAttempt`로 보고, 동일 입력 조합도 새로운 attempt로 취급한다.

**Rationale**:
- FR-006은 동일 입력 반복 요청도 별개 작업으로 처리해야 한다고 명시한다.
- attempt 개념을 두면 테스트에서 "같은 입력이지만 새 실행"을 명확히 설명할 수 있다.
- UI에는 attempt id를 직접 노출하지 않아도 설계 상 "현재 작업 기준 상태"를 분리하는 근거가 된다.

**Alternatives considered**:
- 입력 변경 감지 후에만 새 작업 허용: 스펙과 직접 충돌한다.
- request payload hash 비교: 버그 해결에 비해 불필요하게 복잡하다.

## Decision 5: Blob URL 수명 관리는 훅이 책임진다

**Decision**: 새 결과가 생성되기 전 기존 Blob URL을 정리하고, 훅 unmount 시에도 `URL.revokeObjectURL()`을 호출하는 방향으로 설계한다.

**Rationale**:
- 반복 생성 시 오디오 결과가 교체되므로 URL 수명도 세션 상태와 함께 관리되어야 한다.
- `createDubbing()`은 API 호출 함수로 유지하고, 세션 라이프사이클을 아는 훅이 정리 책임을 가지는 편이 FSD 상 자연스럽다.
- TDD로 URL 교체/cleanup 호출을 검증할 수 있다.

**Alternatives considered**:
- `AudioPlayer`가 revoke 수행: 컴포넌트 교체/조건부 렌더링 타이밍에 의존해 책임 경계가 흐려진다.
- revoke 없이 `setAudioUrl(null)`만 수행: 반복 사용 시 누수 위험이 남는다.

## Decision 6: 테스트는 훅 중심으로 먼저 확장하고 UI 테스트는 회귀 포인트만 보강한다

**Decision**: `useDubbingCreate.test.tsx`를 1차 안전망으로 삼고, `DubbingDashboardPage.test.tsx`와 `PipelineProgress.test.tsx`에는 "이전 결과 숨김"과 "현재 attempt 표시" 회귀만 추가한다.

**Rationale**:
- 상태 전이 버그의 중심은 훅에 있으므로 가장 세밀한 검증이 가능하다.
- UI 테스트는 표시 조건과 버튼 wiring만 확인해도 회귀를 충분히 잡을 수 있다.
- TDD 순서를 훅 → 조립 UI로 두면 실패 원인 위치가 명확하다.

**Alternatives considered**:
- E2E만으로 검증: 실패 원인 위치를 좁히기 어렵고 Red-Green 사이클이 느리다.
- UI 테스트만으로 검증: 상태 전이 세부사항을 충분히 고정하기 어렵다.
