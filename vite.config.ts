import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createLocalGenerationJobRegistry } from './src/lib/server/localGenerationJobs';
import { parseEpisodeLengthContract } from './src/lib/storyEngine';

interface StoryxProcess {
  completion: Promise<Record<string, unknown>>;
  cancel: () => void;
}

function parseJsonRecordBody(body: string): Record<string, unknown> {
  if (!body) return {};
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function startStoryxProcess(args: string[]): StoryxProcess {
  const child = spawn(process.execPath, args, { cwd: process.cwd() });
  let stdout = '';
  let settled = false;
  const completion = new Promise<Record<string, unknown>>((resolve, reject) => {
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.resume();
    child.once('error', (error) => {
      settled = true;
      reject(new Error(`브리지 실행 실패: ${error.message}`));
    });
    child.once('close', () => {
      if (settled) return;
      settled = true;
      const json = extractJsonObject(stdout);
      if (!json) {
        reject(new Error('storyx 출력에서 JSON을 찾지 못했습니다.'));
        return;
      }
      resolve(JSON.parse(json) as Record<string, unknown>);
    });
  });
  return {
    completion,
    cancel: () => {
      if (settled) return;
      child.kill('SIGTERM');
      const force = setTimeout(() => { if (!settled) child.kill('SIGKILL'); }, 1_000);
      force.unref?.();
    }
  };
}

// 로컬 dev 서버에서만 storyx CLI(codex provider)를 실행하는 브리지.
// 작가진 LLM 호출을 로컬 Codex CLI(codex exec)로 라우팅한다. claude 로 되돌리려면 각 라우트의 '--provider' 값을 'claude' 로 바꾼다.
// 배포본(Vercel 정적 호스팅)에는 이 미들웨어가 없으므로 프런트엔드가 deterministic 생성/검토로 폴백한다.
function storyxBridge(
  route: string,
  buildArgs: (input: Record<string, unknown>) => string[],
  validateInput?: (input: Record<string, unknown>) => string | undefined
): Plugin {
  const handler: Connect.SimpleHandleFunction = (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'failed', warning: 'POST 요청만 지원합니다.' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const input = parseJsonRecordBody(body);

      const validationWarning = validateInput?.(input);
      if (validationWarning) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'failed', warning: validationWarning }));
        return;
      }

      const task = startStoryxProcess(buildArgs(input));
      const cancelIfAbandoned = () => { if (!res.writableEnded) task.cancel(); };
      res.on('close', cancelIfAbandoned);
      task.completion.then(
        (payload) => {
          if (res.writableEnded) return;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        },
        (error: unknown) => {
          if (res.writableEnded) return;
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'failed', warning: error instanceof Error ? error.message : '브리지 실행 실패' }));
        }
      );
    });
  };

  return {
    name: `storyx-bridge${route.replace(/\//g, '-')}`,
    configureServer(server) {
      server.middlewares.use(route, handler);
    }
  };
}

function readJsonBody(req: Connect.IncomingMessage, done: (input: Record<string, unknown>) => void): void {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    done(parseJsonRecordBody(body));
  });
}

function sendJson(res: Connect.ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function localGenerationJobBridge(
  route: string,
  buildArgs: (input: Record<string, unknown>) => string[],
  validateInput?: (input: Record<string, unknown>) => string | undefined
): Plugin {
  const registry = createLocalGenerationJobRegistry<Record<string, unknown>, Record<string, unknown>>({
    run: (input) => startStoryxProcess(buildArgs(input)),
    // CLI 장문 응결 상한(9분) 뒤 JSON 실패 메타를 회수할 1분 grace.
    timeoutMs: 600_000
  });
  const dispose = () => registry.dispose();
  const handler: Connect.SimpleHandleFunction = (req, res) => {
    const id = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\/+/, ''));
    if (req.method === 'POST' && !id) {
      readJsonBody(req, (input) => {
        const validationWarning = validateInput?.(input);
        if (validationWarning) {
          sendJson(res, 400, { status: 'failed', warning: validationWarning });
          return;
        }
        const projectId = String(input.projectId ?? '').trim();
        const baseRevision = String(input.baseRevision ?? '').trim();
        const episode = Number(input.episode ?? 1);
        if (!projectId || !baseRevision || !Number.isFinite(episode)) {
          sendJson(res, 400, { status: 'failed', warning: 'projectId·baseRevision·episode이 필요합니다.' });
          return;
        }
        const dedupeKey = createDiveCondenseDedupeKey(input);
        sendJson(res, 202, registry.start(input, dedupeKey, { projectId, baseRevision, episode }));
      });
      return;
    }
    if (req.method === 'GET' && id) {
      const job = registry.get(id);
      sendJson(res, job ? 200 : 404, job ?? { status: 'expired', warning: '로컬 서버에서 이 생성 작업을 찾지 못했습니다.' });
      return;
    }
    if (req.method === 'DELETE' && id) {
      const job = registry.cancel(id);
      sendJson(res, job ? 200 : 404, job ?? { status: 'expired', warning: '로컬 서버에서 이 생성 작업을 찾지 못했습니다.' });
      return;
    }
    sendJson(res, 405, { status: 'failed', warning: '지원하지 않는 잡 요청입니다.' });
  };
  return {
    name: `storyx-jobs${route.replace(/\//g, '-')}`,
    configureServer(server) {
      server.middlewares.use(route, handler);
      server.httpServer?.once('close', dispose);
    }
  };
}

