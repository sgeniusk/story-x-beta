# MVP-1 PLAY 런타임 거버넌스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canon Core(MVP-0) 위에서 PLAY(DiveDesk)가 받은 답을 렌더 직전 결정론으로 검사해, 앵커 위반은 캐논화를 차단하고 소프트 일탈은 "의외 전개 후보"로 표시한다.

**Architecture:** 순수 검증기 `playRuntimeValidator.validatePlayTurn`이 캐논 fact를 importance 밴드로 버킷한 자체 미니 `ContinuityContract`를 만들어 기존 `classifyCanonChange`(대립 검출)를 재사용한다. verdict를 `DiveMessage`에 부착해 DiveDesk가 여백 거터 마커·하단 카운트로 표시하고, `blocksCanonization` 턴을 응결 transcript에서 제외한다.

**Tech Stack:** TypeScript · Vitest · React(renderToStaticMarkup 테스트) · 기존 `continuityContract`·`canonImportance`·`diveSession` 재사용.

**정본 근거:** `docs/superpowers/specs/2026-07-01-mvp1-play-runtime-governance-design.md` · `docs/research/2026-06-30-canon-governance.md` §5·§7.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/canonImportance.ts` | `factBand(fact)` 추가 — fact → 'anchor'\|'major'\|'soft' |
| `src/lib/playRuntimeValidator.ts` | **신규** 순수 검증기 — `validatePlayTurn` + 타입 |
| `src/lib/playRuntimeValidator.test.ts` | **신규** 검증기 TDD |
| `src/lib/diveSession.ts` | `DiveMessage.verdict?` · `appendMessage` verdict 인자 · `buildCondenseTranscript` |
| `src/lib/diveSession.test.ts` | verdict 부착·응결 제외 TDD |
| `src/components/DiveDesk.tsx` | 검증 호출·verdict 부착·거터 마커·하단 카운트·응결 제외 |
| `src/components/diveDesk.test.ts` | 마커·카운트·제외 렌더 TDD |
| `src/styles.css` | `.dx-` 거터 마커·앰비언트 카운트·peek CSS |

---

## Task 1: `factBand` 헬퍼 (canonImportance)

fact 하나를 importance 밴드로 분류하는 순수 헬퍼. `selectCanonForContext.scoreOf`와 동일 규칙(핀=0.9)을 공유한다.

**Files:**
- Modify: `src/lib/canonImportance.ts`
- Test: `src/lib/canonImportance.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `src/lib/canonImportance.test.ts` 맨 아래(마지막 `});` 앞, 최상위 describe 내부)에 추가. import 줄에 `factBand`를 추가한다.

```ts
  it('factBand — importance/alwaysInclude로 밴드를 분류한다', () => {
    const base = { id: 'f', episode: 1, owner: 'plot' as const, statement: 's' };
    expect(factBand({ ...base, importance: 0.9 })).toBe('anchor');
    expect(factBand({ ...base, importance: 0.6 })).toBe('major');
    expect(factBand({ ...base, importance: 0.2 })).toBe('soft');
    // importance 미설정 + alwaysInclude → 0.9 앵커(scoreOf와 동일 규칙)
    expect(factBand({ ...base, alwaysInclude: true })).toBe('anchor');
    // 아무 신호 없으면 soft
    expect(factBand(base)).toBe('soft');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts -t factBand`
Expected: FAIL — `factBand is not a function` / import 오류.

- [ ] **Step 3: 최소 구현** — `src/lib/canonImportance.ts`의 `importanceBand` 함수 바로 아래에 추가.

```ts
// fact 하나의 importance 밴드. selectCanonForContext.scoreOf 와 동일 규칙(핀 미설정 importance=0.9).
export function factBand(fact: CanonFact): ImportanceBand {
  return importanceBand(fact.importance ?? (fact.alwaysInclude ? 0.9 : 0));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts -t factBand`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/canonImportance.ts src/lib/canonImportance.test.ts
