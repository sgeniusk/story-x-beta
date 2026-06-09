// 검토 프롬프트가 전제(중심 질문) 진척을 점검하도록 지시하는지 — continuity≠payoff 보정.
import { describe, expect, it } from 'vitest';
import { buildAgentReviewPrompt, buildDraftPrompt } from './promptBuilders';

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

describe('buildDraftPrompt — 약속↔회수 산출 요청 (아크 페이오프 1단계)', () => {
  it('연재 회차에 rewardArc/stakesLedger 산출을 요청한다', () => {
    const p = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x', title: 't', context: '' });
    expect(p).toContain('rewardArc');
    expect(p).toContain('stakesLedger');
    expect(p).toContain('deferred');
  });

  it('정체 상태(payoffStatus.isStalled)면 연재 초안 프롬프트에 회수 의무를 주입한다', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x', title: 't', context: '',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 }
    });
    expect(p).toContain('전제 진척 정체');
    expect(p).toContain('3회차 연속');
    expect(p).toContain('열린 약속 4개');
    expect(p).toContain('최소 하나를');
  });

  it('정체가 아니거나 payoffStatus 가 없으면 회수 의무를 넣지 않는다', () => {
    const calm = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      payoffStatus: { isStalled: false, deferredStreak: 1, openPromises: 2 }
    });
    const absent = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x' });
    expect(calm).not.toContain('전제 진척 정체');
    expect(absent).not.toContain('전제 진척 정체');
  });

  it('단독 완결형은 정체여도 회수 의무를 넣지 않는다 (연재 전용)', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'short-novel', freewrite: 'x',
      payoffStatus: { isStalled: true, deferredStreak: 5, openPromises: 9 }
    });
    expect(p).not.toContain('전제 진척 정체');
  });
});

describe('buildAgentReviewPrompt — 정체 측정 evidence 주입 (아크 페이오프 1단계 Task6)', () => {
  it('정체 상태(payoffStatus.isStalled=true)면 측정값을 evidence 로 주입한다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: '', target: '본문', medium: 'novel', context: '',
      payoffStatus: { isStalled: true, deferredStreak: 4, openPromises: 5 }
    });
    expect(p).toContain('stakes_progression_audit');
    expect(p).toContain('4');
    expect(p).toContain('정체');
  });

  it('isStalled=false 면 측정 줄을 넣지 않는다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: '', target: 'n', medium: 'novel', context: '',
      payoffStatus: { isStalled: false, deferredStreak: 1, openPromises: 2 }
    });
    expect(p).not.toContain('stakes_progression_audit');
  });

  it('payoffStatus 없으면 측정 줄을 넣지 않는다(하위호환)', () => {
    const p = buildAgentReviewPrompt({ agentId: 'showrunner', persona: '', target: 't', medium: 'novel', context: '' });
    expect(p).not.toContain('stakes_progression_audit');
  });
});
