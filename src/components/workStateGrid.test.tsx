import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  episodeLengthContractFor,
  type Chapter,
  type SeriesProject
} from '../lib/storyEngine';
import { WorkStateGrid } from './WorkStateGrid';

function chapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'chapter-1',
    episode: 1,
    title: '첫 회차',
    hook: '문이 열렸다.',
    outline: [],
    beats: [],
    prose: '',
    memoryAnchors: [],
    newCanonFacts: [],
    ...overrides
  };
}

function renderGrid(latestChapter: Chapter): string {
  const project: SeriesProject = {
    ...createEmptyProject({ title: '분량 계약 작품' }),
    chapters: [latestChapter],
    currentEpisode: latestChapter.episode
  };
  return renderToStaticMarkup(
    createElement(WorkStateGrid, { project, latestChapter, isSerial: true })
  );
}

describe('WorkStateGrid', () => {
  it('P2-d 신규 회차는 자기 episodeLength 목표로 WRITE 진행률을 계산한다', () => {
    const html = renderGrid(chapter({
      prose: `${'가 '.repeat(1499)}가`,
      episodeLength: episodeLengthContractFor('compact')
    }));

    expect(html).toContain('1,500<small>자</small>');
    expect(html).toContain('50<small>%</small>');
  });

  it('legacy 회차는 기존 WRITE 5천자 진행률을 유지한다', () => {
    const html = renderGrid(chapter({ prose: `${'가 '.repeat(2499)}가` }));

    expect(html).toContain('2,500<small>자</small>');
    expect(html).toContain('50<small>%</small>');
  });
});
