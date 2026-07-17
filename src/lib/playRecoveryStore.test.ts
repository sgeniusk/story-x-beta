import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayRecoveryWorkDraft } from './playRecovery';
import {
  activatePlayRecoveryWorkDraft,
  clearPlayRecoveryWorkDraftProject,
  deactivatePlayRecoveryWorkDraft,
  getActivePlayRecoveryWorkDraft,
  listPlayRecoveryWorkDrafts,
  loadPlayRecoveryWorkDraftStore,
  parsePlayRecoveryWorkDraftStore,
  removePlayRecoveryWorkDraft,
  savePlayRecoveryWorkDraft
} from './playRecoveryStore';

const draft = (
  id: string,
  projectId = 'project-a',
  body = ''
): PlayRecoveryWorkDraft => ({
  schema: 'storyx/play-recovery-work-draft/v1',
  id,
  projectId,
  generationId: `generation-${id}`,
  episodeHint: 3,
  title: '',
  body,
  source: {
    schema: 'storyx/play-recovery/v1',
    projectId,
    projectTitle: projectId === 'project-a' ? '첫 작품' : '둘째 작품',
    episode: 3,
    scene: '옥상',
    transcript: '나: 오늘은 가지 마세요.',
    capturedAt: '2026-07-16T13:47:34.473Z'
  },
  createdAt: '2026-07-16T13:48:00.000Z',
  updatedAt: '2026-07-16T13:48:00.000Z'
});

