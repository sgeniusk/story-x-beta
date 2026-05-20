# Story X Harness Architecture

흩어져 있던 세 하네스 자산을 하나의 정본 설계로 통합한 문서다. 현재 코드, 미구현 온톨로지 계획, 창작원리 리서치를 모두 받아 목표 하네스 아키텍처와 M4 구현 시퀀스를 확정한다. 이 문서가 확정되면 M4(하네스 구현)는 추가 설계 결정 없이 착수한다.

- 기준 날짜 — 2026-05-19
- 기준 버전 — `Alpha v0.10.0` (버전 표기는 유지, "0.2"는 완성도 비유)
- 상위 계획 — `~/.claude/plans/x-zippy-graham.md` (0.2→1.0 로드맵의 M1 산출물)
- 입력 자산
  1. 현재 코드 — `src/lib/storyEngine.ts`, `memoryBank.ts`, `aiCliHarness.ts`, `agentReviewProcess.ts`, `canonRefactor.ts`, `agentOrchestration.ts`
  2. `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` — 7단계 온톨로지 하네스 계획 (미구현)
  3. `docs/research/story_x_creative_principles.md` (2026-05-17) — 대중성·작품성 craft 매뉴얼

용어 정리 — **하네스(harness)** 는 LLM이 좋은 이야기를 만들도록 강제하고 검증하는 구조다. `docs/agent-system.md`의 표현대로 "하네스 엔지니어링은 자원을 어떻게 조립할지 결정하고, 스토리 craft는 그 결과가 조립할 가치가 있는지 결정한다". 이 문서는 두 가지를 한 파이프라인으로 묶는다.

---

## 1. 현 하네스 인벤토리

현재 코드에서 하네스 역할을 하는 모듈과 그 구현 상태다. 상태는 **실제 로직** / **부분 구현** / **스텁** / **선언만** 네 가지로 표기한다.

### 1-1. 모듈별 역할과 상태

| 모듈 | 하네스 역할 | 상태 | 핵심 근거 |
|------|------------|------|----------|
| `storyEngine.ts` — `SeriesProject` | 스토리 바이블 정본 (characters, worldRules, canonFacts, openThreads, chapters, places, objects, events, timeline, bibleOutline) | 실제 로직 | 타입 + `createSeedProject()` 시드 데이터 |
| `storyEngine.ts` — `validateContinuity()` | 연속성 가드레일 | 부분 구현 | `claim.includes(rule.claim)` 부분문자열 매칭 (L722-758) |
| `storyEngine.ts` — `produceNextChapter()` | 결정론적 회차 생성 | 스텁 | 하드코딩 산문 템플릿·비트·캐논, 에이전트 런 항상 pass |
| `storyEngine.ts` — `chapterFromDraftPayload()` | LLM 초안 정규화·커밋 | 실제 로직 | 페이로드 정규화 + `validateContinuity` + 커밋 |
| `storyEngine.ts` — `buildProjectContextDigest()` | 토큰 예산 제한 컨텍스트 직렬화 | 실제 로직 | head 6 + tail 34, `CONTEXT_CANON_LIMIT=40` |
| `storyEngine.ts` — `buildAgentRuns()` | 에이전트 런 산출 | 스텁 | 5개 런 중 4개 항상 `pass`, output 하드코딩 |
| `storyEngine.ts` — `applyApprovedMemory()` | 승인 메모리 → 캐논 커밋 | 실제 로직 | 승인 루프 종결 |
| `memoryBank.ts` — `buildStoryMemoryBank()` | 28+ 파일 메모리뱅크 렌더 | 실제 로직 | sync/private 정책 포함 |
| `memoryBank.ts` — `buildMemoryBankContextPacket()` | 에이전트별 최소 컨텍스트 슬라이스 | 실제 로직 | `contextSectionsByAgent` 라우팅 테이블 |
| `memoryBank.ts` — `buildMemoryApprovalQueue()` | 메모리 승인 게이트 | 실제 로직 | `canSync` 플래그 |
| `aiCliHarness.ts` — `buildHarnessPrompt()` | 프로바이더 프롬프트 조립 | 실제 로직 | 운영 계약 + 로컬라이제이션 + 패킷 결합 |
| `aiCliHarness.ts` — `normalizeProviderReviewOutput()` | LLM 출력 정규화 | 실제 로직 | JSON/산문 폴백 처리 |
| `agentReviewProcess.ts` — `validationProcesses` | 15개 검증 에이전트 레지스트리 | 실제 로직(데이터) | agenda·checks·blockingSignals·evolutionMemory 명세 |
| `agentReviewProcess.ts` — `buildPersonaReviewProtocol()` | 검토 프로토콜 빌더 | 실제 로직 | 스케일별 ordered steps |
| `canonRefactor.ts` — `buildCanonRefactorPlan()` | 바이블 편집 영향 분석 | 부분 구현 | 영향 챕터를 부분문자열 검색으로 탐지 |
| `agentOrchestration.ts` | 3계층 에이전트 흐름 모델 | 선언만 | 라우팅·호출 로직 없음 |
| `serviceOperationsAgents.ts` | 서비스 운영팀 에이전트 메타데이터 | 선언만 | 스토리 하네스 범위 밖 (제품팀 운영) |

