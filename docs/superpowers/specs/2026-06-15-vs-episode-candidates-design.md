# VS 회차 후보 — 의외성 제안 채널 design

> 작성 2026-06-15 · Claude(편집장) + 사용자 합의 · 품질·비용 로드맵 Phase C(트위스트 제안 채널) 1순위
> 입력 정본 — 딥리서치 `docs/research/2026-06-14-prose-quality-surprise-research.md` §2 Layer 1 VS 권고(1순위), 사용자 실독 결함 U4(의외성 부재)
> 계보 — `docs/superpowers/specs/2026-06-10-author-decision-forks-design.md`가 비목표로 미뤄둔 "LLM 기반 갈림길 생성(2단계)"의 실현. 단 기존 fork를 대체하지 않고 **상보적 별 채널**이다.

## 1. 배경 — 왜 이걸 하나

30화 A/B(통제군 91.8 vs 실험군 76.5)와 사용자 실독 판정의 U4(의외성 부재 — "보조만 하고 제안하지 않음")가 출발점이다. 딥리서치가 외부 근거를 댔다.

- **조기 해소·mode collapse** — LLM 산문의 평탄함은 디코딩이 아니라 정렬 후처리의 typicality bias에서 온다. 결말 한참 전에 예측 가능해지는 조기 해소(후반부 no-rate 전문가 대비 3배 낮음)가 핵심 실패 모드다.
- **처방 1순위 = VS(Verbalized Sampling)** — 직접 답 하나 대신 모델이 **N개 후보 + 각 확률을 verbalize** 하게 하면 창작 다양성이 직접 프롬프트 대비 1.6~2.1배 오른다. training-free·즉시 적용.
- **기존 fork의 공백** — `episodeBriefing.buildEpisodeForks`는 결정론으로 "**이미 있는** 약속/떡밥/위험 중 *어느 것*을 다룰까"만 고른다. 새 전개 방향을 *제안*하지 못한다. VS가 정확히 그 공백을 메운다.
- **경쟁 벤치마크** — Sudowrite Story Engine식 "후보 제시 후 작가 선택" UX. Story X 제품 방향("보조가 아니라 제안하는 동료")과 직결한다.

## 2. 목표 / 비목표

**목표**
- (A) **VS 후보 LLM 채널** — `buildVsCandidatesPrompt`가 헌장·캐논·최근 회차를 읽고 "이번 화 전개 방향 N개 + 각 확률(흔할 법한 것부터 꼬리까지 분포)"을 verbalize한다. spine-suggest 인프라를 6개 지점에 복제한다.
- (B) **갈림길 카드 확장** — on-demand `[전개 후보 받기]` 버튼이 후보를 흔함/의외/파격 **라벨**로 렌더하고, 클릭하면 기존 `composeIntentWithFork`로 의도 메모에 한 줄 합류한다.

**비목표 (이 spec 범위 밖)**
- 회차 초안 N개 전체 생성 — 비용 폭발(이미 생성 ~90초). 방향 한 줄만 뽑는다.
- 결말 헌장 변경·`storyContract.amendments` 기록 — VS는 *경로*만 흔든다. 결말 불가침(Phase C-2 amendments는 별 사이클).
- min-p 디코딩 기본값·후반부 긴장 게이트 — A 묶음 다른 사이클(각각 별 spec).
- 자동 트리거(정체 시 자동 발화) — 현재 버튼 on-demand만. 정체 자동은 후속 후보.

## 3. 결정 사항

| 항목 | 결정 |
|---|---|
| 후보 생성 방식 | **LLM(codex), on-demand 버튼** — spine-suggest 패턴. 매 회차 자동 아님(비용 U5 안전) |
| 후보 단위 | **전개 방향 한 줄 + 확률** — 비트·초안 아님(저비용·intentSeed 직결) |
| 후보 개수 N | **4** — 흔함~파격 분포 확보 + 선택 부담 적정 |
| 확률 활용 | **내부 rarity 변환에만** · 작가에겐 라벨만 노출. LLM verbalize 확률은 캘리브레이션 미보장 → 숫자는 거짓 정밀이라 비노출 |
| rarity 임계 | `p≥0.4` 흔함 · `0.15≤p<0.4` 의외 · `p<0.15` 파격 (결정론, 라이브 후 조정 가능) |
| 결말 불가침 | 프롬프트가 "결말 헌장 배신 금지 · 가는 *경로*만 의외로" 명시. VS는 조기 해소 방지지 결말 뒤집기가 아니다 |
| canonSuspect | **기존 `overlapsCanonFact` 재사용** — 방향이 기확정 캐논과 크게 겹치면 배지(제외 아니라 경고, fork와 동형) |
| intent 합성 | 선택 시 `buildVsIntentSeed` 한 줄을 **기존 `composeIntentWithFork`로 append** · 중복 무시 · `stripConsumedSeeds`에 VS 패턴 추가(생성 후 소거) |
| 실패 시 | ok:false → 카드 안내만, **폴백 없음** — 창작이라 결정론 폴백 빈약(4줄 제안과 동일 원칙) |

