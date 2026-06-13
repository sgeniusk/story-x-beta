#!/usr/bin/env node
// StoryScore v0.1 — 작품 완성도 공식 점수 CLI. 입력(백업 JSON 2형식·md 디렉토리)을 정규화하고 결정론 점수와 심사용 패키지를 만든다.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = 'STORYSCORE_V0_2';
const TARGET_RANGE = { min: 1800, max: 2700 };
const FORMAT_DISCIPLINE_MAX = 10;
const HOOK_DETERMINISM_MAX = 7;
// 말미 후크 전환 신호 — 마지막 200자 안에서 찾는다. v0.2에서 문학적 후크(반전어)를 추가해 저점을 보완.
const HOOK_TEXT_SIGNALS = ['그때', '순간', '갑자기', '하지만', '그러나', '그런데'];
// v0.2 — 제목 반복 토큰 판정에서 제외할 기능어(조사·관형어). 의미 토큰만 공유로 센다.
const TITLE_STOPWORDS = new Set(['그리고', '그러나', '하지만', '그런데', '다시', '아직', '이제']);

const args = process.argv.slice(2);
const inputPath = readFlag(args, '--input', '');
const rosterRaw = readFlag(args, '--roster', '');
const outPath = readFlag(args, '--out', '');

if (!inputPath) {
  process.stderr.write(
    [
      'StoryScore v0.1 — 사용법',
      '  node tools/storyscore.mjs --input <백업.json | md 디렉토리> [--roster "이름1,이름2"] [--out report.json]',
      '',
      '--input 은 필수입니다. Story X 백업 JSON(두 형식) 또는 chNN.md 디렉토리를 받습니다.'
    ].join('\n') + '\n'
  );
  process.exit(1);
}

