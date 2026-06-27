import { describe, expect, it } from 'vitest';
import { DIVE_SEED_CHARACTERS } from './diveSeedCharacters';

describe('diveSeedCharacters', () => {
  it('시드 캐릭터는 3종이고 id가 고유하다', () => {
    expect(DIVE_SEED_CHARACTERS).toHaveLength(3);
    const ids = DIVE_SEED_CHARACTERS.map((c) => c.character.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('각 시드는 이름·배경·CharacterProfile 필수 필드를 채운다', () => {
    for (const seed of DIVE_SEED_CHARACTERS) {
      expect(seed.character.name).not.toBe('');
      expect(seed.background).not.toBe('');
      expect(Array.isArray(seed.character.voiceRules)).toBe(true);
      expect(seed.character.role).not.toBe('');
    }
  });
});