### 1-2. 현재 생성→검토→승인 흐름

```
SeriesProject
  ├─ [결정론] produceNextChapter() → buildAgentRuns() [스텁: 항상 pass]
  └─ [LLM] draftClient.requestLlmDraft() → /api/draft (로컬 dev 전용)
       └─ chapterFromDraftPayload() → validateContinuity() → commitChapter()

[검토] aiCliHarness.buildAiCliRunPlan() → buildHarnessPrompt()
       → buildMemoryBankContextPacket() × N → 프로바이더 호출
       → normalizeProviderReviewOutput() → AiCliReviewResult

[승인] buildMemoryApprovalQueue() → 사용자 결정 → applyApprovedMemory()

[바이블 편집] createCanonChangeEntry() → buildCanonRefactorPlan()
```

핵심 관찰 — 메모리뱅크·컨텍스트 패킷·승인 게이트는 견고하다. 그러나 (a) 생성 **앞단의 품질 게이트가 없다**, (b) 검증이 **부분문자열 매칭 수준**이다, (c) `agentOrchestration`이 **동작하지 않는 선언**이다. 즉 하네스의 양 끝(데이터 모델·승인)은 실하고 가운데(사전 검증·실행 라우팅)가 비어 있다.

---

## 2. 세 자산 정합

### 2-1. 온톨로지 계획 7단계 vs 창작원리 리서치 vs 현재 코드

| 온톨로지 계획 단계 | 창작원리 리서치 대응 | 현재 코드 | 정합 판정 |
|---|---|---|---|
| Stage 1 — Story Sense Diagnosis | (해당 진단 항목 분산) | 없음 | **신설 필요** |
| Stage 2 — Premise Forge | 2-2 콜드오픈, 2-8 장르약속 | `projectIntake.ts` 인터뷰 (부분) | 신설 + 인터뷰 연결 |
| Stage 3 — Ontology Builder | 2-1 결핍·욕망·금지, 3-8 내면 균열 | `SeriesProject` 일부 필드 | 신설, 기존 바이블 흡수 |
| Stage 4 — Conflict Pressure Test | 2-4 이해관계 상승, 2-6 보상곡선 | 없음 | **신설 필요** |
| Stage 5 — Originality/Cliche Pass | 2-8 장르약속 변주 | 없음 | 신설 필요 |
| Stage 6 — Korean Voice Gate | 3-3 문체 독자성, 3-9 음악성 | `koreanStyle.ts` (문자열 검사) | 신설, `koreanStyle` 흡수 |
| Stage 7 — Media Projection | 5장 에세이 고유 요소 | `verticalSlice.ts` (부분) | 신설, `verticalSlice` 연결 |
| Continuity Contract (3 canon layers) | 3-8 모순, 부록 운영원칙 | `validateContinuity` (약함) | **리팩터 + 신설** |

