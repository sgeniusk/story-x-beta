// M4 청크 F · agentRunEngine TDD 케이스.
// 스케일별 기본 에이전트 + agentLimit · continuity-editor 분기 · 신설 에이전트(critic-reviewer/essay-curator) 통과.
import { describe, expect, it } from 'vitest';
import { planAgentRuns } from './agentRunEngine';
import { createEmptyProject } from './storyEngine';

const baseInput = () => ({
  project: createEmptyProject({ title: '테스트 작품' }),
  request: { genre: 'urban-fantasy' as const, intent: '문이 열린다', pressure: '낮은 압력' },
  chapter: {
    id: 'episode-1',
    episode: 1,
    title: '1화: 문',
    hook: '문이 열렸다',
    outline: ['들어간다'],
    beats: [],
    prose: '본문.',
    memoryAnchors: [],
    newCanonFacts: []
  },
  issues: []
});

describe('agentRunEngine', () => {
  it('quick 스케일은 기본 3 에이전트만 실행', () => {
    const plan = planAgentRuns({ ...baseInput(), scale: 'quick' });
    expect(plan.scale).toBe('quick');
    expect(plan.runs.length).toBeLessThanOrEqual(3);
    expect(plan.agents).toEqual(plan.runs.map((r) => r.agentId));
  });

  it('standard 스케일은 기본 5 에이전트 — showrunner·character·world·genre·continuity', () => {
    const plan = planAgentRuns({ ...baseInput(), scale: 'standard' });
    expect(plan.runs.length).toBe(5);
    expect(plan.agents).toEqual([
      'showrunner',
      'character-custodian',
      'world-keeper',
      'genre-stylist',
      'continuity-editor'
    ]);
  });

  it('continuity-editor 가 error issue 가 있으면 status=block', () => {
    const plan = planAgentRuns({
      ...baseInput(),
      scale: 'standard',
      issues: [{ severity: 'error', source: 'character-custodian', claim: 'x', message: 'y' }]
    });
    const continuity = plan.runs.find((r) => r.agentId === 'continuity-editor');
    expect(continuity?.status).toBe('block');
    expect(continuity?.output).toContain('충돌');
  });

  it('continuity-editor 가 warning 만 있으면 status=revise', () => {
    const plan = planAgentRuns({
      ...baseInput(),
      scale: 'standard',
      issues: [{ severity: 'warning', source: 'continuity-editor', claim: 'x', message: 'y' }]
    });
    const continuity = plan.runs.find((r) => r.agentId === 'continuity-editor');
    expect(continuity?.status).toBe('revise');
  });

  it('issues 가 비면 모든 에이전트 status=pass', () => {
    const plan = planAgentRuns({ ...baseInput(), scale: 'standard' });
    expect(plan.runs.every((r) => r.status === 'pass')).toBe(true);
  });

  it('requestedAgentIds 가 명시되면 그 목록을 우선', () => {
    const plan = planAgentRuns({
      ...baseInput(),
      scale: 'quick',
      requestedAgentIds: ['critic-reviewer', 'essay-curator']
    });
    expect(plan.agents).toEqual(['critic-reviewer', 'essay-curator']);
    expect(plan.runs.map((r) => r.agentId)).toEqual(['critic-reviewer', 'essay-curator']);
  });

  it('agentLimit 을 초과하는 요청은 잘라낸다 (quick = 3)', () => {
    const plan = planAgentRuns({
      ...baseInput(),
      scale: 'quick',
      requestedAgentIds: ['showrunner', 'character-custodian', 'world-keeper', 'genre-stylist', 'continuity-editor']
    });
    expect(plan.runs.length).toBe(3);
  });

  it('신설 에이전트(critic-reviewer/essay-curator) 도 AgentRun 산출에 통과', () => {
    const plan = planAgentRuns({
      ...baseInput(),
      scale: 'deep',
      requestedAgentIds: ['critic-reviewer', 'essay-curator']
    });
    const critic = plan.runs.find((r) => r.agentId === 'critic-reviewer');
    const essay = plan.runs.find((r) => r.agentId === 'essay-curator');
    expect(critic).toBeDefined();
    expect(essay).toBeDefined();
    expect(critic?.title).toContain('평론');
    expect(essay?.title).toContain('에세이');
  });
});
