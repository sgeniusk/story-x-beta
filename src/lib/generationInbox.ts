import type { DiveCondensePayload } from './diveClient';
import { parseCondenseSourceSpan, type CondenseSourceSpan } from './diveSession';
import type { PlayRecoverySnapshot, PlayRecoveryWorkDraft } from './playRecovery';
import {
  parseEpisodeLengthContract,
  type Chapter,
  type EpisodeLengthContract,
  type SeriesProject
} from './storyEngine';

export type GenerationStatus = 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out' | 'expired';
export const EPISODE_LENGTH_RECEIPT_SCHEMA = 'storyx/episode-length/v1' as const;

export interface GenerationJobSnapshot {
  id: string;
  projectId: string;
  baseRevision: string;
  episode: number;
  /** 생성 시작 순간 고정한 회차별 분량 계약. 구버전 job/receipt는 undefined. */
  episodeLength?: EpisodeLengthContract;
  status: Exclude<GenerationStatus, 'expired'>;
  createdAt: string;
  updatedAt: string;
  result?: DiveCondensePayload;
  warning?: string;
}

/**
 * 응결 승인 도중 본편 저장보다 먼저 영속하는 최소 재개 정보.
 * syncConsole 의 타입을 직접 참조하지 않아 양방향 모듈 의존을 만들지 않는다.
 */
export interface ApprovedCondenseCheckpoint {
  baseProjectRevision: string;
  committedProjectRevision: string;
  condensedThroughTurn: number;
  sourceSpan?: CondenseSourceSpan;
  chapter: Chapter;
  retcons: Array<{
    factId: string;
    previousStatement: string;
    statement: string;
  }>;
}

export interface GenerationInboxItem extends Omit<GenerationJobSnapshot, 'status'> {
  kind: 'dive-condense';
  projectTitle: string;
  status: GenerationStatus;
  /** recovery snapshot 압축 후에도 남아야 하는 생성 source 경계. */
  sourceSpan?: CondenseSourceSpan;
  /** recovery가 quota 압축돼도 남는 frozen source identity. */
  sourceFingerprint?: string;
  /** 이 영수증이 분량 계약 세대임을 남겨 root 손상을 legacy로 오인하지 않는다. */
  episodeLengthSchema?: typeof EPISODE_LENGTH_RECEIPT_SCHEMA;
  recovery?: PlayRecoverySnapshot;
  recoveryDraftOpenedAt?: string;
  recoveryDraftId?: string;
  recoveredAt?: string;
  recoveredChapterId?: string;
  approvedCondenseCheckpoint?: ApprovedCondenseCheckpoint;
  localPersistenceFailed?: boolean;
}

const STORAGE_KEY = 'serial-story-studio/generation-inbox';
export const MAX_GENERATION_INBOX_ITEMS = 20;
const STATUSES = new Set<GenerationStatus>(['running', 'succeeded', 'failed', 'cancelled', 'timed-out', 'expired']);

function needsInboxRetention(item: GenerationInboxItem): boolean {
  return Boolean(
    item.status === 'running' ||
    item.approvedCondenseCheckpoint ||
    item.recoveryDraftOpenedAt &&
    item.recoveryDraftId &&
    !(item.recoveredAt && item.recoveredChapterId)
  );
}

function retainGenerationInboxItems(items: GenerationInboxItem[]): GenerationInboxItem[] {
  let remainingOverflow = Math.max(0, items.length - MAX_GENERATION_INBOX_ITEMS);
  if (remainingOverflow === 0) return items;
  const retained = [...items];
  for (let index = retained.length - 1; index >= 0 && remainingOverflow > 0; index -= 1) {
    if (needsInboxRetention(retained[index])) continue;
    retained.splice(index, 1);
    remainingOverflow -= 1;
  }
  // 실행 중 생성·승인 체크포인트·미완료 작업본만으로 cap을 넘으면 안전한 재개를 위해 overflow를 보존한다.
  return retained;
}

interface GenerationInboxStorage {
  setItem(key: string, value: string): void;
}

