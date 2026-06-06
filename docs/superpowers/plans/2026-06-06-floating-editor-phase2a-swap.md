# 플로팅 에디터 기본화 Phase 2a 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `?stage=editor` 기본 진입에서 플로팅 에디터가 뜨고, 본문을 직접 타이핑하고(한글 IME 안전), 초안 생성·편집/데이터/출간 네비가 동작하게 한다. 옛 3컬럼 에디터는 `?editor=classic` 폴백으로만 남긴다.

**Architecture:** `StoryXDesk.tsx:1994` 의 early return 조건을 `isDraftMode && !isClassicEditor` 로 바꿔 floating 을 편집 기본으로 만든다. `FloatingEditor` 는 읽기 전용 프리뷰에서 **편집 가능 컴포넌트**로 확장한다 — 본문 `.ms` 를 `contentEditable` 로, 타이핑 중 React 재렌더 클로버를 막기 위해 본문 children 을 `bodyVersion` prop 기준 `useMemo` 로 고정(외부 변경 때만 재시드), 한글 입력은 `compositionstart/end` 가드로 처리. 상단 버튼(초안생성·편집/데이터·출간)과 의도메모를 props 콜백에 배선한다. 데이터·콜백은 전부 `StoryXDesk` 단일 원천에서 주입(표현 컴포넌트 순수성 유지).

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + react-dom/client(jsdom), Playwright(시각·IME 수동 검증).

**선행 상태:** rank5 Pass E 체크포인트 `bcca914`, 스펙 `c2a932a`(`docs/superpowers/specs/2026-06-06-floating-editor-phase2a-swap-design.md`). 기준선 297 tests green.

**테스트 한계 메모:** jsdom 은 contentEditable 편집·IME compositionevent 를 실제로 시뮬레이트하지 못한다. 따라서 (a) 콜백 배선·props 계약·시안제거·정적 구조는 Vitest 로, (b) 실제 한글 타이핑·커서·시각 회귀는 Task 7 Playwright 수동 검증으로 나눈다. 계획은 각 Task 에 어떤 게이트로 검증하는지 명시한다.

---

## 파일 구조

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/StoryXDesk.tsx` | 단일 원천·트리거·props 주입 | 수정 — `isClassicEditor`, `bodyVersion` state, early return 조건, `floatingEditorProps` 콜백 추가 |
| `src/components/FloatingEditor.tsx` | 플로팅 표현+편집 컴포넌트 | 수정 — `FloatingEditorProps` 확장, contentEditable 본문, 상단/메모 콜백 배선 |
| `src/components/floatingEditor.test.ts` | 단위 검증 | 수정 — 편집/콜백/IME가드 케이스 추가 |
| `src/editorFocusLayout.test.ts` | 옛 편집 구조 단언 | 무변경 — classic 경로로 소스에 남아 green(확인만) |

---

## Task 1: 트리거 플립 — floating 을 편집 기본으로

**Files:**
- Modify: `src/StoryXDesk.tsx` (isFloatingPreview 정의 ~1191, early return ~1994)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: 현재 코드 확인**

`StoryXDesk.tsx:1191-1196` 현재:
```tsx
  const isFloatingPreview = useMemo(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('editor') === 'floating',
    []
  );
```
`StoryXDesk.tsx:1994`:
```tsx
  if (isFloatingPreview && isDraftMode) {
    return <FloatingEditor {...floatingEditorProps} />;
  }
```

- [ ] **Step 2: `isClassicEditor` 추가 + 기본 floating 으로 조건 변경**

`isFloatingPreview` useMemo 바로 아래에 추가:
```tsx
  // Phase 2a — floating 이 편집 기본. ?editor=classic 일 때만 옛 3컬럼 셸(한시적 폴백, 2e 에서 제거).
  const isClassicEditor = useMemo(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('editor') === 'classic',
    []
  );
