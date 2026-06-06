# 플로팅 에디터 기본화 — Phase 2a 스왑 설계

> 작성일 2026-06-06 · 상태 승인 대기(스펙 리뷰) · 선행 rank5 Pass E 체크포인트 `bcca914`

## 배경과 목표

방향 C "떠 있는 작업실"(`FloatingEditor`)은 Phase 1 비주얼 + 실데이터 배선까지 끝났지만 여전히 `?editor=floating` opt-in 이고 **읽기 전용 프리뷰**다. 본문 타이핑·초안 생성·모드 네비게이션 콜백이 없다. 기본 진입(`?stage=editor`)은 옛 3컬럼 `StoryXDesk` 셸이다.

최종 목표는 **옛 3컬럼 에디터를 제거하고 그 기능을 전부 플로팅 방식으로 흡수**하는 것이다. 한 번에(빅뱅) 옮기면 타이핑·생성·데이터·출간·하니스/품질 카드가 동시에 깨질 위험이 크므로 **단계적으로 대체**하고, 옛 에디터는 floating 이 기능 동등성에 도달했을 때 **마지막 단계에서 제거**한다.

## 마이그레이션 단계 (각 단계가 그 자체로 동작·배포 가능)

| 단계 | 내용 | 결과 |
|---|---|---|
| **2a (이 스펙)** | floating 을 편집 기본으로 + 라이브 타이핑 + 초안 생성 + 편집/데이터/출간 네비 배선 | 실제로 쓰는 floating 에디터가 기본 |
| 2b | 좌측 독에 하니스·품질게이트·매체투사·온톨로지·구조트리·곡선을 floating 패널로 흡수 | 좌레일 지능 이식 |
| 2c | 데이터(캐논/바이블) 모드를 floating 형태로 | 데이터 모드 흡수 |
| 2d | 출간 모드를 floating 형태로 | 출간 흡수 |
| 2e | 옛 3컬럼 에디터 완전 제거 + `editorFocusLayout.test.ts` 새 구조로 이관 + `?editor=classic` 제거 | 대체 완료 |

이 문서는 **2a 만** 다룬다. 2b~2e 는 "범위 밖"에 명시한다.

## Phase 2a 범위

### 1. 트리거 플립 — floating 을 편집 기본으로

`StoryXDesk.tsx:1994` 의 early return 조건을 바꾼다.

- 현재 — `if (isFloatingPreview && isDraftMode) return <FloatingEditor .../>`
- 변경 — `if (isDraftMode && !isClassicEditor) return <FloatingEditor .../>`
- `isClassicEditor` 는 `?editor=classic` 일 때 true(역플래그, 한시적). `isFloatingPreview`(`?editor=floating`)는 하위호환을 위해 유지하되 더는 floating 진입 조건이 아니다(기본이 floating 이므로).
- 데이터(`isBibleMode`)·출간(`isPublishingMode`) 모드는 변경 없이 기존 셸이 담당한다(early return 은 `isDraftMode` 에만 적용).

### 2. 라이브 타이핑 — 종이 시트 본문 contentEditable

종이 시트 본문을 `contentEditable` 로 만들어 단일 원천 `editorText` 에 쓰기-백한다. textarea 가 아니라 contentEditable 인 이유는 단락별 마진 주석 앵커(`data-pid`)와 작가별 색 밑줄을 본문 안에 유지해야 하기 때문이다.

- 본문은 `paragraphs`(=`marginParagraphs`, `editorText` 에서 파생)를 `<p data-pid>` 로 렌더한다.
- 편집 이벤트 — `onInput` 으로 plain text 를 추출해 `onBodyChange(text)` 콜백 호출 → `StoryXDesk` 가 `setEditorText` + `setEditedSinceReview(true)`. `marginParagraphs` 가 재파생되어 앵커가 따라온다.
- **한국어 IME 처리(필수)** — `onCompositionStart`/`onCompositionEnd` 로 조합 중에는 본문 재파생을 보류하고 `compositionend` 에서만 커밋한다. 조합 중 React 리렌더로 입력이 끊기지 않게 한다. 이게 contentEditable + 한글의 핵심 리스크다.
- 커서 보존 — 재렌더가 커서를 잃지 않도록, 편집 중엔 `editorText` → DOM 강제동기화를 하지 않는다(uncontrolled 편집, blur/리뷰 시점에만 동기화).
- 의도 메모도 `readOnly` 해제 + `onIntentChange` 콜백으로 쓰기-백.

### 3. 초안 생성·모드 네비게이션 배선

floating 상단의 버튼·탭을 실제 `StoryXDesk` 콜백에 연결한다.

- 초안 생성 → `mainActionRun`(`StoryXDesk:2319`). 생성 중 `isGenerating` 으로 비활성.
- 편집/데이터 탭 → `switchToTrack('draft'|'bible')`. 데이터 선택 시 `isDraftMode=false` → early return 해제 → 기존 3컬럼 데이터 셸 렌더(2c 전까지 한시적 chrome 전환, 의도된 동작).
- 출간 → `openPublishingMode`. **기존 우상단 secondary 버튼 1개를 배선할 뿐 중복 버튼 추가 없음** — 편집/데이터 primary 탭 옆 우상단 위치 유지(사용자 확정 2026-06-06). floating 기본화 후 옛 셸의 우상단 출간은 `?editor=classic` 경로로만 남아 화면당 출간 버튼은 항상 1개다. 좌측 독(회차·곡선·상태·작가실·집중)엔 출간을 넣지 않는다.
- 이 콜백들을 `FloatingEditorProps` 에 추가하고 `floatingEditorProps`(`StoryXDesk:1197`)에서 주입한다.

