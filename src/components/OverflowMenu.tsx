// 상단 바 우측 ⋯ 메뉴 — 출간·JSON 내보내기/가져오기 등 저빈도 액션 수납(슬라이스 C 미니멀 재배치).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface OverflowMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  /** 메뉴와 함께 렌더할 숨은 요소 — 예: 가져오기 hidden file input. */
  children?: ReactNode;
}

export function OverflowMenu({ items, children }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <div className="om-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`om-toggle${isOpen ? ' is-open' : ''}`}
        aria-label="더 보기"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((v) => !v)}
      >
        ⋯
      </button>
      {isOpen && (
        <div className="om-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-item={item.id}
              onClick={() => {
                item.onSelect();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
