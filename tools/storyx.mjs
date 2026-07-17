#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [, , command = 'help', ...args] = process.argv;
const providerCommandHints = ['claude --print', 'codex exec'];
void providerCommandHints;

// 연재형 포맷 — 회차(N화)가 누적되는 형식. src/lib/projectBlueprint.ts 의 serialFormats 와 같은 목록.
// 나머지(단편·단독 완결형)는 한 편으로 완결되며, 인터뷰·초안 프롬프트가 회차를 가정하지 않는다.
const SERIAL_FORMATS = new Set(['long-novel', 'medium-novel', 'essay-series', 'serial-webtoon', 'insta-toon']);

function isSerialFormat(format) {
  return SERIAL_FORMATS.has(format);
}

// 검토 에이전트 id → .claude/agents/ 페르소나 파일명
const agentFileMap = {
  showrunner: 'serial-showrunner',
  'character-custodian': 'character-custodian',
  'world-keeper': 'world-keeper',
  'genre-stylist': 'genre-stylist',
  'continuity-editor': 'continuity-editor',
  'voice-curator': 'voice-curator',
  'essay-interviewer': 'essay-interviewer',
  'storyboard-agent': 'storyboard-agent',
  'speech-bubble-agent': 'speech-bubble-agent',
  'keyframe-art-director': 'keyframe-art-director',
  'da-vinci': 'davinci-image-agent',
  'frame-assembly-agent': 'frame-assembly-agent',
  // M4 신설 스튜디오 단계 6명
  'canon-librarian': 'canon-librarian',
  'timeline-keeper': 'timeline-keeper',
  'bible-curator': 'bible-curator',
  'critic-reviewer': 'critic-reviewer',
  'essay-curator': 'essay-curator',
  'memory-evolution-keeper': 'memory-evolution-keeper',
  // M4 신설 랜딩 1명
  'studio-architect': 'studio-architect',
  // M4 신설 브릿지 1명
  'interview-curator': 'interview-curator',
  // M4 신설 출판 4명 — review-agent 흐름으로 호출 가능
  'book-designer': 'book-designer',
  'pr-specialist': 'pr-specialist',
  'platform-curator': 'platform-curator',
  'business-strategist': 'business-strategist'
};

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
  const target = readFlag(args, '--target', '');
  const medium = readFlag(args, '--medium', 'novel');
  const context = readFlag(args, '--context', '');
  const outDir = readFlag(args, '--out-dir', join(process.cwd(), '.storyx-runs'));
  const dryRun = args.includes('--dry-run');
  const prompt = buildReviewPrompt(scale, target, medium, context);

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
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  if (!dryRun) {
    const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
    const isError = looksLikeProviderError(rawOutput, providerResult);
    const payload = normalizeProviderOutput(isError ? '' : rawOutput, {
      provider,
      scale,
      mode: 'review',
      projectTitle: 'Story X project'
    });
    payload.status = isError ? 'failed' : (providerResult.status === 0 ? 'complete' : 'failed');
    payload.exitCode = providerResult.status;
    payload.stdout = providerResult.stdout;
    payload.stderr = providerResult.stderr;
    if (isError) {
      const retryNote = retried ? ' (재시도 포함)' : '';
      payload.nextActions = [
        `provider 호출이 실패${retryNote}했습니다. stderr를 확인하고 doctor 또는 dry-run으로 명령을 점검하세요.`,
        ...payload.nextActions
      ];
    }
    const pendingReviewPath = writePendingReviewFile(outDir, provider, scale, payload);
    const rawProviderOutputPath = writeRawProviderFile(outDir, provider, scale, rawOutput);

    printJson({
      ...payload,
      pendingReviewPath,
      rawProviderOutputPath,
      approvalRequiredBeforeSync: true
    });
    process.exit(isError ? 1 : 0);
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

if (command === 'review-agent') {
  const provider = readFlag(args, '--provider', 'mock');
  const agentId = readFlag(args, '--agent', 'showrunner');
  const target = readFlag(args, '--target', '');
  const medium = readFlag(args, '--medium', 'novel');
  const context = readFlag(args, '--context', '');
  const persona = loadAgentPersona(agentId);
  // 정체·흡인력 측정 신호 — 있으면 검토 프롬프트에 주입(흡인력 게이트 2026-07-06). 오형식은 무시.
  const payoffStatusRaw = readFlag(args, '--payoff-status', '');
  let payoffStatus;
  try {
    const parsedPayoff = payoffStatusRaw ? JSON.parse(payoffStatusRaw) : null;
    if (parsedPayoff && typeof parsedPayoff.deferredStreak === 'number') {
      payoffStatus = {
        isStalled: Boolean(parsedPayoff.isStalled),
        deferredStreak: parsedPayoff.deferredStreak,
        openPromises: typeof parsedPayoff.openPromises === 'number' ? parsedPayoff.openPromises : 0,
        paidPromises: typeof parsedPayoff.paidPromises === 'number' ? parsedPayoff.paidPromises : 0
      };
    }
  } catch { /* 오형식 플래그는 무시 */ }
  // 작품 헌장 예산 — 있으면 길 잃음 점검·예산 초과 block 을 검토 프롬프트에 주입(A-5). 오형식은 무시.
  const contractStatusRaw = readFlag(args, '--contract-status', '');
  let contractStatus;
  try {
    const parsed = contractStatusRaw ? JSON.parse(contractStatusRaw) : null;
    if (parsed && typeof parsed.remaining === 'number') {
      contractStatus = {
        remaining: parsed.remaining,
        unpaidCount: typeof parsed.unpaidCount === 'number' ? parsed.unpaidCount : 0,
        overBudget: Boolean(parsed.overBudget),
        finalStretch: Boolean(parsed.finalStretch)
      };
    }
  } catch { /* 오형식 플래그는 무시 */ }
  const prompt = buildAgentReviewPrompt({ agentId, persona, target, medium, context, payoffStatus, contractStatus });

  if (provider === 'mock') {
    printJson({
      provider,
      agentId,
      mode: 'review-agent',
      status: 'complete',
      verdict: 'pass',
      note: 'mock 단일 에이전트 검토',
      strengths: ['mock 검토: 검토 기준이 또렷하게 잡혀 있습니다.', 'mock 검토: 다음 회차로 이어지는 약속이 살아 있습니다.'],
      issues: ['mock 검토: 일부 장면의 압력을 한 단계 더 끌어올릴 여지가 있습니다.'],
      evidence: [],
      memoryCandidates: []
    });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);

  printJson({
    provider,
    agentId,
    mode: 'review-agent',
    status: isError ? 'failed' : (providerResult.status === 0 ? 'complete' : 'failed'),
    exitCode: providerResult.status,
    verdict: readString(parsed?.status),
    note: readString(parsed?.note),
    strengths: normalizeStringList(parsed?.strengths),
    issues: normalizeStringList(parsed?.issues),
    evidence: normalizeStringList(parsed?.evidence),
    memoryCandidates: Array.isArray(parsed?.memoryCandidates) ? parsed.memoryCandidates : [],
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'dive-chat') {
  const provider = readFlag(args, '--provider', 'mock');
  const characterCard = readFlag(args, '--character', '');
  const scene = readFlag(args, '--scene', '');
  const context = readFlag(args, '--context', '');
  const dialogue = readFlag(args, '--dialogue', '');
  const userTurn = readFlag(args, '--query', '');
  const arc = readFlag(args, '--arc', '');
  const prompt = [
    '당신은 이 이야기의 쇼러너입니다. 사용자("나")는 주인공이고, 당신은 현재 장면 안에서 세계를 서술하고 그 자리에 있는 인물을 연기합니다.',
    '서술(세계·상황·분위기)은 평문 줄로, 인물의 말은 "이름: 대사" 줄로, 행동·표정은 *별표*로 쓰세요. 한 응답에 여러 줄을 섞어도 됩니다.',
    '사용자가 한 행동·말에 세계와 인물이 반응하게 하세요. 현재 장면에 없는 인물은 등장시키지 말고, 사용자("나")의 말과 행동을 대신 지어내지 마세요. 3인칭 전지적 요약·메타 설명은 금지합니다.',
    '',
    '## 현재 장면',
    scene || '(장면 미설정 — 시작점 캐릭터와의 일상 대화로 진행)',
    '',
    '## 캐릭터',
    characterCard || '(미정)',
    '',
    '## 기억(이미 확정된 사실 — 반드시 일관되게 반영)',
    context || '(아직 없음)',
    '',
    '## 최근 대화',
    dialogue || '(처음 — 먼저 자연스럽게 말을 거세요)',
    '',
    `## 나의 말\n${userTurn}`,
    '',
    '이 이야기의 큰 그림(arc)을 들고 끌고 가세요. 응답을 arc.nextBeat 방향으로 한 걸음 진전시키고, tension이 낮거나 이야기가 정체되면 전개(단서·사건·전환)를 미세요. 이미 잡힌 dramaticQuestion은 웬만하면 유지하세요. arc가 비었으면 장면·기억에서 새로 잡으세요.',
    '',
    '## 이야기 아크 (JSON)',
    arc || '(아직 없음 — 새로 잡으세요)',
    '',
    '응답 끝에, 주인공("나")이 이 장면에서 자연스럽게 취할 만한 행동·말 2~3개를 choices 배열로 제안하세요(짧은 동사구). 사용자는 이를 탭하거나 무시하고 자유롭게 입력할 수 있습니다.',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "reply": "서술 줄 + 인물 \\"이름: 대사\\" 줄 (행동은 *별표*). 2~5줄.", "choices": ["행동 2~3개"], "arc": { "dramaticQuestion": "이 이야기의 핵심 질문", "tension": 0, "nextBeat": "다음에 밀어붙일 전개" } }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({ provider, mode: 'dive-chat', status: 'complete', reply: '…그래, 듣고 있어.', choices: ['문 안으로 들어간다', '도윤에게 무슨 일인지 묻는다'], arc: { dramaticQuestion: '도윤의 가족은 정말 외계인인가?', tension: 30, nextBeat: '집 안에서 결정적 단서가 드러난다' } });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'haiku', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider,
    mode: 'dive-chat',
    status: isError ? 'failed' : 'complete',
    reply: readString(parsed?.reply) || '…',
    choices: normalizeStringList(parsed?.choices),
    arc: (() => {
      const a = parsed?.arc;
      if (!a || typeof a !== 'object') return undefined;
      return {
        dramaticQuestion: readString(a.dramaticQuestion),
        tension: typeof a.tension === 'number' ? Math.max(0, Math.min(100, Math.round(a.tension))) : 0,
        nextBeat: readString(a.nextBeat)
      };
    })(),
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'dive-condense') {
  const provider = readFlag(args, '--provider', 'mock');
  const characterCard = readFlag(args, '--character', '');
  const scene = readFlag(args, '--scene', '');
  const context = readFlag(args, '--context', '');
  const transcript = readFlag(args, '--transcript', '');
  const episode = readFlag(args, '--episode', '1');
  const arc = readFlag(args, '--arc', '');
  const dryRun = args.includes('--dry-run');
  const prompt = buildDiveCondensePrompt({ character: characterCard, scene, context, transcript, arc });
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  if (dryRun) {
    printJson({ provider, mode: 'dive-condense', dryRun: true, prompt, commandPreview, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }

  if (provider === 'mock') {
    printJson({
      provider, mode: 'dive-condense', status: 'complete',
      title: `${episode}화 — 응결`, hook: '...', outline: ['mock 비트'],
      beats: [{ label: '도입', summary: 'mock', tension: 0 }],
      prose: 'mock 3인칭 회차 본문.',
      newCanonFacts: [{ owner: 'character', statement: 'mock 캐논' }]
    });
    process.exit(0);
  }
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider, mode: 'dive-condense',
    status: isError ? 'failed' : 'complete',
    title: readString(parsed?.title) || `${episode}화`,
    hook: readString(parsed?.hook),
    outline: normalizeStringList(parsed?.outline),
    beats: Array.isArray(parsed?.beats) ? parsed.beats : [],
    prose: readString(parsed?.prose),
    newCanonFacts: Array.isArray(parsed?.newCanonFacts) ? parsed.newCanonFacts : [],
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'dive-showrunner') {
  const provider = readFlag(args, '--provider', 'mock');
  const scene = readFlag(args, '--scene', '');
  const context = readFlag(args, '--context', '');
  const directive = readFlag(args, '--directive', '');
  const prompt = [
    '당신은 이 이야기의 쇼러너(연출자·신)입니다. 사용자는 이야기 위에서 당신에게 직접 지시합니다.',
    '지시에 연출자 목소리로 짧게 응답하고, 지시를 반영해 "현재 장면"을 새로 제안하세요(장면을 바꿀 필요가 없으면 sceneUpdate는 빈 문자열).',
    'sceneUpdate는 장소·상황·등장인물·사용자의 목적을 담은 새 현재 장면 전체입니다(누적이 아니라 교체본).',
    '',
    '## 현재 장면',
    scene || '(아직 없음)',
    '',
    '## 이야기 기억(캐논 — 모순 금지)',
    context || '(아직 없음)',
    '',
    `## 연출자의 지시\n${directive}`,
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "reply": "연출자에게 하는 짧은 응답", "sceneUpdate": "바뀐 현재 장면 전체 또는 빈 문자열" }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({ provider, mode: 'dive-showrunner', status: 'complete', reply: '뜻대로.', sceneUpdate: scene ? `${scene} (비가 내리기 시작한다)` : '' });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider,
    mode: 'dive-showrunner',
    status: isError ? 'failed' : 'complete',
    reply: readString(parsed?.reply) || '…',
    sceneUpdate: readString(parsed?.sceneUpdate),
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'dive-propose') {
  const provider = readFlag(args, '--provider', 'mock');
  const topic = readFlag(args, '--topic', '');
  const novelty = readFlag(args, '--novelty', 'tilt');
  const vectors = [
    { label: '정체 전복', instruction: '인물의 진짜 정체나 목적이 표면과 다르게.' },
    { label: '시간 구조', instruction: '반복·역행·이미 일어난 일 등 시간축을 비튼다.' },
    { label: '관계 역전', instruction: '기억·권력·앎의 비대칭으로 관계를 뒤집는다.' },
    { label: '장르 전환', instruction: '평범한 일상이 사실 다른 장르의 입구.' },
    { label: '톤 반전', instruction: '기대한 정서와 반대로.' }
  ];
  const strength = novelty === 'safe' ? '비틈을 옅게, 친숙하고 정통적으로.'
    : novelty === 'bold' ? '비틈을 과감하게, 고-콘셉트로.'
    : '한 겹만 비튼다.';
  const prompt = [
    '당신은 인터랙티브 스토리의 진입 전제를 설계하는 작가입니다.',
    `사용자 소재 — ${topic || '(자유)'}`,
    `신기성 — ${strength}`,
    '아래 5개 비틈 벡터를 각 후보에 하나씩 배정해, 서로 뚜렷이 다른 장면 전제 후보 4개를 만드세요(클리셰 금지).',
    ...vectors.map((v) => `- ${v.label}: ${v.instruction}`),
    '각 후보는 한 문장 훅, 현재 장면(장소·상황·내 목적), 캐스트 2~3명(이름·역할·desire·wound·voiceRules), 내 진입점을 담습니다.',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "proposals": [ { "hook": "", "scene": "", "cast": [ { "name": "", "role": "", "desire": "", "wound": "", "voiceRules": [] } ], "myRole": "", "twist": "라벨", "novelty": "' + novelty + '" } ] }'
  ].join('\n');

  if (provider === 'mock') {
    const mk = (hook, scene, name, twist) => ({
      hook, scene,
      cast: [{ name, role: '소재 속 인물', desire: '가까워지고 싶다', wound: '말 못 한 마음', voiceRules: ['짧게'] }],
      myRole: '이야기에 들어선 나', twist, novelty
    });
    printJson({
      provider, mode: 'dive-propose', status: 'complete',
      proposals: [
        mk(`${topic || '그 사람'}이 사실 나를 찾아온 이유가 따로 있다`, `${topic || '그 사람'}과 마주 선 골목. 무언가 숨기는 눈빛.`, topic || '그 사람', '정체 전복'),
        mk(`오늘이 ${topic || '이 만남'}의 세 번째 반복인 걸 그 사람만 안다`, '같은 장면이 다시 시작된다. 어딘가 익숙하다.', topic || '그 사람', '시간 구조'),
        mk(`나는 기억 못 하는데 그 사람만 우리 과거를 다 안다`, '처음 보는 얼굴이 내 이름을 부른다.', topic || '그 사람', '관계 역전')
      ]
    });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider, mode: 'dive-propose',
    status: isError ? 'failed' : 'complete',
    proposals: Array.isArray(parsed?.proposals) ? parsed.proposals : [],
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'dive-setup') {
  const provider = readFlag(args, '--provider', 'mock');
  const story = readFlag(args, '--story', '');
  const prompt = [
    '당신은 인터랙티브 스토리의 진입 세팅을 설계하는 작가입니다.',
    '사용자가 자유롭게 쓴 아래 서술에 **충실하게** 주인공·관계인물·첫 장면을 뽑으세요.',
    '서술에 없는 비틈·반전을 새로 지어내지 마세요. 서술을 존중하되 자연스럽게 구체화만.',
    '',
    '## 사용자 서술',
    story || '(비어 있음 — 잔잔한 일상 만남으로 시작)',
    '',
    'myRole = 사용자가 연기할 주인공의 입장. cast = 관계인물 2~3(이름·역할·desire·wound·voiceRules). scene = 장소·상황·내 목적을 담은 첫 현재 장면.',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "scene": "", "cast": [ { "name": "", "role": "", "desire": "", "wound": "", "voiceRules": [] } ], "myRole": "" }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({
      provider, mode: 'dive-setup', status: 'complete',
      setup: {
        scene: story ? `${story.slice(0, 40)} — 그 장면의 한가운데.` : '늦은 밤, 처음 마주친 자리.',
        cast: [{ name: '상대', role: story ? '서술 속 상대' : '낯선 사람', desire: '가까워지고 싶다', wound: '말 못 한 사정', voiceRules: ['짧게', '망설인다'] }],
        myRole: '이야기에 들어선 나'
      }
    });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider, mode: 'dive-setup',
    status: isError ? 'failed' : 'complete',
    setup: parsed && parsed.scene ? { scene: parsed.scene, cast: Array.isArray(parsed.cast) ? parsed.cast : [], myRole: parsed.myRole || '' } : null,
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'dive-consolidate') {
  const provider = readFlag(args, '--provider', 'mock');
  const prose = readFlag(args, '--prose', '');
  const context = readFlag(args, '--context', '');
  const prompt = [
    '당신은 연속성 감수자입니다. 아래 [회차 본문]이 [기존 캐논]과, 또는 본문 내부에서 명시적으로 모순되는 곳만 찾으세요.',
    '의도적 복선·나중에 회수될 반전은 모순이 아닙니다(회수 약속이 보이면 제외). 확정된 사실을 대놓고 뒤집는 것만 모순입니다.',
    '모순이 없으면 빈 배열을 반환하세요. 억지로 찾지 마세요.',
    '',
    '## 회차 본문',
    prose || '(비어 있음)',
    '',
    '## 기존 캐논 (모순 대상)',
    context || '(아직 없음)',
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "findings": [ { "claim": "본문 속 모순 주장", "conflictsWith": "충돌하는 기존 캐논/본문 문장", "evidence": "왜 모순인지 한 줄", "severity": "high|low" } ] }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({ provider, mode: 'dive-consolidate', status: 'complete', findings: [] });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider, mode: 'dive-consolidate',
    status: isError ? 'failed' : 'complete',
    findings: Array.isArray(parsed?.findings) ? parsed.findings : [],
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'draft') {
  const provider = readFlag(args, '--provider', 'mock');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const freewrite = readFlag(args, '--freewrite', '');
  const title = readFlag(args, '--title', '');
  const context = readFlag(args, '--context', '');
  const outDir = readFlag(args, '--out-dir', join(process.cwd(), '.storyx-runs'));
  const dryRun = args.includes('--dry-run');
  const payoffStatusRaw = readFlag(args, '--payoff-status', '');
  let payoffStatus;
  try {
    const parsed = payoffStatusRaw ? JSON.parse(payoffStatusRaw) : null;
    if (parsed && typeof parsed.deferredStreak === 'number') {
      payoffStatus = {
        isStalled: Boolean(parsed.isStalled),
        deferredStreak: parsed.deferredStreak,
        openPromises: typeof parsed.openPromises === 'number' ? parsed.openPromises : 0
      };
    }
  } catch { /* 오형식 플래그는 무시 — 프롬프트 무변화 */ }
  // 작품 헌장 예산 — episodeBriefing.buildContractStatus 산출을 그대로 받는다(A-5). 오형식은 무시.
  const contractStatusRaw = readFlag(args, '--contract-status', '');
  let contractStatus;
  try {
    const parsed = contractStatusRaw ? JSON.parse(contractStatusRaw) : null;
    if (parsed && typeof parsed.remaining === 'number') {
      contractStatus = {
        remaining: parsed.remaining,
        unpaidCount: typeof parsed.unpaidCount === 'number' ? parsed.unpaidCount : 0,
        overBudget: Boolean(parsed.overBudget),
        finalStretch: Boolean(parsed.finalStretch)
      };
    }
  } catch { /* 오형식 플래그는 무시 — 프롬프트 무변화 */ }
  const prompt = buildDraftPrompt({ medium, format, freewrite, title, context, payoffStatus, contractStatus });

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
      beats: [
        { label: 'mock 도입', summary: 'mock 구성 — 실제 생성은 --provider claude로 실행하세요.', tension: 28 },
        { label: 'mock 전개', summary: 'mock 구성 — 자리표시 데이터입니다.', tension: 56 },
        { label: 'mock 절정', summary: 'mock 구성 — 긴장이 가장 높은 자리표시 단위입니다.', tension: 84 },
        { label: 'mock 마무리', summary: 'mock 구성 — 긴장을 풀고 다음 회차로 넘기는 자리표시 단위입니다.', tension: 40 }
      ],
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
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  if (!dryRun) {
    const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
    const isError = looksLikeProviderError(rawOutput, providerResult);
    let payload;
    if (isError) {
      // 에러 raw 를 prose 로 승격하지 않는다 — 결정론 폴백 payload 를 생성한다.
      payload = buildCliDraftFallback({ provider, medium, format, title, freewrite, retried });
    } else {
      payload = normalizeDraftOutput(rawOutput, { provider, medium, format, title });
    }
    payload.status = isError ? 'failed' : (providerResult.status === 0 ? 'complete' : 'failed');
    payload.exitCode = providerResult.status;
    if (isError) {
      payload.warning = retried
        ? 'provider 호출이 재시도 후에도 실패했습니다. doctor 또는 dry-run으로 명령을 점검하세요.'
        : 'provider 호출이 실패했습니다. doctor 또는 dry-run으로 명령을 점검하세요.';
    }
    const draftPath = writeDraftFile(outDir, provider, payload);
    const rawProviderOutputPath = writeRawDraftFile(outDir, provider, rawOutput);
    printJson({ ...payload, draftPath, rawProviderOutputPath, approvalRequiredBeforeSync: true });
    process.exit(isError ? 1 : 0);
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

if (command === 'review-data') {
  const provider = readFlag(args, '--provider', 'mock');
  const category = readFlag(args, '--category', '인물');
  const target = readFlag(args, '--target', '');
  const medium = readFlag(args, '--medium', 'novel');
  const context = readFlag(args, '--context', '');
  const prompt = buildDataReviewPrompt({ category, target, medium, context });

  if (provider === 'mock') {
    printJson({
      provider,
      category,
      mode: 'review-data',
      status: 'complete',
      summary: `mock 데이터 검토 — "${category}" 분야의 정합·제안 자리표시 결과입니다. 실제 검토는 --provider claude로 실행하세요.`,
      notes: [
        {
          kind: '정합',
          title: `${category} 분야 등장 회차 정합`,
          body: `mock 검토 — "${category}" 엔티티의 사실과 등장 회차가 서로 어긋나지 않는지 확인하는 자리표시 항목입니다.`
        },
        {
          kind: '제안',
          title: `${category} 보강 아이디어`,
          body: `mock 검토 — "${category}" 분야를 더 단단하게 만들 보강 아이디어가 들어갈 자리표시 항목입니다.`
        }
      ]
    });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);

  printJson({
    provider,
    category,
    mode: 'review-data',
    status: isError ? 'failed' : (providerResult.status === 0 ? 'complete' : 'failed'),
    exitCode: providerResult.status,
    summary: readString(parsed?.summary),
    notes: normalizeDataReviewNotes(parsed?.notes),
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'interview') {
  const provider = readFlag(args, '--provider', 'mock');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const freewrite = readFlag(args, '--freewrite', '');
  const personasJson = readFlag(args, '--personas-json', '[]');
  let personas = [];
  try {
    const parsedPersonas = JSON.parse(personasJson);
    if (Array.isArray(parsedPersonas)) personas = parsedPersonas;
  } catch {
    personas = [];
  }
  const prompt = buildInterviewPrompt({ medium, format, freewrite, personas });

  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'interview', status: 'complete', questions: [] });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];

  printJson({
    provider,
    medium,
    mode: 'interview',
    status: isError ? 'failed' : (providerResult.status === 0 ? 'complete' : 'failed'),
    exitCode: providerResult.status,
    questions,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'normalize-provider-output') {
  const provider = readFlag(args, '--provider', 'codex');
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

// ─────────────────────────────────────────────────────────────────────────────
// init — 새 프로젝트 scaffold
// 산출: storyx/export/v1 스키마의 빈 프로젝트 JSON 파일.
// importAllData(storage.ts)가 받아들이는 형태를 그대로 따른다.
// SeriesProject 최소 필드는 src/lib/storyEngine.ts 의 createEmptyProject 미러.
// ─────────────────────────────────────────────────────────────────────────────
if (command === 'init') {
  const title = readFlag(args, '--title', '새 작품');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const out = readFlag(args, '--out', './storyx-project.json');
  const dryRun = args.includes('--dry-run');

  // storyx/export/v1 페이로드 — importAllData 가 검증하는 최소 필드를 포함한다.
  // project 구조는 createEmptyProject(storyEngine.ts) 미러. mjs 에서 ts import 불가.
  const projectId = `project-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const payload = {
    schema: 'storyx/export/v1',
    exportedAt: now,
    project: {
      id: projectId,
      title: title.trim() || '새 작품',
      logline: '',
      localization: { language: 'ko', region: 'KR', dateFormat: 'YYYY년 MM월 DD일', currencySymbol: '₩', measurementSystem: 'metric' },
      genre: 'urban-fantasy',
      tone: '',
      audiencePromise: '',
      deepQuestion: '',
      creativeWeight: 'balanced',
      formIntent: '',
      medium,
      format,
      currentEpisode: 0,
      characters: [],
      worldRules: [],
      canonFacts: [],
      openThreads: [],
      chapters: [],
      places: [],
      objects: [],
      events: [],
      timeline: [],
      bibleOutline: []
    },
    snapshots: [],
    preferences: {
      landingTheme: null,
      studioAccent: null,
      studioCanvas: null
    }
  };

  if (dryRun) {
    printJson({ dryRun: true, out: resolve(out), preview: payload });
    process.exit(0);
  }

  const outPath = resolve(out);
  writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  printJson({ ok: true, schema: payload.schema, title: payload.project.title, out: outPath });
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// serve — vite dev 서버 래핑
// ─────────────────────────────────────────────────────────────────────────────
if (command === 'serve') {
  const port = readFlag(args, '--port', '5173');
  const dryRun = args.includes('--dry-run');
  const commandParts = ['npx', 'vite', '--port', port];

  if (dryRun) {
    printJson({ dryRun: true, command: commandParts.join(' ') });
    process.exit(0);
  }

  const child = spawn('npx', ['vite', '--port', port], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
  // 포그라운드 프로세스 유지 — 이 이후는 실행되지 않는다.
}

// ─────────────────────────────────────────────────────────────────────────────
// memory sync — export JSON → 로컬 md/json 디렉터리 풀기
// 역방향(디렉터리→export)은 미지원.
// ─────────────────────────────────────────────────────────────────────────────
if (command === 'memory') {
  const subcommand = args[0];
  const restArgs = args.slice(1);

  if (subcommand !== 'sync') {
    printJson({
      error: `알 수 없는 memory 서브커맨드: '${subcommand}'`,
      usage: 'npm run storyx -- memory sync --from <export.json> --to <dir>'
    });
    process.exit(1);
  }

  const fromFile = readFlag(restArgs, '--from', '');
  const toDir = readFlag(restArgs, '--to', './storyx-memory');
  const dryRun = restArgs.includes('--dry-run');

  if (!fromFile) {
    printJson({
      error: 'Missing --from',
      usage: 'npm run storyx -- memory sync --from <export.json> --to <dir>'
    });
    process.exit(1);
  }

  let exportPayload;
  try {
    exportPayload = JSON.parse(readFileSync(resolve(fromFile), 'utf8'));
  } catch (e) {
    printJson({ error: `export JSON 읽기 실패: ${e.message}`, from: resolve(fromFile) });
    process.exit(1);
  }

  if (!exportPayload || exportPayload.schema !== 'storyx/export/v1') {
    printJson({ error: `storyx/export/v1 스키마가 아닙니다. schema='${String(exportPayload?.schema)}'` });
    process.exit(1);
  }

  const project = exportPayload.project ?? {};
  const evolutionHistory = exportPayload.evolutionHistory ?? null;
  const outDir = resolve(toDir);

  if (dryRun) {
    const files = buildMemorySyncFiles(project, evolutionHistory, outDir);
    printJson({
      dryRun: true,
      from: resolve(fromFile),
      to: outDir,
      schema: exportPayload.schema,
      willWrite: files.map((f) => f.path)
    });
    process.exit(0);
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const files = buildMemorySyncFiles(project, evolutionHistory, outDir);
  for (const file of files) {
    const dir = join(file.path, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(file.path, file.content, 'utf8');
  }

  printJson({
    ok: true,
    from: resolve(fromFile),
    to: outDir,
    schema: exportPayload.schema,
    written: files.map((f) => f.path)
  });
  process.exit(0);
}

// memory sync 에서 쓰는 파일 목록을 빌드한다 (실제 쓰기 없음 — dry-run 겸용).
function buildMemorySyncFiles(project, evolutionHistory, outDir) {
  const files = [];

  // 1. 프로젝트 메타 마크다운
  const metaLines = [
    `# ${project.title || '작품 메타'}`,
    '',
    `- **id**: ${project.id || ''}`,
    `- **장르**: ${project.genre || ''}`,
    `- **매체**: ${project.medium || ''}`,
    `- **포맷**: ${project.format || ''}`,
    `- **무게중심**: ${project.creativeWeight || ''}`,
    `- **현재 회차**: ${project.currentEpisode ?? 0}`,
    '',
    `## 독자 약속\n${project.audiencePromise || '(없음)'}`,
    '',
    `## 심층 질문\n${project.deepQuestion || '(없음)'}`,
    '',
    `## 로그라인\n${project.logline || '(없음)'}`
  ];
  files.push({ path: join(outDir, 'project-meta.md'), content: metaLines.join('\n') + '\n' });

  // 2. 캐논 사실 JSON
  if (Array.isArray(project.canonFacts) && project.canonFacts.length > 0) {
    files.push({
      path: join(outDir, 'canon-facts.json'),
      content: JSON.stringify(project.canonFacts, null, 2)
    });
  }

  // 3. 인물 JSON
  if (Array.isArray(project.characters) && project.characters.length > 0) {
    files.push({
      path: join(outDir, 'characters.json'),
      content: JSON.stringify(project.characters, null, 2)
    });
  }

  // 4. 열린 실타래 마크다운
  if (Array.isArray(project.openThreads) && project.openThreads.length > 0) {
    const threadLines = [`# 열린 실타래 (Open Threads)`, ''];
    project.openThreads.forEach((t, i) => threadLines.push(`${i + 1}. ${t}`));
    files.push({ path: join(outDir, 'open-threads.md'), content: threadLines.join('\n') + '\n' });
  }

  // 5. evolutionHistory JSON (있을 때만)
  if (evolutionHistory && Array.isArray(evolutionHistory.events) && evolutionHistory.events.length > 0) {
    files.push({
      path: join(outDir, 'evolution-history.json'),
      content: JSON.stringify(evolutionHistory, null, 2)
    });
  }

  return files;
}

if (command === 'pace-interview') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const payoffJsonStr = readFlag(args, '--payoff-json', '');
  const promisesJsonStr = readFlag(args, '--promises-json', '[]');
  const stakesJsonStr = readFlag(args, '--stakes-json', '[]');
  const context = readFlag(args, '--context', '');
  const dryRun = args.includes('--dry-run');

  // 단독 완결형이면 provider 호출 없이 빈 questions 반환
  if (!isSerialFormat(format)) {
    printJson({ provider, medium, mode: 'pace-interview', status: 'complete', questions: [] });
    process.exit(0);
  }

  // payoff-json 누락이면 provider 호출 없이 빈 questions 반환
  if (!payoffJsonStr) {
    printJson({ provider, medium, mode: 'pace-interview', status: 'complete', questions: [], warning: '--payoff-json 누락 — pace 데이터 없이 질문을 생성할 수 없습니다.' });
    process.exit(0);
  }

  let payoffStatus = { isStalled: false, deferredStreak: 0, openPromises: 0 };
  try {
    const parsed = JSON.parse(payoffJsonStr);
    if (typeof parsed === 'object' && parsed !== null) {
      payoffStatus = {
        isStalled: Boolean(parsed.isStalled),
        deferredStreak: typeof parsed.deferredStreak === 'number' ? parsed.deferredStreak : 0,
        openPromises: typeof parsed.openPromises === 'number' ? parsed.openPromises : 0
      };
    }
  } catch {
    // 오형식 payoff-json — 기본값 사용
  }

  let unpaidPromises = [];
  try {
    const parsed = JSON.parse(promisesJsonStr);
    if (Array.isArray(parsed)) unpaidPromises = parsed.filter((v) => typeof v === 'string');
  } catch {
    // 오형식 promises-json — 무시(빈 배열)
  }

  let deferredStakes = [];
  try {
    const parsed = JSON.parse(stakesJsonStr);
    if (Array.isArray(parsed)) deferredStakes = parsed.filter((v) => typeof v === 'string');
  } catch {
    // 오형식 stakes-json — 무시(빈 배열)
  }

  const prompt = buildPaceInterviewPrompt({ medium, format, payoffStatus, unpaidPromises, deferredStakes, context });

  if (dryRun) {
    printJson({
      provider,
      medium,
      format,
      mode: 'pace-interview',
      dryRun: true,
      payoffStatus,
      unpaidPromises,
      deferredStakes,
      prompt,
      warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.'
    });
    process.exit(0);
  }

  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'pace-interview', status: 'complete', questions: [] });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  // Q2 가드 사용 — transient 실패 시 1회 재시도, 에러 raw 는 질문으로 승격하지 않는다.
  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const questions = normalizePaceQuestions(parsed?.questions);

  printJson({
    provider,
    medium,
    mode: 'pace-interview',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    questions,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'spine-suggest') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const freewrite = readFlag(args, '--freewrite', '');
  const endingStatement = readFlag(args, '--ending', '');
  const protagonistCost = readFlag(args, '--cost', '');
  const dryRun = args.includes('--dry-run');

  const prompt = buildSpineSuggestionPrompt({ medium, format, freewrite, endingStatement, protagonistCost });

  if (dryRun) {
    printJson({ provider, medium, format, mode: 'spine-suggest', dryRun: true, prompt, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }

  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'spine-suggest', status: 'complete', spine: null });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  // Q2 가드 — transient 실패 시 1회 재시도, 에러 raw 는 척추 제안으로 승격하지 않는다.
  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const spine = normalizeSpineSuggestion(parsed?.spine);

  printJson({
    provider,
    medium,
    mode: 'spine-suggest',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    spine,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'vs-candidates') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const contractDigest = readFlag(args, '--contract-digest', '');
  const recentSummary = readFlag(args, '--recent-summary', '');
  let unpaidPromises = [];
  try { unpaidPromises = JSON.parse(readFlag(args, '--unpaid-json', '[]')); } catch { unpaidPromises = []; }
  const dryRun = args.includes('--dry-run');

  const prompt = buildVsCandidatesPrompt({ medium, format, contractDigest, recentSummary, unpaidPromises });

  if (dryRun) {
    printJson({ provider, medium, format, mode: 'vs-candidates', dryRun: true, prompt, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }
  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'vs-candidates', status: 'complete', candidates: [] });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  // Q2 가드 — transient 실패 시 1회 재시도, 에러 raw 는 후보로 승격하지 않는다.
  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];

  printJson({
    provider,
    medium,
    mode: 'vs-candidates',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    candidates,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'plan-chat') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const section = readFlag(args, '--section', '');
  const context = readFlag(args, '--context', '');
  const catalog = readFlag(args, '--catalog', '');
  const dialogue = readFlag(args, '--dialogue', '');
  const query = readFlag(args, '--query', '');
  const dryRun = args.includes('--dry-run');

  const prompt = buildPlanChatPrompt({ medium, format, activeSection: section, contextDigest: context, catalog, dialogue, query });

  if (dryRun) {
    printJson({ provider, medium, format, mode: 'plan-chat', dryRun: true, prompt, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }
  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'plan-chat', status: 'complete', reply: '(mock) 설계 파트너 응답', proposals: [] });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const reply = typeof parsed?.reply === 'string' ? parsed.reply : '';
  const proposals = Array.isArray(parsed?.proposals) ? parsed.proposals : [];

  printJson({
    provider,
    medium,
    mode: 'plan-chat',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    reply,
    proposals,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

if (command === 'onboard-chat') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const freewrite = readFlag(args, '--freewrite', '');
  const dialogue = readFlag(args, '--dialogue', '');
  const query = readFlag(args, '--query', '');
  const condense = args.includes('--condense');
  const dryRun = args.includes('--dry-run');

  const prompt = buildOnboardChatPrompt({ medium, format, freewrite, dialogue, query, condense });

  if (dryRun) {
    printJson({ provider, medium, format, mode: 'onboard-chat', dryRun: true, prompt, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }
  if (provider === 'mock') {
    const mockSetup = condense
      ? {
          scene: '목업 첫 장면 — 심야 세탁소 카운터.',
          cast: [{ name: '목업 상대', role: '주인', desire: '가게를 지키고 싶다', wound: '잃어버린 단골', voiceRules: ['짧게 말한다'] }],
          myRole: '단골 손님'
        }
      : null;
    printJson({
      provider,
      medium,
      mode: 'onboard-chat',
      status: 'complete',
      reply: condense ? '좋아요, 이 소재로 시작해요.' : '그 소재에서 누가 제일 먼저 떠오르나요?',
      setup: mockSetup
    });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const reply = typeof parsed?.reply === 'string' ? parsed.reply : '';

  printJson({
    provider,
    medium,
    mode: 'onboard-chat',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    reply,
    setup: parsed?.setup ?? null,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}

printJson({
  usage: [
    'npm run storyx -- doctor',
    'npm run storyx -- init --title "새 작품" --medium novel --format long-novel --out ./storyx-project.json',
    'npm run storyx -- init --title "테스트" --dry-run',
    'npm run storyx -- serve --port 5173',
    'npm run storyx -- serve --dry-run',
    'npm run storyx -- memory sync --from ./storyx-project.json --to ./storyx-memory',
    'npm run storyx -- memory sync --from ./storyx-project.json --dry-run',
    'npm run storyx -- draft --provider mock --medium novel --format long-novel --dry-run',
    'npm run storyx -- draft --provider claude --medium novel --format long-novel --freewrite "쓰고 싶은 이야기" --dry-run',
    'npm run storyx -- review --provider mock --scale small --dry-run',
    'npm run storyx -- review --provider claude --scale small --dry-run',
    'npm run storyx -- review-data --provider mock --category 인물 --target "<직렬화된 엔티티>"',
    'npm run storyx -- normalize-provider-output --provider claude --scale small --raw-file ./provider-output.txt',
    'npm run storyx -- pace-interview --provider codex --medium novel --format long-novel --payoff-json \'{"isStalled":true,"deferredStreak":3,"openPromises":4}\' --dry-run',
    'npm run storyx -- spine-suggest --provider codex --medium novel --format long-novel --freewrite "쓰고 싶은 이야기" --ending "결말 문장" --dry-run',
    'npm run storyx -- vs-candidates --provider codex --medium novel --format long-novel --recent-summary "최근 회차" --dry-run',
    'npm run storyx -- onboard-chat --provider codex --medium novel --format long-novel --freewrite "소재 씨앗" --query "작가의 말" --condense --dry-run'
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

function buildReviewPrompt(scale, target, medium, context) {
  const isEssay = medium === 'essay';

  const role = isEssay
    ? '당신은 Story X 에세이 작가진입니다. 에세이 인터뷰어(작가의 실제 경험에서 더 물어야 할 빈칸), 문체 큐레이터(담담하고 선명한 한국어, 번역투·AI투 점검), 실제 인물 보호(주변 인물 익명성과 감정 거리), 연속성 감수자(앞 편과의 사실 일관성)의 시선으로 위 원고를 검토합니다.'
    : '당신은 Story X 작가진입니다. 쇼러너(독자 약속·후크), 캐릭터 큐레이터(욕망·상처·말투·관계), 배경 설계자(세계 규칙과 비용), 장르 스타일리스트(장르 리듬), 연속성 감수자(캐논 일관성)의 시선으로 위 원고를 검토합니다.';

  const agentIdEnum = isEssay
    ? 'essay-interviewer|voice-curator|continuity-editor'
    : 'showrunner|character-custodian|world-keeper|genre-stylist|continuity-editor';

  const extraRule = isEssay
    ? '- 작가가 적지 않은 사실을 지어내 채우라고 요구하지 말고, 더 물어볼 질문으로 남깁니다. 실제 인물의 식별 위험을 발견하면 blocked로 판정합니다.'
    : '- 캐논 충돌은 다수결로 통과시키지 않습니다.';

  // craft 검토 기준 — 대중성·작품성 리서치에서 도출
  const craftCriteria = isEssay
    ? [
        '- 표면/심층: 구체적 경험에서 출발해 작품 계약의 심층 질문으로 넓히는가, 경험만 나열하는가.',
        '- 정직함: 화자가 자기를 정직하게 보는가, 자기연민에 빠지지 않는가.',
        '- 사유의 이동: 글의 처음과 끝에서 화자의 시선이 달라져 있는가.',
        '- 여백: 교훈을 강요하지 않고 질문으로 열어 두는가.',
        '- 실제 인물: 주변 인물의 식별 위험이나 일방적 비난이 없는가.'
      ]
    : [
        '- 표면 약속: 이 회차가 작품 계약의 표면 약속(사건·후크)을 지키는가.',
        '- 심층 질문: 표면 사건 아래에서 작품의 심층 질문을 건드리는가, 표면만 소비하는가.',
        '- 무게중심: 작품 계약의 무게중심(대중성/균형/작품성)에 맞는 밀도와 리듬인가.',
        '- 형식·구조: 작품 계약의 시점·시제·구성 의도를 지키며, 구조가 주제를 수행하는가.',
        '- 페이스: 정보를 한 번에 쏟지 않고, 무엇을 지금 알리고 무엇을 미룰지 공개 리듬을 조절하는가.',
        '- 여백: 감정과 의미를 과잉 설명하지 않고 독자가 채울 자리를 남겼는가.',
        '- 구체적 감각: 추상 감정어 대신 사물·동작·감각으로 보여주는가.',
        '- 윤리적 복잡성: 인물에게 쉬운 심판을 내리지 않고, 악인에게도 그 나름의 논리를 주는가.'
      ];

  return [
    isEssay ? 'Story X 에세이 검토 요청.' : 'Story X 회차 검토 요청.',
    `검토 규모: ${scale}`,
    '',
    '## 작품 계약과 맥락 (검토 기준)',
    context ? context : '(작품 계약 정보가 전달되지 않았습니다.)',
    '',
    '## 검토 대상 원고',
    target ? target : '(원고 본문이 전달되지 않았습니다 — 검토할 수 없음을 summary에 명시하세요.)',
    '',
    '## 역할',
    role,
    '',
    '## 규칙',
    '- 한국어로 작성하고, 번역투와 과한 AI식 설명을 피합니다.',
    '- 사용자 승인 전에는 어떤 사실도 canon으로 확정하지 않습니다. 새 사실은 memoryCandidates에만 둡니다.',
    '- 각 에이전트는 원고의 구체적 문장을 근거(evidence)로 들어 pass / revise / blocked 중 하나로 판정합니다.',
    extraRule,
    '',
    '## 검토 기준 — 각 에이전트가 반드시 짚을 것',
    ...craftCriteria,
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "summary": "검토 총평 한 단락",',
    '  "agentReports": [',
    `    { "agentId": "${agentIdEnum}", "status": "pass|revise|blocked", "note": "검토 의견", "evidence": ["원고 근거"] }`,
    '  ],',
    '  "memoryCandidates": [',
    '    { "owner": "character|world|plot|voice", "status": "pending", "statement": "새 기억 후보", "sourceAgentId": "continuity-editor", "rationale": "후보로 둔 이유" }',
    '  ],',
    '  "nextActions": ["사용자가 다음에 할 행동"]',
    '}'
  ].join('\n');
}

// .claude/agents/<id>.md에서 에이전트 페르소나 본문을 읽어온다 (프런트매터 제거)
function loadAgentPersona(agentId) {
  const file = agentFileMap[agentId];
  if (!file) {
    return '';
  }
  const path = join(process.cwd(), '.claude', 'agents', `${file}.md`);
  if (!existsSync(path)) {
    return '';
  }
  try {
    return readFileSync(path, 'utf8').replace(/^---[\s\S]*?---\s*/, '').trim();
  } catch {
    return '';
  }
}

function buildAgentReviewPrompt({ agentId, persona, target, medium, context, payoffStatus, contractStatus }) {
  const payoffEvidence = payoffStatus && payoffStatus.isStalled
    ? [
        `- [측정] 전제 진척 정체 신호 — 회수 없이 ${payoffStatus.deferredStreak}회차 연속(열린 약속 ${payoffStatus.openPromises}개). criteriaKey: stakes_progression_audit. 이 회차가 행동·대가·전환으로 약속에 다가가는지 특히 엄격히 본다.`
      ]
    : [];
  // 흡인력 게이트 조기 소진 신호(2026-07-06) — promptBuilders.ts 미러. critic-reviewer 한정, paidPromises>0 오탐 가드.
  const compellingnessEvidence =
    agentId === 'critic-reviewer' &&
    payoffStatus && !payoffStatus.isStalled &&
    payoffStatus.openPromises === 0 && (payoffStatus.paidPromises ?? 0) > 0 &&
    contractStatus && !contractStatus.finalStretch
      ? [
          `- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 ${contractStatus.remaining}회차. criteriaKey: tension_decay_audit. 이 회차가 새 질문·새 긴장을 장전하는지 특히 엄격히 본다.`
        ]
      : [];
  // 작품 헌장 길 잃음 점검 — promptBuilders.ts 미러(A-4).
  const contractChecks = contractStatus
    ? [
        '- [헌장] 길 잃음 점검 — 이 회차가 아직 질문·4줄 척추를 추적하는지, 방해 요소가 비대해져 원래 질문을 삼켰는지 본다. 발견·소품만 쌓고 척추가 전진하지 않으면 revise.',
        ...(contractStatus.overBudget
          ? ['- [헌장] 약속 예산 초과 상태에서 이 회차가 새 약속을 또 발급하면 revise/block 한다.']
          : [])
      ]
    : [];
  return [
    `Story X 작가진 검토 — 당신은 한 명의 에이전트입니다: ${agentId}.`,
    `매체: ${medium}`,
    '',
    '## 당신의 정체성',
    persona || `(정의 파일이 없습니다 — ${agentId}의 전문 시선으로 검토하세요.)`,
    '',
    '## 작품 계약과 맥락 (검토 기준)',
    context || '(맥락 없음)',
    '',
    '## 검토 대상 원고',
    target || '(원고 본문이 없습니다 — 검토할 수 없음을 note에 적으세요.)',
    '',
    '## 지시',
    '- 오직 당신의 전문 시선 하나로만 검토합니다. 다른 에이전트의 영역은 건드리지 않습니다.',
    '- 원고의 구체적 문장을 근거(evidence)로 들어 pass / revise / blocked 중 하나로 판정합니다.',
    '- 잘된 점(strengths)과 잘못된 점(issues)을 각각 짧고 또렷한 항목으로 나눠 적습니다. 한 항목은 한 문장으로 씁니다.',
    '- 한국어로 쓰고, 번역투와 과한 AI식 설명을 피합니다.',
    '- 새 사실은 canon으로 확정하지 말고 memoryCandidates에만 둡니다.',
    // continuity≠payoff 보정 — 검토가 연속성만 보고 전제 정체를 묵인하지 않도록 강제한다.
    '- 연재 장편이라면, 이 회차가 작품의 중심 질문(전제·독자 약속)을 진척시키는지도 본다 — 발견·추론만 쌓고 같은 질문이 여러 회차 제자리면, 인물의 행동·대가·선택 변화로 약속에 다가가지 못한 점을 지적한다.',
    // 정체 측정값이 있으면 결정론적 evidence 로 추가 주입한다 (아크 페이오프 1단계).
    ...payoffEvidence,
    // 흡인력 게이트 — 조기 소진 측정값(critic-reviewer 한정).
    ...compellingnessEvidence,
    // 작품 헌장 길 잃음 점검 (A-4).
    ...contractChecks,
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "status": "pass|revise|blocked",',
    '  "note": "이 에이전트의 검토 의견 한 단락",',
    '  "strengths": ["원고에서 잘된 점을 한 문장씩"],',
    '  "issues": ["원고에서 짚어낸 문제를 한 문장씩"],',
    '  "evidence": ["원고에서 든 근거 문장"],',
    '  "memoryCandidates": [{ "owner": "character|world|plot|voice", "statement": "새 기억 후보", "rationale": "후보로 둔 이유" }]',
    '}'
  ].join('\n');
}

function buildInterviewPrompt({ medium, format, freewrite, personas = [] }) {
  const isEssay = medium === 'essay';
  const isAcademic = medium === 'academic';
  const isSerial = isSerialFormat(format);
  const agentIdChoices = isAcademic
    ? 'showrunner|voice-curator|essay-interviewer|essay-thesis|essay-curator|critic-reviewer|interview-curator|continuity-editor'
    : 'showrunner|character-custodian|world-keeper|voice-curator|essay-interviewer|essay-thesis|continuity-editor';

  // 매체별 페르소나 풀에서 선별된 라인업을 LLM 프롬프트에 톤 가이드로 주입.
  // 라인업이 비어 있어도 동작하며, 있으면 각 페르소나의 tone/questionStarters/blockingSignals 를 참고해 질문의 결을 맞추도록 지시.
  const personaSection = Array.isArray(personas) && personas.length > 0
    ? [
        '',
        '## 페르소나 톤 가이드 — 이 라인업의 결을 따르세요',
        '이번 인터뷰는 아래 페르소나들의 톤·관심·금기 신호를 참고해서 질문의 결을 맞춥니다. 각 페르소나의 questionStarters 를 그대로 베끼지는 말되, 그 결을 살린 질문을 만들도록 합니다.',
        ...personas.map((p, idx) => {
          const label = typeof p?.label === 'string' ? p.label : `페르소나 ${idx + 1}`;
          const tone = typeof p?.tone === 'string' ? p.tone : '';
          const starters = Array.isArray(p?.questionStarters) ? p.questionStarters.slice(0, 3) : [];
          const blocking = Array.isArray(p?.blockingSignals) ? p.blockingSignals.slice(0, 2) : [];
          return [
            `### ${label}`,
            tone ? `- 톤: ${tone}` : null,
            starters.length > 0 ? `- 질문 결 예시: ${starters.map((q) => `"${q}"`).join(' / ')}` : null,
            blocking.length > 0 ? `- 피해야 할 신호: ${blocking.join(' / ')}` : null
          ].filter(Boolean).join('\n');
        })
      ]
    : [];

  return [
    'Story X 작가 인터뷰 질문 생성 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    isSerial
      ? '구조: 회차가 누적되는 연재형 작품입니다.'
      : '구조: 한 편으로 완결되는 단독 작품입니다. 회차·연재·다음 화를 가정하지 마세요.',
    '',
    '## 작가가 쓴 자유 서술',
    freewrite || '(자유 서술 없음 — 매체와 포맷만으로 일반적인 세팅 질문 6개를 만드세요.)',
    ...personaSection,
    '',
    '## 역할',
    '당신은 Story X의 작가 인터뷰 설계자입니다. 위 자유 서술을 읽고, 이 작가가 작품을 시작하기 전에 스스로 정해야 할 핵심 결정 6~8가지를 객관식 질문으로 만듭니다.',
    '',
    '## 인터뷰어 — 각 질문을 누가 묻는지 agentId로 지정',
    isSerial ? '- showrunner: 후크와 연재 구조' : '- showrunner: 후크와 한 편의 완결 구조',
    '- character-custodian: 인물의 욕망과 모순',
    '- world-keeper: 세계 규칙과 그 대가',
    '- voice-curator: 문체와 목소리',
    '- essay-interviewer: 에세이의 실제 경험과 거리',
    '- essay-thesis: 에세이의 논증·사유 구조와 큰 그림 (에세이 전용)',
    '- essay-curator: 진실 계약, 보편 도약, 연구 윤리 경계 (academic 재활용)',
    '- critic-reviewer: 반론, 양가성, 대안 가설 (academic 재활용)',
    '- interview-curator: 자유글 기반 질문 시퀀스 설계 (academic 재활용)',
    '- continuity-editor: 연속성과 캐논',
    '',
    '## 규칙',
    '- 자유 서술에 실제로 나온 소재·인물·설정을 근거로, 이 작품에만 맞는 구체적 질문을 만듭니다. 일반론 금지.',
    '- 각 질문은 객관식 선택지 3개와, 각 선택지가 작품에 미치는 영향(impact)을 함께 답니다.',
    isEssay
      ? '- 에세이이므로 essay-interviewer를 반드시 포함하고, 작가가 적지 않은 사실을 지어내는 선택지는 만들지 않습니다.'
      : isAcademic
        ? '- academic 매체이므로 essay-curator, critic-reviewer, interview-curator, essay-thesis 중 최소 2명을 포함하고, 영어 APA 논증·근거·인용 맥락을 묻습니다.'
        : '- 매체와 자유 서술에 맞는 인터뷰어를 고릅니다.',
    isSerial
      ? '- 연재형이므로 회차 후킹, 다음 화로 이어지는 약속을 묻는 질문을 포함할 수 있습니다.'
      : '- 단독 완결형이므로 회차·연재·다음 화를 전제한 질문은 만들지 않습니다. 하나의 효과·정서·반전으로 완결되는 한 편을 묻습니다.',
    '- 6~8개의 질문을 만듭니다. 인터뷰어를 한 명에게 몰지 말고, 쇼러너·캐릭터·배경·문체·연속성이 각자 자기 시선에서 최소 한 가지씩 묻게 분산합니다.',
    '- 핵심 갈등, 결말 방향, 작가가 가장 자신 없는 부분처럼 이야기가 자유 서술의 핵심에서 엇나가지 않도록 방향을 좁히는 질문을 포함합니다.',
    '- 한국어로 자연스럽게 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "questions": [',
    '    {',
    `      "agentId": "${agentIdChoices}",`,
    '      "question": "이 작품에 대한 구체적인 질문",',
    '      "options": [{ "label": "선택지", "impact": "이 선택이 작품에 미치는 영향" }],',
    '      "recommendedOptionLabel": "추천 선택지의 label"',
    '    }',
    '  ]',
    '}'
  ].join('\n');
}

// 데이터 모드 분야별 검토 프롬프트 — 한 캐논 분야(인물/장소/사물/사건/시간선)의 작품 내 정합과 보강 제안을 묻는다.
function buildDataReviewPrompt({ category, target, medium, context }) {
  return [
    'Story X 데이터 검토 요청 — 한 캐논 분야의 작품 내 정합성을 점검합니다.',
    `매체: ${medium}`,
    `검토 분야: ${category}`,
    '',
    '## 작품 계약과 바이블 맥락 (검토 기준)',
    context || '(맥락 없음)',
    '',
    `## 검토 대상 — "${category}" 분야의 캐논 데이터`,
    target || `(${category} 데이터가 전달되지 않았습니다 — 검토할 수 없음을 summary에 명시하세요.)`,
    '',
    '## 역할',
    `당신은 Story X의 연속성 감수자입니다. "${category}" 분야의 엔티티들이 회차를 가로질러, 그리고 작품 안에서 서로 어긋나지 않는지 점검합니다.`,
    '',
    '## 지시',
    '- 회차 간/작품 내 정합성을 본다 — 한 엔티티의 사실들이 서로 모순되지 않는지, 등장 회차와 사실이 어긋나지 않는지, 분야 안의 다른 엔티티와 충돌하지 않는지.',
    '- 두 종류의 노트만 남긴다.',
    '  - 정합(consistency): 어긋남·충돌·미확인 항목을 짚는다. 문제가 없으면 정합이 확인된 항목이라고 적는다.',
    '  - 제안(suggestion): 이 분야를 더 단단하게 만들 보강 아이디어. 예 — "이 사건이 약하다", "이런 사물이 하나 있으면 복선이 산다", "이 인물 관계가 비어 있다".',
    '- 새 엔티티를 확정하거나 캐논을 임의로 바꾸지 않는다. 제안은 어디까지나 아이디어로 남긴다.',
    '- 한국어로 쓰고, 번역투와 과한 AI식 설명을 피한다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    `  "summary": "${category} 분야 검토 총평 한 단락",`,
    '  "notes": [',
    '    { "kind": "정합|제안", "title": "노트 제목", "body": "노트 본문 — 근거와 함께" }',
    '  ]',
    '}'
  ].join('\n');
}

// provider 응답의 데이터 검토 notes 배열을 { kind, title, body }로 정규화한다. kind는 정합/제안만 허용.
function normalizeDataReviewNotes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((note) => ({
      kind: readString(note.kind) === '제안' ? '제안' : '정합',
      title: readString(note.title) || readString(note.label),
      body: readString(note.body) || readString(note.note) || readString(note.detail)
    }))
    .filter((note) => note.title || note.body);
}

function buildDraftPrompt({ medium, format, freewrite, title, context, payoffStatus, contractStatus }) {
  const isEssay = medium === 'essay';
  const isSerial = isSerialFormat(format);

  const role = isEssay
    ? '당신은 Story X의 에세이 집필 동반자입니다. 에세이 인터뷰어(작가의 실제 경험을 더 깊이 묻기), 문체 큐레이터(담담하고 선명한 한국어), 실제 인물 보호(주변 인물 익명화와 감정 거리), 연속성 감수자의 시선으로, 작가가 자유 서술에 적은 경험만으로 에세이 한 편을 씁니다.'
    : isSerial
      ? '당신은 Story X의 소설 생성 엔진입니다. 쇼러너(회차 약속과 클리프행어), 캐릭터 큐레이터(욕망·상처·말투·관계), 배경 설계자(세계 규칙과 비용), 연속성 감수자(캐논 일관성)의 시선을 모두 적용해 회차 초안을 만듭니다.'
      : '당신은 Story X의 소설 생성 엔진입니다. 쇼러너(하나의 효과와 마지막 반전), 캐릭터 큐레이터(욕망·상처·말투·관계), 배경 설계자(세계 규칙과 비용), 연속성 감수자(캐논 일관성)의 시선을 모두 적용해, 한 편으로 완결되는 단편 원고 초안을 만듭니다.';

  const rules = isEssay
    ? [
        '- 한국어로 작성하고, 작가 자유 서술의 어휘와 의도를 존중합니다.',
        '- 작가가 자유 서술에 적지 않은 사실(인물의 직업·나이·장소·사건)을 절대 발명하지 않습니다. 모르는 곳은 비워 둡니다.',
        '- 실제 주변 인물은 식별 정보를 흐리고, 비난이 아니라 감정의 거리를 둔 시선으로 다룹니다.',
        '- 고백이 아니라 해석을 씁니다 — 그때의 사실, 그때의 감정, 지금의 시선을 분리합니다.',
        '- 기존 작품 맥락이 있으면 앞 편에서 다룬 사실·인물과 어긋나지 않게 이어 씁니다.',
        '- prose는 1500~3000자 분량의 실제 본문입니다.'
      ]
    : isSerial
      ? [
          '- 한국어로 작성하고, 작가 자유 서술의 어휘와 의도를 존중합니다.',
          '- 기존 작품 맥락이 있으면 그 캐논·인물·세계 규칙을 절대 어기지 말고, 이번 회차는 그 다음 회차로 자연스럽게 이어집니다.',
          '- 한 회차는 하나의 질문에 답하고 더 날카로운 질문을 엽니다.',
          '- 이 회차가 건 약속과 실제로 회수한 것을 rewardArc 로, 핵심 위험의 결말(lost/kept/deferred)을 stakesLedger 로 함께 적습니다. 회수를 미뤘으면 솔직히 deferred 로 표시합니다.',
          // P12 — promptBuilders.ts 미러와 byte-identical 유지.
          '- rewardArc 의 promise 는 작품 맥락에 이미 확정된 사실을 재발급하지 않습니다 — 이미 일어난 일은 새 약속이 될 수 없습니다.',
          '- prose는 1500~3000자 분량의 실제 본문입니다.'
        ]
      : [
          '- 한국어로 작성하고, 작가 자유 서술의 어휘와 의도를 존중합니다.',
          '- 한 편으로 완결되는 단편입니다. 회차·연재·다음 화를 가정하지 말고, 하나의 정서와 하나의 반전으로 또렷하게 끝맺습니다.',
          '- 불필요한 인물과 배경을 덜어내고, 마지막 문장이 오래 남도록 씁니다.',
          '- prose는 1500~3000자 분량의 실제 본문입니다.'
        ];

  // 정체 측정값이 있으면 회수 의무를 생성 규칙으로 주입한다 (검토 evidence 와 동일 측정값 — 생성·검토 정합).
  // 불변식 — payoffStatus 는 computePayoffLedger 산출만 받는다(measured=false 면 isStalled=false 보장). 직접 합성 금지.
  const stallRules =
    isSerial && payoffStatus && payoffStatus.isStalled
      ? [
          `- [측정] 전제 진척 정체 — 회수 없이 ${payoffStatus.deferredStreak}회차 연속(열린 약속 ${payoffStatus.openPromises}개). 이번 회차는 새 약속을 만들지 말고, 열린 약속 중 최소 하나를 인물의 선택·대가·전환으로 실제 회수합니다. 그 회수를 rewardArc 의 payoff 에 기록합니다.`
        ]
      : [];

  // 작품 헌장 예산·종반·척추 규칙 — promptBuilders.ts 미러(byte-identical). 변경 시 양쪽 동시 갱신(A-4).
  const contractRules =
    isSerial && !isEssay && contractStatus
      ? [
          ...(contractStatus.overBudget
            ? [
                `- [헌장] 약속 예산 초과 — 미회수 약속이 남은 화수보다 많습니다(미회수 ${contractStatus.unpaidCount}/잔여 ${contractStatus.remaining}). 이번 화는 새 약속·새 떡밥을 만들지 말고, 가장 오래된 약속부터 인물의 선택·대가로 실제 회수합니다. 회수를 rewardArc 의 payoff 에 적습니다.`
              ]
            : []),
          ...(contractStatus.finalStretch
            ? [
                '- [헌장] 종반 구간(전체의 마지막 25%)입니다. 새 큰 떡밥·새 약속만 금지하고(작은 인물·소품 추가는 허용), 4줄 척추의 4번(변화)으로 이미 건 약속들을 결말로 수렴시킵니다.'
              ]
            : []),
          ...((payoffStatus && payoffStatus.isStalled) || contractStatus.overBudget
            ? [
                '- [헌장] 이 회차가 4줄 척추의 어느 줄(욕망/전진/시련/변화)을 전진시키는지 의식하고 씁니다. 곁가지가 매력적이어도 헌장의 질문에서 이탈하지 않습니다.'
              ]
            : [])
        ]
      : [];

  return [
    isEssay
      ? 'Story X 에세이 초안 생성 요청.'
      : isSerial
        ? 'Story X 회차 초안 생성 요청.'
        : 'Story X 단편 원고 초안 생성 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    title ? `작품 제목: ${title}` : '작품 제목: 미정',
    '',
    '## 작품 계약과 기존 맥락 (반드시 지킬 약속·캐논·인물·설정)',
    context ? context : '(맥락 없음 — 매체와 포맷, 자유 서술만으로 첫 편을 제안하세요.)',
    '',
    '## 작가 자유 서술 (작가가 직접 적은, 쓰고 싶은 이야기)',
    freewrite || '(자유 서술 없음 — 매체와 포맷만으로 첫 편의 출발점을 제안하세요.)',
    '',
    '## 역할',
    role,
    '',
    '## 규칙',
    ...rules,
    ...stallRules,
    ...contractRules,
    '',
    isSerial ? '## 회차 구성(beats)' : '## 원고 구성(beats)',
    isEssay
      ? '- beats는 이 글의 흐름을 4~8개의 의미 단위로 나눈 구성표입니다. 각 단위는 짧은 label과 한 문장 summary로 적습니다.'
      : isSerial
        ? '- beats는 이 회차의 이야기 흐름을 4~8개의 의미 단위로 나눈 구성표입니다. 각 단위는 짧은 label과 한 문장 summary로 적습니다.'
        : '- beats는 이 단편의 이야기 흐름을 4~8개의 의미 단위로 나눈 구성표입니다. 각 단위는 짧은 label과 한 문장 summary로 적습니다.',
    '- beats는 prose 본문의 실제 전개 순서를 그대로 따라야 하며, prose를 대체하지 않는 계획층입니다.',
    isSerial
      ? '- 각 beat에는 tension을 0~100 정수로 적습니다. 이 회차에서 계획한 극적 긴장 강도이며, 도입은 낮게 시작해 클라이맥스에서 가장 높고 마무리에서 다시 풀리는 곡선을 그립니다.'
      : '- 각 beat에는 tension을 0~100 정수로 적습니다. 이 원고에서 계획한 극적 긴장 강도이며, 도입은 낮게 시작해 클라이맥스에서 가장 높고 마무리에서 다시 풀리는 곡선을 그립니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "title": "제목",',
    isEssay
      ? '  "hook": "글을 닫는 한 줄 — 독자에게 남는 울림",'
      : isSerial
        ? '  "hook": "다음 회차로 이어지는 한 줄 후크",'
        : '  "hook": "원고를 닫는 한 줄 — 독자에게 남는 울림",',
    '  "outline": ["장면/단락 비트 1", "비트 2", "비트 3"],',
    '  "beats": [{ "label": "구성 단위 이름", "summary": "이 단위에서 일어나는 일 한 문장", "tension": 0 }],',
    '  "prose": "본문",',
    isEssay
      ? '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 글에서 확정된 사실 — 작가가 말한 경험만" }],'
      : isSerial
        ? '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 회차에서 확정된 새 사실" }],'
        : '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 원고에서 확정된 새 사실" }],',
    isSerial
      ? '  "rewardArc": [{ "promise": "이 회차가 건 약속/질문", "payoff": "이 회차가 실제로 회수한 것 — 없으면 빈 문자열", "intensity": 0 }],'
      : '  "rewardArc": [{ "promise": "이 글이 건 약속", "payoff": "회수한 것", "intensity": 0 }],',
    isSerial
      ? '  "stakesLedger": [{ "stake": "위험에 놓인 것", "atRisk": "누가/무엇이", "resolution": "lost|kept|deferred — 다음 회차로 미뤘으면 deferred" }]'
      : '  "stakesLedger": [{ "stake": "위험에 놓인 것", "atRisk": "누가/무엇이", "resolution": "lost|kept" }]',
    '}'
  ].join('\n');
}

/**
 * provider 에러 시 prose 에 에러 raw 텍스트가 누수되지 않도록 결정론 폴백 payload 를 만든다.
 * storyEngine.ts 의 buildFallbackDraft 와 같은 역할을 CLI 레이어에서 수행한다.
 * prose 에는 실패 배너만 남기고, 작가가 직접 편집할 수 있는 자리표시를 넣는다.
 */
function buildCliDraftFallback({ provider, medium, format, title, freewrite, retried }) {
  const chapterTitle = title ? title : '1화 — 임시 초안';
  const retryNote = retried ? ' (재시도 포함)' : '';
  return {
    provider,
    medium,
    format,
    mode: 'draft',
    generatedAt: new Date().toISOString(),
    title: chapterTitle,
    hook: '[provider 호출 실패 — 작가 직접 입력 필요]',
    outline: ['provider 실패로 인해 개요가 생성되지 않았습니다. 직접 작성해 주세요.'],
    beats: [{ label: '도입', summary: 'provider 실패 — 직접 작성 필요.' }],
    prose: `[provider 호출이 실패${retryNote}하여 초안을 생성하지 못했습니다. 아래에 직접 작성하거나 재시도하세요.]\n\n${freewrite ? `작가 입력: ${freewrite}` : '(작가 입력 없음)'}`,
    newCanonFacts: [],
    approvalRequiredBeforeSync: true
  };
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
    beats: normalizeDraftBeats(parsed?.beats),
    prose: readString(parsed?.prose) || summarizeRawProviderOutput(rawOutput, options.title || 'Story X draft'),
    newCanonFacts: normalizeDraftCanonFacts(parsed?.newCanonFacts),
    rewardArc: normalizeDraftRewardArc(parsed?.rewardArc),
    stakesLedger: normalizeDraftStakes(parsed?.stakesLedger),
    approvalRequiredBeforeSync: true
  };
}

// provider 응답의 beats 배열을 { label, summary, tension? } 쌍으로 정규화한다. 빈 항목·구버전 응답은 버린다.
// tension은 숫자일 때만 0~100 정수로 보정해 통과시키고, 누락 시 키 자체를 빼 프런트엔드 기본값 보정에 맡긴다.
function normalizeDraftBeats(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((beat) => {
      const normalized = {
        label: readString(beat.label) || readString(beat.title),
        summary: readString(beat.summary) || readString(beat.note) || readString(beat.detail)
      };
      const tension = readBeatTension(beat.tension);
      if (tension !== null) {
        normalized.tension = tension;
      }
      return normalized;
    })
    .filter((beat) => beat.label || beat.summary);
}

// beat의 tension 값을 0~100 정수로 보정한다. 숫자가 아니면 null을 반환해 호출 측이 키를 생략하게 한다.
function readBeatTension(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
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

// 아크 페이오프 1단계 — provider 응답의 rewardArc/stakesLedger 를 정규화한다(normalizeDraftBeats 패턴).
function normalizeDraftRewardArc(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((e) => {
      const out = {
        promise: readString(e.promise),
        payoff: readString(e.payoff)
      };
      if (typeof e.intensity === 'number' && Number.isFinite(e.intensity)) {
        out.intensity = Math.max(0, Math.min(100, Math.round(e.intensity)));
      }
      return out;
    })
    .filter((e) => e.promise);
}

function normalizeDraftStakes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((e) => {
      const out = { stake: readString(e.stake), atRisk: readString(e.atRisk) };
      if (e.resolution === 'lost' || e.resolution === 'kept' || e.resolution === 'deferred') {
        out.resolution = e.resolution;
      }
      return out;
    })
    .filter((e) => e.stake);
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
    // P1 — stdin 을 즉시 EOF 로 닫는다. codex exec 는 stdin 을 비워두면 추가 입력을 기다리다
    // 'Reading additional input from stdin' 을 raw 출력에 누수하고, 그게 JSON 파싱 실패 → 빈 note 로
    // 합류해 검토가 "검토 의견이 비어 있습니다"로 뜬다. input:'' 로 대기를 없앤다.
    input: '',
    timeout: 300000,
    maxBuffer: 1024 * 1024 * 8
  });
}

/**
 * provider raw 출력이 에러 신호인지 판정한다.
 *
 * 판정 조건 (하나라도 해당하면 true):
 *   1. spawnResult.status 가 0 이 아님 (비정상 종료)
 *   2. raw 가 비어 있음 (provider 가 아무것도 출력하지 않은 경우)
 *   3. raw 가 JSON 파싱 가능한 오브젝트가 아닌데, 영문 에러 패턴을 포함
 *      — "Reading additional input from stdin", "error:", "ERROR",
 *        "Traceback", "command not found", "ENOENT", "ETIMEDOUT",
 *        "Error:", "exception", "fatal:"
 *
 * stderr 는 판정에 쓰지 않는다 — codex exec 는 **정상 성공 호출에서도**
 * stderr 에 세션 배너("Reading additional input from stdin...", workdir/model
 * 정보, 무해한 MCP transport ERROR 로그)를 출력한다(2026-06-10 라이브 실측,
 * exit 0 + stdout 정상 JSON + stderr 614바이트). stderr 비어있지-않음을 에러로
 * 보면 모든 정상 호출이 재시도+폴백으로 오판된다.
 *
 * JSON 파싱 가능한 응답(정상 provider 출력)은 raw 가 에러 키워드를 포함해도
 * false 를 반환한다 — JSON 이 성공하면 정상으로 간주.
 *
 * 이 함수는 순수 함수다. spawnResult 는 status 필드만 읽는다.
 */
function looksLikeProviderError(raw, spawnResult) {
  if (spawnResult.status !== 0) return true;
  if (!raw || raw.trim().length === 0) return true;

  // JSON 파싱이 성공하면 정상 응답 — 에러 키워드 검사를 생략한다.
  const trimmed = raw.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  for (const candidate of [fencedJson, trimmed].filter(Boolean)) {
    try {
      const value = JSON.parse(candidate);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) return false;
    } catch {
      // 다음 후보 시도
    }
  }

  // JSON 파싱 실패 — 영문 에러 패턴 확인
  const ERROR_PATTERNS = [
    'Reading additional input from stdin',
    'error:',
    'ERROR',
    'Traceback',
    'command not found',
    'ENOENT',
    'ETIMEDOUT',
    'Error:',
    'exception',
    'fatal:'
  ];
  return ERROR_PATTERNS.some((pat) => raw.includes(pat));
}

/**
 * runProvider 를 호출하되, 에러 신호가 감지되면 정확히 1회 재시도한다.
 * 재시도 후에도 에러 신호면 최종 결과를 그대로 반환한다 (caller 가 폴백 처리).
 * retried 플래그로 재시도 여부를 caller 에게 알린다.
 */
function runProviderWithRetry(commandParts) {
  const first = runProvider(commandParts);
  const firstRaw = first.stdout || first.stderr;
  if (!looksLikeProviderError(firstRaw, first)) {
    return { result: first, raw: firstRaw, retried: false };
  }
  // 에러 신호 감지 — 1회 재시도
  const second = runProvider(commandParts);
  const secondRaw = second.stdout || second.stderr;
  return { result: second, raw: secondRaw, retried: true, firstErrorRaw: firstRaw };
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


function buildPaceInterviewPrompt({ medium, format, payoffStatus, unpaidPromises, deferredStakes, context }) {
  if (!isSerialFormat(format)) return '';

  const { isStalled, deferredStreak, openPromises } = payoffStatus;

  const stallLine = isStalled
    ? `- 정체 신호 — 회수 없이 ${deferredStreak}회차 연속, 열린 약속 ${openPromises}개.`
    : `- 현재 deferredStreak=${deferredStreak}, 열린 약속 ${openPromises}개.`;

  const promisesSection = unpaidPromises.length > 0
    ? ['', '## 미회수 약속 목록', ...unpaidPromises.map((p) => `- ${p}`)]
    : ['', '## 미회수 약속 목록', '(없음)'];

  const stakesSection = deferredStakes.length > 0
    ? ['', '## 정체 중인 위험(deferred stakes)', ...deferredStakes.map((s) => `- ${s}`)]
    : ['', '## 정체 중인 위험(deferred stakes)', '(없음)'];

  return [
    'Story X 쇼러너 페이스 인터뷰 생성 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 진도 현황',
    stallLine,
    ...promisesSection,
    ...stakesSection,
    '',
    '## 작품 컨텍스트',
    context || '(컨텍스트 없음)',
    '',
    '## 역할',
    '당신은 Story X의 쇼러너입니다. 연재 페이스를 책임지는 화자로서, 작가에게 이번 화의 방향을 정하는 질문을 합니다.',
    '',
    '## 지시',
    '- 질문 1~3개를 만듭니다. 각 질문은 위 미회수 약속·정체 위험의 구체 이름을 박아서 묻습니다. 일반론 금지.',
    '- 전제 능선·이번 화 페이스·다음 회수 시점 중 어울리는 테마로 묻습니다.',
    '- 각 질문에 옵션 2~3개를 만듭니다. 각 옵션의 intentSeed 는 이번 화 생성에 줄 한 줄 지시로, 작품 맞춤 문장으로 씁니다.',
    '- 이미 일어난 일은 새 약속이 될 수 없습니다 — 기확정 캐논을 새 질문·옵션·시드로 재발급하지 않습니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "questions": [{ "question": "작품 구체 약속·위험 이름이 박힌 질문", "options": [{ "label": "선택지", "intentSeed": "이번 화 생성 한 줄 지시" }] }]',
    '}'
  ].join('\n');
}

// pace-interview provider 응답의 questions 배열을 정규화한다.
// 오형식 항목 무시·최대 3질문·질문당 옵션 최대 3·label/intentSeed 비문자열 제거.
function normalizePaceQuestions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .slice(0, 3)
    .map((q) => {
      const question = readString(q.question);
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options = rawOptions
        .filter(isRecord)
        .slice(0, 3)
        .map((o) => ({
          label: readString(o.label),
          intentSeed: readString(o.intentSeed)
        }))
        .filter((o) => o.label && o.intentSeed);
      return { question, options };
    })
    .filter((q) => q.question && q.options.length > 0);
}

// 쇼러너 4줄 척추 제안 프롬프트 — Phase A-3b.
// src/lib/server/promptBuilders.ts 의 buildSpineSuggestionPrompt 와 핵심 지시문 byte-identical 미러 — 변경 시 두 곳 동시 수정.
function buildSpineSuggestionPrompt({ medium, format, freewrite, endingStatement, protagonistCost }) {
  return [
    'Story X 쇼러너 4줄 척추 제안 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작가의 자유 서술과 인터뷰 답',
    freewrite || '(자유 서술 없음)',
    '',
    '## 확정된 결말 (있으면 4번 줄과 정렬)',
    (endingStatement || '').trim() || '(아직 미정)',
    '## 주인공이 잃는 것',
    (protagonistCost || '').trim() || '(아직 미정)',
    '',
    '## 역할',
    '당신은 Story X의 쇼러너입니다. 위 자유 서술을 읽고 이 이야기의 4줄 척추 — 주인공의 내적 변화 — 를 제안합니다.',
    '',
    '## 4줄 척추란 (외부 사건이 아니라 주인공의 내적 변화)',
    '- 1 욕망 — 결정적 상태 때문에 불가능에 가까운 무엇을 품는가',
    '- 2 전진 — 무엇을 결심하고 어떻게 나아가는가',
    '- 3 시련 — 무엇이 가로막아 상황·마음이 급변하는가',
    '- 4 변화 — 욕망·결심이 어떻게 해소되며 질문에 답하는가(표면 생사 아님)',
    '',
    '## 지시',
    '- 각 줄은 한 문장으로, 자유 서술에 등장한 구체 인물·상황을 박아 씁니다. 일반론 금지.',
    '- 결말이 확정돼 있으면 4번(변화)이 그 결말과 모순되지 않게 합니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "spine": { "desire": "...", "advance": "...", "obstacle": "...", "resolution": "..." }',
    '}'
  ].join('\n');
}

// 이번 화 전개 후보(Verbalized Sampling) 프롬프트 — Phase C-1.
// src/lib/server/promptBuilders.ts 의 buildVsCandidatesPrompt 와 핵심 지시문 byte-identical 미러 — 변경 시 두 곳 동시 수정.
function buildVsCandidatesPrompt({ medium, format, contractDigest, recentSummary, unpaidPromises }) {
  const promises = Array.isArray(unpaidPromises) ? unpaidPromises : [];
  return [
    'Story X 이번 화 전개 후보(Verbalized Sampling) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 헌장 (결말·4줄 척추·위치)',
    (contractDigest || '').trim() || '(헌장 없음)',
    '',
    '## 최근 회차 흐름',
    (recentSummary || '').trim() || '(아직 회차 없음)',
    '',
    '## 미회수 약속',
    promises.length > 0 ? promises.map((p) => `- ${p}`).join('\n') : '(없음)',
    '',
    '## 역할',
    '당신은 Story X의 쇼러너입니다. 이번 화가 어떻게 전개될지 서로 다른 방향 4개를, 각 방향이 실제로 선택될 법한 확률과 함께 제안합니다.',
    '',
    '## 지시',
    '- 방향 4개를 생성하되, 흔할 법한 전개부터 꼬리(의외)까지 확률 분포를 펼칩니다. 적어도 하나는 확률 0.15 미만의 파격을 포함합니다.',
    '- 결말 헌장은 절대 배신하지 않습니다. 결말로 수렴하는 경로만 의외로 흔듭니다.',
    '- 각 방향은 인물의 선택과 대가가 드러나는 한 문장으로 씁니다. 일반론·해설 금지.',
    '- 확률은 0과 1 사이 숫자입니다.',
    '- 각 방향의 "tension"을 판정합니다 — 새 질문·위험·갈등을 장전하면 "arms", 열린 질문·약속을 닫기만 하면 "drains". "tensionNote"에는 그 판정의 근거를 한 문장으로 씁니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "candidates": [{ "direction": "...", "probability": 0.0, "tension": "arms", "tensionNote": "..." }]',
    '}'
  ].join('\n');
}

// PLAN 설계 대화(설계실 2단계) 프롬프트 — src/lib/server/promptBuilders.ts 의 buildPlanChatPrompt 와
// 핵심 지시문 byte-identical 미러 — 변경 시 두 곳 동시 수정.
function buildPlanChatPrompt({ medium, format, activeSection, contextDigest, catalog, dialogue, query }) {
  return [
    'Story X PLAN 설계 대화(설계실) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 컨텍스트',
    (contextDigest || '').trim() || '(컨텍스트 없음)',
    '',
    '## 엔티티 카탈로그 (제안은 반드시 아래 실존 id 만 겨냥)',
    (catalog || '').trim() || '(카탈로그 없음)',
    '',
    '## 지금 보는 섹션',
    (activeSection || '').trim() || '(미지정)',
    '',
    '## 최근 대화',
    (dialogue || '').trim() || '(첫 대화)',
    '',
    '## 작가의 말',
    (query || '').trim(),
    '',
    '## 역할',
    '당신은 Story X 설계실의 설계 파트너입니다. 바이블 큐레이터의 성격으로 — 작가의 설계를 대신 정하지 않고, 질문하고 다듬고 제안합니다.',
    '',
    '## 지시',
    '- reply 는 작가의 말에 대한 응답입니다. 짧고 구체적으로, 설계의 빈 곳·모순·기회를 짚습니다.',
    '- proposals 는 0~3개. 바이블 필드의 구체 수정안이 있을 때만 냅니다. 대화만 해도 됩니다.',
    '- 제안은 엔티티 카탈로그의 실존 id 만 겨냥합니다. kind 별 필드 — character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone · world/canon: 필드 없음.',
    '- rationale 에 그 제안의 근거를 한 문장으로 씁니다.',
    '- 결말 헌장은 절대 배신하지 않습니다. 새 인물 추가·헌장 개정은 제안하지 않습니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "reply": "...", "proposals": [{ "kind": "character", "targetId": "...", "field": "desire", "after": "...", "rationale": "..." }]',
    '}'
  ].join('\n');
}

// PLAY 응결 프롬프트 — src/lib/server/promptBuilders.ts 의 buildDiveCondensePrompt와 전체 결과 byte-identical 유지.
function buildDiveCondensePrompt({ character, scene, context, transcript, arc }) {
  return [
    'Dive X 회차 응결 요청. 아래 실시간 대화를, 나와 캐릭터를 함께 주인공으로 한 3인칭 서사 회차로 장면화하세요.',
    'PLAY의 반복·머뭇거림은 덜어내되, 일어난 사건·감정 변화·약속은 보존하고 행동·감각·인물별 대사로 다시 배열하세요.',
    '사용자가 자유롭게 들이민 비현실·즉흥 설정도 버리지 말고, 기존 캐논·현재 장면과 모순되지 않는 선에서 그럴듯한 인과로 연결하세요. 이미 확정된 하드 캐논은 임의로 뒤집지 마세요.',
    '',
    '## 장면화 품질 계약',
    '- 본문은 한국어 기준 1,800~2,700자로 씁니다. 재료가 부족하면 설정을 발명하거나 같은 내용을 반복해 분량을 억지로 채우지 말고, 짧더라도 주어진 사실 범위를 지킵니다.',
    '- 최종 허용 범위는 1,800~2,700자로 유지하되, 모델의 글자 수 계산 편차를 고려해 생성 목표는 1,900~2,600자로 둡니다. 하한과 상한 모두에 안전 여유를 남깁니다.',
    '- 완료 전에 prose 글자 수를 직접 확인합니다. 1,800자 미만이면 새 설정·기능적 해설·같은 내용 반복으로 채우지 말고, 입력에 이미 있는 장면의 행동·감각·갈등 대사를 더 구체화합니다. 입력 재료가 실제로 부족할 때만 사실 범위를 지키기 위해 1,800자 미만을 허용합니다.',
    '- 서로 다른 압력을 가진 현재 장면 2~3개로 재구성합니다. 사건 보고나 줄거리 요약으로 대신하지 않습니다.',
    '- 원문에 인물 간 대화가 있으면 서로 원하는 것이 부딪히는 직접 대화 교환을 최소 1회 장면 안에 넣습니다. 원문에 없는 핵심 사실을 대사로 발명하지 않습니다.',
    '- 각 장면은 압력을 높이거나, 선택지를 줄이거나, 실제 대가를 발생시켜야 합니다.',
    '- 같은 장면 안에서 모두가 합리적으로 합의해 갈등을 봉합하지 않습니다.',
    '- 이번 회차는 열린 질문 하나에 답하고, 그 답 때문에 더 날카로운 다음 질문을 엽니다.',
    '- 마지막 2~3문장은 구체적인 반전·위협·기한·강제된 선택 중 하나로 끝냅니다. 주제나 교훈을 요약하며 닫지 않습니다.',
    '- 테스트·QA·복구·UI 안내·스키마·타임스탬프처럼 작품 밖 메타 표식은, 사용자가 작품 내부 고유명사라고 명시하지 않은 한 title·hook·outline·beats·prose·newCanonFacts 어디에도 넣지 않습니다.',
    '- newCanonFacts에는 원문·현재 장면·기존 캐논에 명시된 사실과 장면 성립에 꼭 필요한 최소 추론만 넣습니다. 근거 없는 새 이름·기관·범행 원인·시간·관계는 확정하지 않습니다.',
    '- 초안을 장면화한 뒤, 기존 기억의 "한국어 문체·보이스 규칙"을 마지막 문장 패스로 적용합니다. 사건·사실은 바꾸지 않고 문장 리듬·어휘·말투를 그 규칙에 맞춥니다.',
    '- "한국어 문체·보이스 규칙"을 최종 검수 체크리스트로 사용합니다. 물리적 신호로 드러낸 감정을 바로 뒤에서 감정 이름으로 재설명하지 않고, 규칙에 적힌 금지어를 최종 원고에 남기지 않습니다.',
    '- 인물별 호칭·높임말·말끝은 원문과 캐릭터 카드의 근거를 따릅니다. 근거 없이 반말과 존댓말을 오가거나 호칭을 바꾸지 않습니다.',
    '- 장면 연결과 말미에서는 질문·선택을 기능적으로 해설하거나 요약하지 말고, 사물·행동·대사로 압력을 보여줍니다. 인과를 설명한 뒤 내리는 결정은 구체 동사의 독립 단문으로 둡니다.',
    '- 캐릭터 카드의 욕망·말투·우선순위를 서술자가 요약·평가하거나 이행 보고처럼 재진술하지 않습니다. 독자가 행동과 대사에서만 알아차리게 합니다.',
    '- 말투 규칙은 캐릭터의 실제 대사 배열에만 적용합니다. 대사 앞뒤에 문장 길이·말끝·호칭의 변화를 해설하는 문장을 추가하지 않습니다.',
    '- prose에서 장면 기능을 "질문"·"문제"·"선택"·"답"이라고 명명하지 않고, 이미 드러난 양자택일을 다시 비교 설명하지 않습니다. 딜레마가 드러나면 즉시 행동으로 넘어갑니다.',
    '- 마지막 2~3문장은 각 문장마다 하나의 구체 행동·감각·시한만 담은 독립문으로 둡니다. 행동 직전에 의미·동기·선택을 해설하지 않습니다.',
    '',
    '## 현재 장면',
    scene || '(장면 미설정)',
    '',
    '## 이야기 아크 (JSON — 긴장·다음 전개를 반영해 페이오프 있는 회차로)',
    arc || '(없음)',
    '',
    '## 캐릭터',
    character || '(미정)',
    '',
    '## 기존 기억(캐논 — 모순 금지)',
    context || '(아직 없음)',
    '',
    '## 응결할 대화',
    transcript,
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{',
    '  "title": "이 회차 제목",',
    '  "hook": "다음을 부르는 한 줄",',
    '  "outline": ["장면 비트 1", "비트 2"],',
    '  "beats": [{ "label": "구성 단위", "summary": "한 문장", "tension": 0 }],',
    '  "prose": "3인칭 본문",',
    '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 회차에서 확정된 새 사실(약속·사건·관계 변화)" }]',
    '}'
  ].join('\n');
}

// 온보딩 구상 대화(함께 구상) 프롬프트 — src/lib/server/promptBuilders.ts 의 buildOnboardChatPrompt 와
// 핵심 지시문 byte-identical 미러 — 변경 시 두 곳 동시 수정.
function buildOnboardChatPrompt({ medium, format, freewrite, dialogue, query, condense }) {
  return [
    'Story X 온보딩 구상 대화(함께 구상) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 먼저 적어둔 자유 서술 (있으면 소재의 씨앗)',
    (freewrite || '').trim() || '(없음)',
    '',
    '## 최근 대화',
    (dialogue || '').trim() || '(첫 대화)',
    '',
    '## 작가의 말',
    (query || '').trim(),
    '',
    '## 역할',
    '당신은 Story X 온보딩의 구상 파트너입니다. 작가는 아직 작품이 없습니다 — 수다 떨듯 소재를 함께 캐고, 인물과 장면이 잡히면 플레이 시드를 제안합니다.',
    '',
    '## 지시',
    '- reply 는 작가의 말에 대한 응답입니다. 짧고 구체적으로 — 한 턴에 질문은 하나만, 작가가 낸 재료를 되받아 넓힙니다.',
    '- setup 은 소재가 무르익었을 때만 포함합니다 — 상대 인물, 첫 장면, 작가가 연기할 역할이 대화에서 잡혔을 때. 아직이면 setup 필드를 넣지 않습니다.',
    '- setup.cast 는 상대 인물 1~3명 — name·role·desire·wound·voiceRules 를 대화에 나온 재료로 채웁니다. 작가 자신의 역할은 cast 에 넣지 않고 myRole 에만 씁니다.',
    '- setup.scene 은 플레이가 시작될 첫 장면 한 단락, setup.myRole 은 작가가 연기할 주인공의 입장 한 줄입니다.',
    '- 대화에 없는 설정을 지어내지 않습니다. 빈 곳은 대화에서 나온 재료의 자연스러운 구체화로만 채웁니다.',
    '- 한국어로 씁니다.',
    ...(condense
      ? ['- 작가가 이 소재로 시작하기로 했습니다. 이번 턴에는 reply 를 한 문장으로 짧게 하고, 지금까지 나온 재료를 응결한 setup 을 반드시 포함합니다.']
      : []),
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "reply": "...", "setup": { "scene": "...", "cast": [{ "name": "...", "role": "...", "desire": "...", "wound": "...", "voiceRules": ["..."] }], "myRole": "..." }',
    '}'
  ].join('\n');
}

// spine-suggest provider 응답의 spine 객체를 정규화한다. 4줄 모두 비면 null.
function normalizeSpineSuggestion(value) {
  if (!isRecord(value)) return null;
  const spine = {
    desire: readString(value.desire),
    advance: readString(value.advance),
    obstacle: readString(value.obstacle),
    resolution: readString(value.resolution)
  };
  if (!spine.desire && !spine.advance && !spine.obstacle && !spine.resolution) return null;
  return spine;
}
