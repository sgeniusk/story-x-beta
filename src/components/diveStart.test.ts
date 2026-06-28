import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveStart } from './DiveStart';

describe('DiveStart', () => {
  it('소재 입력·신기성 다이얼·제안 버튼을 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DiveStart, { onPick: () => {}, onBack: () => {} })
    );
    expect(html).toContain('소재');
    expect(html).toContain('제안 받기');
    expect(html).toContain('dx-novelty-dial');
  });
});
