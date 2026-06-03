// 데이터 검토 우레일 컴포넌트
import { ClipboardCheck } from 'lucide-react';
import { canonCategories, type CanonCategory, type DataReviewView } from '../lib/canonDataView';

// 데이터 모드 우레일 — 분야별 데이터 검토. 검토를 실행하면 연속성 감수자가 정합/제안 노트를 채운다.
export function DataReviewRail({
  category,
  review,
  isReviewing,
  onRequestReview,
  onOpenApprovalQueue
}: {
  category: CanonCategory;
  review: DataReviewView | null;
  isReviewing: boolean;
  onRequestReview: () => void;
  onOpenApprovalQueue: () => void;
}) {
  const categoryLabel = canonCategories.find((item) => item.id === category)?.label ?? '캐논';
  const consistencyNotes = review ? review.notes.filter((note) => note.kind === '정합') : [];
  const suggestionNotes = review ? review.notes.filter((note) => note.kind === '제안') : [];

  return (
    <section className="sx-panel sx-data-review-rail" aria-label={`${categoryLabel} 데이터 검토`}>
      <div className="sx-panel-heading">
        <ClipboardCheck size={16} />
        <h2>{categoryLabel} 검토</h2>
      </div>
      <p className="ex-data-review-intro">
        {categoryLabel} 데이터의 정합과 제안을 분야별로 모읍니다. 검토를 실행하면 결과가 여기에 쌓입니다.
      </p>

      {isReviewing ? (
        <div className="ex-data-review-empty" aria-live="polite">
          <span className="ex-data-review-empty-dot" aria-hidden="true" />
          <strong>검토하는 중…</strong>
          <p>연속성 감수자가 {categoryLabel} 데이터의 회차 간 정합을 읽고 있습니다.</p>
        </div>
      ) : review ? (
        <div className="ex-data-review-result">
          {review.summary ? <p className="ex-data-review-summary">{review.summary}</p> : null}
          {review.source === 'fallback' ? (
            <p className="ex-data-review-source">브리지를 쓰지 못해 기본 검토로 만든 결과입니다.</p>
          ) : null}

          {consistencyNotes.length > 0 ? (
            <div className="ex-data-review-group">
              <h3>정합 점검 ({consistencyNotes.length})</h3>
              {consistencyNotes.map((note, index) => (
                <article key={`정합-${index}`} className="ex-data-review-note ex-data-review-note--consistency">
                  <span className="ex-data-review-note-kind">정합</span>
                  {note.title ? <strong>{note.title}</strong> : null}
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          ) : null}

          {suggestionNotes.length > 0 ? (
            <div className="ex-data-review-group">
              <h3>보강 제안 ({suggestionNotes.length})</h3>
              {suggestionNotes.map((note, index) => (
                <article key={`제안-${index}`} className="ex-data-review-note ex-data-review-note--suggestion">
                  <span className="ex-data-review-note-kind">제안</span>
                  {note.title ? <strong>{note.title}</strong> : null}
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="ex-data-review-empty">
          <span className="ex-data-review-empty-dot" aria-hidden="true" />
          <strong>아직 검토 없음</strong>
          <p>이 분야에 대한 에이전트 의견이 아직 없습니다. 데이터 검토를 실행해 정합·제안을 받아보세요.</p>
        </div>
      )}

      <div className="ex-data-review-actions">
        <button type="button" className="sx-primary-button" onClick={onRequestReview} disabled={isReviewing}>
          <ClipboardCheck size={15} />
          {isReviewing ? '검토하는 중…' : review ? '데이터 검토 다시 실행' : '데이터 검토 실행'}
        </button>
        <button type="button" className="sx-secondary-button" onClick={onOpenApprovalQueue}>
          승인 대기 열기
        </button>
      </div>
    </section>
  );
}
