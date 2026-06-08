# 아크 페이오프 게이트 1단계 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dead 상태인 `rewardArc`/`stakesLedger`를 살려 회차별 약속↔회수를 기록하고, 누적 레저로 전제 정체를 측정해 검토 evidence·지표로 드러낸다(차단 없음).

**Architecture:** 측정(순수 함수 `computePayoffLedger`) + 판단(검토 프롬프트 evidence 주입)의 상보 구조. LLM 산출 그릇(payload)→정규화(2경로)→도메인 매핑(`chapterFromDraftPayload`)→측정→검토/지표 노출. 1단계는 신호를 *드러내기만* 하고 `readyForProduction` 차단은 2단계로 미룬다.

**Tech Stack:** TypeScript, Vitest(TDD), 기존 `tools/storyx.mjs`(codex CLI 경로) + `src/lib/draftClient.ts`(서버 경로) 이중 정규화 패턴, Vite.

**Spec:** `docs/superpowers/specs/2026-06-09-arc-payoff-gate-design.md`

**검증 게이트(매 태스크 후):** `bash init.sh` 또는 `npm test` 녹색. 절대 테스트 수치는 박지 않는다 — `progress.md` '최근 검증'에서만 관리.

---

## 파일 구조 (무엇이 어디서)

| 파일 | 책임 | 변경 |
|---|---|---|
| `src/lib/payoffLedger.ts` | 약속↔회수 측정 순수 함수 | **신규** |
| `src/lib/payoffLedger.test.ts` | 측정 단위 테스트 | **신규** |
| `src/lib/storyEngine.ts` | `DraftChapterPayload` 그릇 + `chapterFromDraftPayload` 매핑 | 수정 |
| `src/lib/storyEngine.test.ts` | payload→chapter 흐름 테스트 | 수정 |
| `src/lib/draftClient.ts` | 서버(/api/draft) 응답 정규화 | 수정 |
| `src/lib/draftClient.test.ts` | 정규화 단위 테스트(있으면 확장, 없으면 신규) | 수정/신규 |
| `tools/storyx.mjs` | codex CLI 생성·정규화·프롬프트(라이브 경로) | 수정 |
| `src/lib/server/promptBuilders.ts` | 생성·검토 프롬프트 빌더 | 수정 |
| `src/lib/server/promptBuilders.test.ts` | 프롬프트 단위 테스트 | 수정 |
| `src/lib/studioMetrics.ts` | 지표 패널 데이터 | 수정 |
| `src/lib/studioMetrics.test.ts` | 지표 단위 테스트 | 수정 |

**중요** — `tools/storyx.mjs`(CLI)와 `src/lib/server/promptBuilders.ts`(서버)는 `buildDraftPrompt`/`buildAgentReviewPrompt`가 **거의 동일하게 중복**돼 있다. 둘 다 미러로 고친다(aa98137 선례). 단위 테스트는 `promptBuilders.test`로 커버하고 `storyx.mjs`는 라이브 스모크로 검증한다(storyx.mjs는 단위 테스트 레인 없음).

---

## Task 1: 측정 코어 `computePayoffLedger` (순수 함수)

가장 독립적(Chapter 타입만 의존)이라 먼저 만든다.

