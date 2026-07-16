import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { PlayRecoveryWorkDraft } from '../lib/playRecovery';

export type RecoveryDraftSaveStatus = 'saved' | 'saving' | 'error';

export interface RecoveryDraftWorkspaceProps {
  draft: PlayRecoveryWorkDraft;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onCommit: () => void | Promise<void>;
  onBack: () => void;
  saveStatus?: RecoveryDraftSaveStatus;
  saveError?: string | null;
  /** 본편과 PLAY 작업본이 갈라진 경우처럼 상위 저장 게이트가 닫혀 있을 때 사용한다. */
  commitDisabled?: boolean;
}

const SAVE_STATUS_COPY: Record<Exclude<RecoveryDraftSaveStatus, 'error'>, string> = {
  saved: '작업본 저장됨',
  saving: '작업본 저장 중…'
};

/**
 * PLAY 실패 기록을 본편 Chapter와 분리해 다듬는 전용 WRITE 작업실.
 * source는 참고 패널에만 렌더하고, 원고 입력은 draft.title/body만 사용한다.
 */
export function RecoveryDraftWorkspace({
  draft,
  onTitleChange,
  onBodyChange,
  onCommit,
  onBack,
  saveStatus = 'saved',
  saveError,
  commitDisabled = false
}: RecoveryDraftWorkspaceProps) {
  const committingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const commitButtonRef = useRef<HTMLButtonElement>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState('');
  const hasBody = draft.body.trim().length > 0;
  const isFinalizingCommit = Boolean(draft.commitIntent);
  const sourceTranscript = draft.source.transcript.trim() || '(대화 기록 없음)';
  const visibleError = commitError || saveError || (saveStatus === 'error'
    ? '작업본을 저장하지 못했습니다. 입력한 내용은 이 화면에 남아 있습니다.'
    : '');

  useEffect(() => {
    if (isFinalizingCommit) commitButtonRef.current?.focus();
    else titleInputRef.current?.focus();
  }, [draft.id, isFinalizingCommit]);

  function keepTitleEnterInsideField(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    // 한국어 IME 확정 Enter와 일반 Enter 모두 명시 저장으로 해석하지 않는다.
    event.preventDefault();
  }

  async function commit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasBody || commitDisabled || committingRef.current) return;

    committingRef.current = true;
    setIsCommitting(true);
    setCommitError('');
    try {
      await onCommit();
    } catch (error) {
      setCommitError(error instanceof Error && error.message
        ? error.message
        : '회차로 저장하지 못했습니다. 작업본은 그대로 보존했습니다.');
    } finally {
      committingRef.current = false;
      setIsCommitting(false);
    }
  }

  return (
    <div className="fc-app fc-recovery" id="fc-recovery-app">
      <div className="canvas fc-recovery-canvas">
        <div className="fc-recovery-banner" data-recovery-banner>
          복구 작업본 · 아직 본편 아님
        </div>

        <div className="deck fc-recovery-deck">
          <article className="sheet fc-recovery-sheet" aria-labelledby="fc-recovery-title">
            <div className="ep-kicker">
              <span>WRITE · 복구 작업본</span>
              <span className="line" />
              <span>{draft.body.length.toLocaleString('ko-KR')}자</span>
            </div>

            <p className="fc-recovery-project">{draft.source.projectTitle} · 당시 {draft.episodeHint}화</p>
            <h1 className="ep-title" id="fc-recovery-title">PLAY에서 이어 쓰기</h1>
            <p className="ep-sub">원문은 옆의 참고 패널에 보존되어 있습니다. 여기에는 작품으로 남길 문장만 써 주세요.</p>

            <form className="fc-recovery-form" onSubmit={commit}>
              <label className="fc-recovery-field">
                <span>회차 제목 <small>선택</small></span>
                <input
                  ref={titleInputRef}
                  type="text"
                  aria-label="복구 작업본 제목"
                  value={draft.title}
                  placeholder={`${draft.episodeHint}화`}
                  readOnly={isFinalizingCommit}
                  onKeyDown={keepTitleEnterInsideField}
                  onChange={(event) => onTitleChange(event.target.value)}
                />
              </label>

              <label className="fc-recovery-field fc-recovery-body-field">
                <span>작업 본문</span>
                <textarea
                  className="fc-recovery-body"
                  aria-label="복구 작업 본문"
                  aria-describedby="fc-recovery-impact"
                  value={draft.body}
                  placeholder="PLAY 원문을 참고해 첫 문장을 써보세요"
                  rows={18}
                  readOnly={isFinalizingCommit}
                  onChange={(event) => onBodyChange(event.target.value)}
                />
              </label>

              <div className="fc-recovery-save-line" aria-live="polite">
                {saveStatus !== 'error' && (
                  <span className={`fc-recovery-save-state is-${saveStatus}`} role="status">
                    {SAVE_STATUS_COPY[saveStatus]}
                  </span>
                )}
                {visibleError && <p className="fc-recovery-error" role="alert">{visibleError}</p>}
              </div>

              <div className="fc-sheet-cta fc-recovery-actions">
                <button
                  ref={commitButtonRef}
                  type="submit"
                  className="btn-primary"
                  disabled={!hasBody || commitDisabled || isCommitting}
                  aria-busy={isCommitting}
                >
                  {isCommitting
                    ? isFinalizingCommit ? '저장 마무리 중…' : '회차로 저장 중…'
                    : isFinalizingCommit ? '저장 마무리' : '회차로 저장'}
                </button>
                <button
                  type="button"
                  className="btn-confirm-lock"
                  disabled={saveStatus === 'error' || isCommitting || isFinalizingCommit}
                  onClick={onBack}
                >
                  본편으로 돌아가기
                </button>
                <p className="fc-recovery-impact" id="fc-recovery-impact">
                  {isFinalizingCommit
                    ? '회차 저장이 일부 완료되어 안전하게 마무리하는 중입니다. 중복 회차는 만들지 않습니다.'
                    : '회차로 저장할 때만 본편 회차와 작품 지표에 반영됩니다. PLAY 원문과 복구 안내는 본문에 들어가지 않습니다.'}
                </p>
              </div>
            </form>
          </article>

          <aside className="fc-recovery-source" aria-label="PLAY 원문 참고">
            <details>
              <summary>PLAY 원문 보기</summary>
              <div className="fc-recovery-source-meta">
                <span>장면 · {draft.source.scene.trim() || '미지정'}</span>
                <time dateTime={draft.source.capturedAt}>보존 · {draft.source.capturedAt}</time>
              </div>
              <pre tabIndex={0} aria-label="보존된 PLAY 원문">{sourceTranscript}</pre>
            </details>
          </aside>
        </div>
      </div>
    </div>
  );
}
