// PLAY(DiveDesk) 런타임 검증기 — 받은 답을 캐논 밴드별로 검사(순수). 정본 §5·§7.
import type { CanonFact } from './storyEngine';
import type { ContinuityContract } from './continuityContract';
import { classifyCanonChange } from './continuityContract';
import { parseSceneSegments, selectCondenseSpan, type DiveSession } from './diveSession';
import { factBand, deriveParticipants } from './canonImportance';

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

export interface DeviationCandidate {
  id: string;
  snippet: string;
  relatedThread?: string;
}
export interface ConsolidationDeviations {
  surprises: DeviationCandidate[];
  conflictCounts: { anchor: number; major: number };
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

// 앞머리 reveal 마커("사실 X는…")는 subject 추출을 흔들어 대립 검출을 놓친다(미탐).
// 미스터리 reveal형 앵커 위반을 하드 차단에서 흘리지 않도록 벗긴 변형도 함께 검사한다.
const LEADING_MARKER = /^(사실은|사실|실은|알고\s*보니)[,\s]*/;

function firstConflictLayer(seg: string, contract: ContinuityContract) {
  const variants = [seg];
  const stripped = seg.replace(LEADING_MARKER, '');
  if (stripped !== seg && stripped.trim()) variants.push(stripped);
  for (const v of variants) {
    const result = classifyCanonChange(contract, v);
    if (!result.allowed && result.matchedSource) return result;
  }
  return null;
}

function detectConflicts(segments: string[], facts: CanonFact[]): PlayConflict[] {
  const { contract, owner } = buildBandContract(facts);
  const conflicts: PlayConflict[] = [];
  for (const seg of segments) {
    const result = firstConflictLayer(seg, contract);
    if (!result || !result.matchedSource) continue;
    if (result.layer === 'hard-canon') {
      conflicts.push({ factId: owner.get(result.matchedSource) ?? '', band: 'anchor', factStatement: result.matchedSource, snippet: seg });
    } else if (result.layer === 'living-state') {
      conflicts.push({ factId: owner.get(result.matchedSource) ?? '', band: 'major', factStatement: result.matchedSource, snippet: seg });
    }
  }
  return conflicts;
}

// 좁은 reveal/반전 마커 화이트리스트(과탐 방지 — 미탐 선호). 튜닝은 empirical.
const REVEAL_MARKERS = /사실|실은|알고\s*보니|아니었|숨겼|숨기고|비밀은|나도/;

function collectEntities(facts: CanonFact[]): Set<string> {
  const out = new Set<string>();
  for (const f of facts) {
    const ps = (f.participants ?? []).length > 0 ? f.participants! : deriveParticipants(f.statement);
    for (const p of ps) out.add(p);
  }
  return out;
}

function threadHit(seg: string, openThreads: string[]): string | undefined {
  for (const t of openThreads) {
    // 떡밥 문장의 2글자+ 토큰(한국어 명사 대부분)이 세그먼트에 등장하면 접촉으로 본다.
    const tokens = t.split(/[\s,.?!·]+/).filter((w) => w.length >= 2);
    if (tokens.some((w) => seg.includes(w))) return t;
  }
  return undefined;
}

function detectSurprise(
  segments: string[],
  facts: CanonFact[],
  openThreads: string[],
  conflicts: PlayConflict[]
): PlaySurpriseCandidate[] {
  const conflictSnippets = new Set(conflicts.map((c) => c.snippet));
  const entities = collectEntities(facts);
  const out: PlaySurpriseCandidate[] = [];
  for (const seg of segments) {
    if (conflictSnippets.has(seg)) continue;
    if (!REVEAL_MARKERS.test(seg)) continue;
    const thread = threadHit(seg, openThreads);
    const touchesEntity = Array.from(entities).some((e) => seg.includes(e));
    if (!thread && !touchesEntity) continue;
    out.push({ snippet: seg, relatedThread: thread });
  }
  return out;
}

export function validatePlayTurn(
  replyText: string,
  canonFacts: CanonFact[],
  openThreads: string[]
): PlayTurnVerdict {
  const segments = parseSceneSegments(replyText).map((s) => s.text);
  const conflicts = detectConflicts(segments, canonFacts);
  const surpriseCandidates = detectSurprise(segments, canonFacts, openThreads, conflicts);
  return {
    conflicts,
    surpriseCandidates,
    blocksCanonization: conflicts.some((c) => c.band === 'anchor')
  };
}

// 응결 대상 span의 메시지 verdict에서 결정 대상(✦)과 충돌 카운트를 모은다.
export function deriveDeviationCandidates(session: DiveSession): ConsolidationDeviations {
  const { condense } = selectCondenseSpan(session);
  const surprises: DeviationCandidate[] = [];
  let anchor = 0;
  let major = 0;
  for (const m of condense) {
    const v = m.verdict;
    if (!v) continue;
    v.surpriseCandidates.forEach((s, i) =>
      surprises.push({ id: `${m.id}-s${i}`, snippet: s.snippet, relatedThread: s.relatedThread })
    );
    for (const c of v.conflicts) {
      if (c.band === 'anchor') anchor++;
      else if (c.band === 'major') major++;
    }
  }
  return { surprises, conflictCounts: { anchor, major } };
}

// 승격 statement 중 기존 캐논/서로와 문자열 근접 중복인 것을 제거. 의미 중복은 후속 LLM 검증기.
export function dedupePromotions(
  promotedStatements: string[],
  existing: Array<{ statement: string }>
): string[] {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ');
  const existingN = existing.map((e) => norm(e.statement)).filter((s) => s.length > 0);
  const seen: string[] = [];
  const out: string[] = [];
  for (const raw of promotedStatements) {
    const n = norm(raw);
    if (!n) continue;
    const dup = [...existingN, ...seen].some((e) => e.includes(n) || n.includes(e));
    if (dup) continue;
    seen.push(n);
    out.push(raw.trim());
  }
  return out;
}
