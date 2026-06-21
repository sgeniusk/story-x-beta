import { extractClaims, findUnsupportedClaims, mapClaimsToEvidence } from './claimLedger';
import { auditCitations } from './citationGate';
import { auditCounterArgument, auditResearchEthics } from './academicIntegrity';
import { inspectKoreanVoice } from './koreanVoiceGate';
import { detectPromptLeak } from './leakGate';

// M4 청크 E · Layer 4 — 기본 품질 게이트 + academic extension.
// 정본 — docs/storyx-harness-architecture.md § 5-3, 3-3 (두 트랙 설계).
//
// 각 게이트는 { key, track, requirement, evaluate, reason } 형태.
// 트랙 — common / commercial / literary / essay / academic.
// StoryMode 가중치(commercialWeight, literaryWeight) 로 강제(blocking) / 권고(advisory) 가 결정된다.
//   - common 게이트: 항상 blocking
//   - commercial 게이트: commercialWeight ≥ 0.5 일 때 blocking, 아니면 advisory
//   - literary 게이트: literaryWeight ≥ 0.5 일 때 blocking, 아니면 advisory
//   - essay 게이트: 에세이 매체에서만 평가, gate_disclosure_scope 만 항상 blocking, 나머지 둘은 advisory
//   - academic 게이트: 학술 매체에서만 노출, 4개 모두 advisory

export type GateKey =
  | 'gate_hook_first_300'
  | 'gate_hook_last_200'
  | 'gate_scene_sequel_balance'
  | 'gate_voice_match_70'
  | 'gate_pressure_triangle_active'
  | 'gate_prompt_leak'
  | 'gate_ambiguity_at_finale'
  | 'gate_ethical_cost_present'
  | 'gate_motif_variation'
  | 'gate_historical_density'
  | 'gate_universal_leap'
  | 'gate_self_reversal'
  | 'gate_disclosure_scope'
  | 'claim_evidence_mapping'
  | 'citation_integrity'
  | 'counter_argument_present'
  | 'research_ethics_disclosure';

export type GateTrack = 'common' | 'commercial' | 'literary' | 'essay' | 'academic';
export type GateRequirement = 'blocking' | 'advisory';

export interface StoryMode {
  /** 0~1. ≥ 0.5 면 commercial 게이트가 blocking. */
  commercialWeight: number;
  /** 0~1. ≥ 0.5 면 literary 게이트가 blocking. */
  literaryWeight: number;
}

export interface GateInput {
  /** 생성된 본문 — gate_hook_first_300 / gate_hook_last_200 가 본다. */
  text?: string;
  /** 프롬프트/지시문 누수 건수 — 없으면 text 에서 detectPromptLeak 로 파생. */
  promptLeakCount?: number;
  /** 매체 — 에세이/학술 게이트 활성 여부. */
  medium?: string;
  /** 연재형 여부 — gate_hook_last_200 는 serial 일 때만 평가. */
  isSerial?: boolean;
  /** koreanVoiceGate.inspectKoreanVoice 점수 (0~100). */
  voiceMatchScore?: number;
  /** pressure triangle (want/desire/taboo) 가 작품 안에서 작동하는가. */
  pressureTriangleActive?: boolean;
  /** scene/sequel 비율 (0~1). 0.3~0.7 권장. */
  sceneSequelRatio?: number;
  /** 작품 마지막 회차(또는 단편 완결) 여부. */
  isFinale?: boolean;
  /** 마무리의 모호함 점수 0~100. */
  ambiguityScore?: number;
  /** 윤리적 대가가 작품 안에 보이는가. */
  ethicalCostPresent?: boolean;
  /** 같은 모티프의 변주 횟수. */
  motifVariations?: number;
  /** 역사적/문화적 디테일 밀도 0~100. */
  historicalDensity?: number;
  /** 텍스트만으로 측정 가능한 지표인지. false 면 해당 게이트를 평가하지 않고 skipped 로 보낸다. */
  metricMeasurements?: Partial<Record<MeasuredMetricKey, boolean>>;
  /** 에세이 — 개인 경험에서 보편으로의 도약 여부. */
  universalLeapPresent?: boolean;
  /** 에세이 — 자기 반전(self-reversal) 횟수. */
  selfReversalCount?: number;
  /** 에세이 — 실제 인물 노출이 안전 범위 안인가. */
  disclosureScopeSafe?: boolean;
  /** 학술 — 주장 레저가 모든 주장에 근거를 매핑했는가. */
  claimEvidenceMapped?: boolean;
  /** 학술 — claimLedger 가 찾은 미근거 주장 수. */
  unsupportedClaimCount?: number;
  /** 학술 — citationGate 가 찾은 orphan citation + page-missing quote 수. */
  citationIssueCount?: number;
  /** 학술 — 외부에서 계산한 citation integrity 통과 여부. */
  citationIntegrityPassed?: boolean;
  /** 학술 — 반론/대안가설/limitation 마커가 명시적으로 있는가. */
  counterArgumentPresent?: boolean;
  /** 학술 — 연구 윤리 점검에서 발견한 이슈 수. */
  researchEthicsIssueCount?: number;
  /** 학술 — 외부에서 계산한 연구 윤리 공개 통과 여부. */
  researchEthicsSafe?: boolean;
}

