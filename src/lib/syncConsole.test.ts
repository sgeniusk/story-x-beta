import { describe, expect, it } from 'vitest';
import {
  countPendingSync,
  reconcileWorkingIntoCommitted,
  applyReconcile,
  buildApprovedCondenseProjectRevision,
  planApprovedCondenseCommit,
  planResolvedApprovedCondenseCommit,
  applyApprovedCondenseDecisions
} from './syncConsole';
import { createEmptyProject } from './storyEngine';
import type { DeviationConflict } from './playRuntimeValidator';
import type { Chapter, CanonFact, SeriesProject } from './storyEngine';

// 융합 셸 싱크 콘솔 순수 로직 — working(PLAY) vs committed(본편) diff·append 머지.

function chapter(id: string, summary = ''): Chapter {
  return { id, number: 1, title: id, summary } as Chapter;
}
function canon(id: string, statement = id): CanonFact {
  return { id, episode: 1, owner: 'plot', statement } as CanonFact;
}
function approvedChapter(
  episode: number,
  prose = '',
  newCanonFacts: CanonFact[] = []
): Chapter {
  return {
    id: `episode-${episode}`,
    episode,
    title: `${episode}화`,
    hook: '',
    outline: [],
    beats: [],
    prose,
    memoryAnchors: [],
    newCanonFacts
  };
}
function withChapters(base: SeriesProject, chapters: Chapter[], canonFacts: CanonFact[] = []): SeriesProject {
  return { ...base, chapters, canonFacts };
}

describe('countPendingSync', () => {
  const committed = withChapters(createEmptyProject({ title: '본편' }), [chapter('ch1')], [canon('c1')]);

  it('working 이 null 이면 미반영 0', () => {
    expect(countPendingSync(null, committed)).toEqual({ chapters: 0, canon: 0, total: 0 });
  });

  it('working 이 committed 와 같으면 0', () => {
    const working = withChapters(createEmptyProject(), [chapter('ch1')], [canon('c1')]);
    expect(countPendingSync(working, committed)).toEqual({ chapters: 0, canon: 0, total: 0 });
  });

  it('working 에 새 회차 2개 있으면 chapters:2', () => {
    const working = withChapters(createEmptyProject(), [chapter('ch1'), chapter('ch2'), chapter('ch3')], [canon('c1')]);
    expect(countPendingSync(working, committed)).toEqual({ chapters: 2, canon: 0, total: 2 });
  });

  it('working 에 새 캐논 1개 있으면 canon:1', () => {
    const working = withChapters(createEmptyProject(), [chapter('ch1')], [canon('c1'), canon('c2')]);
    expect(countPendingSync(working, committed)).toEqual({ chapters: 0, canon: 1, total: 1 });
  });
});

describe('reconcileWorkingIntoCommitted', () => {
  it('committed 에 없는 회차만 append(기존 순서·내용 보존)', () => {
    const committed = withChapters(createEmptyProject({ title: '본편' }), [chapter('ch1', '본편 원본')], []);
    const working = withChapters(createEmptyProject(), [chapter('ch1', '옛 버전'), chapter('ch2', '새 회차')], []);
    const merged = reconcileWorkingIntoCommitted(working, committed);
    expect(merged.chapters.map((c) => c.id)).toEqual(['ch1', 'ch2']);
    // WRITE 본편 편집(committed ch1)이 working 옛 버전으로 롤백되지 않는다.
    expect(merged.chapters[0].summary).toBe('본편 원본');
    expect(merged.chapters[1].summary).toBe('새 회차');
  });

  it('committed 에 없는 캐논만 append', () => {
    const committed = withChapters(createEmptyProject(), [], [canon('c1')]);
    const working = withChapters(createEmptyProject(), [], [canon('c1'), canon('c2')]);
    const merged = reconcileWorkingIntoCommitted(working, committed);
    expect(merged.canonFacts.map((f) => f.id)).toEqual(['c1', 'c2']);
  });

  it('중복 id 를 두 번 넣지 않는다', () => {
    const committed = withChapters(createEmptyProject(), [chapter('ch1')], []);
    const working = withChapters(createEmptyProject(), [chapter('ch1')], []);
    const merged = reconcileWorkingIntoCommitted(working, committed);
    expect(merged.chapters).toHaveLength(1);
  });

  it('committed 를 변형하지 않는다(불변)', () => {
    const committed = withChapters(createEmptyProject(), [chapter('ch1')], []);
    const working = withChapters(createEmptyProject(), [chapter('ch1'), chapter('ch2')], []);
    reconcileWorkingIntoCommitted(working, committed);
    expect(committed.chapters).toHaveLength(1);
  });
});

