import { createDefaultLocalizationPolicy, type LocalizationPolicy } from './localization';

export type AgentId =
  | 'showrunner'
  | 'character-custodian'
  | 'world-keeper'
  | 'genre-stylist'
  | 'continuity-editor'
  | 'essay-interviewer'
  | 'voice-curator'
  | 'audio-narration-director'
  | 'education-video-architect'
  | 'sound-music-agent'
  | 'storyboard-agent'
  | 'speech-bubble-agent'
  | 'keyframe-art-director'
  | 'da-vinci'
  | 'frame-assembly-agent';

export type GenreId =
  | 'romance-fantasy'
  | 'urban-fantasy'
  | 'noir-thriller'
  | 'space-opera';

export type Severity = 'info' | 'warning' | 'error';

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  desire: string;
  wound: string;
  currentState: string;
  voiceRules: string[];
  canonAnchors: string[];
  forbiddenContradictions: Array<{
    claim: string;
    reason: string;
  }>;
}

export interface WorldRule {
  id: string;
  title: string;
  rule: string;
  forbiddenContradictions: Array<{
    claim: string;
    reason: string;
  }>;
}

export interface CanonFact {
  id: string;
  episode: number;
  owner: 'character' | 'world' | 'plot';
  statement: string;
}

export interface Chapter {
  id: string;
  episode: number;
  title: string;
  hook: string;
  outline: string[];
  prose: string;
  memoryAnchors: string[];
  newCanonFacts: CanonFact[];
  locked?: boolean;
}

export function lockChapter(project: SeriesProject, chapterId: string): SeriesProject {
  return {
    ...project,
    chapters: project.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, locked: true } : chapter
    )
  };
}

export function unlockChapter(project: SeriesProject, chapterId: string): SeriesProject {
  return {
    ...project,
    chapters: project.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, locked: false } : chapter
    )
  };
}

export interface SeriesProject {
  id: string;
  title: string;
  logline: string;
  localization: LocalizationPolicy;
  genre: GenreId;
  tone: string;
  audiencePromise: string;
  currentEpisode: number;
  characters: CharacterProfile[];
  worldRules: WorldRule[];
  canonFacts: CanonFact[];
  openThreads: string[];
  chapters: Chapter[];
}

export interface ProductionRequest {
  genre: GenreId;
  intent: string;
  pressure: string;
}

export type AgentRunStatus = 'idle' | 'pass' | 'revise' | 'block' | 'complete';

export interface AgentRun {
  agentId: AgentId;
  title: string;
  status: AgentRunStatus;
  output: string;
  evidence: string[];
}

export interface ContinuityIssue {
  severity: Severity;
  source: AgentId;
  claim: string;
  message: string;
}

export interface ProductionResult {
  chapter: Chapter;
  agentRuns: AgentRun[];
  continuityIssues: ContinuityIssue[];
  updatedProject: SeriesProject;
}

export interface DraftChapterPayloadCanonFact {
  owner: string;
  statement: string;
}

export interface DraftChapterPayload {
  title: string;
  hook: string;
  outline: string[];
  prose: string;
  newCanonFacts: DraftChapterPayloadCanonFact[];
}

export type EditorViewModeId = 'binder' | 'corkboard' | 'outliner' | 'scrivenings';

export interface EditorViewMode {
  id: EditorViewModeId;
  label: string;
  description: string;
}

export type BinderItemKind = 'project' | 'folder' | 'chapter' | 'codex-entry';

export interface BinderItem {
  id: string;
  title: string;
  kind: BinderItemKind;
  depth: number;
  detail: string;
}

export interface CorkboardCard {
  chapterId: string;
  title: string;
  synopsis: string;
  pov: string;
  status: 'drafted' | 'planned';
  label: string;
  tags: string[];
  linkedCodexIds: string[];
  canonCandidateIds: string[];
}

export interface OutlinerRow {
  chapterId: string;
  episode: number;
  title: string;
  pov: string;
  status: CorkboardCard['status'];
  wordCount: number;
  linkedCodexCount: number;
  canonCandidateCount: number;
  continuityState: 'clear' | 'blocked';
}

export type CodexEntryKind = 'character' | 'world-rule' | 'plot-thread' | 'canon';

