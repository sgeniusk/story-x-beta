import { describe, it, expect } from 'vitest';
import type { SeriesProject } from './storyEngine';
import { buildPlanChatCatalog, normalizePlanChatResponse } from './planChat';

// planChatClient 는 normalizePlanChatResponse(planChat)를 재사용한다 — 정규화 계약을 클라이언트 경로에서 한 번 더 핀.
describe('planChatClient 정규화 계약', () => {
  const project = {
    characters: [{ id: 'c1', name: '리아나', desire: 'a', wound: 'b', currentState: 'c' }],
    worldRules: [], canonFacts: [],
    logline: '', audiencePromise: '', deepQuestion: '', formIntent: '', tone: ''
  } as unknown as SeriesProject;
  const catalog = buildPlanChatCatalog(project);

  it('reply+유효 제안을 턴으로 변환한다', () => {
    const turn = normalizePlanChatResponse(
      { reply: '좋아요', proposals: [{ kind: 'character', targetId: 'c1', field: 'desire', after: 'x', rationale: 'y' }] },
      catalog
    );
    expect(turn?.reply).toBe('좋아요');
    expect(turn?.proposals).toHaveLength(1);
  });
  it('reply 없는 응답은 null', () => {
    expect(normalizePlanChatResponse({ proposals: [] }, catalog)).toBeNull();
  });
});
