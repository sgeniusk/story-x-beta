import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { PublishScreen } from './PublishScreen';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('PublishScreen Sites runtime', () => {
  beforeEach(() => window.localStorage.clear());

  it('출간 자료는 읽되 새 에이전트 호출만 비활성화한다', () => {
    const host = document.createElement('div');
    const root = createRoot(host);
    act(() => root.render(
      <PublishScreen
        medium="novel"
        format="long-novel"
        onBack={() => {}}
        aiEnabled={false}
        disabledReason="로컬 Story X에서 실행하세요."
      />
    ));

    expect(host.textContent).toContain('출간 자료 패키지');
    expect(host.textContent).toContain('로컬 Story X에서 실행하세요.');
    for (const label of ['디자인 준비', '보도 패키지 준비', '플랫폼 매칭', '계약 비교 준비']) {
      const button = Array.from(host.querySelectorAll('button')).find((candidate) => candidate.textContent === label);
      expect(button?.disabled, label).toBe(true);
      act(() => button?.click());
    }
    expect(host.textContent).not.toContain('호출 중');

    act(() => root.unmount());
  });
});
