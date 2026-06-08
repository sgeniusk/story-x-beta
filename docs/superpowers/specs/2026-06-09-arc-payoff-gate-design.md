# 아크 페이오프 게이트 — 1단계 design (약속↔회수 레저)

> 작성 2026-06-09 · 작성자 Claude(편집장) + 사용자 합의 · 관련 `docs/reviews/2026-06-07-persona-live-test/FINAL-REPORT-romancefantasy.md` 권고 1
> continuity≠payoff 처방의 1단계. "측정 + 판단 상보, 단계적" 구조의 첫 조각.

## 1. 배경 — 왜 이걸 하나

페르소나 실증 테스트(#2 로판 23화 완결)의 ★최대 발견이 **continuity ≠ payoff** 다. 연속성(드리프트 0)은 21화에 걸쳐 완벽했으나, 전제("운명을 바꾼다")의 페이오프는 0 진척이었다. codex 가 배신자 정체를 ch19~21 한 겹씩 무한 연기했다.

근본 원인은 **2겹**이다.
- **(a) 쇼러너 LLM 연재 편향** — 모멘텀(열린 질문)을 최적화하고 완성에 저항. `aa98137`(검토 프롬프트 전제 진척 지시)이 1차 처방.
- **(b) ★ 코드 — 약속↔회수 추적 데이터 부재** — 이번 세션 코드 조사로 드러난, 더 깊은 데이터 측 원인.
  - `Chapter.rewardArc`("약속과 회수")·`stakesLedger`는 [storyEngine.ts:152](../../../src/lib/storyEngine.ts) 타입 선언에만 있고 **배선이 0**(dead). `DraftChapterPayload`에 필드 자체가 없고, 매핑 코드도 없다.
  - `project.openThreads`는 `commitChapter`가 의도적으로 안 건드려 **정적**이다([storyEngine.ts:1571](../../../src/lib/storyEngine.ts)).
  - `PlotThread`는 `active: boolean`뿐, 회수 추적이 없다.
  - ➡️ **시스템에 "약속 ↔ 회수"를 추적하는 살아있는 데이터가 없다.** 회수를 추적할 그릇이 없으니 측정도 강제도 불가능했다.

`StakesLedgerEntry.resolution` 에는 이미 `'lost' | 'kept' | 'deferred'` 가 있다([storyEngine.ts:147](../../../src/lib/storyEngine.ts)). **`deferred`("다음 회차로 미뤘는가")가 정확히 codex 의 무한 연기 신호다.** 그릇은 설계돼 있었으나 dead 였다.

## 2. 목표 / 비목표

**목표** — dead 인 `rewardArc`/`stakesLedger`를 살려 회차마다 약속·회수·연기를 기록하고, 누적 레저로 정체를 **측정**해 (a) 검토 evidence (b) 지표 패널로 **드러낸다**. 차별점 철학("연속성은 충돌을 드러낸다, 자동으로 고치지 않는다")과 일관되게, 1단계는 *드러냄*까지다.

**비목표 (이 spec 범위 밖)**
- 차단/점수 게이트 → 2단계(`premise-progress` 스테이지)
- 캐논 유형 분류·plotThread 회수 추적 정밀화 → 3단계
- codex 생성 자율 교정("미해결은 추론 톤 유지") → 권고 2 별도 트랙

## 3. 결정 사항 (이 세션 합의)

| 항목 | 결정 |
|---|---|
| 게이트 성격 | 측정(결정론) + 판단(검토 evidence) 상보, 단계적 |
| 1단계 신호 | 약속↔회수 레저 — `rewardArc` + `stakesLedger` **함께** |
| 정체 임계 | `deferredStreak ≥ 3` (테스트에서 ch19·20·21 정확히 3회 연기) |
| 강제력 | 1단계는 **차단 없음** — 드러냄만. 차단은 2단계 |

## 4. 데이터 흐름 — 7 터치포인트

| # | 파일 | 변경 |
|---|---|---|
| 1 | `DraftChapterPayload` ([storyEngine.ts:376](../../../src/lib/storyEngine.ts)) | `rewardArc?: DraftRewardArc[]`·`stakesLedger?: DraftStakes[]` 필드 추가 (LLM 산출 그릇) |
| 2 | `buildDraftPrompt` ([promptBuilders.ts:182](../../../src/lib/server/promptBuilders.ts) + `tools/storyx.mjs:703`) | "이 회차의 약속·회수(rewardArc)와 핵심 stake 결말(lost/kept/deferred)을 함께 산출" 지시 + 출력 JSON 스키마에 필드 추가 |
| 3 | `normalizeDraftOutput` (`tools/storyx.mjs:788`) | `normalizeDraftRewardArc`·`normalizeDraftStakes` 추가. 누락=빈 배열(보수적, `normalizeDraftBeats` tension 처리와 동형) |
| 4 | `commitChapter` ([storyEngine.ts:1570](../../../src/lib/storyEngine.ts)) | payload 의 `rewardArc`/`stakesLedger`를 `chapter`에 저장(Chapter 필드는 이미 존재, 현재 안 채워짐) |
| 5 | **`payoffLedger.ts` (신규)** | `chapters` → 누적 레저 계산 (순수 함수) |
| 6 | `buildAgentReviewPrompt` (promptBuilders.ts + storyx.mjs) | (a) `stakes_progression_audit` criteriaKey 정식 배선(dead 해소) (b) `computePayoffLedger` 측정값을 evidence 문장으로 주입 |
| 7 | `studioMetrics` ([studioMetrics.ts](../../../src/lib/studioMetrics.ts)) | floating 지표 패널에 "전제 진척"(열린 약속·deferred streak) 한 줄 노출 |

## 5. 핵심 유닛 — `computePayoffLedger` (순수 함수)

```ts
// src/lib/payoffLedger.ts
export interface PayoffLedgerReport {
  openPromises: number;        // payoff 가 빈 rewardArc.promise 누적 수
  paidPromises: number;        // payoff 가 채워진 수
  deferredStreak: number;      // 끝에서부터 "회수 없는 회차" 연속 수
  lastPayoffEpisode: number | null;  // 마지막으로 회수한 회차
  isStalled: boolean;          // deferredStreak >= STALL_THRESHOLD
  measured: boolean;           // 레저 데이터가 하나라도 있었는가
}

export const STALL_THRESHOLD = 3;
export function computePayoffLedger(chapters: Chapter[]): PayoffLedgerReport;
```

**회차 단위 판정**
- 한 회차가 **회수(progress)** = `rewardArc` 에 payoff 채워진 항목 ≥ 1, **또는** `stakesLedger` 에 `resolution ∈ {lost, kept}` ≥ 1.
- 한 회차가 **연기(stall)** = 위 회수가 0 (새 promise 만 늘거나 `deferred` 만).
- `deferredStreak` = 마지막 회차에서부터 거슬러 "연기" 회차의 연속 길이.

**측정 불가 처리** — 어떤 회차도 `rewardArc`/`stakesLedger` 를 안 가지면 `measured=false`·`isStalled=false`. 데이터가 없을 때 거짓 경보를 내지 않는다(rank3 `measured:false skip` 철학과 일관). 구버전 작품·fallback draft 가 정체로 오탐되지 않게 한다.

**1단계 단순화 (모호성 잠금)** — 같은 약속의 promise↔payoff 매칭(ch1 약속이 ch5 에서 회수)은 **하지 않는다.** `rewardArc` 항목을 회차별로 카운트만 한다. 약속 식별·매칭은 3단계(plotThread 회수 상태 머신)로 미룬다. 따라서 `openPromises` 는 "전 회차의 payoff 빈 항목 수"라는 단순 집계이지, "현재 미회수 중인 고유 약속 수"가 아니다.

## 6. 인터페이스 계약

- `RewardArcEntry { promise, payoff, intensity? }` — 기존, 그대로 사용([storyEngine.ts:152](../../../src/lib/storyEngine.ts)).
- `StakesLedgerEntry { stake, atRisk, resolution? }` — 기존, 그대로 사용([storyEngine.ts:142](../../../src/lib/storyEngine.ts)).
- `PayoffLedgerReport` — 신규(§5).
- payload 측 `DraftRewardArc`/`DraftStakes` — LLM 원시 출력용 느슨한 타입. `commitChapter` 에서 도메인 타입으로 좁힌다(정규화는 storyx.mjs, 도메인 매핑은 storyEngine).

각 유닛은 독립 테스트 가능하다 — `computePayoffLedger`는 chapters 만 받는 순수 함수, 정규화 함수는 raw → 정형, 프롬프트 빌더는 문자열 산출.

## 7. 에러 / 폴백

- `rewardArc`/`stakesLedger` 누락(구버전·LLM 실패·fallback draft) → 빈 배열 정규화.
- **dead 타입 부활이라 기존 데이터·테스트 무영향** — 회귀 위험이 낮다(기존 코드 경로가 이 필드를 안 읽었음).
- LLM 이 부분/오형식 산출 시 → 정규화가 유효 항목만 통과(`normalizeDraftCanonFacts` 와 동형 가드).

## 8. 테스트 (TDD 순서)

1. **`payoffLedger.test.ts` (신규, RED 먼저)** — deferred streak 계산, 회수 회차가 streak 끊음, 측정 불가 시 `isStalled=false`, 임계 경계(2 vs 3).
2. **정규화** — `rewardArc`/`stakes` 누락·부분·정상 (storyx 또는 promptBuilders 테스트 레인).
3. **`promptBuilders.test`** — draft 프롬프트에 산출 지시 포함, review 프롬프트에 `stakes_progression_audit` + 측정 evidence 주입.
4. **`storyEngine.test`** — `commitChapter` 가 `rewardArc`/`stakesLedger` 보존, 누락 payload 도 안전.

## 9. 단계 경계 (YAGNI)

- **1단계 (이 spec)** — 배선 + 측정 + 드러냄.
- **2단계** — `storyHarness` 에 `premise-progress` 결정론 스테이지(점수·차단) + criteriaKeys 전면 정식화. `isStalled` 를 `readyForProduction` 에 연결.
- **3단계** — 캐논 유형 분류·plotThread 회수 상태 머신 등 정밀화.

## 10. 리스크 / 미해결

- **LLM 산출 신뢰도** — codex 가 `rewardArc`/`deferred` 를 정직하게 낼 인센티브가 약할 수 있다(자기 연기를 deferred 로 표시 안 할 수). → 검토 evidence(쇼러너)가 교차검증. 라이브 검증으로 산출률 확인 필요.
- **임계 3 튜닝** — 매체·장르별로 다를 수 있다. 1단계는 상수, 2단계에서 조정 가능하게.
- **stakesLedger vs rewardArc 신호 중복** — 둘 다 회수를 표현. computePayoffLedger 가 OR 로 합산하므로 한쪽만 채워져도 회수로 인정(보수적으로 정체 판정 → 거짓 차단 위험 낮춤).
