// 응결 스튜디오 카드/배너/retcon 프레젠테이션 렌더 테스트. spec 2026-07-01 MVP-2·retcon.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DeviationReview } from './DeviationReview';

const noop = () => {};
const baseProps = { decisions: {}, edits: {}, retconDecisions: {}, onToggle: noop, onEdit: noop, onRetconToggle: noop };

describe('DeviationReview', () => {
  it('✦ 후보 카드와 🔴 충돌 배너를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        ...baseProps,
        deviations: {
          surprises: [{ id: 's1', snippet: '사실 나도 거기 있었어', relatedThread: '그날 밤' }],
          conflicts: [],
          conflictCounts: { anchor: 1, major: 0 }
        }
      })
    );
    expect(html).toContain('의외 전개 후보');
    expect(html).toContain('사실 나도 거기 있었어');
    expect(html).toContain('정본 충돌 1건');
  });

  it('conflicts 목록이 있으면 retcon 카드(새 주장 ↔ 옛 정본)를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        ...baseProps,
        deviations: {
          surprises: [],
          conflicts: [{ id: 'c1', factId: 'a1', band: 'anchor' as const, newClaim: '서준은 죽었다', oldCanon: '서준은 살아 있다' }],
          conflictCounts: { anchor: 1, major: 0 }
        }
      })
    );
    expect(html).toContain('서준은 죽었다');
    expect(html).toContain('서준은 살아 있다');
    expect(html).toContain('정본 교체');
  });

  it('후보도 충돌도 없으면 아무것도 렌더 안 함', () => {
    const html = renderToStaticMarkup(
      createElement(DeviationReview, {
        ...baseProps,
        deviations: { surprises: [], conflicts: [], conflictCounts: { anchor: 0, major: 0 } }
      })
    );
    expect(html).toBe('');
  });
});
