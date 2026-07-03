# 융합 셸 슬라이스 C — 단일 바 셸 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WRITE/PLAN 의 floating pill topbar 를 해체해 wm-bar 하나만 남기고, CTA 는 원고 시트 끝·메타는 하단 줄·출간/내보내기는 ⋯ 메뉴로 재배치한다(spec `docs/superpowers/specs/2026-07-03-fusion-shell-slice-c-single-bar-design.md`).

**Architecture:** `WorkspaceModeBar` 를 슬롯형(titleSlot·contextSlot·planBadge)으로 확장하고, editor stage 에서는 StoryXDesk 가 이 바를 렌더(소유권 역전)한다. WRITE↔PLAN 은 `switchToTrack` 내부 전환(remount 제거, App key 는 `syncVersion` 만). FloatingEditor/FloatingDataWorkspace 의 `.topbar` 를 제거하고 시트 끝 CTA 행 + 하단 `DeskMetaLine` + `OverflowMenu` 로 대체한다.

**Tech Stack:** React 19 + TypeScript + Vitest(jsdom, `createRoot`+`act` 패턴) + vite. 다크 토큰 `.wm-*`/`.fc-*`/`.dm-*`/`.om-*` 스코프 CSS.

**중요 컨텍스트 (실행자가 알아야 할 것)**

- StoryXDesk(3.5k줄)의 `sx-topbar ex-workbar` 헤더(≈2581행~)는 **도달 불가 legacy** — draft/bible/publish 조기 반환(2453·2467·2489행) 뒤라 렌더 안 됨. **이번에 삭제하지 않는다**(editorFocusLayout.test.ts 가 소스 문자열을 단언). legacy 안의 `handleExportProject`·`handleImportClick`·`fileInputRef`·`saveLabel`·회차 픽커 JSX 는 살아 있는 함수/패턴이라 재사용한다.
- `editorFocusLayout.test.ts` 는 **소스 문자열 검사**(readFileSync), `floatingEditor.test.ts`/`floatingDataWorkspace.test.ts` 는 **createRoot 실렌더** 검사다. topbar 제거 시 후자의 출간/데이터탭 테스트가 깨지므로 같은 태스크에서 교정한다.
- 검증 명령 — 단일 파일 `npx vitest run <path>` · 전체 `npm test` · 타입+번들 `npm run build`.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 붙일 것.

---

### Task 1: WorkspaceModeBar 슬롯 확장 (titleSlot·contextSlot·planBadge)

**Files:**
- Modify: `src/components/WorkspaceModeBar.tsx`
- Test: `src/components/workspaceModeBar.test.ts`
- Modify: `src/styles.css` (`.wm-badge`·`.wm-title-input` — `.wm-bar` 기존 블록 근처)

- [ ] **Step 1: 실패하는 테스트 3개 추가**

`src/components/workspaceModeBar.test.ts` describe 블록 끝에 추가.

```ts
  it('titleSlot 이 있으면 workTitle 대신 titleSlot 을 렌더한다 (슬라이스 C)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, {
        mode: 'write' as const,
        onSelect: () => {},
        workTitle: '폴백 제목',
        titleSlot: createElement('input', { className: 'wm-title-input', defaultValue: '편집 가능한 제목' })
      })
    );
    expect(html).toContain('wm-title-input');
    expect(html).not.toContain('폴백 제목');
  });

  it('contextSlot 을 제목 옆에 렌더한다 (회차 픽커/캐논 요약 자리)', () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceModeBar, {
        mode: 'write' as const,
        onSelect: () => {},
        workTitle: 't',
        contextSlot: createElement('span', { className: 'wm-context-chip' }, '3화 · 비 오는 밤')
      })
    );
    expect(html).toContain('wm-context-chip');
    expect(html).toContain('3화 · 비 오는 밤');
  });

  it('planBadge>0 이면 PLAN 버튼에 배지를, 0/미지정이면 렌더하지 않는다', () => {
    const withBadge = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: 't', planBadge: 3 })
    );
    expect(withBadge).toContain('wm-badge');
    expect(withBadge).toContain('>3<');
    const zero = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: 't', planBadge: 0 })
    );
    expect(zero).not.toContain('wm-badge');
    const none = renderToStaticMarkup(
      createElement(WorkspaceModeBar, { mode: 'write' as const, onSelect: () => {}, workTitle: 't' })
    );
    expect(none).not.toContain('wm-badge');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/workspaceModeBar.test.ts`
Expected: 신규 3개 FAIL (titleSlot 등 미구현 — TS 에러 또는 단언 실패), 기존 3개 PASS.

- [ ] **Step 3: 구현**

