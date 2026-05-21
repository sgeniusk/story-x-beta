// 매체별 페르소나 풀 (소설·만화·오디오북) 무결성 테스트
import { describe, expect, it } from 'vitest';
import { type MediaPersona } from './mediaPersonas';
import { NOVEL_PERSONAS, pickNovelInterviewers, getNovelPersona } from './novelPersonas';
import { COMIC_PERSONAS, pickComicInterviewers, getComicPersona } from './comicPersonas';
import { AUDIOBOOK_PERSONAS, pickAudiobookInterviewers, getAudiobookPersona } from './audiobookPersonas';

function assertPoolShape(pool: MediaPersona[], category: MediaPersona['category'], expectedSize = 6) {
  expect(pool).toHaveLength(expectedSize);
  for (const persona of pool) {
    expect(persona.category).toBe(category);
    expect(persona.id).toMatch(/^[a-z]+-persona-/);
    expect(persona.label.length).toBeGreaterThan(0);
    expect(persona.tone.length).toBeGreaterThan(0);
    expect(persona.strengths.length).toBeGreaterThan(0);
    expect(persona.questionStarters.length).toBeGreaterThanOrEqual(3);
    expect(persona.blockingSignals.length).toBeGreaterThan(0);
    expect(persona.matchKeywords.length).toBeGreaterThan(0);
    if (persona.isFictionalized) {
      expect(persona.references).toEqual([]);
    } else {
      expect(persona.references.length).toBeGreaterThanOrEqual(2);
    }
  }
}

describe('media persona pools (소설·만화·오디오북)', () => {
  it('NOVEL_PERSONAS has 6 entries, 5 real + 1 fictionalized', () => {
    assertPoolShape(NOVEL_PERSONAS, 'novel');
    expect(NOVEL_PERSONAS.filter((p) => !p.isFictionalized).length).toBe(5);
    expect(NOVEL_PERSONAS.filter((p) => p.isFictionalized).length).toBe(1);
  });

  it('COMIC_PERSONAS has 6 entries, real and fictionalized mix per license-safety policy', () => {
    assertPoolShape(COMIC_PERSONAS, 'comic');
    const fictionalCount = COMIC_PERSONAS.filter((p) => p.isFictionalized).length;
    expect(fictionalCount).toBeGreaterThanOrEqual(3); // 만화는 가공 비중 높음
  });

  it('AUDIOBOOK_PERSONAS has 6 entries, fictionalized weighted higher per voice rights', () => {
    assertPoolShape(AUDIOBOOK_PERSONAS, 'audiobook');
    const fictionalCount = AUDIOBOOK_PERSONAS.filter((p) => p.isFictionalized).length;
    expect(fictionalCount).toBe(6); // 낭독자 실명 자산 차용 어려움 — 전부 가공
  });

  it('picks Jung Yujeong persona when novel freewrite hints at thriller', () => {
    const lineup = pickNovelInterviewers('연쇄살인범을 추적하는 형사의 7년간의 기록.', 2200, 3);
    expect(lineup.map((p) => p.id)).toContain('novel-persona-jung-yujeong');
  });

  it('picks scroll webtoon curator when comic freewrite mentions 웹툰 클리프', () => {
    const lineup = pickComicInterviewers('네이버 웹툰 연재용 회차 클리프행어 설계가 필요한 작품.', 800, 3);
    expect(lineup.map((p) => p.id)).toContain('comic-persona-webtoon-scroll');
  });

  it('picks children book persona when audiobook freewrite mentions 어린이 그림책', () => {
    const lineup = pickAudiobookInterviewers('어린이 그림책 잠자리 동화 오디오북.', 600, 3);
    expect(lineup.map((p) => p.id)).toContain('audiobook-persona-children-book');
  });

  it('get*Persona returns matching record and throws on unknown', () => {
    expect(getNovelPersona('novel-persona-kim-younha').label).toBe('김영하風');
    expect(getComicPersona('comic-persona-yoon-taeho').label).toBe('윤태호風');
    expect(getAudiobookPersona('audiobook-persona-radio-quiet').label).toBe('라디오 진행자風 (차분)');
    expect(() => getNovelPersona('novel-persona-unknown')).toThrow(/Unknown persona/);
  });
});
