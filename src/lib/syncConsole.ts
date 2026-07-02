// 융합 셸 싱크 콘솔 — PLAY working copy 와 본편 committed 의 미반영 diff·append 머지(순수).
import type { SeriesProject } from './storyEngine';
import { applyRetcons } from './storyEngine';
import { buildRetconUpdates, type DeviationConflict } from './playRuntimeValidator';

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

// 슬라이스 B-2 — 충돌 결정(retcon/keep)을 반영해 최신화(순수).
// retcon: committed 옛 캐논 statement 교체 · keep: committed 유지. 두 경우 모두 충돌한 working
// 새 캐논은 append 제외(retcon 은 제자리 교체로 반영·keep 은 버림 → 모순 두 캐논 공존 방지).
// 비충돌 회차/캐논은 append. 회차 본문은 안 건드림(작가 원고).
export function applyReconcile(
  working: SeriesProject,
  committed: SeriesProject,
  conflicts: DeviationConflict[],
  decisions: Record<string, 'keep' | 'retcon'>
): SeriesProject {
  const base = applyRetcons(committed, buildRetconUpdates(conflicts, decisions));
  const conflictClaims = new Set(conflicts.map((c) => c.newClaim));
  const workingSansConflictCanon: SeriesProject = {
    ...working,
    canonFacts: working.canonFacts.filter((f) => !conflictClaims.has(f.statement))
  };
  return reconcileWorkingIntoCommitted(workingSansConflictCanon, base);
}
