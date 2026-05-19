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
