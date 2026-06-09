import { useState, type ReactNode } from 'react';
import type { MetricTone, StudioMetrics } from '../lib/studioMetrics';

interface Props {
  metrics: StudioMetrics;
  onMediaAxisChange?: (axis: number) => void;
}

export function DataPanel({ metrics, onMediaAxisChange }: Props) {
  const TONE_KEYS: (keyof StudioMetrics)[] = ['harness', 'quality', 'media', 'ontology'];
  const initial =
    metrics.quality.tone === 'warn'
      ? 'quality'
      : TONE_KEYS.find((key) => (metrics[key] as { tone?: string } | undefined)?.tone === 'warn') ?? 'harness';
  const [open, setOpen] = useState<string | null>(initial);
  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));

  return (
    <div className="sx-data-stack">
      <MetricCard
        title="하니스"
        lead={metrics.harness.lead}
        tone={metrics.harness.tone}
        sub={metrics.harness.sub}
        open={open === 'harness'}
        onToggle={() => toggle('harness')}
      >
        <div className="sx-layer-grid">
          {metrics.harness.layers.map((layer) => (
            <span key={layer.name} className="sx-layer-row">
              <span className={`sx-tick ${layer.pass ? '' : 'fail'}`}>{layer.pass ? '✓' : '!'}</span>
              {layer.name}
            </span>
          ))}
        </div>
      </MetricCard>

      <MetricCard
        title="품질 게이트"
        lead={metrics.quality.lead}
        tone={metrics.quality.tone}
        sub={metrics.quality.sub}
        open={open === 'quality'}
        onToggle={() => toggle('quality')}
      >
        {metrics.quality.gates.map((gate) => (
          <div key={gate.key} className={`sx-gate-row ${gate.pass ? '' : 'off'}`}>
            <span className="sx-gate-sw" />
            <span className="sx-gate-key">{gate.key}</span>
            {gate.note && <span className="sx-gate-note">{gate.note}</span>}
          </div>
        ))}
      </MetricCard>

      <MetricCard
        title="매체 투사"
        lead={metrics.media.lead}
        tone={metrics.media.tone}
        sub={metrics.media.sub}
        open={open === 'media'}
        onToggle={() => toggle('media')}
      >
        <div className="sx-axis-row">
          <div className="sx-axis-labels">
            <span>commercial</span>
            <span>literary</span>
          </div>
          <div className="sx-axis-track" aria-hidden="true">
            <span className="sx-axis-knob" style={{ left: `${metrics.media.axis * 100}%` }} />
          </div>
          {onMediaAxisChange && (
            <input
              className="sx-axis-input"
              type="range"
              min={0}
              max={100}
              value={Math.round(metrics.media.axis * 100)}
              onChange={(event) => onMediaAxisChange(Number(event.target.value) / 100)}
              aria-label="작품 무게중심 (좌: 대중성 / 우: 작품성)"
            />
          )}
        </div>
        {metrics.media.projections.map((projection) => (
          <div key={projection.medium} className={`sx-media-row ${projection.current ? 'cur' : ''}`}>
            <span className="sx-media-name">{projection.medium}</span>
            <span className="sx-media-bar">
              <i style={{ width: `${projection.fit * 100}%` }} />
            </span>
            <span className="sx-media-fit">{Math.round(projection.fit * 100)}</span>
          </div>
        ))}
      </MetricCard>

      <MetricCard
        title="온톨로지"
        lead={metrics.ontology.lead}
        tone={metrics.ontology.tone}
        sub={metrics.ontology.sub}
        open={open === 'ontology'}
        onToggle={() => toggle('ontology')}
      >
        <div className="sx-ent-grid">
          {metrics.ontology.entities.map((entity) => (
            <span key={entity.kind} className="sx-ent-cell">
              <span className="sx-ent-v">{entity.count}</span>
              <span className="sx-ent-k">{entity.kind}</span>
            </span>
          ))}
          <span className="sx-thread-row">
            <span className="sx-thread-n">{metrics.ontology.threads}</span>
            <span>개의 미해결 실 — 아직 안 거둔 복선</span>
          </span>
        </div>
      </MetricCard>
    </div>
  );
}

interface CardProps {
  title: string;
  lead: string;
  tone: MetricTone;
  sub: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function MetricCard({ title, lead, tone, sub, open, onToggle, children }: CardProps) {
  return (
    <div className={`sx-mcard ${open ? 'is-open' : ''}`}>
      <div
        className="sx-mcard__head"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <span className={`sx-mcard__dot ${tone}`} />
        <span className="sx-mcard__title">
          <span className="t">{title}</span>
          <span className="s">{sub}</span>
        </span>
        <span className="sx-mcard__tail">
          <span className={`sx-mcard__lead ${tone}`}>{lead}</span>
          <svg className="sx-mcard__chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </span>
      </div>
      <div className="sx-mcard__body">
        <div className="sx-mcard__body-inner">{children}</div>
      </div>
    </div>
  );
}