export interface GateResult {
  gate: GateKey;
  track: GateTrack;
  requirement: GateRequirement;
  passed: boolean;
  reason: string;
  measured?: boolean;
}

export interface QualityGatesReport {
  results: GateResult[];
  /** 텍스트만으로 측정 불가능해 평가에서 제외한 게이트. fake default pass 를 막기 위한 명시적 흔적. */
  skipped: GateResult[];
  /** 강제 게이트가 모두 통과했는가 — readyForProduction 의 후속 조건. */
  blockingPassed: boolean;
  /** 권고 게이트 중 실패한 항목 수 — 작가에게 알리되 차단은 안 함. */
  advisoryFailures: number;
}

export type MeasuredMetricKey =
  | 'voiceMatchScore'
  | 'sceneSequelRatio'
  | 'ambiguityScore'
  | 'ethicalCostPresent'
  | 'motifVariations'
  | 'historicalDensity';

export type ProseQualityMetrics = Pick<
  GateInput,
  | 'voiceMatchScore'
  | 'sceneSequelRatio'
  | 'ambiguityScore'
  | 'ethicalCostPresent'
  | 'motifVariations'
  | 'historicalDensity'
  | 'metricMeasurements'
>;

// 모든 게이트를 평가하고 모드 가중치에 맞춰 blocking/advisory 를 결정한다.
export function evaluateQualityGates(input: GateInput, mode: StoryMode): QualityGatesReport {
  const isEssay = input.medium === 'essay';
  const isAcademic = input.medium === 'academic';
  const results: GateResult[] = [];
  const skipped: GateResult[] = [];

  for (const def of GATE_DEFS) {
    // 에세이 게이트는 에세이 매체에서만 평가.
    if (def.track === 'essay' && !isEssay) continue;
    // 학술 게이트는 academic 매체에서만 노출한다.
    if (def.track === 'academic' && !isAcademic) continue;
    // gate_hook_last_200 은 serial 에서만 평가.
    if (def.key === 'gate_hook_last_200' && !input.isSerial) continue;
    // gate_ambiguity_at_finale 는 finale 에서만 평가.
    if (def.key === 'gate_ambiguity_at_finale' && !input.isFinale) continue;

    const requirement = resolveRequirement(def, mode);
    if (def.metricKey && input.metricMeasurements?.[def.metricKey] === false) {
      skipped.push({
        gate: def.key,
        track: def.track,
        requirement,
        passed: false,
        measured: false,
        reason: '텍스트만으로 안정 측정할 수 없어 fake default 없이 평가에서 제외했습니다.'
      });
      continue;
    }

    const passed = def.evaluate(input);
    results.push({
      gate: def.key,
      track: def.track,
      requirement,
      passed,
      reason: resolveGateReason(passed ? def.passReason : def.failReason, input)
    });
  }

  const blockingFailures = results.filter((r) => r.requirement === 'blocking' && !r.passed);
  const advisoryFailures = results.filter((r) => r.requirement === 'advisory' && !r.passed).length;

  return {
    results,
    skipped,
    blockingPassed: blockingFailures.length === 0,
    advisoryFailures
  };
}

