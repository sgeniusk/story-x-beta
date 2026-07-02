import { describe, expect, it } from 'vitest';
import { countPendingSync, reconcileWorkingIntoCommitted } from './syncConsole';
import { createEmptyProject } from './storyEngine';
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