describe('planApprovedCondenseCommit — 승인된 응결의 본편 합류 계획', () => {
  it('정확히 승인한 회차만 최신 committed 위에 커밋하고 currentEpisode·인물 승격을 보존한다', () => {
    const existing = approvedChapter(1, 'WRITE에서 고친 최종 문장');
    const promoted = {
      ...canon('canon-002-llm-01', '레나 위클리프는 하급 회계 보좌다'),
      episode: 2,
      owner: 'character' as const
    };
    const committed = {
      ...withChapters(createEmptyProject({ title: '본편' }), [existing]),
      currentEpisode: 1
    };
    const candidate = { chapter: approvedChapter(2, '승인된 응결 회차', [promoted]), retcons: [] };

    const plan = planApprovedCondenseCommit(candidate, committed);

    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') throw new Error('ready 계획이어야 한다');
    expect(plan.committedProject.chapters.map((item) => item.id)).toEqual(['episode-1', 'episode-2']);
    expect(plan.committedProject.chapters[0].prose).toBe('WRITE에서 고친 최종 문장');
    expect(plan.committedProject.currentEpisode).toBe(2);
    expect(plan.committedProject.canonFacts.map((item) => item.id)).toContain('canon-002-llm-01');
    expect(plan.committedProject.characters.map((item) => item.name)).toContain('레나 위클리프');
  });

  it('최신 WRITE에 승인 회차와 같은 id가 먼저 생겼으면 결과를 버리지 않고 blocked로 멈춘다', () => {
    const committed = {
      ...withChapters(createEmptyProject(), [approvedChapter(1, '다른 탭의 원고')]),
      currentEpisode: 1
    };
    const plan = planApprovedCondenseCommit(
      { chapter: approvedChapter(1, '승인하려던 응결 원고'), retcons: [] },
      committed
    );

    expect(plan).toMatchObject({ status: 'blocked', reason: 'chapter-id-collision', chapterId: 'episode-1' });
    expect(plan).not.toHaveProperty('committedProject');
  });

  it('같은 회차가 byte-identical하게 이미 저장됐으면 receipt 정리 재시도로 멱등 완료한다', () => {
    const exact = approvedChapter(1, '이미 저장된 승인 원고');
    const committed = { ...withChapters(createEmptyProject(), [exact]), currentEpisode: 1 };
    const plan = planApprovedCondenseCommit({ chapter: exact, retcons: [] }, committed);

    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') throw new Error('ready 계획이어야 한다');
    expect(plan.committedProject.chapters).toHaveLength(1);
    expect(plan.committedProject.chapters[0]).toEqual(exact);
  });

  it('승인 전에 남아 있던 PLAY pending delta가 있으면 먼저 최신화하도록 block한다', () => {
    const committed = createEmptyProject({ title: '본편' });
    const workingBeforeApproval = {
      ...committed,
      chapters: [approvedChapter(1, '이전 미합류 회차')],
      currentEpisode: 1
    };
    const plan = planApprovedCondenseCommit({
      chapter: approvedChapter(2, '새 승인 회차'),
      retcons: [],
      workingBeforeApproval
    }, committed);

    expect(plan.status).toBe('blocked');
    if (plan.status !== 'blocked') throw new Error('blocked 계획이어야 한다');
    expect(plan).toMatchObject({ reason: 'pending-sync', pending: { chapters: 1, total: 1 } });
  });

  it('최신 본편의 다음 회차 번호가 달라졌으면 episode 위치 변경으로 block한다', () => {
    const committed = {
      ...withChapters(createEmptyProject(), [approvedChapter(1, '최신 1화')]),
      currentEpisode: 1
    };
    const plan = planApprovedCondenseCommit({ chapter: approvedChapter(3), retcons: [] }, committed);
    expect(plan).toMatchObject({ status: 'blocked', reason: 'episode-position-changed' });
  });

  it('회차는 없지만 newCanon id가 최신 본편에 이미 있으면 비정상 부분 상태를 자동 수선하지 않는다', () => {
    const collided = { ...canon('canon-001-llm-01', '기존 캐논'), episode: 1 };
    const committed = withChapters(createEmptyProject(), [], [collided]);
    const candidateFact = { ...canon('canon-001-llm-01', '새 캐논'), episode: 1 };
    const plan = planApprovedCondenseCommit({
      chapter: approvedChapter(1, '승인 원고', [candidateFact]),
      retcons: []
    }, committed);
    expect(plan).toMatchObject({ status: 'blocked', reason: 'canon-id-collision', factId: 'canon-001-llm-01' });
  });

  it('사용자가 명시 승인한 retcon은 최신 옛 문장이 그대로일 때만 적용한다', () => {
    const anchor = { ...canon('a1', '서준은 살아 있다'), importance: 0.9, participants: ['서준'] };
    const committed = withChapters(createEmptyProject(), [], [anchor]);
    const candidate = {
      chapter: approvedChapter(1, '서준이 남긴 편지가 발견됐다.'),
      retcons: [{ factId: 'a1', previousStatement: '서준은 살아 있다', statement: '서준은 3년 전에 죽었다' }]
    };

    const plan = planApprovedCondenseCommit(candidate, committed);

    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') throw new Error('ready 계획이어야 한다');
    expect(plan.committedProject.canonFacts.find((item) => item.id === 'a1')?.statement)
      .toBe('서준은 3년 전에 죽었다');
  });

  it('retcon 검토 뒤 최신 WRITE 캐논이 바뀌었으면 stale-retcon으로 멈춘다', () => {
    const committed = withChapters(createEmptyProject(), [], [canon('a1', '서준은 해외에 있다')]);
    const plan = planApprovedCondenseCommit({
      chapter: approvedChapter(1),
      retcons: [{ factId: 'a1', previousStatement: '서준은 살아 있다', statement: '서준은 죽었다' }]
    }, committed);

    expect(plan).toMatchObject({ status: 'blocked', reason: 'stale-retcon', factId: 'a1' });
  });

  it('같은 캐논을 서로 다른 문장으로 retcon하려는 승인 후보는 조용히 마지막 값을 고르지 않는다', () => {
    const committed = withChapters(createEmptyProject(), [], [canon('a1', '서준은 살아 있다')]);
    const plan = planApprovedCondenseCommit({
      chapter: approvedChapter(1),
      retcons: [
        { factId: 'a1', previousStatement: '서준은 살아 있다', statement: '서준은 죽었다' },
        { factId: 'a1', previousStatement: '서준은 살아 있다', statement: '서준은 실종됐다' }
      ]
    }, committed);

    expect(plan).toMatchObject({ status: 'blocked', reason: 'ambiguous-retcon', factId: 'a1' });
  });

  it('승인 회차가 committed 앵커와 직접 충돌하면 ready 없이 conflicts를 반환한다', () => {
    const anchor = {
      ...canon('a1', '서준은 살아 있다'),
      importance: 0.9,
      participants: ['서준']
    };
    const committed = withChapters(createEmptyProject(), [], [anchor]);
    const candidate = { chapter: approvedChapter(1, '서준은 이미 죽었어.'), retcons: [] };

    const plan = planApprovedCondenseCommit(candidate, committed);

    expect(plan.status).toBe('conflicts');
    if (plan.status !== 'conflicts') throw new Error('conflicts 계획이어야 한다');
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]).toMatchObject({
      factId: 'a1',
      band: 'anchor',
      oldCanon: '서준은 살아 있다',
      newClaim: '서준은 이미 죽었어.'
    });
    expect(plan).not.toHaveProperty('committedProject');
  });

  it('충돌 결정 후에도 exact chapter commit으로 currentEpisode를 올리고 충돌 캐논 중복은 넣지 않는다', () => {
    const anchor = { ...canon('a1', '서준은 살아 있다'), importance: 0.9, participants: ['서준'] };
    const conflictingFact = { ...canon('w1', '서준은 이미 죽었어'), episode: 1 };
    const committed = withChapters(createEmptyProject(), [], [anchor]);
    const candidate = {
      chapter: approvedChapter(1, '서준은 이미 죽었어.', [conflictingFact]),
      retcons: []
    };
    const plan = planApprovedCondenseCommit(candidate, committed);
    expect(plan.status).toBe('conflicts');
    if (plan.status !== 'conflicts') throw new Error('conflicts 계획이어야 한다');

    const resolved = applyApprovedCondenseDecisions(
      candidate,
      committed,
      plan.conflicts,
      Object.fromEntries(plan.conflicts.map((conflict) => [conflict.id, 'retcon' as const]))
    );

    expect(resolved.currentEpisode).toBe(1);
    expect(resolved.chapters.map((item) => item.id)).toEqual(['episode-1']);
    expect(resolved.canonFacts.find((item) => item.id === 'a1')?.statement).toContain('서준은 이미 죽었어');
    expect(resolved.canonFacts.some((item) => item.id === 'w1')).toBe(false);
  });

  it('충돌 결정 checkpoint는 keep 선택의 충돌 본문을 다시 묻지 않고 정확한 resolved chapter로 재개한다', () => {
    const anchor = { ...canon('a1', '서준은 살아 있다'), importance: 0.9, participants: ['서준'] };
    const committed = withChapters(createEmptyProject(), [], [anchor]);
    const resolvedChapter = approvedChapter(1, '서준은 이미 죽었어.', []);

    const plan = planResolvedApprovedCondenseCommit({
      chapter: resolvedChapter,
      retcons: [],
      baseProjectRevision: buildApprovedCondenseProjectRevision(committed),
      committedProjectRevision: 'post-commit'
    }, committed);

    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') throw new Error('ready 계획이어야 한다');
    expect(plan.committedProject.chapters).toEqual([resolvedChapter]);
    expect(plan.committedProject.canonFacts.find((fact) => fact.id === 'a1')?.statement)
      .toBe('서준은 살아 있다');
  });

  it('충돌 결정 checkpoint의 exact resolved chapter가 이미 저장됐으면 receipt 정리만 멱등 재시도한다', () => {
    const resolvedChapter = approvedChapter(1, '서준은 이미 죽었어.', []);
    const committed = {
      ...withChapters(createEmptyProject(), [resolvedChapter], [canon('a1', '서준은 죽었다')]),
      currentEpisode: 1
    };

    const plan = planResolvedApprovedCondenseCommit({
      chapter: resolvedChapter,
      retcons: [{ factId: 'a1', previousStatement: '서준은 살아 있다', statement: '서준은 죽었다' }],
      baseProjectRevision: 'pre-commit',
      committedProjectRevision: buildApprovedCondenseProjectRevision(committed)
    }, committed);

    expect(plan.status).toBe('ready');
    if (plan.status !== 'ready') throw new Error('ready 계획이어야 한다');
    expect(plan.committedProject.chapters).toHaveLength(1);
    expect(plan.committedProject.canonFacts.find((fact) => fact.id === 'a1')?.statement)
      .toBe('서준은 죽었다');
  });

  it('checkpoint 이후 최신 본편에 새 캐논이 생기면 이미 승인한 충돌을 우회하지 않고 stale로 막는다', () => {
    const base = withChapters(createEmptyProject(), [], [canon('a1', '서준은 살아 있다')]);
    const checkpoint = {
      chapter: approvedChapter(1, '서준은 이미 죽었어.'),
      retcons: [],
      baseProjectRevision: buildApprovedCondenseProjectRevision(base),
      committedProjectRevision: 'post-commit'
    };
    const changed = {
      ...base,
      canonFacts: [...base.canonFacts, canon('a2', '서준에게 쌍둥이 형제가 있다')]
    };

    expect(planResolvedApprovedCondenseCommit(checkpoint, changed)).toMatchObject({
      status: 'blocked',
      reason: 'checkpoint-stale'
    });
  });

  it('checkpoint 이후 PLAY working에만 새 회차·캐논이 생기면 재개 저장으로 덮지 않고 stale로 막는다', () => {
    const base = withChapters(createEmptyProject(), [], [canon('a1', '서준은 살아 있다')]);
    const checkpoint = {
      chapter: approvedChapter(1, '서준은 옥상으로 향했다.'),
      retcons: [],
      baseProjectRevision: buildApprovedCondenseProjectRevision(base),
      committedProjectRevision: 'post-commit',
      workingBeforeApproval: {
        ...base,
        canonFacts: [...base.canonFacts, canon('play-new', '민아가 PLAY에서 새 증거를 찾았다')]
      }
    };

    expect(planResolvedApprovedCondenseCommit(checkpoint, base)).toMatchObject({
      status: 'blocked',
      reason: 'checkpoint-stale'
    });
  });
});

