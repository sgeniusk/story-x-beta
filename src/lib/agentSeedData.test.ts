// 매체별 라이브 검토 작가진 선택 — 인터뷰처럼 검토도 매체 특화 에이전트를 더한다.
import { describe, expect, it } from 'vitest';
import { getMediumReviewAgentIds, MARGIN_CORE_AGENT_IDS } from './agentSeedData';

describe('getMediumReviewAgentIds — 매체별 검토 작가진', () => {
  it('novel·academic 은 CORE 5인만 (specialist 미정)', () => {
    expect(getMediumReviewAgentIds('novel')).toEqual(MARGIN_CORE_AGENT_IDS);
    expect(getMediumReviewAgentIds('academic')).toEqual(MARGIN_CORE_AGENT_IDS);
  });

  it('comics 는 CORE + 스토리보드·말풍선', () => {
    const ids = getMediumReviewAgentIds('comics');
    expect(ids.slice(0, 5)).toEqual(MARGIN_CORE_AGENT_IDS);
    expect(ids).toContain('storyboard-agent');
    expect(ids).toContain('speech-bubble-agent');
    expect(ids.length).toBe(7);
  });

  it('audiobook 은 CORE + 낭독 연출가', () => {
    const ids = getMediumReviewAgentIds('audiobook');
    expect(ids).toContain('audio-narration-director');
    expect(ids.length).toBe(6);
  });

  it('essay 는 CORE + 에세이 큐레이터', () => {
    const ids = getMediumReviewAgentIds('essay');
    expect(ids).toContain('essay-curator');
    expect(ids.length).toBe(6);
  });

  it('CORE 원본을 변형하지 않는다 (불변)', () => {
    getMediumReviewAgentIds('comics');
    expect(MARGIN_CORE_AGENT_IDS.length).toBe(5);
  });
});
