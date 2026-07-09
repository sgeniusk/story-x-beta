import { describe, expect, it } from 'vitest';
import {
  applyApprovedMemory,
  applyContractAmendment,
  buildDeterministicDataReview,
  buildContinuityContractFromProject,
  buildFallbackDraft,
  buildProjectContextDigest,
  buildStoryContractFromOnboarding,
  buildStoryEditorWorkspace,
  chapterFromDraftPayload,
  commitChapter,
  commitChapterProse,
  addCharacter,
  applyRetcons,
  removeCharacter,
  renameCharacter,
  createEmptyProject,
  createSeedProject,
  defaultPlannedEpisodes,
  deriveBeatSheet,
  deriveOnboardingSeed,
  isSpineComplete,
  evaluateProductionGate,
  validateContract,
  getCanonReviewCategoryLabel,
  lockChapter,
  normalizeChapterBeats,
  produceNextChapter,
  serializeCanonCategory,
  unlockChapter,
  validateContinuity,
  type Chapter,
  type DraftChapterPayload,
  type SeriesProject,
  type StoryContract
} from './storyEngine';
import { computePayoffLedger } from './payoffLedger';
import { runStoryHarness } from './storyHarness';

describe('storyEngine', () => {
  it('uses a neutral sample project name instead of a fake production title', () => {
    expect(createSeedProject().title).toBe('샘플 작품');
  });

  it('createEmptyProject starts a brand-new project with no sample content', () => {
    const empty = createEmptyProject({ title: '1화 — 잊혀진 골목' });

    // 회차 접두를 떼어낸 작품 제목을 쓴다
    expect(empty.title).toBe('잊혀진 골목');
    // 샘플 작품의 인물·장소·사물·사건·시간선·캐논·열린 질문이 새지 않는다
    expect(empty.characters).toEqual([]);
    expect(empty.places).toEqual([]);
    expect(empty.objects).toEqual([]);
    expect(empty.events).toEqual([]);
    expect(empty.timeline).toEqual([]);
    expect(empty.canonFacts).toEqual([]);
    expect(empty.openThreads).toEqual([]);
    expect(empty.worldRules).toEqual([]);
    expect(empty.bibleOutline).toEqual([]);
    expect(empty.chapters).toEqual([]);
    expect(empty.title).not.toBe('샘플 작품');
  });

  it('createEmptyProject 가 회차 접두의 마침표 구분자(1화. 제목)도 떼어낸다', () => {
    // dogfooding 발견 — codex 가 "1화. 제목" 형식으로 title 을 내면 마침표가 남아 ". 제목"이 되던 버그.
    expect(createEmptyProject({ title: '1화. 빗길의 이름' }).title).toBe('빗길의 이름');
    expect(createEmptyProject({ title: '3화. 0시의 우편함' }).title).toBe('0시의 우편함');
    // 기존 구분자(em대시·콜론) 회귀 가드
    expect(createEmptyProject({ title: '1화 — 잊혀진 골목' }).title).toBe('잊혀진 골목');
    expect(createEmptyProject({ title: '2화: 제목' }).title).toBe('제목');
  });

  it('createEmptyProject falls back to a neutral title when the draft has none', () => {
    expect(createEmptyProject().title).toBe('새 작품');
    expect(createEmptyProject({ title: '   ' }).title).toBe('새 작품');
  });

  // M4 청크 E — 5-1 바이블 13 카테고리.
  // 모든 신설 필드는 optional. 기존 프로젝트와 호환되며, 명시적으로 채울 때 보존된다.
  it('CharacterProfile.pressureTriangle 이 보존된다 (want/desire/taboo)', () => {
    const empty = createEmptyProject({ title: '소설' });
    const withPressure = {
      ...empty,
      characters: [
        {
          id: 'c1',
          name: '주인공',
          role: '필사관',
          desire: '진실 확인',
          wound: '죄책감',
          currentState: '의심',
          voiceRules: [],
          canonAnchors: [],
          forbiddenContradictions: [],
          relations: [],
          pressureTriangle: {
            want: '오빠를 찾는다',
            desire: '잊고 살고 싶다',
            taboo: '거짓을 캐논으로 적는 것'
          }
        }
      ]
    };
    expect(withPressure.characters[0].pressureTriangle?.want).toContain('오빠');
    expect(withPressure.characters[0].pressureTriangle?.desire).toContain('잊고');
    expect(withPressure.characters[0].pressureTriangle?.taboo).toContain('거짓');
  });

  it('chapterFromDraftPayload 가 payload 의 rewardArc/stakesLedger 를 chapter 로 매핑한다', () => {
    const empty = createEmptyProject({ title: '단편' });
    const result = chapterFromDraftPayload(
      empty,
      {
        title: '1화', hook: '문이 열렸다', outline: ['들어간다'],
        beats: [{ label: 'a', summary: 'b' }], prose: '본문.', newCanonFacts: [],
        rewardArc: [{ promise: '문의 비밀', payoff: '문 너머의 메모', intensity: 70 }],
        stakesLedger: [{ stake: '신뢰', atRisk: '서윤', resolution: 'deferred' }]
      },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    expect(result.chapter.rewardArc?.[0].payoff).toBe('문 너머의 메모');
    expect(result.chapter.rewardArc?.[0].intensity).toBe(70);
    expect(result.chapter.stakesLedger?.[0].resolution).toBe('deferred');
  });

  it('rewardArc/stakesLedger 가 없는 payload 도 안전하게 커밋된다', () => {
    const empty = createEmptyProject({ title: '단편' });
    const result = chapterFromDraftPayload(
      empty,
      { title: '1화', hook: 'h', outline: [], beats: [], prose: 'p', newCanonFacts: [] },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    expect(result.chapter.rewardArc ?? []).toEqual([]);
    expect(result.chapter.stakesLedger ?? []).toEqual([]);
  });

  it('commitChapterProse 가 지정 회차의 prose 만 갱신하고 다른 필드·회차는 보존, 없는 id·동일 prose 는 무변경', () => {
    // 버그(2026-06-14 베타테스트 #1) — editorText 를 chapter.prose 로 commit 하는 경로가 0개라
    // 편집 본문이 saveProject 로 영속되지 않고 회차 전환·새로고침 시 소실됐다.
    const empty = createEmptyProject({ title: '단편' });
    const { chapter } = chapterFromDraftPayload(
      empty,
      { title: '1화', hook: 'h', outline: [], beats: [], prose: '원본 본문', newCanonFacts: [] },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    const withCh = commitChapter(empty, chapter);
    const updated = commitChapterProse(withCh, chapter.id, '편집된 본문');
    const target = updated.chapters.find((c) => c.id === chapter.id);
    expect(target?.prose).toBe('편집된 본문');
    expect(target?.title).toBe('1화');
    // 없는 회차 id · 동일 prose 는 참조 그대로(무변경 — 불필요한 saveProject 방지)
    expect(commitChapterProse(withCh, 'no-such-id', 'x')).toBe(withCh);
    expect(commitChapterProse(withCh, chapter.id, '원본 본문')).toBe(withCh);
  });

  it('commitChapterProse — 잠긴 회차는 prose 변경을 무시한다(베타테스트 #5 데이터 안전)', () => {
    const empty = createEmptyProject({ title: '단편' });
    const { chapter } = chapterFromDraftPayload(
      empty,
      { title: '1화', hook: 'h', outline: [], beats: [], prose: '원본 본문', newCanonFacts: [] },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    const withCh = commitChapter(empty, chapter);
    const locked = lockChapter(withCh, chapter.id);
    // 잠긴 회차에 다른 prose 를 commit 해도 참조 그대로(무변경) — UI editable=false 와 이중 안전망.
    expect(commitChapterProse(locked, chapter.id, '잠긴 뒤 편집')).toBe(locked);
    expect(locked.chapters.find((c) => c.id === chapter.id)?.prose).toBe('원본 본문');
  });

  it('addCharacter/removeCharacter/renameCharacter — 인물 CRUD (베타테스트 #6)', () => {
    // 기존엔 욕망/상처/현재상태 3필드 덮어쓰기만 가능, 추가·삭제·이름 변경 핸들러가 0개였다.
    const empty = createEmptyProject({ title: 'x' });
    const base = empty.characters.length;

    const a1 = addCharacter(empty, '인물A');
    const a2 = addCharacter(a1, '인물B');
    expect(a2.characters.length).toBe(base + 2);
    const cA = a2.characters.find((c) => c.name === '인물A')!;
    const cB = a2.characters.find((c) => c.name === '인물B')!;
    expect(cA.id).not.toBe(cB.id); // id 유일
    expect(cB.desire).toBe('');
    expect(cB.relations).toEqual([]);

    // rename
    const renamed = renameCharacter(a2, cB.id, '인물B-개명');
    expect(renamed.characters.find((c) => c.id === cB.id)?.name).toBe('인물B-개명');

    // remove — cB 제거 + cA 가 cB 로 향한 relation 정리(고아 엣지 방지)
    const withRel = {
      ...a2,
      characters: a2.characters.map((c) =>
        c.id === cA.id ? { ...c, relations: [{ targetId: cB.id, label: '동료' }] } : c
      )
    };
    const removed = removeCharacter(withRel, cB.id);
    expect(removed.characters.find((c) => c.id === cB.id)).toBeUndefined();
    expect(removed.characters.find((c) => c.id === cA.id)?.relations.some((r) => r.targetId === cB.id)).toBe(false);

    // 없는 id 는 무변경(참조 동일)
    expect(removeCharacter(a2, 'nope')).toBe(a2);
    expect(renameCharacter(a2, 'nope', 'x')).toBe(a2);
  });

  it('SeriesProject 의 8개 신설 optional 필드는 기본값이 undefined 이며 누락돼도 createEmptyProject 가 동작', () => {
    const empty = createEmptyProject({ title: '빈 작품' });
    expect(empty.narratorCard).toBeUndefined();
    expect(empty.voiceSignatureId).toBeUndefined();
    expect(empty.motifLedger).toBeUndefined();
    expect(empty.symbolLayers).toBeUndefined();
    expect(empty.formalDesign).toBeUndefined();
    expect(empty.historicalAnchors).toBeUndefined();
    expect(empty.personaCard).toBeUndefined();
    expect(empty.disclosureLedger).toBeUndefined();
  });

  // M4 청크 A — Gap 5: CanonFact.owner 타입 통일.
  // visual/audio/voice 같은 매체별 owner 가 chapterFromDraftPayload 를 거쳐도 그대로 보존되어야 한다.
  it('chapterFromDraftPayload 가 매체별 owner(voice/visual/audio) 를 plot 으로 다운캐스트하지 않는다 (Gap 5)', () => {
    const empty = createEmptyProject({ title: '소설' });
    const result = chapterFromDraftPayload(
      empty,
      {
        title: '1화',
        hook: '시작',
        outline: ['들어간다.'],
        beats: [{ label: 'a', summary: 'b' }],
        prose: '본문.',
        newCanonFacts: [
          { owner: 'voice', statement: '낮은 톤' },
          { owner: 'visual', statement: '회색 팔레트' },
          { owner: 'audio', statement: '저주파 hum' },
          { owner: 'character', statement: '인물 한 명' }
        ]
      },
      { genre: 'urban-fantasy', intent: '시작', pressure: '' }
    );
    const owners = result.chapter.newCanonFacts.map((f) => f.owner);
    expect(owners).toContain('voice');
    expect(owners).toContain('visual');
    expect(owners).toContain('audio');
    expect(owners).toContain('character');
  });

  // M4 청크 A — Gap 7: produceNextChapter 시드 모티프 제거.
  // 빈 프로젝트에서도 안전하게 동작하고, 작품과 무관한 시드 텍스트(달의 탑·오빠의 표식·이안)가 새지 않는다.
  it('produceNextChapter 가 빈 프로젝트(인물 0명)에서도 throw 없이 chapter 를 만들고 시드 모티프를 새지 않는다 (Gap 7)', () => {
    const empty = createEmptyProject({ title: '빈 작품' });
    const result = produceNextChapter(empty, { genre: 'urban-fantasy', intent: '걷기', pressure: '바람' });
    expect(result.chapter).toBeDefined();
    expect(result.chapter.episode).toBe(1);
    // 시드 모티프(달의 탑·오빠의 표식·이안 등)는 빈 프로젝트의 산출에 나타나지 않는다.
    expect(result.chapter.prose).not.toContain('달의 탑');
    expect(result.chapter.prose).not.toContain('오빠의 표식');
    expect(result.chapter.prose).not.toContain('이안');
    expect(result.chapter.hook).not.toContain('이안');
    expect(result.chapter.hook).not.toContain('오빠');
  });

  it('buildFallbackDraft 가 자유서술과 인터뷰 답변만으로 유효한 초안 payload 를 만든다', () => {
    const draft = buildFallbackDraft({
      freewrite: '혜진은 폐역에서 돌아오지 않는 동생의 녹음기를 발견한다. 플랫폼의 전광판은 매일 같은 시간을 가리킨다.',
      interviewAnswers: ['주인공은 죄책감을 숨긴다.', '마지막 장면은 녹음기가 스스로 켜지는 순간이다.'],
      chapterNumber: 2
    });

    expect(draft.title).toContain('2화');
    expect(draft.hook).toContain('혜진');
    expect(draft.outline.length).toBeGreaterThanOrEqual(3);
    expect(draft.beats.length).toBeGreaterThanOrEqual(4);
    expect(draft.beats.every((beat) => beat.label.trim().length > 0)).toBe(true);
    expect(draft.beats.every((beat) => beat.summary.trim().length > 0)).toBe(true);
    expect(draft.prose).toContain('혜진');
    expect(draft.prose).toContain('녹음기');
    expect(draft.newCanonFacts).toEqual([]);
  });

  it('buildFallbackDraft 는 빈 입력에서도 throw 없이 최소 한국어 placeholder payload 를 만든다', () => {
    expect(() => buildFallbackDraft({ freewrite: '   ', interviewAnswers: [''], chapterNumber: 1 })).not.toThrow();

    const draft = buildFallbackDraft({ freewrite: '', interviewAnswers: [] });

    expect(draft.title).toBe('1화 — 임시 초안');
    expect(draft.hook.length).toBeGreaterThan(0);
    expect(draft.outline.length).toBeGreaterThanOrEqual(1);
    expect(draft.beats.length).toBeGreaterThanOrEqual(1);
    expect(draft.prose).toContain('작가 입력');
  });

  it('buildFallbackDraft 는 작가 입력에 없는 모티프를 invent 하지 않는다', () => {
    const draft = buildFallbackDraft({
      freewrite: '바닷가 우체국에서 민서는 오래된 엽서를 분류한다. 파도 소리와 소금 냄새가 계속 남는다.',
      interviewAnswers: ['관계의 핵심은 기다림이다.']
    });
    const joined = [draft.title, draft.hook, ...draft.outline, ...draft.beats.map((beat) => `${beat.label} ${beat.summary}`), draft.prose].join('\n');

    expect(joined).toContain('민서');
    expect(joined).toContain('엽서');
    expect(joined).not.toContain('달의 탑');
    expect(joined).not.toContain('오빠의 표식');
    expect(joined).not.toContain('이안');
    expect(joined).not.toContain('마법 검');
    expect(joined).not.toContain('비밀 왕국');
  });

  it('commitChapter no longer injects sample open threads into an empty project', () => {
    const empty = createEmptyProject({ title: '단편 하나' });
    const result = chapterFromDraftPayload(
      empty,
      {
        title: '잊혀진 골목',
        hook: '골목 끝의 문이 다시 열렸다.',
        outline: ['문이 열린다.'],
        beats: [{ label: '문', summary: '골목 끝의 문이 열린다.' }],
        prose: '골목은 막다른 곳에서 한 번 더 꺾였다.',
        newCanonFacts: []
      },
      { genre: 'urban-fantasy', intent: '문이 열린다', pressure: '' }
    );

    // 빈 프로젝트에 회차를 커밋해도 열린 질문은 비어 있다 — 샘플 떡밥이 새지 않는다
    expect(result.updatedProject.openThreads).toEqual([]);
  });

  it('continues the series from the current canon and stores new memory anchors', () => {
    const project = createSeedProject();

    const result = produceNextChapter(project, {
      genre: 'romance-fantasy',
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });

    expect(result.chapter.episode).toBe(project.currentEpisode + 1);
    expect(result.chapter.outline[0]).not.toContain('달의 문서고');
    expect(result.chapter.outline[0]).not.toContain('샘플 작품');
    expect(result.chapter.memoryAnchors).toContain('서윤은 사라진 오빠의 행방을 찾고 있다.');
    // 결정적 fallback 회차도 번호 매겨진 회차 구성(beats)을 채운다
    expect(result.chapter.beats.length).toBeGreaterThanOrEqual(4);
    expect(result.chapter.beats.map((beat) => beat.no)).toEqual(
      result.chapter.beats.map((_, index) => index + 1)
    );
    expect(result.chapter.beats.every((beat) => beat.label.length > 0)).toBe(true);
    expect(result.chapter.beats.every((beat) => beat.id.startsWith('beat-'))).toBe(true);
    expect(result.agentRuns.map((run) => run.agentId)).toEqual([
      'showrunner',
      'character-custodian',
      'world-keeper',
      'genre-stylist',
      'continuity-editor'
    ]);
    // P13(2026-06-11) — 결정적 폴백은 캐논을 발명하지 않는다. 이전엔 템플릿 2건("…한복판에 선다"
    // intent 누수 · "…숨기고 있다" 비밀 발명)을 주조해 실작품 레저를 오염시켰다(#3 fixture 캐논 #9·#10).
    expect(result.updatedProject.canonFacts).toHaveLength(project.canonFacts.length);
    expect(result.continuityIssues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });

  it('produceNextChapter(결정적 폴백)는 캐논 사실을 발명하지 않는다 — P13 오염 캐논 차단', () => {
    const project = createSeedProject();
    const result = produceNextChapter(project, {
      genre: 'urban-fantasy',
      intent: '이번 화에서 "백도현 뒤에 있는 더 큰 설계자의 정체"를 결판낸다.',
      pressure: '압박'
    });
    expect(result.chapter.newCanonFacts).toEqual([]);
    expect(result.updatedProject.canonFacts).toEqual(project.canonFacts);
    // intent 문구가 캐논 어디에도 새지 않는다
    expect(result.updatedProject.canonFacts.some((f) => f.statement.includes('설계자의 정체'))).toBe(false);
  });

  // 폴백 회차 번호 드리프트 (2026-06-12 Phase D) — 쇼케이스 30화에서 16화 다음이 19화로 점프(17·18 결번).
  // 원인: 폴백 17·18화가 커밋돼 currentEpisode 를 18로 올린 뒤 chapters 에서 폐기됐는데 카운터는 그대로 남음.
  // 다음 회차 번호는 카운터가 아니라 실제 chapters 의 마지막 회차에서 도출해야 폐기된 번호가 회복된다.
  it('폐기된 폴백 회차의 번호를 소모하지 않는다 — 다음 회차 번호를 chapters 기준으로 도출한다', () => {
    const base = createSeedProject();
    const ch16: Chapter = {
      id: 'episode-16',
      episode: 16,
      title: '16화',
      hook: '',
      outline: [],
      beats: [],
      prose: '본문',
      memoryAnchors: [],
      newCanonFacts: [],
      rewardArc: [],
      stakesLedger: []
    };
    // currentEpisode 만 18로 앞서 있고(폐기된 17·18 폴백의 잔재) 실제 마지막 chapter 는 16화.
    const drifted: SeriesProject = { ...base, currentEpisode: 18, chapters: [ch16] };

    const result = produceNextChapter(drifted, {
      genre: 'urban-fantasy',
      intent: '추적',
      pressure: '시간'
    });

    expect(result.chapter.episode).toBe(17);
  });

  it('locks a single chapter without touching the others, and unlock reverses it', () => {
    const seed = createSeedProject();
    const first = produceNextChapter(seed, {
      genre: 'romance-fantasy',
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });
    const second = produceNextChapter(first.updatedProject, {
      genre: 'romance-fantasy',
      intent: '서윤이 동맹의 배신 가능성을 살핀다',
      pressure: '단서가 한 줄 늘어날 때마다 위험도 따라 오른다'
    });

    const targetId = second.updatedProject.chapters[0].id;
    const otherId = second.updatedProject.chapters[1].id;

    const locked = lockChapter(second.updatedProject, targetId);
    expect(locked.chapters.find((chapter) => chapter.id === targetId)?.locked).toBe(true);
    expect(locked.chapters.find((chapter) => chapter.id === otherId)?.locked).toBeFalsy();

    const reopened = unlockChapter(locked, targetId);
    expect(reopened.chapters.find((chapter) => chapter.id === targetId)?.locked).toBe(false);
  });

  it('commits an LLM draft payload as a chapter and normalizes its canon facts', () => {
    const project = createSeedProject();

    const result = chapterFromDraftPayload(
      project,
      {
        title: '1화 — 팔리지 않는 기억',
        hook: '거래소 주인은 그녀가 팔러 온 기억을 이미 샀다고 말했다.',
        outline: ['도주가 거래소 문을 연다.', '거래 규칙이 드러난다.', '   '],
        beats: [
          { label: '거래소 문', summary: '도주가 좁은 골목 끝의 문을 연다.' },
          { label: '이미 팔린 기억', summary: '주인이 그녀의 기억을 이미 샀다고 말한다.' },
          { label: '', summary: '   ' }
        ],
        prose: '골목은 막다른 곳에서 한 번 더 꺾였다.\n\n그 자리에 문이 있었다.',
        newCanonFacts: [
          { owner: 'world', statement: '기억은 판 순간 매도인에게서 사라진다.' },
          { owner: 'plot', statement: '도주의 기억은 이미 그녀 이름으로 매도돼 있다.' },
          { owner: '엉뚱한값', statement: 'owner가 비정상이면 plot으로 정규화한다.' }
        ]
      },
      {
        genre: 'romance-fantasy',
        intent: '주인공이 기억 거래소에 들어선다',
        pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
      }
    );

    expect(result.chapter.episode).toBe(project.currentEpisode + 1);
    expect(result.chapter.title).toBe('1화 — 팔리지 않는 기억');
    expect(result.chapter.prose).toContain('막다른 곳');
    expect(result.chapter.outline).toHaveLength(2);
    // payload의 beats가 번호 매겨진 ChapterBeat[]로 정규화되고, 빈 항목은 버려진다
    expect(result.chapter.beats).toHaveLength(2);
    expect(result.chapter.beats[0]).toEqual(
      expect.objectContaining({ no: 1, label: '거래소 문' })
    );
    expect(result.chapter.beats[1].no).toBe(2);
    expect(result.chapter.newCanonFacts).toHaveLength(3);
    expect(result.chapter.newCanonFacts[0].owner).toBe('world');
    expect(result.chapter.newCanonFacts[2].owner).toBe('plot');
    expect(result.chapter.newCanonFacts.every((fact) => fact.episode === project.currentEpisode + 1)).toBe(true);
    expect(result.updatedProject.canonFacts).toHaveLength(project.canonFacts.length + 3);
    expect(result.updatedProject.chapters.at(-1)?.id).toBe(result.chapter.id);
    expect(result.agentRuns.map((run) => run.agentId)).toContain('showrunner');
  });

  it('tolerates a draft payload with missing beats by falling back to an empty list', () => {
    const project = createSeedProject();

    const result = chapterFromDraftPayload(
      project,
      {
        title: '1화',
        hook: '후크',
        outline: ['비트'],
        // 구버전·실패 응답: beats 누락
        beats: undefined as never,
        prose: '본문이 있다.',
        newCanonFacts: []
      },
      {
        genre: 'romance-fantasy',
        intent: '주인공이 움직인다',
        pressure: ''
      }
    );

    expect(result.chapter.beats).toEqual([]);
  });

  it('normalizeChapterBeats numbers entries and drops empty ones', () => {
    expect(normalizeChapterBeats(3, undefined)).toEqual([]);

    const beats = normalizeChapterBeats(3, [
      { label: '도입', summary: '문을 연다.' },
      { label: '   ', summary: '   ' },
      { label: '반전', summary: '거짓이 드러난다.' }
    ]);

    expect(beats).toHaveLength(2);
    expect(beats.map((beat) => beat.no)).toEqual([1, 2]);
    expect(beats[0].id).toBe('beat-003-01');
    expect(beats[1].label).toBe('반전');
  });

  it('normalizeChapterBeats carries tension and defaults missing or invalid values', () => {
    const beats = normalizeChapterBeats(4, [
      { label: '도입', summary: '문을 연다.', tension: 20 },
      // tension 누락 — 기본값으로 보정돼야 한다
      { label: '전개', summary: '단서가 늘어난다.' },
      // 범위를 벗어난 값은 0~100으로 클램프된다
      { label: '절정', summary: '진실이 드러난다.', tension: 140 },
      // 숫자가 아니면 기본값으로 떨어진다
      { label: '여운', summary: '여백을 남긴다.', tension: 'high' as never }
    ]);

    expect(beats.map((beat) => beat.tension)).toEqual([20, 50, 100, 50]);
  });

  it('produceNextChapter generates beats that carry a tension value', () => {
    const result = produceNextChapter(createSeedProject(), {
      genre: 'romance-fantasy',
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });

    expect(result.chapter.beats.length).toBeGreaterThanOrEqual(4);
    expect(
      result.chapter.beats.every(
        (beat) => typeof beat.tension === 'number' && beat.tension >= 0 && beat.tension <= 100
      )
    ).toBe(true);
  });

  it('chapterFromDraftPayload carries beat tension and defaults when the payload omits it', () => {
    const project = createSeedProject();

    const result = chapterFromDraftPayload(
      project,
      {
        title: '1화',
        hook: '후크',
        outline: ['비트'],
        beats: [
          { label: '문', summary: '문을 연다.', tension: 35 },
          // tension 누락 — 기본값 50으로 보정돼야 한다
          { label: '반전', summary: '거짓이 드러난다.' }
        ],
        prose: '본문이 있다.',
        newCanonFacts: []
      },
      {
        genre: 'romance-fantasy',
        intent: '주인공이 움직인다',
        pressure: ''
      }
    );

    expect(result.chapter.beats.map((beat) => beat.tension)).toEqual([35, 50]);
  });

  it('createSeedProject populates the data-mode canon arrays and bible outline', () => {
    const project = createSeedProject();

    expect(project.places.length).toBeGreaterThan(0);
    expect(project.objects.length).toBeGreaterThan(0);
    expect(project.events.length).toBeGreaterThan(0);
    expect(project.timeline.length).toBeGreaterThan(0);

    // 바이블 규칙은 정확히 5섹션, 고정된 id 순서를 가진다
    expect(project.bibleOutline.map((section) => section.id)).toEqual([
      'tone',
      'rhythm',
      'world',
      'vocab',
      'motif'
    ]);

    // 후속 UI가 보여줄 수 있도록 충돌·미확정 엔티티가 최소 하나씩 있어야 한다
    const allEntities = [...project.places, ...project.objects, ...project.events];
    expect(allEntities.some((entity) => entity.status === 'conflict')).toBe(true);
    expect(allEntities.some((entity) => entity.status === 'unverified')).toBe(true);

    // 인물은 relations 배열을 가지며, 시드에 최소 하나의 관계가 있다
    expect(project.characters.every((character) => Array.isArray(character.relations))).toBe(true);
    expect(project.characters.some((character) => character.relations.length > 0)).toBe(true);
  });

  it('applies approved memory candidates as new canon facts', () => {
    const project = createSeedProject();
    const before = project.canonFacts.length;

    const updated = applyApprovedMemory(project, [
      { id: 'cand-1', owner: 'world', statement: '회랑의 시계는 모두 거꾸로 돈다.' },
      { id: 'cand-2', owner: '엉뚱한값', statement: 'owner가 비정상이면 plot으로 정규화한다.' },
      { id: 'cand-3', owner: 'plot', statement: '   ' }
    ]);

    expect(updated.canonFacts).toHaveLength(before + 2);
    const added = updated.canonFacts.slice(before);
    expect(added[0].id).toBe('canon-approved-cand-1');
    expect(added[0].owner).toBe('world');
    expect(added[1].owner).toBe('plot');
    expect(added.every((fact) => fact.episode === project.currentEpisode)).toBe(true);
    expect(updated.canonFacts.some((fact) => fact.id === 'canon-approved-cand-3')).toBe(false);
  });

  it('returns the same project when there is nothing approved to apply', () => {
    const project = createSeedProject();
    expect(applyApprovedMemory(project, [])).toBe(project);
  });

  it('flags draft claims that contradict established character canon', () => {
    const project = createSeedProject();

    const issues = validateContinuity(project, [
      '서윤은 오빠를 처음부터 싫어했고 찾고 싶어 하지 않는다.',
      '달의 탑은 아무나 들어갈 수 있는 관광지다.'
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          source: 'character-custodian'
        }),
        expect.objectContaining({
          severity: 'error',
          source: 'world-keeper'
        })
      ])
    );
  });

  it('populates hard, living, and soft continuity layers from project state', () => {
    const project = {
      ...createSeedProject(),
      canonFacts: [
        { id: 'canon-hard', episode: 0, owner: 'world' as const, statement: '달의 탑 출입 증표는 3장이다' },
        { id: 'canon-living', episode: 0, owner: 'character' as const, statement: '서윤은 이안을 아직 믿지 않는다' },
        { id: 'canon-soft', episode: 0, owner: 'plot' as const, statement: '안내인은 오빠가 살아있다는 소문을 들었다' }
      ]
    };

    const contract = buildContinuityContractFromProject(project);

    expect(contract.hardCanon).toEqual(expect.arrayContaining(['달의 탑 출입 증표는 3장이다']));
    expect(contract.livingState).toEqual(expect.arrayContaining(['서윤은 이안을 아직 믿지 않는다']));
    expect(contract.softSignals).toEqual(expect.arrayContaining(['안내인은 오빠가 살아있다는 소문을 들었다']));

    const livingIssues = validateContinuity(project, ['서윤은 이안을 신뢰하기 시작한다']);
    expect(livingIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          source: 'continuity-editor',
          claim: '서윤은 이안을 신뢰하기 시작한다'
        })
      ])
    );
  });

  it('계사 정체성 단정 인물 캐논은 state 키워드가 있어도 hard canon 으로 잡고 반전을 차단한다', () => {
    // "형사이며"는 정체성 단정(hard). "감정" 키워드에 끌려 livingState 로 가면 정체성 반전이
    // 경고에 그치던 문제를 고친다. 순수 mutable-state 팩트는 아래 회귀 테스트로 보존 확인.
    const project = {
      ...createSeedProject(),
      canonFacts: [
        { id: 'canon-identity', episode: 1, owner: 'character' as const, statement: '윤민서는 강력계 형사이며 감정을 드러내지 않는다' }
      ]
    };
    const contract = buildContinuityContractFromProject(project);
    expect(contract.hardCanon).toEqual(expect.arrayContaining(['윤민서는 강력계 형사이며 감정을 드러내지 않는다']));
    expect(contract.livingState).not.toEqual(expect.arrayContaining(['윤민서는 강력계 형사이며 감정을 드러내지 않는다']));

    const issues = validateContinuity(project, ['윤민서는 형사가 아니라 평범한 민간인이다']);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: 'error', source: 'continuity-editor' })
      ])
    );
  });

  it('keeps confirmed past-tense world and plot facts in hard canon', () => {
    const project = {
      ...createSeedProject(),
      canonFacts: [
        { id: 'canon-world-event', episode: 1, owner: 'world' as const, statement: '도현은 탑 3층에서 소리를 들었다' },
        { id: 'canon-plot-relation', episode: 1, owner: 'plot' as const, statement: '서윤과 이안의 관계는 탑에서만 유지된다' }
      ]
    };

    const contract = buildContinuityContractFromProject(project);

    expect(contract.hardCanon).toEqual(
      expect.arrayContaining(['도현은 탑 3층에서 소리를 들었다', '서윤과 이안의 관계는 탑에서만 유지된다'])
    );
    expect(contract.livingState).not.toEqual(expect.arrayContaining(['서윤과 이안의 관계는 탑에서만 유지된다']));
    expect(contract.softSignals).not.toEqual(expect.arrayContaining(['도현은 탑 3층에서 소리를 들었다']));
  });

  it('records a growth ledger entry after a chapter changes character state', () => {
    const project = createSeedProject();
    const beforeState = project.characters[0].currentState;

    const result = produceNextChapter(project, {
      genre: 'romance-fantasy',
      intent: '서윤이 이안을 믿기로 선택한다',
      pressure: '탑 출입권을 잃는 대가'
    });

    const entry = result.updatedProject.growthLedger?.entries.at(-1);
    expect(entry).toEqual(
      expect.objectContaining({
        characterId: project.characters[0].id,
        before: beforeState,
        after: expect.stringContaining('서윤이 이안을 믿기로 선택한다'),
        triggerScene: result.chapter.id,
        choice: '서윤이 이안을 믿기로 선택한다',
        cost: '탑 출입권을 잃는 대가',
        futureConsequence: expect.stringContaining('다음 회차')
      })
    );
    expect(result.updatedProject.characters[0].currentState).toContain('서윤이 이안을 믿기로 선택한다');
  });

  it('builds a Scrivener-style editor workspace from the current series project', () => {
    const project = createSeedProject();
    const result = produceNextChapter(project, {
      genre: 'romance-fantasy',
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });

    const workspace = buildStoryEditorWorkspace(result.updatedProject);

    expect(workspace.viewModes.map((mode) => mode.id)).toEqual(['binder', 'corkboard', 'outliner', 'scrivenings']);
    expect(workspace.binderItems.map((item) => item.title)).toEqual(
      expect.arrayContaining([result.updatedProject.title, result.chapter.title])
    );
    expect(workspace.corkboardCards[0]).toEqual(
      expect.objectContaining({
        chapterId: result.chapter.id,
        title: result.chapter.title,
        status: 'drafted',
        pov: '한서윤'
      })
    );
    expect(workspace.corkboardCards[0].linkedCodexIds).toEqual(
      expect.arrayContaining(['codex-character-seo-yoon', 'codex-world-moon-tower-entry'])
    );
    expect(workspace.outlinerRows[0]).toEqual(
      expect.objectContaining({
        chapterId: result.chapter.id,
        continuityState: 'clear'
      })
    );
    expect(workspace.outlinerRows[0].wordCount).toBeGreaterThan(20);
    expect(workspace.compilePreview.text).toContain(result.chapter.title);
    expect(workspace.compilePreview.text).toContain(result.chapter.prose);
  });

  it('exposes Codex entries and snapshots for continuity-aware editing', () => {
    const result = produceNextChapter(createSeedProject(), {
      genre: 'romance-fantasy',
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });

    const workspace = buildStoryEditorWorkspace(result.updatedProject);

    expect(workspace.codexEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'codex-character-seo-yoon',
          kind: 'character',
          title: '한서윤',
          fields: expect.arrayContaining([
            expect.objectContaining({ label: 'desire' }),
            expect.objectContaining({ label: 'wound' }),
            expect.objectContaining({ label: 'voice' })
          ])
        }),
        expect.objectContaining({
          id: 'codex-world-memory-ink',
          kind: 'world-rule',
          title: '기억 잉크'
        }),
        // commitChapter는 더 이상 임의의 떡밥을 끼워 넣지 않으므로,
        // plot-thread 코덱스 항목은 시드 프로젝트의 실제 열린 질문에서 나온다.
        expect.objectContaining({
          kind: 'plot-thread',
          title: '오빠의 마지막 편지에는 왜 서윤의 필체가 남아 있었나?'
        })
      ])
    );
    expect(workspace.snapshots[0]).toEqual(
      expect.objectContaining({
        chapterId: result.chapter.id,
        title: `${result.chapter.title} snapshot`,
        reason: 'continuity review checkpoint',
        text: result.chapter.prose
      })
    );
  });

  it('surfaces continuity conflicts in the editor workspace instead of hiding them', () => {
    const project = createSeedProject();

    const workspace = buildStoryEditorWorkspace(project, {
      draftClaims: [
        '서윤은 오빠를 처음부터 싫어했고 찾고 싶어 하지 않는다.',
        '달의 탑은 아무나 들어갈 수 있는 관광지다.'
      ]
    });

    expect(workspace.continuityIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: 'error', source: 'character-custodian' }),
        expect.objectContaining({ severity: 'error', source: 'world-keeper' })
      ])
    );
    expect(workspace.continuitySummary.blocked).toBe(2);
    expect(workspace.continuitySummary.status).toBe('blocked');
  });

  it('정보성 memory-anchor 경고는 충돌 카운트(warnings)에 세지 않는다', () => {
    // 다음 회차 의도가 캐논 문장을 축어 인용하지 않으면 항상 뜨는 정보성 넛지 —
    // 실제 연속성 충돌이 아니므로 PLAN "충돌 N" 배지(=blocked+warnings)에 셈하지 않는다.
    const workspace = buildStoryEditorWorkspace(createEmptyProject({ title: '빈 작품' }), {
      draftClaims: ['다음 회차를 이어 씁니다']
    });
    expect(
      workspace.continuityIssues.some((i) => i.claim === 'memory-anchor')
    ).toBe(true);
    expect(workspace.continuitySummary.warnings).toBe(0);
    expect(workspace.continuitySummary.status).toBe('clear');
  });

  it('serializeCanonCategory renders characters with desire, wound, and relations', () => {
    const project = createSeedProject();

    const serialized = serializeCanonCategory(project, 'characters');

    expect(serialized).toContain('분야: 인물');
    expect(serialized).toContain(project.characters[0].name);
    expect(serialized).toContain('욕망:');
    expect(serialized).toContain('상처:');
  });

  it('serializeCanonCategory renders entity facts, appearances, and timeline years', () => {
    const project = createSeedProject();

    const places = serializeCanonCategory(project, 'places');
    expect(places).toContain('분야: 장소');
    expect(places).toContain(project.places[0].name);

    const timeline = serializeCanonCategory(project, 'timeline');
    expect(timeline).toContain('분야: 시간선');
    expect(timeline).toContain(`${project.timeline[0].year}년`);
  });

  it('buildDeterministicDataReview returns consistency and suggestion notes for every category', () => {
    const project = createSeedProject();
    const categories = ['characters', 'places', 'objects', 'events', 'timeline'] as const;

    for (const category of categories) {
      const review = buildDeterministicDataReview(project, category);

      expect(review.summary).toContain(getCanonReviewCategoryLabel(category));
      expect(review.notes.length).toBeGreaterThan(0);
      expect(review.notes.some((note) => note.kind === '정합')).toBe(true);
      expect(review.notes.some((note) => note.kind === '제안')).toBe(true);
      expect(review.notes.every((note) => note.body.trim().length > 0)).toBe(true);
    }
  });
});

