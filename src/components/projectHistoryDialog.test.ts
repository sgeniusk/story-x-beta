// 자동 버전 히스토리(B4) — ProjectHistoryDialog 복원 영향범위·rollback confirm 렌더 검증(react-dom).
import { describe, it, expect, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectHistoryDialog } from './ProjectHistoryDialog';
import type { ProjectSnapshot } from '../lib/storage';
import type { SeriesProject } from '../lib/storyEngine';

const current = { chapters: new Array(3).fill({}), canonFacts: new Array(5).fill({}), currentEpisode: 3 } as unknown as SeriesProject;

const snap = (id: string, chapterCount: number, canonCount: number, episode: number): ProjectSnapshot =>
  ({ id, savedAt: '2026-06-23T00:00:00Z', label: `${episode}화`, episode, chapterCount, canonCount, project: {} as SeriesProject });

function mount(props: Parameters<typeof ProjectHistoryDialog>[0]) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(createElement(ProjectHistoryDialog, props));
  });
  return {
    host,
    click: (el: Element | null) => act(() => el?.dispatchEvent(new MouseEvent('click', { bubbles: true }))),
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe('ProjectHistoryDialog 영향범위 (B4)', () => {
  it('각 스냅샷에 복원 영향범위(회차·캐논 N→M)를 표시하고 rollback 을 표시한다', () => {
    const { host, unmount } = mount({ snapshots: [snap('s1', 1, 2, 1)], current, onRestore: vi.fn(), onClose: vi.fn() });
    const impact = host.querySelector('.sx-snapshot-impact');
    expect(impact?.textContent).toContain('회차 3→1');
    expect(impact?.textContent).toContain('캐논 5→2');
    expect(impact?.classList.contains('is-rollback')).toBe(true);
    unmount();
  });

  it('rollback 복원 클릭 시 confirm — 취소하면 onRestore 미호출', () => {
    const onRestore = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { host, click, unmount } = mount({ snapshots: [snap('s1', 1, 2, 1)], current, onRestore, onClose: vi.fn() });
    click(host.querySelector('.sx-snapshot-impact + div button'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onRestore).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
    unmount();
  });

  it('동일 스냅샷은 rollback 아님 — confirm 없이 onRestore 호출', () => {
    const onRestore = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { host, click, unmount } = mount({ snapshots: [snap('s2', 3, 5, 3)], current, onRestore, onClose: vi.fn() });
    expect(host.querySelector('.sx-snapshot-impact')?.classList.contains('is-rollback')).toBe(false);
    click(host.querySelector('.sx-snapshot-impact + div button'));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onRestore).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
    unmount();
  });
});
