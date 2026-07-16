import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DiveDesk } from './DiveDesk';
import { createDiveSession } from '../lib/diveSession';
import { createEmptyProject } from '../lib/storyEngine';
import type { PlayRecoverySnapshot } from '../lib/playRecovery';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

  it('진행 중 응결 잡과 전역 보관함 바로가기를 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(createElement(DiveDesk, {
      session, project, onChange: () => {}, onBack: () => {},
      generationInbox: [{ id: 'job-1', kind: 'dive-condense', projectId: project.id, projectTitle: 't', baseRevision: 'r1', episode: 1, status: 'running', createdAt: 'x', updatedAt: 'x' }],
      onOpenGenerationInbox: () => {}
    }));
    expect(html).toContain('백그라운드에서 응결 중');
    expect(html).toContain('생성 보관함');
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
    expect(html).toContain('WRITE 초안으로 보내기');
    expect(html).toContain('생성 보관함');
    expect(html).toContain('role="region"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('dx-generation-receipt');
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
    const condense = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '지금 응결');
    await act(async () => { condense?.click(); await Promise.resolve(); });

    expect(onStartGeneration).toHaveBeenCalledTimes(1);
    const [request, captured] = onStartGeneration.mock.calls[0] as [Record<string, string>, PlayRecoverySnapshot];
    expect(request.transcript).toBe('나: 첫 문장');
    expect(request.episode).toBe(6);
    expect(captured.episode).toBe(6);
    expect(captured.transcript).toContain('나: 첫 문장');
    expect(captured.transcript).toContain('상대: 둘째 문장');
    expect(captured.transcript).toContain('나: 셋째 문장');
    expect(host.textContent).toContain('응결은 멈췄지만 PLAY 기록은 안전합니다');

    const buttons = Array.from(host.querySelectorAll('button'));
    act(() => buttons.find((button) => button.textContent === 'PLAY 기록 TXT')?.click());
    act(() => buttons.find((button) => button.textContent === 'WRITE 초안으로 보내기')?.click());
    expect(onDownloadRecovery).toHaveBeenCalledWith(captured);
    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(captured, undefined);
    act(() => root.unmount());
    host.remove();
  });
});
