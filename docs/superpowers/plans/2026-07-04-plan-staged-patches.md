# PLAN staged — 설계실 패치 모델 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PLAN(바이블) 필드 편집이 본편에 직행하던 것을 순수 패치 목록으로 모아, 통합 싱크 콘솔 `PLAN +N` 배지에서 본편 반영(충돌 시 검토)·전부 버리기로만 확정하는 staged 토대를 만든다.

**Architecture:** 순수 모듈 `planStage.ts`(패치 upsert·overlay 적용·충돌 감지) + `planStageKey` localStorage 영속. StoryXDesk 는 PLAN 표면(MemoryBankStudio·CanonCanvas·FloatingDataWorkspace)에 staged 핸들러와 overlay project 를 주입하고, App 이 반영/버리기/충돌 다이얼로그를 소유한다. WRITE 저장 경로(`saveProject` effect·prose debounce)와 wm-title-input 은 무접촉.

**Tech Stack:** React 18 + TypeScript + Vitest(renderToStaticMarkup / createRoot+act 패턴) + localStorage.

**정본 spec:** `docs/superpowers/specs/2026-07-04-plan-staged-patches-design.md` (사용자 결정 4건 포함). 브랜치 `feat/plan-staged-patches`.

**불변식(전 태스크 공통)** — WRITE 즉시 저장 유지 · App key=`syncVersion` 만 · 충돌 0=즉시 반영 · staged 편집은 `logCanonChange` 안 남김(패치 목록이 이력 대체) · `.rc-*` 다이얼로그 CSS 재사용.

---

### Task 1: planStage.ts — patchKey + upsertPlanPatch

**Files:**
- Create: `src/lib/planStage.ts`
- Create: `src/lib/planStage.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/planStage.test.ts`:

```ts
// PLAN 설계실 staged 패치 순수 로직 — upsert 교체·원복 소멸·overlay 적용·충돌 감지. spec 2026-07-04.
import { describe, expect, it } from 'vitest';
import { patchKey, upsertPlanPatch, type PlanPatch } from './planStage';

const canonPatch = (after: string, before = '서준은 살아 있다'): PlanPatch => ({
  kind: 'canon', id: 'c1', label: '캐논 1화', before, after
});

describe('patchKey', () => {
  it('kind·id·field 로 고유 key 를 만든다', () => {
    expect(patchKey(canonPatch('x'))).toBe('canon:c1');
    expect(patchKey({ kind: 'character', id: 'ch1', field: 'wound', label: '', before: '', after: 'x' })).toBe('character:ch1:wound');
    expect(patchKey({ kind: 'story-core', field: 'tone', label: '', before: '', after: 'x' })).toBe('story-core:tone');
    expect(patchKey({ kind: 'creative-weight', label: '', before: 'balanced', after: 'literary' })).toBe('creative-weight');
  });
});

describe('upsertPlanPatch', () => {
  it('새 패치를 추가한다', () => {
    const next = upsertPlanPatch([], canonPatch('서준은 절반쯤 들켰다'));
    expect(next).toHaveLength(1);
    expect(next[0].after).toBe('서준은 절반쯤 들켰다');
  });

  it('같은 key 를 다시 고치면 교체하되 최초 before 를 유지한다', () => {
    const first = upsertPlanPatch([], canonPatch('수정1'));
    const second = upsertPlanPatch(first, canonPatch('수정2', '수정1'));
    expect(second).toHaveLength(1);
    expect(second[0].after).toBe('수정2');
    expect(second[0].before).toBe('서준은 살아 있다');
  });

  it('원래 값으로 되돌리면 패치가 소멸한다', () => {
    const first = upsertPlanPatch([], canonPatch('수정1'));
    const reverted = upsertPlanPatch(first, canonPatch('서준은 살아 있다', '수정1'));
    expect(reverted).toHaveLength(0);
  });

  it('다른 key 패치는 건드리지 않는다', () => {
    const base = upsertPlanPatch([], canonPatch('수정1'));
    const next = upsertPlanPatch(base, { kind: 'world', id: 'w1', label: '규칙', before: '낡은 규칙', after: '새 규칙' });
    expect(next).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/planStage.test.ts`
Expected: FAIL — `Cannot find module './planStage'`

- [ ] **Step 3: Write minimal implementation**

`src/lib/planStage.ts`:

```ts
// PLAN 설계실 staged 패치 — 바이블 필드 수정을 본편에 적용하지 않고 모아두는 순수 모듈. spec 2026-07-04.
import type { CreativeWeight, SeriesProject } from './storyEngine';

export type PlanPatch =
  | { kind: 'character'; id: string; field: 'desire' | 'wound' | 'currentState'; label: string; before: string; after: string }
  | { kind: 'world'; id: string; label: string; before: string; after: string }
  | { kind: 'canon'; id: string; label: string; before: string; after: string }
  | { kind: 'story-core'; field: 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone'; label: string; before: string; after: string }
  | { kind: 'creative-weight'; label: string; before: CreativeWeight; after: CreativeWeight };

export function patchKey(patch: PlanPatch): string {
  switch (patch.kind) {
    case 'character':
      return `character:${patch.id}:${patch.field}`;
    case 'world':
      return `world:${patch.id}`;
    case 'canon':
      return `canon:${patch.id}`;
    case 'story-core':
      return `story-core:${patch.field}`;
    case 'creative-weight':
      return 'creative-weight';
  }
}

export function upsertPlanPatch(patches: PlanPatch[], next: PlanPatch): PlanPatch[] {
  const key = patchKey(next);
  const existing = patches.find((patch) => patchKey(patch) === key);
  const before = existing ? existing.before : next.before;
  if (next.after === before) {
    return patches.filter((patch) => patchKey(patch) !== key);
  }
  const merged = { ...next, before } as PlanPatch;
  if (existing) {
    return patches.map((patch) => (patchKey(patch) === key ? merged : patch));
  }
  return [...patches, merged];
}
```

