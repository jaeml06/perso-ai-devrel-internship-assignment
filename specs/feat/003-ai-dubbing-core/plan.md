# Implementation Plan: AI 더빙 코어 기능 (ElevenLabs TTS)

**Branch**: `feat/#3-ai-dubbing-core` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: ElevenLabs API를 활용한 텍스트→음성 변환(TTS) 더빙 웹 서비스 핵심 기능 구현

## Summary

Next.js 16 App Router 기반 단일 앱에서 ElevenLabs TTS API를 서버 측에서 프록시하여 텍스트를 음성으로
변환한다. API 키는 서버 Route Handler에서만 접근하며 클라이언트에 노출되지 않는다. 음성은 성별·나이대로
분류된 5개의 프리메이드 목록을 정적으로 제공하고, 생성된 오디오는 브라우저 오디오 플레이어로 재생 후
다운로드할 수 있다.

**TDD 접근**: 각 레이어를 아래 순서로 테스트 먼저(Red-Green-Refactor) 구현한다.

```
lib (순수 유틸) → entities (API/DTO) → Route Handlers → model (훅) → UI 컴포넌트
```

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**:
- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + clsx + tailwind-merge (설치됨)
- ky (HTTP 클라이언트) — **미설치, 추가 필요**
- zod (스키마 검증) — **미설치, 추가 필요**
- ElevenLabs REST API (외부, 서버 측에서만 호출)

**Storage**: N/A (세션 내 메모리만 사용, 서버 저장 없음)
**Testing**: Vitest + @testing-library/react + jsdom (설치됨)
**Target Platform**: 웹 브라우저 (Next.js 서버 포함)
**Project Type**: 단일 Next.js 웹 애플리케이션 (`src/` 루트)
**Performance Goals**: 1,000자 이하 텍스트 → 30초 이내 오디오 재생 가능 상태
**Constraints**: ElevenLabs 무료 플랜 5,000자 제한 / API 키 클라이언트 비노출
**Scale/Scope**: 단일 사용자 데모, 인증 없음 (PR3에서 구현 예정)

## Constitution Check

_GATE: FSD 레이어 준수, 배럴 export 금지, 단방향 의존성_

| 항목 | 상태 | 비고 |
|------|------|------|
| FSD 레이어 준수 | ✅ PASS | `app → features → entities → shared` 방향 유지 |
| 배럴 export 금지 | ✅ PASS | 모든 import는 구체 파일 경로 사용 |
| 단방향 의존성 | ✅ PASS | `lib → model → ui → app`, entities는 shared만 import |
| Next.js Route Handler 위치 | ✅ PASS | `app/api/` — FSD에서 app 레이어에 위치하므로 적합 |
| 컴포넌트 스타일 | ✅ PASS | function declaration 강제 |
| ky/zod 미설치 | ⚠️ NOTE | 사용 전 `npm install ky zod` 필요 |

## Project Structure

### Documentation (this feature)

```text
specs/feat/003-ai-dubbing-core/
├── plan.md              ← 이 파일 (/speckits:plan 출력)
├── research.md          ← Phase 0 출력 (/speckits:plan)
├── data-model.md        ← Phase 1 출력 (/speckits:plan)
├── contracts/
│   ├── GET-voices.md    ← Phase 1 출력
│   └── POST-tts.md      ← Phase 1 출력
└── tasks.md             ← Phase 2 출력 (/speckits:tasks — 미생성)
```

### Source Code

```text
src/
├── app/
│   ├── api/
│   │   ├── voices/
│   │   │   └── route.ts              # GET /api/voices — 음성 목록 반환
│   │   └── tts/
│   │       └── route.ts              # POST /api/tts — ElevenLabs TTS 프록시
│   ├── dashboard/
│   │   └── page.tsx                  # 라우팅 전용 (thin)
│   ├── globals.css
│   └── layout.tsx
│
├── features/
│   └── dubbing-create/               # 동사 기반: "더빙 생성"
│       ├── ui/
│       │   ├── DubbingDashboardPage.tsx  # 조립 담당 Page
│       │   ├── DubbingForm.tsx           # 텍스트 입력 + 음성 선택 + 제출
│       │   ├── VoiceSelector.tsx         # 드롭다운 + 미리듣기 버튼
│       │   └── AudioPlayer.tsx           # 재생/일시정지/탐색/다운로드
│       ├── model/
│       │   └── useDubbingCreate.ts       # 폼 상태, 제출, 로딩, 에러, 오디오 결과
│       └── lib/
│           └── validateDubbingInput.ts   # 순수 유효성 검증 함수
│
├── entities/
│   ├── voice/
│   │   ├── dto/
│   │   │   └── voice.dto.ts              # Voice, VoiceListResponse 타입
│   │   └── api/
│   │       └── getVoices.ts              # GET /api/voices 호출
│   └── dubbing/
│       ├── dto/
│       │   └── dubbing.dto.ts            # DubbingRequest, DubbingResponse 타입
│       └── api/
│           └── createDubbing.ts          # POST /api/tts 호출
│
├── shared/
│   ├── lib/
│   │   └── cn.ts                         # (기존)
│   ├── config/
│   │   └── env.ts                        # ELEVENLABS_API_KEY 환경변수 접근
│   └── ui/
│       └── LayoutShell.tsx               # (기존)
│
└── __tests__/                            # 기존 테스트 구조 유지
    ├── features/
    │   └── dubbing-create/
    │       ├── lib/validateDubbingInput.test.ts
    │       ├── model/useDubbingCreate.test.tsx
    │       └── ui/
    │           ├── DubbingForm.test.tsx
    │           ├── VoiceSelector.test.tsx
    │           └── AudioPlayer.test.tsx
    ├── entities/
    │   ├── voice/api/getVoices.test.ts
    │   └── dubbing/api/createDubbing.test.ts
    └── app/
        └── api/
            ├── voices.route.test.ts
            └── tts.route.test.ts
```