**Files:**
- Create: `src/lib/payoffLedger.ts`
- Test: `src/lib/payoffLedger.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/payoffLedger.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computePayoffLedger, STALL_THRESHOLD } from './payoffLedger';
import type { Chapter } from './storyEngine';

function ch(episode: number, opts: Partial<Pick<Chapter, 'rewardArc' | 'stakesLedger'>> = {}): Chapter {
  return {
    id: `episode-${episode}`, episode, title: `${episode}화`, hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...opts
  };
}

describe('computePayoffLedger', () => {
  it('레저 데이터가 전혀 없으면 measured=false·isStalled=false (거짓 경보 차단)', () => {
    const r = computePayoffLedger([ch(1), ch(2)]);
    expect(r.measured).toBe(false);
    expect(r.isStalled).toBe(false);
  });

  it('회수 없는 회차가 임계 이상 연속이면 isStalled=true', () => {
    const r = computePayoffLedger([
      ch(1, { rewardArc: [{ promise: 'q', payoff: '회수됨' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { rewardArc: [{ promise: 'q2', payoff: '' }] }),
      ch(4, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    expect(r.deferredStreak).toBe(3); // ch2·3·4 회수 없음
    expect(r.isStalled).toBe(true);
    expect(STALL_THRESHOLD).toBe(3);
  });

  it('마지막 회차가 회수하면 streak이 끊기고 lastPayoffEpisode 기록', () => {
    const r = computePayoffLedger([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'kept' }] })
    ]);
    expect(r.deferredStreak).toBe(0);
    expect(r.isStalled).toBe(false);
    expect(r.lastPayoffEpisode).toBe(3);
  });

  it('open/paid promise를 항목 단위로 집계', () => {
    const r = computePayoffLedger([
      ch(1, { rewardArc: [{ promise: 'a', payoff: 'x' }, { promise: 'b', payoff: '' }] })
    ]);
    expect(r.paidPromises).toBe(1);
    expect(r.openPromises).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/payoffLedger.test.ts`
Expected: FAIL — "Cannot find module './payoffLedger'"

- [ ] **Step 3: 구현 작성**

`src/lib/payoffLedger.ts`:
```ts
// 회차별 약속↔회수 레저를 누적해 전제 진척 정체를 측정한다 (continuity≠payoff 1단계).
// 정본 — docs/superpowers/specs/2026-06-09-arc-payoff-gate-design.md
import type { Chapter } from './storyEngine';

export interface PayoffLedgerReport {
  /** payoff 가 빈 rewardArc 항목 누적 수 (단순 집계 — 고유 약속 추적 아님). */
  openPromises: number;
  /** payoff 가 채워진 rewardArc 항목 누적 수. */
  paidPromises: number;
  /** 마지막 회차에서부터 "회수 없는 회차" 연속 길이. */
  deferredStreak: number;
  /** 마지막으로 회수한 회차 번호. 없으면 null. */
  lastPayoffEpisode: number | null;
  /** deferredStreak >= STALL_THRESHOLD. */
  isStalled: boolean;
  /** 레저 데이터가 하나라도 있었는가 — 없으면 측정 불가로 본다. */
  measured: boolean;
}

export const STALL_THRESHOLD = 3;

// 한 회차가 회수했는가 — rewardArc payoff 채워짐 OR stakesLedger resolution kept/lost.
function chapterHasPayoff(chapter: Chapter): boolean {
  const rewardPaid = (chapter.rewardArc ?? []).some((e) => e.payoff.trim().length > 0);
  const stakeResolved = (chapter.stakesLedger ?? []).some(
    (e) => e.resolution === 'kept' || e.resolution === 'lost'
  );
  return rewardPaid || stakeResolved;
}

function chapterHasLedger(chapter: Chapter): boolean {
  return (chapter.rewardArc?.length ?? 0) > 0 || (chapter.stakesLedger?.length ?? 0) > 0;
}

export function computePayoffLedger(chapters: Chapter[]): PayoffLedgerReport {
  const measured = chapters.some(chapterHasLedger);
  if (!measured) {
    return {
      openPromises: 0, paidPromises: 0, deferredStreak: 0,
      lastPayoffEpisode: null, isStalled: false, measured: false
    };
  }

  let openPromises = 0;
  let paidPromises = 0;
  let lastPayoffEpisode: number | null = null;

  for (const chapter of chapters) {
    for (const entry of chapter.rewardArc ?? []) {
      if (entry.payoff.trim().length > 0) paidPromises += 1;
      else openPromises += 1;
    }
    if (chapterHasPayoff(chapter)) lastPayoffEpisode = chapter.episode;
  }

  let deferredStreak = 0;
  for (let i = chapters.length - 1; i >= 0; i -= 1) {
    if (chapterHasPayoff(chapters[i])) break;
    deferredStreak += 1;
  }

  return {
    openPromises,
    paidPromises,
    deferredStreak,
    lastPayoffEpisode,
    isStalled: deferredStreak >= STALL_THRESHOLD,
    measured: true
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/payoffLedger.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/payoffLedger.ts src/lib/payoffLedger.test.ts
git commit -m "feat: payoffLedger 측정 코어 — 약속↔회수 누적·deferredStreak·isStalled (아크 페이오프 1단계)"
```

