// 융합 셸 싱크 콘솔 배지+최신화 버튼 렌더 테스트. spec 2026-07-02(슬라이스 B).
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SyncConsole } from './SyncConsole';

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
