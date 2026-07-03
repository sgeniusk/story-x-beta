# 융합 셸 슬라이스 C — 단일 바 셸(epilogue 풍 미니멀 재배치) 설계

<!-- 이중 헤더(wm-bar + floating 작업실 pill topbar)를 wm-bar 하나로 통합. CTA 는 원고 시트 끝 인라인, 메타(문단·글자수·저장)는 하단 얇은 줄, 출간·내보내기는 ⋯ 메뉴. WRITE↔PLAN 은 remount 없이 내부 트랙 전환. -->

> 작성 2026-07-03 · 상태 `draft` · 근거 handoff 2026-06-30 "(2) epilogue.page 풍 미니멀 셸 개편" 쟁점 3 + 사용자 결정 4건(visual companion 목업 — A안 단일 바 · 모드별 구성 · CTA 시트 끝 · 내부 트랙 전환). 선행 spec `2026-07-02-fusion-shell-mode-toggle-design.md`(A) · `2026-07-02-fusion-shell-sync-console-design.md`(B).

## 0. 한 문장

WRITE/PLAN 에서 wm-bar 아래 겹치던 floating 작업실 pill topbar(제목·편집/데이터 탭·출간·CTA)를 해체해 **wm-bar 하나만** 남기고, 메인 CTA 는 원고 흐름 끝으로, 메타는 하단 얇은 줄로, 출간·내보내기는 `⋯` 메뉴로 재배치한다 — 위험 가시성(캐논 충돌 배지·싱크 콘솔)은 그대로 드러낸 채.

## 1. 전제 수정 (탐색 발견)

handoff 는 이중 헤더를 "wm-bar + StoryXDesk 편집/데이터 pill"로 기록했으나, StoryXDesk 의 `sx-topbar ex-workbar` 헤더(3-zone working bar)는 **도달 불가 legacy** 다 — draft/bible/publish 가 전부 조기 반환(`StoryXDesk.tsx:2453·2467·2489`)이라 최종 return 이 렌더되지 않음(라이브 DOM 검증 — `.ex-workbar` 부재). 실제 이중 헤더는 다음과 같다.

| 모드 | 실제 상단 구조 |
|---|---|
| WRITE | wm-bar + **FloatingEditor `.topbar` pill**(X·제목·저장됨·편집/데이터 탭·출간·[잠금 확정]·초안 생성 CTA) |
| PLAN | wm-bar + **FloatingDataWorkspace `.topbar` pill**(X·제목·저장됨·편집/데이터 탭·출간) |
| PLAY | wm-bar 하나 (이번 변경 없음) |

따라서 통합 대상 = 두 floating 작업실의 pill topbar. legacy 최종 return 은 이번에 삭제하지 않는다(`editorFocusLayout.test.ts` 가 소스 마크업을 다수 단언 — 삭제는 별도 정리 조각).

## 2. 범위

**한다** — `WorkspaceModeBar` 슬롯 확장(titleSlot·contextSlot·planBadge) · editor stage 에서 바 렌더 소유권을 StoryXDesk 로 역전 · WRITE↔PLAN 내부 트랙 전환(App key 에서 studioView 제거) · FloatingEditor/FloatingDataWorkspace pill topbar 제거 · 원고 시트 끝 CTA 행(생성/잠금 확정) · 하단 메타 줄 `DeskMetaLine`(신규 순수) · `⋯` OverflowMenu(출간·JSON 내보내기/가져오기 — 죽어 있던 export/import 부활) · PLAN 충돌 배지/칩.

