import { createDefaultLocalizationPolicy, type LocalizationPolicy } from './localization';
// 매체 영속 — 타입 전용 import 라 런타임 순환 없음.
import type { CreativeFormat, CreativeMedium } from './projectBlueprint';
import { planAgentRuns } from './agentRunEngine';
// P4 — 회차 캐논(owner=character)에서 인물 이름을 보수적으로 추출(공백 이름·조사·조직 가드)해 characters 로 승격.
import { extractCharacterNames, extractRelation } from './storyOntology';
// M4 청크 F — AgentRun.agentId 를 ValidationAgentId 로 통합. 신설 12 에이전트도 AgentRun 의 source 가 될 수 있게.
import type { ValidationAgentId } from './agentReviewProcess';
// M4 청크 H — validateContinuity 가 continuityContract.classifyCanonChange 로 의미적 충돌 감지를 보강.
// 기존 forbiddenContradictions 흐름은 그대로 보존하고, hard-canon 위반만 추가 issue 로 노출.
import {
  appendGrowthEntry,
  buildContextPack,
  classifyCanonChange,
  createContinuityContract,
  proposeContinuityRepair,
  type ContinuityContract,
  type GrowthLedger
} from './continuityContract';

export type AgentId =
  | 'showrunner'
  | 'character-custodian'
  | 'world-keeper'
  | 'genre-stylist'
  | 'continuity-editor'
  | 'essay-interviewer'
  | 'voice-curator'
  | 'audio-narration-director'
  | 'education-video-architect'
  | 'sound-music-agent'
  | 'storyboard-agent'
  | 'speech-bubble-agent'
  | 'keyframe-art-director'
  | 'da-vinci'
  | 'frame-assembly-agent';

export type GenreId =
  | 'romance-fantasy'
  | 'urban-fantasy'
  | 'noir-thriller'
  | 'space-opera';

export type Severity = 'info' | 'warning' | 'error';

// 인물 사이의 관계 한 줄 — 관계도 엣지 하나. strong은 굵은 선, dashed는 점선(불확실·잠정).
export interface CharacterRelation {
  targetId: string;
  label: string;
  strong?: boolean;
  dashed?: boolean;
}

// M4 청크 E · 5-1 — protagonist_pressure_triangle.
// want = 의식이 원하는 것, desire = 무의식이 끌리는 것, taboo = 절대 못 넘는 선.
// 세 축이 동시에 작동해야 인물 압력이 살아난다.
export interface PressureTriangle {
  want: string;
  desire: string;
  taboo: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  desire: string;
  wound: string;
  currentState: string;
  voiceRules: string[];
  canonAnchors: string[];
  forbiddenContradictions: Array<{
    claim: string;
    reason: string;
  }>;
  /** 다른 인물과의 관계 — 관계도 엣지 목록 */
  relations: CharacterRelation[];
  /** M4 청크 E — protagonist pressure triangle (want/desire/taboo). */
  pressureTriangle?: PressureTriangle;
}

// 캐논 엔티티 정합 상태 — ok는 충돌 없음, conflict는 본문과 어긋남, unverified는 아직 본문에 미등장.
export type CanonStatus = 'ok' | 'conflict' | 'unverified';

// 인물/장소/사물/사건이 공유하는 캐논 엔티티 공통 형태. status가 conflict면 conflict에 어긋난 내용을 적는다.
export interface CanonEntity {
  id: string;
  name: string;
  sub: string;
  facts: string[];
  appearedIn: string[];
  status: CanonStatus;
  conflict?: string;
}

// 작품 연표의 한 항목 — 연도·계절·라벨·메모. 아직 확정 안 된 시점은 status로 표시한다.
export interface TimelineEntry {
  id: string;
  year: number;
  season: string;
  label: string;
  note: string;
  status: CanonStatus;
}

// 작품 바이블 규칙 한 섹션 — 톤·문장 리듬·세계관 규칙·어휘 금기·시각 모티프 중 하나.
export interface BibleSection {
  id: string;
  title: string;
  body: string;
}

export interface WorldRule {
  id: string;
  title: string;
  rule: string;
  forbiddenContradictions: Array<{
    claim: string;
    reason: string;
  }>;
}

export interface CanonFact {
  id: string;
  episode: number;
  // M4 청크 A — Gap 5: 매체별 owner(voice/visual/audio) 까지 통일.
  // aiCliHarness · memoryBank 가 이미 6개로 받고 있어 다운캐스트 제거.
  owner: 'character' | 'world' | 'plot' | 'voice' | 'visual' | 'audio';
  statement: string;
}

// 회차 구성 단위 — 이야기 흐름의 의미 단위 하나. 번호·라벨·요약으로 원고 위에 오버레이된다.
export interface ChapterBeat {
  id: string;
  no: number;
  label: string;
  summary: string;
  /** 계획된 긴장 강도 — 0~100. 긴장 곡선 차트의 한 점이 된다. */
  tension: number;
}

// M4 청크 E · 5-1 — stakes_ledger (Chapter 메타).
// 한 회차에서 누가 무엇을 잃을 위험에 놓이는가 — 압력의 명시.
export interface StakesLedgerEntry {
  stake: string;
  /** 위험에 놓인 인물/요소. */
  atRisk: string;
  /** 결말 — 잃었는가, 지켰는가, 다음 회차로 미뤘는가. */
  resolution?: 'lost' | 'kept' | 'deferred';
}

// M4 청크 E · 5-1 — reward_arc (Chapter 메타).
// 회차가 약속한 보상을 어떻게 회수했는가 — 후크 ↔ 페이오프 추적.
export interface RewardArcEntry {
  promise: string;
  payoff: string;
  /** 회수 강도 0~100. */
  intensity?: number;
}

export interface Chapter {
  id: string;
  episode: number;
  title: string;
  hook: string;
  outline: string[];
  /** 회차 구성 — 번호 매겨진 흐름 단위 목록. 원고와는 오버레이 관계(원고는 자유 textarea). */
  beats: ChapterBeat[];
  prose: string;
  memoryAnchors: string[];
  newCanonFacts: CanonFact[];
  locked?: boolean;
  /** M4 청크 E — 이 회차의 stakes ledger. 누가 무엇을 잃을 위험인가. */
  stakesLedger?: StakesLedgerEntry[];
  /** M4 청크 E — 이 회차의 reward arc. 약속과 회수. */
  rewardArc?: RewardArcEntry[];
}

export function lockChapter(project: SeriesProject, chapterId: string): SeriesProject {
  return {
    ...project,
    chapters: project.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, locked: true } : chapter
    )
  };
}

export function unlockChapter(project: SeriesProject, chapterId: string): SeriesProject {
  return {
    ...project,
    chapters: project.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, locked: false } : chapter
    )
  };
}

// 작품 무게중심 — 대중성/작품성 중 어디에 비중을 두는지. 생성·검토 강조점을 가른다.
export type CreativeWeight = 'popular' | 'balanced' | 'literary';

export function describeCreativeWeight(weight: CreativeWeight): string {
  switch (weight) {
    case 'popular':
      return '대중성 우선 — 사건·후크·보상 리듬을 빠르고 선명하게';
    case 'literary':
      return '작품성 우선 — 여백·주제 층위·고유한 목소리를 깊게';
    default:
      return '균형 — 표면 사건은 명료하게, 심층 주제는 깊게';
  }
}

// M4 청크 E · 5-1 — narrator_card (SeriesProject 메타).
export interface NarratorCard {
  /** 시점 — first/third-close/third-omniscient 등 자유 라벨. */
  pointOfView: string;
  /** 화자와 인물 간 거리. */
  distance: 'close' | 'medium' | 'omniscient';
  tone: string;
}

// M4 청크 E · 5-1 — motif_ledger (SeriesProject 메타).
export interface MotifLedgerEntry {
  motifId: string;
  /** 같은 모티프가 등장한 회차·맥락. variation 횟수 추적에 쓰임. */
  occurrences: Array<{ episode: number; context: string }>;
}

// M4 청크 E · 5-1 — symbol_layers (SeriesProject 메타).
export interface SymbolLayer {
  symbol: string;
  /** 한 상징이 작품 안에서 얻은 의미 층위들 — 시간이 흐르면서 누적. */
  meanings: string[];
}

// M4 청크 E · 5-1 — formal_design (SeriesProject 메타).
export interface FormalDesign {
  structure: 'linear' | 'parallel' | 'frame' | 'nonlinear';
  tense: 'past' | 'present' | 'mixed';
  /** 시점 — narratorCard 의 pointOfView 와 일관. */
  pov: string;
}

// M4 청크 E · 5-1 — historical_anchors (SeriesProject 메타).
export interface HistoricalAnchor {
  /** 시대 — 한 단어 또는 짧은 구절. */
  era: string;
  /** 그 시대의 구체 디테일. */
  detail: string;
}

// M4 청크 E · 5-1 — persona_card (에세이 모드 SeriesProject 메타).
export interface PersonaCard {
  /** 에세이 화자 라벨. */
  voiceLabel: string;
  /** 화자와 사건 간 감정 거리. */
  emotionalDistance: 'close' | 'medium' | 'distant';
  /** 화자의 stance — 자기 글에 어떤 위치를 잡는가. */
  stance: string;
}

// M4 청크 E · 5-1 — disclosure_ledger (에세이 모드 SeriesProject 메타).
export interface DisclosureEntry {
  /** 노출 대상 — 인물·장소·사건. */
  subject: string;
  /** 실제 인물 식별 위험. block 이면 출간 차단형. */
  risk: 'safe' | 'caution' | 'block';
  rationale: string;
}

// 작품 헌장(Story Contract) — Phase A. 분량을 확정하고 결말에서 역산한 4줄 척추를 전 에이전트의 공유 기준으로 박제한다.
// 단편(short) 4~8화 · 장편(long) 24~36화 시즌제. 중편 없음(사용자 결정 2026-06-12).
export type ContractLengthClass = 'short' | 'long';

/** 4줄 척추 — 외부 사건이 아니라 주인공의 내적 변화(욕망/전진/시련/변화)를 붙잡는다(《4줄이면 된다》). 질문은 SeriesProject.deepQuestion 재사용. */
export interface StorySpine {
  /** 1줄 — 결정적 상태 때문에 불가능에 가까운 욕망을 품는다 */
  desire: string;
  /** 2줄 — 결심하고 전진하며 독자가 응원할 기준을 보인다 */
  advance: string;
  /** 3줄 — 장르·기대 감정 크기에 맞는 시련으로 상황·마음이 급변한다 */
  obstacle: string;
  /** 4줄 — 욕망·결심이 해소되고 질문의 답에 도달한다(표면 생사 아님) */
  resolution: string;
}