git commit -m "feat(canon): factBand 헬퍼 — fact를 importance 밴드로 분류"
```

---

## Task 2: 검증기 — 모순 검출(anchor/major) + `validatePlayTurn` 골격

`validatePlayTurn`이 캐논 fact를 밴드별로 미니 contract에 담고, 답 세그먼트마다 `classifyCanonChange`로 anchor/major 충돌을 잡는다. `blocksCanonization`은 anchor 충돌 유무.

**Files:**
- Create: `src/lib/playRuntimeValidator.ts`
- Test: `src/lib/playRuntimeValidator.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `src/lib/playRuntimeValidator.test.ts` 신규.

```ts
import { describe, expect, it } from 'vitest';
import { validatePlayTurn } from './playRuntimeValidator';
import type { CanonFact } from './storyEngine';

const fact = (over: Partial<CanonFact>): CanonFact => ({
  id: 'f', episode: 1, owner: 'plot', statement: '', ...over
});

describe('validatePlayTurn — 모순 검출', () => {
  it('앵커 fact 모순 답 → anchor conflict + blocksCanonization', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('서준은 이미 죽었어.', facts, []);
    expect(v.conflicts.some((c) => c.band === 'anchor' && c.factId === 'a1')).toBe(true);
    expect(v.blocksCanonization).toBe(true);
  });

  it('중(major) fact 모순 답 → major conflict, 차단 아님', () => {
    const facts = [fact({ id: 'm1', statement: '이레나는 준을 믿는다', importance: 0.6, participants: ['이레나', '준'] })];
    const v = validatePlayTurn('이레나는 이제 준을 의심해.', facts, []);
    expect(v.conflicts.some((c) => c.band === 'major' && c.factId === 'm1')).toBe(true);
    expect(v.blocksCanonization).toBe(false);
  });

  it('청정한 잡담 → 빈 verdict', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('오늘 날씨 참 좋네요.', facts, []);
    expect(v.conflicts).toEqual([]);
    expect(v.blocksCanonization).toBe(false);
  });

  it('오탐 가드 — 다른 엔티티 대립어는 충돌 아님', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('민아는 죽었어.', facts, []);
    expect(v.conflicts).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 최소 구현** — `src/lib/playRuntimeValidator.ts` 신규. surpriseCandidates는 Task 3에서 채우므로 지금은 빈 배열.

```ts
// PLAY(DiveDesk) 런타임 검증기 — 받은 답을 캐논 밴드별로 검사(순수). 정본 §5·§7.
import type { CanonFact } from './storyEngine';
import type { ContinuityContract } from './continuityContract';
import { classifyCanonChange } from './continuityContract';
import { parseSceneSegments } from './diveSession';
import { factBand } from './canonImportance';

export interface PlayConflict {
  factId: string;
  band: 'anchor' | 'major';
  factStatement: string;
  snippet: string;
}
export interface PlaySurpriseCandidate {
  snippet: string;
  relatedThread?: string;
}
export interface PlayTurnVerdict {
  conflicts: PlayConflict[];
  surpriseCandidates: PlaySurpriseCandidate[];
  blocksCanonization: boolean;
}

// 밴드별 fact.statement를 담은 미니 contract + statement→factId 역인덱스.
function buildBandContract(facts: CanonFact[]): { contract: ContinuityContract; owner: Map<string, string> } {
  const hardCanon: string[] = [];
  const livingState: string[] = [];
  const softSignals: string[] = [];
  const owner = new Map<string, string>();
  for (const f of facts) {
    if (!f.statement.trim()) continue;
    if (!owner.has(f.statement)) owner.set(f.statement, f.id);
    const band = factBand(f);
    if (band === 'anchor') hardCanon.push(f.statement);
    else if (band === 'major') livingState.push(f.statement);
    else softSignals.push(f.statement);
  }
  return { contract: { hardCanon, livingState, softSignals }, owner };
}

