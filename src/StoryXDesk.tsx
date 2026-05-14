import {
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  GitBranch,
  Home,
  Layers,
  Library,
  ListChecks,
  MessageCircle,
  PenLine,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  WandSparkles,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getAgentValidationProcess, reviewScales } from './lib/agentReviewProcess';
import {
  buildCreativeBlueprint,
  getFormatOptions,
  getMediumOptions,
  type CreativeBlueprint,
  type CreativeFormat,
  type CreativeMedium
} from './lib/projectBlueprint';
import {
  buildStoryEditorWorkspace,
  createSeedProject,
  getGenreProfiles,
  produceNextChapter,
  type AgentRun,
  type Chapter,
  type GenreId,
  type ProductionRequest,
  type SeriesProject
} from './lib/storyEngine';
import { buildStoryMemoryBank, type StoryMemoryBank } from './lib/memoryBank';
import { buildTesterDrivenWorkflow, type TesterDrivenWorkflow } from './lib/evaluationSynthesis';
import { buildComicsVisualWorkflow } from './lib/visualProduction';
import { clearProject, loadProject, saveProject } from './lib/storage';

type DeskTrack = 'draft' | 'bible';
type BibleSection = 'overview' | 'characters' | 'world' | 'canon' | 'voice' | 'approval';
type ApprovalDecision = 'approved' | 'revision' | 'hold';

const genreProfiles = getGenreProfiles();
const mediumOptions = getMediumOptions();
const bibleSections: Array<{ id: BibleSection; label: string; summary: string }> = [
  { id: 'overview', label: '개요', summary: '프로젝트 핵심과 동기화 상태' },
  { id: 'characters', label: '캐릭터', summary: '욕망, 상처, 현재 상태' },
  { id: 'world', label: '세계관', summary: '규칙, 비용, 금지 충돌' },
  { id: 'canon', label: '캐논/타임라인', summary: '승인된 사실과 회차 흐름' },
  { id: 'voice', label: '문체/감각', summary: '문체, 시각, 오디오 앵커' },
  { id: 'approval', label: '승인 대기', summary: '새 기억 후보와 영향 범위' }
];
const approvalDecisionLabels: Record<ApprovalDecision, string> = {
  approved: '승인됨',
  revision: '수정 요청됨',
  hold: '보류됨'
};

interface AgentPersona {
  id: string;
  title: string;
  subtitle: string;
  instruction: string;
  checks: string[];
  pixelClass: string;
  openingLine: string;
}

interface AgentDialogSelection {
  run: AgentRun;
  persona: AgentPersona;
}

interface AgentChatMessage {
  role: 'agent' | 'user';
  text: string;
}