`src/components/WorkspaceModeBar.tsx` 전체를 다음으로 교체.

```tsx
// 융합 셸 상단 3모드 토글 — PLAY/WRITE/PLAN 을 같은 작품 위에서 왕복. 순수 표현(상태는 props).
import type { ReactNode } from 'react';

export type WorkspaceMode = 'play' | 'write' | 'plan';

interface WorkspaceModeBarProps {
  mode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
  workTitle?: string;
  // 슬라이스 C — 단일 바 슬롯. titleSlot=편집 가능한 제목(있으면 workTitle 대체) ·
  // contextSlot=모드 컨텍스트(WRITE 회차 픽커/PLAN 캐논 요약) · planBadge=캐논 충돌 수(위험 가시성).
  titleSlot?: ReactNode;
  contextSlot?: ReactNode;
  planBadge?: number;
  // 슬라이스 B — 상단 바 우측에 싱크 콘솔 등을 한 줄로 통합(이중 헤더 방지).
  rightSlot?: ReactNode;
}

const MODES: Array<{ id: WorkspaceMode; label: string; icon: string }> = [
  { id: 'play', label: 'PLAY', icon: '▶' },
  { id: 'write', label: 'WRITE', icon: '✎' },
  { id: 'plan', label: 'PLAN', icon: '◈' }
];

export function WorkspaceModeBar({
  mode,
  onSelect,
  workTitle,
  titleSlot,
  contextSlot,
  planBadge,
  rightSlot
}: WorkspaceModeBarProps) {
  return (
    <div className="wm-bar">
      {titleSlot ?? (workTitle ? <span className="wm-title">{workTitle}</span> : null)}
      {contextSlot}
      <div className="wm-toggle">
        {MODES.map((m) => (
          <button
            key={m.id}
            data-mode={m.id}
            className={`wm-btn${mode === m.id ? ' is-active' : ''}`}
            onClick={() => onSelect(m.id)}
          >
            {m.icon} {m.label}
            {m.id === 'plan' && planBadge ? <span className="wm-badge">{planBadge}</span> : null}
          </button>
        ))}
      </div>
      {rightSlot}
    </div>
  );
}
```

`src/styles.css` 의 기존 `.wm-` 블록(`.wm-bar` 정의 근처를 `grep -n "\.wm-bar" src/styles.css` 로 찾기) 바로 아래에 추가.

```css
/* 슬라이스 C — 단일 바 슬롯 */
.wm-title-input{background:transparent;border:none;color:inherit;font:inherit;font-weight:600;min-width:60px;max-width:220px;padding:2px 4px;border-radius:6px}
.wm-title-input:hover,.wm-title-input:focus{background:rgba(255,255,255,.05);outline:none}
.wm-badge{margin-left:5px;padding:0 6px;border-radius:9px;background:#f87171;color:#17181d;font-size:10px;font-weight:700;line-height:1.5}
.wm-context-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border:1px solid rgba(255,255,255,.1);border-radius:6px;font-size:11px;color:rgba(237,237,243,.6);white-space:nowrap}
.wm-conflict-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border:1px solid rgba(248,113,113,.5);border-radius:6px;background:transparent;font-size:11px;color:#fca5a5;cursor:pointer;white-space:nowrap}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/workspaceModeBar.test.ts`
Expected: 6개 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/WorkspaceModeBar.tsx src/components/workspaceModeBar.test.ts src/styles.css
git commit -m "feat(shell): WorkspaceModeBar 슬롯 확장 — titleSlot·contextSlot·planBadge (슬라이스 C)"
```

---

### Task 2: DeskMetaLine 신규 (하단 메타 줄)

**Files:**
- Create: `src/components/DeskMetaLine.tsx`
- Test: `src/components/deskMetaLine.test.ts` (신규)
- Modify: `src/styles.css`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/deskMetaLine.test.ts` 신규.

```ts
// 하단 메타 줄 — 좌(문단·글자수/캐논 요약) · 우(저장·AI) 렌더 계약 (슬라이스 C).
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DeskMetaLine } from './DeskMetaLine';

describe('DeskMetaLine', () => {
  it('left 텍스트와 rightSlot 을 dm-line 안에 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DeskMetaLine, {
        left: '12문단 · 2,840자',
        rightSlot: createElement('span', { className: 'dm-save' }, '저장됨')
      })
    );
    expect(html).toContain('dm-line');
    expect(html).toContain('12문단 · 2,840자');
    expect(html).toContain('저장됨');
  });

  it('rightSlot 이 없어도 안전하다', () => {
    const html = renderToStaticMarkup(createElement(DeskMetaLine, { left: '캐논 27 · 떡밥 4' }));
    expect(html).toContain('캐논 27 · 떡밥 4');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/deskMetaLine.test.ts`