```
`StoryXDesk.tsx:1994` 조건 변경:
```tsx
  if (isDraftMode && !isClassicEditor) {
    return <FloatingEditor {...floatingEditorProps} />;
  }
```
`isFloatingPreview` 는 하위호환을 위해 정의는 남기되 사용처가 없어지면 Task 4 에서 제거 판단. (이번엔 미사용 경고 방지를 위해 `void isFloatingPreview;` 한 줄을 추가하거나, 사용처가 남아 있으면 그대로 둔다 — Step 4 에서 tsc 로 확인.)

- [ ] **Step 3: 빌드로 기본 분기 확인 (수동)**

Run: `npx tsc --noEmit`
Expected: exit 0. (미사용 변수 에러가 나면 `isFloatingPreview` 를 제거하거나 `void` 처리.)

- [ ] **Step 4: 커밋**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(editor): floating 을 편집 기본으로 + ?editor=classic 폴백 (Phase 2a Task1)"
```

---

## Task 2: FloatingEditorProps 확장 — 편집·콜백 계약 (RED 먼저)

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (props interface 16-35, 함수 시그니처 41-60)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: 실패 테스트 작성 — 새 props 콜백 호출 단언**

`floatingEditor.test.ts` 의 `baseProps` 에 새 콜백 기본값을 추가하고(아래 Step 에서 타입이 생기면 통과), describe 에 케이스 추가:
```ts
// baseProps return 객체에 추가:
    editable: true,
    bodyVersion: 0,
    onBodyChange: vi.fn(),
    onIntentChange: vi.fn(),
    onGenerateDraft: vi.fn(),
    onSwitchTrack: vi.fn(),
    onOpenPublish: vi.fn(),
    isGenerating: false,
```
케이스:
```ts
  it('초안 생성 버튼이 onGenerateDraft 를 호출한다', () => {
    const onGenerateDraft = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onGenerateDraft }));
    click(host.querySelector('.btn-primary'));
    expect(onGenerateDraft).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('출간 버튼이 onOpenPublish 를 호출한다 (우상단 단일 버튼)', () => {
    const onOpenPublish = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onOpenPublish }));
    const publishButtons = host.querySelectorAll('.btn-publish');
    expect(publishButtons.length).toBe(1);              // 중복 없음
    click(publishButtons[0]);
    expect(onOpenPublish).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('데이터 탭이 onSwitchTrack(bible) 를 호출한다', () => {
    const onSwitchTrack = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSwitchTrack }));
    const dataTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (t) => t.textContent?.includes('데이터')
    );
    click(dataTab ?? null);
    expect(onSwitchTrack).toHaveBeenCalledWith('bible');
    unmount();
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — 타입에 새 prop 없음(tsc) + 버튼이 콜백 대신 toast 호출이라 단언 실패.

- [ ] **Step 3: props 인터페이스 확장**

`FloatingEditor.tsx:16-35` `FloatingEditorProps` 끝에 추가:
```tsx
  // Phase 2a — 편집·네비 콜백 (StoryXDesk 단일 원천에서 주입)
  editable?: boolean;          // 본문 편집 가능 (기본 true)
  bodyVersion?: number;        // 외부 본문 변경 시드 트리거 (타이핑 중엔 불변)
  onBodyChange?: (text: string) => void;
  onIntentChange?: (text: string) => void;
  onGenerateDraft?: () => void;
  onSwitchTrack?: (track: 'draft' | 'bible') => void;
  onOpenPublish?: () => void;
  isGenerating?: boolean;
```
함수 구조분해(41-60)에 추가(기본값 포함):
```tsx
  editable = true,
  bodyVersion = 0,
  onBodyChange,
  onIntentChange,
  onGenerateDraft,
  onSwitchTrack,
  onOpenPublish,
  isGenerating = false,
