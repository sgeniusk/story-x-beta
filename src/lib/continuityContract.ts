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
  // hard-canon 먼저 — 가장 무거운 계층이므로 우선 매칭.
  const hardMatch = findReversalMatch(contract.hardCanon, claimTokens, claim);
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
  const livingMatch = findReversalMatch(contract.livingState, claimTokens, claim);
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
  const softMatch = findReversalMatch(contract.softSignals, claimTokens, claim);
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

const NEGATION_PATTERN = /않(는|다|아|음|을)|없(는|다|이|어|음)|안\s|아니다|아닙니다|아니라|아닌|아니고|못한다|못하/;

function hasNegation(text: string): boolean {
  return NEGATION_PATTERN.test(text);
}

const JOSA_RE = /(께서|에게|에서|으로|은|는|이|가|을|를|의|로|와|과|도|만|에)$/;
const NUMERIC_RE = /\d+(?:\.\d+)?\s*(?:년|개월|일|장|명|개|화|층|번|권|쪽|페이지)?/g;
const SUBJECT_RE = /^\s*([가-힣]{1,8})(?:은|는|이|가|께서|의)/u;

const STATE_STOPWORDS = new Set([
  '살다',
  '죽다',
  '사망',
  '생존',
  '살아있다',
  '죽었다',
  '있다',
  '없다',
  '나타나다',
  '사라지다',
  '발견',
  '실종',
  '열리다',
  '닫히다',
  '열렸다',
  '닫혔다',
  '닫힌',
  '열린',
  '믿다',
  '믿지',
  '신뢰',
  '의심',
  '숨기다',
  '드러나다'
]);

type OppositionSide = 'a' | 'b';

interface OppositionPattern {
  axis: string;
  side: OppositionSide;
  pattern: RegExp;
}

interface StateEvidence {
  axis: string;
  side: OppositionSide;
  subject?: string;
  identityTokens: Set<string>;
}

const OPPOSITION_PATTERNS: OppositionPattern[] = [
  // Life / death.
  { axis: 'life', side: 'a', pattern: /살아\s*있|살아있|생존|살다/ },
  { axis: 'life', side: 'b', pattern: /죽었|죽다|사망|죽은|살해|피살|살인/ },
  // Presence / absence.
  { axis: 'presence', side: 'a', pattern: /나타났|나타나|발견|존재|있다/ },
  { axis: 'presence', side: 'b', pattern: /사라졌|사라지|실종|없다|없는/ },
  // Open / closed.
  { axis: 'open', side: 'a', pattern: /열렸|열리|열린/ },
  { axis: 'open', side: 'b', pattern: /닫혔|닫히|닫힌|닫혀/ },
  // Trust / distrust is a common living-state reversal in this story engine.
  { axis: 'trust', side: 'a', pattern: /신뢰|믿기로|믿기 시작|믿는다|믿다/ },
  { axis: 'trust', side: 'b', pattern: /믿지|의심|불신/ },
  // Concealed / revealed.
  { axis: 'reveal', side: 'a', pattern: /드러났|드러나|밝혀졌|밝히/ },
  { axis: 'reveal', side: 'b', pattern: /숨겼|숨기|감췄|감추/ }
];

// 한국어 명사 토큰 추출 — 한글 음절 그룹에서 흔한 조사를 뗀다. 단음절 고유명도 보존한다.
function extractKoreanNouns(text: string): Set<string> {
  const matches = text.match(/[가-힣]+/g) ?? [];
  const out = new Set<string>();
  for (const raw of matches) {
    const stripped = raw.replace(JOSA_RE, '');
    if (stripped.length >= 1) out.add(stripped);
  }
  return out;
}

// 절(clause) 경계 연결어미 — "형사이며"처럼 술어에 붙는 접속을 끊어 술어 명사를 노출한다.
// 동사 연결 '고'(찾고 싶어)나 쉼표는 제외한다 — 술어와 부정을 분리해 기존 반전 판정을 깨기 때문.
const CLAUSE_SPLIT_RE = /(?:이며|으며|며|지만|는데|으나)\s*/;

function clauseSplit(text: string): string[] {
  return text.split(CLAUSE_SPLIT_RE).map((part) => part.trim()).filter(Boolean);
}

