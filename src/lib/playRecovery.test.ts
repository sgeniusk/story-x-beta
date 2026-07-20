import { describe, expect, it } from 'vitest';
import { appendMessage, buildCondenseSourceFingerprint, createDiveSession } from './diveSession';
import { chapterFromDraftPayload, createSeedProject, episodeLengthContractFor } from './storyEngine';
import {
  buildPlayRecoveryFilename,
  buildPlayRecoverySnapshot,
  createPlayRecoveryWorkDraft,
  formatPlayRecoveryText,
  inspectPlayRecoveryCommitIntent,
  planPlayRecoveryCommit,
  preparePlayRecoveryCommitIntent,
  repairLegacyPlayRecoveryChapter,
  shouldResumePlayRecoveryWorkDraft
} from './playRecovery';

describe('PLAY recovery', () => {
  it('응결 제외 규칙과 무관하게 당시 PLAY 전체 원문을 스냅샷으로 보존한다', () => {
    const project = { ...createSeedProject(), id: 'project-recovery', title: '달의 문서고' };
    let session = createDiveSession(project.characters[0].id, project.id);
    session = appendMessage(session, 'user', '문을 열어도 될까?');
    session = appendMessage(session, 'character', '아직은 안 돼.', {
      conflicts: [{ factId: 'canon-1', band: 'anchor', factStatement: '문은 닫혀 있다', snippet: '안 돼' }],
      surpriseCandidates: [],
      blocksCanonization: true
    });
    session = appendMessage(session, 'user', '그래도 열겠어.');
    session = { ...session, scene: '비 내리는 문서고 앞' };

    const snapshot = buildPlayRecoverySnapshot(session, project, '2026-07-16T12:34:56.000Z');

    expect(snapshot).toEqual(expect.objectContaining({
      schema: 'storyx/play-recovery/v1',
      projectId: project.id,
      projectTitle: '달의 문서고',
      episode: 1,
      scene: '비 내리는 문서고 앞',
      condensedThroughTurn: 3,
      sourceSpan: {
        afterTurn: 0,
        throughTurn: 3,
        messageIds: ['msg-1', 'msg-2', 'msg-3'],
        continuityMessageIds: ['msg-2', 'msg-3']
      },
      sourceFingerprint: buildCondenseSourceFingerprint(session.chatBuffer),
      capturedAt: '2026-07-16T12:34:56.000Z'
    }));
    expect(snapshot.transcript).toContain('나: 문을 열어도 될까?');
    expect(snapshot.transcript).toContain('상대: 아직은 안 돼.');
    expect(snapshot.transcript).toContain('나: 그래도 열겠어.');
  });

  it('새 recovery snapshot은 PLAY 세션의 회차 분량을 고정하고 legacy 세션은 5천자로 시작한다', () => {
    const project = { ...createSeedProject(), id: 'project-recovery', title: '달의 문서고' };
    const legacySession = createDiveSession(project.characters[0].id, project.id);

    const standard = buildPlayRecoverySnapshot(
      legacySession,
      project,
      '2026-07-20T00:00:00.000Z'
    );
    const compact = buildPlayRecoverySnapshot(
      { ...legacySession, episodeLengthPreset: 'compact' },
      project,
      '2026-07-20T00:01:00.000Z'
    );

    expect(standard.episodeLength).toEqual(episodeLengthContractFor('standard'));
    expect(compact.episodeLength).toEqual(episodeLengthContractFor('compact'));
    expect(createPlayRecoveryWorkDraft(compact, 'job-compact').source.episodeLength)
      .toEqual(episodeLengthContractFor('compact'));
  });

  it('이미 소비된 연결 문맥은 다음 응결 recovery 원문에 중복 포함하지 않는다', () => {
    const project = { ...createSeedProject(), id: 'project-recovery', title: '달의 문서고' };
    let session = createDiveSession(project.characters[0].id, project.id);
    session = appendMessage(session, 'user', '이전 회차 마지막 질문');
    session = appendMessage(session, 'character', '이전 회차 마지막 답');
    session = appendMessage(session, 'user', '지난 회차 연결 질문');
    session = appendMessage(session, 'character', '지난 회차 연결 답');
    session = appendMessage(session, 'user', '새 회차의 첫 질문');
    session = appendMessage(session, 'character', '새 회차의 첫 답');
    session = {
      ...session,
      // 승인 뒤 PLAY에는 소비된 source의 끝 2개만 연결 문맥으로 남아 있다.
      chatBuffer: session.chatBuffer.slice(2),
      lastCondensedTurn: 4
    };

    const snapshot = buildPlayRecoverySnapshot(session, project, '2026-07-18T01:00:00.000Z');

    expect(snapshot).toEqual(expect.objectContaining({
      condensedThroughTurn: 6,
      sourceSpan: {
        afterTurn: 4,
        throughTurn: 6,
        messageIds: ['msg-5', 'msg-6'],
        continuityMessageIds: ['msg-5', 'msg-6']
      },
      sourceFingerprint: buildCondenseSourceFingerprint(session.chatBuffer.slice(-2))
    }));
    expect(snapshot.transcript).toBe('나: 새 회차의 첫 질문\n상대: 새 회차의 첫 답');
    expect(snapshot.transcript).not.toContain('지난 회차 연결');
  });

  it('TXT에 식별 정보와 원문을 담고 파일명의 경로 문자를 제거한다', () => {
    const project = { ...createSeedProject(), id: 'p1', title: '달/문서고: 최종?' };
    const session = {
      ...createDiveSession(project.characters[0].id, project.id),
      scene: '서고',
      chatBuffer: [{ id: 'm1', role: 'user' as const, text: '복구 표식', turn: 1 }]
    };
    const snapshot = buildPlayRecoverySnapshot(session, project, '2026-07-16T12:34:56.000Z');

    const text = formatPlayRecoveryText(snapshot);
    expect(text).toContain('Story X PLAY 기록 복구본');
    expect(text).toContain('작품: 달/문서고: 최종?');
    expect(text).toContain('응결 시도: 1화');
    expect(text).toContain('장면: 서고');
    expect(text).toContain('캐논에 자동 반영되지 않습니다');
    expect(text).toContain('나: 복구 표식');

    const filename = buildPlayRecoveryFilename(snapshot);
    expect(filename).toMatch(/^storyx-/);
    expect(filename).toMatch(/-1화-play-record\.txt$/);
    expect(filename).not.toMatch(/[\\/:?*"<>|]/);
  });

  it('복구 작업본은 빈 본문과 분리된 PLAY source로 시작하고 프로젝트를 바꾸지 않는다', () => {
    const project = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const session = {
      ...createDiveSession(project.characters[0].id, project.id),
      scene: '서고',
      chatBuffer: [{ id: 'm1', role: 'user' as const, text: '원문 한 줄', turn: 1 }]
    };
    const snapshot = buildPlayRecoverySnapshot(session, project, '2026-07-16T12:34:56.000Z');
    const before = JSON.stringify(project);

    const draft = createPlayRecoveryWorkDraft(snapshot, 'job-1', '2026-07-16T13:00:00.000Z');

    expect(draft).toEqual(expect.objectContaining({
      schema: 'storyx/play-recovery-work-draft/v1',
      projectId: project.id,
      generationId: 'job-1',
      episodeHint: 1,
      title: '',
      body: '',
      createdAt: '2026-07-16T13:00:00.000Z',
      updatedAt: '2026-07-16T13:00:00.000Z'
    }));
    expect(draft.source).toEqual(snapshot);
    expect(draft.source.transcript).toContain('나: 원문 한 줄');
    expect(JSON.stringify(project)).toBe(before);
    expect(project.chapters).toHaveLength(0);
  });

  it('작성 내용이나 저장 저널이 있는 복구 작업본만 프로젝트 기본 재개를 가로챈다', () => {
    const project = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const snapshot = buildPlayRecoverySnapshot(
      createDiveSession(project.characters[0].id, project.id),
      project,
      '2026-07-16T12:34:56.000Z'
    );
    const empty = createPlayRecoveryWorkDraft(snapshot, 'job-1', '2026-07-16T13:00:00.000Z');

    expect(shouldResumePlayRecoveryWorkDraft(null)).toBe(false);
    expect(shouldResumePlayRecoveryWorkDraft(empty)).toBe(false);
    expect(shouldResumePlayRecoveryWorkDraft({ ...empty, title: '  ', body: '\n' })).toBe(false);
    expect(shouldResumePlayRecoveryWorkDraft({ ...empty, body: '직접 쓴 문장' })).toBe(true);
    expect(shouldResumePlayRecoveryWorkDraft({
      ...empty,
      commitIntent: { chapterId: 'episode-1', chapterTitle: '1화', requestedAt: '2026-07-16T13:01:00.000Z' }
    })).toBe(true);
    expect(shouldResumePlayRecoveryWorkDraft({
      ...empty,
      legacyRepair: { chapterId: 'episode-1', startedAt: '2026-07-16T13:01:00.000Z' }
    })).toBe(true);
  });

  it('명시 저장 때만 작성 본문을 한 회차로 만들고 캐논·인물·성장을 보존한다', () => {
    const committed = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const session = {
      ...createDiveSession(committed.characters[0].id, committed.id),
      episodeLengthPreset: 'compact' as const,
      chatBuffer: [{ id: 'm1', role: 'user' as const, text: '복구할 기록', turn: 1 }]
    };
    const snapshot = buildPlayRecoverySnapshot(session, committed, '2026-07-16T12:34:56.000Z');
    const emptyDraft = createPlayRecoveryWorkDraft(snapshot, 'job-1', '2026-07-16T13:00:00.000Z');
    expect(planPlayRecoveryCommit(committed, committed, emptyDraft)).toEqual({ status: 'empty-body' });
    expect(planPlayRecoveryCommit({ ...committed, id: 'other' }, undefined, { ...emptyDraft, body: '문장' }))
      .toEqual({ status: 'project-mismatch' });

    const pendingChapter = chapterFromDraftPayload(committed, {
      title: 'PLAY 미반영 회차', hook: '', outline: [], beats: [], prose: '미반영 본문', newCanonFacts: []
    }, { genre: committed.genre, intent: '', pressure: '' }).updatedProject;
    const authoredDraft = { ...emptyDraft, title: '문 뒤의 목소리', body: '문 너머에서 내 이름을 부르는 소리가 났다.' };
    const blocked = planPlayRecoveryCommit(committed, pendingChapter, authoredDraft);
    expect(blocked).toEqual({ status: 'pending-sync', pending: { chapters: 1, canon: 0, total: 1 } });

    const canonBefore = committed.canonFacts;
    const charactersBefore = committed.characters;
    const growthBefore = committed.growthLedger;
    const ready = planPlayRecoveryCommit(committed, { ...committed }, authoredDraft);
    expect(ready.status).toBe('ready');
    if (ready.status !== 'ready') throw new Error('ready recovery plan expected');
    expect(ready.committedProject.chapters).toHaveLength(committed.chapters.length + 1);
    expect(ready.chapter.title).toBe('문 뒤의 목소리');
    expect(ready.chapter.prose).toBe(authoredDraft.body);
    expect(ready.chapter.episodeLength).toEqual(episodeLengthContractFor('compact'));
    expect(ready.chapter.prose).not.toContain('Story X PLAY 기록 복구본');
    expect(ready.chapter.prose).not.toContain('보존 시각');
    expect(ready.chapter.newCanonFacts).toEqual([]);
    expect(ready.committedProject.canonFacts).toEqual(canonBefore);
    expect(ready.committedProject.characters).toEqual(charactersBefore);
    expect(ready.committedProject.growthLedger).toEqual(growthBefore);
    expect(ready.workingProject).toEqual(ready.committedProject);
    expect(ready.chapter.id).toBe(ready.workingProject?.chapters.at(-1)?.id);
  });

  it('이전 구현의 정확한 최신 시스템 회차만 제거하고 사용자 수정본은 건드리지 않는다', () => {
    const base = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const session = {
      ...createDiveSession(base.characters[0].id, base.id),
      chatBuffer: [{ id: 'm1', role: 'user' as const, text: '복구할 기록', turn: 1 }]
    };
    const snapshot = buildPlayRecoverySnapshot(session, base, '2026-07-16T12:34:56.000Z');
    const legacy = chapterFromDraftPayload(base, {
      title: 'PLAY 기록 복구본 · 당시 1화',
      hook: '응결 실패 뒤 보존한 PLAY 원문',
      outline: [],
      beats: [],
      prose: formatPlayRecoveryText(snapshot),
      newCanonFacts: []
    }, { genre: base.genre, intent: '', pressure: '' });

    const repaired = repairLegacyPlayRecoveryChapter(legacy.updatedProject, snapshot, legacy.chapter.id);
    expect(repaired?.removedChapter.id).toBe(legacy.chapter.id);
    expect(repaired?.updatedProject.chapters).toEqual(base.chapters);
    expect(repaired?.updatedProject.currentEpisode).toBe(0);
    expect(legacy.updatedProject.chapters).toHaveLength(1);

    const edited = {
      ...legacy.updatedProject,
      chapters: legacy.updatedProject.chapters.map((chapter) => ({ ...chapter, prose: `${chapter.prose}\n사용자 수정` }))
    };
    expect(repairLegacyPlayRecoveryChapter(edited, snapshot, legacy.chapter.id)).toBeNull();
    expect(repairLegacyPlayRecoveryChapter({
      ...legacy.updatedProject,
      chapters: legacy.updatedProject.chapters.map((chapter) => ({ ...chapter, locked: true }))
    }, snapshot, legacy.chapter.id)).toBeNull();

    const later = chapterFromDraftPayload(legacy.updatedProject, {
      title: '2화', hook: '', outline: [], beats: [], prose: '사용자가 이어 쓴 2화', newCanonFacts: []
    }, { genre: base.genre, intent: '', pressure: '' }).updatedProject;
    expect(repairLegacyPlayRecoveryChapter(later, snapshot, legacy.chapter.id)).toBeNull();
  });

  it('회차 저장 의도를 작업본에 먼저 기록하고 부분 성공 재시도에서 같은 회차를 식별한다', () => {
    const project = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const snapshot = buildPlayRecoverySnapshot(
      createDiveSession(project.characters[0].id, project.id),
      project,
      '2026-07-16T12:34:56.000Z'
    );
    const draft = {
      ...createPlayRecoveryWorkDraft(snapshot, 'job-1', '2026-07-16T13:00:00.000Z'),
      title: '문 뒤의 목소리',
      body: '문 너머에서 내 이름을 부르는 소리가 났다.'
    };
    const plan = planPlayRecoveryCommit(project, project, draft);
    if (plan.status !== 'ready') throw new Error('ready recovery plan expected');

    const prepared = preparePlayRecoveryCommitIntent(
      draft,
      plan.chapter,
      '2026-07-16T13:01:00.000Z'
    );
    expect(prepared.commitIntent).toEqual({
      chapterId: plan.chapter.id,
      chapterTitle: plan.chapter.title,
      requestedAt: '2026-07-16T13:01:00.000Z'
    });
    expect(inspectPlayRecoveryCommitIntent(project, prepared)).toEqual({ status: 'prepared' });
    expect(inspectPlayRecoveryCommitIntent(plan.committedProject, prepared)).toEqual({
      status: 'committed',
      chapter: plan.chapter
    });

    const missingLength = {
      ...plan.committedProject,
      chapters: plan.committedProject.chapters.map(({ episodeLength: _episodeLength, ...chapter }) => chapter)
    };
    expect(inspectPlayRecoveryCommitIntent(missingLength, prepared)).toEqual({ status: 'conflict' });

    const mismatchedLength = {
      ...plan.committedProject,
      chapters: plan.committedProject.chapters.map((chapter) => ({
        ...chapter,
        episodeLength: episodeLengthContractFor('extended')
      }))
    };
    expect(inspectPlayRecoveryCommitIntent(mismatchedLength, prepared)).toEqual({ status: 'conflict' });

    const collided = {
      ...plan.committedProject,
      chapters: plan.committedProject.chapters.map((chapter) => chapter.id === plan.chapter.id
        ? { ...chapter, prose: '다른 탭이 저장한 본문' }
        : chapter)
    };
    expect(inspectPlayRecoveryCommitIntent(collided, prepared)).toEqual({ status: 'conflict' });
  });
});