export function validateDiveCondenseInput(input: Record<string, unknown>): string | undefined {
  if (typeof input.transcript !== 'string' || !input.transcript.trim()) {
    return '응결할 PLAY 원문이 필요합니다.';
  }
  return parseEpisodeLengthContract(input.episodeLength)
    ? undefined
    : '유효한 episodeLength v1 계약이 필요합니다.';
}

export function createDiveCondenseDedupeKey(input: Record<string, unknown>): string {
  const episodeLength = parseEpisodeLengthContract(input.episodeLength);
  if (!episodeLength) throw new Error('유효한 episodeLength v1 계약이 필요합니다.');
  const canonicalInput = {
    projectId: String(input.projectId ?? '').trim(),
    projectTitle: String(input.projectTitle ?? ''),
    baseRevision: String(input.baseRevision ?? '').trim(),
    episode: String(input.episode ?? '1'),
    character: String(input.character ?? ''),
    scene: String(input.scene ?? ''),
    context: String(input.context ?? ''),
    transcript: typeof input.transcript === 'string' ? input.transcript : '',
    arc: String(input.arc ?? ''),
    episodeLength
  };
  return createHash('sha256').update(JSON.stringify(canonicalInput)).digest('hex');
}

export function buildDiveCondenseArgs(input: Record<string, unknown>): string[] {
  const episodeLength = parseEpisodeLengthContract(input.episodeLength);
  if (!episodeLength) throw new Error('유효한 episodeLength v1 계약이 필요합니다.');
  if (typeof input.transcript !== 'string' || !input.transcript.trim()) {
    throw new Error('응결할 PLAY 원문이 필요합니다.');
  }
  return [
    'tools/storyx.mjs', 'dive-condense', '--provider', 'codex',
    '--character', String(input.character ?? ''),
    '--scene', String(input.scene ?? ''),
    '--context', String(input.context ?? ''),
    '--transcript', input.transcript,
    '--arc', String(input.arc ?? ''),
    '--length-contract', JSON.stringify(episodeLength),
    '--episode', String(input.episode ?? '1')
  ];
}

