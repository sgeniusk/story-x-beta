import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  WandSparkles
} from 'lucide-react';
import { useEffect, useCallback, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { getAgentValidationProcess, type ValidationAgentId } from './lib/agentReviewProcess';
import { getAgentPersona } from './lib/agentPersonas';
import { defaultRuns, getMediumReviewAgentIds, visualStoryAgentRuns } from './lib/agentSeedData';
import { inspectLeak, type LeakReport } from './lib/leakGate';
import { recordWritingDay, emptyWritingLog, computeRetentionStats } from './lib/retentionStats';
import { detectCanonMentions } from './lib/canonMentions';
import storyXSymbol from './assets/brand/story-x-symbol-light.svg';
import { AiStatusBadge } from './components/AiStatusBadge';
import { CanonCanvas } from './components/CanonCanvas';
import { MemoryBankStudio } from './components/MemoryBankStudio';
import { FloatingEditor } from './components/FloatingEditor';
import { FloatingDataWorkspace } from './components/FloatingDataWorkspace';
import { FloatingPublishWorkspace } from './components/FloatingPublishWorkspace';
import { WorkspaceModeBar } from './components/WorkspaceModeBar';
import { OverflowMenu } from './components/OverflowMenu';
import { CommandPalette, type DeskCommand } from './components/CommandPalette';
import { useMarginReview } from './hooks/useMarginReview';
import { findPersona } from './lib/extendedPersonas';
import { applyDiff, resolveRunReviewAnchor, splitIntoParagraphs, toMarginReview, type CanonDelta, type InlineDiff, type MarginReview } from './lib/marginReview';
import { buildCreativeBlueprint, getFormatOptions, getMediumOptions, getWorkUnitNoun, isSerialFormat, type CreativeFormat, type CreativeMedium } from './lib/projectBlueprint';
import { applyApprovedMemory, buildDeterministicDataReview, buildProjectContextDigest, buildStoryEditorWorkspace, chapterFromDraftPayload, createEmptyProject, createSeedProject, evaluateProductionGate, getCanonReviewCategoryLabel, getGenreProfiles, lockChapter, unlockChapter, produceNextChapter, serializeCanonCategory, type AgentRun, type Chapter, type ChapterBeat, commitChapterProse, addCharacter, applyContractAmendment, removeCharacter, renameCharacter, type AgentId, type CanonReviewCategory, type ContractAmendmentPatch, type CreativeWeight, type DraftChapterPayload, type ProductionRequest, type ProductionResult, type SeriesProject } from './lib/storyEngine';
import { requestLlmDraft } from './lib/draftClient';
import { requestAgentReview } from './lib/reviewClient';
import { computePayoffLedger } from './lib/payoffLedger';
import { buildContractStatus, buildEpisodeForks, stripConsumedSeeds, type VsCandidate } from './lib/episodeBriefing';
import { buildPaceCheck, type PaceQuestion } from './lib/paceInterview';
import { requestPaceInterview } from './lib/paceInterviewClient';
import { requestVsCandidates } from './lib/vsCandidatesClient';
import { requestDataReview } from './lib/dataReviewClient';
import type { BibleSection, CanonCategory, DataReviewView, DataView } from './lib/canonDataView';
import { evaluateKoreanProse } from './lib/koreanStyle';
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
import { buildMemoryApprovalQueue, buildStoryMemoryBank, type MemoryApprovalDecision, type MemoryApprovalQueue } from './lib/memoryBank';
import { buildTesterDrivenWorkflow } from './lib/evaluationSynthesis';
import { getCreativeActionLabels } from './lib/projectBlueprint';
import { buildPublishingPlan } from './lib/publishing';
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
import { buildAlphaReadinessReport } from './lib/alphaReadiness';
import { buildOneProjectVerticalSlice } from './lib/verticalSlice';
import {
  buildCanonRefactorPlan,
  createCanonChangeEntry,
  revertCanonChange,
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
  /** 융합 셸 진입 뷰 — WRITE=editor(원고)·PLAN=data(바이블). 없으면 editor(현행). */
  initialStudioView?: 'editor' | 'data';
  /** 슬라이스 C — App 이 주는 싱크 콘솔(⟳최신화). 단일 바 우측에 합성. */
  syncSlot?: ReactNode;
  /** 슬라이스 C — PLAY 토글 → App stage 전환. */
  onSelectPlayMode?: () => void;
  /** 슬라이스 C — WRITE↔PLAN 내부 전환을 App state 에 동기화(⟳최신화 remount 후 복원용). */
  onStudioViewChange?: (view: 'editor' | 'data') => void;
}

// B2 — 활동일 기록 헬퍼. todayStr 는 작가 로컬 '오늘'(UI 레이어라 Date 허용),
// withWritingDay 는 recordWritingDay 를 project 레벨로 감싼 순수 합성(같은 날 중복은 참조 동일 no-op).
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function withWritingDay(project: SeriesProject, dateStr: string): SeriesProject {
  const log = recordWritingDay(project.writingLog ?? emptyWritingLog(), dateStr);
  if (log === project.writingLog) return project;
  return { ...project, writingLog: log };
}

export function StoryXDesk({
  initialMedium = 'novel',
  initialFormat = 'long-novel',
  initialDraftPayload = null,
  onOpenProjects,
  onOpenLanding,
  onOpenPublish,
  initialStudioView = 'editor',
  syncSlot,
  onSelectPlayMode,
  onStudioViewChange
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
  const [draftPrompt, setDraftPrompt] = useState(() => project.nextEpisodeIntent ?? defaultEpisodeIntent);
  // 의도 메모 영속(dogfooding 발견) — draftPrompt(VS·fork 합류 포함)를 debounce 후 project.nextEpisodeIntent 에
  // 동기화·저장해 새로고침·dev서버 사망 시 선택이 날아가지 않게 한다. 마운트 초기값은 위 useState 가 복원한다.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setProject((prev) => {
        if ((prev.nextEpisodeIntent ?? '') === draftPrompt) return prev;
        const next = { ...prev, nextEpisodeIntent: draftPrompt };
        saveProject(next);
        return next;
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [draftPrompt]);
  const [editorText, setEditorText] = useState('');
  // 베타테스트 #1 — debounce/flush commit 이 stale closure 가 아닌 최신 editorText 를 쓰도록 ref 미러.
  const editorTextRef = useRef(editorText);
  editorTextRef.current = editorText;
  const [draftFallbackNotice, setDraftFallbackNotice] = useState(false);
  const [editedSinceReview, setEditedSinceReview] = useState(false);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>(defaultRuns);
  const [leakBlock, setLeakBlock] = useState<LeakReport | null>(null);
  const [latestChapter, setLatestChapter] = useState<Chapter | null>(
    project.chapters.length > 0 ? project.chapters[project.chapters.length - 1] : null
  );
  const [activeTrack, setActiveTrack] = useState<DeskTrack>(initialStudioView === 'data' ? 'bible' : 'draft');
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
  const [isPublishingMode, setIsPublishingMode] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [canonChanges, setCanonChanges] = useState<CanonChangeEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  // Phase 2a — floating 본문 외부 변경(초안 생성·diff 반영·회차 전환) 시드 카운터.
  // 사용자 타이핑(onBodyChange)에서는 절대 올리지 않는다 — 타이핑 중 본문 재시드를 막아 커서 보존.
  const [bodyVersion, setBodyVersion] = useState(0);
  // P7 후속 — 생성 후 시드 strip 결과를 uncontrolled 메모 textarea 에 재시드하는 버전 키.
  const [intentVersion, setIntentVersion] = useState(0);
  // 페이스 인터뷰 LLM — 성공 시 결정론 카드를 교체. 생성 성공 시 null 로 초기화.
  const [llmPaceQuestions, setLlmPaceQuestions] = useState<PaceQuestion[] | null>(null);
  const [isPaceInterviewLoading, setIsPaceInterviewLoading] = useState(false);
  const [paceInterviewNote, setPaceInterviewNote] = useState<string | null>(null);
  const [vsCandidates, setVsCandidates] = useState<VsCandidate[]>([]);
  const [isVsLoading, setIsVsLoading] = useState(false);
  const [vsNote, setVsNote] = useState<string | null>(null);
  // 데이터 모드 분야별 검토 — 결과는 분야 id로 캐싱하고, 검토 중인 분야는 따로 표시한다.
  const [dataReviewResults, setDataReviewResults] = useState<Partial<Record<CanonCategory, DataReviewView>>>({});
  const [dataReviewingCategory, setDataReviewingCategory] = useState<CanonCategory | null>(null);
  const [generationNote, setGenerationNote] = useState<string | null>(null);
  const [projectSnapshots, setProjectSnapshots] = useState<ProjectSnapshot[]>(() => loadProjectSnapshots());
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null);
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
  // 연재형 포맷만 회차(N화) 언어를 쓴다. 단편·단독 완결형은 "원고" 하나로 다룬다.
  const isSerial = isSerialFormat(format);
  const unitNoun = getWorkUnitNoun(format);
  // 회차 라벨 — 연재형은 "N화", 단독 완결형은 진행 표시 없이 "원고".
  const chapterLabel = (chapter: Chapter) => (isSerial ? `${chapter.episode}화` : '원고');
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
              payoffStatus: computePayoffLedger(project.chapters),
              contractStatus: buildContractStatus(project) ?? undefined
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
        payoffStatus: computePayoffLedger(project.chapters),
        contractStatus: buildContractStatus(project) ?? undefined
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
    canRunAll: () => !isReviewing && !isGenerating,
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

  const isLatestLocked = latestChapter?.locked === true;
  const actionLabels = getCreativeActionLabels(blueprint.medium);
  const mainActionLabel = !latestChapter
    ? actionLabels.draft
    : isLatestLocked
      ? actionLabels.nextDraft
      : actionLabels.review;
  const mainActionRun = !latestChapter || isLatestLocked ? produceEpisode : reviewDraft;
  const MainActionIcon = !latestChapter || isLatestLocked ? WandSparkles : ClipboardCheck;
  // 단계적 집필 게이트(A-2) — 미잠금 헌장이면 생성 CTA 만 비활성화하고 사유를 보여준다(검토·다른 동선은 유지).
  const productionGate = evaluateProductionGate(project);
  const productionBlockedReason =
    (!latestChapter || isLatestLocked) && !productionGate.allowed ? productionGate.reason : undefined;

  // Phase 2a — floating 본문 편집 쓰기-백(단일 원천 editorText). 타이핑 경로는 bodyVersion 을 올리지 않는다.
  const handleFloatingBodyChange = useCallback((text: string) => {
    setEditorText(text);
    setEditedSinceReview(true);
  }, []);

  // 쇼러너 서술형 LLM 페이스 인터뷰 — fc-pace 카드 "쇼러너에게 묻기" 트리거.
  const askShowrunnerPace = useCallback(async () => {
    if (isPaceInterviewLoading) return;
    setIsPaceInterviewLoading(true);
    setPaceInterviewNote(null);
    try {
      const ledger = computePayoffLedger(project.chapters);
      // 미회수 약속 — chapters 의 rewardArc 중 payoff 빈 promise 목록(인라인 도출, episodeBriefing 내부 함수 복사 금지)
      const unpaidPromises: string[] = [];
      for (const ch of project.chapters) {
        for (const entry of ch.rewardArc ?? []) {
          const promise = entry.promise.trim();
          if (promise.length > 0 && entry.payoff.trim().length === 0 && !unpaidPromises.includes(promise)) {
            unpaidPromises.push(promise);
          }
        }
      }
      // deferred stakes — stakesLedger 의 최신 resolution 이 deferred 인 stake 목록(인라인 도출)
      const lastResolution = new Map<string, string>();
      for (const ch of project.chapters) {
        for (const entry of ch.stakesLedger ?? []) {
          if (entry.resolution) lastResolution.set(entry.stake, entry.resolution);
        }
      }
      const deferredStakes = [...lastResolution.entries()]
        .filter(([, r]) => r === 'deferred')
        .map(([stake]) => stake);

      const result = await requestPaceInterview({
        medium: blueprint.medium,
        format: blueprint.format,
        payoffStatus: {
          isStalled: ledger.isStalled,
          deferredStreak: ledger.deferredStreak,
          openPromises: ledger.openPromises,
        },
        unpaidPromises,
        deferredStakes,
        context: buildProjectContextDigest(project),
      });

      if (result.ok && result.questions) {
        setLlmPaceQuestions(result.questions);
      } else {
        setPaceInterviewNote(result.reason ?? '쇼러너 인터뷰에 실패했습니다.');
      }
    } finally {
      setIsPaceInterviewLoading(false);
    }
  }, [blueprint.medium, blueprint.format, isPaceInterviewLoading, project]);
  const handleRequestVsCandidates = useCallback(async () => {
    setIsVsLoading(true);
    setVsNote(null);
    const status = buildContractStatus(project);
    const contractDigest = status
      ? `위치 ${status.position}/${status.plannedEpisodes} · 잔여 ${status.remaining} · 미회수 ${status.unpaidCount}`
      : '';
    const last = project.chapters[project.chapters.length - 1];
    const recentSummary = last ? `${chapterLabel(last)} ${last.title} — ${last.prose.slice(0, 200)}` : '';
    // 같은 약속이 여러 회차에 같은 문구로 기록될 수 있어 중복 제거(collectUnpaidPromises 와 동형 — 프롬프트 중복 줄 방지).
    const unpaidPromises = Array.from(
      new Set(
        project.chapters
          .flatMap((c) => c.rewardArc ?? [])
          .filter((e) => e.promise.trim() && e.payoff.trim().length === 0)
          .map((e) => e.promise.trim())
      )
    );
    try {
      const result = await requestVsCandidates({
        medium: blueprint.medium,
        format: blueprint.format,
        contractDigest,
        recentSummary,
        unpaidPromises,
        canonStatements: project.canonFacts.map((f) => f.statement),
      });
      if (result.ok && result.candidates) setVsCandidates(result.candidates);
      else setVsNote(result.reason ?? '전개 후보를 가져오지 못했습니다.');
    } finally {
      setIsVsLoading(false);
    }
  }, [project, blueprint.medium, blueprint.format, chapterLabel]);

  // floating 이 편집 기본이므로 props 를 mainActionRun 정의 아래에서 구성한다(const 호이스팅 회피).
  // B3 — 본문(editorText) 등장 캐논 멘션. editorText/canonFacts 변경 시만 재계산(floatingEditorProps 전체 재계산 회피).
  const canonMentionViews = useMemo(
    () =>
      detectCanonMentions(editorText, project.canonFacts).map((m) => ({
        name: m.name,
        facts: m.factIds
          .map((id) => project.canonFacts.find((f) => f.id === id))
          .filter((f): f is NonNullable<typeof f> => Boolean(f))
          .map((f) => ({ id: f.id, statement: f.statement, alwaysInclude: f.alwaysInclude })),
      })),
    [editorText, project.canonFacts]
  );
  const handleToggleCanonInclude = useCallback((factId: string) => {
    setProject((current) => {
      const next = {
        ...current,
        canonFacts: current.canonFacts.map((fact) =>
          fact.id === factId ? { ...fact, alwaysInclude: !fact.alwaysInclude } : fact
        ),
      };
      saveProject(next);
      return next;
    });
  }, []);

  const floatingEditorProps = useMemo(
    () => ({
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
      intentVersion,
      personas: mediumReviewAgentIds.map((id) => findPersona(id)),
      editable: !isLatestLocked,
      bodyVersion,
      onBodyChange: handleFloatingBodyChange,
      onIntentChange: (text: string) => setDraftPrompt(text),
      onGenerateDraft: mainActionRun,
      mainActionLabel, // F-002 — 상태별 라벨(첫 회차/다음 회차/검토)을 floating CTA 에 반영
      isGenerating,
      metrics: studioMetrics,
      onMediaAxisChange: updateStoryModeAxis,
      episodeForks: buildEpisodeForks(project, computePayoffLedger(project.chapters)),
      vsCandidates,
      onRequestVsCandidates: handleRequestVsCandidates,
      isVsLoading,
      vsNote,
      onSelectVsCandidate: () => { setVsCandidates([]); setVsNote(null); },
      paceQuestions: llmPaceQuestions ?? buildPaceCheck(project, computePayoffLedger(project.chapters), isSerial),
      onAskShowrunnerPace: askShowrunnerPace,
      isPaceInterviewLoading,
      paceInterviewNote,
      productionBlockedReason,
      // #4 회차 선택기 — 회차 전환은 기존 setLatestChapter 경로(latestChapter effect 가 미커밋 prose flush 후 새 회차 시드)를 그대로 탄다.
      chapters: project.chapters,
      currentChapterId: latestChapter?.id ?? null,
      onSelectChapter: (id: string) => {
        const next = project.chapters.find((chapter) => chapter.id === id);
        if (next) setLatestChapter(next);
      },
      // #5 잠긴 회차 보호 — 읽기전용 게이트 + 잠금 해제(편집 재개).
      isLocked: isLatestLocked,
      onUnlock: handleUnlockChapter,
      // 다음 회차 CTA 모호 수정 — 미잠금 최신 회차일 때 편집 모드에 확정 동선 노출(잠금 → 메인 CTA 가 다음 회차로 전환).
      canConfirmLock: !!latestChapter && !isLatestLocked,
      onConfirmLock: latestChapter ? () => confirmChapterLock(latestChapter.id) : undefined,
      lockLabel: actionLabels.lock,
      leakBlock,
      retention: {
        stats: computeRetentionStats(project.writingLog ?? emptyWritingLog(), todayStr()),
        target: { current: project.chapters.length, planned: project.storyContract?.plannedEpisodes ?? null },
      },
      canonMentions: canonMentionViews,
      onToggleCanonInclude: handleToggleCanonInclude,
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
      mainActionLabel,
      isGenerating,
      studioMetrics,
      updateStoryModeAxis,
      mediumReviewAgentIds,
      isSerial,
      llmPaceQuestions,
      askShowrunnerPace,
      isPaceInterviewLoading,
      paceInterviewNote,
      productionBlockedReason,
      vsCandidates,
      handleRequestVsCandidates,
      isVsLoading,
      vsNote,
      leakBlock,
      canonMentionViews,
      handleToggleCanonInclude,
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
        // F-006 fallback — 작가실 dock 버튼이 막혀도 검토 루프를 시작할 수 있는 제2 진입점.
        id: 'run-all-review',
        label: '작가진 전체 검토',
        section: '원고',
        description: '현재 회차 본문을 작가진 전원에게 한 번에 검토받습니다.',
        shortcut: 'ReviewAll',
        run: () => marginReview.onRunAll()
      },
      {
        id: 'open-draft',
        label: '원고 편집 열기',
        section: '이동',
        description: '중앙 작업장을 원고 편집 화면으로 전환합니다.',
        run: () => {
          setActiveTrack('draft');
          setIsPublishingMode(false);
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
        }
      },
      {
        id: 'release-lock-check',
        label: publishingPlan.releaseLock.canLock ? '출간 스냅샷 잠금 가능' : '출간 게이트 확인',
        section: '출간',
        description: publishingPlan.releaseLock.notice,
        disabled: false,
        run: () => {
          setIsPublishingMode(true);
        }
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
      latestChapter,
      marginReview,
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

  // 본문 자동 저장(베타테스트 #1) — 타이핑이 멈추면 현재 회차 prose 로 commit → 위 saveProject effect 가 영속한다.
  // commitChapterProse 는 prose 가 동일하면 no-op(참조 동일)이라 불필요한 저장을 막는다.
  useEffect(() => {
    if (!latestChapter) return;
    const chapterId = latestChapter.id;
    const timer = setTimeout(() => {
      setProject((prev) => {
        const committed = commitChapterProse(prev, chapterId, editorTextRef.current);
        // 실제 prose 변화가 있을 때만 활동일 기록(commitChapterProse no-op 이면 참조 동일).
        return committed === prev ? prev : withWritingDay(committed, todayStr());
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [editorText, latestChapter]);

  useEffect(() => {
    function handleGlobalShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        // F-006 — draft(floating) 모드도 같은 명령 팔레트를 연다(이전 spotlight 분기는 미렌더 죽은 코드였다).
        setCommandQuery('');
        setIsCommandPaletteOpen((current) => !current);
        return;
      }

      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut);

    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [isDraftMode]);

  // 회차 전환·새 초안 로드 시 — 이전 회차에 미커밋 편집을 먼저 flush 한 뒤 새 회차 본문을 시드한다(베타테스트 #1).
  const loadedChapterIdRef = useRef<string | null>(latestChapter?.id ?? null);
  useEffect(() => {
    const prevId = loadedChapterIdRef.current;
    const nextId = latestChapter?.id ?? null;
    if (prevId && prevId !== nextId) {
      const pending = editorTextRef.current;
      setProject((prev) => commitChapterProse(prev, prevId, pending));
    }
    loadedChapterIdRef.current = nextId;

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
      format: blueprint.format,
      // 작품 헌장 — 온보딩 Stage 1 에서 만들어졌으면 프로젝트에 박아 A-4/A-5 가 발화하게 한다.
      storyContract: initialDraftPayload.seed?.storyContract
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
    // #10 — 기존 회차·헌장이 있는데 매체를 바꾸면 작가진·생성/검토 기준이 조용히 전환된다. 무음 전환을 막기 위해 영향을 알리고 확인받는다.
    const hasWork = project.chapters.length > 0 || !!project.storyContract;
    if (
      hasWork &&
      nextMedium !== medium &&
      !window.confirm(
        `현재 ${project.chapters.length}화가 있고 작가진·생성 기준이 ${blueprint.mediumLabel}에 맞춰져 있습니다. ` +
          `매체를 바꾸면 작가진과 생성·검토 기준이 새 매체로 전환됩니다(회차 본문·헌장은 유지). 계속할까요?`
      )
    ) {
      return;
    }
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

  function selectFormat(nextFormat: CreativeFormat) {
    // #10 — 형식(분량·연재 기준) 변경도 회차/헌장이 있으면 confirm. 기존엔 setFormat 만 하고 project 에 영속하지 않아 리로드 시 휘발했다.
    const hasWork = project.chapters.length > 0 || !!project.storyContract;
    if (
      hasWork &&
      nextFormat !== format &&
      !window.confirm(
        `현재 ${project.chapters.length}화가 있습니다. 형식을 ${blueprint.formatLabel}에서 바꾸면 분량·연재 기준이 전환됩니다(회차 본문·헌장은 유지). 계속할까요?`
      )
    ) {
      return;
    }
    setFormat(nextFormat);
    setProject((current) => {
      const next = { ...current, format: nextFormat };
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

  // 베타테스트 #1-undo — 변경 로그의 한 항목을 before(최초 원본)로 되돌리고, 그 항목을 로그에서 제거한다.
  function revertCanonChangeEntry(change: CanonChangeEntry) {
    setProject((prev) => revertCanonChange(prev, change));
    setCanonChanges((current) => current.filter((entry) => entry.id !== change.id));
  }

  // 베타테스트 #7 — 잠긴 헌장(척추·결말·대가·화수) 개정. 헌장 없는 작품은 no-op(하위호환).
  // 변경 로그에 직전 헌장을 JSON 으로 남겨 #1-undo(storyContract revert)로 되돌릴 수 있다.
  function amendCharter(patch: ContractAmendmentPatch, reason: string) {
    const contract = project.storyContract;
    if (!contract) return;
    const next = applyContractAmendment(contract, { reason, at: new Date().toISOString(), patch });
    logCanonChange({
      kind: 'story-core',
      targetLabel: project.title,
      fieldLabel: '작품 헌장',
      before: JSON.stringify(contract),
      after: JSON.stringify(next),
      origin: 'manual-bible-edit',
      revertField: 'storyContract'
    });
    setProject((current) => {
      const updated = { ...current, storyContract: next };
      // B4 — 헌장 개정도 굵직한 마일스톤이라 자동 버전 스냅샷을 남긴다.
      setProjectSnapshots(pushProjectSnapshot(updated, '헌장 개정'));
      return updated;
    });
  }

  // 베타테스트 #6 — 인물 CRUD 핸들러(순수 함수 위임).
  function handleAddCharacter() {
    setProject((prev) => addCharacter(prev));
  }
  function handleRemoveCharacter(characterId: string) {
    setProject((prev) => removeCharacter(prev, characterId));
  }
  function handleRenameCharacter(characterId: string, name: string) {
    setProject((prev) => renameCharacter(prev, characterId, name));
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
      origin: 'manual-bible-edit',
      revertField: field
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
      origin: 'manual-bible-edit',
      revertField: 'creativeWeight'
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
        origin: 'manual-bible-edit',
        targetId: characterId,
        revertField: field
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
        origin: 'manual-bible-edit',
        targetId: ruleId
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
        origin: 'manual-bible-edit',
        targetId: canonId
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

  function applyProductionResult(result: ProductionResult) {
    setProject(withWritingDay(result.updatedProject, todayStr()));
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
    // 단계적 집필 게이트(A-2) — 헌장이 있는데 척추가 미잠금이면 본문을 만들지 않고 안내만 한다.
    const gate = evaluateProductionGate(project);
    if (!gate.allowed) {
      setGenerationNote(gate.reason ?? '작품 헌장을 먼저 잠가야 본문을 생성할 수 있습니다.');
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
        payoffStatus: computePayoffLedger(project.chapters),
        // 작품 헌장 예산 — 헌장이 있으면 생성 프롬프트에 예산·종반·척추 규칙을 발화시킨다(A-5). 없으면 undefined.
        contractStatus: buildContractStatus(project) ?? undefined
      });

      if (llm.ok && llm.payload) {
        const result = chapterFromDraftPayload(project, llm.payload, effectiveRequest);
        applyProductionResult(result);
        setDraftPrompt((current) => stripConsumedSeeds(current));
        setIntentVersion((v) => v + 1); // strip 결과를 메모 textarea 에 재시드
        setLlmPaceQuestions(null); // 새 회차 — 결정론 카드부터 다시 시작
        setPaceInterviewNote(null);
        setProjectSnapshots(pushProjectSnapshot(result.updatedProject, `${chapterLabel(result.chapter)} 생성`));
        setGenerationNote('Claude 구독으로 생성한 초안입니다.');
        return;
      }

      const fallback = produceNextChapter(project, effectiveRequest);
      applyProductionResult(fallback);
      setDraftPrompt((current) => stripConsumedSeeds(current));
      setIntentVersion((v) => v + 1); // strip 결과를 메모 textarea 에 재시드
      setLlmPaceQuestions(null); // 새 회차 — 결정론 카드부터 다시 시작
      setPaceInterviewNote(null);
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
          payoffStatus: computePayoffLedger(project.chapters),
          contractStatus: buildContractStatus(project) ?? undefined
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
    setLatestReviewResult(null);
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
    // B1 — 확정 전 누수 게이트. 프롬프트/지시문 잔여가 있으면 잠그지 않고 배너로 차단(상투구는 경고만).
    const target = project.chapters.find((chapter) => chapter.id === chapterId);
    const report = inspectLeak(target?.prose ?? '');
    if (report.blocked) {
      setLeakBlock(report);
      return;
    }
    setLeakBlock(null);
    setProject((current) => {
      const locked = lockChapter(current, chapterId);
      const stamped = withWritingDay(locked, todayStr());
      saveProject(stamped);
      // B4 — 회차 확정은 굵직한 마일스톤이라 자동 버전 스냅샷을 남긴다.
      setProjectSnapshots(pushProjectSnapshot(stamped, `${chapterLabel(target ?? stamped.chapters[stamped.chapters.length - 1])} 확정`));
      return stamped;
    });
    // P2 — 잠금 직후 편집으로 돌아가면 latestChapter 가 stale 해 mainActionRun 이 여전히
    // reviewDraft 다(새로고침해야 produceEpisode). latestChapter 도 동기화해 같은 세션에서 다음 회차를 만든다.
    setLatestChapter((current) =>
      current && current.id === chapterId ? { ...current, locked: true } : current
    );
  }

  // 베타테스트 #5 — 잠긴 회차 잠금 해제(편집 재개). confirmChapterLock 의 역동작.
  function handleUnlockChapter() {
    if (!latestChapter) return;
    const targetId = latestChapter.id;
    setProject((current) => {
      const unlocked = unlockChapter(current, targetId);
      saveProject(unlocked);
      return unlocked;
    });
    setLatestChapter((current) =>
      current && current.id === targetId ? { ...current, locked: false } : current
    );
  }

  // 슬라이스 C — 단일 바(소유권 역전). WRITE↔PLAN 은 switchToTrack 내부 전환(remount 없음),
  // PLAY 는 App stage 전환. 슬롯 = 제목 input·회차 픽커/캐논 요약·⚠충돌 칩·싱크 콘솔·⋯ 메뉴.
  const writeContext =
    isSerial && project.chapters.length > 0 && latestChapter ? (
      <span className="wm-context-chip" role="group" aria-label="회차 이동">
        <button
          type="button"
          className="ex-chapter-picker-step"
          aria-label="이전 회차"
          disabled={!hasPrevChapter}
          onClick={() => stepChapter(-1)}
        >
          <ChevronLeft size={12} aria-hidden="true" />
        </button>
        <span>{latestChapter.episode}화 · {latestChapter.title}</span>
        <button
          type="button"
          className="ex-chapter-picker-step"
          aria-label="다음 회차"
          disabled={!hasNextChapter}
          onClick={() => stepChapter(1)}
        >
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      </span>
    ) : null;
  const planContext = (
    <>
      <span className="wm-context-chip">캐논 {project.canonFacts.length}</span>
      {bibleAlertCount > 0 && (
        <button type="button" className="wm-conflict-chip" onClick={() => openBibleSection('approval')}>
          ⚠ 충돌 {bibleAlertCount}
        </button>
      )}
    </>
  );
  const overflowItems = [
    {
      id: 'publish',
      label: '출간',
      onSelect: () => (onOpenPublish ? onOpenPublish() : openPublishingMode())
    },
    { id: 'export', label: 'JSON 내보내기', onSelect: handleExportProject },
    { id: 'import', label: 'JSON 가져오기', onSelect: handleImportClick }
  ];
  const workspaceModeBar = (
    <WorkspaceModeBar
      mode={activeTrack === 'bible' ? 'plan' : 'write'}
      onSelect={(next) => {
        if (next === 'play') {
          onSelectPlayMode?.();
          return;
        }
        switchToTrack(next === 'plan' ? 'bible' : 'draft');
        onStudioViewChange?.(next === 'plan' ? 'data' : 'editor');
      }}
      titleSlot={
        <input
          className="wm-title-input"
          aria-label="작품 제목"
          value={project.title}
          onChange={(event) => updateProject('title', event.target.value)}
          autoComplete="off"
          title="클릭해서 제목 편집"
        />
      }
      contextSlot={activeTrack === 'bible' ? planContext : writeContext}
      planBadge={bibleAlertCount}
      rightSlot={
        <>
          {syncSlot}
          <OverflowMenu items={overflowItems}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </OverflowMenu>
        </>
      }
    />
  );
  const metaRightSlot = (
    <>
      <span className="dm-save" data-state={editedSinceReview ? 'dirty' : 'synced'}>
        {saveLabel}
      </span>
      <AiStatusBadge />
    </>
  );

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
    return (
      <>
        {workspaceModeBar}
        <FloatingEditor {...floatingEditorProps} metaRightSlot={metaRightSlot} />
        {/* F-006 — floating 모드에서도 ⌘K 명령 팔레트로 전체 검토·다음 회차 생성에 접근한다. */}
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
      </>
    );
  }

  if (isBibleMode) {
    const centerSlot =
      dataView.kind === 'canon' ? (
        <CanonCanvas
          category={dataView.category}
          project={project}
          onUpdateCharacter={updateCharacterMemory}
          onOpenBibleSection={openBibleSection}
          onAddCharacter={handleAddCharacter}
          onRemoveCharacter={handleRemoveCharacter}
          onRenameCharacter={handleRenameCharacter}
          canonRefactorPlan={canonRefactorPlan}
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
          onRevertCanonChange={revertCanonChangeEntry}
          onAmendCharter={amendCharter}
        />
      ) : null;
    return (
      <>
        {workspaceModeBar}
        <FloatingDataWorkspace
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
          metaLeft={`캐논 ${project.canonFacts.length} · 떡밥 ${project.openThreads.length}`}
          metaRightSlot={metaRightSlot}
        />
      </>
    );
  }

  // draft·bible·publishing 세 트랙 조기 반환이 전 경로를 덮는다. 이 최종 반환은 타입 안전용 도달 불가 폴백이다.
  return null;
}