describe('onboarding seed (갭 A — 온보딩 메타 배선)', () => {
  it('deriveOnboardingSeed 가 freewrite 첫 문장을 logline, 인터뷰 답을 audiencePromise 로 추출한다', () => {
    const seed = deriveOnboardingSeed({
      freewrite: '회사에서 정리해고 통보받은 날 죽었다. 눈을 뜨니 10년 전이다.',
      interviewAnswers: ['- 첫 5화 약속 → 각성 시험에서 전생과 다른 결과']
    });
    expect(seed.logline).toContain('정리해고');
    expect(seed.logline).not.toContain('눈을 뜨니'); // 첫 문장만
    expect(seed.audiencePromise).toBe('각성 시험에서 전생과 다른 결과'); // "→" 뒤 답만
  });

  it('createEmptyProject 가 주어진 logline/audiencePromise/deepQuestion 을 시드한다', () => {
    const project = createEmptyProject({
      title: '시험작',
      logline: '회귀한 헌터가 자신의 죽음을 추적한다',
      audiencePromise: '매 화 사이다와 다음 화 훅',
      deepQuestion: '약함은 끝인가'
    });
    expect(project.logline).toBe('회귀한 헌터가 자신의 죽음을 추적한다');
    expect(project.audiencePromise).toBe('매 화 사이다와 다음 화 훅');
    expect(project.deepQuestion).toBe('약함은 끝인가');
  });

  // 라이브 발견(2026-06-10 #4 만화) — medium 이 React state 에만 있어 리로드 후 만화 작품이
  // 소설 작가진(5인)으로 검토되는 매체 연속성 버그. 프로젝트에 medium/format 을 영속한다.
  it('createEmptyProject 가 medium/format 을 시드해 리로드 후에도 매체가 보존된다', () => {
    const project = createEmptyProject({
      title: '매체 영속 시험작',
      medium: 'comics',
      format: 'serial-webtoon'
    });
    expect(project.medium).toBe('comics');
    expect(project.format).toBe('serial-webtoon');
  });

  it('createEmptyProject 에 medium 이 없으면 필드를 비워 두고(undefined) 기존 동작을 유지한다', () => {
    const project = createEmptyProject({ title: '구버전 호환' });
    expect(project.medium).toBeUndefined();
    expect(project.format).toBeUndefined();
  });
});

