import { extractClaims, findUnsupportedClaims, mapClaimsToEvidence } from './claimLedger';
import { auditCitations } from './citationGate';

// M4 청크 E · Layer 4 — 품질 게이트 12개.
// 정본 — docs/storyx-harness-architecture.md § 5-3, 3-3 (두 트랙 설계).
//
// 각 게이트는 { key, track, requirement, evaluate, reason } 형태.
// 트랙 — common / commercial / literary / essay / academic.
// StoryMode 가중치(commercialWeight, literaryWeight) 로 강제(blocking) / 권고(advisory) 가 결정된다.
//   - common 게이트: 항상 blocking
//   - commercial 게이트: commercialWeight ≥ 0.5 일 때 blocking, 아니면 advisory
//   - literary 게이트: literaryWeight ≥ 0.5 일 때 blocking, 아니면 advisory
//   - essay 게이트: 에세이 매체에서만 평가, gate_disclosure_scope 만 항상 blocking, 나머지 둘은 advisory
//   - academic 게이트: 학술 매체에서만 노출, claim_evidence_mapping/citation_integrity 는 advisory

export type GateKey =
  | 'gate_hook_first_300'
  | 'gate_hook_last_200'
  | 'gate_scene_sequel_balance'
  | 'gate_voice_match_70'
  | 'gate_pressure_triangle_active'
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
}

export interface GateResult {
  gate: GateKey;
  track: GateTrack;
  requirement: GateRequirement;
  passed: boolean;
  reason: string;
}

export interface QualityGatesReport {
  results: GateResult[];
  /** 강제 게이트가 모두 통과했는가 — readyForProduction 의 후속 조건. */
  blockingPassed: boolean;
  /** 권고 게이트 중 실패한 항목 수 — 작가에게 알리되 차단은 안 함. */
  advisoryFailures: number;
}

// 모든 게이트를 평가하고 모드 가중치에 맞춰 blocking/advisory 를 결정한다.
export function evaluateQualityGates(input: GateInput, mode: StoryMode): QualityGatesReport {
  const isEssay = input.medium === 'essay';
  const isAcademic = input.medium === 'academic';
  const results: GateResult[] = [];

  for (const def of GATE_DEFS) {
    // 에세이 게이트는 에세이 매체에서만 평가.
    if (def.track === 'essay' && !isEssay) continue;
    // 학술 게이트는 academic 매체에서만 노출한다.
    if (def.track === 'academic' && !isAcademic) continue;
    // gate_hook_last_200 은 serial 에서만 평가.
    if (def.key === 'gate_hook_last_200' && !input.isSerial) continue;
    // gate_ambiguity_at_finale 는 finale 에서만 평가.
    if (def.key === 'gate_ambiguity_at_finale' && !input.isFinale) continue;

    const passed = def.evaluate(input);
    const requirement = resolveRequirement(def, mode);
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
    blockingPassed: blockingFailures.length === 0,
    advisoryFailures
  };
}

// --- 내부 정의 ---

interface GateDef {
  key: GateKey;
  track: GateTrack;
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
    evaluate: (i) => (i.sceneSequelRatio ?? 0.5) >= 0.3 && (i.sceneSequelRatio ?? 0.5) <= 0.7,
    passReason: 'scene/sequel 비율이 권장 범위(0.3~0.7) 안입니다.',
    failReason: 'scene/sequel 비율이 권장 범위를 벗어났습니다 — 호흡 조정 필요.'
  },
  {
    key: 'gate_voice_match_70',
    track: 'common',
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
    key: 'gate_ambiguity_at_finale',
    track: 'literary',
    evaluate: (i) => (i.ambiguityScore ?? 0) >= 60,
    passReason: '마무리에 의미 있는 모호함이 남아 있습니다.',
    failReason: '마무리가 너무 닫혀 있습니다 — 작품성 트랙에서는 여백이 필요합니다.'
  },
  {
    key: 'gate_ethical_cost_present',
    track: 'literary',
    evaluate: (i) => Boolean(i.ethicalCostPresent),
    passReason: '윤리적 대가가 작품 안에 보입니다.',
    failReason: '윤리적 대가가 없어 인물의 선택이 가볍습니다.'
  },
  {
    key: 'gate_motif_variation',
    track: 'literary',
    evaluate: (i) => (i.motifVariations ?? 0) >= 2,
    passReason: '같은 모티프가 변주되며 깊이가 누적됩니다.',
    failReason: '모티프 변주가 부족합니다 — 같은 이미지가 새 의미를 얻어야 합니다.'
  },
  {
    key: 'gate_historical_density',
    track: 'literary',
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
  // Academic gates — 영어 APA 기준. claim_evidence_mapping 은 A2, citation_integrity 는 A3에서 실제 판정.
  // 반론/연구윤리는 A4 placeholder 로 유지한다.
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
    evaluate: () => true,
    passReason: 'A1 placeholder: 반론과 대안 가설 점검은 A4에서 평가합니다.',
    failReason: 'A4에서 구현 예정입니다.'
  },
  {
    key: 'research_ethics_disclosure',
    track: 'academic',
    evaluate: () => true,
    passReason: 'A1 placeholder: 연구 윤리와 이해충돌 공개는 A4에서 평가합니다.',
    failReason: 'A4에서 구현 예정입니다.'
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
