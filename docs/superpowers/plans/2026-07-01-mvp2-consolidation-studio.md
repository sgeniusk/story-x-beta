# MVP-2 응결 스튜디오 (슬라이스 A-i) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MVP-1이 매 턴 표시한 ✦ 의외 전개 후보를 응결 승인 다이얼로그에서 승격/수정/넘기기로 결정해, 승격한 것만 캐논으로 굳힌다.

**Architecture:** 결정 로직·후보 도출·dedup은 순수 함수(`playRuntimeValidator.ts`)로 TDD, 카드 UI는 프레젠테이션 컴포넌트(`DeviationReview.tsx`)로 분리해 정적 렌더로 검증, DiveDesk의 approve 다이얼로그가 이들을 조립한다.

**Tech Stack:** TypeScript · Vitest · React(renderToStaticMarkup 테스트) · 기존 `diveSession`·`chapterFromDraftPayload` 재사용.

**정본 근거:** `docs/superpowers/specs/2026-07-01-mvp2-consolidation-studio-design.md` · `docs/research/2026-06-30-canon-governance.md` §7·§8.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/playRuntimeValidator.ts` | `deriveDeviationCandidates`·`dedupePromotions`·`buildPromotedFacts` + 타입 |
| `src/lib/playRuntimeValidator.test.ts` | 위 순수 함수 TDD |
| `src/components/DeviationReview.tsx` | **신규** ✦ 카드 + 🔴 배너 프레젠테이션 |
| `src/components/deviationReview.test.ts` | **신규** 정적 렌더 TDD |
| `src/components/DiveDesk.tsx` | deviations useMemo·decisions/edits state·다이얼로그 조립·approve 승격 |
| `src/styles.css` | `.dx-devreview`·`.dx-devcard`·`.dx-devbanner` CSS |

---

## Task 1: `deriveDeviationCandidates` + 타입 (순수)

응결 span의 메시지 verdict에서 ✦ 후보와 🔴/🟡 카운트를 모은다.

**Files:**
- Modify: `src/lib/playRuntimeValidator.ts`
- Test: `src/lib/playRuntimeValidator.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — `playRuntimeValidator.test.ts` 맨 아래에. import에 `deriveDeviationCandidates` 추가, `createDiveSession`·`appendMessage` 를 `./diveSession`에서 import.

```ts
import { createDiveSession, appendMessage } from './diveSession';

describe('deriveDeviationCandidates — 응결 span의 일탈 수집', () => {
  it('span의 ✦ 후보는 카드로, 🔴/🟡는 카운트로', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '무슨 일');
    s = appendMessage(s, 'character', '사실 나도 거기 있었어.', {
      conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: 'x' }],
      surpriseCandidates: [{ snippet: '사실 나도 거기 있었어.', relatedThread: '그날 밤' }],
      blocksCanonization: true
    });
    // 최근 2턴은 keep(span 밖) — 채워서 위 메시지를 span에 넣는다
    s = appendMessage(s, 'user', '정말?');
    s = appendMessage(s, 'character', '응.');
    const d = deriveDeviationCandidates(s);
    expect(d.surprises).toHaveLength(1);
    expect(d.surprises[0].snippet).toBe('사실 나도 거기 있었어.');
    expect(d.surprises[0].relatedThread).toBe('그날 밤');
    expect(d.conflictCounts.anchor).toBe(1);
    expect(d.conflictCounts.major).toBe(0);
  });

  it('verdict 없는(구버전) 메시지가 섞여도 안전', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', 'a');
    s = appendMessage(s, 'character', 'b');
    s = appendMessage(s, 'user', 'c');
    s = appendMessage(s, 'character', 'd');
    const d = deriveDeviationCandidates(s);
    expect(d.surprises).toEqual([]);
    expect(d.conflictCounts).toEqual({ anchor: 0, major: 0 });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts -t deriveDeviationCandidates`
Expected: FAIL — `deriveDeviationCandidates is not a function`.

- [ ] **Step 3: 구현** — `playRuntimeValidator.ts`.

