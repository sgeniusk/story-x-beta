import { describe, expect, it } from 'vitest';
import {
  applyApprovedMemory,
  buildDeterministicDataReview,
  buildContinuityContractFromProject,
  buildFallbackDraft,
  buildStoryEditorWorkspace,
  chapterFromDraftPayload,
  createEmptyProject,
  createSeedProject,
  getCanonReviewCategoryLabel,
  lockChapter,
  normalizeChapterBeats,
  produceNextChapter,
  serializeCanonCategory,
  unlockChapter,
  validateContinuity
} from './storyEngine';

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

  it('Chapter.stakesLedger / rewardArc 가 optional 로 보존된다', () => {
    const empty = createEmptyProject({ title: '단편' });
    const result = chapterFromDraftPayload(
      empty,
      {
        title: '1화',
        hook: '문이 열렸다',
        outline: ['들어간다'],
        beats: [{ label: 'a', summary: 'b' }],
        prose: '본문.',
        newCanonFacts: []
      },
      { genre: 'urban-fantasy', intent: '진입', pressure: '' }
    );
    const chapter = result.chapter;
    const enriched = {
      ...chapter,
      stakesLedger: [{ stake: '신뢰', atRisk: '서윤', resolution: 'deferred' as const }],
      rewardArc: [{ promise: '문의 비밀', payoff: '문 너머의 메모', intensity: 70 }]
    };
    expect(enriched.stakesLedger?.[0].stake).toBe('신뢰');
    expect(enriched.rewardArc?.[0].intensity).toBe(70);
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
    expect(result.updatedProject.canonFacts).toHaveLength(project.canonFacts.length + 2);
    expect(result.continuityIssues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
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
