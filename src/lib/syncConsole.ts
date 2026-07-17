// 융합 셸 싱크 콘솔 — PLAY working copy 와 본편 committed 의 미반영 diff·append 머지(순수).
import type { Chapter, SeriesProject } from './storyEngine';
import { applyRetcons, commitChapter, nextEpisodeNumber } from './storyEngine';
import {
  buildRetconUpdates,
  deriveReconcilePlan,
  type DeviationConflict
} from './playRuntimeValidator';

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

export interface ApprovedCondenseRetcon {
  factId: string;
  previousStatement: string;
  statement: string;
}

export interface ApprovedCondenseCandidate {
  chapter: Chapter;
  retcons: ApprovedCondenseRetcon[];
  workingBeforeApproval?: SeriesProject;
}

export interface ResolvedApprovedCondenseCandidate extends ApprovedCondenseCandidate {
  baseProjectRevision: string;
  committedProjectRevision: string;
}

export type ApprovedCondenseBlockReason =
  | 'project-mismatch'
  | 'pending-sync'
  | 'chapter-id-collision'
  | 'episode-position-changed'
  | 'canon-id-collision'
  | 'ambiguous-retcon'
  | 'stale-retcon'
  | 'checkpoint-stale';

export type ApprovedCondenseCommitPlan =
  | { status: 'ready'; committedProject: SeriesProject }
  | { status: 'conflicts'; conflicts: DeviationConflict[] }
  | {
      status: 'blocked';
      reason: ApprovedCondenseBlockReason;
      chapterId?: string;
      factId?: string;
      pending?: PendingSync;
    };

export function hasEquivalentChapter(project: SeriesProject, chapter: Chapter): boolean {
  const existing = project.chapters.find((item) => item.id === chapter.id);
  return Boolean(existing && JSON.stringify(existing) === JSON.stringify(chapter));
}

// 승인 checkpoint가 만들어진 정확한 본편 전후 상태를 작고 동기적인 값으로 보존한다.
// 로컬 저장소의 전체 작품을 checkpoint에 복제하지 않으면서, 새 WRITE/캐논 변경을 감지한다.
export function buildApprovedCondenseProjectRevision(project: SeriesProject): string {
  const source = JSON.stringify(project);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= BigInt(source.charCodeAt(index));
    hash = (hash * prime) & mask;
  }
  return `sx-project-fnv1a64-${hash.toString(16).padStart(16, '0')}`;
}

function prepareApprovedCondenseBase(
  candidate: ApprovedCondenseCandidate,
  committed: SeriesProject
): { status: 'ready'; base: SeriesProject } | Extract<ApprovedCondenseCommitPlan, { status: 'blocked' }> {
  if (candidate.workingBeforeApproval && candidate.workingBeforeApproval.id !== committed.id) {
    return { status: 'blocked', reason: 'project-mismatch' };
  }
  if (candidate.workingBeforeApproval) {
    const pending = countPendingSync(candidate.workingBeforeApproval, committed);
    if (pending.total > 0) return { status: 'blocked', reason: 'pending-sync', pending };
  }

  const statementsByFactId = new Map<string, string>();
  for (const retcon of candidate.retcons) {
    const planned = statementsByFactId.get(retcon.factId);
    if (planned !== undefined && planned !== retcon.statement) {
      return { status: 'blocked', reason: 'ambiguous-retcon', factId: retcon.factId };
    }
    statementsByFactId.set(retcon.factId, retcon.statement);
  }

  const updates: Array<{ factId: string; statement: string }> = [];
  for (const retcon of candidate.retcons) {
    const current = committed.canonFacts.find((fact) => fact.id === retcon.factId);
    if (!current || (
      current.statement !== retcon.previousStatement &&
      current.statement !== retcon.statement
    )) {
      return { status: 'blocked', reason: 'stale-retcon', factId: retcon.factId };
    }
    if (current.statement === retcon.previousStatement) {
      updates.push({ factId: retcon.factId, statement: retcon.statement });
    }
  }
  return { status: 'ready', base: applyRetcons(committed, updates) };
}

