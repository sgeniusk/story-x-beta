import { describe, it, expect } from 'vitest';
import { buildPaceCheck, replacePaceSeed } from './paceInterview';
import { computePayoffLedger } from './payoffLedger';
import type { Chapter, StoryProject } from './storyEngine';
import { createEmptyProject } from './storyEngine';

function ch(episode: number, opts: Partial<Pick<Chapter, 'rewardArc' | 'stakesLedger'>> = {}): Chapter {
  return {
    id: `episode-${episode}`, episode, title: `${episode}화`, hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...opts
  };
}

function serialProject(chapters: Chapter[]): StoryProject {
  const project = createEmptyProject();
  return { ...project, chapters };
}

// 연재 포맷 판별은 blueprint.format 기준 — 테스트에서는 buildPaceCheck 의 두 번째 시그니처로
// isSerial 여부를 직접 전달한다 (호출부인 StoryXDesk 에서 blueprint.format 을 안다).
describe('buildPaceCheck — 트리거 경계', () => {
  it('isSerial=false 면 빈 배열 (단편/포맷 미정)', () => {
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [{ stake: 't', atRisk: 'y', resolution: 'deferred' }] }),
      ch(3, { stakesLedger: [{ stake: 'u', atRisk: 'z', resolution: 'deferred' }] }),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(buildPaceCheck(project, ledger, false)).toEqual([]);
  });

  it('chapters.length < 2 면 빈 배열', () => {
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(buildPaceCheck(project, ledger, true)).toEqual([]);
  });

  it('isStalled=false 이고 deferred 고유 stake < 2 면 빈 배열', () => {
    // deferred stake 1개, 정체 아님 → 조건 미달
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { rewardArc: [{ promise: 'p', payoff: '회수' }] }),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(ledger.isStalled).toBe(false);
    expect(buildPaceCheck(project, ledger, true)).toEqual([]);
  });

  it('isStalled=true AND chapters >= 2 AND isSerial=true 면 질문 3개 반환', () => {
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [{ stake: 't', atRisk: 'y', resolution: 'deferred' }] }),
      ch(3, { stakesLedger: [{ stake: 'u', atRisk: 'z', resolution: 'deferred' }] }),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(ledger.isStalled).toBe(true);
    const questions = buildPaceCheck(project, ledger, true);
    expect(questions).toHaveLength(3);
  });

  it('deferred 고유 stake >= 2 면 (정체 아니더라도) 질문 3개 반환', () => {
    // ch2 에 payoff 있어 정체 아님, 하지만 deferred stake 2개
    const project = serialProject([
      ch(1, { stakesLedger: [
        { stake: 'A', atRisk: 'x', resolution: 'deferred' },
        { stake: 'B', atRisk: 'y', resolution: 'deferred' },
      ]}),
      ch(2, { rewardArc: [{ promise: 'p', payoff: '회수' }] }),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(ledger.isStalled).toBe(false);
    const questions = buildPaceCheck(project, ledger, true);
    expect(questions).toHaveLength(3);
  });
});

describe('buildPaceCheck — 질문 결정론', () => {
  function stalledProject(): StoryProject {
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [{ stake: 't', atRisk: 'y', resolution: 'deferred' }] }),
      ch(3, { stakesLedger: [{ stake: 'u', atRisk: 'z', resolution: 'deferred' }] }),
    ]);
    return project;
  }

  it('질문 id 는 premise-ridge, episode-pace, next-payoff 순서', () => {
    const project = stalledProject();
    const ledger = computePayoffLedger(project.chapters);
    const questions = buildPaceCheck(project, ledger, true);
    expect(questions.map((q) => q.id)).toEqual(['premise-ridge', 'episode-pace', 'next-payoff']);
  });

  it('각 질문마다 옵션이 3개', () => {
    const project = stalledProject();
    const ledger = computePayoffLedger(project.chapters);
    const questions = buildPaceCheck(project, ledger, true);
    for (const q of questions) {
      expect(q.options).toHaveLength(3);
    }
  });

  it('premise-ridge 옵션 intentSeed 는 비어 있지 않다', () => {
    const project = stalledProject();
    const ledger = computePayoffLedger(project.chapters);
    const questions = buildPaceCheck(project, ledger, true);
    const ridge = questions.find((q) => q.id === 'premise-ridge')!;
    for (const opt of ridge.options) {
      expect(opt.intentSeed.length).toBeGreaterThan(0);
    }
  });

  it('episode-pace 옵션 label 은 전진/숨 고르기/회수', () => {
    const project = stalledProject();
    const ledger = computePayoffLedger(project.chapters);
    const questions = buildPaceCheck(project, ledger, true);
    const pace = questions.find((q) => q.id === 'episode-pace')!;
    expect(pace.options.map((o) => o.label)).toEqual(['전진', '숨 고르기', '회수']);
  });

  it('next-payoff 옵션 label 은 이번 화/1~2화 안/3화 이상', () => {
    const project = stalledProject();
    const ledger = computePayoffLedger(project.chapters);
    const questions = buildPaceCheck(project, ledger, true);
    const next = questions.find((q) => q.id === 'next-payoff')!;
    expect(next.options.map((o) => o.label)).toEqual(['이번 화', '1~2화 안', '3화 이상']);
  });
});

