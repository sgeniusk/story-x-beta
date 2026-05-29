import { describe, expect, it } from 'vitest';
import {
  toHarnessMetric,
  toMediaMetric,
  toOntologyMetric,
  toQualityMetric,
  toStudioMetrics
} from './studioMetrics';
import type { MediaProjection as DomainMediaProjection } from './mediaProjection';
import type { QualityGatesReport, StoryMode } from './qualityGates';
import type { HarnessStageResult, StoryHarnessReport } from './storyHarness';
import type { StoryOntology } from './storyOntology';

const stage = (
  id: HarnessStageResult['id'],
  title: string,
  status: HarnessStageResult['status'] = 'pass',
  score = 10,
  maxScore = 10
): HarnessStageResult => ({
  id,
  title,
  status,
  findings: [],
  requiredRepairs: status === 'pass' ? [] : [`${title} 보강 필요`],
  score,
  maxScore
});

const harnessReport: StoryHarnessReport = {
  stages: [
    stage('story-sense', '진단'),
    stage('premise-forge', '전제'),
    stage('ontology-builder', '온톨로지', 'warning', 20, 30),
    stage('pressure-test', '압력', 'pass', 25, 25),
    stage('korean-voice-gate', '문체'),
    stage('media-projection', '매체')
  ],
  qualityScore: 75,
  readyForProduction: true,
  ontology: {} as StoryOntology
};

const qualityReport: QualityGatesReport = {
  blockingPassed: false,
  advisoryFailures: 1,
  results: [
    {
      gate: 'gate_scene_sequel_balance',
      track: 'common',
      requirement: 'blocking',
      passed: true,
      reason: '호흡이 안정적입니다.'
    },
    {
      gate: 'gate_pressure_triangle_active',
      track: 'common',
      requirement: 'blocking',
      passed: false,
      reason: 'pressure triangle 이 비어 있습니다.'
    },
    {
      gate: 'gate_motif_variation',
      track: 'literary',
      requirement: 'advisory',
      passed: true,
      reason: '모티프가 변주됩니다.'
    }
  ]
};

const mediaProjections: DomainMediaProjection[] = [
  {
    target: 'essay',
    fields: { voiceBible: '담담한 거리' },
    preservation: {
      preserved: false,
      preservedCore: ['premise.dramaticQuestion', 'characters[0].desire'],
      missing: ['worldRules[0].cost', 'plotThreads[0]']
    }
  },
  {
    target: 'novel',
    fields: { chapterPromise: '다음 회차 약속' },
    preservation: {
      preserved: true,
      preservedCore: [
        'premise.dramaticQuestion',
        'characters[0].desire',
        'worldRules[0].cost',
        'plotThreads[0]'
      ],
      missing: []
    }
  },
  {
    target: 'webtoon',
    fields: { visualAnchor: '달의 탑' },
    preservation: {
      preserved: false,
      preservedCore: ['premise.dramaticQuestion'],
      missing: ['characters[0].desire', 'worldRules[0].cost', 'plotThreads[0]']
    }
  }
];

const storyMode: StoryMode = {
  commercialWeight: 0.25,
  literaryWeight: 0.75
};

const ontology: StoryOntology = {
  premise: {
    oneSentence: '탑이 무너진 밤의 약속',
    dramaticQuestion: '탑이 무너진 뒤에도 약속은 지켜질까?',
    readerPromise: '관계와 비용',
    genreContract: '장편',
    failureMode: ''
  },
  theme: { statement: '살아남은 사람의 책임', tested: true },
  characters: [
    {
      id: 'char-1',
      name: '이안',
      desire: '동생을 구한다',
      wound: '',
      falseBelief: '',
      need: '',
      taboo: ''
    },
    {
      id: 'char-2',
      name: '윤',
      desire: '탑의 진실을 밝힌다',
      wound: '',
      falseBelief: '',
      need: '',
      taboo: ''
    }
  ],
  relationships: [{ fromId: 'char-1', toId: 'char-2', kind: 'debt', detail: '목숨 빚' }],
  worldRules: [{ id: 'world-1', rule: '탑은 기억을 먹는다', cost: '이름을 잃는다' }],
  conflictEngines: [],
  plotThreads: [
    { id: 'thread-1', promise: '사라진 이름', payoffCondition: '후반부', active: true },
    { id: 'thread-2', promise: '닫힌 문', payoffCondition: '중반부', active: false }
  ],
  canonSeeds: [{ owner: 'plot', statement: '탑은 기억을 먹는다' }]
};

describe('studioMetrics adapters', () => {
  it('maps harness stages into an 8-layer metric with warn tone when any layer needs work', () => {
    const metric = toHarnessMetric(harnessReport);

    expect(metric.lead).toBe('7/8 통과');
    expect(metric.tone).toBe('warn');
    expect(metric.sub).toContain('75/100');
    expect(metric.layers).toHaveLength(8);
    expect(metric.layers.map((layer) => layer.pass)).toEqual([
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      true
    ]);
  });

  it('maps quality gates into pass counts and exposes failed reasons without hiding advisory failures', () => {
    const metric = toQualityMetric(qualityReport);

    expect(metric.lead).toBe('2/3 통과');
    expect(metric.tone).toBe('warn');
    expect(metric.gates).toEqual([
      { key: 'scene_sequel_balance', pass: true, note: '강제' },
      {
        key: 'pressure_triangle_active',
        pass: false,
        note: '강제 · pressure triangle 이 비어 있습니다.'
      },
      { key: 'motif_variation', pass: true, note: '권고' }
    ]);
  });

  it('sorts media projections by fit, marks the current medium, and maps story mode to the axis', () => {
    const metric = toMediaMetric(mediaProjections, storyMode, 'essay');

    expect(metric.lead).toBe('에세이');
    expect(metric.tone).toBe('warn');
    expect(metric.axis).toBe(0.75);
    expect(metric.projections.map((projection) => projection.medium)).toEqual(['소설', '에세이', '웹툰']);
    expect(metric.projections.map((projection) => projection.fit)).toEqual([1, 0.5, 0.25]);
    expect(metric.projections.find((projection) => projection.medium === '에세이')?.current).toBe(true);
  });

  it('summarizes ontology entity volume and active unresolved threads', () => {
    const metric = toOntologyMetric(ontology);

    expect(metric.lead).toBe('7');
    expect(metric.tone).toBe('warn');
    expect(metric.threads).toBe(1);
    expect(metric.entities).toEqual([
      { kind: '인물', count: 2 },
      { kind: '관계', count: 1 },
      { kind: '세계', count: 1 },
      { kind: '갈등', count: 0 },
      { kind: '플롯', count: 2 },
      { kind: '캐논', count: 1 }
    ]);
  });

  it('combines all domain reports into StudioMetrics without changing the source reports', () => {
    const metrics = toStudioMetrics({
      harnessReport,
      qualityGatesReport: qualityReport,
      mediaProjections,
      storyOntology: ontology,
      storyMode,
      currentMedium: 'essay'
    });

    expect(metrics.harness.lead).toBe('7/8 통과');
    expect(metrics.quality.lead).toBe('2/3 통과');
    expect(metrics.media.lead).toBe('에세이');
    expect(metrics.ontology.lead).toBe('7');
  });
});
