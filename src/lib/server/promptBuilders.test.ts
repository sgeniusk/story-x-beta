// 검토 프롬프트가 전제(중심 질문) 진척을 점검하도록 지시하는지 — continuity≠payoff 보정.
import { describe, expect, it } from 'vitest';
import { buildAgentReviewPrompt } from './promptBuilders';

describe('buildAgentReviewPrompt — 전제 진척 점검 지시 (continuity≠payoff 보정)', () => {
  it('연재 장편에서 중심 질문(전제)의 진척을 함께 보도록 지시한다', () => {
    // 라이브 테스트 발견 — 쇼러너가 21화 동안 전제 페이오프 정체를 묵인(연재 편향).
    // 검토 프롬프트가 "발견만 쌓고 약속이 제자리인지"를 점검하도록 강제해야 한다.
    const prompt = buildAgentReviewPrompt({
      agentId: 'showrunner',
      persona: '쇼러너 페르소나',
      target: '리아나는 또 한 겹의 단서를 발견했다.',
      medium: 'novel',
      context: '작품 약속 — 가문을 살리고 운명을 바꾼다.'
    });
    expect(prompt).toContain('중심 질문');
    expect(prompt).toContain('진척');
  });
});
