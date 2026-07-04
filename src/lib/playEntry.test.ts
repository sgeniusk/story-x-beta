import { describe, it, expect } from 'vitest';
import { deriveContinuationScene, seedPlayFromProject } from './playEntry';
import { createEmptyProject } from './storyEngine';
import type { Chapter, CharacterProfile } from './storyEngine';

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'ch-1',
    episode: 1,
    title: '1화 — 시작',
    summary: '',
    prose: '',
    ...overrides
  } as Chapter;
}

function makeCharacter(id: string, name: string): CharacterProfile {
  return {
    id, name, role: '주인공', desire: '', wound: '', currentState: '',
    voiceRules: [], canonAnchors: [], forbiddenContradictions: [], relations: []
  };
}

describe('deriveContinuationScene', () => {
  it('summary 가 있으면 그것을 이어붙인다', () => {
    const ch = makeChapter({ summary: '서준이 문을 열고 떠났다' } as Partial<Chapter>);
    expect(deriveContinuationScene(ch)).toBe('직전 회차 이후 — 서준이 문을 열고 떠났다');
  });

  it('summary 가 비면 prose 의 마지막 문단을 쓴다', () => {
    const ch = makeChapter({ summary: '', prose: '첫 문단.\n\n마지막 문단이다.' } as Partial<Chapter>);
    expect(deriveContinuationScene(ch)).toBe('직전 회차 이후 — 마지막 문단이다.');
  });

  it('summary·prose 모두 비면 빈 문자열', () => {
    expect(deriveContinuationScene(makeChapter({ summary: '', prose: '   ' } as Partial<Chapter>))).toBe('');
  });
});

describe('seedPlayFromProject', () => {
  it('인물이 없으면 null 을 반환한다', () => {
    const project = createEmptyProject({ title: '무인물' });
    expect(seedPlayFromProject({ ...project, characters: [] })).toBeNull();
  });

  it('characters[0] 을 주인공으로 세션을 만든다', () => {
    const base = createEmptyProject({ title: '테스트작' });
    const project = { ...base, characters: [makeCharacter('c-1', '서윤'), makeCharacter('c-2', '민호')] };
    const seed = seedPlayFromProject(project);
    expect(seed).not.toBeNull();
    expect(seed!.schema).toBe('storyx/dive/v1');
    expect(seed!.session.characterId).toBe('c-1');
    expect(seed!.session.projectId).toBe(project.id);
    expect(seed!.project).toBe(project);
  });

  it('최근 회차가 있으면 scene 을 이어붙인다', () => {
    const base = createEmptyProject({ title: '연재작' });
    const project = {
      ...base,
      characters: [makeCharacter('c-1', '서윤')],
      chapters: [
        { id: 'ch-1', episode: 1, title: '1화', summary: '첫 만남', prose: '' } as any,
        { id: 'ch-2', episode: 2, title: '2화', summary: '이별 통보', prose: '' } as any
      ]
    };
    const seed = seedPlayFromProject(project);
    expect(seed!.session.scene).toBe('직전 회차 이후 — 이별 통보');
  });

  it('회차가 없으면 scene 미설정', () => {
    const base = createEmptyProject({ title: '새작' });
    const project = { ...base, characters: [makeCharacter('c-1', '서윤')], chapters: [] };
    const seed = seedPlayFromProject(project);
    expect(seed!.session.scene).toBeUndefined();
  });
});
