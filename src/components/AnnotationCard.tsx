import { MouseEvent, useCallback } from 'react';
import { PixelAvatar } from './PixelAvatar';
import { findPersona } from '../lib/extendedPersonas';
import {
  AnnotationItem,
  InlineDiff,
  SEVERITY_LABEL,
} from '../lib/marginReview';

interface Props {
  review: AnnotationItem;
  /** paragraph index (1-based) for the anchor label */
  anchorIndex: number;
  isOpen: boolean;
  isDim: boolean;
  onToggle: () => void;
  onAccept: (diff: InlineDiff) => void;
  onReject: () => void;
  onOpenChat: () => void;
}

/**
 * 마진에 박히는 의견 한 장.
 * - severity 좌측 띠 + chip + head 굵기 3 단계.
 * - pending 일 땐 슬라이드인 + pulse + dots.
 * - 단락 첫 의견은 anchor 라인 진하게, 이어지는 의견은 옅게.
 */
export function AnnotationCard({
  review,
  anchorIndex,
  isOpen,
  isDim,
  onToggle,
  onAccept,
  onReject,
  onOpenChat,
}: Props) {
  const persona = findPersona(review.persona);
  const sev = review.severity;
  const sevLabel = SEVERITY_LABEL[sev];
  const diffsCount = review.diffs.length;

  const stop = useCallback((e: MouseEvent) => e.stopPropagation(), []);

  const classes = [
    'sx-annot',
    `sx-annot--${sev}`,
    isOpen ? 'is-open' : '',
    isDim ? 'is-dim' : '',
    review.pending ? 'is-pending' : '',
    review.groupStart ? 'is-group-start' : '',
    review.groupCont ? 'is-group-cont' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ ['--anchor-color' as string]: persona.tint }}
      onClick={review.pending ? undefined : onToggle}
      role="article"
      aria-label={`${persona.name} 의견 · 단락 ${anchorIndex}`}
    >
      <div className="sx-annot__head">
        <PixelAvatar tint={persona.tint} className="sx-annot__avatar" />
        <span className="sx-annot__name">{persona.name}</span>
        <span className="sx-annot__role">{persona.role}</span>
        {!review.pending && (
          <span className="sx-annot__sev-chip">
            {sevLabel}
            {diffsCount > 0 ? ` ${diffsCount}` : ''}
          </span>
        )}
      </div>

      <div className="sx-annot__anchor-line">단락 {anchorIndex}</div>
      <div className="sx-annot__head-text">{review.head}</div>
      <div className="sx-annot__body">{review.body}</div>

      {!review.pending && diffsCount > 0 && (
        <div className="sx-annot__actions">
          <button
            type="button"
            className="sx-btn primary"
            onClick={(e) => {
              stop(e);
              review.diffs.forEach(onAccept);
            }}
          >
            수정 적용
          </button>
          <button type="button" className="sx-btn" onClick={(e) => { stop(e); onOpenChat(); }}>
            대화 열기
          </button>
          <button type="button" className="sx-btn ghost" onClick={(e) => { stop(e); onReject(); }} style={{ marginLeft: 'auto' }}>
            거절
          </button>
        </div>
      )}

      {!review.pending && diffsCount === 0 && (
        <div className="sx-annot__actions">
          {sev === 'block' && (
            <button
              type="button"
              className="sx-btn"
              onClick={(e) => { stop(e); onOpenChat(); }}
              style={{ borderColor: 'rgba(192,133,50,0.3)', color: 'var(--sx-warn)' }}
            >
              결정 내리기
            </button>
          )}
          {sev !== 'block' && (
            <button type="button" className="sx-btn" onClick={(e) => { stop(e); onOpenChat(); }}>
              대화 열기
            </button>
          )}
          <button type="button" className="sx-btn ghost" onClick={(e) => { stop(e); onToggle(); }} style={{ marginLeft: 'auto' }}>
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