export interface GenerationInboxSaveResult {
  ok: boolean;
  compacted: boolean;
  items: GenerationInboxItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseResult(value: unknown): DiveCondensePayload | undefined {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.prose !== 'string') return undefined;
  const {
    episodeLength: _episodeLength,
    actualChars: _actualChars,
    lengthStatus: _lengthStatus,
    ...payload
  } = value;
  const episodeLength = parseEpisodeLengthContract(value.episodeLength);
  const actualChars = typeof value.actualChars === 'number' &&
    Number.isInteger(value.actualChars) && value.actualChars >= 0
    ? value.actualChars
    : undefined;
  const lengthStatus = value.lengthStatus === 'under' ||
    value.lengthStatus === 'within' || value.lengthStatus === 'over'
    ? value.lengthStatus
    : undefined;
  return {
    ...payload,
    ...(episodeLength ? { episodeLength } : {}),
    ...(actualChars !== undefined ? { actualChars } : {}),
    ...(lengthStatus ? { lengthStatus } : {})
  } as unknown as DiveCondensePayload;
}

function parseRecovery(value: unknown): PlayRecoverySnapshot | undefined {
  if (!isRecord(value) || value.schema !== 'storyx/play-recovery/v1') return undefined;
  if (typeof value.projectId !== 'string' || !value.projectId || typeof value.projectTitle !== 'string') return undefined;
  if (typeof value.episode !== 'number' || !Number.isFinite(value.episode)) return undefined;
  if (typeof value.scene !== 'string' || typeof value.transcript !== 'string' || typeof value.capturedAt !== 'string') return undefined;
  if (value.condensedThroughTurn !== undefined && (
    !Number.isInteger(value.condensedThroughTurn) || (value.condensedThroughTurn as number) < 0
  )) return undefined;
  // 손상된 optional span은 recovery 원문과 분리해 강등한다.
  const sourceSpan = parseCondenseSourceSpan(value.sourceSpan);
  const sourceFingerprint = typeof value.sourceFingerprint === 'string' && value.sourceFingerprint
    ? value.sourceFingerprint
    : undefined;
  const episodeLength = parseEpisodeLengthContract(value.episodeLength);
  return {
    schema: 'storyx/play-recovery/v1',
    projectId: value.projectId,
    projectTitle: value.projectTitle,
    episode: value.episode,
    scene: value.scene,
    transcript: value.transcript,
    ...(typeof value.condensedThroughTurn === 'number'
      ? { condensedThroughTurn: value.condensedThroughTurn }
      : {}),
    ...(sourceSpan ? { sourceSpan } : {}),
    ...(sourceFingerprint ? { sourceFingerprint } : {}),
    ...(episodeLength ? { episodeLength } : {}),
    capturedAt: value.capturedAt
  };
}

/** 현대 receipt는 root 분량 계약이 사라지거나 손상되면 targetless legacy로 승인하지 않는다. */
export function receiptEpisodeLengthMatchesChapter(
  receipt: GenerationInboxItem,
  chapter: Chapter
): boolean {
  const chapterEpisodeLength = parseEpisodeLengthContract(chapter.episodeLength);
  if (receipt.episodeLengthSchema === EPISODE_LENGTH_RECEIPT_SCHEMA && !receipt.episodeLength) {
    return false;
  }
  if (!receipt.episodeLength) return chapterEpisodeLength === undefined;
  return chapterEpisodeLength?.preset === receipt.episodeLength.preset;
}

/**
 * 작업본 commit 직전 receipt 연결과 목표 정본을 함께 검사한다.
 * 등록 전 local 실패만 recovery snapshot을 신뢰하며, 등록된 잡은 durable receipt 유실 시 막는다.
 */
export function hasUsableRecoveryDraftEpisodeLength(
  draft: PlayRecoveryWorkDraft,
  receipt: GenerationInboxItem | undefined
): boolean {
  if (!receipt) return Boolean(draft.generationId?.startsWith('local-'));
  if (
    receipt.id !== draft.generationId ||
    receipt.projectId !== draft.projectId ||
    receipt.episode !== draft.episodeHint
  ) return false;
  return !(
    receipt.episodeLengthSchema === EPISODE_LENGTH_RECEIPT_SCHEMA &&
    !receipt.episodeLength
  );
}