// 사용자가 승인한 응결 결과를 본편에 합류하기 전 만드는 순수 계획.
// 충돌이 하나라도 있으면 저장 가능한 project 를 돌려주지 않아 호출부의 실수성 덮어쓰기를 막는다.
// 충돌이 없을 때는 승인한 Chapter 하나만 commitChapter로 합류해 최신 WRITE 편집을 보존한다.
export function planApprovedCondenseCommit(
  candidate: ApprovedCondenseCandidate,
  committed: SeriesProject
): ApprovedCondenseCommitPlan {
  const prepared = prepareApprovedCondenseBase(candidate, committed);
  if (prepared.status === 'blocked') return prepared;

  const { chapter } = candidate;
  const existingChapter = committed.chapters.find((item) => item.id === chapter.id);
  if (existingChapter) {
    if (!hasEquivalentChapter(committed, chapter)) {
      return { status: 'blocked', reason: 'chapter-id-collision', chapterId: chapter.id };
    }
    // saveProject 성공 뒤 receipt 정리만 실패한 부분 성공 재시도. exact-equal일 때만 멱등 완료한다.
    return { status: 'ready', committedProject: prepared.base };
  }
  if (chapter.episode !== nextEpisodeNumber(committed)) {
    return { status: 'blocked', reason: 'episode-position-changed', chapterId: chapter.id };
  }
  const committedCanonIds = new Set(committed.canonFacts.map((fact) => fact.id));
  const collidingCanon = chapter.newCanonFacts.find((fact) => committedCanonIds.has(fact.id));
  if (collidingCanon) {
    return { status: 'blocked', reason: 'canon-id-collision', factId: collidingCanon.id };
  }

  const isolatedWorking: SeriesProject = {
    ...prepared.base,
    chapters: [...prepared.base.chapters, chapter],
    canonFacts: [...prepared.base.canonFacts, ...chapter.newCanonFacts]
  };
  const { conflicts } = deriveReconcilePlan(isolatedWorking, prepared.base);
  if (conflicts.length > 0) {
    return { status: 'conflicts', conflicts };
  }
  return {
    status: 'ready',
    committedProject: commitChapter(prepared.base, chapter)
  };
}

// 충돌 선택까지 끝난 뒤 receipt에 먼저 남긴 write-ahead checkpoint 재개 전용 계획.
// resolved chapter와 retcon은 이미 사용자가 승인했으므로 충돌을 다시 묻지 않되,
// 최신 회차 위치·ID·retcon precondition은 일반 승인과 똑같이 검증한다.
export function planResolvedApprovedCondenseCommit(
  candidate: ResolvedApprovedCondenseCandidate,
  committed: SeriesProject
): Exclude<ApprovedCondenseCommitPlan, { status: 'conflicts' }> {
  const currentRevision = buildApprovedCondenseProjectRevision(committed);
  if (
    currentRevision !== candidate.baseProjectRevision &&
    currentRevision !== candidate.committedProjectRevision
  ) {
    return { status: 'blocked', reason: 'checkpoint-stale' };
  }
  if (candidate.workingBeforeApproval) {
    const workingRevision = buildApprovedCondenseProjectRevision(candidate.workingBeforeApproval);
    if (
      workingRevision !== candidate.baseProjectRevision &&
      workingRevision !== candidate.committedProjectRevision
    ) {
      return { status: 'blocked', reason: 'checkpoint-stale' };
    }
  }
  // resolved checkpoint의 working은 저장 전(base) 또는 PLAY만 먼저 저장된 committed 상태여야 한다.
  // 이 둘은 이미 revision으로 검증했으므로 일반 pending-sync 계산에 다시 넣어 부분 성공을 막지 않는다.
  const prepared = prepareApprovedCondenseBase({
    chapter: candidate.chapter,
    retcons: candidate.retcons
  }, committed);
  if (prepared.status === 'blocked') return prepared;

  const { chapter } = candidate;
  const existingChapter = committed.chapters.find((item) => item.id === chapter.id);
  if (existingChapter) {
    if (!hasEquivalentChapter(committed, chapter)) {
      return { status: 'blocked', reason: 'chapter-id-collision', chapterId: chapter.id };
    }
    return { status: 'ready', committedProject: prepared.base };
  }
  if (chapter.episode !== nextEpisodeNumber(committed)) {
    return { status: 'blocked', reason: 'episode-position-changed', chapterId: chapter.id };
  }
  const committedCanonIds = new Set(committed.canonFacts.map((fact) => fact.id));
  const collidingCanon = chapter.newCanonFacts.find((fact) => committedCanonIds.has(fact.id));
  if (collidingCanon) {
    return { status: 'blocked', reason: 'canon-id-collision', factId: collidingCanon.id };
  }
  return {
    status: 'ready',
    committedProject: commitChapter(prepared.base, chapter)
  };
}

export function applyApprovedCondenseDecisions(
  candidate: ApprovedCondenseCandidate,
  committed: SeriesProject,
  conflicts: DeviationConflict[],
  decisions: Record<string, 'keep' | 'retcon'>
): SeriesProject {
  const prepared = prepareApprovedCondenseBase(candidate, committed);
  if (prepared.status === 'blocked') return committed;
  const conflictClaims = new Set(conflicts.map((conflict) => conflict.newClaim));
  const resolvedChapter: Chapter = {
    ...candidate.chapter,
    newCanonFacts: candidate.chapter.newCanonFacts.filter(
      (fact) => !conflictClaims.has(fact.statement)
    )
  };
  const resolvedBase = applyRetcons(
    prepared.base,
    buildRetconUpdates(conflicts, decisions)
  );
  return commitChapter(resolvedBase, resolvedChapter);
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
