import type { ProjectLibraryEntry } from '../lib/projectLibrary';

interface ProjectLibraryCardProps {
  entry: ProjectLibraryEntry;
  active: boolean;
  onOpen: (entry: ProjectLibraryEntry) => void;
  onConfirm: (entry: ProjectLibraryEntry) => void;
}

const MEDIUM_LABEL: Record<string, string> = {
  novel: '소설',
  essay: '에세이',
  comics: '만화',
  audiobook: '오디오북',
  academic: '학술'
};

export function ProjectLibraryCard({ entry, active, onOpen, onConfirm }: ProjectLibraryCardProps) {
  const { project } = entry;
  const medium = MEDIUM_LABEL[project.medium ?? 'novel'] ?? '작품';
  const meta = `${medium} · ${project.currentEpisode}화 · 캐논 ${project.canonFacts.length}개 · 캐릭터 ${project.characters.length}명`;

  return (
    <article className={`pjx-card pjx-library-card ${active ? 'is-active' : ''}`}>
      <div className="pjx-card-kicker">
        <span className={`pjx-lifecycle is-${entry.lifecycle}`}>
          {entry.lifecycle === 'temporary' ? '임시작' : '연재 작품'}
        </span>
        {active && <span className="pjx-active-label">최근 작업</span>}
      </div>
      <div className="pjx-card-meta">{meta}</div>
      <h2 className="pjx-card-title">{project.title}</h2>
      <p className="pjx-card-logline">{project.logline || '아직 작품 소개가 없습니다.'}</p>
      <div className="pjx-library-actions">
        <button type="button" className="pjx-open-work" onClick={() => onOpen(entry)}>작업 계속하기</button>
        {entry.lifecycle === 'temporary' && (
          <button type="button" className="pjx-confirm-work" onClick={() => onConfirm(entry)}>작품으로 확정</button>
        )}
      </div>
    </article>
  );
}
