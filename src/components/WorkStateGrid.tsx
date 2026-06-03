// 작품 상태 그리드 컴포넌트
import type { Chapter, SeriesProject } from '../lib/storyEngine';

export function WorkStateGrid({
  project,
  latestChapter,
  isSerial
}: {
  project: SeriesProject;
  latestChapter: Chapter | null;
  isSerial: boolean;
}) {
  const totalChars = project.chapters.reduce(
    (sum, chapter) => sum + chapter.prose.replace(/\s/g, '').length,
    0
  );
  const chapterCount = project.chapters.length;
  const currentChars = (latestChapter?.prose ?? '').replace(/\s/g, '').length;
  // 진행 % — 현재 분량을 목표 5,000자와 비교한 비율
  const progressPct = Math.min(100, Math.round((currentChars / 5000) * 100));
  const draftStage = !latestChapter ? '시작 전' : latestChapter.locked ? '완성' : '초안';

  return (
    <div className="ex-work-state" aria-label="작품 상태">
      <div>
        <span className="ex-work-state-label">총 분량</span>
        <span className="ex-work-state-value">
          {totalChars.toLocaleString()}
          <small>자</small>
        </span>
      </div>
      {isSerial ? (
        <div>
          <span className="ex-work-state-label">회차</span>
          <span className="ex-work-state-value">
            {chapterCount}
            <small>화</small>
          </span>
        </div>
      ) : (
        <div>
          <span className="ex-work-state-label">단계</span>
          <span className="ex-work-state-value ex-work-state-value-text">{draftStage}</span>
        </div>
      )}
      <div>
        <span className="ex-work-state-label">{isSerial ? '이번 회차 분량' : '원고 분량'}</span>
        <span className="ex-work-state-value">
          {currentChars.toLocaleString()}
          <small>자</small>
        </span>
      </div>
      <div>
        <span className="ex-work-state-label">진행</span>
        <span className="ex-work-state-value">
          {progressPct}
          <small>%</small>
        </span>
      </div>
    </div>
  );
}
