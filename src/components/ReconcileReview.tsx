// 융합 셸 B-2 — ⟳최신화 충돌 게이트 다이얼로그. working 새 주장 ↔ 본편 옛 정본 충돌을
// 교체(retcon)/유지(keep)로 승인. 순수 표현(상태는 props). 충돌 있을 때만 App 이 렌더.
import type { DeviationConflict } from '../lib/playRuntimeValidator';

interface ReconcileReviewProps {
  conflicts: DeviationConflict[];
  decisions: Record<string, 'keep' | 'retcon'>;
  onToggle: (id: string) => void;
  onApprove: () => void;
  onCancel: () => void;
}

export function ReconcileReview({ conflicts, decisions, onToggle, onApprove, onCancel }: ReconcileReviewProps) {
  const anchor = conflicts.filter((c) => c.band === 'anchor').length;
  const major = conflicts.filter((c) => c.band === 'major').length;
  return (
    <div className="rc-overlay" role="dialog" aria-modal="true">
      <div className="rc-panel">
        <p className="rc-title">⟳ 최신화 검토 — 본편과 충돌 {conflicts.length}건 (앵커 {anchor} · 중 {major})</p>
        <p className="rc-sub">PLAY에서 쌓은 주장이 본편 정본과 어긋납니다. 정본을 교체할지 고르세요. 기본은 유지(본편 보존).</p>
        <div className="rc-list">
          {conflicts.map((c) => {
            const on = decisions[c.id] === 'retcon';
            return (
              <div key={c.id} className={`rc-card${on ? ' is-on' : ''}`} data-band={c.band}>
                <span className="rc-card-new">{c.newClaim}</span>
                <span className="rc-card-old">↔ 옛 정본 — {c.oldCanon}</span>
                <button
                  className={`rc-card-toggle${on ? ' is-on' : ''}`}
                  data-action="reconcile-toggle"
                  onClick={() => onToggle(c.id)}
                >
                  {on ? '교체됨' : '정본 교체'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="rc-actions">
          <button className="rc-cancel" data-action="reconcile-cancel" onClick={onCancel}>취소</button>
          <button className="rc-approve" data-action="reconcile-approve" onClick={onApprove}>최신화 반영</button>
        </div>
      </div>
    </div>
  );
}
