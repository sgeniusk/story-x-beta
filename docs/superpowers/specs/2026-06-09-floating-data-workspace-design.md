# 데이터 모드 floating화 (Phase 2c) — "떠 있는 작업실" 데이터 작업실 설계

> 2026-06-09. 편집(FloatingEditor)이 자리 잡은 "떠 있는 작업실" 언어를 데이터/캐논 모드로 확장한다.
> 코드 하네스 상태는 `progress.md`, 스토리 하네스 설계는 `docs/storyx-harness-architecture.md`.

## 배경

현재 편집 모드는 `FloatingEditor`(어두운 캔버스 + 종이 시트 + 좌측 플로팅 독 + 떠오르는 패널)로 통일돼 있다. 반면 **데이터 모드(`activeTrack === 'bible'`)는 아직 옛 classic 3컬럼**이다 — `DataLeftRail`(좌) · `CanonCanvas`/`MemoryBankStudio`(중앙) · `DataReviewRail`/`BibleAssistantSidebar`(우). FloatingEditor 상단바의 "데이터" 탭을 누르면 이 옛 화면으로 빠져나간다.

`progress.md`·`session-handoff.md`가 남긴 "Phase 2c — 데이터(캐논/바이블) floating화"가 이 갭이다.

## 설계 철학 (사용자 확정)

1. **간편한 표면** — 진입 첫인상은 raw 데이터를 다 펼치지 않는다.
2. **정제된 것만 노출** — 표면엔 **지표**(하니스·품질·온톨로지·전제 진척)와 **검토 요약**만.
3. **세부는 보이지 않는 곳에서** — 인물 관계 편집·캐논 확정·승인 같은 raw 작업은 *파고든 뒤* 또는 패널 안에서만.
4. **고정 레일 금지, 자유도 우선** — 우측 고정 레일 대신 FloatingEditor와 같은 **떠오르는 패널** 방식.

## 범위

### 이 스펙 (Phase 2c)
- `FloatingDataWorkspace.tsx` 신설 — FloatingEditor의 형제, 같은 `.fc-*` 셸 언어 공유, 순수 표현 컴포넌트.
- `StoryXDesk`가 `isBibleMode`일 때 옛 3컬럼 대신 `FloatingDataWorkspace`를 렌더(`isDraftMode` early return 미러).
- `DataView`에 `{ kind: 'board' }` 추가 → 데이터 모드 기본 = 정제 보드.

### 후속 (별도 — 이번 세션 "코드성 개선 묶음"에서)
상단바 압축 · 매체별 검토 배선 · P1 빈응답 폴백 가드 · 2f dead code 정리(옛 isBibleMode 3컬럼 잔재 포함). 데이터 floating이 끝나면 "좌레일 위계" 같은 항목은 자연 소멸하므로 그때 재평가한다.

## 컴포넌트 설계

### `FloatingDataWorkspace.tsx` (신설, 순수 표현)

FloatingEditor를 **건드리지 않는다**(handoff "손대지 말 것"). 편집기는 contentEditable·IME·마진 정렬 같은 *편집* 복잡성으로 862줄이다. 데이터는 그게 없어 오히려 단순하다. 셸 외곽(`fc-app`·topbar·scrim·집중)은 CSS를 공유하므로 코드 중복이 작다.

데이터는 전부 props 주입 — `StoryXDesk`가 단일 원천. 컴포넌트는 표시·콜백 위임만 한다.