export function buildProseQualityMetrics(text: string): ProseQualityMetrics {
  const paragraphs = splitParagraphs(text);
  const sceneSequel = measureSceneSequelRatio(paragraphs);
  const motif = measureMotifVariations(paragraphs);

  return {
    voiceMatchScore: inspectKoreanVoice(text).score,
    sceneSequelRatio: sceneSequel.measured ? sceneSequel.value : undefined,
    ambiguityScore: undefined,
    ethicalCostPresent: hasEthicalCost(text),
    motifVariations: motif.measured ? motif.count : undefined,
    historicalDensity: measureHistoricalDensity(text),
    metricMeasurements: {
      voiceMatchScore: true,
      sceneSequelRatio: sceneSequel.measured,
      ambiguityScore: false,
      ethicalCostPresent: true,
      motifVariations: motif.measured,
      historicalDensity: true
    }
  };
}

// --- 내부 정의 ---

interface GateDef {
  key: GateKey;
  track: GateTrack;
  metricKey?: MeasuredMetricKey;
  evaluate: (input: GateInput) => boolean;
  passReason: string | ((input: GateInput) => string);
  failReason: string | ((input: GateInput) => string);
}

// 게이트 12개 정의. 휴리스틱은 보수적 — 1차 컷.
const GATE_DEFS: GateDef[] = [
  {
    key: 'gate_hook_first_300',
    track: 'commercial',
    evaluate: (i) => hasOpeningHook(i.text ?? ''),
    passReason: '첫 300자 안에 행동/긴장 신호가 보입니다.',
    failReason: '첫 300자가 평이합니다 — 독자가 멈출 신호가 필요합니다.'
  },
  {
    key: 'gate_hook_last_200',
    track: 'commercial',
    evaluate: (i) => hasClosingCliff(i.text ?? ''),
    passReason: '마지막 200자에 다음 회차로 끌어가는 신호가 있습니다.',
    failReason: '마지막 200자가 닫힌 채로 끝납니다 — 연재의 다음 약속이 없습니다.'
  },
  {
    key: 'gate_scene_sequel_balance',
    track: 'common',
    metricKey: 'sceneSequelRatio',
    evaluate: (i) =>
      typeof i.sceneSequelRatio === 'number' && i.sceneSequelRatio >= 0.3 && i.sceneSequelRatio <= 0.7,
    passReason: 'scene/sequel 비율이 권장 범위(0.3~0.7) 안입니다.',
    failReason: 'scene/sequel 비율이 권장 범위를 벗어났습니다 — 호흡 조정 필요.'
  },
  {
    key: 'gate_voice_match_70',
    track: 'common',
    metricKey: 'voiceMatchScore',
    evaluate: (i) => (i.voiceMatchScore ?? 0) >= 70,
    passReason: 'koreanVoiceGate 점수가 70 이상입니다.',
    failReason: 'koreanVoiceGate 점수가 70 미만입니다 — 문체 점검 필요.'
  },
  {
    key: 'gate_pressure_triangle_active',
    track: 'common',
    evaluate: (i) => Boolean(i.pressureTriangleActive),
    passReason: 'want/desire/taboo 압력이 작품 안에서 작동합니다.',
    failReason: 'pressure triangle 이 비어 있거나 작동하지 않습니다.'
  },
  {
    key: 'gate_prompt_leak',
    track: 'common',
    evaluate: (i) => resolvePromptLeakCount(i) === 0,
    passReason: '프롬프트/지시문 누수가 본문에 없습니다.',
    failReason: (i) =>
      `프롬프트/지시문 누수 ${resolvePromptLeakCount(i)}건이 본문에 남아 있습니다 — 회차 확정 전 제거가 필요합니다.`
  },
  {
    key: 'gate_ambiguity_at_finale',
    track: 'literary',
    metricKey: 'ambiguityScore',
    evaluate: (i) => (i.ambiguityScore ?? 0) >= 60,
    passReason: '마무리에 의미 있는 모호함이 남아 있습니다.',
    failReason: '마무리가 너무 닫혀 있습니다 — 작품성 트랙에서는 여백이 필요합니다.'
  },
  {
    key: 'gate_ethical_cost_present',
    track: 'literary',
    metricKey: 'ethicalCostPresent',
    evaluate: (i) => Boolean(i.ethicalCostPresent),
    passReason: '윤리적 대가가 작품 안에 보입니다.',
    failReason: '윤리적 대가가 없어 인물의 선택이 가볍습니다.'
  },
  {
    key: 'gate_motif_variation',
    track: 'literary',
    metricKey: 'motifVariations',
    evaluate: (i) => (i.motifVariations ?? 0) >= 2,
    passReason: '같은 모티프가 변주되며 깊이가 누적됩니다.',
    failReason: '모티프 변주가 부족합니다 — 같은 이미지가 새 의미를 얻어야 합니다.'
  },
  {
    key: 'gate_historical_density',
    track: 'literary',
    metricKey: 'historicalDensity',
    evaluate: (i) => (i.historicalDensity ?? 0) >= 50,
    passReason: '역사적/문화적 디테일이 충분히 밀도 있습니다.',
    failReason: '역사적 디테일이 얕습니다 — 작품 세계의 무게가 약합니다.'
  },
  {
    key: 'gate_universal_leap',
    track: 'essay',
    evaluate: (i) => Boolean(i.universalLeapPresent),
    passReason: '개인 경험이 보편의 질문으로 도약합니다.',
    failReason: '개인 경험이 사적 일기로 끝납니다 — 보편으로의 도약이 필요합니다.'
  },
  {
    key: 'gate_self_reversal',
    track: 'essay',
    evaluate: (i) => (i.selfReversalCount ?? 0) >= 1,
    passReason: '화자가 자기 글을 한 번 이상 의심합니다.',
    failReason: '자기 반전이 없습니다 — 일관된 한 주장만 흐릅니다.'
  },
  {
    key: 'gate_disclosure_scope',
    track: 'essay',
    evaluate: (i) => Boolean(i.disclosureScopeSafe),
    passReason: '실제 인물 노출 범위가 안전합니다.',
    failReason: '실제 인물 노출이 위험 범위입니다 — 출간 전 반드시 점검.'
  },
  // Academic gates — 영어 APA 기준. A2/A3/A4 모두 로컬 휴리스틱 판정이며 advisory 로 유지한다.
  {
    key: 'claim_evidence_mapping',
    track: 'academic',
    evaluate: (i) => resolveUnsupportedClaimCount(i) === 0,
    passReason: '영어 APA 원고의 명시적 주장에 같은/인접 단락 근거가 매핑되어 있습니다.',
    failReason: (i) => `근거 없는 학술 주장 ${resolveUnsupportedClaimCount(i)}개가 있습니다.`
  },
  {
    key: 'citation_integrity',
    track: 'academic',
    evaluate: (i) => resolveCitationIssueCount(i) === 0,
    passReason: '영어 APA 본문 인용이 참고문헌과 대조되고, 직접 인용의 페이지 표기가 확인됩니다.',
    failReason: (i) => `깨진 인용 또는 페이지 없는 직접 인용 ${resolveCitationIssueCount(i)}개가 있습니다.`
  },
  {
    key: 'counter_argument_present',
    track: 'academic',
    evaluate: (i) => !resolveCounterArgumentMissing(i),
    passReason: '영어 APA 원고의 명시적 주장에 반론·대안 가설·limitation 중 하나가 확인됩니다.',
    failReason: '반론·대안 가설·limitation 없이 일방적 학술 주장만 제시되어 있습니다.'
  },
  {
    key: 'research_ethics_disclosure',
    track: 'academic',
    evaluate: (i) => resolveResearchEthicsIssueCount(i) === 0,
    passReason: '피험자/데이터 언급에 필요한 익명성·동의·IRB 윤리 공개가 확인됩니다.',
    // A4에서는 advisory 로 유지한다. Blocking 승격은 출간 정책(A5 이후)에서 결정한다.
    failReason: (i) => `연구 윤리 공개 이슈 ${resolveResearchEthicsIssueCount(i)}개가 있습니다.`
  }
];

