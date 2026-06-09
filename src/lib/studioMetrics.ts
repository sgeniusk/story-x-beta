// Story X · M9 — M8 4 카드(하니스/품질/매체/온톨로지) 데이터 타입.
// 도메인 모듈의 출력을 이 모양으로 변환해 DataPanel 에 넘긴다.
// 도메인 로직은 건드리지 않고, 이미 계산된 report/snapshot 을 읽어 압축한다.
import type { MediaProjection as DomainMediaProjection } from './mediaProjection';
import type { QualityGatesReport, StoryMode } from './qualityGates';
import type { StoryHarnessReport } from './storyHarness';
import type { StoryOntology } from './storyOntology';
import type { Chapter } from './storyEngine';
import { computePayoffLedger, type PayoffLedgerReport } from './payoffLedger';

export type MetricTone = 'good' | 'warn' | 'neutral';

export interface HarnessLayer {
  name: string;
  pass: boolean;
}

export interface HarnessMetric {
  lead: string;
  tone: MetricTone;
  sub: string;
  layers: HarnessLayer[];
}

export interface QualityGate {
  key: string;
  pass: boolean;
  note?: string;
}

export interface QualityMetric {
  lead: string;
  tone: MetricTone;
  sub: string;
  gates: QualityGate[];
}

export interface MediaProjection {
  medium: string;
  fit: number;
  current: boolean;
}

export interface MediaMetric {
  lead: string;
  tone: MetricTone;
  sub: string;
  axis: number;
  projections: MediaProjection[];
}

export interface OntologyEntity {
  kind: string;
  count: number;
}

export interface OntologyMetric {
  lead: string;
  tone: MetricTone;
  sub: string;
  entities: OntologyEntity[];
  threads: number;
}

export interface StudioMetrics {
  harness: HarnessMetric;
  quality: QualityMetric;
  media: MediaMetric;
  ontology: OntologyMetric;
  /** 아크 페이오프 1단계 — 약속↔회수 정체 측정. chapters 미제공 시 measured=false. */
  payoff?: PayoffLedgerReport;
}

export interface ToStudioMetricsInput {
  harnessReport: StoryHarnessReport;
  qualityGatesReport: QualityGatesReport;
  mediaProjections: DomainMediaProjection[];
  storyOntology: StoryOntology;
  storyMode: StoryMode;
  currentMedium?: string;
  /** 아크 페이오프 1단계 — 회차 누적. payoff 측정에 쓴다. */
  chapters?: Chapter[];
}

const HARNESS_READY_SCORE = 70;
const MISSING_DRAMATIC_QUESTION = '아직 정해지지 않은 중심 질문';

const MEDIUM_LABELS: Record<string, string> = {
  novel: '소설',
  essay: '에세이',
  webtoon: '웹툰',
  'insta-toon': '인스타툰',
  'four-cut': '네컷'
};

export function toStudioMetrics(input: ToStudioMetricsInput): StudioMetrics {
  return {
    harness: toHarnessMetric(input.harnessReport),
    quality: toQualityMetric(input.qualityGatesReport),
    media: toMediaMetric(input.mediaProjections, input.storyMode, input.currentMedium),
    ontology: toOntologyMetric(input.storyOntology),
    payoff: computePayoffLedger(input.chapters ?? [])
  };
}

export function toHarnessMetric(report: StoryHarnessReport): HarnessMetric {
  const layers: HarnessLayer[] = report.stages.map((stage) => ({
    name: stage.title,
    pass: stage.status === 'pass'
  }));

  const derivedLayers: HarnessLayer[] = [
    { name: `점수 ${HARNESS_READY_SCORE}+`, pass: report.qualityScore >= HARNESS_READY_SCORE },
    { name: '제작 준비', pass: report.readyForProduction }
  ];

  for (const layer of derivedLayers) {
    if (layers.length >= 8) break;
    layers.push(layer);
  }

  const passed = layers.filter((layer) => layer.pass).length;
  const total = layers.length;

  return {
    lead: `${passed}/${total} 통과`,
    tone: total === 0 ? 'neutral' : passed === total ? 'good' : 'warn',
    sub: `${report.qualityScore}/100 · ${report.readyForProduction ? '제작 준비' : '보강 필요'}`,
    layers
  };
}