const agentPersonas: Record<string, AgentPersona> = {
  showrunner: {
    id: 'showrunner',
    title: '쇼러너',
    subtitle: '회차 약속과 클리프행어를 잠그는 진행자',
    instruction:
      '작품의 장기 약속, 이번 회차의 독자 보상, 마지막 질문이 한 방향으로 이어지는지 판단합니다. 재미를 위해 설정을 억지로 맞추지 않고, 약속이 약하면 사건 자체를 다시 제안합니다.',
    checks: ['이번 회차의 독자 약속이 한 문장으로 선명한가', '클리프행어가 다음 회차를 부르는가', '장기 떡밥과 단기 사건이 충돌하지 않는가'],
    pixelClass: 'is-showrunner',
    openingLine: '오늘 회차의 약속부터 잠가볼게요. 독자가 마지막에 무엇을 궁금해해야 하나요?'
  },
  'character-custodian': {
    id: 'character-custodian',
    title: '캐릭터 큐레이터',
    subtitle: '욕망, 상처, 말투, 관계 상태를 지키는 감수자',
    instruction:
      '인물의 욕망, 결핍, 상처, 말버릇, 호칭 거리, 관계 온도가 장면마다 같은 사람처럼 이어지는지 봅니다. 캐릭터성이 흔들릴 때는 더 그럴듯한 행동 대안을 제시합니다.',
    checks: ['인물이 자기 욕망과 반대로 움직이지 않는가', '상처와 방어 방식이 장면 행동에 남아 있는가', '관계 변화가 이전 회차의 감정값과 이어지는가'],
    pixelClass: 'is-character',
    openingLine: '캐릭터가 무너지는 지점부터 같이 볼게요. 지금 제일 걱정되는 인물은 누구인가요?'
  },
  'world-keeper': {
    id: 'world-keeper',
    title: '배경 설계자',
    subtitle: '세계 규칙, 비용, 시간표를 관리하는 설정 담당',
    instruction:
      '마법, 기술, 장소, 역사, 조직, 비용 규칙이 같은 방식으로 작동하는지 확인합니다. 새로운 설정이 생기면 기존 세계관에 붙일지, 예외로 격리할지 판단합니다.',
    checks: ['세계 규칙의 대가가 사라지지 않았는가', '시간순서와 장소 이동이 말이 되는가', '새 설정이 기존 규칙을 싸게 만들지 않는가'],
    pixelClass: 'is-world',
    openingLine: '세계관은 재미를 만드는 압력이어야 해요. 새로 넣고 싶은 규칙이 있나요?'
  },
  'genre-stylist': {
    id: 'genre-stylist',
    title: '장르 스타일리스트',
    subtitle: '장르 리듬과 문체 질감을 조정하는 작가',
    instruction:
      '로맨스, 판타지, 스릴러, 에세이, 인스타툰 등 매체와 장르가 요구하는 기대감을 맞춥니다. 장르 공식은 그대로 복붙하지 않고, 사건의 비용과 감정 리듬으로 새롭게 비틉니다.',
    checks: ['장르 독자가 기대하는 쾌감이 남아 있는가', '문장 질감이 장면 목적을 방해하지 않는가', '반전이나 감정 보상이 너무 늦지 않은가'],
    pixelClass: 'is-genre',
    openingLine: '장르의 맛은 살리고 뻔함은 빼볼게요. 지금 원하는 독자 감정은 무엇인가요?'
  },
  'continuity-editor': {
    id: 'continuity-editor',
    title: '연속성 감수자',
    subtitle: '캐논 충돌을 막고 승인된 사실만 장부에 넣는 편집자',
    instruction:
      '캐릭터, 배경, 사건, 시점, 목소리의 모순을 숨기지 않고 표시합니다. 초안이 멋져 보여도 캐논을 깨면 차단하고, 승인된 사실만 다음 작업의 기준으로 저장합니다.',
    checks: ['초안의 새 사실이 기존 캐논과 충돌하지 않는가', '충돌을 재미로 쓸 수 있는지 수정해야 하는지 구분했는가', '다음 회차에 저장할 사실이 명확한가'],
    pixelClass: 'is-continuity',
    openingLine: '캐논은 족쇄가 아니라 재료예요. 지금 의심되는 설정 충돌을 알려주세요.'
  },
  'essay-interviewer': {
    id: 'essay-interviewer',
    title: '에세이 인터뷰어',
    subtitle: '내 이야기를 대신 꾸미지 않고 계속 물어보는 질문자',
    instruction:
      '사용자의 기억, 주변 인물, 감정의 결을 먼저 묻고 확인합니다. 실제 경험을 임의로 발명하지 않으며, 쓸 수 있는 장면과 아직 물어봐야 하는 빈칸을 분리합니다.',
    checks: ['개인 경험을 AI가 마음대로 만들지 않았는가', '내 주변 인물의 거리와 익명성이 지켜졌는가', '질문이 다음 문단의 재료로 이어지는가'],
    pixelClass: 'is-essay',
    openingLine: '좋은 에세이는 질문의 순서에서 시작해요. 이 이야기를 쓰고 싶어진 첫 장면이 뭐였나요?'
  },
  'voice-curator': {
    id: 'voice-curator',
    title: '문체 큐레이터',
    subtitle: '한국어 자연스러움과 작가 문체를 지키는 편집자',
    instruction:
      '문장 길이, 비유 밀도, 존댓말/반말, 농담의 온도, 금지 표현을 문체 바이블로 관리합니다. 전체 원고가 한 사람의 글처럼 읽히도록 과한 AI식 표현을 줄입니다.',
    checks: ['문체가 중간에 바뀌지 않았는가', '한국어 문장이 번역투로 굳지 않았는가', '반복되는 AI식 표현이 남아 있지 않은가'],
    pixelClass: 'is-voice',
    openingLine: '문체는 작품의 호흡이에요. 좋아하는 문장 리듬이나 피하고 싶은 말투가 있나요?'
  },
  'audio-narration-director': {
    id: 'audio-narration-director',
    title: '오디오 연출가',
    subtitle: '목소리, 속도, 쉼, 청취 리듬을 설계하는 감독',
    instruction:
      '원고가 귀로 들릴 때의 속도, 쉼표, 강조, 감정 온도, 반복 훅을 설계합니다. 교육영상이나 동요읽기에서는 청자가 이해할 수 있는 호흡을 먼저 확보합니다.',
    checks: ['소리로 들었을 때 한 번에 이해되는가', '쉼과 강조가 감정선을 살리는가', '음악과 효과음이 이야기를 덮지 않는가'],
    pixelClass: 'is-audio',
    openingLine: '이 장면을 귀로 들으면 어디서 숨을 쉬어야 할까요? 낭독 톤부터 잡아볼게요.'
  },
  'storyboard-agent': {
    id: 'storyboard-agent',
    title: '웹툰 연출가',
    subtitle: '장면을 컷, 스크롤, 스와이프 리듬으로 바꾸는 콘티 감독',
    instruction:
      '원고의 사건을 컷 기능으로 나누고, 각 컷이 선택, 감정 변화, 정보 전달, 후크 중 무엇을 맡는지 정합니다. 웹툰에서는 스크롤 템포를, 인스타툰에서는 넘김과 저장 컷을 우선합니다.',
    checks: ['각 컷의 기능이 선명한가', '스크롤/스와이프 리듬이 다음 컷 행동을 부르는가', '컷만 봐도 사건 흐름이 이해되는가'],
    pixelClass: 'is-storyboard',
    openingLine: '장면을 컷으로 찢어보겠습니다. 이 컷에서 독자가 꼭 봐야 하는 행동은 무엇인가요?'
  },
  'speech-bubble-agent': {
    id: 'speech-bubble-agent',
    title: '말풍선 연출가',
    subtitle: '대사 밀도, 말풍선 위치, 시선 흐름을 지키는 만화 편집자',
    instruction:
      '말풍선이 표정, 손동작, 핵심 소품을 가리지 않는지 검토합니다. 모바일에서 읽히는 글자 수와 컷 순서를 기준으로 대사를 줄이거나 위치를 다시 제안합니다.',
    checks: ['말풍선이 표정과 핵심 동작을 가리지 않는가', '대사량이 모바일 컷 안에서 읽히는가', '읽는 순서가 컷 흐름과 충돌하지 않는가'],
    pixelClass: 'is-bubble',
    openingLine: '대사는 그림을 도와야지 덮으면 안 됩니다. 이 컷에서 꼭 말로 해야 하는 건 무엇인가요?'
  },
  'keyframe-art-director': {
    id: 'keyframe-art-director',
    title: '원화/키프레임 감독',
    subtitle: 'Midjourney 원화 후보를 고르고 visual DNA를 잠그는 아트 디렉터',
    instruction:
      '초기 원화와 키프레임 후보를 만들고, 사용자가 선택한 컷만 캐릭터 외형, 팔레트, 조명, 렌즈의 기준으로 승격합니다. 탈락한 이미지는 canon처럼 섞이지 않게 분리합니다.',
    checks: ['선택된 원화가 반복 가능한가', '캐릭터 얼굴과 의상 기준이 하나로 잠겼는가', '탈락 후보가 visual bible에 섞이지 않았는가'],
    pixelClass: 'is-keyframe',
    openingLine: '처음 몇 장의 기준 컷이 전체 그림체를 결정합니다. 어떤 이미지가 작품의 얼굴이어야 하나요?'
  },
  'da-vinci': {
    id: 'da-vinci',
    title: '다빈치',
    subtitle: '이미지 프롬프트와 컷별 시각 일관성을 설계하는 작화 에이전트',
    instruction:
      '인물 외형, 의상, 렌즈, 조명, 구도, 매체 질감, 부정 프롬프트를 구조화합니다. 장면마다 예쁜 그림이 아니라 같은 작품의 시각 언어로 이어지게 만듭니다.',
    checks: ['캐릭터 외형과 의상이 컷마다 유지되는가', '카메라와 조명이 이야기 감정을 돕는가', '이미지 프롬프트가 구체적이고 검수 가능하게 쓰였는가'],
    pixelClass: 'is-image',
    openingLine: '컷의 그림체와 카메라부터 잡겠습니다. 이 장면은 가까운 표정인가요, 넓은 공간인가요?'
  },
  'frame-assembly-agent': {
    id: 'frame-assembly-agent',
    title: '프레임 조립가',
    subtitle: '컷 순서, 여백, 비율, 파일 패키지를 정리하는 제작 담당',
    instruction:
      '이미지와 말풍선이 나온 뒤 게시 비율, 컷 순서, 여백, 파일명, 산출물 묶음을 점검합니다. 인스타툰은 정사각형과 캐러셀 순서를, 웹툰은 세로 스크롤 흐름을 우선합니다.',
    checks: ['비율과 여백이 플랫폼에 맞는가', '컷 순서가 이야기 순서를 깨지 않는가', '파일명이 후속 수정과 배포에 재사용 가능한가'],
    pixelClass: 'is-frame',
    openingLine: '마지막 조립에서 작품의 읽기 경험이 결정됩니다. 이 산출물은 어디에 먼저 올릴 예정인가요?'
  }
};

const fallbackAgentPersona: AgentPersona = {
  id: 'general-agent',
  title: 'Story X 에이전트',
  subtitle: '작품의 다음 결정을 돕는 협업자',
  instruction: '현재 작업의 목적, 독자 약속, 캐논 충돌 가능성을 함께 확인하고 다음 행동을 제안합니다.',
  checks: ['지금 결정이 작품 약속에 도움이 되는가', '다음 단계가 구체적인가', '검수할 기준이 남아 있는가'],
  pixelClass: 'is-default',
  openingLine: '지금 막힌 지점을 알려주세요. 작품 기준으로 같이 정리해볼게요.'
};

function getAgentPersona(run: AgentRun) {
  return agentPersonas[run.agentId] ?? fallbackAgentPersona;
}

function mergeAgentRuns(primaryRuns: AgentRun[], extraRuns: AgentRun[]) {
  const seen = new Set(primaryRuns.map((run) => run.agentId));

  return [...primaryRuns, ...extraRuns.filter((run) => !seen.has(run.agentId))];
}