function resolveRequirement(def: GateDef, mode: StoryMode): GateRequirement {
  if (def.track === 'common') return 'blocking';
  if (def.track === 'academic') {
    // A2 범위에서는 claim/evidence 실패도 advisory 로 유지한다. Blocking 승격은 사용자 정책 단계.
    return 'advisory';
  }
  if (def.track === 'essay') {
    // 에세이 트랙은 disclosure_scope 만 항상 차단.
    return def.key === 'gate_disclosure_scope' ? 'blocking' : 'advisory';
  }
  if (def.track === 'commercial') {
    return mode.commercialWeight >= 0.5 ? 'blocking' : 'advisory';
  }
  // literary
  return mode.literaryWeight >= 0.5 ? 'blocking' : 'advisory';
}

function resolveGateReason(reason: GateDef['passReason'], input: GateInput): string {
  return typeof reason === 'function' ? reason(input) : reason;
}

function resolvePromptLeakCount(input: GateInput): number {
  if (typeof input.promptLeakCount === 'number') return Math.max(0, input.promptLeakCount);
  const text = input.text ?? '';
  if (!text.trim()) return 0;
  return detectPromptLeak(text).length;
}

function resolveUnsupportedClaimCount(input: GateInput): number {
  if (typeof input.unsupportedClaimCount === 'number') {
    return Math.max(0, input.unsupportedClaimCount);
  }
  if (typeof input.claimEvidenceMapped === 'boolean') {
    return input.claimEvidenceMapped ? 0 : 1;
  }

  const text = input.text ?? '';
  if (!text.trim()) {
    return 0;
  }

  const ledger = mapClaimsToEvidence(extractClaims(text), text);
  return findUnsupportedClaims(ledger).length;
}