/**
 * 별도 작업본은 오래 열려 있을 수 있으므로 회차 commit 직전에 durable receipt root를
 * 다시 정본으로 삼는다. receipt가 없거나 서로 다른 작업이면 과거 nested 목표를 제거한다.
 */
export function canonicalizeRecoveryDraftEpisodeLength(
  draft: PlayRecoveryWorkDraft,
  receipt: GenerationInboxItem | undefined
): PlayRecoveryWorkDraft {
  if (!receipt && draft.generationId?.startsWith('local-')) return draft;
  const { episodeLength: _draftEpisodeLength, ...targetlessSource } = draft.source;
  const linkedReceipt = receipt &&
    receipt.id === draft.generationId &&
    receipt.projectId === draft.projectId &&
    receipt.episode === draft.episodeHint
    ? receipt
    : undefined;
  return {
    ...draft,
    source: linkedReceipt?.episodeLength
      ? { ...targetlessSource, episodeLength: linkedReceipt.episodeLength }
      : targetlessSource
  };
}

const CANON_OWNERS = new Set(['character', 'world', 'plot', 'voice', 'visual', 'audio']);
const CANON_REVEALS = new Set(['revealed', 'secret', 'foreshadowed']);
const CANON_EVIDENCE_SOURCES = new Set(['chapter', 'preset', 'user', 'extracted']);
const STAKES_RESOLUTIONS = new Set(['lost', 'kept', 'deferred']);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isValidCanonEvidence(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.sourceType === 'string' && CANON_EVIDENCE_SOURCES.has(value.sourceType) &&
    typeof value.sourceId === 'string' &&
    (value.quote === undefined || typeof value.quote === 'string');
}

function isValidCanonFact(value: unknown, episode: number): boolean {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && Boolean(value.id) &&
    value.episode === episode &&
    typeof value.owner === 'string' && CANON_OWNERS.has(value.owner) &&
    typeof value.statement === 'string' &&
    (value.alwaysInclude === undefined || typeof value.alwaysInclude === 'boolean') &&
    (value.importance === undefined || (
      isFiniteNumber(value.importance) && value.importance >= 0 && value.importance <= 1
    )) &&
    (value.participants === undefined || isStringArray(value.participants)) &&
    (value.reveal === undefined || (
      typeof value.reveal === 'string' && CANON_REVEALS.has(value.reveal)
    )) &&
    (value.evidence === undefined || isValidCanonEvidence(value.evidence));
}

function isValidChapterBeat(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && Boolean(value.id) &&
    Number.isInteger(value.no) && (value.no as number) >= 1 &&
    typeof value.label === 'string' &&
    typeof value.summary === 'string' &&
    isFiniteNumber(value.tension) && value.tension >= 0 && value.tension <= 100;
}

function isValidRewardArcEntry(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.promise === 'string' &&
    typeof value.payoff === 'string' &&
    (value.intensity === undefined || (
      isFiniteNumber(value.intensity) && value.intensity >= 0 && value.intensity <= 100
    ));
}

function isValidStakesLedgerEntry(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.stake === 'string' &&
    typeof value.atRisk === 'string' &&
    (value.resolution === undefined || (
      typeof value.resolution === 'string' && STAKES_RESOLUTIONS.has(value.resolution)
    ));
}

