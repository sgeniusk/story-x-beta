// 응결 스튜디오 카드/배너 프레젠테이션 렌더 테스트. spec 2026-07-01 MVP-2.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DeviationReview } from './DeviationReview';

describe('DeviationReview', () => {
  it('✦ 후보 카드와 🔴 충돌 배너를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        deviations: {
          surprises: [{ id: 's1', snippet: '사실 나도 거기 있었어', relatedThread: '그날 밤' }],
          conflictCounts: { anchor: 1, major: 0 }
        },
        decisions: {},
        edits: {},
        onToggle: () => {},
        onEdit: () => {}
      })
    );
    expect(html).toContain('의외 전개 후보');
    expect(html).toContain('사실 나도 거기 있었어');
    expect(html).toContain('정본 충돌 1건');
  });

  it('후보도 충돌도 없으면 아무것도 렌더 안 함', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        deviations: { surprises: [], conflictCounts: { anchor: 0, major: 0 } },
        decisions: {}, edits: {}, onToggle: () => {}, onEdit: () => {}
      })
    );
    expect(html).toBe('');
  });
});
