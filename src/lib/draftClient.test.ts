import { describe, it, expect, vi } from 'vitest';
import { normalizeRewardArc, normalizeStakesLedger, requestLlmDraft } from './draftClient';

describe('draftClient 약속↔회수 정규화', () => {
  it('rewardArc 유효 항목만 통과·intensity 보정', () => {
    expect(normalizeRewardArc([
      { promise: 'a', payoff: 'b', intensity: 200 },
      { promise: '', payoff: 'x' },
      'junk'
    ])).toEqual([{ promise: 'a', payoff: 'b', intensity: 100 }]);
  });

  it('비배열은 빈 배열', () => {
    expect(normalizeRewardArc(undefined)).toEqual([]);
    expect(normalizeStakesLedger(null)).toEqual([]);
  });

  it('stakes resolution 화이트리스트 밖은 생략', () => {
    expect(normalizeStakesLedger([{ stake: 's', atRisk: 'x', resolution: 'maybe' }]))
      .toEqual([{ stake: 's', atRisk: 'x' }]);
  });

  it('stakes resolution deferred 는 통과', () => {
    expect(normalizeStakesLedger([{ stake: 's', atRisk: 'x', resolution: 'deferred' }]))
      .toEqual([{ stake: 's', atRisk: 'x', resolution: 'deferred' }]);
  });
});

describe('requestLlmDraft — payoffStatus 전달', () => {
  it('payoffStatus 를 /api/draft 요청 body 로 전달한다', async () => {
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ status: 'failed', warning: 'x' }), { status: 200 });
    }));
    await requestLlmDraft({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 }
    });
    expect(captured.payoffStatus).toEqual({ isStalled: true, deferredStreak: 3, openPromises: 4 });
  });
});
