import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { GenerationInboxPanel } from './GenerationInboxPanel';
import type { GenerationInboxItem } from '../lib/generationInbox';
import type { PlayRecoverySnapshot } from '../lib/playRecovery';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const recovery: PlayRecoverySnapshot = {
  schema: 'storyx/play-recovery/v1', projectId: 'p1', projectTitle: '달의 문서고', episode: 2,
  scene: '서고', transcript: '나: 기록', capturedAt: '2026-07-15T00:00:00Z'
};

const makeItem = (status: GenerationInboxItem['status']): GenerationInboxItem => ({
  id: `job-${status}`, kind: 'dive-condense', projectId: 'p1', projectTitle: '달의 문서고',
  baseRevision: 'r1', episode: 2, status, createdAt: '2026-07-15T00:00:00Z', updatedAt: '2026-07-15T00:00:00Z',
  result: status === 'succeeded' ? { status: 'complete', title: '두 번째 문', hook: '', outline: [], beats: [], prose: '본문', newCanonFacts: [] } : undefined,
  warning: status === 'failed' ? '생성 실패' : undefined
});

describe('GenerationInboxPanel', () => {
  it('renders a calm empty state', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, { items: [], onReview: () => {}, onCancel: () => {}, onDiscard: () => {}, onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {} }));
    expect(html).toContain('완료된 회차가 이곳에 도착합니다');
  });

  it('renders running, succeeded, and failed receipts with their actions', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [makeItem('running'), makeItem('succeeded'), makeItem('failed')],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {}, onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));
    expect(html).toContain('생성 중');
    expect(html).toContain('두 번째 문');
    expect(html).toContain('작품에서 검토');
    expect(html).toContain('생성 취소');
    expect(html).toContain('생성 실패');
  });

  it('복구 가능한 실패 영수증은 수동 작성임을 밝히고 연 뒤엔 같은 작업본을 다시 연다', () => {
    const onDownloadRecovery = vi.fn();
    const onSendRecoveryToDraft = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const failed = { ...makeItem('failed'), recovery };

    act(() => root.render(createElement(GenerationInboxPanel, {
      items: [failed], onReview: () => {}, onCancel: () => {}, onDiscard: () => {},
      onDownloadRecovery, onSendRecoveryToDraft
    })));
    expect(host.textContent).toContain('PLAY 기록은 안전합니다');
    expect(host.textContent).toContain('본편 회차나 캐논에는 자동 반영되지 않습니다');
    const buttons = Array.from(host.querySelectorAll('button'));
    act(() => buttons.find((button) => button.textContent === 'PLAY 기록 TXT')?.click());
    act(() => buttons.find((button) => button.textContent === '원문으로 직접 쓰기')?.click());
    expect(onDownloadRecovery).toHaveBeenCalledWith(failed);
    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(failed);

    act(() => root.render(createElement(GenerationInboxPanel, {
      items: [{
        ...failed,
        recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
        recoveryDraftId: 'recovery-draft-1'
      }],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {}, onDownloadRecovery, onSendRecoveryToDraft
    })));
    expect(host.textContent).toContain('직접 쓰는 복구 작업본이 있습니다');
    expect(host.textContent).toContain('아직 본편 회차나 캐논에 반영되지 않았습니다');
    const reopenButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '직접 쓰던 작업본 열기');
    expect(reopenButton?.hasAttribute('disabled')).toBe(false);
    act(() => reopenButton?.click());
    expect(onSendRecoveryToDraft).toHaveBeenCalledTimes(2);
    expect(onSendRecoveryToDraft).toHaveBeenLastCalledWith(expect.objectContaining({ recoveryDraftId: 'recovery-draft-1' }));

    act(() => root.render(createElement(GenerationInboxPanel, {
      items: [{
        ...failed,
        recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
        recoveryDraftId: 'recovery-draft-1',
        recoveredAt: '2026-07-16T01:00:00Z',
        recoveredChapterId: 'episode-1'
      }],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {}, onDownloadRecovery, onSendRecoveryToDraft
    })));
    expect(host.textContent).toContain('회차로 저장했습니다');
    expect(host.textContent).toContain('캐논에는 자동 반영되지 않았습니다');
    const savedButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '회차로 저장됨');
    expect(savedButton?.hasAttribute('disabled')).toBe(true);
    act(() => root.unmount());
    host.remove();
  });

  it('유일한 미복구 원문 폐기 전에 확인하고 취소하면 보존한다', () => {
    const onDiscard = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const failed = { ...makeItem('failed'), recovery };

    act(() => root.render(createElement(GenerationInboxPanel, {
      items: [failed], onReview: () => {}, onCancel: () => {}, onDiscard,
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    })));
    const discard = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '폐기');
    expect(discard?.classList.contains('is-discard')).toBe(true);
    act(() => discard?.click());
    expect(confirm).toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    act(() => discard?.click());
    expect(onDiscard).toHaveBeenCalledWith(failed);
    act(() => root.unmount());
    host.remove();
    confirm.mockRestore();
  });

  it('늦은 성공 뒤에도 이미 만든 직접 쓰기 작업본을 숨기지 않고 폐기 전 확인한다', () => {
    const onDiscard = vi.fn();
    const onSendRecoveryToDraft = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const lateSuccess = {
      ...makeItem('succeeded'),
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'recovery-draft-late'
    };

    act(() => root.render(createElement(GenerationInboxPanel, {
      items: [lateSuccess], onReview: () => {}, onCancel: () => {}, onDiscard,
      onDownloadRecovery: () => {}, onSendRecoveryToDraft
    })));

    expect(host.textContent).toContain('작품에서 검토');
    expect(host.textContent).toContain('직접 쓰는 복구 작업본이 있습니다');
    const reopen = Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '직접 쓰던 작업본 열기');
    expect(reopen).toBeDefined();
    act(() => reopen?.click());
    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(lateSuccess);

    const discard = Array.from(host.querySelectorAll('button'))
      .find((button) => button.textContent === '폐기');
    act(() => discard?.click());
    expect(confirm).toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();

    act(() => root.unmount());
    host.remove();
    confirm.mockRestore();
  });

  it('recovery가 없는 구버전 실패 영수증에는 구제 행동을 만들지 않는다', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [makeItem('failed')], onReview: () => {}, onCancel: () => {}, onDiscard: () => {},
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));
    expect(html).not.toContain('PLAY 기록 TXT');
    expect(html).not.toContain('WRITE에서 이어쓰기');
  });

  it('영속화 실패 중인 실행 잡은 TXT만 즉시 제공하고 WRITE는 열지 않는다', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [{ ...makeItem('running'), recovery, localPersistenceFailed: true }],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {},
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));
    expect(html).toContain('새로고침 전에 PLAY 기록 TXT');
    expect(html).toContain('PLAY 기록 TXT');
    expect(html).not.toContain('WRITE에서 이어쓰기');
  });

  it('복구 가능한 종료 영수증도 영속화 실패 중이면 안전 문구 대신 새로고침 전 TXT 경고를 낸다', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [{ ...makeItem('failed'), recovery, localPersistenceFailed: true }],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {},
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));

    expect(html).toContain('새로고침 전에 PLAY 기록 TXT');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('PLAY 기록은 안전합니다');
    expect(html).toContain('원문으로 직접 쓰기');
  });
});
