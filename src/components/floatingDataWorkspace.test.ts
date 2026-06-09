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
    expect(host.textContent).toContain('하니스');
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
    expect(host.querySelector('.fc-data-board')).toBeNull();
    click(host.querySelector('.fc-data-crumb-board'));
    expect(onShowBoard).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('검토 요약이 분야 5종을 한 줄씩 보여주고 누르면 onSelectCategory 를 호출한다', () => {
    const onSelectCategory = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSelectCategory }));
    const rows = host.querySelectorAll('.fc-data-review-row');
    expect(rows.length).toBe(5);
    click(rows[0]);
    expect(onSelectCategory).toHaveBeenCalled();
    unmount();
  });
});