## 4. 데이터 흐름 — 터치포인트

```
[전개 후보 받기] 버튼
  → vsCandidatesClient.requestVsCandidates (★spineSuggestClient 복제)
  → /api/vs-candidates (codex)  ── buildVsCandidatesPrompt ★promptBuilders↔storyx.mjs byte-identical 미러
  → { candidates: [{ direction, probability }] }
  → normalizeVsCandidates → classifyRarity → 흔함/의외/파격 라벨 + ★canonSuspect
  → 갈림길 카드 후보 렌더 → 후보 클릭 → ★composeIntentWithFork → 의도 메모
  → ★buildDraftPrompt 소비 → 생성 → ★stripConsumedSeeds 소거
```

| # | 파일 | 변경 |
|---|---|---|
| 1 | `src/lib/episodeBriefing.ts` | `VsCandidate`·`VsRarity` 타입 + `classifyRarity`·`buildVsIntentSeed`(순수) + `stripConsumedSeeds`에 VS 시드 패턴 추가. `overlapsCanonFact`는 이미 여기 있어 재사용 |
| 2 | `src/lib/server/promptBuilders.ts` | `buildVsCandidatesPrompt(input)` 신규 |
| 3 | `tools/storyx.mjs` | `buildVsCandidatesPrompt` **byte-identical 미러** + `vs-candidates` 명령(codex, Q2 재시도 가드·`normalizeVsCandidates`) |
| 4 | `api/vs-candidates.ts` (신규, prod) | body 파싱 → 프롬프트 → provider (api/spine-suggest.ts와 동형) |
| 5 | `vite.config.ts` | `/api/vs-candidates` storyxBridge 라우트(codex) |
| 6 | `src/lib/vsCandidatesClient.ts` (신규) | fetch·`normalizeVsCandidates`·ok/reason·`reportAiCall` mode `vs-candidates` (★spineSuggestClient 복제) |
| 7 | `src/lib/aiStatus.ts` | `AiCallMode`에 `vs-candidates` + 라벨("전개 후보") |
| 8 | `src/components/FloatingEditor.tsx` | fork 섹션에 VS 블록 — 버튼·후보 한 줄·rarity 배지·canonSuspect 배지·로딩/실패 안내 |
| 9 | `src/StoryXDesk.tsx` `floatingEditorProps` | `vsCandidates` state · `onRequestVsCandidates`(클라이언트 호출) · `onSelectVsCandidate`(composeIntentWithFork) 주입 |
| 10 | `src/styles.css` | `.fc-vs-*` 다크 토큰(기존 `.fc-*` 재사용) |

## 5. 인터페이스 계약

```ts
// src/lib/episodeBriefing.ts
export type VsRarity = 'common' | 'surprising' | 'radical';
export interface VsCandidate {
  direction: string;
  probability: number;     // LLM verbalize 추정, 내부용(비노출)
  rarity: VsRarity;        // classifyRarity(probability)
  canonSuspect?: boolean;  // overlapsCanonFact 재사용
}
export function classifyRarity(probability: number): VsRarity;
export function buildVsIntentSeed(direction: string): string; // `이번 화의 전개: "{direction}"`

// src/lib/vsCandidatesClient.ts
export interface VsCandidatesInput {
  medium: string;
  format: string;
  contractDigest?: string;   // 헌장 4줄 + 결말 + 위치 N/M (있을 때)
  recentSummary: string;     // 최근 1~2화 요약
  unpaidPromises: string[];  // 미회수 약속
  canonStatements: string[]; // canonSuspect 판정용
}
export interface VsCandidatesResult { ok: boolean; candidates?: VsCandidate[]; reason?: string; }
export function requestVsCandidates(input: VsCandidatesInput): Promise<VsCandidatesResult>;
export function normalizeVsCandidates(raw: unknown, canonStatements: string[]): VsCandidate[];
```

