import { describe, it, expect } from 'vitest';
import { normalizeRewardArc, normalizeStakesLedger } from './draftClient';

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