```
interface FloatingDataWorkspaceProps {
  // topbar
  title: string;
  episodeLabel: string;            // 예: "데이터 · 캐논 12 · 인물 3"
  onSwitchTrack: (t: 'draft' | 'bible') => void;
  onOpenPublish?: () => void;

  // 뷰 상태 + 전환
  dataView: DataView;              // 'board' | 'canon' | 'bible'
  onSelectCategory: (c: CanonCategory) => void;
  onSelectBibleSection: (s: BibleSection) => void;
  onShowBoard: () => void;         // 정제 보드로 복귀

  // 정제 보드 자료
  metrics: StudioMetrics;          // 지표 (DataPanel 재사용)
  onMediaAxisChange?: (axis: number) => void;
  canonHealth: number;
  dataReviewResults: Partial<Record<CanonCategory, DataReviewView>>;

  // 분야별 검토 (독 "검토" 패널 + canon 파고들기 우측)
  dataReviewingCategory: CanonCategory | null;
  onRequestReview: (c: CanonCategory) => void;

  // 세부 — CanonCanvas / MemoryBankStudio 재사용에 필요한 묶음
  project: SeriesProject;
  memoryBank: MemoryBank;
  approvalQueue: MemoryApprovalQueue;
  approvalDecisions: Record<string, ApprovalDecision>;
  bibleAssistantRuns: ...;
  canonChanges: CanonChangeEntry[];
  canonRefactorPlan: CanonRefactorPlan;
  onUpdateCharacter / onUpdateWorldRule / onUpdateCanon / onUpdateProject /
  onUpdateCreativeWeight / onSetApprovalDecision / onUpdateApprovalStatement /
  onSyncApprovedMemory / onRequestReview(bible) / onClearCanonChanges / onOpenBibleSection
}
```

### 레이아웃 매핑

```
┌── topbar ────────────────────────────────────────┐
│ X  작품명 › 데이터   [편집|데이터]          출간  │   ← FloatingEditor와 동일 셸, 데이터 탭 활성
├───┬──────────────────────────────────────────────┤
│독 │              중앙 캔버스                        │
│지표│  board → 정제 보드(지표 요약 + 검토 요약)       │   ← 기본 첫인상
│검토│  canon → CanonCanvas (관계도/카드/타임라인)     │   ← 파고들기
│───│  bible → MemoryBankStudio (계약·원장·문체·승인) │   ← 파고들기
│캐논│                                               │
│바이블│   떠오르는 패널: 독 버튼이 각자 토글           │
│상태│                                               │
│집중│                                               │
└───┴──────────────────────────────────────────────┘
```

**좌측 플로팅 독 — 정제 자료를 앞에, 세부를 뒤에**
| 버튼 | 패널/동작 |
|---|---|
| 지표 | 떠오르는 패널 — `DataPanel`(하니스·품질·매체·온톨로지·전제진척). 편집기 metrics와 동일 데이터 |
| 검토 | 떠오르는 패널 — 분야별 데이터 검토 실행·결과(`DataReviewRail` 흡수) |
| (구분선) | |
| 캐논 | 떠오르는 패널 — 5분야 nav(`CanonNav`). 고르면 중앙이 `CanonCanvas`로 파고듦 |
| 바이블 | 떠오르는 패널 — 4진입점(계약·원장·문체·승인). 고르면 중앙이 `MemoryBankStudio`로 |
| 상태 | 떠오르는 패널 — 작품 상태 4셀 + 캐논 건강도(`WorkStateGrid` 흡수) |
| 집중 | FloatingEditor와 동일 |

**중앙 정제 보드 (`board`)**
- 상단 = 지표 요약. `DataPanel`(하니스·품질·매체·온톨로지·전제진척)을 floating 톤(`.fc-data-board`)으로 감싸 **그대로 재사용**한다.
- 하단 = 검토 요약. 분야 5종 각각 "검토됨/미검토 · 정합 N · 제안 M"을 한 줄씩. 누르면 그 분야로 파고들며 독 검토 패널 오픈.
- "작품이 지금 건강한가"를 한눈에. raw 엔티티는 없다.

**파고들기 → 복귀** — 캐논/바이블 패널에서 분야를 고르면 `dataView`가 바뀌고 중앙이 세부로. 캔버스 머리말의 breadcrumb("데이터 › 인물")을 누르거나 독 빈 곳/Esc로 `board` 복귀(`onShowBoard`).

## 상태 모델

`DataView`에 보드 종류를 추가한다(`src/lib/canonDataView.ts`).

```
export type DataView =
  | { kind: 'board' }                                  // 신규 — 정제 보드(데이터 모드 기본)
  | { kind: 'canon'; category: CanonCategory }
  | { kind: 'bible'; section: BibleSection };
```

