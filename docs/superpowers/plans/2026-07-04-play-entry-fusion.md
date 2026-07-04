# PLAY 진입 융합 + wm-bar 공통 셸 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PLAY 토글을 "현 작품 이어 플레이"로 시딩하고(자유 서술 인테이크·본편 덮어쓰기 제거), wm-bar 를 App 소유 공통 셸 + 모드 슬롯 구조로 통일해 전환 연속감을 만든다.

**Architecture:** 두 파트. **파트 1(독립 머지 가능)** — 순수 `playEntry.ts`(`seedPlayFromProject`·`deriveContinuationScene`)로 현 작품에서 PLAY 세션을 시딩하고, App `stage==='dive'` 분기에서 DiveStart 인테이크와 `saveProject` 본편 덮어쓰기를 제거. **파트 2** — `WorkspaceModeBar` 소유권을 StoryXDesk 에서 App 으로 올려(브랜드·제목 input·3모드 토글·싱크·⋯ 오버플로) 세 모드 공통 셸로 만들고, StoryXDesk 의 `activeTrack` 을 controlled(`studioView` prop)로 전환해 WRITE↔PLAN 무리마운트를 유지하며, 제목은 App 단일 소유(`title` prop + `onTitleChange`), PLAN 충돌은 토글 dot(`onBibleAlertChange` 콜백)으로 계승.

**Tech Stack:** React 18 + TypeScript, Vitest, Vite. 순수 도메인은 `src/lib/`, 컴포넌트는 `src/components/`, 셸은 App.tsx/StoryXDesk.tsx.

**핵심 불변식(손대지 말 것):** App key = `syncVersion` 만(studioView 를 key 에 넣지 말 것). 충돌 0 = 즉시 반영. PLAY 는 committed 읽기 전용(쓰기는 ⟳최신화만). PLAN 표면 편집은 패치로만(이 조각은 PLAN staged 무접촉).

---

## 파트 1 — PLAY 이어 플레이 시딩 (독립 머지 가능)

### Task 1: `deriveContinuationScene` 순수 헬퍼

**Files:**
- Create: `src/lib/playEntry.ts`
- Test: `src/lib/playEntry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { deriveContinuationScene } from './playEntry';
import type { Chapter } from './storyEngine';

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'ch-1',
    episode: 1,
    title: '1화 — 시작',
    summary: '',
    prose: '',
    ...overrides
  } as Chapter;
}

describe('deriveContinuationScene', () => {
  it('summary 가 있으면 그것을 이어붙인다', () => {
    const ch = makeChapter({ summary: '서준이 문을 열고 떠났다' });
    expect(deriveContinuationScene(ch)).toBe('직전 회차 이후 — 서준이 문을 열고 떠났다');
  });

  it('summary 가 비면 prose 의 마지막 문단을 쓴다', () => {
    const ch = makeChapter({ summary: '', prose: '첫 문단.\n\n마지막 문단이다.' });
    expect(deriveContinuationScene(ch)).toBe('직전 회차 이후 — 마지막 문단이다.');
  });

  it('summary·prose 모두 비면 빈 문자열', () => {
    expect(deriveContinuationScene(makeChapter({ summary: '', prose: '   ' }))).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: FAIL — `deriveContinuationScene` is not defined / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/playEntry.ts`:

```ts
// 현재 작품에서 PLAY 세션을 이어 시딩하는 순수 로직 — 인물·최근 회차 기반
import type { Chapter } from './storyEngine';

const CONTINUATION_PREFIX = '직전 회차 이후 — ';

/** 최근 회차에서 PLAY 시작 장면을 만든다. summary 우선, 없으면 prose 마지막 문단. */
export function deriveContinuationScene(chapter: Chapter): string {
  const summary = chapter.summary?.trim();
  if (summary) return CONTINUATION_PREFIX + summary;
  const prose = chapter.prose?.trim();
  if (!prose) return '';
  const paragraphs = prose.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const tail = paragraphs[paragraphs.length - 1] ?? '';
  return tail ? CONTINUATION_PREFIX + tail : '';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/playEntry.ts src/lib/playEntry.test.ts
git commit -m "feat(play): deriveContinuationScene 순수 헬퍼"
```

