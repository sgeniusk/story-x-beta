import { describe, expect, it } from 'vitest';
import {
  applyApprovedMemory,
  buildDeterministicDataReview,
  buildStoryEditorWorkspace,
  chapterFromDraftPayload,
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
        expect.objectContaining({
          kind: 'plot-thread',
          title: '새 표식은 현재 시점에서 누가 남겼는가?'
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
