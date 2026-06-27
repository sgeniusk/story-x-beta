import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveDesk } from './DiveDesk';
import { createDiveSession } from '../lib/diveSession';
import { createEmptyProject } from '../lib/storyEngine';

describe('DiveDesk', () => {
  it('연대기 회차와 채팅 버블을 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = { ...session, chatBuffer: [{ id: 'm1', role: 'user', text: '안녕', turn: 1 }] };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('안녕');
    expect(html).toContain('말을 걸어보세요');
  });
});
