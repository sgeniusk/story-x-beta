export type StoryXAiRuntime = 'local-codex' | 'remote-api' | 'disabled';

export interface StoryXRuntimeCapabilities {
  coreAi: boolean;
  playAi: boolean;
  condenseJobs: boolean;
}

export const LOCAL_RUNTIME_REQUIRED_CODE = 'local_runtime_required';
export const LOCAL_RUNTIME_REQUIRED_MESSAGE =
  '이 Sites 비공개 미리보기에서는 AI 생성·응결·검토를 실행하지 않습니다. 로컬 Story X에서 계속하세요.';

const STORY_X_AI_RUNTIMES: readonly StoryXAiRuntime[] = [
  'local-codex',
  'remote-api',
  'disabled'
];

export function resolveStoryXAiRuntime(
  rawRuntime: unknown,
  fallback: StoryXAiRuntime
): StoryXAiRuntime {
  if (rawRuntime === undefined || rawRuntime === null || rawRuntime === '') return fallback;

  return typeof rawRuntime === 'string' &&
    STORY_X_AI_RUNTIMES.includes(rawRuntime as StoryXAiRuntime)
    ? (rawRuntime as StoryXAiRuntime)
    : 'disabled';
}

export function defaultStoryXAiRuntime(isDev: boolean): StoryXAiRuntime {
  return isDev ? 'local-codex' : 'disabled';
}

export function storyXRuntimeCapabilities(
  runtime: StoryXAiRuntime
): StoryXRuntimeCapabilities {
  switch (runtime) {
    case 'local-codex':
      return { coreAi: true, playAi: true, condenseJobs: true };
    case 'remote-api':
      return { coreAi: true, playAi: false, condenseJobs: false };
    case 'disabled':
      return { coreAi: false, playAi: false, condenseJobs: false };
  }
}

export const STORYX_AI_RUNTIME = resolveStoryXAiRuntime(
  import.meta.env.VITE_STORYX_AI_RUNTIME,
  defaultStoryXAiRuntime(import.meta.env.DEV)
);

export const STORYX_RUNTIME_CAPABILITIES = storyXRuntimeCapabilities(STORYX_AI_RUNTIME);

function requestUrl(input: RequestInfo | URL, origin: string): URL | null {
  try {
    if (input instanceof Request) return new URL(input.url, origin);
    return new URL(input.toString(), origin);
  } catch {
    return null;
  }
}

function isSameOriginStoryXApi(input: RequestInfo | URL, origin: string): boolean {
  const url = requestUrl(input, origin);
  if (!url) return false;

  const originUrl = new URL(origin);
  return (
    url.origin === originUrl.origin &&
    (url.pathname === '/api' || url.pathname.startsWith('/api/'))
  );
}

export function createLocalRuntimeRequiredResponse(): Response {
  return new Response(
    JSON.stringify({
      status: 'failed',
      code: LOCAL_RUNTIME_REQUIRED_CODE,
      warning: LOCAL_RUNTIME_REQUIRED_MESSAGE
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }
  );
}

export function createStoryXApiFetch(
  runtime: StoryXAiRuntime,
  fetcher: typeof fetch,
  origin: string
): typeof fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    if (runtime === 'disabled' && isSameOriginStoryXApi(input, origin)) {
      return Promise.resolve(createLocalRuntimeRequiredResponse());
    }

    return fetcher(input, init);
  }) as typeof fetch;
}

export const storyXApiFetch: typeof fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const origin = globalThis.location?.origin ?? 'http://127.0.0.1';
  return createStoryXApiFetch(
    STORYX_AI_RUNTIME,
    globalThis.fetch.bind(globalThis),
    origin
  )(input, init);
}) as typeof fetch;
