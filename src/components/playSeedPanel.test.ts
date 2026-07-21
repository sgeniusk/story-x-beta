import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlaySeedPanel } from './PlaySeedPanel';

const baseProps = {
  setup: null,
  loading: false,
  error: '',
  partnerIndex: 0,
  onPickPartner: () => {},
  onConfirm: () => {},
  onBack: () => {}
};

describe('PlaySeedPanel', () => {
  it('주의사항은 유지하되 확인 단계에 범용 프리셋 그룹을 렌더하지 않는다', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, baseProps));
    expect(html).toContain('이 설정은 정확하지 않아도 됩니다');
    expect(html).toContain('플레이하며 완성해나가는 초안');
    expect(html).not.toContain('aria-label="프리셋 상대"');
    expect(html).not.toContain('hx-playseed-presets');
    expect(html).not.toContain('hx-playseed-preset');
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
    expect(html).not.toContain('hx-playseed-presets');
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

  it('cast 가 여럿이면 대화 상대 선택 버튼이 렌더되고 partnerIndex 만 selected 로 표시된다', () => {
    const html = renderToStaticMarkup(
      createElement(PlaySeedPanel, {
        setup: {
          scene: '장면',
          cast: [
            { name: '가온', role: '주연', desire: 'd', wound: 'w', voiceRules: [] },
            { name: '나루', role: '조연', desire: 'd2', wound: 'w2', voiceRules: [] },
            { name: '다미', role: '단역', desire: 'd3', wound: 'w3', voiceRules: [] }
          ],
          myRole: '행인'
        },
        loading: false,
        error: '',
        partnerIndex: 1,
        onPickPartner: () => {},
        onConfirm: () => {},
        onBack: () => {}
      })
    );
    expect(html).toContain('대화 상대');
    // 버튼 단위로 잘라 검사 — 근접 슬라이스는 cast 3인 이상에서 이웃 버튼의 is-selected 를 주워 위양성.
    const partnerButtons = (html.match(/<button[^>]*hx-playseed-partner[\s\S]*?<\/button>/g) ?? []);
    expect(partnerButtons).toHaveLength(3);
    const byName = (name: string) => partnerButtons.find((b) => b.includes(name))!;
    expect(byName('나루')).toContain('is-selected');
    expect(byName('나루')).toContain('aria-pressed="true"');
    expect(byName('가온')).not.toContain('is-selected');
    expect(byName('다미')).not.toContain('is-selected');
  });

  it('loading 중에만 loadingNote(경과·새로고침 안내)를 렌더한다', () => {
    const note = '0:42 경과 · 보통 1~2분 걸려요. 새로고침하지 마세요.';
    const loadingHtml = renderToStaticMarkup(
      createElement(PlaySeedPanel, { ...baseProps, loading: true, loadingNote: note })
    );
    expect(loadingHtml).toContain('새로고침하지 마세요');
    const idleHtml = renderToStaticMarkup(
      createElement(PlaySeedPanel, { ...baseProps, loading: false, loadingNote: note })
    );
    expect(idleHtml).not.toContain('새로고침하지 마세요');
  });
});