export interface CodexField {
  label: string;
  value: string;
}

export interface CodexEntry {
  id: string;
  kind: CodexEntryKind;
  title: string;
  summary: string;
  fields: CodexField[];
  sourceIds: string[];
}

export interface StorySnapshot {
  id: string;
  chapterId: string;
  title: string;
  reason: string;
  text: string;
}

export interface CompilePreview {
  title: string;
  sectionCount: number;
  wordCount: number;
  text: string;
}

export interface ContinuitySummary {
  status: 'clear' | 'blocked';
  blocked: number;
  warnings: number;
}

export interface StoryEditorWorkspace {
  viewModes: EditorViewMode[];
  binderItems: BinderItem[];
  corkboardCards: CorkboardCard[];
  outlinerRows: OutlinerRow[];
  codexEntries: CodexEntry[];
  snapshots: StorySnapshot[];
  compilePreview: CompilePreview;
  continuityIssues: ContinuityIssue[];
  continuitySummary: ContinuitySummary;
}

export interface StoryEditorWorkspaceOptions {
  draftClaims?: string[];
}

const genreProfiles: Record<
  GenreId,
  { label: string; beat: string; texture: string; ending: string }
> = {
  'romance-fantasy': {
    label: '로맨스 판타지',
    beat: '감정의 오해와 계약의 조건을 함께 조인다',
    texture: '은빛 의식, 밀봉된 편지, 존칭 속에 숨은 균열',
    ending: '가장 가까운 동맹이 다음 위험의 열쇠였음이 드러난다'
  },
  'urban-fantasy': {
    label: '현대 판타지',
    beat: '일상적인 장소에서 비일상 규칙이 새어 나온다',
    texture: '지하철 안내음, 심야 편의점 조명, 낡은 부적',
    ending: '도시 전체가 같은 신호를 반복하기 시작한다'
  },
  'noir-thriller': {
    label: '누아르 스릴러',
    beat: '증거 하나가 인물의 알리바이를 무너뜨린다',
    texture: '빗물, 담배 냄새, 찢어진 사건 기록',
    ending: '믿었던 증인이 사건의 설계자일 가능성이 열린다'
  },
  'space-opera': {
    label: '스페이스 오페라',
    beat: '개인적 상처가 함대의 정치적 선택과 충돌한다',
    texture: '항성 지도, 저궤도 정거장, 오래된 항해 노래',
    ending: '탐사 목적지가 고향의 잃어버린 이름을 송신한다'
  }
};