### 2-2. 충돌·중복·누락

- **중복** — 온톨로지 계획의 `VoiceBible`/`VoiceRule`과 리서치의 `voice_signature`가 같은 개념이다. 하나로 합쳐 `voice_signature`(작가 단위)와 캐릭터별 `voiceRules`(인물 단위)를 분리한다.
- **중복** — 온톨로지 계획의 `CanonFact`와 현재 `storyEngine.CanonFact`가 이름은 같지만 필드가 다르다. 현재 타입을 정본으로 두고 온톨로지 쪽 개념(출처 `source`)을 흡수한다.
- **충돌** — 리서치는 게이트를 "항상 켜면 작가가 못 쓴다"며 **모드 가중치로 강제/권고를 나눈다**(6-4절). 온톨로지 계획은 `readyForProduction` 불리언 하나로 통과 여부를 본다. → 정합안은 **모드 가중치 채택**, `readyForProduction`은 "강제 게이트만" 기준으로 좁힌다.
- **누락** — 온톨로지 계획에는 에세이 트랙(`persona_card`, `disclosure_ledger`, `self_reversal_check`)이 얕다. 리서치 5장이 이를 보강하므로 에세이 전용 모듈/게이트를 명시한다.
- **누락** — 세 자산 모두 `buildAgentRuns` 스텁과 `agentOrchestration` 미동작을 해결하지 않는다. 이 문서가 6장에서 처리한다.

### 2-3. 정합 원칙

1. **현재 코드의 견고한 부분(memoryBank, 컨텍스트 패킷, 승인 게이트)은 정본으로 유지한다.**
2. 온톨로지 계획의 **7단계 골격을 채택**하되, 통과 기준은 리서치의 모드 가중치로 바꾼다.
3. 리서치의 13/16/12 항목은 **온톨로지 단계가 아니라 바이블·에이전트·게이트 세 축**에 배정한다.
4. 하네스는 "한 번 생성"이 아니라 **사전 게이트 → 생성 → 사후 검증 → 승인** 순환으로 본다.

---

## 3. 목표 하네스 아키텍처

### 3-1. 레이어 구조

```
Layer 0  사전 제작 게이트   storyOntology.ts · storyHarness.ts
            │ (온톨로지 미완성이면 생성 차단)
Layer 1  스토리 바이블·캐논  storyEngine.ts(확장) · continuityContract.ts
Layer 2  컨텍스트 조립       memoryBank.ts(유지) · buildProjectContextDigest
Layer 3  생성               produceNextChapter(리팩터) · chapterFromDraftPayload · draftClient
Layer 4  검증·품질 게이트    agentReviewProcess.ts(확장) · qualityGates.ts(신설) · koreanVoiceGate.ts(신설) · aiCliHarness.ts(확장)
Layer 5  에이전트 오케스트레이션  agentRunEngine.ts(신설, agentOrchestration 대체)
Layer 6  메모리 승인         buildMemoryApprovalQueue · applyApprovedMemory · canonRefactor.ts(리팩터)
Layer 7  매체 변환           mediaProjection.ts(신설)
```

### 3-2. 데이터 흐름

```
작가 입력(소재·매체·모드 가중치)
   │
   ▼  Layer 0 ── runStoryHarness()
스토리 진단 → 전제 단조 → 온톨로지 구축 → 갈등 압력 → 한국어 문체 → (강제 게이트 통과?)
   │  통과            │  미통과 → 리페어 제안, 생성 차단
   ▼
   ▼  Layer 1·2 ── 바이블 확정 + continuityContract 분류 + 컨텍스트 팩 조립
   ▼  Layer 3 ── 회차 생성 (LLM 또는 결정론)
   ▼  Layer 4·5 ── agentRunEngine: 검증 에이전트 N개 실행 + qualityGates 평가
   │                대중성 게이트(생성단계 강제) · 작품성 게이트(최종검토 강제) — 모드 가중치로 강제/권고 결정
   ▼  Layer 6 ── 메모리 승인 큐 → 작가 승인 → 캐논·성장 레저 기록
   ▼  Layer 7 ── mediaProjection: 같은 온톨로지를 소설/웹툰/인스타툰/네컷으로 투영
```

