# 캐논 인라인 멘션 + AI주입 토글 (B3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문에 등장하는 캐논을 '등장 캐논' 칩 바로 보여주고, 칩 popover에서 canonFact 단위 AI주입(always-include) 토글로 digest 절단 면제를 작가가 통제한다.

**Architecture:** `canonMentions.ts` 순수 모듈이 본문 prose에서 `extractEntityName`(인물 이름)을 매칭해 등장 캐논을 이름별로 그룹화한다. `CanonFact.alwaysInclude` 플래그를 `buildProjectContextDigest` 절단 로직에서 우선 포함(면제)한다. FloatingEditor가 본문 하단 칩 바 + popover(토글)를 렌더한다. contentEditable은 읽기만, 칩 바는 별도 영역.

**Tech Stack:** TypeScript · React · Vitest · 기존 영속(saveProject)·extractEntityName(storyOntology) 재사용.

설계 정본 — `docs/superpowers/specs/2026-06-22-canon-inline-mention-design.md`.

---

### Task 1: canonMentions.ts 순수 모듈

본문에서 등장 캐논(인물 이름)을 이름별로 그룹화. `extractEntityName` 재사용, 결정론·순수.

**Files:**
- Create: `src/lib/canonMentions.ts`
- Test: `src/lib/canonMentions.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/canonMentions.test.ts`:
```ts
// 캐논 인라인 멘션(B3) — 본문 등장 캐논 탐지 순수 모듈 테스트
import { describe, it, expect } from 'vitest';
import { detectCanonMentions } from './canonMentions';
import type { CanonFact } from './storyEngine';

const fact = (id: string, statement: string, owner: CanonFact['owner'] = 'character'): CanonFact => ({
  id,
  episode: 1,
  owner,
  statement,
});

describe('detectCanonMentions', () => {
  it('본문에 등장한 인물 캐논을 이름별로 그룹화한다', () => {
    const facts = [
      fact('f1', '한지욱은 각성자다.'),
      fact('f2', '서가을은 길드원이다.'),
    ];
    const mentions = detectCanonMentions('한지욱이 탑에 들어갔다. 서가을은 따라오지 않았다.', facts);
    expect(mentions).toEqual([
      { name: '한지욱', factIds: ['f1'] },
      { name: '서가을', factIds: ['f2'] },
    ]);
  });

  it('같은 이름의 여러 fact 를 한 멘션으로 묶는다', () => {
    const facts = [
      fact('f1', '한지욱은 각성자다.'),
      fact('f2', '한지욱은 길드를 떠났다.'),
    ];
    const mentions = detectCanonMentions('한지욱이 떠났다.', facts);
    expect(mentions).toHaveLength(1);
    expect(mentions[0]).toEqual({ name: '한지욱', factIds: ['f1', 'f2'] });
  });

  it('본문에 안 나온 캐논은 제외한다', () => {
    const facts = [fact('f1', '한지욱은 각성자다.'), fact('f2', '서가을은 길드원이다.')];
    const mentions = detectCanonMentions('한지욱이 혼자 걸었다.', facts);
    expect(mentions.map((m) => m.name)).toEqual(['한지욱']);
  });

  it('인물 이름이 추출되지 않는 캐논(세계 규칙 등)은 제외한다', () => {
    const facts = [fact('f1', '탑은 매일 구조가 변한다.', 'world')];
    expect(detectCanonMentions('탑이 흔들렸다.', facts)).toEqual([]);
  });

  it('본문 등장 순서(첫 위치)대로 정렬한다', () => {
    const facts = [fact('f1', '한지욱은 각성자다.'), fact('f2', '서가을은 길드원이다.')];
    const mentions = detectCanonMentions('서가을이 먼저 도착했다. 한지욱은 늦었다.', facts);
    expect(mentions.map((m) => m.name)).toEqual(['서가을', '한지욱']);
  });

  it('빈 prose 는 멘션 0', () => {
    expect(detectCanonMentions('', [fact('f1', '한지욱은 각성자다.')])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/canonMentions.test.ts`
Expected: FAIL — `Cannot find module './canonMentions'`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/canonMentions.ts`:
```ts
// 캐논 인라인 멘션(B3) — 본문 prose 에서 등장 캐논(인물 이름)을 이름별로 그룹화하는 순수 모듈.
// extractEntityName 이 인물 이름만 추출하므로 멘션은 인물 캐논 중심이다(설계 비목표 참고).
import type { CanonFact } from './storyEngine';
import { extractEntityName } from './storyOntology';