/** 화수에 핀 박힌 비트 — 4줄 척추를 회차 구간으로 펼친 것 */
export interface ContractBeat {
  episode: number;
  mission: string;
  promiseRefs?: string[];
}

/** 헌장 개정 이력 — 트위스트 수락·시즌 연장 등 */
export interface ContractAmendment {
  at: string;
  reason: string;
  change: string;
}

export interface StoryContract {
  lengthClass: ContractLengthClass;
  plannedEpisodes: number;
  spine?: StorySpine;
  /** 결말 = 질문에 대한 답 + 욕망 해소 여부(마지막 "장면"이 아니라) */
  endingStatement: string;
  finalImage?: string;
  protagonistCost: string;
  beatSheet: ContractBeat[];
  /** 단계적 집필 게이트 — 척추 잠금 전엔 장편·학술 본문 생성 불가 */
  spineLocked: boolean;
  amendments: ContractAmendment[];
}

export interface SeriesProject {
  id: string;
  title: string;
  logline: string;
  localization: LocalizationPolicy;
  genre: GenreId;
  tone: string;
  /** 매체 영속 — React state 가 아니라 프로젝트가 매체를 기억해야 리로드 후에도 작가진·게이트가 매체를 따른다. 구버전 저장본에는 없을 수 있다. */
  medium?: CreativeMedium;
  format?: CreativeFormat;
  /** 표면 약속 — 독자에게 거는, 플롯·사건 차원의 약속 */
  audiencePromise: string;
  /** 심층 질문 — 표면 사건 아래에서 작품이 진짜 묻는 것 */
  deepQuestion: string;
  /** 작품 무게중심 — 대중성/작품성 비중 */
  creativeWeight: CreativeWeight;
  /** 형식·구조 의도 — 시점·시제·구성이 주제를 어떻게 수행하는가 */
  formIntent: string;
  currentEpisode: number;
  characters: CharacterProfile[];
  worldRules: WorldRule[];
  canonFacts: CanonFact[];
  openThreads: string[];
  chapters: Chapter[];
  /** 캐논 장소 — 데이터 모드 장소 카드 */
  places: CanonEntity[];
  /** 캐논 사물 — 데이터 모드 사물 카드 */
  objects: CanonEntity[];
  /** 캐논 사건 — 데이터 모드 사건 카드 */
  events: CanonEntity[];
  /** 작품 연표 — 데이터 모드 시간선 */
  timeline: TimelineEntry[];
  /** 바이블 규칙 5섹션 — tone·rhythm·world·vocab·motif */
  bibleOutline: BibleSection[];
  // M4 청크 E · 5-1 13개 바이블 카테고리 중 SeriesProject 에 배정된 7개. 모두 optional — 기존 프로젝트와 호환.
  /** narrator_card — 시점·거리·톤. */
  narratorCard?: NarratorCard;
  /** voice_signature — koreanVoiceGate.VoiceSignature 와 1:1 (type-only import 로 순환 의존 회피). */
  voiceSignatureId?: string;
  /** motif_ledger — 모티프와 등장 회차. */
  motifLedger?: MotifLedgerEntry[];
  /** symbol_layers — 상징 층위. */
  symbolLayers?: SymbolLayer[];
  /** formal_design — 구조·시제·시점. */
  formalDesign?: FormalDesign;
  /** historical_anchors — 시대 닻. */
  historicalAnchors?: HistoricalAnchor[];
  /** persona_card — 에세이 모드 화자 페르소나. */
  personaCard?: PersonaCard;
  /** disclosure_ledger — 에세이 모드 실제 인물 노출 추적. */
  disclosureLedger?: DisclosureEntry[];
  /** growth_ledger — 인물 상태 변화의 원인·대가·후속 압력을 누적한다. */
  growthLedger?: GrowthLedger;
  /** story_contract — 작품 헌장(분량 확정·결말 역산·4줄 척추). 구버전 저장본·계약 미수립 작품에는 없다. */
  storyContract?: StoryContract;
}

// 분량 등급별 기본 회차 수 — 온보딩에서 작가가 조정 가능. 단편 6 · 장편 30(각 범위의 대표값).
const CONTRACT_EPISODE_RANGES: Record<ContractLengthClass, { min: number; max: number; default: number }> = {
  short: { min: 4, max: 8, default: 6 },
  long: { min: 24, max: 36, default: 30 }
};

export function defaultPlannedEpisodes(lengthClass: ContractLengthClass): number {
  return CONTRACT_EPISODE_RANGES[lengthClass].default;
}

// 4줄 척추를 화수 핀 4개로 펼친다(A-3) — 25% 욕망 / 50% 전진 / 75% 시련 / 100% 변화.
// 화수는 강증가하도록 보정하고 마지막 핀은 항상 plannedEpisodes.
export function deriveBeatSheet(spine: StorySpine, plannedEpisodes: number): ContractBeat[] {
  const planned = Math.max(1, Math.floor(plannedEpisodes));
  const raw = [
    { mission: spine.desire, ep: Math.max(1, Math.round(planned * 0.25)) },
    { mission: spine.advance, ep: Math.round(planned * 0.5) },
    { mission: spine.obstacle, ep: Math.round(planned * 0.75) },
    { mission: spine.resolution, ep: planned }
  ];
  // 강증가 보정 — 짧은 화수에서 반올림이 겹치면 직전+1 로 밀고, 상한은 planned.
  let previous = 0;
  return raw.map((entry, index) => {
    const isLast = index === raw.length - 1;
    const episode = isLast ? planned : Math.min(planned, Math.max(entry.ep, previous + 1));
    previous = episode;
    return { episode, mission: entry.mission };
  });
}

// 온보딩 입력으로 작품 헌장을 조립한다(A-3). 비트는 척추에서 펼치고, 4줄이 모두 채워졌을 때만 잠근다.
export function buildStoryContractFromOnboarding(input: {
  lengthClass: ContractLengthClass;
  plannedEpisodes?: number;
  endingStatement: string;
  protagonistCost: string;
  finalImage?: string;
  spine: StorySpine;
}): StoryContract {
  const plannedEpisodes = input.plannedEpisodes ?? defaultPlannedEpisodes(input.lengthClass);
  // 단편은 욕망·변화 2줄만으로 경량 잠금(A-2), 장편은 4줄 전부 채워야 잠긴다.
  const spineComplete = input.lengthClass === 'short'
    ? input.spine.desire.trim().length > 0 && input.spine.resolution.trim().length > 0
    : [input.spine.desire, input.spine.advance, input.spine.obstacle, input.spine.resolution]
        .every((line) => line.trim().length > 0);
  return {
    lengthClass: input.lengthClass,
    plannedEpisodes,
    spine: input.spine,
    endingStatement: input.endingStatement,
    ...(input.finalImage ? { finalImage: input.finalImage } : {}),
    protagonistCost: input.protagonistCost,
    beatSheet: deriveBeatSheet(input.spine, plannedEpisodes),
    spineLocked: spineComplete,
    amendments: []
  };
}

// 헌장 무결성 검사 — 문제 목록을 반환한다(빈 배열 = 유효). 온보딩·게이트가 잠금 전에 호출한다.
export function validateContract(contract: StoryContract): string[] {
  const problems: string[] = [];
  const range = CONTRACT_EPISODE_RANGES[contract.lengthClass];
  if (!range) {
    problems.push(`알 수 없는 분량 등급: ${String(contract.lengthClass)}`);
  } else if (contract.plannedEpisodes < range.min || contract.plannedEpisodes > range.max) {
    const label = contract.lengthClass === 'short' ? '단편' : '장편';
    problems.push(`${label}은 ${range.min}~${range.max}화여야 합니다 (현재 ${contract.plannedEpisodes}화).`);
  }
  if (!contract.endingStatement.trim()) {
    problems.push('결말 문장(endingStatement)이 비어 있습니다 — 결말을 먼저 확정해야 합니다.');
  }
  for (const beat of contract.beatSheet) {
    if (beat.episode > contract.plannedEpisodes) {
      problems.push(`비트 화수(${beat.episode})가 확정 회차 수(${contract.plannedEpisodes})를 넘습니다.`);
    }
  }
  return problems;
}

/** 단계적 집필 게이트(A-2) 결과 — allowed=false 면 본문 생성을 막고 reason 을 UI 안내로 쓴다. */
export interface ProductionGate {
  allowed: boolean;
  reason?: string;
}

// 단계적 집필 게이트 — Phase A-2. 헌장이 있는데 척추가 잠기지 않았으면 본문(회차) 생성을 막는다.
// 헌장이 없으면(구버전 저장본·백업 주입·계약 미수립) 통과 — 하위호환. 잠금 후에도 통과.
export function evaluateProductionGate(project: SeriesProject): ProductionGate {
  const contract = project.storyContract;
  if (!contract || contract.spineLocked) {
    return { allowed: true };
  }
  const label = contract.lengthClass === 'short' ? '단편' : '장편';
  return {
    allowed: false,
    reason: `${label} 척추가 아직 잠기지 않았습니다 — 결말과 4줄 척추를 확정해 잠근 뒤 본문을 시작하세요.`
  };
}

/** SeriesProject 의 공개 별칭 — 외부 모듈에서 짧게 참조할 때 사용한다. */
export type StoryProject = SeriesProject;

export interface ProductionRequest {
  genre: GenreId;
  intent: string;
  pressure: string;
}

export type AgentRunStatus = 'idle' | 'pass' | 'revise' | 'block' | 'complete';

export interface AgentRun {
  agentId: ValidationAgentId;
  title: string;
  status: AgentRunStatus;
  output: string;
  evidence: string[];
  // 이번 회차 검토에서 이 에이전트가 잘했다고 본 점과 짚어낸 문제. 옛 데이터/목 검토 호환을 위해 옵션.
  strengths?: string[];
  issues?: string[];
}

export interface ContinuityIssue {
  severity: Severity;
  source: AgentId;
  claim: string;
  message: string;
}

export interface ProductionResult {
  chapter: Chapter;
  agentRuns: AgentRun[];
  continuityIssues: ContinuityIssue[];
  updatedProject: SeriesProject;
}

export interface DraftChapterPayloadCanonFact {
  owner: string;
  statement: string;
}

export interface DraftChapterPayloadBeat {
  label: string;
  summary: string;
  /** 계획된 긴장 강도 — 0~100. 구버전·실패 응답에서는 누락될 수 있어 정규화 시 기본값으로 보정한다. */
  tension?: number;
}

// 기본 긴장 강도 — beat에 tension이 누락됐을 때 채우는 값.
export const DEFAULT_BEAT_TENSION = 50;