Expected: FAIL — `Cannot find module './DeskMetaLine'`.

- [ ] **Step 3: 구현**

`src/components/DeskMetaLine.tsx` 신규.

```tsx
// 하단 얇은 메타 줄 — 좌(문단·글자수/캐논 요약)·우(저장 상태·AI 배지). 순수 표현(슬라이스 C epilogue 재배치).
import type { ReactNode } from 'react';

interface DeskMetaLineProps {
  left: string;
  rightSlot?: ReactNode;
}

export function DeskMetaLine({ left, rightSlot }: DeskMetaLineProps) {
  return (
    <div className="dm-line">
      <span className="dm-left">{left}</span>
      <span className="dm-right">{rightSlot}</span>
    </div>
  );
}
```

`src/styles.css` 끝쪽(Task 1 이 추가한 `.wm-*` 블록 아래)에 추가.

```css
/* 슬라이스 C — 하단 메타 줄. 중앙은 비워 dock pill 과 충돌하지 않는다 */
.dm-line{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:4px 14px;font-size:11px;color:rgba(237,237,243,.5);pointer-events:none}
.dm-line .dm-right{display:inline-flex;align-items:center;gap:8px;pointer-events:auto}
.dm-line .dm-save[data-state='dirty']{color:#fbbf24}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/deskMetaLine.test.ts`
Expected: 2개 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/DeskMetaLine.tsx src/components/deskMetaLine.test.ts src/styles.css
git commit -m "feat(shell): DeskMetaLine 하단 메타 줄 — epilogue 풍 재배치 토대 (슬라이스 C)"
```

---

### Task 3: OverflowMenu 신규 (⋯ 수납 메뉴)

**Files:**
- Create: `src/components/OverflowMenu.tsx`
- Test: `src/components/overflowMenu.test.ts` (신규)
- Modify: `src/styles.css`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/overflowMenu.test.ts` 신규.

```ts
// ⋯ 수납 메뉴 스모크 — 토글로 열리고 항목 onSelect 배선 (슬라이스 C).
import { describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { OverflowMenu, type OverflowMenuItem } from './OverflowMenu';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(items: OverflowMenuItem[]) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(OverflowMenu, { items })); });
  return {
    host,
    click: (el: Element | null) => act(() => { el?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }),
    unmount: () => { act(() => root.unmount()); host.remove(); },
  };
}

describe('OverflowMenu', () => {
  it('닫힌 상태에선 메뉴 미렌더, ⋯ 클릭 시 항목을 렌더한다', () => {
    const { host, click, unmount } = mount([{ id: 'publish', label: '출간', onSelect: vi.fn() }]);
    expect(host.querySelector('.om-menu')).toBeNull();
    click(host.querySelector('.om-toggle'));
    expect(host.querySelector('.om-menu')).not.toBeNull();
    expect(host.textContent).toContain('출간');
    unmount();
  });

  it('항목 클릭 시 onSelect 를 호출하고 메뉴를 닫는다', () => {
    const onSelect = vi.fn();
    const { host, click, unmount } = mount([{ id: 'export', label: 'JSON 내보내기', onSelect }]);
    click(host.querySelector('.om-toggle'));
    click(host.querySelector('[data-item="export"]'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.om-menu')).toBeNull();
    unmount();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/overflowMenu.test.ts`
Expected: FAIL — `Cannot find module './OverflowMenu'`.

- [ ] **Step 3: 구현**

`src/components/OverflowMenu.tsx` 신규.

```tsx
// 상단 바 우측 ⋯ 메뉴 — 출간·JSON 내보내기/가져오기 등 저빈도 액션 수납(슬라이스 C 미니멀 재배치).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface OverflowMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  /** 메뉴와 함께 렌더할 숨은 요소 — 예: 가져오기 hidden file input. */
  children?: ReactNode;
}

export function OverflowMenu({ items, children }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <div className="om-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`om-toggle${isOpen ? ' is-open' : ''}`}
        aria-label="더 보기"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((v) => !v)}
      >
        ⋯
      </button>
      {isOpen && (
        <div className="om-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-item={item.id}
              onClick={() => {
                item.onSelect();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
```

`src/styles.css` 에 추가.