export interface CanonMention {
  name: string;
  factIds: string[];
}

export function detectCanonMentions(prose: string, canonFacts: CanonFact[]): CanonMention[] {
  if (!prose) return [];
  const byName = new Map<string, { factIds: string[]; firstIndex: number }>();
  for (const fact of canonFacts) {
    const name = extractEntityName(fact.statement);
    if (!name) continue;
    const idx = prose.indexOf(name);
    if (idx < 0) continue;
    const entry = byName.get(name);
    if (entry) {
      entry.factIds.push(fact.id);
      entry.firstIndex = Math.min(entry.firstIndex, idx);
    } else {
      byName.set(name, { factIds: [fact.id], firstIndex: idx });
    }
  }
  return [...byName.entries()]
    .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
    .map(([name, value]) => ({ name, factIds: value.factIds }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/canonMentions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/canonMentions.ts src/lib/canonMentions.test.ts
git commit -m "feat(quality): canonMentions 순수 모듈 — 본문 등장 캐논 인물 이름 그룹화 (B3)"
```

---

### Task 2: CanonFact.alwaysInclude + normalizeProject 백필

canonFact 단위 AI주입 플래그. 구버전 호환.

**Files:**
- Modify: `src/lib/storyEngine.ts:124-131` (CanonFact interface)
- Modify: `src/lib/storage.ts:228-264` (normalizeProject — canonFacts 백필)
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/storage.test.ts` — `활동일 영속` describe 블록 뒤(또는 nextEpisodeIntent 블록 근처)에 추가:
```ts
describe('AI주입 토글 영속 (canonFact.alwaysInclude · B3)', () => {
  it('normalizeProject 가 alwaysInclude 를 보존한다', () => {
    const seed = createSeedProject();
    const withFlag = {
      ...seed,
      canonFacts: [{ id: 'c1', episode: 1, owner: 'character' as const, statement: '한지욱은 각성자다.', alwaysInclude: true }],
    };
    const normalized = normalizeProject(withFlag);
    expect(normalized.canonFacts[0].alwaysInclude).toBe(true);
  });

  it('alwaysInclude 없는 구버전 캐논은 false 로 백필', () => {
    const seed = createSeedProject();
    const legacy = {
      ...seed,
      canonFacts: [{ id: 'c1', episode: 1, owner: 'character' as const, statement: '한지욱은 각성자다.' }],
    };
    const normalized = normalizeProject(legacy);
    expect(normalized.canonFacts[0].alwaysInclude).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/storage.test.ts -t "AI주입 토글 영속"`
Expected: FAIL — alwaysInclude undefined (백필 미구현).

- [ ] **Step 3: Write minimal implementation**

`src/lib/storyEngine.ts` — CanonFact interface 의 `statement: string;` 다음에 추가:
```ts
  /** B3 — AI 컨텍스트 항상 포함(always-include). true 면 digest 절단에서 면제·우선 포함. */
  alwaysInclude?: boolean;
```

`src/lib/storage.ts` — normalizeProject 객체에 canonFacts 백필 추가(기존 `chapters:` 백필 옆, normalizedProject 객체 안):
```ts
    canonFacts: Array.isArray(project.canonFacts)
      ? project.canonFacts.map((fact) => ({
          ...fact,
          alwaysInclude: typeof fact.alwaysInclude === 'boolean' ? fact.alwaysInclude : false,
        }))
      : [],
```
> 주의 — normalizeProject 가 이미 canonFacts 를 다루는지 `grep -n "canonFacts" src/lib/storage.ts` 로 확인. 이미 있으면 그 줄에 alwaysInclude map 을 합치고, 없으면 위 블록을 normalizedProject 객체에 추가.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storage.test.ts -t "AI주입 토글 영속"`
Expected: PASS. 그리고 `npx tsc --noEmit` 통과.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storyEngine.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(quality): CanonFact.alwaysInclude + normalizeProject 백필 (B3)"
```

---

### Task 3: digest 절단 면제 (buildProjectContextDigest)

alwaysInclude=true 캐논을 head/tail 절단에서 면제하고 우선 포함.

**Files:**
- Modify: `src/lib/storyEngine.ts:1595-1608` (canonFacts 절단부)
- Test: `src/lib/storyEngine.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/storyEngine.test.ts` 에 추가(파일 내 describe 블록 또는 끝):
```ts
describe('B3 — digest always-include 절단 면제', () => {
  it('alwaysInclude 캐논은 41개 초과로 절단돼도 digest 에 포함된다', () => {
    const project = createSeedProject();
    // 50개 캐논 — 기본 LIMIT(40) 초과로 중반이 절단된다.
    const facts = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`,
      episode: 1,
      owner: 'plot' as const,
      statement: `사건 ${i} 가 일어났다.`,
    }));
    // 중반(절단 구간)에 always-include 마킹된 핵심 캐논 하나
    facts[20] = { ...facts[20], statement: '한지욱은 진짜 배신자다.', alwaysInclude: true } as typeof facts[20];
    const withFacts = { ...project, canonFacts: facts };
    const digest = buildProjectContextDigest(withFacts);
    expect(digest).toContain('한지욱은 진짜 배신자다.');
  });
});
```
> `buildProjectContextDigest`·`createSeedProject` 가 storyEngine.test 에 이미 import 돼 있는지 확인하고, 없으면 import 에 추가한다.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/storyEngine.test.ts -t "always-include 절단 면제"`
Expected: FAIL — 20번째 캐논이 head6/tail34 절단 구간(생략)에 들어가 digest 에 없음.