// 임의 값을 0~100 사이 정수 긴장 강도로 정규화한다. 숫자가 아니면 기본값으로 떨어진다.
function normalizeTension(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_BEAT_TENSION;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export interface DraftChapterPayloadRewardArc {
  promise: string;
  payoff: string;
  intensity?: number;
}

export interface DraftChapterPayloadStakes {
  stake: string;
  atRisk: string;
  resolution?: 'lost' | 'kept' | 'deferred';
}

export interface DraftChapterPayload {
  title: string;
  hook: string;
  outline: string[];
  /** 회차 구성 — LLM이 초안과 함께 내는 흐름 단위 outline. 번호는 커밋 시 매긴다. */
  beats: DraftChapterPayloadBeat[];
  prose: string;
  newCanonFacts: DraftChapterPayloadCanonFact[];
  /** 아크 페이오프 1단계 — LLM 이 산출한 이 회차의 약속·회수. 누락 가능. */
  rewardArc?: DraftChapterPayloadRewardArc[];
  /** 아크 페이오프 1단계 — LLM 이 산출한 이 회차의 stake 결말. 누락 가능. */
  stakesLedger?: DraftChapterPayloadStakes[];
  /** LLM 실패 시 작가 입력만 재구성한 임시 초안인지 표시한다. */
  isFallback?: boolean;
  /** 갭 A — 온보딩에서 끌어낸 project 메타 시드. 첫 회차 생성 시 createEmptyProject 에 반영된다. */
  seed?: OnboardingSeed;
}

export interface FallbackDraftInput {
  freewrite: string;
  interviewAnswers?: string[];
  chapterNumber?: number;
}

const FALLBACK_EMPTY_LINE = '작가 입력을 기다리는 임시 초안입니다.';

function normalizeAuthorLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function splitAuthorMaterial(input: FallbackDraftInput): string[] {
  const rawSections = [
    input.freewrite,
    ...(input.interviewAnswers ?? [])
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);

  const units = rawSections.flatMap((section) =>
    section
      .split(/(?<=[.!?。！？]|[다요죠음임함됨람문것곳간순쪽중]다[.!?]?)\s+|\n+/u)
      .map(normalizeAuthorLine)
      .filter(Boolean)
  );

  return units.length > 0 ? units : [FALLBACK_EMPTY_LINE];
}

function truncateKoreanLine(value: string, maxLength: number): string {
  const normalized = normalizeAuthorLine(value);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized;
}

export function buildFallbackDraft(input: FallbackDraftInput): DraftChapterPayload {
  const chapterNumber = Math.max(1, Math.floor(input.chapterNumber ?? 1));
  const units = splitAuthorMaterial(input);
  const hasAuthorMaterial = units.some((unit) => unit !== FALLBACK_EMPTY_LINE);
  const firstUnit = units[0] ?? FALLBACK_EMPTY_LINE;
  const outline = units.slice(0, 5);
  const beats = units.slice(0, 5).map((unit, index) => ({
    label: hasAuthorMaterial ? `입력 ${index + 1}` : '임시 초안',
    summary: unit,
    tension: DEFAULT_BEAT_TENSION
  }));

  return {
    title: hasAuthorMaterial ? `${chapterNumber}화 — ${truncateKoreanLine(firstUnit, 18)}` : `${chapterNumber}화 — 임시 초안`,
    hook: firstUnit,
    outline,
    beats,
    prose: hasAuthorMaterial ? units.join('\n\n') : FALLBACK_EMPTY_LINE,
    newCanonFacts: [],
    isFallback: true
  };
}

// 라벨·요약 쌍 목록을 번호 매겨진 ChapterBeat[]로 정규화한다. 빈 항목은 버리고, tension 누락은 기본값으로 보정한다.
export function normalizeChapterBeats(
  episode: number,
  raw: ReadonlyArray<{ label?: unknown; summary?: unknown; tension?: unknown }> | undefined
): ChapterBeat[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => ({
      label: typeof item?.label === 'string' ? item.label.trim() : '',
      summary: typeof item?.summary === 'string' ? item.summary.trim() : '',
      tension: normalizeTension(item?.tension)
    }))
    .filter((item) => item.label.length > 0 || item.summary.length > 0)
    .map((item, index) => ({
      id: `beat-${episode.toString().padStart(3, '0')}-${String(index + 1).padStart(2, '0')}`,
      no: index + 1,
      label: item.label || `구성 ${index + 1}`,
      summary: item.summary,
      tension: item.tension
    }));
}

export type EditorViewModeId = 'binder' | 'corkboard' | 'outliner' | 'scrivenings';

export interface EditorViewMode {
  id: EditorViewModeId;
  label: string;
  description: string;
}

export type BinderItemKind = 'project' | 'folder' | 'chapter' | 'codex-entry';

export interface BinderItem {
  id: string;
  title: string;
  kind: BinderItemKind;
  depth: number;
  detail: string;
}

export interface CorkboardCard {
  chapterId: string;
  title: string;
  synopsis: string;
  pov: string;
  status: 'drafted' | 'planned';
  label: string;
  tags: string[];
  linkedCodexIds: string[];
  canonCandidateIds: string[];
}

export interface OutlinerRow {
  chapterId: string;
  episode: number;
  title: string;
  pov: string;
  status: CorkboardCard['status'];
  wordCount: number;
  linkedCodexCount: number;
  canonCandidateCount: number;
  continuityState: 'clear' | 'blocked';
}

export type CodexEntryKind = 'character' | 'world-rule' | 'plot-thread' | 'canon';

export interface CodexField {
  label: string;
  value: string;
}

export interface CodexEntry {
  id: string;
  kind: CodexEntryKind;
  title: string;
  summary: string;
  fields: CodexField[];
  sourceIds: string[];
}

export interface StorySnapshot {
  id: string;
  chapterId: string;
  title: string;
  reason: string;
  text: string;
}

export interface CompilePreview {
  title: string;
  sectionCount: number;
  wordCount: number;
  text: string;
}

export interface ContinuitySummary {
  status: 'clear' | 'blocked';
  blocked: number;
  warnings: number;
}

export interface StoryEditorWorkspace {
  viewModes: EditorViewMode[];
  binderItems: BinderItem[];
  corkboardCards: CorkboardCard[];
  outlinerRows: OutlinerRow[];
  codexEntries: CodexEntry[];
  snapshots: StorySnapshot[];
  compilePreview: CompilePreview;
  continuityIssues: ContinuityIssue[];
  continuitySummary: ContinuitySummary;
}

export interface StoryEditorWorkspaceOptions {
  draftClaims?: string[];
}

const genreProfiles: Record<
  GenreId,
  { label: string; beat: string; texture: string; ending: string }
> = {
  'romance-fantasy': {
    label: '로맨스 판타지',
    beat: '감정의 오해와 계약의 조건을 함께 조인다',
    texture: '은빛 의식, 밀봉된 편지, 존칭 속에 숨은 균열',
    ending: '가장 가까운 동맹이 다음 위험의 열쇠였음이 드러난다'
  },
  'urban-fantasy': {
    label: '현대 판타지',
    beat: '일상적인 장소에서 비일상 규칙이 새어 나온다',
    texture: '지하철 안내음, 심야 편의점 조명, 낡은 부적',
    ending: '도시 전체가 같은 신호를 반복하기 시작한다'
  },
  'noir-thriller': {
    label: '누아르 스릴러',
    beat: '증거 하나가 인물의 알리바이를 무너뜨린다',
    texture: '빗물, 담배 냄새, 찢어진 사건 기록',
    ending: '믿었던 증인이 사건의 설계자일 가능성이 열린다'
  },
  'space-opera': {
    label: '스페이스 오페라',
    beat: '개인적 상처가 함대의 정치적 선택과 충돌한다',
    texture: '항성 지도, 저궤도 정거장, 오래된 항해 노래',
    ending: '탐사 목적지가 고향의 잃어버린 이름을 송신한다'
  }
};

