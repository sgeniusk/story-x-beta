// PLAY(DiveDesk) 런타임 검증기 — 받은 답을 캐논 밴드별로 검사(순수). 정본 §5·§7.
import type { CanonFact } from './storyEngine';
import type { ContinuityContract } from './continuityContract';
import { classifyCanonChange } from './continuityContract';
import { parseSceneSegments } from './diveSession';
import { factBand } from './canonImportance';

export interface PlayConflict {
  factId: string;
  band: 'anchor' | 'major';
  factStatement: string;
  snippet: string;
}
export interface PlaySurpriseCandidate {
  snippet: string;
  relatedThread?: string;
}
export interface PlayTurnVerdict {
  conflicts: PlayConflict[];
  surpriseCandidates: PlaySurpriseCandidate[];
  blocksCanonization: boolean;
}

// 밴드별 fact.statement를 담은 미니 contract + statement→factId 역인덱스.
function buildBandContract(facts: CanonFact[]): { contract: ContinuityContract; owner: Map<string, string> } {
  const hardCanon: string[] = [];
  const livingState: string[] = [];
  const softSignals: string[] = [];
  const owner = new Map<string, string>();
  for (const f of facts) {
    if (!f.statement.trim()) continue;
    if (!owner.has(f.statement)) owner.set(f.statement, f.id);
    const band = factBand(f);
    if (band === 'anchor') hardCanon.push(f.statement);
    else if (band === 'major') livingState.push(f.statement);
    else softSignals.push(f.statement);
  }
  return { contract: { hardCanon, livingState, softSignals }, owner };
}

function detectConflicts(segments: string[], facts: CanonFact[]): PlayConflict[] {
  const { contract, owner } = buildBandContract(facts);
  const conflicts: PlayConflict[] = [];
  for (const seg of segments) {
    const result = classifyCanonChange(contract, seg);
    if (result.allowed || !result.matchedSource) continue;
    if (result.layer === 'hard-canon') {
      conflicts.push({
        factId: owner.get(result.matchedSource) ?? '',
        band: 'anchor',
        factStatement: result.matchedSource,
        snippet: seg
      });
    } else if (result.layer === 'living-state') {
      conflicts.push({
        factId: owner.get(result.matchedSource) ?? '',
        band: 'major',
        factStatement: result.matchedSource,
        snippet: seg
      });
    }
  }
  return conflicts;
}

export function validatePlayTurn(
  replyText: string,
  canonFacts: CanonFact[],
  openThreads: string[]
): PlayTurnVerdict {
  void openThreads;
  const segments = parseSceneSegments(replyText).map((s) => s.text);
  const conflicts = detectConflicts(segments, canonFacts);
  return {
    conflicts,
    surpriseCandidates: [],
    blocksCanonization: conflicts.some((c) => c.band === 'anchor')
  };
}
