// onboard-chat 클라이언트 계약 — 응답 정규화 재사용 핀(planChatClient 관례)
import { describe, expect, it } from 'vitest';
import { normalizeOnboardChatResponse } from './onboardChat';

describe('onboardChatClient 정규화 계약', () => {
  it('클라이언트가 재사용하는 normalize 는 유효 setup 을 통과시킨다', () => {
    const turn = normalizeOnboardChatResponse({
      reply: '시작해볼까요?',
      setup: { scene: '장면', cast: [{ name: '상대' }], myRole: '나' }
    });
    expect(turn?.setup?.cast[0]?.name).toBe('상대');
  });

  it('reply 없는 응답은 턴 실패로 강등된다', () => {
    expect(normalizeOnboardChatResponse({ setup: null })).toBeNull();
  });
});
