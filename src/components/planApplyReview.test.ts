// PLAN 설계 반영 충돌 검토 다이얼로그 렌더 테스트. spec 2026-07-04.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlanApplyReview } from './PlanApplyReview';
import type { PlanConflict } from '../lib/planStage';

const conflicts: PlanConflict[] = [
  { key: 'canon:c1', label: '캐논 1화', committedValue: 'PLAY 가 바꾼 정본', after: '내 설계' },
  { key: 'world:w1', label: '은막 규칙', committedValue: '본편 규칙', after: '설계 규칙' }
];

describe('PlanApplyReview', () => {
  it('충돌 카드마다 지금 본편 값과 내 설계를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(PlanApplyReview, {
        conflicts, decisions: {}, onToggle: () => {}, onApprove: () => {}, onCancel: () => {}
      })
    );
    expect(html).toContain('PLAY 가 바꾼 정본');
    expect(html).toContain('내 설계');
    expect(html).toContain('캐논 1화');
    expect(html).toContain('data-action="plan-apply-approve"');
    expect(html).toContain('data-action="plan-apply-cancel"');
  });

  it('apply 결정된 카드만 is-on 강조(기본 keep)', () => {
    const html = renderToStaticMarkup(
      createElement(PlanApplyReview, {
        conflicts, decisions: { 'canon:c1': 'apply' as const }, onToggle: () => {}, onApprove: () => {}, onCancel: () => {}
      })
    );
    expect((html.match(/rc-card is-on/g) ?? []).length).toBe(1);
  });
});
