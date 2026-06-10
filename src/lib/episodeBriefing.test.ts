import { describe, it, expect } from 'vitest';
import { buildEpisodeForks, composeIntentWithFork } from './episodeBriefing';
import { computePayoffLedger } from './payoffLedger';
import type { Chapter, StoryProject } from './storyEngine';
import { createEmptyProject } from './storyEngine';

function ch(episode: number, opts: Partial<Pick<Chapter, 'rewardArc' | 'stakesLedger'>> = {}): Chapter {
  return {
    id: `episode-${episode}`, episode, title: `${episode}화`, hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...opts
  };
}

function projectWith(chapters: Chapter[], openThreads: string[] = []): StoryProject {
  const project = createEmptyProject();
  return { ...project, chapters, openThreads };
}

describe('buildEpisodeForks', () => {
  it('레저·떡밥 데이터가 전혀 없으면 빈 배열 (거짓 질문 차단)', () => {
    const project = projectWith([ch(1), ch(2)]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toEqual([]);
  });

  it('정체 상태면 회수 갈림길(stalled-premise)이 첫 질문이고, 미회수 promise 가 옵션이다', () => {
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: '배신자의 정체', payoff: '' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { rewardArc: [{ promise: '오른편 장부의 주인', payoff: '' }] }),
      ch(4, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('stalled-premise');
    expect(forks[0].options.map((o) => o.label)).toContain('배신자의 정체');
    expect(forks[0].options[0].intentSeed.length).toBeGreaterThan(0);
  });

  it('정체가 아니면 진척 갈림길(open-promise)로 묻는다', () => {
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: '탑의 비밀', payoff: '' }, { promise: 'q', payoff: '회수됨' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('open-promise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['탑의 비밀']);
  });

  it('[stall] 미회수 약속이 4개면 가장 오래된 3개(P1·P2·P3)를 제시한다 — slice(0, MAX_OPTIONS)', () => {
    // P1..P4 를 ch1~4에 도입, ch3~5 는 deferred-only 로 정체(deferredStreak ≥ 3) 유발
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: 'P1', payoff: '' }] }),
      ch(2, { rewardArc: [{ promise: 'P2', payoff: '' }] }),
      ch(3, { rewardArc: [{ promise: 'P3', payoff: '' }], stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(4, { rewardArc: [{ promise: 'P4', payoff: '' }], stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(5, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('stalled-premise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['P1', 'P2', 'P3']);
  });

  it('[open-promise] 미회수 약속이 4개면 가장 최근 3개(P2·P3·P4)를 제시한다 — slice(-MAX_OPTIONS)', () => {
    // 정체 없음: ch4에 paid promise 포함해 deferredStreak < 3
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: 'P1', payoff: '' }] }),
      ch(2, { rewardArc: [{ promise: 'P2', payoff: '' }] }),
      ch(3, { rewardArc: [{ promise: 'P3', payoff: '' }] }),
      ch(4, { rewardArc: [{ promise: 'P4', payoff: '' }, { promise: 'P_paid', payoff: '회수' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('open-promise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['P2', 'P3', 'P4']);
  });

  it('openThreads 중복(trim 후 동일 포함)은 제거해 옵션을 만든다', () => {
    const project = projectWith([], ['떡밥A', '떡밥A', ' 떡밥A ', '떡밥B']);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('open-thread');
    expect(forks[0].options.map((o) => o.label)).toEqual(['떡밥A', '떡밥B']);
  });

  it('openThreads 가 있으면 떡밥 갈림길을 추가한다 (최대 3 옵션)', () => {
    const project = projectWith([], ['떡밥A', '떡밥B', '떡밥C', '떡밥D']);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('open-thread');
    expect(forks[0].options).toHaveLength(3);
  });

  // 라이브 발견(2026-06-10 #3 헌터물) — 생성 LLM 이 rewardArc payoff 를 회차 안에서 즉시 채우고
  // openThreads 는 생성 경로가 채우지 않아, 실제 미뤄진 위험은 stakesLedger deferred 에만 남는다.
  // deferred 를 fork 소스로 쓰지 않으면 실생성 작품에서 갈림길이 영원히 안 뜬다.
  it('미회수 promise·openThreads 가 없어도 stakesLedger deferred 가 있으면 위험 갈림길을 만든다', () => {
    const project = projectWith([
      ch(1, {
        rewardArc: [{ promise: '첫 변수', payoff: '즉시 회수됨' }],
        stakesLedger: [
          { stake: '서가을의 정신적 안전', atRisk: '서가을', resolution: 'deferred' },
          { stake: '백도현의 정체와 게이트 조작의 진실', atRisk: '태준의 계획', resolution: 'deferred' }
        ]
      })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('deferred-stake');
    expect(forks[0].options.map((o) => o.label)).toEqual([
      '서가을의 정신적 안전',
      '백도현의 정체와 게이트 조작의 진실'
    ]);
    expect(forks[0].options[0].intentSeed).toContain('서가을의 정신적 안전');
  });

  it('같은 stake 가 뒤 회차에서 kept/lost 로 결판나면 deferred 갈림길 옵션에서 빠진다', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '민간인 피해', atRisk: '시민', resolution: 'deferred' },
          { stake: '붕괴 위험', atRisk: '시간선', resolution: 'deferred' }
        ]
      }),
      ch(2, { stakesLedger: [{ stake: '민간인 피해', atRisk: '시민', resolution: 'kept' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('deferred-stake');
    expect(forks[0].options.map((o) => o.label)).toEqual(['붕괴 위험']);
  });
});

describe('composeIntentWithFork', () => {
  it('기존 메모에 줄바꿈으로 덧붙인다', () => {
    expect(composeIntentWithFork('기존 의도', '새 시드')).toBe('기존 의도\n새 시드');
  });

  it('빈 메모면 시드만 넣는다', () => {
    expect(composeIntentWithFork('  ', '새 시드')).toBe('새 시드');
  });

  it('이미 포함된 시드는 중복 추가하지 않는다', () => {
    expect(composeIntentWithFork('기존\n새 시드', '새 시드')).toBe('기존\n새 시드');
  });
});
