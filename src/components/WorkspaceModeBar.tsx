// 융합 셸 상단 3모드 토글 — PLAY/WRITE/PLAN 을 같은 작품 위에서 왕복. 순수 표현(상태는 props).
import type { ReactNode } from 'react';

export type WorkspaceMode = 'play' | 'write' | 'plan';

interface WorkspaceModeBarProps {
  mode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
  workTitle?: string;
  // 슬라이스 C — 단일 바 슬롯. titleSlot=편집 가능한 제목(있으면 workTitle 대체) ·
  // contextSlot=모드 컨텍스트(WRITE 회차 픽커/PLAN 캐논 요약) · planBadge=캐논 충돌 수(위험 가시성).
  titleSlot?: ReactNode;
  contextSlot?: ReactNode;
  planBadge?: number;
  // 공통 셸 — PLAN 충돌 유무를 점 하나로. 숫자(planBadge)를 대체하는 축소형 표시(App 이 콜백 count>0 로 준다).
  planDot?: boolean;
  // 슬라이스 B — 상단 바 우측에 싱크 콘솔 등을 한 줄로 통합(이중 헤더 방지).
  rightSlot?: ReactNode;
}

const MODES: Array<{ id: WorkspaceMode; label: string; icon: string }> = [
  { id: 'play', label: 'PLAY', icon: '▶' },
  { id: 'write', label: 'WRITE', icon: '✎' },
  { id: 'plan', label: 'PLAN', icon: '◈' }
];

export function WorkspaceModeBar({
  mode,
  onSelect,
  workTitle,
  titleSlot,
  contextSlot,
  planBadge,
  planDot,
  rightSlot
}: WorkspaceModeBarProps) {
  return (
    <div className="wm-bar">
      {titleSlot ?? (workTitle ? <span className="wm-title">{workTitle}</span> : null)}
      {contextSlot}
      <div className="wm-toggle">
        {MODES.map((m) => (
          <button
            key={m.id}
            data-mode={m.id}
            className={`wm-btn${mode === m.id ? ' is-active' : ''}`}
            onClick={() => onSelect(m.id)}
          >
            {m.icon} {m.label}
            {m.id === 'plan' && planBadge ? <span className="wm-badge">{planBadge}</span> : null}
            {m.id === 'plan' && planDot ? <span className="wm-plan-dot" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      {rightSlot}
    </div>
  );
}