---

## Task 2: payload 그릇 확장 + `chapterFromDraftPayload` 매핑

LLM이 산출한 `rewardArc`/`stakesLedger`가 회차에 흐르게 한다.

**Files:**
- Modify: `src/lib/storyEngine.ts` (DraftChapterPayload ~376, chapterFromDraftPayload ~1228)
- Test: `src/lib/storyEngine.test.ts` (기존 :82 강화)

- [ ] **Step 1: 실패 테스트로 :82 강화**

`src/lib/storyEngine.test.ts`의 `it('Chapter.stakesLedger / rewardArc 가 optional 로 보존된다', ...)` 를 아래로 교체(payload→chapter 자동 흐름을 검증):
```ts
  it('chapterFromDraftPayload 가 payload 의 rewardArc/stakesLedger 를 chapter 로 매핑한다', () => {
    const empty = createEmptyProject({ title: '단편' });
    const result = chapterFromDraftPayload(
      empty,
      {
        title: '1화', hook: '문이 열렸다', outline: ['들어간다'],
        beats: [{ label: 'a', summary: 'b' }], prose: '본문.', newCanonFacts: [],
        rewardArc: [{ promise: '문의 비밀', payoff: '문 너머의 메모', intensity: 70 }],
        stakesLedger: [{ stake: '신뢰', atRisk: '서윤', resolution: 'deferred' }]
      },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    expect(result.chapter.rewardArc?.[0].payoff).toBe('문 너머의 메모');
    expect(result.chapter.stakesLedger?.[0].resolution).toBe('deferred');
  });

  it('rewardArc/stakesLedger 가 없는 payload 도 안전하게 커밋된다', () => {
    const empty = createEmptyProject({ title: '단편' });
    const result = chapterFromDraftPayload(
      empty,
      { title: '1화', hook: 'h', outline: [], beats: [], prose: 'p', newCanonFacts: [] },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    expect(result.chapter.rewardArc ?? []).toEqual([]);
    expect(result.chapter.stakesLedger ?? []).toEqual([]);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/storyEngine.test.ts -t "rewardArc/stakesLedger"`
Expected: FAIL — payload 타입에 `rewardArc` 없음(tsc) 또는 `result.chapter.rewardArc` undefined

- [ ] **Step 3-a: payload 그릇 확장**

`src/lib/storyEngine.ts` `DraftChapterPayload`(~376) 위에 느슨한 입력 타입 추가:
```ts
export interface DraftChapterPayloadRewardArc {
  promise: string;
  payoff: string;
  intensity?: number;
}

export interface DraftChapterPayloadStakes {
  stake: string;
  atRisk: string;
  resolution?: 'lost' | 'kept' | 'deferred';
}
```
그리고 `DraftChapterPayload` 인터페이스 안 `newCanonFacts` 아래에 추가:
```ts
  /** 아크 페이오프 1단계 — LLM 이 산출한 이 회차의 약속·회수. 누락 가능. */
  rewardArc?: DraftChapterPayloadRewardArc[];
  /** 아크 페이오프 1단계 — LLM 이 산출한 이 회차의 stake 결말. 누락 가능. */
  stakesLedger?: DraftChapterPayloadStakes[];
```

- [ ] **Step 3-b: `chapterFromDraftPayload` 매핑**

