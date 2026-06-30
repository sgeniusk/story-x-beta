# Canon Core (MVP-0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** flat `CanonFact` 의 head/tail digest 절단(A-6 중반 캐논 소실)을 중요도 가중 + 장면 관련성 + reveal 분리 주입으로 교체해, 30화 규모에서 앵커 캐논이 절대 소실되지 않게 한다.

**Architecture:** `CanonFact` 에 `importance·participants·reveal·evidence` 를 추가(전부 optional·하위호환). 새 순수 모듈 `canonImportance.ts` 가 `importanceBand·deriveImportance·selectCanonForContext` 를 제공. `buildProjectContextDigest`(storyEngine.ts) 의 절단 블록과 `normalizeProject`(storage.ts) 의 canonFacts 백필이 이를 소비. UI·DiveDesk 무변경 — digest 한 곳을 고치면 PLAY·WRITE 두 표면이 동시에 개선.

**Tech Stack:** TypeScript · Vitest(`vitest run`) · 순수 함수 TDD.

**근거 spec:** `docs/superpowers/specs/2026-06-30-canon-core-mvp0-design.md` · 정본 `docs/research/2026-06-30-canon-governance.md`(§4 중요도·§6 검색·§14 reveal).

---

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `src/lib/canonImportance.ts` | `importanceBand·deriveImportance·deriveParticipants·selectCanonForContext` 순수 함수 + `CanonContextQuery·SelectedCanon·ImportanceBand` 타입 | **신규** |
| `src/lib/canonImportance.test.ts` | 위 순수 함수 단위 테스트 | **신규** |
| `src/lib/storyEngine.ts` | `CanonFact` 확장(+`CanonEvidence`) · `buildProjectContextDigest` 캐논 블록 교체 · `deriveActiveParticipants` 로컬 헬퍼 | 수정 |
| `src/lib/storyEngine.test.ts` | digest 통합 테스트(런칭 게이트·reveal 분리) | 수정 |
| `src/lib/storage.ts` | `normalizeProject` canonFacts 백필 확장 | 수정 |
| `src/lib/storage.test.ts` | 백필 단위 테스트 | 수정 |

**의존 방향(순환 없음):** `canonImportance.ts` → `storyOntology.ts`(value: extractCharacterNames/extractEntityName) + `storyEngine.ts`(**type-only**: CanonFact). `storyEngine.ts` → `canonImportance.ts`(value: selectCanonForContext 등). `storage.ts` → `canonImportance.ts`(value). type-only import 는 런타임 erase 라 storyEngine↔canonImportance 순환 안 생김.

---

## Task 0: 작업 브랜치

- [ ] **Step 1: main 에서 분기**

```bash
git checkout -b feat/canon-core-mvp0
```

---

## Task 1: CanonFact 타입 확장

현재 `CanonFact`(storyEngine.ts:124~133) 에 optional 필드만 추가한다. behavior 변화 없음 — 컴파일만 통과시키면 된다.

**Files:**
- Modify: `src/lib/storyEngine.ts:124-133`

- [ ] **Step 1: CanonEvidence 타입 + CanonFact 확장**

`storyEngine.ts` 의 기존 `CanonFact` 인터페이스(line 124~133)를 아래로 교체.

```ts
// 캐논의 출처(provenance) — 어느 회차/프리셋/사용자 입력에서 왔는지. 정본 §3 Evidence.
export interface CanonEvidence {
  sourceType: 'chapter' | 'preset' | 'user' | 'extracted';
  sourceId: string;
  quote?: string;
}

export interface CanonFact {
  id: string;
  episode: number;
  // M4 청크 A — Gap 5: 매체별 owner(voice/visual/audio) 까지 통일.
  // aiCliHarness · memoryBank 가 이미 6개로 받고 있어 다운캐스트 제거.
  owner: 'character' | 'world' | 'plot' | 'voice' | 'visual' | 'audio';
  statement: string;
  /** B3 — AI 컨텍스트 항상 포함(always-include). true 면 digest 절단에서 면제·우선 포함. */
  alwaysInclude?: boolean;
  /** MVP-0 — 중요도 0~1(연속값). 없으면 normalizeProject 가 도출. 정본 §4. */
  importance?: number;
  /** MVP-0 — 관계자(엔티티 이름). 없으면 normalize 가 statement 에서 도출. */
  participants?: string[];
  /** MVP-0 — 공개 축. revealed=독자 인지 / secret=쇼러너 비밀 / foreshadowed=미회수 복선. 없으면 'revealed'. 정본 §14. */
  reveal?: 'revealed' | 'secret' | 'foreshadowed';
  /** MVP-0 — 출처. 없으면 episode 로 최소 구성. */
  evidence?: CanonEvidence;
}
```

