import { describe, expect, it } from 'vitest';
import {
  appendSnapshot,
  buildProjectSnapshot,
  hasMeaningfulOnboardingInput,
  normalizeProject,
  parseOnboardingDraft,
  parseDiveState,
  serializeOnboardingDraft,
  serializeDiveState,
  type OnboardingDraft,
  type ProjectSnapshot,
  type DiveState
} from './storage';
import { createSeedProject, createEmptyProject } from './storyEngine';
import { createDiveSession } from './diveSession';

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

describe('의도 메모 영속 (nextEpisodeIntent)', () => {
  it('normalizeProject 가 nextEpisodeIntent 를 보존한다', () => {
    const normalized = normalizeProject({ ...createSeedProject(), nextEpisodeIntent: '이번 화는 파격으로 간다' });
    expect(normalized.nextEpisodeIntent).toBe('이번 화는 파격으로 간다');
  });

  it('nextEpisodeIntent 없는 구버전 저장본은 빈 문자열로 백필한다', () => {
    const legacy = createSeedProject();
    delete (legacy as { nextEpisodeIntent?: string }).nextEpisodeIntent;
    expect(normalizeProject(legacy).nextEpisodeIntent).toBe('');
  });
});

describe('활동일 영속 (writingLog · B2)', () => {
  it('normalizeProject 가 writingLog activeDays 를 정렬·dedup 보존한다', () => {
    const normalized = normalizeProject({
      ...createSeedProject(),
      writingLog: { activeDays: ['2026-06-20', '2026-06-18', '2026-06-20'] },
    });
    expect(normalized.writingLog).toEqual({ activeDays: ['2026-06-18', '2026-06-20'] });
  });

  it('writingLog 없는 구버전 저장본은 빈 활동일로 백필한다', () => {
    const legacy = createSeedProject();
    delete (legacy as { writingLog?: unknown }).writingLog;
    expect(normalizeProject(legacy).writingLog).toEqual({ activeDays: [] });
  });
});

describe('AI주입 토글 영속 (canonFact.alwaysInclude · B3)', () => {
  it('normalizeProject 가 alwaysInclude 를 보존한다', () => {
    const seed = createSeedProject();
    const withFlag = {
      ...seed,
      canonFacts: [{ id: 'c1', episode: 1, owner: 'character' as const, statement: '한지욱은 각성자다.', alwaysInclude: true }],
    };
    const normalized = normalizeProject(withFlag);
    expect(normalized.canonFacts[0].alwaysInclude).toBe(true);
  });

  it('alwaysInclude 없는 구버전 캐논은 false 로 백필', () => {
    const seed = createSeedProject();
    const legacy = {
      ...seed,
      canonFacts: [{ id: 'c1', episode: 1, owner: 'character' as const, statement: '한지욱은 각성자다.' }],
    };
    const normalized = normalizeProject(legacy);
    expect(normalized.canonFacts[0].alwaysInclude).toBe(false);
  });
});

describe('DiveState 영속 (Dive X)', () => {
  it('DiveState는 라운드트립으로 보존된다', () => {
    const state: DiveState = {
      schema: 'storyx/dive/v1',
      session: createDiveSession('seed-childhood', 'proj-x'),
      project: createEmptyProject({ title: '도윤과의 연대기' })
    };
    const parsed = parseDiveState(serializeDiveState(state));
    expect(parsed?.session.characterId).toBe('seed-childhood');
    expect(parsed?.project.title).toBe('도윤과의 연대기');
  });

  it('parseDiveState는 무효/구버전 입력에 null을 반환', () => {
    expect(parseDiveState(null)).toBeNull();
    expect(parseDiveState('{not json')).toBeNull();
    expect(parseDiveState(JSON.stringify({ schema: 'wrong' }))).toBeNull();
  });

  it('DiveState는 session.scene을 라운드트립으로 보존한다', () => {
    const session = { ...createDiveSession('seed-childhood', 'p'), scene: '도윤네 집 앞. 도윤은 학원.' };
    const state: DiveState = {
      schema: 'storyx/dive/v1',
      session,
      project: createEmptyProject({ title: 't' })
    };
    const parsed = parseDiveState(serializeDiveState(state));
    expect(parsed?.session.scene).toBe('도윤네 집 앞. 도윤은 학원.');
  });
});

