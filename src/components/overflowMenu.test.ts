// ⋯ 수납 메뉴 스모크 — 토글로 열리고 항목 onSelect 배선 (슬라이스 C).
import { describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { OverflowMenu, type OverflowMenuItem } from './OverflowMenu';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(items: OverflowMenuItem[]) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(OverflowMenu, { items })); });
  return {
    host,
    click: (el: Element | null) => act(() => { el?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }),
    unmount: () => { act(() => root.unmount()); host.remove(); },
  };
}

describe('OverflowMenu', () => {
  it('닫힌 상태에선 메뉴 미렌더, ⋯ 클릭 시 항목을 렌더한다', () => {
    const { host, click, unmount } = mount([{ id: 'publish', label: '출간', onSelect: vi.fn() }]);
    expect(host.querySelector('.om-menu')).toBeNull();
    click(host.querySelector('.om-toggle'));
    expect(host.querySelector('.om-menu')).not.toBeNull();
    expect(host.textContent).toContain('출간');
    unmount();
  });

  it('항목 클릭 시 onSelect 를 호출하고 메뉴를 닫는다', () => {
    const onSelect = vi.fn();
    const { host, click, unmount } = mount([{ id: 'export', label: 'JSON 내보내기', onSelect }]);
    click(host.querySelector('.om-toggle'));
    click(host.querySelector('[data-item="export"]'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.om-menu')).toBeNull();
    unmount();
  });
});
