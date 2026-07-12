import { describe, it, expect } from 'vitest';
import {
  deriveContinuationScene,
  seedPlayFromProject,
  presetToDiveSetup,
  buildPlayFirstProject
} from './playEntry';
import { createEmptyProject, FALLBACK_EMPTY_LINE } from './storyEngine';
import type { Chapter, CharacterProfile } from './storyEngine';
import { DIVE_SEED_CHARACTERS } from './diveSeedCharacters';

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'ch-1', episode: 1, title: '1화 — 시작', hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...overrides
  };
}
function makeCharacter(id: string, name: string): CharacterProfile {
  return {
    id, name, role: '주인공', desire: '', wound: '', currentState: '',
    voiceRules: [], canonAnchors: [], forbiddenContradictions: [], relations: []
  };
}

describe('deriveContinuationScene', () => {
  it('원고 마지막 문단을 이어붙인다', () => {
    expect(deriveContinuationScene(makeChapter({ prose: '첫 문단.\n\n마지막 문단이다.' })))
      .toBe('직전 회차 이후 — 마지막 문단이다.');
  });
  it('원고가 임시 초안 placeholder 면 마지막 beat 요약을 쓴다', () => {
    const ch = makeChapter({
      prose: FALLBACK_EMPTY_LINE,
      beats: [{ id: 'b1', no: 1, label: '', summary: '서준이 문을 열고 떠났다', tension: 40 }]
    });
    expect(deriveContinuationScene(ch)).toBe('직전 회차 이후 — 서준이 문을 열고 떠났다');
  });
  it('원고·beat 없으면 hook 을 쓴다', () => {
    expect(deriveContinuationScene(makeChapter({ hook: '누군가 문을 두드렸다' })))
      .toBe('직전 회차 이후 — 누군가 문을 두드렸다');
  });
  it('아무 단서도 없으면 빈 문자열', () => {
    expect(deriveContinuationScene(makeChapter())).toBe('');
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
  it('주인공 캐논 신호가 있으면 characters[0] 대신 그 인물을 주인공으로 잡는다', () => {
    // ch23 로판처럼 주인공(빙의 대상)이 characters[0] 이 아닌 경우 — canonFact "주인공은 …민호…" 로 감지.
    const base = createEmptyProject({ title: '빙의작' });
    // ch23 로판처럼 role 은 비어 있고(주인공 명시 없음), 주인공은 canonFact 로만 드러난다.
    const project = {
      ...base,
      characters: [
        { ...makeCharacter('c-1', '서윤'), role: '' },
        { ...makeCharacter('c-2', '민호'), role: '' }
      ],
      canonFacts: [
        { id: 'k1', episode: 1, owner: 'character' as const, statement: '주인공은 몰락 가문의 막내 민호로 빙의했다.' }
      ]
    };
    expect(seedPlayFromProject(project)!.session.characterId).toBe('c-2');
  });
  it('최근 회차가 있으면 scene 을 이어붙인다', () => {
    const base = createEmptyProject({ title: '연재작' });
    const project = {
      ...base,
      characters: [makeCharacter('c-1', '서윤')],
      chapters: [
        makeChapter({ id: 'ch-1', episode: 1, title: '1화', prose: '첫 만남.' }),
        makeChapter({ id: 'ch-2', episode: 2, title: '2화', prose: '그리고 이별 통보.' })
      ]
    };
    expect(seedPlayFromProject(project)!.session.scene).toBe('직전 회차 이후 — 그리고 이별 통보.');
  });
  it('회차가 없으면 scene 미설정', () => {
    const base = createEmptyProject({ title: '새작' });
    const project = { ...base, characters: [makeCharacter('c-1', '서윤')], chapters: [] };
    expect(seedPlayFromProject(project)!.session.scene).toBeUndefined();
  });
});

describe('presetToDiveSetup', () => {
  it('프리셋 시드를 DiveSetup 형태로 변환한다 — background→scene·인물 1·myRole 빈 값', () => {
    const seed = DIVE_SEED_CHARACTERS[0];
    const setup = presetToDiveSetup(seed);
    expect(setup.scene).toBe(seed.background);
    expect(setup.cast).toHaveLength(1);
    expect(setup.cast[0].name).toBe(seed.character.name);
    expect(setup.cast[0].desire).toBe(seed.character.desire);
    expect(setup.cast[0].voiceRules).toEqual(seed.character.voiceRules);
    expect(setup.myRole).toBe('');
  });
});

describe('buildPlayFirstProject', () => {
  const setup = {
    scene: '늦은 밤 편의점, 폐점 직전.',
    cast: [
      { name: '지호', role: '야간 알바', desire: '가게를 지키고 싶다', wound: '떠난 가족', voiceRules: ['짧게'] }
    ],
    myRole: '10년 만에 돌아온 단골'
  };

  it('cast 를 인물로 등록한 0회차 프로젝트와 scene 이 주입된 diveState 를 만든다', () => {
    const result = buildPlayFirstProject(setup, { medium: 'novel', format: 'long-novel' });
    expect(result).not.toBeNull();
    const { project, diveState } = result!;
    expect(project.chapters).toHaveLength(0);
    expect(project.characters).toHaveLength(1);
    expect(project.characters[0].name).toBe('지호');
    expect(project.characters[0].desire).toBe('가게를 지키고 싶다');
    expect(project.medium).toBe('novel');
    expect(project.format).toBe('long-novel');
    expect(diveState.schema).toBe('storyx/dive/v1');
    expect(diveState.session.scene).toBe('늦은 밤 편의점, 폐점 직전.');
    expect(diveState.session.characterId).toBe(project.characters[0].id);
    expect(diveState.session.projectId).toBe(project.id);
    expect(diveState.project).toBe(project);
  });

  it('제목은 myRole 앞 20자에서 파생한다', () => {
    const result = buildPlayFirstProject(setup, {});
    expect(result!.project.title).toBe('10년 만에 돌아온 단골'.slice(0, 20));
  });

  it('myRole 이 공백뿐이면 scene 앞 20자를 쓴다', () => {
    const blank = buildPlayFirstProject({ ...setup, myRole: '   ' }, {});
    expect(blank!.project.title).toBe('늦은 밤 편의점, 폐점 직전.'.slice(0, 20));
  });

  it('myRole 이 비면 scene 앞 20자, 둘 다 비면 폴백 제목', () => {
    const noRole = buildPlayFirstProject({ ...setup, myRole: '' }, {});
    expect(noRole!.project.title).toBe('늦은 밤 편의점, 폐점 직전.'.slice(0, 20));
    const empty = buildPlayFirstProject({ scene: '', cast: setup.cast, myRole: '' }, {});
    expect(empty!.project.title).toBe('플레이로 시작한 이야기');
  });

  it('cast 가 비면 null', () => {
    expect(buildPlayFirstProject({ scene: 'x', cast: [], myRole: 'y' }, {})).toBeNull();
  });
});
