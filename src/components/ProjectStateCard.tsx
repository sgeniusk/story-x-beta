// 프로젝트 상태 카드 컴포넌트
import type * as React from 'react';
import type { BibleSection } from '../lib/canonDataView';
import type { SeriesProject } from '../lib/storyEngine';

export function ProjectStateCard({
  project,
  canonHealth,
  pendingApprovals,
  onJumpToBible
}: {
  project: SeriesProject;
  canonHealth: number;
  pendingApprovals: number;
  onJumpToBible: (section: BibleSection) => void;
}) {
  const handleJump = (section: BibleSection) => (event: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in event && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onJumpToBible(section);
  };

  return (
    <section className="sx-project-card">
      <p className="sx-eyebrow">프로젝트 상태</p>
      <h2>{project.title}</h2>
      <div className="sx-project-meter">
        <strong>{canonHealth}%</strong>
        <span>연속성 건강도</span>
      </div>
      <div className="sx-meter-track">
        <i style={{ width: `${canonHealth}%` }} />
      </div>
      <div className="ex-canon-health" title="캐논 건강도 — 회차 대비 확정 사실·규칙·인물의 밀도">
        <span className="ex-canon-health-label">캐논</span>
        <span className="ex-canon-health-track">
          <i className="ex-canon-health-fill" style={{ width: `${canonHealth}%` }} />
        </span>
        <span className="ex-canon-health-pct">{canonHealth}%</span>
      </div>
      <dl>
        <div>
          <dt>회차</dt>
          <dd>{project.currentEpisode}</dd>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="sx-project-card-link"
          aria-label="바이블 캐논으로 이동"
          title="캐논 — 작품에서 확정된 사실. 모든 회차가 이 기준을 따릅니다."
          onClick={handleJump('canon')}
          onKeyDown={handleJump('canon')}
        >
          <dt>캐논</dt>
          <dd>{project.canonFacts.length}</dd>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="sx-project-card-link"
          aria-label={
            pendingApprovals > 0
              ? `바이블 승인 대기로 이동, ${pendingApprovals}개 대기`
              : '바이블 승인 대기로 이동'
          }
          onClick={handleJump('approval')}
          onKeyDown={handleJump('approval')}
        >
          <dt>
            질문
            {pendingApprovals > 0 && <span className="sx-pending-dot" aria-hidden="true" />}
          </dt>
          <dd>{project.openThreads.length}</dd>
        </div>
      </dl>
    </section>
  );
}