```

- [ ] **Step 4: 상단 버튼·탭 콜백 배선**

`FloatingEditor.tsx:279-306` 의 toast no-op 들을 콜백으로 교체.
- 데이터 탭(279-285):
```tsx
          <button
            role="tab"
            aria-selected="false"
            onClick={() => (onSwitchTrack ? onSwitchTrack('bible') : toast('데이터 모드'))}
          >
            데이터
          </button>
```
- 편집 탭(276-278) 은 이미 선택 상태 — `onClick={() => onSwitchTrack?.('draft')}` 추가(누르면 draft 유지).
- 출간 버튼(288-297) onClick:
```tsx
          onClick={() => (onOpenPublish ? onOpenPublish() : toast('출간'))}
```
- 초안 생성 버튼(298-306) onClick + 비활성:
```tsx
        <button
          className="btn-primary"
          disabled={isGenerating}
          onClick={() => (onGenerateDraft ? onGenerateDraft() : toast('초안 생성'))}
        >
```

- [ ] **Step 5: 테스트 실행 — 통과 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS (초안생성·출간 단일버튼·데이터 탭 콜백 케이스). contentEditable·타이핑은 Task 3.

- [ ] **Step 6: 커밋**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(editor): FloatingEditor 상단 네비·초안생성 콜백 배선 (Phase 2a Task2)"
```

---

## Task 3: contentEditable 본문 — 타이핑·커서·IME

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (본문 `.ms` 렌더 323-349)
- Test: `src/components/floatingEditor.test.ts`

핵심 — 타이핑 중 React 가 본문을 재렌더해 커서를 잃지 않도록, 본문 children 을 `bodyVersion` 기준 `useMemo` 로 고정한다(외부 변경 때만 재계산). 한글은 `compositionstart/end` 가드로 조합 중 `onBodyChange` 보류.

- [ ] **Step 1: 실패 테스트 — contentEditable + onBodyChange + IME 가드**

```ts
  it('editable 일 때 본문 .ms 가 contentEditable 이다', () => {
    const { host, unmount } = mount(baseProps({ editable: true }));
    expect(host.querySelector('.ms')?.getAttribute('contenteditable')).toBe('true');
    unmount();
  });

  it('editable 본문에 input 이 일어나면 onBodyChange 가 텍스트로 호출된다', () => {
    const onBodyChange = vi.fn();
    const { host, unmount } = mount(baseProps({ editable: true, onBodyChange }));
    const ms = host.querySelector('.ms') as HTMLElement;
    ms.textContent = '필사관은 한 줄을 더 고쳤다.\n탑은 이름을 받고 움직였다.';
    act(() => { ms.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onBodyChange).toHaveBeenCalled();
    expect(onBodyChange.mock.calls.at(-1)?.[0]).toContain('한 줄을 더 고쳤다');
    unmount();
  });

  it('한글 조합 중(compositionstart 이후)에는 onBodyChange 를 보류한다', () => {
    const onBodyChange = vi.fn();
    const { host, unmount } = mount(baseProps({ editable: true, onBodyChange }));
    const ms = host.querySelector('.ms') as HTMLElement;
    act(() => { ms.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); });
    ms.textContent = '조합중ㅎ';
    act(() => { ms.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onBodyChange).not.toHaveBeenCalled();            // 조합 중 보류
    act(() => { ms.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })); });
    expect(onBodyChange).toHaveBeenCalledTimes(1);          // 조합 끝에서 1회 커밋
    unmount();
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — onInput 핸들러 없음.

- [ ] **Step 3: 본문을 bodyVersion-고정 children + contentEditable 로 변경**

`FloatingEditor.tsx` 컴포넌트 본문 상단(useState 들 근처)에 조합 상태 ref 추가:
```tsx
  const composingRef = useRef(false);
  const msElRef = useRef<HTMLDivElement>(null);

  const emitBody = useCallback(() => {
    if (composingRef.current) return;                       // 조합 중 보류
    const text = msElRef.current?.innerText.replace(/ /g, ' ') ?? '';
    onBodyChange?.(text);
  }, [onBodyChange]);
