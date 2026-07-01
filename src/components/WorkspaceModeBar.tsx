// 융합 셸 상단 3모드 토글 — PLAY/WRITE/PLAN 을 같은 작품 위에서 왕복. 순수 표현(상태는 props).
export type WorkspaceMode = 'play' | 'write' | 'plan';

interface WorkspaceModeBarProps {
  mode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
  workTitle?: string;
}

const MODES: Array<{ id: WorkspaceMode; label: string; icon: string }> = [
  { id: 'play', label: 'PLAY', icon: '▶' },
  { id: 'write', label: 'WRITE', icon: '✎' },
  { id: 'plan', label: 'PLAN', icon: '◈' }
];

export function WorkspaceModeBar({ mode, onSelect, workTitle }: WorkspaceModeBarProps) {
  return (
    <div className="wm-bar">
      {workTitle && <span className="wm-title">{workTitle}</span>}
      <div className="wm-toggle">
        {MODES.map((m) => (
          <button
            key={m.id}
            data-mode={m.id}
            className={`wm-btn${mode === m.id ? ' is-active' : ''}`}
            onClick={() => onSelect(m.id)}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
