// 온보딩 구상 대화 순수 모듈 계약 — transcript 재조립·응결 setup 정규화
import { describe, expect, it } from 'vitest';
import {
  ONBOARD_CHAT_TRANSCRIPT_LIMIT,
  buildOnboardChatTranscript,
  normalizeOnboardChatResponse,
  type OnboardChatMessage
} from './onboardChat';

const msg = (role: 'user' | 'partner', text: string): OnboardChatMessage => ({
  id: `m-${text}`,
  role,
  text
});

describe('buildOnboardChatTranscript', () => {
  it('작가/파트너 라벨로 직렬화한다', () => {
    const out = buildOnboardChatTranscript([msg('user', '심야 세탁소 얘기'), msg('partner', '누가 오나요?')]);
    expect(out).toBe('작가: 심야 세탁소 얘기\n파트너: 누가 오나요?');
  });

  it('기본 limit(8) 초과분은 앞에서 절단한다', () => {
    const many = Array.from({ length: 12 }, (_, i) => msg('user', `t${i}`));
    const out = buildOnboardChatTranscript(many);
    expect(out.split('\n')).toHaveLength(ONBOARD_CHAT_TRANSCRIPT_LIMIT);
    expect(out.startsWith('작가: t4')).toBe(true);
  });
});

describe('normalizeOnboardChatResponse', () => {
  const validSetup = { scene: '골목 세탁소', cast: [{ name: '노인' }], myRole: '단골' };

  it('reply 가 비면 턴 실패(null)다', () => {
    expect(normalizeOnboardChatResponse({ reply: '  ' })).toBeNull();
    expect(normalizeOnboardChatResponse('문자열')).toBeNull();
    expect(normalizeOnboardChatResponse(null)).toBeNull();
  });

  it('setup 없는 대화 턴은 setup null 로 통과한다', () => {
    expect(normalizeOnboardChatResponse({ reply: '어떤 인물이 떠오르나요?' })).toEqual({
      reply: '어떤 인물이 떠오르나요?',
      setup: null
    });
  });

  it('유효 setup 은 shape 가드(백필 포함)를 거쳐 실린다', () => {
    const turn = normalizeOnboardChatResponse({ reply: '이 정도면 시작해볼까요?', setup: validSetup });
    expect(turn?.setup).toEqual({
      scene: '골목 세탁소',
      cast: [{ name: '노인', role: '', desire: '', wound: '', voiceRules: [] }],
      myRole: '단골'
    });
  });

  it('손상 setup 은 setup 만 조용히 강등하고 reply 는 살린다', () => {
    const turn = normalizeOnboardChatResponse({ reply: '응답', setup: { scene: '장면', cast: [], myRole: '' } });
    expect(turn).toEqual({ reply: '응답', setup: null });
  });
});