```
본문 children 을 bodyVersion 기준으로 고정(타이핑 중 재렌더 클로버 방지):
```tsx
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bodyChildren = useMemo(
    () =>
      paragraphs.map((para, i) => {
        const review = reviewForAnchor(para.id);
        const persona = review ? personaById(review.persona) : null;
        const { before, mark, after } = splitByMark(para.text, review);
        const cls = ['anchor', i === 0 ? 'lead' : '', review ? 'has-note' : '']
          .filter(Boolean)
          .join(' ');
        const style = persona ? ({ ['--ac' as string]: persona.tint } as CSSProperties) : undefined;
        return (
          <p key={para.id} className={cls} style={style} data-anchor={para.id} data-key={review?.persona}>
            {before}
            {mark && <span className="mark">{mark}</span>}
            {after}
          </p>
        );
      }),
    [bodyVersion]   // 의도적으로 paragraphs 제외 — 타이핑 중 DOM 이 본문 소유, 외부 변경(bodyVersion++) 때만 재시드
  );
```
> 주의 — 기존 본문의 단락 onClick(setOpenReview)은 contentEditable 편집과 충돌하므로 제거하고, 리뷰 열기는 마진 노트(`.mnote` onClick)·작가실 패널로 한다(이미 존재). 단락 클릭으로 리뷰 여는 동선은 2b 에서 재설계.

`.ms` 렌더(323-349)를 교체:
```tsx
            <div
              className="ms"
              ref={msElRef}
              contentEditable={editable}
              suppressContentEditableWarning
              onMouseUp={onBodyMouseUp}
              onInput={emitBody}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; emitBody(); }}
            >
              {bodyChildren}
            </div>
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS (onBodyChange·composition 가드·contentEditable 케이스 모두).

- [ ] **Step 5: 커밋**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(editor): FloatingEditor contentEditable 본문 + IME 가드 + bodyVersion 시드 (Phase 2a Task3)"
```

---

## Task 4: 의도 메모 쓰기-백

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (intent memo textarea 543)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
  it('의도 메모 편집이 onIntentChange 를 호출한다', () => {
    const onIntentChange = vi.fn();
    const { host, unmount } = mount(baseProps({ onIntentChange }));
    // 작품 상태 패널을 열어야 memo textarea 가 렌더된다
    const stateTool = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('상태'));
    act(() => { stateTool?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const memo = host.querySelector('.memo textarea') as HTMLTextAreaElement;
    memo.value = '모순으로 1화를 연다 — 수정.';
    act(() => { memo.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onIntentChange).toHaveBeenCalledWith('모순으로 1화를 연다 — 수정.');
    unmount();
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — textarea 가 readOnly + onChange 없음.

- [ ] **Step 3: textarea 편집 가능화**

`FloatingEditor.tsx:543` 교체:
```tsx
            <textarea
              rows={3}
              defaultValue={intentMemo}
              readOnly={!onIntentChange}
              onChange={(e) => onIntentChange?.(e.target.value)}
            />
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(editor): FloatingEditor 의도 메모 쓰기-백 (Phase 2a Task4)"
```

---

## Task 5: StoryXDesk 배선 — bodyVersion + 콜백 주입

**Files:**
- Modify: `src/StoryXDesk.tsx` (state ~565, floatingEditorProps 1197-1234)

- [ ] **Step 1: bodyVersion state 추가 + 외부 변경에서 증가**

`editorText` state(565) 근처에 추가:
```tsx
  const [bodyVersion, setBodyVersion] = useState(0);
