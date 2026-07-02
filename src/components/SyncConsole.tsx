// 융합 셸 싱크 콘솔 — PLAY working 미반영 누적 배지 + ⟳최신화 버튼. 순수 표현(상태는 props).
import type { PendingSync } from '../lib/syncConsole';

interface SyncConsoleProps {
  pending: PendingSync;
  onReconcile: () => void;
}

export function SyncConsole({ pending, onReconcile }: SyncConsoleProps) {
  if (pending.total <= 0) {
    return null;
  }
  return (
    <div className="sync-console">
      <span className="sync-pending">
        <span className="sync-dot" />▶ PLAY +{pending.total}
      </span>
      <button className="sync-update" data-action="reconcile" onClick={onReconcile}>
        ⟳ 최신화
      </button>
    </div>
  );
}
