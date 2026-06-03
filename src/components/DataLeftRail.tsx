// 데이터 모드 좌레일 컴포넌트
import type { Chapter, SeriesProject } from '../lib/storyEngine';
import type { MemoryApprovalQueue } from '../lib/memoryBank';
import { BibleRulesAccordion } from './BibleRulesAccordion';
import { CanonNav } from './CanonNav';
import { WorkStateGrid } from './WorkStateGrid';
import type { BibleSection, CanonCategory, DataView } from '../lib/canonDataView';

// 데이터 모드 좌레일 — 작품 상태 + 캐논 nav + 바이블 규칙 + 작품 데이터(개요·캐논·문체·승인) 진입점.
export function DataLeftRail({
  project,
  latestChapter,
  isSerial,
  canonHealth,
  approvalQueue,
  dataView,
  onSelectCategory,
  onSelectBibleSection
}: {
  project: SeriesProject;
  latestChapter: Chapter | null;
  isSerial: boolean;
  canonHealth: number;
  approvalQueue: MemoryApprovalQueue;
  dataView: DataView;
  onSelectCategory: (category: CanonCategory) => void;
  onSelectBibleSection: (section: BibleSection) => void;
}) {
  const activeCategory = dataView.kind === 'canon' ? dataView.category : null;
  const activeBibleSection = dataView.kind === 'bible' ? dataView.section : null;
  const pendingCount = approvalQueue.items.filter((item) => item.status !== 'approved').length;
  // 캐논 분야 5종 밖의 바이블 작업장 진입점 — 옛 바이블 트랙의 기능을 데이터 모드에서 그대로 이어 쓴다.
  const bibleEntries: Array<{ id: BibleSection; label: string; meta: string }> = [
    { id: 'overview', label: '작품 계약', meta: '약속·질문·형식' },
    { id: 'canon', label: '캐논 원장', meta: `${project.canonFacts.length}개 사실` },
    { id: 'voice', label: '문체 바이블', meta: '톤·시각·오디오' },
    { id: 'approval', label: '승인 대기', meta: `${pendingCount}개 대기` }
  ];

  return (
    <>
      <section className="sx-panel ex-workstate-card" aria-label="작품 상태">
        <div className="ex-rail-section-head">
          <span className="ex-rail-label">작품 상태</span>
        </div>
        <WorkStateGrid project={project} latestChapter={latestChapter} isSerial={isSerial} />
        <div className="ex-canon-health" title="캐논 건강도 — 회차 대비 확정 사실·규칙·인물의 밀도">
          <span className="ex-canon-health-label">캐논</span>
          <span className="ex-canon-health-track">
            <i className="ex-canon-health-fill" style={{ width: `${canonHealth}%` }} />
          </span>
          <span className="ex-canon-health-pct">{canonHealth}%</span>
        </div>
      </section>

      <section className="sx-panel ex-canon-nav-card" aria-label="캐논 분야">
        <div className="ex-rail-section-head">
          <span className="ex-rail-label">캐논</span>
        </div>
        <CanonNav project={project} activeCategory={activeCategory} onSelectCategory={onSelectCategory} />
      </section>

      <section className="sx-panel ex-data-bible-card" aria-label="작품 데이터">
        <div className="ex-rail-section-head">
          <span className="ex-rail-label">작품 데이터</span>
        </div>
        <div className="ex-data-bible-list">
          {bibleEntries.map((entry) => {
            const isActive = activeBibleSection === entry.id;
            const isApproval = entry.id === 'approval';

            return (
              <button
                key={entry.id}
                type="button"
                className={`ex-data-bible-item ${isActive ? 'is-active' : ''}${
                  isApproval && pendingCount > 0 ? ' is-pending' : ''
                }`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectBibleSection(entry.id)}
              >
                <span className="ex-data-bible-name">{entry.label}</span>
                <span className="ex-data-bible-meta">{entry.meta}</span>
                {isApproval && pendingCount > 0 && (
                  <span className="ex-data-bible-badge">{pendingCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="sx-panel ex-bible-rules-card" aria-label="바이블 규칙">
        <div className="ex-rail-section-head">
          <span className="ex-rail-label">바이블 규칙</span>
        </div>
        <BibleRulesAccordion sections={project.bibleOutline} />
      </section>
    </>
  );
}