```
외부 본문 변경 지점에서 `setBodyVersion((v) => v + 1)` 호출.
- `setEditorText(latestChapter.prose)`(1443, 회차 로드) 직후.
- `acceptMarginDiff` 가 editorText 를 바꾸는 지점(grep `acceptMarginDiff` 정의 내부 setEditorText 직후).
- 초안 생성 완료로 prose 가 채워지는 지점(produceEpisode 후 editorText 반영 직후).
> 사용자 타이핑 경로(onBodyChange)에서는 절대 증가시키지 않는다 — 그게 커서 보존의 핵심.

- [ ] **Step 2: onBodyChange 핸들러 — editorText 쓰기-백**

`floatingEditorProps` useMemo 위에 콜백 추가:
```tsx
  const handleFloatingBodyChange = useCallback((text: string) => {
    setEditorText(text);
    setEditedSinceReview(true);
  }, []);
```

- [ ] **Step 3: floatingEditorProps 에 콜백 주입**

`floatingEditorProps`(1197-1222) return 객체 끝(`intentMemo: draftPrompt,` 다음)에 추가:
```tsx
      editable: true,
      bodyVersion,
      onBodyChange: handleFloatingBodyChange,
      onIntentChange: (text: string) => setDraftPrompt(text),
      onGenerateDraft: mainActionRun,
      onSwitchTrack: (track: 'draft' | 'bible') => switchToTrack(track),
      onOpenPublish: openPublishingMode,
      isGenerating,
```
deps 배열(1223-1233)에 추가: `bodyVersion`, `handleFloatingBodyChange`, `mainActionRun`, `isGenerating`. (switchToTrack·openPublishingMode·setDraftPrompt 는 컴포넌트 스코프 함수/세터라 안정 — 필요 시 deps 에 포함하되 tsc/eslint 경고 따라 조정.)
> `mainActionRun`(1251)·`switchToTrack`(1964)·`openPublishingMode`(1975)·`isGenerating` 는 floatingEditorProps(1197) 보다 아래에 정의돼 있으면 호이스팅 문제 발생 — `function` 선언은 호이스팅되나 `const mainActionRun`(1251)·`isGenerating` 은 안 됨. 따라서 floatingEditorProps useMemo 를 이 심볼들 정의 **아래로** 이동하거나, 콜백을 useMemo 밖에서 참조하도록 재배치한다. Step 4 tsc 로 확인하고, 'used before declaration' 이면 floatingEditorProps useMemo 블록을 `mainActionRun` 정의(1251) 아래로 옮긴다.

- [ ] **Step 4: 게이트**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc 0 · 전체 테스트 통과(297 + 신규).

- [ ] **Step 5: 커밋**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(editor): StoryXDesk floating 편집 콜백·bodyVersion 주입 (Phase 2a Task5)"
```

---

## Task 6: 옛 단언 보존 확인 + classic 폴백 검증

**Files:**
- Verify: `src/editorFocusLayout.test.ts`(무변경), `src/lib/version.test.ts`(무변경)

- [ ] **Step 1: 옛 편집 구조 단언이 여전히 green 인지 확인**

옛 3컬럼 JSX 는 classic 경로로 소스에 그대로 남아 있으므로 `editorFocusLayout.test.ts` 의 `desk.toContain('className="ex-toolstrip"')` 등 source-string 단언이 변하지 않는다.
Run: `npx vitest run src/editorFocusLayout.test.ts src/lib/version.test.ts`
Expected: PASS (삭제·약화 0).

- [ ] **Step 2: classic 폴백 정적 단언 추가(floatingEditor.test.ts 또는 신규)**

```ts
  it('?editor=classic 분기와 기본 floating 분기가 소스에 존재한다', () => {
    const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
    expect(desk).toContain("get('editor') === 'classic'");
    expect(desk).toContain('isDraftMode && !isClassicEditor');
  });
```

- [ ] **Step 3: 게이트 + 커밋**

Run: `npx vitest run`
Expected: 전체 통과.
```bash
git add src/components/floatingEditor.test.ts
git commit -m "test(editor): classic 폴백·floating 기본 분기 단언 (Phase 2a Task6)"
```

---

## Task 7: 전체 검증 — 게이트 + Playwright 한글 타이핑·시각

**Files:** 없음(검증만)

- [ ] **Step 1: 하네스 게이트**

