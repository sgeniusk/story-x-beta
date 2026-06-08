// 회차별 약속↔회수 레저를 누적해 전제 진척 정체를 측정한다 (continuity≠payoff 1단계).
// 정본 — docs/superpowers/specs/2026-06-09-arc-payoff-gate-design.md
import type { Chapter } from './storyEngine';

export interface PayoffLedgerReport {
  /** payoff 가 빈 rewardArc 항목 누적 수 (단순 집계 — 고유 약속 추적 아님). */
  openPromises: number;
  /** payoff 가 채워진 rewardArc 항목 누적 수. */
  paidPromises: number;
  /** 마지막 회차에서부터 "회수 없는 회차" 연속 길이. */
  deferredStreak: number;
  /** 마지막으로 회수한 회차 번호. 없으면 null. */
  lastPayoffEpisode: number | null;
  /** deferredStreak >= STALL_THRESHOLD. */
  isStalled: boolean;
  /** 레저 데이터가 하나라도 있었는가 — 없으면 측정 불가로 본다. */
  measured: boolean;
}

export const STALL_THRESHOLD = 3;

// 한 회차가 회수했는가 — rewardArc payoff 채워짐 OR stakesLedger resolution kept/lost.
function chapterHasPayoff(chapter: Chapter): boolean {
  const rewardPaid = (chapter.rewardArc ?? []).some((e) => e.payoff.trim().length > 0);
  const stakeResolved = (chapter.stakesLedger ?? []).some(
    (e) => e.resolution === 'kept' || e.resolution === 'lost'
  );
  return rewardPaid || stakeResolved;
}

function chapterHasLedger(chapter: Chapter): boolean {
  return (chapter.rewardArc?.length ?? 0) > 0 || (chapter.stakesLedger?.length ?? 0) > 0;
}

export function computePayoffLedger(chapters: Chapter[]): PayoffLedgerReport {
  const measured = chapters.some(chapterHasLedger);
  if (!measured) {
    return {
      openPromises: 0, paidPromises: 0, deferredStreak: 0,
      lastPayoffEpisode: null, isStalled: false, measured: false
    };
  }

  let openPromises = 0;
  let paidPromises = 0;
  let lastPayoffEpisode: number | null = null;

  for (const chapter of chapters) {
    for (const entry of chapter.rewardArc ?? []) {
      if (entry.payoff.trim().length > 0) paidPromises += 1;
      else openPromises += 1;
    }
    if (chapterHasPayoff(chapter)) lastPayoffEpisode = chapter.episode;
  }

  let deferredStreak = 0;
  for (let i = chapters.length - 1; i >= 0; i -= 1) {
    if (chapterHasPayoff(chapters[i])) break;
    deferredStreak += 1;
  }

  return {
    openPromises,
    paidPromises,
    deferredStreak,
    lastPayoffEpisode,
    isStalled: deferredStreak >= STALL_THRESHOLD,
    measured: true
  };
}
