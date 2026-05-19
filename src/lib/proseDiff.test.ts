import { describe, expect, it } from 'vitest';
import { diffProseBlocks } from './proseDiff';

describe('proseDiff', () => {
  it('reports no change when the edited prose matches the original', () => {
    const text = '첫 단락이다.\n\n둘째 단락이다.';
    const summary = diffProseBlocks(text, text);
    expect(summary.changed).toBe(false);
    expect(summary.addedBlocks).toBe(0);
    expect(summary.removedBlocks).toBe(0);
    expect(summary.blocks.every((block) => block.kind === 'same')).toBe(true);
  });

  it('marks an edited paragraph as removed + added while keeping the rest same', () => {
    const original = '도입 단락.\n\n원래 가운데 단락.\n\n마지막 단락.';
    const edited = '도입 단락.\n\n사용자가 고친 가운데 단락.\n\n마지막 단락.';
    const summary = diffProseBlocks(original, edited);

    expect(summary.changed).toBe(true);
    expect(summary.addedBlocks).toBe(1);
    expect(summary.removedBlocks).toBe(1);
    expect(summary.blocks.filter((block) => block.kind === 'same').map((block) => block.text)).toEqual([
      '도입 단락.',
      '마지막 단락.'
    ]);
    expect(summary.blocks.some((block) => block.kind === 'added' && block.text.includes('고친'))).toBe(true);
  });

  it('counts a newly inserted paragraph as added only', () => {
    const original = '한 단락뿐.';
    const edited = '한 단락뿐.\n\n새로 덧붙인 단락.';
    const summary = diffProseBlocks(original, edited);

    expect(summary.addedBlocks).toBe(1);
    expect(summary.removedBlocks).toBe(0);
  });

  it('handles empty original prose', () => {
    const summary = diffProseBlocks('', '새 원고 한 줄.');
    expect(summary.addedBlocks).toBe(1);
    expect(summary.changed).toBe(true);
  });
});
