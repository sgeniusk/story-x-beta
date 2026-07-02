// 융합 셸 — ⟳최신화 반영 피드백 토스트 렌더 테스트. spec 없음(작은 후속 조각).
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SyncFlash } from './SyncFlash';

describe('SyncFlash', () => {
  it('flash 가 null 이면 아무것도 렌더하지 않는다', () => {
    expect(renderToStaticMarkup(createElement(SyncFlash, { flash: null }))).toBe('');
  });

  it('회차·캐논 반영량을 요약한다', () => {
    const html = renderToStaticMarkup(
      createElement(SyncFlash, { flash: { chapters: 2, canon: 1, total: 3 } })
    );
    expect(html).toContain('본편에 반영');
    expect(html).toContain('2회차');
    expect(html).toContain('1캐논');
  });

  it('한쪽이 0이면 그 항목은 생략한다', () => {
    const html = renderToStaticMarkup(
      createElement(SyncFlash, { flash: { chapters: 0, canon: 2, total: 2 } })
    );
    expect(html).toContain('2캐논');
    expect(html).not.toContain('회차');
  });
});