---

### Task 2: `seedPlayFromProject` 순수 함수

**Files:**
- Modify: `src/lib/playEntry.ts`
- Test: `src/lib/playEntry.test.ts`

- [ ] **Step 1: Write the failing test**

먼저 파일 상단 import 에 실제 팩토리를 추가하고(테스트에서 현실적 project 생성), 아래 describe 블록을 `playEntry.test.ts` 에 추가한다.

```ts
import { seedPlayFromProject } from './playEntry';
import { createEmptyProject } from './storyEngine';
import type { CharacterProfile } from './storyEngine';

function makeCharacter(id: string, name: string): CharacterProfile {
  return {
    id, name, role: '주인공', desire: '', wound: '', currentState: '',
    voiceRules: [], canonAnchors: [], forbiddenContradictions: [], relations: []
  };
}

describe('seedPlayFromProject', () => {
  it('인물이 없으면 null 을 반환한다', () => {
    const project = createEmptyProject({ title: '무인물' });
    expect(seedPlayFromProject({ ...project, characters: [] })).toBeNull();
  });

  it('characters[0] 을 주인공으로 세션을 만든다', () => {
    const base = createEmptyProject({ title: '테스트작' });
    const project = { ...base, characters: [makeCharacter('c-1', '서윤'), makeCharacter('c-2', '민호')] };
    const seed = seedPlayFromProject(project);
    expect(seed).not.toBeNull();
    expect(seed!.schema).toBe('storyx/dive/v1');
    expect(seed!.session.characterId).toBe('c-1');
    expect(seed!.session.projectId).toBe(project.id);
    expect(seed!.project).toBe(project); // 동일 참조 — 빈 프로젝트 안 만듦
  });

  it('최근 회차가 있으면 scene 을 이어붙인다', () => {
    const base = createEmptyProject({ title: '연재작' });
    const project = {
      ...base,
      characters: [makeCharacter('c-1', '서윤')],
      chapters: [
        { id: 'ch-1', episode: 1, title: '1화', summary: '첫 만남', prose: '' } as any,
        { id: 'ch-2', episode: 2, title: '2화', summary: '이별 통보', prose: '' } as any
      ]
    };
    const seed = seedPlayFromProject(project);
    expect(seed!.session.scene).toBe('직전 회차 이후 — 이별 통보');
  });

  it('회차가 없으면 scene 미설정', () => {
    const base = createEmptyProject({ title: '새작' });
    const project = { ...base, characters: [makeCharacter('c-1', '서윤')], chapters: [] };
    const seed = seedPlayFromProject(project);
    expect(seed!.session.scene).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: FAIL — `seedPlayFromProject` is not defined.

- [ ] **Step 3: Write minimal implementation**

`src/lib/playEntry.ts` 상단 import 확장 + 함수 추가:

```ts
import type { Chapter, SeriesProject } from './storyEngine';
import type { DiveState } from './storage';
import { createDiveSession } from './diveSession';
```

파일 하단에 추가:

```ts
/** 현재 작품(본편)에서 이어 플레이할 DiveState 를 만든다. 인물이 없으면 null. */
export function seedPlayFromProject(project: SeriesProject): DiveState | null {
  const primary = project.characters[0];
  if (!primary) return null;
  const session = createDiveSession(primary.id, project.id);
  const latest = project.chapters[project.chapters.length - 1];
  const scene = latest ? deriveContinuationScene(latest) : '';
  return {
    schema: 'storyx/dive/v1',
    session: scene ? { ...session, scene } : session,
    project
  };
}
```

> 주의: `DiveState` 의 `schema` 리터럴 타입을 확인해 정확히 맞출 것. `src/lib/storage.ts` 의 `parseDiveState`/`DiveState` 정의에서 `'storyx/dive/v1'` 문자열을 그대로 사용한다. 다르면 그 값으로 교체.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: PASS (전체 7 tests).

- [ ] **Step 5: tsc + commit**

```bash
npx tsc --noEmit && git add src/lib/playEntry.ts src/lib/playEntry.test.ts && git commit -m "feat(play): seedPlayFromProject — 현 작품 이어 플레이 시딩"
```

Expected: tsc 통과.

---

### Task 3: App `stage==='dive'` 분기를 이어 플레이로 교체

**Files:**
- Modify: `src/App.tsx` (dive 분기 ~442-487, seedAndEnter, DiveStart 렌더/import)

**배경:** 현재 dive 분기는 (1) 복원본, (2) diveInit, (3) 없으면 `DiveStart` + `seedAndEnter`(빈 프로젝트 생성 + `saveProject` 덮어쓰기). 이 세 번째를 `seedPlayFromProject(loadProject())` 로 교체한다.

- [ ] **Step 1: import 추가**

App.tsx 상단 import 에 추가:

```ts
import { seedPlayFromProject } from './lib/playEntry';
```

- [ ] **Step 2: dive 분기 세 번째 경로 교체**

기존 `seedAndEnter` 정의부터 `DiveStart` 를 렌더하는 `return (...)` 블록(대략 App.tsx 467-486)을 아래로 교체한다. (복원본·diveInit 두 return 은 그대로 둔다.)

```tsx
    // PLAY 첫 진입 — 현 작품(본편)에서 이어 플레이 시딩. 본편은 읽기만(saveProject 없음).
    const seed = seedPlayFromProject(loadProject());
    if (!seed) {
      return (
        <>
          {bar}
          <div className="dx-empty" role="status">
            <p>이 작품에는 아직 인물이 없어요. PLAN 에서 인물을 먼저 만들어 주세요.</p>
            <button type="button" className="btn-primary" onClick={() => selectWorkspaceMode('plan')}>
              PLAN 으로 이동
            </button>
          </div>
        </>
      );
    }
    saveDiveState(seed);
    setDiveInit(seed);
    return (
      <>
        {bar}
        <DiveStage initial={seed} onBack={() => setStage('editor')} onWorkingChange={onWorkingChange} />
      </>
    );