```css
/* 슬라이스 C — ⋯ 수납 메뉴 */
.om-wrap{position:relative;display:inline-flex}
.om-toggle{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:transparent;color:rgba(237,237,243,.7);font-size:15px;cursor:pointer}
.om-toggle:hover,.om-toggle.is-open{background:rgba(255,255,255,.06)}
.om-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:60;min-width:150px;display:flex;flex-direction:column;padding:5px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#17181d;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.om-menu button{display:block;width:100%;text-align:left;padding:7px 10px;border:none;border-radius:6px;background:transparent;color:rgba(237,237,243,.85);font-size:12px;cursor:pointer}
.om-menu button:hover{background:rgba(255,255,255,.07)}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/overflowMenu.test.ts`
Expected: 2개 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/OverflowMenu.tsx src/components/overflowMenu.test.ts src/styles.css
git commit -m "feat(shell): OverflowMenu ⋯ 수납 메뉴 — 출간·내보내기 수납 토대 (슬라이스 C)"
```

---

### Task 4: FloatingEditor — topbar 해체 · 시트 끝 CTA · 메타 줄

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (topbar 제거 ≈446~511행, props 정리, `.fc-sheet-cta`, DeskMetaLine)
- Modify: `src/components/floatingEditor.test.ts` (출간/데이터탭 테스트 교체, baseProps 정리, 신규 단언)
- Modify: `src/styles.css`

- [ ] **Step 1: 테스트 교정 + 신규 단언 (RED)**

`src/components/floatingEditor.test.ts` 수정 —

1. `baseProps` 에서 `title: '샘플 작품', episodeLabel: '1화',` 와 `onSwitchTrack: vi.fn(), onOpenPublish: vi.fn(),` 4개 필드를 삭제.
2. `'출간 버튼이 onOpenPublish 를 호출한다 (우상단 단일 버튼)'` 테스트와 `'데이터 탭이 onSwitchTrack(bible) 를 호출한다'` 테스트를 **삭제**하고 그 자리에 다음을 추가.

```ts
  it('pill topbar 를 렌더하지 않는다 — 단일 바 셸 (슬라이스 C)', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.topbar')).toBeNull();
    expect(host.querySelector('.btn-publish')).toBeNull();
    expect(host.querySelector('[role="tab"]')).toBeNull();
    unmount();
  });

  it('메인 CTA 가 원고 시트 끝 .fc-sheet-cta 안에 있다 (슬라이스 C)', () => {
    const onGenerateDraft = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onGenerateDraft }));
    const cta = host.querySelector('.sheet .fc-sheet-cta .btn-primary');
    expect(cta).not.toBeNull();
    click(cta);
    expect(onGenerateDraft).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('하단 메타 줄이 문단 수·charCount 를 렌더한다 (슬라이스 C)', () => {
    const { host, unmount } = mount(baseProps());
    const meta = host.querySelector('.dm-line');
    expect(meta).not.toBeNull();
    expect(meta?.textContent).toContain('2문단');
    expect(meta?.textContent).toContain('1,284자');
    unmount();
  });
```

주의 — 기존 `'초안 생성 버튼이 onGenerateDraft 를 호출한다'`(`.btn-primary`)와 `'[다음회차] canConfirmLock …'`(텍스트 '이 회차 확정') 테스트는 **삭제하지 않는다**. CTA 행이 같은 클래스/텍스트를 승계해 그대로 통과해야 한다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: 신규 3개 FAIL(topbar 존재·fc-sheet-cta 부재·dm-line 부재) + baseProps 필드 삭제로 인한 TS 에러 없음(FloatingEditorProps 가 아직 title 등을 요구하므로 **이 시점엔 tsc 에러가 정상** — Step 3 구현과 함께 해소).

- [ ] **Step 3: 구현**

`src/components/FloatingEditor.tsx` —

1. **props 정리** — interface 와 함수 시그니처(destructuring)에서 `title`·`episodeLabel`·`onSwitchTrack`·`onOpenPublish` 4개 제거. interface 에 추가:

```ts
  /** 슬라이스 C — 하단 메타 줄 우측(저장 상태·AI 배지). StoryXDesk 가 주입. */
  metaRightSlot?: ReactNode;
```

`import type { ReactNode } from 'react'` 가 없으면 기존 react import 에 추가. 상단에 `import { DeskMetaLine } from './DeskMetaLine';` 추가.

2. **topbar 제거** — `<header className="topbar">…</header>` 블록(브랜드 X·doc-id·saved·modes 탭·btn-publish·btn-confirm-lock·btn-primary 전부, ≈449~511행) 삭제. 바로 아래 `<button className="exitfocus">…` 는 유지.

3. **시트 끝 CTA 행** — `<article className="sheet" ref={sheetRef}>` 의 닫는 `</article>` 직전에 추가(마지막 자식).

```tsx
            {/* 슬라이스 C — 메인 CTA 는 원고 흐름 끝(문서형). pill topbar 해체의 대체 동선 */}
            <div className="fc-sheet-cta">
              <button
                className={`btn-primary${isGenerating ? ' is-generating' : ''}`}
                onClick={() => (onGenerateDraft ? onGenerateDraft() : toast('초안 생성 — 데모에서는 본문이 채워져 있습니다'))}
                disabled={isGenerating || Boolean(productionBlockedReason)}
                aria-busy={isGenerating}
                title={productionBlockedReason}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5z" />
                </svg>
                <span>{isGenerating ? '생성 중…' : productionBlockedReason ? '헌장 잠금 필요' : mainActionLabel}</span>
              </button>
              {canConfirmLock && (
                <button
                  className="btn-confirm-lock"
                  onClick={() => onConfirmLock?.()}
                  title="검토 후 확정을 권장합니다 — 확정하면 이 회차가 잠기고 다음 회차로 넘어갑니다."
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  <span>{lockLabel}</span>
                </button>
              )}
            </div>
