// 편집기 하단 상태 표시줄 — 알파 셀프체크·버전·다음 액션·동기화 상태를 한 줄로 보여준다
import { ClipboardCheck } from 'lucide-react';
import type { AlphaReadinessReport } from '../lib/alphaReadiness';
import type { SeriesProject } from '../lib/storyEngine';
import type { StoryXVersionInfo } from '../lib/version';

export function StoryXStatusBar({
  alphaReport: report,
  project,
  editedSinceReview,
  version,
  onOpenVersionLog
}: {
  alphaReport: AlphaReadinessReport;
  project: SeriesProject;
  editedSinceReview: boolean;
  version: StoryXVersionInfo;
  onOpenVersionLog: () => void;
}) {
  const statusLabels: Record<AlphaReadinessReport['status'], string> = {
    ready: '출시 가능',
    'needs-review': '검토 필요',
    blocked: '차단'
  };

  return (
    <footer className={`sx-statusbar is-${report.status}`} aria-label="Story X 상태 표시줄">
      <span className="sx-statusbar-alpha">
        <ClipboardCheck size={16} />
        알파 셀프체크 {report.score}% · {statusLabels[report.status]}
      </span>
      <button type="button" className="sx-statusbar-version" onClick={onOpenVersionLog}>
        {version.label}
      </button>
      <span>{report.nextActions[0]}</span>
      <span>{project.chapters.length} episodes · {project.canonFacts.length} canon</span>
      <span>{editedSinceReview ? '수정 미검토' : 'synced'}</span>
      <span>⌘K 명령 · ⌘. 집중</span>
    </footer>
  );
}
