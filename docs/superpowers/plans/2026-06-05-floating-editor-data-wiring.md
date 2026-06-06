# 방향 C 플로팅 에디터 — 실데이터 배선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `?editor=floating` 을 시안 데이터가 아니라 실제 원고·작가진 검토·5 페르소나로 동작하는 프리뷰로 만든다(StoryXDesk 가 여전히 기본 편집기).

**Architecture:** 접근 A — StoryXDesk 가 자기 `editorText`·`useMarginReview()`·`CORE_PERSONAS`·`beats` 를 props 로 넘겨 `<FloatingEditor>` 를 렌더. FloatingEditor 는 시안 상수를 버리고 순수 표현 컴포넌트로 강등. App.tsx 의 standalone 우회 분기는 제거.

**Tech Stack:** React 18.3 + TypeScript + Vite + Vitest(jsdom). 신규 의존성 없음(렌더 테스트는 `react-dom/client` + `react`의 `act`).

**스펙:** `docs/superpowers/specs/2026-06-05-floating-editor-data-wiring-design.md`

**확정 타입(단일 진실원천, 추측 금지):**
- `src/lib/marginReview.ts` — `Paragraph { id: string; text: string }`, `InlineDiff { paragraph: string; from: string; to: string }`, `MarginReview { persona; anchor: string; severity: 'block'|'suggest'|'note'; head: string; body: string; diffs: InlineDiff[]; pending?: boolean }`, `SEVERITY_LABEL`, `SummonHandler`.
- `src/lib/extendedPersonas.ts` — `PersonaCard { id; name; role; tint; isCore }`, `CORE_PERSONAS`(5), `findPersona`.
- `src/StoryXDesk.tsx` — 스코프 내 심볼: `editorText`(568), `marginParagraphs`(975), `marginReview`(1152, `.reviews/.onSummon/.onRunAll/.onRejectReview`), `acceptMarginDiff`(1179), `selectBeat(beat)`(1441), `activeBeatId`(605), `draftPrompt`(567), `latestChapter`(572), `isDraftMode`/`isFocusMode`, `project`, `chapterCharCount`(949), main `return (` at 1950.

---

## Task 1: FloatingEditor 실데이터 렌더 테스트 (RED)

**Files:**
- Create: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// 방향 C 플로팅 에디터가 시안 상수가 아니라 props 의 실데이터로 렌더·콜백하는지 검증.
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FloatingEditor, type FloatingEditorProps } from './FloatingEditor';
import { CORE_PERSONAS } from '../lib/extendedPersonas';
import type { MarginReview, Paragraph } from '../lib/marginReview';

const paragraphs: Paragraph[] = [
  { id: 'p1', text: '필사관은 잉크가 마르기 전에 한 줄을 더 고쳤다. 고친 기억은 늘 그렇듯 매끄러웠다.' },
  { id: 'p2', text: '탑은 이름을 받고 움직였다. 한 층을 오를 때마다 사람들은 이름을 한 글자씩 내려놓았다.' },
];

const reviews: MarginReview[] = [
  { persona: 'showrunner', anchor: 'p1', severity: 'note', head: '훅', body: '마지막 줄이 다음 회차 훅으로 좋습니다.', diffs: [] },
  {
    persona: 'genre-stylist', anchor: 'p2', severity: 'suggest', head: '리듬',
    body: '만연체 한 곳만 끊어 주세요.',
    diffs: [{ paragraph: 'p2', from: '한 글자씩 내려놓았다', to: '한 글자씩 잃었다' }],
  },
];

function baseProps(over: Partial<FloatingEditorProps> = {}): FloatingEditorProps {
  return {
    title: '샘플 작품', episodeLabel: '1화', kicker: '장편소설 · 1화',
    charCount: '1,284자', chapterTitle: '이름을 빌리는 자', chapterSub: '필사관 이야기.',
    paragraphs, reviews, personas: CORE_PERSONAS,
    onSummon: vi.fn(), onRunAll: vi.fn(), onAcceptDiff: vi.fn(), onRejectReview: vi.fn(),
    beats: [], onSelectBeat: vi.fn(),
    stats: { chars: 1284, chapters: 1, canon: 3, characters: 3 },
    intentMemo: '모순으로 1화를 연다.',
    ...over,
  };
}

function mount(props: FloatingEditorProps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(FloatingEditor, props)); });
  return {
    host,
    unmount: () => act(() => root.unmount()),
    click: (el: Element | null) => act(() => {
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }),
  };
}

