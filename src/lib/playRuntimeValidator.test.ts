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
