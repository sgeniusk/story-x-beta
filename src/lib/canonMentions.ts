// 캐논 인라인 멘션(B3) — 본문 prose 에서 등장 캐논(인물 이름)을 이름별로 그룹화하는 순수 모듈.
// extractEntityName 이 인물 이름만 추출하므로 멘션은 인물 캐논 중심이다(설계 비목표 참고).
import type { CanonFact } from './storyEngine';
import { extractEntityName } from './storyOntology';

export interface CanonMention {
  name: string;
  factIds: string[];
}

export function detectCanonMentions(prose: string, canonFacts: CanonFact[]): CanonMention[] {
  if (!prose) return [];
  const byName = new Map<string, { factIds: string[]; firstIndex: number }>();
  for (const fact of canonFacts) {
    const name = extractEntityName(fact.statement);
    if (!name) continue;
    const idx = prose.indexOf(name);
    if (idx < 0) continue;
    const entry = byName.get(name);
    if (entry) {
      entry.factIds.push(fact.id);
      entry.firstIndex = Math.min(entry.firstIndex, idx);
    } else {
      byName.set(name, { factIds: [fact.id], firstIndex: idx });
    }
  }
  return [...byName.entries()]
    .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
    .map(([name, value]) => ({ name, factIds: value.factIds }));
}
