// 캐논 리팩터 패널 컴포넌트
import type { CanonChangeEntry, CanonRefactorPlan } from '../lib/canonRefactor';

export function CanonRefactorPanel({
  changes,
  plan,
  onClearChanges
}: {
  changes: CanonChangeEntry[];
  plan: CanonRefactorPlan;
  onClearChanges: () => void;
}) {
  return (
    <section className={`sx-canon-refactor-panel is-${plan.status}`} aria-label="캐논 리팩터">
      <header>
        <div>
          <p className="sx-eyebrow">Canon Refactor</p>
          <h3>캐논 리팩터</h3>
          <p>{plan.summary}</p>
        </div>
        <button type="button" className="sx-secondary-button" onClick={onClearChanges} disabled={changes.length === 0}>
          변경 로그 비우기
        </button>
      </header>

      <div className="sx-canon-refactor-grid">
        <article className="sx-change-log-list">
          <span>변경 로그</span>
          {changes.length === 0 ? (
            <p>캐릭터, 세계관, 캐논을 직접 수정하면 이곳에 최신 변경이 쌓입니다.</p>
          ) : (
            changes.map((change) => (
              <div key={change.id}>
                <strong>{change.targetLabel}</strong>
                <small>{change.kind} · {change.fieldLabel}</small>
                <p>{change.after || '비어 있음'}</p>
              </div>
            ))
          )}
        </article>

        <article>
          <span>영향 회차</span>
          {plan.affectedChapters.length === 0 ? (
            <p>아직 영향 받을 회차가 없습니다.</p>
          ) : (
            plan.affectedChapters.map((chapter) => (
              <div key={chapter.id} className="sx-refactor-impact-row">
                <strong>{chapter.episode}화 · {chapter.title}</strong>
                <small>{chapter.reason}</small>
              </div>
            ))
          )}
        </article>

        <article className="sx-refactor-review-order">
          <span>에이전트 검토 순서</span>
          {plan.reviewOrder.length === 0 ? (
            <p>대기 중인 검토가 없습니다.</p>
          ) : (
            plan.reviewOrder.map((step, index) => (
              <div key={step.agentId}>
                <strong>{String(index + 1).padStart(2, '0')} · {step.label}</strong>
                <small>{step.focus}</small>
              </div>
            ))
          )}
        </article>

        <article>
          <span>전개 조언</span>
          <ul>
            {plan.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
          {plan.conflictWarnings.length > 0 && (
            <div className="sx-refactor-warning-list">
              {plan.conflictWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
          <small>{plan.releaseAdvice}</small>
        </article>
      </div>
    </section>
  );
}
