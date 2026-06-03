// 캐논 카드 그리드 컴포넌트
import type { CanonEntity } from '../lib/storyEngine';
import { CanonStatusBadge } from './CanonStatusBadge';

// 장소·사물·사건 카드 그리드 — 캐논 엔티티를 읽고, 충돌이면 충돌 텍스트와 해결 진입점을 보여준다.
export function CanonCardGrid({
  entries,
  typeLabel,
  onResolveConflict
}: {
  entries: CanonEntity[];
  typeLabel: string;
  onResolveConflict: () => void;
}) {
  if (entries.length === 0) {
    return <p className="ex-beats-empty">아직 등록된 {typeLabel}이(가) 없습니다.</p>;
  }

  return (
    <div className="ex-canon-card-grid">
      {entries.map((entry) => (
        <article key={entry.id} className={`ex-canon-card ex-canon-card--${entry.status}`}>
          <header className="ex-canon-card-head">
            <span className="ex-canon-card-type">{typeLabel}</span>
            <h3>{entry.name}</h3>
            {entry.sub && <span className="ex-canon-card-sub">{entry.sub}</span>}
            <CanonStatusBadge status={entry.status} />
          </header>
          {entry.facts.length > 0 && (
            <ul className="ex-canon-card-facts">
              {entry.facts.map((fact, index) => (
                <li key={index}>{fact}</li>
              ))}
            </ul>
          )}
          {entry.status === 'conflict' && entry.conflict && (
            <div className="ex-canon-card-conflict">
              <span className="ex-canon-card-conflict-label">충돌</span>
              <p>{entry.conflict}</p>
              <button type="button" className="ex-canon-card-resolve" onClick={onResolveConflict}>
                캐논 원장에서 해결
              </button>
            </div>
          )}
          {entry.appearedIn.length > 0 && (
            <div className="ex-canon-card-where">
              <span>등장</span>
              {entry.appearedIn.map((where) => (
                <code key={where}>{where}</code>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
