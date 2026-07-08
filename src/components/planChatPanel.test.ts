// PlanChatPanel — 버블·승인형 제안 카드·하네스 미리보기 순수 렌더 검증.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlanChatPanel, type PlanChatPanelProps } from './PlanChatPanel';
import type { PlanChatMessage } from '../lib/planChat';

function render(over: Partial<PlanChatPanelProps> = {}) {
  return renderToStaticMarkup(
    createElement(PlanChatPanel, {
      messages: [], busy: false, note: null, harnessPreview: null,
      onSend: () => {}, onApproveProposal: () => {},
      ...over
    })
  );
}

const partnerMsg: PlanChatMessage = {
  id: 'm1', role: 'partner', text: '욕망을 좁혀볼까요?',
  proposals: [{ kind: 'character', targetId: 'c1', targetLabel: '리아나', field: 'desire', after: '형의 누명을 벗긴다', rationale: '방어에서 목표로' }]
};

describe('PlanChatPanel', () => {
  it('빈 대화면 안내 문구를 렌더한다', () => {
    expect(render()).toContain('설계 파트너와');
  });
  it('컴포저 placeholder 가 Enter 전송 관례를 안내한다', () => {
    expect(render()).toContain('Enter 전송 · Shift+Enter 줄바꿈');
  });
  it('파트너 버블·제안 카드(라벨·근거·승인 버튼)를 렌더한다', () => {
    const html = render({ messages: [partnerMsg] });
    expect(html).toContain('욕망을 좁혀볼까요?');
    expect(html).toContain('리아나');
    expect(html).toContain('욕망');
    expect(html).toContain('형의 누명을 벗긴다');
    expect(html).toContain('방어에서 목표로');
    expect(html).toContain('설계안으로');
  });
  it('approved 제안은 ✓ 상태·비활성', () => {
    const approved = { ...partnerMsg, proposals: [{ ...partnerMsg.proposals![0], approved: true }] };
    const html = render({ messages: [approved] });
    expect(html).toContain('✓ 설계안 (미반영)');
    expect(html).toMatch(/pcp-prop-stage" disabled/);
  });
  it('harnessPreview 한 줄을 렌더한다', () => {
    const html = render({ harnessPreview: { before: 71, after: 78, count: 2 } });
    expect(html).toContain('하네스 71 → 78');
    expect(html).toContain('설계안 2건 반영 시');
  });
  it('busy 면 대기 안내·note 면 실패 안내를 렌더한다', () => {
    expect(render({ busy: true })).toContain('수십 초');
    expect(render({ note: '브리지 응답 오류' })).toContain('브리지 응답 오류');
  });
});
