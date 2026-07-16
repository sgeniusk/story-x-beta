import { describe, expect, it } from 'vitest';
import { appendMessage, createDiveSession } from './diveSession';
import { createSeedProject } from './storyEngine';
import {
  buildPlayRecoveryFilename,
  buildPlayRecoverySnapshot,
  formatPlayRecoveryText,
  planPlayRecoveryWrite,
  recoverPlaySnapshotToDraft
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
      capturedAt: '2026-07-16T12:34:56.000Z'
    }));
    expect(snapshot.transcript).toContain('나: 문을 열어도 될까?');
    expect(snapshot.transcript).toContain('상대: 아직은 안 돼.');
    expect(snapshot.transcript).toContain('나: 그래도 열겠어.');
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

  it('원래 작품에만 편집 가능한 회차를 추가하고 캐논·인물·성장 상태를 보존한다', () => {
    const project = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const session = {
      ...createDiveSession(project.characters[0].id, project.id),
      scene: '서고',
      chatBuffer: [{ id: 'm1', role: 'user' as const, text: '원문 한 줄', turn: 1 }]
    };
    const snapshot = buildPlayRecoverySnapshot(session, project, '2026-07-16T12:34:56.000Z');
    const canonBefore = project.canonFacts;
    const charactersBefore = project.characters;
    const growthBefore = project.growthLedger;

    expect(recoverPlaySnapshotToDraft({ ...project, id: 'other' }, snapshot)).toBeNull();

    const recovered = recoverPlaySnapshotToDraft(project, snapshot);
    expect(recovered).not.toBeNull();
    expect(recovered?.created).toBe(true);
    expect(recovered?.chapter.title).toBe('PLAY 기록 복구본 · 당시 1화');
    expect(recovered?.chapter.prose).toContain('나: 원문 한 줄');
    expect(recovered?.chapter.newCanonFacts).toEqual([]);
    expect(recovered?.chapter.locked).not.toBe(true);
    expect(recovered?.updatedProject.canonFacts).toEqual(canonBefore);
    expect(recovered?.updatedProject.characters).toEqual(charactersBefore);
    expect(recovered?.updatedProject.growthLedger).toEqual(growthBefore);

    const again = recoverPlaySnapshotToDraft(recovered!.updatedProject, snapshot);
    expect(again?.created).toBe(false);
    expect(again?.updatedProject.chapters).toHaveLength(recovered!.updatedProject.chapters.length);
    expect(again?.chapter.id).toBe(recovered?.chapter.id);
  });

  it('미반영 PLAY가 있으면 WRITE 복구를 막고, 없으면 본편과 PLAY 작업본을 같은 회차로 맞춘다', () => {
    const committed = { ...createSeedProject(), id: 'p1', title: '달의 문서고' };
    const session = {
      ...createDiveSession(committed.characters[0].id, committed.id),
      chatBuffer: [{ id: 'm1', role: 'user' as const, text: '복구할 기록', turn: 1 }]
    };
    const firstSnapshot = buildPlayRecoverySnapshot(session, committed, '2026-07-16T12:34:56.000Z');
    const pendingWorking = recoverPlaySnapshotToDraft(committed, firstSnapshot)!.updatedProject;
    const blockedSnapshot = { ...firstSnapshot, episode: 2, transcript: '나: 다음 기록' };

    const blocked = planPlayRecoveryWrite(committed, pendingWorking, blockedSnapshot);
    expect(blocked).toEqual({ status: 'pending-sync', pending: { chapters: 1, canon: 0, total: 1 } });

    const ready = planPlayRecoveryWrite(pendingWorking, { ...pendingWorking }, blockedSnapshot);
    expect(ready.status).toBe('ready');
    if (ready.status !== 'ready') throw new Error('ready recovery plan expected');
    expect(ready.committedProject.chapters.at(-1)?.episode).toBe(2);
    expect(ready.workingProject).toEqual(ready.committedProject);
    expect(ready.chapter.id).toBe(ready.workingProject?.chapters.at(-1)?.id);
  });
});