- [ ] **Step 2: 타입 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: PASS(에러 0). 새 필드는 전부 optional 이라 기존 호출부 무영향.

- [ ] **Step 3: Commit**

```bash
git add src/lib/storyEngine.ts
git commit -m "feat(canon): CanonFact 에 importance·participants·reveal·evidence optional 확장"
```

---

## Task 2: importanceBand (순수)

**Files:**
- Create: `src/lib/canonImportance.ts`
- Test: `src/lib/canonImportance.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/canonImportance.test.ts` 생성.

```ts
import { describe, it, expect } from 'vitest';
import { importanceBand } from './canonImportance';

describe('importanceBand — 중요도 0~1 → 3밴드 (정본 §4)', () => {
  it('0.82 이상은 anchor', () => {
    expect(importanceBand(0.82)).toBe('anchor');
    expect(importanceBand(1)).toBe('anchor');
  });
  it('0.45~0.82 미만은 major', () => {
    expect(importanceBand(0.45)).toBe('major');
    expect(importanceBand(0.81)).toBe('major');
  });
  it('0.45 미만은 soft', () => {
    expect(importanceBand(0.44)).toBe('soft');
    expect(importanceBand(0)).toBe('soft');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts`
Expected: FAIL — "Cannot find module './canonImportance'".

- [ ] **Step 3: 최소 구현**

`src/lib/canonImportance.ts` 생성.

```ts
// 캐논 중요도·관계자·관련성 검색 순수 함수. 정본 §4(중요도)·§6(검색)·§14(reveal).
import type { CanonFact } from './storyEngine';
import { extractCharacterNames, extractEntityName } from './storyOntology';

export type ImportanceBand = 'anchor' | 'major' | 'soft';

const ANCHOR_MIN = 0.82;
const MAJOR_MIN = 0.45;

export function importanceBand(importance: number): ImportanceBand {
  if (importance >= ANCHOR_MIN) return 'anchor';
  if (importance >= MAJOR_MIN) return 'major';
  return 'soft';
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/canonImportance.ts src/lib/canonImportance.test.ts
git commit -m "feat(canon): importanceBand 순수 함수 + 테스트"
```

---

## Task 3: deriveParticipants + deriveImportance (순수)

작가 핀 우선, AI는 제안만(정본 §13). 핀(`alwaysInclude`)이면 0.9, 그 외는 관계자 중심성·재등장·열린떡밥 관련의 가중합(앵커 자동 도달 없음 — 보수적).

**Files:**
- Modify: `src/lib/canonImportance.ts`
- Test: `src/lib/canonImportance.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`canonImportance.test.ts` 에 append.

```ts
import { deriveImportance, deriveParticipants } from './canonImportance';
import type { CanonFact } from './storyEngine';

const fact = (over: Partial<CanonFact>): CanonFact => ({
  id: over.id ?? 'f', episode: over.episode ?? 1, owner: over.owner ?? 'plot',
  statement: over.statement ?? '', ...over,
});

describe('deriveParticipants — statement 에서 관계자 추출', () => {
  it('인물 이름을 뽑는다', () => {
    expect(deriveParticipants('정우는 보건지소 문을 열었다')).toContain('정우');
  });
  it('관계자 없으면 빈 배열', () => {
    expect(deriveParticipants('비가 내렸다')).toEqual([]);
  });
});

