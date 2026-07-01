// PLAY(DiveDesk) 런타임 검증기 단위 테스트. 정본 §5·§7 · spec 2026-07-01.
import { describe, expect, it } from 'vitest';
import { validatePlayTurn } from './playRuntimeValidator';
import type { CanonFact } from './storyEngine';

const fact = (over: Partial<CanonFact>): CanonFact => ({
  id: 'f', episode: 1, owner: 'plot', statement: '', ...over
});

describe('validatePlayTurn — 모순 검출', () => {
  it('앵커 fact 모순 답 → anchor conflict + blocksCanonization', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('서준은 이미 죽었어.', facts, []);
    expect(v.conflicts.some((c) => c.band === 'anchor' && c.factId === 'a1')).toBe(true);
    expect(v.blocksCanonization).toBe(true);
  });

  it('중(major) fact 모순 답 → major conflict, 차단 아님', () => {
    const facts = [fact({ id: 'm1', statement: '이레나는 준을 믿는다', importance: 0.6, participants: ['이레나', '준'] })];
    const v = validatePlayTurn('이레나는 이제 준을 의심해.', facts, []);
    expect(v.conflicts.some((c) => c.band === 'major' && c.factId === 'm1')).toBe(true);
    expect(v.blocksCanonization).toBe(false);
  });

  it('청정한 잡담 → 빈 verdict', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('오늘 날씨 참 좋네요.', facts, []);
    expect(v.conflicts).toEqual([]);
    expect(v.blocksCanonization).toBe(false);
  });

  it('오탐 가드 — 다른 엔티티 대립어는 충돌 아님', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('민아는 죽었어.', facts, []);
    expect(v.conflicts).toEqual([]);
  });
});

describe('validatePlayTurn — 의외 전개 후보', () => {
  it('reveal 마커 + 열린 떡밥 접촉 → surprise candidate + relatedThread', () => {
    const v = validatePlayTurn(
      '사실 나도 그날 밤 거기 있었어.',
      [],
      ['그날 밤 창고에 누가 있었나']
    );
    expect(v.surpriseCandidates.length).toBeGreaterThan(0);
    expect(v.surpriseCandidates[0].relatedThread).toBe('그날 밤 창고에 누가 있었나');
    expect(v.conflicts).toEqual([]);
  });

  it('reveal 마커 + 캐논 엔티티 접촉(떡밥 없음) → surprise candidate', () => {
    const facts = [fact({ id: 's1', statement: '도현은 형사다', importance: 0.2, participants: ['도현'] })];
    const v = validatePlayTurn('알고 보니 도현은 그 사건의 목격자였어.', facts, []);
    expect(v.surpriseCandidates.length).toBeGreaterThan(0);
  });

  it('미탐 선호 — 마커 없는 중립 서술은 후보 아님', () => {
    const facts = [fact({ id: 's1', statement: '도현은 형사다', importance: 0.2, participants: ['도현'] })];
    const v = validatePlayTurn('도현이 커피를 마신다.', facts, []);
    expect(v.surpriseCandidates).toEqual([]);
  });

  it('앵커 충돌 세그먼트는 surprise candidate로 중복 표시 안 함', () => {
    const facts = [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })];
    const v = validatePlayTurn('사실 서준은 죽었어.', facts, []);
    expect(v.conflicts.some((c) => c.band === 'anchor')).toBe(true);
    expect(v.surpriseCandidates).toEqual([]);
  });
});
