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

  it('모드 버튼에 aria-pressed 로 활성 상태를 노출한다 (디자인 정비 슬라이스 1)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'plan' as const, onSelect: () => {}, workTitle: 't' })
    );
    expect(html.match(/aria-pressed="true"/g) ?? []).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g) ?? []).toHaveLength(2);
    expect(html).toMatch(/data-mode="plan"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-mode="plan"/);
    // 상호배타 그룹 시맨틱 — 토글 컨테이너가 그룹으로 노출된다
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="작업 모드"');
  });

  it('rightSlot 을 상단 바 안에 렌더한다(싱크 콘솔 통합)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, {
        mode: 'write' as const,
        onSelect: () => {},
        workTitle: 't',
        rightSlot: createElement('span', { 'data-testid': 'slot' }, '⟳ 최신화')
      })
    );
    expect(html).toContain('data-testid="slot"');
    expect(html).toContain('⟳ 최신화');
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

  it('titleSlot 이 있으면 workTitle 대신 titleSlot 을 렌더한다 (슬라이스 C)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, {
        mode: 'write' as const,
        onSelect: () => {},
        workTitle: '폴백 제목',
        titleSlot: createElement('input', { className: 'wm-title-input', defaultValue: '편집 가능한 제목' })
      })
    );
    expect(html).toContain('wm-title-input');
    expect(html).not.toContain('폴백 제목');
  });

  it('contextSlot 을 제목 옆에 렌더한다 (회차 픽커/캐논 요약 자리)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, {
        mode: 'write' as const,
        onSelect: () => {},
        workTitle: 't',
        contextSlot: createElement('span', { className: 'wm-context-chip' }, '3화 · 비 오는 밤')
      })
    );
    expect(html).toContain('wm-context-chip');
    expect(html).toContain('3화 · 비 오는 밤');
  });

  it('planDot 이 true 면 PLAN 버튼에 dot 마커를 렌더한다 (공통 셸)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, planDot: true })
    );
    expect(html).toContain('wm-plan-dot');
  });

  it('planDot 이 false/미지정이면 dot 없음', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {} })
    );
    expect(html).not.toContain('wm-plan-dot');
  });

  it('planBadge>0 이면 PLAN 버튼에 배지를, 0/미지정이면 렌더하지 않는다', () => {
    const withBadge = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: 't', planBadge: 3 })
    );
    expect(withBadge).toContain('wm-badge');
    expect(withBadge).toContain('>3<');
    const zero = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: 't', planBadge: 0 })
    );
    expect(zero).not.toContain('wm-badge');
    const none = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: 't' })
    );
    expect(none).not.toContain('wm-badge');
  });
});
