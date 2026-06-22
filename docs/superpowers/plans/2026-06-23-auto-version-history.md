# 자동 버전 히스토리 (B4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 굵직한 마일스톤(회차 확정·헌장 개정)마다 자동 스냅샷을 남기고, 복원 시 무엇이 사라지는지(회차·캐논 증감)를 표시해 실수 복원을 막는다.

**Architecture:** 기존 인프라(`ProjectSnapshot`·`pushProjectSnapshot`·`ProjectHistoryDialog`·`restoreProjectVersion`)를 그대로 쓴다. 신규 = `snapshotImpact.ts` 순수 모듈(영향범위 계산) + confirmChapterLock·amendCharter 트리거 추가 + ProjectHistoryDialog 영향범위 인라인 표시·rollback confirm. 프롬프트 버전은 비목표.

**Tech Stack:** TypeScript · React · Vitest · 기존 스냅샷/복원 인프라 재사용.

설계 정본 — `docs/superpowers/specs/2026-06-23-auto-version-history-design.md`.

---

### Task 1: snapshotImpact.ts 순수 모듈

복원 영향범위(회차·캐논·회차번호 증감, rollback 여부)를 결정론으로 계산.

**Files:**
- Create: `src/lib/snapshotImpact.ts`
- Test: `src/lib/snapshotImpact.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/snapshotImpact.test.ts`:
```ts
// 자동 버전 히스토리(B4) — 복원 영향범위 계산 순수 모듈 테스트
import { describe, it, expect } from 'vitest';
import { describeSnapshotImpact } from './snapshotImpact';
import type { SeriesProject } from './storyEngine';
import type { ProjectSnapshot } from './storage';

const projectWith = (chapters: number, canon: number, episode: number): SeriesProject =>
  ({ chapters: new Array(chapters).fill({}), canonFacts: new Array(canon).fill({}), currentEpisode: episode } as unknown as SeriesProject);

const snapWith = (chapterCount: number, canonCount: number, episode: number): ProjectSnapshot =>
  ({ id: 's', savedAt: '', label: '', episode, chapterCount, canonCount, project: {} as SeriesProject });

describe('describeSnapshotImpact', () => {
  it('스냅샷이 현재보다 적으면 음수 delta + isRollback true', () => {
    const impact = describeSnapshotImpact(projectWith(10, 50, 10), snapWith(8, 45, 8));
    expect(impact).toEqual({ chapterDelta: -2, canonDelta: -5, episodeDelta: -2, isRollback: true });
  });

  it('스냅샷이 현재보다 많으면 양수 delta + isRollback false', () => {
    const impact = describeSnapshotImpact(projectWith(8, 45, 8), snapWith(10, 50, 10));
    expect(impact).toEqual({ chapterDelta: 2, canonDelta: 5, episodeDelta: 2, isRollback: false });
  });

  it('동일하면 delta 0 + isRollback false', () => {
    const impact = describeSnapshotImpact(projectWith(10, 50, 10), snapWith(10, 50, 10));
    expect(impact).toEqual({ chapterDelta: 0, canonDelta: 0, episodeDelta: 0, isRollback: false });
  });

  it('회차만 줄어도(캐논 동일) isRollback true', () => {
    expect(describeSnapshotImpact(projectWith(10, 50, 10), snapWith(9, 50, 9)).isRollback).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/snapshotImpact.test.ts`
Expected: FAIL — `Cannot find module './snapshotImpact'`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/snapshotImpact.ts`:
```ts
// 자동 버전 히스토리(B4) — 복원 영향범위(회차·캐논·회차번호 증감, rollback 여부)를 계산하는 순수 모듈.
import type { SeriesProject } from './storyEngine';
import type { ProjectSnapshot } from './storage';

export interface SnapshotImpact {
  chapterDelta: number; // snapshot.chapterCount - current.chapters.length (음수 = 복원 시 감소)
  canonDelta: number;
  episodeDelta: number;
  isRollback: boolean; // 회차 또는 캐논이 줄어드는가(복원 시 손실 위험)
}

