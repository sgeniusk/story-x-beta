// Bible 워크벤치 헤더 컴포넌트
import { ClipboardCheck } from 'lucide-react';
import type { BibleSection } from '../lib/canonDataView';

export interface BibleSectionState {
  id: BibleSection;
  label: string;
  summary: string;
  directive: string;
  primaryMetric: string;
  impactLabel: string;
  impactScope: string;
  syncTargets: string[];
  reviewAgents: Array<{
    label: string;
    focus: string;
  }>;
}

export function BibleWorkbenchHeader({
  sectionState,
  onRequestReview
}: {
  sectionState: BibleSectionState;
  onRequestReview: () => void;
}) {
  return (
    <header className="sx-bible-workbench-header" aria-label={`${sectionState.label} 작업 기준`}>
      <div>
        <p className="sx-eyebrow">Bible Workbench</p>
        <h3>{sectionState.label}</h3>
        <p>{sectionState.directive}</p>
        <button type="button" className="sx-bible-review-request" onClick={onRequestReview}>
          <ClipboardCheck size={16} />
          변경 검토 요청
        </button>
      </div>
      <div className="sx-bible-impact-strip" aria-label="바이블 작업 영향 요약">
        <article>
          <span>작업 기준</span>
          <strong>{sectionState.primaryMetric}</strong>
          <small>{sectionState.summary}</small>
        </article>
        <article>
          <span>변경 영향</span>
          <strong>{sectionState.impactLabel}</strong>
          <small>{sectionState.impactScope}</small>
        </article>
        <article>
          <span>동기화 대상</span>
          <div>
            {sectionState.syncTargets.map((target) => (
              <em key={`${sectionState.id}-${target}`}>{target}</em>
            ))}
          </div>
        </article>
      </div>
      <aside className="sx-bible-review-route" aria-label="검토 순서">
        <span>검토 순서</span>
        {sectionState.reviewAgents.map((agent, index) => (
          <p key={`${sectionState.id}-${agent.label}-${index}`}>
            <strong>{String(index + 1).padStart(2, '0')} · {agent.label}</strong>
            <small>{agent.focus}</small>
          </p>
        ))}
      </aside>
    </header>
  );
}
