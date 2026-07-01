// 응결 스튜디오 — ✦ 의외 전개 후보 결정 카드 + 🔴 충돌 정보 배너. 순수 표현(상태는 props).
import type { ConsolidationDeviations } from '../lib/playRuntimeValidator';

interface DeviationReviewProps {
  deviations: ConsolidationDeviations;
  decisions: Record<string, 'skip' | 'promote'>;
  edits: Record<string, string>;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function DeviationReview({ deviations, decisions, edits, onToggle, onEdit }: DeviationReviewProps) {
  const { surprises, conflictCounts } = deviations;
  const conflictTotal = conflictCounts.anchor + conflictCounts.major;
  if (surprises.length === 0 && conflictTotal === 0) return null;
  return (
    <div className="dx-devreview">
      {conflictTotal > 0 && (
        <div className="dx-devbanner">🔴 이번 응결에서 정본 충돌 {conflictTotal}건은 캐논에서 빠졌습니다.</div>
      )}
      {surprises.length > 0 && (
        <div className="dx-devlist">
          <p className="dx-devlist-title">✦ 의외 전개 후보 — 굳힐 것만 승격</p>
          {surprises.map((c) => (
            <div key={c.id} className="dx-devcard">
              <input
                className="dx-devcard-input"
                value={edits[c.id] ?? c.snippet}
                onChange={(e) => onEdit(c.id, e.target.value)}
              />
              {c.relatedThread && <span className="dx-devcard-thread">떡밥 — {c.relatedThread}</span>}
              <button
                className={`dx-devcard-toggle${decisions[c.id] === 'promote' ? ' is-on' : ''}`}
                onClick={() => onToggle(c.id)}
              >
                {decisions[c.id] === 'promote' ? '승격됨' : '승격'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
