// planChat — 설계 대화 카탈로그·transcript·정규화 순수 검증.
import { describe, expect, it } from 'vitest';
import type { SeriesProject } from './storyEngine';
import {
  buildPlanChatCatalog, buildPlanChatTranscript, normalizePlanChatResponse,
  type PlanChatMessage
} from './planChat';

const longDesire = '가'.repeat(100);
const project = {
  characters: [{ id: 'c1', name: '리아나', desire: longDesire, wound: '처형장의 아침', currentState: '벨로트가 위장' }],
  worldRules: [{ id: 'w1', title: '인장의 법', rule: '인장 사용권을 넘기면 계약 가능' }],
  canonFacts: Array.from({ length: 45 }, (_, i) => ({ id: `k${i}`, statement: `사실 ${i}`, episode: 1 })),
  logline: '한 줄', audiencePromise: '약속', deepQuestion: '질문', formIntent: '형식', tone: '톤'
} as unknown as SeriesProject;

describe('buildPlanChatCatalog', () => {
  it('실존 id 집합·표시 라벨·카탈로그 텍스트를 만든다', () => {
    const catalog = buildPlanChatCatalog(project);
    expect(catalog.characterIds.has('c1')).toBe(true);
    expect(catalog.worldIds.has('w1')).toBe(true);
    expect(catalog.targetLabels['c1']).toBe('리아나');
    expect(catalog.text).toContain('id=c1');
    expect(catalog.text).toContain('id=w1');
    expect(catalog.text).toContain('logline=한 줄');
  });
  it('캐논은 최근 40개만 — 카탈로그 밖 id 는 검증 집합에도 없다', () => {
    const catalog = buildPlanChatCatalog(project);
    expect(catalog.canonIds.has('k44')).toBe(true);
    expect(catalog.canonIds.has('k4')).toBe(false);
    expect(catalog.text).not.toContain('id=k4 ');
  });
  it('카탈로그 값은 80자 절단', () => {
    const catalog = buildPlanChatCatalog(project);
    expect(catalog.text).toContain('가'.repeat(80));
    expect(catalog.text).not.toContain('가'.repeat(81));
  });
});

describe('buildPlanChatTranscript', () => {
  it('최근 8메시지를 작가:/파트너: 라벨로 잇는다', () => {
    const messages: PlanChatMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`, role: i % 2 === 0 ? 'user' : 'partner', text: `t${i}`
    }));
    const transcript = buildPlanChatTranscript(messages);
    expect(transcript).not.toContain('t1');
    expect(transcript).toContain('작가: t2');
    expect(transcript).toContain('파트너: t9');
  });
});

describe('normalizePlanChatResponse', () => {
  const catalog = buildPlanChatCatalog(project);
  const ok = (proposals: unknown[]) => normalizePlanChatResponse({ reply: '응답', proposals }, catalog);

  it('reply 비면 null·비객체 null', () => {
    expect(normalizePlanChatResponse({ reply: '  ' }, catalog)).toBeNull();
    expect(normalizePlanChatResponse(null, catalog)).toBeNull();
  });
  it('유효 character 제안을 targetLabel 과 함께 보존한다', () => {
    const turn = ok([{ kind: 'character', targetId: 'c1', field: 'desire', after: '형의 누명을 벗긴다', rationale: '방어에서 목표로' }]);
    expect(turn?.proposals).toHaveLength(1);
    expect(turn?.proposals[0]).toMatchObject({ kind: 'character', targetId: 'c1', field: 'desire', targetLabel: '리아나' });
  });
  it('없는 targetId·kind 외 값·빈 after 는 드랍', () => {
    const turn = ok([
      { kind: 'character', targetId: 'ghost', field: 'desire', after: 'x' },
      { kind: 'scene', after: 'x' },
      { kind: 'world', targetId: 'w1', after: '   ' }
    ]);
    expect(turn?.proposals).toHaveLength(0);
  });
  it('field 화이트리스트 — character 에 logline 불가, story-core 에 desire 불가', () => {
    const turn = ok([
      { kind: 'character', targetId: 'c1', field: 'logline', after: 'x' },
      { kind: 'story-core', field: 'desire', after: 'x' }
    ]);
    expect(turn?.proposals).toHaveLength(0);
  });
  it('[필수 핀] story-core title 은 드랍 — stageStoryCore(title)은 본편 직행이라 뚫리면 즉시 쓰기', () => {
    const turn = ok([{ kind: 'story-core', field: 'title', after: '새 제목' }]);
    expect(turn?.proposals).toHaveLength(0);
  });
  it('같은 (kind,targetId,field) 는 첫 것만·턴당 상한 3', () => {
    const turn = ok([
      { kind: 'story-core', field: 'logline', after: 'a' },
      { kind: 'story-core', field: 'logline', after: 'b' },
      { kind: 'story-core', field: 'tone', after: 'c' },
      { kind: 'world', targetId: 'w1', after: 'd' },
      { kind: 'canon', targetId: 'k44', after: 'e' }
    ]);
    expect(turn?.proposals).toHaveLength(3);
    expect(turn?.proposals[0].after).toBe('a');
  });
  it('rationale 은 trim 후 120자 절단', () => {
    const turn = ok([{ kind: 'world', targetId: 'w1', after: 'x', rationale: `  ${'나'.repeat(150)}  ` }]);
    expect(turn?.proposals[0].rationale).toBe('나'.repeat(120));
  });
});