describe('PLAY recovery work draft store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('프로젝트별 여러 작업본과 active draft를 새로고침 뒤에도 분리해 복원한다', () => {
    expect(savePlayRecoveryWorkDraft(draft('a-1'))).toBe(true);
    expect(savePlayRecoveryWorkDraft(draft('a-2'), false)).toBe(true);
    expect(savePlayRecoveryWorkDraft(draft('b-1', 'project-b'))).toBe(true);

    expect(listPlayRecoveryWorkDrafts('project-a').map((item) => item.id)).toEqual(['a-1', 'a-2']);
    expect(listPlayRecoveryWorkDrafts('project-b').map((item) => item.id)).toEqual(['b-1']);
    expect(getActivePlayRecoveryWorkDraft('project-a')?.id).toBe('a-1');
    expect(getActivePlayRecoveryWorkDraft('project-b')?.id).toBe('b-1');
    expect(loadPlayRecoveryWorkDraftStore().schema).toBe('storyx/play-recovery-work-draft-store/v1');
  });

  it('같은 id를 저장하면 그 작업본만 갱신하고 다른 작업본은 보존한다', () => {
    savePlayRecoveryWorkDraft(draft('a-1', 'project-a', '첫 본문'));
    savePlayRecoveryWorkDraft(draft('a-2', 'project-a', '다른 본문'), false);

    const updated = {
      ...draft('a-1', 'project-a', '이어 쓴 본문'),
      title: '수정한 제목',
      updatedAt: '2026-07-16T14:00:00.000Z'
    };
    expect(savePlayRecoveryWorkDraft(updated, false)).toBe(true);

    expect(listPlayRecoveryWorkDrafts('project-a')).toEqual([
      updated,
      draft('a-2', 'project-a', '다른 본문')
    ]);
    expect(getActivePlayRecoveryWorkDraft('project-a')).toEqual(updated);
  });

  it('부분 저장 재시도용 commit intent와 legacy repair journal을 새로고침 뒤에도 보존한다', () => {
    const journaled: PlayRecoveryWorkDraft = {
      ...draft('a-1', 'project-a', '이어 쓴 본문'),
      commitIntent: {
        chapterId: 'episode-3',
        chapterTitle: '문 뒤의 목소리',
        requestedAt: '2026-07-16T14:00:00.000Z'
      },
      legacyRepair: {
        chapterId: 'episode-legacy',
        startedAt: '2026-07-16T13:59:00.000Z'
      }
    };
    expect(savePlayRecoveryWorkDraft(journaled)).toBe(true);
    expect(getActivePlayRecoveryWorkDraft('project-a')).toEqual(journaled);

    const broken = JSON.stringify({
      schema: 'storyx/play-recovery-work-draft-store/v1',
      projects: {
        'project-a': {
          drafts: [{ ...journaled, commitIntent: { chapterId: '', chapterTitle: 42 } }],
          activeDraftId: journaled.id
        }
      }
    });
    expect(parsePlayRecoveryWorkDraftStore(broken).projects).toEqual({});
  });

  it('다른 탭의 오래된 draft 저장이 이미 영속된 commit intent를 지우거나 본문을 되돌리지 못한다', () => {
    const stale = draft('a-1', 'project-a', '오래된 탭의 본문');
    const journaled: PlayRecoveryWorkDraft = {
      ...stale,
      title: '저장할 제목',
      body: '저장할 최신 본문',
      commitIntent: {
        chapterId: 'episode-3',
        chapterTitle: '저장할 제목',
        requestedAt: '2026-07-16T14:00:00.000Z'
      }
    };
    expect(savePlayRecoveryWorkDraft(journaled)).toBe(true);

    expect(savePlayRecoveryWorkDraft(stale)).toBe(true);

    expect(getActivePlayRecoveryWorkDraft('project-a')).toEqual(journaled);
  });

  it('프로젝트마다 최신 작업본 20개까지만 보존한다', () => {
    for (let index = 1; index <= 21; index += 1) {
      savePlayRecoveryWorkDraft(draft(`a-${index}`), false);
    }
    savePlayRecoveryWorkDraft(draft('b-1', 'project-b'));

    expect(listPlayRecoveryWorkDrafts('project-a')).toHaveLength(20);
    expect(listPlayRecoveryWorkDrafts('project-a').map((item) => item.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `a-${index + 2}`)
    );
    expect(listPlayRecoveryWorkDrafts('project-b')).toEqual([draft('b-1', 'project-b')]);
  });

  it('20개 cap을 넘어도 active·저널·작성 중 작업본은 보존하고 빈 비활성 작업본만 정리한다', () => {
    const active = draft('protected-active');
    const authoredBody = draft('protected-body', 'project-a', '사용자가 쓴 본문');
    const authoredTitle = { ...draft('protected-title'), title: '사용자가 쓴 제목' };
    const intent = {
      ...draft('protected-intent'),
      commitIntent: {
        chapterId: 'episode-3',
        chapterTitle: '문 뒤의 목소리',
        requestedAt: '2026-07-16T14:00:00.000Z'
      }
    };
    const repair = {
      ...draft('protected-repair'),
      legacyRepair: {
        chapterId: 'episode-legacy',
        startedAt: '2026-07-16T13:59:00.000Z'
      }
    };

    expect(savePlayRecoveryWorkDraft(active)).toBe(true);
    expect(savePlayRecoveryWorkDraft(authoredBody, false)).toBe(true);
    expect(savePlayRecoveryWorkDraft(authoredTitle, false)).toBe(true);
    expect(savePlayRecoveryWorkDraft(intent, false)).toBe(true);
    expect(savePlayRecoveryWorkDraft(repair, false)).toBe(true);
    for (let index = 1; index <= 20; index += 1) {
      expect(savePlayRecoveryWorkDraft(draft(`empty-${index}`), false)).toBe(true);
    }

    const kept = listPlayRecoveryWorkDrafts('project-a');
    expect(kept).toHaveLength(20);
    expect(kept.map((item) => item.id)).toEqual([
      'protected-active',
      'protected-body',
      'protected-title',
      'protected-intent',
      'protected-repair',
      ...Array.from({ length: 15 }, (_, index) => `empty-${index + 6}`)
    ]);
    expect(getActivePlayRecoveryWorkDraft('project-a')?.id).toBe('protected-active');
  });

  it('보호할 작업본만 20개를 넘으면 사용자 원고를 버리지 않고 cap을 초과해 보존한다', () => {
    for (let index = 1; index <= 21; index += 1) {
      expect(savePlayRecoveryWorkDraft(
        draft(`authored-${index}`, 'project-a', `작성 본문 ${index}`),
        false
      )).toBe(true);
    }
    expect(savePlayRecoveryWorkDraft(draft('empty-overflow'), false)).toBe(true);

    const kept = listPlayRecoveryWorkDrafts('project-a');
    expect(kept).toHaveLength(21);
    expect(kept.map((item) => item.id)).toEqual(
      Array.from({ length: 21 }, (_, index) => `authored-${index + 1}`)
    );
  });

  it('기존 raw store를 파싱할 때도 오래된 active·저널 작업본을 cap 밖으로 밀어내지 않는다', () => {
    const active = draft('old-active');
    const journaled = {
      ...draft('old-journal'),
      commitIntent: {
        chapterId: 'episode-3',
        chapterTitle: '문 뒤의 목소리',
        requestedAt: '2026-07-16T14:00:00.000Z'
      }
    };
    const raw = JSON.stringify({
      schema: 'storyx/play-recovery-work-draft-store/v1',
      projects: {
        'project-a': {
          drafts: [
            active,
            journaled,
            ...Array.from({ length: 20 }, (_, index) => draft(`empty-${index + 1}`))
          ],
          activeDraftId: active.id
        }
      }
    });

    const parsed = parsePlayRecoveryWorkDraftStore(raw).projects['project-a'];
    expect(parsed.drafts).toHaveLength(20);
    expect(parsed.drafts.map((item) => item.id)).toEqual([
      'old-active',
      'old-journal',
      ...Array.from({ length: 18 }, (_, index) => `empty-${index + 3}`)
    ]);
    expect(parsed.activeDraftId).toBe('old-active');
  });

  it('active를 해제해도 작업본은 지우지 않고 나중에 다시 활성화한다', () => {
    savePlayRecoveryWorkDraft(draft('a-1'));

    expect(deactivatePlayRecoveryWorkDraft('project-a')).toBe(true);
    expect(getActivePlayRecoveryWorkDraft('project-a')).toBeNull();
    expect(listPlayRecoveryWorkDrafts('project-a')).toEqual([draft('a-1')]);

    expect(activatePlayRecoveryWorkDraft('project-a', 'a-1')).toBe(true);
    expect(getActivePlayRecoveryWorkDraft('project-a')).toEqual(draft('a-1'));
    expect(activatePlayRecoveryWorkDraft('project-a', 'missing')).toBe(false);
    expect(getActivePlayRecoveryWorkDraft('project-a')).toEqual(draft('a-1'));
  });

  it('손상 entry만 버리고 같은 프로젝트와 다른 프로젝트의 정상 작업본은 유지한다', () => {
    const validA = draft('a-1');
    const validB = draft('b-1', 'project-b');
    const raw = JSON.stringify({
      schema: 'storyx/play-recovery-work-draft-store/v1',
      projects: {
        'project-a': {
          drafts: [validA, { ...draft('broken'), body: 42 }, { ...draft('wrong-project'), projectId: 'project-b' }],
          activeDraftId: 'broken'
        },
        'project-b': { drafts: [validB], activeDraftId: 'b-1' },
        broken: { drafts: 'not-an-array', activeDraftId: 'x' }
      }
    });

    const parsed = parsePlayRecoveryWorkDraftStore(raw);
    expect(parsed.projects['project-a']).toEqual({ drafts: [validA] });
    expect(parsed.projects['project-b']).toEqual({ drafts: [validB], activeDraftId: 'b-1' });
    expect(parsed.projects).not.toHaveProperty('broken');
    expect(parsePlayRecoveryWorkDraftStore('{broken')).toEqual({
      schema: 'storyx/play-recovery-work-draft-store/v1',
      projects: {}
    });
  });

  it('작업본 하나를 제거하고 프로젝트 전체를 지워도 다른 프로젝트는 보존한다', () => {
    savePlayRecoveryWorkDraft(draft('a-1'));
    savePlayRecoveryWorkDraft(draft('a-2'), false);
    savePlayRecoveryWorkDraft(draft('b-1', 'project-b'));

    expect(removePlayRecoveryWorkDraft('project-a', 'a-1')).toBe(true);
    expect(listPlayRecoveryWorkDrafts('project-a').map((item) => item.id)).toEqual(['a-2']);
    expect(getActivePlayRecoveryWorkDraft('project-a')).toBeNull();

    expect(clearPlayRecoveryWorkDraftProject('project-a')).toBe(true);
    expect(listPlayRecoveryWorkDrafts('project-a')).toEqual([]);
    expect(listPlayRecoveryWorkDrafts('project-b')).toEqual([draft('b-1', 'project-b')]);
  });

  it('quota 오류를 예외로 전파하지 않고 false를 반환하며 기존 저장값을 보존한다', () => {
    const original = draft('a-1');
    savePlayRecoveryWorkDraft(original);
    const rawBefore = window.localStorage.getItem('serial-story-studio/play-recovery-work-drafts');
    const storage = {
      getItem: vi.fn(() => rawBefore),
      setItem: vi.fn(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      }),
      removeItem: vi.fn()
    };

    expect(() => savePlayRecoveryWorkDraft(draft('a-2'), true, storage)).not.toThrow();
    expect(savePlayRecoveryWorkDraft(draft('a-2'), true, storage)).toBe(false);
    expect(storage.setItem).toHaveBeenCalled();
    expect(window.localStorage.getItem('serial-story-studio/play-recovery-work-drafts')).toBe(rawBefore);
  });
});
