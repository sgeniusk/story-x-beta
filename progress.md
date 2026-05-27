# Story X — Progress

> Last Updated: 2026-05-21 15:18 KST · Branch: `design/linear-dark`

## Current Objective

**M4.H — 통합·리팩터 (1차 컷 · 핵심 3 작업)** (`in_progress` · 이번 세션)

M4 청크 H 의 핵심 3 작업 완료. (1) `aiCliHarness.buildHarnessPrompt` 에 16 craft 검토 기준 + 12 품질 게이트 라인 추가 (Gap 10). (2) `canonRefactor.findAffectedChapters` 가 `change.targetCanonId` ↔ `chapter.newCanonFacts.id` 직접 매칭 우선, 없으면 부분문자열 fallback (Gap 8). (3) `storyEngine.validateContinuity` 가 `continuityContract.classifyCanonChange` 호출 — hard-canon 위반만 추가 issue, dedup 으로 기존 흐름 보존 (Gap 3). **36 files / 219 tests** 통과.

청크 H 후속 — `creativeDevelopment.ts` 통합, docs 갱신은 다음 묶음.

---

## (직전) M4.G — 매체 투영 (Layer 7) (`done`)

M4 청크 G 완료. `mediaProjection.ts` 신설 — 같은 `StoryOntology` 가 5 매체(novel/essay/webtoon/insta-toon/four-cut) 로 투영. 매체별 필드는 다르지만 핵심 4 (premise.dramaticQuestion · characters[0].desire · worldRules[0].cost · plotThreads[0]) 는 변하지 않음 (PreservationReport 검증). `projectMedia` · `projectAllMedia` 함수. TDD 9 케이스, **36 files / 219 tests** 통과.

다음 단계 — M4 청크 H (통합, 마지막 청크).

---

## (직전) M4.F — 에이전트 실행 엔진 (Layer 5) (`done`)

M4 청크 F 완료. 4가지 변경 — (1) `agentRunEngine.ts` 신설 (스케일별 AgentRun 산출), (2) `storyEngine.buildAgentRuns` 하드코딩 5명 → wrapper 로 교체 (Gap 4), (3) `agentOrchestration.ts` + `.test.ts` 삭제 (Gap 2·11), (4) `agentReviewProcess.ts` 에 `criteriaKeys` 필드 + 7 에이전트에 16 craft 기준 키 채움. `AgentRun.agentId` 를 `ValidationAgentId` 로 통합. TDD 8 케이스, **35 files / 210 tests** 통과.

다음 단계 — M4 청크 G (mediaProjection, Layer 7).

---

## (직전) M4.E — 품질 게이트 12개 + 바이블 13 카테고리 (Layer 4) (`done`)

M4 청크 E 완료. `qualityGates.ts` 신설 — 12 게이트(common/commercial/literary/essay 트랙) + StoryMode 가중치(commercialWeight/literaryWeight) 로 강제/권고 결정. `storyEngine.ts` SeriesProject/CharacterProfile/Chapter 에 13 바이블 카테고리 optional 필드(pressureTriangle, narratorCard, voiceSignatureId, motifLedger, symbolLayers, formalDesign, historicalAnchors, personaCard, disclosureLedger, stakesLedger, rewardArc) 추가. TDD 12 케이스, **35 files / 204 tests** 통과.

다음 단계 — M4 청크 F (agentRunEngine, Layer 5).

---

## (직전) M4.D — 한국어 문체 게이트 (Layer 4 일부) (`done`)

M4 청크 D 완료. `koreanVoiceGate.ts` 신설 — `inspectKoreanVoice(text, signatures?)` 가 6 종 flag(generic AI vocab · noun-heavy · translation-ese · comma-overflow · abstract-emotion · signature mismatch) 산출. `VoiceSignature` 인터페이스로 작가/캐릭터별 톤 기준(sentenceLength · forbiddenWords · preferredRegister · preserveTokens) 도입. 기존 `koreanStyle.ts` 와 6 케이스는 흡수 패턴으로 보존 (폐기 아님). **34 files / 192 tests** 통과.

다음 단계 — M4 청크 E (qualityGates 12개 + SeriesProject 13 바이블 카테고리, Layer 4).

---

## (직전) M4.C — 연속성 계약 (Layer 1) (`done`)

M4 청크 C 1차 컷 완료. `continuityContract.ts` 신설 — 캐논 3계층(hard-canon / living-state / soft-signal) 분류, 성장 레저, 컨텍스트 팩, 리페어 제안. 한국어 명사 토큰 ≥ 2 공유 + 부정 마커 차이 휴리스틱으로 "반전" 감지. `memoryBank.ts` memoryBankTemplate 에 `evolution-memory.md` 슬롯 추가 (Gap 9). TDD 11 케이스, **33 files / 186 tests** 통과.

