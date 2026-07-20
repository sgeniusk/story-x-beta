// StoryScore v0.1 CLI 실행 수준 테스트 — 입력 정규화(백업 2형식·md 디렉토리)·결정론 분석·점수 환산을 검증한다
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const cliPath = resolve(__dirname, '../tools/storyscore.mjs');
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
};

interface ScoreReport {
  version: string;
  deterministic: {
    episodeCount: number;
    lengths: {
      perEpisode: Array<{
        episode: number;
        title: string;
        chars: number;
        targetRange: { min: number; max: number };
        inRange: boolean;
      }>;
      targetRange: { min: number; max: number };
      fitRate: number;
    };
    hooks: {
      perEpisode: Array<{ episode: number; hasHook: boolean; signals: string[] }>;
      hookRate: number;
    };
    roster: {
      names: string[];
      matrix: Array<{ episode: number; counts: Record<string, number> }>;
      variantSuspicions: Array<{ name: string; variant: string; episodes: number[]; count: number }>;
    } | null;
    titles: {
      perEpisode: Array<{ episode: number; title: string; repeatsPrevious: boolean; sharedTokens: string[] }>;
      repetitionRate: number;
    };
    scores: {
      formatDiscipline: { max: number; value: number };
      hookDeterminism: { max: number; value: number };
    };
    harnessDiagnostics: { canonFactsCount: number; stakesLedgerEntryCount: number } | null;
  };
  judgePackage: {
    samples: Array<{ episode: number; title: string; role: string; prose: string }>;
    sequence: Array<{ episode: number; title: string; tail200: string }>;
  };
}

// 목표 분량(1,800~2,700자) 적합/이탈과 말미 후크 유무를 통제한 4회차 픽스처
function makeProse(length: number, tail: string): string {
  // 패딩과 꼬리 사이에 개행을 둬 토큰 경계를 만든다 — 공백 제외 글자 수가 요청값과 같다
  const tailChars = tail.replace(/\s/g, '').length;
  return '가'.repeat(Math.max(0, length - tailChars)) + '\n' + tail;
}

const fixtureChapters = [
  {
    episode: 1,
    title: '탑의 초대',
    // 적합 분량 + 후크(그때) + 로스터 정상 표기(강이현은)와 철자 변형 의심(강이헌)
    prose: makeProse(2000, '강이현은 탑에 올랐다. 강이헌 이라는 잘못된 표기가 벽에 있었다. 그는 천천히 돌아보았다. 그때 문이 열렸다.')
  },
  {
    episode: 2,
    title: '조용한 밤',
    // 이탈 분량(1,000자) + 후크 없음
    prose: makeProse(1000, '강이현은 침대에 누웠다. 밤이 깊었다.')
  },
  {
    episode: 3,
    title: '의심',
    // 적합 분량 + 후크(물음표)
    prose: makeProse(2500, '강이현은 스스로에게 물었다. 정말 끝난 것일까?')
  },
  {
    episode: 4,
    title: '짧은 기록',
    // 이탈 분량(500자) + 후크 없음
    prose: makeProse(500, '기록은 거기서 멈췄다.')
  }
];

const fixtureProject = {
  title: '픽스처 작품',
  chapters: fixtureChapters.map((chapter) => ({
    ...chapter,
    stakesLedger: chapter.episode === 1 ? [{ stake: '이름', atRisk: '강이현' }] : []
  })),
  canonFacts: [{ statement: '사실 1' }, { statement: '사실 2' }, { statement: '사실 3' }]
};

function writeBackupFormat1(dir: string): string {
  const path = join(dir, 'backup-format1.json');
  writeFileSync(
    path,
    JSON.stringify({
      _meta: { exportedAt: '2026-06-11T00:00:00.000Z', source: 'serial-story-studio' },
      dump: { project: JSON.stringify(fixtureProject), snapshots: '[]' }
    })
  );
  return path;
}

function writeBackupFormat2(dir: string): string {
  const path = join(dir, 'backup-format2.json');
  const keymap = {
    'serial-story-studio/project': JSON.stringify(fixtureProject),
    'serial-story-studio/snapshots': '[]'
  };
  // 파일 전체가 JSON 문자열(이중 인코딩) — 한 번 파싱하면 문자열, 다시 파싱하면 키맵
  writeFileSync(path, JSON.stringify(JSON.stringify(keymap)));
  return path;
}