describe('commitChapter 인물 캐논화 (P4)', () => {
  const minimalChapter = (
    episode: number,
    newCanonFacts: Array<{ id: string; episode: number; owner: 'character' | 'world' | 'plot'; statement: string }>
  ) => ({
    id: `episode-${episode}`,
    episode,
    title: `${episode}화`,
    hook: '',
    outline: [],
    beats: [],
    prose: '',
    memoryAnchors: [],
    newCanonFacts
  });

  it('owner=character 새 캐논의 인물을 characters 로 승격하고 world·generic 은 제외한다', () => {
    const updated = commitChapter(createEmptyProject({ title: '테스트' }), minimalChapter(2, [
      { id: 'c1', episode: 2, owner: 'character', statement: '레나 위클리프는 하급 회계 보좌다' },
      { id: 'c2', episode: 2, owner: 'world', statement: '은여우 상단은 동부 상단이다' },
      { id: 'c3', episode: 2, owner: 'character', statement: '주인공은 결정을 미룬다' }
    ]));
    const names = updated.characters.map((character) => character.name);
    expect(names).toContain('레나 위클리프');
    expect(names).not.toContain('은여우 상단');
    expect(names).not.toContain('주인공');
  });

  it('이미 있는 인물을 중복 승격하지 않는다', () => {
    const ch2 = commitChapter(createEmptyProject({ title: '테스트' }), minimalChapter(2, [
      { id: 'c1', episode: 2, owner: 'character', statement: '레나 위클리프는 회계 보좌다' }
    ]));
    const ch3 = commitChapter(ch2, minimalChapter(3, [
      { id: 'c2', episode: 3, owner: 'character', statement: '레나 위클리프는 동쪽 문을 경고한다' }
    ]));
    expect(ch3.characters.filter((character) => character.name === '레나 위클리프')).toHaveLength(1);
  });

  it('승격된 인물은 캐논 문장을 canonAnchors 로 보존한다', () => {
    const updated = commitChapter(createEmptyProject({ title: '테스트' }), minimalChapter(2, [
      { id: 'c1', episode: 2, owner: 'character', statement: '레나 위클리프는 하급 회계 보좌다' }
    ]));
    const lena = updated.characters.find((character) => character.name === '레나 위클리프');
    expect(lena?.canonAnchors).toContain('레나 위클리프는 하급 회계 보좌다');
  });

  it('서술부 명명("…이름은 X")의 인물도 승격한다 (P5)', () => {
    // 회귀 — "리아나의 둘째 오빠 이름은 루시안 벨로트"에서 주어 리아나만 잡고 서술부 루시안을 놓치던 버그.
    const updated = commitChapter(createEmptyProject({ title: '테스트' }), minimalChapter(6, [
      { id: 'c1', episode: 6, owner: 'character', statement: '리아나의 둘째 오빠 이름은 루시안 벨로트이며, 그는 가문의 채무를 알고 있었다' }
    ]));
    const names = updated.characters.map((character) => character.name);
    expect(names).toContain('루시안 벨로트');
  });

  it('"A의 [관계] 이름은 B" 캐논에서 관계 엣지를 만든다 (relations)', () => {
    // 회귀 — 인물은 승격돼도 relations 가 늘 빈 배열이던 갭. 관계어("둘째 오빠")로 엣지를 만든다.
    const updated = commitChapter(createEmptyProject({ title: '테스트' }), minimalChapter(6, [
      { id: 'c1', episode: 6, owner: 'character', statement: '리아나의 둘째 오빠 이름은 루시안 벨로트이며, 그는 가문의 채무를 알고 있었다' }
    ]));
    const riana = updated.characters.find((character) => character.name === '리아나');
    const lucian = updated.characters.find((character) => character.name === '루시안 벨로트');
    expect(lucian).toBeDefined();
    expect(riana?.relations.some((relation) => relation.targetId === lucian?.id && relation.label === '둘째 오빠')).toBe(true);
  });
});

