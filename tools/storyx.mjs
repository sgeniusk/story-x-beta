#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , command = 'help', ...args] = process.argv;
const providerCommandHints = ['claude --print', 'codex exec'];
void providerCommandHints;

if (command === 'doctor') {
  const checks = ['claude', 'codex'].map((binary) => ({
    binary,
    path: findCommand(binary)
  }));

  printJson({
    storyx: 'alpha-cli-harness',
    cwd: process.cwd(),
    providers: [
      { provider: 'mock', available: true, command: 'storyx-mock' },
      ...checks.map((check) => ({
        provider: check.binary,
        available: Boolean(check.path),
        command: check.binary,
        path: check.path ?? null
      }))
    ],
    next: 'Run `npm run storyx -- review --provider mock --scale small --dry-run` before spending tokens.'
  });
  process.exit(0);
}

if (command === 'review') {
  const provider = readFlag(args, '--provider', 'mock');
  const scale = readFlag(args, '--scale', 'small');
  const outDir = readFlag(args, '--out-dir', join(process.cwd(), '.storyx-runs'));
  const dryRun = args.includes('--dry-run');
  const prompt = buildReviewPrompt(scale);

  if (provider === 'mock') {
    const result = {
      provider,
      scale,
      mode: 'review',
      summary: 'Mock review completed without token spend.',
      agentReports: [
        { agent: 'showrunner', status: 'pass', note: '독자 약속과 다음 행동을 먼저 확인합니다.' },
        { agent: 'continuity-editor', status: 'revise', note: '새 기억 후보는 승인 대기 큐에 둡니다.' }
      ],
      memoryCandidates: [],
      nextActions: ['실제 호출 전 review scale을 선택하세요.']
    };

    const pendingReviewPath = writePendingReviewFile(outDir, provider, scale, result);

    if (!dryRun) {
      writeRawProviderFile(outDir, provider, scale, JSON.stringify(result, null, 2));
    }

    printJson({
      ...result,
      pendingReviewPath,
      approvalRequiredBeforeSync: true
    });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--max-budget-usd', '0.25', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  if (!dryRun) {
    const providerResult = runProvider(commandPreview);
    const payload = {
      provider,
      scale,
      mode: 'review',
      status: providerResult.status === 0 ? 'complete' : 'failed',
      summary: providerResult.status === 0 ? 'Provider review completed.' : 'Provider review failed; raw output captured for diagnosis.',
      stdout: providerResult.stdout,
      stderr: providerResult.stderr,
      exitCode: providerResult.status,
      agentReports: [],
      memoryCandidates: [],
      nextActions:
        providerResult.status === 0
          ? ['결과를 읽고 승인할 memoryCandidates를 선택하세요.']
          : ['provider stderr를 확인하고 doctor 또는 dry-run으로 명령을 점검하세요.']
    };
    const pendingReviewPath = writePendingReviewFile(outDir, provider, scale, payload);
    const rawProviderOutputPath = writeRawProviderFile(outDir, provider, scale, providerResult.stdout || providerResult.stderr);

    printJson({
      ...payload,
      pendingReviewPath,
      rawProviderOutputPath,
      approvalRequiredBeforeSync: true
    });
    process.exit(providerResult.status === 0 ? 0 : 1);
  }

  printJson({
    provider,
    scale,
    dryRun,
    commandPreview,
    pendingReviewTarget: join(outDir, 'reviews', 'pending'),
    approvalRequiredBeforeSync: true,
    warning: 'Actual Claude/Codex runs may spend tokens. Remove --dry-run only after choosing review scale.'
  });
  process.exit(0);
}

printJson({
  usage: [
    'npm run storyx -- doctor',
    'npm run storyx -- review --provider mock --scale small --dry-run',
    'npm run storyx -- review --provider claude --scale small --dry-run',
    'npm run storyx -- review --provider codex --scale small --dry-run'
  ]
});

function readFlag(values, flag, fallback) {
  const index = values.indexOf(flag);
  return index >= 0 && values[index + 1] ? values[index + 1] : fallback;
}

function findCommand(commandName) {
  const result = spawnSync('which', [commandName], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function buildReviewPrompt(scale) {
  return [
    'Story X review request',
    `scale: ${scale}`,
    'Read AGENTS.md and docs/codex-agent-manifest.md.',
    'Do not sync canon or memory without user approval.',
    'Return summary, agentReports, memoryCandidates, nextActions.'
  ].join('\n');
}

function runProvider(commandParts) {
  const [binary, ...providerArgs] = commandParts;
  return spawnSync(binary, providerArgs, {
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 1024 * 1024 * 4
  });
}

function writePendingReviewFile(outDir, provider, scale, payload) {
  const dir = join(outDir, 'reviews', 'pending');
  const path = join(dir, `${timestamp()}-${provider}-review-${scale}.json`);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

function writeRawProviderFile(outDir, provider, scale, content) {
  const dir = join(outDir, 'reviews', 'provider-raw');
  const path = join(dir, `${timestamp()}-${provider}-review-${scale}.txt`);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content || '');
  return path;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
