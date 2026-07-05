import { describe, expect, it } from 'vitest';
import { flowModes, canonAxes, flowEntryAgents, flowPublishMedia } from './landingFlow';

describe('landing flow section content', () => {
  it('has exactly three writing modes in play·write·plan order', () => {
    expect(flowModes.map((m) => m.key)).toEqual(['play', 'write', 'plan']);
    for (const m of flowModes) {
      expect(m.tag.length).toBeGreaterThan(0);
      expect(m.kr.length).toBeGreaterThan(0);
      expect(m.body.length).toBeGreaterThan(0);
    }
  });

  it('has exactly two canon axes: solid full, pull growing', () => {
    expect(canonAxes.map((a) => a.key)).toEqual(['solid', 'pull']);
    const solid = canonAxes.find((a) => a.key === 'solid')!;
    const pull = canonAxes.find((a) => a.key === 'pull')!;
    // 일관성(안 무너진다) = 꽉 참
    expect(solid.filled).toBe(solid.total);
    // 흡인력(끌어당긴다) = 자라는 축(0 < filled < total)
    expect(pull.filled).toBeGreaterThan(0);
    expect(pull.filled).toBeLessThan(pull.total);
    for (const a of canonAxes) expect(a.body.length).toBeGreaterThan(0);
  });

  it('names the human+AI collaboration on the pull(흡인력) axis', () => {
    // 두 축 프레임 회귀 방지 — 흡인력은 "AI가 펼치고 사람이 고른다"는 협업으로 살린다
    const pull = canonAxes.find((a) => a.key === 'pull')!;
    expect(pull.body).toContain('사람');
    expect(pull.body).toMatch(/AI|작가진/);
  });

  it('lists the founding writer agents and publish media', () => {
    expect(flowEntryAgents.length).toBeGreaterThanOrEqual(4);
    expect(flowPublishMedia).toEqual(['소설', '웹툰', '동화책', '오디오북']);
  });
});
