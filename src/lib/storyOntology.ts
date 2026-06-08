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
  /** 회차에 누적된 승인 캐논(project.canonFacts). 온보딩이 메타를 안 채워도 온톨로지를 채운다 — 갭 B. */
  canonFacts?: Array<{ owner: string; statement: string }>;
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

// 캐논 문장에서 주체 이름을 추출한다 — "강태준은 …" → "강태준". 조사/구두점 앞의 첫 토큰.
// generic 역할어·대명사는 고유 인물이 아니므로 시드하지 않는다(가짜 "주인공" 인물 방지 — P4).
const GENERIC_ENTITY_NAMES = new Set([
  '주인공', '주요 인물', '동료', '그', '그녀', '그들', '누군가', '사람', '인물', '아버지', '어머니', '오빠', '언니', '누나', '형'
]);
// 조직·가문·장소 접미사로 끝나면 인물이 아니다(은여우 상단·벨로트 가문 등). '성'·'문'은 인물명 오탐이 많아 제외.
const NON_PERSON_SUFFIXES = ['상단', '가문', '저택', '왕국', '제국', '기사단', '상회', '길드', '교단', '학파', '마을', '도시', '대륙'];
// 관계어 — "A의 [관계] 이름은 B" 에서 엣지 라벨로 인정할 친족·사회 관계 핵심어.
const RELATION_TERMS = ['오빠', '형', '누나', '언니', '동생', '남동생', '여동생', '아버지', '어머니', '아들', '딸', '남편', '아내', '형제', '자매', '약혼자', '약혼녀', '삼촌', '이모', '고모', '사촌', '할아버지', '할머니', '스승', '제자', '친구', '연인'];

// 추출한 토큰이 발명 아닌 실제 인물 이름인지 보수적으로 판정한다(길이·대명사·조직 접미사 가드).
function isPlausiblePersonName(name: string): boolean {
  if (name.length < 2 || name.length > 12) return false;
  if (GENERIC_ENTITY_NAMES.has(name)) return false;
  if (NON_PERSON_SUFFIXES.some((suffix) => name.endsWith(suffix))) return false;
  return true;
}

// 캐논 문장에서 주체 인물 이름을 추출한다. 조사(은/는/이/가/을/를/의/에게/와/과) 앞의
// 명사구(공백 포함, 성+이름 허용)를 첫 주체로 본다. 인물이 아니면 null — 발명 없이 보수적으로.
// P6 — 명명 계사 "(이)라는"을 조사보다 먼저 매칭해 이름에 "라"가 새지 않게 한다("레오르 벨로트라는" → "레오르 벨로트").
export function extractEntityName(statement: string): string | null {
  const match = statement.trim().match(/^([가-힣A-Za-z][가-힣A-Za-z\s]*?)(?:이라는|라는|은|는|이|가|을|를|의|에게|와|과)\s/);
  if (!match || !match[1]) return null;
  const name = match[1].trim();
  return isPlausiblePersonName(name) ? name : null;
}

// P5 — 서술부 명명("…이름은 X(이며/이다/…)")의 인물 이름을 추출한다. 주어만 잡던 한계 보강.
function extractPredicateName(statement: string): string | null {
  const match = statement.match(/이름은\s+([가-힣A-Za-z][가-힣A-Za-z\s]*?)(?:이며|이다|이고|입니다|,|\.|$)/);
  if (!match || !match[1]) return null;
  const name = match[1].trim();
  return isPlausiblePersonName(name) ? name : null;
}

// P5 — 캐논 문장에 등장하는 모든 인물 이름(주어 + 서술부 명명)을 발명 없이 추출한다.
// "리아나의 둘째 오빠 이름은 루시안 벨로트…" → ["리아나", "루시안 벨로트"].
export function extractCharacterNames(statement: string): string[] {
  const names: string[] = [];
  const subject = extractEntityName(statement);
  if (subject) names.push(subject);
  const predicate = extractPredicateName(statement);
  if (predicate && !names.includes(predicate)) names.push(predicate);
  return names;
}

// relations — "A의 [관계구] 이름은 B(이며/…)" 패턴만 보수적으로 인식해 관계 엣지를 추출한다.
// 관계어가 없거나 인물이 아니면 null — 발명 없이, 명시적 친족·사회 관계 캐논만 엣지로 올린다.
export function extractRelation(statement: string): { subject: string; label: string; target: string } | null {
  const match = statement.match(/^([가-힣A-Za-z][가-힣A-Za-z\s]*?)의\s+([가-힣\s]*?)\s*이름은\s+([가-힣A-Za-z][가-힣A-Za-z\s]*?)(?:이며|이다|이고|입니다|,|\.|$)/);
  if (!match) return null;
  const subject = match[1].trim();
  const label = match[2].trim();
  const target = match[3].trim();
  if (!isPlausiblePersonName(subject) || !isPlausiblePersonName(target) || subject === target) return null;
  if (!RELATION_TERMS.some((term) => label.includes(term))) return null;
  return { subject, label, target };
}

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

  // 갭 B — 회차에 누적된 승인 캐논(project.canonFacts)을 온톨로지 시드로 승격한다.
  // 발명 없이 이미 승인된 사실만 반영하므로 보수적 휴리스틱 원칙을 지킨다.
  for (const fact of input.canonFacts ?? []) {
    const statement = typeof fact?.statement === 'string' ? fact.statement.trim() : '';
    if (!statement) continue;
    const owner: CanonSeed['owner'] =
      fact.owner === 'character' || fact.owner === 'world' || fact.owner === 'plot' ? fact.owner : 'plot';
    canonSeeds.push({ owner, statement });
    if (owner === 'world') {
      worldRules.push({ id: `world-canon-${worldRules.length + 1}`, rule: statement, cost: extractCost(statement) });
    }
    if (owner === 'character') {
      const name = extractEntityName(statement);
      if (name && !characters.some((character) => character.name === name)) {
        characters.push({ id: `char-canon-${characters.length + 1}`, name, desire: statement, wound: '', falseBelief: '', need: '', taboo: '' });
      }
    }
  }

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
