// 하단 얇은 메타 줄 — 좌(문단·글자수/캐논 요약)·우(저장 상태·AI 배지). 순수 표현(슬라이스 C epilogue 재배치).
import type { ReactNode } from 'react';

interface DeskMetaLineProps {
  left: string;
  rightSlot?: ReactNode;
}

export function DeskMetaLine({ left, rightSlot }: DeskMetaLineProps) {
  return (
    <div className="dm-line">
      <span className="dm-left">{left}</span>
      <span className="dm-right">{rightSlot}</span>
    </div>
  );
}
