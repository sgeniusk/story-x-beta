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

  it('복구 가능한 실패 영수증에서 TXT와 WRITE 행동을 실행하고 전송 완료는 비활성화한다', () => {
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
    const buttons = Array.from(host.querySelectorAll('button'));
    act(() => buttons.find((button) => button.textContent === 'PLAY 기록 TXT')?.click());
    act(() => buttons.find((button) => button.textContent === 'WRITE 초안으로 보내기')?.click());
    expect(onDownloadRecovery).toHaveBeenCalledWith(failed);
    expect(onSendRecoveryToDraft).toHaveBeenCalledWith(failed);

    act(() => root.render(createElement(GenerationInboxPanel, {
      items: [{ ...failed, recoveredAt: '2026-07-16T00:00:00Z', recoveredChapterId: 'episode-1' }],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {}, onDownloadRecovery, onSendRecoveryToDraft
    })));
    expect(host.textContent).toContain('WRITE 초안으로 보냈습니다');
    const sentButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === 'WRITE로 보냄');
    expect(sentButton?.hasAttribute('disabled')).toBe(true);
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

  it('recovery가 없는 구버전 실패 영수증에는 구제 행동을 만들지 않는다', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [makeItem('failed')], onReview: () => {}, onCancel: () => {}, onDiscard: () => {},
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));
    expect(html).not.toContain('PLAY 기록 TXT');
    expect(html).not.toContain('WRITE 초안으로 보내기');
  });

  it('영속화 실패 중인 실행 잡은 TXT만 즉시 제공하고 WRITE는 열지 않는다', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [{ ...makeItem('running'), recovery, localPersistenceFailed: true }],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {},
      onDownloadRecovery: () => {}, onSendRecoveryToDraft: () => {}
    }));
    expect(html).toContain('새로고침 전에 PLAY 기록 TXT');
    expect(html).toContain('PLAY 기록 TXT');
    expect(html).not.toContain('WRITE 초안으로 보내기');
  });
});
