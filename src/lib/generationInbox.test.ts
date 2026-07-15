import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './storyEngine';
import {
  appendGenerationInboxItem,
  buildProjectRevision,
  isActiveGeneration,
  mergeGenerationJob,
  parseGenerationInbox,
  serializeGenerationInbox,
  type GenerationInboxItem
} from './generationInbox';

const item = (id: string, status: GenerationInboxItem['status'] = 'running'): GenerationInboxItem => ({
  id,
  kind: 'dive-condense',
  projectId: 'p1',
  projectTitle: '작품',
  baseRevision: 'rev-1',
  episode: 1,
  status,
  createdAt: `2026-07-15T00:00:${id.padStart(2, '0')}Z`,
  updatedAt: `2026-07-15T00:00:${id.padStart(2, '0')}Z`
});

describe('generation inbox', () => {
  it('round-trips valid items and drops damaged entries', () => {
    const raw = JSON.stringify([item('1'), { id: '', status: 'running' }, null]);
    expect(parseGenerationInbox(raw)).toEqual([item('1')]);
    expect(parseGenerationInbox(serializeGenerationInbox([item('1')]))).toEqual([item('1')]);
  });

  it('downgrades a persisted success receipt when its result payload is missing or malformed', () => {
    const missing = { ...item('1', 'succeeded') };
    const malformed = { ...item('2', 'succeeded'), result: { title: '제목만 있음' } };

    expect(parseGenerationInbox(JSON.stringify([missing, malformed]))).toEqual([
      expect.objectContaining({ id: '1', status: 'failed', warning: '완료 결과를 복구하지 못했습니다.' }),
      expect.objectContaining({ id: '2', status: 'failed', warning: '완료 결과를 복구하지 못했습니다.' })
    ]);
  });

  it('keeps newest items first and caps at 20', () => {
    let list: GenerationInboxItem[] = [];
    for (let index = 0; index < 25; index += 1) list = appendGenerationInboxItem(list, item(String(index)));
    expect(list).toHaveLength(20);
    expect(list[0].id).toBe('24');
  });

  it('merges polled terminal result without losing client metadata', () => {
    const merged = mergeGenerationJob(item('1'), {
      id: '1', projectId: 'p1', baseRevision: 'rev-1', episode: 1,
      status: 'succeeded', createdAt: 'x', updatedAt: 'y', result: { title: '1화', prose: '본문' }
    });
    expect(merged.projectTitle).toBe('작품');
    expect(merged.status).toBe('succeeded');
    expect(merged.result?.prose).toBe('본문');
  });

  it('recognizes only running jobs as active', () => {
    expect(isActiveGeneration(item('1', 'running'))).toBe(true);
    expect(isActiveGeneration(item('1', 'succeeded'))).toBe(false);
    expect(isActiveGeneration(item('1', 'expired'))).toBe(false);
  });

  it('builds a deterministic revision that changes with canon or chapter state', () => {
    const project = createEmptyProject({ title: '작품' });
    expect(buildProjectRevision(project)).toBe(buildProjectRevision({ ...project }));
    expect(buildProjectRevision({ ...project, currentEpisode: project.currentEpisode + 1 })).not.toBe(buildProjectRevision(project));
  });
});
