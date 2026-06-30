// 캐논 중요도·관계자·관련성 검색 순수 함수 단위 테스트. 정본 §4·§6·§14.
import { describe, it, expect } from 'vitest';
import { importanceBand, deriveParticipants, deriveImportance, selectCanonForContext } from './canonImportance';
import type { CanonFact } from './storyEngine';

describe('importanceBand — 중요도 0~1 → 3밴드 (정본 §4)', () => {
  it('0.82 이상은 anchor', () => {
    expect(importanceBand(0.82)).toBe('anchor');
    expect(importanceBand(1)).toBe('anchor');
  });
  it('0.45~0.82 미만은 major', () => {
    expect(importanceBand(0.45)).toBe('major');
    expect(importanceBand(0.81)).toBe('major');
  });
  it('0.45 미만은 soft', () => {
    expect(importanceBand(0.44)).toBe('soft');
    expect(importanceBand(0)).toBe('soft');
  });
});

const fact = (over: Partial<CanonFact>): CanonFact => ({
  id: over.id ?? 'f', episode: over.episode ?? 1, owner: over.owner ?? 'plot',
  statement: over.statement ?? '', ...over,
});

describe('deriveParticipants — statement 에서 관계자 추출', () => {
  it('인물 이름을 뽑는다', () => {
    expect(deriveParticipants('정우는 보건지소 문을 열었다')).toContain('정우');
  });
  it('관계자 없으면 빈 배열', () => {
    expect(deriveParticipants('비가 내렸다')).toEqual([]);
  });
});

describe('deriveImportance — 작가 핀 우선, AI 제안 (정본 §4·§13)', () => {
  it('alwaysInclude 핀은 항상 0.9(앵커)', () => {
    const f = fact({ alwaysInclude: true, participants: [] });
    expect(deriveImportance(f, [f], [])).toBe(0.9);
  });
  it('관계자 많고 재등장·떡밥 연결된 캐논 > 고립 캐논', () => {
    const hub = fact({ id: 'a', participants: ['정우', '도아', '손님'] });
    const echo = fact({ id: 'b', participants: ['정우'] });
    const lonely = fact({ id: 'c', participants: [] });
    const all = [hub, echo, lonely];
    const threads = ['정우는 손님의 정체를 알 수 있을까'];
    expect(deriveImportance(hub, all, threads)).toBeGreaterThan(
      deriveImportance(lonely, all, threads)
    );
  });
  it('핀 없는 캐논은 앵커(≥0.82)에 자동 도달하지 않는다(보수적)', () => {
    const hub = fact({ id: 'a', participants: ['정우', '도아', '손님'] });
    const echo = fact({ id: 'b', participants: ['정우'] });
    expect(deriveImportance(hub, [hub, echo], ['정우 떡밥'])).toBeLessThan(0.82);
  });
});

describe('selectCanonForContext — 앵커 절단 금지 + 관련성 (정본 §6 · 런칭 게이트)', () => {
  const anchor = (id: string, parts: string[]): CanonFact =>
    fact({ id, importance: 0.9, participants: parts });
  const soft = (id: string, parts: string[]): CanonFact =>
    fact({ id, importance: 0.1, participants: parts });

  it('예산보다 앵커가 많아도 앵커는 전부 포함', () => {
    const facts = [anchor('a1', ['정우']), anchor('a2', ['도아']), anchor('a3', ['손님'])];
    const r = selectCanonForContext(facts, { participants: [], openThreads: [] }, 1);
    expect(r.selected.map((f) => f.id).sort()).toEqual(['a1', 'a2', 'a3']);
    expect(r.anchorCount).toBe(3);
  });

  it('예산 초과 시 관련 soft 우선·무관 soft 절단(앵커 보존)', () => {
    const facts = [
      anchor('a1', ['정우']),
      soft('rel', ['화선']),
      soft('irrel', ['엑스트라']),
    ];
    const r = selectCanonForContext(facts, { participants: ['화선'], openThreads: [] }, 2);
    const ids = r.selected.map((f) => f.id);
    expect(ids).toContain('a1');
    expect(ids).toContain('rel');
    expect(ids).not.toContain('irrel');
    expect(r.omittedCount).toBe(1);
  });

  it('65캐논·앵커5에서 앵커 statement 전부 살아남음(A-6 회귀)', () => {
    const anchors = Array.from({ length: 5 }, (_, i) => anchor(`anc${i}`, [`핵심${i}`]));
    const fillers = Array.from({ length: 60 }, (_, i) => soft(`fil${i}`, [`단역${i}`]));
    const r = selectCanonForContext(
      [...anchors, ...fillers],
      { participants: [], openThreads: [] },
      40
    );
    const ids = r.selected.map((f) => f.id);
    anchors.forEach((a) => expect(ids).toContain(a.id));
  });
});

describe('selectCanonForContext — alwaysInclude 직접 인정(세션 중 토글, normalize 전)', () => {
  it('importance 없이 alwaysInclude 만 있어도 앵커로 절단 면제(위치 무관)', () => {
    const pinned = fact({ id: 'pin', alwaysInclude: true, participants: ['정우'] }); // importance undefined
    const fillers = Array.from({ length: 50 }, (_, i) =>
      fact({ id: `f${i}`, importance: 0.1, participants: [`x${i}`] })
    );
    const r = selectCanonForContext([...fillers, pinned], { participants: [], openThreads: [] }, 10);
    expect(r.selected.map((f) => f.id)).toContain('pin');
    expect(r.anchorCount).toBe(1);
  });
});
