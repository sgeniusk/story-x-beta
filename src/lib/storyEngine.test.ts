import { describe, expect, it } from 'vitest';
import {
  buildStoryEditorWorkspace,
  createSeedProject,
  produceNextChapter,
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
});