function detectConflicts(
  segments: string[],
  facts: CanonFact[]
): PlayConflict[] {
  const { contract, owner } = buildBandContract(facts);
  const conflicts: PlayConflict[] = [];
  for (const seg of segments) {
    const result = classifyCanonChange(contract, seg);
    if (result.allowed || !result.matchedSource) continue;
    if (result.layer === 'hard-canon') {
      conflicts.push({
        factId: owner.get(result.matchedSource) ?? '',
        band: 'anchor',
        factStatement: result.matchedSource,
        snippet: seg
      });
    } else if (result.layer === 'living-state') {
      conflicts.push({
        factId: owner.get(result.matchedSource) ?? '',
        band: 'major',
        factStatement: result.matchedSource,
        snippet: seg
      });
    }
  }
  return conflicts;
}

export function validatePlayTurn(
  replyText: string,
  canonFacts: CanonFact[],
  openThreads: string[]
): PlayTurnVerdict {
  const segments = parseSceneSegments(replyText).map((s) => s.text);
  const conflicts = detectConflicts(segments, canonFacts);
  return {
    conflicts,
    surpriseCandidates: [],
    blocksCanonization: conflicts.some((c) => c.band === 'anchor')
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts`
Expected: PASS(4/4). 만약 major/anchor 판정이 예상과 다르면 fixture의 대립어(살아있↔죽었·믿↔의심)와 공유 엔티티를 먼저 의심하지 말고, `classifyCanonChange` 실제 반환을 로그로 확인한 뒤 고친다(CLAUDE.md #3).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/playRuntimeValidator.ts src/lib/playRuntimeValidator.test.ts
git commit -m "feat(canon): PLAY 런타임 검증기 — 밴드별 모순 검출(anchor 차단·major 경고)"
```

---

## Task 3: 검증기 — 의외 전개 후보(보수적 휴리스틱)

reveal 마커 + 캐논 엔티티/열린 떡밥 접촉 + 충돌 아님 → surprise candidate. 미탐 선호(중립 잡담에 안 뜸).

**Files:**
- Modify: `src/lib/playRuntimeValidator.ts`
- Test: `src/lib/playRuntimeValidator.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — 기존 describe 아래에 새 describe 추가.

```ts
describe('validatePlayTurn — 의외 전개 후보', () => {
  const fact2 = (over: Partial<CanonFact>): CanonFact => ({
    id: 'f', episode: 1, owner: 'plot', statement: '', ...over
  });

  it('reveal 마커 + 열린 떡밥 접촉 → surprise candidate + relatedThread', () => {
    const v = validatePlayTurn(
      '사실 나도 그날 밤 거기 있었어.',
      [],
      ['그날 밤 창고에 누가 있었나']
    );
    expect(v.surpriseCandidates.length).toBeGreaterThan(0);
    expect(v.surpriseCandidates[0].relatedThread).toBe('그날 밤 창고에 누가 있었나');
    expect(v.conflicts).toEqual([]);
  });

  it('reveal 마커 + 캐논 엔티티 접촉(떡밥 없음) → surprise candidate', () => {
    const facts = [fact2({ id: 's1', statement: '도현은 형사다', importance: 0.2, participants: ['도현'] })];
    const v = validatePlayTurn('알고 보니 도현은 그 사건의 목격자였어.', facts, []);
    expect(v.surpriseCandidates.length).toBeGreaterThan(0);
  });

  it('미탐 선호 — 마커 없는 중립 서술은 후보 아님', () => {
    const facts = [fact2({ id: 's1', statement: '도현은 형사다', importance: 0.2, participants: ['도현'] })];
    const v = validatePlayTurn('도현이 커피를 마신다.', facts, []);
    expect(v.surpriseCandidates).toEqual([]);
  });

  it('앵커 충돌 세그먼트는 surprise candidate로 중복 표시 안 함', () => {
    const facts = [fact2({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('사실 서준은 죽었어.', facts, []);
    expect(v.conflicts.some((c) => c.band === 'anchor')).toBe(true);
    expect(v.surpriseCandidates).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts -t "의외 전개"`
Expected: FAIL — surpriseCandidates 항상 빈 배열.

- [ ] **Step 3: 구현** — `playRuntimeValidator.ts`에 마커·엔티티 헬퍼 + surprise 검출 추가하고 `validatePlayTurn`을 배선.

먼저 import에 `deriveParticipants` 추가:

```ts
import { factBand, deriveParticipants } from './canonImportance';
```

detectConflicts 함수 아래에 추가:

```ts
// 좁은 reveal/반전 마커 화이트리스트(과탐 방지 — 미탐 선호). 튜닝은 empirical.
const REVEAL_MARKERS = /사실|실은|알고\s*보니|아니었|숨겼|숨기고|비밀은|나도/;

function collectEntities(facts: CanonFact[]): Set<string> {
  const out = new Set<string>();
  for (const f of facts) {
    for (const p of f.participants ?? deriveParticipants(f.statement)) out.add(p);
  }
  return out;
}

function threadHit(seg: string, openThreads: string[]): string | undefined {
  for (const t of openThreads) {
    // 떡밥 문장의 2글자+ 토큰(한국어 명사 대부분)이 세그먼트에 등장하면 접촉으로 본다.
    // 한국어는 명사가 짧아 4글자 기준은 거의 매칭 안 됨 — 2글자로. 튜닝은 empirical.
    const tokens = t.split(/[\s,.?!·]+/).filter((w) => w.length >= 2);
    if (tokens.some((w) => seg.includes(w))) return t;
  }
  return undefined;
}

function detectSurprise(
  segments: string[],
  facts: CanonFact[],
  openThreads: string[],
  conflicts: PlayConflict[]
): PlaySurpriseCandidate[] {
  const conflictSnippets = new Set(conflicts.map((c) => c.snippet));
  const entities = collectEntities(facts);
  const out: PlaySurpriseCandidate[] = [];
  for (const seg of segments) {
    if (conflictSnippets.has(seg)) continue;
    if (!REVEAL_MARKERS.test(seg)) continue;
    const thread = threadHit(seg, openThreads);
    const touchesEntity = Array.from(entities).some((e) => seg.includes(e));
    if (!thread && !touchesEntity) continue;
    out.push({ snippet: seg, relatedThread: thread });
  }
  return out;
}
```

`validatePlayTurn`을 교체:

```ts
export function validatePlayTurn(
  replyText: string,
  canonFacts: CanonFact[],
  openThreads: string[]
): PlayTurnVerdict {
  const segments = parseSceneSegments(replyText).map((s) => s.text);
  const conflicts = detectConflicts(segments, canonFacts);
  const surpriseCandidates = detectSurprise(segments, canonFacts, openThreads, conflicts);
  return {
    conflicts,
    surpriseCandidates,
    blocksCanonization: conflicts.some((c) => c.band === 'anchor')
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts`
Expected: PASS(8/8). 첫 surprise 테스트는 세그먼트 `사실 나도 그날 밤 거기 있었어.`가 마커(`사실`/`나도`) + 떡밥 2글자 토큰 `그날` 매칭으로 relatedThread를 얻는다. 실패하면 가정 말고 실제 토큰/`classifyCanonChange` 반환을 로그로 찍어 확인한 뒤 고친다(CLAUDE.md #3).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/playRuntimeValidator.ts src/lib/playRuntimeValidator.test.ts
git commit -m "feat(canon): PLAY 검증기 의외 전개 후보 — 보수적 마커 휴리스틱(미탐 선호)"
```

---

## Task 4: 세션 — verdict 부착 + 응결 transcript 제외

`DiveMessage`에 verdict를 실어 저장하고, 응결 span에서 `blocksCanonization` 턴을 거르는 순수 헬퍼를 만든다.

**Files:**
- Modify: `src/lib/diveSession.ts`
- Test: `src/lib/diveSession.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — `src/lib/diveSession.test.ts` 최상위 describe 내부에 추가. import에 `buildCondenseTranscript` 추가, 타입 import에 `PlayTurnVerdict` 필요.

```ts
  it('appendMessage — verdict를 메시지에 부착한다', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '안녕');
    s = appendMessage(s, 'character', '사실 서준은 죽었어.', {
      conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' }],
      surpriseCandidates: [],
      blocksCanonization: true
    });
    expect(s.chatBuffer[1].verdict?.blocksCanonization).toBe(true);
  });

  it('buildCondenseTranscript — 캐논화 차단 턴을 응결에서 제외한다', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '무슨 일이야');
    s = appendMessage(s, 'character', '사실 서준은 죽었어.', {
      conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' }],
      surpriseCandidates: [], blocksCanonization: true
    });
    s = appendMessage(s, 'user', '정말?');
    s = appendMessage(s, 'character', '응, 오래된 이야기야.');
    // 최근 CONDENSE_KEEP_RECENT(2)는 keep, 앞부분이 condense 대상.
    const transcript = buildCondenseTranscript(s);
    expect(transcript).not.toContain('사실 서준은 죽었어.');
    expect(transcript).toContain('무슨 일이야');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveSession.test.ts -t verdict`
Expected: FAIL — verdict 인자/타입 없음, `buildCondenseTranscript` 없음.

- [ ] **Step 3: 구현** — `src/lib/diveSession.ts` 수정.

`DiveMessage` 인터페이스에 verdict 추가하고, 파일 상단 import 추가:

```ts
import type { PlayTurnVerdict } from './playRuntimeValidator';
```

```ts
export interface DiveMessage {
  id: string;
  role: DiveRole;
  text: string;
  turn: number;
  /** MVP-1 — PLAY 런타임 검증 결과. 캐릭터 답에만, 구버전/유저 메시지는 undefined. */
  verdict?: PlayTurnVerdict;
}
```

`appendMessage`에 verdict 옵션 인자 추가:

```ts
export function appendMessage(
  session: DiveSession,
  role: DiveRole,
  text: string,
  verdict?: PlayTurnVerdict
): DiveSession {
  const lastTurn = session.chatBuffer.length
    ? session.chatBuffer[session.chatBuffer.length - 1].turn
    : session.lastCondensedTurn;
  const turn = lastTurn + 1;
  const message: DiveMessage = { id: `msg-${turn}`, role, text, turn, verdict };
  return { ...session, chatBuffer: [...session.chatBuffer, message] };
}
```

`selectCondenseSpan` 함수 아래에 순수 헬퍼 추가:

```ts
// 응결 대상 span에서 캐논화 차단(앵커 위반) 턴을 제외한 transcript. 정본 §7 하드 차단.
export function buildCondenseTranscript(session: DiveSession): string {
  const { condense } = selectCondenseSpan(session);
  return buildTranscript(condense.filter((m) => !m.verdict?.blocksCanonization));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: PASS(전체 녹색 — 기존 테스트 포함).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSession.ts src/lib/diveSession.test.ts
git commit -m "feat(dive): DiveMessage verdict 부착 + 응결 transcript에서 앵커 위반 제외"
```

---

## Task 5: DiveDesk 배선 — 검증 호출·verdict 부착·응결 제외

답을 받으면 검증해 verdict를 붙여 저장하고, 응결은 `buildCondenseTranscript`를 쓴다.

**Files:**
- Modify: `src/components/DiveDesk.tsx`
- Test: `src/components/diveDesk.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — `src/components/diveDesk.test.ts`에 추가. verdict 있는 캐릭터 메시지가 세션에 있으면 하단 카운트가 렌더되는지로 배선을 검증(마커 CSS는 Task 6).

```ts
  it('verdict가 있는 세션이면 하단 앰비언트 카운트를 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [
        { id: 'm1', role: 'user', text: '무슨 일', turn: 1 },
        {
          id: 'm2', role: 'character', text: '사실 나도 거기 있었어.', turn: 2,
          verdict: { conflicts: [], surpriseCandidates: [{ snippet: '사실 나도 거기 있었어.' }], blocksCanonization: false }
        }
      ]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('의외 전개 후보');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/diveDesk.test.ts -t "앰비언트 카운트"`
Expected: FAIL — 카운트 UI 없음.

- [ ] **Step 3: 구현** — `DiveDesk.tsx` 수정.

import에 검증기 추가(파일 상단 import 블록):

```ts
import { validatePlayTurn, type PlayTurnVerdict } from '../lib/playRuntimeValidator';
```

diveSession import 목록 정리 — `buildCondenseTranscript`를 추가하고, 이번 변경으로 DiveDesk에서 더는 안 쓰이는 `buildTranscript`·`selectCondenseSpan`을 제거한다(`buildRecentDialogue`·`appendMessage`·`applyCondenseResult`·`shouldSuggestCondense`·`CONDENSE_KEEP_RECENT`·`parseSceneSegments`는 유지). 변경 후 import는 대략:

```ts
import {
  type DiveSession,
  CONDENSE_KEEP_RECENT,
  appendMessage,
  shouldSuggestCondense,
  buildCondenseTranscript,
  buildRecentDialogue,
  applyCondenseResult,
  parseSceneSegments
} from '../lib/diveSession';
```

`send` 함수에서 캐릭터 답을 붙일 때 검증(교체 대상 = 기존 `next = appendMessage(next, 'character', res.reply || '…');` 줄):

```ts
      const verdict = validatePlayTurn(res.reply || '', project.canonFacts, project.openThreads);
      next = appendMessage(next, 'character', res.reply || '…', verdict);
```

`condense`에서 transcript를 교체(기존 `transcript: buildTranscript(span),` 및 그 위 `const { condense: span } = selectCondenseSpan(session);` 를 아래로):

```ts
      const episode = project.chapters.length + 1;
      const payload = await requestDiveCondense({
        character: card,
        scene,
        arc: JSON.stringify(session.arc ?? {}),
        context: buildProjectContextDigest(project),
        transcript: buildCondenseTranscript(session),
        episode
      });
```

(이제 `selectCondenseSpan`·`buildTranscript` import가 condense에서 안 쓰이면 남겨두되, `span` 미사용 변수는 제거해 tsc 경고를 피한다. `selectCondenseSpan`은 여전히 import 목록에 있어도 무방하나 미사용이면 제거.)

세션 전체 verdict 합산(컴포넌트 본문, `const suggest = ...` 근처에 추가):

```ts
  const turnCounts = useMemo(() => {
    let surprise = 0, anchor = 0, major = 0;
    for (const m of session.chatBuffer) {
      const v = m.verdict;
      if (!v) continue;
      surprise += v.surpriseCandidates.length;
      anchor += v.conflicts.filter((c) => c.band === 'anchor').length;
      major += v.conflicts.filter((c) => c.band === 'major').length;
    }
    return { surprise, anchor, major };
  }, [session.chatBuffer]);
```

하단 앰비언트 카운트 렌더 — `.dx-composer` 바로 위에 추가:

```tsx
      {(turnCounts.surprise > 0 || turnCounts.anchor > 0 || turnCounts.major > 0) && (
        <button
          className="dx-ambient"
          onClick={condense}
          disabled={busy || pending !== null || session.chatBuffer.length <= CONDENSE_KEEP_RECENT}
        >
          {turnCounts.surprise > 0 && <span className="dx-amb-surprise">✦ 의외 전개 후보 {turnCounts.surprise}</span>}
          {turnCounts.major > 0 && <span className="dx-amb-major">🟡 경고 {turnCounts.major}</span>}
          {turnCounts.anchor > 0 && <span className="dx-amb-anchor">🔴 정본 충돌 {turnCounts.anchor}</span>}
          <span className="dx-amb-tail">응결 때 정리 →</span>
        </button>
      )}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/diveDesk.test.ts`
Expected: PASS(전체 녹색).

- [ ] **Step 5: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 오류 0. `span` 미사용 등 나오면 제거.

- [ ] **Step 6: 커밋**

```bash
git add src/components/DiveDesk.tsx src/components/diveDesk.test.ts
git commit -m "feat(dive): PLAY 턴 검증 배선 — verdict 부착·하단 카운트·응결 제외"
```

---

## Task 6: 거터 마커 + peek + CSS

캐릭터 턴 왼쪽 여백에 밴드 색 세로선. 탭하면 peek(어느 캐논/떡밥). 본문 무접촉.

**Files:**
- Modify: `src/components/DiveDesk.tsx`
- Modify: `src/styles.css`
- Test: `src/components/diveDesk.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

```ts
  it('앵커 충돌 턴에 red 거터 마커 클래스를 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [
        {
          id: 'm1', role: 'character', text: '사실 서준은 죽었어.', turn: 1,
          verdict: {
            conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' }],
            surpriseCandidates: [], blocksCanonization: true
          }
        }
      ]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('dx-gutter-anchor');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/diveDesk.test.ts -t "거터 마커"`
Expected: FAIL.

- [ ] **Step 3: 구현** — `DiveDesk.tsx`.

verdict → 최악 밴드 클래스 헬퍼(컴포넌트 함수 위, 파일 상단 헬퍼 근처에 추가):

```ts
// verdict의 최악 밴드(anchor > major > surprise) → 거터 클래스. 없으면 null.
function gutterClass(verdict?: PlayTurnVerdict): string | null {
  if (!verdict) return null;
  if (verdict.conflicts.some((c) => c.band === 'anchor')) return 'dx-gutter-anchor';
  if (verdict.conflicts.some((c) => c.band === 'major')) return 'dx-gutter-major';
  if (verdict.surpriseCandidates.length > 0) return 'dx-gutter-surprise';
  return null;
}

// peek 텍스트 — 어느 캐논/떡밥이 걸렸나 한 줄.
function peekText(verdict: PlayTurnVerdict): string {
  const parts: string[] = [];
  for (const c of verdict.conflicts) {
    parts.push(`${c.band === 'anchor' ? '🔴 정본 충돌' : '🟡 경고'} — ${c.factStatement}`);
  }
  for (const s of verdict.surpriseCandidates) {
    parts.push(`✦ 의외 전개 후보${s.relatedThread ? ` — ${s.relatedThread}` : ''}`);
  }
  return parts.join(' · ');
}
```

캐릭터 턴 렌더 교체 — 기존 `<div key={m.id} className="dx-turn"> ... </div>` 블록을 거터 래퍼로 감싼다. 기존 세그먼트 map은 그대로 두고 바깥만 변경:

```tsx
            (() => {
              const g = gutterClass(m.verdict);
              return (
                <div key={m.id} className={`dx-turn${g ? ` dx-has-gutter ${g}` : ''}`}
                     title={m.verdict && g ? peekText(m.verdict) : undefined}>
                  {parseSceneSegments(m.text).map((seg, i) =>
                    seg.kind === 'narration' ? (
                      <div key={i} className="dx-narration">{renderDialogue(seg.text)}</div>
                    ) : (
                      <div key={i} className="dx-bubble dx-character">
                        <span className="dx-speaker">{seg.speaker}</span>
                        {renderDialogue(seg.text)}
                      </div>
                    )
                  )}
                </div>
              );
            })()
```

(주의 — 기존 `.dx-turn` 렌더가 `session.chatBuffer.map` 삼항의 else 가지다. else 자리에 위 IIFE를 넣는다. `key`는 `.dx-turn` div에 유지.)

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/diveDesk.test.ts`
Expected: PASS(전체 녹색).

- [ ] **Step 5: CSS 추가** — `src/styles.css` 맨 아래(또는 `.dx-turn` 인접부)에 추가. 다크 토큰 유지.

```css
/* MVP-1 PLAY 런타임 거버넌스 — 여백 거터 마커(본문 무접촉) */
.dx-has-gutter { position: relative; padding-left: 12px; }
.dx-has-gutter::before {
  content: ""; position: absolute; left: 0; top: 2px; bottom: 2px;
  width: 3px; border-radius: 3px;
}
.dx-gutter-anchor::before { background: #f87171; }   /* red — 정본 충돌 */
.dx-gutter-major::before { background: #fbbf24; }    /* amber — 중 경고 */
.dx-gutter-surprise::before { background: #bef264; } /* lime — 의외 전개 후보 */

/* 하단 앰비언트 카운트 — 작성창 위 얇은 한 줄 */
.dx-ambient {
  display: flex; gap: 14px; align-items: center; width: 100%;
  background: rgba(255,255,255,0.04); border: none; border-radius: 8px;
  padding: 7px 12px; margin: 6px 0; font-size: 12px; color: #a8b0ba;
  cursor: pointer; text-align: left;
}
.dx-ambient:disabled { cursor: default; opacity: 0.6; }
.dx-amb-surprise { color: #bef264; }
.dx-amb-major { color: #fbbf24; }
.dx-amb-anchor { color: #fca5a5; }
.dx-amb-tail { margin-left: auto; color: #8a8f98; }
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/DiveDesk.tsx src/components/diveDesk.test.ts src/styles.css
git commit -m "feat(dive): PLAY 거터 마커·peek·앰비언트 카운트 CSS — 본문 무접촉 배지"
```

---

## Task 7: 전체 게이트 + 상태 문서 갱신

**Files:**
- Modify: `progress.md`
- Modify: `session-handoff.md`

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전체 녹색(신규 테스트 포함).

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: `tsc --noEmit && vite build` 성공.

- [ ] **Step 3: 라이브 검증(preview)** — dev 서버 띄워 `?stage=dive` 진입. 앵커 모순 답 유도 시 🔴 마커 + 하단 카운트, 중립 잡담엔 ✦ 미발생, 콘솔 0 확인. (수동 유도가 어려우면 localStorage로 verdict 있는 세션 주입해 마커 렌더만 확인 — 코드 경로는 단위 테스트로 이미 커버.)

- [ ] **Step 4: progress.md 갱신** — "활성 트랙 — MVP-1 PLAY 런타임 거버넌스" 절 추가(done, 커밋 SHA·검증 결과). "최근 검증" 한 줄 갱신.

- [ ] **Step 5: session-handoff.md 갱신** — 맨 위에 2026-07-01 인계 노트(한 것·손대지 말 것·다음 한 가지). 손대지 말 것 = 앵커 verdict.blocksCanonization은 캐논화만 막지 화면 안 막음 · 마커 화이트리스트 좁게(미탐 선호) · 무거운 per-item 결정은 MVP-2.

- [ ] **Step 6: 커밋**

```bash
git add progress.md session-handoff.md
git commit -m "docs(canon): MVP-1 PLAY 런타임 거버넌스 done — 검증기·거터 마커·응결 차단"
```

---

## 완료 기준 (Definition of Done)

- `npm test` 전체 녹색 · `npm run build` 성공.
- 런칭 게이트 — 앵커 모순 대사는 `blocksCanonization`으로 응결 transcript에서 제외돼 캐논 진입 0.
- 의외 후보는 미탐 선호(중립 잡담에 ✦ 안 뜸) — 단위 테스트로 못박음.
- `progress.md`·`session-handoff.md` 갱신.
- **범위 밖(MVP-2)** — per-item 승격/이번만/수정, LLM 응결 검증기, major 반전 cause/cost 게이팅.