`src/lib/storyEngine.ts` `chapterFromDraftPayload`의 `chapter` 객체(~1228)에서 `newCanonFacts` 줄 아래에 추가:
```ts
    newCanonFacts,
    rewardArc: (payload.rewardArc ?? [])
      .filter((e) => typeof e?.promise === 'string' && e.promise.trim().length > 0)
      .map((e) => ({
        promise: e.promise.trim(),
        payoff: typeof e.payoff === 'string' ? e.payoff.trim() : '',
        ...(typeof e.intensity === 'number' ? { intensity: Math.max(0, Math.min(100, Math.round(e.intensity))) } : {})
      })),
    stakesLedger: (payload.stakesLedger ?? [])
      .filter((e) => typeof e?.stake === 'string' && e.stake.trim().length > 0)
      .map((e) => ({
        stake: e.stake.trim(),
        atRisk: typeof e.atRisk === 'string' ? e.atRisk.trim() : '',
        ...(e.resolution === 'lost' || e.resolution === 'kept' || e.resolution === 'deferred' ? { resolution: e.resolution } : {})
      }))
```
(주의 — `chapter` 객체는 `Chapter` 타입이므로 `rewardArc?`/`stakesLedger?`가 이미 선언돼 있다. 매핑만 추가하면 된다.)

- [ ] **Step 4: 테스트 통과 + 회귀 확인**

Run: `npx vitest run src/lib/storyEngine.test.ts`
Expected: PASS (신규 2 + 기존 전부)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/storyEngine.ts src/lib/storyEngine.test.ts
git commit -m "feat: chapterFromDraftPayload 가 rewardArc/stakesLedger 를 회차로 매핑 (아크 페이오프 1단계)"
```

---

## Task 3: 서버 경로 정규화 `draftClient.ts`

`/api/draft` 응답(서버 LLM)에서 rewardArc/stakesLedger를 정규화해 payload에 싣는다.

**Files:**
- Modify: `src/lib/draftClient.ts` (normalizeBeats ~72, normalizeCanonFacts ~89 인근)
- Test: `src/lib/draftClient.test.ts` (없으면 신규)

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/draftClient.test.ts`에 추가(파일 없으면 생성, import 경로는 `draftClient`의 export에 맞춤):
```ts
import { describe, it, expect } from 'vitest';
import { normalizeRewardArc, normalizeStakesLedger } from './draftClient';

describe('draftClient 약속↔회수 정규화', () => {
  it('rewardArc 유효 항목만 통과·intensity 보정', () => {
    expect(normalizeRewardArc([
      { promise: 'a', payoff: 'b', intensity: 200 },
      { promise: '', payoff: 'x' },
      'junk'
    ])).toEqual([{ promise: 'a', payoff: 'b', intensity: 100 }]);
  });
  it('비배열은 빈 배열', () => {
    expect(normalizeRewardArc(undefined)).toEqual([]);
    expect(normalizeStakesLedger(null)).toEqual([]);
  });
  it('stakes resolution 화이트리스트 밖은 생략', () => {
    expect(normalizeStakesLedger([{ stake: 's', atRisk: 'x', resolution: 'maybe' }]))
      .toEqual([{ stake: 's', atRisk: 'x' }]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/draftClient.test.ts`
Expected: FAIL — `normalizeRewardArc` is not a function

- [ ] **Step 3: 구현 작성**

