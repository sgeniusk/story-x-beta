// VsCandidatePanel — 게이지 렌더 순수 검증(경계 B 이점: 클릭 없이 렌더만으로)
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { VsCandidatePanel } from './VsCandidatePanel';
import type { VsCandidate } from '../lib/episodeBriefing';

function render(candidates: VsCandidate[]) {
  return renderToStaticMarkup(
    createElement(VsCandidatePanel, { candidates, onPick: () => {}, onDismiss: () => {} })
  );
}
const cand = (over: Partial<VsCandidate>): VsCandidate => ({
  direction: 'D', probability: 0.3, rarity: 'surprising', ...over
});

describe('VsCandidatePanel', () => {
  it('후보가 없으면 아무것도 렌더하지 않는다', () => {
    expect(render([])).toBe('');
  });
  it('radical 후보는 게이지 3칸을 모두 채운다', () => {
    const html = render([cand({ direction: '문 밖의 낯선 이', rarity: 'radical' })]);
    expect(html).toContain('문 밖의 낯선 이');
    expect((html.match(/dx-vs-bar is-on/g) ?? []).length).toBe(3);
  });
  it('common 후보는 1칸만 채운다', () => {
    const html = render([cand({ rarity: 'common' })]);
    expect((html.match(/dx-vs-bar is-on/g) ?? []).length).toBe(1);
  });
  it('canonSuspect 후보에 「캐논 확인」 배지', () => {
    const html = render([cand({ canonSuspect: true })]);
    expect(html).toContain('캐논 확인');
  });
  it('rarity 색 클래스를 붙인다', () => {
    expect(render([cand({ rarity: 'radical' })])).toContain('dx-vs-radical');
  });
});
