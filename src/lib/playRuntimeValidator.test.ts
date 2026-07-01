// PLAY(DiveDesk) 런타임 검증기 단위 테스트. 정본 §5·§7 · spec 2026-07-01.
import { describe, expect, it } from 'vitest';
import { validatePlayTurn, deriveDeviationCandidates, dedupePromotions } from './playRuntimeValidator';
import { createDiveSession, appendMessage } from './diveSession';
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

describe('deriveDeviationCandidates — 응결 span의 일탈 수집', () => {
  it('span의 ✦ 후보는 카드로, 🔴/🟡는 카운트로', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '무슨 일');
    s = appendMessage(s, 'character', '사실 나도 거기 있었어.', {
      conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: 'x' }],
      surpriseCandidates: [{ snippet: '사실 나도 거기 있었어.', relatedThread: '그날 밤' }],
      blocksCanonization: true
    });
    s = appendMessage(s, 'user', '정말?');
    s = appendMessage(s, 'character', '응.');
    const d = deriveDeviationCandidates(s);
    expect(d.surprises).toHaveLength(1);
    expect(d.surprises[0].snippet).toBe('사실 나도 거기 있었어.');
    expect(d.surprises[0].relatedThread).toBe('그날 밤');
    expect(d.conflictCounts.anchor).toBe(1);
    expect(d.conflictCounts.major).toBe(0);
  });

  it('verdict 없는(구버전) 메시지가 섞여도 안전', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', 'a');
    s = appendMessage(s, 'character', 'b');
    s = appendMessage(s, 'user', 'c');
    s = appendMessage(s, 'character', 'd');
    const d = deriveDeviationCandidates(s);
    expect(d.surprises).toEqual([]);
    expect(d.conflictCounts).toEqual({ anchor: 0, major: 0 });
  });
});

describe('dedupePromotions — LLM 캐논과 중복 제거(문자열 근접)', () => {
  it('기존 statement에 포함되는 승격은 제외, 무관은 유지', () => {
    const existing = [{ statement: '주인공은 그날 밤 창고에 있었다' }];
    const out = dedupePromotions(['그날 밤 창고에 있었다', '도현은 형사다'], existing);
    expect(out).toEqual(['도현은 형사다']);
  });

  it('공백 정규화로 매칭 · 자기 중복도 제거', () => {
    const out = dedupePromotions(['비밀은  하나다', '비밀은 하나다'], []);
    expect(out).toEqual(['비밀은  하나다']);
  });

  it('빈 문자열은 버린다', () => {
    expect(dedupePromotions(['   ', '실체'], [])).toEqual(['실체']);
  });
});
