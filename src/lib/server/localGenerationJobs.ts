export type LocalGenerationJobStatus = 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out';

export interface LocalGenerationJobMeta {
  projectId: string;
  baseRevision: string;
  episode: number;
}

export interface LocalGenerationJob<TResult> extends LocalGenerationJobMeta {
  id: string;
  status: LocalGenerationJobStatus;
  createdAt: string;
  updatedAt: string;
  result?: TResult;
  warning?: string;
}

export interface RunningLocalTask<TResult> {
  completion: Promise<TResult>;
  cancel: () => void;
}

interface RegistryOptions<TInput, TResult> {
  run: (input: TInput) => RunningLocalTask<TResult>;
  createId?: () => string;
  now?: () => Date;
  timeoutMs?: number;
}

interface InternalJob<TResult> extends LocalGenerationJob<TResult> {
  dedupeKey: string;
  cancelTask: () => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_JOB_TIMEOUT_MS = 300_000;

function defaultId(): string {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function publicJob<TResult>(job: InternalJob<TResult>): LocalGenerationJob<TResult> {
  const { dedupeKey: _dedupeKey, cancelTask: _cancelTask, timer: _timer, ...snapshot } = job;
  return snapshot;
}

export function createLocalGenerationJobRegistry<TInput, TResult>(options: RegistryOptions<TInput, TResult>) {
  const jobs = new Map<string, InternalJob<TResult>>();
  const activeByDedupe = new Map<string, string>();
  const createId = options.createId ?? defaultId;
  const now = options.now ?? (() => new Date());
  const timeoutMs = options.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS;

  function finish(job: InternalJob<TResult>, status: LocalGenerationJobStatus, update: Partial<LocalGenerationJob<TResult>> = {}) {
    if (job.status !== 'running') return;
    clearTimeout(job.timer);
    job.status = status;
    job.updatedAt = now().toISOString();
    Object.assign(job, update);
    activeByDedupe.delete(job.dedupeKey);
  }

  function start(input: TInput, dedupeKey: string, meta: LocalGenerationJobMeta): LocalGenerationJob<TResult> {
    const existingId = activeByDedupe.get(dedupeKey);
    const existing = existingId ? jobs.get(existingId) : undefined;
    if (existing?.status === 'running') return publicJob(existing);

    const task = options.run(input);
    const timestamp = now().toISOString();
    const job = {
      id: createId(),
      status: 'running' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
      dedupeKey,
      cancelTask: task.cancel,
      timer: undefined as unknown as ReturnType<typeof setTimeout>,
      ...meta
    } satisfies InternalJob<TResult>;
    job.timer = setTimeout(() => {
      if (job.status !== 'running') return;
      job.cancelTask();
      finish(job, 'timed-out', { warning: '로컬 생성 시간이 5분을 넘어 중단했습니다.' });
    }, timeoutMs);
    jobs.set(job.id, job);
    activeByDedupe.set(dedupeKey, job.id);

    task.completion.then(
      (result) => finish(job, 'succeeded', { result }),
      (error: unknown) => finish(job, 'failed', {
        warning: error instanceof Error ? error.message : '로컬 생성 작업에 실패했습니다.'
      })
    );
    return publicJob(job);
  }

  function get(id: string): LocalGenerationJob<TResult> | null {
    const job = jobs.get(id);
    return job ? publicJob(job) : null;
  }

  function cancel(id: string): LocalGenerationJob<TResult> | null {
    const job = jobs.get(id);
    if (!job) return null;
    if (job.status === 'running') {
      job.cancelTask();
      finish(job, 'cancelled', { warning: '사용자가 생성을 취소했습니다.' });
    }
    return publicJob(job);
  }

  function dispose(): void {
    for (const job of jobs.values()) {
      if (job.status !== 'running') continue;
      job.cancelTask();
      finish(job, 'cancelled', { warning: '로컬 서버가 종료되어 생성을 중단했습니다.' });
    }
  }

  return { start, get, cancel, dispose };
}
