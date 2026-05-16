#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
      memoryCandidates: [
        {
          id: 'mock-memory-plot',
          owner: 'plot',
          status: 'pending',
          statement: 'mock 검토 대상의 중심 사건은 사용자 승인 전까지 canon이 아니라 pending 후보로 둡니다.',
          sourceAgentId: 'showrunner',
          targetPath: 'reviews/pending/plot-candidates.json',
          rationale: '검토 결과는 먼저 승인 대기에 저장하고, 사용자가 승인한 후보만 memory bank에 반영합니다.'
        },
        {
          id: 'mock-memory-voice',
          owner: 'voice',
          status: 'pending',
          statement: '사용자 직접 편집 문장은 다음 문체 검토의 우선 증거로 표시합니다.',
          sourceAgentId: 'voice-curator',
          targetPath: 'reviews/pending/voice-candidates.json',
          rationale: '사용자의 수정은 문체 취향을 보존하는 가장 강한 신호입니다.'
        }
      ],
      nextActions: ['실제 호출 전 review scale을 선택하세요.'],
      approvalRequiredBeforeSync: true
    };

    const pendingReviewPath = writePendingReviewFile(outDir, provider, scale, result);

    if (!dryRun) {
      writeRawProviderFile(outDir, provider, scale, JSON.stringify(result, null, 2));
    }

    printJson({
      ...result,
      pendingReviewPath
    });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--max-budget-usd', '0.25', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  if (!dryRun) {
    const providerResult = runProvider(commandPreview);
    const rawOutput = providerResult.stdout || providerResult.stderr;
    const payload = normalizeProviderOutput(rawOutput, {
      provider,
      scale,
      mode: 'review',
      projectTitle: 'Story X project'
    });
    payload.status = providerResult.status === 0 ? 'complete' : 'failed';
    payload.exitCode = providerResult.status;
    payload.stdout = providerResult.stdout;
    payload.stderr = providerResult.stderr;
    if (providerResult.status !== 0) {
      payload.nextActions = ['provider stderr를 확인하고 doctor 또는 dry-run으로 명령을 점검하세요.', ...payload.nextActions];
    }
    const pendingReviewPath = writePendingReviewFile(outDir, provider, scale, payload);
    const rawProviderOutputPath = writeRawProviderFile(outDir, provider, scale, rawOutput);

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

if (command === 'draft') {
  const provider = readFlag(args, '--provider', 'mock');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const freewrite = readFlag(args, '--freewrite', '');
  const title = readFlag(args, '--title', '');
  const outDir = readFlag(args, '--out-dir', join(process.cwd(), '.storyx-runs'));
  const budget = readFlag(args, '--max-budget-usd', '0.5');
  const dryRun = args.includes('--dry-run');
  const prompt = buildDraftPrompt({ medium, format, freewrite, title });

  if (provider === 'mock') {
    const result = {
      provider,
      medium,
      format,
      mode: 'draft',
      generatedAt: new Date().toISOString(),
      title: title || '샘플 1화',
      hook: 'mock 후크 — 실제 생성은 --provider claude로 실행하세요.',
      outline: ['mock 장면 비트 1', 'mock 장면 비트 2'],
      prose: 'mock 초안입니다. 실제 claude 호출 없이 만든 자리표시 텍스트라 작품 평가에는 쓰지 마세요.',
      newCanonFacts: [],
      approvalRequiredBeforeSync: true
    };
    const draftPath = writeDraftFile(outDir, provider, result);
    printJson({ ...result, draftPath });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--max-budget-usd', budget, prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  if (!dryRun) {
    const providerResult = runProvider(commandPreview);
    const rawOutput = providerResult.stdout || providerResult.stderr;
    const payload = normalizeDraftOutput(rawOutput, { provider, medium, format, title });
    payload.status = providerResult.status === 0 ? 'complete' : 'failed';
    payload.exitCode = providerResult.status;
    if (providerResult.status !== 0) {
      payload.warning = 'provider 호출이 실패했습니다. doctor 또는 dry-run으로 명령을 점검하세요.';
    }
    const draftPath = writeDraftFile(outDir, provider, payload);
    const rawProviderOutputPath = writeRawDraftFile(outDir, provider, rawOutput);
    printJson({ ...payload, draftPath, rawProviderOutputPath, approvalRequiredBeforeSync: true });
    process.exit(providerResult.status === 0 ? 0 : 1);
  }

  printJson({
    provider,
    medium,
    format,
    dryRun,
    commandPreview,
    draftTarget: join(outDir, 'drafts'),
    approvalRequiredBeforeSync: true,
    warning: 'Actual Claude/Codex runs spend tokens. Remove --dry-run only after confirming medium, format, and freewrite.'
  });
  process.exit(0);
}