`validateContinuity` 의 continuityContract 호출 리팩터는 기존 통과 테스트 보호를 위해 청크 H 통합 단계로 분리.

다음 단계 — M4 청크 D (koreanVoiceGate, Layer 4 일부).

---

## (직전) M4.B — 온톨로지 기반 (Layer 0) (`done`)

M4 청크 B 완료. `storyOntology.ts` + `storyHarness.ts` 두 모듈 신설. 작가 입력 → 작품 그래프(전제·인물·세계 규칙·갈등·플롯) → 6단계 스테이지 점수(100점) → readyForProduction 판정 흐름이 완성됨. TDD 9 케이스, **32 files / 175 tests** 통과.

다음 단계 — M4 청크 C (Layer 1, continuityContract + validateContinuity 리팩터).

---

## (직전) M4.A — 캐논 기반 정리 (선행) (`done`)

M4 스토리 하네스 구현의 청크 A. Gap 5 — CanonFact.owner 타입 6개 통일 (voice/visual/audio 포함). Gap 7 — produceNextChapter 시드 모티프(달의 탑·오빠의 표식·이안) 제거 + 빈 프로젝트(인물 0명) 가드. TDD 순서로 storyEngine.test.ts 에 두 케이스 먼저 추가 → 30 files / **166 tests** 통과 (164 → 166).

다음 단계 — M4 청크 B (storyOntology + storyHarness Layer 0 신설).

---

## (직전) M6.2.1 — evolution history UI (AiStatusBadge popover) (`done`)

헤더의 작은 AI 상태 뱃지가 클릭 가능한 button 으로 확장. 클릭 시 popover 에 최근 evolution event 시간순 리스트가 펼쳐진다. 색 분기로 성공/주의/실패 한눈에. 비우기 버튼·닫기 버튼·외부 클릭/Escape 닫기. 작가가 자기 작품의 AI 활동 흐름을 한 곳에서 본다 — M6.2 의 누적 인프라가 처음으로 가시화됨.

---

## (직전) M6.2 — evolutionMemory 누적 저장 (`done`)

---

## (직전) M6.1 — 프로젝트 export/import (JSON 파일) (`done`)

전체 작품 데이터(project · snapshots · 5 preferences)를 한 JSON 으로 백업/복원. 스튜디오 ⚙ 설정 패널의 "프로젝트 데이터" 그룹에서 내보내기/가져오기 두 버튼으로 접근. schema='storyx/export/v1' 버전 관리. 가져오기는 confirm 후 덮어쓰기 + `window.location.reload()`.

M6 (영속성·메모리 싱크) 의 첫 컷. 다음 자연스러운 작업 — M6.2 evolutionMemory 누적 또는 M6.3 storyx CLI 확장.

---

## (직전) M5 — 서버측 LLM Vercel Functions (`done`)

5 라우트(`/api/draft`·`/api/review`·`/api/review-agent`·`/api/review-data`·`/api/interview`) 가 production 배포본에서 직접 LLM 호출. 공유 `promptBuilders` + `llmRunner` 모듈로 한 줄 호출 — `runLlmJson(prompt)`. AI Gateway 우선, Anthropic 직결 fallback, 키 없으면 mock. `vercel.json` 의 `includeFiles` 로 페르소나 .md 를 serverless 번들에 포함.

## Current State

- 활성 feature — `M5-vercel-functions` (완료) / 다음 활성 후보 — `M6-persistence-memory-sync` 또는 `M4-story-harness-implementation`
- 직전 마일스톤 — M3.6.1 퍼블리시 화면 실데이터 연동
- 마지막 통과 검증 — `npm test` 30 files / 164 tests · `npx tsc --noEmit` exit 0 · `npm run build` 519kb js (963ms)
- 브랜치 — `design/linear-dark`
- 배포 블로커 — Vercel Project Settings 에 `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 추가 필요

## What Was Done in the Last Session

1. **AI SDK 의존성 추가** — `ai` + `@ai-sdk/anthropic` + `@vercel/node` (npm install background)
2. **`src/lib/server/promptBuilders.ts` 신설**
   - buildInterviewPrompt · buildDraftPrompt · buildReviewPrompt · buildAgentReviewPrompt · buildDataReviewPrompt
   - loadAgentPersona — `.claude/agents/<file>.md` 본문 + 프런트매터 제거
   - parseLlmJson — LLM 응답에서 첫 `{...}` 추출
   - `AGENT_FILE_MAP` — 24명 (기본 12 + M4 신설 12) 페르소나 파일 매핑
3. **`src/lib/server/llmRunner.ts` 신설** — `runLlmJson(prompt)` 공유 헬퍼
   - AI Gateway 가 있으면 `anthropic/claude-3-5-sonnet-20241022` 문자열로 라우팅
   - 없으면 `@ai-sdk/anthropic` provider 직결
   - 둘 다 없으면 `status: 'mock'`
4. **5 Vercel Functions 신설** — 모두 같은 패턴
   - `api/interview.ts` · `api/draft.ts` · `api/review.ts` · `api/review-agent.ts` · `api/review-data.ts`
   - 각각 클라이언트 응답 형태로 정규화 (questions, prose+beats, summary+agentReports, verdict+strengths+issues, summary+notes)
5. **`vercel.json` 갱신** — `functions.api/review-agent.ts.includeFiles: ".claude/agents/**"`
6. **`docs/vercel-env-setup.md` 신설** — env 변수 두 가지, 로컬 vs 배포본 동작 차이, curl 검증 예시

## Recommended Next Step

(a) 사용자가 Vercel Project Settings 에 `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 추가 → 새 deploy → curl 한 줄 검증
(b) **M6 영속성·메모리 싱크** — localStorage 에서 파일/클라우드 영속으로 확장. evolutionMemory 누적 저장. `storyx` CLI 확장 (`init`, `serve`, `memory sync`).
(c) **M4 스토리 하네스 구현 (Layer 0~7)** — `docs/storyx-harness-architecture.md` 청크 A~H TDD.