- [ ] **Step 3: Write minimal implementation**

`src/lib/storyEngine.ts` 의 canonFacts 절단부(현재):
```ts
    if (facts.length <= CONTEXT_CANON_LIMIT) {
      facts.forEach(printFact);
    } else {
      const tailCount = CONTEXT_CANON_LIMIT - CONTEXT_CANON_HEAD;
      facts.slice(0, CONTEXT_CANON_HEAD).forEach(printFact);
      lines.push(`- … 초반 캐논 ${facts.length - CONTEXT_CANON_LIMIT}개 생략, 최근 캐논 우선 …`);
      facts.slice(facts.length - tailCount).forEach(printFact);
    }
```
를 always-include 면제로 교체:
```ts
    if (facts.length <= CONTEXT_CANON_LIMIT) {
      facts.forEach(printFact);
    } else {
      // B3 — 작가가 'AI 항상 포함'으로 표시한 캐논은 절단 구간에 있어도 우선 포함(A-6 작가 통제).
      const pinned = facts.filter((fact) => fact.alwaysInclude);
      const rest = facts.filter((fact) => !fact.alwaysInclude);
      const restBudget = Math.max(0, CONTEXT_CANON_LIMIT - pinned.length);
      const head = Math.min(CONTEXT_CANON_HEAD, restBudget);
      const tailCount = Math.max(0, restBudget - head);
      pinned.forEach(printFact);
      if (rest.length <= restBudget) {
        rest.forEach(printFact);
      } else {
        rest.slice(0, head).forEach(printFact);
        lines.push(`- … 중반 캐논 ${rest.length - restBudget}개 생략(고정 캐논 ${pinned.length}개는 항상 포함), 최근 캐논 우선 …`);
        rest.slice(rest.length - tailCount).forEach(printFact);
      }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storyEngine.test.ts -t "always-include 절단 면제"`
