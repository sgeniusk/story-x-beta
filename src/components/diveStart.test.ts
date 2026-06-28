import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveStart } from './DiveStart';

describe('DiveStart', () => {
  it('자유 서술 칸과 시작하기 버튼을 1차로 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DiveStart, { onStart: () => {}, onPick: () => {}, onBack: () => {} })
    );
    expect(html).toContain('어떤 인물과');
    expect(html).toContain('시작하기');
    expect(html).toContain('dx-start-story');
  });

  it('제안 카드 보조 토글을 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DiveStart, { onStart: () => {}, onPick: () => {}, onBack: () => {} })
    );
    expect(html).toContain('막히면 제안 받기');
    expect(html).toContain('dx-inspire-toggle');
  });
});
