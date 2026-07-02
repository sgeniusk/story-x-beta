import { describe, expect, it } from 'vitest';
import { countPendingSync, reconcileWorkingIntoCommitted, applyReconcile } from './syncConsole';
import { createEmptyProject } from './storyEngine';
import type { DeviationConflict } from './playRuntimeValidator';
import type { Chapter, CanonFact, SeriesProject } from './storyEngine';

// 융합 셸 싱크 콘솔 순수 로직 — working(PLAY) vs committed(본편) diff·append 머지.

function chapter(id: string, summary = ''): Chapter {
  return { id, number: 1, title: id, summary } as Chapter;
}
function canon(id: string, statement = id): CanonFact {
  return { id, episode: 1, owner: 'plot', statement } as CanonFact;
}
function withChapters(base: SeriesProject, chapters: Chapter[], canonFacts: CanonFact[] = []): SeriesProject {
  return { ...base, chapters, canonFacts };
}

describe('countPendingSync', () => {
  const committed = withChapters(createEmptyProject({ title: '본편' }), [chapter('ch1')], [canon('c1')]);

  it('working 이 null 이면 미반영 0', () => {
    expect(countPendingSync(null, committed)).toEqual({ chapters: 0, canon: 0, total: 0 });
  });

  it('working 이 committed 와 같으면 0', () => {
    const working = withChapters(createEmptyProject(), [chapter('ch1')], [canon('c1')]);
    expect(countPendingSync(working, committed)).toEqual({ chapters: 0, canon: 0, total: 0 });
  });

  it('working 에 새 회차 2개 있으면 chapters:2', () => {
    const working = withChapters(createEmptyProject(), [chapter('ch1'), chapter('ch2'), chapter('ch3')], [canon('c1')]);
    expect(countPendingSync(working, committed)).toEqual({ chapters: 2, canon: 0, total: 2 });
  });

  it('working 에 새 캐논 1개 있으면 canon:1', () => {
    const working = withChapters(createEmptyProject(), [chapter('ch1')], [canon('c1'), canon('c2')]);
    expect(countPendingSync(working, committed)).toEqual({ chapters: 0, canon: 1, total: 1 });
  });
});

describe('reconcileWorkingIntoCommitted', () => {
  it('committed 에 없는 회차만 append(기존 순서·내용 보존)', () => {
    const committed = withChapters(createEmptyProject({ title: '본편' }), [chapter('ch1', '본편 원본')], []);
    const working = withChapters(createEmptyProject(), [chapter('ch1', '옛 버전'), chapter('ch2', '새 회차')], []);
    const merged = reconcileWorkingIntoCommitted(working, committed);
    expect(merged.chapters.map((c) => c.id)).toEqual(['ch1', 'ch2']);
    // WRITE 본편 편집(committed ch1)이 working 옛 버전으로 롤백되지 않는다.
    expect(merged.chapters[0].summary).toBe('본편 원본');
    expect(merged.chapters[1].summary).toBe('새 회차');
  });

  it('committed 에 없는 캐논만 append', () => {
    const committed = withChapters(createEmptyProject(), [], [canon('c1')]);
    const working = withChapters(createEmptyProject(), [], [canon('c1'), canon('c2')]);
    const merged = reconcileWorkingIntoCommitted(working, committed);
    expect(merged.canonFacts.map((f) => f.id)).toEqual(['c1', 'c2']);
  });

  it('중복 id 를 두 번 넣지 않는다', () => {
    const committed = withChapters(createEmptyProject(), [chapter('ch1')], []);
    const working = withChapters(createEmptyProject(), [chapter('ch1')], []);
    const merged = reconcileWorkingIntoCommitted(working, committed);
    expect(merged.chapters).toHaveLength(1);
  });

  it('committed 를 변형하지 않는다(불변)', () => {
    const committed = withChapters(createEmptyProject(), [chapter('ch1')], []);
    const working = withChapters(createEmptyProject(), [chapter('ch1'), chapter('ch2')], []);
    reconcileWorkingIntoCommitted(working, committed);
    expect(committed.chapters).toHaveLength(1);
  });
});

describe('applyReconcile — 충돌 결정 반영(retcon/keep) + 비충돌 append', () => {
  const committed = withChapters(
    createEmptyProject({ title: '본편' }),
    [chapter('ch1', '본편')],
    [canon('a1', '서준은 살아 있다')]
  );
  // working — 본편 캐논 + 충돌 새 캐논(서준 사망) + 비충돌 새 캐논 + 새 회차
  const working = withChapters(
    createEmptyProject(),
    [chapter('ch1', '본편'), chapter('ch2', 'PLAY 회차')],
    [canon('a1', '서준은 살아 있다'), canon('w1', '서준은 이미 죽었어'), canon('w2', '민아가 도착했다')]
  );
  const conflicts: DeviationConflict[] = [
    { id: 'reconcile-c0', factId: 'a1', band: 'anchor', newClaim: '서준은 이미 죽었어', oldCanon: '서준은 살아 있다' }
  ];

  it('retcon 결정 → committed 옛 캐논 교체 + 충돌 새 캐논 append 안 함', () => {
    const merged = applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'retcon' });
    const a1 = merged.canonFacts.find((f) => f.id === 'a1');
    expect(a1?.statement).toBe('서준은 이미 죽었어'); // 옛 캐논 교체
    expect(merged.canonFacts.some((f) => f.statement === '서준은 이미 죽었어' && f.id === 'w1')).toBe(false); // 충돌 새 캐논 중복 append 안 함
  });

  it('keep 결정 → committed 옛 캐논 유지 + working 충돌 캐논 버림', () => {
    const merged = applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'keep' });
    expect(merged.canonFacts.find((f) => f.id === 'a1')?.statement).toBe('서준은 살아 있다'); // 유지
    expect(merged.canonFacts.some((f) => f.id === 'w1')).toBe(false); // 충돌 새 캐논 버림
  });

  it('비충돌 회차·캐논은 결정 무관하게 append', () => {
    const merged = applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'keep' });
    expect(merged.chapters.map((c) => c.id)).toEqual(['ch1', 'ch2']); // 새 회차 합류
    expect(merged.canonFacts.some((f) => f.id === 'w2')).toBe(true); // 비충돌 캐논 합류
  });

  it('committed 를 변형하지 않는다(불변)', () => {
    applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'retcon' });
    expect(committed.canonFacts.find((f) => f.id === 'a1')?.statement).toBe('서준은 살아 있다');
    expect(committed.chapters).toHaveLength(1);
  });
})