function resolveCitationIssueCount(input: GateInput): number {
  if (typeof input.citationIssueCount === 'number') {
    return Math.max(0, input.citationIssueCount);
  }
  if (typeof input.citationIntegrityPassed === 'boolean') {
    return input.citationIntegrityPassed ? 0 : 1;
  }

  const text = input.text ?? '';
  if (!text.trim()) {
    return 0;
  }

  const audit = auditCitations(text);
  return audit.orphanCitations.length + audit.pageMissingQuotes.length;
}

function resolveCounterArgumentMissing(input: GateInput): boolean {
  if (typeof input.counterArgumentPresent === 'boolean') {
    return !input.counterArgumentPresent;
  }

  const text = input.text ?? '';
  if (!text.trim()) {
    return false;
  }

  return auditCounterArgument(text).missingCounterArgument;
}

function resolveResearchEthicsIssueCount(input: GateInput): number {
  if (typeof input.researchEthicsIssueCount === 'number') {
    return Math.max(0, input.researchEthicsIssueCount);
  }
  if (typeof input.researchEthicsSafe === 'boolean') {
    return input.researchEthicsSafe ? 0 : 1;
  }

  const text = input.text ?? '';
  if (!text.trim()) {
    return 0;
  }

  return auditResearchEthics(text).issues.length;
}

// 첫 300자 안에 행동/긴장 신호가 있는가 — 보수적 휴리스틱.
const OPENING_HOOK_TOKENS = ['왔다', '갔다', '시작', '발견', '들었다', '울렸다', '문득', '갑자기', '터졌다', '깨졌다'];

function hasOpeningHook(text: string): boolean {
  if (!text) return false;
  const opener = text.slice(0, 300);
  return OPENING_HOOK_TOKENS.some((t) => opener.includes(t));
}

// 마지막 200자에 다음 회차로 끌어가는 신호가 있는가 — 미해결/질문/끊어진 문장.
const CLOSING_CLIFF_TOKENS = ['?', '다음', '아직', '미해결', '말끝', '...', '멈췄다', '돌아섰다'];

