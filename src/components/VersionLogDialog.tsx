// Story X 제품 버전·변경 로그를 시점별 카드로 보여주는 모달
import { X } from 'lucide-react';
import type { StoryXVersionInfo, StoryXVersionLogEntry } from '../lib/version';

export function VersionLogDialog({
  version,
  entries,
  onClose
}: {
  version: StoryXVersionInfo;
  entries: StoryXVersionLogEntry[];
  onClose: () => void;
}) {
  return (
    <div className="sx-version-log-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="sx-version-log-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Story X 변경 로그"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="sx-eyebrow">Story X Version Log</p>
            <h2>{version.label}</h2>
            <span>
              {version.codename} · {version.testProof} · commit {version.latestCommit}
            </span>
          </div>
          <button type="button" aria-label="변경 로그 닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <p>{version.summary}</p>
        <div className="sx-version-log-list">
          {entries.map((entry) => (
            <article key={entry.version}>
              <span>{entry.label}</span>
              <h3>{entry.title}</h3>
              <small>
                {entry.date} · commit {entry.commit}
              </small>
              <ul>
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
              <em>Next: {entry.next}</em>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
