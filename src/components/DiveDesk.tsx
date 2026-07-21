// Dive X 얇은 표면 — 채팅·응결 제안·승인 다이얼로그·연대기. 엔진은 재사용.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Chapter,
  EpisodeLengthContract,
  EpisodeLengthPreset,
  ProductionRequest,
  SeriesProject
} from '../lib/storyEngine';
import {
  chapterFromDraftPayload,
  buildProjectContextDigest,
  applyRetcons,
  episodeLengthContractFor,
  evaluateEpisodeLength,
  nextEpisodeNumber,
  parseEpisodeLengthContract
} from '../lib/storyEngine';
import { inspectLeak } from '../lib/leakGate';
import {
  type DiveSession,
  type CondenseSourceSpan,
  CONDENSE_KEEP_RECENT,
  selectCondenseSpan,
  resolveCondenseRetrySource,
  resolveCondenseSourceBoundary,
  appendMessage,
  buildCondenseTranscript,
  buildRecentDialogue,
  applyCondenseResult,
  applyCondenseCheckpoint,
  parseSceneSegments,
  buildVsCandidatesInput,
  buildPlayDirectionSeed
} from '../lib/diveSession';
import { validatePlayTurn, deriveDeviationCandidates, buildPromotedFacts, type PlayTurnVerdict } from '../lib/playRuntimeValidator';
import { DeviationReview } from './DeviationReview';
import { requestDiveChat, requestDiveShowrunner, requestDiveConsolidate, type DiveCondenseJobRequest, type DiveCondensePayload, type ConsolidationFinding } from '../lib/diveClient';
import { ConsolidationFindings } from './ConsolidationFindings';
import { DIVE_SEED_CHARACTERS } from '../lib/diveSeedCharacters';
import { requestVsCandidates } from '../lib/vsCandidatesClient';
import { VsCandidatePanel } from './VsCandidatePanel';
import type { VsCandidate } from '../lib/episodeBriefing';
import { buildProjectRevision, canRecoverGeneration, findLatestGenerationAttempt, type GenerationInboxItem } from '../lib/generationInbox';
import { buildPlayRecoverySnapshot, type PlayRecoverySnapshot } from '../lib/playRecovery';
import type { ApprovedCondenseRetcon } from '../lib/syncConsole';
import {
  elapsedSecondsSince,
  formatElapsed,
  playProgressPresentation,
  type PlayProgressKind
} from '../lib/generationProgress';
import {
  LOCAL_RUNTIME_REQUIRED_MESSAGE,
  STORYX_RUNTIME_CAPABILITIES
} from '../lib/runtimeCapabilities';

export type CondenseApprovalResolution = 'committed' | 'pending-conflict' | 'failed';

export interface CondenseApprovalRequest {
  session: DiveSession;
  sessionBeforeApproval: DiveSession;
  project: SeriesProject;
  workingBeforeApproval: SeriesProject;
  chapter: Chapter;
  retcons: ApprovedCondenseRetcon[];
  sourceSpan?: CondenseSourceSpan;
  generationId: string;
}

interface DiveDeskProps {
  session: DiveSession;
  project: SeriesProject;
  onChange: (session: DiveSession, project: SeriesProject) => void;
  onBack: () => void;
  generationInbox?: GenerationInboxItem[];
  selectedGeneration?: GenerationInboxItem | null;
  onStartGeneration?: (request: DiveCondenseJobRequest, recovery: PlayRecoverySnapshot) => Promise<void>;
  onCancelGeneration?: (item: GenerationInboxItem) => void;
  onOpenGenerationInbox?: () => void;
  onResolveGeneration?: (id: string) => void;
  onApproveGeneration?: (approval: CondenseApprovalRequest) => CondenseApprovalResolution;
  onDownloadRecovery?: (recovery: PlayRecoverySnapshot) => void;
  onSendRecoveryToDraft?: (recovery: PlayRecoverySnapshot, generationId?: string) => void;
  playAiEnabled?: boolean;
  condenseJobsEnabled?: boolean;
  disabledReason?: string;
}

const EPISODE_LENGTH_OPTIONS: Array<{
  preset: EpisodeLengthPreset;
  label: string;
}> = [
  { preset: 'compact', label: '3천자 · 2~3장면' },
  { preset: 'standard', label: '5천자 · 3~4장면' },
  { preset: 'extended', label: '8천자 · 4~6장면' }
];

function episodeLengthTargetLabel(contract: EpisodeLengthContract): string {
  return `${contract.targetChars / 1000}천자`;
}

function episodeLengthSceneLabel(contract: EpisodeLengthContract): string {
  return `${contract.minScenes}~${contract.maxScenes}장면`;
}

function formatEpisodeChars(chars: number): string {
  return chars.toLocaleString('ko-KR');
}

function episodeLengthReceiptCopy(
  contract: EpisodeLengthContract,
  actualChars: number,
  status: 'under' | 'within' | 'over'
): string {
  const prefix = `${formatEpisodeChars(actualChars)}자 / 목표 ${formatEpisodeChars(contract.targetChars)}자 · `;
  if (status === 'under') return `${prefix}목표 미달, 자동으로 채우지 않음`;
  if (status === 'over') return `${prefix}목표 초과, 자동으로 자르지 않음`;
  return `${prefix}범위 안`;
}

function resolveRetryEpisodeLength(
  item: GenerationInboxItem | null,
  recovery: PlayRecoverySnapshot
): EpisodeLengthContract | undefined {
  // 영수증이 있으면 quota 압축 후에도 남는 root가 정본이다.
  // 잡 등록 전 현재 탭에서 즉시 실패한 경우(item=null)만 recovery 복제본을 쓴다.
  return parseEpisodeLengthContract(item ? item.episodeLength : recovery.episodeLength);
}

function withReceiptRootEpisodeLength(
  recovery: PlayRecoverySnapshot,
  item: GenerationInboxItem | null
): PlayRecoverySnapshot {
  if (!item) return recovery;
  const { episodeLength: _storedEpisodeLength, ...targetlessRecovery } = recovery;
  return item.episodeLength
    ? { ...targetlessRecovery, episodeLength: item.episodeLength }
    : targetlessRecovery;
}

