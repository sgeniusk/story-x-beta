import { canRecoverGeneration, type GenerationInboxItem } from '../lib/generationInbox';

interface GenerationInboxPanelProps {
  items: GenerationInboxItem[];
  onReview: (item: GenerationInboxItem) => void;
  onCancel: (item: GenerationInboxItem) => void;
  onDiscard: (item: GenerationInboxItem) => void;
  onDownloadRecovery: (item: GenerationInboxItem) => void;
  onSendRecoveryToDraft: (item: GenerationInboxItem) => void;
}

const STATUS_LABEL: Record<GenerationInboxItem['status'], string> = {
  running: '생성 중',
  succeeded: '검토 대기',
  failed: '생성 실패',
  cancelled: '취소됨',
  'timed-out': '시간 초과',
  expired: '연결 만료'
};

export function GenerationInboxPanel({
  items,
  onReview,
  onCancel,
  onDiscard,
  onDownloadRecovery,
  onSendRecoveryToDraft
}: GenerationInboxPanelProps) {
  return (
    <section className="gix-panel" aria-labelledby="generation-inbox-title">
      <header className="gix-head">
        <div>
          <p className="gix-eyebrow">Generation inbox</p>
          <h2 id="generation-inbox-title">생성 보관함</h2>
        </div>
        <span className="gix-count">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <div className="gix-empty">
          <strong>완료된 회차가 이곳에 도착합니다.</strong>
          <span>PLAY를 떠나도 로컬 Codex 작업은 계속됩니다.</span>
        </div>
      ) : (
        <div className="gix-list">
          {items.map((item) => {
            const recoverable = canRecoverGeneration(item);
            const needsImmediateDownload = Boolean(item.localPersistenceFailed && item.recovery);
            const hasRecoveryDraft = Boolean(item.recoveryDraftOpenedAt && item.recoveryDraftId);
            const savedAsChapter = Boolean(item.recoveredAt && item.recoveredChapterId);
            const discard = () => {
              if (recoverable && !savedAsChapter && !window.confirm('이 항목을 지우면 Story X 보관함에서 다시 복구할 수 없습니다. 계속할까요?')) {
                return;
              }
              onDiscard(item);
            };
            return (
              <article key={item.id} className={`gix-item is-${item.status}`}>
                <div className="gix-item-copy">
                  <span className="gix-status">{STATUS_LABEL[item.status]}</span>
                  <h3>{item.result?.title || `${item.projectTitle} · ${item.episode}화`}</h3>
                  <p>{item.warning || `${item.projectTitle}에서 시작한 응결 작업`}</p>
                  {recoverable && (
                    <p className="gix-recovery-note" role="status">
                      {savedAsChapter
                        ? 'WRITE에서 회차로 저장했습니다. 캐논에는 자동 반영되지 않았습니다.'
                        : hasRecoveryDraft
                          ? 'WRITE에 복구 작업본이 있습니다. 아직 본편 회차나 캐논에 반영되지 않았습니다.'
                          : 'PLAY 기록은 안전합니다. WRITE에서 작업본을 열어도 본편 회차나 캐논에는 자동 반영되지 않습니다.'}
                    </p>
                  )}
                  {needsImmediateDownload && !recoverable && (
                    <p className="gix-recovery-note" role="alert">
                      로컬 보관공간이 부족합니다. 새로고침 전에 PLAY 기록 TXT를 먼저 받아 주세요.
                    </p>
                  )}
                </div>
                <div className="gix-actions">
                  {item.status === 'running' && <button type="button" onClick={() => onCancel(item)}>생성 취소</button>}
                  {item.status === 'succeeded' && item.result && <button type="button" className="is-primary" onClick={() => onReview(item)}>작품에서 검토</button>}
                  {(recoverable || needsImmediateDownload) && item.recovery && (
                    <>
                      <button type="button" onClick={() => onDownloadRecovery(item)}>PLAY 기록 TXT</button>
                      {recoverable && (
                        <button
                          type="button"
                          className="is-primary"
                          disabled={savedAsChapter}
                          onClick={() => onSendRecoveryToDraft(item)}
                        >
                          {savedAsChapter ? '회차로 저장됨' : hasRecoveryDraft ? '작업본 열기' : 'WRITE에서 이어쓰기'}
                        </button>
                      )}
                    </>
                  )}
                  {item.status !== 'running' && (
                    <button type="button" className="is-discard" onClick={discard}>
                      {savedAsChapter ? '보관함에서 지우기' : '폐기'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