// 절 단위로 쪼갠 뒤 명사를 합친다 — "강력계 형사이며"가 형사를 내놓게 한다.
function clauseExpandedNouns(text: string): Set<string> {
  const out = new Set<string>();
  for (const clause of clauseSplit(text)) {
    for (const token of extractKoreanNouns(clause)) out.add(token);
  }
  return out;
}

// 계사 부정 — "X가/이/은/는 아니(다/라/…)" 의 X 명사. 술어명사를 직접 부정하는 강한 모순 신호.
function copulaNegatedNouns(text: string): Set<string> {
  const out = new Set<string>();
  const re = /([가-힣]{2,8})(?:이|가|은|는)\s*아니/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) out.add(match[1].replace(JOSA_RE, ''));
  return out;
}

// 은/는/이/가/께서 로 표지된 명사(주어·주제 = 엔티티) 집합. 술어 부정 판정에서 엔티티는 제외한다.
function markedEntities(text: string): Set<string> {
  const out = new Set<string>();
  for (const match of text.matchAll(/([가-힣]{2,8})(?:은|는|이|가|께서)/g)) {
    out.add(match[1].replace(JOSA_RE, ''));
  }
  return out;
}

// 주술어(마지막 절) 부정 여부 — 부수 부정("없이도")과 주술어 부정("하지 않는다")을 가른다.
// "…하지 않는다"는 참, "…없이도 …울음을 터뜨린다"(마지막 절 긍정)는 거짓.
function hasFinalNegation(text: string): boolean {
  const clauses = text.split(/(?:이며|으며|며|지만|는데|으나|고|,)\s*/).filter(Boolean);
  return hasNegation(clauses[clauses.length - 1] ?? text);
}

// 두 문장이 엔티티(주어·주제)가 아닌 공유 술어 토큰을 갖는가 — 반전이 술어에 걸렸음을 보증.
function sharesNonEntityPredicate(a: Set<string>, b: Set<string>, aText: string, bText: string): boolean {
  const entities = new Set([...markedEntities(aText), ...markedEntities(bText)]);
  for (const token of a) {
    if (token.length < 2 || entities.has(token) || isStateToken(token)) continue;
    if (b.has(token)) return true;
  }
  return false;
}

// 명사 ≥ 2 공유 + 부정 마커 차이 → 같은 주제의 반전으로 본다. 매칭된 contract 항목을 반환.
function findReversalMatch(
  pool: string[],
  claimTokens: Set<string>,
  claim: string
): string | null {
  const claimStates = extractStateEvidence(claim);
  const claimNumbers = extractNumericValues(claim);
  for (const source of pool) {
    const sourceTokens = extractKoreanNouns(source);
    if (hasOpposingState(source, claim, sourceTokens, claimTokens, claimStates)) return source;
    if (hasNumericDivergence(source, claim, sourceTokens, claimTokens, claimNumbers)) return source;
    // 절 확장 — 연결어미가 붙어 술어 명사가 안 쪼개진 경우("형사이며")까지 공유를 본다.
    const expandedSource = clauseExpandedNouns(source);
    const expandedClaim = clauseExpandedNouns(claim);
    if (countShared(expandedClaim, expandedSource) < 2) continue;
    // 계사 부정 — 한쪽이 "X가 아니"로 부정한 술어명사 X를 다른 쪽이 단정하면 반전(케이스 A: 형사).
    const claimCopula = copulaNegatedNouns(claim);
    const sourceCopula = copulaNegatedNouns(source);
    for (const noun of claimCopula) {
      if (expandedSource.has(noun) && !sourceCopula.has(noun)) return source;
    }
    for (const noun of sourceCopula) {
      if (expandedClaim.has(noun) && !claimCopula.has(noun)) return source;
    }
    // 주술어 부정 극성 — 한쪽만 주술어를 부정 + 같은 엔티티 + 공유 술어면 반전.
    // 부수 부정("없이도")은 마지막 절이 긍정이라 제외되고, 엔티티만 공유하면 술어 미공유로 제외된다.
    if (
      hasFinalNegation(claim) !== hasFinalNegation(source) &&
      hasSameEntity(source, claim, expandedSource, expandedClaim) &&
      sharesNonEntityPredicate(expandedClaim, expandedSource, claim, source)
    ) {
      return source;
    }
  }
  return null;
}