import 교체(기존 `import { parseSceneSegments } from './diveSession';`):

```ts
import { parseSceneSegments, selectCondenseSpan, type DiveSession } from './diveSession';
```

타입 블록(기존 verdict 타입 아래)에 추가:

```ts
export interface DeviationCandidate {
  id: string;
  snippet: string;
  relatedThread?: string;
}
export interface ConsolidationDeviations {
  surprises: DeviationCandidate[];
  conflictCounts: { anchor: number; major: number };
}
```

파일 끝에 함수 추가:

```ts
// 응결 대상 span의 메시지 verdict에서 결정 대상(✦)과 충돌 카운트를 모은다.
export function deriveDeviationCandidates(session: DiveSession): ConsolidationDeviations {
  const { condense } = selectCondenseSpan(session);
  const surprises: DeviationCandidate[] = [];
  let anchor = 0;
  let major = 0;
  for (const m of condense) {
    const v = m.verdict;
    if (!v) continue;
    v.surpriseCandidates.forEach((s, i) =>
      surprises.push({ id: `${m.id}-s${i}`, snippet: s.snippet, relatedThread: s.relatedThread })
    );
    for (const c of v.conflicts) {
      if (c.band === 'anchor') anchor++;
      else if (c.band === 'major') major++;
    }
  }
  return { surprises, conflictCounts: { anchor, major } };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts -t deriveDeviationCandidates`
Expected: PASS(2/2).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/playRuntimeValidator.ts src/lib/playRuntimeValidator.test.ts
git commit -m "feat(canon): deriveDeviationCandidates — 응결 span에서 ✦ 후보·충돌 카운트 수집"
```

---

## Task 2: `dedupePromotions` (순수)

승격 스니펫이 이미 LLM이 뽑은 캐논과 겹치면 제외한다(문자열 근접).

**Files:**
- Modify: `src/lib/playRuntimeValidator.ts`
- Test: `src/lib/playRuntimeValidator.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — import에 `dedupePromotions` 추가.

```ts
describe('dedupePromotions — LLM 캐논과 중복 제거(문자열 근접)', () => {
  it('기존 statement에 포함되는 승격은 제외, 무관은 유지', () => {
    const existing = [{ statement: '주인공은 그날 밤 창고에 있었다' }];
    const out = dedupePromotions(
      ['그날 밤 창고에 있었다', '도현은 형사다'],
      existing
    );
    expect(out).toEqual(['도현은 형사다']);
  });

  it('공백 정규화로 매칭 · 자기 중복도 제거', () => {
    const out = dedupePromotions(['비밀은  하나다', '비밀은 하나다'], []);
    expect(out).toEqual(['비밀은  하나다']);
  });

  it('빈 문자열은 버린다', () => {
    expect(dedupePromotions(['   ', '실체'], [])).toEqual(['실체']);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts -t dedupePromotions`
Expected: FAIL.

- [ ] **Step 3: 구현** — `playRuntimeValidator.ts` 끝에.

```ts
// 승격 statement 중 기존 캐논/서로와 문자열 근접 중복인 것을 제거. 의미 중복은 후속 LLM 검증기.
export function dedupePromotions(
  promotedStatements: string[],
  existing: Array<{ statement: string }>
): string[] {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ');
  const existingN = existing.map((e) => norm(e.statement)).filter((s) => s.length > 0);
  const seen: string[] = [];
  const out: string[] = [];
  for (const raw of promotedStatements) {
    const n = norm(raw);
    if (!n) continue;
    const dup = [...existingN, ...seen].some((e) => e.includes(n) || n.includes(e));
    if (dup) continue;
    seen.push(n);
    out.push(raw.trim());
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts -t dedupePromotions`
Expected: PASS(3/3).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/playRuntimeValidator.ts src/lib/playRuntimeValidator.test.ts
git commit -m "feat(canon): dedupePromotions — 승격 캐논과 LLM 추출 문자열 근접 dedup"
```

---

## Task 3: `buildPromotedFacts` (순수)

결정(promote)된 ✦ 후보를 edits 반영·dedup해 `{owner,statement}[]`로 만든다.

**Files:**
- Modify: `src/lib/playRuntimeValidator.ts`
- Test: `src/lib/playRuntimeValidator.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — import에 `buildPromotedFacts` 추가.