### 3-3. 두 트랙 설계 (대중성 / 작품성)

리서치 부록 운영원칙을 코드로 옮긴다.

- 작품 시작 시 작가가 `StoryMode = { commercialWeight: 0~1, literaryWeight: 0~1 }` 선언.
- **대중성 게이트**는 Layer 3 생성 단계에서, **작품성 게이트**는 Layer 4 최종 검토 단계에서 평가.
- 가중치가 높은 축의 게이트는 **강제(blocking)**, 낮은 축의 게이트는 **권고(advisory)**.
- `readyForProduction`은 "강제 게이트가 모두 통과" 일 때만 true.

### 3-4. 캐논 3계층 (continuityContract)

| 계층 | 의미 | 변경 가능성 | 저장 위치 |
|------|------|------------|----------|
| Hard Canon | 절대 사실 | retcon 승인 필요 | `CanonFact` (기존, 확장) |
| Living State | 변하는 현재 상태 | 원인·대가 기록 시 가능 | `growthLedger` (신설) |
| Soft Signal | 소문·추측 | 자유, 반전 재료 | `softSignals` (신설) |

`validateContinuity`는 단순 부분문자열 매칭을 버리고, **변경 주장을 3계층으로 분류**한 뒤 Hard Canon 위반만 차단하고 나머지는 원인·대가 유무로 판정한다.

---

## 4. 모듈별 처분 결정

| 모듈 | 결정 | 구체 작업 |
|------|------|----------|
| `storyEngine.ts` `SeriesProject`/`CharacterProfile` | **리팩터·확장** | 13개 바이블 카테고리 필드 추가 (5장 참조) |
| `storyEngine.ts` `validateContinuity()` | **리팩터** | 부분문자열 매칭 폐기 → `continuityContract` 3계층 분류 호출 |
| `storyEngine.ts` `produceNextChapter()` | **리팩터** | 시드 전용 산문 모티프 제거, 빈 프로젝트에서도 안전하도록 프로젝트 무관화 |
| `storyEngine.ts` `buildAgentRuns()` | **리팩터** | 하드코딩 폐기 → `agentRunEngine` 실제 검토 결과에서 런 산출 |
| `storyEngine.ts` `CanonFact.owner` | **리팩터** | `voice`/`visual`/`audio` 포함하도록 타입 통일 (Gap 5) |
| `storyEngine.ts` `buildProjectContextDigest()` | **유지** | 토큰 예산 직렬화 그대로, 컨텍스트 팩에 흡수 |
| `memoryBank.ts` 전체 | **유지·확장** | 신규 바이블 섹션·`evolutionMemory` 영속 파일 추가 |
| `aiCliHarness.ts` `buildHarnessPrompt()` | **유지·확장** | 16개 검토 기준·12개 게이트를 프롬프트 계약에 반영 |
| `aiCliHarness.ts` 정규화·커맨드 | **유지** | 변경 없음 |
| `agentReviewProcess.ts` | **유지·확장** | 16개 검토 기준 추가, `critic-reviewer`·`essay-curator` 에이전트 추가 |
| `canonRefactor.ts` | **리팩터** | 부분문자열 검색 폐기 → 엔티티 ID 링크 기반 영향 탐지 (Gap 8) |
| `agentOrchestration.ts` | **폐기** | 선언만 있는 3계층 모델 삭제, `agentRunEngine.ts`로 대체 |
| `serviceOperationsAgents.ts` | **범위 밖 유지** | 스토리 하네스가 아닌 제품팀 운영 메타데이터 — 손대지 않음, 레지스트리 중복은 주석으로만 표시 |
| `koreanStyle.ts` | **흡수** | 신규 `koreanVoiceGate.ts`가 흡수, 기존 테스트 보존 |
| `verticalSlice.ts` | **연결** | `mediaProjection.ts`가 호출하도록 연결 |