function extractStateEvidence(text: string): StateEvidence[] {
  const tokens = extractKoreanNouns(text);
  const subject = extractSubject(text);
  const identityTokens = new Set([...tokens].filter((token) => !isStateToken(token)));
  const evidence: StateEvidence[] = [];
  for (const item of OPPOSITION_PATTERNS) {
    if (item.pattern.test(text)) {
      evidence.push({
        axis: item.axis,
        side: item.side,
        subject,
        identityTokens
      });
    }
  }
  return evidence;
}

function hasOpposingState(
  source: string,
  claim: string,
  sourceTokens: Set<string>,
  claimTokens: Set<string>,
  claimStates: StateEvidence[]
): boolean {
  if (claimStates.length === 0) return false;
  const sourceStates = extractStateEvidence(source);
  for (const sourceState of sourceStates) {
    for (const claimState of claimStates) {
      if (sourceState.axis !== claimState.axis || sourceState.side === claimState.side) continue;
      if (requiresSharedTarget(sourceState.axis) && !hasSharedTargetToken(sourceState, claimState)) continue;
      if (hasSameEntity(source, claim, sourceTokens, claimTokens, sourceState, claimState)) return true;
    }
  }
  return false;
}

function hasNumericDivergence(
  source: string,
  claim: string,
  sourceTokens: Set<string>,
  claimTokens: Set<string>,
  claimNumbers: Set<string>
): boolean {
  if (claimNumbers.size === 0) return false;
  const sourceNumbers = extractNumericValues(source);
  if (sourceNumbers.size === 0) return false;
  if (setsEqual(sourceNumbers, claimNumbers)) return false;
  if (!hasSameEntity(source, claim, sourceTokens, claimTokens)) return false;
  return countSharedWithoutNumbers(sourceTokens, claimTokens) >= 2;
}

function hasSameEntity(
  source: string,
  claim: string,
  sourceTokens: Set<string>,
  claimTokens: Set<string>,
  sourceState?: StateEvidence,
  claimState?: StateEvidence
): boolean {
  const sourceSubject = sourceState?.subject ?? extractSubject(source);
  const claimSubject = claimState?.subject ?? extractSubject(claim);
  if (sourceSubject && claimSubject) return sourceSubject === claimSubject;
  const sourceIdentity = sourceState?.identityTokens ?? sourceTokens;
  const claimIdentity = claimState?.identityTokens ?? claimTokens;
  return countSharedWithoutNumbers(sourceIdentity, claimIdentity) >= 2;
}

function extractSubject(text: string): string | undefined {
  const match = text.match(SUBJECT_RE);
  if (match?.[1]) return match[1].replace(JOSA_RE, '');
  // 폴백 — 주어가 문두에 없을 때("…한태겸이 살해되었고") 첫 주격/주제 표지 명사.
  // 소유격 '의'는 제외(수식어라 주어가 아님). 단음절 잡음 방지로 2자+.
  const mid = text.match(/([가-힣]{2,8})(?:은|는|이|가|께서)(?![가-힣])/u);
  return mid?.[1]?.replace(JOSA_RE, '');
}

function extractNumericValues(text: string): Set<string> {
  const values = new Set<string>();
  const matches = text.match(NUMERIC_RE) ?? [];
  for (const match of matches) {
    values.add(match.replace(/\s+/g, ''));
  }
  return values;
}

function isStateToken(token: string): boolean {
  if (STATE_STOPWORDS.has(token)) return true;
  if (/(살아있|살았|죽었|사망|살해|피살|살인|생존|나타났|사라졌|실종|발견|존재|열렸|닫혔|신뢰|의심|불신|숨겼|드러났|밝혀졌)/.test(token)) return true;
  return [...STATE_STOPWORDS].some((word) => token.includes(word) || word.includes(token));
}

function requiresSharedTarget(axis: string): boolean {
  return axis === 'presence' || axis === 'reveal';
}

function hasSharedTargetToken(sourceState: StateEvidence, claimState: StateEvidence): boolean {
  const sourceSubject = sourceState.subject;
  const claimSubject = claimState.subject;
  for (const token of sourceState.identityTokens) {
    if (token === sourceSubject || token === claimSubject) continue;
    if (claimState.identityTokens.has(token)) return true;
  }
  return false;
}

function countSharedWithoutNumbers(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const token of a) {
    if (/\d/.test(token)) continue;
    if (isStateToken(token)) continue;
    if (b.has(token)) n += 1;
  }
  return n;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

function countShared(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const token of a) if (b.has(token)) n += 1;
  return n;
}
