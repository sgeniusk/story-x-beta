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
  Lock,
  Maximize2,
  MessageCircle,
  Minimize2,
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
  applyApprovedMemory,
  buildProjectContextDigest,
  buildStoryEditorWorkspace,
  chapterFromDraftPayload,
  createSeedProject,
  getGenreProfiles,
  lockChapter,
  produceNextChapter,
  type AgentRun,
  type Chapter,
  type GenreId,
  type ProductionRequest,
  type ProductionResult,
  type SeriesProject
} from './lib/storyEngine';
import { requestLlmDraft } from './lib/draftClient';
import { requestLlmReview } from './lib/reviewClient';
import { describeKoreanStyleLevel, evaluateKoreanProse } from './lib/koreanStyle';
import {
  agentReportsToRuns,
  buildAiCliRunPlan,
  buildMockAiCliReviewResult,
  type AiCliProvider,
  type AiCliReviewResult,
  type AiCliScale
} from './lib/aiCliHarness';
import {
  buildMemoryApprovalQueue,
  buildStoryMemoryBank,
  type MemoryApprovalDecision,
  type MemoryApprovalQueue,
  type StoryMemoryBank
} from './lib/memoryBank';
import { buildTesterDrivenWorkflow, type TesterDrivenWorkflow } from './lib/evaluationSynthesis';
import { buildComicsVisualWorkflow } from './lib/visualProduction';
import { getCreativeActionLabels } from './lib/projectBlueprint';
import { buildPublishingPlan, type PublishingPlan } from './lib/publishing';
import { buildAlphaReadinessReport, type AlphaReadinessReport } from './lib/alphaReadiness';
import { buildOneProjectVerticalSlice, type OneProjectVerticalSlice } from './lib/verticalSlice';
import { STORYX_VERSION, storyxVersionLog } from './lib/version';
import type { StoryXVersionInfo, StoryXVersionLogEntry } from './lib/version';
import {
  buildCanonRefactorPlan,
  createCanonChangeEntry,
  type CanonChangeEntry,
  type CanonChangeEntryInput,
  type CanonRefactorPlan
} from './lib/canonRefactor';
import { clearProject, loadProject, saveProject } from './lib/storage';

type DeskTrack = 'draft' | 'bible';
type BibleSection = 'overview' | 'characters' | 'world' | 'canon' | 'voice' | 'approval';
type ApprovalDecision = MemoryApprovalDecision;

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

interface BibleSectionState {
  id: BibleSection;
  label: string;
  summary: string;
  directive: string;
  primaryMetric: string;
  impactLabel: string;
  impactScope: string;
  syncTargets: string[];
  reviewAgents: Array<{
    label: string;
    focus: string;
  }>;
}