function characterCardText(project: SeriesProject, characterId: string): string {
  const c = project.characters.find((x) => x.id === characterId)
    ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === characterId)?.character;
  if (!c) return '';
  const header = [c.name.trim(), c.role.trim()].filter(Boolean).join(' — ');
  const voiceRules = c.voiceRules.map((rule) => rule.trim()).filter(Boolean);
  const canonAnchors = c.canonAnchors.map((anchor) => anchor.trim()).filter(Boolean);
  return [
    header,
    c.desire.trim() ? `욕망: ${c.desire.trim()}` : '',
    c.wound.trim() ? `상처: ${c.wound.trim()}` : '',
    c.currentState.trim() ? `현재 상태: ${c.currentState.trim()}` : '',
    voiceRules.length > 0 ? `말투 규칙: ${voiceRules.join(' / ')}` : '',
    canonAnchors.length > 0 ? `캐논 앵커(위반 금지): ${canonAnchors.join(' / ')}` : ''
  ].filter(Boolean).join('\n');
}

// 대사 속 *행동·묘사*를 기울임으로 분리 렌더(제타류 관례) — 대사는 그대로, 별표 구간은 지문처럼.
function renderDialogue(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((seg, i) => {
    if (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')) {
      return (
        <em key={i} className="dx-action">
          {seg.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{seg}</span>;
  });
}

// verdict의 최악 밴드(anchor > major > surprise) → 거터 클래스. 없으면 null.
function gutterClass(verdict?: PlayTurnVerdict): string | null {
  if (!verdict) return null;
  if (verdict.conflicts.some((c) => c.band === 'anchor')) return 'dx-gutter-anchor';
  if (verdict.conflicts.some((c) => c.band === 'major')) return 'dx-gutter-major';
  if (verdict.surpriseCandidates.length > 0) return 'dx-gutter-surprise';
  return null;
}

// peek 텍스트 — 어느 캐논/떡밥이 걸렸나 한 줄(마커 title).
function peekText(verdict: PlayTurnVerdict): string {
  const parts: string[] = [];
  for (const c of verdict.conflicts) {
    parts.push(`${c.band === 'anchor' ? '🔴 정본 충돌' : '🟡 경고'} — ${c.factStatement}`);
  }
  for (const s of verdict.surpriseCandidates) {
    parts.push(`✦ 의외 전개 후보${s.relatedThread ? ` — ${s.relatedThread}` : ''}`);
  }
  return parts.join(' · ');
}

type LocalPlayProgressKind = Exclude<PlayProgressKind, 'condense'>;

interface LocalPlayProgress {
  id: number;
  kind: LocalPlayProgressKind;
  startedAt: number;
  label?: string;
}

function DiveProgressCopy({
  kind,
  elapsedSeconds,
  label
}: {
  kind: PlayProgressKind;
  elapsedSeconds: number;
  label?: string;
}) {
  const presentation = playProgressPresentation(kind, elapsedSeconds);
  return (
    <div className="dx-progress-copy">
      <div className="dx-progress-head">
        <span className="dx-progress-dot" aria-hidden="true" />
        <strong>{label ?? presentation.label}</strong>
        <time className="dx-progress-time" aria-hidden="true">
          {formatElapsed(elapsedSeconds)} 경과
        </time>
      </div>
      <span className="dx-progress-message">{presentation.message}</span>
      <span className="dx-progress-hint">{presentation.hint}</span>
    </div>
  );
}

function DiveProgressCard({
  progress,
  now
}: {
  progress: LocalPlayProgress;
  now: number;
}) {
  const elapsedSeconds = elapsedSecondsSince(progress.startedAt, now);
  return (
    <div
      className={`dx-progress-card is-${progress.kind}`}
      data-progress-kind={progress.kind}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <DiveProgressCopy kind={progress.kind} elapsedSeconds={elapsedSeconds} label={progress.label} />
    </div>
  );
}

export function DiveDesk({
  session, project, onChange, onBack, generationInbox = [], selectedGeneration = null,
  onStartGeneration, onCancelGeneration, onOpenGenerationInbox, onResolveGeneration,
  onApproveGeneration, onDownloadRecovery, onSendRecoveryToDraft,
  playAiEnabled = STORYX_RUNTIME_CAPABILITIES.playAi,
  condenseJobsEnabled = STORYX_RUNTIME_CAPABILITIES.condenseJobs,
  disabledReason = LOCAL_RUNTIME_REQUIRED_MESSAGE
}: DiveDeskProps) {
  const selectedResultBlocked = selectedGeneration?.result ? inspectLeak(selectedGeneration.result.prose).blocked : false;
  const [input, setInput] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<DiveCondensePayload | null>(() => selectedResultBlocked ? null : selectedGeneration?.result ?? null);
  const [pendingGenerationId] = useState<string | null>(() => !selectedResultBlocked && selectedGeneration?.result ? selectedGeneration.id : null);
  const pendingEpisodeLength = pending
    ? pendingGenerationId === selectedGeneration?.id
      ? selectedGeneration.episodeLength
      : pending.episodeLength
    : undefined;
  const pendingLengthEvaluation = pending && pendingEpisodeLength
    ? evaluateEpisodeLength(pending.prose, pendingEpisodeLength)
    : null;
  const selectedSourceBoundary: CondenseSourceSpan | number | undefined = pendingGenerationId === selectedGeneration?.id
    ? resolveCondenseSourceBoundary(
        session,
        selectedGeneration.sourceSpan,
        selectedGeneration.recovery?.sourceSpan,
        selectedGeneration.recovery?.condensedThroughTurn,
        selectedGeneration.sourceFingerprint ?? selectedGeneration.recovery?.sourceFingerprint
      )
    : undefined;
  const selectedSourceSpan = typeof selectedSourceBoundary === 'object'
    ? selectedSourceBoundary
    : undefined;
  const [leakWarn] = useState<string | null>(() => selectedResultBlocked ? '본문에 프롬프트/AI 누수가 감지됐습니다. 이 결과는 승인할 수 없습니다.' : null);
  const [generationStartError, setGenerationStartError] = useState<string | null>(null);
  const [failedRecovery, setFailedRecovery] = useState<PlayRecoverySnapshot | null>(null);
  const [startingGeneration, setStartingGeneration] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const [srInput, setSrInput] = useState('');
  const [srReply, setSrReply] = useState<string | null>(null);
  const [srSceneUpdate, setSrSceneUpdate] = useState('');
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const scene = session.scene ?? '';
  const card = useMemo(() => characterCardText(project, session.characterId), [project, session.characterId]);
  const charName = useMemo(() => {
    const c = project.characters.find((x) => x.id === session.characterId)
      ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === session.characterId)?.character;
    return c?.name ?? '상대';
  }, [project, session.characterId]);
  const condenseSpan = useMemo(() => selectCondenseSpan(session), [session]);
  const validCondenseMaterialCount = condenseSpan.condense.filter(
    (message) => !message.verdict?.blocksCanonization
  ).length;
  const hasEnoughCondenseMaterial = validCondenseMaterialCount > CONDENSE_KEEP_RECENT;
  const selectedEpisodeLength = episodeLengthContractFor(session.episodeLengthPreset);
  const continuityFirstMessageId = session.chatBuffer.find(
    (message) => message.turn <= session.lastCondensedTurn
  )?.id;
  const episode = nextEpisodeNumber(project);
  // UI 갱신으로 영수증 배열 순서가 바뀌어도 현재 회차의 최신 생성 시도 하나만 PLAY를 대표해야
  // 재시도 성공 뒤 과거 실패가 되살아나거나 지난 회차 실패를 다시 실행하지 않는다.
  const currentEpisodeGeneration = findLatestGenerationAttempt(generationInbox, project.id, episode);
  const activeGeneration = currentEpisodeGeneration?.status === 'running' ? currentEpisodeGeneration : null;
  const activeEpisodeLength = activeGeneration?.episodeLength;
  const currentGenerationNeedsImmediateDownload = Boolean(
    currentEpisodeGeneration?.localPersistenceFailed && currentEpisodeGeneration.recovery
  );
  const projectInboxCount = generationInbox.filter((item) => item.projectId === project.id).length;
  const recoverableGeneration = currentEpisodeGeneration &&
    canRecoverGeneration(currentEpisodeGeneration) &&
    !(currentEpisodeGeneration.recoveredAt && currentEpisodeGeneration.recoveredChapterId)
      ? currentEpisodeGeneration
      : null;
  const inlineRecovery = activeGeneration ? null : failedRecovery
    ? { recovery: failedRecovery, generationId: undefined, hasRecoveryDraft: false, needsImmediateDownload: false, item: null }
    : recoverableGeneration?.recovery
      ? {
          recovery: withReceiptRootEpisodeLength(recoverableGeneration.recovery, recoverableGeneration),
          generationId: recoverableGeneration.id,
          hasRecoveryDraft: Boolean(recoverableGeneration.recoveryDraftOpenedAt && recoverableGeneration.recoveryDraftId),
          needsImmediateDownload: Boolean(recoverableGeneration.localPersistenceFailed),
          item: recoverableGeneration
        }
      : null;
  const inlineRetrySource = inlineRecovery
    ? resolveCondenseRetrySource(
        session,
        inlineRecovery.item?.sourceSpan,
        inlineRecovery.recovery.sourceSpan,
        inlineRecovery.item?.sourceFingerprint ?? inlineRecovery.recovery.sourceFingerprint
      )
    : undefined;
  const inlineRetryEpisodeLength = inlineRecovery
    ? resolveRetryEpisodeLength(inlineRecovery.item, inlineRecovery.recovery)
    : undefined;
  const inlineRetryBlockedCopy = inlineRecovery && !inlineRetrySource
    ? '생성 당시 원문 범위를 현재 PLAY에서 정확히 확인할 수 없어 자동 재시도는 막았습니다. PLAY 기록 TXT를 받거나 원문을 참고해 직접 쓰세요.'
    : inlineRecovery && !inlineRetryEpisodeLength
      ? '생성 당시 목표 기록을 확인할 수 없어 자동 재시도는 막았습니다. PLAY 기록 TXT를 받거나 원문을 참고해 직접 쓰세요.'
      : null;
  const selectedGenerationIsStale = Boolean(selectedGeneration && selectedGeneration.baseRevision !== buildProjectRevision(project));
  const turnCounts = useMemo(() => {
    let surprise = 0, anchor = 0, major = 0;
    for (const m of condenseSpan.condense) {
      const v = m.verdict;
      if (!v) continue;
      surprise += v.surpriseCandidates.length;
      anchor += v.conflicts.filter((c) => c.band === 'anchor').length;
      major += v.conflicts.filter((c) => c.band === 'major').length;
    }
    return { surprise, anchor, major };
  }, [condenseSpan]);
  const [decisions, setDecisions] = useState<Record<string, 'skip' | 'promote'>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [retconDecisions, setRetconDecisions] = useState<Record<string, 'keep' | 'retcon'>>({});
  const deviations = useMemo(
    () => deriveDeviationCandidates(session, selectedSourceBoundary),
    [selectedSourceBoundary, session]
  );
  const [findings, setFindings] = useState<ConsolidationFinding[] | null>(null);
  const [reviewing, setReviewing] = useState(false);
  // VS 전개 후보 — opt-in 버튼으로만 생성. 기존 res.choices 가벼운 칩과 공존.
  const [vsCandidates, setVsCandidates] = useState<VsCandidate[]>([]);
  const [vsBusy, setVsBusy] = useState(false);
  const [vsReason, setVsReason] = useState<string | null>(null);
  const [localProgresses, setLocalProgresses] = useState<LocalPlayProgress[]>([]);
  const [progressClockNow, setProgressClockNow] = useState(() => Date.now());
  const nextProgressId = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const focusComposerAfterChoice = useRef(false);

  useEffect(() => {
    if (localProgresses.length === 0 && !activeGeneration) return;
    setProgressClockNow(Date.now());
    const timer = window.setInterval(() => setProgressClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeGeneration?.id, localProgresses.length]);

  useEffect(() => {
    if (!focusComposerAfterChoice.current) return;
    focusComposerAfterChoice.current = false;
    const composer = composerRef.current;
    if (!composer) return;
    composer.focus();
    const end = composer.value.length;
    composer.setSelectionRange(end, end);
  }, [input]);

  function beginProgress(kind: LocalPlayProgressKind, label?: string): number {
    const id = ++nextProgressId.current;
    const startedAt = Date.now();
    setProgressClockNow(startedAt);
    setLocalProgresses((current) => [...current, { id, kind, startedAt, label }]);
    return id;
  }

  function endProgress(id: number) {
    setLocalProgresses((current) => current.filter((progress) => progress.id !== id));
  }

  async function reviewConsolidation() {
    if (!pending || reviewing) return;
    if (!playAiEnabled) {
      setGenerationStartError(disabledReason);
      return;
    }
    setReviewing(true);
    try {
      const res = await requestDiveConsolidate({ prose: pending.prose, context: buildProjectContextDigest(project) });
      setFindings(res.findings);
    } catch {
      setFindings([]);
    } finally {
      setReviewing(false);
    }
  }

  async function send(textArg?: string) {
    const userText = (textArg ?? input).trim();
    if (!userText || busy || pending !== null) return;
    if (!playAiEnabled) {
      setGenerationStartError(disabledReason);
      return;
    }
    if (textArg === undefined) setInput('');
    setBusy(true);
    const progressId = beginProgress('dialogue', `${charName}의 다음 대화`);
    setChoices([]);
    let next = appendMessage(session, 'user', userText);
    onChange(next, project);
    try {
      const res = await requestDiveChat({
        character: card,
        scene,
        arc: JSON.stringify(session.arc ?? {}),
        context: buildProjectContextDigest(project),
        dialogue: buildRecentDialogue(next),
        query: userText
      });
      const verdict = validatePlayTurn(res.reply || '', project.canonFacts, project.openThreads);
      next = appendMessage(next, 'character', res.reply || '…', verdict);
      if (res.arc) next = { ...next, arc: res.arc };
      onChange(next, project);
      setChoices(res.choices ?? []);
    } catch {
      next = appendMessage(next, 'character', '…(지금은 대답하기 어려워.)');
      onChange(next, project);
    } finally {
      // fetch 거절(네트워크 오류·JSON 파싱 실패) 시에도 busy 가 고착돼 입력이 얼지 않게 항상 해제.
      setBusy(false);
      endProgress(progressId);
    }
  }

  function putChoiceInComposer(choice: string) {
    const nextInput = choice.trim();
    // 작성 중인 작가 문장은 추천으로 덮어쓰지 않는다. 렌더 조건도 칩을 숨기지만
    // 지연된 click 같은 경계에서도 같은 비파괴 계약을 지킨다.
    if (!nextInput || input.trim()) return;
    focusComposerAfterChoice.current = true;
    setInput(nextInput);
  }

  function selectEpisodeLength(preset: EpisodeLengthPreset) {
    if (startingGeneration || activeGeneration || pending) return;
    onChange({ ...session, episodeLengthPreset: preset }, project);
  }

  // ✦ 전개 후보 — 명시 버튼 opt-in. 라이브 상태를 VS 입력으로 조립해 후보 다발을 1회 생성. 실패는 안내로 강등.
  async function requestCandidates() {
    if (busy || vsBusy || pending !== null) return;
    if (!playAiEnabled) {
      setGenerationStartError(disabledReason);
      return;
    }
    setVsBusy(true);
    const progressId = beginProgress('candidates');
    setVsReason(null);
    try {
      const result = await requestVsCandidates(buildVsCandidatesInput(session, project));
      if (result.ok && result.candidates) {
        setVsCandidates(result.candidates);
      } else {
        setVsCandidates([]);
        setVsReason(result.reason ?? '전개 후보를 가져오지 못했습니다.');
      }
    } finally {
      setVsBusy(false);
      endProgress(progressId);
    }
  }

  // 후보 선택 → 괄호 연출로 굴림(⏭전개과 같은 계열). 패널은 닫는다.
  function pickCandidate(direction: string) {
    if (!playAiEnabled) {
      setGenerationStartError(disabledReason);
      return;
    }
    setVsCandidates([]);
    setVsReason(null);
    send(buildPlayDirectionSeed(direction));
  }

  async function condense(retry?: { recovery: PlayRecoverySnapshot; item: GenerationInboxItem | null }) {
    if (busy || startingGeneration || activeGeneration || (!retry && !hasEnoughCondenseMaterial)) return;
    if (!condenseJobsEnabled) {
      setGenerationStartError(disabledReason);
      return;
    }
    const retrySource = retry
      ? resolveCondenseRetrySource(
          session,
          retry.item?.sourceSpan,
          retry.recovery.sourceSpan,
          retry.item?.sourceFingerprint ?? retry.recovery.sourceFingerprint
        )
      : undefined;
    const retryEpisodeLength = retry
      ? resolveRetryEpisodeLength(retry.item, retry.recovery)
      : undefined;
    if (retry && (!retrySource || !retryEpisodeLength)) {
      setGenerationStartError(!retrySource
        ? '생성 당시 원문 범위가 현재 PLAY와 정확히 일치하지 않아 재시도를 막았습니다.'
        : '생성 당시 회차 목표 기록이 없거나 손상되어 재시도를 막았습니다.');
      return;
    }
    const episodeLength = retryEpisodeLength ?? selectedEpisodeLength;
    const recovery = retry
      ? {
          ...retry.recovery,
          sourceSpan: retrySource!.sourceSpan,
          sourceFingerprint: retry.item?.sourceFingerprint ?? retry.recovery.sourceFingerprint,
          episodeLength
        }
      : { ...buildPlayRecoverySnapshot(session, project), episodeLength };
    setGenerationStartError(null);
    setFailedRecovery(null);
    if (!onStartGeneration) {
      setGenerationStartError('이 환경에서는 로컬 생성 잡을 시작할 수 없습니다.');
      setFailedRecovery(recovery);
      return;
    }
    setStartingGeneration(true);
    const progressId = beginProgress('condense-register');
    setChoices([]);
    try {
      await onStartGeneration({
        character: card,
        scene: retry ? recovery.scene : scene,
        arc: JSON.stringify(session.arc ?? {}),
        context: buildProjectContextDigest(project),
        transcript: retry
          ? retrySource!.transcript
          : buildCondenseTranscript(session, recovery.sourceSpan),
        episode: retry ? recovery.episode : episode,
        episodeLength,
        projectId: project.id,
        projectTitle: project.title,
        baseRevision: buildProjectRevision(project)
      }, recovery);
    } catch {
      setGenerationStartError('응결 잡을 시작하지 못했습니다. 아래에서 기록을 먼저 보존할 수 있습니다.');
      setFailedRecovery(recovery);
    } finally {
      setStartingGeneration(false);
      endProgress(progressId);
    }
  }

  function setScene(next: string) {
    onChange({ ...session, scene: next }, project);
  }

  async function askShowrunner() {
    if (!srInput.trim() || busy) return;
    if (!playAiEnabled) {
      setGenerationStartError(disabledReason);
      return;
    }
    const directive = srInput.trim();
    setSrInput('');
    setBusy(true);
    const progressId = beginProgress('showrunner');
    setChoices([]);
    try {
      const res = await requestDiveShowrunner({
        scene,
        context: buildProjectContextDigest(project),
        directive
      });
      setSrReply(res.reply || '…');
      setSrSceneUpdate(res.sceneUpdate || '');
    } catch {
      setSrReply('쇼러너 호출에 실패했어요. 다시 시도하세요.');
      setSrSceneUpdate('');
    } finally {
      setBusy(false);
      endProgress(progressId);
    }
  }

  function applySceneUpdate() {
    setScene(srSceneUpdate);
    setSrSceneUpdate('');
    setSrReply(null);
  }

  function approve() {
    if (!pending) return;
    const resumeCheckpoint = pendingGenerationId === selectedGeneration?.id
      ? selectedGeneration.approvedCondenseCheckpoint
      : undefined;
    const generationCondenseBoundary = pendingGenerationId === selectedGeneration?.id
      ? selectedSourceBoundary
      : undefined;
    if (pendingGenerationId && !resumeCheckpoint && generationCondenseBoundary === undefined) {
      setGenerationStartError('생성 당시 PLAY 원문과 현재 세션이 달라 이 결과를 승인할 수 없습니다. 결과는 보관함에 유지했습니다.');
      return;
    }
    // intent·pressure 는 의도적으로 빈 값 — 본문은 응결 payload 에서 오지, intent/pressure 로 생성하지 않는다.
    const request: ProductionRequest = {
      genre: project.genre,
      intent: '',
      pressure: '',
      ...(pendingEpisodeLength ? { episodeLength: pendingEpisodeLength } : {})
    };
    const promoted = buildPromotedFacts(deviations.surprises, decisions, edits, pending.newCanonFacts);
    const approvedRetcons: ApprovedCondenseRetcon[] = deviations.conflicts
      .filter((conflict) => retconDecisions[conflict.id] === 'retcon')
      .map((conflict) => ({
        factId: conflict.factId,
        previousStatement: conflict.oldCanon,
        statement: conflict.newClaim
      }));
    let updatedProject: SeriesProject;
    let chapter: Chapter;
    let retconsForCommit = approvedRetcons;
    if (resumeCheckpoint) {
      // PLAY/WRITE 부분 성공 뒤 재시작하면 project의 nextEpisodeNumber로 새 2화를 만들지 않는다.
      // 영수증에 먼저 남긴 exact resolved 회차·retcon을 App의 멱등 재개 게이트로 되돌린다.
      updatedProject = project;
      chapter = resumeCheckpoint.chapter;
      retconsForCommit = resumeCheckpoint.retcons;
    } else {
      // retcon 결정된 충돌은 옛 fact statement 를 새 전개로 교체한 project 위에 커밋.
      const base = applyRetcons(project, approvedRetcons.map((retcon) => ({
        factId: retcon.factId,
        statement: retcon.statement
      })));
      ({ updatedProject, chapter } = chapterFromDraftPayload(
        base,
        {
          title: pending.title,
          hook: pending.hook,
          outline: pending.outline,
          beats: pending.beats,
          prose: pending.prose,
          newCanonFacts: [...pending.newCanonFacts, ...promoted]
        },
        request
      ));
    }
    // chapterFromDraftPayload가 내부에서 commitChapter까지 수행 → updatedProject를 그대로 쓴다(이중 커밋 금지).
    const nextSession = resumeCheckpoint
      ? applyCondenseCheckpoint(
          session,
          resumeCheckpoint.sourceSpan ?? resumeCheckpoint.condensedThroughTurn
        )
      : generationCondenseBoundary !== undefined
        ? applyCondenseCheckpoint(session, generationCondenseBoundary)
        : applyCondenseResult(session);
    if (pendingGenerationId && onApproveGeneration) {
      // 성공 결과 승인은 App이 최신 본편과 충돌을 다시 확인하고 PLAY·WRITE를 함께 영속한다.
      // 충돌 검토나 저장 실패 동안에는 결과/영수증을 그대로 둬 재검토·재시도가 가능해야 한다.
      const resolution = onApproveGeneration({
        session: nextSession,
        sessionBeforeApproval: session,
        project: updatedProject,
        workingBeforeApproval: project,
        chapter,
        retcons: retconsForCommit,
        sourceSpan: resumeCheckpoint?.sourceSpan ?? selectedSourceSpan,
        generationId: pendingGenerationId
      });
      if (resolution !== 'committed') return;
    } else {
      // 구형/임베드 표면의 호환 경로도 작업본 저장 뒤에만 영수증을 정리한다.
      onChange(nextSession, updatedProject);
      if (pendingGenerationId) onResolveGeneration?.(pendingGenerationId);
    }
    setPending(null);
    setDecisions({});
    setEdits({});
    setRetconDecisions({});
    setFindings(null);
  }

  return (
    <div className="dx-desk">
      <header className="dx-head">
        <button className="dx-back" onClick={onBack}>← 뒤로</button>
        <span className="dx-title">{card}</span>
      </header>

      {(!playAiEnabled || !condenseJobsEnabled) && (
        <p className="dx-start-error" role="status">{disabledReason}</p>
      )}

      <div className="dx-scene">
        <label className="dx-scene-label">🎬 현재 장면</label>
        <textarea
          className="dx-scene-input"
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          placeholder="장소·상황·내 목적을 적어 장면을 깔아보세요 (비우면 일상 대화)"
          rows={2}
        />
        <button className="dx-sr-toggle" onClick={() => setSrOpen((v) => !v)}>🪄 쇼러너</button>
      </div>

      {session.arc?.dramaticQuestion && (
        <div className="dx-arc">🎯 {session.arc.dramaticQuestion}</div>
      )}

      {srOpen && (
        <div className="dx-showrunner-sheet">
          {srReply && <div className="dx-showrunner">{srReply}</div>}
          {srSceneUpdate && (
            <div className="dx-sr-update">
              <p className="dx-sr-update-text">현재 장면을 이렇게 바꿀까요? — {srSceneUpdate}</p>
              <button onClick={applySceneUpdate}>장면 교체</button>
              <button onClick={() => setSrSceneUpdate('')}>취소</button>
            </div>
          )}
          <div className="dx-sr-compose">
            <input
              className="dx-input"
              value={srInput}
              onChange={(e) => setSrInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); askShowrunner(); } }}
              placeholder="쇼러너에게 지시 (예: 비를 내려줘 · 도윤 엄마를 의심하게)"
              disabled={busy}
            />
            <button className="dx-send" onClick={askShowrunner} disabled={busy || !playAiEnabled}>지시</button>
            <span className="dx-sr-cost">· 포인트(추후)</span>
          </div>
        </div>
      )}

      {project.chapters.length > 0 && (
        <div className="dx-chronicle">
          <button className="dx-chronicle-toggle" onClick={() => setChronicleOpen((v) => !v)}>
            📖 지난 이야기 {project.chapters.length}화 {chronicleOpen ? '▾' : '▸'}
          </button>
          {chronicleOpen &&
            project.chapters.map((ch) => (
              <article key={ch.id} className="dx-chapter">
                <h4>{ch.episode}화 「{ch.title}」</h4>
                <p>{ch.prose}</p>
              </article>
            ))}
        </div>
      )}

      <div className="dx-chat">
        {session.chatBuffer.map((m) => (
          <Fragment key={m.id}>
            {m.id === continuityFirstMessageId && (
              <div className="dx-continuity-divider" role="separator">
                <span>지난 회차에서 이어지는 대화</span>
              </div>
            )}
            {m.role === 'user' ? (
              <div className="dx-bubble dx-user">{renderDialogue(m.text)}</div>
            ) : (
              (() => {
                const g = gutterClass(m.verdict);
                return (
                  <div
                    className={`dx-turn${g ? ` dx-has-gutter ${g}` : ''}`}
                    title={m.verdict && g ? peekText(m.verdict) : undefined}
                  >
                    {parseSceneSegments(m.text).map((seg, i) =>
                      seg.kind === 'narration' ? (
                        <div key={i} className="dx-narration">{renderDialogue(seg.text)}</div>
                      ) : (
                        <div key={i} className="dx-bubble dx-character">
                          <span className="dx-speaker">{seg.speaker}</span>
                          {renderDialogue(seg.text)}
                        </div>
                      )
                    )}
                  </div>
                );
              })()
            )}
          </Fragment>
        ))}
      </div>

      {choices.length > 0 && !busy && pending === null && input.trim() === '' && (
        <div className="dx-choice-suggestions">
          <span className="dx-choice-hint" id="dx-choice-hint">
            추천 답변 · 눌러 작성창에 담아 고치세요
          </span>
          <div className="dx-choices" role="group" aria-labelledby="dx-choice-hint">
            {choices.map((c, i) => (
              <button
                key={i}
                type="button"
                className="dx-choice-chip"
                title="작성창에 담아 고친 뒤 보냅니다"
                onClick={() => putChoiceInComposer(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {leakWarn && <div className="dx-leak">{leakWarn}</div>}
      {generationStartError && <div className="dx-generation-error" role="alert">{generationStartError}</div>}

      {inlineRecovery && (
        <aside className="dx-recovery" role="region" aria-labelledby="dx-recovery-title" aria-describedby="dx-recovery-description">
          <div className="dx-recovery-copy" role={inlineRecovery.needsImmediateDownload ? 'alert' : 'status'} aria-live={inlineRecovery.needsImmediateDownload ? 'assertive' : 'polite'}>
            <strong id="dx-recovery-title">
              {inlineRecovery.needsImmediateDownload
                ? 'PLAY 기록이 아직 보관함에 저장되지 않았습니다.'
                : '응결은 멈췄지만 PLAY 기록은 안전합니다.'}
            </strong>
            <span id="dx-recovery-description">
              {inlineRecovery.needsImmediateDownload
                ? `새로고침 전에 TXT를 먼저 받은 뒤 저장 공간을 확보해 주세요.${inlineRetryBlockedCopy ? ` ${inlineRetryBlockedCopy}` : ''}`
                : inlineRetryBlockedCopy
                  ? inlineRetryBlockedCopy
                  : '응결 원고는 만들어지지 않았습니다. 다시 시도하거나 PLAY 원문을 참고해 직접 쓸 수 있습니다.'}
            </span>
          </div>
          <div className="dx-recovery-actions">
            {!inlineRetryBlockedCopy && (
              <button
                type="button"
                className="is-retry"
                onClick={() => condense({ recovery: inlineRecovery.recovery, item: inlineRecovery.item })}
                disabled={busy || startingGeneration}
              >
                {startingGeneration ? '다시 등록 중…' : '응결 다시 시도'}
              </button>
            )}
            {onDownloadRecovery && (
              <button type="button" onClick={() => onDownloadRecovery(inlineRecovery.recovery)}>PLAY 기록 TXT</button>
            )}
            {onSendRecoveryToDraft && (
              <button
                type="button"
                className="is-write"
                onClick={() => onSendRecoveryToDraft(inlineRecovery.recovery, inlineRecovery.generationId)}
              >
                {inlineRecovery.hasRecoveryDraft ? '직접 쓰던 작업본 열기' : '원문으로 직접 쓰기'}
              </button>
            )}
            {onOpenGenerationInbox && (
              <button type="button" onClick={onOpenGenerationInbox}>생성 보관함</button>
            )}
          </div>
        </aside>
      )}

      {!activeGeneration && localProgresses.length === 0 && projectInboxCount > 0 && !inlineRecovery && (
        <aside
          className="dx-generation-receipt"
          aria-label="생성 보관함 상태"
          role={currentGenerationNeedsImmediateDownload ? 'alert' : undefined}
        >
          <div>
            <strong>{currentGenerationNeedsImmediateDownload
              ? '응결 결과 보관 필요'
              : `생성 보관함에 ${projectInboxCount}개`}</strong>
            <span>{currentGenerationNeedsImmediateDownload
              ? '응결 결과가 보관함에 저장되지 않았습니다. 새로고침 전에 결과를 검토하거나 TXT를 받아 주세요.'
              : '완료된 결과는 승인 전까지 작품에 반영되지 않습니다.'}</span>
          </div>
          <div className="dx-generation-actions">
            {currentGenerationNeedsImmediateDownload && currentEpisodeGeneration?.recovery && onDownloadRecovery && (
              <button type="button" onClick={() => onDownloadRecovery(currentEpisodeGeneration.recovery!)}>PLAY 기록 TXT</button>
            )}
            {onOpenGenerationInbox && <button type="button" onClick={onOpenGenerationInbox}>생성 보관함</button>}
          </div>
        </aside>
      )}

      {pending && (
        <div className="dx-approve" role="dialog">
          <h4>응결된 회차 — {pending.title}</h4>
          {pendingEpisodeLength && pendingLengthEvaluation ? (
            <p className={`dx-length-receipt is-${pendingLengthEvaluation.status}`}>
              {episodeLengthReceiptCopy(
                pendingEpisodeLength,
                pendingLengthEvaluation.actualChars,
                pendingLengthEvaluation.status
              )}
            </p>
          ) : (
            <p className="dx-length-receipt is-legacy">목표 기록 없음</p>
          )}
          {selectedGenerationIsStale && <p className="dx-stale-warning">이 결과를 만든 뒤 작품 기준이 바뀌었습니다. 승인 전에 정밀 검토와 캐논 후보를 다시 확인하세요.</p>}
          {pendingGenerationId && !selectedGeneration?.approvedCondenseCheckpoint && selectedSourceBoundary === undefined && (
            <p className="dx-stale-warning">생성 당시 PLAY 원문과 현재 세션이 달라 승인할 수 없습니다. 결과는 보관함에 안전하게 유지됩니다.</p>
          )}
          <p className="dx-approve-prose">{pending.prose}</p>
          <DeviationReview
            deviations={deviations}
            decisions={decisions}
            edits={edits}
            retconDecisions={retconDecisions}
            onToggle={(id) =>
              setDecisions((d) => ({ ...d, [id]: d[id] === 'promote' ? 'skip' : 'promote' }))
            }
            onEdit={(id, text) => setEdits((e) => ({ ...e, [id]: text }))}
            onRetconToggle={(id) =>
              setRetconDecisions((r) => ({ ...r, [id]: r[id] === 'retcon' ? 'keep' : 'retcon' }))
            }
          />
          <div className="dx-review-row">
            <button className="dx-review-btn" onClick={reviewConsolidation} disabled={reviewing || !playAiEnabled}>
              {reviewing ? '검토 중…' : '🔍 정밀 검토'}
            </button>
          </div>
          <ConsolidationFindings findings={findings} />
          <ul className="dx-approve-canon">
            {pending.newCanonFacts.map((f, i) => <li key={i}>+ {f.statement}</li>)}
          </ul>
          <div className="dx-approve-actions">
            <button
              onClick={approve}
              disabled={Boolean(
                pendingGenerationId &&
                !selectedGeneration?.approvedCondenseCheckpoint &&
                selectedSourceBoundary === undefined
              )}
            >
              {pendingLengthEvaluation && pendingLengthEvaluation.status !== 'within'
                ? `${formatEpisodeChars(pendingLengthEvaluation.actualChars)}자로 승인 — 캐논으로 고정`
                : '승인 — 캐논으로 고정'}
            </button>
            <button onClick={() => { setPending(null); setDecisions({}); setEdits({}); setRetconDecisions({}); setFindings(null); }}>보류 — 보관함에 유지</button>
          </div>
        </div>
      )}

      {(turnCounts.surprise > 0 || turnCounts.anchor > 0 || turnCounts.major > 0) && (
        <button
          className="dx-ambient"
          onClick={() => condense()}
          disabled={busy || !condenseJobsEnabled || pending !== null || !hasEnoughCondenseMaterial || inlineRecovery !== null}
        >
          {turnCounts.surprise > 0 && <span className="dx-amb-surprise">✦ 의외 전개 후보 {turnCounts.surprise}</span>}
          {turnCounts.major > 0 && <span className="dx-amb-major">🟡 경고 {turnCounts.major}</span>}
          {turnCounts.anchor > 0 && <span className="dx-amb-anchor">🔴 정본 충돌 {turnCounts.anchor}</span>}
          <span className="dx-amb-tail">응결 때 정리 →</span>
        </button>
      )}

      {vsReason && <div className="dx-vs-note">{vsReason}</div>}
      <VsCandidatePanel
        candidates={vsCandidates}
        onPick={pickCandidate}
        onDismiss={() => { setVsCandidates([]); setVsReason(null); }}
      />

      {hasEnoughCondenseMaterial && !activeGeneration && pending === null && !inlineRecovery && (
        <fieldset
          className="dx-condense-target"
          aria-describedby="dx-condense-target-help"
          disabled={startingGeneration}
        >
          <legend>회차 분량</legend>
          <div className="dx-condense-target-options">
            {EPISODE_LENGTH_OPTIONS.map((option) => (
              <label key={option.preset} className="dx-condense-target-option">
                <input
                  type="radio"
                  name="dx-episode-length"
                  value={option.preset}
                  checked={selectedEpisodeLength.preset === option.preset}
                  onChange={() => selectEpisodeLength(option.preset)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <p id="dx-condense-target-help">
            재료가 모자라면 짧게 돌아오며, 자동으로 내용을 만들거나 잘라내지 않습니다.
          </p>
          <button
            type="button"
            className="dx-condense-target-action"
            onClick={() => condense()}
            disabled={busy || startingGeneration || !condenseJobsEnabled}
          >
            {startingGeneration
              ? '잡 등록 중…'
              : `${episodeLengthTargetLabel(selectedEpisodeLength)}로 응결`}
          </button>
        </fieldset>
      )}

      <div className="dx-workbench-dock">
      {activeGeneration && (
        <aside
          className={`dx-generation-receipt${activeGeneration && !activeGeneration.localPersistenceFailed ? ' dx-progress-card is-condense' : ''}`}
          aria-label="생성 보관함 상태"
          role={currentGenerationNeedsImmediateDownload ? 'alert' : activeGeneration ? 'status' : undefined}
          aria-live={activeGeneration && !currentGenerationNeedsImmediateDownload ? 'polite' : undefined}
          aria-atomic={activeGeneration && !currentGenerationNeedsImmediateDownload ? 'true' : undefined}
        >
          {activeGeneration && !activeGeneration.localPersistenceFailed ? (
            <DiveProgressCopy
              kind="condense"
              elapsedSeconds={elapsedSecondsSince(activeGeneration.createdAt, progressClockNow)}
              label={activeEpisodeLength
                ? `${episodeLengthTargetLabel(activeEpisodeLength)} 목표 · ${episodeLengthSceneLabel(activeEpisodeLength)} 응결 중`
                : undefined}
            />
          ) : (
            <div>
              <strong>{activeGeneration?.localPersistenceFailed
                ? '응결 중 · PLAY 기록 보관 필요'
                : currentGenerationNeedsImmediateDownload
                  ? '응결 결과 보관 필요'
                  : '회차 응결'}</strong>
              {activeEpisodeLength && (
                <span>{episodeLengthTargetLabel(activeEpisodeLength)} 목표 · {episodeLengthSceneLabel(activeEpisodeLength)}</span>
              )}
              <span>{activeGeneration?.localPersistenceFailed
                ? '로컬 보관공간이 부족합니다. 새로고침 전에 TXT를 받아 주세요.'
                : currentGenerationNeedsImmediateDownload
                  ? '응결 결과가 보관함에 저장되지 않았습니다. 새로고침 전에 결과를 검토하거나 TXT를 받아 주세요.'
                  : '응결 작업을 계속 확인하고 있습니다.'}</span>
            </div>
          )}
          <div className="dx-generation-actions">
            {!condenseJobsEnabled && (
              <span className="dx-start-error">이 배포본에서는 상태 확인·취소를 하지 않으며 영수증과 PLAY 기록을 보존합니다.</span>
            )}
            {activeGeneration && onCancelGeneration && (
              <button
                type="button"
                disabled={!condenseJobsEnabled}
                onClick={() => { if (condenseJobsEnabled) onCancelGeneration(activeGeneration); }}
              >
                생성 취소
              </button>
            )}
            {currentGenerationNeedsImmediateDownload && currentEpisodeGeneration?.recovery && onDownloadRecovery && (
              <button type="button" onClick={() => onDownloadRecovery(currentEpisodeGeneration.recovery!)}>PLAY 기록 TXT</button>
            )}
            {onOpenGenerationInbox && <button type="button" onClick={onOpenGenerationInbox}>생성 보관함</button>}
          </div>
        </aside>
      )}

      {localProgresses.length > 0 && (
        <div className="dx-progress-stack">
          {localProgresses.map((progress) => (
            <DiveProgressCard key={progress.id} progress={progress} now={progressClockNow} />
          ))}
        </div>
      )}

      <div className="dx-composer">
        <textarea
          ref={composerRef}
          className="dx-input"
          aria-label="PLAY 답변 작성"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              // 한글 IME 조합 확정 Enter를 전송 Enter로 오인하지 않는다.
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              e.preventDefault();
              send();
            }
          }}
          placeholder="말을 걸어보세요 (Enter 전송 · Shift+Enter 줄바꿈)"
          disabled={busy || pending !== null}
          rows={1}
        />
        <button className="dx-send" onClick={() => send()} disabled={busy || !playAiEnabled || pending !== null}>보내기</button>
        <button className="dx-continue" onClick={() => send('(가만히 지켜본다. 시간이 잠시 흐른다.)')} disabled={busy || !playAiEnabled || pending !== null}>
          ⏳ 계속
        </button>
        <button className="dx-escalate" onClick={() => send('(이야기를 다음 국면으로 크게 밀어붙인다.)')} disabled={busy || !playAiEnabled || pending !== null}>
          ⏭ 전개
        </button>
        <button className="dx-vs-request" onClick={requestCandidates} disabled={busy || vsBusy || !playAiEnabled || pending !== null}>
          ✦ 전개 후보
        </button>
      </div>
      </div>
    </div>
  );
}
