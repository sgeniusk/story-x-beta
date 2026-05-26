// M4 청크 C · Layer 1 — 캐논 3계층 계약 + 성장 레저 + 컨텍스트 팩 + 리페어 제안.
// 정본 — docs/storyx-harness-architecture.md § 3-4, ontology-harness plan Chunk 2.5.
//
// 핵심 — validateContinuity 의 단순 부분문자열 매칭을 폐기하고, 변경 주장을 3계층으로 분류한다.
//   - hard-canon: retcon 승인 필요. 반전 시 차단.
//   - living-state: 변하는 현재 상태. 원인·대가 기록 시 허용.
//   - soft-signal: 소문·추측. 자유.
//
// 1차 컷은 휴리스틱 — 한국어 음절 토큰 추출 + 부정 마커 비교. LLM 기반 정밀화는 청크 F·H 에서.

export type CanonLayer = 'hard-canon' | 'living-state' | 'soft-signal';

export interface ContinuityContract {
  hardCanon: string[];
  livingState: string[];
  softSignals: string[];
}

export interface CanonChangeContext {
  /** 변화가 발생한 원인 — 어떤 사건/선택이 상태를 흔들었는가. */
  cause?: string;
  /** 변화가 치른 대가 — 작품 안에서 무엇이 손해를 봤는가. */
  cost?: string;
}

export interface CanonChangeResult {
  allowed: boolean;
  /** 매칭된 계층. 매칭 안 되면 'unrelated'. */
  layer: CanonLayer | 'unrelated';
  severity: 'block' | 'warn' | 'info';
  reason: string;
  /** retcon 승인 필요 여부. hard-canon 위반은 true. */
  requiredApproval: boolean;
  /** 매칭된 contract 항목 (디버깅·repair 제안용). */
  matchedSource?: string;
}

export interface GrowthLedgerEntry {
  characterId: string;
  before: string;
  after: string;
  /** 변화를 일으킨 장면 식별자(회차·beat). */
  triggerScene: string;
  /** 인물이 한 선택 — 행위 한 줄. */
  choice: string;
  /** 변화가 치른 대가 — 작품 안에서 잃은 것. */
  cost: string;
  /** 이 변화가 앞으로 만들 결과 — 떡밥 회수 또는 새 압력. */
  futureConsequence: string;
}

export interface GrowthLedger {
  entries: GrowthLedgerEntry[];
}

export interface GrowthEntryValidation {
  ok: boolean;
  /** 비어 있는 필수 필드 목록. ok=true 면 빈 배열. */
  missing: string[];
}

export interface ContextPack {
  storyPromise: string;
  hardCanon: string[];
  livingState: string[];
  characterContracts: string[];
  worldCosts: string[];
  unresolvedThreads: string[];
  lastDeltas: string[];
  forbiddenContradictions: string[];
  koreanVoiceRules: string[];
}

export interface ContinuityRepairProposal {
  kind: 'preserve-canon' | 'intentional-change';
  description: string;
  /** intentional-change 일 때 작가에게 받을 추가 정보. */
  requiresApproval: boolean;
}

// 빈 contract 생성 — 호출 측이 점진적으로 채워 넣는다.
export function createContinuityContract(input: Partial<ContinuityContract> = {}): ContinuityContract {
  return {
    hardCanon: [...(input.hardCanon ?? [])],
    livingState: [...(input.livingState ?? [])],
    softSignals: [...(input.softSignals ?? [])]
  };
}

// 4A — 변경 주장(claim) 을 3계층 중 하나로 분류하고 허용 여부를 판정한다.
// 휴리스틱: 한국어 명사 토큰 ≥ 2 공유 + 부정 마커 차이 → "반전" 으로 본다.
export function classifyCanonChange(
  contract: ContinuityContract,
  claim: string,
  context: CanonChangeContext = {}
): CanonChangeResult {
  const claimTokens = extractKoreanNouns(claim);
  const claimNegated = hasNegation(claim);

  // hard-canon 먼저 — 가장 무거운 계층이므로 우선 매칭.
  const hardMatch = findReversalMatch(contract.hardCanon, claimTokens, claimNegated, claim);
  if (hardMatch) {
    return {
      allowed: false,
      layer: 'hard-canon',
      severity: 'block',
      reason: `hard canon 과 충돌 — "${hardMatch}". retcon 으로 처리하려면 작가 승인이 필요합니다.`,
      requiredApproval: true,
      matchedSource: hardMatch
    };
  }

  // living-state — 반전 시 cause + cost 모두 있으면 허용.
  const livingMatch = findReversalMatch(contract.livingState, claimTokens, claimNegated, claim);
  if (livingMatch) {
    const hasCause = Boolean(context.cause && context.cause.trim().length > 0);
    const hasCost = Boolean(context.cost && context.cost.trim().length > 0);
    if (hasCause && hasCost) {
      return {
        allowed: true,
        layer: 'living-state',
        severity: 'info',
        reason: `living state 변화가 원인·대가와 함께 기록됐습니다.`,
        requiredApproval: false,
        matchedSource: livingMatch
      };
    }
    const missing: string[] = [];
    if (!hasCause) missing.push('cause');
    if (!hasCost) missing.push('cost');
    return {
      allowed: false,
      layer: 'living-state',
      severity: 'warn',
      reason: `living state 변화는 원인·대가 기록이 필요합니다 — 누락: ${missing.join(', ')}.`,
      requiredApproval: false,
      matchedSource: livingMatch
    };
  }

  // soft-signal — 자유. 매칭만 보고하고 통과.
  const softMatch = findReversalMatch(contract.softSignals, claimTokens, claimNegated, claim);
  if (softMatch) {
    return {
      allowed: true,
      layer: 'soft-signal',
      severity: 'info',
      reason: `soft signal 영역의 변화입니다 — 반전 재료로 자유롭게 쓸 수 있습니다.`,
      requiredApproval: false,
      matchedSource: softMatch
    };
  }

  // 매칭 없음 — 새 주장.
  return {
    allowed: true,
    layer: 'unrelated',
    severity: 'info',
    reason: '기존 계약과 직접 충돌하지 않는 새 주장입니다.',
    requiredApproval: false
  };
}

