// 에이전트 분리 검토 클라이언트 — 요청 body 전달 계약 검증
import { describe, it, expect, vi, afterEach } from 'vitest';
import { requestAgentReview } from './reviewClient';

describe('requestAgentReview — contractStatus 전달 (A-5 헌장 예산 배선)', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('contractStatus 를 /api/review-agent 요청 body 로 전달한다', async () => {
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ status: 'complete', verdict: 'pass', note: '', evidence: [], strengths: [], issues: [], memoryCandidates: [] }), { status: 200 });
    }));
    await requestAgentReview({
      agentId: 'showrunner', target: '원고', medium: 'novel', context: '',
      contractStatus: { remaining: 1, unpaidCount: 4, overBudget: true, finalStretch: false }
    });
    expect(captured.contractStatus).toEqual({ remaining: 1, unpaidCount: 4, overBudget: true, finalStretch: false });
  });

  it('contractStatus 가 없으면 body 에 넣지 않는다(하위호환)', async () => {
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ status: 'complete', verdict: 'pass', note: '', evidence: [], strengths: [], issues: [], memoryCandidates: [] }), { status: 200 });
    }));
    await requestAgentReview({ agentId: 'showrunner', target: '원고', medium: 'novel', context: '' });
    expect(captured.contractStatus).toBeUndefined();
  });
});
