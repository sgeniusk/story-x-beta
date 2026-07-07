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
  it('tension arms 후보에 「새 긴장」 배지·is-arms 클래스·title 툴팁', () => {
    const html = render([cand({ tension: 'arms', tensionNote: '죽은 형의 서명이라는 새 질문을 연다' })]);
    expect(html).toContain('새 긴장');
    expect(html).toContain('dx-vs-tension is-arms');
    expect(html).toContain('죽은 형의 서명이라는 새 질문을 연다');
  });
  it('tension drains 후보에 「회수만」 배지', () => {
    const html = render([cand({ tension: 'drains' })]);
    expect(html).toContain('회수만');
    expect(html).toContain('is-drains');
  });
  it('tension 없으면 긴장 배지 무렌더', () => {
    expect(render([cand({})])).not.toContain('dx-vs-tension');
  });
  it('arms+canonSuspect 병기 — 긴장 배지가 캐논 배지 앞(버튼 title=캐논 경고와 배지 title=근거 공존은 의도)', () => {
    const html = render([cand({ tension: 'arms', canonSuspect: true })]);
    expect(html.indexOf('새 긴장')).toBeGreaterThan(-1);
    expect(html.indexOf('새 긴장')).toBeLessThan(html.indexOf('캐논 확인'));
  });
});
