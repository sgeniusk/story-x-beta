# 데이터 모드 floating화 (Phase 2c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데이터 모드(`activeTrack === 'bible'`)를 FloatingEditor의 "떠 있는 작업실" 셸 언어로 재구성한다 — 진입 첫인상은 정제 보드(지표·검토 요약), raw 세부는 파고들기.

**Architecture:** FloatingEditor를 건드리지 않고 형제 컴포넌트 `FloatingDataWorkspace`를 신설한다. 같은 `.fc-*` CSS 셸을 공유한다. 중앙 세부(canon/bible)는 `centerSlot: ReactNode`로 StoryXDesk가 주입해 props 폭증을 막고, board(정제 보드)만 컴포넌트가 직접 렌더한다. `StoryXDesk`는 `isDraftMode` early return을 미러해 `isBibleMode` early return을 추가한다.

**Tech Stack:** React 18 · TypeScript · Vite · Vitest(jsdom) · react-dom/client. 테스트는 `src/components/floatingEditor.test.ts`의 mount 패턴, 배선은 `src/editorFocusLayout.test.ts`의 source-string 패턴.

---

## File Structure

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/lib/canonDataView.ts` | `DataView`에 `{ kind: 'board' }` 추가 | Modify |
| `src/components/FloatingDataWorkspace.tsx` | floating 데이터 작업실 — 셸·topbar·독·board·패널 | Create |
| `src/components/floatingDataWorkspace.test.ts` | 컴포넌트 렌더·콜백 검증 | Create |
| `src/StoryXDesk.tsx` | `floatingDataProps` + `centerSlot` + `isBibleMode` early return + board 리셋 | Modify |
| `src/editorFocusLayout.test.ts` | 배선 단언 추가(early return·DataView board) | Modify |
| `src/styles.css` | `.fc-data-*` (정제 보드·검토 요약·breadcrumb) | Modify |
| `progress.md` · `session-handoff.md` | 상태 갱신 | Modify |

참조 모델 — 마크업과 `.fc-*` 클래스는 `src/components/FloatingEditor.tsx`(topbar 333~381 · 독 455~516 · 패널 519~734 · scrim 858)를 그대로 차용한다.

---

## Task 1: DataView에 board 종류 추가

**Files:**
- Modify: `src/lib/canonDataView.ts:10-12`
- Test: `src/editorFocusLayout.test.ts` (P3 describe 블록 내 신규 it)

- [ ] **Step 1: 실패 테스트 작성**

`src/editorFocusLayout.test.ts`의 마지막 `it`(443줄 `})` 직전)에 추가:

```ts
  it('Phase 2c — DataView 에 board(정제 보드) 종류를 추가한다', () => {
    expect(canonDataView).toContain("kind: 'board'");
    // board 는 category/section 없는 단독 종류
    expect(canonDataView).toMatch(/\|\s*\{\s*kind:\s*'board'\s*\}/);
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "board"`
Expected: FAIL — `canonDataView` 소스에 `kind: 'board'` 없음.

- [ ] **Step 3: 타입 추가**

`src/lib/canonDataView.ts`의 `DataView`(10~12줄)를 교체:

```ts
// 데이터 모드 가운데 캔버스에 무엇을 띄울지 — 정제 보드 / 캐논 분야 5종 / 바이블 작업장.
export type DataView =
  | { kind: 'board' }
  | { kind: 'canon'; category: CanonCategory }
  | { kind: 'bible'; section: BibleSection };
```

- [ ] **Step 4: 통과 확인 + 전체 회귀**

Run: `npx vitest run src/editorFocusLayout.test.ts`
Expected: PASS (신규 + 기존 모두). 기존 헬퍼(`getCategoryEntities`·`categoryCount`)는 `category` 인자라 board 무관.

- [ ] **Step 5: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 통과. (옛 3컬럼은 `dataView.kind === 'canon'`/else 분기라 board 미도달 — 컴파일 영향 없음. 만약 `switch (dataView.kind)` exhaustive 에러가 나면 해당 위치에 `case 'board': return null;` 추가.)

- [ ] **Step 6: 커밋**

```bash
git add src/lib/canonDataView.ts src/editorFocusLayout.test.ts
git commit -m "feat(2c): DataView 에 board(정제 보드) 종류 추가"
```

---

## Task 2: FloatingDataWorkspace 컴포넌트

floating 셸(어두운 캔버스 + topbar + 좌측 독 + 떠오르는 패널) 위에 데이터를 올린다. board는 자체 렌더, canon/bible 세부는 `centerSlot`으로 주입받는다.

**Files:**
- Create: `src/components/FloatingDataWorkspace.tsx`
- Test: `src/components/floatingDataWorkspace.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/floatingDataWorkspace.test.ts` 신설. mount 패턴은 `floatingEditor.test.ts`(66~78)와 동일:

```ts
// FloatingDataWorkspace 가 props 의 실데이터로 정제 보드·독·콜백을 렌더하는지 검증.
import { describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingDataWorkspace, type FloatingDataWorkspaceProps } from './FloatingDataWorkspace';
import type { StudioMetrics } from '../lib/studioMetrics';
import type { SeriesProject } from '../lib/storyEngine';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const metrics = {
  harness: { lead: '95/100', tone: 'warn', sub: '보강 필요', layers: [{ name: '진단', pass: true }] },
  quality: { lead: '2/7', tone: 'warn', sub: '강제 실패 5', gates: [{ key: 'hook_first_300', pass: false }] },
  media: { lead: '소설 100%', tone: 'good', sub: '6개 매체', axis: 0.5, projections: [{ medium: '소설', fit: 100, current: true }] },
  ontology: { lead: '중심 질문 있음', tone: 'good', sub: '1개 미해결', entities: [{ kind: '인물', count: 2 }], threads: 1 },
} as unknown as StudioMetrics;

const project = {
  characters: [{ id: 'c1' }, { id: 'c2' }],
  places: [], objects: [], events: [], timeline: [],
  canonFacts: [{ id: 'k1' }], chapters: [], bibleOutline: [],
} as unknown as SeriesProject;

function baseProps(over: Partial<FloatingDataWorkspaceProps> = {}): FloatingDataWorkspaceProps {
  return {
    title: '샘플 작품',
    episodeLabel: '데이터 · 캐논 1',
    onSwitchTrack: vi.fn(),
    onOpenPublish: vi.fn(),
    dataView: { kind: 'board' },
    onSelectCategory: vi.fn(),
    onSelectBibleSection: vi.fn(),
    onShowBoard: vi.fn(),
    metrics,
    onMediaAxisChange: vi.fn(),
    canonHealth: 62,
    dataReviewResults: {},
    project,
    latestChapter: null,
    isSerial: true,
    approvalQueue: { items: [], summary: { total: 0 } } as never,
    dataReviewingCategory: null,
    onRequestReview: vi.fn(),
    onOpenApprovalQueue: vi.fn(),
    centerSlot: null,
    ...over,
  };
}

function mount(props: FloatingDataWorkspaceProps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(FloatingDataWorkspace, props)); });
  return {
    host,
    unmount: () => { act(() => root.unmount()); host.remove(); },
    click: (el: Element | null) => act(() => { el?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }),
  };
}

