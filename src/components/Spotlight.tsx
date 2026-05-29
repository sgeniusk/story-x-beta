import { useEffect, useMemo, useRef, useState } from 'react';
import { PixelAvatar } from './PixelAvatar';
import { EXTENDED_PERSONAS } from '../lib/extendedPersonas';
import type { ExtendedGroup, SummonHandler } from '../lib/marginReview';

interface Props {
  onClose: () => void;
  onSummon: SummonHandler;
}

const GROUP_ORDER: ExtendedGroup[] = ['확장', '신설', '매체'];
const GROUP_LABEL: Record<ExtendedGroup, string> = {
  확장: '확장 11명',
  신설: 'M4 신설 12명',
  매체: '매체별 풀',
};

/**
 * ⌘K Spotlight — 호출 가능한 31명 확장 페르소나 검색.
 * 확장 / 신설 / 매체 3 그룹으로 묶고, 화살표 + Enter 키보드 내비게이션.
 * 코어 5명은 항상 작가 옆에 있으므로 여기 나오지 않는다.
 */
export function Spotlight({ onClose, onSummon }: Props) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return EXTENDED_PERSONAS;
    return EXTENDED_PERSONAS.filter(
      (p) =>
        p.name.toLowerCase().includes(qq) ||
        p.role.toLowerCase().includes(qq) ||
        p.id.toLowerCase().includes(qq)
    );
  }, [q]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof EXTENDED_PERSONAS> = {
      확장: [],
      신설: [],
      매체: [],
    };
    for (const p of filtered) (map[p.group] ||= []).push(p);
    return map;
  }, [filtered]);

  const flat = useMemo(
    () => GROUP_ORDER.flatMap((g) => grouped[g] || []),
    [grouped]
  );

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const p = flat[cursor];
        if (p) {
          onSummon(p.id);
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cursor, flat, onClose, onSummon]);

  return (
    <div className="sx-spotlight-backdrop" onClick={onClose}>
      <div className="sx-spotlight" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="페르소나 부르기">
        <div className="sx-spotlight__search">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16, color: 'var(--sx-muted)' }}>
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            ref={inputRef}
            placeholder="페르소나를 부르세요 — 평론가, 음악, 책 디자이너…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="sx-spotlight__search-kbd">⌘K</span>
        </div>

        <div className="sx-spotlight__list">
          {flat.length === 0 && (
            <div className="sx-spotlight__empty">
              그런 이름은 아직 작가실에 없습니다.
            </div>
          )}

          {GROUP_ORDER.map((group) => {
            const rows = grouped[group] || [];
            if (rows.length === 0) return null;
            return (
              <div key={group}>
                <div className="sx-spotlight__group-hd">{GROUP_LABEL[group]}</div>
                {rows.map((p) => {
                  const flatIdx = flat.indexOf(p);
                  return (
                    <div
                      key={p.id}
                      className={`sx-spotlight__row ${cursor === flatIdx ? 'is-cursor' : ''}`}
                      onClick={() => {
                        onSummon(p.id);
                        onClose();
                      }}
                      onMouseEnter={() => setCursor(flatIdx)}
                    >
                      <PixelAvatar tint={p.tint} className="sx-spotlight__row-avatar" />
                      <span>
                        <span className="sx-spotlight__row-name" style={{ display: 'block' }}>
                          {p.name}
                        </span>
                        <span className="sx-spotlight__row-role">{p.role}</span>
                      </span>
                      <span className="sx-spotlight__row-group">{p.group}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="sx-spotlight__footer">
          <span><span className="sx-spotlight__footer-key">↑↓</span>이동</span>
          <span><span className="sx-spotlight__footer-key">↵</span>호출</span>
          <span><span className="sx-spotlight__footer-key">esc</span>닫기</span>
          <span style={{ marginLeft: 'auto' }}>코어 5명은 항상 작가 옆에 있어요</span>
        </div>
      </div>
    </div>
  );
}
