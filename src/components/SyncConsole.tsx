// 융합 셸 싱크 콘솔 — PLAY working 미반영 배지 + ⟳최신화, PLAN staged 패치 배지 + 반영/버리기 메뉴.
import { useState } from 'react';
import type { PendingSync } from '../lib/syncConsole';

interface SyncConsoleProps {
  pending: PendingSync;
  onReconcile: () => void;
  planPending?: number;
  onPlanApply?: () => void;
  onPlanDiscard?: () => void;
}

export function SyncConsole({ pending, onReconcile, planPending = 0, onPlanApply, onPlanDiscard }: SyncConsoleProps) {
  const [isPlanMenuOpen, setPlanMenuOpen] = useState(false);
  if (pending.total <= 0 && planPending <= 0) {
    return null;
  }
  return (
    <div className="sync-console">
      {pending.total > 0 && (
        <>
          <span className="sync-pending">
            <span className="sync-dot" />▶ PLAY +{pending.total}
          </span>
          <button className="sync-update" data-action="reconcile" onClick={onReconcile}>
            ⟳ 최신화
          </button>
        </>
      )}
      {planPending > 0 && (
        <span className="sync-plan-wrap" onKeyDown={(e) => e.key === 'Escape' && setPlanMenuOpen(false)}>
          <button className="sync-plan-badge" data-action="plan-menu" onClick={() => setPlanMenuOpen((v) => !v)}>
            ✦ PLAN +{planPending}
          </button>
          {isPlanMenuOpen && (
            <span className="sync-plan-menu" role="menu">
              <button data-action="plan-apply" onClick={() => { setPlanMenuOpen(false); onPlanApply?.(); }}>
                ⟳ 본편에 반영 ({planPending}건)
              </button>
              <button data-action="plan-discard" onClick={() => { setPlanMenuOpen(false); onPlanDiscard?.(); }}>
                ✕ 전부 버리기
              </button>
            </span>
          )}
        </span>
      )}
    </div>
  );
}
