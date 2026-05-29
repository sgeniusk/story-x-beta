import { useMemo } from 'react';
import { AnnotationCard } from './AnnotationCard';
import { CanonSummaryCard } from './CanonSummaryCard';
import { PixelAvatar } from './PixelAvatar';
import { findPersona } from '../lib/extendedPersonas';
import {
  CanonDelta,
  InlineDiff,
  MarginReview,
  Paragraph,
  ParagraphAnchor,
  groupAnnotationsByParagraph,
} from '../lib/marginReview';

interface Props {
  paragraphs: Paragraph[];
  reviews: MarginReview[];
  /** 어떤 카드가 열려 있는가 — anchor + persona 로 식별. null 이면 모두 닫힘. */
  openId: string | null;
  setOpenId: (id: string | null) => void;
  /** 한 페르소나로 필터링됐을 때의 id. null 이면 전체 표시. */
  filterPersona: string | null;
  setFilterPersona: (id: string | null) => void;
  /** 회차 종료 후 캐논 사서가 만든 변경 후보들. 빈 배열이면 카드 미표시. */
  canonDeltas: CanonDelta[];
  /** 검토가 한 번도 안 돌았을 때 보일 "전체 검토 맡기기" 버튼 콜백. null 이면 버튼 숨김. */
  onRunAll: (() => void) | null;
  onAcceptDiff: (diff: InlineDiff) => void;
  onRejectReview: (review: MarginReview) => void;
  onOpenChat: (review: MarginReview) => void;
  onResolveCanon: () => void;
}

/**
 * 우측 마진 column — 본문 옆에 의견을 줄 세운다.
 * 의견은 단락 순서대로 정렬되고, 같은 단락 안에서는 등록 순서를 따른다.
 * 회차가 끝나면 (모든 리뷰 완료, pending 없음) 캐논 요약 카드가 가장 아래에 떠오른다.
 */
export function MarginColumn({
  paragraphs,
  reviews,
  openId,
  setOpenId,
  filterPersona,
  setFilterPersona,
  canonDeltas,
  onRunAll,
  onAcceptDiff,
  onRejectReview,
  onOpenChat,
  onResolveCanon,
}: Props) {
  const items = useMemo(
    () => groupAnnotationsByParagraph(paragraphs, reviews),
    [paragraphs, reviews]
  );

  const visibleCount = filterPersona
    ? items.filter((i) => i.persona === filterPersona).length
    : items.length;

  const allDone = items.length > 0 && items.every((i) => !i.pending);
  const showCanonCard = allDone && canonDeltas.length > 0;

  return (
    <aside className="sx-margin-col" aria-label="작가진 의견">
      <div className="sx-margin-col__head">
        <h3>마지널리아</h3>
        <span className="sx-margin-col__count">{visibleCount}건</span>
      </div>

      {filterPersona && (() => {
        const p = findPersona(filterPersona);
        return (
          <div className="sx-margin-col__filter">
            <PixelAvatar
              tint={p.tint}
              style={{ width: 16, height: 16, borderRadius: 4 }}
            />
            <span>{p.name} 의견만</span>
            <button
              type="button"
              className="sx-btn ghost"
              style={{ marginLeft: 'auto', padding: '2px 8px' }}
              onClick={() => setFilterPersona(null)}
            >
              전체
            </button>
          </div>
        );
      })()}

      <div className="sx-margin-col__list">
        {items.map((r, i) => {
          const anchorIdx =
            paragraphs.findIndex((p) => p.id === r.anchor) + 1;
          const id = String(r.anchor) + String(r.persona);
          const isDim = !!filterPersona && r.persona !== filterPersona;
          return (
            <AnnotationCard
              key={id + i}
              review={r}
              anchorIndex={anchorIdx}
              isOpen={openId === id}
              isDim={isDim}
              onToggle={() => setOpenId(openId === id ? null : id)}
              onAccept={onAcceptDiff}
              onReject={() => onRejectReview(r)}
              onOpenChat={() => onOpenChat(r)}
            />
          );
        })}

        {items.length === 0 && (
          <div className="sx-margin-col__empty">
            본문에 아직 의견이 없습니다.
            <br />
            본문을 드래그하면 한 명만 부를 수 있고,
            <br />
            아래 버튼으로 5명에게 한 번에 맡길 수 있습니다.
          </div>
        )}

        {onRunAll && !allDone && (
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="sx-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
              onClick={onRunAll}
            >
              5명에게 전체 검토 맡기기
            </button>
          </div>
        )}

        {showCanonCard && (
          <CanonSummaryCard deltas={canonDeltas} onResolve={onResolveCanon} />
        )}
      </div>
    </aside>
  );
}

export type {
  CanonDelta,
  InlineDiff,
  MarginReview,
  Paragraph,
  ParagraphAnchor,
};
