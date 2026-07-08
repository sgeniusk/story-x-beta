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

export interface PaceInterviewPromptInput {
  medium: string;
  format: CreativeFormat;
  payoffStatus: { isStalled: boolean; deferredStreak: number; openPromises: number };
  unpaidPromises: string[];
  deferredStakes: string[];
  context: string;
}

/** VS 전개 후보(Verbalized Sampling) 입력 — Phase C-1. 이번 화 방향 4개 + 확률 분포를 verbalize 시킨다. */
export interface VsCandidatesPromptInput {
  medium: string;
  format: CreativeFormat;
  contractDigest?: string;
  recentSummary: string;
  unpaidPromises: string[];
}

// PLAN 설계 대화(설계실 2단계). 단일 설계 파트너 + 승인형 패치 제안 0~3개.
export interface PlanChatPromptInput {
  medium: string;
  format: CreativeFormat;
  activeSection: string;
  contextDigest: string;
  catalog: string;
  dialogue: string;
  query: string;
}

/** 4줄 척추 제안 입력 — Phase A-3b. charter 단계에 있는 자유 서술·결말·대가를 받는다. */
export interface SpineSuggestionPromptInput {
  medium: string;
  format: CreativeFormat;
  freewrite: string;
  endingStatement?: string;
  protagonistCost?: string;
}

/** 작품 헌장 화수 예산 상태 — episodeBriefing.buildContractStatus 산출과 1:1(순환 의존 회피 위해 형태만 복제). */
export interface ContractStatusInput {
  remaining: number;
  unpaidCount: number;
  overBudget: boolean;
  finalStretch: boolean;
}

export interface DraftPromptInput {
  medium: string;
  format: CreativeFormat;
  freewrite: string;
  title?: string;
  context?: string;
  /** 아크 페이오프 — 정체 시 생성 프롬프트에 회수 의무를 주입한다. */
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number };
  /** 작품 헌장 예산 — 연재 + 헌장 잠금 시 예산·종반·척추 규칙을 주입한다(A-4). */
  contractStatus?: ContractStatusInput;
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
  /** 아크 페이오프 1단계 — 연재 정체 측정값. 있으면 검토에 evidence 로 주입한다. */
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number; paidPromises?: number };
  /** 작품 헌장 예산 — 있으면 쇼러너 검토에 길 잃음 점검을 주입한다(A-4). */
  contractStatus?: ContractStatusInput;
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
  const isAcademic = medium === 'academic';
  const isSerial = isSerialFormat(format);
  const agentIdChoices = isAcademic
    ? 'showrunner|voice-curator|essay-interviewer|essay-thesis|essay-curator|critic-reviewer|interview-curator|continuity-editor'
    : 'showrunner|character-custodian|world-keeper|voice-curator|essay-interviewer|essay-thesis|continuity-editor';

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

