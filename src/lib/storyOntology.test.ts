// M4 청크 B · storyOntology TDD 케이스.
// Chunk 1 정본(docs/superpowers/plans/2026-05-12-story-ontology-harness.md) 의 테스트 스켈레톤 + 검증 케이스.
import { describe, expect, it } from 'vitest';
import { buildStoryOntology, validateStoryOntology, extractEntityName, type StoryOntology } from './storyOntology';

describe('storyOntology', () => {
  // Chunk 1 / Task 1 — 완전한 입력에서 핵심 엔티티가 모두 채워진다.
  it('requires premise, character desire, world cost, conflict, and plot thread', () => {
    const ontology = buildStoryOntology({
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '연재 미스터리와 감정 서사를 좋아하는 독자',
      constraints: '장편'
    });
    const report = validateStoryOntology(ontology);

    expect(report.valid).toBe(true);
    expect(ontology.premise.dramaticQuestion).toContain('찾');
    expect(ontology.characters[0].desire).toBeTruthy();
    expect(ontology.worldRules[0].cost).toBeTruthy();
    expect(ontology.conflictEngines.length).toBeGreaterThan(0);
    expect(ontology.plotThreads.length).toBeGreaterThan(0);
  });

  // Chunk 1 / Task 2 — 누락 항목을 경고로 노출 (silent fix 금지).
  it('warns on missing dramatic question (빈 material)', () => {
    const ontology = buildStoryOntology({
      material: '',
      storySeed: '도시는 비가 멈추지 않는다',
      characterSeed: '윤: 우산을 잃은 사람',
      audience: '',
      constraints: ''
    });
    const report = validateStoryOntology(ontology);

    expect(report.valid).toBe(false);
    expect(report.warnings.some((w) => w.code === 'missing-dramatic-question')).toBe(true);
  });

  it('warns on missing world cost (cost 가 비어 있게 강제)', () => {
    // 직접 ontology 를 구성해 cost 가 빈 worldRule 을 만든다 — buildStoryOntology 휴리스틱과 분리해서 검증자만 시험.
    const ontology: StoryOntology = {
      premise: {
        oneSentence: '주인공이 결정을 미룬다.',
        dramaticQuestion: '주인공이 결정을 미룬다.',
        readerPromise: '',
        genreContract: '',
        failureMode: ''
      },
      theme: { statement: '', tested: false },
      characters: [
        { id: 'c1', name: '주인공', desire: '미루지 않는다', wound: '', falseBelief: '', need: '', taboo: '' }
      ],
      relationships: [],
      worldRules: [{ id: 'w1', rule: '도시에는 시계가 없다', cost: '' }],
      conflictEngines: [{ id: 'conf-1', kind: 'internal', detail: '결정 회피' }],
      plotThreads: [{ id: 't1', promise: '하루', payoffCondition: '저녁', active: true }],
      canonSeeds: []
    };
    const report = validateStoryOntology(ontology);

    expect(report.valid).toBe(false);
    expect(report.warnings.some((w) => w.code === 'missing-world-cost' && w.target === 'w1')).toBe(true);
  });

  it('warns on plot thread without payoff condition', () => {
    const ontology: StoryOntology = {
      premise: {
        oneSentence: '주인공이 떡밥을 던진다.',
        dramaticQuestion: '주인공이 떡밥을 던진다.',
        readerPromise: '',
        genreContract: '',
        failureMode: ''
      },
      theme: { statement: '', tested: false },
      characters: [
        { id: 'c1', name: '주인공', desire: '회수', wound: '', falseBelief: '', need: '', taboo: '' }
      ],
      relationships: [],
      worldRules: [{ id: 'w1', rule: '비는 멈추지 않는다', cost: '비는 멈추지 않는다' }],
      conflictEngines: [{ id: 'conf-1', kind: 'internal', detail: 'X' }],
      plotThreads: [{ id: 't-empty', promise: '떡밥', payoffCondition: '', active: true }],
      canonSeeds: []
    };
    const report = validateStoryOntology(ontology);

    expect(report.warnings.some((w) => w.code === 'thread-without-payoff' && w.target === 't-empty')).toBe(true);
  });

  it('warns on no-character / no-conflict / no-plot-thread (모든 입력 비었을 때)', () => {
    const ontology = buildStoryOntology({
      material: '',
      storySeed: '',
      characterSeed: '',
      audience: '',
      constraints: ''
    });
    const report = validateStoryOntology(ontology);

    expect(report.valid).toBe(false);
    const codes = report.warnings.map((w) => w.code);
    expect(codes).toContain('no-character');
    expect(codes).toContain('no-conflict');
    expect(codes).toContain('no-plot-thread');
  });

  // 갭 B 회귀 방지 — 온보딩이 메타(logline·characters)를 안 채워도,
  // 회차에 쌓인 canonFacts 가 온톨로지(캐논 시드·세계 규칙·인물)를 채운다.
  it('seeds ontology entities from accumulated canonFacts when seed fields are empty', () => {
    const ontology = buildStoryOntology({
      material: '',
      storySeed: '',
      characterSeed: '',
      audience: '',
      constraints: '',
      canonFacts: [
        { owner: 'character', statement: '강태준은 F급으로 재각성했다' },
        { owner: 'world', statement: '각성 등급은 고정이고 스킬 운용법만 바꿀 수 있다' },
        { owner: 'plot', statement: '강태준은 흑문 던전에서 배신으로 사망한다' }
      ]
    });

    // 누적 캐논이 시드로 승격된다
    expect(ontology.canonSeeds.length).toBeGreaterThanOrEqual(3);
    // owner 별로 세계 규칙·인물에도 반영된다
    expect(ontology.worldRules.length).toBeGreaterThan(0);
    expect(ontology.characters.length).toBeGreaterThan(0);
    expect(ontology.characters[0].name).toBe('강태준');
  });
});

describe('extractEntityName — 인물 이름 추출 (P4)', () => {
  it('단일 토큰 이름을 조사 앞에서 뽑는다', () => {
    expect(extractEntityName('강태준은 F급으로 각성했다')).toBe('강태준');
  });
  it('공백 포함 이름(성+이름)을 뽑는다', () => {
    expect(extractEntityName('레나 위클리프는 하급 회계 보좌다')).toBe('레나 위클리프');
  });
  it('조사가 바로 붙은 이름도 뽑는다', () => {
    expect(extractEntityName('리아나는 장부를 덮었다')).toBe('리아나');
  });
  it('generic 대명사·역할어는 인물이 아니다 (null)', () => {
    expect(extractEntityName('주인공은 결정을 미룬다')).toBeNull();
    expect(extractEntityName('동료는 한 마디를 삼켰다')).toBeNull();
  });
  it('조직·가문·장소 접미사는 인물이 아니다 (null)', () => {
    expect(extractEntityName('은여우 상단은 동부 상단이다')).toBeNull();
    expect(extractEntityName('벨로트 가문은 3년 뒤 멸문한다')).toBeNull();
  });
  it('명명 계사 "(이)라는"을 이름에 포함하지 않는다 (P6)', () => {
    // 회귀 — ch12 인물 승격이 "레오르 벨로트라"(조사 "라" 오염)로 새던 버그.
    expect(extractEntityName('레오르 벨로트라는 벨로트 성을 가진 인물이 장례 명부에 기록되어 있다')).toBe('레오르 벨로트');
    expect(extractEntityName('강태준이라는 사람이 시험장에 나타났다')).toBe('강태준');
  });
});
