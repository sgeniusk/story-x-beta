import type { DiveCondensePayload } from './diveClient';
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
}

const STORAGE_KEY = 'serial-story-studio/generation-inbox';
export const MAX_GENERATION_INBOX_ITEMS = 20;
const STATUSES = new Set<GenerationStatus>(['running', 'succeeded', 'failed', 'cancelled', 'timed-out', 'expired']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseResult(value: unknown): DiveCondensePayload | undefined {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.prose !== 'string') return undefined;
  return value as unknown as DiveCondensePayload;
}

function parseItem(value: unknown): GenerationInboxItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id || typeof value.projectId !== 'string' || !value.projectId) return null;
  if (typeof value.projectTitle !== 'string' || typeof value.baseRevision !== 'string') return null;
  if (typeof value.episode !== 'number' || !Number.isFinite(value.episode)) return null;
  if (typeof value.status !== 'string' || !STATUSES.has(value.status as GenerationStatus)) return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  const result = parseResult(value.result);
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

export function saveGenerationInbox(items: GenerationInboxItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, serializeGenerationInbox(items));
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
