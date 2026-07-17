import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingleWriterGate, STORY_X_WRITER_LOCK } from './SingleWriterGate';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type LockCallback = () => Promise<void>;
type LockManagerMock = {
  request: (name: string, options: { mode: string; signal: AbortSignal }, callback: LockCallback) => Promise<void>;
};

const originalLocks = Object.getOwnPropertyDescriptor(window.navigator, 'locks');

function setLocks(value: LockManagerMock | undefined): void {
  Object.defineProperty(window.navigator, 'locks', {
    configurable: true,
    value
  });
}

afterEach(() => {
  if (originalLocks) {
    Object.defineProperty(window.navigator, 'locks', originalLocks);
  } else {
    delete (window.navigator as Navigator & { locks?: LockManagerMock }).locks;
  }
});

describe('SingleWriterGate', () => {
  it('Web Locks 미지원 환경은 데이터 유실 위험 때문에 App을 fail-closed한다', () => {
    setLocks(undefined);
    const host = document.createElement('div');
    const root = createRoot(host);

    act(() => root.render(createElement(SingleWriterGate, null, createElement('p', null, '작업실'))));

    expect(host.textContent).toContain('안전한 로컬 편집 잠금을 지원하지 않습니다');
    expect(host.textContent).not.toContain('작업실');
    act(() => root.unmount());
  });

  it('다른 탭이 writer lock을 쥐고 있으면 App을 mount하지 않고 자동 승계를 기다린다', () => {
    const request = vi.fn(() => new Promise<void>(() => {}));
    setLocks({ request });
    const host = document.createElement('div');
    const root = createRoot(host);

    act(() => root.render(createElement(SingleWriterGate, null, createElement('p', null, '작업실'))));

    expect(request).toHaveBeenCalledWith(
      STORY_X_WRITER_LOCK,
      expect.objectContaining({ mode: 'exclusive' }),
      expect.any(Function)
    );
    expect(host.textContent).toContain('다른 탭의 Story X를 기다리는 중');
    expect(host.textContent).not.toContain('작업실');
    act(() => root.unmount());
  });

  it('exclusive lock을 얻은 동안만 App을 mount하고 unmount 때 다음 탭에 넘긴다', async () => {
    let held: Promise<void> | null = null;
    let released = false;
    const request = vi.fn((_name: string, _options: { mode: string; signal: AbortSignal }, callback: LockCallback) => {
      held = callback().then(() => { released = true; });
      return held;
    });
    setLocks({ request });
    const host = document.createElement('div');
    const root = createRoot(host);

    await act(async () => {
      root.render(createElement(SingleWriterGate, null, createElement('p', null, '작업실')));
      await Promise.resolve();
    });
    expect(host.textContent).toContain('작업실');

    act(() => root.unmount());
    await held;
    expect(released).toBe(true);
  });

  it('main 진입점이 App 바깥에서 single-writer 게이트를 건다', () => {
    const main = readFileSync(resolve(__dirname, '../main.tsx'), 'utf8');
    expect(main).toContain("import { SingleWriterGate } from './components/SingleWriterGate'");
    expect(main).toMatch(/<SingleWriterGate>\s*<App \/>\s*<\/SingleWriterGate>/);
  });
});