// ─── 라이브 실증 — payload→chapter→payoffLedger→storyHarness 전 파이프라인 ──────────────
// 목적: 실제 LLM 이 반환하는 형태의 fixture 를 통과시켜 premise-progress 차단이 엔드투엔드로 작동하는지 검증.
// spec §10 LLM 신뢰도 리스크 — LLM 자기보고 불신, 파이프라인 입장에서 정직하게 측정.
describe('Arc Payoff Gate 엔드투엔드 실증', () => {
  const baseProject = createEmptyProject({ title: '실증 작품' });
  const baseHarnessInput = {
    medium: 'novel', formatLabel: '장편',
    material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
    storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
    characterSeed: '서윤: 죄책감',
    audience: '감정 미스터리',
    constraints: '장기 연재'
  };

  // LLM 이 payoff 채워서 반환 → measured=true, isStalled=false → premise-progress pass.
  it('LLM 이 rewardArc payoff 를 채우면 premise-progress 가 통과한다', () => {
    const payload: DraftChapterPayload = {
      title: '1화', hook: '', outline: [], beats: [], prose: '본문',
      newCanonFacts: [],
      rewardArc: [{ promise: '오빠 탐색', payoff: '오빠 단서 발견' }],
      stakesLedger: [{ stake: '필사관 자격', atRisk: '서윤', resolution: 'kept' }]
    };
    const req = { intent: '탐색', pressure: '낮음' };
    const { chapter } = chapterFromDraftPayload(baseProject, payload, req);

    const ledger = computePayoffLedger([chapter]);
    expect(ledger.measured).toBe(true);
    expect(ledger.isStalled).toBe(false);
    expect(ledger.paidPromises).toBeGreaterThan(0);

    const report = runStoryHarness({ ...baseHarnessInput, chapters: [chapter] });
    const stage = report.stages.find((s) => s.id === 'premise-progress');
    expect(stage?.status).toBe('pass');
    expect(stage?.score).toBe(10);
  });

  // LLM 이 3회차 모두 payoff 비어서 반환 (회수 미룸) → isStalled=true → premise-progress block → readyForProduction=false.
  it('LLM 이 3회차 연속 payoff 를 비우면 premise-progress 가 차단하고 readyForProduction=false 가 된다', () => {
    const makePayload = (ep: number): DraftChapterPayload => ({
      title: `${ep}화`, hook: '', outline: [], beats: [], prose: '본문',
      newCanonFacts: [],
      rewardArc: [{ promise: `회차 ${ep} 약속`, payoff: '' }],  // payoff 비어있음 = 회수 미룸
      stakesLedger: [{ stake: '필사관 자격', atRisk: '서윤', resolution: 'deferred' }]
    });
    const req = { intent: '연재', pressure: '보통' };
    // 프로젝트에 회차를 순차 누적.
    let project: SeriesProject = baseProject;
    const chapters = [];
    for (let ep = 1; ep <= 3; ep += 1) {
      const { chapter, updatedProject } = chapterFromDraftPayload(project, makePayload(ep), req);
      chapters.push(chapter);
      project = updatedProject;
    }

    const ledger = computePayoffLedger(chapters);
    expect(ledger.measured).toBe(true);
    expect(ledger.deferredStreak).toBe(3);
    expect(ledger.isStalled).toBe(true);

    const report = runStoryHarness({ ...baseHarnessInput, chapters });
    const stage = report.stages.find((s) => s.id === 'premise-progress');
    expect(stage?.status).toBe('block');
    expect(stage?.score).toBe(0);
    expect(report.readyForProduction).toBe(false);
    expect(stage?.requiredRepairs.length).toBeGreaterThan(0);
  });

  // LLM 이 회차 중간에 회수하면 deferredStreak 가 리셋되어 차단하지 않는다.
  it('payoff 회수 후 새 회차가 다시 미루면 streak 리셋 — 3회 이전이면 차단하지 않는다', () => {
    const withPayoff: DraftChapterPayload = {
      title: '1화', hook: '', outline: [], beats: [], prose: '',
      newCanonFacts: [],
      rewardArc: [{ promise: '약속', payoff: '회수함' }],
      stakesLedger: []
    };
    const noPayoff: DraftChapterPayload = {
      title: '2화', hook: '', outline: [], beats: [], prose: '',
      newCanonFacts: [],
      rewardArc: [{ promise: '새 약속', payoff: '' }],
      stakesLedger: [{ stake: '무언가', atRisk: '주인공', resolution: 'deferred' }]
    };
    const req = { intent: '진행', pressure: '보통' };
    const { chapter: ch1, updatedProject: p1 } = chapterFromDraftPayload(baseProject, withPayoff, req);
    const { chapter: ch2 } = chapterFromDraftPayload(p1, noPayoff, req);

    const ledger = computePayoffLedger([ch1, ch2]);
    expect(ledger.measured).toBe(true);
    expect(ledger.lastPayoffEpisode).toBe(1);
    expect(ledger.deferredStreak).toBe(1);   // 1화 회수 후 2화 1회만 미룸 → streak=1
    expect(ledger.isStalled).toBe(false);    // STALL_THRESHOLD=3 미달
  });
});

