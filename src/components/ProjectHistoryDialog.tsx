// 작품 버전 스냅샷을 시점별로 보여주고 원하는 시점으로 되돌리는 모달
import { X } from 'lucide-react';
import type { ProjectSnapshot } from '../lib/storage';

export function ProjectHistoryDialog({
  snapshots,
  onRestore,
  onClose
}: {
  snapshots: ProjectSnapshot[];
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
                <div>
                  <button type="button" className="sx-secondary-button" onClick={() => onRestore(snapshot)}>
                    이 시점으로 되돌리기
                  </button>
                </div>
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