```

> ⚠️ `setDiveInit(seed)` 를 렌더 함수 본문에서 직접 호출하면 React 경고(렌더 중 setState)가 날 수 있다. 안전하게 하려면 이 시딩을 `useEffect` 로 옮긴다 — 아래 Step 3 참조. 우선 이 구조로 두되 Step 3 에서 effect 화한다.

- [ ] **Step 3: 시딩을 effect 로 이동(렌더 중 setState 회피)**

dive 분기 진입 전에, App 컴포넌트 상단(다른 useEffect 옆)에 추가:

```tsx
// PLAY 첫 진입 시딩 — 복원본·diveInit 이 모두 없을 때만 현 작품에서 한 번 시딩.
useEffect(() => {
  if (stage !== 'dive') return;
  if (loadDiveState() || diveInit) return;
  const seed = seedPlayFromProject(loadProject());
  if (!seed) return;
  saveDiveState(seed);
  setDiveInit(seed);
}, [stage, diveInit]);
```

그리고 Step 2 의 `return` 블록에서 `saveDiveState(seed); setDiveInit(seed);` 두 줄을 제거하고, `seed` 없을 때만 안내 카드, `seed` 있으면 위 effect 가 `diveInit` 을 채워 다음 렌더에서 diveInit 경로로 진입하도록 한다. 최종 dive 분기 순서:

```tsx
  if (stage === 'dive') {
    const onWorkingChange = (project: SeriesProject) =>
      setPendingSync(countPendingSync(project, loadProject()));
    const bar = ( /* 기존 그대로 */ );
    const restored = loadDiveState();
    if (restored) return <>{bar}<DiveStage initial={restored} onBack={() => setStage('editor')} onWorkingChange={onWorkingChange} /></>;
    if (diveInit) return <>{bar}<DiveStage initial={diveInit} onBack={() => setStage('editor')} onWorkingChange={onWorkingChange} /></>;
    // 시딩 effect 가 아직 안 돌았거나 인물이 없는 경우
    const canSeed = seedPlayFromProject(loadProject()) !== null;
    if (!canSeed) {
      return (
        <>
          {bar}
          <div className="dx-empty" role="status">
            <p>이 작품에는 아직 인물이 없어요. PLAN 에서 인물을 먼저 만들어 주세요.</p>
            <button type="button" className="btn-primary" onClick={() => selectWorkspaceMode('plan')}>PLAN 으로 이동</button>
          </div>
        </>
      );
    }
    return <>{bar}</>; // effect 가 diveInit 을 채우면 다음 렌더에서 DiveStage 진입
  }
