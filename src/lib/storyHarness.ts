// M4 청크 B · Layer 0 사전 제작 게이트 2/2 — 스토리 하네스 6단계 스테이지.
// runStoryHarness(input) 가 진단·전제·온톨로지·압력·문체·매체 6 단계를 순서대로 돌리며 점수를 합산한다.
// qualityScore ≥ 70 이면 readyForProduction=true, 그 미만이면 차단·리페어 제안.
// 정본 — docs/storyx-harness-architecture.md § 3-1, ontology-harness plan Chunk 2.
import {
  buildStoryOntology,
  validateStoryOntology,
  type BuildOntologyInput,
  type StoryOntology
} from './storyOntology';

export type HarnessStageId =
  | 'story-sense'
  | 'premise-forge'
  | 'ontology-builder'
  | 'pressure-test'
  | 'korean-voice-gate'
  | 'media-projection';

export type StageStatus = 'pass' | 'warning' | 'block';

export interface HarnessStageResult {
  id: HarnessStageId;
  title: string;
  status: StageStatus;
  findings: string[];
  /** 작가에게 보낼 리페어 제안 — 점수 낮은 항목은 여기서 구체 문구를 받는다. */
  requiredRepairs: string[];
  score: number;
  maxScore: number;
}

export interface RunStoryHarnessInput extends BuildOntologyInput {
  medium: string;
  formatLabel: string;
}

export interface StoryHarnessReport {
  stages: HarnessStageResult[];
  /** 0~100 — 6 stage 점수 합. ≥ 70 이면 readyForProduction. */
  qualityScore: number;
  readyForProduction: boolean;
  ontology: StoryOntology;
}

const READY_THRESHOLD = 70;

// 6단계 순차 실행. 각 stage 가 점수/리페어를 산출하고, 합산하여 readyForProduction 판정.
export function runStoryHarness(input: RunStoryHarnessInput): StoryHarnessReport {
  const ontology = buildStoryOntology(input);
  const validation = validateStoryOntology(ontology);

  const stages: HarnessStageResult[] = [
    runStorySenseStage(input),
    runPremiseForgeStage(ontology, validation.warnings.some((w) => w.code === 'missing-dramatic-question')),
    runOntologyBuilderStage(ontology),
    runPressureTestStage(ontology),
    runKoreanVoiceGateStage(input),
    runMediaProjectionStage(input)
  ];

  const qualityScore = stages.reduce((sum, stage) => sum + stage.score, 0);
  const anyBlocked = stages.some((stage) => stage.status === 'block');

  return {
    stages,
    qualityScore,
    readyForProduction: qualityScore >= READY_THRESHOLD && !anyBlocked,
    ontology
  };
}

// Stage 1 — 입력 충실도. 5개 입력 슬롯 중 채워진 비율에 비례 (10점 만점).
function runStorySenseStage(input: RunStoryHarnessInput): HarnessStageResult {
  const slots: Array<[string, string]> = [
    ['소재', input.material],
    ['스토리 씨앗', input.storySeed],
    ['인물 씨앗', input.characterSeed],
    ['독자', input.audience],
    ['제약', input.constraints]
  ];
  const filled = slots.filter(([, value]) => value.trim().length > 0);
  const empty = slots.filter(([, value]) => value.trim().length === 0);

  const score = Math.round((filled.length / slots.length) * 10);
  const status: StageStatus = filled.length === 0 ? 'block' : filled.length < 3 ? 'warning' : 'pass';

  return {
    id: 'story-sense',
    title: '진단 · 스토리 센스',
    status,
    findings: filled.length > 0 ? [`${filled.length}/5 입력 슬롯이 채워졌습니다.`] : ['모든 입력이 비어 있어 진단할 수 없습니다.'],
    requiredRepairs: empty.map(([label]) => `${label} 슬롯을 한 줄로 채워 주세요.`),
    score,
    maxScore: 10
  };
}

// Stage 2 — 전제 단조. dramaticQuestion 의 유효성만 검사 (10점 만점).
function runPremiseForgeStage(ontology: StoryOntology, missingDramaticQuestion: boolean): HarnessStageResult {
  if (missingDramaticQuestion) {
    return {
      id: 'premise-forge',
      title: '전제 단조',
      status: 'block',
      findings: ['중심 질문(dramaticQuestion) 이 비어 있어 작품 약속을 만들 수 없습니다.'],
      requiredRepairs: ['소재 한 줄을 적어 주세요 — 작품이 끝까지 따라갈 질문이 됩니다.'],
      score: 0,
      maxScore: 10
    };
  }
  return {
    id: 'premise-forge',
    title: '전제 단조',
    status: 'pass',
    findings: [`중심 질문: ${ontology.premise.dramaticQuestion}`],
    requiredRepairs: [],
    score: 10,
    maxScore: 10
  };
}