- 데이터 모드 진입(`onSwitchTrack('bible')`) 시 `setDataView({ kind: 'board' })`로 리셋 → 첫인상이 보드.
- 옛 3컬럼 JSX는 `isBibleMode` early return으로 분리되므로 `board` 상태를 받지 않는다(회귀 없음). 옛 그리드는 이제 `isPublishingMode` 전용이 된다.

## 데이터 흐름 · 배선

`StoryXDesk.tsx`:
- `floatingDataProps` useMemo 신설(`floatingEditorProps`(1231) 패턴 미러). 위 props를 이미 존재하는 state/콜백에서 묶는다.
- `isDraftMode` early return(2034) 바로 뒤에 `if (isBibleMode) return <FloatingDataWorkspace {...floatingDataProps} />;` 추가.
- "데이터" 탭 콜백(`onSwitchTrack('bible')`)에 `setDataView({ kind: 'board' })` 동기화.

옛 3컬럼 데이터 분기(좌 `DataLeftRail`, 중앙 `CanonCanvas`/`MemoryBankStudio`, 우 `DataReviewRail`/`BibleAssistantSidebar`)는 early return으로 **도달 불가**가 된다. 이번 스펙에선 삭제하지 않고 둔다(테스트 source 단언 보존). 삭제는 후속 2f에서 일괄.

## CSS 전략

- `.fc-*` 셸(topbar·canvas·dock·panel·scrim·focus)은 styles.css에서 **재사용**.
- 데이터 전용은 `.fc-data-*`로 신규(`.fc-app` 스코프 안). 정제 보드 카드·검토 요약 줄·breadcrumb.
- 전역 `--sx-*`/`--nx-*`/`--lc-*` 토큰 불변. 새 리터럴 색 금지.

## 테스트 전략 (TDD)

1. `canonDataView.test.ts`(없으면 신설) — `DataView`에 `board` 추가가 기존 헬퍼(`getCategoryEntities`·`categoryCount`)를 깨지 않음.
2. `floatingDataWorkspace.test.ts` 신설(react-dom + jsdom, `floatingEditor.test.ts` 패턴) — board 기본 렌더, 독 6버튼, 지표/검토 요약 표시, 캐논 패널에서 분야 선택 시 `onSelectCategory` 호출, breadcrumb `onShowBoard`.
3. `editorFocusLayout.test.ts` 갱신 — `isBibleMode` early return으로 `FloatingDataWorkspace` 렌더 경로 단언.

기존 데이터 컴포넌트(`CanonCanvas`·`MemoryBankStudio`·`DataReviewRail`·`DataPanel`)는 계약 불변이라 회귀 없음.

## 비범위

- PublishingStudio floating화(2d) — 별도.
- 회차/곡선 리치판(`ChapterStructureTree`/`TensionShareChart`) 데이터 모드 이식.
- 데이터 컴포넌트 내부 로직 변경 — 표시 위치만 옮긴다.

## 위험 · 완화

| 위험 | 완화 |
|---|---|
| props 폭증(MemoryBankStudio가 받는 콜백 다수) | `floatingDataProps` useMemo 한 곳에 묶음. FloatingEditor 선례와 동일 |
| `board` 추가가 옛 3컬럼·다른 사용처를 깸 | early return으로 옛 그리드는 `isPublishingMode` 전용화 → board 미도달. 타입 분기 전수 확인 |
| 정제 보드가 비어 보임(데이터 적은 작품) | 빈 상태 카피 + 지표는 항상 계산되므로 최소 표시 보장 |
| FloatingEditor 회귀 | 편집기 파일 무수정. 셸 CSS만 공유 |

## 검증 계획

- `bash init.sh` — tsc · vitest · build 녹색.
- 라이브(Playwright) — `?stage=editor`에서 "데이터" 탭 → 정제 보드 첫인상 캡처 · 독 패널 토글 · 캐논 파고들기→복귀 · 콘솔 0 · 360 모바일 독/패널 뷰포트 내.
- before/after 캡처를 `docs/handoff/screenshots/floating-phase2c/`에.

## 산출

`FloatingDataWorkspace.tsx` 신설 · `canonDataView.ts` DataView 확장 · `StoryXDesk.tsx` 배선 · `styles.css` `.fc-data-*` · 테스트 3묶음 · 라이브 캡처.
