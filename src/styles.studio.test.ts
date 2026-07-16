// 스튜디오 공통 --st-* 토큰(팔레트·모드색·모션)과 셸·PLAY 인터랙션 계약 테스트. spec 2026-07-07 studio-shell-motion-unify.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

describe('Story X studio shared tokens (--st-*)', () => {
  it('전역 warm 팔레트·모드색·모션 스케일 토큰을 정의한다', () => {
    // warm oklch 다크(WRITE .fc-app 승격) — 값 원천은 :root 한 곳
    expect(css).toContain('--st-bg: oklch(');
    expect(css).toContain('--st-ink: oklch(');
    expect(css).toContain('--st-rule: oklch(');
    expect(css).toContain('--st-accent: oklch(');
    // 모드색 — 랜딩 다크 --flow-* 와 같은 값(약속의 일관성)
    expect(css).toContain('--st-mode-play: #a6e22e');
    expect(css).toContain('--st-mode-write: #60a5fa');
    expect(css).toContain('--st-mode-plan: #c4b6ff');
    // 모션 스케일 — duration 3단 + 단일 easing
    expect(css).toContain('--st-dur-fast: 120ms');
    expect(css).toContain('--st-dur-base: 160ms');
    expect(css).toContain('--st-dur-slow: 320ms');
    expect(css).toContain('--st-ease: cubic-bezier(');
  });

  it('.fc-app 로컬 토큰이 --st-* 를 소비한다(미러 드리프트 방지)', () => {
    expect(css).toMatch(/\.fc-app\{[^}]*--bg:\s*var\(--st-bg\)/);
    expect(css).toMatch(/\.fc-app\{[^}]*--ink:\s*var\(--st-ink\)/);
    expect(css).toMatch(/\.fc-app\{[^}]*--accent:\s*var\(--st-accent\)/);
  });

  it('셸 토글 활성 pill 이 모드색을 입고, hover·focus-visible·transition 이 있다', () => {
    expect(css).toMatch(/\.wm-btn\[data-mode='play'\]\.is-active[^}]*--st-mode-play/);
    expect(css).toMatch(/\.wm-btn\[data-mode='write'\]\.is-active[^}]*--st-mode-write/);
    expect(css).toMatch(/\.wm-btn\[data-mode='plan'\]\.is-active[^}]*--st-mode-plan/);
    expect(css).toMatch(/\.wm-btn:hover/);
    expect(css).toMatch(/\.wm-btn:focus-visible/);
    expect(css).toMatch(/\.wm-btn\s*\{[^}]*transition:[^}]*var\(--st-dur-fast\)/);
  });

  it('복구 작업본의 저장 상태·본편 반영 안내는 작은 글씨에서도 읽히는 토큰을 쓴다', () => {
    expect(css).toMatch(/\.fc-recovery-save-line\{[^}]*color:var\(--ink-dim\)/);
    expect(css).toMatch(/\.fc-recovery-impact\{[^}]*color:var\(--ink-dim\)/);
  });

  it('320px 셀에서 제목·모드·최신화 행동을 2행 grid에 배치해 가로 overflow를 막는다', () => {
    expect(css).toMatch(/@media \(max-width: 560px\)\{[\s\S]*?\.wm-bar\{[^}]*display:grid[^}]*grid-template-columns:minmax\(0,1fr\) auto/);
    expect(css).toMatch(/@media \(max-width: 560px\)\{[\s\S]*?\.wm-toggle\{[^}]*grid-column:1\/-1[^}]*width:100%/);
    expect(css).toMatch(/@media \(max-width: 560px\)\{[\s\S]*?\.wm-title-input\{[^}]*min-width:0[^}]*max-width:none/);
    expect(css).toMatch(/@media \(max-width: 560px\)\{[\s\S]*?\.wm-actions\{[^}]*grid-column:2[^}]*max-width:100%/);
    expect(css).toMatch(/@media \(max-width: 560px\)\{[\s\S]*?\.sync-pending\{[^}]*display:none/);
  });

  it('PLAY 표면이 공통 토큰을 소비하고 등장 모션 keyframes 가 있다', () => {
    expect(css).toMatch(/\.dx-desk\s*\{[^}]*var\(--st-bg\)/);
    expect(css).toContain('@keyframes st-rise');
    expect(css).toContain('@keyframes st-fade-in');
    // 버블 등장 모션 + reduced-motion 존중 — 미디어 블록 안에서 .dx-bubble 이 animation: none 으로 리셋되는지 블록 앵커링으로 강제
    expect(css).toMatch(/\.dx-bubble[^}]*animation:[^}]*st-rise/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}?\.dx-bubble[\s\S]{0,400}?animation:\s*none/
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,900}?\.wm-btn[\s\S]{0,400}?transition:\s*none/
    );
  });
});