```

- [ ] **Step 4: DiveStart·seedAndEnter 잔재 제거**

- `seedAndEnter` 함수 정의 삭제(더 이상 참조 없음).
- `DiveStart` import 제거(App.tsx 상단). **컴포넌트 파일 `src/components/DiveStart.tsx` 는 삭제하지 않는다**(후속 온보딩 경로용 보존).
- `DiveProposal`/`DiveSetup`/`seedFromProposal` import 가 dive 분기에서만 쓰였다면 제거(다른 곳 참조 여부 grep 확인 후).

Run: `grep -n "DiveStart\|seedAndEnter\|seedFromProposal" src/App.tsx` — dive 분기 관련 잔재가 없어야 한다.

- [ ] **Step 5: tsc + build + 수동 확인**

```bash
npx tsc --noEmit && npm run build
```

Expected: 성공. (App.tsx 에 미사용 import 남으면 tsc 경고/에러 — 정리.)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(play): PLAY 진입을 현 작품 이어 플레이로 교체 — 인테이크·본편 덮어쓰기 제거"
```

---

### Task 4: 파트 1 라이브 검증 (preview)

**Files:** 없음(검증만). launch.json 포트 5175.

- [ ] **Step 1: preview 서버 기동**

preview_start(name from launch.json). 이미 떠 있으면 재사용.

- [ ] **Step 2: 회차 있는 작품에서 PLAY 진입 확인**

새 작품 생성 → WRITE 에서 회차 1개 이상 확보(또는 기존 저장 작품) → PLAY 토글.
- 기대: **DiveStart 자유 서술 화면 안 나옴**, 바로 DiveDesk. 🎬 현재 장면에 "직전 회차 이후 —" 시딩. "📖 지난 이야기 N화" 크로니클 표시. 콘솔 0.

- [ ] **Step 3: 본편 덮어쓰기 없음 확인**

PLAY 진입 전 `loadProject().chapters.length` 를 preview_eval 로 기록 → PLAY 진입 → editor 복귀 → 다시 측정. 값 동일(덮어쓰기 0).

- [ ] **Step 4: 인물 0 작품에서 안내 카드 확인**

인물 없는 작품(또는 characters 비운 상태)에서 PLAY → `.dx-empty` 안내 + PLAN 이동 버튼. 본편 무변.

- [ ] **Step 5: progress.md 파트 1 기록 + 커밋**

progress.md 활성 트랙에 파트 1 done 근거(테스트 수·라이브 게이트) 기록.

```bash
git add progress.md && git commit -m "docs(progress): PLAY 이어 플레이 시딩 파트 1 done"
```

> **여기서 파트 1 을 독립 PR 로 머지 가능**(사용자 자율 머지 권한). 파트 2 는 이어서 같은 브랜치 또는 새 브랜치.

---

## 파트 2 — wm-bar 공통 셸

