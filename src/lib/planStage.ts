// PLAN 설계실 staged 패치 — 바이블 필드 수정을 본편에 적용하지 않고 모아두는 순수 모듈. spec 2026-07-04.
import type { CreativeWeight, SeriesProject } from './storyEngine';

export type PlanPatch =
  | { kind: 'character'; id: string; field: 'desire' | 'wound' | 'currentState'; label: string; before: string; after: string }
  | { kind: 'world'; id: string; label: string; before: string; after: string }
  | { kind: 'canon'; id: string; label: string; before: string; after: string }
  | { kind: 'story-core'; field: 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone'; label: string; before: string; after: string }
  | { kind: 'creative-weight'; label: string; before: CreativeWeight; after: CreativeWeight };

export function patchKey(patch: PlanPatch): string {
  switch (patch.kind) {
    case 'character':
      return `character:${patch.id}:${patch.field}`;
    case 'world':
      return `world:${patch.id}`;
    case 'canon':
      return `canon:${patch.id}`;
    case 'story-core':
      return `story-core:${patch.field}`;
    case 'creative-weight':
      return 'creative-weight';
  }
}

export function upsertPlanPatch(patches: PlanPatch[], next: PlanPatch): PlanPatch[] {
  const key = patchKey(next);
  const existing = patches.find((patch) => patchKey(patch) === key);
  const before = existing ? existing.before : next.before;
  if (next.after === before) {
    return patches.filter((patch) => patchKey(patch) !== key);
  }
  const merged = { ...next, before } as PlanPatch;
  if (existing) {
    return patches.map((patch) => (patchKey(patch) === key ? merged : patch));
  }
  return [...patches, merged];
}

function readCommittedValue(project: SeriesProject, patch: PlanPatch): string | null {
  switch (patch.kind) {
    case 'character': {
      const target = project.characters.find((item) => item.id === patch.id);
      return target ? target[patch.field] : null;
    }
    case 'world': {
      const target = project.worldRules.find((item) => item.id === patch.id);
      return target ? target.rule : null;
    }
    case 'canon': {
      const target = project.canonFacts.find((item) => item.id === patch.id);
      return target ? target.statement : null;
    }
    case 'story-core':
      return project[patch.field];
    case 'creative-weight':
      return project.creativeWeight;
  }
}

function applyOne(project: SeriesProject, patch: PlanPatch): SeriesProject {
  switch (patch.kind) {
    case 'character':
      if (!project.characters.some((item) => item.id === patch.id)) return project;
      return {
        ...project,
        characters: project.characters.map((item) =>
          item.id === patch.id ? { ...item, [patch.field]: patch.after } : item
        )
      };
    case 'world':
      if (!project.worldRules.some((item) => item.id === patch.id)) return project;
      return {
        ...project,
        worldRules: project.worldRules.map((item) => (item.id === patch.id ? { ...item, rule: patch.after } : item))
      };
    case 'canon':
      if (!project.canonFacts.some((item) => item.id === patch.id)) return project;
      return {
        ...project,
        canonFacts: project.canonFacts.map((item) =>
          item.id === patch.id ? { ...item, statement: patch.after } : item
        )
      };
    case 'story-core':
      return { ...project, [patch.field]: patch.after };
    case 'creative-weight':
      return { ...project, creativeWeight: patch.after };
  }
}

export function applyPlanPatches(project: SeriesProject, patches: PlanPatch[]): SeriesProject {
  return patches.reduce(applyOne, project);
}

export interface PlanConflict {
  key: string;
  label: string;
  committedValue: string;
  after: string;
}

export function derivePlanConflicts(patches: PlanPatch[], committed: SeriesProject): PlanConflict[] {
  const conflicts: PlanConflict[] = [];
  for (const patch of patches) {
    const current = readCommittedValue(committed, patch);
    if (current === null) continue;
    if (current !== patch.before) {
      conflicts.push({ key: patchKey(patch), label: patch.label, committedValue: current, after: String(patch.after) });
    }
  }
  return conflicts;
}

export function resolvePlanApply(
  committed: SeriesProject,
  patches: PlanPatch[],
  conflicts: PlanConflict[],
  decisions: Record<string, 'keep' | 'apply'>
): SeriesProject {
  const conflictKeys = new Set(conflicts.map((conflict) => conflict.key));
  const applicable = patches.filter((patch) => {
    const key = patchKey(patch);
    if (!conflictKeys.has(key)) return true;
    return decisions[key] === 'apply';
  });
  return applyPlanPatches(committed, applicable);
}