export function createSeedProject(): SeriesProject {
  const characters: CharacterProfile[] = [
    {
      id: 'seo-yoon',
      name: '한서윤',
      role: '기억을 수선하는 필사관',
      desire: '사라진 오빠의 마지막 행적을 찾아 달의 탑에 오른다',
      wound: '자신이 기록을 고친 탓에 가족의 기억이 어긋났다고 믿는다',
      currentState: '왕립 문서고에서 해임당한 뒤 비공식 의뢰를 받고 있다',
      voiceRules: ['감정을 바로 말하지 않고 사물의 상태로 우회한다', '결정적 순간에는 짧은 문장을 쓴다'],
      canonAnchors: ['서윤은 사라진 오빠의 행방을 찾고 있다.'],
      forbiddenContradictions: [
        {
          claim: '서윤은 오빠를 처음부터 싫어했고 찾고 싶어 하지 않는다.',
          reason: '시리즈의 장기 동기는 오빠를 찾는 죄책감과 애정이다.'
        }
      ],
      relations: [
        { targetId: 'ian', label: '불완전한 협력자', strong: true },
        { targetId: 'do-hyun', label: '찾고 있는 오빠', dashed: true }
      ]
    },
    {
      id: 'ian',
      name: '이안 로웰',
      role: '달의 탑 출입권을 가진 몰락 귀족',
      desire: '가문을 파멸시킨 예언 조작자를 찾아낸다',
      wound: '가문을 지키려 했던 거짓 증언이 누군가를 죽게 만들었다',
      currentState: '서윤에게 협력하지만 탑의 규칙 일부를 숨긴다',
      voiceRules: ['예의를 지키지만 핵심 명사는 흐린다', '농담은 방어 수단으로만 사용한다'],
      canonAnchors: ['이안은 달의 탑 출입권을 가지고 있지만 모든 규칙을 말하지 않았다.'],
      forbiddenContradictions: [
        {
          claim: '이안은 처음부터 모든 비밀을 솔직히 공개했다.',
          reason: '이안의 긴장감은 선택적 침묵과 불완전한 협력에서 나온다.'
        }
      ],
      relations: [
        { targetId: 'seo-yoon', label: '불완전한 협력자', strong: true }
      ]
    },
    {
      id: 'do-hyun',
      name: '한도현',
      role: '사라진 서윤의 오빠 — 전직 탑 기록관',
      desire: '탑이 지운 진짜 이름을 되돌려 놓는다',
      wound: '동생을 지키려고 자신의 이름 일부를 탑에 내주었다',
      currentState: '아직 직접 등장하지 않고 표식과 편지로만 흔적을 남긴다',
      voiceRules: ['직접 등장 전까지는 사물·표식으로만 말한다'],
      canonAnchors: ['도현은 탑에 이름의 일부를 대가로 바치고 사라졌다.'],
      forbiddenContradictions: [
        {
          claim: '도현은 처음부터 탑과 무관한 인물이었다.',
          reason: '도현의 실종과 탑의 출입 대가가 시리즈의 핵심 미스터리를 묶는다.'
        }
      ],
      relations: [
        { targetId: 'seo-yoon', label: '지키려 한 동생', dashed: true }
      ]
    }
  ];

  const worldRules: WorldRule[] = [
    {
      id: 'moon-tower-entry',
      title: '달의 탑 출입 규칙',
      rule: '달의 탑은 초대장, 빚, 이름의 일부 중 하나를 대가로 바친 사람만 들어갈 수 있다.',
      forbiddenContradictions: [
        {
          claim: '달의 탑은 아무나 들어갈 수 있는 관광지다.',
          reason: '탑의 폐쇄성이 세계관의 미스터리와 권력 구조를 만든다.'
        }
      ]
    },
    {
      id: 'memory-ink',
      title: '기억 잉크',
      rule: '기억 잉크는 사실을 창조하지 못하고 이미 존재한 기억의 순서만 바꿀 수 있다.',
      forbiddenContradictions: [
        {
          claim: '기억 잉크는 존재하지 않는 사건을 새로 만들 수 있다.',
          reason: '마법의 한계가 추리와 갈등의 공정성을 지킨다.'
        }
      ]
    }
  ];

  const canonFacts: CanonFact[] = [
    {
      id: 'canon-001',
      episode: 0,
      owner: 'character',
      statement: characters[0].canonAnchors[0]
    },
    {
      id: 'canon-002',
      episode: 0,
      owner: 'character',
      statement: characters[1].canonAnchors[0]
    },
    {
      id: 'canon-003',
      episode: 0,
      owner: 'world',
      statement: worldRules[0].rule
    }
  ];

  const places: CanonEntity[] = [
    {
      id: 'place-moon-tower',
      name: '달의 탑',
      sub: '왕도 북쪽 끝 · 출입 통제 구역',
      facts: [
        '초대장, 빚, 이름의 일부 중 하나를 대가로 받은 사람만 들어갈 수 있다.',
        '하층은 폐쇄된 기록실로, 마르지 않은 잉크 표식이 남아 있다.'
      ],
      appearedIn: [],
      status: 'ok'
    },
    {
      id: 'place-royal-archive',
      name: '왕립 문서고',
      sub: '왕도 중심부 · 서윤이 해임된 직장',
      facts: [
        '서윤이 필사관으로 일하다 기록 수정 혐의로 해임된 곳이다.',
        '비공식 의뢰는 대부분 이곳 출신 인맥을 통해 들어온다.'
      ],
      appearedIn: [],
      status: 'unverified'
    },
    {
      id: 'place-lower-record-room',
      name: '하층 기록실',
      sub: '달의 탑 지하 · 봉인된 구역',
      facts: [
        '탑이 지운 이름의 잔재가 은빛 먼지로 벽에 묻어 있다.',
        '오빠의 필압으로 새겨진 표식이 발견되는 장소로 계획됐다.'
      ],
      appearedIn: [],
      status: 'unverified'
    }
  ];

  const objects: CanonEntity[] = [
    {
      id: 'object-old-lamp',
      name: '낡은 등잔',
      sub: '문서고에서 가져온 휴대용 조명',
      facts: [
        '서윤이 하층으로 내려갈 때 들고 가는 유일한 광원이다.',
        '불빛이 닿으면 지워진 표식이 잠깐 떠오른다.'
      ],
      appearedIn: [],
      status: 'ok'
    },
    {
      id: 'object-sealed-invitation',
      name: '봉인된 초대장',
      sub: '이안이 쥐고 있는 탑 출입 증표',
      facts: [
        '대가를 적는 빈칸이 있고, 이안은 그 칸을 손바닥으로 가린다.',
        '빈칸에 무엇이 적혔는지는 아직 본문에 드러나지 않았다.'
      ],
      appearedIn: [],
      status: 'conflict',
      conflict: '세계 규칙은 대가가 「이름의 일부」라 못박지만, 초대장 빈칸 묘사는 「빚」으로도 읽힌다.'
    }
  ];

  const events: CanonEntity[] = [
    {
      id: 'event-archive-dismissal',
      name: '문서고 해임',
      sub: '연재 시작 약 3개월 전',
      facts: [
        '서윤이 기록 수정 혐의로 왕립 문서고에서 해임됐다.',
        '이 사건이 비공식 의뢰를 받게 된 직접적 계기다.'
      ],
      appearedIn: [],
      status: 'ok'
    },
    {
      id: 'event-brother-disappearance',
      name: '오빠의 실종',
      sub: '연재 시작 약 1년 전',
      facts: [
        '도현이 마지막 편지를 남기고 사라졌다.',
        '편지에 서윤의 필체가 섞여 있던 이유는 아직 미해결이다.'
      ],
      appearedIn: [],
      status: 'unverified'
    }
  ];

  const timeline: TimelineEntry[] = [
    {
      id: 'timeline-001',
      year: 0,
      season: '1년 전',
      label: '오빠의 실종',
      note: '도현이 마지막 편지를 남기고 달의 탑 방향으로 사라진다.',
      status: 'ok'
    },
    {
      id: 'timeline-002',
      year: 0,
      season: '3개월 전',
      label: '문서고 해임',
      note: '서윤이 기록 수정 혐의로 왕립 문서고에서 해임된다.',
      status: 'ok'
    },
    {
      id: 'timeline-003',
      year: 0,
      season: '현재',
      label: '하층 진입 계획',
      note: '서윤이 비공식 의뢰를 받아 달의 탑 하층으로 내려갈 시점 — 정확한 일자 미확정.',
      status: 'unverified'
    }
  ];

  const bibleOutline: BibleSection[] = [
    {
      id: 'tone',
      title: '톤',
      body: '서늘한 궁정 미스터리. 감정은 직접 말하지 않고 사물의 상태로 우회해 드러낸다. 직접적 감정 토로는 회차당 한 번을 넘기지 않는다.'
    },
    {
      id: 'rhythm',
      title: '문장 리듬',
      body: '평소엔 호흡이 긴 묘사를 쓰되 결정적 순간에는 단문으로 끊는다. 비슷한 길이의 문단이 세 번 이상 이어지지 않게 한다.'
    },
    {
      id: 'world',
      title: '세계관 규칙',
      body: '달의 탑은 초대장·빚·이름의 일부 중 하나를 대가로 받은 사람만 들인다. 기억 잉크는 사실을 창조하지 못하고 이미 존재한 기억의 순서만 바꾼다.'
    },
    {
      id: 'vocab',
      title: '어휘 금기',
      body: '「운명」, 「숙명」은 쓰지 않는다. 「기억」, 「기록」은 핵심어이므로 회차당 합쳐 과용하지 않도록 의식한다.'
    },
    {
      id: 'motif',
      title: '시각 모티프',
      body: '은빛 먼지 — 지워진 이름. 마르지 않은 잉크 — 방금 일어난 기억. 가려진 빈칸 — 숨겨진 대가. 회차마다 셋 중 하나는 배치한다.'
    }
  ];

  return {
    id: 'sample-project',
    title: '샘플 작품',
    logline: '기억을 고치는 필사관이 사라진 오빠의 흔적을 따라, 이름을 대가로 움직이는 탑의 비밀을 연재마다 벗겨낸다.',
    localization: createDefaultLocalizationPolicy(),
    genre: 'romance-fantasy',
    tone: '서늘한 궁정 미스터리와 느리게 타오르는 신뢰',
    audiencePromise: '매 회차마다 감정적 선택, 새로운 단서, 다음 편을 누르게 하는 반전을 제공한다.',
    deepQuestion: '기록을 고친다는 것은 사람을 구하는 일인가, 또 다른 거짓을 쌓는 일인가?',
    creativeWeight: 'balanced',
    formIntent: '서윤에게 밀착한 3인칭 제한 시점, 과거형. 회차마다 한 장소·한 장면에 머물러 긴장을 모은다.',
    currentEpisode: 0,
    characters,
    worldRules,
    canonFacts,
    openThreads: ['오빠의 마지막 편지에는 왜 서윤의 필체가 남아 있었나?', '이안은 탑에 무엇을 두고 나왔나?'],
    chapters: [],
    places,
    objects,
    events,
    timeline,
    bibleOutline
  };
}

// 작품 제목 후보를 자유 서술/초안에서 다듬는다. 빈 입력이면 중립 기본값을 돌려준다.
function deriveProjectTitle(rawTitle: string | undefined): string {
  const cleaned = (rawTitle ?? '').trim();
  if (cleaned.length === 0) {
    return '새 작품';
  }
  // "1화 — 제목", "1화: 제목" 같은 회차 접두를 떼어 작품 제목으로 쓴다.
  const withoutEpisode = cleaned.replace(/^\s*\d+\s*화\s*[—\-:·]?\s*/u, '').trim();
  return withoutEpisode.length > 0 ? withoutEpisode : cleaned;
}

// 새 프로젝트의 빈 캔버스 — 샘플 작품의 인물·장소·떡밥을 전혀 담지 않는다.
// 새 프로젝트 플로우(initialDraftPayload)가 에디터를 열 때 이걸로 시작해야 샘플 데이터가 새지 않는다.
// 인물/장소/사물/사건/시간선/캐논/열린 질문은 비어 있고, 작가와 에이전트가 채운다.
export interface OnboardingSeedInput {
  freewrite: string;
  interviewAnswers?: string[];
}

export interface OnboardingSeed {
  logline: string;
  audiencePromise: string;
  deepQuestion: string;
  /** 작품 헌장 — 온보딩 Stage 1 에서 만들어졌으면 신규 프로젝트에 박힌다(A-3). */
  storyContract?: StoryContract;
}

