// PLAN 설계실 staged 패치 — 바이블 필드 수정을 본편에 적용하지 않고 모아두는 순수 모듈. spec 2026-07-04.
import type { CreativeWeight } from './storyEngine';

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