describe('온보딩 자동 복원 영속 (OnboardingDraft)', () => {
  function fullDraft(): OnboardingDraft {
    return {
      schema: 'storyx/onboarding/v1',
      medium: 'novel',
      format: 'long-novel',
      homeFlowStep: 'charter',
      intakeAnswers: { q1: 'opt-a', q2: 'opt-b' },
      intakeOtherAnswers: { q1: '직접 입력한 답' },
      interviewNote: '인터뷰 메모',
      freewriteText: '심야 라디오 PD 가 10년 전 뺑소니를 마주한다',
      intakeQuestionIndex: 2,
      contractLengthClass: 'long',
      contractPlannedEpisodes: 30,
      contractEnding: '자백으로 끝난다',
      contractCost: '직업과 신뢰를 잃는다',
      contractSpine: { desire: '진실', advance: '추적', obstacle: '은폐', resolution: '자백' },
      llmIntakeQuestions: [
        { id: 'q1', agentId: 'showrunner', agentLabel: '쇼러너', question: '무엇을 숨기나', options: [], recommendedOptionId: '' }
      ],
      interviewPersonaLineup: [
        { id: 'p1', label: '쇼러너', tone: '구조', category: 'novel', isFictionalized: false }
      ],
      interviewFallbackReason: null
    };
  }

  it('라운드트립이 사용자 입력과 LLM 인터뷰 캐시를 모두 보존한다', () => {
    const draft = fullDraft();
    const restored = parseOnboardingDraft(serializeOnboardingDraft(draft));
    expect(restored).toEqual(draft);
  });

  it('무효하거나 손상되거나 스키마가 다른 입력은 null 을 돌려준다', () => {
    expect(parseOnboardingDraft(null)).toBeNull();
    expect(parseOnboardingDraft('{ broken json')).toBeNull();
    expect(parseOnboardingDraft(JSON.stringify({ schema: 'storyx/onboarding/v0' }))).toBeNull();
  });

  it('부분 저장본은 누락된 필드를 기본값으로 백필한다', () => {
    const partial = JSON.stringify({
      schema: 'storyx/onboarding/v1',
      freewriteText: '한 줄만 썼다',
      homeFlowStep: 'freewrite'
    });
    const restored = parseOnboardingDraft(partial);
    expect(restored?.freewriteText).toBe('한 줄만 썼다');
    expect(restored?.homeFlowStep).toBe('freewrite');
    expect(restored?.intakeAnswers).toEqual({});
    expect(restored?.contractSpine).toEqual({ desire: '', advance: '', obstacle: '', resolution: '' });
    expect(restored?.contractLengthClass).toBe('long');
    expect(restored?.contractPlannedEpisodes).toBe(30);
    expect(restored?.llmIntakeQuestions).toBeNull();
    expect(restored?.interviewPersonaLineup).toEqual([]);
    expect(restored?.medium).toBe('novel');
  });

  it('갓 시작한 빈 온보딩은 진행 중으로 보지 않는다', () => {
    const empty = parseOnboardingDraft(JSON.stringify({ schema: 'storyx/onboarding/v1' }));
    expect(empty).not.toBeNull();
    expect(hasMeaningfulOnboardingInput(empty as OnboardingDraft)).toBe(false);
  });

  it('단계 진행·자유서술·인터뷰 답·헌장 입력은 진행 중으로 본다', () => {
    const base = parseOnboardingDraft(JSON.stringify({ schema: 'storyx/onboarding/v1' })) as OnboardingDraft;
    expect(hasMeaningfulOnboardingInput({ ...base, homeFlowStep: 'freewrite' })).toBe(true);
    expect(hasMeaningfulOnboardingInput({ ...base, freewriteText: '한 줄' })).toBe(true);
    expect(hasMeaningfulOnboardingInput({ ...base, intakeAnswers: { q1: 'a' } })).toBe(true);
    expect(hasMeaningfulOnboardingInput({ ...base, contractEnding: '자백으로 끝난다' })).toBe(true);
  });
});
