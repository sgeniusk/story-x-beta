// PLAN 설계실 staged 패치 순수 로직 — upsert 교체·원복 소멸·overlay 적용·충돌 감지. spec 2026-07-04.
import { describe, expect, it } from 'vitest';
import { patchKey, upsertPlanPatch, type PlanPatch } from './planStage';

const canonPatch = (after: string, before = '서준은 살아 있다'): PlanPatch => ({
  kind: 'canon', id: 'c1', label: '캐논 1화', before, after
});

describe('patchKey', () => {
  it('kind·id·field 로 고유 key 를 만든다', () => {
    expect(patchKey(canonPatch('x'))).toBe('canon:c1');
    expect(patchKey({ kind: 'character', id: 'ch1', field: 'wound', label: '', before: '', after: 'x' })).toBe('character:ch1:wound');
    expect(patchKey({ kind: 'story-core', field: 'tone', label: '', before: '', after: 'x' })).toBe('story-core:tone');
    expect(patchKey({ kind: 'creative-weight', label: '', before: 'balanced', after: 'literary' })).toBe('creative-weight');
  });
});

describe('upsertPlanPatch', () => {
  it('새 패치를 추가한다', () => {
    const next = upsertPlanPatch([], canonPatch('서준은 절반쯤 들켰다'));
    expect(next).toHaveLength(1);
    expect(next[0].after).toBe('서준은 절반쯤 들켰다');
  });

  it('같은 key 를 다시 고치면 교체하되 최초 before 를 유지한다', () => {
    const first = upsertPlanPatch([], canonPatch('수정1'));
    const second = upsertPlanPatch(first, canonPatch('수정2', '수정1'));
    expect(second).toHaveLength(1);
    expect(second[0].after).toBe('수정2');
    expect(second[0].before).toBe('서준은 살아 있다');
  });

  it('원래 값으로 되돌리면 패치가 소멸한다', () => {
    const first = upsertPlanPatch([], canonPatch('수정1'));
    const reverted = upsertPlanPatch(first, canonPatch('서준은 살아 있다', '수정1'));
    expect(reverted).toHaveLength(0);
  });

  it('다른 key 패치는 건드리지 않는다', () => {
    const base = upsertPlanPatch([], canonPatch('수정1'));
    const next = upsertPlanPatch(base, { kind: 'world', id: 'w1', label: '규칙', before: '낡은 규칙', after: '새 규칙' });
    expect(next).toHaveLength(2);
  });
});
