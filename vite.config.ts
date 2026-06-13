import { spawn } from 'node:child_process';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 로컬 dev 서버에서만 storyx CLI(codex provider)를 실행하는 브리지.
// 작가진 LLM 호출을 로컬 Codex CLI(codex exec)로 라우팅한다. claude 로 되돌리려면 각 라우트의 '--provider' 값을 'claude' 로 바꾼다.
// 배포본(Vercel 정적 호스팅)에는 이 미들웨어가 없으므로 프런트엔드가 deterministic 생성/검토로 폴백한다.
function storyxBridge(
  route: string,
  buildArgs: (input: Record<string, unknown>) => string[]
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
      let input: Record<string, unknown> = {};
      try {
        input = body ? (JSON.parse(body) as Record<string, unknown>) : {};
      } catch {
        input = {};
      }

      const child = spawn(process.execPath, buildArgs(input), { cwd: process.cwd() });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('error', (error) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'failed', warning: `브리지 실행 실패: ${error.message}` }));
      });
      child.on('close', () => {
        res.setHeader('Content-Type', 'application/json');
        const json = extractJsonObject(stdout);
        if (json) {
          res.end(json);
        } else {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              status: 'failed',
              warning: 'storyx 출력에서 JSON을 찾지 못했습니다.',
              stderr: stderr.slice(0, 500)
            })
          );
        }
      });
    });
  };

  return {
    name: `storyx-bridge${route.replace(/\//g, '-')}`,
    configureServer(server) {
      server.middlewares.use(route, handler);
    }
  };
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
      String(input.context ?? '')
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
    ])
  ]
});