describe('deriveImportance — 작가 핀 우선, AI 제안 (정본 §4·§13)', () => {
  it('alwaysInclude 핀은 항상 0.9(앵커)', () => {
    const f = fact({ alwaysInclude: true, participants: [] });
    expect(deriveImportance(f, [f], [])).toBe(0.9);
  });
  it('관계자 많고 재등장·떡밥 연결된 캐논 > 고립 캐논', () => {
    const hub = fact({ id: 'a', participants: ['정우', '도아', '손님'] });
    const echo = fact({ id: 'b', participants: ['정우'] });
    const lonely = fact({ id: 'c', participants: [] });
    const all = [hub, echo, lonely];
    const threads = ['정우는 손님의 정체를 알 수 있을까'];
    expect(deriveImportance(hub, all, threads)).toBeGreaterThan(
      deriveImportance(lonely, all, threads)
    );
  });
  it('핀 없는 캐논은 앵커(≥0.82)에 자동 도달하지 않는다(보수적)', () => {
    const hub = fact({ id: 'a', participants: ['정우', '도아', '손님'] });
    const echo = fact({ id: 'b', participants: ['정우'] });
    expect(deriveImportance(hub, [hub, echo], ['정우 떡밥'])).toBeLessThan(0.82);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts`
Expected: FAIL — "deriveImportance is not a function".

- [ ] **Step 3: 구현 추가**

`canonImportance.ts` 에 append.

```ts
export function deriveParticipants(statement: string): string[] {
  const names = new Set<string>(extractCharacterNames(statement));
  const entity = extractEntityName(statement);
  if (entity) names.add(entity);
  return Array.from(names);
}

// 핀 우선. 그 외 = 0.25·중심성 + 0.20·재등장 + 0.20·떡밥관련 (max 0.65 → 앵커 자동 도달 없음).
export function deriveImportance(
  fact: CanonFact,
  allFacts: CanonFact[],
  openThreads: string[]
): number {
  if (fact.alwaysInclude) return 0.9;
  const participants = fact.participants ?? [];
  if (participants.length === 0) return 0.1; // 고립 = soft 바닥
  const recurrence = allFacts.filter(
    (f) => f.id !== fact.id && (f.participants ?? []).some((p) => participants.includes(p))
  ).length;
  const threadHit = openThreads.some((t) => participants.some((p) => t.includes(p)));
  const centrality = Math.min(1, participants.length / 3);
  const recurrenceNorm = Math.min(1, recurrence / 5);
  const score = 0.25 * centrality + 0.2 * recurrenceNorm + 0.2 * (threadHit ? 1 : 0);
  return Math.max(0, Math.min(1, score));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts`
Expected: PASS(전체).

- [ ] **Step 5: Commit**

```bash
git add src/lib/canonImportance.ts src/lib/canonImportance.test.ts
git commit -m "feat(canon): deriveParticipants·deriveImportance(핀 우선·보수적) + 테스트"
```

---

## Task 4: selectCanonForContext (순수 · 런칭 게이트 핵심)

앵커는 예산 초과해도 절대 절단 안 됨. 비앵커는 관련 우선·중요도순으로 예산 내 선택.

**Files:**
- Modify: `src/lib/canonImportance.ts`
- Test: `src/lib/canonImportance.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`canonImportance.test.ts` 에 append.

```ts
import { selectCanonForContext } from './canonImportance';

describe('selectCanonForContext — 앵커 절단 금지 + 관련성 (정본 §6 · 런칭 게이트)', () => {
  const anchor = (id: string, parts: string[]): CanonFact =>
    fact({ id, importance: 0.9, participants: parts });
  const soft = (id: string, parts: string[]): CanonFact =>
    fact({ id, importance: 0.1, participants: parts });

  it('예산보다 앵커가 많아도 앵커는 전부 포함', () => {
    const facts = [anchor('a1', ['정우']), anchor('a2', ['도아']), anchor('a3', ['손님'])];
    const r = selectCanonForContext(facts, { participants: [], openThreads: [] }, 1);
    expect(r.selected.map((f) => f.id).sort()).toEqual(['a1', 'a2', 'a3']);
    expect(r.anchorCount).toBe(3);
  });

  it('예산 초과 시 관련 soft 우선·무관 soft 절단(앵커 보존)', () => {
    const facts = [
      anchor('a1', ['정우']),
      soft('rel', ['화선']),       // query 관련
      soft('irrel', ['엑스트라']), // 무관
    ];
    const r = selectCanonForContext(
      facts,
      { participants: ['화선'], openThreads: [] },
      2 // 앵커 1 + 1자리
    );
    const ids = r.selected.map((f) => f.id);
    expect(ids).toContain('a1');   // 앵커 보존
    expect(ids).toContain('rel');  // 관련 우선
    expect(ids).not.toContain('irrel');
    expect(r.omittedCount).toBe(1);
  });

  it('65캐논·앵커5에서 앵커 statement 전부 살아남음(A-6 회귀)', () => {
    const anchors = Array.from({ length: 5 }, (_, i) => anchor(`anc${i}`, [`핵심${i}`]));
    const fillers = Array.from({ length: 60 }, (_, i) => soft(`fil${i}`, [`단역${i}`]));
    const r = selectCanonForContext(
      [...anchors, ...fillers],
      { participants: [], openThreads: [] },
      40
    );
    const ids = r.selected.map((f) => f.id);
    anchors.forEach((a) => expect(ids).toContain(a.id));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts`
Expected: FAIL — "selectCanonForContext is not a function".

- [ ] **Step 3: 구현 추가**

`canonImportance.ts` 에 append.

```ts
export interface CanonContextQuery {
  participants: string[];
  openThreads: string[];
}

export interface SelectedCanon {
  selected: CanonFact[];
  omittedCount: number;
  anchorCount: number;
}

function isRelevant(fact: CanonFact, query: CanonContextQuery): boolean {
  const p = fact.participants ?? [];
  if (p.some((x) => query.participants.includes(x))) return true;
  return query.openThreads.some((t) => p.some((x) => t.includes(x)));
}

export function selectCanonForContext(
  facts: CanonFact[],
  query: CanonContextQuery,
  budget: number
): SelectedCanon {
  const scoreOf = (f: CanonFact) => f.importance ?? 0;
  const anchors = facts.filter((f) => importanceBand(scoreOf(f)) === 'anchor');
  const nonAnchors = facts.filter((f) => importanceBand(scoreOf(f)) !== 'anchor');
  const ranked = [...nonAnchors].sort((a, b) => {
    const ra = isRelevant(a, query) ? 1 : 0;
    const rb = isRelevant(b, query) ? 1 : 0;
    if (ra !== rb) return rb - ra;
    return scoreOf(b) - scoreOf(a);
  });
  const restBudget = Math.max(0, budget - anchors.length);
  const kept = ranked.slice(0, restBudget);
  const selected = [...anchors, ...kept];
  return { selected, omittedCount: facts.length - selected.length, anchorCount: anchors.length };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/canonImportance.test.ts`
Expected: PASS(전체).

- [ ] **Step 5: Commit**

```bash
git add src/lib/canonImportance.ts src/lib/canonImportance.test.ts
git commit -m "feat(canon): selectCanonForContext — 앵커 절단 금지·관련성 검색 + 테스트"
```

---

## Task 5: buildProjectContextDigest 교체 (digest 통합)

head/tail slice 를 `selectCanonForContext` + reveal 분리 주입으로 교체.

**Files:**
- Modify: `src/lib/storyEngine.ts` (import 추가 · 캐논 블록 1597~1620 교체 · `deriveActiveParticipants` 헬퍼)
- Test: `src/lib/storyEngine.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`storyEngine.test.ts` 에 append(상단에 `buildProjectContextDigest` 는 이미 import 됨, line 8).

```ts
import { importanceBand } from './canonImportance';

describe('buildProjectContextDigest — 중요도 검색·reveal 분리 (MVP-0)', () => {
  const baseProject = () => ({
    ...makeProjectForDigest(), // 아래 헬퍼
  });

  it('65캐논 중 앵커 statement 가 digest 에 전부 살아남음(A-6 회귀)', () => {
    const anchors = Array.from({ length: 5 }, (_, i) => ({
      id: `anc${i}`, episode: 1, owner: 'plot' as const,
      statement: `핵심사건${i}`, importance: 0.9, participants: [`핵심${i}`], reveal: 'revealed' as const,
    }));
    const fillers = Array.from({ length: 60 }, (_, i) => ({
      id: `fil${i}`, episode: 2, owner: 'plot' as const,
      statement: `단역사건${i}`, importance: 0.1, participants: [`단역${i}`], reveal: 'revealed' as const,
    }));
    const project = { ...baseProject(), canonFacts: [...anchors, ...fillers] };
    const digest = buildProjectContextDigest(project);
    anchors.forEach((a) => expect(digest).toContain(a.statement));
  });

  it('secret/foreshadowed 는 별도 "숨은 캐논" 절로 분리', () => {
    const project = {
      ...baseProject(),
      canonFacts: [
        { id: 'r', episode: 1, owner: 'plot' as const, statement: '공개사실', importance: 0.9, participants: ['정우'], reveal: 'revealed' as const },
        { id: 's', episode: 1, owner: 'plot' as const, statement: '숨긴진실', importance: 0.9, participants: ['손님'], reveal: 'secret' as const },
      ],
    };
    const digest = buildProjectContextDigest(project);
    expect(digest).toContain('확정 캐논');
    expect(digest).toContain('공개사실');
    expect(digest).toContain('숨은 캐논 (모순 금지 · 아직 누설 금지)');
    expect(digest).toContain('숨긴진실');
  });
});
```

상단(파일 내 describe 밖)에 헬퍼 추가 — 기존 테스트의 프로젝트 생성 패턴을 따르되 캐논만 비운 최소 SeriesProject. 기존 `storyEngine.test.ts` 의 다른 프로젝트 빌더(예: line 640 부근 `canonFacts:` 를 쓰는 객체)를 복사해 `makeProjectForDigest()` 로 만든다. 빈 `canonFacts: []`, `openThreads: []`, `characters: []`, `chapters: []`, `worldRules: []` 포함 — buildProjectContextDigest 가 참조하는 필드 전부.

> **구현자 메모:** `makeProjectForDigest` 는 기존 테스트가 buildProjectContextDigest 에 넘기는 프로젝트 객체(예: `storyEngine.test.ts:1400` 의 `withFacts`)를 참고해 동일 형태로 만든다. 새 타입 만들지 말고 기존 SeriesProject literal 을 재사용.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/storyEngine.test.ts -t "중요도 검색"`
Expected: FAIL — secret 가 "숨은 캐논" 절로 안 나옴(현재 전부 "확정 캐논"), 또는 65캐논서 앵커 일부 소실.

- [ ] **Step 3: import 추가**

`storyEngine.ts` 상단 import 구역에 추가.

```ts
import { selectCanonForContext, type CanonContextQuery } from './canonImportance';
```

- [ ] **Step 4: deriveActiveParticipants 헬퍼 추가**

`storyEngine.ts` 의 `buildProjectContextDigest` 정의 위(또는 같은 파일 헬퍼 구역)에 추가.

```ts
// 현재 장면 query 의 관계자 — 최근 회차 캐논 참여자 + 등장인물 이름(경량 R1).
function deriveActiveParticipants(project: SeriesProject): string[] {
  const recent = project.chapters[project.chapters.length - 1];
  const fromRecent = recent ? recent.newCanonFacts.flatMap((f) => f.participants ?? []) : [];
  const fromChars = project.characters.map((c) => c.name);
  return Array.from(new Set([...fromRecent, ...fromChars]));
}
```

- [ ] **Step 5: 캐논 블록 교체**

`storyEngine.ts:1597~1620` 의 `if (project.canonFacts.length > 0) { ... }` 블록 전체를 아래로 교체.

```ts
  if (project.canonFacts.length > 0) {
    const query: CanonContextQuery = {
      participants: deriveActiveParticipants(project),
      openThreads: project.openThreads
    };
    const { selected, omittedCount, anchorCount } = selectCanonForContext(
      project.canonFacts,
      query,
      CONTEXT_CANON_LIMIT
    );
    const printFact = (fact: CanonFact) => lines.push(`- [${fact.owner}] ${fact.statement}`);
    const revealed = selected.filter((fact) => (fact.reveal ?? 'revealed') === 'revealed');
    const hidden = selected.filter((fact) => (fact.reveal ?? 'revealed') !== 'revealed');
    if (revealed.length > 0) {
      lines.push('', '확정 캐논 (절대 위반 금지):');
      revealed.forEach(printFact);
    }
    if (hidden.length > 0) {
      lines.push('', '숨은 캐논 (모순 금지 · 아직 누설 금지):');
      hidden.forEach(printFact);
    }
    if (omittedCount > 0) {
      lines.push(`- … 중반 캐논 ${omittedCount}개 생략(앵커 ${anchorCount}개·관련 캐논은 항상 포함) …`);
    }
  }
```

> 기존 상수 `CONTEXT_CANON_HEAD`(line 1533) 가 더 이상 캐논 블록에서 안 쓰이면 그대로 둬도 무방(다른 곳 미사용 시 tsc unused 경고 없음 — const 라 OK). 제거는 선택.

- [ ] **Step 6: 통과 확인 + 회귀**

Run: `npx vitest run src/lib/storyEngine.test.ts`
Expected: PASS(신규 2 + 기존 전부). 기존 digest 테스트(Phase A-4 헌장 등)가 깨지면 "확정 캐논" 라벨·캐논 출력 형식이 보존됐는지 확인(revealed 절이 기존과 동일 라벨).

- [ ] **Step 7: Commit**

```bash
git add src/lib/storyEngine.ts src/lib/storyEngine.test.ts
git commit -m "feat(canon): digest 절단을 중요도 검색+reveal 분리로 교체(A-6 직격)"
```

---

## Task 6: normalizeProject 백필

구버전 저장본의 CanonFact 에 importance·participants·reveal·evidence 를 채운다. 무손상.

**Files:**
- Modify: `src/lib/storage.ts` (import 추가 · canonFacts 백필 2-pass)
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`storage.test.ts` 에 append(상단에 `normalizeProject` import 있는지 확인, 없으면 추가).

```ts
import { normalizeProject } from './storage';
import { importanceBand } from './canonImportance';

describe('normalizeProject — CanonFact MVP-0 백필', () => {
  const legacyProject = () => ({
    // 기존 storage.test 의 최소 SeriesProject literal 을 복사하되 canonFacts 만 구버전(신규 필드 없음)
    ...makeLegacyProject(),
    openThreads: ['정우는 손님의 정체를 알까'],
    canonFacts: [
      { id: 'f1', episode: 1, owner: 'plot', statement: '정우는 보건지소 직원이다' }, // 신규 필드 없음
      { id: 'f2', episode: 1, owner: 'character', statement: '도아는 정우의 딸이다', alwaysInclude: true },
    ],
  });

  it('reveal 없으면 revealed 로 백필', () => {
    const r = normalizeProject(legacyProject() as any);
    expect(r.canonFacts.every((f) => f.reveal === 'revealed')).toBe(true);
  });
  it('participants 를 statement 에서 도출', () => {
    const r = normalizeProject(legacyProject() as any);
    const f1 = r.canonFacts.find((f) => f.id === 'f1')!;
    expect(f1.participants).toContain('정우');
  });
  it('alwaysInclude 핀은 importance 앵커(0.9)로', () => {
    const r = normalizeProject(legacyProject() as any);
    const f2 = r.canonFacts.find((f) => f.id === 'f2')!;
    expect(importanceBand(f2.importance!)).toBe('anchor');
  });
  it('evidence 없으면 chapter 출처로 백필', () => {
    const r = normalizeProject(legacyProject() as any);
    expect(r.canonFacts[0].evidence?.sourceType).toBe('chapter');
  });
  it('기존 importance 가 있으면 보존', () => {
    const p = legacyProject() as any;
    p.canonFacts[0].importance = 0.5;
    const r = normalizeProject(p);
    expect(r.canonFacts.find((f: any) => f.id === 'f1')!.importance).toBe(0.5);
  });
});
```

> **구현자 메모:** `makeLegacyProject()` 는 기존 `storage.test.ts` 가 이미 쓰는 SeriesProject 빌더/픽스처를 재사용한다. 없으면 다른 테스트의 normalizeProject 입력 literal 을 복사. 새 타입 만들지 말 것.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/storage.test.ts -t "MVP-0 백필"`
Expected: FAIL — participants/reveal/importance undefined.

- [ ] **Step 3: import 추가**

`storage.ts` 상단에 추가.

```ts
import { deriveImportance, deriveParticipants } from './canonImportance';
```

- [ ] **Step 4: canonFacts 백필 2-pass 로 교체**

`storage.ts:234` 의 `const normalizedProject = {` literal **직전**에 canonFacts 계산을 추가하고, literal 안의 `canonFacts: Array.isArray(...) ? ... : []`(line 242~247)를 `canonFacts,` 로 교체.

literal 직전에 추가:

```ts
  const rawFacts = Array.isArray(project.canonFacts) ? project.canonFacts : [];
  const factsWithMeta = rawFacts.map((fact) => ({
    ...fact,
    alwaysInclude: typeof fact.alwaysInclude === 'boolean' ? fact.alwaysInclude : false,
    participants:
      Array.isArray(fact.participants) && fact.participants.length > 0
        ? fact.participants
        : deriveParticipants(fact.statement),
    reveal: fact.reveal ?? ('revealed' as const),
    evidence: fact.evidence ?? { sourceType: 'chapter' as const, sourceId: String(fact.episode) }
  }));
  const canonFacts = factsWithMeta.map((fact) => ({
    ...fact,
    importance:
      typeof fact.importance === 'number'
        ? fact.importance
        : deriveImportance(fact, factsWithMeta, Array.isArray(project.openThreads) ? project.openThreads : [])
  }));
```

literal 안에서 교체(line 242~247 → 한 줄):

```ts
    canonFacts,
```

- [ ] **Step 5: 통과 확인 + 회귀**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS(신규 5 + 기존 전부). 기존 normalize 테스트(alwaysInclude false 백필 등)가 보존됐는지 확인.

- [ ] **Step 6: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(canon): normalizeProject 가 CanonFact importance·participants·reveal·evidence 백필"
```

---

## Task 7: 전체 검증 + 상태 갱신

**Files:**
- Modify: `progress.md` · `session-handoff.md`

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전체 PASS(신규 ~14 포함). 깨진 게 있으면 해당 테스트의 캐논 형식 기대를 확인(revealed 라벨·출력 형식 보존).

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: `tsc --noEmit && vite build` 성공.

- [ ] **Step 3: 라이브 눈 확인(선택·권장)**

`bash init.sh` 녹색 확인 후 dev 서버에서 캐논 누적 작품의 digest(또는 생성 프롬프트)에 초반 앵커가 살아있는지 확인. preview 환경은 memory `preview-live-verify-env` 참고(포트 드리프트).

- [ ] **Step 4: progress.md '최근 검증' + 활성 트랙 갱신**

`progress.md` 에 Canon Core(MVP-0) done 항목 추가 — 커밋 SHA·신규 테스트 수·런칭 게이트(앵커 소실 0) 명시. 절대 테스트 수치는 '최근 검증' 한 곳에서만.

- [ ] **Step 5: session-handoff.md 인계**

맨 위에 새 인계 — 무엇을 했는지·손대지 말 것(앵커 절단 금지 불변식·reveal 기본 revealed·digest 한 곳 원칙)·다음 한 가지(MVP-1 PLAY 런타임 거버넌스).

- [ ] **Step 6: Commit**

```bash
git add progress.md session-handoff.md
git commit -m "docs(canon): Canon Core MVP-0 done — progress·handoff 갱신"
```

---

## Self-Review 체크 (계획 작성자 확인 완료)

- **Spec 커버리지** — §3 데이터모델→T1·T6 · §4 중요도→T2·T3 · §5 검색→T4·T5 · reveal 분리(§14 위험2)→T5·T6 · 하위호환 백필→T6 · 런칭게이트→T4·T5 · 검증→T7. 누락 없음.
- **비목표 준수** — PLAY validator·배지·검사기·번역투 게이트·셸 UI 전부 제외(후속 spec).
- **타입 일관성** — `CanonFact`(importance·participants·reveal·evidence) · `CanonContextQuery{participants,openThreads}` · `SelectedCanon{selected,omittedCount,anchorCount}` · `importanceBand→ImportanceBand` 전 태스크 동일.
- **플레이스홀더 없음** — 모든 코드/명령/기대 출력 구체. 단 `makeProjectForDigest`·`makeLegacyProject` 는 "기존 테스트 픽스처 재사용" 으로 명시(새 타입 금지 메모 포함).