function writeMarkdownDir(dir: string): string {
  const mdDir = join(dir, 'episodes');
  mkdirSync(mdDir, { recursive: true });
  for (const chapter of fixtureChapters) {
    writeFileSync(
      join(mdDir, `ch${String(chapter.episode).padStart(2, '0')}.md`),
      `# ${chapter.episode}화. ${chapter.title}\n\n${chapter.prose}\n`
    );
  }
  return mdDir;
}

// v0.2 테스트용 — 임의 chapters 로 형식1 백업을 만든다
function writeCustomBackup(
  dir: string,
  chapters: Array<{ episode: number; title: string; prose: string; episodeLength?: unknown }>
): string {
  const path = join(dir, 'custom-backup.json');
  writeFileSync(
    path,
    JSON.stringify({
      _meta: { source: 'serial-story-studio' },
      dump: { project: JSON.stringify({ title: '커스텀', chapters, canonFacts: [] }), snapshots: '[]' }
    })
  );
  return path;
}

function runReport(inputPath: string, extraArgs: string[] = []): ScoreReport {
  const outPath = join(mkdtempSync(join(tmpdir(), 'storyscore-out-')), 'report.json');
  const result = spawnSync('node', [cliPath, '--input', inputPath, '--out', outPath, ...extraArgs], {
    encoding: 'utf8'
  });
  expect(result.status).toBe(0);
  return JSON.parse(readFileSync(outPath, 'utf8')) as ScoreReport;
}