```ts
describe('buildPromotedFacts — 승격 결정 → 캐논 팩트', () => {
  const surprises = [
    { id: 's1', snippet: '사실 나도 거기 있었어' },
    { id: 's2', snippet: '도현은 형사다' }
  ];

  it('promote된 것만, edits 우선, dedup 적용', () => {
    const out = buildPromotedFacts(
      surprises,
      { s1: 'promote', s2: 'skip' },
      { s1: '주인공은 창고에 있었다' },
      []
    );
    expect(out).toEqual([{ owner: 'plot', statement: '주인공은 창고에 있었다' }]);
  });

  it('기존 LLM 캐논과 겹치면 제외', () => {
    const out = buildPromotedFacts(
      surprises,
      { s1: 'promote' },
      {},
      [{ statement: '사실 나도 거기 있었어' }]
    );
    expect(out).toEqual([]);
  });

  it('promote 없으면 빈 배열', () => {
    expect(buildPromotedFacts(surprises, {}, {}, [])).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts -t buildPromotedFacts`
Expected: FAIL.

- [ ] **Step 3: 구현** — `playRuntimeValidator.ts` 끝에.

```ts
// 승격 결정된 ✦ 후보를 edits 반영·dedup 후 캐논 팩트(owner=plot)로. reveal/importance는 normalize 백필.
export function buildPromotedFacts(
  surprises: DeviationCandidate[],
  decisions: Record<string, 'skip' | 'promote'>,
  edits: Record<string, string>,
  existing: Array<{ statement: string }>
): Array<{ owner: 'plot'; statement: string }> {
  const chosen = surprises
    .filter((c) => decisions[c.id] === 'promote')
    .map((c) => edits[c.id] ?? c.snippet);
  return dedupePromotions(chosen, existing).map((statement) => ({ owner: 'plot' as const, statement }));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/playRuntimeValidator.test.ts`
Expected: PASS(전체 — 기존 + 신규 모두 녹색).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/playRuntimeValidator.ts src/lib/playRuntimeValidator.test.ts
git commit -m "feat(canon): buildPromotedFacts — 승격 결정을 캐논 팩트로(edits·dedup)"
```

---

## Task 4: `DeviationReview` 프레젠테이션 컴포넌트 + CSS

✦ 카드 + 🔴 배너. 순수 표현(상태는 props). 정적 렌더 테스트.

**Files:**
- Create: `src/components/DeviationReview.tsx`
- Create: `src/components/deviationReview.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: 실패 테스트 작성** — `src/components/deviationReview.test.ts` 신규.

```ts
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DeviationReview } from './DeviationReview';

describe('DeviationReview', () => {
  it('✦ 후보 카드와 🔴 충돌 배너를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        deviations: {
          surprises: [{ id: 's1', snippet: '사실 나도 거기 있었어', relatedThread: '그날 밤' }],
          conflictCounts: { anchor: 1, major: 0 }
        },
        decisions: {},
        edits: {},
        onToggle: () => {},
        onEdit: () => {}
      })
    );
    expect(html).toContain('의외 전개 후보');
    expect(html).toContain('사실 나도 거기 있었어');
    expect(html).toContain('정본 충돌 1건');
  });

  it('후보도 충돌도 없으면 아무것도 렌더 안 함', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        deviations: { surprises: [], conflictCounts: { anchor: 0, major: 0 } },
        decisions: {}, edits: {}, onToggle: () => {}, onEdit: () => {}
      })
    );
    expect(html).toBe('');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/deviationReview.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 컴포넌트 구현** — `src/components/DeviationReview.tsx` 신규.

```tsx
// 응결 스튜디오 — ✦ 의외 전개 후보 결정 카드 + 🔴 충돌 정보 배너. 순수 표현(상태는 props).
import type { ConsolidationDeviations } from '../lib/playRuntimeValidator';

