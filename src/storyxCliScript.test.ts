import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { buildDiveCondensePrompt } from './lib/server/promptBuilders';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
};
const cli = readFileSync(resolve(__dirname, '../tools/storyx.mjs'), 'utf8');
const cliPath = resolve(__dirname, '../tools/storyx.mjs');
const diveCondenseBlock = cli.slice(
  cli.indexOf("if (command === 'dive-condense')"),
  cli.indexOf("if (command === 'dive-showrunner')")
);
const legacyDiveCondenseConflicts = ['3인칭 서사 회차로 압축', '대사를 그대로 옮기지 말고', '인과로 봉합'] as const;

describe('storyx CLI script', () => {
  it('exposes doctor and review commands for local AI CLI harness testing', () => {
    expect(packageJson.scripts?.storyx).toBe('node tools/storyx.mjs');
    expect(cli).toContain("command === 'doctor'");
    expect(cli).toContain("command === 'review'");
    expect(cli).toContain('provider');
    expect(cli).toContain('claude --print');
    expect(cli).toContain('codex exec');
  });

  it('dive-condense --dry-run은 실제 CLI 런타임 빌더의 전체 prompt를 TS 빌더와 byte-identical하게 출력한다', () => {
    const input = {
      character: '한서윤 — 선배. 욕망: 진실. 상처: 배신.',
      scene: '비 오는 회사 옥상 문 앞',
      context: '## 한국어 문체·보이스 규칙\n- 리듬: 짧고 긴 문장을 교차한다.',
      transcript: '나: 문을 열 거예요.\n한서윤: 열면 돌아갈 수 없어.',
      arc: '{"dramaticQuestion":"문을 열 것인가","tension":72}'
    };
    const result = spawnSync(
      'node',
      [
        cliPath, 'dive-condense', '--provider', 'codex', '--dry-run',
        '--character', input.character,
        '--scene', input.scene,
        '--context', input.context,
        '--transcript', input.transcript,
        '--arc', input.arc,
        '--episode', '1'
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { mode: string; dryRun: boolean; prompt: string; commandPreview: string[] };
    const expectedPrompt = buildDiveCondensePrompt(input);
    expect(payload.mode).toBe('dive-condense');
    expect(payload.dryRun).toBe(true);
    expect(payload.prompt).toBe(expectedPrompt);
    expect(payload.commandPreview[payload.commandPreview.length - 1]).toBe(expectedPrompt);
    for (const legacy of legacyDiveCondenseConflicts) expect(payload.prompt).not.toContain(legacy);
  });

  it('dive-condense는 commandPreview를 dry-run 전에 한 번 만들고 실제 provider 호출에도 같은 변수를 쓴다', () => {
    expect(diveCondenseBlock.match(/const commandPreview\s*=/g)).toHaveLength(1);
    expect(diveCondenseBlock.indexOf('const commandPreview =')).toBeLessThan(diveCondenseBlock.indexOf('if (dryRun)'));
    const dryRunBranch = diveCondenseBlock.slice(
      diveCondenseBlock.indexOf('if (dryRun)'),
      diveCondenseBlock.indexOf("if (provider === 'mock')")
    );
    expect(dryRunBranch).toContain('commandPreview');
    expect(diveCondenseBlock).toContain('runProviderWithRetry(commandPreview)');
  });

  it('dive-condense 빈 입력 dry-run도 TS fallback prompt와 byte-identical하다', () => {
    const result = spawnSync(
      'node',
      [cliPath, 'dive-condense', '--provider', 'codex', '--dry-run'],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt: string; commandPreview: string[] };
    const expectedPrompt = buildDiveCondensePrompt({ character: '', scene: '', context: '', transcript: '', arc: '' });
    expect(payload.prompt).toBe(expectedPrompt);
    expect(payload.commandPreview[payload.commandPreview.length - 1]).toBe(expectedPrompt);
  });

  // A-5 — 헌장 예산 배선: draft 명령이 --contract-status 를 받아 buildDraftPrompt 에 넘긴다.
  // dry-run 의 commandPreview 마지막 원소가 빌드된 프롬프트라 거기서 헌장 규칙을 확인한다.
  it('draft --contract-status 가 헌장 예산 규칙을 프롬프트에 주입한다 (A-5)', () => {
    const result = spawnSync(
      'node',
      [
        cliPath, 'draft', '--provider', 'claude', '--medium', 'novel', '--format', 'long-novel',
        '--freewrite', 'x', '--dry-run',
        '--contract-status', JSON.stringify({ remaining: 2, unpaidCount: 5, overBudget: true, finalStretch: false })
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { commandPreview: string[] };
    const prompt = payload.commandPreview[payload.commandPreview.length - 1];
    expect(prompt).toContain('[헌장] 약속 예산 초과');
    expect(prompt).toContain('가장 오래된 약속');
  });

  it('draft --contract-status 오형식은 무시하고 헌장 규칙을 넣지 않는다 (A-5 가드)', () => {
    const result = spawnSync(
      'node',
      [
        cliPath, 'draft', '--provider', 'claude', '--medium', 'novel', '--format', 'long-novel',
        '--freewrite', 'x', '--dry-run', '--contract-status', '{not json'
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { commandPreview: string[] };
    const prompt = payload.commandPreview[payload.commandPreview.length - 1];
    expect(prompt).not.toContain('[헌장] 약속 예산 초과');
  });

  it('writes mock review runs to a pending review folder', () => {
    const outDir = mkdtempSync(resolve(tmpdir(), 'storyx-cli-'));
    const result = spawnSync('node', [cliPath, 'review', '--provider', 'mock', '--scale', 'small', '--out-dir', outDir], {
      encoding: 'utf8'
    });
    const payload = JSON.parse(result.stdout) as { pendingReviewPath: string; approvalRequiredBeforeSync: boolean };

    expect(result.status).toBe(0);
    expect(payload.approvalRequiredBeforeSync).toBe(true);
    expect(payload.pendingReviewPath).toContain('reviews/pending');
    expect(existsSync(payload.pendingReviewPath)).toBe(true);

    const saved = readFileSync(payload.pendingReviewPath, 'utf8');
    expect(saved).toContain('Mock review completed');
    expect(saved).toContain('memoryCandidates');
    expect(saved).toContain('reviews/pending/plot-candidates.json');
    expect(saved).toContain('approvalRequiredBeforeSync');
  });

  it('returns item-level strengths/issues from a mock per-agent review', () => {
    // 에이전트 다이얼로그가 잘된 점/잘못된 점을 항목으로 보여주려면 review-agent가 두 배열을 채워야 한다
    const result = spawnSync(
      'node',
      [cliPath, 'review-agent', '--provider', 'mock', '--agent', 'showrunner', '--target', '- 서윤이 탑에 오른다'],
      { encoding: 'utf8' }
    );
    const payload = JSON.parse(result.stdout) as {
      mode: string;
      verdict: string;
      strengths: string[];
      issues: string[];
    };

    expect(result.status).toBe(0);
    expect(payload.mode).toBe('review-agent');
    expect(Array.isArray(payload.strengths)).toBe(true);
    expect(Array.isArray(payload.issues)).toBe(true);
    expect(payload.strengths.length).toBeGreaterThan(0);
    expect(payload.issues.length).toBeGreaterThan(0);
    // 에이전트 검토 프롬프트가 strengths/issues 출력 필드를 명시해야 provider가 항목별로 답한다
    expect(cli).toContain('"strengths":');
    expect(cli).toContain('"issues":');
  });

  it('exposes a review-data command for per-category canon review', () => {
    expect(cli).toContain("command === 'review-data'");
    expect(cli).toContain('buildDataReviewPrompt');
    expect(cli).toContain('normalizeDataReviewNotes');
  });

  it('runs a mock data review and returns 정합/제안 notes', () => {
    const result = spawnSync(
      'node',
      [cliPath, 'review-data', '--provider', 'mock', '--category', '인물', '--target', '- 한서윤: 욕망'],
      { encoding: 'utf8' }
    );
    const payload = JSON.parse(result.stdout) as {
      mode: string;
      category: string;
      status: string;
      notes: Array<{ kind: string; title: string; body: string }>;
    };

    expect(result.status).toBe(0);
    expect(payload.mode).toBe('review-data');
    expect(payload.category).toBe('인물');
    expect(payload.status).toBe('complete');
    expect(payload.notes.some((note) => note.kind === '정합')).toBe(true);
    expect(payload.notes.some((note) => note.kind === '제안')).toBe(true);
  });

  it('normalizes provider raw output into a pending review file', () => {
    const outDir = mkdtempSync(resolve(tmpdir(), 'storyx-cli-'));
    const rawPath = resolve(outDir, 'claude-raw.txt');
    writeFileSync(
      rawPath,
      [
        '```json',
        JSON.stringify({
          summary: 'Provider review normalized.',
          agentReports: [{ agentId: 'showrunner', status: 'pass', note: '후크가 작동합니다.', evidence: ['hook'] }],
          memoryCandidates: [
            {
              owner: 'plot',
              status: 'pending',
              statement: '새 후크는 승인 전까지 pending으로 유지합니다.',
              sourceAgentId: 'showrunner',
              targetPath: 'reviews/pending/plot-candidates.json',
              rationale: 'canon sync 전 사용자 승인 필요'
            }
          ],
          nextActions: ['후크를 승인하거나 수정합니다.']
        }),
        '```'
      ].join('\n')
    );
    const result = spawnSync(
      'node',
      [cliPath, 'normalize-provider-output', '--provider', 'claude', '--scale', 'small', '--raw-file', rawPath, '--out-dir', outDir],
      { encoding: 'utf8' }
    );
    const payload = JSON.parse(result.stdout) as { pendingReviewPath: string; rawProviderOutputPath: string };
    const saved = readFileSync(payload.pendingReviewPath, 'utf8');

    expect(result.status).toBe(0);
    expect(existsSync(payload.pendingReviewPath)).toBe(true);
    expect(existsSync(payload.rawProviderOutputPath)).toBe(true);
    expect(saved).toContain('Provider review normalized.');
    expect(saved).toContain('reviews/pending/plot-candidates.json');
  });
});