> 목표: `WorkspaceModeBar` 를 App 이 세 모드에서 소유하는 지속 프레임으로. StoryXDesk 는 바를 렌더하지 않고, activeTrack controlled + 제목 prop + bibleAlert 콜백만 노출.

### Task 5: StoryXDesk `activeTrack` controlled 화 (studioView prop)

**Files:**
- Modify: `src/StoryXDesk.tsx` (activeTrack state ~424, switchToTrack ~2017, props ~346-383)

**배경:** 지금 `activeTrack` 은 내부 state, `initialStudioView` 로 시드만 한다. App 이 토글을 소유하려면 `studioView` 를 controlled prop 로 받아 track 을 따라가게 해야 한다(무리마운트 유지).

- [ ] **Step 1: prop 추가 + effect 동기화**

props 인터페이스에 추가(기존 `initialStudioView` 옆):

```ts
  /** 공통 셸 — App 이 소유한 현재 스튜디오 뷰. prop 변경 시 내부 track 을 따라간다(무리마운트). */
  studioView?: 'editor' | 'data';
```

구조분해에 `studioView` 추가. `activeTrack` state 는 유지(초기값 `initialStudioView` 기반)하되, prop 동기화 effect 추가:

```tsx
useEffect(() => {
  if (studioView === undefined) return;
  const nextTrack: DeskTrack = studioView === 'data' ? 'bible' : 'draft';
  setActiveTrack((prev) => (prev === nextTrack ? prev : nextTrack));
}, [studioView]);
```

> `switchToTrack` 내부 전환(사용자가 셸 토글을 누르면 App 이 studioView 를 바꾸고, 이 effect 가 track 을 맞춘다)은 그대로 둔다. App 이 없는 경로(studioView undefined)에선 기존 동작 유지 → 하위호환.

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: Commit**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(shell): StoryXDesk activeTrack controlled via studioView prop"
```

---

### Task 6: StoryXDesk 제목·bibleAlert·오버플로를 App 으로 노출

**Files:**
- Modify: `src/StoryXDesk.tsx`

**배경:** 셸이 App 으로 올라가므로 StoryXDesk 는 (a) 제목을 prop 으로 받아 표시하고 편집을 콜백으로 올리고, (b) bibleAlertCount 를 콜백으로 올리고, (c) 자체 `WorkspaceModeBar` 렌더를 제거한다.

- [ ] **Step 1: props 추가**

```ts
  /** 공통 셸 — 제목 단일 소유는 App. StoryXDesk 는 prop 로 표시하고 편집을 올린다. */
  title?: string;
  onTitleChange?: (next: string) => void;
  /** 공통 셸 — PLAN 충돌 dot 용. StoryXDesk 가 실제 count 를 App 에 보고. */
  onBibleAlertChange?: (count: number) => void;
```

- [ ] **Step 2: 제목 표시를 prop 우선으로**

`project.title` 을 바 제목으로 쓰던 곳은 이제 셸(App)로 이동하므로, StoryXDesk 내부에서 제목을 **표시**하는 곳(본문 헤더 등)이 있으면 `title ?? project.title` 로 파생 상수 `displayTitle` 을 만들어 사용:

```tsx
const displayTitle = title ?? project.title;
```

바 안의 `wm-title-input` 은 셸로 옮기므로 StoryXDesk 에선 제거(Step 4).

- [ ] **Step 3: bibleAlertCount 콜백 보고**

`bibleAlertCount` 계산(~680) 아래에 effect 추가:

```tsx
useEffect(() => {
  onBibleAlertChange?.(bibleAlertCount);
}, [bibleAlertCount, onBibleAlertChange]);
```

- [ ] **Step 4: `workspaceModeBar` 렌더 제거**

StoryXDesk 의 `const workspaceModeBar = (<WorkspaceModeBar .../>)`(~2139-2178)와 그 렌더 사용처를 제거. `titleSlot`/`rightSlot`/`overflowItems`/`planContext`(토글 배지용) 중 **셸로 이동하는 것**(제목 input·syncSlot·overflow)은 삭제, **하위 줄에 남는 것**(writeContext 회차 픽커·planContext 캐논/충돌 칩)은 DeskMetaLine 계열 하위 줄로 유지(현행 metaLeft/metaRightSlot 이미 존재).

> 정확히: `writeContext`(회차 픽커)와 `planContext`(캐논/충돌 칩)는 살린다. 이들을 DeskMetaLine 의 `metaLeft`/추가 슬롯으로 배치하거나 기존 위치 유지. `WorkspaceModeBar` 컴포넌트 인스턴스만 제거.

- [ ] **Step 5: import 정리 + tsc**

`WorkspaceModeBar`·`OverflowMenu` import 가 StoryXDesk 에서 더 안 쓰이면 제거(overflow 를 App 으로 옮기면 OverflowMenu 도). export/import 핸들러(`handleExportProject` 등)는 App 이 쓸 것이므로 다음 Task 에서 이동 — 이 단계에선 StoryXDesk 에 남겨두고 tsc 만 통과시킨다.

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(shell): StoryXDesk 제목 prop·bibleAlert 콜백 노출, 자체 바 제거"
```