function isValidChapter(value: unknown): value is Chapter {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || !value.id) return false;
  if (!Number.isInteger(value.episode) || (value.episode as number) < 1) return false;
  if (typeof value.title !== 'string' || typeof value.hook !== 'string' || typeof value.prose !== 'string') return false;
  if (!isStringArray(value.outline) || !isStringArray(value.memoryAnchors)) return false;
  if (!Array.isArray(value.beats) || !value.beats.every(isValidChapterBeat)) return false;
  if (!Array.isArray(value.newCanonFacts) || !value.newCanonFacts.every((fact) => isValidCanonFact(fact, value.episode as number))) return false;
  if (value.locked !== undefined && typeof value.locked !== 'boolean') return false;
  if (value.rewardArc !== undefined && (
    !Array.isArray(value.rewardArc) || !value.rewardArc.every(isValidRewardArcEntry)
  )) return false;
  if (value.stakesLedger !== undefined && (
    !Array.isArray(value.stakesLedger) || !value.stakesLedger.every(isValidStakesLedgerEntry)
  )) return false;

  const beatIds = new Set((value.beats as Array<Record<string, unknown>>).map((beat) => beat.id));
  const canonIds = new Set((value.newCanonFacts as Array<Record<string, unknown>>).map((fact) => fact.id));
  return beatIds.size === value.beats.length && canonIds.size === value.newCanonFacts.length;
}

function parseChapter(value: unknown): Chapter | undefined {
  if (!isValidChapter(value)) return undefined;
  const { episodeLength: _episodeLength, ...chapter } = value as Chapter;
  const episodeLength = parseEpisodeLengthContract(value.episodeLength);
  return {
    ...chapter,
    ...(episodeLength ? { episodeLength } : {})
  } as Chapter;
}

function parseApprovedCondenseCheckpoint(
  value: unknown,
  expectedEpisode?: number
): ApprovedCondenseCheckpoint | undefined {
  if (!isRecord(value) || !Array.isArray(value.retcons)) return undefined;
  const chapter = parseChapter(value.chapter);
  if (!chapter) return undefined;
  if (typeof value.baseProjectRevision !== 'string' || !value.baseProjectRevision.trim()) return undefined;
  if (typeof value.committedProjectRevision !== 'string' || !value.committedProjectRevision.trim()) return undefined;
  const condensedThroughTurn = value.condensedThroughTurn === undefined
    ? 0
    : value.condensedThroughTurn;
  if (!Number.isInteger(condensedThroughTurn) || (condensedThroughTurn as number) < 0) return undefined;
  const parsedSourceSpan = parseCondenseSourceSpan(value.sourceSpan);
  // checkpoint의 숫자 경계는 legacy 재개의 정본이다. 불일치 span만 버린다.
  const sourceSpan = parsedSourceSpan?.throughTurn === condensedThroughTurn
    ? parsedSourceSpan
    : undefined;
  if (expectedEpisode !== undefined && chapter.episode !== expectedEpisode) return undefined;
  const retcons: ApprovedCondenseCheckpoint['retcons'] = [];
  const factIds = new Set<string>();
  for (const retcon of value.retcons) {
    if (!isRecord(retcon) || typeof retcon.factId !== 'string' || !retcon.factId) return undefined;
    if (typeof retcon.previousStatement !== 'string' || typeof retcon.statement !== 'string') return undefined;
    if (factIds.has(retcon.factId)) return undefined;
    factIds.add(retcon.factId);
    retcons.push({
      factId: retcon.factId,
      previousStatement: retcon.previousStatement,
      statement: retcon.statement
    });
  }
  return {
    baseProjectRevision: value.baseProjectRevision,
    committedProjectRevision: value.committedProjectRevision,
    condensedThroughTurn: condensedThroughTurn as number,
    ...(sourceSpan ? { sourceSpan } : {}),
    chapter,
    retcons
  };
}

