import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { HostedRuntimeBoundary } from './HostedRuntimeBoundary';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderBoundary(runtime: 'local-codex' | 'remote-api' | 'disabled') {
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() => {
    root.render(
      <HostedRuntimeBoundary runtime={runtime}>
        <main>작업실</main>
      </HostedRuntimeBoundary>
    );
  });
  return { host, root };
}

describe('HostedRuntimeBoundary', () => {
  it('로컬 runtime에는 안내 DOM이나 여백을 추가하지 않는다', () => {
    const { host, root } = renderBoundary('local-codex');

    expect(host.textContent).toBe('작업실');
    expect(host.querySelector('.sx-hosted-runtime')).toBeNull();
    act(() => root.unmount());
  });

  it('disabled runtime에는 브라우저 저장과 로컬 AI 경계를 계속 알린다', () => {
    const { host, root } = renderBoundary('disabled');

    const status = host.querySelector('[role="status"]');
    expect(status?.textContent).toContain('Sites 비공개 미리보기');
    expect(status?.textContent).toContain('이 브라우저에만 저장');
    expect(status?.textContent).toContain('로컬 Story X');
    expect(host.textContent).toContain('작업실');
    act(() => root.unmount());
  });
});
