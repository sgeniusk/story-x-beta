// 캐논 인라인 멘션(B3) — 본문 등장 캐논 탐지 순수 모듈 테스트
import { describe, it, expect } from 'vitest';
import { detectCanonMentions } from './canonMentions';
import type { CanonFact } from './storyEngine';

const fact = (id: string, statement: string, owner: CanonFact['owner'] = 'character'): CanonFact => ({
  id,
  episode: 1,
  owner,
  statement,
});

describe('detectCanonMentions', () => {
  it('본문에 등장한 인물 캐논을 이름별로 그룹화한다', () => {
    const facts = [
      fact('f1', '한지욱은 각성자다.'),
      fact('f2', '서가을은 길드원이다.'),
    ];
    const mentions = detectCanonMentions('한지욱이 탑에 들어갔다. 서가을은 따라오지 않았다.', facts);
    expect(mentions).toEqual([
      { name: '한지욱', factIds: ['f1'] },
      { name: '서가을', factIds: ['f2'] },
    ]);
  });

  it('같은 이름의 여러 fact 를 한 멘션으로 묶는다', () => {
    const facts = [
      fact('f1', '한지욱은 각성자다.'),
      fact('f2', '한지욱은 길드를 떠났다.'),
    ];
    const mentions = detectCanonMentions('한지욱이 떠났다.', facts);
    expect(mentions).toHaveLength(1);
    expect(mentions[0]).toEqual({ name: '한지욱', factIds: ['f1', 'f2'] });
  });

  it('본문에 안 나온 캐논은 제외한다', () => {
    const facts = [fact('f1', '한지욱은 각성자다.'), fact('f2', '서가을은 길드원이다.')];
    const mentions = detectCanonMentions('한지욱이 혼자 걸었다.', facts);
    expect(mentions.map((m) => m.name)).toEqual(['한지욱']);
  });

  it('인물 이름이 추출되지 않는 캐논(세계 규칙 등)은 제외한다', () => {
    const facts = [fact('f1', '탑은 매일 구조가 변한다.', 'world')];
    expect(detectCanonMentions('탑이 흔들렸다.', facts)).toEqual([]);
  });

  it('본문 등장 순서(첫 위치)대로 정렬한다', () => {
    const facts = [fact('f1', '한지욱은 각성자다.'), fact('f2', '서가을은 길드원이다.')];
    const mentions = detectCanonMentions('서가을이 먼저 도착했다. 한지욱은 늦었다.', facts);
    expect(mentions.map((m) => m.name)).toEqual(['서가을', '한지욱']);
  });

  it('빈 prose 는 멘션 0', () => {
    expect(detectCanonMentions('', [fact('f1', '한지욱은 각성자다.')])).toEqual([]);
  });
});