**신설 모듈** — `storyOntology.ts`, `storyHarness.ts`, `continuityContract.ts`, `koreanVoiceGate.ts`, `mediaProjection.ts`, `qualityGates.ts`, `agentRunEngine.ts`. 각각 `.test.ts` 동반.

---

## 5. 창작원리 매핑

리서치(2026-05-17)의 13개 바이블 카테고리·16개 에이전트 검토 기준·12개 품질 게이트를 구체 모듈에 배정한다.

### 5-1. 바이블 13 카테고리 → 모듈

| 카테고리 키 | 배정 위치 | 모드 |
|---|---|---|
| `protagonist_pressure_triangle` (want/desire/taboo) | `storyEngine.CharacterProfile` 확장 + `storyOntology` | 소설·에세이 |
| `narrator_card` | `storyEngine.SeriesProject` 신규 필드 | 소설 |
| `voice_signature` | `koreanVoiceGate.ts` + `SeriesProject` | 소설·에세이 |
| `motif_ledger` | `storyEngine.SeriesProject` 신규 필드 | 소설 |
| `symbol_layers` | `storyEngine.SeriesProject` 신규 필드 | 소설 |
| `stakes_ledger` | `storyEngine` `Chapter` 메타 + `storyHarness` 압력 단계 | 소설·에세이 |
| `reward_arc` | `storyEngine` `Chapter` 메타 | 소설 |
| `genre_contract` | `storyOntology` (Stage 2 Premise Forge) | 소설 |
| `formal_design` | `storyEngine.SeriesProject` 신규 필드 | 소설 |
| `historical_anchors` | `storyEngine.SeriesProject` 신규 필드 | 소설·에세이 |
| `persona_card` | `storyEngine` 에세이 모드 바이블 | 에세이 |
| `disclosure_ledger` | `storyEngine` 에세이 모드 바이블 | 에세이 |
| `vicarious_payoff` | `storyOntology` | 소설(대중성) |

### 5-2. 에이전트 검토 기준 16개 → 에이전트

| 에이전트 | 검토 기준 키 | 배정 |
|---|---|---|
| `serial-showrunner` | `chapter_one_hook_check`, `chapter_end_hook_check`, `stakes_progression_audit` | `agentReviewProcess` validationProcesses 확장 |
| `character-custodian` | `pressure_triangle_validation`, `flat_character_warning` | 동상 |
| `world-keeper` | `motif_variation_audit`, `historical_consistency_extended` | 동상 |
| `genre-stylist` | `scene_sequel_ratio`, `voice_match_score`, `read_aloud_audit` | 동상 + `koreanVoiceGate` 연동 |
| `continuity-editor` | `open_threads_overload` | 동상 |
| `critic-reviewer` (신설) | `ambiguity_audit`, `ethical_pressure_test`, `silence_audit` | `ValidationAgentId`에 추가, 작품성 트랙 |
| `essay-curator` (신설) | `universal_leap_check`, `self_reversal_check`, `disclosure_scope_check` | `ValidationAgentId`에 추가, 에세이 모드 |

권장 에이전트 체인 (리서치 6-4) — `serial-showrunner → character-custodian → world-keeper → genre-stylist → continuity-editor → critic-reviewer(작품성) → essay-curator(에세이만)`. `docs/agent-system.md`의 기존 14개 에이전트 표에 두 신설 에이전트를 추가하되, 기존 체인과 충돌하지 않는다(끝에 덧붙임).

### 5-3. 품질 게이트 12개 → `qualityGates.ts`

전부 신설 `qualityGates.ts`가 소유한다. 각 게이트는 `{ key, track, modeRequirement, evaluate(), onFail }` 형태.

