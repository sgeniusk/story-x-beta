import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
};
const cli = readFileSync(resolve(__dirname, '../tools/storyx.mjs'), 'utf8');
const cliPath = resolve(__dirname, '../tools/storyx.mjs');

describe('storyx CLI script', () => {
  it('exposes doctor and review commands for local AI CLI harness testing', () => {
    expect(packageJson.scripts?.storyx).toBe('node tools/storyx.mjs');
    expect(cli).toContain("command === 'doctor'");
    expect(cli).toContain("command === 'review'");
    expect(cli).toContain('provider');
    expect(cli).toContain('claude --print');
    expect(cli).toContain('codex exec');
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
