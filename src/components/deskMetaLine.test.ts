// 하단 메타 줄 — 좌(문단·글자수/캐논 요약) · 우(저장·AI) 렌더 계약 (슬라이스 C).
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DeskMetaLine } from './DeskMetaLine';

describe('DeskMetaLine', () => {
  it('left 텍스트와 rightSlot 을 dm-line 안에 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DeskMetaLine, {
        left: '12문단 · 2,840자',
        rightSlot: createElement('span', { className: 'dm-save' }, '저장됨')
      })
    );
    expect(html).toContain('dm-line');
    expect(html).toContain('12문단 · 2,840자');
    expect(html).toContain('저장됨');
  });

  it('rightSlot 이 없어도 안전하다', () => {
    const html = renderToStaticMarkup(createElement(DeskMetaLine, { left: '캐논 27 · 떡밥 4' }));
    expect(html).toContain('캐논 27 · 떡밥 4');
  });
});
