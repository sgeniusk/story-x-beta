import { describe, expect, it } from 'vitest';
import { normalizeSpine } from './spineSuggestClient';

describe('spineSuggestClient — normalizeSpine (Phase A-3b)', () => {
  it('4줄을 trim 해서 StorySpine 으로 정규화한다', () => {
    expect(normalizeSpine({ desire: ' 욕망 ', advance: '전진', obstacle: '시련', resolution: '변화' })).toEqual({
      desire: '욕망',
      advance: '전진',
      obstacle: '시련',
      resolution: '변화'
    });
  });

  it('4줄이 모두 비거나 객체가 아니면 null', () => {
    expect(normalizeSpine({ desire: '', advance: '', obstacle: '', resolution: '' })).toBeNull();
    expect(normalizeSpine(null)).toBeNull();
    expect(normalizeSpine('x')).toBeNull();
    expect(normalizeSpine([])).toBeNull();
  });

  it('일부 줄만 있어도 나머지는 빈 문자열로 정규화한다(단편 2줄 허용)', () => {
    expect(normalizeSpine({ desire: '욕망', resolution: '변화' })).toEqual({
      desire: '욕망',
      advance: '',
      obstacle: '',
      resolution: '변화'
    });
  });
});
