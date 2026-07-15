import { describe, expect, it, vi } from 'vitest';
import { createLocalGenerationJobRegistry, type RunningLocalTask } from './localGenerationJobs';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('local generation job registry', () => {
  it('starts a task and records its successful result', async () => {
    const work = deferred<{ prose: string }>();
    const registry = createLocalGenerationJobRegistry({
      run: () => ({ completion: work.promise, cancel: vi.fn() }),
      createId: () => 'job-1'
    });
    const started = registry.start({ prompt: 'x' }, 'same', { projectId: 'p1', baseRevision: 'r1', episode: 1 });
    expect(started.status).toBe('running');
    work.resolve({ prose: '완료' });
    await work.promise;
    await vi.waitFor(() => expect(registry.get('job-1')?.status).toBe('succeeded'));
    expect(registry.get('job-1')?.result).toEqual({ prose: '완료' });
  });

  it('returns the same active job for the same dedupe key', () => {
    const work = deferred<unknown>();
    const run = vi.fn((): RunningLocalTask<unknown> => ({ completion: work.promise, cancel: vi.fn() }));
    const registry = createLocalGenerationJobRegistry({ run, createId: () => 'job-1' });
    const meta = { projectId: 'p1', baseRevision: 'r1', episode: 1 };
    expect(registry.start({}, 'same', meta).id).toBe('job-1');
    expect(registry.start({}, 'same', meta).id).toBe('job-1');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('explicit cancel terminates the task and marks it cancelled', () => {
    const cancel = vi.fn();
    const registry = createLocalGenerationJobRegistry({
      run: () => ({ completion: new Promise(() => {}), cancel }),
      createId: () => 'job-1'
    });
    registry.start({}, 'same', { projectId: 'p1', baseRevision: 'r1', episode: 1 });
    expect(registry.cancel('job-1')?.status).toBe('cancelled');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('kills a task at the execution deadline', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const registry = createLocalGenerationJobRegistry({
      run: () => ({ completion: new Promise(() => {}), cancel }),
      createId: () => 'job-1',
      timeoutMs: 300_000
    });
    registry.start({}, 'same', { projectId: 'p1', baseRevision: 'r1', episode: 1 });
    await vi.advanceTimersByTimeAsync(300_000);
    expect(registry.get('job-1')?.status).toBe('timed-out');
    expect(cancel).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('dispose cancels every running child', () => {
    const cancels = [vi.fn(), vi.fn()];
    let index = 0;
    const registry = createLocalGenerationJobRegistry({
      run: () => ({ completion: new Promise(() => {}), cancel: cancels[index++] }),
      createId: (() => { let id = 0; return () => `job-${++id}`; })()
    });
    registry.start({}, 'a', { projectId: 'p1', baseRevision: 'r1', episode: 1 });
    registry.start({}, 'b', { projectId: 'p2', baseRevision: 'r2', episode: 1 });
    registry.dispose();
    expect(cancels.every((cancel) => cancel.mock.calls.length === 1)).toBe(true);
  });
});