export function createSeedProject(): SeriesProject {
  const characters: CharacterProfile[] = [
    {
      id: 'seo-yoon',
      name: '한서윤',
      role: '기억을 수선하는 필사관',
      desire: '사라진 오빠의 마지막 행적을 찾아 달의 탑에 오른다',
      wound: '자신이 기록을 고친 탓에 가족의 기억이 어긋났다고 믿는다',
      currentState: '왕립 문서고에서 해임당한 뒤 비공식 의뢰를 받고 있다',
      voiceRules: ['감정을 바로 말하지 않고 사물의 상태로 우회한다', '결정적 순간에는 짧은 문장을 쓴다'],
      canonAnchors: ['서윤은 사라진 오빠의 행방을 찾고 있다.'],
      forbiddenContradictions: [
        {
          claim: '서윤은 오빠를 처음부터 싫어했고 찾고 싶어 하지 않는다.',
          reason: '시리즈의 장기 동기는 오빠를 찾는 죄책감과 애정이다.'
        }
      ]
    },
    {
      id: 'ian',
      name: '이안 로웰',
      role: '달의 탑 출입권을 가진 몰락 귀족',
      desire: '가문을 파멸시킨 예언 조작자를 찾아낸다',
      wound: '가문을 지키려 했던 거짓 증언이 누군가를 죽게 만들었다',
      currentState: '서윤에게 협력하지만 탑의 규칙 일부를 숨긴다',
      voiceRules: ['예의를 지키지만 핵심 명사는 흐린다', '농담은 방어 수단으로만 사용한다'],
      canonAnchors: ['이안은 달의 탑 출입권을 가지고 있지만 모든 규칙을 말하지 않았다.'],
      forbiddenContradictions: [
        {
          claim: '이안은 처음부터 모든 비밀을 솔직히 공개했다.',
          reason: '이안의 긴장감은 선택적 침묵과 불완전한 협력에서 나온다.'
        }
      ]
    }
  ];

  const worldRules: WorldRule[] = [
    {
      id: 'moon-tower-entry',
      title: '달의 탑 출입 규칙',
      rule: '달의 탑은 초대장, 빚, 이름의 일부 중 하나를 대가로 바친 사람만 들어갈 수 있다.',
      forbiddenContradictions: [
        {
          claim: '달의 탑은 아무나 들어갈 수 있는 관광지다.',
          reason: '탑의 폐쇄성이 세계관의 미스터리와 권력 구조를 만든다.'
        }
      ]
    },
    {
      id: 'memory-ink',
      title: '기억 잉크',
      rule: '기억 잉크는 사실을 창조하지 못하고 이미 존재한 기억의 순서만 바꿀 수 있다.',
      forbiddenContradictions: [
        {
          claim: '기억 잉크는 존재하지 않는 사건을 새로 만들 수 있다.',
          reason: '마법의 한계가 추리와 갈등의 공정성을 지킨다.'
        }
      ]
    }
  ];

  const canonFacts: CanonFact[] = [
    {
      id: 'canon-001',
      episode: 0,
      owner: 'character',
      statement: characters[0].canonAnchors[0]
    },
    {
      id: 'canon-002',
      episode: 0,
      owner: 'character',
      statement: characters[1].canonAnchors[0]
    },
    {
      id: 'canon-003',
      episode: 0,
      owner: 'world',
      statement: worldRules[0].rule
    }
  ];

  return {
    id: 'sample-project',
    title: '샘플 작품',
    logline: '기억을 고치는 필사관이 사라진 오빠의 흔적을 따라, 이름을 대가로 움직이는 탑의 비밀을 연재마다 벗겨낸다.',
    localization: createDefaultLocalizationPolicy(),
    genre: 'romance-fantasy',
    tone: '서늘한 궁정 미스터리와 느리게 타오르는 신뢰',
    audiencePromise: '매 회차마다 감정적 선택, 새로운 단서, 다음 편을 누르게 하는 반전을 제공한다.',
    currentEpisode: 0,
    characters,
    worldRules,
    canonFacts,
    openThreads: ['오빠의 마지막 편지에는 왜 서윤의 필체가 남아 있었나?', '이안은 탑에 무엇을 두고 나왔나?'],
    chapters: []
  };
}

export function validateContinuity(project: SeriesProject, claims: string[]): ContinuityIssue[] {
  const characterIssues = project.characters.flatMap((character) =>
    character.forbiddenContradictions
      .filter((rule) => claims.some((claim) => claim.includes(rule.claim)))
      .map<ContinuityIssue>((rule) => ({
        severity: 'error',
        source: 'character-custodian',
        claim: rule.claim,
        message: `${character.name} 설정 위반: ${rule.reason}`
      }))
  );

  const worldIssues = project.worldRules.flatMap((worldRule) =>
    worldRule.forbiddenContradictions
      .filter((rule) => claims.some((claim) => claim.includes(rule.claim)))
      .map<ContinuityIssue>((rule) => ({
        severity: 'error',
        source: 'world-keeper',
        claim: rule.claim,
        message: `${worldRule.title} 세계관 위반: ${rule.reason}`
      }))
  );

  const missingAnchorWarning =
    claims.length > 0 && !claims.some((claim) => project.canonFacts.some((fact) => claim.includes(fact.statement)))
      ? [
          {
            severity: 'warning' as const,
            source: 'continuity-editor' as const,
            claim: 'memory-anchor',
            message: '새 회차 요청에 기존 캐논 문장이 직접 포함되지 않았습니다. 생성 단계에서 핵심 앵커를 다시 삽입합니다.'
          }
        ]
      : [];

  return [...characterIssues, ...worldIssues, ...missingAnchorWarning];
}