`src/lib/draftClient.ts`의 `normalizeCanonFacts`(~89) 아래에 추가(기존 `normalizeBeats` 패턴을 따름):
```ts
export function normalizeRewardArc(value: unknown): DraftChapterPayload['rewardArc'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => {
      const promise = typeof e.promise === 'string' ? e.promise.trim() : '';
      const payoff = typeof e.payoff === 'string' ? e.payoff.trim() : '';
      const out: { promise: string; payoff: string; intensity?: number } = { promise, payoff };
      if (typeof e.intensity === 'number' && Number.isFinite(e.intensity)) {
        out.intensity = Math.max(0, Math.min(100, Math.round(e.intensity)));
      }
      return out;
    })
    .filter((e) => e.promise.length > 0);
}

export function normalizeStakesLedger(value: unknown): DraftChapterPayload['stakesLedger'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => {
      const stake = typeof e.stake === 'string' ? e.stake.trim() : '';
      const atRisk = typeof e.atRisk === 'string' ? e.atRisk.trim() : '';
      const out: { stake: string; atRisk: string; resolution?: 'lost' | 'kept' | 'deferred' } = { stake, atRisk };
      if (e.resolution === 'lost' || e.resolution === 'kept' || e.resolution === 'deferred') {
        out.resolution = e.resolution;
      }
      return out;
    })
    .filter((e) => e.stake.length > 0);
}
```
그리고 payload 조립부(`newCanonFacts: normalizeCanonFacts(data.newCanonFacts)` ~61)에 추가:
```ts
        newCanonFacts: normalizeCanonFacts(data.newCanonFacts),
        rewardArc: normalizeRewardArc(data.rewardArc),
        stakesLedger: normalizeStakesLedger(data.stakesLedger)
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/draftClient.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/draftClient.ts src/lib/draftClient.test.ts
git commit -m "feat: draftClient 서버 응답에서 rewardArc/stakesLedger 정규화 (아크 페이오프 1단계)"
```

---

## Task 4: CLI 경로 정규화 `tools/storyx.mjs`

codex CLI 생성(라이브 테스트 경로)에서도 같은 필드를 정규화한다. 단위 테스트 레인 없음 → Task 7 라이브 스모크로 검증.

**Files:**
- Modify: `tools/storyx.mjs` (normalizeDraftCanonFacts ~839 인근, normalizeDraftOutput ~788)

- [ ] **Step 1: 정규화 함수 추가**

`tools/storyx.mjs`의 `normalizeDraftCanonFacts`(~839) 아래에 추가(`normalizeDraftBeats` 패턴 미러):
```js
function normalizeDraftRewardArc(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((e) => {
      const out = {
        promise: readString(e.promise),
        payoff: readString(e.payoff)
      };
      if (typeof e.intensity === 'number' && Number.isFinite(e.intensity)) {
        out.intensity = Math.max(0, Math.min(100, Math.round(e.intensity)));
      }
      return out;
    })
    .filter((e) => e.promise);
}

function normalizeDraftStakes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((e) => {
      const out = { stake: readString(e.stake), atRisk: readString(e.atRisk) };
      if (e.resolution === 'lost' || e.resolution === 'kept' || e.resolution === 'deferred') {
        out.resolution = e.resolution;
      }
      return out;
    })
    .filter((e) => e.stake);
}
```

- [ ] **Step 2: `normalizeDraftOutput` 반환에 연결**

`tools/storyx.mjs` `normalizeDraftOutput`(~788)의 반환 객체에서 `newCanonFacts:` 줄 아래에 추가:
```js
    newCanonFacts: normalizeDraftCanonFacts(parsed?.newCanonFacts),
    rewardArc: normalizeDraftRewardArc(parsed?.rewardArc),
    stakesLedger: normalizeDraftStakes(parsed?.stakesLedger),
```

- [ ] **Step 3: tsc·전체 테스트로 회귀 확인 (mjs는 빌드 무관, 회귀만)**

Run: `npm test`
Expected: PASS (기존 전부 — storyx.mjs 변경은 기존 테스트에 영향 없음)

- [ ] **Step 4: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat: storyx CLI 정규화에 rewardArc/stakesLedger 추가 (아크 페이오프 1단계)"
```

---

## Task 5: 생성 프롬프트 — LLM에 약속↔회수 산출 요청

`buildDraftPrompt`(서버+CLI 양쪽)의 출력 JSON 스키마에 필드를 추가해 LLM이 산출하게 한다.

**Files:**
- Modify: `src/lib/server/promptBuilders.ts` (buildDraftPrompt 출력형식 ~256-264)
- Modify: `tools/storyx.mjs` (buildDraftPrompt 출력형식 ~776-783, 미러)
- Test: `src/lib/server/promptBuilders.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/server/promptBuilders.test.ts`에 추가:
```ts
  it('buildDraftPrompt 가 연재 회차에 rewardArc/stakesLedger 산출을 요청한다', () => {
    const p = buildDraftPrompt({ medium: 'novel', format: '장편', freewrite: 'x', title: 't', context: '' });
    expect(p).toContain('rewardArc');
    expect(p).toContain('stakesLedger');
    expect(p).toContain('deferred');
  });