describe('FloatingDataWorkspace', () => {
  it('board 기본일 때 정제 보드(지표 + 검토 요약)를 중앙에 렌더한다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.fc-app')).not.toBeNull();
    expect(host.querySelector('.fc-data-board')).not.toBeNull();
    expect(host.textContent).toContain('하니스');       // DataPanel 재사용
    expect(host.textContent).toContain('95/100');
    unmount();
  });

  it('데이터 탭이 활성이고 편집 탭이 onSwitchTrack(draft) 를 호출한다', () => {
    const onSwitchTrack = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSwitchTrack }));
    const editTab = Array.from(host.querySelectorAll('[role="tab"]')).find((t) => t.textContent?.includes('편집'));
    click(editTab ?? null);
    expect(onSwitchTrack).toHaveBeenCalledWith('draft');
    unmount();
  });

  it('출간 버튼이 onOpenPublish 를 호출한다', () => {
    const onOpenPublish = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onOpenPublish }));
    click(host.querySelector('.btn-publish'));
    expect(onOpenPublish).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('지표 독 버튼이 지표 패널(DataPanel)을 연다', () => {
    const { host, click, unmount } = mount(baseProps());
    const btn = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('지표'));
    click(btn ?? null);
    expect(host.querySelector('#fc-pd-metrics')?.classList.contains('show')).toBe(true);
    unmount();
  });

  it('캐논 패널에서 분야를 고르면 onSelectCategory 를 호출한다', () => {
    const onSelectCategory = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSelectCategory }));
    const canonBtn = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('캐논'));
    click(canonBtn ?? null);
    const navItem = host.querySelector('#fc-pd-canon .ex-canon-nav-item');
    click(navItem ?? null);
    expect(onSelectCategory).toHaveBeenCalled();
    unmount();
  });

  it('바이블 패널에서 진입점을 고르면 onSelectBibleSection 을 호출한다', () => {
    const onSelectBibleSection = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSelectBibleSection }));
    const bibleBtn = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('바이블'));
    click(bibleBtn ?? null);
    const entry = host.querySelector('#fc-pd-bible .fc-pd-bible-item');
    click(entry ?? null);
    expect(onSelectBibleSection).toHaveBeenCalled();
    unmount();
  });

  it('canon 뷰일 때 centerSlot 을 렌더하고 breadcrumb 이 onShowBoard 를 호출한다', () => {
    const onShowBoard = vi.fn();
    const { host, click, unmount } = mount(baseProps({
      dataView: { kind: 'canon', category: 'characters' },
      centerSlot: createElement('div', { 'data-testid': 'slot' }, '인물 관계도'),
      onShowBoard,
    }));
    expect(host.querySelector('[data-testid="slot"]')).not.toBeNull();
    expect(host.querySelector('.fc-data-board')).toBeNull();   // board 아님
    click(host.querySelector('.fc-data-crumb-board'));
    expect(onShowBoard).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('검토 요약이 분야 5종을 한 줄씩 보여주고 누르면 onSelectCategory 를 호출한다', () => {
    const onSelectCategory = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSelectCategory }));
    const rows = host.querySelectorAll('.fc-data-review-row');
    expect(rows.length).toBe(5);   // 인물·장소·사물·사건·시간선
    click(rows[0]);
    expect(onSelectCategory).toHaveBeenCalled();
    unmount();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/floatingDataWorkspace.test.ts`
Expected: FAIL — `FloatingDataWorkspace` 모듈 없음.

- [ ] **Step 3: 컴포넌트 구현**

`src/components/FloatingDataWorkspace.tsx` 신설. 한 줄 헤더 + 아래 구조. **마크업의 `.fc-*` 클래스(topbar·canvas·deck·docks·dock·tool·panel·ph·pb·scrim)는 FloatingEditor.tsx 를 그대로 차용**한다.

```tsx
// 데이터 모드 "떠 있는 작업실" — FloatingEditor 셸 언어를 캐논/바이블에 적용. board=정제 보드, canon/bible=centerSlot 주입.
import { useCallback, useState, type ReactNode } from 'react';
import type { Chapter, SeriesProject } from '../lib/storyEngine';
import type { MemoryApprovalQueue } from '../lib/memoryBank';
import type { StudioMetrics } from '../lib/studioMetrics';
import { DataPanel } from './DataPanel';
import { CanonNav } from './CanonNav';
import { WorkStateGrid } from './WorkStateGrid';
import { DataReviewRail } from './DataReviewRail';
import {
  canonCategories, categoryCount, type CanonCategory, type DataView,
  type BibleSection, type DataReviewView,
} from '../lib/canonDataView';

export interface FloatingDataWorkspaceProps {
  title: string;
  episodeLabel: string;
  onSwitchTrack: (track: 'draft' | 'bible') => void;
  onOpenPublish?: () => void;
  dataView: DataView;
  onSelectCategory: (c: CanonCategory) => void;
  onSelectBibleSection: (s: BibleSection) => void;
  onShowBoard: () => void;
  metrics: StudioMetrics;
  onMediaAxisChange?: (axis: number) => void;
  canonHealth: number;
  dataReviewResults: Partial<Record<CanonCategory, DataReviewView>>;
  project: SeriesProject;
  latestChapter: Chapter | null;
  isSerial: boolean;
  approvalQueue: MemoryApprovalQueue;
  dataReviewingCategory: CanonCategory | null;
  onRequestReview: (c: CanonCategory) => void;
  onOpenApprovalQueue: () => void;
  centerSlot: ReactNode;
}

const BIBLE_ENTRIES: Array<{ id: BibleSection; label: string }> = [
  { id: 'overview', label: '작품 계약' },
  { id: 'canon', label: '캐논 원장' },
  { id: 'voice', label: '문체 바이블' },
  { id: 'approval', label: '승인 대기' },
];

type DataPanelId = 'metrics' | 'review' | 'canon' | 'bible' | 'state';

export function FloatingDataWorkspace(props: FloatingDataWorkspaceProps) {
  const { dataView } = props;
  const [openPanel, setOpenPanel] = useState<DataPanelId | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [reviewCat, setReviewCat] = useState<CanonCategory>('characters');

  const togglePanel = useCallback((id: DataPanelId) => setOpenPanel((cur) => (cur === id ? null : id)), []);
  const closeAll = useCallback(() => setOpenPanel(null), []);
  const activeCategory = dataView.kind === 'canon' ? dataView.category : null;
  const isBoard = dataView.kind === 'board';
  const scrimShown = openPanel !== null;

  // 검토 요약 — 분야 5종 각각 검토됨/미검토 · 정합/제안 수
  const reviewRow = (cat: CanonCategory) => {
    const r = props.dataReviewResults[cat];
    const ok = r ? r.notes.filter((n) => n.kind === '정합').length : 0;
    const sug = r ? r.notes.filter((n) => n.kind === '제안').length : 0;
    return { label: canonCategories.find((c) => c.id === cat)?.label ?? cat, reviewed: !!r, ok, sug };
  };

  return (
    <div className={`fc-app fc-data${isFocus ? ' focus' : ''}`} id="fc-data-app">
      {/* topbar — FloatingEditor 333~381 차용, 데이터 탭 활성 */}
      <header className="topbar">
        <div className="brand">X</div>
        <div className="doc-id">
          <span className="title">{props.title}</span>
          <span className="sep">›</span>
          <span className="ep"><b>{props.episodeLabel}</b></span>
        </div>
        <div className="saved"><span className="dot" /><span className="word">저장됨</span></div>
        <div className="vr" />
        <div className="modes" role="tablist">
          <button role="tab" aria-selected="false" onClick={() => props.onSwitchTrack('draft')}>편집</button>
          <button role="tab" aria-selected="true">데이터</button>
        </div>
        <div className="vr" />
        <button className="btn-publish" onClick={() => props.onOpenPublish?.()} title="출간">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v13m0-13 4 4m-4-4-4 4M5 21h14" /></svg>
          <span>출간</span>
        </button>
      </header>
      <button className="exitfocus" onClick={() => setIsFocus(false)}>집중 모드 끝내기 · Esc</button>

      {/* canvas — board 자체 렌더 / canon·bible 은 centerSlot 주입 */}
      <div className="canvas" id="fc-data-canvas">
        <div className="deck">
          {isBoard ? (
            <section className="fc-data-board" aria-label="작품 현황 보드">
              <header className="fc-data-board-head">
                <h1>작품 현황</h1>
                <p>지표와 검토 요약만 정제해 보여줍니다. 세부는 왼쪽 도구로 파고드세요.</p>
              </header>
              <div className="fc-data-board-metrics">
                <DataPanel metrics={props.metrics} onMediaAxisChange={props.onMediaAxisChange} />
              </div>
              <div className="fc-data-board-reviews">
                <h2>분야별 검토</h2>
                {canonCategories.map((cat) => {
                  const row = reviewRow(cat.id);
                  return (
                    <button key={cat.id} type="button" className="fc-data-review-row"
                      onClick={() => props.onSelectCategory(cat.id)}>
                      <span className="nm">{row.label}</span>
                      <span className="st">{row.reviewed ? `정합 ${row.ok} · 제안 ${row.sug}` : '미검토'}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="fc-data-detail" aria-label="데이터 세부">
              <button type="button" className="fc-data-crumb-board" onClick={props.onShowBoard}>← 현황 보드</button>
              {props.centerSlot}
            </section>
          )}
        </div>
      </div>

      {/* floating dock — 지표·검토·(구분)·캐논·바이블·상태·집중 */}
      <div className="docks" aria-label="데이터 도구">
        <nav className="dock left" aria-label="데이터 도구">
          <button className={`tool${openPanel === 'metrics' ? ' on' : ''}`} onClick={() => togglePanel('metrics')} title="지표">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
            <span className="t">지표</span>
          </button>
          <button className={`tool${openPanel === 'review' ? ' on' : ''}`} onClick={() => togglePanel('review')} title="검토">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            <span className="t">검토</span>
          </button>
          <div className="sep" />
          <button className={`tool${openPanel === 'canon' ? ' on' : ''}`} onClick={() => togglePanel('canon')} title="캐논">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            <span className="t">캐논</span>
          </button>
          <button className={`tool${openPanel === 'bible' ? ' on' : ''}`} onClick={() => togglePanel('bible')} title="바이블">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
            <span className="t">바이블</span>
          </button>
          <button className={`tool${openPanel === 'state' ? ' on' : ''}`} onClick={() => togglePanel('state')} title="상태">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3v18h18M7 14l3-4 4 3 5-7" /></svg>
            <span className="t">상태</span>
          </button>
          <button className="tool" onClick={() => setIsFocus((f) => !f)} title="집중 모드">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></svg>
            <span className="t">집중</span>
          </button>
        </nav>
      </div>

      {/* panels — FloatingEditor 패널 마크업(.panel/.ph/.pb) 차용 */}
      <div className={`panel${openPanel === 'metrics' ? ' show' : ''}`} id="fc-pd-metrics">
        <div className="ph"><h4>작품 지표</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb"><DataPanel metrics={props.metrics} onMediaAxisChange={props.onMediaAxisChange} /></div>
      </div>

      <div className={`panel${openPanel === 'review' ? ' show' : ''}`} id="fc-pd-review">
        <div className="ph"><h4>데이터 검토</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <div className="fc-pd-review-cats">
            {canonCategories.map((cat) => (
              <button key={cat.id} type="button"
                className={`fc-pd-cat${reviewCat === cat.id ? ' on' : ''}`}
                onClick={() => setReviewCat(cat.id)}>{cat.label}</button>
            ))}
          </div>
          <DataReviewRail
            category={reviewCat}
            review={props.dataReviewResults[reviewCat] ?? null}
            isReviewing={props.dataReviewingCategory === reviewCat}
            onRequestReview={() => props.onRequestReview(reviewCat)}
            onOpenApprovalQueue={props.onOpenApprovalQueue}
          />
        </div>
      </div>

      <div className={`panel${openPanel === 'canon' ? ' show' : ''}`} id="fc-pd-canon">
        <div className="ph"><h4>캐논 분야</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <CanonNav project={props.project} activeCategory={activeCategory}
            onSelectCategory={(c) => { props.onSelectCategory(c); closeAll(); }} />
        </div>
      </div>

      <div className={`panel${openPanel === 'bible' ? ' show' : ''}`} id="fc-pd-bible">
        <div className="ph"><h4>작품 데이터</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          {BIBLE_ENTRIES.map((entry) => (
            <button key={entry.id} type="button" className="fc-pd-bible-item"
              onClick={() => { props.onSelectBibleSection(entry.id); closeAll(); }}>
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`panel${openPanel === 'state' ? ' show' : ''}`} id="fc-pd-state">
        <div className="ph"><h4>작품 상태</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <WorkStateGrid project={props.project} latestChapter={props.latestChapter} isSerial={props.isSerial} />
          <div className="fc-pd-health">
            <span>캐논 건강도</span>
            <span className="track"><i style={{ width: `${props.canonHealth}%` }} /></span>
            <span>{props.canonHealth}%</span>
          </div>
        </div>
      </div>

      <div className={`scrim${scrimShown ? ' show' : ''}`} onClick={closeAll} />
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/floatingDataWorkspace.test.ts`
Expected: PASS (8 케이스). DataReviewView 의 `notes[].kind`('정합'|'제안')는 `dataReviewClient`에서 온다 — `reviewRow` 가 안전하게 0 처리.

- [ ] **Step 5: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 통과. (import 한 `DataReviewView`는 `canonDataView.ts`에서 re-export 됨 — 23줄.)

- [ ] **Step 6: 커밋**

```bash
git add src/components/FloatingDataWorkspace.tsx src/components/floatingDataWorkspace.test.ts
git commit -m "feat(2c): FloatingDataWorkspace — 정제 보드·독·패널 floating 데이터 작업실"
```

---

## Task 3: StoryXDesk 배선

`floatingDataProps` useMemo + `centerSlot` + `isBibleMode` early return + 데이터 진입 시 board 리셋.

**Files:**
- Modify: `src/StoryXDesk.tsx` (import · `switchToTrack` · `floatingDataProps` 신설 · early return)
- Test: `src/editorFocusLayout.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/editorFocusLayout.test.ts`의 board 테스트(Task 1) 아래에 추가:

```ts
  it('Phase 2c — isBibleMode 일 때 FloatingDataWorkspace 를 early-return 으로 렌더한다', () => {
    expect(desk).toContain('<FloatingDataWorkspace');
    expect(desk).toContain('if (isBibleMode)');
    // 데이터 진입 시 정제 보드로 리셋
    expect(desk).toContain("setDataView({ kind: 'board' })");
    // 중앙 세부는 centerSlot 으로 주입
    expect(desk).toContain('centerSlot=');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "FloatingDataWorkspace"`
Expected: FAIL.

- [ ] **Step 3: import 추가**

`src/StoryXDesk.tsx` 상단 import 블록(FloatingEditor import 68줄 근처)에 추가:

```ts
import { FloatingDataWorkspace } from './components/FloatingDataWorkspace';
```

- [ ] **Step 4: 데이터 진입 시 board 리셋**

`switchToTrack`(2004~2013)을 교체 — bible 로 갈 때 정제 보드로 리셋:

```ts
  function switchToTrack(nextTrack: DeskTrack) {
    if (nextTrack === activeTrack && !isPublishingMode) {
      return;
    }
    runWithWorkbenchFade(() => {
      setActiveTrack(nextTrack);
      setIsPublishingMode(false);
      setIsMediaPanelOpen(false);
      if (nextTrack === 'bible') {
        setDataView({ kind: 'board' });
      }
    });
  }
```

- [ ] **Step 5: floatingDataProps + centerSlot + early return**

`isDraftMode` early return 블록(2034~2036) 바로 뒤에 추가:

```ts
  if (isDraftMode) {
    return <FloatingEditor {...floatingEditorProps} />;
  }

  if (isBibleMode) {
    const centerSlot =
      dataView.kind === 'canon' ? (
        <CanonCanvas
          category={dataView.category}
          project={project}
          onUpdateCharacter={updateCharacterMemory}
          onOpenBibleSection={openBibleSection}
        />
      ) : dataView.kind === 'bible' ? (
        <MemoryBankStudio
          project={project}
          bank={memoryBank}
          activeSection={dataView.section}
          onUpdateCharacter={updateCharacterMemory}
          onUpdateWorldRule={updateWorldMemory}
          onUpdateCanon={updateCanonMemory}
          onUpdateProject={updateProject}
          onUpdateCreativeWeight={updateCreativeWeight}
          approvalQueue={approvalQueue}
          approvalDecisions={approvalDecisions}
          onSetApprovalDecision={setApprovalDecision}
          onUpdateApprovalStatement={updateApprovalStatement}
          onSyncApprovedMemory={syncApprovedMemory}
          onRequestReview={requestBibleReview}
          canonChanges={canonChanges}
          canonRefactorPlan={canonRefactorPlan}
          onClearCanonChanges={() => setCanonChanges([])}
        />
      ) : null;
    return (
      <FloatingDataWorkspace
        title={project.title}
        episodeLabel={`데이터 · 캐논 ${project.canonFacts.length}`}
        onSwitchTrack={(track) => switchToTrack(track)}
        onOpenPublish={openPublishingMode}
        dataView={dataView}
        onSelectCategory={(category) => setDataView({ kind: 'canon', category })}
        onSelectBibleSection={openBibleSection}
        onShowBoard={() => setDataView({ kind: 'board' })}
        metrics={studioMetrics}
        onMediaAxisChange={updateStoryModeAxis}
        canonHealth={canonHealth}
        dataReviewResults={dataReviewResults}
        project={project}
        latestChapter={latestChapter}
        isSerial={isSerial}
        approvalQueue={approvalQueue}
        dataReviewingCategory={dataReviewingCategory}
        onRequestReview={runDataReview}
        onOpenApprovalQueue={() => openBibleSection('approval')}
        centerSlot={centerSlot}
      />
    );
  }
```

> 모든 식별자(`updateCharacterMemory`·`updateWorldMemory`·`updateCanonMemory`·`updateProject`·`updateCreativeWeight`·`setApprovalDecision`·`updateApprovalStatement`·`syncApprovedMemory`·`requestBibleReview`·`canonChanges`·`canonRefactorPlan`·`memoryBank`·`canonHealth`·`dataReviewResults`·`dataReviewingCategory`·`runDataReview`·`isSerial`·`latestChapter`)는 StoryXDesk 안에 이미 정의돼 있다(2497~2538 옛 3컬럼에서 동일하게 호출 중). 새 식별자 없음.

- [ ] **Step 6: 통과 + 회귀 확인**

Run: `npx vitest run src/editorFocusLayout.test.ts`
Expected: PASS. 옛 3컬럼 JSX(2431~2550)는 소스에 남아 P3 source-string 단언 보존. early return 으로 도달만 안 됨.

- [ ] **Step 7: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 통과.

- [ ] **Step 8: 커밋**

```bash
git add src/StoryXDesk.tsx src/editorFocusLayout.test.ts
git commit -m "feat(2c): StoryXDesk isBibleMode → FloatingDataWorkspace 배선 + board 리셋"
```

---

## Task 4: CSS — .fc-data-*

floating 셸(`.fc-*`)은 재사용하므로 데이터 전용 스타일만 추가한다.

**Files:**
- Modify: `src/styles.css` (`.fc-app` 블록 끝 ~10998 이후)
- Test: `src/editorFocusLayout.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/editorFocusLayout.test.ts`의 Phase 2c 배선 테스트 아래에 추가:

```ts
  it('Phase 2c — floating 데이터 작업실 전용 CSS 가 있다', () => {
    expect(css).toContain('.fc-data');
    expect(css).toContain('.fc-data-board');
    expect(css).toContain('.fc-data-review-row');
    expect(css).toContain('.fc-data-crumb-board');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "데이터 작업실 전용 CSS"`
Expected: FAIL.

- [ ] **Step 3: CSS 추가**

`src/styles.css`의 `.fc-app` 미디어쿼리 블록 끝(10998줄 `.fc-app .detail{...}` 다음 줄, 닫는 `}` 뒤)에 추가. `.fc-data` 는 `.fc-app` 스코프 안이므로 전역 토큰 누수 없음:

```css
/* Phase 2c — floating 데이터 작업실. .fc-* 셸을 공유하고 데이터 전용만 정의. */
.fc-data .canvas{padding:32px 24px 96px}
.fc-data-board{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
.fc-data-board-head h1{font-size:24px;font-weight:650;color:var(--paper)}
.fc-data-board-head p{margin-top:6px;color:var(--ink-soft);font-size:13px}
.fc-data-board-reviews h2{font-size:13px;color:var(--ink-soft);margin-bottom:8px;font-weight:600}
.fc-data-review-row{display:flex;justify-content:space-between;align-items:center;width:100%;
  padding:11px 14px;border-radius:10px;background:var(--card);border:1px solid var(--line);
  margin-bottom:6px;text-align:left;transition:background .15s}
.fc-data-review-row:hover{background:var(--card-hi)}
.fc-data-review-row .nm{font-size:13px;color:var(--paper)}
.fc-data-review-row .st{font-size:12px;color:var(--ink-soft)}
.fc-data-detail{display:flex;flex-direction:column;gap:14px}
.fc-data-crumb-board{align-self:flex-start;font-size:12px;color:var(--ink-soft);
  padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:var(--card)}
.fc-data-crumb-board:hover{background:var(--card-hi);color:var(--paper)}
.fc-pd-review-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.fc-pd-cat{padding:6px 11px;border-radius:8px;font-size:12px;background:var(--card);
  border:1px solid var(--line);color:var(--ink-soft)}
.fc-pd-cat.on{background:var(--accent);color:var(--bg);border-color:transparent}
.fc-pd-bible-item{display:block;width:100%;text-align:left;padding:11px 14px;border-radius:10px;
  background:var(--card);border:1px solid var(--line);color:var(--paper);font-size:13px;margin-bottom:6px}
.fc-pd-bible-item:hover{background:var(--card-hi)}
.fc-pd-health{display:flex;align-items:center;gap:8px;margin-top:14px;font-size:12px;color:var(--ink-soft)}
.fc-pd-health .track{flex:1;height:5px;border-radius:3px;background:var(--line);overflow:hidden}
.fc-pd-health .track i{display:block;height:100%;background:var(--accent)}
```

> `--paper`·`--ink-soft`·`--card`·`--card-hi`·`--line`·`--accent`·`--bg` 는 `.fc-app`(10781~)에 이미 정의된 셸 변수다. 없는 변수면 `.fc-app` 정의를 확인해 가장 가까운 것으로 맞춘다(예: `--card-hi` 부재 시 `color-mix(in oklch,var(--card) 70%,var(--paper) 8%)`).

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "데이터 작업실 전용 CSS"`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/styles.css src/editorFocusLayout.test.ts
git commit -m "feat(2c): floating 데이터 작업실 .fc-data-* 스타일"
```

---

## Task 5: 라이브 검증 + 캡처 + 문서

**Files:**
- Modify: `progress.md` · `session-handoff.md`
- Capture: `docs/handoff/screenshots/floating-phase2c/`

- [ ] **Step 1: 전체 게이트**

Run: `bash init.sh`
Expected: tsc · vitest(신규 포함) · build 전부 통과.

- [ ] **Step 2: dev 서버 + Playwright 라이브 검증**

dev 서버를 띄우고(또는 preview 도구) `?stage=editor` 진입 → 상단 "데이터" 탭 클릭. 확인 항목:
- 정제 보드 첫인상(지표 카드 + 분야별 검토 5줄), raw 엔티티 없음.
- 독 지표/검토/캐논/바이블/상태 패널 토글.
- 캐논 패널 → "인물" 선택 → 중앙 관계도(CanonCanvas) 파고들기 → "← 현황 보드" 복귀.
- 콘솔 0. 1440 + 360 모바일 독/패널 뷰포트 내.

캡처를 `docs/handoff/screenshots/floating-phase2c/`에 저장(01-board-1440 · 02-canon-detail · 03-mobile-360).

- [ ] **Step 3: progress.md · session-handoff.md 갱신**

`progress.md` "병행 트랙 — 편집기 재설계" 절의 "남은 단계 — 2c~2e"에서 2c 완료 표기 + "최근 검증" 갱신. `session-handoff.md` 맨 위에 새 인계 노트(한 일·손대지 말 것·다음 2d/2f).

- [ ] **Step 4: 커밋**

```bash
git add progress.md session-handoff.md docs/handoff/screenshots/floating-phase2c
git commit -m "docs(2c): 데이터 floating화 라이브 검증 + 상태 갱신"
```

---

## Self-Review

**1. Spec coverage**
- 정제 보드 기본(지표·검토 요약) → Task 2 Step 3 `fc-data-board`. ✓
- 세부 숨김(파고들기) → Task 2 centerSlot + breadcrumb, Task 3 dataView 분기. ✓
- 떠오르는 패널(고정 레일 없음) → Task 2 독 6버튼 + `.panel`. ✓
- DataView board → Task 1. ✓
- isBibleMode early return 미러 → Task 3. ✓
- 데이터 컴포넌트 재사용(DataPanel·CanonCanvas·MemoryBankStudio·DataReviewRail·CanonNav·WorkStateGrid) → Task 2·3. ✓
- 옛 3컬럼 보존(2f 후속) → Task 3 Step 6 명시. ✓
- 테스트 3묶음(canonDataView·floatingDataWorkspace·editorFocusLayout) → Task 1·2·3·4. ✓
- CSS `.fc-data-*` → Task 4. ✓
- 라이브 캡처 → Task 5. ✓

**2. Placeholder scan** — 모든 코드 step에 실제 코드. "적절히"·"TODO" 없음. ✓

**3. Type consistency**
- `FloatingDataWorkspaceProps` 필드(Task 2 정의)가 Task 3 호출부와 일치 — title·episodeLabel·onSwitchTrack·onOpenPublish·dataView·onSelectCategory·onSelectBibleSection·onShowBoard·metrics·onMediaAxisChange·canonHealth·dataReviewResults·project·latestChapter·isSerial·approvalQueue·dataReviewingCategory·onRequestReview·onOpenApprovalQueue·centerSlot. ✓
- `DataPanelId`('metrics'|'review'|'canon'|'bible'|'state')와 패널 id(`fc-pd-*`)·독 버튼 일치. ✓
- `DataView`(Task 1)의 board/canon/bible 세 종류를 Task 2(isBoard)·Task 3(centerSlot 분기) 모두 처리. ✓

> 미세 리스크 — `WorkStateGrid`·`DataReviewRail`·`CanonNav`·`DataPanel` 의 정확한 prop 이름은 구현 시 각 파일로 재확인(이미 본문 확인: CanonNav=project·activeCategory·onSelectCategory / DataReviewRail=category·review·isReviewing·onRequestReview·onOpenApprovalQueue / WorkStateGrid=project·latestChapter·isSerial / DataPanel=metrics·onMediaAxisChange). 불일치 시 호출부를 파일 시그니처에 맞춘다.
