// 융합 셸 B-2 reconcile 충돌 게이트 다이얼로그 렌더 테스트. spec 2026-07-02.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ReconcileReview } from './ReconcileReview';
import type { DeviationConflict } from '../lib/playRuntimeValidator';

const conflicts: DeviationConflict[] = [
  { id: 'reconcile-c0', factId: 'a1', band: 'anchor', newClaim: '서준은 이미 죽었어', oldCanon: '서준은 살아 있다' },
  { id: 'reconcile-c1', factId: 'a2', band: 'major', newClaim: '문은 닫혔다', oldCanon: '문은 열렸다' }
];

describe('ReconcileReview', () => {
  it('충돌 카드마다 옛 정본과 새 주장을 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(ReconcileReview, {
        conflicts, decisions: {}, onToggle: () => {}, onApprove: () => {}, onCancel: () => {}
      })
    );
    expect(html).toContain('서준은 살아 있다');
    expect(html).toContain('서준은 이미 죽었어');
    expect(html).toContain('문은 열렸다');
    expect(html).toContain('data-action="reconcile-approve"');
    expect(html).toContain('data-action="reconcile-cancel"');
  });

  it('retcon 결정된 카드만 is-on 강조', () => {
    const html = renderToStaticMarkup(
      createElement(ReconcileReview, {
        conflicts, decisions: { 'reconcile-c0': 'retcon' as const }, onToggle: () => {}, onApprove: () => {}, onCancel: () => {}
      })
    );
    expect((html.match(/rc-card is-on/g) ?? []).length).toBe(1);
  });
});
