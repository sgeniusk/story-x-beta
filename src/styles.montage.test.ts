import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

describe('Story X Montage design tokens', () => {
  it('exposes Montage-inspired primitive, semantic, and component tokens', () => {
    expect(css).toContain('--wds-color-blue-50: #0066FF');
    expect(css).toContain('--wds-color-cool-neutral-99: #F7F7F8');
    expect(css).toContain('--wds-semantic-color-background-normal');
    expect(css).toContain('--wds-component-button-radius-medium: 10px');
    expect(css).toContain('--wds-spacing-16: 16px');
  });

  it('maps Story X surfaces and controls to Montage token aliases', () => {
    expect(css).toContain('--paper: var(--wds-semantic-color-background-normal)');
    expect(css).toContain('--card: var(--wds-semantic-color-background-elevated-normal)');
    expect(css).toContain('--button-bg: var(--wds-semantic-color-label-normal)');
    expect(css).toContain('--control-radius: var(--wds-component-button-radius-medium)');
  });

  it('maps the studio detail scope (.sx-desk) onto the shared warm --st-* tokens', () => {
    // 2026-07-07 핀 완화(사용자 결정) — Linear pitch black 리터럴을 버리고 스튜디오 공통
    // warm oklch(--st-*)에 매핑해 PLAN 이음새(.fc-app 안 .sx-desk 냉온 충돌)를 봉합한다.
    expect(css).toContain('--sx-ink: var(--st-ink)');
    expect(css).toContain('--sx-card: var(--st-sheet)');
    expect(css).toContain('--sx-paper: var(--st-bg)');
    expect(css).toContain('--sx-brand: var(--st-accent)');
    expect(css).toContain('--sx-page: var(--st-sheet)');
    expect(css).toContain('--sx-line: var(--st-rule-soft)');
    // AI-stage 파스텔 토큰 — 작가진 단계 의미색은 보존
    expect(css).toContain('--sx-stage-think: #dfa88f');
    expect(css).toContain('--sx-stage-read: #9fbbe0');
    expect(css).toContain('--sx-stage-mark: #9fc9a2');
    expect(css).toContain('--sx-stage-write: #c0a8dd');
    expect(css).toContain('--sx-stage-done: #c08532');
  });
});