function hasClosingCliff(text: string): boolean {
  if (!text) return false;
  const tail = text.slice(-200);
  return CLOSING_CLIFF_TOKENS.some((t) => tail.includes(t));
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/(?:\r\n|\n){2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

const DIALOGUE_MARKERS = ['"', "'", '“', '”', '‘', '’', '「', '」', '『', '』'];
const SAID_PATTERN = /(말했다|물었다|대답했다|속삭였다|외쳤다|중얼거렸다|소리쳤다|답했다)/;
const ACTION_PATTERN =
  /(뛰었다|달렸다|밀었다|잡았다|던졌다|숨었다|돌아섰다|멈췄다|들었다|열었다|닫았다|깨졌다|울렸다|발견했다|갔다|왔다|올랐다|내려갔다|꺼냈다|밀어냈다|품었다)/;
const INTERNAL_PATTERN =
  /(생각했다|느꼈다|깨달았다|후회했다|떠올렸다|망설였다|두려웠다|슬펐다|외로웠다|그리웠다|마음|기억했다|알았다|믿었다|의심했다)/;

function measureSceneSequelRatio(paragraphs: string[]): { value?: number; measured: boolean } {
  if (paragraphs.length === 0) return { measured: false };

  let sceneCount = 0;
  for (const paragraph of paragraphs) {
    const dialogueHits = DIALOGUE_MARKERS.some((marker) => paragraph.includes(marker)) ? 1 : 0;
    const saidHits = countMatches(paragraph, SAID_PATTERN);
    const actionHits = countMatches(paragraph, ACTION_PATTERN);
    const internalHits = countMatches(paragraph, INTERNAL_PATTERN);
    if (dialogueHits + saidHits + actionHits > internalHits) {
      sceneCount += 1;
    }
  }

  return { value: roundRatio(sceneCount / paragraphs.length), measured: true };
}

const HISTORICAL_PATTERN = /(\d{4}년|\d{2,3}년대|[가-힣]+시대|[가-힣]+왕조|[가-힣]+세기|\d{1,2}세기)/g;
const HISTORICAL_NOUNS = [
  '조선',
  '고려',
  '대한제국',
  '일제',
  '해방',
  '전쟁',
  '궁궐',
  '성문',
  '전차',
  '순사',
  '시장',
  '독립',
  '왕',
  '왕조',
  '식민',
  '근대',
  '유물',
  '문헌',
  '제사',
  '서원'
];

function measureHistoricalDensity(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;

  const explicitPeriodHits = normalized.match(HISTORICAL_PATTERN)?.length ?? 0;
  const nounHits = HISTORICAL_NOUNS.reduce((sum, noun) => sum + countLiteral(normalized, noun), 0);
  // Historical anchors accumulate across a chapter; paragraph normalization punished longer historical scenes.
  const density = explicitPeriodHits * 45 + nounHits * 20;
  return clampScore(Math.round(density));
}

const ETHICAL_COST_TERMS = [
  '희생',
  '대가',
  '죄책감',
  '갈등',
  '도덕',
  '선택의 무게',
  '책임',
  '배신',
  '용서',
  '상처',
  '누군가를 살리려면',
  '포기해야'
];

function hasEthicalCost(text: string): boolean {
  return ETHICAL_COST_TERMS.some((term) => text.includes(term));
}

const MOTIF_TOKEN_PATTERN = /[가-힣]{2,}/g;
const MOTIF_STOPWORDS = new Set([
  '그는',
  '그녀는',
  '나는',
  '우리는',
  '이야기',
  '작품',
  '인물',
  '것은',
  '것이',
  '그리고',
  '하지만',
  '때문에',
  '속에서',
  '앞으로',
  '여러',
  '좋은'
]);

function measureMotifVariations(paragraphs: string[]): { measured: boolean; count?: number } {
  if (paragraphs.length < 2) return { measured: false };

  const paragraphTokenSets = paragraphs.map((paragraph) => {
    const tokens = paragraph.match(MOTIF_TOKEN_PATTERN) ?? [];
    return new Set(tokens.filter((token) => token.length >= 2 && !MOTIF_STOPWORDS.has(token)));
  });
  const firstSeen = new Map<string, number>();
  const recurring = new Set<string>();

  paragraphTokenSets.forEach((tokens, index) => {
    for (const token of tokens) {
      const previous = firstSeen.get(token);
      if (previous === undefined) {
        firstSeen.set(token, index);
      } else if (previous !== index) {
        recurring.add(token);
      }
    }
  });

  return { measured: true, count: recurring.size };
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(new RegExp(pattern.source, 'g'))?.length ?? 0;
}

function countLiteral(text: string, literal: string): number {
  return text.split(literal).length - 1;
}

function roundRatio(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
