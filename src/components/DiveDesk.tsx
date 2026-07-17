// Dive X 얇은 표면 — 채팅·응결 제안·승인 다이얼로그·연대기. 엔진은 재사용.
import { useMemo, useState } from 'react';
import type { SeriesProject, ProductionRequest } from '../lib/storyEngine';
import { chapterFromDraftPayload, buildProjectContextDigest, applyRetcons, nextEpisodeNumber } from '../lib/storyEngine';
import { inspectLeak } from '../lib/leakGate';
import {
  type DiveSession,
  CONDENSE_KEEP_RECENT,
  appendMessage,
  shouldSuggestCondense,
  buildCondenseTranscript,
  buildRecentDialogue,
  applyCondenseResult,
  parseSceneSegments,
  buildVsCandidatesInput,
  buildPlayDirectionSeed
} from '../lib/diveSession';
import { validatePlayTurn, deriveDeviationCandidates, buildPromotedFacts, buildRetconUpdates, type PlayTurnVerdict } from '../lib/playRuntimeValidator';
import { DeviationReview } from './DeviationReview';
import { requestDiveChat, requestDiveShowrunner, requestDiveConsolidate, type DiveCondenseJobRequest, type DiveCondensePayload, type ConsolidationFinding } from '../lib/diveClient';
import { ConsolidationFindings } from './ConsolidationFindings';
import { DIVE_SEED_CHARACTERS } from '../lib/diveSeedCharacters';
import { requestVsCandidates } from '../lib/vsCandidatesClient';
import { VsCandidatePanel } from './VsCandidatePanel';
import type { VsCandidate } from '../lib/episodeBriefing';
import { buildProjectRevision, canRecoverGeneration, findLatestGenerationAttempt, type GenerationInboxItem } from '../lib/generationInbox';
import { buildPlayRecoverySnapshot, type PlayRecoverySnapshot } from '../lib/playRecovery';

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
  onDownloadRecovery?: (recovery: PlayRecoverySnapshot) => void;
  onSendRecoveryToDraft?: (recovery: PlayRecoverySnapshot, generationId?: string) => void;
}

function characterCardText(project: SeriesProject, characterId: string): string {
  const c = project.characters.find((x) => x.id === characterId)
    ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === characterId)?.character;
  if (!c) return '';
  return `${c.name} — ${c.role}. 욕망: ${c.desire}. 말투: ${c.voiceRules.join(', ')}`;
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

