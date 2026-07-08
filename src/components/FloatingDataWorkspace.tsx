// 데이터 모드 "떠 있는 작업실" — FloatingEditor 셸 언어를 캐논/바이블에 적용. board=정제 보드, canon/bible=centerSlot 주입.
import { useCallback, useState, type ReactNode } from 'react';
import type { Chapter, SeriesProject } from '../lib/storyEngine';
import type { MemoryApprovalQueue } from '../lib/memoryBank';
import type { MetricTone, StudioMetrics } from '../lib/studioMetrics';
import { CanonNav } from './CanonNav';
import { WorkStateGrid } from './WorkStateGrid';
import { DataReviewRail } from './DataReviewRail';
import { DeskMetaLine } from './DeskMetaLine';
import {
  canonCategories, type CanonCategory, type DataView,
  type BibleSection, type DataReviewView,
} from '../lib/canonDataView';

export interface FloatingDataWorkspaceProps {
  dataView: DataView;
  onSelectCategory: (c: CanonCategory) => void;
  onSelectBibleSection: (s: BibleSection) => void;
  onShowBoard: () => void;
  metrics: StudioMetrics;
  onMediaAxisChange?: (axis: number) => void;
  canonHealth: number;
  dataReviewResults: Partial<Record<CanonCategory, DataReviewView>>;
  project: SeriesProject;
  latestChapter: Chapter | null;
  isSerial: boolean;
  approvalQueue: MemoryApprovalQueue;
  dataReviewingCategory: CanonCategory | null;
  onRequestReview: (c: CanonCategory) => void;
  onOpenApprovalQueue: () => void;
  centerSlot: ReactNode;
  /** 슬라이스 C — 하단 메타 줄. metaLeft=캐논·떡밥 요약, metaRightSlot=저장 상태 등. */
  metaLeft?: string;
  metaRightSlot?: ReactNode;
  /** 설계실 2단계 — dock 「✦ 설계」 패널 내용(PlanChatPanel). StoryXDesk 가 조립해 주입. */
  designSlot?: ReactNode;
}

const BIBLE_ENTRIES: Array<{ id: BibleSection; label: string }> = [
  { id: 'overview', label: '작품 계약' },
  { id: 'canon', label: '캐논 원장' },
  { id: 'voice', label: '문체 바이블' },
  { id: 'approval', label: '승인 대기' },
];

type DataPanelId = 'metrics' | 'review' | 'canon' | 'bible' | 'state' | 'design';

// 정제 지표 요약 — board·독 지표 패널 공유. DataPanel(.sx-* 스코프)이 .fc-app 에서 깨져 floating-네이티브로 대체.
function MetricSummary({ metrics }: { metrics: StudioMetrics }) {
  const p = metrics.payoff;
  const cards: Array<{ label: string; lead: string; tone: MetricTone; sub: string }> = [
    { label: '하니스', lead: metrics.harness.lead, tone: metrics.harness.tone, sub: metrics.harness.sub },
    { label: '품질 게이트', lead: metrics.quality.lead, tone: metrics.quality.tone, sub: metrics.quality.sub },
    { label: '매체 투사', lead: metrics.media.lead, tone: metrics.media.tone, sub: metrics.media.sub },
    { label: '온톨로지', lead: metrics.ontology.lead, tone: metrics.ontology.tone, sub: metrics.ontology.sub },
    {
      label: '전제 진척',
      lead: !p || !p.measured ? '—' : p.isStalled ? `${p.deferredStreak}회 정체` : p.lastPayoffEpisode != null ? `${p.lastPayoffEpisode}화 회수` : '진행 중',
      tone: (!p || !p.measured ? 'neutral' : p.isStalled ? 'warn' : 'good') as MetricTone,
      sub: !p || !p.measured ? '회차 데이터 없음' : `열린 약속 ${p.openPromises} · 완결 ${p.paidPromises}`,
    },
  ];
  return (
    <div className="fc-data-metrics">
      {cards.map((c) => (
        <div key={c.label} className={`fc-data-metric tone-${c.tone}`}>
          <span className="dot" />
          <span className="txt">
            <span className="label">{c.label}</span>
            <span className="sub">{c.sub}</span>
          </span>
          <span className="lead">{c.lead}</span>
        </div>
      ))}
    </div>
  );
}