// 갭 A — 온보딩(freewrite + 인터뷰 답)에서 project 메타 시드를 끌어낸다.
// 발명 없이 입력 텍스트만 정제한다: logline=freewrite 첫 문장, audiencePromise=인터뷰 첫 답("→" 뒤), deepQuestion=freewrite 의 물음표 문장.
export function deriveOnboardingSeed(input: OnboardingSeedInput): OnboardingSeed {
  const freewrite = (input.freewrite || '').trim();
  const answers = (input.interviewAnswers || [])
    .map((answer) => {
      const arrow = answer.lastIndexOf('→');
      const cleaned = arrow >= 0 ? answer.slice(arrow + 1) : answer.replace(/^[-•\s]+/, '');
      return cleaned.trim();
    })
    .filter(Boolean);
  const firstSentence = freewrite.split(/(?<=[.!?。！？])\s+|\n+/u)[0] || freewrite;
  const questionSentence = freewrite
    .split(/(?<=[?？])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .find((sentence) => /[?？]$/.test(sentence));
  return {
    logline: firstSentence.trim().slice(0, 120),
    audiencePromise: answers[0] ?? '',
    deepQuestion: questionSentence ? questionSentence.slice(0, 120) : ''
  };
}

export function createEmptyProject(
  input: {
    title?: string;
    logline?: string;
    audiencePromise?: string;
    deepQuestion?: string;
    medium?: CreativeMedium;
    format?: CreativeFormat;
    storyContract?: StoryContract;
  } = {}
): SeriesProject {
  return {
    id: `project-${Date.now().toString(36)}`,
    title: deriveProjectTitle(input.title),
    logline: input.logline?.trim() || '',
    localization: createDefaultLocalizationPolicy(),
    genre: 'urban-fantasy',
    tone: '',
    medium: input.medium,
    format: input.format,
    audiencePromise: input.audiencePromise?.trim() || '',
    deepQuestion: input.deepQuestion?.trim() || '',
    creativeWeight: 'balanced',
    formIntent: '',
    currentEpisode: 0,
    characters: [],
    worldRules: [],
    canonFacts: [],
    openThreads: [],
    chapters: [],
    places: [],
    objects: [],
    events: [],
    timeline: [],
    bibleOutline: [],
    ...(input.storyContract ? { storyContract: input.storyContract } : {})
  };
}

export function validateContinuity(project: SeriesProject, claims: string[]): ContinuityIssue[] {
  const characterIssues = project.characters.flatMap((character) =>
    character.forbiddenContradictions
      .filter((rule) => claims.some((claim) => claim.includes(rule.claim)))
      .map<ContinuityIssue>((rule) => ({
        severity: 'error',
        source: 'character-custodian',
        claim: rule.claim,
        message: `${character.name} 설정 위반: ${rule.reason}`
      }))
  );

  const worldIssues = project.worldRules.flatMap((worldRule) =>
    worldRule.forbiddenContradictions
      .filter((rule) => claims.some((claim) => claim.includes(rule.claim)))
      .map<ContinuityIssue>((rule) => ({
        severity: 'error',
        source: 'world-keeper',
        claim: rule.claim,
        message: `${worldRule.title} 세계관 위반: ${rule.reason}`
      }))
  );

  const missingAnchorWarning =
    claims.length > 0 && !claims.some((claim) => project.canonFacts.some((fact) => claim.includes(fact.statement)))
      ? [
          {
            severity: 'warning' as const,
            source: 'continuity-editor' as const,
            claim: 'memory-anchor',
            message: '새 회차 요청에 기존 캐논 문장이 직접 포함되지 않았습니다. 생성 단계에서 핵심 앵커를 다시 삽입합니다.'
          }
        ]
      : [];

  // M4 청크 H — Gap 3: 부분문자열 매칭을 넘어 의미적 충돌 감지.
  // project 상태를 3계층 contract 로 매핑한 뒤 각 claim 을 classify 한다.
  // hard-canon 은 error, living-state cause/cost 누락은 warning. 기존 흐름은 보존.
  // dedup — 같은 claim 이 이미 character/world issue 를 만들었으면 중복 추가하지 않는다.
  const contract = buildContinuityContractFromProject(project);
  const alreadyFlagged = new Set<string>();
  for (const claim of claims) {
    if (characterIssues.some((issue) => claim.includes(issue.claim)) ||
        worldIssues.some((issue) => claim.includes(issue.claim))) {
      alreadyFlagged.add(claim);
    }
  }
  const contractIssues: ContinuityIssue[] = [];
  for (const claim of claims) {
    if (!claim || claim.trim().length === 0) continue;
    if (alreadyFlagged.has(claim)) continue;
    const result = classifyCanonChange(contract, claim);
    if (!result.allowed && result.layer === 'hard-canon') {
      const proposals = proposeContinuityRepair(result);
      contractIssues.push({
        severity: 'error',
        source: 'continuity-editor',
        claim,
        message: proposals.length > 0 ? `${result.reason} ${proposals[0].description}` : result.reason
      });
    } else if (!result.allowed && result.layer === 'living-state') {
      const proposals = proposeContinuityRepair(result);
      contractIssues.push({
        severity: 'warning',
        source: 'continuity-editor',
        claim,
        message: proposals.length > 0 ? `${result.reason} ${proposals[1]?.description ?? proposals[0].description}` : result.reason
      });
    }
  }

  return [...characterIssues, ...worldIssues, ...missingAnchorWarning, ...contractIssues];
}

export function buildContinuityContractFromProject(project: SeriesProject): ContinuityContract {
  const hardCanon: string[] = [];
  const livingState: string[] = [];
  const softSignals: string[] = [];

  for (const fact of project.canonFacts) {
    pushLayeredStatement(fact.statement, fact.owner, hardCanon, livingState, softSignals);
  }
  for (const rule of project.worldRules) {
    pushUnique(hardCanon, rule.rule);
  }
  for (const character of project.characters) {
    for (const anchor of character.canonAnchors) pushUnique(hardCanon, anchor);
    if (character.currentState.trim().length > 0) {
      pushUnique(livingState, `${character.name}은 ${character.currentState}`);
    }
  }
  for (const thread of project.openThreads) {
    pushUnique(softSignals, thread);
  }

  return createContinuityContract({ hardCanon, livingState, softSignals });
}

function pushLayeredStatement(
  statement: string,
  owner: CanonFact['owner'],
  hardCanon: string[],
  livingState: string[],
  softSignals: string[]
): void {
  const clean = statement.trim();
  if (clean.length === 0) return;
  if (isSoftCanonStatement(clean)) {
    pushUnique(softSignals, clean);
    return;
  }
  if (owner === 'character' && isLivingCanonStatement(clean)) {
    pushUnique(livingState, clean);
    return;
  }
  pushUnique(hardCanon, clean);
}

function isSoftCanonStatement(statement: string): boolean {
  return /소문|추측|주장|전해진|듯하다|미확정|아직\s*드러나지|가능성/.test(statement);
}

function isLivingCanonStatement(statement: string): boolean {
  if (isDefinitivePastEvent(statement)) return false;
  return /현재|아직|믿지|믿기|믿는다|신뢰|의심|불신|숨기|두려|망설|관계|감정|상태/.test(statement);
}

function isDefinitivePastEvent(statement: string): boolean {
  return /(했다|됐다|되었다|이었다|였다|었다|았다|났다|겼다|졌다|봤다|들었다)(?:[.!?。！？])?$/.test(statement.trim());
}

function pushUnique(target: string[], value: string): void {
  const clean = value.trim();
  if (clean.length > 0 && !target.includes(clean)) target.push(clean);
}

// 다음 회차 번호는 독립 카운터(currentEpisode)가 아니라 실제 chapters 의 마지막 회차에서 도출한다.
// 폴백 회차가 커밋돼 카운터를 올린 뒤 폐기되면(chapters 에서 제거) 카운터만 앞서 남아 번호가 결번되던 사고(쇼케이스 16→19)를
// chapters 를 진실원천으로 삼아 치유한다. chapters 가 비면 카운터로 폴백(회차 미하이드레이트 프로젝트 대비).
export function nextEpisodeNumber(project: SeriesProject): number {
  const lastInChapters = project.chapters.reduce((max, chapter) => Math.max(max, chapter.episode), 0);
  const base = project.chapters.length > 0 ? lastInChapters : project.currentEpisode;
  return base + 1;
}

export function produceNextChapter(project: SeriesProject, request: ProductionRequest): ProductionResult {
  // M4 청크 A — Gap 7: 빈 프로젝트(인물 0명)에서도 안전하게 동작.
  // 시드 모티프(달의 탑·오빠의 표식·이안)는 특정 작품에 묶이므로 제거. 대신 작가 입력(intent/pressure)과 장르 메타로만 산출.
  // 이 함수는 LLM 응답이 없을 때의 deterministic fallback — 풍부함보다 안전함을 우선.
  const genre = genreProfiles[request.genre];
  const episode = nextEpisodeNumber(project);
  const memoryAnchors = project.canonFacts.slice(0, 4).map((fact) => fact.statement);
  const continuityIssues = validateContinuity(project, [request.intent, request.pressure]);
  const primaryName = project.characters[0]?.name ?? '주인공';
  const primaryDesire = project.characters[0]?.desire ?? '오래 미뤄 둔 결정에 직면하는 것';
  const partnerName = project.characters[1]?.name ?? '동료';
  const intent = request.intent.trim() || '오늘 일어난 가장 작은 결정';
  const pressure = request.pressure.trim() || '낮은 감정선에서 조용히 밀고 들어오는 압력';

  // P13(2026-06-11) — 폴백은 캐논을 발명하지 않는다. 이전 템플릿 2건은
  // (a) intent 문구를 plot 캐논으로 박제(의도 메모 누수)하고 (b) "숨기고 있다" 비밀을 발명해
  // 실작품 레저를 오염시켰다(#3 fixture 캐논 #9·#10). 캐논은 LLM 본문 생성 경로에서만 만든다.
  const newCanonFacts: CanonFact[] = [];
  const outline = [
    `${episode}화는 "${intent}"을 중심 사건으로 시작한다.`,
    `${primaryName}의 장기 동기인 "${primaryDesire}"를 대사보다 행동으로 확인시킨다.`,
    `${genre.beat}; 장면 질감은 ${genre.texture}로 통일한다.`,
    `마지막 장면은 ${genre.ending}.`
  ];
  const proseLines = [
    `${primaryName}은 "${intent}"의 자리로 한 발 다가섰다.`,
    `${pressure}가 등을 가볍게 밀었다.`
  ];
  if (memoryAnchors.length > 0) {
    proseLines.push(`머릿속에 남아 있던 한 줄이 다시 떠올랐다 — ${memoryAnchors[0]}`);
  }
  proseLines.push(
    `${partnerName}은 옆에서 한 박자 늦게 입을 열었지만, 정작 중요한 한 마디는 삼켰다.`,
    `${primaryName}은 그 침묵의 무게를 읽으며, 다음 한 걸음을 어떻게 놓을지 골랐다.`
  );
  const prose = proseLines.join('\n\n');

  const beats = normalizeChapterBeats(episode, [
    {
      label: '문턱에 선 한 사람',
      summary: `${primaryName}이 "${intent}"의 자리로 한 발 다가선다.`,
      tension: 30
    },
    {
      label: '낮은 압력',
      summary: `${pressure}이 등 뒤에서 천천히 밀고 들어온다.`,
      tension: 52
    },
    {
      label: `${partnerName}의 한 박자 늦은 침묵`,
      summary: `${partnerName}이 중요한 한 마디를 삼키며 ${primaryName}의 시선을 흔든다.`,
      tension: 68
    },
    {
      label: '다음 한 걸음',
      summary: `${primaryName}이 침묵의 무게를 읽고 다음 행동을 고른다.`,
      tension: 88
    }
  ]);
  const chapter: Chapter = {
    id: `episode-${episode}`,
    episode,
    title: `${episode}화: ${intent.slice(0, 18)}`,
    hook: `${primaryName}은 "${intent}"의 한복판에서 ${partnerName}이 삼킨 한 마디의 무게를 가늠한다.`,
    outline,
    beats,
    prose,
    memoryAnchors,
    newCanonFacts
  };

  const agentRuns = buildAgentRuns(project, request, chapter, continuityIssues);
  const updatedProject = recordChapterGrowth(commitChapter(project, chapter), project, chapter, request);

  return {
    chapter,
    agentRuns,
    continuityIssues: continuityIssues.filter((issue) => issue.severity !== 'warning'),
    updatedProject
  };
}

function recordChapterGrowth(
  updatedProject: SeriesProject,
  originalProject: SeriesProject,
  chapter: Chapter,
  request: ProductionRequest
): SeriesProject {
  const primary = originalProject.characters[0];
  const intent = request.intent.trim();
  if (!primary || intent.length === 0) return updatedProject;

  const before = primary.currentState.trim();
  const after = `${chapter.episode}화 이후: ${intent}`;
  if (before === after) return updatedProject;

  const ledger = appendGrowthEntry(originalProject.growthLedger ?? { entries: [] }, {
    characterId: primary.id,
    before,
    after,
    triggerScene: chapter.id,
    choice: intent,
    cost: request.pressure.trim() || '이번 선택의 대가는 다음 회차에서 구체화된다.',
    futureConsequence: `다음 회차에서 "${intent}"의 결과를 회수해야 한다.`
  });

  return {
    ...updatedProject,
    characters: updatedProject.characters.map((character) =>
      character.id === primary.id ? { ...character, currentState: after } : character
    ),
    growthLedger: ledger
  };
}

// LLM 브리지가 만든 회차 초안 payload를 캐논 정규화·에이전트 검토와 함께 정식 Chapter로 커밋한다
export function chapterFromDraftPayload(
  project: SeriesProject,
  payload: DraftChapterPayload,
  request: ProductionRequest
): ProductionResult {
  const episode = nextEpisodeNumber(project);
  const memoryAnchors = project.canonFacts.slice(0, 4).map((fact) => fact.statement);
  const continuityIssues = validateContinuity(project, [request.intent, request.pressure]);
  const newCanonFacts: CanonFact[] = (payload.newCanonFacts ?? [])
    .filter((fact) => typeof fact?.statement === 'string' && fact.statement.trim().length > 0)
    .map((fact, index) => ({
      id: `canon-${episode.toString().padStart(3, '0')}-llm-${String(index + 1).padStart(2, '0')}`,
      episode,
      owner: normalizeCanonOwner(fact.owner),
      statement: fact.statement.trim()
    }));
  const chapter: Chapter = {
    id: `episode-${episode}`,
    episode,
    title: payload.title?.trim() || `${episode}화`,
    hook: payload.hook?.trim() ?? '',
    outline: (payload.outline ?? []).filter(
      (line): line is string => typeof line === 'string' && line.trim().length > 0
    ),
    beats: normalizeChapterBeats(episode, payload.beats),
    prose: payload.prose ?? '',
    memoryAnchors,
    newCanonFacts,
    rewardArc: (payload.rewardArc ?? [])
      .filter((e) => typeof e?.promise === 'string' && e.promise.trim().length > 0)
      .map((e) => ({
        promise: e.promise.trim(),
        payoff: typeof e.payoff === 'string' ? e.payoff.trim() : '',
        ...(typeof e.intensity === 'number' ? { intensity: Math.max(0, Math.min(100, Math.round(e.intensity))) } : {})
      })),
    stakesLedger: (payload.stakesLedger ?? [])
      .filter((e) => typeof e?.stake === 'string' && e.stake.trim().length > 0)
      .map((e) => ({
        stake: e.stake.trim(),
        atRisk: typeof e.atRisk === 'string' ? e.atRisk.trim() : '',
        ...(e.resolution === 'lost' || e.resolution === 'kept' || e.resolution === 'deferred' ? { resolution: e.resolution } : {})
      }))
  };
  const agentRuns = buildAgentRuns(project, request, chapter, continuityIssues);
  const updatedProject = recordChapterGrowth(commitChapter(project, chapter), project, chapter, request);

  return {
    chapter,
    agentRuns,
    continuityIssues: continuityIssues.filter((issue) => issue.severity !== 'warning'),
    updatedProject
  };
}

function normalizeCanonOwner(owner: string): CanonFact['owner'] {
  // M4 청크 A — Gap 5: 6개 owner 모두 허용. 모르는 값은 plot 으로 폴백.
  if (
    owner === 'character' ||
    owner === 'world' ||
    owner === 'plot' ||
    owner === 'voice' ||
    owner === 'visual' ||
    owner === 'audio'
  ) {
    return owner;
  }
  return 'plot';
}

const CONTEXT_CANON_LIMIT = 40;
const CONTEXT_CANON_HEAD = 6;
const CONTEXT_THREAD_LIMIT = 8;

// 2화 이상 생성 시 LLM에 넘길 연속성 컨텍스트를 만든다.
// 장편에서 캐논이 쌓여도 프롬프트가 무한정 커지지 않도록 초반 정착 캐논 + 최근 캐논으로 예산을 제한한다.
export function buildProjectContextDigest(project: SeriesProject): string {
  const lines: string[] = [];
  const continuityContract = buildContinuityContractFromProject(project);
  const contextPack = buildContextPack({
    storyPromise: project.audiencePromise,
    contract: continuityContract,
    characterContracts: project.characters.flatMap((character) => character.canonAnchors),
    worldCosts: project.worldRules.map((rule) => rule.rule),
    unresolvedThreads: project.openThreads,
    recentDeltas: project.chapters.flatMap((chapter) => chapter.newCanonFacts.map((fact) => fact.statement)),
    forbiddenContradictions: [
      ...project.characters.flatMap((character) => character.forbiddenContradictions.map((rule) => rule.claim)),
      ...project.worldRules.flatMap((rule) => rule.forbiddenContradictions.map((item) => item.claim))
    ],
    koreanVoiceRules: project.bibleOutline
      .filter((section) => section.id === 'tone' || section.id === 'rhythm' || section.id === 'vocab')
      .map((section) => section.body)
  });

  // 작품 계약 — 1화부터 모든 생성이 따라야 하는 약속. 회차가 없어도 항상 넘긴다.
  lines.push('작품 계약:');
  if (project.audiencePromise) {
    lines.push(`- 표면 약속(독자에게 거는 약속): ${project.audiencePromise}`);
  }
  if (project.deepQuestion) {
    lines.push(`- 심층 질문(작품이 진짜 묻는 것): ${project.deepQuestion}`);
  }
  if (project.formIntent) {
    lines.push(`- 형식·구조(시점·시제·구성 의도): ${project.formIntent}`);
  }
  lines.push(`- 무게중심: ${describeCreativeWeight(project.creativeWeight ?? 'balanced')}`);

  // 작품 헌장 절 — 헌장이 있으면 4줄 척추·결말·대가·위치를 전 생성·검토 공유 기준으로 주입한다(A-4).
  // 위치는 chapters 마지막에서 도출(폴백 번호 드리프트 면역, Phase D 원칙).
  const contract = project.storyContract;
  if (contract) {
    const position = project.chapters.reduce((max, chapter) => Math.max(max, chapter.episode), 0);
    const remaining = contract.plannedEpisodes - position;
    lines.push('', '작품 헌장 (전 회차 공유 기준 — 길 잃으면 여기로 돌아온다):');
    if (contract.spine) {
      lines.push(
        `- 4줄 척추 — 1 욕망: ${contract.spine.desire} / 2 전진: ${contract.spine.advance} / 3 시련: ${contract.spine.obstacle} / 4 변화: ${contract.spine.resolution}`
      );
    }
    lines.push(`- 결말(질문에 대한 답): ${contract.endingStatement}`);
    if (contract.protagonistCost) {
      lines.push(`- 주인공이 잃는 것: ${contract.protagonistCost}`);
    }
    lines.push(`- 현재 위치: 전체 ${contract.plannedEpisodes}화 중 ${position}화 — 다음은 ${position + 1}화 (남은 화수 ${remaining})`);
    const beat = contract.beatSheet.find((entry) => entry.episode >= position + 1);
    if (beat) {
      lines.push(`- 이번 구간 임무: ${beat.mission}`);
    }
  }

  if (project.chapters.length > 0) {
    lines.push('', `지금까지 ${project.currentEpisode}화까지 진행됨.`);
  }

  if (project.canonFacts.length > 0) {
    lines.push('', '확정 캐논 (절대 위반 금지):');
    const facts = project.canonFacts;
    const printFact = (fact: CanonFact) => lines.push(`- [${fact.owner}] ${fact.statement}`);

    if (facts.length <= CONTEXT_CANON_LIMIT) {
      facts.forEach(printFact);
    } else {
      const tailCount = CONTEXT_CANON_LIMIT - CONTEXT_CANON_HEAD;
      facts.slice(0, CONTEXT_CANON_HEAD).forEach(printFact);
      lines.push(`- … 초반 캐논 ${facts.length - CONTEXT_CANON_LIMIT}개 생략, 최근 캐논 우선 …`);
      facts.slice(facts.length - tailCount).forEach(printFact);
    }
  }
  if (contextPack.livingState.length > 0) {
    lines.push('', '변화 가능 상태 (원인·대가 필요):');
    contextPack.livingState.slice(-CONTEXT_THREAD_LIMIT).forEach((state) => lines.push(`- ${state}`));
  }
  if (contextPack.unresolvedThreads.length > 0 || contextPack.forbiddenContradictions.length > 0) {
    lines.push('', '연속성 판단 팩:');
    contextPack.unresolvedThreads.slice(-CONTEXT_THREAD_LIMIT).forEach((thread) => lines.push(`- 열린 떡밥: ${thread}`));
    contextPack.forbiddenContradictions
      .slice(0, CONTEXT_THREAD_LIMIT)
      .forEach((claim) => lines.push(`- 금지 반전: ${claim}`));
  }
  if (project.characters.length > 0) {
    lines.push('', '인물:');
    project.characters.forEach((character) =>
      lines.push(
        `- ${character.name} (${character.role}) — 욕망: ${character.desire} / 상처: ${character.wound} / 현재: ${character.currentState}`
      )
    );
  }
  if (project.worldRules.length > 0) {
    lines.push('', '세계 규칙:');
    project.worldRules.forEach((rule) => lines.push(`- ${rule.title}: ${rule.rule}`));
  }
  if (project.openThreads.length > 0) {
    lines.push('', '열린 떡밥:');
    project.openThreads.slice(-CONTEXT_THREAD_LIMIT).forEach((thread) => lines.push(`- ${thread}`));
  }

  return lines.join('\n');
}

// 데이터 모드 캐논 분야 — 데이터 검토가 다루는 5종.
export type CanonReviewCategory = 'characters' | 'places' | 'objects' | 'events' | 'timeline';

const canonReviewCategoryLabels: Record<CanonReviewCategory, string> = {
  characters: '인물',
  places: '장소',
  objects: '사물',
  events: '사건',
  timeline: '시간선'
};

// 데이터 검토용 분야 라벨을 돌려준다 — 인물/장소/사물/사건/시간선.
export function getCanonReviewCategoryLabel(category: CanonReviewCategory): string {
  return canonReviewCategoryLabels[category];
}

function describeCanonStatus(status: CanonStatus, conflict?: string): string {
  if (status === 'conflict') {
    return conflict ? `충돌 — ${conflict}` : '충돌';
  }
  if (status === 'unverified') {
    return '미확인 — 아직 본문에 등장하지 않음';
  }
  return '정합 확인됨';
}

// 한 캐논 분야의 엔티티를 LLM 데이터 검토에 넘길 텍스트로 직렬화한다.
// 인물은 욕망·상처·관계까지, 장소/사물/사건은 사실·등장 회차·상태, 시간선은 연도·계절·라벨을 담는다.
export function serializeCanonCategory(project: SeriesProject, category: CanonReviewCategory): string {
  const lines: string[] = [`분야: ${getCanonReviewCategoryLabel(category)}`];

  if (category === 'characters') {
    if (project.characters.length === 0) {
      lines.push('(등록된 인물이 없습니다.)');
      return lines.join('\n');
    }
    project.characters.forEach((character) => {
      lines.push('', `- ${character.name} (${character.role})`);
      lines.push(`  · 욕망: ${character.desire}`);
      lines.push(`  · 상처: ${character.wound}`);
      lines.push(`  · 현재 상태: ${character.currentState}`);
      if (character.relations.length > 0) {
        const relationText = character.relations
          .map((relation) => {
            const target = project.characters.find((item) => item.id === relation.targetId);
            const targetName = target ? target.name : relation.targetId;
            return `${targetName}(${relation.label}${relation.dashed ? ', 잠정' : ''})`;
          })
          .join(', ');
        lines.push(`  · 관계: ${relationText}`);
      }
    });
    return lines.join('\n');
  }

  if (category === 'timeline') {
    if (project.timeline.length === 0) {
      lines.push('(등록된 시간선 항목이 없습니다.)');
      return lines.join('\n');
    }
    project.timeline.forEach((entry) => {
      lines.push(
        '',
        `- ${entry.year}년 ${entry.season} · ${entry.label} [${describeCanonStatus(entry.status)}]`
      );
      if (entry.note) {
        lines.push(`  · 메모: ${entry.note}`);
      }
    });
    return lines.join('\n');
  }

  const entities = category === 'places' ? project.places : category === 'objects' ? project.objects : project.events;
  if (entities.length === 0) {
    lines.push(`(등록된 ${getCanonReviewCategoryLabel(category)} 엔티티가 없습니다.)`);
    return lines.join('\n');
  }
  entities.forEach((entity) => {
    lines.push('', `- ${entity.name}${entity.sub ? ` (${entity.sub})` : ''} [${describeCanonStatus(entity.status, entity.conflict)}]`);
    entity.facts.forEach((fact) => lines.push(`  · 사실: ${fact}`));
    if (entity.appearedIn.length > 0) {
      lines.push(`  · 등장 회차: ${entity.appearedIn.join(', ')}`);
    }
  });
  return lines.join('\n');
}

// 데이터 검토 노트 한 건 — 정합(consistency check) 또는 제안(strengthening idea).
export interface DataReviewNoteRecord {
  kind: '정합' | '제안';
  title: string;
  body: string;
}

export interface DeterministicDataReview {
  summary: string;
  notes: DataReviewNoteRecord[];
}

// 브리지 미연결·오프라인일 때 쓰는 deterministic 데이터 검토 — 실제 엔티티 상태에서 정합/제안 노트를 만든다.
export function buildDeterministicDataReview(
  project: SeriesProject,
  category: CanonReviewCategory
): DeterministicDataReview {
  const label = getCanonReviewCategoryLabel(category);
  const notes: DataReviewNoteRecord[] = [];

  if (category === 'characters') {
    const count = project.characters.length;
    const noRelations = project.characters.filter((character) => character.relations.length === 0);
    notes.push({
      kind: '정합',
      title: `${label} ${count}명의 욕망·상처 정합`,
      body:
        count > 0
          ? `등록된 인물 ${count}명의 욕망과 상처가 서로 모순되지 않는지 확인했습니다. 회차가 쌓이면 현재 상태와 캐논 사실의 어긋남을 다시 점검하세요.`
          : '아직 등록된 인물이 없어 정합을 확인할 대상이 없습니다.'
    });
    notes.push({
      kind: '제안',
      title: noRelations.length > 0 ? '관계가 비어 있는 인물 보강' : '인물 관계 심화',
      body:
        noRelations.length > 0
          ? `${noRelations.map((character) => character.name).join(', ')}의 관계가 비어 있습니다. 다른 인물과의 관계를 한 줄이라도 채우면 관계도가 살아납니다.`
          : '관계도의 잠정(점선) 관계 중 회차에서 확정할 만한 것을 골라 굵은 선으로 올리면 인물 망이 단단해집니다.'
    });
    return {
      summary: `${label} 분야 deterministic 검토 — 인물 ${count}명의 정합과 보강 지점을 정리했습니다. 실제 검토는 Claude 구독으로 실행하세요.`,
      notes
    };
  }

  if (category === 'timeline') {
    const entries = project.timeline;
    const flagged = entries.filter((entry) => entry.status !== 'ok');
    notes.push({
      kind: '정합',
      title: flagged.length > 0 ? `시간선 미확정 ${flagged.length}건` : '시간선 연도 정합',
      body:
        flagged.length > 0
          ? `${flagged.map((entry) => `${entry.year}년 ${entry.label}`).join(', ')} 항목이 아직 확정되지 않았습니다. 본문과 대조해 연도·계절을 확정하세요.`
          : '등록된 시간선 항목의 연도 순서와 계절이 서로 어긋나지 않습니다.'
    });
    notes.push({
      kind: '제안',
      title: '시간선 공백 보강',
      body:
        entries.length > 1
          ? '연속된 두 항목 사이의 간격이 큰 구간이 있으면, 그 사이를 메우는 사건 한 줄을 더하면 연표가 촘촘해집니다.'
          : '시간선 항목이 부족합니다. 핵심 사건의 연도를 두세 개 더 등록하면 회차 간 시점 검증이 쉬워집니다.'
    });
    return {
      summary: `${label} 분야 deterministic 검토 — 시간선 ${entries.length}개 항목의 정합과 공백을 정리했습니다. 실제 검토는 Claude 구독으로 실행하세요.`,
      notes
    };
  }

  const entities = category === 'places' ? project.places : category === 'objects' ? project.objects : project.events;
  const conflicts = entities.filter((entity) => entity.status === 'conflict');
  const unverified = entities.filter((entity) => entity.status === 'unverified');
  notes.push({
    kind: '정합',
    title:
      conflicts.length > 0
        ? `${label} 충돌 ${conflicts.length}건`
        : unverified.length > 0
          ? `${label} 미확인 ${unverified.length}건`
          : `${label} 사실 정합`,
    body:
      conflicts.length > 0
        ? `${conflicts.map((entity) => entity.name).join(', ')}의 사실이 본문과 어긋납니다. 충돌 내용을 확인하고 사실 또는 본문을 맞추세요.`
        : unverified.length > 0
          ? `${unverified.map((entity) => entity.name).join(', ')}이(가) 아직 본문에 등장하지 않았습니다. 등장 회차를 채우거나 사용 계획을 정하세요.`
          : `등록된 ${label} 엔티티의 사실과 등장 회차가 서로 어긋나지 않습니다.`
  });
  notes.push({
    kind: '제안',
    title: `${label} 활용 보강`,
    body:
      entities.length > 0
        ? `등록된 ${label} 중 등장 회차가 하나뿐인 엔티티는 다음 회차에서 다시 불러 쓰면 작품의 밀도가 올라갑니다.`
        : `아직 등록된 ${label} 엔티티가 없습니다. 작품에 이미 나온 ${label}을(를) 캐논으로 등록하면 연속성 검증이 가능해집니다.`
  });
  return {
    summary: `${label} 분야 deterministic 검토 — ${label} ${entities.length}개 엔티티의 정합과 보강을 정리했습니다. 실제 검토는 Claude 구독으로 실행하세요.`,
    notes
  };
}

export interface ApprovedMemoryInput {
  id: string;
  owner: string;
  statement: string;
}

// 승인된 검토 기억 후보를 실제 작품 캐논으로 반영한다 — 생성-검토-승인 루프를 닫는 지점
export function applyApprovedMemory(project: SeriesProject, approved: ApprovedMemoryInput[]): SeriesProject {
  const newFacts: CanonFact[] = approved
    .filter((item) => typeof item.statement === 'string' && item.statement.trim().length > 0)
    .map((item) => ({
      id: `canon-approved-${item.id}`,
      episode: project.currentEpisode,
      owner: normalizeCanonOwner(item.owner),
      statement: item.statement.trim()
    }));

  if (newFacts.length === 0) {
    return project;
  }

  return {
    ...project,
    canonFacts: [...project.canonFacts, ...newFacts]
  };
}

export function commitChapter(project: SeriesProject, chapter: Chapter): SeriesProject {
  // 회차를 커밋해도 열린 질문은 그대로 둔다 — 떡밥은 작가/에이전트 검토가 관리하며,
  // 엔진이 임의 문장을 끼워 넣지 않는다(빈 프로젝트에 샘플 떡밥이 새지 않도록).
  return {
    ...project,
    currentEpisode: chapter.episode,
    canonFacts: [...project.canonFacts, ...chapter.newCanonFacts],
    chapters: [...project.chapters, chapter],
    // P4·P5 — owner=character 캐논의 인물을 characters 로 승격(드리프트 방지), 그 뒤 관계 엣지를 연결한다.
    characters: linkRelationsFromCanon(
      promoteCharactersFromCanon(project.characters, chapter.newCanonFacts),
      chapter.newCanonFacts
    )
  };
}

// 작가가 편집한 본문(editorText)을 해당 회차 prose 로 commit 한다(베타테스트 #1 — 본문 영속).
// 없는 회차이거나 prose 가 동일하면 참조를 그대로 반환해 불필요한 저장·리렌더를 막는다.
export function commitChapterProse(project: SeriesProject, chapterId: string, prose: string): SeriesProject {
  const index = project.chapters.findIndex((chapter) => chapter.id === chapterId);
  if (index < 0 || project.chapters[index].prose === prose) {
    return project;
  }
  return {
    ...project,
    chapters: project.chapters.map((chapter, i) => (i === index ? { ...chapter, prose } : chapter))
  };
}

// relations — 승격이 끝난 인물 목록에 owner=character 캐논의 "A의 [관계] 이름은 B" 엣지를 더한다.
// 양쪽 인물이 모두 승격돼 있을 때만, 중복 라벨은 건너뛴다. 발명 없음(extractRelation 가 보수적으로 거른다).
function linkRelationsFromCanon(characters: CharacterProfile[], newFacts: CanonFact[]): CharacterProfile[] {
  let result = characters;
  for (const fact of newFacts) {
    if (fact.owner !== 'character') continue;
    const rel = extractRelation(fact.statement);
    if (!rel) continue;
    const subjectIndex = result.findIndex((character) => character.name === rel.subject);
    const target = result.find((character) => character.name === rel.target);
    if (subjectIndex < 0 || !target) continue;
    const subject = result[subjectIndex];
    if (subject.relations.some((relation) => relation.targetId === target.id && relation.label === rel.label)) continue;
    result = result.map((character, index) =>
      index === subjectIndex
        ? { ...character, relations: [...character.relations, { targetId: target.id, label: rel.label }] }
        : character
    );
  }
  return result;
}

// P4·P5 — 회차의 owner=character 캐논에서 새 인물을 characters 로 승격한다.
// 발명하지 않는다 — 캐논에 등장한 이름만(주어 + 서술부 명명), 중복·generic·조직은 extractCharacterNames 가드로 제외한다.
function promoteCharactersFromCanon(existing: CharacterProfile[], newFacts: CanonFact[]): CharacterProfile[] {
  const characters = [...existing];
  for (const fact of newFacts) {
    if (fact.owner !== 'character') continue;
    extractCharacterNames(fact.statement).forEach((name, index) => {
      if (characters.some((character) => character.name === name)) return;
      characters.push({
        id: index === 0 ? `char-${fact.id}` : `char-${fact.id}-${index}`,
        name,
        role: '',
        desire: '',
        wound: '',
        currentState: `${fact.episode}화 등장`,
        voiceRules: [],
        canonAnchors: [fact.statement],
        forbiddenContradictions: [],
        relations: []
      });
    });
  }
  return characters;
}

export function getGenreProfiles() {
  return genreProfiles;
}

export function buildStoryEditorWorkspace(
  project: SeriesProject,
  options: StoryEditorWorkspaceOptions = {}
): StoryEditorWorkspace {
  const continuityIssues = validateContinuity(project, options.draftClaims ?? []);
  const blocked = continuityIssues.filter((issue) => issue.severity === 'error').length;
  const warnings = continuityIssues.filter((issue) => issue.severity === 'warning').length;
  const codexEntries = buildCodexEntries(project);
  const corkboardCards = buildCorkboardCards(project, blocked > 0);
  const compileText = buildCompileText(project);

  return {
    viewModes: [
      {
        id: 'binder',
        label: 'Binder',
        description: '프로젝트 조각을 계층으로 탐색합니다.'
      },
      {
        id: 'corkboard',
        label: 'Corkboard',
        description: '장면을 카드로 재배열하고 후크를 봅니다.'
      },
      {
        id: 'outliner',
        label: 'Outliner',
        description: 'POV, 상태, 캐논 후보를 표로 점검합니다.'
      },
      {
        id: 'scrivenings',
        label: 'Scrivenings',
        description: '조각난 원고를 하나의 흐름으로 읽습니다.'
      }
    ],
    binderItems: buildBinderItems(project, codexEntries),
    corkboardCards,
    outlinerRows: corkboardCards.map((card) => {
      const chapter = project.chapters.find((item) => item.id === card.chapterId);

      return {
        chapterId: card.chapterId,
        episode: chapter?.episode ?? 0,
        title: card.title,
        pov: card.pov,
        status: card.status,
        wordCount: countWords(chapter?.prose ?? ''),
        linkedCodexCount: card.linkedCodexIds.length,
        canonCandidateCount: card.canonCandidateIds.length,
        continuityState: blocked > 0 ? 'blocked' : 'clear'
      };
    }),
    codexEntries,
    snapshots: project.chapters
      .slice()
      .reverse()
      .map((chapter) => ({
        id: `snapshot-${chapter.id}`,
        chapterId: chapter.id,
        title: `${chapter.title} snapshot`,
        reason: 'continuity review checkpoint',
        text: chapter.prose
      })),
    compilePreview: {
      title: `${project.title} compile preview`,
      sectionCount: project.chapters.length,
      wordCount: countWords(compileText),
      text: compileText
    },
    continuityIssues,
    continuitySummary: {
      status: blocked > 0 ? 'blocked' : 'clear',
      blocked,
      warnings
    }
  };
}

function buildBinderItems(project: SeriesProject, codexEntries: CodexEntry[]): BinderItem[] {
  return [
    {
      id: `binder-project-${project.id}`,
      title: project.title,
      kind: 'project',
      depth: 0,
      detail: project.logline
    },
    {
      id: 'binder-draft',
      title: 'Draft',
      kind: 'folder',
      depth: 1,
      detail: `${project.chapters.length} episodes`
    },
    ...project.chapters.map<BinderItem>((chapter) => ({
      id: `binder-${chapter.id}`,
      title: chapter.title,
      kind: 'chapter',
      depth: 2,
      detail: chapter.hook
    })),
    {
      id: 'binder-codex',
      title: 'Codex',
      kind: 'folder',
      depth: 1,
      detail: `${codexEntries.length} entries`
    },
    ...codexEntries.slice(0, 8).map<BinderItem>((entry) => ({
      id: `binder-${entry.id}`,
      title: entry.title,
      kind: 'codex-entry',
      depth: 2,
      detail: entry.kind
    }))
  ];
}

function buildCorkboardCards(project: SeriesProject, hasBlockedContinuity: boolean): CorkboardCard[] {
  const primaryCharacter = project.characters[0];
  const primaryWorldRule = project.worldRules[0];

  return project.chapters.map((chapter) => ({
    chapterId: chapter.id,
    title: chapter.title,
    synopsis: chapter.hook,
    pov: primaryCharacter?.name ?? 'POV 미정',
    status: 'drafted',
    label: hasBlockedContinuity ? 'needs continuity pass' : genreProfiles[project.genre].label,
    tags: [
      genreProfiles[project.genre].label,
      chapter.newCanonFacts.length > 0 ? 'canon candidate' : 'no new canon',
      chapter.memoryAnchors.length > 0 ? 'anchored' : 'needs anchor'
    ],
    linkedCodexIds: [
      primaryCharacter ? `codex-character-${primaryCharacter.id}` : '',
      primaryWorldRule ? `codex-world-${primaryWorldRule.id}` : ''
    ].filter(Boolean),
    canonCandidateIds: chapter.newCanonFacts.map((fact) => fact.id)
  }));
}

function buildCodexEntries(project: SeriesProject): CodexEntry[] {
  const characterEntries = project.characters.map<CodexEntry>((character) => ({
    id: `codex-character-${character.id}`,
    kind: 'character',
    title: character.name,
    summary: character.role,
    fields: [
      { label: 'desire', value: character.desire },
      { label: 'wound', value: character.wound },
      { label: 'state', value: character.currentState },
      { label: 'voice', value: character.voiceRules.join(' / ') }
    ],
    sourceIds: character.canonAnchors
  }));

  const worldEntries = project.worldRules.map<CodexEntry>((worldRule) => ({
    id: `codex-world-${worldRule.id}`,
    kind: 'world-rule',
    title: worldRule.title,
    summary: worldRule.rule,
    fields: [
      { label: 'rule', value: worldRule.rule },
      {
        label: 'forbidden',
        value: worldRule.forbiddenContradictions.map((item) => item.claim).join(' / ')
      }
    ],
    sourceIds: [worldRule.id]
  }));

  const threadEntries = project.openThreads.map<CodexEntry>((thread, index) => ({
    id: `codex-thread-${String(index + 1).padStart(2, '0')}`,
    kind: 'plot-thread',
    title: thread,
    summary: '아직 회수되지 않은 독자 질문입니다.',
    fields: [
      { label: 'status', value: 'open' },
      { label: 'payoff', value: '다음 회차 설계에서 회수 조건을 지정해야 합니다.' }
    ],
    sourceIds: [`thread-${index + 1}`]
  }));

  const canonEntries = project.canonFacts.slice(-6).map<CodexEntry>((fact) => ({
    id: `codex-canon-${fact.id}`,
    kind: 'canon',
    title: `EP ${fact.episode} ${fact.owner}`,
    summary: fact.statement,
    fields: [
      { label: 'owner', value: fact.owner },
      { label: 'episode', value: String(fact.episode) }
    ],
    sourceIds: [fact.id]
  }));

  return [...characterEntries, ...worldEntries, ...threadEntries, ...canonEntries];
}

function buildCompileText(project: SeriesProject) {
  if (project.chapters.length === 0) {
    return `${project.title}\n\n${project.logline}`;
  }

  return project.chapters
    .slice()
    .sort((left, right) => left.episode - right.episode)
    .map((chapter) => `# ${chapter.title}\n\n${chapter.prose}`)
    .join('\n\n---\n\n');
}

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// M4 청크 F — 하드코딩 5명 폐기, agentRunEngine.planAgentRuns 로 위임 (Gap 4).
// 검토 스케일·요청 에이전트 결정은 agentRunEngine 이 담당. 이 wrapper 는 기존 호출 시그니처 유지용.
function buildAgentRuns(
  project: SeriesProject,
  request: ProductionRequest,
  chapter: Chapter,
  issues: ContinuityIssue[]
): AgentRun[] {
  return planAgentRuns({ project, request, chapter, issues }).runs;
}