export function describeSnapshotImpact(current: SeriesProject, snapshot: ProjectSnapshot): SnapshotImpact {
  const chapterDelta = snapshot.chapterCount - current.chapters.length;
  const canonDelta = snapshot.canonCount - current.canonFacts.length;
  const episodeDelta = snapshot.episode - current.currentEpisode;
  return {
    chapterDelta,
    canonDelta,
    episodeDelta,
    isRollback: chapterDelta < 0 || canonDelta < 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/snapshotImpact.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/snapshotImpact.ts src/lib/snapshotImpact.test.ts
git commit -m "feat(quality): snapshotImpact 순수 모듈 — 복원 영향범위 계산 (B4)"
```

---

### Task 2: 자동 스냅샷 트리거 확대 (회차 확정·헌장 개정)

confirmChapterLock·amendCharter 에 `pushProjectSnapshot` 추가. 기존 saveProject/setProject 패턴 옆에.

**Files:**
- Modify: `src/StoryXDesk.tsx` (confirmChapterLock ~2407, amendCharter ~1882)
- Test: `src/editorFocusLayout.test.ts`

- [ ] **Step 1: Write the failing test**

`src/editorFocusLayout.test.ts` 끝에 추가:
```ts
describe('B4 — 자동 스냅샷 트리거 확대', () => {
  it('confirmChapterLock 이 스냅샷을 남긴다', () => {
    const start = desk.indexOf('function confirmChapterLock');
    expect(start).toBeGreaterThan(-1);
    expect(desk.slice(start, start + 1200)).toContain('pushProjectSnapshot');
  });

  it('amendCharter 가 스냅샷을 남긴다', () => {
    const start = desk.indexOf('function amendCharter');
    expect(start).toBeGreaterThan(-1);
    expect(desk.slice(start, start + 700)).toContain('pushProjectSnapshot');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "자동 스냅샷 트리거"`
Expected: FAIL — confirmChapterLock·amendCharter 에 pushProjectSnapshot 없음.

- [ ] **Step 3: Write minimal implementation**

`src/StoryXDesk.tsx` — confirmChapterLock 의 setProject 콜백 안 `saveProject(stamped);` 다음에 추가:
```ts
      saveProject(stamped);
      setProjectSnapshots(pushProjectSnapshot(stamped, `${chapterLabel(target ?? stamped.chapters[stamped.chapters.length - 1])} 확정`));
```
> 주의 — confirmChapterLock 상단에서 `const target = project.chapters.find((chapter) => chapter.id === chapterId);` 로 target 을 이미 잡고 있는지 확인(B1 누수 게이트가 target 사용). 있으면 그 target 으로 라벨. 없으면 `stamped.chapters` 의 해당 회차로. 라벨 형식은 기존 produceEpisode 의 `chapterLabel(...)` 과 동일하게 맞춘다.

`src/StoryXDesk.tsx` — amendCharter 의 setProject 를 스냅샷 포함으로:
```ts
    setProject((current) => {
      const updated = { ...current, storyContract: next };
      setProjectSnapshots(pushProjectSnapshot(updated, '헌장 개정'));
      return updated;
    });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "자동 스냅샷 트리거"`
Expected: PASS. `npx tsc --noEmit` 통과.

- [ ] **Step 5: Commit**

```bash
git add src/StoryXDesk.tsx src/editorFocusLayout.test.ts
git commit -m "feat(quality): 회차 확정·헌장 개정 시 자동 스냅샷 (B4)"
```

---

### Task 3: ProjectHistoryDialog 영향범위 표시 + rollback confirm + 배선

각 스냅샷에 복원 영향범위 인라인 표시, 감소 시 confirm. StoryXDesk 가 current project 전달.

**Files:**
- Modify: `src/components/ProjectHistoryDialog.tsx`
- Modify: `src/StoryXDesk.tsx:2995` (ProjectHistoryDialog 호출처 — current prop)
- Test: `src/lib/version.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/version.test.ts` 에 추가(파일 패턴 — readFileSync 소스 핀):
```ts
const projectHistoryDialog = readFileSync(resolve(__dirname, '../components/ProjectHistoryDialog.tsx'), 'utf8');

describe('B4 — ProjectHistoryDialog 영향범위', () => {
  it('describeSnapshotImpact 로 영향범위를 계산한다', () => {
    expect(projectHistoryDialog).toContain('describeSnapshotImpact');
  });
  it('rollback 시 복원 전 confirm 한다', () => {
    expect(projectHistoryDialog).toContain('window.confirm');
    expect(projectHistoryDialog).toContain('isRollback');
  });
  it('current project 를 prop 으로 받는다', () => {
    expect(projectHistoryDialog).toMatch(/current[?:]/);
  });
});
```
> `readFileSync`/`resolve` 가 version.test 상단에 이미 import 돼 있다(VersionLogDialog 소스 핀이 씀).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/version.test.ts -t "ProjectHistoryDialog 영향범위"`
Expected: FAIL — describeSnapshotImpact 미사용.

- [ ] **Step 3: Write minimal implementation**

`src/components/ProjectHistoryDialog.tsx` — import + props + 렌더:
```tsx
import { X } from 'lucide-react';
import type { ProjectSnapshot } from '../lib/storage';
import type { SeriesProject } from '../lib/storyEngine';
import { describeSnapshotImpact } from '../lib/snapshotImpact';

export function ProjectHistoryDialog({
  snapshots,
  current,
  onRestore,
  onClose
}: {
  snapshots: ProjectSnapshot[];
  current: SeriesProject;
  onRestore: (snapshot: ProjectSnapshot) => void;
  onClose: () => void;
}) {
```
각 `<article>` 의 복원 버튼을 영향범위 + confirm 으로 교체(기존 `<small>` 다음 `<div>` 블록):
```tsx
                <small>{new Date(snapshot.savedAt).toLocaleString('ko-KR')}</small>
                {(() => {
                  const impact = describeSnapshotImpact(current, snapshot);
                  const restore = () => {
                    if (
                      impact.isRollback &&
                      !window.confirm(
                        `이 시점으로 되돌리면 현재 기준 회차 ${-impact.chapterDelta}개·캐논 ${-impact.canonDelta}개가 사라질 수 있습니다. 계속할까요?`
                      )
                    ) {
                      return;
                    }
                    onRestore(snapshot);
                  };
                  return (
                    <>
                      <p className={`sx-snapshot-impact${impact.isRollback ? ' is-rollback' : ''}`}>
                        복원 시 회차 {current.chapters.length}→{snapshot.chapterCount} · 캐논 {current.canonFacts.length}→{snapshot.canonCount}
                      </p>
                      <div>
                        <button type="button" className="sx-secondary-button" onClick={restore}>
                          이 시점으로 되돌리기
                        </button>
                      </div>
                    </>
                  );
                })()}
```
> 기존 `<div><button onClick={() => onRestore(snapshot)}>…</button></div>` 블록을 위 IIFE 로 대체한다. confirm 메시지의 `-impact.chapterDelta` 는 감소량(양수)로 표시.

`src/StoryXDesk.tsx:2995` ProjectHistoryDialog 호출에 current 추가:
```tsx
        <ProjectHistoryDialog
          snapshots={projectSnapshots}
          current={project}
          onRestore={restoreProjectVersion}
          onClose={() => setIsHistoryOpen(false)}
        />
```

`src/styles.css` 끝에 다크 토큰:
```css
/* B4 — 버전 기록 복원 영향범위. */
.sx-snapshot-impact { margin: 4px 0 0; font-size: 12px; color: var(--ink-dim, #9a9aa2); }
.sx-snapshot-impact.is-rollback { color: var(--coral, #fb7185); }
```
> `--ink-dim`/`--coral` 토큰명은 인접 `.sx-*` CSS 에서 쓰는 변수를 확인해 맞춘다(fallback 값으로 안전).

- [ ] **Step 4: Run full gate**

Run: `bash init.sh`
Expected: tsc 0 · vitest 전체 PASS(신규 포함) · build 성공.

- [ ] **Step 5: 라이브 검증 (preview)**

- preview_start(재사용).
- `createSeedProject` + 회차 여럿 주입 후, localStorage 에 스냅샷 2개 주입(`serial-story-studio/snapshots` — 하나는 현재보다 회차·캐논 적은 rollback, 하나는 동일). `?stage=editor` → 버전 기록 열기(⌘K 또는 메뉴).
- 확인: 각 스냅샷에 `.sx-snapshot-impact`("회차 N→M·캐논 N→M") · rollback 스냅샷은 `.is-rollback` 코랄 톤 · 복원 클릭 시 rollback 이면 confirm 다이얼로그 · 콘솔 0.
- (가능하면) 회차 확정 → 버전 기록에 "N화 확정" 스냅샷 추가 확인.
- 스크린샷.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectHistoryDialog.tsx src/StoryXDesk.tsx src/styles.css src/lib/version.test.ts
git commit -m "feat(quality): ProjectHistoryDialog 복원 영향범위 + rollback confirm + 라이브 (B4)"
```

---

## 완료 후
- `progress.md` '최근 검증' + 활성 트랙 갱신.
- `feature_list.json` `B4-auto-version-history` status `todo`→`done` + evidence.
- `session-handoff.md` 맨 위 인계 노트(B 트랙 4개 완주).
- 머지/푸시 사용자 결정 대기(`feat/auto-version-history` → main).

## 손대지 말 것 (회귀 가드)
- `ProjectSnapshot` 구조·`pushProjectSnapshot`·`appendSnapshot` max·`restoreProjectVersion`(복원 로직) — 불변.
- 기존 트리거(회차 생성·캐논 반영) — 유지, 추가만.
- describeSnapshotImpact 순수(현재 시각·random 미사용) — delta 부호는 `snapshot - current`(음수=복원 시 감소).
- ProjectHistoryDialog current prop required — tsc 가 호출처 전달을 강제(optional 로 바꾸면 누락이 조용히 통과).