---

### Task 7: App 공통 셸 렌더 + 배선

**Files:**
- Modify: `src/App.tsx` (editor 분기 ~367-389, dive 분기 bar ~446-458, state)

**배경:** App 이 editor·dive 두 stage 에서 동일한 `WorkspaceModeBar` 프레임을 렌더한다. 제목·studioView·bibleAlert 를 App state 로 소유.

- [ ] **Step 1: state 추가**

App 컴포넌트 상단(studioView 옆):

```tsx
const [workTitle, setWorkTitle] = useState<string>(() => loadProject().title);
const [bibleAlert, setBibleAlert] = useState<number>(0);
```

제목 편집 핸들러(storage 반영):

```tsx
function handleTitleChange(next: string) {
  setWorkTitle(next);
  const project = loadProject();
  saveProject({ ...project, title: next });
}
```

> remount(syncVersion) 후 `workTitle` 재동기화 — syncVersion 변화 effect 에서 `setWorkTitle(loadProject().title)` 를 호출하거나, StoryXDesk key 처럼 App 자체는 remount 안 되므로 `useEffect(() => setWorkTitle(loadProject().title), [syncVersion])` 추가.

- [ ] **Step 2: 공통 셸 노드 정의**

App 렌더 앞부분(syncConsoleNode 근처)에 셸 노드 구성:

```tsx
const overflowItems = [
  { id: 'publish', label: '출간', onSelect: () => setStage('publish') },
  { id: 'export', label: 'JSON 내보내기', onSelect: handleExportProject },
  { id: 'import', label: 'JSON 가져오기', onSelect: handleImportClick }
];
const shellBar = (
  <WorkspaceModeBar
    mode={workspaceMode}
    onSelect={selectWorkspaceMode}
    titleSlot={
      <input
        className="wm-title-input"
        aria-label="작품 제목"
        value={workTitle}
        onChange={(e) => handleTitleChange(e.target.value)}
        autoComplete="off"
        title="클릭해서 제목 편집"
      />
    }
    planDot={bibleAlert > 0}
    rightSlot={
      <>
        {syncConsoleNode}
        <OverflowMenu items={overflowItems}>
          <input ref={fileInputRef} type="file" accept="application/json,.json"
            onChange={handleImportFile} style={{ display: 'none' }} aria-hidden="true" />
        </OverflowMenu>
      </>
    }
  />
);
```

> `handleExportProject`/`handleImportClick`/`handleImportFile`/`fileInputRef` 를 StoryXDesk 에서 App 으로 **이동**(Task 6 Step 5 에서 남겨둔 것). storage 헬퍼(`exportAllData`/`importAllData`)는 이미 lib 이므로 App import 로 옮기면 됨.
> `WorkspaceModeBar`·`OverflowMenu` 를 App 에 import.

