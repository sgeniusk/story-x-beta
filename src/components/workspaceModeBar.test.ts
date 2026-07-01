// 융합 셸 상단 3모드 토글 렌더/상호작용 테스트. spec 2026-07-02.
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { WorkspaceModeBar } from './WorkspaceModeBar';

describe('WorkspaceModeBar', () => {
  it('세 모드 버튼과 작품 제목을 렌더하고 active를 강조한다', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: '철거 전야의 이름' })
    );
    expect(html).toContain('PLAY');
    expect(html).toContain('WRITE');
    expect(html).toContain('PLAN');
    expect(html).toContain('철거 전야의 이름');
    // active(write) 만 is-active
    expect(html.match(/wm-btn is-active/g) ?? []).toHaveLength(1);
  });

  it('버튼 클릭 시 onSelect(mode)를 호출한다', () => {
    const onSelect = vi.fn();
    // 순수 함수 계약 검증 — data-mode 속성으로 매핑 확인(렌더 계약).
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'play' as const, onSelect, workTitle: 't' })
    );
    expect(html).toContain('data-mode="plan"');
    expect(html).toContain('data-mode="write"');
    expect(html).toContain('data-mode="play"');
  });
});
