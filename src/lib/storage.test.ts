import { describe, expect, it } from 'vitest';
import { appendSnapshot, buildProjectSnapshot, type ProjectSnapshot } from './storage';
import { createSeedProject } from './storyEngine';

describe('project snapshots', () => {
  it('builds a snapshot capturing episode, counts, and the project', () => {
    const project = createSeedProject();
    const snapshot = buildProjectSnapshot(project, '3화 생성', new Date('2026-05-17T00:00:00Z'));

    expect(snapshot.label).toBe('3화 생성');
    expect(snapshot.episode).toBe(project.currentEpisode);
    expect(snapshot.chapterCount).toBe(project.chapters.length);
    expect(snapshot.canonCount).toBe(project.canonFacts.length);
    expect(snapshot.project).toBe(project);
    expect(snapshot.savedAt).toBe('2026-05-17T00:00:00.000Z');
  });

  it('keeps newest snapshots first and caps the list length', () => {
    const project = createSeedProject();
    let list: ProjectSnapshot[] = [];

    for (let index = 0; index < 25; index += 1) {
      const snapshot = buildProjectSnapshot(project, `v${index}`, new Date(2026, 4, 17, 0, 0, index));
      list = appendSnapshot(list, snapshot, 20);
    }

    expect(list).toHaveLength(20);
    expect(list[0].label).toBe('v24');
    expect(list[19].label).toBe('v5');
  });
});