// 작품 헌장(Story Contract) — Phase A-1 데이터 모델. 분량 2등급·결말 역산·4줄 척추.
describe('StoryContract (작품 헌장 — Phase A)', () => {
  function makeContract(overrides: Partial<StoryContract> = {}): StoryContract {
    return {
      lengthClass: 'long',
      plannedEpisodes: 30,
      endingStatement: '주인공이 잃어버린 이름을 끝내 받아들인다.',
      protagonistCost: '평범한 일상',
      beatSheet: [],
      spineLocked: false,
      amendments: [],
      ...overrides
    };
  }

  const FULL_SPINE = {
    desire: '이름을 되찾고 싶다',
    advance: '단서를 모은다',
    obstacle: '과거가 막아선다',
    resolution: '이름을 받아들인다'
  };
  const AMEND_AT = '2026-06-14T09:00:00.000Z';

  it('defaultPlannedEpisodes — 단편 6 · 장편 30', () => {
    expect(defaultPlannedEpisodes('short')).toBe(6);
    expect(defaultPlannedEpisodes('long')).toBe(30);
  });

  it('validateContract — 단편은 4~8화 범위를 강제한다', () => {
    expect(validateContract(makeContract({ lengthClass: 'short', plannedEpisodes: 6 }))).toEqual([]);
    expect(validateContract(makeContract({ lengthClass: 'short', plannedEpisodes: 4 }))).toEqual([]);
    expect(validateContract(makeContract({ lengthClass: 'short', plannedEpisodes: 8 }))).toEqual([]);
    expect(validateContract(makeContract({ lengthClass: 'short', plannedEpisodes: 3 })).length).toBeGreaterThan(0);
    expect(validateContract(makeContract({ lengthClass: 'short', plannedEpisodes: 9 })).length).toBeGreaterThan(0);
  });

  it('validateContract — 장편은 24~36화 범위를 강제한다', () => {
    expect(validateContract(makeContract({ lengthClass: 'long', plannedEpisodes: 30 }))).toEqual([]);
    expect(validateContract(makeContract({ lengthClass: 'long', plannedEpisodes: 24 }))).toEqual([]);
    expect(validateContract(makeContract({ lengthClass: 'long', plannedEpisodes: 36 }))).toEqual([]);
    expect(validateContract(makeContract({ lengthClass: 'long', plannedEpisodes: 23 })).length).toBeGreaterThan(0);
    expect(validateContract(makeContract({ lengthClass: 'long', plannedEpisodes: 37 })).length).toBeGreaterThan(0);
  });

  it('validateContract — 결말 문장이 비면 무효', () => {
    expect(validateContract(makeContract({ endingStatement: '' })).length).toBeGreaterThan(0);
    expect(validateContract(makeContract({ endingStatement: '   ' })).length).toBeGreaterThan(0);
  });

  it('validateContract — 비트 화수가 plannedEpisodes 를 넘으면 무효', () => {
    expect(
      validateContract(
        makeContract({ plannedEpisodes: 30, beatSheet: [{ episode: 31, mission: '과한 핀' }] })
      ).length
    ).toBeGreaterThan(0);
    expect(
      validateContract(
        makeContract({ plannedEpisodes: 30, beatSheet: [{ episode: 30, mission: '결말 핀' }] })
      )
    ).toEqual([]);
  });

  it('createEmptyProject 가 storyContract 를 시드하고, 없으면 undefined 로 둔다', () => {
    const contract = makeContract({ lengthClass: 'short', plannedEpisodes: 6 });
    const withContract = createEmptyProject({ title: '단편', storyContract: contract });
    expect(withContract.storyContract).toEqual(contract);

    const without = createEmptyProject({ title: '계약 없음' });
    expect(without.storyContract).toBeUndefined();
  });

  it('applyContractAmendment — 척추 1줄 교체: 해당 줄만 갱신·비트 재산출·amendments 누적·원본 불변', () => {
    const locked = makeContract({
      spine: { ...FULL_SPINE },
      spineLocked: true,
      beatSheet: deriveBeatSheet(FULL_SPINE, 30)
    });
    const next = applyContractAmendment(locked, {
      reason: '욕망을 더 구체적으로',
      at: AMEND_AT,
      patch: { spine: { desire: '아버지의 이름을 되찾고 싶다' } }
    });
    expect(next.spine?.desire).toBe('아버지의 이름을 되찾고 싶다');
    expect(next.spine?.advance).toBe(FULL_SPINE.advance);
    expect(next.spine?.obstacle).toBe(FULL_SPINE.obstacle);
    expect(next.spine?.resolution).toBe(FULL_SPINE.resolution);
    // 욕망 핀(25%)이 새 문구로 다시 펼쳐진다.
    expect(next.beatSheet[0]?.mission).toBe('아버지의 이름을 되찾고 싶다');
    // 4줄이 여전히 차 있어 잠금 유지.
    expect(next.spineLocked).toBe(true);
    expect(next.amendments).toHaveLength(1);
    expect(next.amendments[0]?.reason).toBe('욕망을 더 구체적으로');
    expect(next.amendments[0]?.at).toBe(AMEND_AT);
    expect(next.amendments[0]?.change.length).toBeGreaterThan(0);
    // 순수 — 원본은 건드리지 않는다.
    expect(locked.spine?.desire).toBe(FULL_SPINE.desire);
    expect(locked.amendments).toHaveLength(0);
  });

  it('applyContractAmendment — 결말·대가·화수 패치 + 화수 변경 시 마지막 비트 핀 이동', () => {
    const locked = makeContract({
      spine: { ...FULL_SPINE },
      spineLocked: true,
      beatSheet: deriveBeatSheet(FULL_SPINE, 30)
    });
    const next = applyContractAmendment(locked, {
      reason: '시즌 연장',
      at: AMEND_AT,
      patch: {
        endingStatement: '이름을 버리고 새 이름을 짓는다',
        protagonistCost: '옛 이름의 기억',
        plannedEpisodes: 36
      }
    });
    expect(next.endingStatement).toBe('이름을 버리고 새 이름을 짓는다');
    expect(next.protagonistCost).toBe('옛 이름의 기억');
    expect(next.plannedEpisodes).toBe(36);
    expect(next.beatSheet[next.beatSheet.length - 1]?.episode).toBe(36);
  });

  it('applyContractAmendment — 장편 척추 한 줄을 공란으로 만들면 잠금이 풀린다(충돌 노출)', () => {
    const locked = makeContract({ spine: { ...FULL_SPINE }, spineLocked: true });
    const next = applyContractAmendment(locked, {
      reason: '비우기',
      at: AMEND_AT,
      patch: { spine: { obstacle: '   ' } }
    });
    expect(next.spineLocked).toBe(false);
  });

  it('applyContractAmendment — change 를 명시하면 그 문구를 그대로 이력에 남긴다', () => {
    const locked = makeContract({ spine: { ...FULL_SPINE }, spineLocked: true });
    const next = applyContractAmendment(locked, {
      reason: '트위스트 수락',
      at: AMEND_AT,
      change: '배신자=조력자 반전',
      patch: { spine: { resolution: '조력자가 배신자였음을 받아들인다' } }
    });
    expect(next.amendments[0]?.change).toBe('배신자=조력자 반전');
  });

  it('isSpineComplete — 단편 2줄(욕망·변화)·장편 4줄 규칙', () => {
    const partial = { desire: '욕망', advance: '', obstacle: '', resolution: '변화' };
    expect(isSpineComplete(partial, 'short')).toBe(true);
    expect(isSpineComplete(partial, 'long')).toBe(false);
    expect(isSpineComplete(FULL_SPINE, 'long')).toBe(true);
    expect(isSpineComplete({ desire: '', advance: '', obstacle: '', resolution: '' }, 'short')).toBe(false);
  });
});