describe('storyscore CLI', () => {
  it('exposes an npm script entry point', () => {
    expect(packageJson.scripts?.storyscore).toBe('node tools/storyscore.mjs');
  });

  it('normalizes 형식1 backup JSON ({_meta, dump.project}) and reports harness diagnostics', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-f1-'));
    const report = runReport(writeBackupFormat1(dir));

    expect(report.version).toBe('STORYSCORE_V0_2');
    expect(report.deterministic.episodeCount).toBe(4);
    expect(report.judgePackage.sequence.map((entry) => entry.episode)).toEqual([1, 2, 3, 4]);
    expect(report.judgePackage.sequence[0].title).toBe('탑의 초대');
    // 하네스 메타는 점수가 아니라 부가 진단으로만 나온다
    expect(report.deterministic.harnessDiagnostics).toEqual({ canonFactsCount: 3, stakesLedgerEntryCount: 1 });
  });

  it('normalizes 형식2 double-encoded keymap backup', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-f2-'));
    const report = runReport(writeBackupFormat2(dir));

    expect(report.deterministic.episodeCount).toBe(4);
    expect(report.judgePackage.samples[0].episode).toBe(1);
    expect(report.judgePackage.samples[0].prose).toBe(fixtureChapters[0].prose);
    expect(report.deterministic.harnessDiagnostics).toEqual({ canonFactsCount: 3, stakesLedgerEntryCount: 1 });
  });

  it('normalizes a chNN.md directory using the first-line header', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-md-'));
    const report = runReport(writeMarkdownDir(dir));

    expect(report.deterministic.episodeCount).toBe(4);
    expect(report.judgePackage.sequence.map((entry) => entry.episode)).toEqual([1, 2, 3, 4]);
    expect(report.judgePackage.sequence[2].title).toBe('의심');
    // md 입력에는 하네스 메타가 없으므로 진단은 null
    expect(report.deterministic.harnessDiagnostics).toBeNull();
  });

  it('computes the 1,800~2,700자 fit rate and the 10-point format discipline score', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-len-'));
    const report = runReport(writeBackupFormat1(dir));
    const { lengths, scores } = report.deterministic;

    expect(lengths.targetRange).toEqual({ min: 1800, max: 2700 });
    expect(lengths.perEpisode.map((entry) => entry.chars)).toEqual([2000, 1000, 2500, 500]);
    expect(lengths.perEpisode.map((entry) => entry.inRange)).toEqual([true, false, true, false]);
    expect(lengths.fitRate).toBeCloseTo(0.5);
    expect(scores.formatDiscipline.max).toBe(10);
    expect(scores.formatDiscipline.value).toBeCloseTo(5);
  });

  it('P2-d — valid v1 회차는 자기 범위와 공백 제외 글자 수를 쓰고 legacy는 기존 범위를 유지한다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-p2d-length-'));
    const compactLength = {
      schema: 'storyx/episode-length/v1',
      preset: 'compact',
      targetChars: 3000,
      minChars: 2700,
      maxChars: 3300,
      generationMinChars: 2850,
      generationMaxChars: 3150,
      minScenes: 2,
      maxScenes: 3
    };
    const invalidLength = { ...compactLength, minChars: 3300, maxChars: 2700 };
    const path = writeCustomBackup(dir, [
      {
        episode: 1,
        title: '새 분량 계약',
        // raw length는 4,199자지만 공백 제외 2,800자라 compact 범위 안이다.
        prose: `${'가 '.repeat(1399)}가${'나'.repeat(1400)}`,
        episodeLength: compactLength
      },
      { episode: 2, title: 'legacy 회차', prose: makeProse(2000, '기존 범위를 쓴다.') },
      {
        episode: 3,
        title: '손상 계약 회차',
        prose: makeProse(2000, '손상된 optional 계약만 무시한다.'),
        episodeLength: invalidLength
      }
    ]);

    const report = runReport(path);
    const [v1, legacy, invalid] = report.deterministic.lengths.perEpisode;

    expect(report.deterministic.lengths.targetRange).toEqual({ min: 1800, max: 2700 });
    expect(v1).toEqual(expect.objectContaining({
      episode: 1,
      chars: 2800,
      targetRange: { min: 2700, max: 3300 },
      inRange: true
    }));
    expect(legacy).toEqual(expect.objectContaining({
      episode: 2,
      chars: 2000,
      targetRange: { min: 1800, max: 2700 },
      inRange: true
    }));
    expect(invalid).toEqual(expect.objectContaining({
      episode: 3,
      chars: 2000,
      targetRange: { min: 1800, max: 2700 },
      inRange: true
    }));
  });

  it('builds a roster appearance matrix and flags spelling variants without flagging particles', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-roster-'));
    const report = runReport(writeBackupFormat1(dir), ['--roster', '강이현']);
    const roster = report.deterministic.roster;

    expect(roster).not.toBeNull();
    expect(roster?.names).toEqual(['강이현']);
    // 출현 매트릭스 — "강이현은" 같은 조사 결합형도 출현으로 센다
    expect(roster?.matrix.find((row) => row.episode === 1)?.counts['강이현']).toBeGreaterThan(0);
    expect(roster?.matrix.find((row) => row.episode === 4)?.counts['강이현']).toBe(0);
    // "강이헌"은 접두 일치 + 꼬리 1자 차이 → 철자 변형 의심
    const variants = roster?.variantSuspicions ?? [];
    expect(variants.some((entry) => entry.variant === '강이헌' && entry.episodes.includes(1))).toBe(true);
    // 정상 조사 결합형은 의심으로 올리지 않는다
    expect(variants.some((entry) => entry.variant.startsWith('강이현'))).toBe(false);
  });

  it('applies the tail-hook heuristic per episode and the 7-point hook score', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-hook-'));
    const report = runReport(writeBackupFormat1(dir));
    const { hooks, scores } = report.deterministic;

    expect(hooks.perEpisode.map((entry) => entry.hasHook)).toEqual([true, false, true, false]);
    expect(hooks.perEpisode[0].signals).toContain('그때');
    expect(hooks.perEpisode[2].signals).toContain('물음표');
    expect(hooks.hookRate).toBeCloseTo(0.5);
    expect(scores.hookDeterminism.max).toBe(7);
    expect(scores.hookDeterminism.value).toBeCloseTo(3.5);
  });

  it('packages judge samples (1화·25%·50%·75%·최종) and a full tail200 sequence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-judge-'));
    const report = runReport(writeBackupFormat1(dir));
    const { samples, sequence } = report.judgePackage;

    expect(samples[0].episode).toBe(1);
    expect(samples[0].role).toContain('1화');
    expect(samples[samples.length - 1].episode).toBe(4);
    expect(samples[samples.length - 1].role).toContain('최종화');
    expect(samples.every((sample) => sample.prose.length > 0)).toBe(true);
    expect(sequence).toHaveLength(4);
    expect(sequence.every((entry) => entry.tail200.length <= 200)).toBe(true);
    expect(sequence[2].tail200.endsWith('정말 끝난 것일까?')).toBe(true);
  });

  // v0.2 — 2글자 이름 변형 위양성 가드. 통제군 16건 위양성("한설"↔"한참")의 원인은
  // 1자 머리(name.slice(0,-1))가 흔한 어절과 충돌하는 것. 2글자 이름은 변형 의심에서 제외한다.
  it('v0.2 — 2글자 로스터 이름은 철자 변형 의심으로 올리지 않는다 (위양성 가드)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-name2-'));
    const path = writeCustomBackup(dir, [
      { episode: 1, title: '한 장면', prose: makeProse(2000, '한설은 걸었다. 한참을 기다렸다. 한참 뒤에야 답이 왔다.') }
    ]);
    const report = runReport(path, ['--roster', '한설']);
    const variants = report.deterministic.roster?.variantSuspicions ?? [];
    // "한참"은 머리 "한"만 겹치는 흔한 어절 — 2글자 이름이므로 의심에서 빠진다
    expect(variants).toHaveLength(0);
  });

  // v0.2 — 3글자 이상 이름은 종전대로 변형 의심을 유지한다(가드가 진짜 신호를 죽이지 않는지)
  it('v0.2 — 3글자 이름의 변형 의심은 가드 이후에도 유지된다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-name3-'));
    const report = runReport(writeBackupFormat1(dir), ['--roster', '강이현']);
    const variants = report.deterministic.roster?.variantSuspicions ?? [];
    expect(variants.some((entry) => entry.variant === '강이헌')).toBe(true);
  });

  // v0.2 — U1 제목 반복 신호. 실험군 중후반 제목이 같은 템플릿("새 소품+첫소리")으로 반복됐다.
  // 인접 제목이 의미 토큰(2자 이상)을 공유하면 repeatsPrevious 로 표시하고 반복률을 낸다.
  it('v0.2 — 제목이 같은 토큰을 반복하면 제목 반복 신호로 잡는다 (U1)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-titles-'));
    const path = writeCustomBackup(dir, [
      { episode: 1, title: '오른편으로 돌아가는 종이', prose: makeProse(2000, '시작.') },
      { episode: 2, title: '오른편의 첫 날짜', prose: makeProse(2000, '둘.') },
      { episode: 3, title: '지워진 오른편', prose: makeProse(2000, '셋.') },
      { episode: 4, title: '비어 있는 오른편', prose: makeProse(2000, '넷.') }
    ]);
    const report = runReport(path);
    const titles = report.deterministic.titles;
    // 2~4화는 모두 직전까지의 제목과 "오른편" 토큰을 공유 → 반복으로 표시
    expect(titles.perEpisode.filter((entry) => entry.repeatsPrevious)).toHaveLength(3);
    expect(titles.perEpisode[1].sharedTokens).toContain('오른편');
    expect(titles.repetitionRate).toBeCloseTo(0.75);
  });

  // v0.2 — 제목이 매번 다르면 반복 신호가 0
  it('v0.2 — 서로 다른 제목은 반복 신호가 없다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-titles0-'));
    const path = writeCustomBackup(dir, [
      { episode: 1, title: '철거 전야', prose: makeProse(2000, '하나.') },
      { episode: 2, title: '탈의실의 이름표', prose: makeProse(2000, '둘.') },
      { episode: 3, title: '감시를 켜는 밤', prose: makeProse(2000, '셋.') }
    ]);
    const report = runReport(path);
    expect(report.deterministic.titles.repetitionRate).toBeCloseTo(0);
  });

  // v0.2 — 말미 후크 신호 사전 확장(문학적 후크를 놓치던 저점 보완). 새 신호가 감지된다.
  it('v0.2 — 확장된 말미 후크 신호(느낌표·반전어)를 감지한다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-hook2-'));
    const path = writeCustomBackup(dir, [
      { episode: 1, title: '느낌표', prose: makeProse(2000, '그는 문을 열었다. 거기 그가 서 있었다!') },
      { episode: 2, title: '반전', prose: makeProse(2000, '하지만 그것은 그의 착각이었다.') }
    ]);
    const report = runReport(path);
    const hooks = report.deterministic.hooks.perEpisode;
    expect(hooks[0].hasHook).toBe(true);
    expect(hooks[0].signals).toContain('느낌표');
    expect(hooks[1].hasHook).toBe(true);
    expect(hooks[1].signals).toContain('하지만');
  });

  it('prints a human-readable summary to stdout when --out is omitted', () => {
    const dir = mkdtempSync(join(tmpdir(), 'storyscore-stdout-'));
    const inputPath = writeBackupFormat1(dir);
    const result = spawnSync('node', [cliPath, '--input', inputPath], { encoding: 'utf8' });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('STORYSCORE_V0_2');
    expect(result.stdout).toContain('형식 규율');
    expect(result.stdout).toContain('후크');
  });

  it('fails fast with a usage message when --input is missing', () => {
    const result = spawnSync('node', [cliPath], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('--input');
  });
});
