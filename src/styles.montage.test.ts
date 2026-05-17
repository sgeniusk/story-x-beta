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
    expect(css).toContain('--sx-ink: var(--ink)');
    expect(css).toContain('--sx-card: var(--card)');
  });
});