// 작품 헌장 절이 컨텍스트 다이제스트에 주입되는가 — Phase A-4.
describe('buildProjectContextDigest — 작품 헌장 절 (Phase A-4)', () => {
  function longContract(): StoryContract {
    return {
      lengthClass: 'long',
      plannedEpisodes: 30,
      spine: {
        desire: '잃어버린 이름을 되찾고 싶다',
        advance: '단서를 따라 대림장으로 들어간다',
        obstacle: '이름을 부르는 자가 누구인지 알 수 없다',
        resolution: '이름을 받아들이고 돌아선다'
      },
      endingStatement: '주인공이 잃어버린 이름을 끝내 받아들인다.',
      protagonistCost: '평범했던 일상',
      beatSheet: [],
      spineLocked: true,
      amendments: []
    };
  }

  it('헌장이 있으면 4줄 척추·결말·대가·위치를 다이제스트에 넣는다', () => {
    const project: SeriesProject = {
      ...createEmptyProject({ title: '장편', medium: 'novel' }),
      storyContract: longContract(),
      chapters: [
        { id: 'episode-16', episode: 16, title: '16화', hook: '', outline: [], beats: [], prose: '본문', memoryAnchors: [], newCanonFacts: [] }
      ],
      currentEpisode: 16
    };
    const digest = buildProjectContextDigest(project);
    expect(digest).toContain('작품 헌장');
    expect(digest).toContain('잃어버린 이름을 되찾고 싶다');
    expect(digest).toContain('이름을 받아들이고 돌아선다');
    expect(digest).toContain('주인공이 잃어버린 이름을 끝내 받아들인다');
    expect(digest).toContain('평범했던 일상');
    // 위치 — 30화 중 16화, 남은 14
    expect(digest).toContain('30화');
    expect(digest).toContain('16화');
  });

  it('헌장이 없으면 헌장 절을 넣지 않는다(하위호환)', () => {
    const project = createEmptyProject({ title: '계약 없음' });
    expect(buildProjectContextDigest(project)).not.toContain('작품 헌장');
  });
});

