// OnboardChatPanel — 버블·응결 시드 카드·상시 「이걸로 시작」 순수 렌더 검증.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { OnboardChatPanel, type OnboardChatPanelProps } from './OnboardChatPanel';
import type { OnboardChatMessage } from '../lib/onboardChat';
import type { DiveSetup } from '../lib/diveProposal';

function render(over: Partial<OnboardChatPanelProps> = {}) {
  return renderToStaticMarkup(
    createElement(OnboardChatPanel, {
      messages: [], busy: false, note: null,
      onSend: () => {}, onCondense: () => {}, onUseSetup: () => {},
      ...over
    })
  );
}

const setup: DiveSetup = {
  scene: '폐관 직전의 검술 도장, 마지막 수련생이 문을 두드린다',
  myRole: '늙은 사범',
  cast: [
    { name: '서하', role: '마지막 수련생', desire: '스승의 비기를 잇는다', wound: '', voiceRules: [] }
  ]
};

const userMsg: OnboardChatMessage = { id: 'u1', role: 'user', text: '검술 도장 이야기 어때요?' };
const partnerMsg: OnboardChatMessage = { id: 'p1', role: 'partner', text: '좋아요, 폐관 직전이라는 조건을 얹어볼까요?' };
const seedMsg: OnboardChatMessage = { id: 'p2', role: 'partner', text: '이 정도면 시작할 수 있겠어요.', setup };

describe('OnboardChatPanel', () => {
  it('빈 대화면 안내 문구를 렌더한다', () => {
    expect(render()).toContain('떠오르는 조각');
  });
  it('컴포저 placeholder 가 Enter 전송 관례를 안내한다', () => {
    expect(render()).toContain('Enter 전송 · Shift+Enter 줄바꿈');
  });
  it('user/partner 버블을 역할 클래스로 구분한다', () => {
    const html = render({ messages: [userMsg, partnerMsg] });
    expect(html).toContain('검술 도장 이야기 어때요?');
    expect(html).toContain('좋아요, 폐관 직전이라는 조건을 얹어볼까요?');
    expect(html).toContain('is-user');
    expect(html).toContain('is-partner');
  });
  it('setup 이 실린 partner 메시지엔 시드 카드를 렌더한다', () => {
    const html = render({ messages: [seedMsg] });
    expect(html).toContain('첫 장면');
    expect(html).toContain('폐관 직전의 검술 도장');
    expect(html).toContain('내 역할');
    expect(html).toContain('늙은 사범');
    expect(html).toContain('서하');
    expect(html).toContain('마지막 수련생');
    expect(html).toContain('이 설정으로 계속');
  });
  it('setup 없는 partner 메시지엔 카드가 없다', () => {
    const html = render({ messages: [partnerMsg] });
    expect(html).not.toContain('ocp-seed');
    expect(html).not.toContain('이 설정으로 계속');
  });
  it('busy 면 busyNote 를 role=status 로 렌더하고 전송·시드 버튼이 비활성', () => {
    const html = render({ messages: [seedMsg], busy: true, busyNote: '파트너가 생각 중 · 12초 경과' });
    expect(html).toContain('role="status"');
    expect(html).toContain('파트너가 생각 중 · 12초 경과');
    expect(html).toMatch(/ocp-send" disabled/);
    expect(html).toMatch(/ocp-seed-use" disabled/);
    expect(html).toMatch(/ocp-condense" disabled/);
    expect(html).toMatch(/<textarea[^>]* disabled/);
  });
  it('busyNote 는 busy 아닐 땐 렌더하지 않는다', () => {
    expect(render({ busyNote: '지연 안내' })).not.toContain('지연 안내');
  });
  it('「이걸로 시작」은 대화 없으면 비활성, 있으면 활성', () => {
    expect(render()).toMatch(/ocp-condense" disabled/);
    expect(render({ messages: [userMsg] })).not.toMatch(/ocp-condense" disabled/);
  });
  it('note 를 렌더한다', () => {
    expect(render({ note: '응답이 늦어져 잠시 뒤 다시 보내주세요' })).toContain('응답이 늦어져');
  });
});
