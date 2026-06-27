import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveDesk } from './DiveDesk';
import { createDiveSession } from '../lib/diveSession';
import { createEmptyProject } from '../lib/storyEngine';

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
    // 연대기 분기 — 커밋된 회차의 제목·본문이 렌더된다.
    expect(html).toContain('첫 회차');
    expect(html).toContain('비 오는 날');
    // 채팅 버블 + 컴포저.
    expect(html).toContain('안녕');
    expect(html).toContain('말을 걸어보세요');
  });
});