**안 한다 (다음)** — legacy 최종 return 삭제(별도 정리) · 집중 모드에서 wm-bar/메타 줄 숨김 · PLAY 에서 planBadge · PLAN staged(`PLAN +N`) · publish 4번째 토글 모드 · 트윅/캔버스 설정 부활 · FloatingEditor 시트 내부 회차 드롭다운(#4) 변경.

## 3. 설계 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 단일 바 | pill topbar 제거, wm-bar 가 유일한 상단 크롬 | 사용자 A안 선택. epilogue 원안("중앙 토글·하단 메타·우측 저장")과 일치 |
| D2 CTA = 시트 끝 | 초안 생성·잠금 확정을 원고 마지막 단락 아래 인라인 | 사용자 선택(문서형). "여기까지 썼으니 다음은 생성" — 연재 루프와 감각 일치. 빈 원고는 바로 보임 |
| D3 내부 트랙 전환 | WRITE↔PLAN 토글이 `switchToTrack` 직접 호출, remount 제거 | 사용자 선택. 기존 130ms 페이드 승계, 깜빡임·스크롤 리셋 제거. `syncVersion` remount 는 보존(불변식) |
| D4 소유권 역전 | editor stage 의 wm-bar 는 StoryXDesk 가 렌더 | 제목 input·회차 픽커·충돌 배지가 전부 StoryXDesk 내부 상태 — 슬롯을 채울 수 있는 곳이 거기뿐. dive stage 는 현행(App) 유지 |
| D5 메타 = 하단 줄 | 문단·글자수(좌) + 저장·AI(우) 얇은 줄 | epilogue 참조. 바를 네비게이션 전용으로 비움 |
| D6 수납 = ⋯ 메뉴 | 출간·내보내기·가져오기를 우측 ⋯ 팝오버로 | 미니멀 유지. export/import 는 legacy 에 갇혀 죽어 있던 기능 — 재사용 부활 |
| D7 위험 가시성 | planBadge(토글 상시) + PLAN contextSlot ⚠칩(클릭→승인 대기) | "충돌은 드러낸다" 하드 제약. 미니멀화가 배지를 지우면 안 됨 |

## 4. 아키텍처

### 4.1 `WorkspaceModeBar` 확장 (순수 유지)

```ts
interface WorkspaceModeBarProps {
  mode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
  workTitle?: string;              // 기존 — titleSlot 없을 때 폴백(PLAY 등)
  titleSlot?: ReactNode;           // 신규 — 편집 가능한 제목 input 주입
  contextSlot?: ReactNode;         // 신규 — WRITE=회차 스텝 픽커 · PLAN=캐논 요약+⚠칩
  planBadge?: number;              // 신규 — PLAN 버튼 빨간 배지(0/undefined 면 미렌더)
  rightSlot?: ReactNode;           // 기존 — 싱크 콘솔(+⋯ 메뉴 합성)
}
```

좌(titleSlot|workTitle → contextSlot) · 중앙(3모드 토글, PLAN 버튼에 planBadge) · 우(rightSlot). 레이아웃 클래스만 추가, 기존 렌더 계약 불변.

### 4.2 StoryXDesk 배선 (소유권 역전 + 내부 전환)

신규 props —

```ts
interface StoryXDeskProps {
  // …기존…
  syncSlot?: ReactNode;                         // App 이 주는 SyncConsole
  onSelectPlayMode?: () => void;                // PLAY 토글 → App stage 전환
  onStudioViewChange?: (v: 'editor' | 'data') => void; // App state 동기화(remount 대비)
}
```

- StoryXDesk 가 draft/bible 조기 반환에만 최상단 `WorkspaceModeBar` 렌더. `mode = activeTrack === 'bible' ? 'plan' : 'write'`. isPublishingMode 반환(App 이 항상 onOpenPublish 를 주므로 사실상 legacy)은 건드리지 않음.
- `onSelect` — `play` → `onSelectPlayMode?.()` · `write`/`plan` → `switchToTrack('draft'|'bible')` + `onStudioViewChange?.(…)`. 콜백은 App state 동기화 전용(렌더 프롭으로 되돌아오지 않음 — 루프 없음).
- `titleSlot` = 제목 input(`updateProject('title', …)` — legacy `sx-crumb-title-input` 승계).
- `contextSlot` — WRITE: 회차 스텝 픽커(`‹ N화 · 제목 ›` — legacy `ex-chapter-picker` JSX·`stepChapter` 승계, 연재 && chapters>0 일 때) · PLAN: `캐논 N` 칩 + `bibleAlertCount>0` 이면 `⚠ 충돌 N` 칩(클릭 → `openBibleSection('approval')`).
- `planBadge = bibleAlertCount`(continuitySummary.blocked+warnings — 이미 모드 무관 계산됨, `StoryXDesk.tsx:994`).
- `rightSlot` = `<>{syncSlot}<OverflowMenu …/></>`.
- draft/bible 조기 반환 JSX 를 `<>{modeBar}{…}</>` 로 감싼다(구조 변경 최소).

### 4.3 App 배선

- editor stage — `WorkspaceModeBar` 직접 렌더 제거. `key={syncVersion}` 로 축소(studioView 제거). `syncSlot={<SyncConsole …/>}`·`onSelectPlayMode={() => selectWorkspaceMode('play')}`·`onStudioViewChange={setStudioView}` 전달. `initialStudioView` 는 mount 시드로 유지(⟳최신화 remount 후 현재 뷰 복원 — `onStudioViewChange` 가 최신값 보장).
- dive stage — 현행 그대로(App 이 wm-bar 렌더, workTitle 텍스트·planBadge 없음).

### 4.4 FloatingEditor 해체 + 시트 끝 CTA

- `.topbar` header 제거(브랜드·doc-id·저장됨·편집/데이터 탭·출간·잠금 확정·초안 생성 전부). `onSwitchTrack`·`onOpenPublish` props 는 제거하지 않고 무해하게 남겨도 되나, 참조가 사라지므로 정리(tsc 가 잡음).
- 신규 `.fc-sheet-cta` 행 — 시트(article.sheet) 마지막 자식. `[✦ mainActionLabel|생성 중…|헌장 잠금 필요]`(onGenerateDraft·isGenerating·productionBlockedReason 승계) + `canConfirmLock` 이면 `[잠금 확정(lockLabel)]`. 읽기전용(isLocked) 회차에선 잠금 해제 안내가 이미 있으므로 CTA 행은 생성 버튼만 유지.
- 집중 모드 CSS(`.fc-app.focus .topbar`)는 대상이 사라져 무해 — 그대로 둠.
- 하단에 `DeskMetaLine` 렌더 — 좌 `N문단 · {charCount}`(paragraphs.length 재사용) · 우 `metaRightSlot`(StoryXDesk 가 저장 칩+`AiStatusBadge` 주입).

### 4.5 FloatingDataWorkspace 해체

- `.topbar` header 제거. `title`·`episodeLabel`·`onSwitchTrack` props 제거(대체 — wm-bar titleSlot·contextSlot·토글). `onOpenPublish` 는 ⋯ 메뉴로 이동하므로 제거.
- 하단 `DeskMetaLine` — 좌 `캐논 N · 떡밥 N`(project.canonFacts·openThreads) · 우 metaRightSlot.

### 4.6 `DeskMetaLine.tsx` (신규 순수)

```ts
interface DeskMetaLineProps { left: string; rightSlot?: ReactNode; }
```

하단 고정 얇은 줄(`.dm-line`). 다크 토큰(`--lc-*`/`--sx-*`) 스코프. PLAY 에는 렌더하지 않는다.

### 4.7 `OverflowMenu.tsx` (신규 순수 + StoryXDesk 배선)

- `⋯` 버튼 + 팝오버(바깥 클릭/Escape 닫힘 — legacy settings popover 패턴 승계). 항목 = props 배열 `{ label, onSelect }`.
- StoryXDesk 주입 항목 — `출간`(`onOpenPublish ?? openPublishingMode` — 기존 폴백 로직 미러) · `JSON 내보내기`(`handleExport` 재사용) · `JSON 가져오기`(`handleImportClick` + hidden file input 을 메뉴 옆으로 이동 — legacy 에서 승계).

## 5. 데이터 흐름

```
wm-bar 토글(WRITE↔PLAN) → switchToTrack(내부 페이드) + onStudioViewChange(App 동기화)
wm-bar 토글(PLAY)        → onSelectPlayMode → App selectWorkspaceMode('play') → stage 전환(현행)
⟳최신화                  → (현행) syncVersion++ → StoryXDesk remount → initialStudioView=최신 studioView 복원
시트 끝 CTA              → onGenerateDraft(현행 mainActionRun 경로 그대로)
⋯ 출간                   → onOpenPublish(stage) ?? openPublishingMode(내부)
```

## 6. 테스트 계획 (TDD)

**`workspaceModeBar.test.ts` (+3)** — titleSlot 렌더(폴백 workTitle 과 배타) · contextSlot 렌더 · planBadge>0 이면 PLAN 버튼에 배지, 0/undefined 면 미렌더.

**`deskMetaLine.test.ts` (신규)** — left 텍스트·rightSlot 렌더 · 최소 마크업(`.dm-line`).

**`overflowMenu` (신규 스모크)** — 항목 렌더·onSelect 배선(data 속성 계약).

**`editorFocusLayout.test.ts` (교정)** — pill topbar 단언(편집/데이터 탭·btn-publish·btn-primary in topbar)을 새 계약으로 교체 — ① FloatingEditor 마크업에 `.topbar` 부재 ② `.fc-sheet-cta` 에 메인 CTA(라벨·disabled 게이트) ③ DeskMetaLine 존재. legacy 소스 단언(`ex-workbar` 등)은 소스가 남으므로 통과 유지.

**StoryXDesk 조립·App 배선** — tsc + 라이브(관례).

**런칭 게이트(라이브·preview)** — ① WRITE/PLAN/PLAY 왕복 — 상단 크롬이 wm-bar 하나뿐(pill 부재) ② WRITE↔PLAN 전환이 remount 없이 페이드(편집 중 스크롤 유지) ③ 시트 끝 CTA 로 초안 생성 동작 ④ ⋯ 메뉴 출간 진입·JSON 내보내기 다운로드 ⑤ 캐논 충돌 시 PLAN 배지·⚠칩 표시 ⑥ 싱크 콘솔(PLAY +N·⟳최신화) 현행 동작·최신화 후 현재 뷰 복원 ⑦ `harness-verifier` 로 오버플로/겹침 검사 ⑧ 콘솔 0.

## 7. 리스크 + 대응

- **editorFocusLayout.test.ts 광범위 단언** — topbar 제거로 깨지는 단언을 새 구조 계약으로 교정(더 강한 계약 — "pill 부재 + 시트 끝 CTA"). 소스 단언과 렌더 단언을 구분해 접근.
- **remount 제거의 숨은 의존** — studioView key 에 기대던 재시드가 있으면 내부 전환에서 상태가 남을 수 있음 → switchToTrack 이 이미 내부 전환 정식 경로(기존 편집/데이터 탭이 쓰던 것)라 위험 낮음. 라이브 왕복으로 검증.
- **양방향 동기화 루프** — onStudioViewChange 는 App state 기록 전용, StoryXDesk 렌더에 되먹임하지 않음(initialStudioView 는 mount 시만 사용). 루프 없음.
- **wm-bar 이원 렌더(App=dive · StoryXDesk=editor)** — 같은 순수 컴포넌트라 look/동작 동일. sticky top:0 불변식은 CSS 가 컴포넌트 스코프라 유지.
- **CTA 발견성 저하(시트 끝)** — 빈 원고에선 즉시 보임. 긴 회차에서 멀어지는 트레이드오프는 사용자가 인지하고 선택(문서형). ⌘K 팔레트의 생성 명령이 보조 동선으로 이미 존재.
- **큰 파일(StoryXDesk 3.5k·FloatingEditor 1.2k)** — 추가는 국소(모드 바 렌더·props)·삭제는 topbar 블록 한 덩어리. 매 편집 tsc.

## 8. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/components/WorkspaceModeBar.tsx` | titleSlot·contextSlot·planBadge 확장 |
| `src/components/workspaceModeBar.test.ts` | +3 TDD |
| `src/components/DeskMetaLine.tsx` | **신규** 하단 메타 줄(순수) |
| `src/components/deskMetaLine.test.ts` | **신규** |
| `src/components/OverflowMenu.tsx` | **신규** ⋯ 팝오버(순수) |
| `src/components/overflowMenu.test.ts` | **신규** 스모크 |
| `src/components/FloatingEditor.tsx` | topbar 제거 · `.fc-sheet-cta` · DeskMetaLine · props 정리 |
| `src/components/FloatingDataWorkspace.tsx` | topbar 제거 · DeskMetaLine · props 정리 |
| `src/StoryXDesk.tsx` | 모드 바 렌더(슬롯 채움)·신규 props·⋯ 항목·metaRightSlot 주입 |
| `src/App.tsx` | editor stage 바 렌더 제거·key={syncVersion}·신규 props 전달 |
| `src/editorFocusLayout.test.ts` | topbar 단언 → 새 계약 교정 |
| `src/styles.css` | `.wm-*` 슬롯·`.fc-sheet-cta`·`.dm-line`·`.om-*` CSS |

## 9. 완료 기준

- `npm test` 녹색 · `npm run build` 성공.
- 런칭 게이트(§6) 전부 — 특히 "상단 크롬 = wm-bar 하나" · "충돌 배지 가시성 유지" · "싱크 콘솔 현행 동작".
- progress.md·session-handoff.md 갱신.
- **범위 밖 재확인** — legacy 최종 return 삭제 · 집중 모드 크롬 숨김 · PLAY planBadge · PLAN staged.