- [ ] **Step 3: editor 분기에서 셸 렌더 + StoryXDesk 배선**

editor 분기 교체:

```tsx
if (stage === 'editor') {
  return (
    <>
      {shellBar}
      <StoryXDesk
        key={syncVersion}
        initialMedium={medium}
        initialFormat={format}
        initialDraftPayload={pendingDraft}
        initialStudioView={studioView}
        studioView={studioView}
        title={workTitle}
        onTitleChange={handleTitleChange}
        onBibleAlertChange={setBibleAlert}
        onSelectPlayMode={() => selectWorkspaceMode('play')}
        onStudioViewChange={setStudioView}
        onOpenProjects={() => setStage('projects')}
        onOpenLanding={() => setStage('landing')}
        onOpenPublish={() => setStage('publish')}
        onPlanPatchesChange={setPendingPlan}
      />
      {reconcileDialog}
      {planApplyDialog}
      {syncFlashNode}
    </>
  );
}
```

> StoryXDesk 의 `syncSlot` prop 은 이제 셸이 담당하므로 전달 제거(StoryXDesk 에서도 syncSlot 사용부 제거 — Task 6 에서 바를 지웠으니 이미 미사용). 확인 후 정리.

- [ ] **Step 4: dive 분기 bar 를 shellBar 로 교체**

dive 분기의 `const bar = (<>...<WorkspaceModeBar .../>...</>)` 를 shellBar + 다이얼로그로 교체:

```tsx
const bar = (
  <>
    {shellBar}
    {reconcileDialog}
    {planApplyDialog}
    {syncFlashNode}
  </>
);
```

> dive 에서도 동일 `shellBar` 를 씀 → 제목 input·토글·싱크·오버플로가 세 모드 동일. workTitle 은 App state 라 dive 에서도 편집 가능(본편 title 반영).

- [ ] **Step 5: tsc + build**

```bash
npx tsc --noEmit && npm run build
```

Expected: 성공.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/StoryXDesk.tsx
git commit -m "feat(shell): App 이 세 모드 공통 wm-bar 셸 소유 — 제목·토글·싱크·오버플로"
```

---

### Task 8: `WorkspaceModeBar` planDot prop 추가

**Files:**
- Modify: `src/components/WorkspaceModeBar.tsx`
- Test: `src/components/workspaceModeBar.test.ts`

**배경:** 기존 `planBadge`(숫자) 대신 `planDot`(boolean) 을 PLAN 버튼에 점으로. 기존 planBadge 사용처는 App 셸로 이관됐으므로 planBadge 는 남기되(하위호환) planDot 를 신규 추가.

- [ ] **Step 1: Write the failing test**

`workspaceModeBar.test.ts` 에 추가:

```ts
it('planDot 이 true 면 PLAN 버튼에 dot 마커를 렌더한다', () => {
  const html = renderToStaticMarkup(
    <WorkspaceModeBar mode="write" onSelect={() => {}} planDot />
  );
  expect(html).toContain('wm-plan-dot');
});

it('planDot 이 false/미지정이면 dot 없음', () => {
  const html = renderToStaticMarkup(<WorkspaceModeBar mode="write" onSelect={() => {}} />);
  expect(html).not.toContain('wm-plan-dot');
});
```

> 기존 테스트의 import/렌더 패턴(renderToStaticMarkup 등)을 따를 것 — 파일 상단 확인.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/workspaceModeBar.test.ts`
Expected: FAIL — `wm-plan-dot` not found.

- [ ] **Step 3: Implement**