describe('buildPaceCheck — deferred stake 고유 집계', () => {
  it('같은 stake 문자열이 여러 회차에 deferred 로 등장해도 1개로 집계', () => {
    // stake 'A' 가 ch1, ch2 모두 deferred → 고유 stake 는 1개
    // stake 'B' 는 ch2 에서만 deferred → 총 2개 → 트리거 충족
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 'A', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [
        { stake: 'A', atRisk: 'x', resolution: 'deferred' },
        { stake: 'B', atRisk: 'y', resolution: 'deferred' },
      ]}),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(buildPaceCheck(project, ledger, true)).toHaveLength(3);
  });

  it('같은 stake 의 최종 결말이 kept 면 deferred 로 카운팅하지 않는다', () => {
    // stake 'A': ch1 deferred → ch2 kept → 최종 결말이 kept 이므로 deferred 아님
    // stake 'B': ch2 deferred 단독 → 1개만 → 트리거 미충족 (정체 없음)
    const project = serialProject([
      ch(1, { stakesLedger: [{ stake: 'A', atRisk: 'x', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [
        { stake: 'A', atRisk: 'x', resolution: 'kept' },
        { stake: 'B', atRisk: 'y', resolution: 'deferred' },
      ]}),
    ]);
    const ledger = computePayoffLedger(project.chapters);
    expect(ledger.isStalled).toBe(false);
    expect(buildPaceCheck(project, ledger, true)).toEqual([]);
  });
});

describe('replacePaceSeed', () => {
  const q1Seeds = [
    '전제는 아직 초입이다 — 이번 화는 토대를 쌓고 큰 reveal 은 아낀다.',
    '전제는 중턱이다 — 이번 화는 한 단계 전진하되 마지막 답은 남겨 둔다.',
    '전제가 정상 직전이다 — 이번 화는 결정적 전환을 향해 조여 간다.',
  ];

  it('기존 메모에 해당 질문 시드가 없으면 append', () => {
    const result = replacePaceSeed('기존 의도', q1Seeds, q1Seeds[0]);
    expect(result).toBe(`기존 의도\n${q1Seeds[0]}`);
  });

  it('빈 메모면 시드만', () => {
    const result = replacePaceSeed('', q1Seeds, q1Seeds[0]);
    expect(result).toBe(q1Seeds[0]);
  });

  it('같은 질문의 다른 옵션이 이미 있으면 교체', () => {
    const memo = `기존 의도\n${q1Seeds[0]}`;
    const result = replacePaceSeed(memo, q1Seeds, q1Seeds[1]);
    expect(result).toBe(`기존 의도\n${q1Seeds[1]}`);
  });

  it('이미 동일 시드가 있으면 중복 추가 안 함', () => {
    const memo = `기존 의도\n${q1Seeds[0]}`;
    const result = replacePaceSeed(memo, q1Seeds, q1Seeds[0]);
    expect(result).toBe(memo);
  });

  it('다른 질문의 시드는 건드리지 않는다', () => {
    const otherSeed = '이번 화는 전진이다 — 사건이 움직이고 선택이 좁아진다.';
    const memo = `기존 의도\n${q1Seeds[0]}\n${otherSeed}`;
    const result = replacePaceSeed(memo, q1Seeds, q1Seeds[2]);
    expect(result).toBe(`기존 의도\n${q1Seeds[2]}\n${otherSeed}`);
  });
});