// Stage 3 — 온톨로지 빌더. characters/worldRules/conflictEngines/plotThreads 가 모두 ≥ 1 (30점).
function runOntologyBuilderStage(ontology: StoryOntology): HarnessStageResult {
  let score = 0;
  const findings: string[] = [];
  const repairs: string[] = [];

  if (ontology.characters.length > 0) {
    score += 8;
    findings.push(`인물 ${ontology.characters.length}명`);
  } else {
    repairs.push('인물 씨앗을 적어 주세요 — 욕망·상처가 있는 인물 한 명이라도.');
  }
  if (ontology.worldRules.length > 0) {
    score += 8;
    findings.push(`세계 규칙 ${ontology.worldRules.length}개`);
  } else {
    repairs.push('세계 규칙을 한 줄 적어 주세요 — 작품이 어떻게 동작하는지.');
  }
  if (ontology.conflictEngines.length > 0) {
    score += 7;
    findings.push(`갈등 엔진 ${ontology.conflictEngines.length}개`);
  } else {
    repairs.push('갈등 엔진이 없습니다 — 어떤 압력이 이야기를 굴리는지.');
  }
  if (ontology.plotThreads.length > 0) {
    score += 7;
    findings.push(`플롯 스레드 ${ontology.plotThreads.length}개`);
  } else {
    repairs.push('플롯 스레드가 없습니다 — 독자에게 한 약속이라도.');
  }

  const status: StageStatus = score === 30 ? 'pass' : score >= 15 ? 'warning' : 'block';
  return {
    id: 'ontology-builder',
    title: '온톨로지 빌더',
    status,
    findings,
    requiredRepairs: repairs,
    score,
    maxScore: 30
  };
}

// Stage 4 — 압력 시험. worldRule.cost 충실(15) + conflictEngines 존재(10) (25점).
function runPressureTestStage(ontology: StoryOntology): HarnessStageResult {
  let score = 0;
  const findings: string[] = [];
  const repairs: string[] = [];

  const firstRule = ontology.worldRules[0];
  if (firstRule && firstRule.cost.trim().length > 0) {
    score += 15;
    findings.push(`세계 규칙의 비용: ${firstRule.cost}`);
  } else {
    repairs.push('세계 규칙의 비용(cost) 이 비어 있어 쉬운 해결을 막지 못합니다.');
  }

  if (ontology.conflictEngines.length > 0) {
    score += 10;
    findings.push(`갈등 ${ontology.conflictEngines.length}개 활성`);
  } else {
    repairs.push('갈등 엔진이 없으면 회차 단위 압력이 생기지 않습니다.');
  }

  const status: StageStatus = score === 25 ? 'pass' : score >= 10 ? 'warning' : 'block';
  return {
    id: 'pressure-test',
    title: '압력 시험',
    status,
    findings,
    requiredRepairs: repairs,
    score,
    maxScore: 25
  };
}

// Stage 5 — 한국어 문체 게이트. 1차 컷은 medium 존재 여부만. 청크 D 에서 voice_signature 본격 도입.
function runKoreanVoiceGateStage(input: RunStoryHarnessInput): HarnessStageResult {
  const ok = input.medium.trim().length > 0;
  return {
    id: 'korean-voice-gate',
    title: '한국어 문체 게이트',
    status: ok ? 'pass' : 'warning',
    findings: ok
      ? [`매체 '${input.medium}' 의 한국어 톤 기준을 따릅니다.`]
      : ['매체가 정해지지 않아 문체 기준을 잡지 못했습니다.'],
    requiredRepairs: ok ? [] : ['매체(소설/에세이/만화/오디오북) 를 먼저 정해 주세요.'],
    score: ok ? 10 : 5,
    maxScore: 10
  };
}

// Stage 6 — 매체 투영 가능성. 1차 컷은 medium 존재만. 청크 G 에서 mediaProjection 본격 도입.
function runMediaProjectionStage(input: RunStoryHarnessInput): HarnessStageResult {
  const ok = input.medium.trim().length > 0;
  return {
    id: 'media-projection',
    title: '매체 투영',
    status: ok ? 'pass' : 'warning',
    findings: ok
      ? [`매체 '${input.medium}' 로 투영 가능 (포맷 ${input.formatLabel || '미지정'}).`]
      : ['매체 미지정 — 같은 온톨로지를 어떤 형태로 보여 줄지 모릅니다.'],
    requiredRepairs: ok ? [] : ['매체와 포맷을 정해 주세요.'],
    score: ok ? 10 : 5,
    maxScore: 10
  };
}
