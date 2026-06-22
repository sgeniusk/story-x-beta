// 작품 버전 스냅샷을 시점별로 보여주고 원하는 시점으로 되돌리는 모달
import { X } from 'lucide-react';
import type { ProjectSnapshot } from '../lib/storage';
import type { SeriesProject } from '../lib/storyEngine';
import { describeSnapshotImpact } from '../lib/snapshotImpact';

export function ProjectHistoryDialog({
  snapshots,
  current,
  onRestore,
  onClose
}: {
  snapshots: ProjectSnapshot[];
  current: SeriesProject;
  onRestore: (snapshot: ProjectSnapshot) => void;
  onClose: () => void;
}) {
  return (
    <div className="sx-version-log-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="sx-version-log-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="작품 버전 기록"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="sx-eyebrow">작품 버전 기록</p>
            <h2>{snapshots.length}개 저장 시점</h2>
            <span>회차 생성과 캐논 반영 때마다 자동으로 저장됩니다. 원하는 시점으로 되돌릴 수 있습니다.</span>
          </div>
          <button type="button" aria-label="버전 기록 닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {snapshots.length > 0 ? (
          <div className="sx-version-log-list">
            {snapshots.map((snapshot) => (
              <article key={snapshot.id}>
                <span>{snapshot.label}</span>
                <h3>
                  {snapshot.episode}화 · 캐논 {snapshot.canonCount}개
                </h3>
                <small>{new Date(snapshot.savedAt).toLocaleString('ko-KR')}</small>
                {(() => {
                  const impact = describeSnapshotImpact(current, snapshot);
                  const restore = () => {
                    if (
                      impact.isRollback &&
                      !window.confirm(
                        `이 시점으로 되돌리면 현재 상태가 이 스냅샷으로 교체됩니다 — 회차 ${current.chapters.length}→${snapshot.chapterCount}, 캐논 ${current.canonFacts.length}→${snapshot.canonCount}. 계속할까요?`
                      )
                    ) {
                      return;
                    }
                    onRestore(snapshot);
                  };
                  return (
                    <>
                      <p className={`sx-snapshot-impact${impact.isRollback ? ' is-rollback' : ''}`}>
                        복원 시 회차 {current.chapters.length}→{snapshot.chapterCount} · 캐논 {current.canonFacts.length}→{snapshot.canonCount}
                      </p>
                      <div>
                        <button type="button" className="sx-secondary-button" onClick={restore}>
                          이 시점으로 되돌리기
                        </button>
                      </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        ) : (
          <p>아직 저장된 버전이 없습니다. 회차를 생성하면 이곳에 시점이 쌓입니다.</p>
        )}
      </section>
    </div>
  );
}
