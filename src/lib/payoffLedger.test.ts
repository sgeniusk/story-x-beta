import { describe, it, expect } from 'vitest';
import { computePayoffLedger, STALL_THRESHOLD } from './payoffLedger';
import type { Chapter } from './storyEngine';

function ch(episode: number, opts: Partial<Pick<Chapter, 'rewardArc' | 'stakesLedger'>> = {}): Chapter {
  return {
    id: `episode-${episode}`, episode, title: `${episode}화`, hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...opts
  };
}

describe('computePayoffLedger', () => {
  it('레저 데이터가 전혀 없으면 measured=false·isStalled=false (거짓 경보 차단)', () => {
    const r = computePayoffLedger([ch(1), ch(2)]);
    expect(r.measured).toBe(false);
    expect(r.isStalled).toBe(false);
  });

  it('회수 없는 회차가 임계 이상 연속이면 isStalled=true', () => {
    const r = computePayoffLedger([
      ch(1, { rewardArc: [{ promise: 'q', payoff: '회수됨' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { rewardArc: [{ promise: 'q2', payoff: '' }] }),
      ch(4, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    expect(r.deferredStreak).toBe(3); // ch2·3·4 회수 없음
    expect(r.isStalled).toBe(true);
    expect(STALL_THRESHOLD).toBe(3);
  });

  it('마지막 회차가 회수하면 streak이 끊기고 lastPayoffEpisode 기록', () => {
    const r = computePayoffLedger([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'kept' }] })
    ]);
    expect(r.deferredStreak).toBe(0);
    expect(r.isStalled).toBe(false);
    expect(r.lastPayoffEpisode).toBe(3);
  });

  it('open/paid promise를 항목 단위로 집계', () => {
    const r = computePayoffLedger([
      ch(1, { rewardArc: [{ promise: 'a', payoff: 'x' }, { promise: 'b', payoff: '' }] })
    ]);
    expect(r.paidPromises).toBe(1);
    expect(r.openPromises).toBe(1);
  });
});