interface DeskCommand {
  id: string;
  label: string;
  section: string;
  description: string;
  shortcut?: string;
  disabled?: boolean;
  run: () => void;
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

function getMediumChampionRun(medium: CreativeMedium): AgentRun | null {
  switch (medium) {
    case 'essay':
      return {
        agentId: 'essay-interviewer',
        title: '에세이 인터뷰어',
        status: 'idle',
        output: '자유 서술에 적은 경험을 기반으로 질문을 만들고, 사실 보호 모드 안에서 AI가 새 디테일을 발명하지 않게 지킵니다.',
        evidence: ['lived material', 'fact protection']
      };
    case 'audiobook':
      return {
        agentId: 'audio-narration-director',
        title: '낭독 연출가',
        status: 'idle',
        output: '낭독 톤, 쉼, 호흡, 청취 피로를 책임집니다. 첫 30초 proof와 회차 분당 낭독 시간을 봅니다.',
        evidence: ['narration tone', 'pause map']
      };
    case 'comics':
      return {
        agentId: 'storyboard-agent',
        title: '스토리보드 작가',
        status: 'idle',
        output: '컷 리듬, 말풍선 위치, 스크롤 후크, 캐릭터 외관 일관성을 책임집니다.',
        evidence: ['panel rhythm', 'visual continuity']
      };
    case 'novel':
    default:
      return null;
  }
}

function mergeAgentRuns(primaryRuns: AgentRun[], extraRuns: AgentRun[]) {
  const seen = new Set(primaryRuns.map((run) => run.agentId));

  return [...primaryRuns, ...extraRuns.filter((run) => !seen.has(run.agentId))];
}

const defaultRuns: AgentRun[] = [
  {
    agentId: 'showrunner',
    title: '쇼러너',
    status: 'idle',
    output: '이번 회차의 약속, 압력, 마지막 질문을 한 줄로 잠글 준비가 되어 있습니다.',
    evidence: ['독자 약속', '클리프행어']
  },
  {
    agentId: 'character-custodian',
    title: '캐릭터',
    status: 'idle',
    output: '욕망, 상처, 관계 상태가 초안에서 흔들리지 않는지 확인합니다.',
    evidence: ['desire', 'wound']
  },
  {
    agentId: 'world-keeper',
    title: '월드',
    status: 'idle',
    output: '세계 규칙과 비용이 장면마다 같은 방식으로 작동하는지 봅니다.',
    evidence: ['rules', 'cost']
  },
  {
    agentId: 'genre-stylist',
    title: '장르',
    status: 'idle',
    output: '장르 리듬과 문체 질감을 회차 목적에 맞게 조정합니다.',
    evidence: ['beat', 'texture']
  },
  {
    agentId: 'continuity-editor',
    title: '연속성',
    status: 'idle',
    output: '모순은 숨기지 않고 충돌로 표시하고, 승인된 사실만 canon에 넣습니다.',
    evidence: ['canon', 'conflict']
  }
];

const visualStoryAgentRuns: AgentRun[] = [
  {
    agentId: 'storyboard-agent',
    title: '웹툰 연출',
    status: 'idle',
    output: '장면을 컷 기능, 스크롤 템포, 넘김 후크로 분해합니다.',
    evidence: ['panel-plan', 'scroll-rhythm']
  },
  {
    agentId: 'speech-bubble-agent',
    title: '말풍선',
    status: 'idle',
    output: '말풍선 위치와 대사 밀도가 표정, 손동작, 핵심 소품을 가리지 않는지 봅니다.',
    evidence: ['bubble-map', 'dialogue-density']
  },
  {
    agentId: 'keyframe-art-director',
    title: '원화',
    status: 'idle',
    output: 'Midjourney 원화 후보 중 사용자가 선택한 컷만 visual DNA로 잠급니다.',
    evidence: ['midjourney-keyframe', 'visual-dna']
  },
  {
    agentId: 'da-vinci',
    title: '다빈치',
    status: 'idle',
    output: '승인된 원화와 캐릭터 시트를 컷별 이미지 프롬프트로 변환합니다.',
    evidence: ['image-prompt', 'negative-prompt']
  },
  {
    agentId: 'frame-assembly-agent',
    title: '프레임',
    status: 'idle',
    output: '정사각형, 세로 스크롤, 페이지 시퀀스에 맞춰 컷 순서와 export 묶음을 확인합니다.',
    evidence: ['frame-order', 'export-package']
  }
];

function buildBibleAssistantRuns(
  project: SeriesProject,
  approvalQueue: MemoryApprovalQueue,
  canonRefactorPlan: CanonRefactorPlan,
  latestReviewResult: AiCliReviewResult | null
): AgentRun[] {
  const pendingCount = approvalQueue.items.filter((item) => item.status !== 'approved').length;
  const reviewCount = latestReviewResult?.agentReports.length ?? 0;
  const hasChapters = project.chapters.length > 0;
  const baseStatus: AgentRun['status'] = hasChapters ? 'pass' : 'idle';

  return [
    {
      agentId: 'continuity-editor',
      title: '캐논 리팩터',
      status: canonRefactorPlan.status === 'blocked' ? 'block' : baseStatus,
      output:
        canonRefactorPlan.status === 'blocked'
          ? `${canonRefactorPlan.conflictWarnings.length}개 충돌이 있어 승인 전 영향 회차를 먼저 정리해야 합니다.`
          : `${project.canonFacts.length}개 캐논과 ${project.chapters.length}개 회차를 기준으로 변경 영향을 추적합니다.`,
      evidence: ['canon ledger', 'timeline']
    },
    {
      agentId: 'character-custodian',
      title: '캐릭터 편집 조수',
      status: baseStatus,
      output: `${project.characters.length}명의 욕망, 상처, 현재 상태를 다음 원고 기준으로 편집 가능하게 관리합니다.`,
      evidence: ['desire', 'wound', 'relationship-state']
    },
    {
      agentId: 'world-keeper',
      title: '세계관 편집 조수',
      status: baseStatus,
      output: `${project.worldRules.length}개 세계 규칙의 비용, 예외, 금지 충돌을 한곳에서 고정합니다.`,
      evidence: ['world rules', 'cost', 'forbidden contradiction']
    },
    {
      agentId: 'voice-curator',
      title: '문체 조수',
      status: baseStatus,
      output: '문체, 감각, 시각/오디오 앵커를 매체 전환용 기억 패킷으로 정리합니다.',
      evidence: ['voice bible', 'visual anchor', 'audio rhythm']
    },
    {
      agentId: 'essay-interviewer',
      title: '승인 대기 조수',
      status: pendingCount > 0 ? 'revise' : reviewCount > 0 ? 'pass' : 'idle',
      output:
        pendingCount > 0
          ? `${pendingCount}개 기억 후보가 승인 대기 중입니다. 사용자가 승인하기 전에는 canon에 반영하지 않습니다.`
          : reviewCount > 0
            ? `${reviewCount}개 검토 보고서를 반영했고, 새 후보는 승인 대기함으로만 이동합니다.`
            : '새 기억 후보는 검토 후 승인 대기함에 쌓이고, 직접 확인한 항목만 동기화됩니다.',
      evidence: ['approval queue', 'user decision']
    }
  ];
}

function agentStatusLabel(status: AgentRun['status']): string {
  switch (status) {
    case 'idle':
      return '대기';
    case 'pass':
    case 'complete':
      return '양호';
    case 'revise':
      return '주의';
    case 'block':
      return '경고';
  }
}

function buildBibleSectionState({
  activeSection,
  project,
  bank,
  approvalQueue,
  canonChanges,
  canonRefactorPlan
}: {
  activeSection: BibleSection;
  project: SeriesProject;
  bank: StoryMemoryBank;
  approvalQueue: MemoryApprovalQueue;
  canonChanges: CanonChangeEntry[];
  canonRefactorPlan: CanonRefactorPlan;
}): BibleSectionState {
  const section = bibleSections.find((item) => item.id === activeSection) ?? bibleSections[0];
  const changedKindsBySection: Record<BibleSection, CanonChangeEntry['kind'][]> = {
    overview: ['story-core'],
    characters: ['character'],
    world: ['world'],
    canon: ['canon'],
    voice: ['voice', 'visual', 'audio'],
    approval: ['canon', 'story-core', 'character', 'world', 'voice', 'visual', 'audio']
  };
  const defaults: Record<BibleSection, Pick<BibleSectionState, 'directive' | 'primaryMetric' | 'syncTargets' | 'reviewAgents'>> = {
    overview: {
      directive: '작품의 한 문장 약속과 저장 정책을 고정합니다. 이 값이 바뀌면 이후 원고와 출간 패키지의 기준도 함께 움직입니다.',
      primaryMetric: `${bank.syncableFiles.length}개 동기화 기억`,
      syncTargets: ['story-core', 'manifest', 'context-packet'],
      reviewAgents: [
        { label: '쇼러너', focus: '독자 약속과 장기 전개 기준 확인' },
        { label: '연속성 감수자', focus: '기존 캐논과 저장 정책 충돌 확인' }
      ]
    },
    characters: {
      directive: '캐릭터의 욕망, 상처, 현재 상태를 직접 고칩니다. 인물 변경은 다음 회차 행동과 대사 선택에 바로 영향을 줍니다.',
      primaryMetric: `${project.characters.length}명 관리 중`,
      syncTargets: ['characters', 'canon-anchors', 'relationship-state'],
      reviewAgents: [
        { label: '캐릭터 큐레이터', focus: '욕망, 상처, 말투, 관계 상태 변화 검토' },
        { label: '연속성 감수자', focus: '이전 회차 행동과 승인된 캐논 충돌 확인' },
        { label: '쇼러너', focus: '앞으로의 회차 약속 재정렬' }
      ]
    },
    world: {
      directive: '세계 규칙과 비용을 편집합니다. 세계관 변경은 사건 해결 난이도와 장면 설득력을 함께 바꿉니다.',
      primaryMetric: `${project.worldRules.length}개 규칙`,
      syncTargets: ['world', 'forbidden-contradictions', 'visual-context'],
      reviewAgents: [
        { label: '배경 설계자', focus: '세계 규칙, 비용, 예외가 싸지지 않았는지 확인' },
        { label: '연속성 감수자', focus: '타임라인과 기존 사건 충돌 확인' },
        { label: '장르 스타일리스트', focus: '장르적 압력과 재미 유지 확인' }
      ]
    },
    canon: {
      directive: '승인된 사실과 회차 흐름을 고칩니다. 이미 독자에게 보여준 사실은 reveal, revision, blocked 중 하나로 판정해야 합니다.',
      primaryMetric: `${project.canonFacts.length}개 승인 사실`,
      syncTargets: ['canon', 'timeline', 'release-impact'],
      reviewAgents: [
        { label: '연속성 감수자', focus: '승인된 사실의 대체/폐기/반전 여부 판정' },
        { label: '쇼러너', focus: '복선 회수나 반전으로 쓸 수 있는지 판단' }
      ]
    },
    voice: {
      directive: '문체, 감각, 시각/오디오 앵커를 고정합니다. 매체가 바뀌어도 같은 작품처럼 느껴지는 기준을 만듭니다.',
      primaryMetric: `${project.characters.flatMap((character) => character.voiceRules).length}개 문체 앵커`,
      syncTargets: ['voice', 'visual', 'audio'],
      reviewAgents: [
        { label: '문체 큐레이터', focus: '문체 바이블과 한국어 자연스러움 재검토' },
        { label: '다빈치', focus: '시각 프롬프트와 visual DNA 영향 범위 확인' },
        { label: '오디오 연출가', focus: '낭독 톤, 쉼, 청취 리듬 영향 확인' }
      ]
    },
    approval: {
      directive: 'AI 검토나 새 회차에서 나온 기억 후보를 승인 전 편집합니다. 사용자가 승인하기 전에는 canon에 반영하지 않습니다.',
      primaryMetric: `${approvalQueue.summary.total}개 후보`,
      syncTargets: ['approval-queue', 'memory-candidates', 'change-log'],
      reviewAgents: [
        { label: '연속성 감수자', focus: '승인 가능한 사실과 보류할 후보 분리' },
        { label: '문제 큐레이터', focus: '사용자 직접 편집 문장을 문체와 우선 증거로 확인' },
        { label: '인사이트 분석가', focus: '반복 실패와 개선 포인트 기록' }
      ]
    }
  };
  const sectionChanges = canonChanges.filter((change) => changedKindsBySection[activeSection].includes(change.kind));
  const reviewAgents =
    sectionChanges.length > 0 && canonRefactorPlan.reviewOrder.length > 0
      ? canonRefactorPlan.reviewOrder.map((step) => ({ label: step.label, focus: step.focus }))
      : defaults[activeSection].reviewAgents;
  const pendingCount = approvalQueue.items.filter((item) => item.status !== 'approved').length;

  return {
    id: activeSection,
    label: section.label,
    summary: section.summary,
    directive: defaults[activeSection].directive,
    primaryMetric: defaults[activeSection].primaryMetric,
    impactLabel: sectionChanges.length > 0 ? `${sectionChanges.length}개 변경 로그` : activeSection === 'approval' ? `${pendingCount}개 승인 대기` : '대기 없음',
    impactScope:
      canonRefactorPlan.affectedChapters.length > 0
        ? `${canonRefactorPlan.affectedChapters.length}개 회차 영향 가능`
        : '아직 특정 회차 영향은 없습니다.',
    syncTargets: defaults[activeSection].syncTargets,
    reviewAgents
  };
}

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
  const [approvalStatementOverrides, setApprovalStatementOverrides] = useState<Record<string, string>>({});
  const [syncedCandidateIds, setSyncedCandidateIds] = useState<string[]>([]);
  const [reviewScale, setReviewScale] = useState<AiCliScale>('small');
  const [reviewProvider, setReviewProvider] = useState<AiCliProvider>('mock');
  const [latestReviewResult, setLatestReviewResult] = useState<AiCliReviewResult | null>(null);
  const [isMediaPanelOpen, setIsMediaPanelOpen] = useState(false);
  const [isPublishingMode, setIsPublishingMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [isVersionLogOpen, setIsVersionLogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDialogSelection | null>(null);
  const [canonChanges, setCanonChanges] = useState<CanonChangeEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [generationNote, setGenerationNote] = useState<string | null>(null);

  const blueprint = useMemo(() => buildCreativeBlueprint({ medium, format }), [medium, format]);
  const editorWorkspace = useMemo(
    () => buildStoryEditorWorkspace(project, { draftClaims: [request.intent, request.pressure] }),
    [project, request.intent, request.pressure]
  );
  const memoryBank = useMemo(() => buildStoryMemoryBank(project), [project]);
  const verticalSlice = useMemo(
    () =>
      buildOneProjectVerticalSlice({
        material: draftPrompt || request.intent,
        storySeed: request.pressure || project.logline,
        characterSeed: project.characters
          .map((character) => `${character.name}: ${character.role} / ${character.desire}`)
          .join('\n'),
        artDirection: project.tone
      }),
    [draftPrompt, project.characters, project.logline, project.tone, request.intent, request.pressure]
  );
  const approvalQueue = useMemo(
    () =>
      buildMemoryApprovalQueue({
        project,
        reviewCandidates: [...(latestReviewResult?.memoryCandidates ?? []), ...verticalSlice.memoryCandidates].filter(
          (candidate) => !syncedCandidateIds.includes(candidate.id)
        ),
        decisions: approvalDecisions,
        statementOverrides: approvalStatementOverrides
      }),
    [approvalDecisions, approvalStatementOverrides, latestReviewResult, project, syncedCandidateIds, verticalSlice]
  );
  const styleReport = useMemo(
    () => evaluateKoreanProse(editorText || latestChapter?.prose || ''),
    [editorText, latestChapter]
  );
  const evaluatorWorkflow = useMemo(() => buildTesterDrivenWorkflow(blueprint), [blueprint]);
  const publishingPlan = useMemo(
    () => buildPublishingPlan(project, blueprint, { approvalQueue }),
    [approvalQueue, blueprint, project]
  );
  const canonRefactorPlan = useMemo(() => buildCanonRefactorPlan(project, canonChanges), [canonChanges, project]);
  const alphaReport = useMemo(
    () =>
      buildAlphaReadinessReport({
        project,
        blueprint,
        memoryBank,
        approvalQueue,
        canonRefactorPlan,
        latestReviewResult,
        publishingPlan
      }),
    [approvalQueue, blueprint, canonRefactorPlan, latestReviewResult, memoryBank, project, publishingPlan]
  );
  const aiCliRunPlan = useMemo(
    () =>
      buildAiCliRunPlan({
        provider: reviewProvider,
        mode: 'review',
        scale: reviewScale,
        project
      }),
    [project, reviewProvider, reviewScale]
  );
  const displayedAgentRuns = useMemo(
    () => {
      const baseRuns = blueprint.nextWorkspace === 'visual-storyboard-studio'
        ? mergeAgentRuns(agentRuns, visualStoryAgentRuns)
        : agentRuns;
      const champion = getMediumChampionRun(blueprint.medium);
      if (!champion) return baseRuns;
      if (baseRuns.some((run) => run.agentId === champion.agentId)) return baseRuns;
      return [...baseRuns, champion];
    },
    [agentRuns, blueprint.medium, blueprint.nextWorkspace]
  );
  const bibleAssistantRuns = useMemo(
    () => buildBibleAssistantRuns(project, approvalQueue, canonRefactorPlan, latestReviewResult),
    [approvalQueue, canonRefactorPlan, latestReviewResult, project]
  );
  const canonHealth = useMemo(() => {
    const total = project.canonFacts.length + project.worldRules.length + project.characters.length;
    const episodes = Math.max(project.currentEpisode, 1);
    return Math.min(99, Math.round((total / (episodes + 6)) * 16));
  }, [project]);
  const bibleAlertCount = editorWorkspace.continuitySummary.blocked + editorWorkspace.continuitySummary.warnings;
  const isBibleMode = activeTrack === 'bible' && !isPublishingMode;
  const activeModeLabel = isPublishingMode ? '출간 준비' : activeTrack === 'bible' ? '작품 바이블' : '원고';
  const chapterCrumb = latestChapter ? `${latestChapter.episode}화` : '새 초안';
  const saveLabel = editedSinceReview ? '수정 중' : '저장됨';
  const isLatestLocked = latestChapter?.locked === true;
  const actionLabels = getCreativeActionLabels(blueprint.medium);
  const mainActionLabel = !latestChapter
    ? actionLabels.draft
    : isLatestLocked
      ? actionLabels.nextDraft
      : actionLabels.review;
  const mainActionRun = !latestChapter || isLatestLocked ? produceEpisode : reviewDraft;
  const MainActionIcon = !latestChapter || isLatestLocked ? WandSparkles : ClipboardCheck;
  const draftPromptPlaceholder = isLatestLocked
    ? `잠긴 ${blueprint.medium === 'essay' ? '글' : '회차'} 다음에 담을 내용을 적어주세요.`
    : '예: 용사랑 외계인이 싸우는 장면으로 시작한다.';
  const commandItems = useMemo<DeskCommand[]>(
    () => [
      {
        id: 'draft-main-action',
        label: mainActionLabel,
        section: '원고',
        description: isLatestLocked
          ? '잠긴 회차는 그대로 두고 다음 회차를 새로 만듭니다.'
          : latestChapter
            ? '현재 원고를 작가진이 다시 검토합니다.'
            : '입력한 주요 내용으로 첫 회차 초안을 만듭니다.',
        shortcut: isLatestLocked ? 'NextEp' : latestChapter ? 'Review' : 'Draft',
        run: mainActionRun
      },
      {
        id: 'open-draft',
        label: '원고 편집 열기',
        section: '이동',
        description: '중앙 작업장을 원고 편집 화면으로 전환합니다.',
        run: () => {
          setActiveTrack('draft');
          setIsPublishingMode(false);
          setIsMediaPanelOpen(false);
        }
      },
      {
        id: 'open-bible',
        label: '작품 바이블 열기',
        section: '이동',
        description: '캐릭터, 세계관, 캐논, 문체를 편집하는 작업장으로 이동합니다.',
        run: () => {
          setActiveTrack('bible');
          setActiveBibleSection('overview');
          setIsPublishingMode(false);
          setIsMediaPanelOpen(false);
        }
      },
      {
        id: 'open-approval',
        label: '승인 대기 열기',
        section: '메모리',
        description: `${approvalQueue.summary.total}개 기억 후보를 확인하고 canon 반영 여부를 결정합니다.`,
        run: () => {
          setActiveTrack('bible');
          setActiveBibleSection('approval');
          setIsPublishingMode(false);
          setIsMediaPanelOpen(false);
        }
      },
      {
        id: 'request-bible-review',
        label: '바이블 변경 검토',
        section: '메모리',
        description: '변경 로그와 승인 대기 후보를 기준으로 조수진 검토를 실행합니다.',
        run: requestBibleReview
      },
      {
        id: 'open-publishing',
        label: '출간 준비 열기',
        section: '출간',
        description: '릴리즈 게이트와 출간 스냅샷 잠금 상태를 확인합니다.',
        run: () => {
          setIsPublishingMode(true);
          setIsMediaPanelOpen(false);
        }
      },
      {
        id: 'open-media-change',
        label: '매체 변경',
        section: '설정',
        description: `${blueprint.mediumLabel} · ${blueprint.formatLabel}에서 다른 형식으로 전환합니다.`,
        run: () => setIsMediaPanelOpen(true)
      },
      {
        id: 'toggle-focus',
        label: '집중 모드 토글',
        section: '보기',
        description: isFocusMode ? '좌우 레일을 다시 표시합니다.' : '좌우 레일을 숨기고 원고 영역을 넓힙니다.',
        shortcut: '⌘.',
        run: () => setIsFocusMode((current) => !current)
      },
      {
        id: 'release-lock-check',
        label: publishingPlan.releaseLock.canLock ? '출간 스냅샷 잠금 가능' : '출간 게이트 확인',
        section: '출간',
        description: publishingPlan.releaseLock.notice,
        disabled: false,
        run: () => {
          setIsPublishingMode(true);
          setIsMediaPanelOpen(false);
        }
      },
      {
        id: 'open-version-log',
        label: '변경 로그 보기',
        section: '제품',
        description: `${STORYX_VERSION.label} · ${STORYX_VERSION.summary}`,
        run: () => setIsVersionLogOpen(true)
      },
      {
        id: 'reset-project',
        label: '로컬 샘플 초기화',
        section: '관리',
        description: '현재 로컬 프로젝트를 초기 샘플 상태로 되돌립니다.',
        run: resetProject
      }
    ],
    [
      approvalQueue.summary.total,
      blueprint.formatLabel,
      blueprint.mediumLabel,
      canonChanges,
      canonRefactorPlan.summary,
      draftPrompt,
      editorText,
      isFocusMode,
      latestChapter,
      publishingPlan.releaseLock.canLock,
      publishingPlan.releaseLock.notice,
      project,
      request,
      reviewScale
    ]
  );
  const filteredCommandItems = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return commandItems;
    }

    return commandItems.filter((command) =>
      [command.label, command.section, command.description].join(' ').toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [commandItems, commandQuery]);

  useEffect(() => {
    saveProject(project);
  }, [project]);

  useEffect(() => {
    function handleGlobalShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandQuery('');
        setIsCommandPaletteOpen((current) => !current);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault();
        setIsFocusMode((current) => !current);
        return;
      }

      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsMediaPanelOpen(false);
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut);

    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, []);

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