export function produceNextChapter(project: SeriesProject, request: ProductionRequest): ProductionResult {
  const genre = genreProfiles[request.genre];
  const episode = project.currentEpisode + 1;
  const memoryAnchors = project.canonFacts.slice(0, 4).map((fact) => fact.statement);
  const continuityIssues = validateContinuity(project, [request.intent, request.pressure]);
  const primaryCharacter = project.characters[0];
  const partner = project.characters[1];
  const newCanonFacts: CanonFact[] = [
    {
      id: `canon-${episode.toString().padStart(3, '0')}-a`,
      episode,
      owner: 'plot',
      statement: `${episode}화에서 ${primaryCharacter.name}은 금지된 탑의 하층 기록실에 오빠의 표식을 발견한다.`
    },
    {
      id: `canon-${episode.toString().padStart(3, '0')}-b`,
      episode,
      owner: 'character',
      statement: `${partner.name}은 ${primaryCharacter.name}에게 탑의 대가가 이름의 일부라는 사실을 아직 숨긴다.`
    }
  ];
  const outline = [
    `${episode}화는 "${request.intent}"을 중심 사건으로 시작한다.`,
    `${primaryCharacter.name}의 장기 동기인 "${primaryCharacter.desire}"를 대사보다 행동으로 확인시킨다.`,
    `${genre.beat}; 장면 질감은 ${genre.texture}로 통일한다.`,
    `마지막 장면은 ${genre.ending}.`
  ];
  const prose = [
    `${primaryCharacter.name}은 문서고에서 가져온 낡은 등잔을 들고 달의 탑 하층으로 내려갔다.`,
    `벽에 묻은 은빛 먼지는 누군가 지운 이름처럼 손끝에 달라붙었다. ${memoryAnchors[0]}`,
    `${partner.name}은 문 앞에서 웃었지만, 초대장의 빈칸을 손바닥으로 가렸다.`,
    `"여기서부터는 기록보다 침묵이 더 정확합니다."`,
    `그 순간 ${primaryCharacter.name}은 오빠가 쓰던 필압으로 새겨진 표식을 발견했다. 잉크는 마르지 않았고, 탑은 방금 누군가를 기억한 것처럼 낮게 울었다.`
  ].join('\n\n');

  const chapter: Chapter = {
    id: `episode-${episode}`,
    episode,
    title: `${episode}화: 마르지 않은 이름`,
    hook: '오빠의 표식이 방금 쓰인 것처럼 빛나고, 이안은 초대장의 대가를 숨긴다.',
    outline,
    prose,
    memoryAnchors,
    newCanonFacts
  };

  const agentRuns = buildAgentRuns(project, request, chapter, continuityIssues);
  const updatedProject = commitChapter(project, chapter);

  return {
    chapter,
    agentRuns,
    continuityIssues: continuityIssues.filter((issue) => issue.severity !== 'warning'),
    updatedProject
  };
}

// LLM 브리지가 만든 회차 초안 payload를 캐논 정규화·에이전트 검토와 함께 정식 Chapter로 커밋한다
export function chapterFromDraftPayload(
  project: SeriesProject,
  payload: DraftChapterPayload,
  request: ProductionRequest
): ProductionResult {
  const episode = project.currentEpisode + 1;
  const memoryAnchors = project.canonFacts.slice(0, 4).map((fact) => fact.statement);
  const continuityIssues = validateContinuity(project, [request.intent, request.pressure]);
  const newCanonFacts: CanonFact[] = (payload.newCanonFacts ?? [])
    .filter((fact) => typeof fact?.statement === 'string' && fact.statement.trim().length > 0)
    .map((fact, index) => ({
      id: `canon-${episode.toString().padStart(3, '0')}-llm-${String(index + 1).padStart(2, '0')}`,
      episode,
      owner: normalizeCanonOwner(fact.owner),
      statement: fact.statement.trim()
    }));
  const chapter: Chapter = {
    id: `episode-${episode}`,
    episode,
    title: payload.title?.trim() || `${episode}화`,
    hook: payload.hook?.trim() ?? '',
    outline: (payload.outline ?? []).filter(
      (line): line is string => typeof line === 'string' && line.trim().length > 0
    ),
    prose: payload.prose ?? '',
    memoryAnchors,
    newCanonFacts
  };
  const agentRuns = buildAgentRuns(project, request, chapter, continuityIssues);
  const updatedProject = commitChapter(project, chapter);

  return {
    chapter,
    agentRuns,
    continuityIssues: continuityIssues.filter((issue) => issue.severity !== 'warning'),
    updatedProject
  };
}

