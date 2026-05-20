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

  it('scopes the editor (.sx-desk) to the Linear dark command-center palette', () => {
    // 편집기는 Linear 다크 — pitch black 캔버스 + graphite/slate 카드 + lime brand
    expect(css).toContain('--sx-ink: #f7f8f8');
    expect(css).toContain('--sx-card: #0f1011');
    expect(css).toContain('--sx-paper: #08090a');
    expect(css).toContain('--sx-brand: #e4f222');
    expect(css).toContain('--sx-page: #161718');
    // AI-stage 파스텔 토큰
    expect(css).toContain('--sx-stage-think: #dfa88f');
    expect(css).toContain('--sx-stage-read: #9fbbe0');
    expect(css).toContain('--sx-stage-mark: #9fc9a2');
    expect(css).toContain('--sx-stage-write: #c0a8dd');
    expect(css).toContain('--sx-stage-done: #c08532');
  });
});