const defaultRuns: AgentRun[] = [
  {
    agentId: 'showrunner',
    title: '쇼러너',
    status: 'complete',
    output: '이번 회차의 약속, 압력, 마지막 질문을 한 줄로 잠글 준비가 되어 있습니다.',
    evidence: ['독자 약속', '클리프행어']
  },
  {
    agentId: 'character-custodian',
    title: '캐릭터',
    status: 'complete',
    output: '욕망, 상처, 관계 상태가 초안에서 흔들리지 않는지 확인합니다.',
    evidence: ['desire', 'wound']
  },
  {
    agentId: 'world-keeper',
    title: '월드',
    status: 'complete',
    output: '세계 규칙과 비용이 장면마다 같은 방식으로 작동하는지 봅니다.',
    evidence: ['rules', 'cost']
  },
  {
    agentId: 'genre-stylist',
    title: '장르',
    status: 'complete',
    output: '장르 리듬과 문체 질감을 회차 목적에 맞게 조정합니다.',
    evidence: ['beat', 'texture']
  },
  {
    agentId: 'continuity-editor',
    title: '연속성',
    status: 'complete',
    output: '모순은 숨기지 않고 충돌로 표시하고, 승인된 사실만 canon에 넣습니다.',
    evidence: ['canon', 'conflict']
  }
];

const visualStoryAgentRuns: AgentRun[] = [
  {
    agentId: 'storyboard-agent',
    title: '웹툰 연출',
    status: 'complete',
    output: '장면을 컷 기능, 스크롤 템포, 넘김 후크로 분해합니다.',
    evidence: ['panel-plan', 'scroll-rhythm']
  },
  {
    agentId: 'speech-bubble-agent',
    title: '말풍선',
    status: 'complete',
    output: '말풍선 위치와 대사 밀도가 표정, 손동작, 핵심 소품을 가리지 않는지 봅니다.',
    evidence: ['bubble-map', 'dialogue-density']
  },
  {
    agentId: 'keyframe-art-director',
    title: '원화',
    status: 'complete',
    output: 'Midjourney 원화 후보 중 사용자가 선택한 컷만 visual DNA로 잠급니다.',
    evidence: ['midjourney-keyframe', 'visual-dna']
  },
  {
    agentId: 'da-vinci',
    title: '다빈치',
    status: 'complete',
    output: '승인된 원화와 캐릭터 시트를 컷별 이미지 프롬프트로 변환합니다.',
    evidence: ['image-prompt', 'negative-prompt']
  },
  {
    agentId: 'frame-assembly-agent',
    title: '프레임',
    status: 'complete',
    output: '정사각형, 세로 스크롤, 페이지 시퀀스에 맞춰 컷 순서와 export 묶음을 확인합니다.',
    evidence: ['frame-order', 'export-package']
  }
];

interface StoryXDeskProps {
  initialMedium?: CreativeMedium;
  initialFormat?: CreativeFormat;
  onOpenProjects?: () => void;
  onOpenLanding?: () => void;
}

