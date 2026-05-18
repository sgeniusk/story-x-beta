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

  it('scopes the editor (.sx-desk) to the design3 Editorial DS palette', () => {
    // 편집기는 자체 표면을 쓴다 — warm cream 캔버스 + dark manuscript + 보라 brand
    expect(css).toContain('--sx-ink: #26251e');
    expect(css).toContain('--sx-card: #ffffff');
    expect(css).toContain('--sx-paper: #f7f7f4');
    expect(css).toContain('--sx-brand: #6448d3');
    expect(css).toContain('--sx-page: #1c1a17');
    // AI-stage 파스텔 토큰
    expect(css).toContain('--sx-stage-think: #dfa88f');
    expect(css).toContain('--sx-stage-read: #9fbbe0');
    expect(css).toContain('--sx-stage-mark: #9fc9a2');
    expect(css).toContain('--sx-stage-write: #c0a8dd');
    expect(css).toContain('--sx-stage-done: #c08532');
  });
});