export function DiveDesk({
  session, project, onChange, onBack, generationInbox = [], selectedGeneration = null,
  onStartGeneration, onCancelGeneration, onOpenGenerationInbox, onResolveGeneration,
  onDownloadRecovery, onSendRecoveryToDraft
}: DiveDeskProps) {
  const selectedResultBlocked = selectedGeneration?.result ? inspectLeak(selectedGeneration.result.prose).blocked : false;
  const [input, setInput] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<DiveCondensePayload | null>(() => selectedResultBlocked ? null : selectedGeneration?.result ?? null);
  const [pendingGenerationId] = useState<string | null>(() => !selectedResultBlocked && selectedGeneration?.result ? selectedGeneration.id : null);
  const [leakWarn] = useState<string | null>(() => selectedResultBlocked ? '본문에 프롬프트/AI 누수가 감지됐습니다. 이 결과는 승인할 수 없습니다.' : null);
  const [generationStartError, setGenerationStartError] = useState<string | null>(null);
  const [failedRecovery, setFailedRecovery] = useState<PlayRecoverySnapshot | null>(null);
  const [startingGeneration, setStartingGeneration] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const [srInput, setSrInput] = useState('');
  const [srReply, setSrReply] = useState<string | null>(null);
  const [srSceneUpdate, setSrSceneUpdate] = useState('');
  const [srBusy, setSrBusy] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const scene = session.scene ?? '';
  const card = useMemo(() => characterCardText(project, session.characterId), [project, session.characterId]);
  const charName = useMemo(() => {
    const c = project.characters.find((x) => x.id === session.characterId)
      ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === session.characterId)?.character;
    return c?.name ?? '상대';
  }, [project, session.characterId]);
  const suggest = shouldSuggestCondense(session);
  const episode = nextEpisodeNumber(project);
  // UI 갱신으로 영수증 배열 순서가 바뀌어도 현재 회차의 최신 생성 시도 하나만 PLAY를 대표해야
  // 재시도 성공 뒤 과거 실패가 되살아나거나 지난 회차 실패를 다시 실행하지 않는다.
  const currentEpisodeGeneration = findLatestGenerationAttempt(generationInbox, project.id, episode);
  const activeGeneration = currentEpisodeGeneration?.status === 'running' ? currentEpisodeGeneration : null;
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
    ? { recovery: failedRecovery, generationId: undefined, hasRecoveryDraft: false, needsImmediateDownload: false }
    : recoverableGeneration?.recovery
      ? {
          recovery: recoverableGeneration.recovery,
          generationId: recoverableGeneration.id,
          hasRecoveryDraft: Boolean(recoverableGeneration.recoveryDraftOpenedAt && recoverableGeneration.recoveryDraftId),
          needsImmediateDownload: Boolean(recoverableGeneration.localPersistenceFailed)
        }
      : null;
  const selectedGenerationIsStale = Boolean(selectedGeneration && selectedGeneration.baseRevision !== buildProjectRevision(project));
  const turnCounts = useMemo(() => {
    let surprise = 0, anchor = 0, major = 0;
    for (const m of session.chatBuffer) {
      const v = m.verdict;
      if (!v) continue;
      surprise += v.surpriseCandidates.length;
      anchor += v.conflicts.filter((c) => c.band === 'anchor').length;
      major += v.conflicts.filter((c) => c.band === 'major').length;
    }
    return { surprise, anchor, major };
  }, [session.chatBuffer]);
  const [decisions, setDecisions] = useState<Record<string, 'skip' | 'promote'>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [retconDecisions, setRetconDecisions] = useState<Record<string, 'keep' | 'retcon'>>({});
  const deviations = useMemo(() => deriveDeviationCandidates(session), [session]);
  const [findings, setFindings] = useState<ConsolidationFinding[] | null>(null);
  const [reviewing, setReviewing] = useState(false);
  // VS 전개 후보 — opt-in 버튼으로만 생성. 기존 res.choices 가벼운 칩과 공존.
  const [vsCandidates, setVsCandidates] = useState<VsCandidate[]>([]);
  const [vsBusy, setVsBusy] = useState(false);
  const [vsReason, setVsReason] = useState<string | null>(null);

  async function reviewConsolidation() {
    if (!pending || reviewing) return;
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
    if (textArg === undefined) setInput('');
    setBusy(true);
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
    }
  }

  // ✦ 전개 후보 — 명시 버튼 opt-in. 라이브 상태를 VS 입력으로 조립해 후보 다발을 1회 생성. 실패는 안내로 강등.
  async function requestCandidates() {
    if (busy || vsBusy || pending !== null) return;
    setVsBusy(true);
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
    }
  }

  // 후보 선택 → 괄호 연출로 굴림(⏭전개과 같은 계열). 패널은 닫는다.
  function pickCandidate(direction: string) {
    setVsCandidates([]);
    setVsReason(null);
    send(buildPlayDirectionSeed(direction));
  }

  async function condense() {
    if (busy || startingGeneration || activeGeneration) return;
    const recovery = buildPlayRecoverySnapshot(session, project);
    setGenerationStartError(null);
    setFailedRecovery(null);
    if (!onStartGeneration) {
      setGenerationStartError('이 환경에서는 로컬 생성 잡을 시작할 수 없습니다.');
      setFailedRecovery(recovery);
      return;
    }
    setStartingGeneration(true);
    setChoices([]);
    try {
      await onStartGeneration({
        character: card,
        scene,
        arc: JSON.stringify(session.arc ?? {}),
        context: buildProjectContextDigest(project),
        transcript: buildCondenseTranscript(session),
        episode,
        projectId: project.id,
        projectTitle: project.title,
        baseRevision: buildProjectRevision(project)
      }, recovery);
    } catch {
      setGenerationStartError('응결 잡을 시작하지 못했습니다. 아래에서 기록을 먼저 보존할 수 있습니다.');
      setFailedRecovery(recovery);
    } finally {
      setStartingGeneration(false);
    }
  }

  function setScene(next: string) {
    onChange({ ...session, scene: next }, project);
  }

  async function askShowrunner() {
    if (!srInput.trim() || busy) return;
    const directive = srInput.trim();
    setSrInput('');
    setBusy(true);
    setSrBusy(true);
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
      setSrBusy(false);
    }
  }

  function applySceneUpdate() {
    setScene(srSceneUpdate);
    setSrSceneUpdate('');
    setSrReply(null);
  }

  function approve() {
    if (!pending) return;
    // intent·pressure 는 의도적으로 빈 값 — 본문은 응결 payload 에서 오지, intent/pressure 로 생성하지 않는다.
    const request: ProductionRequest = { genre: project.genre, intent: '', pressure: '' };
    const promoted = buildPromotedFacts(deviations.surprises, decisions, edits, pending.newCanonFacts);
    // retcon 결정된 충돌은 옛 fact statement 를 새 전개로 교체한 project 위에 커밋.
    const base = applyRetcons(project, buildRetconUpdates(deviations.conflicts, retconDecisions));
    const { updatedProject } = chapterFromDraftPayload(
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
    );
    // chapterFromDraftPayload가 내부에서 commitChapter까지 수행 → updatedProject를 그대로 쓴다(이중 커밋 금지).
    setPending(null);
    setDecisions({});
    setEdits({});
    setRetconDecisions({});
    setFindings(null);
    if (pendingGenerationId) onResolveGeneration?.(pendingGenerationId);
    onChange(applyCondenseResult(session), updatedProject);
  }

  return (
    <div className="dx-desk">
      <header className="dx-head">
        <button className="dx-back" onClick={onBack}>← 뒤로</button>
        <span className="dx-title">{card}</span>
      </header>

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
            <button className="dx-send" onClick={askShowrunner} disabled={busy}>지시</button>
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
        {session.chatBuffer.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="dx-bubble dx-user">{renderDialogue(m.text)}</div>
          ) : (
            (() => {
              const g = gutterClass(m.verdict);
              return (
                <div
                  key={m.id}
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
          )
        )}
      </div>

      {choices.length > 0 && !busy && pending === null && (
        <div className="dx-choices">
          {choices.map((c, i) => (
            <button key={i} className="dx-choice-chip" onClick={() => send(c)}>{c}</button>
          ))}
        </div>
      )}

      {suggest && !pending && (
        <button className="dx-condense-chip" onClick={condense} disabled={busy}>
          이 장면을 한 회차로 응결할까요?
        </button>
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
                ? '새로고침 전에 TXT를 먼저 받은 뒤 저장 공간을 확보해 주세요.'
                : '응결 원고는 만들어지지 않았습니다. 다시 시도하거나 PLAY 원문을 참고해 직접 쓸 수 있습니다.'}
            </span>
          </div>
          <div className="dx-recovery-actions">
            <button type="button" className="is-retry" onClick={condense} disabled={busy || startingGeneration}>
              {startingGeneration ? '다시 등록 중…' : '응결 다시 시도'}
            </button>
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

      {(activeGeneration || (projectInboxCount > 0 && !inlineRecovery)) && (
        <aside
          className="dx-generation-receipt"
          aria-label="생성 보관함 상태"
          role={currentGenerationNeedsImmediateDownload ? 'alert' : undefined}
        >
          <div>
            <strong>{activeGeneration?.localPersistenceFailed
              ? '응결 중 · PLAY 기록 보관 필요'
              : currentGenerationNeedsImmediateDownload
                ? '응결 결과 보관 필요'
                : activeGeneration
                  ? '백그라운드에서 응결 중'
                  : `생성 보관함에 ${projectInboxCount}개`}</strong>
            <span>{activeGeneration?.localPersistenceFailed
              ? '로컬 보관공간이 부족합니다. 새로고침 전에 TXT를 받아 주세요.'
              : currentGenerationNeedsImmediateDownload
                ? '응결 결과가 보관함에 저장되지 않았습니다. 새로고침 전에 결과를 검토하거나 TXT를 받아 주세요.'
                : activeGeneration
                  ? '화면을 떠나도 로컬 Codex가 계속 작업합니다.'
                  : '완료된 결과는 승인 전까지 작품에 반영되지 않습니다.'}</span>
          </div>
          <div className="dx-generation-actions">
            {activeGeneration && onCancelGeneration && <button type="button" onClick={() => onCancelGeneration(activeGeneration)}>생성 취소</button>}
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
          {selectedGenerationIsStale && <p className="dx-stale-warning">이 결과를 만든 뒤 작품 기준이 바뀌었습니다. 승인 전에 정밀 검토와 캐논 후보를 다시 확인하세요.</p>}
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
            <button className="dx-review-btn" onClick={reviewConsolidation} disabled={reviewing}>
              {reviewing ? '검토 중…' : '🔍 정밀 검토'}
            </button>
          </div>
          <ConsolidationFindings findings={findings} />
          <ul className="dx-approve-canon">
            {pending.newCanonFacts.map((f, i) => <li key={i}>+ {f.statement}</li>)}
          </ul>
          <div className="dx-approve-actions">
            <button onClick={approve}>승인 — 캐논으로 고정</button>
            <button onClick={() => { setPending(null); setDecisions({}); setEdits({}); setRetconDecisions({}); setFindings(null); }}>보류 — 보관함에 유지</button>
          </div>
        </div>
      )}

      {busy && (
        <div className="dx-status">
          {srBusy ? '쇼러너가 연출 중…' : `${charName} 입력 중…`}
        </div>
      )}

      {(turnCounts.surprise > 0 || turnCounts.anchor > 0 || turnCounts.major > 0) && (
        <button
          className="dx-ambient"
          onClick={condense}
          disabled={busy || pending !== null || session.chatBuffer.length <= CONDENSE_KEEP_RECENT}
        >
          {turnCounts.surprise > 0 && <span className="dx-amb-surprise">✦ 의외 전개 후보 {turnCounts.surprise}</span>}
          {turnCounts.major > 0 && <span className="dx-amb-major">🟡 경고 {turnCounts.major}</span>}
          {turnCounts.anchor > 0 && <span className="dx-amb-anchor">🔴 정본 충돌 {turnCounts.anchor}</span>}
          <span className="dx-amb-tail">응결 때 정리 →</span>
        </button>
      )}

      {vsBusy && <div className="dx-status">전개 후보를 펼치는 중… 잠시만요.</div>}
      {vsReason && <div className="dx-vs-note">{vsReason}</div>}
      <VsCandidatePanel
        candidates={vsCandidates}
        onPick={pickCandidate}
        onDismiss={() => { setVsCandidates([]); setVsReason(null); }}
      />

      <div className="dx-composer">
        <textarea
          className="dx-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="말을 걸어보세요 (Enter 전송 · Shift+Enter 줄바꿈)"
          disabled={busy || pending !== null}
          rows={1}
        />
        <button className="dx-send" onClick={() => send()} disabled={busy || pending !== null}>보내기</button>
        <button className="dx-condense-manual" onClick={condense} disabled={busy || startingGeneration || activeGeneration !== null || pending !== null || session.chatBuffer.length <= CONDENSE_KEEP_RECENT}>
          {startingGeneration ? '잡 등록 중…' : activeGeneration ? '응결 진행 중' : '지금 응결'}
        </button>
        <button className="dx-continue" onClick={() => send('(가만히 지켜본다. 시간이 잠시 흐른다.)')} disabled={busy || pending !== null}>
          ⏳ 계속
        </button>
        <button className="dx-escalate" onClick={() => send('(이야기를 다음 국면으로 크게 밀어붙인다.)')} disabled={busy || pending !== null}>
          ⏭ 전개
        </button>
        <button className="dx-vs-request" onClick={requestCandidates} disabled={busy || vsBusy || pending !== null}>
          ✦ 전개 후보
        </button>
      </div>
    </div>
  );
}
