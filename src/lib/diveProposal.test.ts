import { describe, expect, it } from 'vitest';
import { TWIST_VECTORS, seedFromProposal, isValidProposal, type DiveProposal } from './diveProposal';

const sample: DiveProposal = {
  hook: '10년 산 가족이 외계인일지 모른다는 쪽지를 받았다',
  scene: '도윤네 집 앞. 도윤은 학원, 집엔 도윤 母만 있다.',
  cast: [
    { name: '도윤 母', role: '정체 모를 어머니', desire: '가족을 지킨다', wound: '말 못 할 비밀', voiceRules: ['부드럽게', '질문엔 되묻는다'] },
    { name: '도윤', role: '소꿉친구', desire: '평범하고 싶다', wound: '의심받는 가족', voiceRules: ['짧고 퉁명스럽게'] }
  ],
  myRole: '몰래 확인하러 온 사람',
  twist: '정체 전복',
  novelty: 'tilt'
};

describe('diveProposal', () => {
  it('비틈 벡터는 5종이고 라벨이 고유하다', () => {
    expect(TWIST_VECTORS).toHaveLength(5);
    expect(new Set(TWIST_VECTORS.map((v) => v.label)).size).toBe(5);
    for (const v of TWIST_VECTORS) expect(v.instruction).not.toBe('');
  });

  it('seedFromProposal은 scene을 그대로, cast를 CharacterProfile로, 첫 인물을 primary로 매핑한다', () => {
    const seed = seedFromProposal(sample);
    expect(seed.scene).toBe(sample.scene);
    expect(seed.characters).toHaveLength(2);
    const first = seed.characters[0];
    expect(first.name).toBe('도윤 母');
    expect(first.role).toBe('정체 모를 어머니');
    expect(Array.isArray(first.canonAnchors)).toBe(true);
    expect(Array.isArray(first.forbiddenContradictions)).toBe(true);
    expect(Array.isArray(first.relations)).toBe(true);
    expect(seed.primaryCharacterId).toBe(first.id);
    expect(new Set(seed.characters.map((c) => c.id)).size).toBe(2);
  });

  it('isValidProposal은 필수 필드 누락 후보를 거른다', () => {
    expect(isValidProposal(sample)).toBe(true);
    expect(isValidProposal({ ...sample, hook: '' })).toBe(false);
    expect(isValidProposal({ ...sample, cast: [] })).toBe(false);
    expect(isValidProposal({ hook: 'x', scene: 'y' })).toBe(false);
    expect(isValidProposal(null)).toBe(false);
  });
});
