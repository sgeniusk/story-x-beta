import { describe, expect, it } from 'vitest';
import { chapterFromDraftPayload, createEmptyProject } from './storyEngine';
import {
  confirmProjectEntry,
  migrateLegacyProject,
  parseProjectLibrary,
  resolveProjectResumeStage,
  upsertProjectEntry
} from './projectLibrary';

const project = (id: string, title = `작품 ${id}`) => ({ ...createEmptyProject({ title }), id });

describe('project library', () => {
  it('0화는 저장된 PLAY가 있을 때만 PLAY를 재개하고 그 밖에는 WRITE로 폴백한다', () => {
    const empty = project('draft');
    const started = { ...empty, currentEpisode: 1 };
    const drifted = {
      ...chapterFromDraftPayload(empty, {
        title: '숨은 1화', hook: '', outline: [], beats: [], prose: '본문', newCanonFacts: []
      }, { genre: empty.genre, intent: '', pressure: '' }).updatedProject,
      currentEpisode: 0
    };

    expect(resolveProjectResumeStage(empty, true, false)).toBe('dive');
    expect(resolveProjectResumeStage(empty, false, false)).toBe('editor');
    expect(resolveProjectResumeStage(started, true, false)).toBe('editor');
    expect(resolveProjectResumeStage(drifted, true, false)).toBe('editor');
    expect(resolveProjectResumeStage(empty, true, true)).toBe('editor');
  });

  it('migrates a legacy project as a confirmed work', () => {
    expect(migrateLegacyProject(project('legacy'), new Date('2026-07-15T00:00:00Z'))).toEqual({
      projectId: 'legacy',
      lifecycle: 'confirmed',
      createdAt: '2026-07-15T00:00:00.000Z',
      updatedAt: '2026-07-15T00:00:00.000Z',
      project: project('legacy')
    });
  });

  it('adds a temporary work without replacing existing projects', () => {
    const legacy = migrateLegacyProject(project('legacy'), new Date('2026-07-15T00:00:00Z'));
    const next = upsertProjectEntry([legacy], project('draft'), {
      lifecycle: 'temporary',
      now: new Date('2026-07-15T01:00:00Z')
    });

    expect(next.map((entry) => [entry.projectId, entry.lifecycle])).toEqual([
      ['draft', 'temporary'],
      ['legacy', 'confirmed']
    ]);
  });

  it('updates a work while preserving its creation time and lifecycle', () => {
    const first = upsertProjectEntry([], project('draft'), {
      lifecycle: 'temporary',
      now: new Date('2026-07-15T00:00:00Z')
    });
    const next = upsertProjectEntry(first, project('draft', '바뀐 제목'), {
      now: new Date('2026-07-15T02:00:00Z')
    });

    expect(next[0]).toMatchObject({
      lifecycle: 'temporary',
      createdAt: '2026-07-15T00:00:00.000Z',
      updatedAt: '2026-07-15T02:00:00.000Z',
      project: { title: '바뀐 제목' }
    });
  });

  it('confirms a work without changing its project payload', () => {
    const [draft] = upsertProjectEntry([], project('draft'), {
      lifecycle: 'temporary',
      now: new Date('2026-07-15T00:00:00Z')
    });
    const [confirmed] = confirmProjectEntry([draft], 'draft', new Date('2026-07-15T01:00:00Z'));

    expect(confirmed.lifecycle).toBe('confirmed');
    expect(confirmed.project).toEqual(draft.project);
  });

  it('drops damaged records and sorts valid works by latest update', () => {
    const early = migrateLegacyProject(project('early'), new Date('2026-07-15T00:00:00Z'));
    const late = migrateLegacyProject(project('late'), new Date('2026-07-15T02:00:00Z'));
    const raw = JSON.stringify([early, { projectId: '', project: {} }, late]);

    expect(parseProjectLibrary(raw).map((entry) => entry.projectId)).toEqual(['late', 'early']);
    expect(parseProjectLibrary('{')).toEqual([]);
  });
});
