<!-- AI 누수 방지 게이트(B1) 설계 — 회차 확정 전 프롬프트 누수 차단 + 상투구 경고 -->

# AI 누수 방지 게이트 (B1) 설계

> 2026-06-21 · feature `B1-ai-leak-gate` · 브랜치 `feat/ai-leak-gate`
> **근거** — UX 벤치마킹 P7 (`docs/research/2026-06-21-storytelling-service-ux-benchmark.md`). 한국 텍스트 웹소설은 AI 탐지가 거의 불가능해 '누수 사고'(프롬프트/지시문·AI 상투구 노출)가 사실상 유일한 별점테러·연재중단 트리거.
> **brainstorming 결정** — ① 프롬프트 누수=차단(blocking), AI 상투구=경고(advisory) ② 범위=MVP(확정 차단 + 품질 리포트 반영, 본문 인라인 미리보기는 후속).

## 목표
- 회차 확정(잠금) 직전에 본문의 **프롬프트/지시문 잔여 텍스트 누수**를 결정론으로 검출해 확정을 **차단**한다.
- **AI 특유 상투구·기계 문체**는 같은 시점에 **경고**로 드러내되 확정을 막지 않는다(작가 주도권).
- 생성 직후 기존 품질 리포트(qualityGates)에도 누수 신호를 노출해 일찍 인지하게 한다.
- 누수는 숨기지 않고 위치(인용)와 함께 드러낸다 — 프로젝트 '충돌은 드러낸다' 원칙과 동일한 결.

## 비목표 (YAGNI / 이번 범위 밖)
- ML/통계 기반 AI 탐지기 — 창작물에서 20%+ 오탐(리서치 refuted)이라 배제. 명백한 아티팩트만 패턴 매칭.
- 본문 인라인 하이라이트 미리보기 — 같은 모듈 재사용해 후속(풀 묶음)으로.
- 영어 외 다국어 누수 — 한국어 + 영어(가장 흔한 LLM 출력 언어)만.
- 상투구 신규 패턴 대량 추가 — 기존 `koreanVoiceGate` 재사용(중복 회피).

## 아키텍처

### 신규 — `src/lib/leakGate.ts` (순수 모듈, 결정론)
```ts
type PromptLeakKind = 'llm-meta' | 'english-ai' | 'role-marker' | 'markdown-residue';
interface PromptLeakHit { kind: PromptLeakKind; evidence: string; index: number; }
interface LeakReport {
  promptLeaks: PromptLeakHit[];    // 차단 근거
  clicheFlags: KoreanVoiceFlag[];  // 경고 (koreanVoiceGate 재사용)
  blocked: boolean;                // promptLeaks.length > 0
}
function detectPromptLeak(text: string): PromptLeakHit[];
function inspectLeak(text: string): LeakReport;  // detectPromptLeak + inspectKoreanVoice 통합
```

### 탐지 패턴 (보수적 — 명백한 것만, 오탐 최소)
**프롬프트 누수 (차단)** — 4범주:
1. `llm-meta` — LLM 메타 응답 문장. 예: "물론입니다", "알겠습니다,", "다음은 …입니다", "~를 작성하겠습니다", "요청하신 대로", "도움이 되었기를". ('물론' 단독 같은 정상어는 제외 — 종결어미/메타 맥락 동반 시만)
2. `english-ai` — 영어 AI 출력 누수. 예: "As an AI", "As a language model", "I cannot", "I can't", "Sure, here", "Certainly,", "Here is the", "Here's the", "I hope this helps", "I apologize, but".
3. `role-marker` — 대화/지시 역할 잔여(줄 시작). 예: "사용자:", "어시스턴트:", "system:", "user:", "assistant:", "프롬프트:", "[지시", "<|".
4. `markdown-residue` — 산문에 안 어울리는 구조 마커가 줄 시작에. 예: "## ", "### ", ``` ``` ```, 줄 시작 "1. "/"- "/"* "가 연속 3줄 이상(단발 리스트는 정상일 수 있어 임계 둠).

**오탐 가드** — 각 패턴은 (a) 줄/문장 경계 기준, (b) 한국어 일상어와 겹치는 토큰은 메타 맥락(종결어미·콜론 등) 동반 시만. 빈 텍스트는 누수 0.

**상투구 (경고)** — 기존 `koreanVoiceGate.inspectKoreanVoice(text).flags` 재사용(generic-ai-vocabulary·noun-heavy 등).

### 배선
1. **확정 차단** — `StoryXDesk.confirmChapterLock(chapterId)` 진입에서 해당 회차 prose로 `inspectLeak`. `blocked`면 `lockChapter` 호출 안 하고 `leakBlock` state 설정(잠금 중단). 차단 안 되면 기존대로 잠금(+ clicheFlags 있으면 경고 state).
2. **차단 UI** — FloatingEditor 확정 버튼 영역에 `leakBlock` 배너 — 프롬프트 누수 위치 인용 N건 + "본문에서 제거 후 다시 확정". 기존 `.ep-locked-banner` 다크 토큰 패턴 차용(신규 `.ep-leak-banner`). 상투구 경고는 보조 줄(차단 아님).
3. **품질 리포트** — `qualityGates`에 `gate_prompt_leak`(track `common` → blocking) 추가. `GateInput.promptLeakCount?: number`(없으면 `text`에서 detectPromptLeak). 생성 직후 기존 품질 패널에서 노출.

## 데이터 흐름
- 확정 — 회차 prose → `confirmChapterLock` → `inspectLeak` → `blocked` ? 차단+배너 : 잠금(+경고).
- 생성 직후 — `buildProseQualityMetrics`/`evaluateQualityGates` → `gate_prompt_leak` → 품질 리포트.

## 에러·엣지
- 빈/공백 본문 → promptLeaks 0, blocked false(잠금 허용 — 빈 회차 차단은 다른 게이트 소관).
- 오탐 위험 토큰("물론", "다음은") → 메타 맥락 동반 시만 hit. 정상 산문 음성 테스트로 가드.
- 이미 잠긴 회차 재확정 — `canConfirmLock=false`라 진입 안 함(기존).

## 테스트 (TDD, RED→GREEN)
- `src/lib/leakGate.test.ts` (신규) — 4범주 각 양성 1+ / 정상 한국어 산문 음성(오탐 가드) / inspectLeak blocked 판정 / 빈 텍스트.
- `src/lib/qualityGates.test.ts` — gate_prompt_leak: 누수 본문 fail(blocking) · 깨끗한 본문 pass.
- `src/components/floatingEditor.test.ts`(또는 `editorFocusLayout.test.ts`) — confirmChapterLock 누수 차단 배선(leakBlock 시 잠금 안 함) + 배너 렌더 소스 핀.

## 차별점·원칙 보존
- 누수를 '깔끔하게 숨기지' 않고 위치와 함께 드러낸다 — qualityGates skipped(fake pass 방지)·continuity 충돌 노출과 동일 철학.
- 보편 반응 아님(12.5%만 부정) — 게이트는 '강제 차단'이 아니라 '명백한 사고만 차단', 주관적 문체는 경고. 과대일반화 금지.
