// M4 청크 B · Layer 0 사전 제작 게이트 1/2 — 스토리 온톨로지.
// 작가 입력(소재·스토리 씨앗·인물 씨앗·독자·제약) 을 받아 작품 그래프(전제·인물·세계 규칙·갈등·플롯) 의 첫 컷을 만든다.
// 휴리스틱은 보수적으로 — 입력 텍스트를 보존하고, 빈 영역은 비워 두며, 검증자(validateStoryOntology) 가 누락을 경고로 노출한다.
// 정본 — docs/storyx-harness-architecture.md § 3-1, docs/superpowers/plans/2026-05-12-story-ontology-harness.md Chunk 1.

export interface StoryPremise {
  oneSentence: string;
  /** 독자가 끝까지 따라갈 중심 질문. 비어 있으면 검증자가 차단형 경고를 낸다. */
  dramaticQuestion: string;
  readerPromise: string;
  genreContract: string;
  failureMode: string;
}

export interface ThemeClaim {
  statement: string;
  /** 작품 안에서 이 가치 판단이 실제로 시험되는가. */
  tested: boolean;
}

export interface CharacterNode {
  id: string;
  name: string;
  desire: string;
  wound: string;
  falseBelief: string;
  need: string;
  taboo: string;
}

export interface RelationshipEdge {
  fromId: string;
  toId: string;
  kind: 'debt' | 'secret' | 'power' | 'feeling';
  detail: string;
}

export interface WorldRuleNode {
  id: string;
  /** 세계가 어떻게 동작하는가의 규칙. */
  rule: string;
  /** 규칙이 강제하는 비용 — 비어 있으면 쉬운 해결을 막지 못한다. */
  cost: string;
  exception?: string;
}

export interface ConflictEngine {
  id: string;
  kind: 'external' | 'internal' | 'relational' | 'systemic';
  detail: string;
}

export interface PlotThread {
  id: string;
  /** 독자에게 한 약속. */
  promise: string;
  /** 그 약속을 회수할 조건(언제·어디서). 비어 있으면 떡밥이 떠다니게 된다. */
  payoffCondition: string;
  active: boolean;
}

export interface CanonSeed {
  owner: 'character' | 'world' | 'plot';
  statement: string;
}

export interface StoryOntology {
  premise: StoryPremise;
  theme: ThemeClaim;
  characters: CharacterNode[];
  relationships: RelationshipEdge[];
  worldRules: WorldRuleNode[];
  conflictEngines: ConflictEngine[];
  plotThreads: PlotThread[];
  canonSeeds: CanonSeed[];
}

export interface BuildOntologyInput {
  material: string;
  storySeed: string;
  characterSeed: string;
  audience: string;
  constraints: string;
}

export interface OntologyWarning {
  code:
    | 'missing-dramatic-question'
    | 'missing-world-cost'
    | 'thread-without-payoff'
    | 'no-character'
    | 'no-conflict'
    | 'no-plot-thread';
  message: string;
  target?: string;
}

export interface OntologyValidationReport {
  valid: boolean;
  warnings: OntologyWarning[];
}

/** dramaticQuestion 이 비어 있을 때 채우는 placeholder — 검증자가 이 값을 'missing' 으로 잡는다. */
const MISSING_DRAMATIC_QUESTION = '아직 정해지지 않은 중심 질문';