// 온보딩 헌장 빌더 — Phase A-3. 4줄 척추 → 화수 핀 비트, 온보딩 입력 → StoryContract.
describe('buildStoryContractFromOnboarding / deriveBeatSheet (Phase A-3)', () => {
  const spine = {
    desire: '잃어버린 이름을 되찾고 싶다',
    advance: '단서를 따라 대림장으로 들어간다',
    obstacle: '이름을 부르는 자가 누구인지 알 수 없다',
    resolution: '이름을 받아들이고 돌아선다'
  };

  it('deriveBeatSheet — 4줄을 25/50/75/100% 화수에 1:1 정렬한다', () => {
    const beats = deriveBeatSheet(spine, 30);
    expect(beats).toHaveLength(4);
    expect(beats.map((b) => b.episode)).toEqual([8, 15, 23, 30]);
    expect(beats[0].mission).toBe(spine.desire);
    expect(beats[1].mission).toBe(spine.advance);
    expect(beats[2].mission).toBe(spine.obstacle);
    expect(beats[3].mission).toBe(spine.resolution);
  });

  it('deriveBeatSheet — 단편(짧은 화수)에서도 화수가 강증가하고 마지막 핀이 plannedEpisodes', () => {
    const beats = deriveBeatSheet(spine, 4);
    expect(beats.map((b) => b.episode)).toEqual([1, 2, 3, 4]);
    const six = deriveBeatSheet(spine, 6).map((b) => b.episode);
    expect(six[six.length - 1]).toBe(6);
    // 강증가 보장
    for (let i = 1; i < six.length; i += 1) {
      expect(six[i]).toBeGreaterThan(six[i - 1]);
    }
  });

  it('buildStoryContractFromOnboarding — 입력으로 유효한 헌장을 만들고 비트를 척추에서 펼친다', () => {
    const contract = buildStoryContractFromOnboarding({
      lengthClass: 'long',
      plannedEpisodes: 30,
      endingStatement: '주인공이 이름을 받아들인다.',
      protagonistCost: '평범한 일상',
      spine
    });
    expect(contract.lengthClass).toBe('long');
    expect(contract.plannedEpisodes).toBe(30);
    expect(contract.beatSheet.map((b) => b.episode)).toEqual([8, 15, 23, 30]);
    expect(contract.spineLocked).toBe(true);
    expect(contract.amendments).toEqual([]);
    // 만든 헌장은 검증을 통과한다
    expect(validateContract(contract)).toEqual([]);
  });

  it('buildStoryContractFromOnboarding — plannedEpisodes 누락 시 등급 기본값(장편 30·단편 6)', () => {
    const long = buildStoryContractFromOnboarding({ lengthClass: 'long', endingStatement: '끝', protagonistCost: '대가', spine });
    expect(long.plannedEpisodes).toBe(30);
    const short = buildStoryContractFromOnboarding({ lengthClass: 'short', endingStatement: '끝', protagonistCost: '대가', spine });
    expect(short.plannedEpisodes).toBe(6);
  });

  it('buildStoryContractFromOnboarding — 척추 4줄 중 하나라도 비면 spineLocked=false (잠금 불가)', () => {
    const contract = buildStoryContractFromOnboarding({
      lengthClass: 'long',
      endingStatement: '끝',
      protagonistCost: '대가',
      spine: { ...spine, obstacle: '' }
    });
    expect(contract.spineLocked).toBe(false);
  });

  it('buildStoryContractFromOnboarding — 단편은 desire+resolution 2줄만으로 잠근다(경량 잠금)', () => {
    // 단편은 전진·시련 줄이 비어도 핵심 2줄(욕망·변화)만 채우면 잠긴다.
    const twoLine = buildStoryContractFromOnboarding({
      lengthClass: 'short',
      plannedEpisodes: 6,
      endingStatement: '끝',
      protagonistCost: '대가',
      spine: { desire: '되찾고 싶다', advance: '', obstacle: '', resolution: '받아들인다' }
    });
    expect(twoLine.spineLocked).toBe(true);
    // 단편이라도 핵심 2줄 중 하나가 비면 잠기지 않는다.
    const missingResolution = buildStoryContractFromOnboarding({
      lengthClass: 'short',
      plannedEpisodes: 6,
      endingStatement: '끝',
      protagonistCost: '대가',
      spine: { desire: '되찾고 싶다', advance: '', obstacle: '', resolution: '' }
    });
    expect(missingResolution.spineLocked).toBe(false);
  });
});