function parseItem(value: unknown): GenerationInboxItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id || typeof value.projectId !== 'string' || !value.projectId) return null;
  if (typeof value.projectTitle !== 'string' || typeof value.baseRevision !== 'string') return null;
  if (typeof value.episode !== 'number' || !Number.isFinite(value.episode)) return null;
  if (typeof value.status !== 'string' || !STATUSES.has(value.status as GenerationStatus)) return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  const result = parseResult(value.result);
  // root span은 성공 recovery 원문이 quota 압축될 때도 남는 소비 경계다.
  const sourceSpan = parseCondenseSourceSpan(value.sourceSpan);
  const sourceFingerprint = typeof value.sourceFingerprint === 'string' && value.sourceFingerprint
    ? value.sourceFingerprint
    : undefined;
  // root 목표는 recovery가 quota 압축돼도 실행 시도·재시도의 정본으로 남는다.
  const episodeLength = parseEpisodeLengthContract(value.episodeLength);
  // root가 손상·삭제돼도 result/recovery에 남은 P2-d 길이 메타는 현대 영수증의 증거다.
  // nested 목표를 root 정본으로 승격하지 않고 marker만 복원해 승인·재시도를 fail-closed한다.
  const rawResult = isRecord(value.result) ? value.result : undefined;
  const rawRecovery = isRecord(value.recovery) ? value.recovery : undefined;
  const hasNestedEpisodeLengthEvidence = Boolean(
    rawResult && (
      'episodeLength' in rawResult ||
      'actualChars' in rawResult ||
      'lengthStatus' in rawResult
    ) ||
    rawRecovery && 'episodeLength' in rawRecovery
  );
  // marker 도입 전의 유효한 P2-d root도 한 번 읽은 뒤 schema를 획득한다.
  const episodeLengthSchema = value.episodeLengthSchema !== undefined ||
    value.episodeLength !== undefined ||
    hasNestedEpisodeLengthEvidence
    ? EPISODE_LENGTH_RECEIPT_SCHEMA
    : undefined;
  const parsedRecovery = parseRecovery(value.recovery);
  const recovery = parsedRecovery?.projectId === value.projectId && parsedRecovery.episode === value.episode
    ? parsedRecovery
    : undefined;
  const recoveryDraftOpenedAt = recovery && typeof value.recoveryDraftOpenedAt === 'string' && value.recoveryDraftOpenedAt
    ? value.recoveryDraftOpenedAt
    : undefined;
  const recoveryDraftId = recovery && typeof value.recoveryDraftId === 'string' && value.recoveryDraftId
    ? value.recoveryDraftId
    : undefined;
  const recoveredAt = recovery && typeof value.recoveredAt === 'string' && value.recoveredAt
    ? value.recoveredAt
    : undefined;
  const recoveredChapterId = recovery && typeof value.recoveredChapterId === 'string' && value.recoveredChapterId
    ? value.recoveredChapterId
    : undefined;
  const lostSucceededResult = value.status === 'succeeded' && !result;
  const approvedCondenseCheckpoint = value.status === 'succeeded' && result
    ? parseApprovedCondenseCheckpoint(value.approvedCondenseCheckpoint, value.episode)
    : undefined;
  return {
    id: value.id,
    kind: 'dive-condense',
    projectId: value.projectId,
    projectTitle: value.projectTitle,
    baseRevision: value.baseRevision,
    episode: value.episode,
    status: lostSucceededResult ? 'failed' : value.status as GenerationStatus,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    result,
    ...(sourceSpan ? { sourceSpan } : {}),
    ...(sourceFingerprint ? { sourceFingerprint } : {}),
    ...(episodeLengthSchema ? { episodeLengthSchema } : {}),
    ...(episodeLength ? { episodeLength } : {}),
    recovery,
    recoveryDraftOpenedAt: recoveryDraftOpenedAt && recoveryDraftId ? recoveryDraftOpenedAt : undefined,
    recoveryDraftId: recoveryDraftOpenedAt && recoveryDraftId ? recoveryDraftId : undefined,
    recoveredAt: recoveredAt && recoveredChapterId ? recoveredAt : undefined,
    recoveredChapterId: recoveredAt && recoveredChapterId ? recoveredChapterId : undefined,
    ...(approvedCondenseCheckpoint ? { approvedCondenseCheckpoint } : {}),
    warning: lostSucceededResult
      ? '완료 결과를 복구하지 못했습니다.'
      : typeof value.warning === 'string' ? value.warning : undefined
  };
}

export function parseGenerationInbox(raw: string | null): GenerationInboxItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return retainGenerationInboxItems(
      parsed.map(parseItem).filter((item): item is GenerationInboxItem => item !== null)
    );
  } catch {
    return [];
  }
}

export function serializeGenerationInbox(items: GenerationInboxItem[]): string {
  return JSON.stringify(retainGenerationInboxItems(items));
}

