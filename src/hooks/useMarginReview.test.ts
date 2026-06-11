// P14 회귀 — 검토 런 진행 중 onRunAll 재호출이 pending 카드를 영구 잔류시키지 않는지 검증.
import { describe, expect, it, vi } from 'vitest';
import { act, createElement, type FC } from 'react';
import { createRoot } from 'react-dom/client';
import { useMarginReview } from './useMarginReview';
import type { MarginReview, Paragraph } from '../lib/marginReview';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const paragraphs: Paragraph[] = [{ id: 'p1', text: '본문 한 단락.' }];
const CORE_IDS = ['showrunner', 'character-custodian', 'world-keeper', 'genre-stylist', 'continuity-editor'];

type Hooked = ReturnType<typeof useMarginReview>;

function renderHook(options: {
  runAll: (onPartial: (review: MarginReview) => void) => Promise<void>;
  canRunAll?: () => boolean;
}) {
  let latest: Hooked | null = null;
  const Probe: FC = () => {
    latest = useMarginReview({
      paragraphs,
      corePersonaIds: CORE_IDS,
      runAll: options.runAll,
      canRunAll: options.canRunAll,
      summonOne: vi.fn(async () => ({
        persona: 'showrunner', anchor: 'p1', severity: 'note' as const, head: '', body: '', diffs: []
      }))
    });
    return null;
  };
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() => { root.render(createElement(Probe)); });
  return { get current() { return latest!; }, unmount: () => act(() => root.unmount()) };
}

describe('P14 — onRunAll 이중 트리거 가드', () => {
  it('canRunAll 이 false 면 pending 시드도 runAll 호출도 하지 않는다', () => {
    const runAll = vi.fn(async () => {});
    const h = renderHook({ runAll, canRunAll: () => false });
    act(() => { h.current.onRunAll(); });
    expect(runAll).not.toHaveBeenCalled();
    expect(h.current.reviews).toHaveLength(0);
    h.unmount();
  });

  it('canRunAll 이 true 면 기존대로 pending 을 시드하고 runAll 을 호출한다', () => {
    const runAll = vi.fn(async () => {});
    const h = renderHook({ runAll, canRunAll: () => true });
    act(() => { h.current.onRunAll(); });
    expect(runAll).toHaveBeenCalledTimes(1);
    expect(h.current.reviews).toHaveLength(CORE_IDS.length);
    expect(h.current.reviews.every((r) => r.pending)).toBe(true);
    h.unmount();
  });
});
