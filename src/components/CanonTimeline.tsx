// 캐논 시간선 카드
import type { TimelineEntry } from '../lib/storyEngine';
import { CanonStatusBadge } from './CanonStatusBadge';

export function CanonTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="ex-beats-empty">아직 시간선 항목이 없습니다.</p>;
  }

  return (
    <div className="ex-timeline">
      {entries.map((entry) => (
        <div key={entry.id} className={`ex-timeline-tick ex-timeline-tick--${entry.status}`}>
          <span className="ex-timeline-mark" aria-hidden="true" />
          <div className="ex-timeline-when">
            <strong>{entry.season}</strong>
          </div>
          <div className="ex-timeline-body">
            <h4>{entry.label}</h4>
            <p>{entry.note}</p>
            <CanonStatusBadge status={entry.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