export function loadGenerationInbox(): GenerationInboxItem[] {
  if (typeof window === 'undefined') return [];
  return parseGenerationInbox(window.localStorage.getItem(STORAGE_KEY));
}

export function saveGenerationInbox(
  items: GenerationInboxItem[],
  storage?: GenerationInboxStorage
): GenerationInboxSaveResult {
  const target = storage ?? (typeof window === 'undefined' ? null : window.localStorage);
  if (!target) return { ok: true, compacted: false, items };
  try {
    target.setItem(STORAGE_KEY, serializeGenerationInbox(items));
    return { ok: true, compacted: false, items };
  } catch {
    // 성공 결과는 P0-a 보관 계약상 자동 폐기할 수 없다. 성공 영수증에 붙어 있지만 복구 UI에는
    // 사용되지 않는 중복 PLAY snapshot만 제거해 안전하게 한 번 더 저장한다.
    let changed = false;
    const compactedItems = items.map((item) => {
      if (item.status !== 'succeeded' || !item.recovery) return item;
      changed = true;
      const {
        recovery: _recovery,
        recoveryDraftOpenedAt: _recoveryDraftOpenedAt,
        recoveryDraftId: _recoveryDraftId,
        recoveredAt: _recoveredAt,
        recoveredChapterId: _recoveredChapterId,
        ...kept
      } = item;
      return kept;
    });
    if (!changed) {
      return { ok: false, compacted: false, items };
    }
    try {
      target.setItem(STORAGE_KEY, serializeGenerationInbox(compactedItems));
      return { ok: true, compacted: true, items: compactedItems };
    } catch {
      return { ok: false, compacted: false, items };
    }
  }
}

type GenerationInboxSaver = (items: GenerationInboxItem[]) => GenerationInboxSaveResult;

export function persistGenerationInboxState(
  items: GenerationInboxItem[],
  save: GenerationInboxSaver = saveGenerationInbox
): GenerationInboxItem[] {
  const previouslyFailedIds = new Set(
    items.filter((item) => item.localPersistenceFailed).map((item) => item.id)
  );
  const clean = items.map(({ localPersistenceFailed: _localPersistenceFailed, ...item }) => item);
  const persisted = save(clean);
  if (persisted.ok) return persisted.items;
  return clean.map((item, index) => (
    index === 0 || previouslyFailedIds.has(item.id)
  )
      ? { ...item, localPersistenceFailed: true }
      : item);
}

export function appendGenerationInboxItem(items: GenerationInboxItem[], item: GenerationInboxItem): GenerationInboxItem[] {
  return retainGenerationInboxItems([item, ...items.filter((candidate) => candidate.id !== item.id)]);
}

/**
 * 성공 영수증 하나에 승인 재개 체크포인트를 불변 upsert한다.
 * 존재하지 않거나 성공 결과·회차 연결이 유효하지 않은 영수증은 건드리지 않는다.
 */
export function upsertApprovedCondenseCheckpoint(
  items: GenerationInboxItem[],
  generationId: string,
  checkpoint: ApprovedCondenseCheckpoint
): GenerationInboxItem[] {
  const parsed = parseApprovedCondenseCheckpoint(checkpoint);
  if (!parsed) return items;
  const targetIndex = items.findIndex((item) => item.id === generationId);
  if (targetIndex < 0) return items;
  const target = items[targetIndex];
  if (target.status !== 'succeeded' || !parseResult(target.result) || target.episode !== parsed.chapter.episode) {
    return items;
  }
  if (JSON.stringify(target.approvedCondenseCheckpoint) === JSON.stringify(parsed)) return items;
  // checkpoint는 write-ahead 사용자 결정이다. 다른 탭이 먼저 남긴 결정은 후발 stale 탭이 덮지 않는다.
  if (target.approvedCondenseCheckpoint) return items;
  return items.map((item, index) => (
    index === targetIndex ? { ...item, approvedCondenseCheckpoint: parsed } : item
  ));
}

/**
 * 배열 위치는 작업본 연결 같은 UI 갱신으로 바뀔 수 있으므로 생성 시도 순서는 createdAt으로 판정한다.
 */
