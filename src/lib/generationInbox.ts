import type { DiveCondensePayload } from './diveClient';
import type { PlayRecoverySnapshot } from './playRecovery';
import type { SeriesProject } from './storyEngine';

export type GenerationStatus = 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out' | 'expired';

export interface GenerationJobSnapshot {
  id: string;
  projectId: string;
  baseRevision: string;
  episode: number;
  status: Exclude<GenerationStatus, 'expired'>;
  createdAt: string;
  updatedAt: string;
  result?: DiveCondensePayload;
  warning?: string;
}

export interface GenerationInboxItem extends Omit<GenerationJobSnapshot, 'status'> {
  kind: 'dive-condense';
  projectTitle: string;
  status: GenerationStatus;
  recovery?: PlayRecoverySnapshot;
  recoveredAt?: string;
  recoveredChapterId?: string;
  localPersistenceFailed?: boolean;
}

const STORAGE_KEY = 'serial-story-studio/generation-inbox';
export const MAX_GENERATION_INBOX_ITEMS = 20;
const STATUSES = new Set<GenerationStatus>(['running', 'succeeded', 'failed', 'cancelled', 'timed-out', 'expired']);

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
  return value as unknown as DiveCondensePayload;
}

function parseRecovery(value: unknown): PlayRecoverySnapshot | undefined {
  if (!isRecord(value) || value.schema !== 'storyx/play-recovery/v1') return undefined;
  if (typeof value.projectId !== 'string' || !value.projectId || typeof value.projectTitle !== 'string') return undefined;
  if (typeof value.episode !== 'number' || !Number.isFinite(value.episode)) return undefined;
  if (typeof value.scene !== 'string' || typeof value.transcript !== 'string' || typeof value.capturedAt !== 'string') return undefined;
  return {
    schema: 'storyx/play-recovery/v1',
    projectId: value.projectId,
    projectTitle: value.projectTitle,
    episode: value.episode,
    scene: value.scene,
    transcript: value.transcript,
    capturedAt: value.capturedAt
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
  const parsedRecovery = parseRecovery(value.recovery);
  const recovery = parsedRecovery?.projectId === value.projectId && parsedRecovery.episode === value.episode
    ? parsedRecovery
    : undefined;
  const lostSucceededResult = value.status === 'succeeded' && !result;
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
    recovery,
    recoveredAt: recovery && typeof value.recoveredAt === 'string' ? value.recoveredAt : undefined,
    recoveredChapterId: recovery && typeof value.recoveredChapterId === 'string' ? value.recoveredChapterId : undefined,
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
    return parsed.map(parseItem).filter((item): item is GenerationInboxItem => item !== null).slice(0, MAX_GENERATION_INBOX_ITEMS);
  } catch {
    return [];
  }
}

export function serializeGenerationInbox(items: GenerationInboxItem[]): string {
  return JSON.stringify(items.slice(0, MAX_GENERATION_INBOX_ITEMS));
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
      const { recovery: _recovery, recoveredAt: _recoveredAt, recoveredChapterId: _recoveredChapterId, ...kept } = item;
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
  return [item, ...items.filter((candidate) => candidate.id !== item.id)].slice(0, MAX_GENERATION_INBOX_ITEMS);
}

export function mergeGenerationJob(item: GenerationInboxItem, job: GenerationJobSnapshot): GenerationInboxItem {
  return { ...item, ...job, kind: 'dive-condense', projectTitle: item.projectTitle };
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