| 게이트 키 | 트랙 | 평가 시점 |
|---|---|---|
| `gate_hook_first_300` | 대중성 | Layer 3 생성 |
| `gate_hook_last_200` (serial) | 대중성 | Layer 3 생성 |
| `gate_scene_sequel_balance` | 공통 | Layer 4 검토 |
| `gate_voice_match_70` | 공통 | Layer 4 검토 |
| `gate_pressure_triangle_active` | 공통 | Layer 4 검토 |
| `gate_ambiguity_at_finale` | 작품성 | Layer 4 최종 |
| `gate_ethical_cost_present` | 작품성 | Layer 4 최종 |
| `gate_motif_variation` | 작품성 | Layer 4 최종 |
| `gate_historical_density` | 작품성 | Layer 4 최종 |
| `gate_universal_leap` (에세이) | 에세이 | Layer 4 검토 |
| `gate_self_reversal` (에세이) | 에세이 | Layer 4 검토 |
| `gate_disclosure_scope` (에세이) | 에세이 | Layer 4 검토, 차단형 |

강제/권고 구분은 3-3절 모드 가중치로 결정한다. 대중성 게이트는 `commercialWeight ≥ 0.5`일 때 강제, 작품성 게이트는 `literaryWeight ≥ 0.5`일 때 강제, 에세이 게이트는 에세이 모드에서 항상 평가하되 `gate_disclosure_scope`만 항상 차단형이다.

---

## 6. 알려진 12개 갭의 처리 방안

| # | 갭 | 처리 방안 | 담당 레이어 |
|---|---|---|---|
| 1 | 온톨로지 하네스 전체 미구현 | Layer 0 신설 (`storyOntology`·`storyHarness`) | L0 |
| 2 | `agentOrchestration` 선언만, 라우팅 없음 | 모듈 폐기, `agentRunEngine.ts` 신설 — 검토 스케일에 따라 에이전트 N개를 실제 실행하고 결과를 모음 | L5 |
| 3 | `validateContinuity` 부분문자열 매칭 | `continuityContract`의 3계층 분류로 교체, 구조화된 변경 주장 입력 | L1 |
| 4 | `buildAgentRuns` 하드코딩 (4개 항상 pass) | `agentRunEngine` 실제 검토 결과에서 `AgentRun[]` 산출 | L5 |
| 5 | canon owner 타입 불일치 | `CanonFact.owner`를 `character|world|plot|voice|visual|audio`로 통일, `normalizeCanonOwner` 다운캐스트 제거 | L1 |
| 6 | `/api/*` 브리지 외부·미문서화 | M5에서 Vercel Functions 구현 + 요청/응답 스키마를 공유 타입으로 명시 | (M5) |
| 7 | `produceNextChapter` 시드 전용 산문 박힘 | 시드 모티프 제거, 빈 프로젝트 가드, 프로젝트 데이터 기반 생성 | L3 |
| 8 | `canonRefactor` 부분문자열 검색 | 챕터 ↔ 엔티티 ID 링크 인덱스 구축, 링크 기반 영향 탐지 | L6 |
| 9 | `evolutionMemory` 영속화 부재 | `memoryBank`에 `reviews/evolution-memory.md` 파일 추가, 승인 시 누적 기록 | L2/L6 |
| 10 | `quality-gate` 미구현 | `qualityGates.ts` 신설 (5-3절 12개 게이트) | L4 |
| 11 | 에이전트 레지스트리 3개 중복 | `agentReviewProcess`를 스토리 하네스 단일 정본으로, `serviceOperationsAgents`는 범위 밖 명시, `agentOrchestration` 폐기 | L5 |
| 12 | `harness-verifier` 에이전트 타입 부재 | UI 회귀 검증용 에이전트 — 스토리 하네스 `ValidationAgentId` 대상 아님, 별도 분류로 문서화 | (문서) |

---

## 7. M4 구현 시퀀스

CLAUDE.md 규칙("새 생성 동작은 `storyEngine.test.ts` 테스트를 먼저 수정")에 따라 청크마다 테스트 우선(TDD)으로 진행한다. 각 청크 끝에서 `npm test` 전체 통과를 확인한다.

### 청크 A — 캐논 기반 정리 (선행)

