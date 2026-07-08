// PR #20 잔여 MEDIUM — clear+remount 불변식 자동 회귀.
// 버리기(clearPlanPatches) 후 옛 인스턴스가 스테일 패치를 재저장하지 않고, remount 인스턴스는 빈 패치로 시작한다.
// StoryXDesk 의 planPatches 배선(useState(loadPlanPatches) + savePlanPatches effect)과 동일 형태의 축소 하네스.
import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PlanPatch } from './planStage';
import { clearPlanPatches, loadPlanPatches, savePlanPatches } from './storage';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PATCH: PlanPatch = { kind: 'story-core', field: 'logline', label: '로그라인', before: 'a', after: 'b' };

let exposedStage: ((patch: PlanPatch) => void) | null = null;

afterEach(() => {
  exposedStage = null;
});

function Harness() {
  const [patches, setPatches] = useState<PlanPatch[]>(() => loadPlanPatches());
  useEffect(() => {
    savePlanPatches(patches);
  }, [patches]);
  exposedStage = (patch) => setPatches((prev) => [...prev, patch]);
  return createElement('div', { 'data-count': String(patches.length) });
}

describe('PLAN staged clear+remount 회귀 (PR #20 MEDIUM)', () => {
  it('버리기 후 옛 인스턴스 재렌더·unmount 를 거쳐도 스테일 패치가 재저장되지 않는다', () => {
    clearPlanPatches();
    const host = document.createElement('div');
    document.body.appendChild(host);

    // 1) 옛 인스턴스 — 패치 1건 staged → 영속 확인
    const root = createRoot(host);
    act(() => { root.render(createElement(Harness)); });
    act(() => { exposedStage?.(PATCH); });
    expect(loadPlanPatches()).toHaveLength(1);

    // 2) App discardPlanStage 시퀀스의 effect 불변식 재현 — 실제 remount 트리거는 key 교체이며,
    //    여기서는 clear 후 옛 인스턴스가 state 무변경 재렌더를 겪어도 deps 불변이라 save effect 가 재발화하지 않음을 핀.
    clearPlanPatches();
    act(() => { root.render(createElement(Harness)); });
    expect(loadPlanPatches()).toHaveLength(0);

    // 3) 옛 인스턴스 unmount → 새 인스턴스 mount(remount) — 빈 패치로 시작, storage 도 빈 상태 유지
    act(() => { root.unmount(); });
    expect(loadPlanPatches()).toHaveLength(0);
    const root2 = createRoot(host);
    act(() => { root2.render(createElement(Harness)); });
    expect(loadPlanPatches()).toHaveLength(0);
    expect(host.querySelector('div')?.getAttribute('data-count')).toBe('0');

    act(() => { root2.unmount(); });
    host.remove();
    clearPlanPatches();
  });
});