export function toQualityMetric(report: QualityGatesReport): QualityMetric {
  const passed = report.results.filter((result) => result.passed).length;
  const total = report.results.length;
  const blockingFailures = report.results.filter(
    (result) => result.requirement === 'blocking' && !result.passed
  ).length;
  const advisoryFailures = report.results.filter(
    (result) => result.requirement === 'advisory' && !result.passed
  ).length;

  return {
    lead: `${passed}/${total} 통과`,
    tone: total === 0 ? 'neutral' : passed === total ? 'good' : 'warn',
    sub: `강제 실패 ${blockingFailures} · 권고 실패 ${advisoryFailures}`,
    gates: report.results.map((result) => {
      const requirement = result.requirement === 'blocking' ? '강제' : '권고';
      return {
        key: result.gate.replace(/^gate_/, ''),
        pass: result.passed,
        note: result.passed ? requirement : `${requirement} · ${result.reason}`
      };
    })
  };
}

export function toMediaMetric(
  projections: DomainMediaProjection[],
  storyMode: StoryMode,
  currentMedium?: string
): MediaMetric {
  const currentTarget = normalizeCurrentTarget(currentMedium);
  const rows = projections
    .map((projection) => ({
      medium: MEDIUM_LABELS[projection.target] ?? projection.target,
      fit: projectionFit(projection),
      current: projection.target === currentTarget
    }))
    .sort((a, b) => {
      if (b.fit !== a.fit) return b.fit - a.fit;
      if (a.current !== b.current) return a.current ? -1 : 1;
      return a.medium.localeCompare(b.medium, 'ko');
    });
  const current = rows.find((row) => row.current);
  const leadRow = current ?? rows[0];
  const currentFit = current?.fit ?? leadRow?.fit ?? 0;
  const anyMissing = rows.some((row) => row.fit < 1);

  return {
    lead: leadRow?.medium ?? '미정',
    tone: rows.length === 0 ? 'neutral' : anyMissing || currentFit < 1 ? 'warn' : 'good',
    sub: rows.length === 0 ? '투영 없음' : `${rows.length}개 매체 · 핵심 ${Math.round(currentFit * 100)}%`,
    axis: clamp01(storyMode.literaryWeight),
    projections: rows
  };
}

export function toOntologyMetric(ontology: StoryOntology): OntologyMetric {
  const entities: OntologyEntity[] = [
    { kind: '인물', count: ontology.characters.length },
    { kind: '관계', count: ontology.relationships.length },
    { kind: '세계', count: ontology.worldRules.length },
    { kind: '갈등', count: ontology.conflictEngines.length },
    { kind: '플롯', count: ontology.plotThreads.length },
    { kind: '캐논', count: ontology.canonSeeds.length }
  ];
  const total = entities.reduce((sum, entity) => sum + entity.count, 0);
  const activeThreads = ontology.plotThreads.filter((thread) => thread.active).length;
  const needsAttention =
    !ontology.premise.dramaticQuestion.trim() ||
    ontology.premise.dramaticQuestion === MISSING_DRAMATIC_QUESTION ||
    ontology.characters.length === 0 ||
    ontology.worldRules.length === 0 ||
    ontology.conflictEngines.length === 0 ||
    ontology.plotThreads.length === 0;

  return {
    lead: String(total),
    tone: needsAttention ? 'warn' : 'good',
    sub: `${activeThreads}개 미해결 실 · ${needsAttention ? '보강 필요' : '중심 질문 있음'}`,
    entities,
    threads: activeThreads
  };
}

function projectionFit(projection: DomainMediaProjection): number {
  const preserved = projection.preservation.preservedCore.length;
  const total = preserved + projection.preservation.missing.length;
  if (total === 0) return projection.preservation.preserved ? 1 : 0;
  return clamp01(preserved / total);
}

function normalizeCurrentTarget(currentMedium?: string): string | null {
  switch (currentMedium) {
    case 'novel':
    case 'essay':
    case 'webtoon':
    case 'insta-toon':
    case 'four-cut':
      return currentMedium;
    case 'comics':
      return 'webtoon';
    default:
      return null;
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