**Structure Decision**: 단일 프로젝트 구조. `src/` 하위에 FSD 레이어 직접 배치.

## Phase 0 — Research Findings

→ 상세 내용: [research.md](./research.md)

| 미지 항목 | 결정 | 근거 |
|-----------|------|------|
| ElevenLabs TTS 엔드포인트 | `POST /v1/text-to-speech/{voice_id}` | 공식 API 문서 |
| ElevenLabs 음성 목록 방식 | 6개 프리메이드 음성 정적 구성 | 무료 플랜 + 안정성 (중년 여성 Dorothy 추가) |
| 오디오 전달 방식 | Route Handler → `application/octet-stream` → 클라이언트 Blob URL | 스트리밍 단순화 |
| HTTP 클라이언트 (Route Handler) | 네이티브 `fetch` | 서버 컴포넌트 환경, 의존성 최소화 |
| HTTP 클라이언트 (entity API) | `ky` | constitution 표준 |
| 유효성 검증 라이브러리 | `zod` (Route Handler 입력 검증) | constitution 표준 |
| 오디오 플레이어 | HTML5 `<audio>` + `useRef` | 외부 의존성 없음 |
| 언어 선택 | 드롭다운: `ko` / `en` | spec 요구사항 |

## Phase 1 — Design & Contracts

→ 엔티티 상세: [data-model.md](./data-model.md)
→ API 계약: [contracts/GET-voices.md](./contracts/GET-voices.md), [contracts/POST-tts.md](./contracts/POST-tts.md)

### TDD 구현 순서 (Red-Green-Refactor Cycles)

#### Cycle 0 — 환경 설정 (선결 조건)

```bash
npm install ky zod
```

- `src/shared/config/env.ts` 작성: `ELEVENLABS_API_KEY` 서버 전용 접근 + 미설정 시 에러
- **테스트**: env 미설정 시 에러 throw 확인

#### Cycle 1 — 순수 유효성 검증 (`features/dubbing-create/lib/`)

**테스트 먼저 (Red)**:
```typescript
// src/__tests__/features/dubbing-create/lib/validateDubbingInput.test.ts
describe('validateDubbingInput', () => {
  it('빈 텍스트를 거부한다')
  it('5000자 초과 텍스트를 거부한다')
  it('voiceId 미선택을 거부한다')
  it('유효하지 않은 language를 거부한다')
  it('유효한 입력은 통과한다')
})
```

**구현 (Green)**: `validateDubbingInput(text, voiceId, language)` 함수 작성

#### Cycle 2 — Route Handler: 음성 목록 (`app/api/voices/route.ts`)

**테스트 먼저 (Red)**:
```typescript
// src/__tests__/app/api/voices.route.test.ts
describe('GET /api/voices', () => {
  it('6개의 음성 목록을 반환한다')
  it('각 음성은 id, name, gender, ageGroup, previewUrl을 포함한다')
  it('성별과 나이대로 구분된 음성이 포함된다')
})
```

**구현 (Green)**: 하드코딩된 VOICES 상수 + Route Handler

#### Cycle 3 — Route Handler: TTS 변환 (`app/api/tts/route.ts`)

**테스트 먼저 (Red)**:
```typescript
// src/__tests__/app/api/tts.route.test.ts
describe('POST /api/tts', () => {
  it('텍스트와 voiceId로 ElevenLabs API를 호출한다')
  it('빈 텍스트에 400을 반환한다')
  it('5000자 초과 텍스트에 400을 반환한다')
  it('API 키 미설정 시 500을 반환한다')
  it('ElevenLabs 401 응답 시 서비스 오류 메시지를 반환한다')
  it('ElevenLabs 429 응답 시 크레딧 부족 메시지를 반환한다')
  it('오디오 Blob을 application/octet-stream으로 반환한다')
})
```

