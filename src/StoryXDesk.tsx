import {
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  ListChecks,
  Lock,
  Maximize2,
  MessageCircle,
  Minimize2,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldAlert,
  Upload,
  WandSparkles,
  X
} from 'lucide-react';
import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactElement,
  type RefObject
} from 'react';
import { getAgentValidationProcess, type ValidationAgentId } from './lib/agentReviewProcess';
import { fallbackAgentPersona, getAgentPersona, type AgentPersona } from './lib/agentPersonas';
import { defaultRuns, getMediumReviewAgentIds, visualStoryAgentRuns } from './lib/agentSeedData';
import { STUDIO_ACCENT_VALUES, STUDIO_CANVAS_VALUES, type StudioAccent, type StudioCanvas } from './lib/studioConstants';
import storyXSymbol from './assets/brand/story-x-symbol-light.svg';
import { AiStatusBadge } from './components/AiStatusBadge';
import { AgentIntentCard } from './components/AgentIntentCard';
import { AgentProfileDialog } from './components/AgentProfileDialog';
import { AgentRoom } from './components/AgentRoom';
import { BibleAssistantSidebar } from './components/BibleAssistantSidebar';
import { CanonCanvas } from './components/CanonCanvas';
import { CanonCardGrid } from './components/CanonCardGrid';
import { CanonNav } from './components/CanonNav';
import { CharacterDetailPanel } from './components/CharacterDetailPanel';
import { CharacterGraph } from './components/CharacterGraph';
import { CoreStrip } from './components/CoreStrip';
import { DataLeftRail } from './components/DataLeftRail';
import { DataReviewRail } from './components/DataReviewRail';
import { DataPanel } from './components/DataPanel';
import { EvaluatorQualityCard } from './components/EvaluatorQualityCard';
import { MarginColumn } from './components/MarginColumn';
import { MentionBar } from './components/MentionBar';
import { MemoryBankCard } from './components/MemoryBankCard';
import { MemoryBankStudio } from './components/MemoryBankStudio';
import { OpenThreadsCard } from './components/OpenThreadsCard';
import { PixelAvatar } from './components/PixelAvatar';
import { ProjectStateCard } from './components/ProjectStateCard';
import { PublishingIndexCard } from './components/PublishingIndexCard';
import { WorkStateGrid } from './components/WorkStateGrid';
import { FloatingEditor } from './components/FloatingEditor';
import { FloatingDataWorkspace } from './components/FloatingDataWorkspace';
import { FloatingPublishWorkspace } from './components/FloatingPublishWorkspace';
import { CommandPalette, type DeskCommand } from './components/CommandPalette';
import { ProjectHistoryDialog } from './components/ProjectHistoryDialog';
import { VersionLogDialog } from './components/VersionLogDialog';
import { StoryXStatusBar } from './components/StoryXStatusBar';
import { ChapterStructureTree } from './components/ChapterStructureTree';
import { TensionShareChart } from './components/TensionShareChart';
import { useMarginReview } from './hooks/useMarginReview';
import { findPersona } from './lib/extendedPersonas';
import {
  applyDiff,
  resolveRunReviewAnchor,
  splitIntoParagraphs,
  toMarginReview,
  type CanonDelta,
  type InlineDiff,
  type MarginReview,
  type Paragraph
} from './lib/marginReview';
import {
  buildCreativeBlueprint,
  getFormatOptions,
  getMediumOptions,
  getWorkUnitNoun,
  isSerialFormat,
  type CreativeBlueprint,
  type CreativeFormat,
  type CreativeMedium
} from './lib/projectBlueprint';
import {
  applyApprovedMemory,
  buildDeterministicDataReview,
  buildProjectContextDigest,
  buildStoryEditorWorkspace,
  chapterFromDraftPayload,
  createEmptyProject,
  createSeedProject,
  describeCreativeWeight,
  getCanonReviewCategoryLabel,
  getGenreProfiles,
  lockChapter,
  produceNextChapter,
  serializeCanonCategory,
  type AgentRun,
  type Chapter,
  type ChapterBeat,
  type AgentId,
  type CanonReviewCategory,
  type CreativeWeight,
  type DraftChapterPayload,
  type GenreId,
  type ProductionRequest,
  type ProductionResult,
  type SeriesProject
} from './lib/storyEngine';
import { requestLlmDraft } from './lib/draftClient';
import { requestAgentReview } from './lib/reviewClient';
import { computePayoffLedger } from './lib/payoffLedger';
import { buildEpisodeForks, stripConsumedSeeds } from './lib/episodeBriefing';
import { requestDataReview } from './lib/dataReviewClient';
import type { BibleSection, CanonCategory, DataReviewView, DataView } from './lib/canonDataView';
import { describeKoreanStyleLevel, evaluateKoreanProse } from './lib/koreanStyle';
import {
  agentReportsToRuns,
  buildAiCliRunPlan,
  buildMockAiCliReviewResult,
  getAgentLabel,
  getReviewAgentIds,
  type AiCliAgentReport,
  type AiCliMemoryCandidate,
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
import { buildTesterDrivenWorkflow } from './lib/evaluationSynthesis';
import { buildComicsVisualWorkflow } from './lib/visualProduction';
import { getCreativeActionLabels } from './lib/projectBlueprint';
import { buildPublishingPlan, type PublishingPlan } from './lib/publishing';
// M4 UI 통합 1차 컷 — 작가가 스튜디오 안에서 하네스 점수·6 스테이지·readyForProduction 을 본다.
import { runStoryHarness, type StoryHarnessReport } from './lib/storyHarness';
// M8 UI 통합 — Layer 0·4·7 결과를 좌레일에 노출.
import { buildStoryOntology, type StoryOntology } from './lib/storyOntology';
import { projectAllMedia, type MediaProjection } from './lib/mediaProjection';
import { buildProseQualityMetrics, evaluateQualityGates, type QualityGatesReport, type StoryMode } from './lib/qualityGates';
import { extractClaims, findUnsupportedClaims, mapClaimsToEvidence, type Claim } from './lib/claimLedger';
import { auditCitations, type Citation, type Reference } from './lib/citationGate';
import {
  auditCounterArgument,
  auditResearchEthics,
  type CounterArgumentAudit,
  type ResearchEthicsAudit
} from './lib/academicIntegrity';
import { toStudioMetrics } from './lib/studioMetrics';
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
import {
  clearProject,
  clearProjectSnapshots,
  exportAllData,
  importAllData,
  loadProject,
  loadProjectSnapshots,
  pushProjectSnapshot,
  saveProject,
  type ProjectSnapshot
} from './lib/storage';

type DeskTrack = 'draft' | 'bible';
type ApprovalDecision = MemoryApprovalDecision;

const genreProfiles = getGenreProfiles();
const mediumOptions = getMediumOptions();

interface AgentDialogSelection {
  run: AgentRun;
  persona: AgentPersona;
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

function agentReportToRun(report: AiCliAgentReport): AgentRun {
  return {
    agentId: report.agentId,
    title: report.label,
    status: report.status === 'blocked' ? 'block' : report.status,
    output: report.note,
    evidence: report.evidence,
    strengths: report.strengths ?? [],
    issues: report.issues ?? []
  };
}

function fallbackRunForAgent(agentId: string, output: string): AgentRun {
  const process = getAgentValidationProcess(agentId);
  const persona = findPersona(agentId);
  return {
    agentId: agentId as ValidationAgentId,
    title: persona.name || process.label,
    status: 'pass',
    output,
    evidence: process.evidenceTargets.slice(0, 2)
  };
}

function marginReviewToRun(review: MarginReview): AgentRun {
  const persona = findPersona(String(review.persona));
  return {
    agentId: review.persona as ValidationAgentId,
    title: persona.name,
    status: review.severity === 'block' ? 'block' : review.severity === 'suggest' ? 'revise' : 'pass',
    output: review.body || review.head,
    evidence: [review.anchor]
  };
}

function buildAcademicClaimMarginReviews(text: string): MarginReview[] {
  if (!text.trim()) {
    return [];
  }

  const claims = extractClaims(text);
  const ledger = mapClaimsToEvidence(claims, text);
  return findUnsupportedClaims(ledger).map(claimToMarginReview);
}

function claimToMarginReview(claim: Claim): MarginReview {
  return {
    persona: 'critic-reviewer',
    anchor: claim.paragraph,
    severity: 'block',
    head: '근거 없는 주장',
    body: [
      `주장: ${claim.text}`,
      '필요 근거: 데이터(수치·표), 선행연구(APA 인용), 논리(because/mechanism), 사례(for example) 중 하나를 같은 단락이나 인접 단락에 붙이세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function buildAcademicCitationMarginReviews(text: string): MarginReview[] {
  if (!text.trim()) {
    return [];
  }

  const audit = auditCitations(text);
  const reviews: MarginReview[] = [
    ...audit.orphanCitations.map(citationToOrphanMarginReview),
    ...audit.pageMissingQuotes.map(citationToPageMissingMarginReview),
    ...audit.uncitedReferences.map(referenceToUncitedMarginReview)
  ];

  if (audit.missingReferenceSection && audit.citations.length > 0) {
    reviews.unshift(missingReferenceSectionToMarginReview(audit.citations[0]));
  }

  return reviews;
}

function citationToOrphanMarginReview(citation: Citation): MarginReview {
  return {
    persona: 'critic-reviewer',
    anchor: citation.paragraph,
    severity: 'block',
    head: '참고문헌에 없는 인용',
    body: [
      `인용: ${citation.raw}`,
      '문제: 본문 APA 인용과 일치하는 References/Bibliography 항목을 찾지 못했습니다.',
      '조치: 참고문헌을 추가하거나, 본문 인용의 저자·연도를 실제 참고문헌과 맞추세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function citationToPageMissingMarginReview(citation: Citation): MarginReview {
  return {
    persona: 'critic-reviewer',
    anchor: citation.paragraph,
    severity: 'suggest',
    head: '직접 인용에 페이지 누락',
    body: [
      `인용: ${citation.raw}`,
      '문제: 큰따옴표 직접 인용에는 APA 페이지 표기(p. 12 또는 pp. 12-13)가 필요합니다.',
      '조치: 인용 안에 페이지를 넣거나, 직접 인용을 패러프레이즈로 바꾸세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function referenceToUncitedMarginReview(reference: Reference): MarginReview {
  return {
    persona: 'critic-reviewer',
    anchor: reference.paragraph,
    severity: 'note',
    head: '본문에서 쓰이지 않은 참고문헌',
    body: [
      `참고문헌: ${reference.raw}`,
      '문제: References/Bibliography에는 있지만 본문 APA 인용과 연결되지 않았습니다.',
      '조치: 실제로 쓴 문헌이면 본문에 인용하고, 아니면 참고문헌에서 제거하세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function missingReferenceSectionToMarginReview(citation: Citation): MarginReview {
  return {
    persona: 'critic-reviewer',
    anchor: citation.paragraph,
    severity: 'note',
    head: '참고문헌 섹션 없음',
    body: [
      '본문 APA 인용은 감지했지만 References/Bibliography/참고문헌 섹션이 없어 orphan 판정을 보류했습니다.',
      '짧은 초안이면 참고만 하고, 제출 원고라면 참고문헌 섹션을 추가하세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function buildAcademicIntegrityMarginReviews(text: string): MarginReview[] {
  if (!text.trim()) {
    return [];
  }

  const counterAudit = auditCounterArgument(text);
  const ethicsAudit = auditResearchEthics(text);
  const reviews: MarginReview[] = [];

  if (counterAudit.missingCounterArgument) {
    reviews.push(counterArgumentToMarginReview(counterAudit));
  }
  if (ethicsAudit.issues.length > 0) {
    reviews.push(researchEthicsToMarginReview(ethicsAudit));
  }

  return reviews;
}

function counterArgumentToMarginReview(audit: CounterArgumentAudit): MarginReview {
  return {
    persona: 'critic-reviewer',
    anchor: audit.claimParagraphs[0] ?? 'p1',
    severity: 'suggest',
    head: '반론·대안 가설 미처리',
    body: [
      `명시적 학술 주장 ${audit.claimCount}개가 있지만 반론, 대안 가설, limitation 마커가 없습니다.`,
      '조치: however/critics argue/an alternative explanation/limitation 같은 문장으로 가장 강한 반론이나 한계를 직접 다루세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function researchEthicsToMarginReview(audit: ResearchEthicsAudit): MarginReview {
  return {
    persona: 'canon-librarian',
    anchor: audit.subjectParagraphs[0] ?? 'p1',
    severity: 'block',
    head: '연구 윤리 미공개',
    body: [
      '피험자·인터뷰·설문·데이터셋 언급이 있지만 필요한 연구 윤리 공개가 부족합니다.',
      `문제: ${audit.issues.join(' ')}`,
      '조치: 익명화/비식별화, informed consent, IRB/ethics approval, funding/conflict disclosure를 원고 안에 명시하세요.'
    ].join('\n'),
    diffs: [],
    pending: false
  };
}

function textFromEditable(root: HTMLDivElement): string {
  const paragraphs = Array.from(root.querySelectorAll<HTMLElement>('[data-pid]'))
    .map((node) => node.innerText.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs.join('\n\n') : root.innerText.trim();
}

function renderParagraphText(text: string, diffs: InlineDiff[]): Array<string | ReactElement> {
  let segments: Array<string | ReactElement> = [text || '\u00a0'];

  diffs.forEach((diff, diffIndex) => {
    segments = segments.flatMap((segment, segmentIndex) => {
      if (typeof segment !== 'string') {
        return [segment];
      }

      const fromIndex = segment.indexOf(diff.from);
      if (fromIndex >= 0) {
        return [
          segment.slice(0, fromIndex),
          <span className="sx-diff-del" key={`del-${diffIndex}-${segmentIndex}`}>
            {diff.from}
          </span>,
          <span className="sx-diff-add" key={`add-${diffIndex}-${segmentIndex}`}>
            {diff.to}
          </span>,
          segment.slice(fromIndex + diff.from.length)
        ];
      }

      const toIndex = segment.indexOf(diff.to);
      if (toIndex >= 0) {
        return [
          segment.slice(0, toIndex),
          <span className="sx-diff-add" key={`accepted-${diffIndex}-${segmentIndex}`}>
            {diff.to}
          </span>,
          segment.slice(toIndex + diff.to.length)
        ];
      }

      return [segment];
    });
  });

  return segments;
}

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

// 편집기 설정 옵션 — 트윅(강조색) · 캔버스(원고 배경 톤). 사용자가 설정에서 고른다.
interface StoryXDeskProps {
  initialMedium?: CreativeMedium;
  initialFormat?: CreativeFormat;
  initialDraftPayload?: DraftChapterPayload | null;
  onOpenProjects?: () => void;
  onOpenLanding?: () => void;
  /** 출간 버튼을 누르면 4파트 중 마지막 퍼블리시 stage 로 빠진다. */
  onOpenPublish?: () => void;
}

export function StoryXDesk({
  initialMedium = 'novel',
  initialFormat = 'long-novel',
  initialDraftPayload = null,
  onOpenProjects,
  onOpenLanding,
  onOpenPublish
}: StoryXDeskProps) {
  // 기본 회차 의도는 빈 값 — 의도 메모를 비워두면 produceEpisode 가 캐논 digest 만으로 다음 회차를 만든다.
  // 데모 장르 문구를 박으면 사용자가 안 건드릴 때 다음 회차 intent(freewrite)로 새어 오염된다 (P3, #2 로판 2화 "용사와 외계인" 사고).
  const defaultEpisodeIntent = '';
  const [project, setProject] = useState<SeriesProject>(() => loadProject());
  // 매체 영속 — 저장된 프로젝트가 매체를 기억하면 그것이 진실원천. 리로드 후 만화 작품이
  // 소설 작가진으로 검토되던 버그(2026-06-10 #4 라이브)의 수정. 구버전 저장본은 prop 폴백.
  const [medium, setMedium] = useState<CreativeMedium>(project.medium ?? initialMedium);
  const [format, setFormat] = useState<CreativeFormat>(project.format ?? initialFormat);
  const [request, setRequest] = useState<ProductionRequest>({
    genre: project.genre,
    intent: defaultEpisodeIntent,
    pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
  });
  const [draftPrompt, setDraftPrompt] = useState(defaultEpisodeIntent);
  const [editorText, setEditorText] = useState('');
  const [draftFallbackNotice, setDraftFallbackNotice] = useState(false);
  const [editedSinceReview, setEditedSinceReview] = useState(false);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>(defaultRuns);
  const [latestChapter, setLatestChapter] = useState<Chapter | null>(
    project.chapters.length > 0 ? project.chapters[project.chapters.length - 1] : null
  );
  const [activeTrack, setActiveTrack] = useState<DeskTrack>('draft');
  const [isWorkbenchFading, setIsWorkbenchFading] = useState(false);
  const [isIntentOpen, setIsIntentOpen] = useState(true);
  // 데이터 모드 — 가운데 캔버스가 보여줄 것. 기본은 인물 관계도. 바이블 작업장 진입점도 여기로 표현한다.
  const [dataView, setDataView] = useState<DataView>({ kind: 'canon', category: 'characters' });
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
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isMarginDrawerOpen, setIsMarginDrawerOpen] = useState(false);
  const [isBinderDrawerOpen, setIsBinderDrawerOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [isVersionLogOpen, setIsVersionLogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDialogSelection | null>(null);
  const [canonChanges, setCanonChanges] = useState<CanonChangeEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  // Phase 2a — floating 본문 외부 변경(초안 생성·diff 반영·회차 전환) 시드 카운터.
  // 사용자 타이핑(onBodyChange)에서는 절대 올리지 않는다 — 타이핑 중 본문 재시드를 막아 커서 보존.
  const [bodyVersion, setBodyVersion] = useState(0);
  // 데이터 모드 분야별 검토 — 결과는 분야 id로 캐싱하고, 검토 중인 분야는 따로 표시한다.
  const [dataReviewResults, setDataReviewResults] = useState<Partial<Record<CanonCategory, DataReviewView>>>({});
  const [dataReviewingCategory, setDataReviewingCategory] = useState<CanonCategory | null>(null);
  const [generationNote, setGenerationNote] = useState<string | null>(null);
  const [projectSnapshots, setProjectSnapshots] = useState<ProjectSnapshot[]>(() => loadProjectSnapshots());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null);
  // 편집기 설정 — 트윅(강조색) · 캔버스(원고 배경 톤). localStorage 영속.
  const [isStudioSettingsOpen, setIsStudioSettingsOpen] = useState(false);
  const [studioAccent, setStudioAccent] = useState<StudioAccent>(() => {
    if (typeof window === 'undefined') return 'lime';
    try {
      const saved = window.localStorage.getItem('storyx.studio.accent');
      return saved && saved in STUDIO_ACCENT_VALUES ? (saved as StudioAccent) : 'lime';
    } catch {
      return 'lime';
    }
  });
  const [studioCanvas, setStudioCanvas] = useState<StudioCanvas>(() => {
    if (typeof window === 'undefined') return 'pitch';
    try {
      const saved = window.localStorage.getItem('storyx.studio.canvas');
      return saved && saved in STUDIO_CANVAS_VALUES ? (saved as StudioCanvas) : 'pitch';
    } catch {
      return 'pitch';
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('storyx.studio.accent', studioAccent);
    } catch {
      /* silent */
    }
  }, [studioAccent]);
  useEffect(() => {
    try {
      window.localStorage.setItem('storyx.studio.canvas', studioCanvas);
    } catch {
      /* silent */
    }
  }, [studioCanvas]);
  // 프로젝트 데이터 내보내기/가져오기 — 백업·다른 기기 이동·공유에 쓰는 단일 JSON 단위
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleExportProject = () => {
    const payload = exportAllData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyx-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('현재 작품과 스냅샷·환경설정을 모두 덮어씁니다. 진행 전에 먼저 내보내기를 권장합니다. 계속할까요?')) {
      return;
    }
    try {
      const text = await file.text();
      const result = importAllData(text);
      window.alert(result.message);
      if (result.ok) {
        window.location.reload();
      }
    } catch (error) {
      window.alert(error instanceof Error ? `파일 읽기 실패 — ${error.message}` : '파일 읽기 실패.');
    }
  };
  // 편집기 옵션 팝오버 — 바깥 클릭 / Escape 로 닫힌다
  const studioSettingsWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isStudioSettingsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (studioSettingsWrapRef.current && !studioSettingsWrapRef.current.contains(target)) {
        setIsStudioSettingsOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsStudioSettingsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isStudioSettingsOpen]);
  const draftBootRef = useRef(false);
  const manuscriptRef = useRef<HTMLDivElement>(null);

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
  // M4 UI 통합 1차 컷 — project 의 logline/deepQuestion/character 를 storyHarness 입력으로 매핑.
  // 작가가 자기 작품의 6단계 스테이지 점수·readyForProduction 을 한눈에 본다.
  // M8 UI 통합 — StoryMode 슬라이더 state (commercial/literary 가중치). localStorage 영속.
  const [storyMode, setStoryMode] = useState<StoryMode>(() => {
    if (typeof window === 'undefined') return { commercialWeight: 0.5, literaryWeight: 0.5 };
    try {
      const saved = window.localStorage.getItem('storyx.studio.storyMode');
      if (saved) {
        const parsed = JSON.parse(saved) as StoryMode;
        if (
          typeof parsed.commercialWeight === 'number' &&
          typeof parsed.literaryWeight === 'number'
        ) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return { commercialWeight: 0.5, literaryWeight: 0.5 };
  });
  const [studioRailTab, setStudioRailTab] = useState<'structure' | 'metrics'>(() => {
    if (typeof window === 'undefined') return 'structure';
    try {
      return window.localStorage.getItem('storyx.studio.railTab') === 'metrics' ? 'metrics' : 'structure';
    } catch {
      return 'structure';
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('storyx.studio.storyMode', JSON.stringify(storyMode));
    } catch {
      /* silent */
    }
  }, [storyMode]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('storyx.studio.railTab', studioRailTab);
    } catch {
      /* silent */
    }
  }, [studioRailTab]);
  const latestProse = useMemo(
    () => project.chapters[project.chapters.length - 1]?.prose || project.logline || '',
    [project.chapters, project.logline]
  );
  const proseQualityMetrics = useMemo(() => buildProseQualityMetrics(latestProse), [latestProse]);
  // M8.4 — storyOntology useMemo. harnessReport 와 같은 입력 매핑.
  const storyOntology: StoryOntology = useMemo(
    () =>
      buildStoryOntology({
        material: project.logline || '',
        storySeed: project.deepQuestion || project.audiencePromise || '',
        characterSeed: project.characters[0]
          ? `${project.characters[0].name}: ${project.characters[0].desire}`
          : '',
        audience: project.audiencePromise || '',
        constraints: blueprint.formatLabel || '',
        canonFacts: project.canonFacts
      }),
    [
      blueprint.formatLabel,
      project.logline,
      project.deepQuestion,
      project.audiencePromise,
      project.characters,
      project.canonFacts
    ]
  );
  // M8.3 — 5 매체 투영. storyOntology 의존.
  const mediaProjections: MediaProjection[] = useMemo(() => projectAllMedia(storyOntology), [storyOntology]);
  // M8.2 — 12 품질 게이트. project 데이터 + storyMode 가중치.
  const qualityGatesReport: QualityGatesReport = useMemo(
    () =>
      evaluateQualityGates(
        {
          text: latestProse,
          medium: blueprint.medium,
          isSerial: isSerialFormat(blueprint.format),
          pressureTriangleActive: Boolean(project.characters[0]?.pressureTriangle),
          isFinale: false,
          ...proseQualityMetrics,
          universalLeapPresent: blueprint.medium === 'essay' ? false : undefined,
          selfReversalCount: 0,
          disclosureScopeSafe: true
        },
        storyMode
      ),
    [
      latestProse,
      project.characters,
      blueprint.medium,
      blueprint.format,
      proseQualityMetrics,
      storyMode
    ]
  );
  const harnessReport: StoryHarnessReport = useMemo(
    () =>
      runStoryHarness({
        medium: blueprint.medium,
        formatLabel: blueprint.formatLabel,
        material: project.logline || '',
        storySeed: project.deepQuestion || project.audiencePromise || '',
        characterSeed: project.characters[0]
          ? `${project.characters[0].name}: ${project.characters[0].desire}`
          : '',
        audience: project.audiencePromise || '',
        constraints: blueprint.formatLabel || '',
        canonFacts: project.canonFacts,
        qualityGatesReport,
        chapters: project.chapters
      }),
    [
      blueprint.medium,
      blueprint.formatLabel,
      project.logline,
      project.deepQuestion,
      project.audiencePromise,
      project.characters,
      project.canonFacts,
      qualityGatesReport,
      project.chapters
    ]
  );
  const studioMetrics = useMemo(
    () =>
      toStudioMetrics({
        harnessReport,
        qualityGatesReport,
        mediaProjections,
        storyOntology,
        storyMode,
        currentMedium: blueprint.medium,
        chapters: project.chapters
      }),
    [blueprint.medium, harnessReport, mediaProjections, project.chapters, qualityGatesReport, storyMode, storyOntology]
  );
  const updateStoryModeAxis = useCallback((axis: number) => {
    const literaryWeight = Math.max(0, Math.min(1, axis));
    setStoryMode({ commercialWeight: 1 - literaryWeight, literaryWeight });
  }, []);
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
  const isDraftMode = activeTrack === 'draft' && !isPublishingMode;
  const activeModeLabel = isPublishingMode ? '출간 준비' : activeTrack === 'bible' ? '작품 바이블' : '원고';
  // 연재형 포맷만 회차(N화) 언어를 쓴다. 단편·단독 완결형은 "원고" 하나로 다룬다.
  const isSerial = isSerialFormat(format);
  const unitNoun = getWorkUnitNoun(format);
  // 회차 라벨 — 연재형은 "N화", 단독 완결형은 진행 표시 없이 "원고".
  const chapterLabel = (chapter: Chapter) => (isSerial ? `${chapter.episode}화` : '원고');
  const chapterCrumb = latestChapter ? chapterLabel(latestChapter) : '새 초안';
  const saveLabel = editedSinceReview ? '수정 중' : '저장됨';
  // 상단바 회차 선택기 — 좌측 레일에서 회차 카드 목록을 들어낸 자리를 대신한다
  const activeChapterIndex = latestChapter
    ? project.chapters.findIndex((chapter) => chapter.id === latestChapter.id)
    : -1;
  const hasPrevChapter = activeChapterIndex > 0;
  const hasNextChapter = activeChapterIndex >= 0 && activeChapterIndex < project.chapters.length - 1;
  function stepChapter(delta: number) {
    if (activeChapterIndex < 0) {
      return;
    }
    const next = project.chapters[activeChapterIndex + delta];
    if (next) {
      setLatestChapter(next);
    }
  }
  // 일하는 바 — 회차 분량 미터: 실제 원고 글자 수를 한 회차 목표 5,000자와 비교한다
  const CHAPTER_CHAR_TARGET = 5000;
  const chapterCharCount = (editorText || latestChapter?.prose || '').replace(/\s/g, '').length;
  const chapterCharPct = Math.min(100, Math.round((chapterCharCount / CHAPTER_CHAR_TARGET) * 100));
  const pendingApprovalCount = approvalQueue.items.filter((item) => item.status !== 'approved').length;
  // 일하는 바 우측 작가진 진행 스트립 — 실제 검토 에이전트의 상태를 design의 AI-stage로 매핑한다
  const topbarStageFromStatus = (status: AgentRun['status']): string => {
    switch (status) {
      case 'pass':
      case 'complete':
        return 'done';
      case 'revise':
        return 'mark';
      case 'block':
        return 'write';
      case 'idle':
      default:
        return 'queued';
    }
  };
  const crewProgress = displayedAgentRuns.slice(0, 6).map((run) => ({
    agentId: run.agentId,
    persona: getAgentPersona(run),
    stage: topbarStageFromStatus(run.status),
    isReviewing: run.output.includes('읽고') || run.output.includes('읽는')
  }));
  const crewDoneCount = crewProgress.filter((member) => member.stage === 'done').length;
  const currentReviewText = editorText.trim() || latestChapter?.prose.trim() || draftPrompt.trim() || project.logline;
  const marginParagraphs = useMemo(
    () => splitIntoParagraphs(editorText || latestChapter?.prose || ''),
    [editorText, latestChapter?.prose]
  );
  const marginDefaultAnchor = marginParagraphs[0]?.id ?? 'p1';
  const marginCanonDeltas: CanonDelta[] = useMemo(
    () =>
      (latestChapter?.newCanonFacts ?? []).slice(0, 4).map((fact) => ({
        kind: 'added',
        label: fact.statement,
        source: `${fact.owner} · ${latestChapter ? chapterLabel(latestChapter) : '원고'}`
      })),
    [latestChapter, chapterLabel]
  );
  const runMarginReviewAll = useCallback(
    async (onPartial: (review: MarginReview) => void) => {
      if (isReviewing || isGenerating) {
        return;
      }

      const context = buildProjectContextDigest(project);
      const reviewAgentIds = getMediumReviewAgentIds(blueprint.medium);
      setIsReviewing(true);
      setGenerationNote(null);
      setEditedSinceReview(false);
      setAgentRuns(
        reviewAgentIds.map((agentId) => ({
          agentId,
          title: getAgentLabel(agentId),
          status: 'idle',
          output: '검토 순서를 기다리는 중입니다.',
          evidence: []
        }))
      );

      try {
        const reviewTasks = reviewAgentIds.map(async (agentId, reviewIndex) => {
          setAgentRuns((current) =>
            current.map((run) =>
              run.agentId === agentId ? { ...run, output: '지금 원고를 읽고 있습니다…' } : run
            )
          );

          try {
            const res = await requestAgentReview({
              agentId,
              target: currentReviewText,
              medium: blueprint.medium,
              context,
              payoffStatus: computePayoffLedger(project.chapters)
            });

            if (res.ok && res.report) {
              const run = agentReportToRun(res.report);
              setAgentRuns((current) => current.map((item) => (item.agentId === agentId ? run : item)));
              onPartial(
                toMarginReview(
                  run,
                  resolveRunReviewAnchor(run, marginParagraphs, reviewIndex, marginDefaultAnchor)
                )
              );
              return {
                report: res.report,
                memoryCandidates: res.memoryCandidates ?? []
              };
            }

            await new Promise((resolve) => setTimeout(resolve, 180));
            const run = fallbackRunForAgent(
              agentId,
              `${getAgentLabel(agentId)}가 mock 폴백으로 원고를 확인했습니다. ${res.reason ? `(${res.reason})` : '브리지 응답이 없어 기본 검토를 사용합니다.'}`
            );
            setAgentRuns((current) => current.map((item) => (item.agentId === agentId ? run : item)));
            onPartial(
              toMarginReview(
                run,
                resolveRunReviewAnchor(run, marginParagraphs, reviewIndex, marginDefaultAnchor)
              )
            );
            return { memoryCandidates: [] };
          } catch (error) {
            const reason = error instanceof Error ? error.message : '검토 중 예외가 발생했습니다.';
            await new Promise((resolve) => setTimeout(resolve, 180));
            const run = fallbackRunForAgent(
              agentId,
              `${getAgentLabel(agentId)}가 mock 폴백으로 원고를 확인했습니다. (${reason})`
            );
            setAgentRuns((current) => current.map((item) => (item.agentId === agentId ? run : item)));
            onPartial(
              toMarginReview(
                run,
                resolveRunReviewAnchor(run, marginParagraphs, reviewIndex, marginDefaultAnchor)
              )
            );
            return { memoryCandidates: [] };
          }
        });

        const reviewResults = await Promise.all(reviewTasks);
        const reports: AiCliAgentReport[] = reviewResults
          .map((result) => result.report)
          .filter((report): report is AiCliAgentReport => Boolean(report));
        const candidates: AiCliMemoryCandidate[] = reviewResults.flatMap((result) => result.memoryCandidates);

        if (reports.length > 0) {
          const pass = reports.filter((report) => report.status === 'pass').length;
          const revise = reports.filter((report) => report.status === 'revise').length;
          const blocked = reports.filter((report) => report.status === 'blocked').length;
          setLatestReviewResult({
            provider: 'claude',
            mode: 'review',
            scale: reviewScale,
            generatedAt: new Date().toISOString(),
            summary: `${reports.length}명의 코어 작가진이 마진 검토를 남겼습니다. 통과 ${pass} · 수정 ${revise} · 차단 ${blocked}.`,
            agentReports: reports,
            memoryCandidates: candidates,
            nextActions: [
              '마진의 수정·차단 의견을 원고 단락 기준으로 확인하세요.',
              '승인할 기억 후보는 승인 대기함에서 캐논에 반영하세요.'
            ],
            pendingReviewTarget: 'reviews/pending',
            approvalRequiredBeforeSync: true
          });
          setGenerationNote('Claude 구독으로 코어 작가진이 마진 검토를 남겼습니다.');
        } else {
          setGenerationNote('검토 브리지를 쓰지 못해 mock 폴백 마진 검토로 대체했습니다.');
        }
      } finally {
        setIsReviewing(false);
      }
    },
    [
      blueprint.medium,
      currentReviewText,
      isGenerating,
      isReviewing,
      marginDefaultAnchor,
      marginParagraphs,
      project,
      reviewScale
    ]
  );
  const summonMarginReviewAgent = useCallback(
    async (personaId: string, ctx: { selectedText?: string; anchor?: string }) => {
      const anchor = ctx.anchor ?? marginDefaultAnchor;
      const context = buildProjectContextDigest(project);
      const target = ctx.selectedText
        ? [`선택 문장:\n${ctx.selectedText}`, `전체 원고:\n${currentReviewText}`].join('\n\n')
        : currentReviewText;

      const res = await requestAgentReview({
        agentId: personaId,
        target,
        medium: blueprint.medium,
        context,
        payoffStatus: computePayoffLedger(project.chapters)
      });

      if (res.ok && res.report) {
        const run = agentReportToRun(res.report);
        setAgentRuns((current) => {
          const exists = current.some((item) => item.agentId === run.agentId);
          return exists
            ? current.map((item) => (item.agentId === run.agentId ? run : item))
            : [...current, run];
        });
        return toMarginReview(run, anchor);
      }

      await new Promise((resolve) => setTimeout(resolve, 220));
      return toMarginReview(
        fallbackRunForAgent(
          personaId,
          `${findPersona(personaId).name}가 선택한 대목을 확인했습니다. ${res.reason ? `(${res.reason})` : 'mock 폴백 의견입니다.'}`
        ),
        anchor
      );
    },
    [blueprint.medium, currentReviewText, marginDefaultAnchor, project]
  );
  const mediumReviewAgentIds = useMemo(() => getMediumReviewAgentIds(blueprint.medium), [blueprint.medium]);
  const marginReview = useMarginReview({
    paragraphs: marginParagraphs,
    corePersonaIds: mediumReviewAgentIds,
    runAll: runMarginReviewAll,
    summonOne: summonMarginReviewAgent
  });
  const academicClaimMarginReviews = useMemo(
    () => (blueprint.medium === 'academic' ? buildAcademicClaimMarginReviews(currentReviewText) : []),
    [blueprint.medium, currentReviewText]
  );
  const academicCitationMarginReviews = useMemo(
    () => (blueprint.medium === 'academic' ? buildAcademicCitationMarginReviews(currentReviewText) : []),
    [blueprint.medium, currentReviewText]
  );
  const academicIntegrityMarginReviews = useMemo(
    () => (blueprint.medium === 'academic' ? buildAcademicIntegrityMarginReviews(currentReviewText) : []),
    [blueprint.medium, currentReviewText]
  );
  const displayedMarginReviews = useMemo(
    () => [
      ...academicClaimMarginReviews,
      ...academicCitationMarginReviews,
      ...academicIntegrityMarginReviews,
      ...marginReview.reviews
    ],
    [academicClaimMarginReviews, academicCitationMarginReviews, academicIntegrityMarginReviews, marginReview.reviews]
  );
  const acceptMarginDiff = useCallback(
    (diff: InlineDiff) => {
      marginReview.onAcceptDiff(diff);
      setEditorText((current) => {
        const source = current || latestChapter?.prose || '';
        return splitIntoParagraphs(source)
          .map((paragraph) => (paragraph.id === diff.paragraph ? applyDiff(paragraph.text, diff) : paragraph.text))
          .join('\n\n');
      });
      setEditedSinceReview(true);
      setBodyVersion((v) => v + 1); // diff 반영(외부 변경) — floating 본문 재시드
    },
    [latestChapter?.prose, marginReview]
  );

  // Phase 2e — isClassicEditor / ?editor=classic 폴백 제거. 드래프트 모드는 항상 FloatingEditor.
  const openMarginReviewChat = useCallback(
    (review: MarginReview) => {
      const run =
        displayedAgentRuns.find((item) => item.agentId === review.persona) ?? marginReviewToRun(review);
      setSelectedAgent({ run, persona: getAgentPersona(run) });
    },
    [displayedAgentRuns]
  );
  const isLatestLocked = latestChapter?.locked === true;
  const actionLabels = getCreativeActionLabels(blueprint.medium);
  const mainActionLabel = !latestChapter
    ? actionLabels.draft
    : isLatestLocked
      ? actionLabels.nextDraft
      : actionLabels.review;
  const mainActionRun = !latestChapter || isLatestLocked ? produceEpisode : reviewDraft;
  const MainActionIcon = !latestChapter || isLatestLocked ? WandSparkles : ClipboardCheck;

  // Phase 2a — floating 본문 편집 쓰기-백(단일 원천 editorText). 타이핑 경로는 bodyVersion 을 올리지 않는다.
  const handleFloatingBodyChange = useCallback((text: string) => {
    setEditorText(text);
    setEditedSinceReview(true);
  }, []);
  // floating 이 편집 기본이므로 props 를 mainActionRun 정의 아래에서 구성한다(const 호이스팅 회피).
  const floatingEditorProps = useMemo(
    () => ({
      title: project.title,
      episodeLabel: latestChapter ? chapterLabel(latestChapter) : '새 초안',
      kicker: `${blueprint.mediumLabel} · ${latestChapter ? chapterLabel(latestChapter) : '새 초안'}`,
      charCount: `${chapterCharCount.toLocaleString()}자`,
      chapterTitle: latestChapter?.title ?? '제목 없음',
      chapterSub: project.logline,
      paragraphs: marginParagraphs,
      reviews: marginReview.reviews,
      onSummon: marginReview.onSummon,
      onRunAll: marginReview.onRunAll,
      onAcceptDiff: acceptMarginDiff,
      onRejectReview: marginReview.onRejectReview,
      beats: latestChapter?.beats ?? [],
      activeBeatId,
      onSelectBeat: (id: string) => setActiveBeatId(id),
      stats: {
        chars: chapterCharCount,
        chapters: project.chapters.length,
        canon: project.canonFacts.length,
        characters: project.characters.length,
      },
      intentMemo: draftPrompt,
      personas: mediumReviewAgentIds.map((id) => findPersona(id)),
      editable: true,
      bodyVersion,
      onBodyChange: handleFloatingBodyChange,
      onIntentChange: (text: string) => setDraftPrompt(text),
      onGenerateDraft: mainActionRun,
      onSwitchTrack: (track: 'draft' | 'bible') => switchToTrack(track),
      onOpenPublish: openPublishingMode,
      isGenerating,
      metrics: studioMetrics,
      onMediaAxisChange: updateStoryModeAxis,
      episodeForks: buildEpisodeForks(project, computePayoffLedger(project.chapters)),
    }),
    [
      project,
      latestChapter,
      blueprint,
      chapterCharCount,
      marginParagraphs,
      marginReview,
      acceptMarginDiff,
      activeBeatId,
      draftPrompt,
      bodyVersion,
      handleFloatingBodyChange,
      mainActionRun,
      isGenerating,
      studioMetrics,
      updateStoryModeAxis,
      mediumReviewAgentIds,
    ]
  );
  const draftPromptPlaceholder = isLatestLocked
    ? isSerial
      ? `잠긴 ${unitNoun} 다음에 담을 내용을 적어주세요.`
      : '잠긴 원고 다음에 손볼 내용을 적어주세요.'
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
          openBibleSection('overview');
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
          openBibleSection('approval');
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
        id: 'open-project-history',
        label: '작품 버전 기록 / 복원',
        section: '관리',
        description: `${projectSnapshots.length}개 저장 시점에서 이전 작품 상태로 되돌립니다.`,
        run: () => setIsHistoryOpen(true)
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
        if (isDraftMode) {
          setIsSpotlightOpen((current) => !current);
        } else {
          setCommandQuery('');
          setIsCommandPaletteOpen((current) => !current);
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault();
        setIsFocusMode((current) => !current);
        return;
      }

      if (event.key === 'Escape') {
        setIsSpotlightOpen(false);
        setIsMarginDrawerOpen(false);
        setIsBinderDrawerOpen(false);
        setIsCommandPaletteOpen(false);
        setIsMediaPanelOpen(false);
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut);

    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [isDraftMode]);

  useEffect(() => {
    if (!latestChapter) {
      return;
    }

    setEditorText(latestChapter.prose);
    setEditedSinceReview(false);
    setActiveBeatId(null);
    setBodyVersion((v) => v + 1); // 외부 변경(회차 로드·새 초안 생성) — floating 본문 재시드
  }, [latestChapter]);

  // 새 프로젝트 플로우에서 만든 첫 초안으로 에디터를 시작하고, 작가진 검토를 자동 시작한다.
  // 빈 프로젝트(createEmptyProject)에서 시작하므로 샘플 작품의 인물·장소·열린 질문이 새지 않는다.
  useEffect(() => {
    if (draftBootRef.current || !initialDraftPayload) {
      return;
    }
    draftBootRef.current = true;

    const seed = createEmptyProject({
      title: initialDraftPayload.title,
      logline: initialDraftPayload.seed?.logline,
      audiencePromise: initialDraftPayload.seed?.audiencePromise,
      deepQuestion: initialDraftPayload.seed?.deepQuestion,
      // 매체 영속 — 온보딩에서 고른 매체가 프로젝트에 박혀야 리로드 후에도 작가진이 매체를 따른다.
      medium: blueprint.medium,
      format: blueprint.format
    });
    const bootRequest: ProductionRequest = {
      genre: seed.genre,
      intent: initialDraftPayload.title || '새 작품 첫 원고',
      pressure: ''
    };
    const result = chapterFromDraftPayload(seed, initialDraftPayload, bootRequest);
    setProject(result.updatedProject);
    saveProject(result.updatedProject);
    setLatestChapter(result.chapter);
    setDraftFallbackNotice(initialDraftPayload.isFallback === true);
    setActiveTrack('draft');
    setIsPublishingMode(false);
    void runAiReview(result.chapter.prose, buildProjectContextDigest(result.updatedProject));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftPayload]);

  function selectMedium(nextMedium: CreativeMedium) {
    setMedium(nextMedium);
    const nextFormat = getFormatOptions(nextMedium)[0].id;
    setFormat(nextFormat);
    // 매체 영속 — 스튜디오에서 매체를 바꾸면 프로젝트에도 박아 리로드를 살아남게 한다.
    setProject((current) => {
      const next = { ...current, medium: nextMedium, format: nextFormat };
      saveProject(next);
      return next;
    });
  }

  function updateDraftPrompt(value: string) {
    setDraftPrompt(value);
    setRequest((current) => ({ ...current, intent: value }));
  }

  // 회차 구성(beat) 클릭 — 구성은 원고 위의 계획층(오버레이)이므로, 원고 textarea를
  // beat 순번 비율만큼 스크롤해 해당 대목 근처로 이동시킨다(정밀 문단 매핑은 하지 않는다).
  function selectBeat(beat: ChapterBeat) {
    setActiveBeatId(beat.id);

    const textarea = manuscriptRef.current;
    const total = latestChapter?.beats.length ?? 0;
    if (!textarea || total === 0) {
      return;
    }

    const ratio = total > 1 ? (beat.no - 1) / total : 0;
    const target = Math.max(0, (textarea.scrollHeight - textarea.clientHeight) * ratio);
    textarea.focus({ preventScroll: true });
    textarea.scrollTo({ top: target, behavior: 'smooth' });
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

  function updateProject(
    field: 'title' | 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone',
    value: string
  ) {
    const labels = {
      title: '작품 제목',
      logline: '로그라인',
      audiencePromise: '표면 약속',
      deepQuestion: '심층 질문',
      formIntent: '형식·구조',
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

  function updateCreativeWeight(weight: CreativeWeight) {
    logCanonChange({
      kind: 'story-core',
      targetLabel: project.title,
      fieldLabel: '작품 무게중심',
      before: project.creativeWeight,
      after: weight,
      origin: 'manual-bible-edit'
    });
    setProject((current) => ({ ...current, creativeWeight: weight }));
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

    const updated = applyApprovedMemory(project, approved);
    setProject(updated);
    setProjectSnapshots(pushProjectSnapshot(updated, `캐논 반영 ${approved.length}건`));
    setSyncedCandidateIds((current) => [...current, ...syncable.map((item) => item.id)]);
  }

  // 저장된 버전 스냅샷으로 작품 상태를 되돌린다
  function restoreProjectVersion(snapshot: ProjectSnapshot) {
    if (
      !window.confirm(
        `"${snapshot.label}" 시점으로 되돌릴까요? 현재 작품 상태가 이 버전으로 교체됩니다.`
      )
    ) {
      return;
    }

    const chapters = snapshot.project.chapters;
    setProject(snapshot.project);
    setLatestChapter(chapters.length > 0 ? chapters[chapters.length - 1] : null);
    setLatestReviewResult(null);
    setAgentRuns(defaultRuns);
    setEditedSinceReview(false);
    setIsHistoryOpen(false);
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
        context: buildProjectContextDigest(project),
        payoffStatus: computePayoffLedger(project.chapters)
      });

      if (llm.ok && llm.payload) {
        const result = chapterFromDraftPayload(project, llm.payload, effectiveRequest);
        applyProductionResult(result);
        setDraftPrompt((current) => stripConsumedSeeds(current));
        setProjectSnapshots(pushProjectSnapshot(result.updatedProject, `${chapterLabel(result.chapter)} 생성`));
        setGenerationNote('Claude 구독으로 생성한 초안입니다.');
        return;
      }

      const fallback = produceNextChapter(project, effectiveRequest);
      applyProductionResult(fallback);
      setDraftPrompt((current) => stripConsumedSeeds(current));
      setProjectSnapshots(pushProjectSnapshot(fallback.updatedProject, `${chapterLabel(fallback.chapter)} 생성`));
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

  // 에이전트별 분리 검토 — 한 명씩 따로 호출하고, 도착하는 순서대로 작가진 카드를 갱신한다
  async function runAiReview(reviewTarget: string, contextOverride?: string) {
    if (isReviewing || isGenerating) {
      return;
    }

    const agentIds = getReviewAgentIds(reviewScale);
    const context = contextOverride ?? buildProjectContextDigest(project);

    setIsReviewing(true);
    setGenerationNote(null);
    setEditedSinceReview(false);
    setAgentRuns(
      agentIds.map((agentId) => ({
        agentId: agentId as AgentId,
        title: getAgentLabel(agentId),
        status: 'idle',
        output: '검토 순서를 기다리는 중입니다.',
        evidence: []
      }))
    );

    const reports: AiCliAgentReport[] = [];
    const candidates: AiCliMemoryCandidate[] = [];

    try {
      for (const agentId of agentIds) {
        setAgentRuns((current) =>
          current.map((run) =>
            run.agentId === agentId ? { ...run, output: '지금 원고를 읽고 있습니다…' } : run
          )
        );

        const res = await requestAgentReview({
          agentId,
          target: reviewTarget,
          medium: blueprint.medium,
          context,
          payoffStatus: computePayoffLedger(project.chapters)
        });

        if (res.ok && res.report) {
          const report = res.report;
          reports.push(report);
          if (res.memoryCandidates) {
            candidates.push(...res.memoryCandidates);
          }
          setAgentRuns((current) =>
            current.map((run) =>
              run.agentId === agentId
                ? {
                    agentId: agentId as AgentId,
                    title: report.label,
                    status: report.status === 'blocked' ? 'block' : report.status,
                    output: report.note,
                    evidence: report.evidence,
                    strengths: report.strengths ?? [],
                    issues: report.issues ?? []
                  }
                : run
            )
          );
        } else {
          setAgentRuns((current) =>
            current.map((run) =>
              run.agentId === agentId
                ? { ...run, output: `검토를 받지 못했습니다. (${res.reason ?? '실패'})` }
                : run
            )
          );
        }
      }
    } finally {
      setIsReviewing(false);
    }

    if (reports.length === 0) {
      applyReviewResult(
        buildMockAiCliReviewResult({ provider: 'mock', mode: 'review', scale: reviewScale, project }, reviewTarget)
      );
      setGenerationNote('검토 브리지를 쓰지 못해 기본 검토로 대체했습니다.');
      return;
    }

    const pass = reports.filter((report) => report.status === 'pass').length;
    const revise = reports.filter((report) => report.status === 'revise').length;
    const blocked = reports.filter((report) => report.status === 'blocked').length;

    setLatestReviewResult({
      provider: 'claude',
      mode: 'review',
      scale: reviewScale,
      generatedAt: new Date().toISOString(),
      summary: `${reports.length}명의 에이전트가 각자 검토했습니다. 통과 ${pass} · 수정 ${revise} · 차단 ${blocked}.`,
      agentReports: reports,
      memoryCandidates: candidates,
      nextActions: [
        '수정·차단 의견을 원고에 반영한 뒤 다시 검토하세요.',
        '승인할 기억 후보는 승인 대기함에서 캐논에 반영하세요.'
      ],
      pendingReviewTarget: 'reviews/pending',
      approvalRequiredBeforeSync: true
    });
    setGenerationNote('Claude 구독으로 작가진이 한 명씩 검토했습니다.');
  }

  function reviewDraft() {
    marginReview.onRunAll();
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
    setDataView({ kind: 'bible', section: 'approval' });
  }

  // 데이터 모드 분야별 검토 — 현재 분야의 실제 엔티티를 직렬화해 LLM 검토를 요청하고, 정합/제안 노트를 우레일에 채운다.
  // 브리지 미연결·실패 시 deterministic 검토로 폴백해 오프라인에서도 결과가 나온다.
  async function runDataReview(category: CanonCategory) {
    if (dataReviewingCategory) {
      return;
    }

    setDataReviewingCategory(category);

    try {
      const reviewCategory = category as CanonReviewCategory;
      const llm = await requestDataReview({
        category: getCanonReviewCategoryLabel(reviewCategory),
        target: serializeCanonCategory(project, reviewCategory),
        medium: blueprint.medium,
        context: buildProjectContextDigest(project)
      });

      if (llm.ok && llm.notes && llm.notes.length > 0) {
        setDataReviewResults((current) => ({
          ...current,
          [category]: {
            summary: llm.summary ?? '',
            notes: llm.notes ?? [],
            source: 'claude'
          }
        }));
        setGenerationNote('Claude 구독으로 데이터 검토를 마쳤습니다.');
        return;
      }

      const fallback = buildDeterministicDataReview(project, reviewCategory);
      setDataReviewResults((current) => ({
        ...current,
        [category]: {
          summary: fallback.summary,
          notes: fallback.notes,
          source: 'fallback'
        }
      }));
      setGenerationNote(
        llm.reason
          ? `데이터 검토 브리지를 쓰지 못해 기본 검토로 대체했습니다. (${llm.reason})`
          : '기본 데이터 검토로 결과를 만들었습니다.'
      );
    } finally {
      setDataReviewingCategory(null);
    }
  }

  // 데이터 모드 좌레일·진입점에서 바이블 작업장(개요·캐논·문체·승인)을 연다.
  function openBibleSection(section: BibleSection) {
    setDataView({ kind: 'bible', section });
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
    setBodyVersion((v) => v + 1); // 프로젝트 초기화(외부 변경) — floating 본문 재시드
    setActiveTrack('draft');
    setDataView({ kind: 'canon', category: 'characters' });
    setApprovalDecisions({});
    setApprovalStatementOverrides({});
    setSyncedCandidateIds([]);
    clearProjectSnapshots();
    setProjectSnapshots([]);
    setIsHistoryOpen(false);
    setLatestReviewResult(null);
    setIsMediaPanelOpen(false);
    setIsPublishingMode(false);
    setCanonChanges([]);
  }

  // P5 — 편집/바이블/출간 트랙 전환 시 작업대에 약 130ms opacity 페이드를 준다
  function runWithWorkbenchFade(apply: () => void) {
    setIsWorkbenchFading(true);
    window.setTimeout(() => {
      apply();
      setIsWorkbenchFading(false);
    }, 130);
  }

  function switchToTrack(nextTrack: DeskTrack) {
    if (nextTrack === activeTrack && !isPublishingMode) {
      return;
    }
    runWithWorkbenchFade(() => {
      setActiveTrack(nextTrack);
      setIsPublishingMode(false);
      setIsMediaPanelOpen(false);
      if (nextTrack === 'bible') {
        setDataView({ kind: 'board' });
      }
    });
  }

  function openPublishingMode() {
    if (isPublishingMode) {
      return;
    }
    runWithWorkbenchFade(() => {
      setIsPublishingMode(true);
      setIsMediaPanelOpen(false);
    });
  }

  function closePublishingMode() {
    if (!isPublishingMode) {
      return;
    }
    runWithWorkbenchFade(() => {
      setIsPublishingMode(false);
    });
  }

  function openPublishingBible() {
    openBibleSection('approval');
    runWithWorkbenchFade(() => {
      setIsPublishingMode(false);
      setActiveTrack('bible');
    });
  }

  function confirmChapterLock(chapterId: string) {
    setProject((current) => {
      const locked = lockChapter(current, chapterId);
      saveProject(locked);
      return locked;
    });
    // P2 — 잠금 직후 편집으로 돌아가면 latestChapter 가 stale 해 mainActionRun 이 여전히
    // reviewDraft 다(새로고침해야 produceEpisode). latestChapter 도 동기화해 같은 세션에서 다음 회차를 만든다.
    setLatestChapter((current) =>
      current && current.id === chapterId ? { ...current, locked: true } : current
    );
  }

  if (isPublishingMode) {
    return (
      <FloatingPublishWorkspace
        project={project}
        blueprint={blueprint}
        plan={publishingPlan}
        onBackToEditor={closePublishingMode}
        onOpenBible={openPublishingBible}
        onReviewDraft={reviewDraft}
        onConfirmChapterLock={confirmChapterLock}
      />
    );
  }

  if (isDraftMode) {
    return <FloatingEditor {...floatingEditorProps} />;
  }

  if (isBibleMode) {
    const centerSlot =
      dataView.kind === 'canon' ? (
        <CanonCanvas
          category={dataView.category}
          project={project}
          onUpdateCharacter={updateCharacterMemory}
          onOpenBibleSection={openBibleSection}
        />
      ) : dataView.kind === 'bible' ? (
        <MemoryBankStudio
          project={project}
          bank={memoryBank}
          activeSection={dataView.section}
          onUpdateCharacter={updateCharacterMemory}
          onUpdateWorldRule={updateWorldMemory}
          onUpdateCanon={updateCanonMemory}
          onUpdateProject={updateProject}
          onUpdateCreativeWeight={updateCreativeWeight}
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
      ) : null;
    return (
      <FloatingDataWorkspace
        title={project.title}
        episodeLabel={`데이터 · 캐논 ${project.canonFacts.length}`}
        onSwitchTrack={(track) => switchToTrack(track)}
        onOpenPublish={openPublishingMode}
        dataView={dataView}
        onSelectCategory={(category) => setDataView({ kind: 'canon', category })}
        onSelectBibleSection={openBibleSection}
        onShowBoard={() => setDataView({ kind: 'board' })}
        metrics={studioMetrics}
        onMediaAxisChange={updateStoryModeAxis}
        canonHealth={canonHealth}
        dataReviewResults={dataReviewResults}
        project={project}
        latestChapter={latestChapter}
        isSerial={isSerial}
        approvalQueue={approvalQueue}
        dataReviewingCategory={dataReviewingCategory}
        onRequestReview={runDataReview}
        onOpenApprovalQueue={() => openBibleSection('approval')}
        centerSlot={centerSlot}
      />
    );
  }

  return (
    <main
      className={[
        'sx-desk',
        `sx-genre-${request.genre}`,
        '',
        isFocusMode ? 'is-focus-mode is-focus' : '',
        isMarginDrawerOpen ? 'drawer-open' : '',
        isBinderDrawerOpen ? 'binder-open' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--sx-brand': STUDIO_ACCENT_VALUES[studioAccent].value,
          '--sx-brand-press': STUDIO_ACCENT_VALUES[studioAccent].value,
          '--sx-paper': STUDIO_CANVAS_VALUES[studioCanvas].shell,
          '--sx-paper-soft': STUDIO_CANVAS_VALUES[studioCanvas].card,
          '--sx-paper-2': STUDIO_CANVAS_VALUES[studioCanvas].paper2,
          '--sx-card': STUDIO_CANVAS_VALUES[studioCanvas].card,
          '--sx-surface-strong': STUDIO_CANVAS_VALUES[studioCanvas].surface,
          '--sx-page': STUDIO_CANVAS_VALUES[studioCanvas].page,
          '--sx-page-soft': STUDIO_CANVAS_VALUES[studioCanvas].paper2
        } as CSSProperties
      }
    >
      {/* 일하는 바 — design의 dense 56px 3-zone working bar.
          좌: 워드마크·작품·회차 빵부스러기 + (편집) 현재 작업 지점 칩 + 저장 상태
          중앙: 편집/바이블/출간 모드 탭
          우: (편집) 작가진 진행 스트립 + 회차 분량 미터 + 승인 대기 + 기본 액션 */}
      <header className="sx-topbar sx-app-shell-topbar ex-workbar">
        <div className="sx-brand ex-workbar-left">
          <button
            type="button"
            className="sx-brand-mark sx-brand-home"
            aria-label={onOpenProjects ? '프로젝트로 이동' : 'Story X 홈'}
            title={onOpenProjects ? '프로젝트로 이동' : 'Story X'}
            onClick={() => {
              if (onOpenProjects) {
                onOpenProjects();
              } else if (onOpenLanding) {
                onOpenLanding();
              }
            }}
          >
            <img className="nx-brand-symbol" src={storyXSymbol} alt="" />
          </button>
          <nav className="sx-app-breadcrumb" aria-label="현재 위치">
            <input
              className="sx-crumb-title-input"
              aria-label="작품 제목"
              name="breadcrumb-project-title"
              value={project.title}
              onChange={(event) => updateProject('title', event.target.value)}
              autoComplete="off"
              title="클릭해서 제목 편집"
            />
            <ChevronRight size={12} className="ex-workbar-crumb-sep" aria-hidden="true" />
            <span>{activeModeLabel}</span>
            {!isPublishingMode &&
              (isSerial && project.chapters.length > 0 ? (
                <span className="ex-chapter-picker" role="group" aria-label="회차 선택">
                  <button
                    type="button"
                    className="ex-chapter-picker-step"
                    aria-label="이전 회차"
                    title="이전 회차"
                    disabled={!hasPrevChapter}
                    onClick={() => stepChapter(-1)}
                  >
                    <ChevronLeft size={13} aria-hidden="true" />
                  </button>
                  <select
                    className="ex-chapter-picker-select"
                    aria-label="회차 이동"
                    value={latestChapter?.id ?? ''}
                    onChange={(event) => {
                      const next = project.chapters.find((chapter) => chapter.id === event.target.value);
                      if (next) {
                        setLatestChapter(next);
                      }
                    }}
                  >
                    {project.chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.episode}화 · {chapter.title}
                        {chapter.locked ? ' (잠김)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ex-chapter-picker-step"
                    aria-label="다음 회차"
                    title="다음 회차"
                    disabled={!hasNextChapter}
                    onClick={() => stepChapter(1)}
                  >
                    <ChevronRight size={13} aria-hidden="true" />
                  </button>
                </span>
              ) : !isSerial && latestChapter ? (
                <em title="현재 원고">{latestChapter.title}</em>
              ) : (
                <em>{chapterCrumb}</em>
              ))}
          </nav>
          <span className="sx-save-chip ex-workbar-save" data-state={editedSinceReview ? 'dirty' : 'synced'} aria-live="polite">
            <Save size={13} />
            {saveLabel}
          </span>
        </div>
        {/* P2-A — 편집/데이터 두 PRIMARY 모드 탭. 출간은 우측의 secondary 버튼으로 유지한다 */}
        <nav className="sx-track-tabs ex-workbar-modes ex-mode-pair" aria-label="작업 모드">
          <button
            type="button"
            className={isDraftMode ? 'is-active' : ''}
            onClick={() => switchToTrack('draft')}
          >
            <PenLine size={15} />
            편집
            <em className="ex-mode-meta">쓰기</em>
          </button>
          <button
            type="button"
            className={isBibleMode ? 'is-active' : ''}
            onClick={() => switchToTrack('bible')}
          >
            <Database size={15} />
            데이터
            <em className="ex-mode-meta">캐논</em>
            {bibleAlertCount > 0 && <span className="sx-bible-alert-badge">{bibleAlertCount}</span>}
          </button>
        </nav>
        <div className="sx-topbar-actions ex-workbar-right">
          <AiStatusBadge />
          {/* 편집기 설정 — 옵션 버튼 클릭 시 팝오버. 트윅(강조색)·캔버스(원고 배경) 외에도 곧 다른 옵션이 모인다 */}
          <div className="sx-studio-settings-wrap" ref={studioSettingsWrapRef}>
            <button
              type="button"
              className={`sx-studio-settings-toggle ex-workbar-settings${isStudioSettingsOpen ? ' is-open' : ''}`}
              onClick={() => setIsStudioSettingsOpen((v) => !v)}
              aria-label="편집기 옵션"
              aria-expanded={isStudioSettingsOpen}
              aria-haspopup="dialog"
              title="편집기 옵션 — 트윅·캔버스"
            >
              <Settings size={14} />
            </button>
            {isStudioSettingsOpen && (
              <div
                className="sx-studio-settings-popover"
                role="dialog"
                aria-label="편집기 옵션"
              >
                <div className="sx-studio-settings-group">
                  <p className="sx-eyebrow">트윅 · 강조색</p>
                  <div className="sx-studio-settings-row">
                    {(Object.keys(STUDIO_ACCENT_VALUES) as StudioAccent[]).map((key) => {
                      const opt = STUDIO_ACCENT_VALUES[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`sx-accent-chip${studioAccent === key ? ' is-active' : ''}`}
                          onClick={() => setStudioAccent(key)}
                          style={{ '--sx-chip-color': opt.value } as CSSProperties}
                          title={opt.label}
                        >
                          <span className="sx-accent-dot" aria-hidden="true" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sx-studio-settings-group">
                  <p className="sx-eyebrow">캔버스 · 원고 배경</p>
                  <div className="sx-studio-settings-row">
                    {(Object.keys(STUDIO_CANVAS_VALUES) as StudioCanvas[]).map((key) => {
                      const opt = STUDIO_CANVAS_VALUES[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`sx-canvas-chip${studioCanvas === key ? ' is-active' : ''}`}
                          onClick={() => setStudioCanvas(key)}
                          style={{ '--sx-chip-bg': opt.page } as CSSProperties}
                        >
                          <span className="sx-canvas-swatch" aria-hidden="true" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sx-studio-settings-group">
                  <p className="sx-eyebrow">프로젝트 데이터</p>
                  <div className="sx-studio-settings-row">
                    <button
                      type="button"
                      className="sx-studio-data-action"
                      onClick={handleExportProject}
                      title="작품·스냅샷·환경설정을 한 JSON 파일로 저장합니다."
                    >
                      <Download size={12} />
                      내보내기
                    </button>
                    <button
                      type="button"
                      className="sx-studio-data-action"
                      onClick={handleImportClick}
                      title="이전에 내보낸 JSON 파일을 불러옵니다. 현재 작품이 덮어써집니다."
                    >
                      <Upload size={12} />
                      가져오기
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                </div>
                <p className="sx-studio-settings-hint">
                  선택은 자동 저장됩니다. 가져오기는 현재 작품을 덮어쓰니 먼저 내보내기를 권장합니다.
                </p>
              </div>
            )}
          </div>
          {/* 출간 버튼 — onOpenPublish 가 있으면 4번째 stage 로 빠진다. 없으면 스튜디오 내부 출간 모드(legacy) 로 폴백. */}
          <button
            type="button"
            className={`sx-publish-button ex-workbar-publish ${isPublishingMode ? 'is-active' : ''}`}
            data-active={isPublishingMode ? 'true' : 'false'}
            onClick={onOpenPublish ?? openPublishingMode}
            title={onOpenPublish ? '출간 준비 화면으로 이동' : '출간 준비 — 릴리즈 게이트와 출간 스냅샷'}
          >
            <FileText size={15} />
            출간
          </button>
          <button
            type="button"
            className={`sx-primary-button ex-workbar-action ${isPublishingMode ? 'is-publish' : ''}`}
            onClick={isPublishingMode ? closePublishingMode : mainActionRun}
            disabled={!isPublishingMode && (isGenerating || isReviewing)}
          >
            {isPublishingMode ? (
              <>
                <PenLine size={15} />
                편집으로
              </>
            ) : (
              <>
                <MainActionIcon size={15} />
                {isGenerating ? '생성 중…' : isReviewing ? '검토 중…' : mainActionLabel}
              </>
            )}
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
        <aside className="sx-project-rail sx-rail-l" aria-label="프로젝트 대시보드">
          {isPublishingMode ? (
            <>
              <ProjectStateCard
                project={project}
                canonHealth={canonHealth}
                pendingApprovals={approvalQueue.items.filter((item) => item.status !== 'approved').length}
                onJumpToBible={(section) => {
                  setActiveTrack('bible');
                  openBibleSection(section);
                  setIsPublishingMode(false);
                  setIsMediaPanelOpen(false);
                }}
              />
              <DataPanel metrics={studioMetrics} onMediaAxisChange={updateStoryModeAxis} />
              <PublishingIndexCard plan={publishingPlan} />
            </>
          ) : (
            /* P3 — 데이터 모드 좌레일: 작품 상태 4셀 + 캐논 nav 5종 + 바이블 규칙 아코디언 + 작품 데이터 진입점 */
            <DataLeftRail
              project={project}
              latestChapter={latestChapter}
              isSerial={isSerial}
              canonHealth={canonHealth}
              approvalQueue={approvalQueue}
              dataView={dataView}
              onSelectCategory={(category) => setDataView({ kind: 'canon', category })}
              onSelectBibleSection={openBibleSection}
            />
          )}
        </aside>

        <section
          className={`sx-workbench ${isPublishingMode ? 'is-publishing' : activeTrack === 'bible' ? 'is-bible' : 'is-draft'}${
            isWorkbenchFading ? ' is-fading' : ''
          }`}
          aria-label="Story X 작업대"
        >
          {isPublishingMode ? (
            <PublishingStudio
              project={project}
              blueprint={blueprint}
              plan={publishingPlan}
              onBackToEditor={closePublishingMode}
              onOpenBible={openPublishingBible}
              onReviewDraft={reviewDraft}
              onConfirmChapterLock={confirmChapterLock}
            />
          ) : dataView.kind === 'canon' ? (
            /* P3 — 데이터 모드 가운데 캔버스: 분야별로 관계도/카드/타임라인이 바뀐다 */
            <CanonCanvas
              category={dataView.category}
              project={project}
              onUpdateCharacter={updateCharacterMemory}
              onOpenBibleSection={openBibleSection}
            />
          ) : dataView.kind === 'bible' ? (
            <MemoryBankStudio
              project={project}
              bank={memoryBank}
              activeSection={dataView.section}
              onUpdateCharacter={updateCharacterMemory}
              onUpdateWorldRule={updateWorldMemory}
              onUpdateCanon={updateCanonMemory}
              onUpdateProject={updateProject}
              onUpdateCreativeWeight={updateCreativeWeight}
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
          ) : null}
        </section>

        <aside className="sx-codex-rail sx-focused-assist-rail" aria-label={isBibleMode ? '조수진과 바이블 검토' : '열린 질문'}>
          {isBibleMode ? (
            dataView.kind === 'canon' ? (
              /* P4 — 데이터 모드: 분야별 데이터 검토 레일. 실제 엔티티 검토 결과를 정합/제안으로 보여준다 */
              <DataReviewRail
                category={dataView.category}
                review={dataReviewResults[dataView.category] ?? null}
                isReviewing={dataReviewingCategory === dataView.category}
                onRequestReview={() => runDataReview(dataView.category)}
                onOpenApprovalQueue={() => openBibleSection('approval')}
              />
            ) : dataView.kind === 'bible' ? (
              <BibleAssistantSidebar
                runs={bibleAssistantRuns}
                activeSection={dataView.section}
                onSelectAgent={(run, persona) => setSelectedAgent({ run, persona })}
              />
            ) : null
          ) : (
            <OpenThreadsCard threads={project.openThreads} />
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
          isReviewing={isReviewing}
          onRunReview={() => {
            setSelectedAgent(null);
            reviewDraft();
          }}
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

      {isHistoryOpen && (
        <ProjectHistoryDialog
          snapshots={projectSnapshots}
          onRestore={restoreProjectVersion}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </main>
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
  // 연재형은 "N화", 단독 완결형은 "원고"로 출간 단위를 표기한다.
  const publishIsSerial = isSerialFormat(blueprint.format);
  const publishUnitLabel = (chapter: Chapter) => (publishIsSerial ? `${chapter.episode}화` : '원고');

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
          <small>{latestChapter ? `${publishUnitLabel(latestChapter)} 기준` : '초안 생성 후 출간 스냅샷 생성'}</small>
          {latestChapter && (() => {
            const labels = getCreativeActionLabels(blueprint.medium);
            const unit = publishUnitLabel(latestChapter);
            return (
              <button
                type="button"
                className="sx-primary-button"
                disabled={isLatestLocked}
                aria-label={isLatestLocked ? `${unit}는 이미 ${labels.lock}됨` : `${unit} ${labels.lock}`}
                onClick={() => onConfirmChapterLock(latestChapter.id)}
              >
                <Lock size={15} />
                {isLatestLocked ? labels.lockedChip : `${unit} ${labels.lock}`}
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
}function AiCliHarnessCard({
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

function CreativeStage({
  blueprint,
  chapter,
  project,
  verticalSlice,
  editableText,
  editedSinceReview,
  isFocusMode,
  manuscriptRef,
  marginParagraphs,
  marginReviews,
  marginOpenId,
  filterPersona,
  appliedDiffs,
  onSummonAgent,
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
  manuscriptRef: RefObject<HTMLDivElement>;
  marginParagraphs: Paragraph[];
  marginReviews: MarginReview[];
  marginOpenId: string | null;
  filterPersona: string | null;
  appliedDiffs: InlineDiff[];
  onSummonAgent: (personaId: string, context?: { selectedText?: string; anchor?: string }) => void;
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
  // 편집기 중앙 무대에서 vertical-slice proof 패널을 제거 — 창작 공간을 가리지 않는다
  void editableText;
  void verticalSlice;
  void onOpenApprovalQueue;
  const verticalSlicePanel = null;

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
            <p className="sx-eyebrow">
              {isSerialFormat(blueprint.format) ? `Episode ${chapter.episode}` : '원고'}
            </p>
            <h2>{chapter.title}</h2>
            <label className={`sx-manuscript-editor-wrap ${editedSinceReview ? 'is-edited' : ''}`}>
              <span className="sx-manuscript-editor-head">원고</span>
              <div
                ref={manuscriptRef}
                className={`sx-manuscript-editor ${editedSinceReview ? 'is-edited' : ''}`}
                aria-label="원고 편집기"
                role="textbox"
                tabIndex={0}
                contentEditable
                suppressContentEditableWarning
                onInput={(event) => onEditableTextChange(textFromEditable(event.currentTarget))}
              >
                {marginParagraphs.map((paragraph) => {
                  const reviews = marginReviews.filter((review) => review.anchor === paragraph.id);
                  const anchorColor =
                    reviews.length > 0 ? findPersona(String(reviews[0].persona)).tint : 'transparent';
                  const isOpen = reviews.some(
                    (review) => marginOpenId === `${review.anchor}${review.persona}`
                  );
                  const isDim = Boolean(filterPersona) && reviews.every((review) => review.persona !== filterPersona);
                  const diffs = appliedDiffs.filter((diff) => diff.paragraph === paragraph.id);

                  return (
                    <p
                      key={paragraph.id}
                      data-pid={paragraph.id}
                      className={[
                        reviews.length > 0 ? 'is-anchored' : '',
                        isOpen ? 'is-open' : '',
                        isDim && reviews.length > 0 ? 'is-dim' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ ['--anchor-color' as string]: anchorColor }}
                    >
                      {renderParagraphText(paragraph.text, diffs)}
                    </p>
                  );
                })}
              </div>
              <MentionBar manuscriptRef={manuscriptRef} onSummon={onSummonAgent} />
              {isFocusMode && (
                <span className="sx-focus-chip" contentEditable={false}>
                  무대 위 · <kbd>Esc</kbd> 나가기
                </span>
              )}
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
