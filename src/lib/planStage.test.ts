// PLAN 설계실 staged 패치 순수 로직 — upsert 교체·원복 소멸·overlay 적용·충돌 감지. spec 2026-07-04.
import { describe, expect, it } from 'vitest';
import { applyPlanPatches, derivePlanConflicts, patchKey, resolvePlanApply, upsertPlanPatch, type PlanPatch } from './planStage';
import { createEmptyProject } from './storyEngine';
import type { CanonFact, CharacterProfile, SeriesProject, WorldRule } from './storyEngine';

const canonPatch = (after: string, before = '서준은 살아 있다'): PlanPatch => ({
  kind: 'canon', id: 'c1', label: '캐논 1화', before, after
});

function fixtureProject(): SeriesProject {
  const base = createEmptyProject({ title: '은막의 계절' });
  return {
    ...base,
    logline: '원래 로그라인',
    characters: [{ id: 'ch1', name: '은호', desire: '원래 욕망', wound: '원래 상처', currentState: '원래 상태' } as CharacterProfile],
    worldRules: [{ id: 'w1', title: '은막 규칙', rule: '원래 규칙' } as WorldRule],
    canonFacts: [{ id: 'c1', episode: 1, owner: 'plot', statement: '서준은 살아 있다' } as CanonFact]
  };
}

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

describe('applyPlanPatches', () => {
  it('5종 kind 를 제자리 적용하고 원본은 불변', () => {
    const project = fixtureProject();
    const next = applyPlanPatches(project, [
      { kind: 'canon', id: 'c1', label: '', before: '서준은 살아 있다', after: '서준은 절반쯤 들켰다' },
      { kind: 'character', id: 'ch1', field: 'wound', label: '', before: '원래 상처', after: '새 상처' },
      { kind: 'world', id: 'w1', label: '', before: '원래 규칙', after: '새 규칙' },
      { kind: 'story-core', field: 'logline', label: '', before: '원래 로그라인', after: '새 로그라인' },
      { kind: 'creative-weight', label: '', before: 'balanced', after: 'literary' }
    ]);
    expect(next.canonFacts[0].statement).toBe('서준은 절반쯤 들켰다');
    expect(next.characters[0].wound).toBe('새 상처');
    expect(next.worldRules[0].rule).toBe('새 규칙');
    expect(next.logline).toBe('새 로그라인');
    expect(next.creativeWeight).toBe('literary');
    expect(project.canonFacts[0].statement).toBe('서준은 살아 있다');
  });

  it('대상 id 가 소멸했으면 그 패치는 조용히 건너뛴다', () => {
    const project = fixtureProject();
    const next = applyPlanPatches(project, [
      { kind: 'canon', id: 'ghost', label: '', before: 'x', after: 'y' }
    ]);
    expect(next.canonFacts).toEqual(project.canonFacts);
  });
});

describe('derivePlanConflicts', () => {
  it('본편 값이 before 그대로면 충돌 없음', () => {
    expect(derivePlanConflicts(
      [{ kind: 'canon', id: 'c1', label: '', before: '서준은 살아 있다', after: 'x' }],
      fixtureProject()
    )).toEqual([]);
  });

  it('본편 값이 그 사이 바뀌었으면 그 패치만 충돌', () => {
    const committed = fixtureProject();
    committed.canonFacts = [{ ...committed.canonFacts[0], statement: 'PLAY 가 바꾼 정본' }];
    const conflicts = derivePlanConflicts(
      [
        { kind: 'canon', id: 'c1', label: '캐논 1화', before: '서준은 살아 있다', after: '내 설계' },
        { kind: 'world', id: 'w1', label: '', before: '원래 규칙', after: '새 규칙' }
      ],
      committed
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toEqual({ key: 'canon:c1', label: '캐논 1화', committedValue: 'PLAY 가 바꾼 정본', after: '내 설계' });
  });

  it('대상 소멸은 충돌이 아니다(적용 시 drop)', () => {
    expect(derivePlanConflicts(
      [{ kind: 'canon', id: 'ghost', label: '', before: 'x', after: 'y' }],
      fixtureProject()
    )).toEqual([]);
  });
});

describe('resolvePlanApply', () => {
  it('충돌 패치는 apply 결정만 적용하고 keep·미결정은 버린다, 비충돌은 전부 적용', () => {
    const committed = fixtureProject();
    committed.canonFacts = [{ ...committed.canonFacts[0], statement: 'PLAY 가 바꾼 정본' }];
    const patches: PlanPatch[] = [
      { kind: 'canon', id: 'c1', label: '', before: '서준은 살아 있다', after: '내 설계' },
      { kind: 'world', id: 'w1', label: '', before: '원래 규칙', after: '새 규칙' }
    ];
    const conflicts = derivePlanConflicts([...patches], committed);

    const kept = resolvePlanApply(committed, [...patches], conflicts, {});
    expect(kept.canonFacts[0].statement).toBe('PLAY 가 바꾼 정본');
    expect(kept.worldRules[0].rule).toBe('새 규칙');

    const applied = resolvePlanApply(committed, [...patches], conflicts, { 'canon:c1': 'apply' });
    expect(applied.canonFacts[0].statement).toBe('내 설계');
  });
});