**JSON 계약** — provider 응답은 `{ "candidates": [{ "direction": string, "probability": number }] }`. `normalizeVsCandidates`가 `classifyRarity`·`overlapsCanonFact`를 적용해 `VsCandidate[]`로 변환한다.

**프롬프트 핵심 지시 (buildVsCandidatesPrompt)**
- "이번 화 전개 방향 **4개**를 각 확률과 함께 생성하라. 흔할 법한 전개부터 **꼬리(의외)까지 분포를 포함**하라."
- "**결말 헌장은 배신하지 말라.** 결말로 수렴하는 *경로*만 의외로 흔들어라."
- "각 방향은 인물의 선택·대가가 드러나는 한 문장."
- JSON only 계약.

## 6. 에러 / 폴백

- provider 실패·빈 후보·fetch throw → `ok:false`, 카드 안내만(폴백 없음).
- `probability` 누락/비숫자/범위 밖 → `normalizeVsCandidates`가 **0.3(의외)으로 기본 처리**(후보를 버리지 않고 중립 라벨). `direction`이 빈 문자열인 후보만 제외.
- provider가 4개 초과 반환 → 상위 4개만 표시(`normalizeVsCandidates` slice, 기존 fork `MAX_OPTIONS` 동형) · 미만 → 받은 만큼 렌더.
- 헌장 없는 작품 → `contractDigest` 생략, 캐논·최근 회차만으로 생성(하위호환).
- 구클라이언트/배포본 → 새 라우트라 기존 경로 무영향. FloatingEditor에 `onRequestVsCandidates` 미주입 시 버튼 미렌더.

## 7. 테스트 (TDD 순서)

1. `episodeBriefing.test.ts` (RED 먼저) — `classifyRarity` 경계값(0.4·0.15 임계), `buildVsIntentSeed` 형식, `stripConsumedSeeds`가 VS 시드를 소거하되 작가 자필은 보존.
2. `promptBuilders.test.ts` — `buildVsCandidatesPrompt` 핵심 문구(4개·확률·꼬리 분포·결말 불가침) + `storyx.mjs` **byte-identical 미러** 핀.
3. `vsCandidatesClient.test.ts` (신규) — `normalizeVsCandidates`(빈 배열·확률 기본값 0.3·canonSuspect 주입·rarity 변환·빈 direction 제외).
4. `floatingEditor.test.ts` — `[전개 후보 받기]` 버튼 렌더 · `onRequestVsCandidates` 호출 · 후보 클릭 시 `onSelectVsCandidate` 합성 · rarity 배지 렌더 · onRequest 미주입 시 버튼 미렌더.

## 8. 리스크 / 미해결

- **LLM 확률 캘리브레이션** — verbalize 확률은 부정확하다. rarity 라벨이 완충하지만 "파격"이 실제 파격이 아닐 수 있다. 라이브 관찰 + 임계 조정.
- **결말 불가침 강제력** — 프롬프트 문구로만 강제한다. VS가 결말 헌장을 우회하는 경로를 제안하면 검토망(연속성·쇼러너)이 잡아야 한다. 라이브에서 채택 후 생성물의 결말 정합을 확인.
- **의외 ≠ 스테이크 있는 긴장** (딥리서치 open question) — "파격"이 무의미한 혼돈일 위험. 프롬프트의 "결말로 수렴하는 경로 내 의외" 제약으로 완화하되, 후반부 긴장 게이트(별 사이클)가 근본 보완.
- **비용** — 회차당 호출 +1(버튼 눌렀을 때만). Phase E-1 계측에 `vs-candidates` 호출 수를 포함한다.
- **한국어 전이** — 딥리서치 근거 공백(영어 코퍼스). VS 다양성이 한국어 산문 질감으로 전이되는지 미검증. 라이브에서 채택 회차의 실독 품질로 관찰.

## 9. 검증 계획

- 단위 — 위 TDD 4파일 전부 녹색 + tsc 0 + build.
- 라이브(preview) — 회차 2개 이상 작품에서 `[전개 후보 받기]` → 4개 후보 + 라벨 배지 렌더 → 파격 후보 클릭 → 의도 메모 합류 → 생성 → 결말 헌장 정합 확인 → `stripConsumedSeeds` 소거 확인 → 콘솔 0.
- 미러 — `promptBuilders.ts`↔`storyx.mjs` byte-identical(회귀 핀).
