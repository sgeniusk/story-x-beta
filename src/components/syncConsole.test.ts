// 융합 셸 싱크 콘솔 배지+최신화 버튼 렌더 테스트. spec 2026-07-02(슬라이스 B).
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { SyncConsole } from './SyncConsole';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const zeroPending = { chapters: 0, canon: 0, total: 0 };

describe('SyncConsole', () => {
  it('미반영이 0이면 아무것도 렌더하지 않는다', () => {
    const html = renderToStaticMarkup(
      createElement(SyncConsole, { pending: { chapters: 0, canon: 0, total: 0 }, onReconcile: () => {} })
    );
    expect(html).toBe('');
  });

  it('미반영이 있으면 PLAY +N 배지와 최신화 버튼을 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(SyncConsole, { pending: { chapters: 2, canon: 1, total: 3 }, onReconcile: () => {} })
    );
    expect(html).toContain('PLAY +3');
    expect(html).toContain('최신화');
    expect(html).toContain('data-action="reconcile"');
  });
});

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
