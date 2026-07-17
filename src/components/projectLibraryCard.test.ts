import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../lib/storyEngine';
import type { ProjectLibraryEntry } from '../lib/projectLibrary';
import { ProjectLibraryCard } from './ProjectLibraryCard';

function entry(lifecycle: ProjectLibraryEntry['lifecycle'], currentEpisode = 0): ProjectLibraryEntry {
  const project = { ...createEmptyProject({ title: '젖은 어깨' }), id: 'work-1', currentEpisode, logline: '막차가 끊긴 역에서 시작되는 이야기' };
  return {
    projectId: project.id,
    lifecycle,
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: '2026-07-15T01:00:00Z',
    project
  };
}

describe('ProjectLibraryCard', () => {
  it('renders a temporary work with resume and explicit confirm actions', () => {
    const html = renderToStaticMarkup(createElement(ProjectLibraryCard, {
      entry: entry('temporary'), active: true, onOpen: () => {}, onConfirm: () => {}
    }));
    expect(html).toContain('임시작');
    expect(html).toContain('최근 작업');
    expect(html).toContain('작업 계속하기');
    expect(html).not.toContain('PLAY 계속하기');
    expect(html).toContain('작품으로 확정');
    expect(html).toContain('젖은 어깨');
  });

  it('renders a confirmed work without a promotion action', () => {
    const html = renderToStaticMarkup(createElement(ProjectLibraryCard, {
      entry: entry('confirmed', 1), active: false, onOpen: () => {}, onConfirm: () => {}
    }));
    expect(html).toContain('연재 작품');
    expect(html).toContain('작업 계속하기');
    expect(html).not.toContain('작품으로 확정');
    expect(html).not.toContain('최근 작업');
  });
});
