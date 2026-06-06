// 긴장·분량 곡선 — beat별 긴장 강도(실값)와 분량 비중(계획 프록시)을 SVG 라인차트로 그린다
import type { Chapter, ChapterBeat } from '../lib/storyEngine';

// 긴장 · 분량 곡선 — beat별 SVG 라인차트.
// 긴장 강도는 beat.tension(실제 값), 분량 비중은 beat.summary 길이를 프록시로 쓴 계획 값이다.
export function TensionShareChart({
  chapter,
  activeBeatId,
  onSelectBeat
}: {
  chapter: Chapter | null;
  activeBeatId: string | null;
  onSelectBeat: (beat: ChapterBeat) => void;
}) {
  const beats = chapter?.beats ?? [];

  if (!chapter || beats.length === 0) {
    return (
      <section className="sx-panel ex-chart-card" aria-label="긴장 · 분량 곡선">
        <div className="ex-rail-section-head">
          <span className="ex-rail-label">긴장 · 분량 곡선</span>
        </div>
        <p className="ex-beats-empty">초안을 생성하면 회차별 긴장 곡선이 여기에 그려집니다.</p>
      </section>
    );
  }

  const W = 248;
  const H = 116;
  const P = { t: 14, r: 8, b: 24, l: 8 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const n = beats.length;
  const xs = beats.map((_, i) => (n > 1 ? P.l + (innerW * i) / (n - 1) : P.l + innerW / 2));

  const tensionY = (t: number) => P.t + innerH * (1 - Math.max(0, Math.min(100, t)) / 100);

  // 분량 비중 — 실제 회차별 글자 수가 없어(원고가 단일 textarea), summary 길이를 계획 프록시로 쓴다
  const summaryLens = beats.map((beat) => beat.summary.length || 1);
  const totalSummary = summaryLens.reduce((sum, len) => sum + len, 0) || 1;
  const shares = summaryLens.map((len) => (len / totalSummary) * 100);
  const maxShare = Math.max(...shares, 1);
  const shareY = (s: number) => P.t + innerH * (1 - s / Math.max(maxShare * 1.15, 10));

  const linePath = (yOf: (i: number) => number) =>
    beats.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${yOf(i).toFixed(1)}`).join(' ');

  const tensionPath = linePath((i) => tensionY(beats[i].tension));
  const sharePath = linePath((i) => shareY(shares[i]));
  const activeIndex = beats.findIndex((beat) => beat.id === activeBeatId);

  return (
    <section className="sx-panel ex-chart-card" aria-label="긴장 · 분량 곡선">
      <div className="ex-rail-section-head">
        <span className="ex-rail-label">긴장 · 분량 곡선</span>
        <span className="ex-chart-hint">비트별</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="ex-chart-svg"
        width="100%"
        height={H}
        role="img"
        aria-label="긴장 강도와 분량 비중을 비트별로 보여주는 선 그래프"
      >
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={P.l}
            x2={W - P.r}
            y1={P.t + innerH * g}
            y2={P.t + innerH * g}
            className="ex-chart-grid"
          />
        ))}
        {activeIndex >= 0 && (
          <line
            x1={xs[activeIndex]}
            x2={xs[activeIndex]}
            y1={P.t}
            y2={P.t + innerH}
            className="ex-chart-guide"
          />
        )}
        <path d={sharePath} className="ex-chart-line ex-chart-line--share" fill="none" />
        <path d={tensionPath} className="ex-chart-line ex-chart-line--tension" fill="none" />
        {beats.map((beat, i) => {
          const isActive = beat.id === activeBeatId;

          return (
            <g
              key={beat.id}
              className="ex-chart-dotgroup"
              onClick={() => onSelectBeat(beat)}
              role="button"
              tabIndex={0}
              aria-label={`구성 ${beat.no} — ${beat.label}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectBeat(beat);
                }
              }}
            >
              <circle
                cx={xs[i]}
                cy={tensionY(beat.tension)}
                r={isActive ? 4 : 2.6}
                className={`ex-chart-dot ${isActive ? 'is-active' : ''}`}
              />
              <text
                x={xs[i]}
                y={H - 6}
                className={`ex-chart-xlabel ${isActive ? 'is-active' : ''}`}
                textAnchor="middle"
              >
                {beat.no}
              </text>
              <rect x={xs[i] - 14} y={P.t} width={28} height={innerH} fill="transparent" />
            </g>
          );
        })}
      </svg>
      <div className="ex-chart-legend">
        <span>
          <i className="ex-chart-swatch ex-chart-swatch--tension" /> 긴장 강도
        </span>
        <span>
          <i className="ex-chart-swatch ex-chart-swatch--share" /> 분량 비중 · 계획
        </span>
      </div>
    </section>
  );
}