```
(import에 `buildDraftPrompt`가 없으면 추가.)

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts -t "rewardArc"`
Expected: FAIL — 문자열 미포함

- [ ] **Step 3-a: 서버 프롬프트 수정**

`src/lib/server/promptBuilders.ts` buildDraftPrompt 출력형식에서 `"newCanonFacts": [...]` 줄(~260-263) 뒤, `'}'` 앞에 추가:
```ts
    '  ],',
    isSerial
      ? '  "rewardArc": [{ "promise": "이 회차가 건 약속/질문", "payoff": "이 회차가 실제로 회수한 것 — 없으면 빈 문자열", "intensity": 0 }],'
      : '  "rewardArc": [{ "promise": "이 글이 건 약속", "payoff": "회수한 것", "intensity": 0 }],',
    isSerial
      ? '  "stakesLedger": [{ "stake": "위험에 놓인 것", "atRisk": "누가/무엇이", "resolution": "lost|kept|deferred — 다음 회차로 미뤘으면 deferred" }]'
      : '  "stakesLedger": [{ "stake": "위험에 놓인 것", "atRisk": "누가/무엇이", "resolution": "lost|kept" }]',
    '}'
```
**주의** — 기존 마지막 newCanonFacts 항목 줄 끝 콤마 정합을 확인한다. 기존 `'  "newCanonFacts": [{ ... }]'`(콤마 없음) → 뒤에 항목이 붙으므로 그 줄 끝에 `,`를 추가해야 JSON 예시가 유효하다. 즉 newCanonFacts 줄을 `... }],` 로 바꾸고 위 블록을 잇는다. (예시 JSON이므로 실파싱은 아니나 LLM 혼동 방지.)

규칙 섹션(`...rules` 인근, isSerial 분기)에도 한 줄 지시 추가:
```ts
          '- 이 회차가 건 약속과 실제로 회수한 것을 rewardArc 로, 핵심 위험의 결말(lost/kept/deferred)을 stakesLedger 로 함께 적습니다. 회수를 미뤘으면 솔직히 deferred 로 표시합니다.',
```

- [ ] **Step 3-b: CLI 프롬프트 미러**

