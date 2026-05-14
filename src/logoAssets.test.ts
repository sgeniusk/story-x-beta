import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const brandAssetDir = resolve(__dirname, 'assets/brand');

describe('Story X logo assets', () => {
  it('uses the user-provided monochrome symbol SVG', () => {
    const symbol = readFileSync(resolve(brandAssetDir, 'story-x-symbol-mono.svg'), 'utf8');

    expect(symbol).toContain('viewBox="0 0 1536.000000 1024.000000"');
    expect(symbol).toContain('fill="#000000"');
    expect(symbol.match(/<path/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('uses the user-provided Story X lockup SVG on the homepage', () => {
    const lockup = readFileSync(resolve(brandAssetDir, 'story-x-logo-lockup-mono.svg'), 'utf8');

    expect(lockup).toContain('viewBox="0 0 1983.000000 793.000000"');
    expect(lockup).toContain('fill="#000000"');
    expect(lockup.match(/<path/g)?.length).toBeGreaterThanOrEqual(10);
  });
});