`WorkspaceModeBar.tsx` props 에 `planDot?: boolean` 추가. PLAN 버튼 렌더에서 `planDot` 이 true 면 `<span className="wm-plan-dot" aria-hidden="true" />` 를 버튼 안에 추가. (기존 `planBadge` 로직은 유지.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/workspaceModeBar.test.ts`
Expected: PASS.

- [ ] **Step 5: CSS**

`src/styles.css` 에 `.wm-plan-dot` 추가 — PLAN 버튼 상단 우측 작은 점(다크 토큰 사용, 예: `background: var(--sx-warning, #f59e0b)`; 6px 원). 기존 `wm-conflict-chip` 색 토큰 참고.

- [ ] **Step 6: Commit**

```bash
git add src/components/WorkspaceModeBar.tsx src/components/workspaceModeBar.test.ts src/styles.css
git commit -m "feat(shell): WorkspaceModeBar planDot — PLAN 충돌 유무 점 배지"
```

---

### Task 9: 전체 테스트 + 파트 2 라이브 검증

**Files:** 검증 + progress.md/session-handoff.md.

- [ ] **Step 1: 전체 테스트 + build + init**

```bash
npm test && npm run build && bash init.sh
```

Expected: 전부 녹색. 실패 시 관련 테스트(editorFocusLayout·floatingEditor 등이 옛 바 마크업을 단언하면 교정 — 제목 input 이 셸로 이동했으므로 해당 단언 갱신).

- [ ] **Step 2: 라이브 게이트 (preview 5175)**

1. PLAY↔WRITE↔PLAN 전환 시 브랜드·제목 input·토글·싱크가 **같은 자리 고정**(preview_inspect 로 wm-title-input·토글 bounding box 전후 동일 확인).
2. WRITE↔PLAN 전환에 DOM 마커 생존(remount 없음 — 예: 편집 중 텍스트가 PLAN 갔다 와도 유지).
3. 제목을 dive 에서 편집 → editor 복귀 시 반영, 새로고침 후 지속.
4. PLAN 에 충돌 심기 → 다른 모드(WRITE/PLAY) 토글의 PLAN 버튼에 dot, PLAN 하위 줄 `⚠ 충돌 N` 칩.
5. ⋯ 오버플로 출간·내보내기·가져오기 동작.
6. 좁은 뷰포트(~620px) 에서 셸·하위 줄 비충돌.
7. fresh reload 콘솔 0.

- [ ] **Step 3: 발견 이슈 수정**

라이브에서 깨진 것(색·위치·remount)은 소스 수정 후 Step 1~2 재실행.

- [ ] **Step 4: progress.md + session-handoff.md 갱신**

progress.md 활성 트랙 done(증거·라이브 게이트), session-handoff.md 맨 위 새 인계(손대지 말 것 불변식 — App key=syncVersion·제목 App 단일 소유·activeTrack controlled·planDot 콜백).

```bash
git add progress.md session-handoff.md && git commit -m "docs: PLAY 진입 융합 + 공통 셸 done 기록"
```

---

## Self-Review 결과 (작성자 확인)

- **Spec 커버리지:** 설계1(seedPlayFromProject·본편 덮어쓰기 제거·인테이크 제거) = Task 1~4. 설계2(공통 셸·controlled activeTrack·제목 단일 소유·planDot 콜백·오버플로 이동) = Task 5~9. 비목표(DiveStart 보존·온보딩 갈래·랜딩 원페이저) = 코드에서 삭제 안 함/후속 명시. ✅
- **Placeholder:** 없음 — 모든 코드 스텝에 실제 코드. bibleAlert 는 콜백 방식으로 확정(순수 추출 폐기, 스펙과 일치).
- **타입 일관성:** `studioView: 'editor'|'data'`·`DeskTrack: 'draft'|'bible'` 매핑 일관. `seedPlayFromProject → DiveState`·`schema 'storyx/dive/v1'` (Task 2 주의문에서 실제 값 확인 지시). `title ?? project.title` 일관. `planDot: boolean`·`onBibleAlertChange: (count:number)=>void` 일관.
- **위험 지점:** Task 3 의 렌더 중 setState → effect 로 이동(Step 3). Task 9 Step 1 의 기존 바 마크업 단언 테스트 교정 필요성 명시.
