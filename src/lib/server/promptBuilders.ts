// 서버측 LLM 프롬프트 빌더 + 페르소나 로더.
// Vercel Functions (`api/*.ts`) 와 향후 storyx.mjs 마이그레이션이 공통으로 쓴다.
// 같은 로직이 tools/storyx.mjs 에도 있지만 로컬 CLI 호환을 위해 당분간 양쪽 유지. 변경 시 두 곳을 함께 수정.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isSerialFormat, type CreativeFormat } from '../projectBlueprint';

export interface PersonaTone {
  label?: string;
  tone?: string;
  questionStarters?: string[];
  blockingSignals?: string[];
}

export interface InterviewPromptInput {
  medium: string;
  format: CreativeFormat;
  freewrite: string;
  personas?: PersonaTone[];
}

export interface DraftPromptInput {
  medium: string;
  format: CreativeFormat;
  freewrite: string;
  title?: string;
  context?: string;
}

export interface ReviewPromptInput {
  scale: string;
  target: string;
  medium: string;
  context: string;
}

export interface AgentReviewPromptInput {
  agentId: string;
  persona: string;
  target: string;
  medium: string;
  context: string;
}

export interface DataReviewPromptInput {
  category: string;
  target: string;
  medium: string;
  context: string;
}

// .claude/agents/<file>.md 페르소나 본문을 읽고 프런트매터 제거.
// review-agent 흐름에서 한 에이전트의 정체성을 LLM 에게 넘기는 데 쓴다.
const AGENT_FILE_MAP: Record<string, string> = {
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
  // M4 신설 12명
  'canon-librarian': 'canon-librarian',
  'timeline-keeper': 'timeline-keeper',
  'bible-curator': 'bible-curator',
  'critic-reviewer': 'critic-reviewer',
  'essay-curator': 'essay-curator',
  'memory-evolution-keeper': 'memory-evolution-keeper',
  'studio-architect': 'studio-architect',
  'interview-curator': 'interview-curator',
  'book-designer': 'book-designer',
  'pr-specialist': 'pr-specialist',
  'platform-curator': 'platform-curator',
  'business-strategist': 'business-strategist'
};

export function loadAgentPersona(agentId: string): string {
  const file = AGENT_FILE_MAP[agentId];
  if (!file) return '';
  const path = join(process.cwd(), '.claude', 'agents', `${file}.md`);
  if (!existsSync(path)) return '';
  try {
    return readFileSync(path, 'utf8').replace(/^---[\s\S]*?---\s*/, '').trim();
  } catch {
    return '';
  }
}

// 작가 인터뷰 질문 6~8개를 생성하기 위한 LLM 프롬프트. 매체별 인터뷰어 분배 규칙 포함.
export function buildInterviewPrompt(input: InterviewPromptInput): string {
  const { medium, format, freewrite, personas = [] } = input;
  const isEssay = medium === 'essay';
  const isSerial = isSerialFormat(format);

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
          ]
            .filter(Boolean)
            .join('\n');
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
    '- continuity-editor: 연속성과 캐논',
    '',
    '## 규칙',
    '- 자유 서술에 실제로 나온 소재·인물·설정을 근거로, 이 작품에만 맞는 구체적 질문을 만듭니다. 일반론 금지.',
    '- 각 질문은 객관식 선택지 3개와, 각 선택지가 작품에 미치는 영향(impact)을 함께 답니다.',
    isEssay
      ? '- 에세이이므로 essay-interviewer를 반드시 포함하고, 작가가 적지 않은 사실을 지어내는 선택지는 만들지 않습니다.'
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
    '      "agentId": "showrunner|character-custodian|world-keeper|voice-curator|essay-interviewer|essay-thesis|continuity-editor",',
    '      "question": "이 작품에 대한 구체적인 질문",',
    '      "options": [{ "label": "선택지", "impact": "이 선택이 작품에 미치는 영향" }],',
    '      "recommendedOptionLabel": "추천 선택지의 label"',
    '    }',
    '  ]',
    '}'
  ].join('\n');
}

// 회차/단편/에세이 초안 본문을 통째로 생성. beats(긴장 곡선) 포함.
export function buildDraftPrompt(input: DraftPromptInput): string {
  const { medium, format, freewrite, title, context } = input;
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
          '- prose는 1500~3000자 분량의 실제 본문입니다.'
        ]
      : [
          '- 한국어로 작성하고, 작가 자유 서술의 어휘와 의도를 존중합니다.',
          '- 한 편으로 완결되는 단편입니다. 회차·연재·다음 화를 가정하지 말고, 하나의 정서와 하나의 반전으로 또렷하게 끝맺습니다.',
          '- 불필요한 인물과 배경을 덜어내고, 마지막 문장이 오래 남도록 씁니다.',
          '- prose는 1500~3000자 분량의 실제 본문입니다.'
        ];

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
      ? '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 글에서 확정된 사실 — 작가가 말한 경험만" }]'
      : isSerial
        ? '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 회차에서 확정된 새 사실" }]'
        : '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 원고에서 확정된 새 사실" }]',
    '}'
  ].join('\n');
}

// 딥 검토 — 여러 에이전트 시선이 한 응답으로 합쳐진 종합 검토.
export function buildReviewPrompt(input: ReviewPromptInput): string {
  const { scale, target, medium, context } = input;
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

// 에이전트 1명씩 분리 검토 — 페르소나 .md 를 정체성으로 주입.
export function buildAgentReviewPrompt(input: AgentReviewPromptInput): string {
  const { agentId, persona, target, medium, context } = input;
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

// 캐논 분야(인물/장소/사물/사건/시간선) 의 작품 내 정합·보강 제안.
export function buildDataReviewPrompt(input: DataReviewPromptInput): string {
  const { category, target, medium, context } = input;
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

// LLM 응답에서 JSON 객체만 추출. 코드펜스·prose 가 섞여 와도 첫 { ... } 범위를 잘라 파싱.
export function parseLlmJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