  function logCanonChange(input: CanonChangeEntryInput) {
    if (input.before === input.after) {
      return;
    }

    setCanonChanges((current) => {
      const existing = current.find(
        (change) =>
          change.kind === input.kind &&
          change.targetLabel === input.targetLabel &&
          change.fieldLabel === input.fieldLabel &&
          change.origin === input.origin
      );
      const entry = createCanonChangeEntry({
        ...input,
        before: existing?.before ?? input.before
      });

      return [
        entry,
        ...current.filter(
          (change) =>
            !(
              change.kind === input.kind &&
              change.targetLabel === input.targetLabel &&
              change.fieldLabel === input.fieldLabel &&
              change.origin === input.origin
            )
        )
      ].slice(0, 12);
    });
  }

  function updateProject(field: 'title' | 'logline' | 'audiencePromise' | 'tone', value: string) {
    const labels = {
      title: '작품 제목',
      logline: '로그라인',
      audiencePromise: '독자 약속',
      tone: '문체 톤'
    };

    logCanonChange({
      kind: field === 'tone' ? 'voice' : 'story-core',
      targetLabel: project.title,
      fieldLabel: labels[field],
      before: project[field],
      after: value,
      origin: 'manual-bible-edit'
    });
    setProject((current) => ({ ...current, [field]: value }));
  }