export function findLatestGenerationAttempt(
  items: GenerationInboxItem[],
  projectId: string,
  episode: number
): GenerationInboxItem | null {
  let latest: GenerationInboxItem | null = null;
  for (const item of items) {
    if (item.projectId !== projectId || item.episode !== episode) continue;
    if (!latest || item.createdAt > latest.createdAt) latest = item;
  }
  return latest;
}

export function mergeGenerationJob(item: GenerationInboxItem, job: GenerationJobSnapshot): GenerationInboxItem {
  // poll/cancel 요청을 보낼 때 running이었어도 mutation 시점의 receipt가 이미 terminal이면
  // 느린 응답으로 상태를 역행시키거나 성공 checkpoint를 떨어뜨리지 않는다.
  if (item.status === 'succeeded' && item.result) return item;
  const { episodeLength: rawJobEpisodeLength, ...jobWithoutEpisodeLength } = job;
  const episodeLength = item.episodeLength ?? parseEpisodeLengthContract(rawJobEpisodeLength);
  const episodeLengthSchema = item.episodeLengthSchema ?? (
    rawJobEpisodeLength !== undefined ? EPISODE_LENGTH_RECEIPT_SCHEMA : undefined
  );
  // provider 성공은 실패·취소·시간 초과·404보다 정보량이 많은 최상위 상태다.
  // 종료 상태가 먼저 도착했어도 유효한 늦은 성공 결과를 버리지 않는다.
  if (job.status === 'succeeded' && job.result) {
    return {
      ...item,
      ...jobWithoutEpisodeLength,
      kind: 'dive-condense',
      projectTitle: item.projectTitle,
      ...(episodeLengthSchema ? { episodeLengthSchema } : {}),
      ...(episodeLength ? { episodeLength } : {})
    };
  }
  if (item.status !== 'running') return item;
  return {
    ...item,
    ...jobWithoutEpisodeLength,
    kind: 'dive-condense',
    projectTitle: item.projectTitle,
    ...(episodeLengthSchema ? { episodeLengthSchema } : {}),
    ...(episodeLength ? { episodeLength } : {})
  };
}

export function expireGenerationJob(
  item: GenerationInboxItem,
  warning: string,
  updatedAt: string
): GenerationInboxItem {
  // 404도 poll 요청 당시가 아니라 mutation 직전의 최신 receipt를 기준으로 적용한다.
  // 그 사이 승인 checkpoint나 성공 결과가 생겼다면 terminal 상태를 그대로 보존한다.
  if (item.status !== 'running') return item;
  return { ...item, status: 'expired', warning, updatedAt };
}

export function isActiveGeneration(item: GenerationInboxItem): boolean {
  return item.status === 'running';
}

export function canRecoverGeneration(item: GenerationInboxItem): boolean {
  return Boolean(item.recovery) && (
    item.status === 'failed' ||
    item.status === 'cancelled' ||
    item.status === 'timed-out' ||
    item.status === 'expired'
  );
}

/**
 * 작업본을 비활성화해도 전역 보관함에서 다시 찾을 수 있는지 판정한다.
 * localPersistenceFailed는 setItem 실패 뒤 메모리에만 남은 영수증이므로 영속 연결로 보지 않는다.
 */
export function hasDurableRecoveryDraftReceipt(
  items: GenerationInboxItem[],
  generationId: string | undefined,
  draftId: string
): boolean {
  if (!generationId || !draftId) return false;
  const receipt = items.find((item) => item.id === generationId);
  return Boolean(
    receipt &&
    !receipt.localPersistenceFailed &&
    receipt.recovery &&
    receipt.recoveryDraftOpenedAt &&
    receipt.recoveryDraftId === draftId
  );
}

function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function buildProjectRevision(project: SeriesProject): string {
  return `rev-${hashText(JSON.stringify({
    id: project.id,
    currentEpisode: project.currentEpisode,
    chapters: project.chapters.map((chapter) => [chapter.id, chapter.episode, chapter.title, chapter.prose.length]),
    canon: project.canonFacts.map((fact) => [fact.id, fact.statement])
  }))}`;
}