`tools/storyx.mjs` buildDraftPrompt(~776-783)에 Step 3-a와 동일 내용을 미러로 적용(`isSerial`/`isEssay` 분기 동일, JS 문자열 문법).

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/server/promptBuilders.ts src/lib/server/promptBuilders.test.ts tools/storyx.mjs
git commit -m "feat: 생성 프롬프트가 rewardArc/stakesLedger 산출 요청 (아크 페이오프 1단계)"
```

---

## Task 6: 검토 프롬프트 — 측정 evidence + criteriaKey 정식 배선

`aa98137`의 자연어 지시를 *측정 기반*으로 격상한다. `buildAgentReviewPrompt`가 정체 측정값을 받아 evidence로 주입하고, `stakes_progression_audit` criteriaKey를 명시한다.

**Files:**
- Modify: `src/lib/server/promptBuilders.ts` (AgentReviewPromptInput 타입, buildAgentReviewPrompt ~341-363)
- Modify: `tools/storyx.mjs` (buildAgentReviewPrompt 미러)
- Test: `src/lib/server/promptBuilders.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
  it('buildAgentReviewPrompt 가 정체 측정값을 evidence 로 주입한다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: '', target: '본문', medium: 'novel', context: '',
      payoffStatus: { isStalled: true, deferredStreak: 4, openPromises: 5 }
    });
    expect(p).toContain('stakes_progression_audit');
    expect(p).toContain('4'); // deferredStreak
    expect(p).toContain('정체');
  });

  it('payoffStatus 없으면 측정 줄을 넣지 않는다(하위호환)', () => {
    const p = buildAgentReviewPrompt({ agentId: 'showrunner', persona: '', target: 't', medium: 'novel', context: '' });
    expect(p).not.toContain('stakes_progression_audit');
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts -t "측정값"`
Expected: FAIL — `payoffStatus` 타입 없음(tsc) / 문자열 미포함

- [ ] **Step 3-a: 입력 타입 확장**

`src/lib/server/promptBuilders.ts` `AgentReviewPromptInput` 인터페이스에 추가:
```ts
  /** 아크 페이오프 1단계 — 연재 정체 측정값. 있으면 검토에 evidence 로 주입한다. */
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number };
```

- [ ] **Step 3-b: 프롬프트에 조건부 측정 줄 주입**

`buildAgentReviewPrompt`(~341)에서 `const { agentId, persona, target, medium, context } = input;` 를 `payoffStatus` 포함하도록 바꾸고, 기존 aa98137 줄(~363) 뒤에 조건부 줄을 잇는다. 배열 `.join('\n')` 구조이므로 측정 줄을 변수로 만들어 spread:
```ts
  const { agentId, persona, target, medium, context, payoffStatus } = input;
  const payoffEvidence = payoffStatus && payoffStatus.isStalled
    ? [
        `- [측정] 전제 진척 정체 신호 — 회수 없이 ${payoffStatus.deferredStreak}회차 연속(열린 약속 ${payoffStatus.openPromises}개). criteriaKey: stakes_progression_audit. 이 회차가 회수(행동·대가·전환)를 내놓는지 특히 엄격히 본다.`
      ]
    : [];
```
그리고 출력 배열에서 aa98137 줄 뒤에 `...payoffEvidence,` 를 추가한다.

- [ ] **Step 3-c: CLI 미러**

`tools/storyx.mjs` `buildAgentReviewPrompt`에 동일 로직 미러(payoffStatus 인자 + 조건부 줄). 호출부(검토 실행 ~storyx review 경로)에서 `computePayoffLedger` 결과를 넘기도록 배선 — storyx.mjs는 storyEngine/payoffLedger를 import할 수 있으면 import, 아니면 호출부에서 이미 가진 chapters로 계산해 전달. (storyx.mjs의 검토 호출 위치는 `buildAgentReviewPrompt(` 호출부를 grep해 찾는다.)

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/server/promptBuilders.ts src/lib/server/promptBuilders.test.ts tools/storyx.mjs
git commit -m "feat: 검토 프롬프트에 정체 측정 evidence + stakes_progression_audit 정식 배선 (aa98137 격상)"
```

---

## Task 7: 지표 노출 + 통합 검증 + 라이브 스모크 + 상태 문서

측정을 floating 지표 패널에 드러내고, 전체 게이트·라이브로 닫는다.

**Files:**
- Modify: `src/lib/studioMetrics.ts` (ToStudioMetricsInput ~70, toStudioMetrics ~90)
- Test: `src/lib/studioMetrics.test.ts`
- Modify: `progress.md`, `session-handoff.md`

- [ ] **Step 1: 지표 실패 테스트**

`src/lib/studioMetrics.test.ts`에 추가 — `toStudioMetrics`가 chapters를 받아 payoff 상태를 노출하는지(정확한 필드명은 studioMetrics의 기존 StudioMetrics 구조에 맞춰 `payoff` 서브 메트릭 추가):
```ts
  it('toStudioMetrics 가 정체 시 payoff.isStalled 를 노출한다', () => {
    const input = makeBaseInput(); // 기존 테스트 헬퍼 재사용
    input.chapters = [
      { /* ...minimal Chapter... */ episode: 1, stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] } as Chapter,
      { episode: 2, stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] } as Chapter,
      { episode: 3, stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] } as Chapter
    ];
    expect(toStudioMetrics(input).payoff?.isStalled).toBe(true);
  });
```
(기존 `studioMetrics.test.ts`의 입력 헬퍼/Chapter 목 패턴을 먼저 읽고 맞춘다.)

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/studioMetrics.test.ts -t "payoff"`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/lib/studioMetrics.ts`:
- `ToStudioMetricsInput`에 `chapters: Chapter[]` 추가(이미 있으면 재사용).
- `StudioMetrics`에 `payoff?: PayoffLedgerReport` 추가, import `computePayoffLedger`.
- `toStudioMetrics`에서 `payoff: computePayoffLedger(input.chapters)` 채움.
- 호출부(StoryXDesk 등)에서 `toStudioMetrics`에 `chapters: project.chapters`를 넘기도록 인자 보강(grep `toStudioMetrics(` 로 호출부 확인).
- floating 지표 패널(`fc-p-metrics`)에 "전제 진척 — 열린 약속 N · 회수 없이 M회차(정체 시 빨강)" 한 줄. 측정 불가(measured:false)면 "—" 표시.

- [ ] **Step 4: 지표 테스트 통과**

Run: `npx vitest run src/lib/studioMetrics.test.ts`
Expected: PASS

- [ ] **Step 5: 전체 게이트**

Run: `bash init.sh`
Expected: tsc 0 · vitest 전부 녹색 · vite build 성공

- [ ] **Step 6: 라이브 스모크 (codex)**

dev 서버(`nohup npm run dev > /tmp/storyx-dev.log 2>&1 < /dev/null & disown`) + Playwright로:
1. 연재 작품에서 1회차 생성 → 산출 payload에 `rewardArc`/`stakesLedger`가 채워지는지 확인(codex 산출률).
2. 회수 없는 회차를 3회 연속 생성 → 지표 패널 "전제 진척"이 정체(빨강)로 뜨는지.
3. 그 상태에서 쇼러너 검토 실행 → note/issues에 정체 지적이 나오는지(before/after: payoffStatus 주입 전후 비교).
4. 콘솔 0 확인. 캡처 `docs/reviews/2026-06-07-persona-live-test/payoff-gate/`.

- [ ] **Step 7: 상태 문서 + 커밋**

`progress.md` '최근 검증' 갱신(테스트 수치는 여기서만), `session-handoff.md` 맨 위 인계 노트 추가, feature_list.json에 항목 등재(해당 시).
```bash
git add -A
git commit -m "feat: 전제 진척 지표 노출 + 아크 페이오프 1단계 통합·라이브 검증 (continuity≠payoff 처방)"
```

---

## Self-Review (작성 후 점검)

**Spec coverage** — spec §4 7 터치포인트 ↔ 태스크 대응:
1 payload 그릇=Task2 · 2 생성프롬프트=Task5 · 3 정규화=Task3·4 · 4 commit매핑=Task2 · 5 payoffLedger=Task1 · 6 검토evidence=Task6 · 7 지표=Task7. ✅ 전부 커버.

**Placeholder scan** — Task7 Step1·Step3의 Chapter 목/floating UI는 "기존 헬퍼·패턴을 읽고 맞춘다"로 남김(studioMetrics.test·StoryXDesk 실제 구조 의존). 이는 구현 시 해당 파일을 읽어야 확정되는 부분이므로 의도적 — 구현자는 먼저 그 파일을 읽는다. 그 외 코드 스텝은 완전한 코드 포함.

**Type consistency** — `PayoffLedgerReport`(Task1) ↔ `payoffStatus`(Task6, 부분집합 `{isStalled,deferredStreak,openPromises}`) ↔ `StudioMetrics.payoff`(Task7, 전체) 정합. `rewardArc`/`stakesLedger` 필드명 Task2~7 전부 동일. `resolution` 화이트리스트 `lost|kept|deferred` 전 태스크 동일. ✅

**리스크** — Task6 storyx.mjs 검토 호출부 배선, Task7 studioMetrics 호출부 인자 보강은 grep으로 위치 확인 후 진행(플랜에 명시).