```

4. **하단 메타 줄** — 컴포넌트 루트 div(`fc-app`)의 닫는 태그 직전(scrim 근처)에 추가.

```tsx
      <DeskMetaLine left={`${paragraphs.length}문단 · ${charCount}`} rightSlot={metaRightSlot} />
```

5. **CSS** — `src/styles.css` 에 추가. 기존 `.fc-app .topbar .btn-primary`/`.btn-confirm-lock`/`.btn-publish` 규칙을 `grep -n "btn-primary\|btn-confirm-lock\|btn-publish" src/styles.css` 로 찾아, `.topbar` 스코프에 묶여 있으면 **버튼 시각 선언을 복제**해 아래 스코프로 옮긴다(색·패딩 토큰은 기존 값 그대로 사용 — 아래는 기존 토큰이 없을 때의 기본값).

```css
/* 슬라이스 C — 원고 시트 끝 CTA 행 */
.fc-sheet-cta{display:flex;align-items:center;gap:10px;margin-top:30px;padding-top:18px;border-top:1px dashed var(--rule-soft,rgba(255,255,255,.1))}
.fc-sheet-cta .btn-primary{display:inline-flex;align-items:center;gap:7px}
.fc-sheet-cta .btn-primary svg{width:15px;height:15px}
.fc-sheet-cta .btn-confirm-lock{display:inline-flex;align-items:center;gap:7px}
.fc-sheet-cta .btn-confirm-lock svg{width:14px;height:14px}
```

또한 `.fc-app.focus .docks,.fc-app.focus .topbar{…}` 규칙에서 `.topbar` 셀렉터는 대상이 사라졌으므로 그대로 둬도 무해 — 수정하지 않는다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts && npx tsc --noEmit`
Expected: floatingEditor 테스트 전부 PASS. tsc 는 **StoryXDesk 쪽 에러가 남을 수 있음**(floatingEditorProps 가 아직 title 등을 전달 — spread 라 excess 체크 미적용이면 통과. 에러가 나면 Task 6 에서 정리할 4개 필드를 이 시점에 floatingEditorProps 에서 먼저 삭제한다 — `title:`·`episodeLabel:`·`onSwitchTrack:`·`onOpenPublish:` 줄 4개, `StoryXDesk.tsx:1415~1416·1445~1446`).

- [ ] **Step 5: editorFocusLayout 소스 단언 확인**

Run: `npx vitest run src/editorFocusLayout.test.ts`
Expected: 전부 PASS (F-002 `mainActionLabel`·A-2 `productionBlockedReason`·다음회차 `canConfirmLock &&`/`btn-confirm-lock` 단언은 CTA 행이 승계).