- 수정 — `storyEngine.ts` `CanonFact.owner` 타입 통일 (Gap 5), `normalizeCanonOwner` 다운캐스트 제거
- 수정 — `produceNextChapter` 시드 모티프 제거·빈 프로젝트 가드 (Gap 7)
- 테스트 — `storyEngine.test.ts`에 owner 통일·빈 프로젝트 케이스 먼저 추가
- 이유 — 뒤 청크가 캐논 타입에 의존하므로 먼저 안정화

### 청크 B — 온톨로지 기반 (Layer 0)

- 신설 — `storyOntology.ts` + 테스트 — 엔티티·관계·검증자
- 신설 — `storyHarness.ts` + 테스트 — 6단계 스테이지(진단·전제·온톨로지·압력·문체·매체)와 점수
- 참고 — 온톨로지 계획 Chunk 1·2의 테스트 스켈레톤 재사용

### 청크 C — 연속성 계약 (Layer 1)

- 신설 — `continuityContract.ts` + 테스트 — 캐논 3계층, `growthLedger`, 컨텍스트 팩, 리페어 제안
- 수정 — `storyEngine.validateContinuity()`를 `continuityContract` 호출로 리팩터 (Gap 3)
- 수정 — `memoryBank.ts`에 `evolution-memory.md` 추가 (Gap 9)

### 청크 D — 한국어 문체 게이트 (Layer 4 일부)

- 신설 — `koreanVoiceGate.ts` + 테스트 — `koreanStyle.ts` 흡수, `voice_signature`, 캐릭터 voice rule
- 보존 — 기존 `koreanStyle.test.ts` 통과 유지

### 청크 E — 품질 게이트 (Layer 4)

- 신설 — `qualityGates.ts` + 테스트 — 12개 게이트, `StoryMode` 가중치 강제/권고 로직
- 수정 — `storyEngine` `SeriesProject`/`CharacterProfile`에 13개 바이블 카테고리 필드 추가 (5-1절)

### 청크 F — 에이전트 실행 엔진 (Layer 5)

- 신설 — `agentRunEngine.ts` + 테스트 — 검토 스케일별 에이전트 실행, `AgentRun[]` 산출
- 수정 — `storyEngine.buildAgentRuns()`를 `agentRunEngine` 호출로 교체 (Gap 4)
- 삭제 — `agentOrchestration.ts` + 테스트 (Gap 2·11)
- 수정 — `agentReviewProcess.ts`에 `critic-reviewer`·`essay-curator` + 16개 검토 기준 추가 (5-2절)

### 청크 G — 매체 변환 (Layer 7)

- 신설 — `mediaProjection.ts` + 테스트 — 소설/웹툰/인스타툰/네컷 투영, 온톨로지 핵심 보존
- 연결 — `verticalSlice.ts` 호출

### 청크 H — 영향 분석·통합

- 수정 — `canonRefactor.ts` 엔티티 ID 링크 기반 영향 탐지 (Gap 8)
- 수정 — `aiCliHarness.buildHarnessPrompt()`에 16기준·12게이트 반영 (Gap 10 프롬프트측)
- 수정 — `creativeDevelopment.ts`에 `storyOntology`·`harnessReport`·`mediaProjection` 통합
- 수정 — `docs/agent-system.md`·`docs/codex-agent-manifest.md` 신설 에이전트 반영

### M4 완료 기준

- `npm test` 전체 통과, `tsc --noEmit` 정상, `npm run build` 통과
- 소재 입력이 하네스 리포트 없이 바로 생성으로 가지 못함 (온톨로지 계획 Acceptance Criteria)
- 캐논 3계층 분리, 캐릭터 변화에 원인·대가 기록 강제
- 약한 전제는 폴리시된 빈 초안 대신 명확한 리페어 제안 산출

---

## M1 진행 로그

- 2026-05-19 — 세 자산 정독, 12개 갭 확인, 본 문서 작성. `validateContinuity` 부분문자열 매칭(L725·736·746)과 canon owner 타입 불일치(`storyEngine.ts:97` vs `aiCliHarness.ts:65`) 코드 직접 확인. M1 완료, M2(홈 화면 재디자인) 착수 대기.
