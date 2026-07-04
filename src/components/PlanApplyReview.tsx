// PLAN 설계 반영 충돌 검토 — 본편이 그 사이 바뀐 패치만 keep/apply 결정. 순수 표현. spec 2026-07-04.
import type { PlanConflict } from '../lib/planStage';

interface PlanApplyReviewProps {
  conflicts: PlanConflict[];
  decisions: Record<string, 'keep' | 'apply'>;
  onToggle: (key: string, decision: 'keep' | 'apply') => void;
  onApprove: () => void;
  onCancel: () => void;
}

export function PlanApplyReview({ conflicts, decisions, onToggle, onApprove, onCancel }: PlanApplyReviewProps) {
  return (
    <div className="rc-overlay" role="dialog" aria-modal="true">
      <div className="rc-panel">
        <p className="rc-title">설계 반영 검토 — 본편이 그 사이 바뀐 항목 {conflicts.length}건</p>
        <p className="rc-sub">기본은 본편 유지입니다. 내 설계로 덮을 항목만 선택하세요.</p>
        <div className="rc-list">
          {conflicts.map((conflict) => {
            const decision = decisions[conflict.key] ?? 'keep';
            const on = decision === 'apply';
            return (
              <div key={conflict.key} className={`rc-card${on ? ' is-on' : ''}`}>
                <span className="rc-card-new">{conflict.label} — 내 설계: {conflict.after}</span>
                <span className="rc-card-old">↔ 지금 본편 — {conflict.committedValue}</span>
                <button
                  className={`rc-card-toggle${on ? ' is-on' : ''}`}
                  data-action="plan-apply-toggle"
                  onClick={() => onToggle(conflict.key, on ? 'keep' : 'apply')}
                >
                  {on ? '내 설계로' : '본편 유지'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="rc-actions">
          <button className="rc-cancel" data-action="plan-apply-cancel" onClick={onCancel}>취소</button>
          <button className="rc-approve" data-action="plan-apply-approve" onClick={onApprove}>반영</button>
        </div>
      </div>
    </div>
  );
}