// 입력 텍스트만으로 첫 컷 그래프를 만든다. 빈 영역은 빈 채로 둔다 (silent fix 금지).
export function buildStoryOntology(input: BuildOntologyInput): StoryOntology {
  const material = input.material.trim();
  const storySeed = input.storySeed.trim();
  const characterSeed = input.characterSeed.trim();
  const audience = input.audience.trim();
  const constraints = input.constraints.trim();

  // 인물 — characterSeed 가 "이름: 설명" 형태면 분리. 콜론 없으면 통째로 desire 에 둔다.
  const characters: CharacterNode[] = [];
  if (characterSeed) {
    const colonIdx = characterSeed.indexOf(':');
    const name = colonIdx >= 0 ? characterSeed.slice(0, colonIdx).trim() || '주인공' : '주인공';
    const detail = colonIdx >= 0 ? characterSeed.slice(colonIdx + 1).trim() : characterSeed;
    characters.push({
      id: 'char-1',
      name,
      desire: detail,
      wound: '',
      falseBelief: '',
      need: '',
      taboo: ''
    });
  }

  // 세계 규칙 — storySeed 가 "X 하면 Y 이 사라진다" 같은 인과 절을 담을 때 cost 를 마지막 절로 추출.
  const worldRules: WorldRuleNode[] = [];
  if (storySeed) {
    const cost = extractCost(storySeed);
    worldRules.push({
      id: 'world-1',
      rule: storySeed,
      cost
    });
  }

  // 갈등·플롯 — material 이 있으면 최소 1개씩.
  const conflictEngines: ConflictEngine[] = [];
  const plotThreads: PlotThread[] = [];
  if (material) {
    conflictEngines.push({
      id: 'conflict-1',
      kind: 'internal',
      detail: material
    });
    plotThreads.push({
      id: 'thread-1',
      promise: material,
      payoffCondition: '후속 회차/원고에서 회수',
      active: true
    });
  }

  // 캐논 시드 — 작가 입력을 출처가 명확한 캐논 후보로 보존.
  const canonSeeds: CanonSeed[] = [];
  if (characterSeed) canonSeeds.push({ owner: 'character', statement: characterSeed });
  if (storySeed) canonSeeds.push({ owner: 'world', statement: storySeed });
  if (material) canonSeeds.push({ owner: 'plot', statement: material });

  return {
    premise: {
      oneSentence: [material, storySeed].filter(Boolean).join('. '),
      dramaticQuestion: material || MISSING_DRAMATIC_QUESTION,
      readerPromise: audience,
      genreContract: constraints,
      failureMode: ''
    },
    theme: {
      statement: '',
      tested: false
    },
    characters,
    relationships: [],
    worldRules,
    conflictEngines,
    plotThreads,
    canonSeeds
  };
}

// 누락·미완 항목을 경고로 노출. silent fix 금지 — valid=false 면 storyHarness 가 차단형으로 처리.
export function validateStoryOntology(ontology: StoryOntology): OntologyValidationReport {
  const warnings: OntologyWarning[] = [];

  const dq = ontology.premise.dramaticQuestion.trim();
  if (!dq || dq === MISSING_DRAMATIC_QUESTION) {
    warnings.push({
      code: 'missing-dramatic-question',
      message: '중심 질문(dramaticQuestion) 이 비어 있습니다 — 작가가 한 줄로 정해야 합니다.'
    });
  }

  for (const rule of ontology.worldRules) {
    if (!rule.cost.trim()) {
      warnings.push({
        code: 'missing-world-cost',
        message: `세계 규칙 ${rule.id} 의 비용(cost) 이 비어 있어 쉬운 해결을 막지 못합니다.`,
        target: rule.id
      });
    }
  }

  for (const thread of ontology.plotThreads) {
    if (!thread.payoffCondition.trim()) {
      warnings.push({
        code: 'thread-without-payoff',
        message: `플롯 스레드 ${thread.id} 에 회수 조건이 없습니다.`,
        target: thread.id
      });
    }
  }

  if (ontology.characters.length === 0) {
    warnings.push({ code: 'no-character', message: '인물이 하나도 없습니다 — 인물 씨앗을 적어 주세요.' });
  }

  if (ontology.conflictEngines.length === 0) {
    warnings.push({ code: 'no-conflict', message: '갈등 엔진이 없습니다 — 작품이 어떤 압력으로 굴러가는지 명시해야 합니다.' });
  }

  if (ontology.plotThreads.length === 0) {
    warnings.push({ code: 'no-plot-thread', message: '플롯 스레드가 없습니다 — 독자에게 한 약속이 없습니다.' });
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

// storySeed 의 마지막 절을 cost 로 추출. 보수적 휴리스틱 — 인과 절이 없으면 통째로 cost 로 본다.
function extractCost(storySeed: string): string {
  const parts = storySeed.split(/[,.]\s*/).filter((s) => s.trim().length > 0);
  if (parts.length === 0) return '';
  return parts[parts.length - 1].trim();
}