interface DeviationReviewProps {
  deviations: ConsolidationDeviations;
  decisions: Record<string, 'skip' | 'promote'>;
  edits: Record<string, string>;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function DeviationReview({ deviations, decisions, edits, onToggle, onEdit }: DeviationReviewProps) {
  const { surprises, conflictCounts } = deviations;
  const conflictTotal = conflictCounts.anchor + conflictCounts.major;
  if (surprises.length === 0 && conflictTotal === 0) return null;
  return (
    <div className="dx-devreview">
      {conflictTotal > 0 && (
        <div className="dx-devbanner">🔴 이번 응결에서 정본 충돌 {conflictTotal}건은 캐논에서 빠졌습니다.</div>
      )}
      {surprises.length > 0 && (
        <div className="dx-devlist">
          <p className="dx-devlist-title">✦ 의외 전개 후보 — 굳힐 것만 승격</p>
          {surprises.map((c) => (
            <div key={c.id} className="dx-devcard">
              <input
                className="dx-devcard-input"
                value={edits[c.id] ?? c.snippet}
                onChange={(e) => onEdit(c.id, e.target.value)}
              />
              {c.relatedThread && <span className="dx-devcard-thread">떡밥 — {c.relatedThread}</span>}
              <button
                className={`dx-devcard-toggle${decisions[c.id] === 'promote' ? ' is-on' : ''}`}
                onClick={() => onToggle(c.id)}
              >
                {decisions[c.id] === 'promote' ? '승격됨' : '승격'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/deviationReview.test.ts`
Expected: PASS(2/2).

- [ ] **Step 5: CSS 추가** — `src/styles.css`의 `.dx-approve` 규칙 근처에 추가(없으면 파일 끝).

```css
/* MVP-2 응결 스튜디오 — ✦ 후보 결정 카드 + 🔴 충돌 배너 */
.dx-devreview { margin: 8px 0; display: flex; flex-direction: column; gap: 8px; }
.dx-devbanner { font-size: 12px; color: #fca5a5; background: rgba(248,113,113,0.08); border-radius: 8px; padding: 7px 12px; }
.dx-devlist { display: flex; flex-direction: column; gap: 6px; }
.dx-devlist-title { font-size: 12px; color: #bef264; margin: 0 0 2px; }
.dx-devcard { display: flex; gap: 8px; align-items: center; }
.dx-devcard-input { flex: 1; background: #0e0f12; color: #e8e8ee; border: 1px solid #24262c; border-radius: 6px; padding: 6px 8px; font-size: 13px; }
.dx-devcard-thread { font-size: 11px; color: #8a8f98; }
.dx-devcard-toggle { background: transparent; color: #a8b0ba; border: 1px solid #3a3d45; border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
.dx-devcard-toggle.is-on { background: rgba(163,230,53,0.15); color: #bef264; border-color: rgba(163,230,53,0.5); }
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/DeviationReview.tsx src/components/deviationReview.test.ts src/styles.css
git commit -m "feat(dive): DeviationReview — ✦ 후보 결정 카드·🔴 충돌 배너(순수 표현)"
```

---

## Task 5: DiveDesk 조립 — deviations·결정 state·승격 커밋

approve 다이얼로그에 DeviationReview를 끼우고 승격을 커밋에 반영한다.

**Files:**
- Modify: `src/components/DiveDesk.tsx`

- [ ] **Step 1: import 추가** — validator·컴포넌트.

```ts
import { validatePlayTurn, deriveDeviationCandidates, buildPromotedFacts, type PlayTurnVerdict } from '../lib/playRuntimeValidator';
import { DeviationReview } from './DeviationReview';
```

(기존 `import { validatePlayTurn, type PlayTurnVerdict } from '../lib/playRuntimeValidator';` 줄을 위로 교체.)

- [ ] **Step 2: state + deviations useMemo 추가** — `turnCounts` useMemo 아래에.

```ts
  const [decisions, setDecisions] = useState<Record<string, 'skip' | 'promote'>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const deviations = useMemo(() => deriveDeviationCandidates(session), [session]);
```

- [ ] **Step 3: approve() 승격 반영** — 기존 approve() 의 `newCanonFacts: pending.newCanonFacts` 를 교체하고, 끝에 결정 state 초기화.

기존 `chapterFromDraftPayload(...)` 호출 직전에 승격 계산 추가:

```ts
    const promoted = buildPromotedFacts(deviations.surprises, decisions, edits, pending.newCanonFacts);
```

`newCanonFacts: pending.newCanonFacts` 를 교체:

```ts
        newCanonFacts: [...pending.newCanonFacts, ...promoted]
```

`setPending(null);` 아래에 추가:

```ts
    setDecisions({});
    setEdits({});
```

- [ ] **Step 4: 다이얼로그에 DeviationReview 삽입 + 거절 시 초기화** — 기존 pending 블록을 교체.

```tsx
      {pending && (
        <div className="dx-approve" role="dialog">
          <h4>응결된 회차 — {pending.title}</h4>
          <p className="dx-approve-prose">{pending.prose}</p>
          <DeviationReview
            deviations={deviations}
            decisions={decisions}
            edits={edits}
            onToggle={(id) =>
              setDecisions((d) => ({ ...d, [id]: d[id] === 'promote' ? 'skip' : 'promote' }))
            }
            onEdit={(id, text) => setEdits((e) => ({ ...e, [id]: text }))}
          />
          <ul className="dx-approve-canon">
            {pending.newCanonFacts.map((f, i) => <li key={i}>+ {f.statement}</li>)}
          </ul>
          <div className="dx-approve-actions">
            <button onClick={approve}>승인 — 캐논으로 고정</button>
            <button onClick={() => { setPending(null); setDecisions({}); setEdits({}); }}>거절</button>
          </div>
        </div>
      )}
```

- [ ] **Step 5: tsc + 기존 테스트 확인**

Run: `npx tsc --noEmit && npx vitest run src/components/diveDesk.test.ts`
Expected: tsc 0 · diveDesk 기존 테스트 녹색(회귀 없음).

- [ ] **Step 6: 커밋**

```bash
git add src/components/DiveDesk.tsx
git commit -m "feat(dive): 응결 스튜디오 조립 — DeviationReview 다이얼로그 배선·승격 커밋"
```

---

## Task 6: 전체 게이트 + 상태 문서 갱신

**Files:**
- Modify: `progress.md`, `session-handoff.md`

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전체 녹색.

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 3: 라이브 검증(preview)** — dev 서버 `?stage=dive`. verdict 있는 세션에서 응결 시 ✦ 카드·🔴 배너 렌더, 승격 토글→승인→캐논 뷰에 등장, 넘긴 ✦는 캐논 0, 콘솔 0. (수동 유도 어려우면 정적 렌더/단위 테스트가 로직 커버 — 최소 카드 CSS 실측.)

- [ ] **Step 4: progress.md 갱신** — "활성 트랙 — MVP-2 응결 스튜디오" 절 추가(done·커밋 SHA·검증). "최근 검증" 갱신.

- [ ] **Step 5: session-handoff.md 갱신** — 맨 위 인계(한 것·손대지 말 것·다음 한 가지). 손대지 말 것 = 기본 skip(최소 몽타주)·문자열 dedup만(의미 dedup은 후속 B)·🔴 정보 표시만(retcon 후속)·승격은 payload.newCanonFacts 경로.

- [ ] **Step 6: 커밋**

```bash
git add progress.md session-handoff.md
git commit -m "docs(canon): MVP-2 응결 스튜디오(A-i) done — ✦ 승격·🔴 배너"
```

---

## 완료 기준 (Definition of Done)

- `npm test` 전체 녹색 · `npm run build` 성공.
- 런칭 게이트 — 넘긴 ✦ 캐논 0 · 승격 ✦만 reveal=revealed(기본)로 등록 · dedup 중복 0.
- `progress.md`·`session-handoff.md` 갱신.
- **범위 밖(후속)** — 🔴 retcon · LLM 응결 검증기(B) · ArcDigest/Growth/Relation Snapshot.