Expected: PASS. 기존 storyEngine digest 테스트도 회귀 없이 통과(`npx vitest run src/lib/storyEngine.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/storyEngine.ts src/lib/storyEngine.test.ts
git commit -m "feat(quality): digest always-include 절단 면제 — A-6 작가 통제 (B3)"
```

---

### Task 4: FloatingEditor 등장 캐논 칩 바 + popover 토글

본문 하단 칩 바, 칩 클릭 시 popover(facts + AI 토글). contentEditable 무관.

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (props + 칩 바 + popover state)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: Write the failing test**

`src/components/floatingEditor.test.ts` 파일 끝(마지막 describe 뒤)에 추가:
```ts
describe('B3 — 등장 캐논 칩 바 + AI주입 토글', () => {
  const MENTIONS = [
    { name: '한지욱', facts: [{ id: 'f1', statement: '한지욱은 각성자다.', alwaysInclude: false }] },
    { name: '서가을', facts: [{ id: 'f2', statement: '서가을은 길드원이다.', alwaysInclude: true }] },
  ];

  it('등장 캐논 칩을 이름으로 렌더한다', () => {
    const { host, unmount } = mount(baseProps({ canonMentions: MENTIONS }));
    const chips = host.querySelectorAll('.ep-mention-chip');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('한지욱');
    unmount();
  });

  it('칩 클릭 시 popover 에 fact + 토글이 뜨고, 토글이 onToggleCanonInclude 를 호출한다', () => {
    const onToggleCanonInclude = vi.fn();
    const { host, click, unmount } = mount(baseProps({ canonMentions: MENTIONS, onToggleCanonInclude }));
    click(host.querySelector('.ep-mention-chip'));
    const pop = host.querySelector('.ep-mention-pop');
    expect(pop).not.toBeNull();
    expect(pop?.textContent).toContain('한지욱은 각성자다.');
    click(pop?.querySelector('.ep-mention-toggle') ?? null);
    expect(onToggleCanonInclude).toHaveBeenCalledWith('f1');
    unmount();
  });

  it('멘션 0 이면 칩 바 미렌더', () => {
    const { host, unmount } = mount(baseProps({ canonMentions: [] }));
    expect(host.querySelector('.ep-mention-bar')).toBeNull();
    unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/floatingEditor.test.ts -t "등장 캐논 칩"`
Expected: FAIL — `.ep-mention-chip` 없음.

- [ ] **Step 3: Write minimal implementation**

`src/components/FloatingEditor.tsx`:

(a) props interface 에 추가(`retention?` 옆, B2 패턴):
```ts
  /** B3 — 본문 등장 캐논 멘션. 없으면 칩 바 미렌더. */
  canonMentions?: Array<{ name: string; facts: Array<{ id: string; statement: string; alwaysInclude?: boolean }> }>;
  onToggleCanonInclude?: (factId: string) => void;
```

(b) 함수 구조분해에 `canonMentions`, `onToggleCanonInclude` 추가.

(c) popover state(컴포넌트 상단 useState 구역):
```ts
  const [openMention, setOpenMention] = useState<string | null>(null);
```

(d) 본문 시트(`.ms` contentEditable) **닫는 `</div>` 다음**, 시트 하단에 칩 바:
```tsx
{canonMentions && canonMentions.length > 0 && (
  <div className="ep-mention-bar">
    <span className="ep-mention-label">등장 캐논</span>
    {canonMentions.map((m) => (
      <span key={m.name} className="ep-mention-wrap">
        <button type="button" className="ep-mention-chip" onClick={() => setOpenMention(openMention === m.name ? null : m.name)}>
          {m.name}
          {m.facts.some((f) => f.alwaysInclude) ? ' 📌' : ''}
        </button>
        {openMention === m.name && (
          <div className="ep-mention-pop" role="dialog">
            {m.facts.map((f) => (
              <div key={f.id} className="ep-mention-fact">
                <span>{f.statement}</span>
                <button
                  type="button"
                  className={`ep-mention-toggle${f.alwaysInclude ? ' on' : ''}`}
                  onClick={() => onToggleCanonInclude?.(f.id)}
                >
                  {f.alwaysInclude ? 'AI 항상 포함 ✓' : 'AI 항상 포함'}
                </button>
              </div>
            ))}
          </div>
        )}
      </span>
    ))}
  </div>
)}
```
> `.ms` 닫는 위치는 `grep -n 'className="ms"' src/components/FloatingEditor.tsx` 로 찾아 그 블록이 닫히는 `</div>` 다음(여전히 `.sheet` 안)에 둔다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS(신규 3 + 기존 전부).

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(quality): 등장 캐논 칩 바 + popover AI주입 토글 — FloatingEditor (B3)"
```

---

### Task 5: StoryXDesk 배선 + CSS + init.sh + 라이브 검증

mentions useMemo + 토글 콜백 배선, 다크 토큰 CSS, 전체 게이트, preview 라이브.

**Files:**
- Modify: `src/StoryXDesk.tsx` (import·useMemo·콜백·floatingEditorProps)
- Modify: `src/styles.css` (`.ep-mention-*`)
- Test: `src/editorFocusLayout.test.ts`

- [ ] **Step 1: Write the failing test**

`src/editorFocusLayout.test.ts` 끝에 추가:
```ts
describe('B3 — 캐논 멘션 배선', () => {
  it('StoryXDesk 가 detectCanonMentions 로 canonMentions 를 만들고 토글을 배선한다', () => {
    expect(desk).toContain('detectCanonMentions(');
    expect(desk).toMatch(/canonMentions:/);
    expect(desk).toContain('onToggleCanonInclude');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "캐논 멘션 배선"`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`src/StoryXDesk.tsx`:

(a) import 추가:
```ts
import { detectCanonMentions } from './lib/canonMentions';
```

(b) floatingEditorProps useMemo 안, retention 옆에 canonMentions + onToggleCanonInclude 추가:
```ts
      canonMentions: detectCanonMentions(editorText, project.canonFacts).map((m) => ({
        name: m.name,
        facts: m.factIds
          .map((id) => project.canonFacts.find((f) => f.id === id))
          .filter((f): f is NonNullable<typeof f> => Boolean(f))
          .map((f) => ({ id: f.id, statement: f.statement, alwaysInclude: f.alwaysInclude })),
      })),
      onToggleCanonInclude: (factId: string) => {
        setProject((current) => {
          const next = {
            ...current,
            canonFacts: current.canonFacts.map((f) =>
              f.id === factId ? { ...f, alwaysInclude: !f.alwaysInclude } : f
            ),
          };
          saveProject(next);
          return next;
        });
      },
```
> `editorText` 가 useMemo 의존성 배열에 없으면 추가(멘션이 편집에 따라 갱신되게). useMemo 가 `[project, ...]` 면 project 변경으로 갱신되지만 editorText 는 별도 state 이므로 의존성에 `editorText` 를 넣는다.

`src/styles.css` 끝에 다크 토큰:
```css
/* B3 — 등장 캐논 칩 바 + AI주입 토글 popover. fc-app 스코프. */
.fc-app .ep-mention-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--rule-soft); }
.fc-app .ep-mention-label { font-size: 11px; color: var(--ink-faint); margin-right: 2px; }
.fc-app .ep-mention-wrap { position: relative; display: inline-block; }
.fc-app .ep-mention-chip { font-size: 12px; padding: 3px 10px; border-radius: 999px; background: var(--bg-2); border: 1px solid var(--rule-soft); color: var(--ink-dim); cursor: pointer; }
.fc-app .ep-mention-chip:hover { color: var(--ink); }
.fc-app .ep-mention-pop { position: absolute; bottom: 100%; left: 0; margin-bottom: 6px; z-index: 20; min-width: 240px; max-width: 360px; padding: 10px; border-radius: 10px; background: var(--sheet); border: 1px solid var(--rule-soft); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.fc-app .ep-mention-fact { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; border-bottom: 1px solid var(--rule-soft); font-size: 12px; color: var(--ink-dim); }
.fc-app .ep-mention-fact:last-child { border-bottom: none; }
.fc-app .ep-mention-toggle { align-self: flex-start; font-size: 11px; padding: 2px 8px; border-radius: 6px; background: transparent; border: 1px solid var(--rule-soft); color: var(--ink-faint); cursor: pointer; }
.fc-app .ep-mention-toggle.on { background: var(--accent); border-color: var(--accent); color: #10120f; }
```

- [ ] **Step 4: Run full gate**

Run: `bash init.sh`
Expected: tsc 0 · vitest 전체 PASS(신규 포함) · build 성공.

- [ ] **Step 5: 라이브 검증 (preview)**

- preview_start(이미 실행 중이면 재사용).
- `createSeedProject` + 회차 1개(prose 에 인물 이름 포함) + canonFacts(인물 캐논 여럿) 주입(/src ESM, B2 라이브 절차 동형) → `?stage=editor`.
- 확인: 본문 하단 `.ep-mention-bar` 칩 렌더(등장 인물 이름) · 칩 클릭 → `.ep-mention-pop`(statement + 토글) · 토글 클릭 → localStorage canonFacts 의 해당 fact `alwaysInclude` 반전 · 콘솔 0(fresh load).
- 스크린샷.

- [ ] **Step 6: Commit**

```bash
git add src/StoryXDesk.tsx src/styles.css src/editorFocusLayout.test.ts
git commit -m "feat(quality): 캐논 멘션 배선 + 다크 토큰 CSS + 라이브 검증 (B3)"
```

---

## 완료 후
- `progress.md` '최근 검증' 블록 + 활성 트랙 갱신.
- `feature_list.json` `B3-canon-inline-mention` status `todo`→`done` + evidence.
- `session-handoff.md` 맨 위 인계 노트(다음 한 가지 = B4).
- 머지/푸시 사용자 결정 대기(`feat/canon-inline-mention` → main).

## 손대지 말 것 (회귀 가드)
- `extractEntityName`(storyOntology) — 재사용, 무변경. 인물 이름만 추출하는 동작이 멘션 범위를 정한다.
- digest 절단 면제 — `CONTEXT_CANON_LIMIT`/`CONTEXT_CANON_HEAD` 상수 유지, always-include 만 우선 포함하는 로직 추가. 다른 절(작품 계약·헌장·contextPack) 불변.
- contentEditable 본문 — 읽기만. 칩 바는 `.ms` 밖 별도 영역.
- canonMentions optional props — 미주입 시 칩 바 미렌더(하위호환).