  function updateCharacterMemory(characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) {
    const character = project.characters.find((item) => item.id === characterId);
    const labels = {
      desire: '욕망',
      wound: '상처',
      currentState: '현재 상태'
    };

    if (character) {
      logCanonChange({
        kind: 'character',
        targetLabel: character.name,
        fieldLabel: labels[field],
        before: character[field],
        after: value,
        origin: 'manual-bible-edit'
      });
    }

    setProject((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === characterId ? { ...character, [field]: value } : character
      )
    }));
  }

  function updateWorldMemory(ruleId: string, value: string) {
    const rule = project.worldRules.find((item) => item.id === ruleId);

    if (rule) {
      logCanonChange({
        kind: 'world',
        targetLabel: rule.title,
        fieldLabel: '규칙과 비용',
        before: rule.rule,
        after: value,
        origin: 'manual-bible-edit'
      });
    }

    setProject((current) => ({
      ...current,
      worldRules: current.worldRules.map((rule) => (rule.id === ruleId ? { ...rule, rule: value } : rule))
    }));
  }

  function updateCanonMemory(canonId: string, value: string) {
    const fact = project.canonFacts.find((item) => item.id === canonId);

    if (fact) {
      logCanonChange({
        kind: 'canon',
        targetLabel: `EP ${fact.episode} · ${fact.owner}`,
        fieldLabel: '승인된 사실',
        before: fact.statement,
        after: value,
        origin: 'manual-bible-edit'
      });
    }

    setProject((current) => ({
      ...current,
      canonFacts: current.canonFacts.map((fact) => (fact.id === canonId ? { ...fact, statement: value } : fact))
    }));
  }

  function setApprovalDecision(candidateId: string, decision: ApprovalDecision) {
    setApprovalDecisions((current) => ({ ...current, [candidateId]: decision }));
  }

  function updateApprovalStatement(candidateId: string, value: string) {
    setApprovalStatementOverrides((current) => ({ ...current, [candidateId]: value }));
  }

  // 승인된 AI 검토 후보를 실제 작품 캐논으로 반영한다 — 생성-검토-승인 루프를 닫는 지점
  function syncApprovedMemory() {
    const syncable = approvalQueue.items.filter((item) => item.source === 'ai-review' && item.canSync);
    if (syncable.length === 0) {
      return;
    }

    const approved = syncable.map((item) => ({
      id: item.id,
      owner: item.owner,
      statement: item.editableStatement
    }));

    setProject((current) => {
      const updated = applyApprovedMemory(current, approved);
      saveProject(updated);
      return updated;
    });
    setSyncedCandidateIds((current) => [...current, ...syncable.map((item) => item.id)]);
  }

  function applyProductionResult(result: ProductionResult) {
    setProject(result.updatedProject);
    setAgentRuns(result.agentRuns);
    setLatestChapter(result.chapter);
    setActiveTrack('draft');
    setIsPublishingMode(false);
  }

  // LLM 브리지(claude 구독) 우선, 실패하면 deterministic 생성으로 폴백한다
  async function produceEpisode() {
    if (isGenerating || isReviewing) {
      return;
    }

    const effectiveRequest: ProductionRequest = {
      ...request,
      intent: draftPrompt || request.intent
    };

    setIsGenerating(true);
    setGenerationNote(null);

    try {
      const llm = await requestLlmDraft({
        medium: blueprint.medium,
        format: blueprint.format,
        freewrite: draftPrompt || request.intent,
        title: project.title,
        context: buildProjectContextDigest(project)
      });

      if (llm.ok && llm.payload) {
        applyProductionResult(chapterFromDraftPayload(project, llm.payload, effectiveRequest));
        setGenerationNote('Claude 구독으로 생성한 초안입니다.');
        return;
      }

      applyProductionResult(produceNextChapter(project, effectiveRequest));
      setGenerationNote(
        llm.reason
          ? `LLM 브리지를 쓰지 못해 기본 생성으로 대체했습니다. (${llm.reason})`
          : '기본 생성으로 초안을 만들었습니다.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function applyReviewResult(result: AiCliReviewResult) {
    setAgentRuns(agentReportsToRuns(result));
    setLatestReviewResult(result);
    setEditedSinceReview(false);
  }

  // LLM 브리지(claude 구독)로 작가진 검토 실행, 실패 시 mock 검토로 폴백한다
  async function runAiReview(reviewTarget: string) {
    if (isReviewing || isGenerating) {
      return;
    }

    setIsReviewing(true);
    setGenerationNote(null);

    try {
      const llm = await requestLlmReview({ scale: reviewScale, target: reviewTarget }, project.title);

      if (llm.ok && llm.result) {
        applyReviewResult(llm.result);
        setGenerationNote('Claude 구독으로 작가진이 검토했습니다.');
        return;
      }

      applyReviewResult(
        buildMockAiCliReviewResult({ provider: 'mock', mode: 'review', scale: reviewScale, project }, reviewTarget)
      );
      setGenerationNote(
        llm.reason
          ? `검토 브리지를 쓰지 못해 기본 검토로 대체했습니다. (${llm.reason})`
          : '기본 검토를 실행했습니다.'
      );
    } finally {
      setIsReviewing(false);
    }
  }

  function reviewDraft() {
    runAiReview(editorText.trim() || draftPrompt.trim() || project.logline);
  }

  function requestBibleReview() {
    const changeLog =
      canonChanges.length > 0
        ? canonChanges
            .map((change) => `${change.kind} · ${change.targetLabel} · ${change.fieldLabel}: ${change.before} -> ${change.after}`)
            .join('\n')
        : '아직 수동 변경 로그는 없지만, 현재 바이블 기준으로 승인 대기 후보와 캐논 상태를 검토합니다.';

    runAiReview([project.logline, canonRefactorPlan.summary, changeLog].join('\n\n'));
    setActiveTrack('bible');
    setIsPublishingMode(false);
    setActiveBibleSection('approval');
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
    setApprovalStatementOverrides({});
    setSyncedCandidateIds([]);
    setLatestReviewResult(null);
    setIsMediaPanelOpen(false);
    setIsPublishingMode(false);
    setCanonChanges([]);
  }

  return (
    <main className={`sx-desk sx-genre-${request.genre} ${isFocusMode ? 'is-focus-mode' : ''}`}>
      <header className="sx-topbar sx-app-shell-topbar">
        <div className="sx-brand">
          <span className="sx-brand-mark">
            <Sparkles size={17} />
          </span>
          <nav className="sx-app-breadcrumb" aria-label="현재 위치">
            <span>Story X</span>
            <ChevronRight size={13} />
            <strong>{project.title}</strong>
            <ChevronRight size={13} />
            <span>{activeModeLabel}</span>
            {!isPublishingMode && <em>{chapterCrumb}</em>}
          </nav>
        </div>
        <nav className="sx-track-tabs" aria-label="작업 트랙">
          <button
            type="button"
            className={activeTrack === 'draft' && !isPublishingMode ? 'is-active' : ''}
            onClick={() => {
              setActiveTrack('draft');
              setIsPublishingMode(false);
              setIsMediaPanelOpen(false);
            }}
          >
            <PenLine size={16} />
            편집
          </button>
          <button
            type="button"
            className={activeTrack === 'bible' && !isPublishingMode ? 'is-active' : ''}
            onClick={() => {
              setActiveTrack('bible');
              setIsPublishingMode(false);
              setIsMediaPanelOpen(false);
            }}
          >
            <Database size={16} />
            바이블
            {bibleAlertCount > 0 && <span className="sx-bible-alert-badge">{bibleAlertCount}</span>}
          </button>
        </nav>
        <div className="sx-topbar-actions">
          {onOpenProjects && (
            <div className="sx-app-nav-links" aria-label="앱 이동">
              <button type="button" aria-label="프로젝트로 이동" onClick={onOpenProjects}>
                <Home size={14} />
              </button>
            </div>
          )}
          <button type="button" className="sx-command-k" aria-label="명령 팔레트 열기" onClick={() => setIsCommandPaletteOpen(true)}>
            ⌘K
          </button>
          <span className="sx-save-chip" data-state={editedSinceReview ? 'dirty' : 'synced'}>
            <Save size={14} />
            {saveLabel}
          </span>
          <span className="sx-user-avatar" aria-label="사용자 프로필">
            TX
          </span>
          <button
            type="button"
            className="sx-publish-button"
            data-active={isPublishingMode ? 'true' : 'false'}
            onClick={() => {
              setIsPublishingMode(true);
              setIsMediaPanelOpen(false);
            }}
          >
            <FileText size={16} />
            출간
          </button>
          <button
            type="button"
            className="sx-media-change-button"
            aria-expanded={isMediaPanelOpen}
            aria-label={`매체 변경 — 현재 ${blueprint.mediumLabel} ${blueprint.formatLabel}`}
            onClick={() => setIsMediaPanelOpen((current) => !current)}
          >
            <Layers size={16} />
            <span>매체</span>
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

      {isCommandPaletteOpen && (
        <CommandPalette
          query={commandQuery}
          commands={filteredCommandItems}
          onQueryChange={setCommandQuery}
          onClose={() => setIsCommandPaletteOpen(false)}
          onRunCommand={(command) => {
            command.run();
            setIsCommandPaletteOpen(false);
            setCommandQuery('');
          }}
        />
      )}

      <section className="sx-desk-grid">
        <aside className="sx-project-rail" aria-label="프로젝트 대시보드">
          <ProjectStateCard
            project={project}
            canonHealth={canonHealth}
            pendingApprovals={approvalQueue.items.filter((item) => item.status !== 'approved').length}
            onJumpToBible={(section) => {
              setActiveTrack('bible');
              setActiveBibleSection(section);
              setIsPublishingMode(false);
              setIsMediaPanelOpen(false);
            }}
          />

          {isPublishingMode ? (
            <PublishingIndexCard plan={publishingPlan} />
          ) : activeTrack === 'draft' ? (
            <ChapterTreeCard
              project={project}
              selectedChapterId={latestChapter?.id ?? null}
              onSelectChapter={setLatestChapter}
            />
          ) : (
            <BibleIndexCard
              project={project}
              bank={memoryBank}
              approvalQueue={approvalQueue}
              activeSection={activeBibleSection}
              onSelectSection={setActiveBibleSection}
            />
          )}
        </aside>

        <section
          className={`sx-workbench ${isPublishingMode ? 'is-publishing' : activeTrack === 'bible' ? 'is-bible' : 'is-draft'}`}
          aria-label="Story X 작업대"
        >
          {isPublishingMode ? (
            <PublishingStudio
              project={project}
              blueprint={blueprint}
              plan={publishingPlan}
              onBackToEditor={() => setIsPublishingMode(false)}
              onOpenBible={() => {
                setIsPublishingMode(false);
                setActiveTrack('bible');
                setActiveBibleSection('approval');
              }}
              onReviewDraft={reviewDraft}
              onConfirmChapterLock={(chapterId) => {
                setProject((current) => {
                  const locked = lockChapter(current, chapterId);
                  saveProject(locked);
                  return locked;
                });
              }}
            />
          ) : activeTrack === 'draft' ? (
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
                  <label className="sx-draft-prompt-field">
                    <span className="sx-eyebrow">
                      {latestChapter ? '다음 회차에 담을 주요 내용' : '이번 회차에 담을 주요 내용'}
                    </span>
                    <textarea
                      name="draft-prompt"
                      value={draftPrompt}
                      onChange={(event) => updateDraftPrompt(event.target.value)}
                      placeholder={draftPromptPlaceholder}
                      rows={3}
                    />
                  </label>
                  {isLatestLocked && latestChapter && (
                    <p className="sx-lock-chip">
                      <Lock size={12} aria-hidden="true" />
                      <span>
                        {latestChapter.episode}화는 출간 확정됨. 수정 대신 다음 회차로 진행합니다.
                      </span>
                    </p>
                  )}
                  {generationNote && (
                    <p className="sx-generation-note" role="status">
                      {generationNote}
                    </p>
                  )}
                  {(editorText || latestChapter) && (
                    <p className={`sx-style-chip is-${styleReport.level}`} role="status">
                      문체 {describeKoreanStyleLevel(styleReport.level)} · {styleReport.score}점
                      {styleReport.issues.length > 0 &&
                        ` · ${styleReport.issues[0].label} ${styleReport.issues[0].count}`}
                    </p>
                  )}
                </div>
                <div className="sx-editor-titlebar-actions">
                  <span>{blueprint.projectRoomTitle}</span>
                  <button
                    type="button"
                    className="sx-primary-button"
                    onClick={mainActionRun}
                    disabled={isGenerating || isReviewing}
                  >
                    <MainActionIcon size={isLatestLocked || !latestChapter ? 17 : 16} />
                    {isGenerating ? '생성 중…' : isReviewing ? '검토 중…' : mainActionLabel}
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
                verticalSlice={verticalSlice}
                editableText={editorText}
                editedSinceReview={editedSinceReview}
                isFocusMode={isFocusMode}
                onEditableTextChange={updateEditorText}
                onReviewDraft={reviewDraft}
                onOpenApprovalQueue={() => {
                  setActiveTrack('bible');
                  setIsPublishingMode(false);
                  setIsMediaPanelOpen(false);
                  setActiveBibleSection('approval');
                }}
                onToggleFocusMode={() => setIsFocusMode((current) => !current)}
              />
            </>
          ) : (
            <MemoryBankStudio
              project={project}
              bank={memoryBank}
              activeSection={activeBibleSection}
              onUpdateCharacter={updateCharacterMemory}
              onUpdateWorldRule={updateWorldMemory}
              onUpdateCanon={updateCanonMemory}
              onUpdateProject={updateProject}
              approvalQueue={approvalQueue}
              approvalDecisions={approvalDecisions}
              onSetApprovalDecision={setApprovalDecision}
              onUpdateApprovalStatement={updateApprovalStatement}
              onSyncApprovedMemory={syncApprovedMemory}
              onRequestReview={requestBibleReview}
              canonChanges={canonChanges}
              canonRefactorPlan={canonRefactorPlan}
              onClearCanonChanges={() => setCanonChanges([])}
            />
          )}
        </section>

        <aside className="sx-codex-rail sx-focused-assist-rail" aria-label={isBibleMode ? '조수진과 바이블 검토' : '작가진과 열린 질문'}>
          {isBibleMode ? (
            <BibleAssistantSidebar
              runs={bibleAssistantRuns}
              activeSection={activeBibleSection}
              onSelectAgent={(run, persona) => setSelectedAgent({ run, persona })}
            />
          ) : (
            <>
              <AgentSidebar
                runs={displayedAgentRuns}
                onSelectAgent={(run, persona) => setSelectedAgent({ run, persona })}
              />

              <OpenThreadsCard threads={project.openThreads} />
            </>
          )}
        </aside>
      </section>
      <StoryXStatusBar
        alphaReport={alphaReport}
        project={project}
        editedSinceReview={editedSinceReview}
        version={STORYX_VERSION}
        onOpenVersionLog={() => setIsVersionLogOpen(true)}
      />
      {selectedAgent && (
        <AgentProfileDialog
          run={selectedAgent.run}
          persona={selectedAgent.persona}
          projectTitle={project.title}
          onClose={() => setSelectedAgent(null)}
        />
      )}
      {isVersionLogOpen && (
        <VersionLogDialog
          version={STORYX_VERSION}
          entries={storyxVersionLog}
          onClose={() => setIsVersionLogOpen(false)}
        />
      )}
    </main>
  );
}

function CommandPalette({
  query,
  commands,
  onQueryChange,
  onClose,
  onRunCommand
}: {
  query: string;
  commands: DeskCommand[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onRunCommand: (command: DeskCommand) => void;
}) {
  const firstRunnableCommand = commands.find((command) => !command.disabled);

  function submitFirstCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (firstRunnableCommand) {
      onRunCommand(firstRunnableCommand);
    }
  }

  return (
    <div className="sx-command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="sx-command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="명령 팔레트"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="sx-eyebrow">Command Center</span>
            <h2>무엇을 할까요?</h2>
          </div>
          <button type="button" aria-label="명령 팔레트 닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submitFirstCommand}>
          <label>
            <span>명령 또는 화면 검색</span>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="예: 승인 대기, 출간, 집중 모드"
              autoFocus
            />
          </label>
        </form>
        <div className="sx-command-list" role="listbox" aria-label="실행 가능한 명령">
          {commands.length === 0 ? (
            <p>검색 결과가 없습니다.</p>
          ) : (
            commands.map((command) => (
              <button
                key={command.id}
                type="button"
                disabled={command.disabled}
                onClick={() => onRunCommand(command)}
                role="option"
              >
                <span>{command.section}</span>
                <strong>{command.label}</strong>
                <small>{command.description}</small>
                {command.shortcut && <em>{command.shortcut}</em>}
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function VersionLogDialog({
  version,
  entries,
  onClose
}: {
  version: StoryXVersionInfo;
  entries: StoryXVersionLogEntry[];
  onClose: () => void;
}) {
  return (
    <div className="sx-version-log-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="sx-version-log-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Story X 변경 로그"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="sx-eyebrow">Story X Version Log</p>
            <h2>{version.label}</h2>
            <span>
              {version.codename} · {version.testProof} · commit {version.latestCommit}
            </span>
          </div>
          <button type="button" aria-label="변경 로그 닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <p>{version.summary}</p>
        <div className="sx-version-log-list">
          {entries.map((entry) => (
            <article key={entry.version}>
              <span>{entry.label}</span>
              <h3>{entry.title}</h3>
              <small>
                {entry.date} · commit {entry.commit}
              </small>
              <ul>
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
              <em>Next: {entry.next}</em>
            </article>
          ))}
        </div>
      </section>
    </div>
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
              className={`${chapter.id === selectedChapterId ? 'is-selected' : ''}${chapter.locked ? ' is-locked' : ''}`}
              aria-label={chapter.locked ? `${chapter.episode}화 ${chapter.title} (출간 확정, 잠김)` : `${chapter.episode}화 ${chapter.title}`}
              onClick={() => onSelectChapter(chapter)}
            >
              <span>
                {chapter.episode}화
                {chapter.locked && <Lock size={11} aria-hidden="true" />}
              </span>
              <strong>{chapter.title}</strong>
              <small>{chapter.hook}</small>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function BibleIndexCard({
  project,
  bank,
  approvalQueue,
  activeSection,
  onSelectSection
}: {
  project: SeriesProject;
  bank: StoryMemoryBank;
  approvalQueue: MemoryApprovalQueue;
  activeSection: BibleSection;
  onSelectSection: (section: BibleSection) => void;
}) {
  const sectionCounts: Record<BibleSection, string> = {
    overview: `${bank.syncableFiles.length}개 동기화 기억`,
    characters: `${project.characters.length}명 · 욕망/상처/현재 상태`,
    world: `${project.worldRules.length}개 규칙 · 비용/예외/장소`,
    canon: `${project.canonFacts.length}개 사실 · ${project.chapters.length}개 회차`,
    voice: `${project.characters.flatMap((character) => character.voiceRules).length}개 말투 규칙`,
    approval: `${approvalQueue.summary.total}개 후보 · ${approvalQueue.summary.canSync}개 동기화 가능`
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

function PublishingIndexCard({ plan }: { plan: PublishingPlan }) {
  return (
    <section className="sx-panel sx-publishing-index-card" aria-label="출간 준비 목차">
      <div className="sx-panel-heading">
        <FileText size={16} />
        <h2>출간 준비</h2>
      </div>
      <strong>{plan.title}</strong>
      <p>{plan.releaseNotice}</p>
      <div>
        {plan.snapshotItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <small>출간 후 수정은 변경 로그 검토를 거쳐 다음 전개와 캐논에 반영합니다.</small>
    </section>
  );
}

function PublishingStudio({
  project,
  blueprint,
  plan,
  onBackToEditor,
  onOpenBible,
  onReviewDraft,
  onConfirmChapterLock
}: {
  project: SeriesProject;
  blueprint: CreativeBlueprint;
  plan: PublishingPlan;
  onBackToEditor: () => void;
  onOpenBible: () => void;
  onReviewDraft: () => void;
  onConfirmChapterLock: (chapterId: string) => void;
}) {
  const latestChapter = project.chapters[project.chapters.length - 1] ?? null;
  const isLatestLocked = latestChapter?.locked === true;

  return (
    <section className="sx-publishing-studio" aria-label="출간 준비">
      <header className="sx-publishing-hero">
        <div>
          <p className="sx-eyebrow">Publishing Studio</p>
          <h2>출간 준비</h2>
          <p>
            완성 버튼을 누르는 화면이 아니라, 출간본을 잠그고 이후 수정이 작품 전체에 어떤 영향을 주는지
            검토하는 단계입니다.
            {blueprint.medium === 'comics' && ' 만화는 스토리보드 패키지까지 준비하고 완성 이미지 생성은 후속 단계로 둡니다.'}
          </p>
        </div>
        <aside>
          <span>게시 위치</span>
          <strong>{blueprint.mediumLabel} · {blueprint.formatLabel}</strong>
          <small>{latestChapter ? `${latestChapter.episode}화 기준` : '초안 생성 후 출간 스냅샷 생성'}</small>
          {latestChapter && (() => {
            const labels = getCreativeActionLabels(blueprint.medium);
            return (
              <button
                type="button"
                className="sx-primary-button"
                disabled={isLatestLocked}
                aria-label={isLatestLocked ? `${latestChapter.episode}화는 이미 ${labels.lock}됨` : `${latestChapter.episode}화 ${labels.lock}`}
                onClick={() => onConfirmChapterLock(latestChapter.id)}
              >
                <Lock size={15} />
                {isLatestLocked ? labels.lockedChip : `${latestChapter.episode}화 ${labels.lock}`}
              </button>
            );
          })()}
          <button type="button" className="sx-secondary-button" onClick={onBackToEditor}>
            편집으로 돌아가기
          </button>
        </aside>
      </header>

      <div className="sx-publishing-grid">
        <article className="sx-platform-proof-card">
          <span>Platform Proof</span>
          <h3>첫 300자</h3>
          <p>{plan.platformProof}</p>
          <blockquote>{plan.excerpt}</blockquote>
        </article>

        <article className="sx-release-checklist">
          <span>Release Gates</span>
          <h3>출간 전 체크리스트</h3>
          {plan.checklist.map((item) => (
            <div key={item.id} className={`is-${item.status} ${item.id === 'memory-approval' ? 'is-memory-approval' : ''}`}>
              <Check size={15} />
              <strong>{item.label}</strong>
              <span className="sx-release-gate-state">{item.status === 'ready' ? 'ready' : 'review'}</span>
              <small>{item.detail}</small>
            </div>
          ))}
        </article>

        <article>
          <span>Release Snapshot</span>
          <h3>출간 스냅샷</h3>
          <ul>
            {plan.snapshotItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <span>Change Log</span>
          <h3>변경 로그 검토</h3>
          <ul>
            {plan.changeLogReview.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button type="button" className="sx-secondary-button" onClick={onOpenBible}>
            <Database size={15} />
            메모리 승인 큐 확인
          </button>
        </article>

        <article className="is-wide">
          <span>Output Package</span>
          <h3>산출물 패키지</h3>
          <div className="sx-publishing-package-row">
            {plan.packageItems.map((item) => (
              <em key={item}>{item}</em>
            ))}
          </div>
          <p>{plan.releaseNotice}</p>
          <button type="button" className="sx-primary-button" onClick={onReviewDraft}>
            <ClipboardCheck size={16} />
            출간 전 검토 실행
          </button>
        </article>

        <article className={`sx-release-lock-panel is-${plan.releaseLock.canLock ? 'ready' : 'blocked'} is-wide`}>
          <span>Release Lock</span>
          <h3>출간 스냅샷 잠그기</h3>
          <p>{plan.releaseLock.notice}</p>
          {plan.releaseLock.blockerIds.length > 0 && (
            <div>
              {plan.releaseLock.blockerIds.map((id) => (
                <em key={id}>{id}</em>
              ))}
            </div>
          )}
          <button type="button" className="sx-primary-button" disabled={!plan.releaseLock.canLock}>
            <Save size={16} />
            {plan.releaseLock.label}
          </button>
        </article>
      </div>
    </section>
  );
}

function MemoryBankStudio({
  project,
  bank,
  activeSection,
  onUpdateCharacter,
  onUpdateWorldRule,
  onUpdateCanon,
  onUpdateProject,
  approvalQueue,
  approvalDecisions,
  onSetApprovalDecision,
  onUpdateApprovalStatement,
  onSyncApprovedMemory,
  onRequestReview,
  canonChanges,
  canonRefactorPlan,
  onClearCanonChanges
}: {
  project: SeriesProject;
  bank: StoryMemoryBank;
  activeSection: BibleSection;
  onUpdateCharacter: (characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) => void;
  onUpdateWorldRule: (ruleId: string, value: string) => void;
  onUpdateCanon: (canonId: string, value: string) => void;
  onUpdateProject: (field: 'title' | 'logline' | 'audiencePromise' | 'tone', value: string) => void;
  approvalQueue: MemoryApprovalQueue;
  approvalDecisions: Record<string, ApprovalDecision>;
  onSetApprovalDecision: (candidateId: string, decision: ApprovalDecision) => void;
  onUpdateApprovalStatement: (candidateId: string, value: string) => void;
  onSyncApprovedMemory: () => void;
  onRequestReview: () => void;
  canonChanges: CanonChangeEntry[];
  canonRefactorPlan: CanonRefactorPlan;
  onClearCanonChanges: () => void;
}) {
  const sectionState = buildBibleSectionState({
    activeSection,
    project,
    bank,
    approvalQueue,
    canonChanges,
    canonRefactorPlan
  });
  const syncableMemoryCount = approvalQueue.items.filter(
    (item) => item.source === 'ai-review' && item.canSync
  ).length;

  return (
    <section className="sx-bible-studio" aria-label="작품 바이블">
      <header className="sx-bible-hero">
        <div>
          <p className="sx-eyebrow">작품 바이블</p>
          <h2>{project.title}</h2>
          <p>
            캐릭터와 배경은 생성 폼이 아니라 계속 자라는 기억 카드입니다. 여기서 직접 고친 내용만 다음 원고와
            에이전트 검토의 기준이 됩니다.
          </p>
        </div>
      </header>

      <div className={`sx-bible-workbench is-${activeSection}`}>
        <BibleWorkbenchHeader sectionState={sectionState} onRequestReview={onRequestReview} />

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
          <>
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
            <CanonRefactorPanel
              changes={canonChanges}
              plan={canonRefactorPlan}
              onClearChanges={onClearCanonChanges}
            />
          </>
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
            <h3>메모리 승인 큐</h3>
            <p>회차에서 생긴 캐논 후보와 AI 검토 memoryCandidates를 한곳에서 편집한 뒤 승인/수정/보류합니다.</p>
            <div className="sx-approval-summary" aria-label="메모리 승인 요약">
              <strong>{approvalQueue.summary.total}</strong>
              <span>전체 후보</span>
              <strong>{approvalQueue.summary.approved}</strong>
              <span>승인됨</span>
              <strong>{approvalQueue.summary.canSync}</strong>
              <span>동기화 가능</span>
            </div>
            <div className="sx-approval-sync">
              <button
                type="button"
                className="sx-primary-button"
                onClick={onSyncApprovedMemory}
                disabled={syncableMemoryCount === 0}
              >
                승인한 AI 검토 후보 {syncableMemoryCount > 0 ? `${syncableMemoryCount}개 ` : ''}작품 캐논에 반영
              </button>
              <small>
                반영하면 승인한 후보가 작품 캐논에 추가되고, 다음 회차 생성이 이 사실을 지킵니다. 반영 후 목록에서
                사라집니다.
              </small>
            </div>
          {approvalQueue.items.length > 0 ? (
            <div className="sx-approval-list">
              {approvalQueue.items.map((item) => {
                const decision = approvalDecisions[item.id];

                return (
                  <article key={item.id} className={decision ? `is-${decision}` : undefined}>
                    <span>
                      <b className="sx-approval-source-pill">{item.source === 'ai-review' ? 'AI 검토' : '회차 캐논'}</b>
                      {item.owner} · {item.status}
                    </span>
                    <label>
                      <small>승인 전 편집</small>
                      <textarea
                        value={item.editableStatement}
                        onChange={(event) => onUpdateApprovalStatement(item.id, event.target.value)}
                        rows={3}
                      />
                    </label>
                    <p>{item.rationale}</p>
                    <small>{item.targetPath}</small>
                    <div className="sx-approval-impact-tags" aria-label="영향 범위">
                      {item.impactAreas.map((area) => (
                        <em key={`${item.id}-${area}`}>{area}</em>
                      ))}
                    </div>
                    {decision && <strong className="sx-approval-status">{approvalDecisionLabels[decision]}</strong>}
                    <div>
                      <button type="button" onClick={() => onSetApprovalDecision(item.id, 'approved')}>
                        승인
                      </button>
                      <button type="button" onClick={() => onSetApprovalDecision(item.id, 'revision')}>
                        수정 요청
                      </button>
                      <button type="button" onClick={() => onSetApprovalDecision(item.id, 'hold')}>
                        보류
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>아직 승인 대기 후보가 없습니다. 초안 생성 또는 검토를 실행하면 이곳에 후보가 쌓입니다.</p>
          )}
          </article>
          <article className="sx-bible-card is-wide">
            <span>Impact Preview</span>
            <h3>영향 범위</h3>
            <p>승인된 항목만 다음 동기화 후보가 됩니다. 수정 요청과 보류는 원문을 덮어쓰지 않고 검토 기록으로 남깁니다.</p>
            <div className="sx-bible-memory-tags">
              <em>characters</em>
              <em>world</em>
              <em>canon</em>
              <em>voice</em>
              <em>visual</em>
              <em>audio</em>
            </div>
          </article>
        </div>
        )}
      </div>
    </section>
  );
}

function BibleWorkbenchHeader({
  sectionState,
  onRequestReview
}: {
  sectionState: BibleSectionState;
  onRequestReview: () => void;
}) {
  return (
    <header className="sx-bible-workbench-header" aria-label={`${sectionState.label} 작업 기준`}>
      <div>
        <p className="sx-eyebrow">Bible Workbench</p>
        <h3>{sectionState.label}</h3>
        <p>{sectionState.directive}</p>
        <button type="button" className="sx-bible-review-request" onClick={onRequestReview}>
          <ClipboardCheck size={16} />
          변경 검토 요청
        </button>
      </div>
      <div className="sx-bible-impact-strip" aria-label="바이블 작업 영향 요약">
        <article>
          <span>작업 기준</span>
          <strong>{sectionState.primaryMetric}</strong>
          <small>{sectionState.summary}</small>
        </article>
        <article>
          <span>변경 영향</span>
          <strong>{sectionState.impactLabel}</strong>
          <small>{sectionState.impactScope}</small>
        </article>
        <article>
          <span>동기화 대상</span>
          <div>
            {sectionState.syncTargets.map((target) => (
              <em key={`${sectionState.id}-${target}`}>{target}</em>
            ))}
          </div>
        </article>
      </div>
      <aside className="sx-bible-review-route" aria-label="검토 순서">
        <span>검토 순서</span>
        {sectionState.reviewAgents.map((agent, index) => (
          <p key={`${sectionState.id}-${agent.label}-${index}`}>
            <strong>{String(index + 1).padStart(2, '0')} · {agent.label}</strong>
            <small>{agent.focus}</small>
          </p>
        ))}
      </aside>
    </header>
  );
}

function CanonRefactorPanel({
  changes,
  plan,
  onClearChanges
}: {
  changes: CanonChangeEntry[];
  plan: CanonRefactorPlan;
  onClearChanges: () => void;
}) {
  return (
    <section className={`sx-canon-refactor-panel is-${plan.status}`} aria-label="캐논 리팩터">
      <header>
        <div>
          <p className="sx-eyebrow">Canon Refactor</p>
          <h3>캐논 리팩터</h3>
          <p>{plan.summary}</p>
        </div>
        <button type="button" className="sx-secondary-button" onClick={onClearChanges} disabled={changes.length === 0}>
          변경 로그 비우기
        </button>
      </header>

      <div className="sx-canon-refactor-grid">
        <article className="sx-change-log-list">
          <span>변경 로그</span>
          {changes.length === 0 ? (
            <p>캐릭터, 세계관, 캐논을 직접 수정하면 이곳에 최신 변경이 쌓입니다.</p>
          ) : (
            changes.map((change) => (
              <div key={change.id}>
                <strong>{change.targetLabel}</strong>
                <small>{change.kind} · {change.fieldLabel}</small>
                <p>{change.after || '비어 있음'}</p>
              </div>
            ))
          )}
        </article>

        <article>
          <span>영향 회차</span>
          {plan.affectedChapters.length === 0 ? (
            <p>아직 영향 받을 회차가 없습니다.</p>
          ) : (
            plan.affectedChapters.map((chapter) => (
              <div key={chapter.id} className="sx-refactor-impact-row">
                <strong>{chapter.episode}화 · {chapter.title}</strong>
                <small>{chapter.reason}</small>
              </div>
            ))
          )}
        </article>

        <article className="sx-refactor-review-order">
          <span>에이전트 검토 순서</span>
          {plan.reviewOrder.length === 0 ? (
            <p>대기 중인 검토가 없습니다.</p>
          ) : (
            plan.reviewOrder.map((step, index) => (
              <div key={step.agentId}>
                <strong>{String(index + 1).padStart(2, '0')} · {step.label}</strong>
                <small>{step.focus}</small>
              </div>
            ))
          )}
        </article>

        <article>
          <span>전개 조언</span>
          <ul>
            {plan.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
          {plan.conflictWarnings.length > 0 && (
            <div className="sx-refactor-warning-list">
              {plan.conflictWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
          <small>{plan.releaseAdvice}</small>
        </article>
      </div>
    </section>
  );
}

function ProjectStateCard({
  project,
  canonHealth,
  pendingApprovals,
  onJumpToBible
}: {
  project: SeriesProject;
  canonHealth: number;
  pendingApprovals: number;
  onJumpToBible: (section: BibleSection) => void;
}) {
  const handleJump = (section: BibleSection) => (event: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in event && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onJumpToBible(section);
  };

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
        <div
          role="button"
          tabIndex={0}
          className="sx-project-card-link"
          aria-label="바이블 캐논으로 이동"
          title="캐논 — 작품에서 확정된 사실. 모든 회차가 이 기준을 따릅니다."
          onClick={handleJump('canon')}
          onKeyDown={handleJump('canon')}
        >
          <dt>캐논</dt>
          <dd>{project.canonFacts.length}</dd>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="sx-project-card-link"
          aria-label={
            pendingApprovals > 0
              ? `바이블 승인 대기로 이동, ${pendingApprovals}개 대기`
              : '바이블 승인 대기로 이동'
          }
          onClick={handleJump('approval')}
          onKeyDown={handleJump('approval')}
        >
          <dt>
            질문
            {pendingApprovals > 0 && <span className="sx-pending-dot" aria-hidden="true" />}
          </dt>
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

function AiCliHarnessCard({
  plan,
  result,
  reviewProvider,
  reviewScale,
  onSelectProvider,
  onSelectScale,
  onRunReview,
  onOpenApprovalQueue
}: {
  plan: ReturnType<typeof buildAiCliRunPlan>;
  result: AiCliReviewResult | null;
  reviewProvider: AiCliProvider;
  reviewScale: AiCliScale;
  onSelectProvider: (provider: AiCliProvider) => void;
  onSelectScale: (scale: AiCliScale) => void;
  onRunReview: () => void;
  onOpenApprovalQueue: () => void;
}) {
  const providerOptions: Array<{ id: AiCliProvider; label: string; caption: string }> = [
    { id: 'mock', label: 'Mock', caption: '무료 테스트' },
    { id: 'claude', label: 'Claude', caption: 'CLI 실행' },
    { id: 'codex', label: 'Codex', caption: 'CLI 실행' }
  ];
  const scaleOptions: Array<{ id: AiCliScale; label: string; caption: string }> = [
    { id: 'small', label: 'Small', caption: '3 agents' },
    { id: 'standard', label: 'Standard', caption: '5 agents' },
    { id: 'deep', label: 'Deep', caption: 'visual/audio 포함' }
  ];

  return (
    <section className="sx-panel sx-ai-harness-card" aria-label="AI CLI 하네스">
      <div className="sx-panel-heading">
        <WandSparkles size={16} />
        <h2>AI CLI 하네스</h2>
      </div>
      <p>브라우저에서는 mock으로 안전하게 검토 흐름을 확인하고, CLI에서는 같은 계약으로 Claude/Codex를 실행합니다.</p>
      <div className="sx-provider-row" aria-label="Provider">
        {providerOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            className={reviewProvider === option.id ? 'is-selected' : ''}
            onClick={() => onSelectProvider(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.caption}</span>
          </button>
        ))}
      </div>
      <div className="sx-review-scale-row" aria-label="검토 규모">
        {scaleOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            className={reviewScale === option.id ? 'is-selected' : ''}
            onClick={() => onSelectScale(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.caption}</span>
          </button>
        ))}
      </div>
      <div className="sx-cli-command-preview">
        <span>{plan.provider} · {plan.mode}</span>
        <code>{plan.commandPreview.slice(0, 4).join(' ')}</code>
        <small>{plan.selectedAgentIds.length} agents · approval required before sync</small>
      </div>
      {reviewProvider !== 'mock' && (
        <small className="sx-provider-handoff">
          실제 {reviewProvider} 실행은 터미널에서 `npm run storyx -- review --provider {reviewProvider} --scale {reviewScale}`로 진행합니다.
        </small>
      )}
      <button type="button" className="sx-primary-button" onClick={onRunReview}>
        <ClipboardCheck size={16} />
        {reviewProvider === 'mock' ? '하네스 검토 실행' : 'Mock으로 흐름 검증'}
      </button>
      {result && (
        <div className="sx-review-result-block">
          <strong>{result.summary}</strong>
          <div className="sx-memory-candidate-list" aria-label="memoryCandidates">
            {result.memoryCandidates.map((candidate) => (
              <article key={candidate.id} className={`is-${candidate.status}`}>
                <span>{candidate.owner} · {candidate.status}</span>
                <p>{candidate.statement}</p>
                <small>{candidate.targetPath}</small>
              </article>
            ))}
          </div>
          <ul>
            {result.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <button type="button" className="sx-secondary-button" onClick={onOpenApprovalQueue}>
            <Database size={15} />
            승인 대기함 열기
          </button>
        </div>
      )}
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

function StoryXStatusBar({
  alphaReport: report,
  project,
  editedSinceReview,
  version,
  onOpenVersionLog
}: {
  alphaReport: AlphaReadinessReport;
  project: SeriesProject;
  editedSinceReview: boolean;
  version: StoryXVersionInfo;
  onOpenVersionLog: () => void;
}) {
  const statusLabels: Record<AlphaReadinessReport['status'], string> = {
    ready: '출시 가능',
    'needs-review': '검토 필요',
    blocked: '차단'
  };

  return (
    <footer className={`sx-statusbar is-${report.status}`} aria-label="Story X 상태 표시줄">
      <span className="sx-statusbar-alpha">
        <ClipboardCheck size={16} />
        알파 셀프체크 {report.score}% · {statusLabels[report.status]}
      </span>
      <button type="button" className="sx-statusbar-version" onClick={onOpenVersionLog}>
        {version.label}
      </button>
      <span>{report.nextActions[0]}</span>
      <span>{project.chapters.length} episodes · {project.canonFacts.length} canon</span>
      <span>{editedSinceReview ? '수정 미검토' : 'synced'}</span>
      <span>⌘K 명령 · ⌘. 집중</span>
    </footer>
  );
}

function OpenThreadsCard({ threads }: { threads: string[] }) {
  return (
    <section className="sx-panel sx-open-threads-card" aria-label="열린 질문">
      <div className="sx-panel-heading">
        <ListChecks size={16} />
        <h2>열린 질문</h2>
      </div>
      <ul className="sx-thread-list">
        {threads.map((thread) => (
          <li key={thread}>{thread}</li>
        ))}
      </ul>
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
              className={`sx-agent-card sx-agent-card--${run.status}`}
              aria-label={`${persona.title} ${agentStatusLabel(run.status)} 상태, 자세한 지시사항 열기`}
              onClick={() => onSelectAgent(run, persona)}
            >
              <span
                className="sx-agent-status-cluster"
                role="status"
                aria-label={`상태 ${agentStatusLabel(run.status)}`}
              >
                <span className={`sx-agent-status sx-agent-status--${run.status}`} aria-hidden="true" />
                {(run.status === 'revise' || run.status === 'block') && (
                  <span className={`sx-agent-status-label sx-agent-status-label--${run.status}`}>
                    {agentStatusLabel(run.status)}
                  </span>
                )}
              </span>
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

function BibleAssistantSidebar({
  runs,
  activeSection,
  onSelectAgent
}: {
  runs: AgentRun[];
  activeSection: BibleSection;
  onSelectAgent: (run: AgentRun, persona: AgentPersona) => void;
}) {
  const activeLabel = bibleSections.find((section) => section.id === activeSection)?.label ?? '바이블';

  return (
    <section className="sx-panel sx-agent-sidebar sx-bible-assistant-sidebar" aria-label="AI 조수진">
      <div className="sx-panel-heading">
        <BrainCircuit size={16} />
        <h2>조수진</h2>
      </div>
      <p>{activeLabel} 작업장을 기준으로 필요한 기억, 충돌, 승인 상태만 옆에서 확인합니다.</p>
      <div>
        {runs.map((run) => {
          const persona = getAgentPersona(run);

          return (
            <button
              key={`${run.agentId}-${run.title}`}
              type="button"
              className={`sx-agent-card sx-agent-card--${run.status}`}
              aria-label={`${persona.title} ${agentStatusLabel(run.status)} 상태, 자세한 지시사항 열기`}
              onClick={() => onSelectAgent(run, persona)}
            >
              <span
                className="sx-agent-status-cluster"
                role="status"
                aria-label={`상태 ${agentStatusLabel(run.status)}`}
              >
                <span className={`sx-agent-status sx-agent-status--${run.status}`} aria-hidden="true" />
                {(run.status === 'revise' || run.status === 'block') && (
                  <span className={`sx-agent-status-label sx-agent-status-label--${run.status}`}>
                    {agentStatusLabel(run.status)}
                  </span>
                )}
              </span>
              <AgentPixelPortrait persona={persona} />
              <div>
                <span>{run.title}</span>
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
  verticalSlice,
  editableText,
  editedSinceReview,
  isFocusMode,
  onEditableTextChange,
  onReviewDraft,
  onOpenApprovalQueue,
  onToggleFocusMode
}: {
  blueprint: CreativeBlueprint;
  chapter: Chapter | null;
  project: SeriesProject;
  verticalSlice: OneProjectVerticalSlice;
  editableText: string;
  editedSinceReview: boolean;
  isFocusMode: boolean;
  onEditableTextChange: (value: string) => void;
  onReviewDraft: () => void;
  onOpenApprovalQueue: () => void;
  onToggleFocusMode: () => void;
}) {
  const expandButton = (
    <button type="button" className="sx-expand-editor-button" onClick={onToggleFocusMode}>
      {isFocusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      {isFocusMode ? '축소' : '편집기 확대'}
    </button>
  );
  const verticalSlicePanel = (
    <VerticalSliceProofPanel verticalSlice={verticalSlice} onOpenApprovalQueue={onOpenApprovalQueue} />
  );

  if (blueprint.medium === 'comics') {
    const visualWorkflow = buildComicsVisualWorkflow(blueprint.format);
    const frameLabels =
      blueprint.format === 'insta-toon'
        ? ['01 공감', '02 확장', '03 반전', '04 저장']
        : ['01 도입', '02 장면', '03 전환', '04 클라이맥스', '05 여운', '06 다음 컷'];

    return (
      <section className="sx-creative-stage" aria-label="만화 캔버스">
        <div className="sx-canvas-surface">
          <div className="sx-stage-toolbar">{expandButton}</div>
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
          {verticalSlicePanel}
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
          <div className="sx-stage-toolbar">{expandButton}</div>
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
          {verticalSlicePanel}
        </div>
      </section>
    );
  }

  return (
    <section className="sx-creative-stage" aria-label="글쓰기 원고">
      <div className={`sx-writing-surface ${editedSinceReview ? 'is-edited' : ''}`}>
        <div className="sx-stage-toolbar">{expandButton}</div>
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
              주요 내용을 적고 초안 생성을 누르면, 원고와 후크가 이 영역에 크게 배치됩니다. 열린 질문은
              오른쪽 레일에 남겨 장면을 쓰는 동안 시야를 빼앗지 않게 했습니다.
            </p>
          </article>
        )}
        {verticalSlicePanel}
      </div>
    </section>
  );
}

function VerticalSliceProofPanel({
  verticalSlice,
  onOpenApprovalQueue
}: {
  verticalSlice: OneProjectVerticalSlice;
  onOpenApprovalQueue: () => void;
}) {
  return (
    <section className="sx-vertical-slice-panel" aria-label="웹소설 1화, 인스타툰 4컷, 오디오북 30초 승인 proof">
      <header>
        <div>
          <p className="sx-eyebrow">One Project Vertical Slice</p>
          <h3>하나의 이야기, 세 가지 proof</h3>
          <p>웹소설 1화, 인스타툰 4컷, 오디오북 30초를 같은 Story Contract로 묶어 승인 전 proof로 확인합니다.</p>
        </div>
        <button type="button" className="sx-secondary-button" onClick={onOpenApprovalQueue}>
          <Database size={15} />
          승인 대기함 열기
        </button>
      </header>
      <div className="sx-vertical-slice-artifacts">
        {verticalSlice.artifacts.map((artifact) => (
          <article key={artifact.id} className={`is-${artifact.status}`}>
            <span>{artifact.label}</span>
            <strong>{artifact.status === 'draft-proof' ? 'draft proof' : 'needs review'}</strong>
            <p>{artifact.proof}</p>
          </article>
        ))}
      </div>
      <div className="sx-vertical-slice-ledger" aria-label="승인 증거 장부">
        {verticalSlice.evidenceLedger
          .filter((entry) => entry.requiredApproval)
          .slice(0, 4)
          .map((entry) => (
            <span key={entry.id}>
              <Check size={13} />
              {entry.label}
            </span>
          ))}
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