**구현 (Green)**: zod 검증 + native fetch로 ElevenLabs 호출 + 오디오 스트리밍

#### Cycle 4 — Entity API 함수

**테스트 먼저 (Red)**:
```typescript
// src/__tests__/entities/voice/api/getVoices.test.ts
describe('getVoices', () => {
  it('/api/voices를 호출하고 음성 배열을 반환한다')
  it('API 에러 시 예외를 throw한다')
})

// src/__tests__/entities/dubbing/api/createDubbing.test.ts
describe('createDubbing', () => {
  it('/api/tts를 POST 요청으로 호출한다')
  it('오디오 Blob을 반환한다')
  it('400 에러 시 메시지와 함께 예외를 throw한다')
})
```

**구현 (Green)**: ky를 사용한 API 함수

#### Cycle 5 — 상태 훅 (`features/dubbing-create/model/`)

**테스트 먼저 (Red)**:
```typescript
// src/__tests__/features/dubbing-create/model/useDubbingCreate.test.tsx
describe('useDubbingCreate', () => {
  it('초기 상태: 빈 폼, 로딩 없음, 오디오 없음')
  it('빈 텍스트 제출 시 유효성 에러 표시')
  it('음성 미선택 제출 시 유효성 에러 표시')
  it('제출 중 isLoading이 true가 된다')
  it('제출 성공 시 audioUrl이 설정된다')
  it('제출 성공 후 isLoading이 false가 된다')
  it('API 에러 시 errorMessage가 설정된다')
  it('진행 중 중복 제출이 방지된다')
})
```

**구현 (Green)**: `useDubbingCreate` 훅 (validateDubbingInput + createDubbing 조합)

#### Cycle 6 — UI 컴포넌트

**테스트 먼저 (Red)**:

```typescript
// VoiceSelector.test.tsx
describe('VoiceSelector', () => {
  it('음성 목록이 드롭다운에 표시된다')
  it('음성 선택 시 onChange가 호출된다')
  it('선택된 음성에 미리듣기 버튼이 표시된다')
  it('미리듣기 버튼 클릭 시 오디오가 재생된다')
  it('API 에러 시 에러 메시지와 재시도 버튼을 표시한다')
})

// DubbingForm.test.tsx
describe('DubbingForm', () => {
  it('텍스트 입력란과 음성 선택, 언어 선택, 제출 버튼을 렌더링한다')
  it('텍스트 길이가 0일 때 글자 수 카운터가 "0/5000"을 표시한다')
  it('빈 텍스트로 제출 시 유효성 에러 메시지를 표시한다')
  it('로딩 중 제출 버튼이 비활성화된다')
})

// AudioPlayer.test.tsx
describe('AudioPlayer', () => {
  it('재생 버튼을 렌더링한다')
  it('재생 버튼 클릭 시 오디오가 재생된다')
  it('다운로드 버튼을 렌더링한다')
})
```

**구현 (Green)**: 각 UI 컴포넌트 function declaration으로 작성

#### Cycle 7 — 조립 Page + 라우팅

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <DubbingDashboardPage />;
}
```

## Architecture Decision Table

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|-----------|------|------|
| ElevenLabs 통신 위치 | Client Direct / Server Proxy | **Server Route Handler** | API 키 보안 (FR-001) |
| 음성 목록 관리 | ElevenLabs `/v1/voices` API 호출 / 정적 구성 | **정적 구성 (VOICES 상수)** | 무료 플랜 API 절약, 안정성, 빠른 로드 |
| 오디오 전달 방식 | Base64 JSON / Blob Stream / Signed URL | **Blob Stream (octet-stream)** | 메모리 효율, 단순성 |
| 오디오 플레이어 | `<audio>` 네이티브 / react-h5-audio-player / Howler.js | **HTML5 `<audio>` + useRef** | 외부 의존성 없음, 충분한 기능 |
| HTTP 클라이언트 | fetch 네이티브 / ky / axios | **ky (클라이언트) + fetch (서버)** | constitution 표준 (ky), 서버는 의존성 최소화 |
| 입력 검증 레이어 | 클라이언트 only / 서버 only / 양쪽 | **양쪽 모두** | 클라이언트: UX (즉각 피드백), 서버: 보안 |
| 테스트 위치 | `__tests__/` 중앙화 / 파일 옆 co-located | **`__tests__/` 중앙화** | 기존 프로젝트 패턴 (`src/__tests__/`) 유지 |

## Complexity Tracking

헌법 위반 없음. 추가 복잡성 불필요.
