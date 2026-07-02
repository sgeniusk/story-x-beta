// 융합 셸 싱크 콘솔 — PLAY working copy 와 본편 committed 의 미반영 diff·append 머지(순수).
import type { SeriesProject } from './storyEngine';

export interface PendingSync {
  chapters: number;
  canon: number;
  total: number;
}

// working 에 있고 committed 에 없는 회차/캐논 수(id 기준). working 없으면 0.
export function countPendingSync(
  working: SeriesProject | null | undefined,
  committed: SeriesProject
): PendingSync {
  if (!working) {
    return { chapters: 0, canon: 0, total: 0 };
  }
  const committedChapterIds = new Set(committed.chapters.map((c) => c.id));
  const committedCanonIds = new Set(committed.canonFacts.map((f) => f.id));
  const chapters = working.chapters.filter((c) => !committedChapterIds.has(c.id)).length;
  const canon = working.canonFacts.filter((f) => !committedCanonIds.has(f.id)).length;
  return { chapters, canon, total: chapters + canon };
}

// committed 에 없는 회차/캐논만 append 한 새 project(불변). WRITE 본편 편집 보존.
export function reconcileWorkingIntoCommitted(
  working: SeriesProject,
  committed: SeriesProject
): SeriesProject {
  const committedChapterIds = new Set(committed.chapters.map((c) => c.id));
  const committedCanonIds = new Set(committed.canonFacts.map((f) => f.id));
  const newChapters = working.chapters.filter((c) => !committedChapterIds.has(c.id));
  const newCanon = working.canonFacts.filter((f) => !committedCanonIds.has(f.id));
  return {
    ...committed,
    chapters: [...committed.chapters, ...newChapters],
    canonFacts: [...committed.canonFacts, ...newCanon]
  };
}
