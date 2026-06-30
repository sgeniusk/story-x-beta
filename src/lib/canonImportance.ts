// 캐논 중요도·관계자·관련성 검색 순수 함수. 정본 §4(중요도)·§6(검색)·§14(reveal).
import type { CanonFact } from './storyEngine';
import { extractCharacterNames, extractEntityName } from './storyOntology';

export type ImportanceBand = 'anchor' | 'major' | 'soft';

const ANCHOR_MIN = 0.82;
const MAJOR_MIN = 0.45;

export function importanceBand(importance: number): ImportanceBand {
  if (importance >= ANCHOR_MIN) return 'anchor';
  if (importance >= MAJOR_MIN) return 'major';
  return 'soft';
}

export function deriveParticipants(statement: string): string[] {
  const names = new Set<string>(extractCharacterNames(statement));
  const entity = extractEntityName(statement);
  if (entity) names.add(entity);
  return Array.from(names);
}

// 핀 우선. 그 외 = 0.25·중심성 + 0.20·재등장 + 0.20·떡밥관련 (max 0.65 → 앵커 자동 도달 없음).
export function deriveImportance(
  fact: CanonFact,
  allFacts: CanonFact[],
  openThreads: string[]
): number {
  if (fact.alwaysInclude) return 0.9;
  const participants = fact.participants ?? [];
  if (participants.length === 0) return 0.1;
  const recurrence = allFacts.filter(
    (f) => f.id !== fact.id && (f.participants ?? []).some((p) => participants.includes(p))
  ).length;
  const threadHit = openThreads.some((t) => participants.some((p) => t.includes(p)));
  const centrality = Math.min(1, participants.length / 3);
  const recurrenceNorm = Math.min(1, recurrence / 5);
  const score = 0.25 * centrality + 0.2 * recurrenceNorm + 0.2 * (threadHit ? 1 : 0);
  return Math.max(0, Math.min(1, score));
}

export interface CanonContextQuery {
  participants: string[];
  openThreads: string[];
}

export interface SelectedCanon {
  selected: CanonFact[];
  omittedCount: number;
  anchorCount: number;
}

function isRelevant(fact: CanonFact, query: CanonContextQuery): boolean {
  const p = fact.participants ?? [];
  if (p.some((x) => query.participants.includes(x))) return true;
  return query.openThreads.some((t) => p.some((x) => t.includes(x)));
}

export function selectCanonForContext(
  facts: CanonFact[],
  query: CanonContextQuery,
  budget: number
): SelectedCanon {
  // alwaysInclude 핀은 importance 미설정(세션 중 토글, normalize 전)이어도 앵커로 직접 인정 — 절단 면제.
  const scoreOf = (f: CanonFact) => f.importance ?? (f.alwaysInclude ? 0.9 : 0);
  const anchors = facts.filter((f) => importanceBand(scoreOf(f)) === 'anchor');
  const nonAnchors = facts.filter((f) => importanceBand(scoreOf(f)) !== 'anchor');
  const ranked = [...nonAnchors].sort((a, b) => {
    const ra = isRelevant(a, query) ? 1 : 0;
    const rb = isRelevant(b, query) ? 1 : 0;
    if (ra !== rb) return rb - ra;
    return scoreOf(b) - scoreOf(a);
  });
  const restBudget = Math.max(0, budget - anchors.length);
  const kept = ranked.slice(0, restBudget);
  const selected = [...anchors, ...kept];
  return { selected, omittedCount: facts.length - selected.length, anchorCount: anchors.length };
}
