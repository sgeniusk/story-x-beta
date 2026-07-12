import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlaySeedPanel } from './PlaySeedPanel';
import { DIVE_SEED_CHARACTERS } from '../lib/diveSeedCharacters';

const baseProps = {
  setup: null,
  loading: false,
  error: '',
  presets: DIVE_SEED_CHARACTERS,
  onPickPreset: () => {},
  onConfirm: () => {},
  onBack: () => {}
};

describe('PlaySeedPanel', () => {
  it('주의사항 고정 문구와 프리셋 3칩을 항상 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, baseProps));
    expect(html).toContain('이 설정은 정확하지 않아도 됩니다');
    expect(html).toContain('플레이하며 완성해나가는 초안');
    const chips = html.match(/hx-playseed-preset/g) ?? [];
    expect(chips.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain(DIVE_SEED_CHARACTERS[0].character.name);
  });

  it('setup 이 없으면 「이대로 시작」이 비활성', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, baseProps));
    expect(html).toMatch(/<button[^>]*disabled[^>]*>이대로 시작/);
  });

  it('setup 이 있으면 인물·첫 장면·내 역할 카드를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(PlaySeedPanel, {
        ...baseProps,
        setup: {
          scene: '늦은 밤 편의점.',
          cast: [{ name: '지호', role: '야간 알바', desire: '가게를 지키고 싶다', wound: '', voiceRules: [] }],
          myRole: '단골'
        }
      })
    );
    expect(html).toContain('지호');
    expect(html).toContain('야간 알바');
    expect(html).toContain('늦은 밤 편의점.');
    expect(html).toContain('단골');
    expect(html).toContain('이대로 시작');
  });

  it('error 를 안내 문구로 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(PlaySeedPanel, { ...baseProps, error: '조금만 더 적어주세요' })
    );
    expect(html).toContain('조금만 더 적어주세요');
  });

  it('loading 이면 준비 중 문구를 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, { ...baseProps, loading: true }));
    expect(html).toContain('플레이 상대를 준비하는 중');
  });
});
