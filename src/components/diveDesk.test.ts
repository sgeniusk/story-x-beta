import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DiveDesk } from './DiveDesk';
import { createDiveSession } from '../lib/diveSession';
import { createEmptyProject, episodeLengthContractFor } from '../lib/storyEngine';
import type { PlayRecoverySnapshot } from '../lib/playRecovery';
import { buildCondenseSourceFingerprint } from '../lib/diveSession';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function enterTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function condenseReadySession(projectId: string) {
  return {
    ...createDiveSession('seed-childhood', projectId),
    chatBuffer: [
      { id: 'm1', role: 'user' as const, text: '문을 연다', turn: 1 },
      { id: 'm2', role: 'character' as const, text: '안쪽에서 종이 타는 냄새가 난다', turn: 2 },
      { id: 'm3', role: 'user' as const, text: '불빛을 따라 들어간다', turn: 3 }
    ]
  };
}

describe('DiveDesk', () => {
  it('연대기 회차와 채팅 버블을 렌더한다', () => {
    const base = createEmptyProject({ title: 't' });
    const project = {
      ...base,
      chapters: [
        {
          id: 'episode-1', episode: 1, title: '첫 회차', hook: '', outline: [],
          beats: [], prose: '비 오는 날', memoryAnchors: [], newCanonFacts: []
        }
      ]
    };
    let session = createDiveSession('seed-childhood', project.id);
    session = { ...session, chatBuffer: [{ id: 'm1', role: 'user', text: '안녕', turn: 1 }] };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    // 연대기 분기 — 회차가 있으면 접이식 토글이 렌더되고, 기본은 접혀 본문이 안 보인다.
    expect(html).toContain('지난 이야기 1화');
    expect(html).not.toContain('비 오는 날');
    // 채팅 버블 + 컴포저.
    expect(html).toContain('안녕');
    expect(html).toContain('말을 걸어보세요');
  });

  it('대사 속 *별표* 묘사를 dx-action 기울임으로 분리 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [{ id: 'm1', role: 'character', text: '그래. *목도리를 둘러준다*', turn: 1 }]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    // 별표 구간은 dx-action 으로 분리되고, 별표 기호 자체는 렌더에서 사라진다.
    expect(html).toContain('class="dx-action"');
    expect(html).toContain('목도리를 둘러준다');
    expect(html).toContain('그래. ');
    expect(html).not.toContain('*');
  });

  it('캐릭터 응답의 서술/화자 줄을 내레이션 블록과 화자 말풍선으로 분리 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [{ id: 'm1', role: 'character', text: '현관이 열려 있다.\n도윤 母: 누구세요?', turn: 1 }]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('class="dx-narration"');
    expect(html).toContain('현관이 열려 있다.');
    expect(html).toContain('class="dx-speaker"');
    expect(html).toContain('도윤 母');
    expect(html).toContain('누구세요?');
  });

  it('⏳ 계속 버튼이 항상 렌더된다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('계속');
  });

  it('⏭ 전개 버튼이 렌더된다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('전개');
  });

  it('앵커 충돌 턴에 red 거터 마커 클래스를 렌더한다 (MVP-1)', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [
        {
          id: 'm1', role: 'character', text: '사실 서준은 죽었어.', turn: 1,
          verdict: {
            conflicts: [{ factId: 'a1', band: 'anchor', factStatement: '서준은 살아 있다', snippet: '사실 서준은 죽었어.' }],
            surpriseCandidates: [], blocksCanonization: true
          }
        }
      ]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('dx-gutter-anchor');
  });

  it('verdict가 있는 세션이면 하단 앰비언트 카운트를 렌더한다 (MVP-1)', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [
        { id: 'm1', role: 'user', text: '무슨 일', turn: 1 },
        {
          id: 'm2', role: 'character', text: '사실 나도 거기 있었어.', turn: 2,
          verdict: { conflicts: [], surpriseCandidates: [{ snippet: '사실 나도 거기 있었어.' }], blocksCanonization: false }
        }
      ]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('의외 전개 후보');
  });

  it('「✦ 전개 후보」 요청 버튼을 컴포저에 렌더한다 (opt-in)', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('dx-vs-request');
    expect(html).toContain('✦ 전개 후보');
  });

  it('새 응결 재료 앞에 기본 5천자 선택 레일을 두고 수동 CTA를 작성창에서 분리한다', () => {
    const project = createEmptyProject({ title: '분량 선택' });
    const session = condenseReadySession(project.id);
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange, onBack: () => {}, onStartGeneration: async () => {}
    })));

    const rail = host.querySelector('.dx-condense-target');
    expect(rail?.tagName).toBe('FIELDSET');
    expect(rail?.nextElementSibling?.classList.contains('dx-workbench-dock')).toBe(true);
    expect(rail?.textContent).toContain('회차 분량');
    expect(rail?.textContent).toContain('3천자 · 2~3장면');
    expect(rail?.textContent).toContain('5천자 · 3~4장면');
    expect(rail?.textContent).toContain('8천자 · 4~6장면');
    expect(rail?.textContent).toContain('재료가 모자라면 짧게 돌아오며, 자동으로 내용을 만들거나 잘라내지 않습니다.');
    expect((rail?.querySelector('input[value="standard"]') as HTMLInputElement).checked).toBe(true);
    expect(rail?.querySelector('.dx-condense-target-action')?.textContent).toBe('5천자로 응결');
    expect(host.querySelector('.dx-composer .dx-condense-manual')).toBeNull();

    act(() => (rail?.querySelector('input[value="extended"]') as HTMLInputElement).click());
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ episodeLengthPreset: 'extended' }),
      project
    );

    const extendedSession = onChange.mock.calls.at(-1)?.[0];
    act(() => root.render(createElement(DiveDesk, {
      session: extendedSession, project, onChange, onBack: () => {}, onStartGeneration: async () => {}
    })));
    expect(host.querySelector('.dx-condense-target-action')?.textContent).toBe('8천자로 응결');

    act(() => root.unmount());
    host.remove();
  });

  it('응결 가능한 재료 수에서 캐논화 차단 턴을 제외하고 실행·검토 중에는 선택 레일을 숨긴다', () => {
    const project = createEmptyProject({ title: '유효 재료' });
    const blockedVerdict = { conflicts: [], surpriseCandidates: [], blocksCanonization: true };
    const blockedSession = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: [
        { id: 'b1', role: 'user' as const, text: '차단 1', turn: 1, verdict: blockedVerdict },
        { id: 'b2', role: 'character' as const, text: '차단 2', turn: 2, verdict: blockedVerdict },
        { id: 'b3', role: 'user' as const, text: '차단 3', turn: 3, verdict: blockedVerdict }
      ]
    };
    const readySession = condenseReadySession(project.id);
    const common = { project, onChange: () => {}, onBack: () => {} };

    const blockedHtml = renderToStaticMarkup(createElement(DiveDesk, { ...common, session: blockedSession }));
    expect(blockedHtml).not.toContain('dx-condense-target');

    const runningHtml = renderToStaticMarkup(createElement(DiveDesk, {
      ...common,
      session: readySession,
      generationInbox: [{
        id: 'job-running', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'running', createdAt: 'x', updatedAt: 'x',
        episodeLength: episodeLengthContractFor('standard')
      }]
    }));
    expect(runningHtml).not.toContain('dx-condense-target');

    const reviewHtml = renderToStaticMarkup(createElement(DiveDesk, {
      ...common,
      session: readySession,
      selectedGeneration: {
        id: 'job-review', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'succeeded', createdAt: 'x', updatedAt: 'x',
        episodeLength: episodeLengthContractFor('standard'),
        result: {
          status: 'complete', title: '검토 회차', hook: '', outline: [], beats: [], prose: '본문',
          newCanonFacts: [], episodeLength: episodeLengthContractFor('standard'), actualChars: 2,
          lengthStatus: 'under'
        }
      }
    }));
    expect(reviewHtml).not.toContain('dx-condense-target');
  });

  it('선택한 회차 분량을 요청과 복구 snapshot에 같은 값으로 고정한다', async () => {
    const project = createEmptyProject({ title: '8천자 요청' });
    const session = { ...condenseReadySession(project.id), episodeLengthPreset: 'extended' as const };
    const onStartGeneration = vi.fn().mockResolvedValue(undefined);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onStartGeneration
    })));
    await act(async () => {
      (host.querySelector('.dx-condense-target-action') as HTMLButtonElement).click();
      await Promise.resolve();
    });

    const [request, recovery] = onStartGeneration.mock.calls[0];
    expect(request.episodeLength).toEqual(episodeLengthContractFor('extended'));
    expect(recovery.episodeLength).toEqual(episodeLengthContractFor('extended'));

    act(() => root.unmount());
    host.remove();
  });

  it('실패 재시도는 현재 선택과 새 PLAY 턴 대신 영수증의 원문·장면·회차·목표를 재사용한다', async () => {
    const project = createEmptyProject({ title: 'frozen 재시도' });
    const extended = episodeLengthContractFor('extended');
    const sourceSpan = {
      afterTurn: 0, throughTurn: 3, messageIds: ['m1', 'm2', 'm3'], continuityMessageIds: ['m2', 'm3']
    };
    const blockedVerdict = { conflicts: [], surpriseCandidates: [], blocksCanonization: true };
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: project.title,
      episode: 1, scene: '생성 당시 옥상',
      transcript: '나: 문을 연다\n상대: 차단된 원문\n나: 불빛을 따라 들어간다', sourceSpan,
      condensedThroughTurn: 3, episodeLength: episodeLengthContractFor('compact'),
      capturedAt: '2026-07-20T00:00:00Z'
    };
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      episodeLengthPreset: 'compact' as const,
      scene: '나중에 바뀐 지하실',
      chatBuffer: [
        { id: 'm1', role: 'user' as const, text: '문을 연다', turn: 1 },
        { id: 'm2', role: 'character' as const, text: '차단된 원문', turn: 2, verdict: blockedVerdict },
        { id: 'm3', role: 'user' as const, text: '불빛을 따라 들어간다', turn: 3 },
        { id: 'm4', role: 'character' as const, text: '새로 추가된 대화', turn: 4 }
      ]
    };
    recovery.sourceFingerprint = buildCondenseSourceFingerprint(session.chatBuffer.slice(0, 3));
    const onStartGeneration = vi.fn().mockResolvedValue(undefined);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onStartGeneration,
      generationInbox: [{
        id: 'job-failed', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x',
        episodeLength: extended, sourceSpan, recovery
      }]
    })));
    await act(async () => {
      Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '응결 다시 시도')?.click();
      await Promise.resolve();
    });

    const [request, retriedRecovery] = onStartGeneration.mock.calls[0];
    expect(request).toMatchObject({
      transcript: '나: 문을 연다\n나: 불빛을 따라 들어간다',
      scene: '생성 당시 옥상', episode: 1, episodeLength: extended
    });
    expect(request.transcript).not.toContain('차단된 원문');
    expect(request.transcript).not.toContain('새로 추가된 대화');
    expect(retriedRecovery).toMatchObject({ sourceSpan, scene: '생성 당시 옥상', episode: 1, episodeLength: extended });

    act(() => root.unmount());
    host.remove();
  });

  it('source·목표가 없는 legacy 복구본은 raw transcript로 재시도하지 않고 직접 쓰기·TXT만 남긴다', async () => {
    const project = createEmptyProject({ title: 'legacy 재시도' });
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: project.title,
      episode: 1, scene: '옛 장면', transcript: '나: legacy 원문', capturedAt: '2026-07-16T00:00:00Z'
    };
    const session = { ...condenseReadySession(project.id), episodeLengthPreset: 'compact' as const };
    const onStartGeneration = vi.fn().mockResolvedValue(undefined);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onStartGeneration,
      generationInbox: [{
        id: 'job-legacy-retry', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x', recovery
      }],
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    })));

    expect(host.textContent).not.toContain('응결 다시 시도');
    expect(host.textContent).toContain('자동 재시도는 막았습니다');
    expect(host.textContent).toContain('PLAY 기록 TXT');
    expect(host.textContent).toContain('원문으로 직접 쓰기');
    expect(onStartGeneration).not.toHaveBeenCalled();

    act(() => root.unmount());
    host.remove();
  });

  it('현재 세션에 frozen ID가 하나라도 없으면 부분 원문 재시도를 fail-closed한다', () => {
    const project = createEmptyProject({ title: '부분 source 차단' });
    const target = episodeLengthContractFor('extended');
    const sourceSpan = {
      afterTurn: 0, throughTurn: 3,
      messageIds: ['m1', 'm2', 'm3'], continuityMessageIds: ['m2', 'm3']
    };
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: project.title,
      episode: 1, scene: '옥상', transcript: '나: 문을 연다\n상대: raw에는 있다\n나: 들어간다',
      sourceSpan, condensedThroughTurn: 3, episodeLength: target, capturedAt: '2026-07-20T00:00:00Z'
    };
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: [
        { id: 'm1', role: 'user' as const, text: '문을 연다', turn: 1 },
        { id: 'm3', role: 'user' as const, text: '들어간다', turn: 3 }
      ]
    };
    const onStartGeneration = vi.fn().mockResolvedValue(undefined);
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onStartGeneration,
      generationInbox: [{
        id: 'job-partial', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x',
        episodeLength: target, sourceSpan, recovery
      }],
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));

    expect(html).not.toContain('응결 다시 시도');
    expect(html).toContain('자동 재시도는 막았습니다');
    expect(onStartGeneration).not.toHaveBeenCalled();
  });

  it.each([
    ['누락', undefined],
    ['손상', { schema: 'damaged-length-contract' }]
  ] as const)('영수증 root 목표가 %s되면 recovery 목표로 보충하지 않고 재시도를 막는다', (_case, rootTarget) => {
    const project = createEmptyProject({ title: '목표 유실 차단' });
    const session = condenseReadySession(project.id);
    const sourceSpan = {
      afterTurn: 0, throughTurn: 3,
      messageIds: ['m1', 'm2', 'm3'], continuityMessageIds: ['m2', 'm3']
    };
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: project.title,
      episode: 1, scene: '옥상', transcript: '나: 문을 연다', sourceSpan,
      sourceFingerprint: buildCondenseSourceFingerprint(session.chatBuffer.slice(0, 3)),
      condensedThroughTurn: 3, episodeLength: episodeLengthContractFor('compact'),
      capturedAt: '2026-07-20T00:00:00Z'
    };
    const onStartGeneration = vi.fn().mockResolvedValue(undefined);
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onStartGeneration,
      generationInbox: [{
        id: 'job-target-dropped', kind: 'dive-condense', projectId: project.id,
        projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'failed',
        createdAt: 'x', updatedAt: 'x', sourceSpan, recovery,
        ...(rootTarget === undefined ? {} : { episodeLength: rootTarget as never })
      }],
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));

    expect(html).not.toContain('응결 다시 시도');
    expect(html).toContain('목표 기록을 확인할 수 없어 자동 재시도는 막았습니다');
    expect(html).not.toContain('5천자로 응결');
    expect(onStartGeneration).not.toHaveBeenCalled();
  });

  it('root 목표가 없는 영수증의 recovery/result 목표는 검토·직접 쓰기에 소급하지 않는다', () => {
    const project = createEmptyProject({ title: 'legacy 목표 차단' });
    const session = createDiveSession('seed-childhood', project.id);
    const nestedTarget = episodeLengthContractFor('extended');
    const nestedRecovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: project.title,
      episode: 1, scene: '옛 장면', transcript: '나: 원문', episodeLength: nestedTarget,
      capturedAt: '2026-07-20T00:00:00Z'
    };
    const onSendRecoveryToDraft = vi.fn();
    const failedItem = {
      id: 'job-no-root-write', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'failed' as const,
      createdAt: 'x', updatedAt: 'x', recovery: nestedRecovery
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onSendRecoveryToDraft,
      generationInbox: [failedItem]
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '원문으로 직접 쓰기')?.click());
    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(
      expect.not.objectContaining({ episodeLength: expect.anything() }),
      failedItem.id
    );

    const succeededItem = {
      ...failedItem,
      id: 'job-no-root-review',
      status: 'succeeded' as const,
      result: {
        status: 'complete' as const, title: '옛 결과', hook: '', outline: [], beats: [], prose: '본문',
        newCanonFacts: [], episodeLength: nestedTarget
      }
    };
    const reviewHtml = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, selectedGeneration: succeededItem
    }));
    expect(reviewHtml).toContain('목표 기록 없음');
    expect(reviewHtml).not.toContain('목표 8,000자');

    act(() => root.unmount());
    host.remove();
  });

  it('실행 중 카드는 현재 selector가 아니라 영수증의 목표와 장면 수를 표시한다', () => {
    const project = createEmptyProject({ title: '영수증 목표' });
    const session = { ...condenseReadySession(project.id), episodeLengthPreset: 'compact' as const };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{
        id: 'job-running-target', kind: 'dive-condense', projectId: project.id,
        projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'running',
        createdAt: '2026-07-20T00:00:00Z', updatedAt: '2026-07-20T00:00:00Z',
        episodeLength: episodeLengthContractFor('standard')
      }]
    }));

    expect(html).toContain('5천자 목표 · 3~4장면 응결 중');
    expect(html).not.toContain('3천자 목표 · 2~3장면 응결 중');
  });

  it.each([
    ['under', 3940, '3,940자 / 목표 5,000자 · 목표 미달, 자동으로 채우지 않음'],
    ['within', 4820, '4,820자 / 목표 5,000자 · 범위 안'],
    ['over', 5810, '5,810자 / 목표 5,000자 · 목표 초과, 자동으로 자르지 않음']
  ] as const)('검토창은 %s 실제/목표 영수증을 표시한다', (lengthStatus, actualChars, copy) => {
    const project = createEmptyProject({ title: '분량 검토' });
    const standard = episodeLengthContractFor('standard');
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session: { ...createDiveSession('seed-childhood', project.id), episodeLengthPreset: 'compact' },
      project, onChange: () => {}, onBack: () => {},
      selectedGeneration: {
        id: `job-${lengthStatus}`, kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'succeeded', createdAt: 'x', updatedAt: 'x',
        episodeLength: standard,
        result: {
          status: 'complete', title: '분량 결과', hook: '', outline: [], beats: [], prose: '가'.repeat(actualChars),
          newCanonFacts: [], episodeLength: episodeLengthContractFor('extended'), actualChars, lengthStatus
        }
      }
    }));

    expect(html).toContain(copy);
    if (lengthStatus !== 'within') {
      expect(html).toContain(`${actualChars.toLocaleString('ko-KR')}자로 승인 — 캐논으로 고정`);
      expect(html).not.toMatch(/disabled[^>]*>[^<]*자로 승인/);
    }
  });

  it('검토창은 손상된 result 길이 메타 대신 본문을 다시 세어 판정한다', () => {
    const project = createEmptyProject({ title: '길이 재계산' });
    const standard = episodeLengthContractFor('standard');
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session: createDiveSession('seed-childhood', project.id), project,
      onChange: () => {}, onBack: () => {},
      selectedGeneration: {
        id: 'job-mismatch', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'succeeded', createdAt: 'x', updatedAt: 'x',
        episodeLength: standard,
        result: {
          status: 'complete', title: '재계산 결과', hook: '', outline: [], beats: [],
          prose: '가'.repeat(4820), newCanonFacts: [], episodeLength: standard,
          actualChars: 9000, lengthStatus: 'over'
        }
      }
    }));

    expect(html).toContain('4,820자 / 목표 5,000자 · 범위 안');
    expect(html).not.toContain('9,000자');
  });

  it('목표가 없는 legacy 결과는 목표를 소급하지 않고 기록 없음으로 표시한다', () => {
    const project = createEmptyProject({ title: 'legacy 결과' });
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session: createDiveSession('seed-childhood', project.id), project,
      onChange: () => {}, onBack: () => {},
      selectedGeneration: {
        id: 'job-legacy', kind: 'dive-condense', projectId: project.id, projectTitle: project.title,
        baseRevision: 'r1', episode: 1, status: 'succeeded', createdAt: 'x', updatedAt: 'x',
        result: {
          status: 'complete', title: '옛 결과', hook: '', outline: [], beats: [], prose: '본문', newCanonFacts: []
        }
      }
    }));

    expect(html).toContain('목표 기록 없음');
    expect(html).not.toContain('목표 5,000자');
  });

  it('진행 중 응결 잡과 전역 보관함 바로가기를 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{ id: 'job-1', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'running', createdAt: 'x', updatedAt: 'x' }],
      onOpenGenerationInbox: () => {}
    }));
    expect(html).toContain('회차 응결');
    expect(html).toContain('생성 보관함');
  });

  it('실행 중 응결은 영수증 생성 시각부터의 경과와 화면 이탈 가능한 작업 안내를 함께 보여준다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T00:02:00Z'));
    try {
      const project = createEmptyProject({ title: '응결 진행' });
      const session = createDiveSession('seed-childhood', project.id);
      const html = renderToStaticMarkup(createElement(DiveDesk, {
        session, project, onChange: () => {}, onBack: () => {},
        generationInbox: [{
          id: 'job-progress', kind: 'dive-condense', projectId: project.id,
          projectTitle: project.title, baseRevision: 'r1', episode: 1,
          status: 'running', createdAt: '2026-07-18T00:00:00Z', updatedAt: '2026-07-18T00:00:00Z'
        }],
        onCancelGeneration: () => {}, onOpenGenerationInbox: () => {}
      }));

      expect(html).toContain('회차 응결');
      expect(html).toContain('2:00 경과');
      expect(html).toContain('화면을 떠나도 작업은 계속되고');
      expect(html).toContain('생성 취소');
      expect(html).toContain('생성 보관함');
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-atomic="true"');
      expect(html).toMatch(/<time[^>]*aria-hidden="true"[^>]*>2:00 경과<\/time>/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('지연된 PLAY 대화는 실제 경과시간을 올리고 요청 종료 뒤 작업등을 제거한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T01:00:00Z'));
    const request = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn(() => request.promise));
    const project = createEmptyProject({ title: '대화 진행' });
    const session = createDiveSession('seed-childhood', project.id);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => root.render(createElement(DiveDesk, {
        session, project, onChange: () => {}, onBack: () => {}
      })));
      const input = host.querySelector('.dx-composer textarea') as HTMLTextAreaElement;
      act(() => enterTextareaValue(input, '문을 열어 본다'));
      await act(async () => {
        Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '보내기')?.click();
        await Promise.resolve();
      });

      const progress = host.querySelector('.dx-progress-card');
      expect(progress?.textContent).toContain('다음 대화');
      expect(progress?.textContent).toContain('0:00 경과');
      expect(progress?.getAttribute('role')).toBe('status');
      expect(progress?.getAttribute('aria-live')).toBe('polite');
      expect(progress?.querySelector('time')?.getAttribute('aria-hidden')).toBe('true');
      expect(host.querySelector('.dx-progress-stack')?.nextElementSibling?.classList.contains('dx-composer')).toBe(true);
      expect(host.querySelector('.dx-progress-stack')?.parentElement?.classList.contains('dx-workbench-dock')).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')?.textContent).toContain('0:01 경과');

      await act(async () => {
        request.resolve({
          json: async () => ({ status: 'complete', reply: '문 너머에서 발소리가 멎는다.', choices: [] })
        } as Response);
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')).toBeNull();
    } finally {
      act(() => root.unmount());
      host.remove();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('PLAY 대화가 실패해도 진행 작업등을 닫고 입력을 다시 사용할 수 있다', async () => {
    const request = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn(() => request.promise));
    const project = createEmptyProject({ title: '대화 실패' });
    const session = createDiveSession('seed-childhood', project.id);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => root.render(createElement(DiveDesk, {
        session, project, onChange: () => {}, onBack: () => {}
      })));
      const input = host.querySelector('.dx-composer textarea') as HTMLTextAreaElement;
      act(() => enterTextareaValue(input, '대답해 줘'));
      await act(async () => {
        Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '보내기')?.click();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')).not.toBeNull();

      await act(async () => {
        request.reject(new Error('offline'));
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')).toBeNull();
      expect((host.querySelector('.dx-composer textarea') as HTMLTextAreaElement).disabled).toBe(false);
    } finally {
      act(() => root.unmount());
      host.remove();
      vi.unstubAllGlobals();
    }
  });

  it('추천 선택지는 작성창에 담아 고친 뒤 명시적으로만 전송한다', async () => {
    const firstReply = deferred<Response>();
    const secondReply = deferred<Response>();
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => firstReply.promise)
      .mockImplementationOnce(() => secondReply.promise);
    vi.stubGlobal('fetch', fetchMock);
    const project = createEmptyProject({ title: '추천 답변 편집' });
    const session = createDiveSession('seed-childhood', project.id);
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => root.render(createElement(DiveDesk, {
        session, project, onChange, onBack: () => {}
      })));
      const input = host.querySelector('.dx-composer textarea') as HTMLTextAreaElement;
      act(() => enterTextareaValue(input, '무슨 조건인지 묻는다'));
      await act(async () => {
        Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '보내기')?.click();
        await Promise.resolve();
      });
      await act(async () => {
        firstReply.resolve({
          json: async () => ({
            status: 'complete',
            reply: '대답하기 전에 네 조건부터 듣지.',
            choices: ['먼저 조건을 밝혀 주세요.', '서신부터 보여 주세요.']
          })
        } as Response);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(host.querySelector('.dx-choice-hint')?.textContent).toContain('작성창에 담아 고치세요');
      expect(host.querySelector('.dx-choices')?.getAttribute('role')).toBe('group');
      const choice = Array.from(host.querySelectorAll('.dx-choice-chip'))
        .find((button) => button.textContent === '먼저 조건을 밝혀 주세요.') as HTMLButtonElement;
      const callsBeforeChoice = onChange.mock.calls.length;

      act(() => choice.click());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(callsBeforeChoice);
      expect(input.value).toBe('먼저 조건을 밝혀 주세요.');
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(input.value.length);
      expect(input.selectionEnd).toBe(input.value.length);
      expect(host.querySelector('.dx-choices')).toBeNull();

      act(() => enterTextareaValue(input, '먼저 조건을 정확히 말해 주세요.'));
      await act(async () => {
        Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '보내기')?.click();
        await Promise.resolve();
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondOptions = fetchMock.mock.calls[1]?.[1] as RequestInit;
      expect(JSON.parse(String(secondOptions.body))).toMatchObject({ query: '먼저 조건을 정확히 말해 주세요.' });

      await act(async () => {
        secondReply.resolve({ json: async () => ({ status: 'complete', reply: '좋아.', choices: [] }) } as Response);
        await Promise.resolve();
        await Promise.resolve();
      });
    } finally {
      act(() => root.unmount());
      host.remove();
      vi.unstubAllGlobals();
    }
  });

  it('작성 중인 답변이 있으면 추천 선택지를 숨겨 문장을 보존하고 비우면 다시 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'complete', reply: '어느 쪽을 택하지?', choices: ['문을 연다', '기다린다']
      })
    } as Response));
    const project = createEmptyProject({ title: '작성 중 답변 보존' });
    const session = createDiveSession('seed-childhood', project.id);
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => root.render(createElement(DiveDesk, {
        session, project, onChange, onBack: () => {}
      })));
      const input = host.querySelector('.dx-composer textarea') as HTMLTextAreaElement;
      act(() => enterTextareaValue(input, '무엇이 있는지 묻는다'));
      await act(async () => {
        Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '보내기')?.click();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(host.querySelectorAll('.dx-choice-chip')).toHaveLength(2);
      const callsAfterReply = onChange.mock.calls.length;

      act(() => enterTextareaValue(input, '내가 먼저 쓴 문장\n둘째 줄'));
      expect(input.value).toBe('내가 먼저 쓴 문장\n둘째 줄');
      expect(host.querySelector('.dx-choices')).toBeNull();
      expect(onChange).toHaveBeenCalledTimes(callsAfterReply);

      act(() => enterTextareaValue(input, ''));
      expect(input.value).toBe('');
      expect(host.querySelectorAll('.dx-choice-chip')).toHaveLength(2);
      expect(onChange).toHaveBeenCalledTimes(callsAfterReply);
    } finally {
      act(() => root.unmount());
      host.remove();
      vi.unstubAllGlobals();
    }
  });

  it('한글 조합을 확정하는 Enter는 답변을 전송하지 않고 작성창에 보존한다', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const project = createEmptyProject({ title: '한글 추천 수정' });
    const session = createDiveSession('seed-childhood', project.id);
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => root.render(createElement(DiveDesk, {
        session, project, onChange, onBack: () => {}
      })));
      const input = host.querySelector('.dx-composer textarea') as HTMLTextAreaElement;
      act(() => enterTextareaValue(input, '승인 계정 위치를 조용히 추적해요'));

      act(() => input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', bubbles: true, cancelable: true, isComposing: true
      })));

      expect(fetchMock).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(input.value).toBe('승인 계정 위치를 조용히 추적해요');
    } finally {
      act(() => root.unmount());
      host.remove();
      vi.unstubAllGlobals();
    }
  });

  it('전개 후보와 응결 등록은 서로 다른 목적·대기 안내를 작업등에 표시한다', async () => {
    const vsRequest = deferred<Response>();
    const condenseRequest = deferred<void>();
    vi.stubGlobal('fetch', vi.fn(() => vsRequest.promise));
    const project = createEmptyProject({ title: '작업 구분' });
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: [
        { id: 'm1', role: 'user' as const, text: '문을 연다', turn: 1 },
        { id: 'm2', role: 'character' as const, text: '안은 비어 있다', turn: 2 },
        { id: 'm3', role: 'user' as const, text: '불을 켠다', turn: 3 }
      ]
    };
    const onStartGeneration = vi.fn(() => condenseRequest.promise);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      act(() => root.render(createElement(DiveDesk, {
        session, project, onChange: () => {}, onBack: () => {}, onStartGeneration
      })));
      await act(async () => {
        Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '✦ 전개 후보')?.click();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')?.textContent).toContain('전개 후보');
      expect(host.querySelector('.dx-progress-card')?.textContent).toContain('30초');

      await act(async () => {
        vsRequest.resolve({ ok: false, status: 503, json: async () => ({}) } as Response);
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')).toBeNull();

      await act(async () => {
        (host.querySelector('.dx-condense-target-action') as HTMLButtonElement | null)?.click();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')?.textContent).toContain('응결 등록');
      expect(host.querySelector('.dx-progress-card')?.textContent).toContain('등록되면 화면을 떠나도');

      await act(async () => {
        condenseRequest.resolve();
        await Promise.resolve();
      });
      expect(host.querySelector('.dx-progress-card')).toBeNull();
    } finally {
      act(() => root.unmount());
      host.remove();
      vi.unstubAllGlobals();
    }
  });

  it('실패 영수증이 PLAY에 도착하면 그 자리에서 원문 복구 행동을 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{ id: 'job-1', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'cancelled', createdAt: 'x', updatedAt: 'x', recovery }],
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}, onOpenGenerationInbox: () => {}
    }));
    expect(html).toContain('PLAY 기록은 안전합니다');
    expect(html).toContain('PLAY 기록 TXT');
    expect(html).toContain('원문으로 직접 쓰기');
    expect(html).not.toContain('응결 다시 시도');
    expect(html).toContain('자동 재시도는 막았습니다');
    expect(html).toContain('생성 보관함');
    expect(html).toContain('role="region"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('dx-generation-receipt');
  });

  it('PLAY 직접 쓰기는 recovery optional 목표가 빠졌어도 영수증 root 목표를 복구 작업본에 넘긴다', () => {
    const project = createEmptyProject({ title: 'root 목표 복구' });
    const session = createDiveSession('seed-childhood', project.id);
    const rootTarget = episodeLengthContractFor('extended');
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: project.title, episode: 1,
      scene: '옥상', transcript: '나: 기록', capturedAt: '2026-07-20T00:00:00Z'
    };
    const onSendRecoveryToDraft = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onSendRecoveryToDraft,
      generationInbox: [{
        id: 'job-root-target', kind: 'dive-condense', projectId: project.id,
        projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'failed',
        createdAt: 'x', updatedAt: 'x', episodeLength: rootTarget, recovery
      }]
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '원문으로 직접 쓰기')?.click());

    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(
      expect.objectContaining({ episodeLength: rootTarget }),
      'job-root-target'
    );

    act(() => root.unmount());
    host.remove();
  });

  it('실패 뒤 재시도 잡이 실행 중이면 이전 복구 카드 대신 현재 진행 상태를 보여준다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [
        { id: 'job-retry', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'running', createdAt: 'y', updatedAt: 'y' },
        { id: 'job-failed', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x', recovery }
      ],
      onOpenGenerationInbox: () => {}
    }));

    expect(html).toContain('회차 응결');
    expect(html).not.toContain('응결은 멈췄지만');
    expect(html).not.toContain('응결 다시 시도');
  });

  it('재시도가 성공하면 같은 회차의 이전 실패 카드를 다시 꺼내지 않는다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [
        {
          ...({ id: 'job-failed', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'failed', createdAt: '2026-07-16T00:00:00Z', updatedAt: '2026-07-16T00:02:00Z', recovery } as const),
          recoveryDraftOpenedAt: '2026-07-16T00:02:00Z', recoveryDraftId: 'draft-old'
        },
        {
          id: 'job-retry', kind: 'dive-condense', projectId: project.id, projectTitle: 't',
          baseRevision: 'r1', episode: 1, status: 'succeeded', createdAt: '2026-07-16T00:01:00Z', updatedAt: '2026-07-16T00:01:30Z',
          result: { status: 'complete', title: '응결본', hook: '', outline: [], beats: [], prose: '본문', newCanonFacts: [] }
        }
      ],
      onOpenGenerationInbox: () => {}
    }));

    expect(html).not.toContain('응결은 멈췄지만');
    expect(html).not.toContain('응결 다시 시도');
  });

  it('성공 결과 영수증이 영속되지 않았으면 PLAY에서도 즉시 검토·TXT 경고를 유지한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{
        id: 'job-success', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1',
        episode: 1, status: 'succeeded', createdAt: 'x', updatedAt: 'x', recovery, localPersistenceFailed: true,
        result: { status: 'complete', title: '응결본', hook: '', outline: [], beats: [], prose: '본문', newCanonFacts: [] }
      }],
      onDownloadRecovery: () => {}, onOpenGenerationInbox: () => {}
    }));

    expect(html).toContain('응결 결과 보관 필요');
    expect(html).toContain('새로고침 전에 결과를 검토하거나 TXT');
    expect(html).toContain('role="alert"');
    expect(html).toContain('PLAY 기록 TXT');
  });

  it('현재 회차가 지나간 뒤에는 과거 회차의 실패 카드를 PLAY에 띄우지 않는다', () => {
    const project = { ...createEmptyProject({ title: 't' }), currentEpisode: 1 };
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 옛 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{ id: 'job-old', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x', recovery }],
      onOpenGenerationInbox: () => {}
    }));

    expect(html).not.toContain('응결은 멈췄지만');
    expect(html).not.toContain('응결 다시 시도');
  });

  it('실행 잡 영속화가 실패하면 PLAY에서 새로고침 전 TXT 행동을 제공한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{ id: 'job-1', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'running', createdAt: 'x', updatedAt: 'x', recovery, localPersistenceFailed: true }],
      onCancelGeneration: () => {}, onDownloadRecovery: () => {}, onOpenGenerationInbox: () => {}
    }));
    expect(html).toContain('PLAY 기록 보관 필요');
    expect(html).toContain('새로고침 전에 TXT');
    expect(html).toContain('PLAY 기록 TXT');
  });

  it('종료된 실패 영수증이 영속되지 않았으면 안전하다고 하지 않고 즉시 TXT를 경고한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{
        id: 'job-1', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1',
        episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x', recovery, localPersistenceFailed: true
      }],
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}, onOpenGenerationInbox: () => {}
    }));

    expect(html).toContain('PLAY 기록이 아직 보관함에 저장되지 않았습니다');
    expect(html).toContain('새로고침 전에 TXT');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('PLAY 기록은 안전합니다');
  });

  it('이미 연 복구 작업본은 PLAY에서도 새 작업이 아니라 재열기로 표시한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const recovery: PlayRecoverySnapshot = {
      schema: 'storyx/play-recovery/v1', projectId: project.id, projectTitle: 't', episode: 1,
      scene: '', transcript: '나: 기록', capturedAt: '2026-07-16T00:00:00Z'
    };
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{
        id: 'job-1', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1',
        episode: 1, status: 'failed', createdAt: 'x', updatedAt: 'x', recovery,
        recoveryDraftOpenedAt: '2026-07-16T01:00:00Z', recoveryDraftId: 'draft-1'
      }],
      onSendRecoveryToDraft: () => {}
    }));
    expect(html).toContain('작업본 열기');
    expect(html).not.toContain('원문으로 직접 쓰기');
  });

  it('응결 요청 인물 카드에 상처·현재 상태·캐논 앵커를 담고 빈 필드는 생략한다', async () => {
    const base = createEmptyProject({ title: '인물 카드' });
    const project = {
      ...base,
      characters: [{
        id: 'character-seoyun',
        name: '서윤',
        role: '',
        desire: '사라진 오빠를 찾는다',
        wound: '자신이 기록을 고친 탓에 가족의 기억이 어긋났다고 믿는다',
        currentState: '왕립 문서고에서 해임된 뒤 비공식 의뢰를 받았다',
        voiceRules: ['감정을 사물의 상태로 우회한다', '결정적인 순간에는 짧게 말한다'],
        canonAnchors: ['서윤은 오빠를 찾고 있다', '서윤은 기록을 수선할 수 있다'],
        forbiddenContradictions: [],
        relations: []
      }]
    };
    const session = {
      ...createDiveSession('character-seoyun', project.id),
      chatBuffer: [
        { id: 'm1', role: 'user' as const, text: '문을 연다', turn: 1 },
        { id: 'm2', role: 'character' as const, text: '안쪽은 어둡다', turn: 2 },
        { id: 'm3', role: 'user' as const, text: '들어간다', turn: 3 }
      ]
    };
    const onStartGeneration = vi.fn().mockResolvedValue(undefined);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onStartGeneration
    })));
    const condense = host.querySelector('.dx-condense-target-action') as HTMLButtonElement | null;
    await act(async () => { condense?.click(); await Promise.resolve(); });

    expect(onStartGeneration).toHaveBeenCalledTimes(1);
    const [request] = onStartGeneration.mock.calls[0] as [Record<string, string>];
    expect(request.character).toBe([
      '서윤',
      '욕망: 사라진 오빠를 찾는다',
      '상처: 자신이 기록을 고친 탓에 가족의 기억이 어긋났다고 믿는다',
      '현재 상태: 왕립 문서고에서 해임된 뒤 비공식 의뢰를 받았다',
      '말투 규칙: 감정을 사물의 상태로 우회한다 / 결정적인 순간에는 짧게 말한다',
      '캐논 앵커(위반 금지): 서윤은 오빠를 찾고 있다 / 서윤은 기록을 수선할 수 있다'
    ].join('\n'));
    expect(request.character).not.toContain('역할:');

    act(() => root.unmount());
    host.remove();
  });

  it('잡 등록 실패 전에 전체 PLAY를 캡처하고 인라인 TXT/WRITE 구제를 제공한다', async () => {
    const project = { ...createEmptyProject({ title: '실패 복구' }), currentEpisode: 5 };
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      scene: '옥상',
      chatBuffer: [
        { id: 'm1', role: 'user' as const, text: '첫 문장', turn: 1 },
        { id: 'm2', role: 'character' as const, text: '둘째 문장', turn: 2 },
        { id: 'm3', role: 'user' as const, text: '셋째 문장', turn: 3 }
      ]
    };
    const onStartGeneration = vi.fn().mockRejectedValue(new Error('offline'));
    const onDownloadRecovery = vi.fn();
    const onSendRecoveryToDraft = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      onStartGeneration, onDownloadRecovery, onSendRecoveryToDraft
    })));
    const condense = host.querySelector('.dx-condense-target-action') as HTMLButtonElement | null;
    await act(async () => { condense?.click(); await Promise.resolve(); });

    expect(onStartGeneration).toHaveBeenCalledTimes(1);
    const [request, captured] = onStartGeneration.mock.calls[0] as [Record<string, string>, PlayRecoverySnapshot];
    expect(request.transcript).toBe([
      '나: 첫 문장',
      '상대: 둘째 문장',
      '나: 셋째 문장'
    ].join('\n'));
    expect(request.episode).toBe(6);
    expect(captured.episode).toBe(6);
    expect(captured.transcript).toContain('나: 첫 문장');
    expect(captured.transcript).toContain('상대: 둘째 문장');
    expect(captured.transcript).toContain('나: 셋째 문장');
    expect(host.textContent).toContain('응결은 멈췄지만 PLAY 기록은 안전합니다');

    const buttons = Array.from(host.querySelectorAll('button'));
    act(() => buttons.find((button) => button.textContent === 'PLAY 기록 TXT')?.click());
    act(() => buttons.find((button) => button.textContent === '원문으로 직접 쓰기')?.click());
    expect(onDownloadRecovery).toHaveBeenCalledWith(captured);
    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(captured, undefined);

    await act(async () => {
      Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '응결 다시 시도')?.click();
      await Promise.resolve();
    });
    expect(onStartGeneration).toHaveBeenCalledTimes(2);
    act(() => root.unmount());
    host.remove();
  });

  it('성공 응결 승인은 완성된 PLAY 후보를 App 소유 커밋 게이트에 넘긴 뒤에만 검토창을 닫는다', () => {
    const project = createEmptyProject({ title: '승인 합류' });
    const session = createDiveSession('seed-childhood', project.id);
    const onChange = vi.fn();
    const onResolveGeneration = vi.fn();
    const onApproveGeneration = vi.fn().mockReturnValue('committed');
    const selectedGeneration = {
      id: 'job-approved', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-17T00:00:00Z', updatedAt: '2026-07-17T00:01:00Z',
      result: {
        status: 'complete' as const,
        title: '옥상의 약속', hook: '익명 문자', outline: ['옥상으로 간다'], beats: ['문이 잠긴다'],
        prose: '문이 잠긴 뒤에야 서진은 휴대전화를 내밀었다.',
        newCanonFacts: [{ owner: 'plot' as const, statement: '서진은 익명 문자를 받았다.' }]
      }
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange, onBack: () => {}, selectedGeneration,
      onResolveGeneration, onApproveGeneration
    })));
    const approve = Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '승인 — 캐논으로 고정');
    act(() => approve?.click());

    expect(onApproveGeneration).toHaveBeenCalledTimes(1);
    const [approval] = onApproveGeneration.mock.calls[0];
    expect(approval.generationId).toBe('job-approved');
    expect(approval.project.chapters).toHaveLength(1);
    expect(approval.chapter).toMatchObject({ id: 'episode-1', episode: 1, title: '옥상의 약속' });
    expect(approval.chapter.newCanonFacts.some((fact: { statement: string }) => fact.statement === '서진은 익명 문자를 받았다.')).toBe(true);
    expect(approval.session.chatBuffer).toEqual([]);
    expect(approval.sessionBeforeApproval).toBe(session);
    expect(approval.workingBeforeApproval).toBe(project);
    expect(approval.retcons).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
    expect(onResolveGeneration).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain('응결된 회차 — 옥상의 약속');

    act(() => root.unmount());
    host.remove();
  });

  it('성공 응결 승인은 result metadata가 달라도 영수증 root 목표를 Chapter 정본으로 보존한다', () => {
    const project = createEmptyProject({ title: '승인 목표 정본' });
    const session = createDiveSession('seed-childhood', project.id);
    const rootTarget = episodeLengthContractFor('extended');
    const onApproveGeneration = vi.fn().mockReturnValue('committed');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, onApproveGeneration,
      selectedGeneration: {
        id: 'job-canonical-target', kind: 'dive-condense', projectId: project.id,
        projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded',
        createdAt: 'x', updatedAt: 'x', episodeLength: rootTarget,
        result: {
          status: 'complete', title: '정본 목표', hook: '', outline: [], beats: [], prose: '본문',
          newCanonFacts: [], episodeLength: episodeLengthContractFor('compact')
        }
      }
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('승인 — 캐논으로 고정'))?.click());

    expect(onApproveGeneration.mock.calls[0]?.[0].chapter.episodeLength).toEqual(rootTarget);

    act(() => root.unmount());
    host.remove();
  });

  it('승인 후보가 최신 본편과 충돌하면 응결 결과와 영수증을 그대로 유지한다', () => {
    const project = createEmptyProject({ title: '충돌 보존' });
    const session = createDiveSession('seed-childhood', project.id);
    const onChange = vi.fn();
    const onResolveGeneration = vi.fn();
    const onApproveGeneration = vi.fn().mockReturnValue('pending-conflict');
    const selectedGeneration = {
      id: 'job-conflict', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-17T00:00:00Z', updatedAt: '2026-07-17T00:01:00Z',
      result: {
        status: 'complete' as const,
        title: '충돌 회차', hook: '', outline: [], beats: [], prose: '서준은 이미 죽었어.',
        newCanonFacts: []
      }
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange, onBack: () => {}, selectedGeneration,
      onResolveGeneration, onApproveGeneration
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '승인 — 캐논으로 고정')?.click());

    expect(onApproveGeneration).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(onResolveGeneration).not.toHaveBeenCalled();
    expect(host.textContent).toContain('응결된 회차 — 충돌 회차');

    act(() => root.unmount());
    host.remove();
  });

  it('부분 성공 뒤 재시작한 승인은 이미 저장된 다음 회차가 아니라 영수증 checkpoint의 정확한 회차를 재개한다', () => {
    const base = createEmptyProject({ title: '부분 성공 재개' });
    const checkpointChapter = {
      id: 'episode-1', episode: 1, title: '옥상의 약속', hook: '익명 문자',
      outline: ['옥상으로 간다'], beats: [],
      prose: '문이 잠긴 뒤에야 서진은 휴대전화를 내밀었다.',
      memoryAnchors: [], newCanonFacts: []
    };
    const project = { ...base, currentEpisode: 1, chapters: [checkpointChapter] };
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: Array.from({ length: 8 }, (_, index) => ({
        id: `m${index + 1}`,
        role: index % 2 === 0 ? 'user' as const : 'character' as const,
        text: `대화 ${index + 1}`,
        turn: index + 1
      }))
    };
    const onApproveGeneration = vi.fn().mockReturnValue('committed');
    const selectedGeneration = {
      id: 'job-checkpoint', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-17T00:00:00Z', updatedAt: '2026-07-17T00:01:00Z',
      result: {
        status: 'complete' as const,
        title: checkpointChapter.title,
        hook: checkpointChapter.hook,
        outline: checkpointChapter.outline,
        beats: [],
        prose: checkpointChapter.prose,
        newCanonFacts: []
      },
      approvedCondenseCheckpoint: {
        chapter: checkpointChapter,
        retcons: [],
        condensedThroughTurn: 4,
        baseProjectRevision: 'approval-rev-base',
        committedProjectRevision: 'approval-rev-committed'
      }
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, selectedGeneration,
      onApproveGeneration
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '승인 — 캐논으로 고정')?.click());

    const [approval] = onApproveGeneration.mock.calls[0];
    expect(approval.chapter).toEqual(checkpointChapter);
    expect(approval.project).toBe(project);
    expect(approval.retcons).toEqual([]);
    expect(approval.session.chatBuffer.map((message: { turn: number }) => message.turn))
      .toEqual([5, 6, 7, 8]);

    act(() => root.unmount());
    host.remove();
  });

  it('sourceSpan이 없는 legacy 결과는 recovery 숫자 경계까지만 소비하고 이후 대화를 보존한다', () => {
    const project = createEmptyProject({ title: '보류 뒤 이어진 대화' });
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: Array.from({ length: 8 }, (_, index) => ({
        id: `m${index + 1}`,
        role: index % 2 === 0 ? 'user' as const : 'character' as const,
        text: `대화 ${index + 1}`,
        turn: index + 1
      }))
    };
    const onApproveGeneration = vi.fn().mockReturnValue('committed');
    const selectedGeneration = {
      id: 'job-delayed-approval', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-17T00:00:00Z', updatedAt: '2026-07-17T00:01:00Z',
      recovery: {
        schema: 'storyx/play-recovery/v1' as const,
        projectId: project.id,
        projectTitle: project.title,
        episode: 1,
        scene: '',
        transcript: '생성 당시 1~6턴',
        condensedThroughTurn: 4,
        capturedAt: '2026-07-17T00:00:00Z'
      },
      result: {
        status: 'complete' as const,
        title: '생성 당시 응결본',
        hook: '', outline: [], beats: [],
        prose: '이 본문은 생성 당시 1턴부터 4턴까지만 재료로 썼다.',
        newCanonFacts: []
      }
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, selectedGeneration,
      onApproveGeneration
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '승인 — 캐논으로 고정')?.click());

    const [approval] = onApproveGeneration.mock.calls[0];
    expect(approval.session.chatBuffer.map((message: { turn: number }) => message.turn))
      .toEqual([5, 6, 7, 8]);
    expect(approval.session.lastCondensedTurn).toBe(4);

    act(() => root.unmount());
    host.remove();
  });

  it('성공 영수증 root source span을 recovery 경계보다 우선하고 지연 승인 뒤 연결 tail과 후속 대화를 분리 보존한다', () => {
    const project = createEmptyProject({ title: 'root source 우선' });
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: Array.from({ length: 8 }, (_, index) => ({
        id: `m${index + 1}`,
        role: index % 2 === 0 ? 'user' as const : 'character' as const,
        text: `대화 ${index + 1}`,
        turn: index + 1
      }))
    };
    const rootSourceSpan = {
      afterTurn: 0,
      throughTurn: 6,
      messageIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
      continuityMessageIds: ['m5', 'm6']
    };
    const onApproveGeneration = vi.fn().mockReturnValue('committed');
    const selectedGeneration = {
      id: 'job-root-source', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-18T00:00:00Z', updatedAt: '2026-07-18T00:01:00Z',
      sourceSpan: rootSourceSpan,
      recovery: {
        schema: 'storyx/play-recovery/v1' as const,
        projectId: project.id,
        projectTitle: project.title,
        episode: 1,
        scene: '',
        transcript: 'legacy recovery 원문',
        condensedThroughTurn: 2,
        sourceSpan: {
          afterTurn: 0,
          throughTurn: 4,
          messageIds: ['m1', 'm2', 'm3', 'm4'],
          continuityMessageIds: ['m3', 'm4']
        },
        capturedAt: '2026-07-18T00:00:00Z'
      },
      result: {
        status: 'complete' as const,
        title: '여섯 턴 응결본', hook: '', outline: [], beats: [],
        prose: '생성 시작 당시 여섯 턴으로 만든 본문.', newCanonFacts: []
      }
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, selectedGeneration,
      onApproveGeneration
    })));
    act(() => Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '승인 — 캐논으로 고정')?.click());

    const [approval] = onApproveGeneration.mock.calls[0];
    const keptTurns = approval.session.chatBuffer.map((message: { turn: number }) => message.turn);
    expect(keptTurns).toEqual([5, 6, 7, 8]);
    expect(keptTurns.filter((turn: number) => turn <= rootSourceSpan.throughTurn)).toEqual([5, 6]);
    expect(keptTurns.filter((turn: number) => turn > rootSourceSpan.throughTurn)).toEqual([7, 8]);
    expect(approval.session.lastCondensedTurn).toBe(6);

    act(() => root.unmount());
    host.remove();
  });

  it('성공 영수증과 같은 ID·turn이어도 PLAY 본문 fingerprint가 다르면 승인을 막는다', () => {
    const project = createEmptyProject({ title: 'source identity 승인 차단' });
    const original = [
      { id: 'm1', role: 'user' as const, text: '원래 문을 연다', turn: 1 },
      { id: 'm2', role: 'character' as const, text: '원래 멈춰.', turn: 2 }
    ];
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: [
        { ...original[0], text: '다른 계단을 오른다' },
        { ...original[1], text: '다른 대답' }
      ]
    };
    const sourceSpan = {
      afterTurn: 0,
      throughTurn: 2,
      messageIds: ['m1', 'm2'],
      continuityMessageIds: ['m1', 'm2']
    };
    const onApproveGeneration = vi.fn().mockReturnValue('committed');
    const selectedGeneration = {
      id: 'job-source-identity', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-20T00:00:00Z', updatedAt: '2026-07-20T00:01:00Z',
      sourceSpan,
      sourceFingerprint: buildCondenseSourceFingerprint(original),
      result: {
        status: 'complete' as const,
        title: '원래 PLAY 응결본', hook: '', outline: [], beats: [],
        prose: '원래 PLAY로 만든 본문.', newCanonFacts: []
      }
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => root.render(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, selectedGeneration,
      onApproveGeneration
    })));
    const approveButton = Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('승인 — 캐논으로 고정'));

    expect(host.textContent).toContain('생성 당시 PLAY 원문과 현재 세션이 달라 승인할 수 없습니다');
    expect(approveButton?.disabled).toBe(true);
    approveButton?.click();
    expect(onApproveGeneration).not.toHaveBeenCalled();

    act(() => root.unmount());
    host.remove();
  });

  it('응결 검토는 recovery의 더 넓은 경계가 아니라 성공 영수증 root source span의 후보만 표시한다', () => {
    const project = createEmptyProject({ title: 'exact 검토 source' });
    const clean = { conflicts: [], surpriseCandidates: [], blocksCanonization: false };
    const session = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: [
        { id: 'm1', role: 'user' as const, text: '이번 질문', turn: 1, verdict: clean },
        {
          id: 'm2', role: 'character' as const, text: '이번 답', turn: 2,
          verdict: { conflicts: [], surpriseCandidates: [{ snippet: '이번 source 후보' }], blocksCanonization: false }
        },
        {
          id: 'm3', role: 'user' as const, text: '생성 뒤 질문', turn: 3,
          verdict: { conflicts: [], surpriseCandidates: [{ snippet: '승인에 섞이면 안 되는 늦은 후보' }], blocksCanonization: false }
        },
        { id: 'm4', role: 'character' as const, text: '생성 뒤 답', turn: 4, verdict: clean },
        { id: 'm5', role: 'user' as const, text: '후속 3', turn: 5, verdict: clean },
        { id: 'm6', role: 'character' as const, text: '후속 4', turn: 6, verdict: clean }
      ]
    };
    const selectedGeneration = {
      id: 'job-exact-review', kind: 'dive-condense' as const, projectId: project.id,
      projectTitle: project.title, baseRevision: 'r1', episode: 1, status: 'succeeded' as const,
      createdAt: '2026-07-18T00:00:00Z', updatedAt: '2026-07-18T00:01:00Z',
      sourceSpan: {
        afterTurn: 0,
        throughTurn: 2,
        messageIds: ['m1', 'm2'],
        continuityMessageIds: ['m1', 'm2']
      },
      recovery: {
        schema: 'storyx/play-recovery/v1' as const,
        projectId: project.id,
        projectTitle: project.title,
        episode: 1,
        scene: '',
        transcript: 'recovery',
        condensedThroughTurn: 4,
        sourceSpan: {
          afterTurn: 0,
          throughTurn: 4,
          messageIds: ['m1', 'm2', 'm3', 'm4'],
          continuityMessageIds: ['m3', 'm4']
        },
        capturedAt: '2026-07-18T00:00:00Z'
      },
      result: {
        status: 'complete' as const,
        title: 'exact source 응결본', hook: '', outline: [], beats: [],
        prose: 'exact source 본문.', newCanonFacts: []
      }
    };

    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {}, selectedGeneration
    }));

    expect(html).toContain('이번 source 후보');
    expect(html).not.toContain('승인에 섞이면 안 되는 늦은 후보');
  });

  it('이미 작품화된 연결 메시지가 남아 있을 때만 PLAY에 연결 구분선을 한 번 렌더한다', () => {
    const project = createEmptyProject({ title: '연결 구분선' });
    const messages = [
      { id: 'm3', role: 'user' as const, text: '지난 회차 끝 질문', turn: 3 },
      { id: 'm4', role: 'character' as const, text: '지난 회차 끝 답', turn: 4 },
      { id: 'm5', role: 'user' as const, text: '새 회차 질문', turn: 5 },
      { id: 'm6', role: 'character' as const, text: '새 회차 답', turn: 6 }
    ];
    const withContinuity = {
      ...createDiveSession('seed-childhood', project.id),
      chatBuffer: messages,
      lastCondensedTurn: 4
    };
    const withoutContinuity = {
      ...withContinuity,
      lastCondensedTurn: 0
    };

    const withHtml = renderToStaticMarkup(createElement(DiveDesk, {
      session: withContinuity, project, onChange: () => {}, onBack: () => {}
    }));
    const withoutHtml = renderToStaticMarkup(createElement(DiveDesk, {
      session: withoutContinuity, project, onChange: () => {}, onBack: () => {}
    }));

    expect(withHtml.match(/지난 회차에서 이어지는 대화/g)).toHaveLength(1);
    expect(withHtml).toContain('dx-continuity-divider');
    expect(withoutHtml).not.toContain('지난 회차에서 이어지는 대화');
    expect(withoutHtml).not.toContain('dx-continuity-divider');
  });
});
