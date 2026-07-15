import type { GenerationInboxItem } from '../lib/generationInbox';

interface GenerationInboxPanelProps {
  items: GenerationInboxItem[];
  onReview: (item: GenerationInboxItem) => void;
  onCancel: (item: GenerationInboxItem) => void;
  onDiscard: (item: GenerationInboxItem) => void;
}

const STATUS_LABEL: Record<GenerationInboxItem['status'], string> = {
  running: '생성 중',
  succeeded: '검토 대기',
  failed: '생성 실패',
  cancelled: '취소됨',
  'timed-out': '시간 초과',
  expired: '연결 만료'
};

export function GenerationInboxPanel({ items, onReview, onCancel, onDiscard }: GenerationInboxPanelProps) {
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
          {items.map((item) => (
            <article key={item.id} className={`gix-item is-${item.status}`}>
              <div className="gix-item-copy">
                <span className="gix-status">{STATUS_LABEL[item.status]}</span>
                <h3>{item.result?.title || `${item.projectTitle} · ${item.episode}화`}</h3>
                <p>{item.warning || `${item.projectTitle}에서 시작한 응결 작업`}</p>
              </div>
              <div className="gix-actions">
                {item.status === 'running' && <button type="button" onClick={() => onCancel(item)}>생성 취소</button>}
                {item.status === 'succeeded' && item.result && <button type="button" className="is-primary" onClick={() => onReview(item)}>작품에서 검토</button>}
                {item.status !== 'running' && <button type="button" onClick={() => onDiscard(item)}>폐기</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
