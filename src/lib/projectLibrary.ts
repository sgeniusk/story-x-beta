import type { SeriesProject } from './storyEngine';

export type ProjectLifecycle = 'temporary' | 'confirmed';

export interface ProjectLibraryEntry {
  projectId: string;
  lifecycle: ProjectLifecycle;
  createdAt: string;
  updatedAt: string;
  project: SeriesProject;
}

interface UpsertProjectOptions {
  lifecycle?: ProjectLifecycle;
  now?: Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortLatest(entries: ProjectLibraryEntry[]): ProjectLibraryEntry[] {
  return [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function parseEntry(value: unknown): ProjectLibraryEntry | null {
  if (!isRecord(value) || !isRecord(value.project)) return null;
  if (typeof value.projectId !== 'string' || !value.projectId) return null;
  if (value.lifecycle !== 'temporary' && value.lifecycle !== 'confirmed') return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  if (value.project.id !== value.projectId || typeof value.project.title !== 'string') return null;
  return value as unknown as ProjectLibraryEntry;
}

export function parseProjectLibrary(raw: string | null): ProjectLibraryEntry[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return sortLatest(value.map(parseEntry).filter((entry): entry is ProjectLibraryEntry => entry !== null));
  } catch {
    return [];
  }
}

export function migrateLegacyProject(project: SeriesProject, now: Date = new Date()): ProjectLibraryEntry {
  const timestamp = now.toISOString();
  return {
    projectId: project.id,
    lifecycle: 'confirmed',
    createdAt: timestamp,
    updatedAt: timestamp,
    project
  };
}

export function upsertProjectEntry(
  entries: ProjectLibraryEntry[],
  project: SeriesProject,
  options: UpsertProjectOptions = {}
): ProjectLibraryEntry[] {
  const existing = entries.find((entry) => entry.projectId === project.id);
  const timestamp = (options.now ?? new Date()).toISOString();
  const next: ProjectLibraryEntry = {
    projectId: project.id,
    lifecycle: existing?.lifecycle ?? options.lifecycle ?? 'temporary',
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    project
  };
  return sortLatest([next, ...entries.filter((entry) => entry.projectId !== project.id)]);
}

export function confirmProjectEntry(
  entries: ProjectLibraryEntry[],
  projectId: string,
  now: Date = new Date()
): ProjectLibraryEntry[] {
  return sortLatest(entries.map((entry) => entry.projectId === projectId
    ? { ...entry, lifecycle: 'confirmed' as const, updatedAt: now.toISOString() }
    : entry));
}