// 4B — 성장 레저에 항목을 추가하고 검증한다.
export function appendGrowthEntry(ledger: GrowthLedger, entry: GrowthLedgerEntry): GrowthLedger {
  return { entries: [...ledger.entries, entry] };
}

// 필수 필드(원인·대가 포함) 가 모두 채워졌는지 검증. 빈 cost 는 반드시 잡는다.
export function validateGrowthEntry(entry: Partial<GrowthLedgerEntry>): GrowthEntryValidation {
  const required: Array<keyof GrowthLedgerEntry> = [
    'characterId',
    'before',
    'after',
    'triggerScene',
    'choice',
    'cost',
    'futureConsequence'
  ];
  const missing = required.filter((key) => {
    const value = entry[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
  return { ok: missing.length === 0, missing };
}

// 4C — 컨텍스트 팩 빌더. 작품 전체 원고가 아니라 압축된 결정 가능 상태만 담는다.
export interface BuildContextPackInput {
  storyPromise: string;
  contract: ContinuityContract;
  characterContracts: string[];
  worldCosts: string[];
  unresolvedThreads: string[];
  recentDeltas: string[];
  forbiddenContradictions: string[];
  koreanVoiceRules: string[];
}

export function buildContextPack(input: BuildContextPackInput): ContextPack {
  return {
    storyPromise: input.storyPromise,
    hardCanon: [...input.contract.hardCanon],
    livingState: [...input.contract.livingState],
    characterContracts: [...input.characterContracts],
    worldCosts: [...input.worldCosts],
    unresolvedThreads: [...input.unresolvedThreads],
    // 최근 3개만 — 매니페스트가 부풀지 않게.
    lastDeltas: input.recentDeltas.slice(-3),
    forbiddenContradictions: [...input.forbiddenContradictions],
    koreanVoiceRules: [...input.koreanVoiceRules]
  };
}

// 4D — hard canon 위반 시 두 가지 제안 (보존 vs 의도적 변경).
// 침묵 리라이트 금지 — 작가가 명시적으로 선택하게 한다.
export function proposeContinuityRepair(result: CanonChangeResult): ContinuityRepairProposal[] {
  if (result.allowed) return [];
  if (result.layer === 'hard-canon') {
    return [
      {
        kind: 'preserve-canon',
        description: `캐논을 그대로 두고, 충돌이 일어난 장면을 다시 짭니다. 매칭된 캐논: "${result.matchedSource ?? '미상'}".`,
        requiresApproval: false
      },
      {
        kind: 'intentional-change',
        description: `의도적 retcon — 작가가 이 변화를 명시적으로 승인하면 새 hard canon 으로 기록합니다. 작품 안에서 변화의 대가가 보여야 합니다.`,
        requiresApproval: true
      }
    ];
  }
  if (result.layer === 'living-state') {
    return [
      {
        kind: 'preserve-canon',
        description: `상태 변화를 미루고, 인물이 지금 위치를 유지하도록 다시 짭니다.`,
        requiresApproval: false
      },
      {
        kind: 'intentional-change',
        description: `변화를 그대로 두려면 원인(cause) 과 대가(cost) 를 한 줄씩 적어 주세요.`,
        requiresApproval: false
      }
    ];
  }
  return [];
}

// --- 휴리스틱 helpers (1차 컷) ---

const NEGATION_PATTERN = /않(는|다|아|음|을)|없(는|다|이|어|음)|안\s|아니다|아닙니다|못한다|못하/;

function hasNegation(text: string): boolean {
  return NEGATION_PATTERN.test(text);
}

const JOSA_RE = /(은|는|이|가|을|를|에게|에서|의|으로|로|와|과|도|만|에|께서|께)$/;

// 한국어 명사 토큰 추출 — 2글자 이상 한글 음절 그룹에서 흔한 조사를 떼고 set 으로.
function extractKoreanNouns(text: string): Set<string> {
  const matches = text.match(/[가-힣]{2,}/g) ?? [];
  const out = new Set<string>();
  for (const raw of matches) {
    const stripped = raw.replace(JOSA_RE, '');
    if (stripped.length >= 2) out.add(stripped);
  }
  return out;
}

// 명사 ≥ 2 공유 + 부정 마커 차이 → 같은 주제의 반전으로 본다. 매칭된 contract 항목을 반환.
function findReversalMatch(
  pool: string[],
  claimTokens: Set<string>,
  claimNegated: boolean,
  claim: string
): string | null {
  for (const source of pool) {
    const sourceTokens = extractKoreanNouns(source);
    const shared = countShared(claimTokens, sourceTokens);
    if (shared < 2) continue;
    const sourceNegated = hasNegation(source);
    // 부정 신호 차이 있으면 반전. 같으면 같은 주장 — 일치라 통과.
    if (claimNegated !== sourceNegated) {
      return source;
    }
    // 부정 신호 같은데 명사 ≥ 3 공유 — claim 이 source 와 거의 동일한 주장. 일치로 본다.
    if (shared >= 3 && claim.trim() !== source.trim()) {
      // 같은 주장 반복은 위반 아님 — 통과.
    }
  }
  return null;
}

function countShared(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const token of a) if (b.has(token)) n += 1;
  return n;
}