export function FloatingDataWorkspace(props: FloatingDataWorkspaceProps) {
  const { dataView } = props;
  const [openPanel, setOpenPanel] = useState<DataPanelId | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [reviewCat, setReviewCat] = useState<CanonCategory>('characters');

  const togglePanel = useCallback((id: DataPanelId) => setOpenPanel((cur) => (cur === id ? null : id)), []);
  const closeAll = useCallback(() => setOpenPanel(null), []);
  const activeCategory = dataView.kind === 'canon' ? dataView.category : null;
  const isBoard = dataView.kind === 'board';
  const scrimShown = openPanel !== null;

  const reviewRow = (cat: CanonCategory) => {
    const r = props.dataReviewResults[cat];
    const ok = r ? r.notes.filter((n) => n.kind === '정합').length : 0;
    const sug = r ? r.notes.filter((n) => n.kind === '제안').length : 0;
    return { label: canonCategories.find((c) => c.id === cat)?.label ?? cat, reviewed: !!r, ok, sug };
  };

  return (
    <div className={`fc-app fc-data${isFocus ? ' focus' : ''}`} id="fc-data-app">
      <button className="exitfocus" onClick={() => setIsFocus(false)}>집중 모드 끝내기 · Esc</button>

      {/* canvas — board 자체 렌더 / canon·bible 은 centerSlot 주입 */}
      <div className="canvas" id="fc-data-canvas">
        <div className="deck">
          {isBoard ? (
            <section className="fc-data-board" aria-label="작품 현황 보드">
              <header className="fc-data-board-head">
                <h1>작품 현황</h1>
                <p>지표와 검토 요약만 정제해 보여줍니다. 세부는 왼쪽 도구로 파고드세요.</p>
              </header>
              <div className="fc-data-board-metrics">
                <MetricSummary metrics={props.metrics} />
              </div>
              <div className="fc-data-board-reviews">
                <h2>분야별 검토</h2>
                {canonCategories.map((cat) => {
                  const row = reviewRow(cat.id);
                  return (
                    <button key={cat.id} type="button" className="fc-data-review-row"
                      onClick={() => props.onSelectCategory(cat.id)}>
                      <span className="nm">{row.label}</span>
                      <span className="st">{row.reviewed ? `정합 ${row.ok} · 제안 ${row.sug}` : '미검토'}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="fc-data-detail sx-desk" aria-label="데이터 세부">
              <button type="button" className="fc-data-crumb-board" onClick={props.onShowBoard}>← 현황 보드</button>
              {props.centerSlot}
            </section>
          )}
        </div>
      </div>

      {/* floating dock — 지표·검토·(구분)·캐논·바이블·상태·집중. 아이콘 SVG 는 FloatingEditor 차용 */}
      <div className="docks" aria-label="데이터 도구">
        <nav className="dock left" aria-label="데이터 도구">
          <button className={`tool${openPanel === 'metrics' ? ' on' : ''}`} onClick={() => togglePanel('metrics')} title="지표">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 12h4l3-8 4 16 3-8h4" />
            </svg>
            <span className="t">지표</span>
          </button>
          <button className={`tool${openPanel === 'review' ? ' on' : ''}`} onClick={() => togglePanel('review')} title="검토">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="t">검토</span>
          </button>
          <div className="sep" />
          <button className={`tool${openPanel === 'canon' ? ' on' : ''}`} onClick={() => togglePanel('canon')} title="캐논">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
            </svg>
            <span className="t">캐논</span>
          </button>
          <button className={`tool${openPanel === 'bible' ? ' on' : ''}`} onClick={() => togglePanel('bible')} title="바이블">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <span className="t">바이블</span>
          </button>
          <button className={`tool${openPanel === 'state' ? ' on' : ''}`} onClick={() => togglePanel('state')} title="상태">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 3v18h18M7 14l3-4 4 3 5-7" />
            </svg>
            <span className="t">상태</span>
          </button>
          <button className={`tool${openPanel === 'design' ? ' on' : ''}`} onClick={() => togglePanel('design')} title="설계 대화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="t">✦ 설계</span>
          </button>
          <button className="tool" onClick={() => setIsFocus((f) => !f)} title="집중 모드">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
            </svg>
            <span className="t">집중</span>
          </button>
        </nav>
      </div>

      {/* panels — FloatingEditor .panel/.ph/.pb 차용 */}
      <div className={`panel${openPanel === 'metrics' ? ' show' : ''}`} id="fc-pd-metrics">
        <div className="ph"><h4>작품 지표</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <MetricSummary metrics={props.metrics} />
          {props.onMediaAxisChange && (
            <div className="fc-data-axis">
              <div className="lbl"><span>commercial</span><span>literary</span></div>
              <input type="range" min={0} max={100} value={Math.round(props.metrics.media.axis * 100)}
                onChange={(e) => props.onMediaAxisChange!(Number(e.target.value) / 100)} aria-label="작품 무게중심" />
            </div>
          )}
        </div>
      </div>

      <div className={`panel${openPanel === 'review' ? ' show' : ''}`} id="fc-pd-review">
        <div className="ph"><h4>데이터 검토</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <div className="fc-pd-review-cats">
            {canonCategories.map((cat) => (
              <button key={cat.id} type="button"
                className={`fc-pd-cat${reviewCat === cat.id ? ' on' : ''}`}
                onClick={() => setReviewCat(cat.id)}>{cat.label}</button>
            ))}
          </div>
          <DataReviewRail
            category={reviewCat}
            review={props.dataReviewResults[reviewCat] ?? null}
            isReviewing={props.dataReviewingCategory === reviewCat}
            onRequestReview={() => props.onRequestReview(reviewCat)}
            onOpenApprovalQueue={props.onOpenApprovalQueue}
          />
        </div>
      </div>

      <div className={`panel${openPanel === 'canon' ? ' show' : ''}`} id="fc-pd-canon">
        <div className="ph"><h4>캐논 분야</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <CanonNav project={props.project} activeCategory={activeCategory}
            onSelectCategory={(c) => { props.onSelectCategory(c); closeAll(); }} />
        </div>
      </div>

      <div className={`panel${openPanel === 'bible' ? ' show' : ''}`} id="fc-pd-bible">
        <div className="ph"><h4>작품 데이터</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          {BIBLE_ENTRIES.map((entry) => (
            <button key={entry.id} type="button" className="fc-pd-bible-item"
              onClick={() => { props.onSelectBibleSection(entry.id); closeAll(); }}>
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`panel${openPanel === 'state' ? ' show' : ''}`} id="fc-pd-state">
        <div className="ph"><h4>작품 상태</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">
          <WorkStateGrid project={props.project} latestChapter={props.latestChapter} isSerial={props.isSerial} />
          <div className="fc-pd-health">
            <span>캐논 건강도</span>
            <span className="track"><i style={{ width: `${props.canonHealth}%` }} /></span>
            <span>{props.canonHealth}%</span>
          </div>
        </div>
      </div>

      <div className={`panel${openPanel === 'design' ? ' show' : ''}`} id="fc-pd-design">
        <div className="ph"><h4>설계 대화</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">{props.designSlot ?? null}</div>
      </div>

      <div className={`scrim${scrimShown ? ' show' : ''}`} onClick={closeAll} />
      <DeskMetaLine left={props.metaLeft ?? ''} rightSlot={props.metaRightSlot} />
    </div>
  );
}