// 단계적 집필 게이트 — Phase A-2. 척추 잠금 전엔 본문(produceEpisode) 생성을 막는다.
describe('evaluateProductionGate (단계적 집필 게이트 — Phase A-2)', () => {
  it('헌장이 없으면 통과한다(하위호환 — 기존 작품·백업 주입)', () => {
    const project = createEmptyProject({ title: '계약 없음' });
    expect(evaluateProductionGate(project).allowed).toBe(true);
  });

  it('헌장이 있고 척추가 잠겼으면 통과한다', () => {
    const contract = buildStoryContractFromOnboarding({
      lengthClass: 'long',
      plannedEpisodes: 30,
      endingStatement: '주인공이 이름을 받아들인다.',
      protagonistCost: '평범한 일상',
      spine: {
        desire: '잃어버린 이름을 되찾고 싶다',
        advance: '단서를 따라 들어간다',
        obstacle: '이름을 부르는 자가 누구인지 모른다',
        resolution: '이름을 받아들이고 돌아선다'
      }
    });
    expect(contract.spineLocked).toBe(true);
    const project = createEmptyProject({ title: '잠긴 장편', storyContract: contract });
    expect(evaluateProductionGate(project).allowed).toBe(true);
  });

  it('헌장이 있고 척추가 잠기지 않은 장편은 본문 생성을 차단하고 사유를 준다', () => {
    const project = createEmptyProject({
      title: '미잠금 장편',
      storyContract: {
        lengthClass: 'long',
        plannedEpisodes: 30,
        endingStatement: '끝',
        protagonistCost: '대가',
        beatSheet: [],
        spineLocked: false,
        amendments: []
      }
    });
    const gate = evaluateProductionGate(project);
    expect(gate.allowed).toBe(false);
    expect(gate.reason && gate.reason.trim().length).toBeGreaterThan(0);
  });

  it('단편이 2줄 경량 잠금되면 본문 생성을 허용한다(빌더→게이트 통합)', () => {
    const contract = buildStoryContractFromOnboarding({
      lengthClass: 'short',
      plannedEpisodes: 6,
      endingStatement: '끝',
      protagonistCost: '대가',
      spine: { desire: '되찾고 싶다', advance: '', obstacle: '', resolution: '받아들인다' }
    });
    const project = createEmptyProject({ title: '단편', storyContract: contract });
    expect(evaluateProductionGate(project).allowed).toBe(true);
  });
});

describe('B3 — digest always-include 절단 면제', () => {
  it('alwaysInclude 캐논은 40개 초과로 절단돼도 digest 에 포함된다', () => {
    const project = createSeedProject();
    const facts = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`,
      episode: 1,
      owner: 'plot' as const,
      statement: `사건 ${i} 가 일어났다.`,
    }));
    // 예산(40) 밖 인덱스(45)에 always-include 핀 — 위치가 아니라 앵커 보장으로 살아남는지 검증.
    // (importance 미설정 = 세션 중 토글 상태. selectCanonForContext 가 alwaysInclude 를 앵커로 직접 인정해야 통과.)
    facts[45] = { ...facts[45], statement: '한지욱은 진짜 배신자다.', alwaysInclude: true } as typeof facts[45];
    const withFacts = { ...project, canonFacts: facts };
    const digest = buildProjectContextDigest(withFacts);
    expect(digest).toContain('한지욱은 진짜 배신자다.');
  });
});

describe('buildProjectContextDigest — 중요도 검색·reveal 분리 (MVP-0)', () => {
  function makeProjectForDigest(): SeriesProject {
    return createEmptyProject({ title: '테스트 작품' });
  }

  it('65캐논 중 앵커 statement 가 digest 에 전부 살아남음(A-6 회귀)', () => {
    const anchors = Array.from({ length: 5 }, (_, i) => ({
      id: `anc${i}`, episode: 1, owner: 'plot' as const,
      statement: `핵심사건${i}`, importance: 0.9, participants: [`핵심${i}`], reveal: 'revealed' as const,
    }));
    const fillers = Array.from({ length: 60 }, (_, i) => ({
      id: `fil${i}`, episode: 2, owner: 'plot' as const,
      statement: `단역사건${i}`, importance: 0.1, participants: [`단역${i}`], reveal: 'revealed' as const,
    }));
    const project = { ...makeProjectForDigest(), canonFacts: [...anchors, ...fillers] };
    const digest = buildProjectContextDigest(project);
    anchors.forEach((a) => expect(digest).toContain(a.statement));
  });

  it('secret/foreshadowed 는 별도 "숨은 캐논" 절로 분리', () => {
    const project = {
      ...makeProjectForDigest(),
      canonFacts: [
        { id: 'r', episode: 1, owner: 'plot' as const, statement: '공개사실', importance: 0.9, participants: ['정우'], reveal: 'revealed' as const },
        { id: 's', episode: 1, owner: 'plot' as const, statement: '숨긴진실', importance: 0.9, participants: ['손님'], reveal: 'secret' as const },
      ],
    };
    const digest = buildProjectContextDigest(project);
    expect(digest).toContain('확정 캐논');
    expect(digest).toContain('공개사실');
    expect(digest).toContain('숨은 캐논 (모순 금지 · 아직 누설 금지)');
    expect(digest).toContain('숨긴진실');
  });

  it('applyRetcons — factId 일치 fact의 statement만 교체(불변·그 외 보존)', () => {
    const base = createEmptyProject({ title: 't' });
    const project: SeriesProject = {
      ...base,
      canonFacts: [
        { id: 'a1', episode: 1, owner: 'plot', statement: '서준은 살아 있다', importance: 0.9 },
        { id: 'a2', episode: 1, owner: 'world', statement: '문은 열렸다', importance: 0.6 }
      ]
    };
    const out = applyRetcons(project, [{ factId: 'a1', statement: '서준은 죽었다' }, { factId: 'none', statement: 'x' }]);
    expect(out.canonFacts.find((f) => f.id === 'a1')?.statement).toBe('서준은 죽었다');
    expect(out.canonFacts.find((f) => f.id === 'a1')?.importance).toBe(0.9);
    expect(out.canonFacts.find((f) => f.id === 'a2')?.statement).toBe('문은 열렸다');
    // 원본 불변
    expect(project.canonFacts.find((f) => f.id === 'a1')?.statement).toBe('서준은 살아 있다');
  });
});