if (command === 'normalize-provider-output') {
  const provider = readFlag(args, '--provider', 'claude');
  const scale = readFlag(args, '--scale', 'small');
  const mode = readFlag(args, '--mode', 'review');
  const rawFile = readFlag(args, '--raw-file', '');
  const outDir = readFlag(args, '--out-dir', join(process.cwd(), '.storyx-runs'));

  if (!rawFile) {
    printJson({
      error: 'Missing --raw-file',
      usage: 'npm run storyx -- normalize-provider-output --provider claude --scale small --raw-file ./raw.txt'
    });
    process.exit(1);
  }

  const rawOutput = readFileSync(rawFile, 'utf8');
  const payload = normalizeProviderOutput(rawOutput, {
    provider,
    scale,
    mode,
    projectTitle: 'Story X project'
  });
  const pendingReviewPath = writePendingReviewFile(outDir, provider, scale, payload);
  const rawProviderOutputPath = writeRawProviderFile(outDir, provider, scale, rawOutput);

  printJson({
    ...payload,
    pendingReviewPath,
    rawProviderOutputPath
  });
  process.exit(0);
}

printJson({
  usage: [
    'npm run storyx -- doctor',
    'npm run storyx -- draft --provider mock --medium novel --format long-novel --dry-run',
    'npm run storyx -- draft --provider claude --medium novel --format long-novel --freewrite "쓰고 싶은 이야기" --dry-run',
    'npm run storyx -- review --provider mock --scale small --dry-run',
    'npm run storyx -- review --provider claude --scale small --dry-run',
    'npm run storyx -- normalize-provider-output --provider claude --scale small --raw-file ./provider-output.txt'
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

function buildDraftPrompt({ medium, format, freewrite, title }) {
  return [
    'Story X 회차 초안 생성 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    title ? `작품 제목: ${title}` : '작품 제목: 미정',
    '',
    '## 작가 자유 서술 (작가가 직접 적은, 쓰고 싶은 이야기)',
    freewrite || '(자유 서술 없음 — 매체와 포맷만으로 1화의 출발점을 제안하세요.)',
    '',
    '## 역할',
    '당신은 Story X의 작품 생성 엔진입니다. 쇼러너(회차 약속과 클리프행어), 캐릭터 큐레이터(욕망·상처·말투·관계), 배경 설계자(세계 규칙과 비용), 연속성 감수자(캐논 일관성)의 시선을 모두 적용해 1화 초안을 만듭니다.',
    '',
    '## 규칙',
    '- 한국어로 작성하고, 작가 자유 서술의 어휘와 의도를 존중합니다.',
    '- essay 매체이면 작가가 자유 서술에 적지 않은 사실(인물의 직업·나이·장소 등)을 발명하지 마세요. 빈 곳은 비워 둡니다.',
    '- 한 회차는 하나의 질문에 답하고 더 날카로운 질문을 엽니다.',
    '- prose는 1500~3000자 분량의 실제 본문입니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "title": "회차 제목",',
    '  "hook": "다음 회차로 이어지는 한 줄 후크",',
    '  "outline": ["장면 비트 1", "장면 비트 2", "장면 비트 3"],',
    '  "prose": "회차 본문",',
    '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 회차에서 확정된 새 사실" }]',
    '}'
  ].join('\n');
}

function normalizeDraftOutput(rawOutput, options) {
  const parsed = parseProviderJson(rawOutput);

  return {
    provider: options.provider,
    medium: options.medium,
    format: options.format,
    mode: 'draft',
    generatedAt: new Date().toISOString(),
    title: readString(parsed?.title) || options.title || '제목 미정 1화',
    hook: readString(parsed?.hook) || '',
    outline: normalizeStringList(parsed?.outline),
    prose: readString(parsed?.prose) || summarizeRawProviderOutput(rawOutput, options.title || 'Story X draft'),
    newCanonFacts: normalizeDraftCanonFacts(parsed?.newCanonFacts),
    approvalRequiredBeforeSync: true
  };
}

function normalizeDraftCanonFacts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((fact) => ({
      owner: normalizeMemoryOwner(readString(fact.owner)),
      statement: readString(fact.statement) || readString(fact.note)
    }))
    .filter((fact) => fact.statement);
}

function writeDraftFile(outDir, provider, payload) {
  const dir = join(outDir, 'drafts');
  const path = join(dir, `${timestamp()}-${provider}-draft.json`);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

function writeRawDraftFile(outDir, provider, content) {
  const dir = join(outDir, 'drafts', 'provider-raw');
  const path = join(dir, `${timestamp()}-${provider}-draft.txt`);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content || '');
  return path;
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

function normalizeProviderOutput(rawOutput, options) {
  const parsed = parseProviderJson(rawOutput);
  const summary = readString(parsed?.summary) || summarizeRawProviderOutput(rawOutput, options.projectTitle);

  return {
    provider: options.provider,
    mode: options.mode,
    scale: options.scale,
    generatedAt: new Date().toISOString(),
    summary,
    agentReports: normalizeAgentReports(parsed?.agentReports),
    memoryCandidates: normalizeMemoryCandidates(parsed?.memoryCandidates),
    nextActions: normalizeStringList(parsed?.nextActions),
    pendingReviewTarget: 'reviews/pending',
    approvalRequiredBeforeSync: true
  };
}

function parseProviderJson(rawOutput) {
  const trimmed = rawOutput.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidates = [fencedJson, trimmed].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate);
      return isRecord(value) ? value : null;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function normalizeAgentReports(value) {
  if (!Array.isArray(value)) {
    return [
      {
        agentId: 'continuity-editor',
        label: '연속성 감수자',
        status: 'revise',
        note: '구조화되지 않은 provider 출력을 원문 검토 대상으로 보류했습니다.',
        evidence: ['provider-raw']
      }
    ];
  }

  return value.filter(isRecord).map((report, index) => {
    const agentId = normalizeAgentId(readString(report.agentId) || readString(report.agent), index);

    return {
      agentId,
      label: readString(report.label) || getAgentLabel(agentId),
      status: normalizeReviewStatus(readString(report.status)),
      note: readString(report.note) || readString(report.output) || 'provider 검토 의견이 비어 있습니다.',
      evidence: normalizeStringList(report.evidence)
    };
  });
}

function normalizeMemoryCandidates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((candidate, index) => {
    const owner = normalizeMemoryOwner(readString(candidate.owner));
    const sourceAgentId = normalizeAgentId(readString(candidate.sourceAgentId) || readString(candidate.agentId), index);

    return {
      id: readString(candidate.id) || `provider-memory-${String(index + 1).padStart(2, '0')}`,
      owner,
      status: normalizeMemoryCandidateStatus(readString(candidate.status)),
      statement: readString(candidate.statement) || readString(candidate.note) || '내용이 비어 있는 provider memory candidate',
      sourceAgentId,
      targetPath: readString(candidate.targetPath) || `reviews/pending/${owner}-candidates.json`,
      rationale: readString(candidate.rationale) || 'provider가 제안한 후보이며 사용자 승인 전까지 sync하지 않습니다.'
    };
  });
}

function normalizeAgentId(value, index = 0) {
  const knownAgentIds = [
    'showrunner',
    'character-custodian',
    'world-keeper',
    'genre-stylist',
    'continuity-editor',
    'essay-interviewer',
    'voice-curator',
    'audio-narration-director',
    'education-video-architect',
    'sound-music-agent',
    'storyboard-agent',
    'speech-bubble-agent',
    'keyframe-art-director',
    'da-vinci',
    'frame-assembly-agent'
  ];

  return knownAgentIds.includes(value) ? value : knownAgentIds[index % knownAgentIds.length];
}

function normalizeReviewStatus(value) {
  if (value === 'pass' || value === 'revise' || value === 'blocked') {
    return value;
  }

  if (value === '수정' || value === 'revision') {
    return 'revise';
  }

  if (value === '차단' || value === 'block') {
    return 'blocked';
  }

  return 'pass';
}

function normalizeMemoryCandidateStatus(value) {
  if (value === 'pending' || value === 'revision' || value === 'blocked' || value === 'reveal') {
    return value;
  }

  if (value === '수정' || value === 'revise') {
    return 'revision';
  }

  if (value === '차단' || value === 'block') {
    return 'blocked';
  }

  return 'pending';
}

function normalizeMemoryOwner(value) {
  return ['character', 'world', 'plot', 'voice', 'visual', 'audio'].includes(value) ? value : 'plot';
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => readString(item)).filter(Boolean);
  }

  const single = readString(value);
  return single ? [single] : [];
}

function summarizeRawProviderOutput(rawOutput, projectTitle) {
  const normalized = rawOutput.replace(/\s+/g, ' ').trim();
  const excerpt = normalized.slice(0, 220) || 'provider 출력이 비어 있습니다.';

  return `${projectTitle} provider raw output: ${excerpt}`;
}

function getAgentLabel(agentId) {
  const labels = {
    showrunner: '쇼러너',
    'character-custodian': '캐릭터 큐레이터',
    'world-keeper': '배경 설계자',
    'genre-stylist': '장르 스타일리스트',
    'continuity-editor': '연속성 감수자',
    'essay-interviewer': '에세이 인터뷰어',
    'voice-curator': '문체 큐레이터',
    'audio-narration-director': '오디오 연출가',
    'education-video-architect': '교육영상 설계자',
    'sound-music-agent': '사운드 뮤직 에이전트',
    'storyboard-agent': '웹툰 연출가',
    'speech-bubble-agent': '말풍선 연출가',
    'keyframe-art-director': '원화/키프레임 감독',
    'da-vinci': '다빈치',
    'frame-assembly-agent': '프레임 조립가'
  };

  return labels[agentId] ?? agentId;
}

function readString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
