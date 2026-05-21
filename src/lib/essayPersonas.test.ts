// 에세이 인터뷰어 페르소나 풀 테스트 — 6명 보존·라이센스 분리·매칭 동작 확인
import { describe, expect, it } from 'vitest';
import { ESSAY_PERSONAS, getEssayPersona, pickEssayInterviewers, type EssayPersona } from './essayPersonas';

describe('essay personas pool', () => {
  it('exposes exactly six personas — 5 real-author-based + 1 fictionalized', () => {
    expect(ESSAY_PERSONAS).toHaveLength(6);
    const realCount = ESSAY_PERSONAS.filter((p) => !p.isFictionalized).length;
    const fictionalCount = ESSAY_PERSONAS.filter((p) => p.isFictionalized).length;
    expect(realCount).toBe(5);
    expect(fictionalCount).toBe(1);
  });

  it('every persona has tone, strengths, question starters, blocking signals, match keywords', () => {
    for (const persona of ESSAY_PERSONAS) {
      expect(persona.id).toMatch(/^persona-/);
      expect(persona.label.length).toBeGreaterThan(0);
      expect(persona.tone.length).toBeGreaterThan(0);
      expect(persona.strengths.length).toBeGreaterThan(0);
      expect(persona.questionStarters.length).toBeGreaterThanOrEqual(3);
      expect(persona.blockingSignals.length).toBeGreaterThan(0);
      expect(persona.matchKeywords.length).toBeGreaterThan(0);
    }
  });

  it('real personas list public references, fictionalized persona does not', () => {
    for (const persona of ESSAY_PERSONAS) {
      if (persona.isFictionalized) {
        expect(persona.references).toEqual([]);
      } else {
        expect(persona.references.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('getEssayPersona returns the matching record by id and throws on unknown', () => {
    const persona = getEssayPersona('persona-park-wansuh');
    expect(persona.label).toBe('박완서風');
    expect(() => getEssayPersona('persona-unknown' as EssayPersona['id'])).toThrow(/Unknown essay persona/);
  });

  it('picks Park Wansuh persona when the freewrite mentions 어머니', () => {
    const lineup = pickEssayInterviewers('어머니가 부엌에서 밥을 짓던 어느 토요일에 대해 적고 싶다.', 1800, 3);
    expect(lineup).toHaveLength(3);
    expect(lineup.map((p) => p.id)).toContain('persona-park-wansuh');
  });

  it('biases short pieces toward the fast-pulse persona', () => {
    const shortText = 'SNS에 올릴 짧은 글.';
    const lineup = pickEssayInterviewers(shortText, 400, 3);
    expect(lineup[0].id).toBe('persona-fast-pulse');
  });

  it('demotes the fast-pulse persona for long pieces and lifts the structural critics', () => {
    const longText = '사유와 관찰이 많은 긴 산문에 대해 적고 싶다. '.repeat(20);
    const lineup = pickEssayInterviewers(longText, 2600, 3);
    expect(lineup.map((p) => p.id)).not.toContain('persona-fast-pulse');
    expect(lineup.map((p) => p.id).some((id) => id === 'persona-kim-yeonsoo' || id === 'persona-shin-hyung-cheol')).toBe(true);
  });

  it('returns at most topN personas and respects the requested count', () => {
    const lineup = pickEssayInterviewers('전쟁의 폭력과 상실에 대한 글', 2200, 2);
    expect(lineup).toHaveLength(2);
  });
});
