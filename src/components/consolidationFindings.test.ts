// 정밀 검토 findings 카드 렌더 테스트. spec 2026-07-01 슬라이스 B.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ConsolidationFindings } from './ConsolidationFindings';

describe('ConsolidationFindings', () => {
  it('high/low 모순 카드를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(ConsolidationFindings, {
        findings: [
          { claim: '서준은 죽었다', conflictsWith: '서준은 살아 있다', evidence: '생사 모순', severity: 'high' as const }
        ]
      })
    );
    expect(html).toContain('서준은 죽었다');
    expect(html).toContain('서준은 살아 있다');
    expect(html).toContain('dx-finding-high');
  });

  it('빈 findings면 모순 없음을 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(ConsolidationFindings, { findings: [] }));
    expect(html).toContain('모순 없음');
  });

  it('null(미검토)이면 아무것도 렌더 안 함', () => {
    const html = renderToStaticMarkup(createElement(ConsolidationFindings, { findings: null }));
    expect(html).toBe('');
  });
});