## Files Touched (M5)

- `src/lib/server/promptBuilders.ts` (신설)
- `src/lib/server/llmRunner.ts` (신설)
- `api/interview.ts` · `api/draft.ts` · `api/review.ts` · `api/review-agent.ts` · `api/review-data.ts` (5 신설)
- `vercel.json` (functions config 추가)
- `docs/vercel-env-setup.md` (신설)
- `package.json` (의존성 3개 추가)

## Files NOT Touched

- `tools/storyx.mjs` (로컬 CLI 호환 유지 — 같은 로직 두 곳)
- `vite.config.ts` storyxBridge (dev 전용)
- `.claude/agents/*.md` (페르소나 정본)
- 5 클라이언트(draft/review/review-agent/review-data/interview Client.ts) — 응답 스키마 동일해서 변경 불필요

## Blockers

- **배포본 LLM** — Vercel env 미설정 시 mock 폴백. `docs/vercel-env-setup.md` 안내 따라 설정.
- **로컬 LLM** — `claude` CLI 401. 사용자가 `claude login` 또는 ANTHROPIC_API_KEY 설정 필요. M5 와 무관.

## Completed Milestones

| ID | Title | Done | Evidence |
|---|---|---|---|
| M1 | 스토리 하네스 통합 설계 문서 | 2026-05-19 | `docs/storyx-harness-architecture.md` |
| M2 | Linear 다크 랜딩 재작성 | 2026-05-21 | `src/App.tsx` MarketingLanding v4 |
| M3 | 4파트 구조 + 랜딩 낮↔밤 토글 | 2026-05-21 | 흰 로고 변형, theme prop |
| M3.5 | 스튜디오 편집기 설정 패널 | 2026-05-21 | 트윅·캔버스 인라인 오버라이드 |
| M3.6 | 퍼블리시 파트 신설 | 2026-05-22 | `PublishScreen.tsx`, AppStage 확장 |
| M3.6.1 | 퍼블리시 화면 실데이터 연동 | 2026-05-21 | 실데이터 + CTA LLM 호출 + 잠금 버튼 |
| M3.7 | 에디터 리터럴 색 박스 정리 | 2026-05-21 | commits `3e4c9bb` ~ `e835a9b` |
| M4 | 4단계 매트릭스 + 신설 12명 + 매체 풀 4개 | 2026-05-21 | commits `effba1a` ~ `8b82c26` |
| M4.5 | 매체 페르소나 풀 ↔ 로컬 LLM 인터뷰 플로우 | 2026-05-21 | interviewClient + storyx.mjs |
| M5 | 서버측 LLM Vercel Functions | 2026-05-21 | api/*.ts 5 + promptBuilders + llmRunner + vercel.json |

## Blocked Work

| ID | Reason |
|---|---|
| M4 — 스토리 하네스 구현 (Layer 0~7) | 디자인·M5 후 착수 가능 |
| M6 — 영속성·메모리 싱크 | M5 완료 → 다음 활성 후보 |
| M7 — v1.0-alpha 완성 루프 | M4·M5·M6 의존 |

## Verification Evidence (Last Pass)

```
npx tsc --noEmit       → exit 0
npm test --silent      → Test Files 30 passed (30)
                         Tests 164 passed (164)
npm run build          → dist/assets/index-*.js  519.43 kB (gzip 160.27 kB)
                         dist/assets/index-*.css 174.72 kB (gzip 29.95 kB)
                         built in 963ms
api/                   → 5 라우트 (draft, review, review-agent, review-data, interview)
```

## Master Plan

`~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마일스톤 로드맵.