// 회차/단편/에세이 초안 본문을 통째로 생성. beats(긴장 곡선) 포함.
export function buildDraftPrompt(input: DraftPromptInput): string {
  const { medium, format, freewrite, title, context, payoffStatus, contractStatus } = input;
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
          // P12(#3 ch5 캐논 충돌) — 기확정 사실(예: 이미 한 고백)을 새 promise 로 재발급하면 다음 회차가 모순 회차가 된다. storyx.mjs 미러와 byte-identical 유지.
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
    isSerial && payoffStatus?.isStalled
      ? [
          `- [측정] 전제 진척 정체 — 회수 없이 ${payoffStatus.deferredStreak}회차 연속(열린 약속 ${payoffStatus.openPromises}개). 이번 회차는 새 약속을 만들지 말고, 열린 약속 중 최소 하나를 인물의 선택·대가·전환으로 실제 회수합니다. 그 회수를 rewardArc 의 payoff 에 기록합니다.`
        ]
      : [];

  // 작품 헌장 예산·종반·척추 규칙 — 연재 + 헌장 잠금(contractStatus)일 때만(A-4). storyx.mjs 미러와 byte-identical 유지.
  // 종반은 새 큰 떡밥만 금지(2026-06-12 결정 — 작은 인물·소품 추가는 허용). 척추 환기는 정체·이탈 신호일 때만(토큰 절약).
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
          ...(payoffStatus?.isStalled || contractStatus.overBudget
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
  const { agentId, persona, target, medium, context, payoffStatus, contractStatus } = input;
  const payoffEvidence = payoffStatus?.isStalled
    ? [
        `- [측정] 전제 진척 정체 신호 — 회수 없이 ${payoffStatus.deferredStreak}회차 연속(열린 약속 ${payoffStatus.openPromises}개). criteriaKey: stakes_progression_audit. 이 회차가 행동·대가·전환으로 약속에 다가가는지 특히 엄격히 본다.`
      ]
    : [];
  // 흡인력 게이트 조기 소진 신호(2026-07-06) — critic-reviewer 한정. paidPromises>0 이 오탐 가드
  // (computePayoffLedger 는 rewardArc 미사용 작품에서 openPromises 0 을 돌려주므로, 약속을 실제로 쓰다가
  // 전부 회수된 경우만 신호). 정체(isStalled)와 배타, 종반(finalStretch)은 소진이 정상이라 제외. storyx.mjs 미러.
  const compellingnessEvidence =
    agentId === 'critic-reviewer' &&
    payoffStatus && !payoffStatus.isStalled &&
    payoffStatus.openPromises === 0 && (payoffStatus.paidPromises ?? 0) > 0 &&
    contractStatus && !contractStatus.finalStretch
      ? [
          `- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 ${contractStatus.remaining}회차. criteriaKey: tension_decay_audit. 이 회차가 새 질문·새 긴장을 장전하는지 특히 엄격히 본다.`
        ]
      : [];
  // 작품 헌장 길 잃음 점검 — 헌장이 있으면 척추 이탈·예산 초과를 검토 지시로 주입(A-4). storyx.mjs 미러.
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

// 쇼러너 관점의 페이스 인터뷰 프롬프트.
// 연재 한정 — 단독 완결형이면 빈 문자열을 반환한다(CLI 가드: 호출부가 빈 questions 처리).
// storyx.mjs 의 buildPaceInterviewPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildPaceInterviewPrompt(input: PaceInterviewPromptInput): string {
  const { medium, format, payoffStatus, unpaidPromises, deferredStakes, context } = input;
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

// 쇼러너 4줄 척추 제안 프롬프트 — Phase A-3b. charter 단계의 자유 서술·결말을 읽고 4줄을 제안한다.
// storyx.mjs 의 buildSpineSuggestionPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildSpineSuggestionPrompt(input: SpineSuggestionPromptInput): string {
  const { medium, format, freewrite, endingStatement, protagonistCost } = input;
  return [
    'Story X 쇼러너 4줄 척추 제안 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작가의 자유 서술과 인터뷰 답',
    freewrite || '(자유 서술 없음)',
    '',
    '## 확정된 결말 (있으면 4번 줄과 정렬)',
    endingStatement?.trim() || '(아직 미정)',
    '## 주인공이 잃는 것',
    protagonistCost?.trim() || '(아직 미정)',
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

// 이번 화 전개 후보(Verbalized Sampling) 프롬프트 — Phase C-1. "방향 4개 + 확률"을 verbalize 시켜 꼬리분포 의외성을 띄운다.
// storyx.mjs 의 buildVsCandidatesPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildVsCandidatesPrompt(input: VsCandidatesPromptInput): string {
  const { medium, format, contractDigest, recentSummary, unpaidPromises } = input;
  return [
    'Story X 이번 화 전개 후보(Verbalized Sampling) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 헌장 (결말·4줄 척추·위치)',
    contractDigest?.trim() || '(헌장 없음)',
    '',
    '## 최근 회차 흐름',
    recentSummary.trim() || '(아직 회차 없음)',
    '',
    '## 미회수 약속',
    unpaidPromises.length > 0 ? unpaidPromises.map((p) => `- ${p}`).join('\n') : '(없음)',
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

// PLAN 설계 대화(설계실 2단계) 프롬프트 — 단일 설계 파트너 + 승인형 패치 제안.
// storyx.mjs 의 buildPlanChatPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildPlanChatPrompt(input: PlanChatPromptInput): string {
  const { medium, format, activeSection, contextDigest, catalog, dialogue, query } = input;
  return [
    'Story X PLAN 설계 대화(설계실) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 컨텍스트',
    contextDigest.trim() || '(컨텍스트 없음)',
    '',
    '## 엔티티 카탈로그 (제안은 반드시 아래 실존 id 만 겨냥)',
    catalog.trim() || '(카탈로그 없음)',
    '',
    '## 지금 보는 섹션',
    activeSection.trim() || '(미지정)',
    '',
    '## 최근 대화',
    dialogue.trim() || '(첫 대화)',
    '',
    '## 작가의 말',
    query.trim(),
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
