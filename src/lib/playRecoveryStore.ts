import type { PlayRecoverySnapshot, PlayRecoveryWorkDraft } from './playRecovery';
import { parseCondenseSourceSpan } from './diveSession';
import { parseEpisodeLengthContract } from './storyEngine';

export const PLAY_RECOVERY_WORK_DRAFT_STORAGE_KEY = 'serial-story-studio/play-recovery-work-drafts';
export const MAX_PLAY_RECOVERY_WORK_DRAFTS_PER_PROJECT = 20;

const STORE_SCHEMA = 'storyx/play-recovery-work-draft-store/v1' as const;

export interface PlayRecoveryWorkDraftProjectStore {
  drafts: PlayRecoveryWorkDraft[];
  activeDraftId?: string;
}

export interface PlayRecoveryWorkDraftStore {
  schema: typeof STORE_SCHEMA;
  projects: Record<string, PlayRecoveryWorkDraftProjectStore>;
}

export interface PlayRecoveryWorkDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function emptyStore(): PlayRecoveryWorkDraftStore {
  return { schema: STORE_SCHEMA, projects: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function parseSnapshot(value: unknown): PlayRecoverySnapshot | null {
  if (!isRecord(value) || value.schema !== 'storyx/play-recovery/v1') return null;
  if (typeof value.projectId !== 'string' || !value.projectId) return null;
  if (typeof value.projectTitle !== 'string' || !isPositiveInteger(value.episode)) return null;
  if (typeof value.scene !== 'string' || typeof value.transcript !== 'string') return null;
  if (typeof value.capturedAt !== 'string' || !value.capturedAt) return null;
  if (value.condensedThroughTurn !== undefined && (
    typeof value.condensedThroughTurn !== 'number' ||
    !Number.isInteger(value.condensedThroughTurn) ||
    value.condensedThroughTurn < 0
  )) return null;
  // sourceSpan은 하위호환 optional 메타데이터다. 손상되어도 사용자 원문을 함께 버리지 않는다.
  const sourceSpan = parseCondenseSourceSpan(value.sourceSpan);
  const sourceFingerprint = typeof value.sourceFingerprint === 'string' && value.sourceFingerprint
    ? value.sourceFingerprint
    : undefined;
  // 회차 분량도 하위호환 optional이다. 손상 필드만 버리고 작업본·원문은 보존한다.
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

function parseDraft(value: unknown): PlayRecoveryWorkDraft | null {
  if (!isRecord(value) || value.schema !== 'storyx/play-recovery-work-draft/v1') return null;
  if (typeof value.id !== 'string' || !value.id) return null;
  if (typeof value.projectId !== 'string' || !value.projectId) return null;
  if (value.generationId !== undefined && (typeof value.generationId !== 'string' || !value.generationId)) return null;
  if (!isPositiveInteger(value.episodeHint)) return null;
  if (typeof value.title !== 'string' || typeof value.body !== 'string') return null;
  if (typeof value.createdAt !== 'string' || !value.createdAt) return null;
  if (typeof value.updatedAt !== 'string' || !value.updatedAt) return null;

  const source = parseSnapshot(value.source);
  if (!source || source.projectId !== value.projectId || source.episode !== value.episodeHint) return null;
  let commitIntent: PlayRecoveryWorkDraft['commitIntent'];
  if (value.commitIntent !== undefined) {
    if (
      !isRecord(value.commitIntent) ||
      typeof value.commitIntent.chapterId !== 'string' || !value.commitIntent.chapterId ||
      typeof value.commitIntent.chapterTitle !== 'string' || !value.commitIntent.chapterTitle ||
      typeof value.commitIntent.requestedAt !== 'string' || !value.commitIntent.requestedAt
    ) return null;
    commitIntent = {
      chapterId: value.commitIntent.chapterId,
      chapterTitle: value.commitIntent.chapterTitle,
      requestedAt: value.commitIntent.requestedAt
    };
  }
  let legacyRepair: PlayRecoveryWorkDraft['legacyRepair'];
  if (value.legacyRepair !== undefined) {
    if (
      !isRecord(value.legacyRepair) ||
      typeof value.legacyRepair.chapterId !== 'string' || !value.legacyRepair.chapterId ||
      typeof value.legacyRepair.startedAt !== 'string' || !value.legacyRepair.startedAt
    ) return null;
    legacyRepair = {
      chapterId: value.legacyRepair.chapterId,
      startedAt: value.legacyRepair.startedAt
    };
  }

  return {
    schema: 'storyx/play-recovery-work-draft/v1',
    id: value.id,
    projectId: value.projectId,
    ...(typeof value.generationId === 'string' ? { generationId: value.generationId } : {}),
    episodeHint: value.episodeHint,
    title: value.title,
    body: value.body,
    source,
    ...(commitIntent ? { commitIntent } : {}),
    ...(legacyRepair ? { legacyRepair } : {}),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function needsRecoveryRetention(
  draft: PlayRecoveryWorkDraft,
  activeDraftId?: string
): boolean {
  return draft.id === activeDraftId ||
    Boolean(draft.commitIntent) ||
    Boolean(draft.legacyRepair) ||
    draft.title.trim().length > 0 ||
    draft.body.trim().length > 0;
}

/**
 * 사용자 원고나 재시도 journal은 cache가 아니다. cap 초과분은 오래된 빈 비활성
 * 작업본에서만 정리하고, 그런 항목이 부족하면 원고를 버리는 대신 cap을 초과한다.
 */
function retainRecoveryDrafts(
  drafts: PlayRecoveryWorkDraft[],
  activeDraftId?: string
): PlayRecoveryWorkDraft[] {
  let remainingOverflow = Math.max(0, drafts.length - MAX_PLAY_RECOVERY_WORK_DRAFTS_PER_PROJECT);
  if (remainingOverflow === 0) return drafts;

  return drafts.filter((draft) => {
    if (remainingOverflow === 0 || needsRecoveryRetention(draft, activeDraftId)) return true;
    remainingOverflow -= 1;
    return false;
  });
}

function parseProjectStore(projectId: string, value: unknown): PlayRecoveryWorkDraftProjectStore | null {
  if (!isRecord(value) || !Array.isArray(value.drafts)) return null;

  const seenIds = new Set<string>();
  const parsedDrafts = value.drafts
    .map(parseDraft)
    .filter((draft): draft is PlayRecoveryWorkDraft => {
      if (!draft || draft.projectId !== projectId || seenIds.has(draft.id)) return false;
      seenIds.add(draft.id);
      return true;
    });
  const requestedActiveDraftId = typeof value.activeDraftId === 'string' &&
    parsedDrafts.some((draft) => draft.id === value.activeDraftId)
    ? value.activeDraftId
    : undefined;
  const drafts = retainRecoveryDrafts(parsedDrafts, requestedActiveDraftId);
  if (drafts.length === 0) return null;

  const activeDraftId = requestedActiveDraftId && drafts.some((draft) => draft.id === requestedActiveDraftId)
    ? requestedActiveDraftId
    : undefined;
  return { drafts, ...(activeDraftId ? { activeDraftId } : {}) };
}

export function parsePlayRecoveryWorkDraftStore(raw: string | null): PlayRecoveryWorkDraftStore {
  if (!raw) return emptyStore();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schema !== STORE_SCHEMA || !isRecord(parsed.projects)) {
      return emptyStore();
    }

    const projects: Record<string, PlayRecoveryWorkDraftProjectStore> = {};
    for (const [projectId, value] of Object.entries(parsed.projects)) {
      if (!projectId || projectId === '__proto__' || projectId === 'constructor' || projectId === 'prototype') continue;
      const project = parseProjectStore(projectId, value);
      if (project) projects[projectId] = project;
    }
    return { schema: STORE_SCHEMA, projects };
  } catch {
    return emptyStore();
  }
}

export function serializePlayRecoveryWorkDraftStore(store: PlayRecoveryWorkDraftStore): string {
  return JSON.stringify(store);
}

function resolveStorage(storage?: PlayRecoveryWorkDraftStorage): PlayRecoveryWorkDraftStorage | null {
  if (storage) return storage;
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function loadPlayRecoveryWorkDraftStore(
  storage?: PlayRecoveryWorkDraftStorage
): PlayRecoveryWorkDraftStore {
  const target = resolveStorage(storage);
  if (!target) return emptyStore();
  try {
    return parsePlayRecoveryWorkDraftStore(target.getItem(PLAY_RECOVERY_WORK_DRAFT_STORAGE_KEY));
  } catch {
    return emptyStore();
  }
}

function persistPlayRecoveryWorkDraftStore(
  store: PlayRecoveryWorkDraftStore,
  storage?: PlayRecoveryWorkDraftStorage
): boolean {
  const target = resolveStorage(storage);
  if (!target) return true;
  try {
    target.setItem(PLAY_RECOVERY_WORK_DRAFT_STORAGE_KEY, serializePlayRecoveryWorkDraftStore(store));
    return true;
  } catch {
    return false;
  }
}

export function listPlayRecoveryWorkDrafts(
  projectId: string,
  storage?: PlayRecoveryWorkDraftStorage
): PlayRecoveryWorkDraft[] {
  return loadPlayRecoveryWorkDraftStore(storage).projects[projectId]?.drafts ?? [];
}

export function getActivePlayRecoveryWorkDraft(
  projectId: string,
  storage?: PlayRecoveryWorkDraftStorage
): PlayRecoveryWorkDraft | null {
  const project = loadPlayRecoveryWorkDraftStore(storage).projects[projectId];
  if (!project?.activeDraftId) return null;
  return project.drafts.find((draft) => draft.id === project.activeDraftId) ?? null;
}

export function savePlayRecoveryWorkDraft(
  draft: PlayRecoveryWorkDraft,
  activate = true,
  storage?: PlayRecoveryWorkDraftStorage
): boolean {
  const normalized = parseDraft(draft);
  if (!normalized) return false;

  const store = loadPlayRecoveryWorkDraftStore(storage);
  const current = store.projects[normalized.projectId] ?? { drafts: [] };
  const index = current.drafts.findIndex((candidate) => candidate.id === normalized.id);
  const drafts = [...current.drafts];
  if (index >= 0) {
    const existing = drafts[index];
    // commitIntent는 회차 저장 write-ahead journal이다. 다른 탭이 오래된
    // no-intent draft를 저장해도 journal·제목·본문을 강등하지 않는다.
    if (existing.commitIntent) {
      drafts[index] = existing.generationId || !normalized.generationId
        ? existing
        : { ...existing, generationId: normalized.generationId };
    } else {
      drafts[index] = existing.legacyRepair && !normalized.legacyRepair
        ? { ...normalized, legacyRepair: existing.legacyRepair }
        : normalized;
    }
  } else drafts.push(normalized);
  const requestedActiveDraftId = activate
    ? normalized.id
    : current.activeDraftId && drafts.some((candidate) => candidate.id === current.activeDraftId)
      ? current.activeDraftId
      : undefined;
  const retainedDrafts = retainRecoveryDrafts(drafts, requestedActiveDraftId);
  const activeDraftId = requestedActiveDraftId &&
    retainedDrafts.some((candidate) => candidate.id === requestedActiveDraftId)
    ? requestedActiveDraftId
    : undefined;

  store.projects[normalized.projectId] = {
    drafts: retainedDrafts,
    ...(activeDraftId ? { activeDraftId } : {})
  };
  return persistPlayRecoveryWorkDraftStore(store, storage);
}

export function activatePlayRecoveryWorkDraft(
  projectId: string,
  draftId: string,
  storage?: PlayRecoveryWorkDraftStorage
): boolean {
  const store = loadPlayRecoveryWorkDraftStore(storage);
  const project = store.projects[projectId];
  if (!project || !project.drafts.some((draft) => draft.id === draftId)) return false;
  store.projects[projectId] = { ...project, activeDraftId: draftId };
  return persistPlayRecoveryWorkDraftStore(store, storage);
}

export function deactivatePlayRecoveryWorkDraft(
  projectId: string,
  storage?: PlayRecoveryWorkDraftStorage
): boolean {
  const store = loadPlayRecoveryWorkDraftStore(storage);
  const project = store.projects[projectId];
  if (!project?.activeDraftId) return true;
  store.projects[projectId] = { drafts: project.drafts };
  return persistPlayRecoveryWorkDraftStore(store, storage);
}

export function removePlayRecoveryWorkDraft(
  projectId: string,
  draftId: string,
  storage?: PlayRecoveryWorkDraftStorage
): boolean {
  const store = loadPlayRecoveryWorkDraftStore(storage);
  const project = store.projects[projectId];
  if (!project || !project.drafts.some((draft) => draft.id === draftId)) return false;

  const drafts = project.drafts.filter((draft) => draft.id !== draftId);
  if (drafts.length === 0) delete store.projects[projectId];
  else {
    const activeDraftId = project.activeDraftId === draftId ? undefined : project.activeDraftId;
    store.projects[projectId] = { drafts, ...(activeDraftId ? { activeDraftId } : {}) };
  }
  return persistPlayRecoveryWorkDraftStore(store, storage);
}

export function clearPlayRecoveryWorkDraftProject(
  projectId: string,
  storage?: PlayRecoveryWorkDraftStorage
): boolean {
  const store = loadPlayRecoveryWorkDraftStore(storage);
  if (!store.projects[projectId]) return true;
  delete store.projects[projectId];
  return persistPlayRecoveryWorkDraftStore(store, storage);
}