let normalized;
try {
  normalized = normalizeInput(inputPath);
} catch (error) {
  process.stderr.write(`입력 정규화 실패: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

const { episodes, harnessDiagnostics } = normalized;

if (episodes.length === 0) {
  process.stderr.write('회차를 한 편도 찾지 못했습니다. 입력 경로와 형식을 확인하세요.\n');
  process.exit(1);
}

const rosterNames = rosterRaw
  ? rosterRaw.split(',').map((name) => name.trim()).filter(Boolean)
  : [];

const lengths = analyzeLengths(episodes);
const hooks = analyzeHooks(episodes);
const titles = analyzeTitles(episodes);
const roster = rosterNames.length > 0 ? analyzeRoster(episodes, rosterNames) : null;
const scores = {
  formatDiscipline: { max: FORMAT_DISCIPLINE_MAX, value: roundScore(lengths.fitRate * FORMAT_DISCIPLINE_MAX) },
  hookDeterminism: { max: HOOK_DETERMINISM_MAX, value: roundScore(hooks.hookRate * HOOK_DETERMINISM_MAX) }
};

const report = {
  version: VERSION,
  generatedAt: new Date().toISOString(),
  input: { path: inputPath, kind: normalized.kind },
  deterministic: {
    episodeCount: episodes.length,
    lengths,
    hooks,
    titles,
    roster,
    scores,
    // 하네스 메타(canonFacts·stakesLedger)는 점수가 아니라 부가 진단 — 통제군 입력에는 없어 점수에 쓰면 비대칭이다
    harnessDiagnostics
  },
  judgePackage: buildJudgePackage(episodes)
};

if (outPath) {
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  process.stdout.write(`${VERSION} 보고서를 저장했습니다 → ${outPath}\n`);
} else {
  process.stdout.write(renderSummary(report));
}
process.exit(0);

// ---------- 입력 정규화 ----------

// 세 입력을 모두 {episode, title, prose}[] 로 정규화한다.
// (a) 형식1 — {_meta, dump: {project: "<stringified>"}}
// (b) 형식2 — 파일 전체가 JSON 문자열(이중 인코딩), 파싱하면 {"serial-story-studio/project": "<stringified>", ...} 키맵
// (c) chNN.md 디렉토리 — 첫 줄 "# N화. 제목"
function normalizeInput(path) {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    return { kind: 'markdown-dir', episodes: readMarkdownDir(path), harnessDiagnostics: null };
  }

  const text = readFileSync(path, 'utf8');
  let parsed = JSON.parse(text);

  // 형식2 — 한 번 파싱하면 문자열이 나온다
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }

  if (!isRecord(parsed)) {
    throw new Error('알 수 없는 백업 형식 — JSON 최상위가 객체가 아닙니다.');
  }

  let project = null;
  let kind = 'backup-json';

  if (isRecord(parsed.dump) && typeof parsed.dump.project === 'string') {
    // 형식1 — dump.project 가 문자열화된 프로젝트
    project = JSON.parse(parsed.dump.project);
    kind = 'backup-dump';
  } else {
    // 형식2 키맵 — "<prefix>/project" 키를 찾는다
    const projectKey = Object.keys(parsed).find((key) => key.endsWith('/project'));
    if (projectKey && typeof parsed[projectKey] === 'string') {
      project = JSON.parse(parsed[projectKey]);
      kind = 'backup-keymap';
    } else if (Array.isArray(parsed.chapters)) {
      // 관용 — 프로젝트 객체가 그대로 들어온 경우
      project = parsed;
      kind = 'project-json';
    }
  }

  if (!isRecord(project) || !Array.isArray(project.chapters)) {
    throw new Error('백업에서 chapters 배열을 찾지 못했습니다.');
  }

  const episodes = project.chapters
    .filter(isRecord)
    .map((chapter, index) => ({
      episode: typeof chapter.episode === 'number' ? chapter.episode : index + 1,
      title: typeof chapter.title === 'string' ? chapter.title : `${index + 1}화`,
      prose: typeof chapter.prose === 'string' ? chapter.prose.trim() : ''
    }))
    .sort((a, b) => a.episode - b.episode);

  const harnessDiagnostics = {
    canonFactsCount: Array.isArray(project.canonFacts) ? project.canonFacts.length : 0,
    stakesLedgerEntryCount: project.chapters
      .filter(isRecord)
      .reduce((sum, chapter) => sum + (Array.isArray(chapter.stakesLedger) ? chapter.stakesLedger.length : 0), 0)
  };

  return { kind, episodes, harnessDiagnostics };
}

function readMarkdownDir(dirPath) {
  const files = readdirSync(dirPath)
    .filter((name) => /^ch\d+\.md$/i.test(name))
    .sort();

  return files
    .map((name) => {
      const text = readFileSync(join(dirPath, name), 'utf8');
      const lines = text.split('\n');
      const header = lines[0]?.match(/^#\s*(\d+)화[.,]?\s*(.*)$/);
      const fallbackEpisode = Number(name.match(/(\d+)/)?.[1] ?? 0);
      return {
        episode: header ? Number(header[1]) : fallbackEpisode,
        title: header ? header[2].trim() : name.replace(/\.md$/i, ''),
        prose: lines.slice(1).join('\n').trim()
      };
    })
    .sort((a, b) => a.episode - b.episode);
}

// ---------- 결정론 분석 ----------

function analyzeLengths(episodes) {
  const perEpisode = episodes.map((entry) => {
    const chars = entry.prose.length;
    return {
      episode: entry.episode,
      title: entry.title,
      chars,
      inRange: chars >= TARGET_RANGE.min && chars <= TARGET_RANGE.max
    };
  });
  const fitCount = perEpisode.filter((entry) => entry.inRange).length;

  return {
    perEpisode,
    targetRange: { ...TARGET_RANGE },
    averageChars: Math.round(perEpisode.reduce((sum, entry) => sum + entry.chars, 0) / Math.max(1, perEpisode.length)),
    minChars: Math.min(...perEpisode.map((entry) => entry.chars)),
    maxChars: Math.max(...perEpisode.map((entry) => entry.chars)),
    fitRate: roundRate(fitCount / episodes.length)
  };
}

function analyzeHooks(episodes) {
  const perEpisode = episodes.map((entry) => {
    const tail = entry.prose.slice(-200);
    const signals = [];
    if (/[?？]/.test(tail)) signals.push('물음표');
    if (/[!！]/.test(tail)) signals.push('느낌표');
    if (tail.includes('…') || tail.includes('...')) signals.push('말줄임표');
    for (const signal of HOOK_TEXT_SIGNALS) {
      if (tail.includes(signal)) signals.push(signal);
    }
    return { episode: entry.episode, hasHook: signals.length > 0, signals };
  });
  const hookCount = perEpisode.filter((entry) => entry.hasHook).length;

  return { perEpisode, hookRate: roundRate(hookCount / episodes.length) };
}

// 로스터×회차 출현 매트릭스와 철자 변형 의심을 만든다.
// 출현 — 토큰이 로스터 이름으로 시작하면 조사 결합형("강이현은")도 출현으로 센다.
// 의심 — 이름과 머리(L-1자)가 일치하고 L번째 글자만 다른 토큰("강이헌")을 변형 후보로 올린다.
function analyzeRoster(episodes, names) {
  const matrix = episodes.map((entry) => {
    const tokens = entry.prose.match(/[가-힣]+/g) ?? [];
    const counts = {};
    for (const name of names) {
      counts[name] = tokens.filter((token) => token.startsWith(name)).length;
    }
    return { episode: entry.episode, counts };
  });

  const suspicionMap = new Map();
  for (const entry of episodes) {
    const tokens = entry.prose.match(/[가-힣]+/g) ?? [];
    for (const name of names) {
      // v0.2 — 2글자 이름은 머리(1자)가 흔한 어절과 충돌해 위양성을 양산("한설"↔"한참") → 변형 의심에서 제외
      if (name.length < 3) continue;
      const head = name.slice(0, -1);
      for (const token of tokens) {
        if (token.startsWith(name)) continue; // 정상 출현(조사 결합 포함)
        if (token.length < name.length) continue;
        if (!token.startsWith(head)) continue;
        const variant = token.slice(0, name.length);
        if (variant === name) continue;
        const key = `${name}::${variant}`;
        const existing = suspicionMap.get(key) ?? { name, variant, episodes: [], count: 0 };
        if (!existing.episodes.includes(entry.episode)) existing.episodes.push(entry.episode);
        existing.count += 1;
        suspicionMap.set(key, existing);
      }
    }
  }

  return { names, matrix, variantSuspicions: [...suspicionMap.values()] };
}

// v0.2 — U1 제목 반복 신호. 인접 제목이 의미 토큰(2자 이상)의 공통 어간을 공유하면 반복으로 본다.
// 실험군 중후반 제목이 "새 소품+첫소리" 같은 동일 템플릿으로 반복된 것을 결정론으로 포착한다.
// 조사가 붙은 토큰끼리도 잡도록 정확 일치가 아니라 최장 공통 접두(≥2자)로 어간을 비교한다.
function analyzeTitles(episodes) {
  const tokenize = (title) => (String(title).match(/[가-힣]+/g) ?? []).filter((token) => token.length >= 2);
  const seenTokens = [];
  const perEpisode = episodes.map((entry, index) => {
    const tokens = tokenize(entry.title);
    const shared = new Set();
    if (index > 0) {
      for (const token of tokens) {
        for (const previous of seenTokens) {
          const stem = longestCommonPrefix(token, previous);
          if (stem.length >= 2 && !TITLE_STOPWORDS.has(stem)) shared.add(stem);
        }
      }
    }
    seenTokens.push(...tokens);
    return {
      episode: entry.episode,
      title: entry.title,
      repeatsPrevious: shared.size > 0,
      sharedTokens: [...shared]
    };
  });
  const repeatCount = perEpisode.filter((entry) => entry.repeatsPrevious).length;
  return { perEpisode, repetitionRate: roundRate(repeatCount / Math.max(1, episodes.length)) };
}

function longestCommonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return a.slice(0, i);
}

// ---------- 심사용 패키지 ----------

// 표본 — 1화·25%·50%·75%·최종 회차의 전문. 같은 회차로 겹치면 역할 라벨을 합친다.
function buildJudgePackage(episodes) {
  const lastIndex = episodes.length - 1;
  const points = [
    { role: '1화', index: 0 },
    { role: '25%', index: Math.round(lastIndex * 0.25) },
    { role: '50%', index: Math.round(lastIndex * 0.5) },
    { role: '75%', index: Math.round(lastIndex * 0.75) },
    { role: '최종화', index: lastIndex }
  ];

  const byEpisode = new Map();
  for (const point of points) {
    const entry = episodes[point.index];
    const existing = byEpisode.get(entry.episode);
    if (existing) {
      existing.role = `${existing.role}·${point.role}`;
    } else {
      byEpisode.set(entry.episode, {
        episode: entry.episode,
        title: entry.title,
        role: point.role,
        prose: entry.prose
      });
    }
  }

  return {
    samples: [...byEpisode.values()],
    sequence: episodes.map((entry) => ({
      episode: entry.episode,
      title: entry.title,
      tail200: entry.prose.slice(-200)
    }))
  };
}

// ---------- 출력 ----------

function renderSummary(value) {
  const det = value.deterministic;
  const lines = [
    `${value.version} — 결정론 분석 요약`,
    `입력: ${value.input.path} (${value.input.kind})`,
    `회차 수: ${det.episodeCount}`,
    '',
    `분량 — 평균 ${det.lengths.averageChars}자 (${det.lengths.minChars}~${det.lengths.maxChars}자), 목표 ${det.lengths.targetRange.min}~${det.lengths.targetRange.max}자 적합률 ${formatPercent(det.lengths.fitRate)}`,
    `말미 후크 — 후크 회차 비율 ${formatPercent(det.hooks.hookRate)}`,
    `제목 반복 — 직전 제목과 어간을 공유한 회차 비율 ${formatPercent(det.titles.repetitionRate)}`,
    '',
    `형식 규율: ${det.scores.formatDiscipline.value} / ${det.scores.formatDiscipline.max}`,
    `후크 결정론: ${det.scores.hookDeterminism.value} / ${det.scores.hookDeterminism.max}`
  ];

  if (det.roster) {
    lines.push('', `로스터: ${det.roster.names.join(', ')}`);
    if (det.roster.variantSuspicions.length > 0) {
      for (const suspicion of det.roster.variantSuspicions) {
        lines.push(`  철자 변형 의심 — ${suspicion.name} → ${suspicion.variant} (${suspicion.episodes.map((n) => `${n}화`).join(', ')}, ${suspicion.count}회)`);
      }
    } else {
      lines.push('  철자 변형 의심 없음');
    }
  }

  if (det.harnessDiagnostics) {
    lines.push(
      '',
      `부가 진단(점수 아님) — canonFacts ${det.harnessDiagnostics.canonFactsCount}개, stakesLedger 항목 ${det.harnessDiagnostics.stakesLedgerEntryCount}개`
    );
  }

  lines.push('', '나머지 축(연속성·페이오프·프로즈·연재성 심사분)은 .claude/skills/story-score 루브릭으로 심사합니다. --out report.json 으로 심사용 패키지를 저장하세요.');
  return lines.join('\n') + '\n';
}

// ---------- 유틸 ----------

function readFlag(values, flag, fallback) {
  const index = values.indexOf(flag);
  return index >= 0 && values[index + 1] ? values[index + 1] : fallback;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function roundRate(value) {
  return Math.round(value * 1000) / 1000;
}

function roundScore(value) {
  return Math.round(value * 10) / 10;
}

function formatPercent(rate) {
  return `${Math.round(rate * 1000) / 10}%`;
}