describe('FloatingEditor 실데이터 배선', () => {
  it('시안 상수를 코드에서 제거한다', () => {
    const src = readFileSync(resolve(__dirname, 'FloatingEditor.tsx'), 'utf8');
    expect(src).not.toContain('SAMPLE_PERSONAS');
    expect(src).not.toContain('SAMPLE_REVIEWS');
    expect(src).not.toContain('SAMPLE_BODY');
  });

  it('props.reviews 만큼 여백 주석을 렌더하고 persona 이름은 props 에서 온다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelectorAll('.mnote').length).toBe(2);
    expect(host.textContent).toContain('쇼러너');          // CORE_PERSONAS 라벨
    expect(host.textContent).toContain('장르 스타일리스트'); // 시안 '문체 담당' 아님
    unmount();
  });

  it('전체 검토 버튼이 onRunAll 을 호출한다', () => {
    const onRunAll = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onRunAll }));
    click(host.querySelector('.assignAll'));
    expect(onRunAll).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('빈 reviews·빈 paragraphs 에서도 안전하다', () => {
    const { host, unmount } = mount(baseProps({ reviews: [], paragraphs: [] }));
    expect(host.querySelectorAll('.mnote').length).toBe(0);
    unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — `FloatingEditor` 가 아직 `paragraphs/reviews/personas/...` props 를 받지 않고 `SAMPLE_*` 상수를 포함(첫 테스트의 `not.toContain` 실패 + 타입/렌더 실패).

- [ ] **Step 3: Commit (RED 고정)**

```bash
git add src/components/floatingEditor.test.ts
git commit -m "test(editor): FloatingEditor 실데이터 배선 RED — props·콜백·시안제거 단언"
```

---

## Task 2: FloatingEditor 를 props-driven 으로 리팩터 (GREEN)

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (시안 상수 제거 + props 배선)

- [ ] **Step 1: props 인터페이스 교체**

`FloatingEditorProps` 를 아래로 교체(기존 헤더 메타 props 는 유지 + 데이터 props 추가). 파일 상단 import 에 실타입 추가.

```ts
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { MarginReview, InlineDiff, Paragraph, PersonaCard, SummonHandler } from '../lib/marginReview';
import { SEVERITY_LABEL } from '../lib/marginReview';

interface ChapterBeatLike { id: string; no?: string | number; name?: string; label?: string; summary?: string }

export interface FloatingEditorProps {
  title: string; episodeLabel: string; kicker: string;
  charCount: string; chapterTitle: string; chapterSub: string;
  paragraphs: Paragraph[];
  reviews: MarginReview[];
  personas: PersonaCard[];
  onSummon: SummonHandler;
  onRunAll: () => void;
  onAcceptDiff: (diff: InlineDiff) => void;
  onRejectReview: (review: MarginReview) => void;
  beats: ChapterBeatLike[];
  activeBeatId?: string | null;
  onSelectBeat: (id: string) => void;
  stats: { chars: number; chapters: number; canon: number; characters: number };
  intentMemo: string;
}
```

- [ ] **Step 2: 시안 상수·시안 타입 제거**

`SAMPLE_PERSONAS`, `SAMPLE_REVIEWS`, `SAMPLE_BODY`, `PersonaKey`, `ReviewDatum`, `BodyParagraph`, `FloatingPersona` 선언 전부 삭제. `PHASES` 는 유지(전체검토 애니용). persona 식별은 string id(`ValidationAgentId`) 로 일원화.

- [ ] **Step 3: props 분해 + 파생 헬퍼**

함수 시그니처를 `export function FloatingEditor(props: FloatingEditorProps)` 로 바꾸고 분해. 시안 `present/stateMap` 로컬 state 제거 → `reviews` 에서 파생.

```ts
export function FloatingEditor({
  title, episodeLabel, kicker, charCount, chapterTitle, chapterSub,
  paragraphs, reviews, personas, onSummon, onRunAll, onAcceptDiff, onRejectReview,
  beats, activeBeatId, onSelectBeat, stats, intentMemo,
}: FloatingEditorProps) {
  const personaById = useCallback(
    (id: string): PersonaCard =>
      personas.find((p) => p.id === id) ?? { id, name: id, role: '', tint: '#62666d', isCore: false },
    [personas]
  );
  const liveReviews = reviews.filter((r) => !r.pending);
  // 단락 → 그 단락에 앵커된 첫 확정 리뷰
  const reviewForAnchor = (anchorId: string) => liveReviews.find((r) => r.anchor === anchorId) ?? null;
  // 단락 텍스트를 diff.from 기준 before/mark/after 분해 (diff 없으면 mark 없음)
  const splitByMark = (text: string, review: MarginReview | null) => {
    const from = review?.diffs?.[0]?.from;
    if (!from) return { before: text, mark: undefined as string | undefined, after: undefined as string | undefined };
    const i = text.indexOf(from);
    if (i < 0) return { before: text, mark: undefined as string | undefined, after: undefined as string | undefined };
    return { before: text.slice(0, i), mark: from, after: text.slice(i + from.length) };
  };
  const presentCount = liveReviews.length;
  // ...기존 UI 로컬 state 유지: openPanel, detailKey, isFocus, hint, pop, marginTops
```

- [ ] **Step 4: 인터랙션 콜백을 실 props 로 배선**

```ts
  // 한 명 호출
  const callOne = useCallback((id: string, selectedText?: string, anchor?: string) => {
    setPop(null);
    onSummon(id, { selectedText, anchor });
  }, [onSummon]);
  // 5명 전체 검토
  const assignAll = useCallback(() => { setOpenPanel('writers'); onRunAll(); }, [onRunAll]);
  // 반영/보류
  const resolveReview = (review: MarginReview, ok: boolean) => {
    if (ok && review.diffs[0]) onAcceptDiff(review.diffs[0]);
    else onRejectReview(review);
    setDetailKey(null);
  };
```

본문 드래그 popover 의 `callOne(p.key)` 호출부는 `callOne(p.id, selectedText, anchor)` 로, 선택 텍스트(`window.getSelection`)와 현재 단락 anchor 를 넘긴다. `assignAll` 의 시안 타이머 애니(`assignTimers`)는 제거(실 pending→확정은 StoryXDesk 가 채움). `detailKey` 는 `PersonaKey` 대신 `MarginReview`(또는 persona id) 를 들도록 바꾼다 — 가장 단순하게 `const [openReview, setOpenReview] = useState<MarginReview | null>(null)` 로 교체하고 detail 렌더를 `openReview` 기준으로.

- [ ] **Step 5: 본문(sheet) 을 paragraphs 로 렌더**

`SAMPLE_BODY.map(...)` 블록을 `paragraphs.map(...)` 으로 교체. 각 단락의 앵커 리뷰로 dot/underline:

```tsx
<div className="ms" onMouseUp={onBodyMouseUp}>
  {paragraphs.map((para, i) => {
    const review = reviewForAnchor(para.id);
    const persona = review ? personaById(review.persona) : null;
    const { before, mark, after } = splitByMark(para.text, review);
    const cls = ['anchor', i === 0 ? 'lead' : '', review ? 'has-note' : ''].filter(Boolean).join(' ');
    const style = persona ? ({ ['--ac']: persona.tint } as CSSProperties) : undefined;
    return (
      <p key={para.id} className={cls} style={style} data-key={review?.persona}>
        {before}
        {mark && (
          <span className="mark" onClick={() => review && setOpenReview(review)}>{mark}</span>
        )}
        {after}
      </p>
    );
  })}
</div>
```

`layoutMargin` 의 `SAMPLE_BODY.forEach` 와 `.anchor[data-key=...]` 쿼리는 `paragraphs.forEach` + `.anchor[data-key]` 매칭으로 바꾼다(앵커 단락에 리뷰 있을 때만 top 계산).

- [ ] **Step 6: 여백 주석(margin) 을 liveReviews 로 렌더**

`SAMPLE_BODY.map(... present[para.key] ...)` 마진 블록을 `liveReviews.map((review) => ...)` 으로 교체. persona 색·이름·`review.body`·severity 라벨(`SEVERITY_LABEL[review.severity]`) 사용. `marginNoteRefs` 키는 `review.anchor` 기준. 클릭 → `setOpenReview(review)`.

- [ ] **Step 7: detail 패널을 openReview 로 렌더**

`detailKey && (()=>{...})()` 블록을 `openReview && (()=>{ const p = personaById(openReview.persona); ... })()` 로. diff 렌더는 `openReview.diffs[0]` 의 `{from, to}` 사용(was=from, is=to). 반영/보류 버튼 → `resolveReview(openReview, true/false)`. 본문 텍스트는 `openReview.body`.

- [ ] **Step 8: 좌측 패널 실데이터**

회차 트리(`fc-p-struct`) → `beats.map((b)=> <div className={`tree-li${b.id===activeBeatId?' on':''}`} onClick={()=>onSelectBeat(b.id)}><span className="n">{b.no ?? ''}</span><span className="label">{b.name ?? b.label ?? b.summary ?? ''}</span></div>)`. beats 비면 안내 한 줄. 곡선(`fc-p-curve`) → beats 길이로 균등 분포 polyline path 생성(beats 비면 빈 곡선). 상태(`fc-p-state`) 4셀 → `stats.chars/ chapters/ canon/ characters`. 의도 메모 textarea → `defaultValue={intentMemo}` 읽기(쓰기-백 없음).

- [ ] **Step 9: 페르소나 색·작가실·popover 를 personas 로**

`SAMPLE_PERSONAS.map` 쓰던 작가실(`fc-p-writers`)·popover(`fc-pop`)·아바타 색을 `personas.map` + `persona.tint` 로 교체. 작가실 행 상태 라벨은 `liveReviews` 에 해당 persona 가 있으면 '완료', 없으면 '대기'(전체검토 중 pending 표시는 `reviews.some(r=>r.persona===id && r.pending)` 이면 '검토 중'). 모드탭 '데이터'·'출간'·'초안 생성' 은 toast no-op 유지.

- [ ] **Step 10: Run test to verify it passes**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 11: tsc + build**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0 · build 성공.

- [ ] **Step 12: Commit**

```bash
git add src/components/FloatingEditor.tsx
git commit -m "feat(editor): FloatingEditor props-driven 리팩터 — 시안 상수 제거, 실 MarginReview·페르소나 배선"
```

---

## Task 3: StoryXDesk seam — 실 props 조립 + 분기

**Files:**
- Modify: `src/StoryXDesk.tsx` (import + floatingEditorProps useMemo + 분기)

- [ ] **Step 1: import 추가**

상단 컴포넌트 import 군에 추가:
```ts
import { FloatingEditor } from './components/FloatingEditor';
import { CORE_PERSONAS } from './lib/extendedPersonas';
```

- [ ] **Step 2: 플래그 + props useMemo 추가 (acceptMarginDiff 직후, ~line 1191)**

```ts
  const isFloatingPreview = useMemo(
    () => typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).get('editor') === 'floating',
    []
  );
  const floatingEditorProps = useMemo(() => ({
    title: project.title ?? request.intent ?? '새 작품',
    episodeLabel: latestChapter ? chapterLabel(latestChapter) : '새 초안',
    kicker: `${mediumLabel(request.medium)} · ${latestChapter ? chapterLabel(latestChapter) : '새 초안'}`,
    charCount: `${chapterCharCount.toLocaleString()}자`,
    chapterTitle: latestChapter?.title ?? '제목 없음',
    chapterSub: latestChapter?.summary ?? project.logline ?? '',
    paragraphs: marginParagraphs,
    reviews: marginReview.reviews,
    personas: CORE_PERSONAS,
    onSummon: marginReview.onSummon,
    onRunAll: marginReview.onRunAll,
    onAcceptDiff: acceptMarginDiff,
    onRejectReview: marginReview.onRejectReview,
    beats: latestChapter?.beats ?? [],
    activeBeatId,
    onSelectBeat: (id: string) => {
      const beat = latestChapter?.beats.find((b) => b.id === id);
      if (beat) selectBeat(beat);
    },
    stats: {
      chars: chapterCharCount,
      chapters: project.chapters.length,
      canon: project.canonFacts.length,
      characters: project.characters.length,
    },
    intentMemo: draftPrompt,
  }), [project, request, latestChapter, chapterCharCount, marginParagraphs, marginReview, activeBeatId, draftPrompt]);
```

주의 — `project.title`·`mediumLabel`·`latestChapter.summary`·`project.canonFacts` 의 정확한 이름은 적용 시 `storyEngine.ts`/스코프에서 확인(없으면 `project.logline`/`request.medium` 라벨 맵/`?? ''`/`project.canonFacts ?? []` 로 폴백). `chapterLabel`·`mediumLabel` 가 스코프에 없으면 인접 사용처(예: `chapterCrumb` line 930)에서 쓰는 헬퍼명으로 맞춘다.

- [ ] **Step 3: 분기 추가 (main `return (` 직전, line 1950)**

```ts
  if (isFloatingPreview && isDraftMode) {
    return <FloatingEditor {...floatingEditorProps} />;
  }

  return (
    <main
      className={[
```

- [ ] **Step 4: tsc + build**

Run: `npx tsc --noEmit && npm run build`
Expected: exit 0 · build 성공. (타입 불일치 나면 Step 2 폴백/필드명 교정.)

- [ ] **Step 5: 기존 테스트 회귀 확인**

Run: `npm test`
Expected: 기존 테스트 전부 green(편집기 기본 경로 불변) + Task 1 의 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(editor): StoryXDesk 가 floating 프리뷰에 실 상태·검토·페르소나 props 주입"
```

---

## Task 4: App.tsx — standalone 우회 분기 제거

**Files:**
- Modify: `src/App.tsx` (FloatingEditor import + ?editor=floating 분기 제거)

- [ ] **Step 1: standalone 분기 제거**

`if (stage === 'editor') {` 안의 아래 블록을 삭제(이제 StoryXDesk 가 분기 담당):
```ts
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('editor') === 'floating'
    ) {
      return <FloatingEditor />;
    }
```
그리고 상단 `import { FloatingEditor } from './components/FloatingEditor';` 제거.

- [ ] **Step 2: 전체 게이트**

Run: `bash init.sh`
Expected: tsc 0 · npm test green · build 성공.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(editor): App.tsx 의 floating standalone 우회 제거 — StoryXDesk 경유로 일원화"
```

---

## Task 5: 시각 검증 + 계획 체크리스트 갱신

**Files:**
- Modify: `docs/storyx-floating-editor-plan.md` (단계 1 데이터 배선 체크)
- Create: `docs/handoff/screenshots/floating-c-wired/` (4 해상도)

- [ ] **Step 1: dev 띄우고 4 해상도 캡처**

`npm run dev` 후 `http://127.0.0.1:5173/?stage=editor&editor=floating` 를 360/768/1024/1440 으로 캡처(Playwright MCP). 확인 — 가로 스크롤 0 · 본문 항상 보임 · 실 원고/실 페르소나 라벨(쇼러너·캐릭터 큐레이터·세계 키퍼·장르 스타일리스트·연속성 감수자) · 콘솔 에러 0 · 레이아웃이 `floating-c/` 시안과 동등(데이터만 실제로).

- [ ] **Step 2: "5명에게 전체 검토" 실동작 확인**

작가실 → "5명에게 전체 검토 맡기기" → pending 5장 즉시 → 실 검토 도착 교체. 한 명 호출(본문 드래그 popover) → 단일 검토. 반영 → 본문 텍스트 변화(diff 적용). 보류 → 주석 제거.

- [ ] **Step 3: 계획 체크리스트 갱신**

`docs/storyx-floating-editor-plan.md` 의 "### 1. 편집 모드 floating" 항목 중 데이터 배선·검증을 `[x]` 로, 단계 2(스왑)·3(진입화면)은 `[ ]` 유지.

- [ ] **Step 4: Commit**

```bash
git add docs/storyx-floating-editor-plan.md docs/handoff/screenshots/floating-c-wired
git commit -m "docs(editor): 플로팅 실데이터 배선 검증 캡처 + 계획 체크리스트 갱신"
```

---

## Self-Review (작성자 점검)

- **스펙 커버리지** — §4 props 계약(T2.S1), §5 시안→실 매핑(T2.S3~S9), §6 범위밖 toast no-op(T2.S9), §7 빈/에러(T1 4번째 테스트 + reviewForAnchor null 가드), §8 테스트(T1)·게이트(T3.S5/T4.S2)·시각(T5), §9 파일별(T2/T3/T4/T5), §3 seam(T3.S3 + T4.S1). 누락 없음.
- **플레이스홀더** — 없음. 폴백 필드명(project.title 등)은 "확인 후 폴백" 으로 명시(추측 강제 아님).
- **타입 일관성** — `Paragraph.id`(`anchor` 아님), `MarginReview.anchor/diffs/persona`, `SummonHandler(id, {selectedText,anchor})`, `acceptMarginDiff(diff: InlineDiff)`, `CORE_PERSONAS: PersonaCard[]` 전부 정의 파일과 일치. `openReview: MarginReview|null`(시안 `detailKey: PersonaKey` 대체)로 Task 2 내부 일관.

## 위험·완화
- StoryXDesk props 조립부 비대 → `floatingEditorProps` 단일 useMemo 로 격리.
- 시각 회귀 → `.fc-*` CSS 불변, 데이터만 교체. 4 해상도 캡처를 `floating-c/`(시안) 와 비교.
- 폴백 필드명 불일치 → Task 3 Step 4 tsc 가 즉시 잡음.

## 완료 기준 (스펙 §11)
`?editor=floating` 이 실 원고·실 5 페르소나(실 라벨)·실 검토(호출·전체검토·반영/보류)로 동작 · `SAMPLE_*` 제거 · `floatingEditor.test.ts` + 기존 게이트 green · 4 해상도 레이아웃 보존 · 기본 편집기 경로 무변경.
