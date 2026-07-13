// 소재발굴 인기 프리셋 카탈로그 계약 — 구성 단위·플레이 시드 유효성
import { describe, expect, it } from 'vitest';
import { STORY_PRESETS } from './storyPresets';

describe('STORY_PRESETS', () => {
  it('5종 이상이고 id 가 고유하다', () => {
    expect(STORY_PRESETS.length).toBeGreaterThanOrEqual(5);
    const ids = STORY_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('카드 노출 필드(제목·훅)와 유사도 앵커 keywords 가 채워져 있다', () => {
    for (const p of STORY_PRESETS) {
      expect(p.title.trim()).not.toBe('');
      expect(p.hook.trim()).not.toBe('');
      expect(p.keywords.length).toBeGreaterThan(0);
      expect(p.keywords.every((k) => k.trim() !== '')).toBe(true);
    }
  });

  it('각 setup 은 유효한 플레이 시드다 — 인물 진하게, 첫 장면 하나', () => {
    for (const p of STORY_PRESETS) {
      expect(p.setup.scene.trim()).not.toBe('');
      expect(p.setup.myRole.trim()).not.toBe('');
      expect(p.setup.cast.length).toBeGreaterThanOrEqual(2);
      for (const c of p.setup.cast) {
        expect(c.name.trim()).not.toBe('');
        expect(c.desire.trim()).not.toBe('');
        expect(c.wound.trim()).not.toBe('');
        expect(c.voiceRules.length).toBeGreaterThan(0);
      }
    }
  });

  it('cast 에 사용자 역할(myRole)이 중복 편입되지 않는다 — cast[0]=상대역 구조 보호', () => {
    for (const p of STORY_PRESETS) {
      for (const c of p.setup.cast) {
        expect(p.setup.myRole.includes(c.name)).toBe(false);
      }
    }
  });
});
