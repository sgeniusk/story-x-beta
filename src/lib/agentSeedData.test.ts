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

  it('연재 novel(long-novel)은 CORE 5 + critic-reviewer 흡인력 게이트 (2026-07-06)', () => {
    const ids = getMediumReviewAgentIds('novel', 'long-novel');
    expect(ids.slice(0, 5)).toEqual(MARGIN_CORE_AGENT_IDS);
    expect(ids[ids.length - 1]).toBe('critic-reviewer');
    expect(ids.length).toBe(6);
  });

  it('연재 comics(serial-webtoon)는 CORE + 특화 2 + critic-reviewer', () => {
    const ids = getMediumReviewAgentIds('comics', 'serial-webtoon');
    expect(ids).toContain('storyboard-agent');
    expect(ids).toContain('speech-bubble-agent');
    expect(ids[ids.length - 1]).toBe('critic-reviewer');
    expect(ids.length).toBe(8);
  });

  it('비연재 novel(short-novel)은 CORE 5인 유지 (흡인력 게이트 미합류)', () => {
    expect(getMediumReviewAgentIds('novel', 'short-novel')).toEqual(MARGIN_CORE_AGENT_IDS);
  });

  it('essay·academic 은 연재 format 이어도 critic-reviewer 미합류 (긴장 축 다름)', () => {
    expect(getMediumReviewAgentIds('essay', 'essay-series')).not.toContain('critic-reviewer');
    expect(getMediumReviewAgentIds('academic', 'long-novel')).not.toContain('critic-reviewer');
  });

  it('format 미전달이면 현행 동작 유지 (하위호환)', () => {
    expect(getMediumReviewAgentIds('novel')).toEqual(MARGIN_CORE_AGENT_IDS);
  });
});