Run: `bash init.sh`
Expected: tsc · vitest(297+신규) · build 전체 통과.

- [ ] **Step 2: dev 서버 + 기본 진입이 floating 인지**

Run: `npm run dev` (백그라운드) 후 `curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:5173/?stage=editor"` → 200.
Playwright `?stage=editor`(플래그 없음) 진입 → floating 종이 시트 렌더 확인(`.fc-app` 존재, 옛 `.sx-desk-grid` 아님).

- [ ] **Step 3: 한글 라이브 타이핑 (핵심 리스크)**

Playwright 로 `.ms` 클릭 → `한글 입력 테스트입니다` 타이핑 → (a) 글자가 끊기지 않고 들어가는지 (b) 커서가 튀지 않는지 (c) 콘솔 에러 0. IME 환경 차이로 Playwright type 이 조합을 완전 재현 못 하면, 최소한 영문+한글 혼합 입력과 `onBodyChange` 반영(상단 0자→N자)으로 확인하고, 실제 한글 IME 는 사람이 1회 확인.

- [ ] **Step 4: 네비·생성 동작**

Playwright — 초안 생성 클릭(생성 트리거), 데이터 탭 클릭(3컬럼 데이터로 전환), 출간 클릭(출간 화면), `?editor=classic` 진입 시 옛 3컬럼. 각 콘솔 0.

- [ ] **Step 5: 4해상도 시각 회귀**

1440·1024·768·360 캡처 → 가로 스크롤 0·본문 항상 보임·세로 글자 쪼개짐/회색 박스/이탈 없음. 캡처 `docs/handoff/screenshots/floating-phase2a/`.

- [ ] **Step 6: 상태 문서 갱신 + 최종 커밋**

`progress.md`·`session-handoff.md` 에 Phase 2a 완료 + 증거(커밋 SHA·캡처 경로) 기록. `feature_list.json` 해당 항목 갱신.
```bash
git add progress.md session-handoff.md feature_list.json docs/handoff/screenshots/floating-phase2a
git commit -m "docs: 플로팅 Phase 2a 스왑 완료 — 기본화+라이브타이핑+네비 (증거)"
```

---

## 범위 밖 (다음 단계)

- 2b — 좌측 독에 하니스·품질게이트·매체투사·온톨로지·구조트리·곡선 흡수.
- 2c — 데이터(캐논/바이블) 모드 floating 화(현재 데이터 탭은 옛 3컬럼으로 한시 전환).
- 2d — 출간 모드 floating 화.
- 2e — 옛 3컬럼 제거 + `editorFocusLayout.test.ts` 새 구조 이관 + `?editor=classic` 제거.
- 본문 단락 클릭으로 리뷰 열기 동선 재설계(2a 에선 마진 노트·작가실로 대체).
- 인라인 리뷰 마크의 라이브 갱신(2a 에선 bodyVersion 시점 고정).
- rank5 잔여 — PublishingStudio 추출, 죽은 코드 삭제 vs 추출, Tier3 훅 분리.

## 리스크·완화

- **한글 IME + contentEditable** — composition 가드 + 조합 끝 커밋. Task 7 Step 3 사람 확인 필수.
- **커서 클로버** — bodyVersion 고정 useMemo 로 타이핑 중 본문 재렌더 차단. accept-diff/생성/회차전환만 bodyVersion++.
- **호이스팅** — floatingEditorProps 가 `const mainActionRun` 등보다 위면 'used before declaration'. Task5 Step3 메모대로 useMemo 위치 조정.
- **단락 클릭 리뷰 제거** — 편집과 충돌해 제거. 마진 노트·작가실로 동선 보존. editorFocusLayout 영향 없음(floating 은 그 테스트 범위 밖).
- **chrome 전환(편집 floating ↔ 데이터/출간 3컬럼)** — 2c/2d 까지 한시. 필요 시 `runWithWorkbenchFade` 재사용.
