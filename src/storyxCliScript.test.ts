import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { buildDiveCondensePrompt } from './lib/server/promptBuilders';

const EPISODE_LENGTH_CONTRACTS = {
  compact: {
    schema: 'storyx/episode-length/v1', preset: 'compact', targetChars: 3000,
    minChars: 2700, maxChars: 3300, generationMinChars: 2850, generationMaxChars: 3150,
    minScenes: 2, maxScenes: 3
  },
  standard: {
    schema: 'storyx/episode-length/v1', preset: 'standard', targetChars: 5000,
    minChars: 4500, maxChars: 5500, generationMinChars: 4750, generationMaxChars: 5250,
    minScenes: 3, maxScenes: 4
  },
  extended: {
    schema: 'storyx/episode-length/v1', preset: 'extended', targetChars: 8000,
    minChars: 7200, maxChars: 8800, generationMinChars: 7600, generationMaxChars: 8400,
    minScenes: 4, maxScenes: 6
  }
} as const;

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

  it.each(Object.values(EPISODE_LENGTH_CONTRACTS))(
    'dive-condense $preset dry-run은 해당 프리셋 prompt를 TS 빌더와 byte-identical하게 출력한다',
    (episodeLength) => {
      const input = {
        character: '한서윤 — 선배. 욕망: 진실. 상처: 배신.',
        scene: '비 오는 회사 옥상 문 앞',
        context: '## 한국어 문체·보이스 규칙\n- 리듬: 짧고 긴 문장을 교차한다.',
        transcript: '나: 문을 열 거예요.\n한서윤: 열면 돌아갈 수 없어.',
        arc: '{"dramaticQuestion":"문을 열 것인가","tension":72}',
        episodeLength
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
          '--length-contract', JSON.stringify(episodeLength),
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
    }
  );

  it('dive-condense는 commandPreview를 dry-run 전에 한 번 만들고 실제 provider 호출에도 같은 변수를 쓴다', () => {
    expect(diveCondenseBlock.match(/const commandPreview\s*=/g)).toHaveLength(1);
    expect(diveCondenseBlock.indexOf('const commandPreview =')).toBeLessThan(diveCondenseBlock.indexOf('if (dryRun)'));
    const dryRunBranch = diveCondenseBlock.slice(
      diveCondenseBlock.indexOf('if (dryRun)'),
      diveCondenseBlock.indexOf("if (provider === 'mock')")
    );
    expect(dryRunBranch).toContain('commandPreview');
    expect(diveCondenseBlock).toContain('runProviderWithRetry(commandPreview, CONDENSE_PROVIDER_TIMEOUT_MS)');
  });

  it('dive-condense 최소 transcript와 빈 주변 입력 dry-run도 TS fallback prompt와 byte-identical하다', () => {
    const transcript = '나: 문 앞에 멈췄다.';
    const result = spawnSync(
      'node',
      [
        cliPath, 'dive-condense', '--provider', 'codex', '--dry-run',
        '--transcript', transcript,
        '--length-contract', JSON.stringify(EPISODE_LENGTH_CONTRACTS.standard)
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt: string; commandPreview: string[] };
    const expectedPrompt = buildDiveCondensePrompt({
      character: '', scene: '', context: '', transcript, arc: '',
      episodeLength: EPISODE_LENGTH_CONTRACTS.standard
    });
    expect(payload.prompt).toBe(expectedPrompt);
    expect(payload.commandPreview[payload.commandPreview.length - 1]).toBe(expectedPrompt);
  });

  it.each([undefined, '  \n\t'])('dive-condense dry-run은 공백 transcript를 생성 전에 거부한다 (%s)', (transcript) => {
    const result = spawnSync(
      'node',
      [
        cliPath, 'dive-condense', '--provider', 'codex', '--dry-run',
        ...(transcript === undefined ? [] : ['--transcript', transcript]),
        '--length-contract', JSON.stringify(EPISODE_LENGTH_CONTRACTS.standard)
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).not.toBe(0);
    const payload = JSON.parse(result.stdout) as { status: string; warning: string; prompt?: string; commandPreview?: string[] };
    expect(payload.status).toBe('failed');
    expect(payload.warning).toContain('--transcript');
    expect(payload).not.toHaveProperty('prompt');
    expect(payload).not.toHaveProperty('commandPreview');
  });

  it('dive-condense는 --transcript 값이 빠진 뒤의 flag를 원문으로 승격하지 않는다', () => {
    const result = spawnSync(
      'node',
      [
        cliPath, 'dive-condense', '--provider', 'codex', '--dry-run',
        '--transcript',
        '--length-contract', JSON.stringify(EPISODE_LENGTH_CONTRACTS.standard)
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).not.toBe(0);
    const payload = JSON.parse(result.stdout) as { status: string; warning: string; prompt?: string };
    expect(payload.status).toBe('failed');
    expect(payload.warning).toContain('--transcript');
    expect(payload).not.toHaveProperty('prompt');
  });

  it('dive-condense 8천 자 희소 원문도 근거 없는 장면·행동·사건·폭로·페이오프를 요구하지 않는다', () => {
    const episodeLength = EPISODE_LENGTH_CONTRACTS.extended;
    const result = spawnSync(
      'node',
      [
        cliPath, 'dive-condense', '--provider', 'codex', '--dry-run',
        '--character', '한서윤 — 선배.',
        '--scene', '비 오는 회사 옥상 문 앞',
        '--transcript', '나: 문을 바라봤다.',
        '--length-contract', JSON.stringify(episodeLength)
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { prompt: string; commandPreview: string[] };
    expect(payload.prompt).toContain(`사건·행동이 있을 때만 서로 다른 압력의 현재 장면 ${episodeLength.minScenes}~${episodeLength.maxScenes}개까지 재구성합니다.`);
    expect(payload.prompt).toContain('각각 뒷받침할 때만 하나의 중앙 갈등 안에서 그 연쇄를 깊게 합니다.');
    expect(payload.prompt).toContain('"원문 근거"는 응결할 대화에 명시된 사건·행동·결정·대사만 뜻합니다.');
    expect(payload.prompt).toContain('원문 근거에 없는 새 행동·결정·사건·폭로(reveal)·대가·페이오프를 발명하지 않습니다.');
    expect(payload.prompt).toContain('더 적은 장면과 허용 하한보다 짧은 prose를 반환합니다.');
    expect(payload.prompt).toContain(`${episodeLength.maxChars.toLocaleString('ko-KR')}자를 넘어도 자동으로 자르지 않습니다.`);
    expect(payload.commandPreview[payload.commandPreview.length - 1]).toBe(payload.prompt);
    expect(payload.prompt).not.toContain('- 서로 다른 압력을 가진 현재 장면 4~6개로 재구성합니다.');
    expect(payload.prompt).not.toContain('- 하나의 중앙 갈등 안에서 시도 → 반격 → 관계·지위 비용 → 주 reveal 하나 → 강제 선택을 깊게 합니다.');
  });

  it('dive-condense는 유효한 --length-contract JSON을 필수로 요구한다', () => {
    for (const contractArg of [undefined, '{not json', JSON.stringify({ ...EPISODE_LENGTH_CONTRACTS.standard, targetChars: 3000 })]) {
      const result = spawnSync(
        'node',
        [cliPath, 'dive-condense', '--provider', 'mock', ...(contractArg === undefined ? [] : ['--length-contract', contractArg])],
        { encoding: 'utf8' }
      );
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('--length-contract');
    }
  });

  it('dive-condense mock 결과는 요청 계약·공백 제외 실제 글자 수·상태를 함께 반환한다', () => {
    const episodeLength = EPISODE_LENGTH_CONTRACTS.extended;
    const result = spawnSync(
      'node',
      [
        cliPath, 'dive-condense', '--provider', 'mock',
        '--transcript', '나: 문을 열었다.',
        '--length-contract', JSON.stringify(episodeLength)
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      prose: string;
      episodeLength: typeof episodeLength;
      actualChars: number;
      lengthStatus: string;
    };
    expect(payload.episodeLength).toEqual(episodeLength);
    expect(payload.actualChars).toBe(payload.prose.replace(/\s/gu, '').length);
    expect(payload.lengthStatus).toBe('under');
  });

  it('dive-condense provider 결과도 모델 prose를 기준으로 분량 메타를 계산해 반환한다', () => {
    const providerBranch = diveCondenseBlock.slice(diveCondenseBlock.indexOf('runProviderWithRetry(commandPreview'));
    expect(providerBranch).toContain('const prose = readString(parsed?.prose)');
    expect(providerBranch).toContain('const lengthEvaluation = evaluateEpisodeLength(prose, episodeLength)');
    expect(providerBranch).toContain('episodeLength,');
    expect(providerBranch).toContain('actualChars: lengthEvaluation.actualChars');
    expect(providerBranch).toContain('lengthStatus: lengthEvaluation.status');
  });

  it('장문 provider timeout은 안전한 진단 메타를 남기고 같은 호출을 맹목 재시도하지 않는다', () => {
    expect(cli).toContain('const CONDENSE_PROVIDER_TIMEOUT_MS = 540_000');
    expect(cli).toContain("if (firstFailure.kind === 'timed-out')");
    expect(cli).toContain('providerFailure: firstFailure');
    expect(diveCondenseBlock).toContain('providerFailure');
    expect(diveCondenseBlock).toContain("providerFailure?.kind === 'timed-out'");
    expect(diveCondenseBlock).not.toContain('stderr: providerResult.stderr');
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
