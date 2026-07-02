// PLAY(DiveDesk) 런타임 검증기 단위 테스트. 정본 §5·§7 · spec 2026-07-01.
import { describe, expect, it } from 'vitest';
import { validatePlayTurn, deriveDeviationCandidates, dedupePromotions, buildPromotedFacts, buildRetconUpdates, deriveReconcilePlan } from './playRuntimeValidator';
import { createDiveSession, appendMessage } from './diveSession';
import { createEmptyProject } from './storyEngine';
import type { CanonFact, Chapter, SeriesProject } from './storyEngine';

const fact = (over: Partial<CanonFact>): CanonFact => ({
  id: 'f', episode: 1, owner: 'plot', statement: '', ...over
});
const proj = (over: Partial<SeriesProject>): SeriesProject => ({ ...createEmptyProject(), ...over });
const chap = (over: Partial<Chapter>): Chapter =>
  ({ id: 'c', episode: 1, title: 't', hook: '', outline: [], beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...over });

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

describe('buildPromotedFacts — 승격 결정 → 캐논 팩트', () => {
  const surprises = [
    { id: 's1', snippet: '사실 나도 거기 있었어' },
    { id: 's2', snippet: '도현은 형사다' }
  ];

  it('promote된 것만, edits 우선, dedup 적용', () => {
    const out = buildPromotedFacts(
      surprises,
      { s1: 'promote', s2: 'skip' },
      { s1: '주인공은 창고에 있었다' },
      []
    );
    expect(out).toEqual([{ owner: 'plot', statement: '주인공은 창고에 있었다' }]);
  });

  it('기존 LLM 캐논과 겹치면 제외', () => {
    const out = buildPromotedFacts(
      surprises,
      { s1: 'promote' },
      {},
      [{ statement: '사실 나도 거기 있었어' }]
    );
    expect(out).toEqual([]);
  });

  it('promote 없으면 빈 배열', () => {
    expect(buildPromotedFacts(surprises, {}, {}, [])).toEqual([]);
  });
});

describe('retcon 경로 — 충돌 수집 + 교체 업데이트', () => {
  it('deriveDeviationCandidates가 conflicts 목록을 채운다(factId 있는 것만)', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '무슨 일');
    s = appendMessage(s, 'character', '사실 서준은 죽었어.', {
      conflicts: [
        { factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' },
        { factId: '', band: 'major', factStatement: 'x', snippet: 'y' }
      ],
      surpriseCandidates: [],
      blocksCanonization: true
    });
    s = appendMessage(s, 'user', '정말?');
    s = appendMessage(s, 'character', '응.');
    const d = deriveDeviationCandidates(s);
    expect(d.conflicts).toHaveLength(1);
    expect(d.conflicts[0]).toMatchObject({ factId: 'a1', band: 'anchor', newClaim: '사실 서준은 죽었어.', oldCanon: '서준은 살아 있다' });
    expect(d.conflicts[0].id).toBeTruthy();
  });

  it('buildRetconUpdates는 retcon 결정된 것만 {factId,statement}로', () => {
    const conflicts = [
      { id: 'c1', factId: 'a1', band: 'anchor' as const, newClaim: '서준은 죽었다', oldCanon: '서준은 살아 있다' },
      { id: 'c2', factId: 'a2', band: 'major' as const, newClaim: '문은 닫혔다', oldCanon: '문은 열렸다' }
    ];
    const out = buildRetconUpdates(conflicts, { c1: 'retcon', c2: 'keep' });
    expect(out).toEqual([{ factId: 'a1', statement: '서준은 죽었다' }]);
  });
});

describe('deriveReconcilePlan — working↔committed 충돌 감지', () => {
  it('충돌 없으면 conflicts 빈 배열', () => {
    const committed = proj({ canonFacts: [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })] });
    const working = proj({ canonFacts: [...committed.canonFacts, fact({ id: 'w1', statement: '민아는 창가에 섰다', importance: 0.3 })] });
    expect(deriveReconcilePlan(working, committed).conflicts).toEqual([]);
  });

  it('working 새 캐논이 committed 앵커와 모순 → conflict(옛 factId·oldCanon·newClaim)', () => {
    const committed = proj({ canonFacts: [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })] });
    const working = proj({ canonFacts: [...committed.canonFacts, fact({ id: 'w1', statement: '서준은 이미 죽었어', importance: 0.5, participants: ['서준'] })] });
    const conflicts = deriveReconcilePlan(working, committed).conflicts;
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ factId: 'a1', band: 'anchor', oldCanon: '서준은 살아 있다', newClaim: '서준은 이미 죽었어' });
  });

  it('미반영 회차 prose 의 모순도 감지', () => {
    const committed = proj({ canonFacts: [fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] })] });
    const working = proj({ canonFacts: committed.canonFacts, chapters: [chap({ id: 'ch1', prose: '서준은 이미 죽었어.' })] });
    expect(deriveReconcilePlan(working, committed).conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it('이미 committed 에 있는 캐논은 재검사 안 함(미반영만)', () => {
    const shared = fact({ id: 'a1', statement: '서준은 살아 있다', importance: 0.9, participants: ['서준'] });
    const committed = proj({ canonFacts: [shared] });
    const working = proj({ canonFacts: [shared] });
    expect(deriveReconcilePlan(working, committed).conflicts).toEqual([]);
  });
});