- [ ] **Step 6: 커밋**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts src/styles.css src/StoryXDesk.tsx
git commit -m "feat(shell): FloatingEditor pill topbar 해체 — 시트 끝 CTA·하단 메타 줄 (슬라이스 C)"
```

---

### Task 5: FloatingDataWorkspace — topbar 해체 · 메타 줄

**Files:**
- Modify: `src/components/FloatingDataWorkspace.tsx` (topbar ≈98~119행 제거, props 정리)
- Modify: `src/components/floatingDataWorkspace.test.ts`

- [ ] **Step 1: 테스트 교정 + 신규 단언 (RED)**

`src/components/floatingDataWorkspace.test.ts` 수정 —

1. `baseProps` 에서 `title`·`episodeLabel`·`onSwitchTrack`·`onOpenPublish` 4개 필드 삭제.
2. `'데이터 탭이 활성이고 편집 탭이 onSwitchTrack(draft) 를 호출한다'` 테스트와 `.btn-publish` 클릭 테스트(≈72~85행)를 삭제하고 다음으로 교체.

```ts
  it('pill topbar 를 렌더하지 않고 하단 메타 줄을 렌더한다 (슬라이스 C)', () => {
    const { host, unmount } = mount(baseProps({ metaLeft: '캐논 1 · 떡밥 0' }));
    expect(host.querySelector('.topbar')).toBeNull();
    expect(host.querySelector('.btn-publish')).toBeNull();
    const meta = host.querySelector('.dm-line');
    expect(meta).not.toBeNull();
    expect(meta?.textContent).toContain('캐논 1 · 떡밥 0');
    unmount();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/floatingDataWorkspace.test.ts`
Expected: 신규 1개 FAIL(topbar 존재·metaLeft 프롭 부재 TS 에러).

- [ ] **Step 3: 구현**

`src/components/FloatingDataWorkspace.tsx` —

1. interface 에서 `title`·`episodeLabel`·`onSwitchTrack`·`onOpenPublish` 제거, 추가:

```ts
  /** 슬라이스 C — 하단 메타 줄. metaLeft=캐논·떡밥 요약, metaRightSlot=저장 상태 등. */
  metaLeft?: string;
  metaRightSlot?: ReactNode;
```

2. `<header className="topbar">…</header>` 블록(98~119행) 삭제. `exitfocus` 버튼 유지.
3. 상단 import 에 `import { DeskMetaLine } from './DeskMetaLine';` 추가.
4. 루트 div 닫는 태그 직전(scrim 다음)에 추가.

```tsx
      <DeskMetaLine left={props.metaLeft ?? ''} rightSlot={props.metaRightSlot} />
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/floatingDataWorkspace.test.ts && npx tsc --noEmit`
Expected: 테스트 PASS. tsc 에러가 나면 StoryXDesk 렌더 사이트(≈2526행)에서 `title=`·`episodeLabel=`·`onSwitchTrack=`·`onOpenPublish=` 4개 프롭 줄을 먼저 삭제(정식 배선은 Task 6).

- [ ] **Step 5: 커밋**

```bash
git add src/components/FloatingDataWorkspace.tsx src/components/floatingDataWorkspace.test.ts src/StoryXDesk.tsx
git commit -m "feat(shell): FloatingDataWorkspace pill topbar 해체 — 하단 메타 줄 (슬라이스 C)"
```

---

### Task 6: StoryXDesk — 단일 바 배선 (소유권 역전 + 내부 전환)

**Files:**
- Modify: `src/StoryXDesk.tsx` (props 인터페이스 ≈564행 · draft 반환 ≈2467행 · bible 반환 ≈2489행 · floatingEditorProps ≈1413행 · FloatingDataWorkspace 렌더 ≈2526행)

이 태스크는 렌더 조립이라 TDD 대신 tsc+기존 스위트+라이브(Task 8)로 검증한다(프로젝트 관례 — 조립은 tsc+라이브).

- [ ] **Step 1: 신규 props**

`StoryXDeskProps` interface(`initialStudioView` 있는 곳, ≈564행)에 추가.

```ts
  /** 슬라이스 C — App 이 주는 싱크 콘솔(⟳최신화). 단일 바 우측에 합성. */
  syncSlot?: ReactNode;
  /** 슬라이스 C — PLAY 토글 → App stage 전환. */
  onSelectPlayMode?: () => void;
  /** 슬라이스 C — WRITE↔PLAN 내부 전환을 App state 에 동기화(⟳최신화 remount 후 복원용). */
  onStudioViewChange?: (view: 'editor' | 'data') => void;
```

함수 시그니처 destructuring(≈590행)에 `syncSlot`·`onSelectPlayMode`·`onStudioViewChange` 추가. 상단 import 에 `import { WorkspaceModeBar } from './components/WorkspaceModeBar';`·`import { OverflowMenu } from './components/OverflowMenu';` 추가(`ReactNode` type import 확인).

- [ ] **Step 2: 단일 바 요소 구성**

조기 반환들(≈2453행) 직전에 추가.

```tsx
  // 슬라이스 C — 단일 바(소유권 역전). WRITE↔PLAN 은 switchToTrack 내부 전환(remount 없음),
  // PLAY 는 App stage 전환. 슬롯 = 제목 input·회차 픽커/캐논 요약·⚠충돌 칩·싱크 콘솔·⋯ 메뉴.
  const writeContext =
    isSerial && project.chapters.length > 0 && latestChapter ? (
      <span className="wm-context-chip" role="group" aria-label="회차 이동">
        <button
          type="button"
          className="ex-chapter-picker-step"
          aria-label="이전 회차"
          disabled={!hasPrevChapter}
          onClick={() => stepChapter(-1)}
        >
          <ChevronLeft size={12} aria-hidden="true" />
        </button>
        <span>{latestChapter.episode}화 · {latestChapter.title}</span>
        <button
          type="button"
          className="ex-chapter-picker-step"
          aria-label="다음 회차"
          disabled={!hasNextChapter}
          onClick={() => stepChapter(1)}
        >
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      </span>
    ) : null;
  const planContext = (
    <>
      <span className="wm-context-chip">캐논 {project.canonFacts.length}</span>
      {bibleAlertCount > 0 && (
        <button type="button" className="wm-conflict-chip" onClick={() => openBibleSection('approval')}>
          ⚠ 충돌 {bibleAlertCount}
        </button>
      )}
    </>
  );
  const overflowItems = [
    {
      id: 'publish',
      label: '출간',
      onSelect: () => (onOpenPublish ? onOpenPublish() : openPublishingMode())
    },
    { id: 'export', label: 'JSON 내보내기', onSelect: handleExportProject },
    { id: 'import', label: 'JSON 가져오기', onSelect: handleImportClick }
  ];
  const workspaceModeBar = (
    <WorkspaceModeBar
      mode={activeTrack === 'bible' ? 'plan' : 'write'}
      onSelect={(next) => {
        if (next === 'play') {
          onSelectPlayMode?.();
          return;
        }
        switchToTrack(next === 'plan' ? 'bible' : 'draft');
        onStudioViewChange?.(next === 'plan' ? 'data' : 'editor');
      }}
      titleSlot={
        <input
          className="wm-title-input"
          aria-label="작품 제목"
          value={project.title}
          onChange={(event) => updateProject('title', event.target.value)}
          autoComplete="off"
          title="클릭해서 제목 편집"
        />
      }
      contextSlot={activeTrack === 'bible' ? planContext : writeContext}
      planBadge={bibleAlertCount}
      rightSlot={
        <>
          {syncSlot}
          <OverflowMenu items={overflowItems}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </OverflowMenu>
        </>
      }
    />
  );
  const metaRightSlot = (
    <>
      <span className="dm-save" data-state={editedSinceReview ? 'dirty' : 'synced'}>
        {saveLabel}
      </span>
      <AiStatusBadge />
    </>
  );
```

주의 — `hasPrevChapter`·`hasNextChapter`·`stepChapter`·`ChevronLeft`·`ChevronRight`·`openBibleSection`·`fileInputRef`·`handleImportFile`·`handleExportProject`·`handleImportClick`·`saveLabel`·`editedSinceReview`·`AiStatusBadge`·`bibleAlertCount` 는 전부 legacy 블록이 쓰는 **기존 심볼** — 새로 만들지 말고 재사용. legacy return 안의 hidden input 은 렌더되지 않으므로 ref 충돌 없음.

- [ ] **Step 3: 조기 반환에 바 주입 + props 정리**

1. draft 반환(≈2467행)을 감싼다.

```tsx
  if (isDraftMode) {
    return (
      <>
        {workspaceModeBar}
        <FloatingEditor {...floatingEditorProps} />
        {/* …기존 CommandPalette 그대로… */}
      </>
    );
  }
```

(기존에 이미 fragment 라 `{workspaceModeBar}` 한 줄만 첫 자식으로 추가.)

2. bible 반환(≈2525행)의 `return (<FloatingDataWorkspace …/>)` 를 fragment 로 감싸 첫 자식에 `{workspaceModeBar}` 추가.
3. `floatingEditorProps`(≈1413행)에서 `title:`·`episodeLabel:`·`onSwitchTrack:`·`onOpenPublish:` 4줄 삭제(Task 4 Step 4 에서 이미 했다면 스킵), `metaRightSlot,` 추가. useMemo deps 에 `editedSinceReview`·`saveLabel` 관련 값이 없으면 `editedSinceReview` 추가(메타 줄 저장 상태 갱신).
4. `FloatingDataWorkspace` 렌더(≈2526행)에서 `title=`·`episodeLabel=`·`onSwitchTrack=`·`onOpenPublish=` 삭제(Task 5 Step 4 에서 했다면 스킵), 추가 —

```tsx
        metaLeft={`캐논 ${project.canonFacts.length} · 떡밥 ${project.openThreads.length}`}
        metaRightSlot={metaRightSlot}
```

- [ ] **Step 4: 게이트**

Run: `npx tsc --noEmit && npm test`
Expected: 전부 녹색 (editorFocusLayout 의 legacy 소스 단언은 legacy 미삭제라 통과).

- [ ] **Step 5: 커밋**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(shell): StoryXDesk 단일 바 배선 — 소유권 역전·내부 트랙 전환·⋯ 메뉴 (슬라이스 C)"
```

---

### Task 7: App — editor stage 바 렌더 제거 · key 축소

**Files:**
- Modify: `src/App.tsx` (editor stage ≈302~325행)

- [ ] **Step 1: 구현**

`src/App.tsx` editor stage 를 다음으로 교체(dive stage 는 무변경).

```tsx
  if (stage === 'editor') {
    return (
      <>
        <StoryXDesk
          key={syncVersion}
          initialMedium={medium}
          initialFormat={format}
          initialDraftPayload={pendingDraft}
          initialStudioView={studioView}
          syncSlot={<SyncConsole pending={pendingSync} onReconcile={reconcileSync} />}
          onSelectPlayMode={() => selectWorkspaceMode('play')}
          onStudioViewChange={setStudioView}
          onOpenProjects={() => setStage('projects')}
          onOpenLanding={() => setStage('landing')}
          onOpenPublish={() => setStage('publish')}
        />
        {reconcileDialog}
        {syncFlashNode}
      </>
    );
  }
```

`WorkspaceModeBar` import 는 dive stage 가 계속 쓰므로 유지. `workspaceMode` 변수(≈242행)도 dive 용으로 유지 — 단 editor 에서 안 쓰이게 되므로 lint/tsc 미사용 경고가 없는지 확인.

- [ ] **Step 2: 게이트**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: 전부 녹색.

- [ ] **Step 3: 커밋**

```bash
git add src/App.tsx
git commit -m "feat(shell): App editor stage 단일 바 위임 — key=syncVersion 축소·studioView remount 제거 (슬라이스 C)"
```

---

### Task 8: 라이브 런칭 게이트 + 문서 갱신

**Files:**
- Modify: `progress.md` (활성 트랙 절 추가 + 최근 검증 갱신)
- Modify: `session-handoff.md` (맨 위 인계 노트 추가)

- [ ] **Step 1: 라이브 검증 (preview 도구)**

dev 서버(`.claude/launch.json` 의 `storyx-dev`)로 `?stage=editor` 진입 후 spec §6 런칭 게이트 확인 —

1. 상단 크롬이 wm-bar 하나(`document.querySelector('.fc-app .topbar') === null`·`.wm-bar` 1개).
2. WRITE↔PLAN 토글 왕복 — remount 깜빡임 없이 페이드 전환, 편집 중 본문 유지.
3. 시트 끝 `.fc-sheet-cta` 초안 생성 버튼 동작(빈 원고에서 즉시 보임).
4. ⋯ 메뉴 — 출간 진입·JSON 내보내기 다운로드·가져오기 파일 선택창.
5. 캐논 충돌 데이터 주입 시 PLAN 토글 배지 + PLAN contextSlot ⚠칩 → 클릭 시 승인 대기 진입.
6. PLAY 전환·복귀 + `⟳최신화`(syncVersion remount) 후 현재 뷰 복원.
7. 하단 `.dm-line` — WRITE 문단·글자수·저장됨·AI 배지 / PLAN 캐논·떡밥.
8. 콘솔 에러 0. `harness-verifier` 에이전트로 오버플로/겹침 검사.

- [ ] **Step 2: progress.md·session-handoff.md 갱신**

progress.md 맨 위 헤더 라인과 "최근 검증" 갱신 + "활성 트랙 — 융합 셸 슬라이스 C" 절 추가(구현·검증·범위 밖). session-handoff.md 맨 위에 인계 노트(한 것/손대지 말 것 불변식/다음 한 가지) 추가. 불변식 후보 — "wm-bar 는 editor 에서 StoryXDesk 소유(App 은 dive 만)" · "key=syncVersion 만(⟳최신화 remount 불변식)" · "충돌 배지·싱크 콘솔 가시성".

- [ ] **Step 3: 최종 게이트 + 커밋**

```bash
bash init.sh
git add progress.md session-handoff.md
git commit -m "docs: 슬라이스 C 완료 기록 — progress·handoff 갱신"
```

---

## Self-Review 결과 (계획 작성 후 점검)

- **Spec 커버리지** — §4.1(Task 1)·§4.2/4.3(Task 6·7)·§4.4(Task 4)·§4.5(Task 5)·§4.6(Task 2)·§4.7(Task 3)·§6 게이트(Task 8). 누락 없음.
- **타입 일관성** — `metaRightSlot`(FloatingEditor·FloatingDataWorkspace 동명)·`OverflowMenuItem`·`syncSlot`/`onSelectPlayMode`/`onStudioViewChange` 명칭이 태스크 간 일치.
- **주의** — Task 4/5 의 Step 4 에 있는 "tsc 에러 시 StoryXDesk 프롭 선삭제" 지시는 태스크 간 순서 유연성을 위한 것 — Task 6 의 해당 스텝은 "이미 했다면 스킵"으로 명시함.
