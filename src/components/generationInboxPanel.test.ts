import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GenerationInboxPanel } from './GenerationInboxPanel';
import type { GenerationInboxItem } from '../lib/generationInbox';

const makeItem = (status: GenerationInboxItem['status']): GenerationInboxItem => ({
  id: `job-${status}`, kind: 'dive-condense', projectId: 'p1', projectTitle: '달의 문서고',
  baseRevision: 'r1', episode: 2, status, createdAt: '2026-07-15T00:00:00Z', updatedAt: '2026-07-15T00:00:00Z',
  result: status === 'succeeded' ? { status: 'complete', title: '두 번째 문', hook: '', outline: [], beats: [], prose: '본문', newCanonFacts: [] } : undefined,
  warning: status === 'failed' ? '생성 실패' : undefined
});

describe('GenerationInboxPanel', () => {
  it('renders a calm empty state', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, { items: [], onReview: () => {}, onCancel: () => {}, onDiscard: () => {} }));
    expect(html).toContain('완료된 회차가 이곳에 도착합니다');
  });

  it('renders running, succeeded, and failed receipts with their actions', () => {
    const html = renderToStaticMarkup(createElement(GenerationInboxPanel, {
      items: [makeItem('running'), makeItem('succeeded'), makeItem('failed')],
      onReview: () => {}, onCancel: () => {}, onDiscard: () => {}
    }));
    expect(html).toContain('생성 중');
    expect(html).toContain('두 번째 문');
    expect(html).toContain('작품에서 검토');
    expect(html).toContain('생성 취소');
    expect(html).toContain('생성 실패');
  });
});
