import { CanonDelta } from '../lib/marginReview';

interface Props {
  deltas: CanonDelta[];
  onResolve: () => void;
}

/**
 * 회차 종료 후 마진 column 가장 아래에 떠오르는 카드.
 * canon-librarian 이 본문을 다시 읽고 정리한 캐논 변경 후보.
 * - kind 'added'   → +  (확정 추가)
 * - kind 'pending' → ?  (결정 필요, 호박색)
 */
export function CanonSummaryCard({ deltas, onResolve }: Props) {
  return (
    <div className="sx-canon-card">
      <div className="sx-canon-card__title">이 회차에서 정리된 캐논</div>
      <div className="sx-canon-card__sub">
        회차 종료 시 캐논 사서가 본문을 다시 읽고 정리합니다
      </div>

      {deltas.map((d, i) => (
        <div
          key={i}
          className={`sx-canon-card__delta ${d.kind === 'pending' ? 'is-pending' : ''}`}
        >
          <span className="sx-canon-card__sym">
            {d.kind === 'pending' ? '?' : '+'}
          </span>
          <span>
            <span className="sx-canon-card__label">{d.label}</span>
            <span className="sx-canon-card__source">{d.source}</span>
          </span>
        </div>
      ))}

      <button
        type="button"
        className="sx-btn"
        style={{ marginTop: 12, width: '100%', justifyContent: 'center', padding: '7px', fontSize: '11.5px' }}
        onClick={onResolve}
      >
        캐논 사서에게 정리 부탁
      </button>
    </div>
  );
}