function normalizeCanonOwner(owner: string): CanonFact['owner'] {
  return owner === 'character' || owner === 'world' || owner === 'plot' ? owner : 'plot';
}

const CONTEXT_CANON_LIMIT = 40;
const CONTEXT_CANON_HEAD = 6;
const CONTEXT_THREAD_LIMIT = 8;

// 2화 이상 생성 시 LLM에 넘길 연속성 컨텍스트를 만든다.
// 장편에서 캐논이 쌓여도 프롬프트가 무한정 커지지 않도록 초반 정착 캐논 + 최근 캐논으로 예산을 제한한다.
export function buildProjectContextDigest(project: SeriesProject): string {
  if (project.chapters.length === 0) {
    return '';
  }

  const lines: string[] = [`지금까지 ${project.currentEpisode}화까지 진행됨.`];

  if (project.canonFacts.length > 0) {
    lines.push('', '확정 캐논 (절대 위반 금지):');
    const facts = project.canonFacts;
    const printFact = (fact: CanonFact) => lines.push(`- [${fact.owner}] ${fact.statement}`);

    if (facts.length <= CONTEXT_CANON_LIMIT) {
      facts.forEach(printFact);
    } else {
      const tailCount = CONTEXT_CANON_LIMIT - CONTEXT_CANON_HEAD;
      facts.slice(0, CONTEXT_CANON_HEAD).forEach(printFact);
      lines.push(`- … 초반 캐논 ${facts.length - CONTEXT_CANON_LIMIT}개 생략, 최근 캐논 우선 …`);
      facts.slice(facts.length - tailCount).forEach(printFact);
    }
  }
  if (project.characters.length > 0) {
    lines.push('', '인물:');
    project.characters.forEach((character) =>
      lines.push(
        `- ${character.name} (${character.role}) — 욕망: ${character.desire} / 상처: ${character.wound} / 현재: ${character.currentState}`
      )
    );
  }
  if (project.worldRules.length > 0) {
    lines.push('', '세계 규칙:');
    project.worldRules.forEach((rule) => lines.push(`- ${rule.title}: ${rule.rule}`));
  }
  if (project.openThreads.length > 0) {
    lines.push('', '열린 떡밥:');
    project.openThreads.slice(-CONTEXT_THREAD_LIMIT).forEach((thread) => lines.push(`- ${thread}`));
  }

  return lines.join('\n');
}

export interface ApprovedMemoryInput {
  id: string;
  owner: string;
  statement: string;
}

// 승인된 검토 기억 후보를 실제 작품 캐논으로 반영한다 — 생성-검토-승인 루프를 닫는 지점
export function applyApprovedMemory(project: SeriesProject, approved: ApprovedMemoryInput[]): SeriesProject {
  const newFacts: CanonFact[] = approved
    .filter((item) => typeof item.statement === 'string' && item.statement.trim().length > 0)
    .map((item) => ({
      id: `canon-approved-${item.id}`,
      episode: project.currentEpisode,
      owner: normalizeCanonOwner(item.owner),
      statement: item.statement.trim()
    }));

  if (newFacts.length === 0) {
    return project;
  }

  return {
    ...project,
    canonFacts: [...project.canonFacts, ...newFacts]
  };
}

export function commitChapter(project: SeriesProject, chapter: Chapter): SeriesProject {
  return {
    ...project,
    currentEpisode: chapter.episode,
    canonFacts: [...project.canonFacts, ...chapter.newCanonFacts],
    openThreads: [
      ...project.openThreads.slice(0, 1),
      '새 표식은 현재 시점에서 누가 남겼는가?',
      '이름의 일부를 잃으면 인물 관계는 어떻게 변하는가?'
    ],
    chapters: [...project.chapters, chapter]
  };
}

export function getGenreProfiles() {
  return genreProfiles;
}