// storyx 표준출력에서 단일 JSON 객체를 안전하게 추출한다
function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // 앞뒤에 노이즈가 섞인 경우 첫 '{'부터 마지막 '}'까지를 다시 시도한다.
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return null;
  }

  const candidate = trimmed.slice(start, end + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

export default defineConfig({
  server: {
    watch: {
      // 에이전트 워크트리·브라우저 캡처 churn 이 dev 풀 리로드를 유발하지 않게 제외한다.
      ignored: ['**/.claude/**', '**/.playwright-mcp/**', '**/docs/**', '**/out/**']
    }
  },
  plugins: [
    react(),
    storyxBridge('/api/draft', (input) => [
      'tools/storyx.mjs',
      'draft',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--freewrite',
      String(input.freewrite ?? ''),
      '--title',
      String(input.title ?? ''),
      '--context',
      String(input.context ?? ''),
      ...(input.payoffStatus != null
        ? ['--payoff-status', JSON.stringify(input.payoffStatus)]
        : []),
      ...(input.contractStatus != null
        ? ['--contract-status', JSON.stringify(input.contractStatus)]
        : [])
    ]),
    storyxBridge('/api/review', (input) => [
      'tools/storyx.mjs',
      'review',
      '--provider',
      'codex',
      '--scale',
      String(input.scale ?? 'small'),
      '--target',
      String(input.target ?? ''),
      '--medium',
      String(input.medium ?? 'novel'),
      '--context',
      String(input.context ?? '')
    ]),
    storyxBridge('/api/interview', (input) => [
      'tools/storyx.mjs',
      'interview',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--freewrite',
      String(input.freewrite ?? ''),
      '--personas-json',
      JSON.stringify(Array.isArray(input.personaLineup) ? input.personaLineup : [])
    ]),
    storyxBridge('/api/review-agent', (input) => [
      'tools/storyx.mjs',
      'review-agent',
      '--provider',
      'codex',
      '--agent',
      String(input.agent ?? 'showrunner'),
      '--target',
      String(input.target ?? ''),
      '--medium',
      String(input.medium ?? 'novel'),
      '--context',
      String(input.context ?? ''),
      ...(input.payoffStatus != null
        ? ['--payoff-status', JSON.stringify(input.payoffStatus)]
        : []),
      ...(input.contractStatus != null
        ? ['--contract-status', JSON.stringify(input.contractStatus)]
        : [])
    ]),
    storyxBridge('/api/review-data', (input) => [
      'tools/storyx.mjs',
      'review-data',
      '--provider',
      'codex',
      '--category',
      String(input.category ?? '인물'),
      '--target',
      String(input.target ?? ''),
      '--medium',
      String(input.medium ?? 'novel'),
      '--context',
      String(input.context ?? '')
    ]),
    storyxBridge('/api/pace-interview', (input) => [
      'tools/storyx.mjs',
      'pace-interview',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--payoff-json',
      input.payoffStatus != null ? JSON.stringify(input.payoffStatus) : '',
      '--promises-json',
      JSON.stringify(Array.isArray(input.unpaidPromises) ? input.unpaidPromises : []),
      '--stakes-json',
      JSON.stringify(Array.isArray(input.deferredStakes) ? input.deferredStakes : []),
      '--context',
      String(input.context ?? '')
    ]),
    storyxBridge('/api/spine-suggest', (input) => [
      'tools/storyx.mjs',
      'spine-suggest',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--freewrite',
      String(input.freewrite ?? ''),
      '--ending',
      String(input.endingStatement ?? ''),
      '--cost',
      String(input.protagonistCost ?? '')
    ]),
    storyxBridge('/api/vs-candidates', (input) => [
      'tools/storyx.mjs',
      'vs-candidates',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--contract-digest',
      String(input.contractDigest ?? ''),
      '--recent-summary',
      String(input.recentSummary ?? ''),
      '--unpaid-json',
      JSON.stringify(Array.isArray(input.unpaidPromises) ? input.unpaidPromises : [])
    ]),
    storyxBridge('/api/plan-chat', (input) => [
      'tools/storyx.mjs',
      'plan-chat',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--section',
      String(input.activeSection ?? ''),
      '--context',
      String(input.contextDigest ?? ''),
      '--catalog',
      String(input.catalogText ?? ''),
      '--dialogue',
      String(input.dialogue ?? ''),
      '--query',
      String(input.query ?? '')
    ]),
    storyxBridge('/api/onboard-chat', (input) => [
      'tools/storyx.mjs',
      'onboard-chat',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--freewrite',
      String(input.freewrite ?? ''),
      '--dialogue',
      String(input.dialogue ?? ''),
      '--query',
      String(input.query ?? ''),
      ...(input.condense ? ['--condense'] : [])
    ]),
    storyxBridge('/api/dive-chat', (input) => [
      'tools/storyx.mjs',
      'dive-chat',
      '--provider',
      'codex',
      '--character',
      String(input.character ?? ''),
      '--scene',
      String(input.scene ?? ''),
      '--context',
      String(input.context ?? ''),
      '--dialogue',
      String(input.dialogue ?? ''),
      '--arc',
      String(input.arc ?? ''),
      '--query',
      String(input.query ?? '')
    ]),
    localGenerationJobBridge('/api/dive-condense-jobs', buildDiveCondenseArgs, validateDiveCondenseInput),
    storyxBridge('/api/dive-condense', buildDiveCondenseArgs, validateDiveCondenseInput),
    storyxBridge('/api/dive-showrunner', (input) => [
      'tools/storyx.mjs',
      'dive-showrunner',
      '--provider', 'codex',
      '--scene', String(input.scene ?? ''),
      '--context', String(input.context ?? ''),
      '--directive', String(input.directive ?? '')
    ]),
    storyxBridge('/api/dive-propose', (input) => [
      'tools/storyx.mjs',
      'dive-propose',
      '--provider', 'codex',
      '--topic', String(input.topic ?? ''),
      '--novelty', String(input.novelty ?? 'tilt')
    ]),
    storyxBridge('/api/dive-setup', (input) => [
      'tools/storyx.mjs',
      'dive-setup',
      '--provider', 'codex',
      '--story', String(input.story ?? '')
    ]),
    storyxBridge('/api/dive-consolidate', (input) => [
      'tools/storyx.mjs',
      'dive-consolidate',
      '--provider', 'codex',
      '--prose', String(input.prose ?? ''),
      '--context', String(input.context ?? '')
    ])
  ]
});