(SeriesProject import 는 Task 2 에서 사용 — tsc `noUnusedLocals` 가 걸리면 Task 2 까지 import 를 미룬다.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/planStage.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/planStage.ts src/lib/planStage.test.ts
git commit -m "feat(plan-stage): 패치 key·upsert — 교체 시 최초 before 유지·원복 자동 소멸"
```

---

### Task 2: planStage.ts — applyPlanPatches + derivePlanConflicts + resolvePlanApply

**Files:**
- Modify: `src/lib/planStage.ts`
- Modify: `src/lib/planStage.test.ts`

- [ ] **Step 1: Write the failing tests** — `planStage.test.ts` 에 추가:

```ts
import { applyPlanPatches, derivePlanConflicts, resolvePlanApply } from './planStage';
import { createEmptyProject } from './storyEngine';
import type { CanonFact, CharacterProfile, SeriesProject, WorldRule } from './storyEngine';

function fixtureProject(): SeriesProject {
  const base = createEmptyProject({ title: '은막의 계절' });
  return {
    ...base,
    logline: '원래 로그라인',
    characters: [{ id: 'ch1', name: '은호', desire: '원래 욕망', wound: '원래 상처', currentState: '원래 상태' } as CharacterProfile],
    worldRules: [{ id: 'w1', title: '은막 규칙', rule: '원래 규칙' } as WorldRule],
    canonFacts: [{ id: 'c1', episode: 1, owner: 'plot', statement: '서준은 살아 있다' } as CanonFact]
  };
}

describe('applyPlanPatches', () => {
  it('5종 kind 를 제자리 적용하고 원본은 불변', () => {
    const project = fixtureProject();
    const next = applyPlanPatches(project, [
      { kind: 'canon', id: 'c1', label: '', before: '서준은 살아 있다', after: '서준은 절반쯤 들켰다' },
      { kind: 'character', id: 'ch1', field: 'wound', label: '', before: '원래 상처', after: '새 상처' },
      { kind: 'world', id: 'w1', label: '', before: '원래 규칙', after: '새 규칙' },
      { kind: 'story-core', field: 'logline', label: '', before: '원래 로그라인', after: '새 로그라인' },
      { kind: 'creative-weight', label: '', before: 'balanced', after: 'literary' }
    ]);
    expect(next.canonFacts[0].statement).toBe('서준은 절반쯤 들켰다');
    expect(next.characters[0].wound).toBe('새 상처');
    expect(next.worldRules[0].rule).toBe('새 규칙');
    expect(next.logline).toBe('새 로그라인');
    expect(next.creativeWeight).toBe('literary');
    expect(project.canonFacts[0].statement).toBe('서준은 살아 있다');
  });

  it('대상 id 가 소멸했으면 그 패치는 조용히 건너뛴다', () => {
    const project = fixtureProject();
    const next = applyPlanPatches(project, [
      { kind: 'canon', id: 'ghost', label: '', before: 'x', after: 'y' }
    ]);
    expect(next.canonFacts).toEqual(project.canonFacts);
  });
});

describe('derivePlanConflicts', () => {
  it('본편 값이 before 그대로면 충돌 없음', () => {
    expect(derivePlanConflicts(
      [{ kind: 'canon', id: 'c1', label: '', before: '서준은 살아 있다', after: 'x' }],
      fixtureProject()
    )).toEqual([]);
  });

  it('본편 값이 그 사이 바뀌었으면 그 패치만 충돌', () => {
    const committed = fixtureProject();
    committed.canonFacts = [{ ...committed.canonFacts[0], statement: 'PLAY 가 바꾼 정본' }];
    const conflicts = derivePlanConflicts(
      [
        { kind: 'canon', id: 'c1', label: '캐논 1화', before: '서준은 살아 있다', after: '내 설계' },
        { kind: 'world', id: 'w1', label: '', before: '원래 규칙', after: '새 규칙' }
      ],
      committed
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toEqual({ key: 'canon:c1', label: '캐논 1화', committedValue: 'PLAY 가 바꾼 정본', after: '내 설계' });
  });

  it('대상 소멸은 충돌이 아니다(적용 시 drop)', () => {
    expect(derivePlanConflicts(
      [{ kind: 'canon', id: 'ghost', label: '', before: 'x', after: 'y' }],
      fixtureProject()
    )).toEqual([]);
  });
});

describe('resolvePlanApply', () => {
  it('충돌 패치는 apply 결정만 적용하고 keep·미결정은 버린다, 비충돌은 전부 적용', () => {
    const committed = fixtureProject();
    committed.canonFacts = [{ ...committed.canonFacts[0], statement: 'PLAY 가 바꾼 정본' }];
    const patches = [
      { kind: 'canon', id: 'c1', label: '', before: '서준은 살아 있다', after: '내 설계' },
      { kind: 'world', id: 'w1', label: '', before: '원래 규칙', after: '새 규칙' }
    ] as const;
    const conflicts = derivePlanConflicts([...patches], committed);

    const kept = resolvePlanApply(committed, [...patches], conflicts, {});
    expect(kept.canonFacts[0].statement).toBe('PLAY 가 바꾼 정본');
    expect(kept.worldRules[0].rule).toBe('새 규칙');

    const applied = resolvePlanApply(committed, [...patches], conflicts, { 'canon:c1': 'apply' });
    expect(applied.canonFacts[0].statement).toBe('내 설계');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/planStage.test.ts`
Expected: FAIL — `applyPlanPatches is not a function` (또는 export 부재)

- [ ] **Step 3: Implement** — `planStage.ts` 에 추가:

```ts
function readCommittedValue(project: SeriesProject, patch: PlanPatch): string | null {
  switch (patch.kind) {
    case 'character': {
      const target = project.characters.find((item) => item.id === patch.id);
      return target ? target[patch.field] : null;
    }
    case 'world': {
      const target = project.worldRules.find((item) => item.id === patch.id);
      return target ? target.rule : null;
    }
    case 'canon': {
      const target = project.canonFacts.find((item) => item.id === patch.id);
      return target ? target.statement : null;
    }
    case 'story-core':
      return project[patch.field];
    case 'creative-weight':
      return project.creativeWeight;
  }
}

function applyOne(project: SeriesProject, patch: PlanPatch): SeriesProject {
  switch (patch.kind) {
    case 'character':
      if (!project.characters.some((item) => item.id === patch.id)) return project;
      return {
        ...project,
        characters: project.characters.map((item) =>
          item.id === patch.id ? { ...item, [patch.field]: patch.after } : item
        )
      };
    case 'world':
      if (!project.worldRules.some((item) => item.id === patch.id)) return project;
      return {
        ...project,
        worldRules: project.worldRules.map((item) => (item.id === patch.id ? { ...item, rule: patch.after } : item))
      };
    case 'canon':
      if (!project.canonFacts.some((item) => item.id === patch.id)) return project;
      return {
        ...project,
        canonFacts: project.canonFacts.map((item) =>
          item.id === patch.id ? { ...item, statement: patch.after } : item
        )
      };
    case 'story-core':
      return { ...project, [patch.field]: patch.after };
    case 'creative-weight':
      return { ...project, creativeWeight: patch.after };
  }
}

export function applyPlanPatches(project: SeriesProject, patches: PlanPatch[]): SeriesProject {
  return patches.reduce(applyOne, project);
}

export interface PlanConflict {
  key: string;
  label: string;
  committedValue: string;
  after: string;
}

export function derivePlanConflicts(patches: PlanPatch[], committed: SeriesProject): PlanConflict[] {
  const conflicts: PlanConflict[] = [];
  for (const patch of patches) {
    const current = readCommittedValue(committed, patch);
    if (current === null) continue;
    if (current !== patch.before) {
      conflicts.push({ key: patchKey(patch), label: patch.label, committedValue: current, after: String(patch.after) });
    }
  }
  return conflicts;
}

export function resolvePlanApply(
  committed: SeriesProject,
  patches: PlanPatch[],
  conflicts: PlanConflict[],
  decisions: Record<string, 'keep' | 'apply'>
): SeriesProject {
  const conflictKeys = new Set(conflicts.map((conflict) => conflict.key));
  const applicable = patches.filter((patch) => {
    const key = patchKey(patch);
    if (!conflictKeys.has(key)) return true;
    return decisions[key] === 'apply';
  });
  return applyPlanPatches(committed, applicable);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/planStage.test.ts`
Expected: PASS (전체)

- [ ] **Step 5: Commit**

```bash
git add src/lib/planStage.ts src/lib/planStage.test.ts
git commit -m "feat(plan-stage): overlay 적용·충돌 감지·keep/apply 해석 — committed 불변·소멸 대상 drop"
```

---

### Task 3: storage — planStageKey 영속

**Files:**
- Modify: `src/lib/storage.ts` (diveKey 함수군 근처, `clearDiveState` 아래)
- Modify: `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing tests** — `storage.test.ts` 에 추가 (기존 describe 형식 준수):

```ts
import { loadPlanPatches, savePlanPatches, clearPlanPatches } from './storage';
import type { PlanPatch } from './planStage';

describe('planStage 영속', () => {
  it('패치 목록을 저장·로드 왕복한다', () => {
    const patches: PlanPatch[] = [
      { kind: 'canon', id: 'c1', label: '캐논 1화', before: '옛 값', after: '새 값' }
    ];
    savePlanPatches(patches);
    expect(loadPlanPatches()).toEqual(patches);
    clearPlanPatches();
    expect(loadPlanPatches()).toEqual([]);
  });

  it('깨진 페이로드는 빈 배열로 폴백한다', () => {
    window.localStorage.setItem('serial-story-studio/plan-stage', '{broken');
    expect(loadPlanPatches()).toEqual([]);
    window.localStorage.setItem('serial-story-studio/plan-stage', JSON.stringify({ not: 'array' }));
    expect(loadPlanPatches()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL — export 부재

- [ ] **Step 3: Implement** — `storage.ts` 에 추가:

```ts
// PLAN staged — 설계실 패치 목록 영속(spec 2026-07-04). 본편(storageKey)과 분리된 수정 목록.
import type { PlanPatch } from './planStage';

const planStageKey = 'serial-story-studio/plan-stage';

export function loadPlanPatches(): PlanPatch[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(planStageKey);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as PlanPatch[]) : [];
  } catch {
    return [];
  }
}

export function savePlanPatches(patches: PlanPatch[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(planStageKey, JSON.stringify(patches));
}

export function clearPlanPatches(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(planStageKey);
}
```

(import 문은 파일 상단 기존 import 블록에 합친다.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(plan-stage): planStageKey 영속 — 왕복·깨진 페이로드 [] 폴백"
```

---

### Task 4: SyncConsole 확장 — PLAN +N 배지 + 반영/버리기 메뉴

**Files:**
- Modify: `src/components/SyncConsole.tsx`
- Modify: `src/components/syncConsole.test.ts`

- [ ] **Step 1: Write the failing tests** — `syncConsole.test.ts` 에 추가. 메뉴 상호작용은 `overflowMenu.test.ts` 의 createRoot+act 패턴 그대로:

```ts
import { vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const zeroPending = { chapters: 0, canon: 0, total: 0 };

describe('SyncConsole — PLAN staged', () => {
  it('PLAY 0·PLAN 0 이면 아무것도 렌더하지 않는다', () => {
    const html = renderToStaticMarkup(
      createElement(SyncConsole, { pending: zeroPending, onReconcile: () => {}, planPending: 0 })
    );
    expect(html).toBe('');
  });

  it('PLAN 패치만 있어도 PLAN +N 배지를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(SyncConsole, { pending: zeroPending, onReconcile: () => {}, planPending: 3 })
    );
    expect(html).toContain('PLAN +3');
    expect(html).toContain('data-action="plan-menu"');
    expect(html).not.toContain('PLAY +');
  });

  it('배지 클릭 → 반영/버리기 메뉴, 항목 클릭 시 콜백 호출·메뉴 닫힘', () => {
    const onPlanApply = vi.fn();
    const onPlanDiscard = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const clickOn = (el: Element | null) =>
      act(() => { el?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    act(() => {
      root.render(createElement(SyncConsole, {
        pending: zeroPending, onReconcile: () => {}, planPending: 2, onPlanApply, onPlanDiscard
      }));
    });
    expect(host.querySelector('.sync-plan-menu')).toBeNull();
    clickOn(host.querySelector('[data-action="plan-menu"]'));
    expect(host.querySelector('[data-action="plan-apply"]')).not.toBeNull();
    clickOn(host.querySelector('[data-action="plan-apply"]'));
    expect(onPlanApply).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.sync-plan-menu')).toBeNull();
    clickOn(host.querySelector('[data-action="plan-menu"]'));
    clickOn(host.querySelector('[data-action="plan-discard"]'));
    expect(onPlanDiscard).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    host.remove();
  });
});
```

(파일 상단 기존 import 와 겹치는 항목은 합친다.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/syncConsole.test.ts`
Expected: FAIL — planPending prop 없음 / 배지 미렌더. **기존 2개 테스트는 계속 통과해야 한다.**

- [ ] **Step 3: Implement** — `SyncConsole.tsx` 전체 교체:

```tsx
// 융합 셸 싱크 콘솔 — PLAY working 미반영 배지 + ⟳최신화, PLAN staged 패치 배지 + 반영/버리기 메뉴.
import { useState } from 'react';
import type { PendingSync } from '../lib/syncConsole';

interface SyncConsoleProps {
  pending: PendingSync;
  onReconcile: () => void;
  planPending?: number;
  onPlanApply?: () => void;
  onPlanDiscard?: () => void;
}

export function SyncConsole({ pending, onReconcile, planPending = 0, onPlanApply, onPlanDiscard }: SyncConsoleProps) {
  const [isPlanMenuOpen, setPlanMenuOpen] = useState(false);
  if (pending.total <= 0 && planPending <= 0) {
    return null;
  }
  return (
    <div className="sync-console">
      {pending.total > 0 && (
        <>
          <span className="sync-pending">
            <span className="sync-dot" />▶ PLAY +{pending.total}
          </span>
          <button className="sync-update" data-action="reconcile" onClick={onReconcile}>
            ⟳ 최신화
          </button>
        </>
      )}
      {planPending > 0 && (
        <span className="sync-plan-wrap" onKeyDown={(e) => e.key === 'Escape' && setPlanMenuOpen(false)}>
          <button className="sync-plan-badge" data-action="plan-menu" onClick={() => setPlanMenuOpen((v) => !v)}>
            ✦ PLAN +{planPending}
          </button>
          {isPlanMenuOpen && (
            <span className="sync-plan-menu" role="menu">
              <button data-action="plan-apply" onClick={() => { setPlanMenuOpen(false); onPlanApply?.(); }}>
                ⟳ 본편에 반영 ({planPending}건)
              </button>
              <button data-action="plan-discard" onClick={() => { setPlanMenuOpen(false); onPlanDiscard?.(); }}>
                ✕ 전부 버리기
              </button>
            </span>
          )}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/syncConsole.test.ts`
Expected: PASS (기존 2 + 신규 3)

- [ ] **Step 5: Commit**

```bash
git add src/components/SyncConsole.tsx src/components/syncConsole.test.ts
git commit -m "feat(plan-stage): 통합 싱크 콘솔 PLAN +N 배지 — 반영/버리기 메뉴(목업 A안)"
```

---

### Task 5: PlanApplyReview 다이얼로그 (신규 순수)

**Files:**
- Create: `src/components/PlanApplyReview.tsx`
- Create: `src/components/planApplyReview.test.ts`

- [ ] **Step 1: Write the failing tests** — `reconcileReview.test.ts` 패턴:

```ts
// PLAN 설계 반영 충돌 검토 다이얼로그 렌더 테스트. spec 2026-07-04.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlanApplyReview } from './PlanApplyReview';
import type { PlanConflict } from '../lib/planStage';

const conflicts: PlanConflict[] = [
  { key: 'canon:c1', label: '캐논 1화', committedValue: 'PLAY 가 바꾼 정본', after: '내 설계' },
  { key: 'world:w1', label: '은막 규칙', committedValue: '본편 규칙', after: '설계 규칙' }
];

describe('PlanApplyReview', () => {
  it('충돌 카드마다 지금 본편 값과 내 설계를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(PlanApplyReview, {
        conflicts, decisions: {}, onToggle: () => {}, onApprove: () => {}, onCancel: () => {}
      })
    );
    expect(html).toContain('PLAY 가 바꾼 정본');
    expect(html).toContain('내 설계');
    expect(html).toContain('캐논 1화');
    expect(html).toContain('data-action="plan-apply-approve"');
    expect(html).toContain('data-action="plan-apply-cancel"');
  });

  it('apply 결정된 카드만 is-on 강조(기본 keep)', () => {
    const html = renderToStaticMarkup(
      createElement(PlanApplyReview, {
        conflicts, decisions: { 'canon:c1': 'apply' as const }, onToggle: () => {}, onApprove: () => {}, onCancel: () => {}
      })
    );
    expect((html.match(/rc-card is-on/g) ?? []).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/planApplyReview.test.ts`
Expected: FAIL — 모듈 부재

- [ ] **Step 3: Implement** — `PlanApplyReview.tsx` (기존 `.rc-*` CSS 재사용, 신규 CSS 없음):

```tsx
// PLAN 설계 반영 충돌 검토 — 본편이 그 사이 바뀐 패치만 keep/apply 결정. 순수 표현. spec 2026-07-04.
import type { PlanConflict } from '../lib/planStage';

interface PlanApplyReviewProps {
  conflicts: PlanConflict[];
  decisions: Record<string, 'keep' | 'apply'>;
  onToggle: (key: string, decision: 'keep' | 'apply') => void;
  onApprove: () => void;
  onCancel: () => void;
}

export function PlanApplyReview({ conflicts, decisions, onToggle, onApprove, onCancel }: PlanApplyReviewProps) {
  return (
    <div className="rc-overlay" role="dialog" aria-label="설계 반영 검토">
      <div className="rc-dialog">
        <h2 className="rc-title">설계 반영 검토 — 본편이 그 사이 바뀐 항목 {conflicts.length}건</h2>
        <p className="rc-hint">기본은 본편 유지입니다. 내 설계로 덮을 항목만 선택하세요.</p>
        <div className="rc-list">
          {conflicts.map((conflict) => {
            const decision = decisions[conflict.key] ?? 'keep';
            return (
              <div key={conflict.key} className={`rc-card${decision === 'apply' ? ' is-on' : ''}`}>
                <div className="rc-label">{conflict.label}</div>
                <div className="rc-old">지금 본편 — {conflict.committedValue}</div>
                <div className="rc-new">내 설계 — {conflict.after}</div>
                <div className="rc-actions">
                  <button
                    data-action="plan-keep"
                    className={decision === 'keep' ? 'is-active' : ''}
                    onClick={() => onToggle(conflict.key, 'keep')}
                  >
                    본편 유지
                  </button>
                  <button
                    data-action="plan-overwrite"
                    className={decision === 'apply' ? 'is-active' : ''}
                    onClick={() => onToggle(conflict.key, 'apply')}
                  >
                    내 설계로
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rc-footer">
          <button data-action="plan-apply-approve" className="rc-approve" onClick={onApprove}>
            반영
          </button>
          <button data-action="plan-apply-cancel" className="rc-cancel" onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
```

주의 — 구현 전에 `src/components/ReconcileReview.tsx` 를 열어 실제 `.rc-*` 클래스 구조(rc-overlay·rc-dialog·rc-card·rc-actions·rc-footer 등)를 확인하고 **동일 클래스 이름**을 쓴다. 이름이 다르면 ReconcileReview 쪽 이름을 따른다(스타일 재사용이 목적).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/planApplyReview.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PlanApplyReview.tsx src/components/planApplyReview.test.ts
git commit -m "feat(plan-stage): 설계 반영 충돌 검토 다이얼로그 — 기본 keep·rc-* 재사용"
```

---

### Task 6: SyncFlash — "N설계" 항목

**Files:**
- Modify: `src/components/SyncFlash.tsx`
- Modify: `src/components/syncFlash.test.ts`

- [ ] **Step 1: Write the failing test** — `syncFlash.test.ts` 에 추가:

```ts
it('plan 반영량이 있으면 N설계 항목을 렌더한다', () => {
  const html = renderToStaticMarkup(
    createElement(SyncFlash, { flash: { chapters: 0, canon: 0, total: 3, plan: 3 } })
  );
  expect(html).toContain('3설계');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/syncFlash.test.ts`
Expected: FAIL — `plan` 렌더 없음 (타입 에러면 Step 3 먼저 적용 후 재확인)

- [ ] **Step 3: Implement** — `SyncFlash.tsx` 수정:

```tsx
// 융합 셸 — ⟳최신화·설계 반영 직후 본편 반영량을 잠깐 알리는 토스트. 순수 표현(사라짐 타이머는 App).
import type { PendingSync } from '../lib/syncConsole';

export interface SyncFlashPayload extends PendingSync {
  plan?: number;
}

interface SyncFlashProps {
  flash: SyncFlashPayload | null;
}

export function SyncFlash({ flash }: SyncFlashProps) {
  if (!flash || flash.total <= 0) return null;
  const parts: string[] = [];
  if (flash.chapters > 0) parts.push(`${flash.chapters}회차`);
  if (flash.canon > 0) parts.push(`${flash.canon}캐논`);
  if (flash.plan && flash.plan > 0) parts.push(`${flash.plan}설계`);
  return (
    <div className="sync-flash" role="status">
      ✓ 본편에 반영 — {parts.join(' · ')}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/syncFlash.test.ts`
Expected: PASS (기존 3 + 신규 1)

- [ ] **Step 5: Commit**

```bash
git add src/components/SyncFlash.tsx src/components/syncFlash.test.ts
git commit -m "feat(plan-stage): 반영 토스트에 N설계 항목"
```

---

### Task 7: StoryXDesk — staged 핸들러 라우팅 + overlay + staged 표시

**Files:**
- Modify: `src/StoryXDesk.tsx` (props 인터페이스 · state · staged 핸들러 5종 · isBibleMode 분기 2149~2199 부근)
- Modify: `src/components/MemoryBankStudio.tsx` (stagedKeys prop + is-plan-staged 표시)
- Modify: `src/components/CanonCanvas.tsx` (stagedKeys prop + is-plan-staged 표시)
- Test: 소스 계약은 tsc + Task 8 라이브 게이트로 검증(§테스트 계획). `grep -rn "manual-bible-edit" src/**/*.test.ts` 로 기존 단언이 있으면 3분법 교정(교체 우선).

- [ ] **Step 1: StoryXDesk imports + props + state**

import 추가:

```ts
import { applyPlanPatches, patchKey, upsertPlanPatch, type PlanPatch } from './lib/planStage';
```

storage import 줄에 `loadPlanPatches, savePlanPatches` 추가 (clear 는 App 소유).

props 인터페이스(슬라이스 C 의 `onStudioViewChange` 가 있는 곳)에 추가·구조분해:

```ts
/** PLAN staged — 패치 수 변경 보고(App 배지 카운트). */
onPlanPatchesChange?: (count: number) => void;
```

state + 영속 effect (`saveProject` effect 1272 근처에 배치):

```ts
// PLAN staged — 설계실 패치. 편집은 본편이 아니라 여기 모이고, 반영/버리기는 App(싱크 콘솔) 소유.
const [planPatches, setPlanPatches] = useState<PlanPatch[]>(() => loadPlanPatches());
useEffect(() => {
  savePlanPatches(planPatches);
  onPlanPatchesChange?.(planPatches.length);
}, [planPatches]);
const overlayProject = useMemo(() => applyPlanPatches(project, planPatches), [project, planPatches]);
const planStagedKeys = useMemo(() => new Set(planPatches.map(patchKey)), [planPatches]);
```

- [ ] **Step 2: staged 핸들러 5종 추가** (기존 updateCharacterMemory 1543 부근 아래, 기존 핸들러는 삭제하지 않음 — wm-title-input 등이 계속 사용):

```ts
// PLAN staged 핸들러 — setProject 대신 패치 upsert. before 는 본편(project) 값, logCanonChange 없음(패치가 이력).
function stageCharacterMemory(characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) {
  const character = project.characters.find((item) => item.id === characterId);
  if (!character) return;
  const labels = { desire: '욕망', wound: '상처', currentState: '현재 상태' } as const;
  setPlanPatches((prev) =>
    upsertPlanPatch(prev, {
      kind: 'character', id: characterId, field,
      label: `${character.name} · ${labels[field]}`,
      before: character[field], after: value
    })
  );
}

function stageWorldMemory(ruleId: string, value: string) {
  const rule = project.worldRules.find((item) => item.id === ruleId);
  if (!rule) return;
  setPlanPatches((prev) =>
    upsertPlanPatch(prev, { kind: 'world', id: ruleId, label: rule.title, before: rule.rule, after: value })
  );
}

function stageCanonMemory(canonId: string, value: string) {
  const fact = project.canonFacts.find((item) => item.id === canonId);
  if (!fact) return;
  setPlanPatches((prev) =>
    upsertPlanPatch(prev, { kind: 'canon', id: canonId, label: `캐논 ${fact.episode}화`, before: fact.statement, after: value })
  );
}

function stageStoryCore(
  field: 'title' | 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone',
  value: string
) {
  if (field === 'title') {
    // title 은 wm-bar 소유(직행 유지) — MemoryBankStudio 는 title 을 편집하지 않지만 prop 타입 호환용.
    updateProject('title', value);
    return;
  }
  const labels = {
    logline: '로그라인', audiencePromise: '표면 약속', deepQuestion: '심층 질문',
    formIntent: '형식·구조', tone: '문체 톤'
  } as const;
  setPlanPatches((prev) =>
    upsertPlanPatch(prev, { kind: 'story-core', field, label: labels[field], before: project[field], after: value })
  );
}

function stageCreativeWeight(weight: CreativeWeight) {
  setPlanPatches((prev) =>
    upsertPlanPatch(prev, { kind: 'creative-weight', label: '작품 무게중심', before: project.creativeWeight, after: weight })
  );
}
```

기존 핸들러의 label 문자열(labels 맵)이 위와 다르면 **기존 핸들러의 문자열을 따른다**.

- [ ] **Step 3: isBibleMode 분기에서 overlay·staged 핸들러로 교체** (2149~2199 부근):

- `CanonCanvas` — `project={overlayProject}` · `onUpdateCharacter={stageCharacterMemory}` · `stagedKeys={planStagedKeys}` 추가. (onAddCharacter/onRemoveCharacter/onRenameCharacter 는 현행 직행 유지.)
- `MemoryBankStudio` — `project={overlayProject}` · `onUpdateCharacter={stageCharacterMemory}` · `onUpdateWorldRule={stageWorldMemory}` · `onUpdateCanon={stageCanonMemory}` · `onUpdateProject={stageStoryCore}` · `onUpdateCreativeWeight={stageCreativeWeight}` · `stagedKeys={planStagedKeys}` 추가. (approvalQueue·onAmendCharter 등 나머지는 무변경.)
- `FloatingDataWorkspace` — `project={overlayProject}` 로 교체.
- `memoryBank`·`editorWorkspace`·`bibleAlertCount`·`studioMetrics`·`canonHealth` 파생은 **project(committed) 기준 그대로** 둔다.

- [ ] **Step 4: MemoryBankStudio / CanonCanvas — stagedKeys prop + is-plan-staged 표시**

두 컴포넌트에 optional prop 추가:

```ts
/** PLAN staged — 패치가 있는 필드 key(patchKey 형식). 카드에 설계안(미반영) 표시. */
stagedKeys?: Set<string>;
```

내부에 헬퍼 추가:

```ts
const isStaged = (key: string) => stagedKeys?.has(key) ?? false;
```

편집 가능한 각 필드/카드의 래퍼에 클래스·태그를 단다. 패턴(캐논 statement 예):

```tsx
<div className={isStaged(`canon:${fact.id}`) ? 'is-plan-staged' : undefined}>
  {isStaged(`canon:${fact.id}`) && <span className="plan-staged-tag">설계안 (미반영)</span>}
  {/* 기존 편집 UI */}
</div>
```

적용 지점(각각 grep 으로 찾는다) — MemoryBankStudio: `onUpdateCanon(` 캐논 카드 · `onUpdateWorldRule(` 세계 규칙 카드 · `onUpdateCharacter(` 인물 필드(키는 `character:${id}:${field}`) · `onUpdateProject('logline'|'tone'|'audiencePromise'|'deepQuestion'|'formIntent')` 필드(키는 `story-core:${field}`) · `onUpdateCreativeWeight(` (키 `creative-weight`). CanonCanvas: `onUpdateCharacter(` 를 부르는 인물 카드(카드 단위, 키는 세 필드 중 하나라도 staged 면 표시 — `['desire','wound','currentState'].some(f => isStaged(\`character:${id}:${f}\`))`).

기존 JSX 구조를 바꾸지 말고 **클래스 추가가 가능한 가장 가까운 기존 래퍼**에 얹는다(새 래퍼 div 남발 금지).

- [ ] **Step 5: 기존 이력 단언 확인**

Run: `grep -rn "manual-bible-edit" src --include="*.test.ts"`
단언이 있으면 3분법(교체 우선)으로 교정 — PLAN 편집이 패치를 만드는 단언으로 교체. 없으면 넘어간다.

- [ ] **Step 6: tsc + 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 전체 녹색. 실패 시 이 태스크 변경분만 의심(특히 prop 타입 불일치).

- [ ] **Step 7: Commit**

```bash
git add src/StoryXDesk.tsx src/components/MemoryBankStudio.tsx src/components/CanonCanvas.tsx
git commit -m "feat(plan-stage): PLAN 편집 staged 라우팅 — overlay 렌더·설계안 표시·본편 무접촉"
```

---

### Task 8: App 배선 + CSS — 반영/버리기/충돌 다이얼로그

**Files:**
- Modify: `src/App.tsx` (225~321 부근)
- Modify: `src/styles.css`

- [ ] **Step 1: imports + state**

import 추가:

```ts
import { PlanApplyReview } from './components/PlanApplyReview';
import { applyPlanPatches, derivePlanConflicts, resolvePlanApply, type PlanConflict } from './lib/planStage';
```

storage import 에 `loadPlanPatches, clearPlanPatches` 추가. SyncFlash import 를 `import { SyncFlash, type SyncFlashPayload } from './components/SyncFlash';` 로.

state 추가(231 syncVersion 아래) + syncFlash 타입 교체:

```ts
// PLAN staged — 설계실 패치 수(배지)·반영 충돌 다이얼로그.
const [pendingPlan, setPendingPlan] = useState<number>(() =>
  typeof window === 'undefined' ? 0 : loadPlanPatches().length
);
const [planConflicts, setPlanConflicts] = useState<PlanConflict[] | null>(null);
const [planDecisions, setPlanDecisions] = useState<Record<string, 'keep' | 'apply'>>({});
```

```ts
const [syncFlash, setSyncFlash] = useState<SyncFlashPayload | null>(null);
```

- [ ] **Step 2: 반영/버리기/승인 함수** (confirmReconcile 280 아래):

```ts
// PLAN staged — 설계 반영. 충돌 0 이면 즉시(현행 player-first 계승), 충돌 있으면 keep/apply 다이얼로그.
function commitPlanApplied(next: SeriesProject, appliedCount: number) {
  saveProject(next);
  clearPlanPatches();
  setPendingPlan(0);
  setSyncVersion((v) => v + 1);
  setSyncFlash(appliedCount > 0 ? { chapters: 0, canon: 0, total: appliedCount, plan: appliedCount } : null);
}

function applyPlanStage() {
  const patches = loadPlanPatches();
  if (patches.length === 0) return;
  const committed = loadProject();
  const conflicts = derivePlanConflicts(patches, committed);
  if (conflicts.length === 0) {
    commitPlanApplied(applyPlanPatches(committed, patches), patches.length);
    return;
  }
  setPlanDecisions({});
  setPlanConflicts(conflicts);
}

function confirmPlanApply() {
  if (planConflicts) {
    const patches = loadPlanPatches();
    const committed = loadProject();
    const dropped = planConflicts.filter((c) => planDecisions[c.key] !== 'apply').length;
    commitPlanApplied(resolvePlanApply(committed, patches, planConflicts, planDecisions), patches.length - dropped);
  }
  setPlanConflicts(null);
}

function discardPlanStage() {
  clearPlanPatches();
  setPendingPlan(0);
  setSyncVersion((v) => v + 1); // remount 로 PLAN 카드가 본편 값으로 복귀. 본편 무접촉.
}
```

- [ ] **Step 3: 다이얼로그·콘솔 노드** (reconcileDialog 292 아래):

```tsx
const planApplyDialog = planConflicts ? (
  <PlanApplyReview
    conflicts={planConflicts}
    decisions={planDecisions}
    onToggle={(key, decision) => setPlanDecisions((d) => ({ ...d, [key]: decision }))}
    onApprove={confirmPlanApply}
    onCancel={() => setPlanConflicts(null)}
  />
) : null;
const syncConsoleNode = (
  <SyncConsole
    pending={pendingSync}
    onReconcile={reconcileSync}
    planPending={pendingPlan}
    onPlanApply={applyPlanStage}
    onPlanDiscard={discardPlanStage}
  />
);
```

- 311 `syncSlot={<SyncConsole …/>}` → `syncSlot={syncConsoleNode}` 로, 385 dive stage `rightSlot={<SyncConsole …/>}` → `rightSlot={syncConsoleNode}` 로 교체.
- StoryXDesk(305)에 `onPlanPatchesChange={setPendingPlan}` prop 추가.
- editor 반환(318)과 dive 반환의 `{reconcileDialog}` 옆에 `{planApplyDialog}` 추가.

- [ ] **Step 4: styles.css** — 파일 끝 `PLAN staged` 절 추가:

```css
/* ---- PLAN staged — 설계실 패치 배지·메뉴·카드 표시 (spec 2026-07-04) ---- */
.sync-plan-wrap { position: relative; display: inline-flex; }
.sync-plan-badge {
  border: 1px solid #a78bfa; color: #c4b5fd; background: transparent;
  border-radius: 6px; padding: 3px 8px; cursor: pointer; font: inherit; font-size: 12px;
}
.sync-plan-menu {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 60;
  display: flex; flex-direction: column; gap: 2px; min-width: 190px;
  background: #1c1e26; border: 1px solid #2a2c35; border-radius: 8px; padding: 6px;
}
.sync-plan-menu button {
  text-align: left; background: transparent; border: 0; color: #e5e7eb;
  padding: 6px 8px; border-radius: 5px; cursor: pointer; font: inherit; font-size: 12px;
}
.sync-plan-menu button:hover { background: rgba(167, 139, 250, 0.12); }
.sync-plan-menu [data-action='plan-discard'] { color: #f87171; }
.is-plan-staged { border: 1px dashed #a78bfa; border-left: 3px solid #a78bfa; border-radius: 8px; }
.plan-staged-tag { color: #c4b5fd; font-size: 11px; }
```

색은 기존 `.sync-console`/`.rc-*` 절이 토큰(`--lc-*`/`--sx-*`)을 쓰고 있으면 그 토큰으로 맞춘다(리터럴 최소화 원칙).

- [ ] **Step 5: 전체 검증**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: 전체 녹색 + build 성공

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat(plan-stage): App 반영/버리기/충돌 다이얼로그 배선 — syncVersion remount 불변식 유지"
```

---

### Task 9: 라이브 런칭 게이트 (preview)

**Files:** 없음(검증 전용). 수정이 나오면 해당 파일 + 커밋.

- [ ] **Step 1: `bash init.sh`** — 녹색 확인.
- [ ] **Step 2: preview 서버로 라이브 게이트** (spec §5 런칭 게이트):
  1. PLAN 진입 → 캐논 문장 수정 → localStorage `serial-story-studio/project` 의 해당 statement **무변** + `serial-story-studio/plan-stage` 에 패치 1건 + 카드 보라 점선 + `PLAN +1` 배지.
  2. WRITE·PLAY 전환에도 배지 유지.
  3. 배지 → 전부 버리기 → 카드 원복·배지 소멸·본편 무변.
  4. 다시 수정 → 배지 → 본편에 반영 → statement 반영·토스트 "1설계"·배지 소멸.
  5. 같은 필드 두 번 수정 후 원래 값 복원 → 배지 소멸(패치 자동 소멸).
  6. WRITE 원고 타이핑 → 기존처럼 즉시 저장(회귀 없음).
  7. **충돌 시나리오** — PLAN 에서 캐논 수정을 staged 해둔 채, localStorage 본편의 같은 캐논 statement 를 바꿔(PLAY 최신화 대역) → 배지 → 본편에 반영 → PlanApplyReview 다이얼로그(기본 keep) → 승인 시 본편 유지·패치 소멸 / "내 설계로" 토글 승인 시 내 값 반영.
  8. 콘솔 에러 0 (fresh reload 후 판정 — HMR 중간 에러는 무시, 메모리 준칙).
- [ ] **Step 3: 발견 수정** — 라이브에서 잡힌 회귀는 이 브랜치에서 수정·커밋.

---

### Task 10: 문서 갱신 + PR

- [ ] **Step 1:** `progress.md` — 새 완료 트랙 절 + 헤더 요약 + '최근 검증' 갱신(테스트 수치는 여기서만).
- [ ] **Step 2:** `session-handoff.md` — 맨 위 새 인계 노트(한 것·손대지 말 것 불변식·다음 한 가지).
- [ ] **Step 3:** Commit + PR:

```bash
git add progress.md session-handoff.md
git commit -m "docs: PLAN staged 완료 기록 — progress·handoff 갱신"
git push -u origin feat/plan-staged-patches
gh pr create --title "feat: PLAN staged — 설계실 패치 모델 (PLAN +N·반영/버리기·충돌 검토)" --body "..."
```

PR body 에는 사용자 결정 4건·불변식·검증 결과 요약. 머지는 자율 권한(메모리) 범위 — 적대적 검토(코드 리뷰) 후 진행.