### 4. 옛 에디터 — `?editor=classic` 한시적 폴백

옛 3컬럼 에디터를 이번엔 제거하지 않는다. `?editor=classic` 으로만 도달하는 폴백으로 남긴다. 이유는 (a) 안전망, (b) 아직 floating 에 없는 좌레일 하니스/품질/온톨로지 카드 접근 보존, (c) `editorFocusLayout.test.ts` 의 옛 편집 구조 단언을 이번에 대량 재작성하지 않기 위함. 실제 제거는 2e.

### 5. 테스트 전략

- **삭제·약화 0 유지.** 옛 편집 구조를 검사하는 `editorFocusLayout.test.ts` 단언은 그대로 둔다 — 그 구조는 `?editor=classic` 경로로 여전히 존재하므로 desk 소스에 남아 있어 green 이다.
- 신규 `floatingEditor.test.ts` 확장(RED→GREEN) — (a) 기본 진입이 floating(트리거 플립), (b) 본문 contentEditable + onBodyChange 쓰기-백, (c) IME compositionend 커밋, (d) 초안 생성·편집/데이터/출간 콜백 호출, (e) `?editor=classic` 이면 옛 셸.
- 게이트 — `tsc 0` · `npm test` green · `npm run build` · Playwright 4해상도 시각(가로 스크롤 0·본문 편집 가능·콘솔 0).

## 인터페이스 변경 — `FloatingEditorProps` 추가

```ts
// 추가되는 콜백 (모두 StoryXDesk 단일 원천에 위임)
onBodyChange: (text: string) => void;       // 본문 편집 → setEditorText
onIntentChange: (text: string) => void;     // 의도 메모 편집
onGenerateDraft: () => void;                 // 초안 생성 → mainActionRun
onSwitchTrack: (track: 'draft' | 'bible') => void;  // 편집/데이터 탭
onOpenPublish: () => void;                   // 출간
isGenerating: boolean;                       // 생성 중 버튼 비활성
```

표현 컴포넌트 순수성 유지 — 데이터·콜백은 전부 props 로 주입, `SAMPLE_*` 부활 금지.

## 데이터 흐름

`editorText`(StoryXDesk 단일 원천) → `marginParagraphs` 파생 → `paragraphs` props → contentEditable 렌더. 사용자 입력 → `onInput`(IME 가드) → `onBodyChange` → `setEditorText` → 재파생 순환. 마진 검토(onRunAll·onAcceptDiff·onRejectReview)는 기존 배선 유지.

## 에러·엣지 케이스

- 빈 본문 — placeholder 표시, onBodyChange('') 안전.
- IME 조합 중 리뷰 도착 — 조합 중에는 본문 DOM 강제동기화 금지(커서·조합 보존). 리뷰 마진은 본문 밖이라 무관.
- accept-diff 가 editorText 를 바꾼 직후 — contentEditable DOM 과 editorText 재동기화 1회 필요(diff 반영은 외부 변경이므로 controlled 동기화 허용).
- 데이터/출간 전환 시 chrome 점프 — 2c/2d 전까지 의도된 한시 동작. 사용자에게 어색하지 않도록 전환 페이드 재사용(`runWithWorkbenchFade`) 검토.

## 범위 밖 (다음 단계)

- 2b — 좌측 독에 하니스·품질게이트·매체투사·온톨로지·구조트리·곡선 흡수.
- 2c — 데이터(캐논/바이블) 모드 floating 화.
- 2d — 출간 모드 floating 화.
- 2e — 옛 3컬럼 제거 + `editorFocusLayout.test.ts` 새 구조 이관 + `?editor=classic` 제거.
- rank5 잔여 — PublishingStudio 추출, 죽은 코드(AiCliHarnessCard·VerticalSliceProofPanel·ContinuitySummaryCard) 삭제 vs 추출 결정, Tier3 훅 분리.

## 리스크

- **한국어 IME + contentEditable** — 최대 리스크. compositionstart/end 가드 + uncontrolled 편집으로 대응. 반드시 실제 한글 입력 테스트.
- **커서 점프** — 매 입력마다 React 리렌더로 커서가 튀는 고전 문제. 편집 중 controlled 동기화 금지로 대응.
- **chrome 전환** — 편집(floating) ↔ 데이터/출간(3컬럼) 점프. 2c/2d 까지 한시. 페이드로 완화.
- **마진 앵커 드리프트** — 본문 편집으로 단락 인덱스가 바뀌면 주석 앵커가 어긋날 수 있음. 기존 `resolveRunReviewAnchor` round-robin fallback 으로 1차 대응, 정밀화는 후속.

## 검증 기준

`npx tsc --noEmit` 0 · `npm test` green · `npm run build` · `?stage=editor`(플래그 없음) 진입 시 floating 기본 + 한글 타이핑 동작 + 초안 생성/탭 동작 + `?editor=classic` 시 옛 셸 + 콘솔 0 · 4해상도 가로 스크롤 0.
