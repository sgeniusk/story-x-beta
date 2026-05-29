import { useEffect, useRef, useState, useCallback, MouseEvent } from 'react';
import { PixelAvatar } from './PixelAvatar';
import { CORE_PERSONAS } from '../lib/extendedPersonas';
import type { ParagraphAnchor, SummonHandler } from '../lib/marginReview';

interface Props {
  /**
   * 본문 selection 이 일어나는 contentEditable 컨테이너의 ref.
   * MentionBar 가 이 안의 selection 만 추적한다.
   */
  manuscriptRef: React.RefObject<HTMLElement>;
  onSummon: SummonHandler;
}

interface SelState {
  text: string;
  /** manuscriptRef 기준 (px) */
  left: number;
  top: number;
  anchor: ParagraphAnchor | undefined;
}

/**
 * 본문 텍스트를 드래그하면 떠오르는 @부르기 바.
 * 클릭하면 코어 5명 중 한 명만 호출 (확장은 ⌘K Spotlight 에서).
 */
export function MentionBar({ manuscriptRef, onSummon }: Props) {
  const [sel, setSel] = useState<SelState | null>(null);
  const [summoning, setSummoning] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler() {
      const root = manuscriptRef.current;
      if (!root) {
        setSel(null);
        return;
      }
      const selObj = window.getSelection();
      if (!selObj || selObj.isCollapsed) {
        setSel(null);
        return;
      }
      const node = selObj.anchorNode;
      if (!node || !root.contains(node)) {
        setSel(null);
        return;
      }
      const range = selObj.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const parentRect = root.getBoundingClientRect();
      if (rect.width < 4) {
        setSel(null);
        return;
      }
      // anchor 단락 id 찾기
      let n: Node | null = node;
      while (n && (n as HTMLElement).nodeType !== 1) n = (n as Node).parentNode;
      let anchor: string | undefined;
      while (n) {
        const el = n as HTMLElement;
        if (el.dataset && el.dataset.pid) {
          anchor = el.dataset.pid;
          break;
        }
        n = el.parentNode;
      }
      setSel({
        text: selObj.toString().slice(0, 80),
        left: rect.left - parentRect.left + rect.width / 2,
        top: rect.top - parentRect.top - 10,
        anchor,
      });
    }
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [manuscriptRef]);

  const handleClick = useCallback(
    (personaId: string) => {
      setSummoning(personaId);
      window.setTimeout(() => {
        onSummon(personaId, { selectedText: sel?.text, anchor: sel?.anchor });
        setSummoning(null);
        setSel(null);
        window.getSelection()?.removeAllRanges();
      }, 320);
    },
    [onSummon, sel]
  );

  if (!sel) return null;

  return (
    <div
      ref={barRef}
      className="sx-mention-bar"
      style={{
        left: sel.left,
        top: sel.top,
        transform: 'translate(-50%, -100%)',
      }}
      contentEditable={false}
      onMouseDown={(e: MouseEvent) => e.preventDefault()}
      role="toolbar"
      aria-label="페르소나 부르기"
    >
      <span className="sx-mention-bar__label">@부르기</span>
      {CORE_PERSONAS.map((p) => (
        <button
          key={p.id}
          type="button"
          title={`${p.name} · ${p.role}`}
          aria-label={`${p.name}에게 묻기`}
          className={summoning === p.id ? 'is-summoning' : ''}
          onClick={() => handleClick(p.id)}
        >
          <PixelAvatar tint={p.tint} />
        </button>
      ))}
    </div>
  );
}