export function StoryXDesk({
  initialMedium = 'novel',
  initialFormat = 'long-novel',
  onOpenProjects,
  onOpenLanding
}: StoryXDeskProps) {
  const defaultEpisodeIntent = '용사와 외계인이 처음 충돌하는 장면으로 시작한다';
  const [medium, setMedium] = useState<CreativeMedium>(initialMedium);
  const [format, setFormat] = useState<CreativeFormat>(initialFormat);
  const [project, setProject] = useState<SeriesProject>(() => loadProject());
  const [request, setRequest] = useState<ProductionRequest>({
    genre: project.genre,
    intent: defaultEpisodeIntent,
    pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
  });
  const [draftPrompt, setDraftPrompt] = useState(defaultEpisodeIntent);
  const [editorText, setEditorText] = useState('');
  const [editedSinceReview, setEditedSinceReview] = useState(false);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>(defaultRuns);
  const [latestChapter, setLatestChapter] = useState<Chapter | null>(
    project.chapters.length > 0 ? project.chapters[project.chapters.length - 1] : null
  );
  const [activeTrack, setActiveTrack] = useState<DeskTrack>('draft');
  const [activeBibleSection, setActiveBibleSection] = useState<BibleSection>('overview');
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, ApprovalDecision>>({});
  const [isMediaPanelOpen, setIsMediaPanelOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDialogSelection | null>(null);

  const blueprint = useMemo(() => buildCreativeBlueprint({ medium, format }), [medium, format]);
  const editorWorkspace = useMemo(
    () => buildStoryEditorWorkspace(project, { draftClaims: [request.intent, request.pressure] }),
    [project, request.intent, request.pressure]
  );
  const memoryBank = useMemo(() => buildStoryMemoryBank(project), [project]);
  const evaluatorWorkflow = useMemo(() => buildTesterDrivenWorkflow(blueprint), [blueprint]);
  const displayedAgentRuns = useMemo(
    () => (blueprint.nextWorkspace === 'visual-storyboard-studio' ? mergeAgentRuns(agentRuns, visualStoryAgentRuns) : agentRuns),
    [agentRuns, blueprint.nextWorkspace]
  );
  const canonHealth = useMemo(() => {
    const total = project.canonFacts.length + project.worldRules.length + project.characters.length;
    const episodes = Math.max(project.currentEpisode, 1);
    return Math.min(99, Math.round((total / (episodes + 6)) * 16));
  }, [project]);

  useEffect(() => {
    saveProject(project);
  }, [project]);

  useEffect(() => {
    if (!latestChapter) {
      return;
    }

    setEditorText(latestChapter.prose);
    setEditedSinceReview(false);
  }, [latestChapter]);

  function selectMedium(nextMedium: CreativeMedium) {
    setMedium(nextMedium);
    setFormat(getFormatOptions(nextMedium)[0].id);
  }

  function updateDraftPrompt(value: string) {
    setDraftPrompt(value);
    setRequest((current) => ({ ...current, intent: value }));
  }

  function updateProject(field: 'title' | 'logline' | 'audiencePromise' | 'tone', value: string) {
    setProject((current) => ({ ...current, [field]: value }));
  }

  function updateCharacterMemory(characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) {
    setProject((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === characterId ? { ...character, [field]: value } : character
      )
    }));
  }

  function updateWorldMemory(ruleId: string, value: string) {
    setProject((current) => ({
      ...current,
      worldRules: current.worldRules.map((rule) => (rule.id === ruleId ? { ...rule, rule: value } : rule))
    }));
  }

  function updateCanonMemory(canonId: string, value: string) {
    setProject((current) => ({
      ...current,
      canonFacts: current.canonFacts.map((fact) => (fact.id === canonId ? { ...fact, statement: value } : fact))
    }));
  }

  function setApprovalDecision(candidateId: string, decision: ApprovalDecision) {
    setApprovalDecisions((current) => ({ ...current, [candidateId]: decision }));
  }

  function produceEpisode() {
    const result = produceNextChapter(project, { ...request, intent: draftPrompt || request.intent });
    setProject(result.updatedProject);
    setAgentRuns(result.agentRuns);
    setLatestChapter(result.chapter);
    setActiveTrack('draft');
  }

  function reviewDraft() {
    const reviewTarget = editorText.trim() || draftPrompt.trim() || project.logline;
    const manualEditNote = editedSinceReview ? '직접 편집한 문장이 있어 수정 구간을 우선 검토합니다.' : '현재 초안과 입력 브리프를 기준으로 검토합니다.';
    const reviewRuns: AgentRun[] = defaultRuns.map((run, index) => ({
      ...run,
      status: 'complete',
      output:
        index === 0
          ? `${manualEditNote} 독자 약속과 다음 장면 질문을 먼저 확인했습니다.`
          : `${run.output} 검토 대상: ${reviewTarget.slice(0, 34)}${reviewTarget.length > 34 ? '...' : ''}`,
      evidence: [...run.evidence, editedSinceReview ? 'manual-edit' : 'review-request']
    }));

    setAgentRuns(reviewRuns);
    setEditedSinceReview(false);
  }

  function updateEditorText(value: string) {
    setEditorText(value);
    setEditedSinceReview(true);
  }

  function resetProject() {
    if (!window.confirm('현재 로컬 프로젝트를 초기화할까요? 생성된 회차와 canon 기록이 지워집니다.')) {
      return;
    }

    clearProject();
    const seed = createSeedProject();
    setProject(seed);
    setLatestChapter(null);
    setAgentRuns(defaultRuns);
    setRequest({
      genre: seed.genre,
      intent: defaultEpisodeIntent,
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });
    setDraftPrompt(defaultEpisodeIntent);
    setEditorText('');
    setEditedSinceReview(false);
    setActiveTrack('draft');
    setActiveBibleSection('overview');
    setApprovalDecisions({});
    setIsMediaPanelOpen(false);
  }

  return (
    <main className={`sx-desk sx-genre-${request.genre}`}>
      <header className="sx-topbar">
        <div className="sx-brand">
          <span className="sx-brand-mark">
            <Sparkles size={17} />
          </span>
          <div>
            <p>Story X</p>
            <h1>AI 작가진과 함께, 흔들림 없는 세계관을 만듭니다.</h1>
          </div>
        </div>
        <div className="sx-topbar-actions">
          {(onOpenProjects || onOpenLanding) && (
            <div className="sx-editor-links" aria-label="에디터 이동">
              {onOpenProjects && (
                <button type="button" onClick={onOpenProjects}>
                  <Home size={14} />
                  프로젝트
                </button>
              )}
              {onOpenLanding && (
                <button type="button" onClick={onOpenLanding}>
                  소개
                </button>
              )}
            </div>
          )}
          <nav className="sx-track-tabs" aria-label="작업 트랙">
            <button
              type="button"
              className={activeTrack === 'draft' ? 'is-active' : ''}
              onClick={() => {
                setActiveTrack('draft');
                setIsMediaPanelOpen(false);
              }}
            >
              <PenLine size={16} />
              원고 편집
            </button>
            <button
              type="button"
              className={activeTrack === 'bible' ? 'is-active' : ''}
              onClick={() => {
                setActiveTrack('bible');
                setIsMediaPanelOpen(false);
              }}
            >
              <Database size={16} />
              작품 바이블
            </button>
          </nav>
          <button
            type="button"
            className="sx-media-change-button"
            aria-expanded={isMediaPanelOpen}
            onClick={() => setIsMediaPanelOpen((current) => !current)}
          >
            <Layers size={16} />
            매체 변경
            <span>{blueprint.mediumLabel} · {blueprint.formatLabel}</span>
          </button>
        </div>
      </header>

      {isMediaPanelOpen && (
        <section className="sx-media-change-panel" aria-label="매체 변경">
          <div className="sx-media-change-group">
            <p className="sx-eyebrow">매체</p>
            <div>
              {mediumOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={medium === option.id ? 'is-selected' : ''}
                  onClick={() => selectMedium(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.signal}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="sx-media-change-group">
            <p className="sx-eyebrow">길이 / 형식</p>
            <div>
              {getFormatOptions(medium).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={format === option.id ? 'is-selected' : ''}
                  onClick={() => {
                    setFormat(option.id);
                    setIsMediaPanelOpen(false);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.cadence}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sx-desk-grid">
        <aside className="sx-project-rail" aria-label="프로젝트 대시보드">
          <ProjectStateCard project={project} canonHealth={canonHealth} />

          <CurrentBlueprintCard blueprint={blueprint} onOpenMediaPanel={() => setIsMediaPanelOpen(true)} />

          {activeTrack === 'draft' ? (
            <ChapterTreeCard
              project={project}
              selectedChapterId={latestChapter?.id ?? null}
              onSelectChapter={setLatestChapter}
            />
          ) : (
            <BibleIndexCard
              project={project}
              bank={memoryBank}
              activeSection={activeBibleSection}
              onSelectSection={setActiveBibleSection}
            />
          )}

          {activeTrack === 'draft' && (
          <section className="sx-brief-panel">
            <div className="sx-panel-heading">
              <ClipboardCheck size={16} />
              <h2>작업 브리프</h2>
            </div>
            <div className="sx-brief-grid">
              <label>
                <span>장르 리듬</span>
                <select
                  value={request.genre}
                  name="genre"
                  onChange={(event) => setRequest((current) => ({ ...current, genre: event.target.value as GenreId }))}
                >
                  {Object.entries(genreProfiles).map(([id, profile]) => (
                    <option key={id} value={id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>독자 약속</span>
                <input
                  value={project.audiencePromise}
                  name="audience-promise"
                  onChange={(event) => updateProject('audiencePromise', event.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="sx-wide-field">
                <span>이번 회차 사건</span>
                <input
                  value={request.intent}
                  name="episode-intent"
                  onChange={(event) => updateDraftPrompt(event.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="sx-wide-field">
                <span>감정 압력</span>
                <input
                  value={request.pressure}
                  name="episode-pressure"
                  onChange={(event) => setRequest((current) => ({ ...current, pressure: event.target.value }))}
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="sx-brief-actions">
              <button type="button" className="sx-primary-button" onClick={produceEpisode}>
                <WandSparkles size={17} />
                초안 생성
              </button>
              <button type="button" className="sx-secondary-button" onClick={reviewDraft}>
                <ClipboardCheck size={16} />
                검토
              </button>
              <button type="button" className="sx-secondary-button" onClick={() => saveProject(project)}>
                <Save size={16} />
                저장
              </button>
              <button type="button" className="sx-icon-button" aria-label="프로젝트 초기화" onClick={resetProject}>
                <RotateCcw size={16} />
              </button>
            </div>
          </section>
          )}
        </aside>

        <section className="sx-workbench" aria-label="Story X 작업대">
          {activeTrack === 'draft' ? (
            <>
              <section className="sx-editor-titlebar">
                <div>
                  <p className="sx-eyebrow">
                    {blueprint.mediumLabel} / {blueprint.formatLabel}
                  </p>
                  <input
                    className="sx-title-input"
                    aria-label="프로젝트 제목"
                    name="project-title"
                    value={project.title}
                    onChange={(event) => updateProject('title', event.target.value)}
                    autoComplete="off"
                  />
                  <textarea
                    aria-label="주요 내용 입력"
                    name="draft-prompt"
                    value={draftPrompt}
                    onChange={(event) => updateDraftPrompt(event.target.value)}
                    placeholder="예: 용사랑 외계인이 싸우는 장면으로 시작한다."
                    rows={3}
                  />
                </div>
                <div className="sx-editor-titlebar-actions">
                  <span>{blueprint.projectRoomTitle}</span>
                  <button type="button" className="sx-primary-button" onClick={produceEpisode}>
                    <WandSparkles size={17} />
                    초안 생성
                  </button>
                  <button type="button" className="sx-secondary-button" onClick={reviewDraft}>
                    <ClipboardCheck size={16} />
                    검토
                  </button>
                </div>
              </section>

              <ChapterNavigator
                chapters={project.chapters}
                selectedChapterId={latestChapter?.id ?? null}
                onSelectChapter={setLatestChapter}
              />

              <CreativeStage
                blueprint={blueprint}
                chapter={latestChapter}
                project={project}
                editableText={editorText}
                editedSinceReview={editedSinceReview}
                onEditableTextChange={updateEditorText}
                onReviewDraft={reviewDraft}
              />
            </>
          ) : (
            <MemoryBankStudio
              project={project}
              bank={memoryBank}
              activeSection={activeBibleSection}
              onSelectSection={setActiveBibleSection}
              onUpdateCharacter={updateCharacterMemory}
              onUpdateWorldRule={updateWorldMemory}
              onUpdateCanon={updateCanonMemory}
              onUpdateProject={updateProject}
              approvalDecisions={approvalDecisions}
              onSetApprovalDecision={setApprovalDecision}
            />
          )}
        </section>

        <aside className="sx-codex-rail" aria-label="연속성 레저">
          <ContinuitySummaryCard
            status={editorWorkspace.continuitySummary.status}
            blocked={editorWorkspace.continuitySummary.blocked}
              warnings={editorWorkspace.continuitySummary.warnings}
          />

          <MemoryBankCard bank={memoryBank} />

          <EvaluatorQualityCard workflow={evaluatorWorkflow} />

          <AgentSidebar
            runs={displayedAgentRuns}
            onSelectAgent={(run, persona) => setSelectedAgent({ run, persona })}
          />

          <section className="sx-panel">
            <div className="sx-panel-heading">
              <GitBranch size={16} />
              <h2>캐논 장부</h2>
            </div>
            <div className="sx-canon-list">
              {project.canonFacts.slice(-6).map((fact) => (
                <article key={fact.id}>
                  <span>EP {fact.episode} · {fact.owner}</span>
                  <p>{fact.statement}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="sx-panel">
            <div className="sx-panel-heading">
              <ListChecks size={16} />
              <h2>열린 질문</h2>
            </div>
            <ul className="sx-thread-list">
              {project.openThreads.map((thread) => (
                <li key={thread}>{thread}</li>
              ))}
            </ul>
          </section>

        </aside>
      </section>
      {selectedAgent && (
        <AgentProfileDialog
          run={selectedAgent.run}
          persona={selectedAgent.persona}
          projectTitle={project.title}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </main>
  );
}

function ChapterNavigator({
  chapters,
  selectedChapterId,
  onSelectChapter
}: {
  chapters: Chapter[];
  selectedChapterId: string | null;
  onSelectChapter: (chapter: Chapter) => void;
}) {
  return (
    <nav className="sx-episode-tabs" aria-label="회차 이동">
      {chapters.length === 0 ? (
        <span>첫 초안을 생성하면 1화, 2화처럼 이동 탭이 생깁니다.</span>
      ) : (
        chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            className={chapter.id === selectedChapterId ? 'is-selected' : ''}
            onClick={() => onSelectChapter(chapter)}
          >
            {chapter.episode}화
          </button>
        ))
      )}
    </nav>
  );
}

function ChapterTreeCard({
  project,
  selectedChapterId,
  onSelectChapter
}: {
  project: SeriesProject;
  selectedChapterId: string | null;
  onSelectChapter: (chapter: Chapter) => void;
}) {
  return (
    <section className="sx-panel sx-chapter-tree" aria-label="작품 목차">
      <div className="sx-panel-heading">
        <FileText size={16} />
        <h2>작품 목차</h2>
      </div>
      <div className="sx-chapter-tree-root">
        <Library size={15} />
        <strong>{project.title}</strong>
      </div>
      <div className="sx-chapter-tree-list">
        {project.chapters.length === 0 ? (
          <p>첫 회차를 생성하면 트리 목차가 채워집니다.</p>
        ) : (
          project.chapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className={chapter.id === selectedChapterId ? 'is-selected' : ''}
              onClick={() => onSelectChapter(chapter)}
            >
              <span>{chapter.episode}화</span>
              <strong>{chapter.title}</strong>
              <small>{chapter.hook}</small>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function CurrentBlueprintCard({ blueprint, onOpenMediaPanel }: { blueprint: CreativeBlueprint; onOpenMediaPanel: () => void }) {
  return (
    <section className="sx-panel sx-current-blueprint-card" aria-label="현재 제작 형태">
      <div className="sx-panel-heading">
        <Layers size={16} />
        <h2>현재 제작 형태</h2>
      </div>
      <strong>{blueprint.mediumLabel}</strong>
      <p>{blueprint.formatLabel}</p>
      <small>{blueprint.projectRoomSubtitle}</small>
      <button type="button" className="sx-secondary-button" onClick={onOpenMediaPanel}>
        <Layers size={15} />
        매체 변경
      </button>
    </section>
  );
}

function BibleIndexCard({
  project,
  bank,
  activeSection,
  onSelectSection
}: {
  project: SeriesProject;
  bank: StoryMemoryBank;
  activeSection: BibleSection;
  onSelectSection: (section: BibleSection) => void;
}) {
  const latestChapter = project.chapters.length > 0 ? project.chapters[project.chapters.length - 1] : null;
  const sectionCounts: Record<BibleSection, string> = {
    overview: `${bank.syncableFiles.length}개 동기화 기억`,
    characters: `${project.characters.length}명 · 욕망/상처/현재 상태`,
    world: `${project.worldRules.length}개 규칙 · 비용/예외/장소`,
    canon: `${project.canonFacts.length}개 사실 · ${project.chapters.length}개 회차`,
    voice: `${project.characters.flatMap((character) => character.voiceRules).length}개 말투 규칙`,
    approval: `${latestChapter?.newCanonFacts.length ?? 0}개 최신 후보`
  };

  return (
    <section className="sx-panel sx-bible-index-card" aria-label="작품 바이블 목차">
      <div className="sx-panel-heading">
        <Database size={16} />
        <h2>바이블 목차</h2>
      </div>
      {bibleSections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={activeSection === section.id ? 'is-selected' : ''}
          onClick={() => onSelectSection(section.id)}
        >
          <strong>{section.label}</strong>
          <span>{sectionCounts[section.id]}</span>
        </button>
      ))}
      <small>원고에서 생긴 새 사실은 바로 저장하지 않고 승인 대기 목록으로 보냅니다.</small>
    </section>
  );
}

function MemoryBankStudio({
  project,
  bank,
  activeSection,
  onSelectSection,
  onUpdateCharacter,
  onUpdateWorldRule,
  onUpdateCanon,
  onUpdateProject,
  approvalDecisions,
  onSetApprovalDecision
}: {
  project: SeriesProject;
  bank: StoryMemoryBank;
  activeSection: BibleSection;
  onSelectSection: (section: BibleSection) => void;
  onUpdateCharacter: (characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) => void;
  onUpdateWorldRule: (ruleId: string, value: string) => void;
  onUpdateCanon: (canonId: string, value: string) => void;
  onUpdateProject: (field: 'title' | 'logline' | 'audiencePromise' | 'tone', value: string) => void;
  approvalDecisions: Record<string, ApprovalDecision>;
  onSetApprovalDecision: (candidateId: string, decision: ApprovalDecision) => void;
}) {
  const latestChapter = project.chapters.length > 0 ? project.chapters[project.chapters.length - 1] : null;

  return (
    <section className="sx-bible-studio" aria-label="작품 바이블">
      <header className="sx-bible-hero">
        <div>
          <p className="sx-eyebrow">Memory Bank Studio</p>
          <h2>작품 바이블</h2>
          <p>
            캐릭터와 배경은 생성 폼이 아니라 계속 자라는 기억 카드입니다. 여기서 직접 고친 내용만 다음 원고와
            에이전트 검토의 기준이 됩니다.
          </p>
        </div>
        <aside>
          <span>{bank.root}</span>
          <strong>{bank.syncableFiles.length} sync files</strong>
          <small>private/raw-sources는 기본 컨텍스트에 포함하지 않습니다.</small>
        </aside>
      </header>

      <nav className="sx-bible-section-tabs" aria-label="바이블 섹션">
        {bibleSections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? 'is-active' : ''}
            onClick={() => onSelectSection(section.id)}
          >
            <strong>{section.label}</strong>
            <span>{section.summary}</span>
          </button>
        ))}
      </nav>

      {activeSection === 'overview' && (
        <div className="sx-bible-grid">
          <article className="sx-bible-card is-wide sx-memory-packet-card">
            <span>Story Core</span>
            <h3>{project.title}</h3>
            <label>
              <small>로그라인</small>
              <textarea value={project.logline} onChange={(event) => onUpdateProject('logline', event.target.value)} rows={3} />
            </label>
            <label>
              <small>독자 약속</small>
              <textarea
                value={project.audiencePromise}
                onChange={(event) => onUpdateProject('audiencePromise', event.target.value)}
                rows={3}
              />
            </label>
          </article>
          <article className="sx-bible-card">
            <span>Context Packet</span>
            <h3>역할별 기억 패킷</h3>
            <p>에이전트는 원문 전체가 아니라 자기 역할에 필요한 기억만 읽습니다.</p>
            <div className="sx-bible-memory-tags">
              <em>showrunner</em>
              <em>characters</em>
              <em>world</em>
              <em>voice</em>
            </div>
          </article>
          <article className="sx-bible-card">
            <span>Storage Policy</span>
            <h3>{bank.files.length} files</h3>
            <p>{bank.syncableFiles.length}개는 동기화 가능, private/raw-sources는 기본 컨텍스트에서 제외됩니다.</p>
          </article>
        </div>
      )}

      {activeSection === 'characters' && (
        <div className="sx-bible-grid">
          {project.characters.map((character) => (
          <article className="sx-bible-card" key={character.id}>
            <span>캐릭터</span>
            <h3>{character.name}</h3>
            <p>{character.role}</p>
            <label>
              <small>욕망</small>
              <textarea
                value={character.desire}
                onChange={(event) => onUpdateCharacter(character.id, 'desire', event.target.value)}
                rows={2}
              />
            </label>
            <label>
              <small>상처</small>
              <textarea
                value={character.wound}
                onChange={(event) => onUpdateCharacter(character.id, 'wound', event.target.value)}
                rows={2}
              />
            </label>
            <label>
              <small>현재 상태</small>
              <textarea
                value={character.currentState}
                onChange={(event) => onUpdateCharacter(character.id, 'currentState', event.target.value)}
                rows={3}
              />
            </label>
            <div className="sx-bible-memory-tags">
              {character.canonAnchors.slice(0, 3).map((anchor) => (
                <em key={anchor}>{anchor}</em>
              ))}
            </div>
          </article>
          ))}
        </div>
      )}

      {activeSection === 'world' && (
        <div className="sx-bible-grid">
          {project.worldRules.map((rule) => (
          <article className="sx-bible-card is-world" key={rule.id}>
            <span>배경 / 세계관</span>
            <h3>{rule.title}</h3>
            <label>
              <small>규칙과 비용</small>
              <textarea value={rule.rule} onChange={(event) => onUpdateWorldRule(rule.id, event.target.value)} rows={5} />
            </label>
            <div className="sx-bible-memory-tags">
              {rule.forbiddenContradictions.slice(0, 2).map((contradiction) => (
                <em key={contradiction.claim}>{contradiction.claim}</em>
              ))}
            </div>
          </article>
          ))}
        </div>
      )}

      {activeSection === 'canon' && (
        <div className="sx-bible-grid sx-canon-board">
          <article className="sx-bible-card is-wide">
            <span>Canon Ledger</span>
            <h3>승인된 사실</h3>
            <div className="sx-canon-editor-list">
              {project.canonFacts.map((fact) => (
                <label key={fact.id}>
                  <small>EP {fact.episode} · {fact.owner}</small>
                  <textarea value={fact.statement} onChange={(event) => onUpdateCanon(fact.id, event.target.value)} rows={2} />
                </label>
              ))}
            </div>
          </article>
          <article className="sx-bible-card is-wide">
            <span>Timeline</span>
            <h3>회차 흐름</h3>
            <div className="sx-timeline-list">
              {project.chapters.length === 0 ? (
                <p>첫 초안을 생성하면 회차 타임라인이 이곳에 쌓입니다.</p>
              ) : (
                project.chapters.map((chapter) => (
                  <div key={chapter.id}>
                    <strong>{chapter.episode}화 · {chapter.title}</strong>
                    <span>{chapter.hook}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      )}

      {activeSection === 'voice' && (
        <div className="sx-bible-grid">
          <article className="sx-bible-card is-wide">
          <span>문체 바이블</span>
          <h3>{project.tone}</h3>
          <label>
            <small>톤</small>
            <textarea value={project.tone} onChange={(event) => onUpdateProject('tone', event.target.value)} rows={2} />
          </label>
          <label>
            <small>독자 약속</small>
            <textarea
              value={project.audiencePromise}
              onChange={(event) => onUpdateProject('audiencePromise', event.target.value)}
              rows={3}
            />
          </label>
          <div className="sx-bible-memory-tags">
            {project.characters.flatMap((character) => character.voiceRules).slice(0, 5).map((rule) => (
              <em key={rule}>{rule}</em>
            ))}
          </div>
          </article>
          <article className="sx-bible-card">
            <span>시각 바이블</span>
            <h3>다빈치 프롬프트 앵커</h3>
            <p>캐릭터 외형, 색, 조명, 렌즈 규칙은 매체 전환 시 visual memory packet으로 전달됩니다.</p>
          </article>
          <article className="sx-bible-card">
            <span>오디오 바이블</span>
            <h3>낭독 리듬</h3>
            <p>톤, 쉼, 반복 후크, 발음 주의 단어는 오디오북/영상 보드의 기준으로 쓰입니다.</p>
          </article>
        </div>
      )}

      {activeSection === 'approval' && (
        <div className="sx-bible-grid sx-approval-queue">
          <article className="sx-bible-card sx-bible-approval is-wide">
          <span>승인 대기</span>
          <h3>새 기억 후보</h3>
          <p>검토 버튼을 누른 뒤 생긴 새 캐논, 캐릭터 변화, 세계관 예외는 이곳에서 승인/수정/거절하게 됩니다.</p>
          {latestChapter ? (
            <div className="sx-approval-list">
              {latestChapter.newCanonFacts.map((fact) => {
                const decision = approvalDecisions[fact.id];

                return (
                  <article key={fact.id} className={decision ? `is-${decision}` : undefined}>
                    <span>EP {fact.episode} · {fact.owner}</span>
                    <p>{fact.statement}</p>
                    {decision && <strong className="sx-approval-status">{approvalDecisionLabels[decision]}</strong>}
                    <div>
                      <button type="button" onClick={() => onSetApprovalDecision(fact.id, 'approved')}>
                        승인
                      </button>
                      <button type="button" onClick={() => onSetApprovalDecision(fact.id, 'revision')}>
                        수정 요청
                      </button>
                      <button type="button" onClick={() => onSetApprovalDecision(fact.id, 'hold')}>
                        보류
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>아직 생성된 회차가 없어 승인 대기 후보가 없습니다.</p>
          )}
          </article>
          <article className="sx-bible-card is-wide">
            <span>Impact Preview</span>
            <h3>영향 범위</h3>
            <p>새 기억을 승인하면 캐릭터, 세계관, 문체, 회차 타임라인 중 어느 영역이 바뀌는지 이곳에 표시합니다.</p>
            <div className="sx-bible-memory-tags">
              <em>characters</em>
              <em>world</em>
              <em>canon</em>
              <em>voice</em>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function ProjectStateCard({ project, canonHealth }: { project: SeriesProject; canonHealth: number }) {
  return (
    <section className="sx-project-card">
      <p className="sx-eyebrow">프로젝트 상태</p>
      <h2>{project.title}</h2>
      <div className="sx-project-meter">
        <strong>{canonHealth}%</strong>
        <span>연속성 건강도</span>
      </div>
      <div className="sx-meter-track">
        <i style={{ width: `${canonHealth}%` }} />
      </div>
      <dl>
        <div>
          <dt>회차</dt>
          <dd>{project.currentEpisode}</dd>
        </div>
        <div>
          <dt>캐논</dt>
          <dd>{project.canonFacts.length}</dd>
        </div>
        <div>
          <dt>질문</dt>
          <dd>{project.openThreads.length}</dd>
        </div>
      </dl>
    </section>
  );
}

function MemoryBankCard({ bank }: { bank: StoryMemoryBank }) {
  const privateFiles = bank.files.filter((file) => file.syncPolicy === 'private-never-sync');
  const folders = Array.from(
    new Set(
      bank.syncableFiles
        .map((file) => file.path.replace(`${bank.root}/`, '').split('/')[0])
        .filter((folder) => folder !== 'manifest.json' && folder !== 'story-core.md')
    )
  ).slice(0, 5);

  return (
    <section className="sx-panel sx-memory-bank-card" aria-label="Story X 메모리 뱅크">
      <div className="sx-panel-heading">
        <Database size={16} />
        <h2>메모리 뱅크</h2>
      </div>
      <p className="sx-memory-bank-root">{bank.root}</p>
      <dl className="sx-memory-bank-stats">
        <div>
          <dt>sync</dt>
          <dd>{bank.syncableFiles.length}</dd>
        </div>
        <div>
          <dt>private</dt>
          <dd>{privateFiles.length}</dd>
        </div>
        <div>
          <dt>files</dt>
          <dd>{bank.files.length}</dd>
        </div>
      </dl>
      <div className="sx-memory-bank-folders">
        {folders.map((folder) => (
          <span key={folder}>{folder}</span>
        ))}
      </div>
      <small>원문 자료는 private/raw-sources에 두고, 에이전트는 필요한 구조 기억만 읽습니다.</small>
    </section>
  );
}

function EvaluatorQualityCard({ workflow }: { workflow: TesterDrivenWorkflow }) {
  return (
    <section className="sx-panel sx-evaluator-card" aria-label="평가 반영 품질 게이트">
      <div className="sx-panel-heading">
        <ClipboardCheck size={16} />
        <h2>품질 게이트</h2>
      </div>
      <p>{workflow.activationMetric}</p>
      <div className="sx-evaluator-gates">
        {workflow.qualityGateIds.map((gate) => (
          <span key={gate}>{gate}</span>
        ))}
      </div>
      <ol>
        {workflow.steps.slice(0, 4).map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <small>{step.owner}</small>
          </li>
        ))}
      </ol>
      <small>{workflow.approvalRule}</small>
    </section>
  );
}

function AgentSidebar({
  runs,
  onSelectAgent
}: {
  runs: AgentRun[];
  onSelectAgent: (run: AgentRun, persona: AgentPersona) => void;
}) {
  return (
    <section className="sx-panel sx-agent-sidebar" aria-label="AI 작가진">
      <div className="sx-panel-heading">
        <BrainCircuit size={16} />
        <h2>작가진</h2>
      </div>
      <div>
        {runs.map((run) => {
          const persona = getAgentPersona(run);

          return (
            <button
              key={`${run.agentId}-${run.title}`}
              type="button"
              className="sx-agent-card"
              aria-label={`${persona.title} 자세한 지시사항 열기`}
              onClick={() => onSelectAgent(run, persona)}
            >
              <AgentPixelPortrait persona={persona} />
              <div>
                <span>{persona.subtitle}</span>
                <strong>{persona.title}</strong>
                <p>{run.output}</p>
                <small>
                  <MessageCircle size={13} />
                  대화하기
                </small>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AgentPixelPortrait({ persona }: { persona: AgentPersona }) {
  return (
    <div className={`pixel-agent ${persona.pixelClass}`} aria-hidden="true">
      <span className="pixel-agent-hair" />
      <span className="pixel-agent-head">
        <i />
        <b />
      </span>
      <span className="pixel-agent-neck" />
      <span className="pixel-agent-body" />
    </div>
  );
}

function AgentProfileDialog({
  run,
  persona,
  projectTitle,
  onClose
}: {
  run: AgentRun;
  persona: AgentPersona;
  projectTitle: string;
  onClose: () => void;
}) {
  const validationProcess = getAgentValidationProcess(persona.id);
  const scaleOptions = Object.values(reviewScales);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      role: 'agent',
      text: persona.openingLine
    }
  ]);
  const [draft, setDraft] = useState('');

  function submitAgentQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();

    if (!question) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      {
        role: 'agent',
        text: buildAgentReply(persona, run, projectTitle, question)
      }
    ]);
    setDraft('');
  }

  return (
    <div className="agent-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="agent-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <AgentPixelPortrait persona={persona} />
          <div>
            <p className="sx-eyebrow">Story X Writers Room</p>
            <h2 id="agent-dialog-title">{persona.title}</h2>
            <span>{persona.subtitle}</span>
          </div>
          <button type="button" className="agent-dialog-close" aria-label="에이전트 대화창 닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="agent-dialog-body">
          <aside className="agent-instruction-panel">
            <h3>자세한 지시사항</h3>
            <p>{persona.instruction}</p>
            <h4>검수 기준</h4>
            <ul>
              {persona.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
            <h4>최근 판단</h4>
            <p>{run.output}</p>
            <h4>검증 프로세스</h4>
            <ol className="agent-process-list">
              <li>{validationProcess.agenda}</li>
              <li>독립 검토 후 {validationProcess.outputFormat.join(', ')}을 남깁니다.</li>
              <li>차단 신호: {validationProcess.blockingSignals.join(' / ')}</li>
            </ol>
            <h4>성장 메모리</h4>
            <ul>
              {validationProcess.evolutionMemory.map((memory) => (
                <li key={memory}>{memory}</li>
              ))}
            </ul>
            <div className="agent-review-scales" aria-label="검토 규모 옵션">
              <span>테스트 검토 실행 전 규모 선택</span>
              <div>
                {scaleOptions.map((scale) => (
                  <small key={scale.id}>
                    {scale.label} · {scale.tokenProfile}
                  </small>
                ))}
              </div>
            </div>
          </aside>
          <section className="agent-chat-panel" aria-label={`${persona.title} 대화`}>
            <div className="agent-chat-list">
              {messages.map((message, index) => (
                <p key={`${message.role}-${index}`} className={`agent-chat-message is-${message.role}`}>
                  {message.text}
                </p>
              ))}
            </div>
            <form className="agent-chat-form" onSubmit={submitAgentQuestion}>
              <label>
                <span>{persona.title}에게 묻기</span>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="예: 이 인물이 여기서 이렇게 행동해도 괜찮을까?"
                  autoComplete="off"
                />
              </label>
              <button type="submit" aria-label="질문 보내기">
                <Send size={16} />
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}

function buildAgentReply(persona: AgentPersona, run: AgentRun, projectTitle: string, question: string) {
  const firstCheck = persona.checks[0] ?? '현재 작품 기준';
  const evidence = run.evidence[0] ? ` 최근 근거는 "${run.evidence[0]}"입니다.` : '';

  return `${projectTitle} 기준으로 보면, "${question}"은 "${firstCheck}"부터 확인하면 좋겠습니다. ${run.output}${evidence} 다음 단계는 이 결정을 canon, 인물 감정선, 독자 약속 중 어디에 저장할지 정하는 것입니다.`;
}

function AgentRoom({ runs }: { runs: AgentRun[] }) {
  return (
    <section className="sx-agent-room" aria-label="AI 작가진">
      {runs.map((run, index) => {
        const persona = getAgentPersona(run);

        return (
          <article key={`${run.agentId}-${run.title}`}>
            <AgentPixelPortrait persona={persona} />
            <div>
              <span>0{index + 1}</span>
              <h3>{persona.title}</h3>
              <p>{run.output}</p>
            </div>
            {index < runs.length - 1 && <ChevronRight className="sx-agent-arrow" size={16} />}
          </article>
        );
      })}
    </section>
  );
}

function CreativeStage({
  blueprint,
  chapter,
  project,
  editableText,
  editedSinceReview,
  onEditableTextChange,
  onReviewDraft
}: {
  blueprint: CreativeBlueprint;
  chapter: Chapter | null;
  project: SeriesProject;
  editableText: string;
  editedSinceReview: boolean;
  onEditableTextChange: (value: string) => void;
  onReviewDraft: () => void;
}) {
  if (blueprint.medium === 'comics') {
    const visualWorkflow = buildComicsVisualWorkflow(blueprint.format);
    const frameLabels =
      blueprint.format === 'insta-toon'
        ? ['01 공감', '02 확장', '03 반전', '04 저장']
        : ['01 도입', '02 장면', '03 전환', '04 클라이맥스', '05 여운', '06 다음 컷'];

    return (
      <section className="sx-creative-stage" aria-label="만화 캔버스">
        <div className="sx-canvas-surface">
          <header>
            <p className="sx-eyebrow">Comic Canvas</p>
            <h2>{blueprint.formatLabel} 캔버스</h2>
            <p>중앙에는 컷의 순서와 감정 리듬을 두고, 캐릭터/배경/프롬프트 검수는 양쪽 레일에서 관리합니다.</p>
          </header>
          <div className="sx-comic-canvas">
            {frameLabels.map((label, index) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{blueprint.productionPhases[index % blueprint.productionPhases.length].title}</strong>
              </article>
            ))}
          </div>
          <div className="sx-visual-workflow-strip" aria-label="만화 제작 에이전트 흐름">
            {visualWorkflow.phases.slice(1, 6).map((phase) => (
              <article key={phase.title}>
                <span>{phase.title}</span>
                <strong>{phase.owner}</strong>
                <p>{phase.outcome}</p>
              </article>
            ))}
          </div>
          <div className="sx-visual-locks" aria-label="시각 일관성 잠금">
            <strong>{visualWorkflow.referencePolicy.primaryGenerator} 원화 선택 후 다빈치 프롬프트</strong>
            <p>{visualWorkflow.referencePolicy.rule}</p>
            <div>
              {visualWorkflow.visualLocks.map((lock) => (
                <span key={lock}>{lock}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (blueprint.medium === 'audiobook') {
    const boards = blueprint.productionPhases.length > 0 ? blueprint.productionPhases : [
      { title: '도입', outcome: '청자의 주의를 붙잡는 첫 소리와 첫 문장' },
      { title: '전개', outcome: '음성, 자막, 이미지 전환의 순서' },
      { title: '마무리', outcome: '반복 후크와 다음 행동' }
    ];

    return (
      <section className="sx-creative-stage" aria-label="오디오북 스토리보드">
        <div className="sx-storyboard-surface">
          <header>
            <p className="sx-eyebrow">Audio / Video Board</p>
            <h2>{blueprint.formatLabel} 스토리보드</h2>
            <p>소리와 영상이 들어가는 매체는 중앙을 장면 순서표로 쓰고, 오른쪽에서 캐논과 질문을 확인합니다.</p>
          </header>
          <div className="sx-storyboard-lane">
            {boards.map((board, index) => (
              <article key={board.title}>
                <div>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{board.title}</strong>
                </div>
                <p>{board.outcome}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sx-creative-stage" aria-label="글쓰기 원고">
      <div className={`sx-writing-surface ${editedSinceReview ? 'is-edited' : ''}`}>
        {chapter ? (
          <article className="sx-writing-page">
            <p className="sx-eyebrow">Episode {chapter.episode}</p>
            <h2>{chapter.title}</h2>
            <p className="sx-writing-hook">{chapter.hook}</p>
            <div className="sx-outline-strip">
              {chapter.outline.map((beat) => (
                <p key={beat}>{beat}</p>
              ))}
            </div>
            <label className="sx-manuscript-editor-wrap">
              <span>직접 편집 원고</span>
              <textarea
                className={`sx-manuscript-editor ${editedSinceReview ? 'is-edited' : ''}`}
                aria-label="원고 편집기"
                value={editableText}
                onChange={(event) => onEditableTextChange(event.target.value)}
                rows={16}
              />
            </label>
            <div className={`sx-edit-state ${editedSinceReview ? 'is-dirty' : ''}`}>
              <strong>{editedSinceReview ? '수정됨' : '검토 기준과 동기화됨'}</strong>
              <span>{editedSinceReview ? '직접 고친 문장은 빨간 표시로 남고, 검토 버튼을 누르면 오른쪽 에이전트들이 순서대로 다시 봅니다.' : '수정 후 검토를 누르면 에이전트 의견이 갱신됩니다.'}</span>
              <button type="button" className="sx-secondary-button" onClick={onReviewDraft}>
                <ClipboardCheck size={15} />
                검토
              </button>
            </div>
          </article>
        ) : (
          <article className="sx-writing-page sx-writing-empty">
            <BookOpen size={24} />
            <p className="sx-eyebrow">{blueprint.projectRoomTitle}</p>
            <h2>원고는 이 중앙 무대에서 자랍니다.</h2>
            <p>
              왼쪽에서 작업 브리프를 조정하고 실행하면, 초안과 후크가 이 영역에 크게 배치됩니다. 열린 질문은
              오른쪽 레일에 남겨 장면을 쓰는 동안 시야를 빼앗지 않게 했습니다.
            </p>
            {project.openThreads.length > 0 && <small>열린 질문 {project.openThreads.length}개가 대기 중입니다.</small>}
          </article>
        )}
      </div>
    </section>
  );
}

function ContinuitySummaryCard({
  status,
  blocked,
  warnings
}: {
  status: 'clear' | 'blocked';
  blocked: number;
  warnings: number;
}) {
  return (
    <section className={`sx-continuity-card is-${status}`}>
      {status === 'clear' ? <Check size={18} /> : <ShieldAlert size={18} />}
      <div>
        <p className="sx-eyebrow">연속성 검사</p>
        <h2>{status === 'clear' ? '충돌 없음' : '수정 필요'}</h2>
      </div>
      <dl>
        <div>
          <dt>차단</dt>
          <dd>{blocked}</dd>
        </div>
        <div>
          <dt>경고</dt>
          <dd>{warnings}</dd>
        </div>
      </dl>
    </section>
  );
}