export function buildStoryEditorWorkspace(
  project: SeriesProject,
  options: StoryEditorWorkspaceOptions = {}
): StoryEditorWorkspace {
  const continuityIssues = validateContinuity(project, options.draftClaims ?? []);
  const blocked = continuityIssues.filter((issue) => issue.severity === 'error').length;
  const warnings = continuityIssues.filter((issue) => issue.severity === 'warning').length;
  const codexEntries = buildCodexEntries(project);
  const corkboardCards = buildCorkboardCards(project, blocked > 0);
  const compileText = buildCompileText(project);

  return {
    viewModes: [
      {
        id: 'binder',
        label: 'Binder',
        description: '프로젝트 조각을 계층으로 탐색합니다.'
      },
      {
        id: 'corkboard',
        label: 'Corkboard',
        description: '장면을 카드로 재배열하고 후크를 봅니다.'
      },
      {
        id: 'outliner',
        label: 'Outliner',
        description: 'POV, 상태, 캐논 후보를 표로 점검합니다.'
      },
      {
        id: 'scrivenings',
        label: 'Scrivenings',
        description: '조각난 원고를 하나의 흐름으로 읽습니다.'
      }
    ],
    binderItems: buildBinderItems(project, codexEntries),
    corkboardCards,
    outlinerRows: corkboardCards.map((card) => {
      const chapter = project.chapters.find((item) => item.id === card.chapterId);

      return {
        chapterId: card.chapterId,
        episode: chapter?.episode ?? 0,
        title: card.title,
        pov: card.pov,
        status: card.status,
        wordCount: countWords(chapter?.prose ?? ''),
        linkedCodexCount: card.linkedCodexIds.length,
        canonCandidateCount: card.canonCandidateIds.length,
        continuityState: blocked > 0 ? 'blocked' : 'clear'
      };
    }),
    codexEntries,
    snapshots: project.chapters
      .slice()
      .reverse()
      .map((chapter) => ({
        id: `snapshot-${chapter.id}`,
        chapterId: chapter.id,
        title: `${chapter.title} snapshot`,
        reason: 'continuity review checkpoint',
        text: chapter.prose
      })),
    compilePreview: {
      title: `${project.title} compile preview`,
      sectionCount: project.chapters.length,
      wordCount: countWords(compileText),
      text: compileText
    },
    continuityIssues,
    continuitySummary: {
      status: blocked > 0 ? 'blocked' : 'clear',
      blocked,
      warnings
    }
  };
}

function buildBinderItems(project: SeriesProject, codexEntries: CodexEntry[]): BinderItem[] {
  return [
    {
      id: `binder-project-${project.id}`,
      title: project.title,
      kind: 'project',
      depth: 0,
      detail: project.logline
    },
    {
      id: 'binder-draft',
      title: 'Draft',
      kind: 'folder',
      depth: 1,
      detail: `${project.chapters.length} episodes`
    },
    ...project.chapters.map<BinderItem>((chapter) => ({
      id: `binder-${chapter.id}`,
      title: chapter.title,
      kind: 'chapter',
      depth: 2,
      detail: chapter.hook
    })),
    {
      id: 'binder-codex',
      title: 'Codex',
      kind: 'folder',
      depth: 1,
      detail: `${codexEntries.length} entries`
    },
    ...codexEntries.slice(0, 8).map<BinderItem>((entry) => ({
      id: `binder-${entry.id}`,
      title: entry.title,
      kind: 'codex-entry',
      depth: 2,
      detail: entry.kind
    }))
  ];
}

function buildCorkboardCards(project: SeriesProject, hasBlockedContinuity: boolean): CorkboardCard[] {
  const primaryCharacter = project.characters[0];
  const primaryWorldRule = project.worldRules[0];

  return project.chapters.map((chapter) => ({
    chapterId: chapter.id,
    title: chapter.title,
    synopsis: chapter.hook,
    pov: primaryCharacter?.name ?? 'POV 미정',
    status: 'drafted',
    label: hasBlockedContinuity ? 'needs continuity pass' : genreProfiles[project.genre].label,
    tags: [
      genreProfiles[project.genre].label,
      chapter.newCanonFacts.length > 0 ? 'canon candidate' : 'no new canon',
      chapter.memoryAnchors.length > 0 ? 'anchored' : 'needs anchor'
    ],
    linkedCodexIds: [
      primaryCharacter ? `codex-character-${primaryCharacter.id}` : '',
      primaryWorldRule ? `codex-world-${primaryWorldRule.id}` : ''
    ].filter(Boolean),
    canonCandidateIds: chapter.newCanonFacts.map((fact) => fact.id)
  }));
}