describe('applyReconcile — 충돌 결정 반영(retcon/keep) + 비충돌 append', () => {
  const committed = withChapters(
    createEmptyProject({ title: '본편' }),
    [chapter('ch1', '본편')],
    [canon('a1', '서준은 살아 있다')]
  );
  // working — 본편 캐논 + 충돌 새 캐논(서준 사망) + 비충돌 새 캐논 + 새 회차
  const working = withChapters(
    createEmptyProject(),
    [chapter('ch1', '본편'), chapter('ch2', 'PLAY 회차')],
    [canon('a1', '서준은 살아 있다'), canon('w1', '서준은 이미 죽었어'), canon('w2', '민아가 도착했다')]
  );
  const conflicts: DeviationConflict[] = [
    { id: 'reconcile-c0', factId: 'a1', band: 'anchor', newClaim: '서준은 이미 죽었어', oldCanon: '서준은 살아 있다' }
  ];

  it('retcon 결정 → committed 옛 캐논 교체 + 충돌 새 캐논 append 안 함', () => {
    const merged = applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'retcon' });
    const a1 = merged.canonFacts.find((f) => f.id === 'a1');
    expect(a1?.statement).toBe('서준은 이미 죽었어'); // 옛 캐논 교체
    expect(merged.canonFacts.some((f) => f.statement === '서준은 이미 죽었어' && f.id === 'w1')).toBe(false); // 충돌 새 캐논 중복 append 안 함
  });

  it('keep 결정 → committed 옛 캐논 유지 + working 충돌 캐논 버림', () => {
    const merged = applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'keep' });
    expect(merged.canonFacts.find((f) => f.id === 'a1')?.statement).toBe('서준은 살아 있다'); // 유지
    expect(merged.canonFacts.some((f) => f.id === 'w1')).toBe(false); // 충돌 새 캐논 버림
  });

  it('비충돌 회차·캐논은 결정 무관하게 append', () => {
    const merged = applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'keep' });
    expect(merged.chapters.map((c) => c.id)).toEqual(['ch1', 'ch2']); // 새 회차 합류
    expect(merged.canonFacts.some((f) => f.id === 'w2')).toBe(true); // 비충돌 캐논 합류
  });

  it('committed 를 변형하지 않는다(불변)', () => {
    applyReconcile(working, committed, conflicts, { 'reconcile-c0': 'retcon' });
    expect(committed.canonFacts.find((f) => f.id === 'a1')?.statement).toBe('서준은 살아 있다');
    expect(committed.chapters).toHaveLength(1);
  });
})