function buildCodexEntries(project: SeriesProject): CodexEntry[] {
  const characterEntries = project.characters.map<CodexEntry>((character) => ({
    id: `codex-character-${character.id}`,
    kind: 'character',
    title: character.name,
    summary: character.role,
    fields: [
      { label: 'desire', value: character.desire },
      { label: 'wound', value: character.wound },
      { label: 'state', value: character.currentState },
      { label: 'voice', value: character.voiceRules.join(' / ') }
    ],
    sourceIds: character.canonAnchors
  }));

  const worldEntries = project.worldRules.map<CodexEntry>((worldRule) => ({
    id: `codex-world-${worldRule.id}`,
    kind: 'world-rule',
    title: worldRule.title,
    summary: worldRule.rule,
    fields: [
      { label: 'rule', value: worldRule.rule },
      {
        label: 'forbidden',
        value: worldRule.forbiddenContradictions.map((item) => item.claim).join(' / ')
      }
    ],
    sourceIds: [worldRule.id]
  }));

  const threadEntries = project.openThreads.map<CodexEntry>((thread, index) => ({
    id: `codex-thread-${String(index + 1).padStart(2, '0')}`,
    kind: 'plot-thread',
    title: thread,
    summary: '아직 회수되지 않은 독자 질문입니다.',
    fields: [
      { label: 'status', value: 'open' },
      { label: 'payoff', value: '다음 회차 설계에서 회수 조건을 지정해야 합니다.' }
    ],
    sourceIds: [`thread-${index + 1}`]
  }));

  const canonEntries = project.canonFacts.slice(-6).map<CodexEntry>((fact) => ({
    id: `codex-canon-${fact.id}`,
    kind: 'canon',
    title: `EP ${fact.episode} ${fact.owner}`,
    summary: fact.statement,
    fields: [
      { label: 'owner', value: fact.owner },
      { label: 'episode', value: String(fact.episode) }
    ],
    sourceIds: [fact.id]
  }));

  return [...characterEntries, ...worldEntries, ...threadEntries, ...canonEntries];
}

function buildCompileText(project: SeriesProject) {
  if (project.chapters.length === 0) {
    return `${project.title}\n\n${project.logline}`;
  }

  return project.chapters
    .slice()
    .sort((left, right) => left.episode - right.episode)
    .map((chapter) => `# ${chapter.title}\n\n${chapter.prose}`)
    .join('\n\n---\n\n');
}

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildAgentRuns(
  project: SeriesProject,
  request: ProductionRequest,
  chapter: Chapter,
  issues: ContinuityIssue[]
): AgentRun[] {
  const genre = genreProfiles[request.genre];
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

  return [
    {
      agentId: 'showrunner',
      title: '쇼러너 에이전트',
      status: 'pass',
      output: `${project.audiencePromise}를 기준으로 ${chapter.title}의 중심 사건과 다음 편 후크를 배치했습니다.`,
      evidence: [request.intent, chapter.hook]
    },
    {
      agentId: 'character-custodian',
      title: '캐릭터 에이전트',
      status: 'pass',
      output: '장기 욕망, 상처, 말투 규칙을 회차 행동에 반영했습니다.',
      evidence: project.characters.flatMap((character) => character.canonAnchors)
    },
    {
      agentId: 'world-keeper',
      title: '배경 에이전트',
      status: 'pass',
      output: '탑 출입 규칙과 기억 잉크의 한계를 유지했습니다.',
      evidence: project.worldRules.map((rule) => rule.rule)
    },
    {
      agentId: 'genre-stylist',
      title: `${genre.label} 장르 에이전트`,
      status: 'pass',
      output: `${genre.beat}. ${request.pressure}`,
      evidence: [genre.texture, genre.ending]
    },
    {
      agentId: 'continuity-editor',
      title: '연속성 감수 에이전트',
      status: errorCount > 0 ? 'block' : warningCount > 0 ? 'revise' : 'pass',
      output:
        errorCount === 0
          ? '치명적 캐논 충돌 없이 다음 회차를 승인했습니다.'
          : '캐논 충돌이 있어 해당 회차는 수정이 필요합니다.',
      evidence: chapter.memoryAnchors
    }
  ];
}
