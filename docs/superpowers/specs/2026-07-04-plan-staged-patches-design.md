# PLAN staged — 설계실 패치 모델 설계

<!-- PLAN(바이블 편집)이 본편에 즉시 write-through 하던 것을, "수정 목록(패치)"으로 모아 PLAN +N 배지 → ⟳반영/버리기로 확정하는 staged 토대. PLAN = AI와 같이 짜는 설계실(사용자 결정)의 안전 기반. -->

> 작성 2026-07-04 · 상태 `draft` · 근거 — handoff 2026-07-03 3차 "다음 후보 PLAN staged" + 사용자 결정 4건(brainstorming·visual companion): ① PLAN 역할=**AI와 같이 짜는 설계실**(정비소 역할은 PLAY 전환 에이전트 과정으로) ② 이번 조각=**staged 토대만**(AI 설계 대화는 후속) ③ 구현=**패치(수정 목록) 모델** ④ UI=**통합 싱크 콘솔**(PLAY +N 옆 PLAN +N). 선행 spec `2026-07-02-fusion-shell-sync-console-design.md`(슬라이스 B)·`2026-07-02-fusion-shell-reconcile-gate-design.md`(B-2).

## 0. 한 문장

PLAN 트랙의 바이블 필드 편집이 `setProject → saveProject` effect로 본편(committed)에 직행하던 것을, 순수 패치 목록(`planStage.ts` + `planStageKey`)에 모아 화면에는 "본편+패치 겹침"으로 보여주고, 상단 통합 싱크 콘솔의 `PLAN +N` 배지에서 **본편에 반영(충돌 시 검토 다이얼로그) / 전부 버리기**로만 확정하는 staged 모델로 바꾼다.

## 1. 범위

**한다** — 순수 `planStage.ts`(패치 타입·upsert·count·overlay 적용·충돌 감지) · storage `planStageKey` 영속 · StoryXDesk PLAN 편집 핸들러의 패치 라우팅 + overlay 렌더 + staged 카드 표시 · `SyncConsole` 확장(PLAN +N 배지 + 반영/버리기 메뉴) · App 배선(pendingPlan·커밋·버리기·충돌 다이얼로그 `PlanApplyReview`) · SyncFlash "N설계" 확장.

**안 한다 (후속)** — PLAN 안 AI 설계 대화 채널(설계실 2단계) · 인물 추가/삭제/이름변경 staged 화(구조 변경은 현행 직행 유지) · 작품 헌장 개정 staged 화(자체 확정 흐름+스냅샷 보유, 현행 유지) · 승인 대기(approvalQueue) 합류 staged 화(이미 승인형) · staged 상태 연속성 미리 검사(overlay 로 bibleAlertCount 재계산) · WRITE/제목 staged 화.

## 2. 설계 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 PLAN 역할 | AI와 같이 짜는 **설계실** — 설계안은 정본이 아니므로 staged 가 자연스러움 | 사용자 결정. 정비소(PLAY 산출 정리)는 PLAY 전환 에이전트 과정으로 |
| D2 메커니즘 | working 사본이 아니라 **패치(수정 목록)** | WRITE·PLAN 이 한 project 객체 공유 — 사본 모델은 대수술. 패치는 WRITE 저장 경로 무접촉, N·검토·버리기가 목록에서 직접 나옴 |
| D3 staged 대상 | **필드 수정만** — 인물(desire·wound·currentState)·세계 규칙(rule)·캐논(statement)·스토리 코어(logline·audiencePromise·deepQuestion·formIntent·tone)·작품 무게중심 | PLAN 표면(MemoryBankStudio·CanonCanvas)이 부르는 편집 핸들러 전수. **title 은 wm-bar 소유(직행 유지)** — MemoryBankStudio 는 title 을 안 건드려 혼합 의미 없음 |
| D4 UI | 통합 싱크 콘솔 — `PLAY +N` 옆 `PLAN +N`, 배지 클릭 → "본편에 반영/전부 버리기" 메뉴 | 사용자 선택(목업 A안). 어느 모드에서든 미반영 설계 가시 · ⟳최신화 리듬 한 곳 통일 |
| D5 충돌 규칙 | 반영 시점에 `patch.before ≠ 현재 본편 값`이면 그 항목만 검토 카드. 기본 keep(본편 유지)·명시 선택만 내 설계로 덮음. 충돌 0이면 즉시 반영 | B-2 불변식 계승(기본 keep·충돌 0=즉시). 사이에 PLAY 최신화가 같은 캐논을 바꾼 경우가 주 시나리오 |
| D6 이력 | staged 편집은 `logCanonChange` 를 남기지 않음 — 패치 목록 자체가 before/after 이력·되돌리기 역할 | 이중 이력 방지. 반영 후 remount 로 세션 로그는 어차피 초기화(현행과 동일) |

## 3. 아키텍처

### 3.1 순수 로직 — `src/lib/planStage.ts` (신규)

```ts
export type PlanPatch =
  | { kind: 'character'; id: string; field: 'desire' | 'wound' | 'currentState'; label: string; before: string; after: string }
  | { kind: 'world'; id: string; label: string; before: string; after: string }
  | { kind: 'canon'; id: string; label: string; before: string; after: string }
  | { kind: 'story-core'; field: 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone'; label: string; before: string; after: string }
  | { kind: 'creative-weight'; label: string; before: CreativeWeight; after: CreativeWeight };

export function patchKey(patch: PlanPatch): string;            // `${kind}:${id ?? '-'}${field ? `:${field}` : ''}`
export function upsertPlanPatch(patches: PlanPatch[], next: PlanPatch): PlanPatch[];
export function applyPlanPatches(project: SeriesProject, patches: PlanPatch[]): SeriesProject;
export interface PlanConflict { key: string; label: string; committedValue: string; after: string; }
export function derivePlanConflicts(patches: PlanPatch[], committed: SeriesProject): PlanConflict[];
export function resolvePlanApply(
  committed: SeriesProject,
  patches: PlanPatch[],
  conflicts: PlanConflict[],
  decisions: Record<string, 'keep' | 'apply'>
): SeriesProject;
```

- **upsert 규칙** — 같은 key 의 기존 패치가 있으면 교체하되 `before` 는 기존 것(최초 본편 값) 유지. `after === before` 가 되면 패치 삭제(원복 자동 소멸 → N 부풀지 않음).
- **applyPlanPatches** — 대상 엔티티/필드에 `after` 를 제자리 적용한 새 project 반환(불변). **대상 id 가 없으면 그 패치는 건너뜀**(그 사이 엔티티 소멸 — 희귀 edge, 조용히 drop).
- **derivePlanConflicts** — 각 패치의 현재 본편 값을 셀렉터로 읽어 `before` 와 다르면 충돌. 대상 소멸은 충돌 아님(위 drop 규칙).
- **resolvePlanApply** — 충돌 패치는 decisions `apply` 만 적용(`keep`·미결정은 drop), 비충돌 패치는 전부 적용. committed 불변.

### 3.2 storage — `src/lib/storage.ts`

- `planStageKey = 'serial-story-studio/plan-stage'` · `loadPlanPatches(): PlanPatch[]` (스키마 불일치·파싱 실패 시 `[]`) · `savePlanPatches(patches)` · `clearPlanPatches()`.

### 3.3 StoryXDesk 배선

- state `planPatches: PlanPatch[]` — 초기값 `loadPlanPatches()`. 변경 시 effect 로 `savePlanPatches` + `onPlanPatchesChange?.(planPatches.length)` 보고(신규 optional prop, App 이 배지 카운트 수신).
- **패치 라우팅** — PLAN 표면에 넘기는 핸들러 5종(`updateCharacterMemory`·`updateWorldMemory`·`updateCanonMemory`·`updateProject`(MemoryBankStudio 전달분)·`updateCreativeWeight`)을 staged 변형으로 교체: `setProject` 대신 `setPlanPatches(upsertPlanPatch(...))`. `logCanonChange` 호출 제거(D6). **wm-title-input 의 `updateProject('title', …)` 은 현행 직행 유지.**
- **overlay 렌더** — `overlayProject = useMemo(() => applyPlanPatches(project, planPatches), [project, planPatches])`. PLAN 분기(isBibleMode)의 `CanonCanvas`·`MemoryBankStudio`·`FloatingDataWorkspace` 에 `project` 대신 `overlayProject` 전달. WRITE 분기·`editorWorkspace`·`bibleAlertCount`·contextSlot 은 현행(committed 기준) 유지.
- **staged 카드 표시** — `stagedKeys = new Set(planPatches.map(patchKey))` 를 PLAN 표면에 전달, 패치가 있는 카드/필드에 `is-plan-staged` 클래스 + "설계안 (미반영)" 라벨(보라 점선, 목업 확정).

### 3.4 SyncConsole 확장 — `src/components/SyncConsole.tsx`

```ts
interface SyncConsoleProps {
  pending: PendingSync;
  onReconcile: () => void;
  planPending?: number;          // 신규
  onPlanApply?: () => void;      // 신규
  onPlanDiscard?: () => void;    // 신규
}
```
- `pending.total <= 0 && planPending <= 0` 이면 null(현행 계약 유지). PLAY 절은 현행 그대로.
- `planPending > 0` 이면 `PLAN +N` 배지(보라 톤) — 클릭 시 로컬 popover 메뉴 "⟳ 본편에 반영 (N건)" / "✕ 전부 버리기". Escape·외부 클릭 닫기.

### 3.5 App 배선 + `PlanApplyReview.tsx` (신규 순수)

- state `pendingPlan: number`(초기 `loadPlanPatches().length`) · `planApplyState: { conflicts: PlanConflict[] } | null` · `planDecisions: Record<string, 'keep' | 'apply'>`.
- **반영** `applyPlanStage()` — `patches = loadPlanPatches(); committed = loadProject(); conflicts = derivePlanConflicts(patches, committed)`. 충돌 0 → `saveProject(resolvePlanApply(...)) · clearPlanPatches() · setPendingPlan(0) · setSyncVersion(v=>v+1) · setSyncFlash({plan: applied})` 즉시. 충돌 ≥1 → `setPlanApplyState({conflicts})` 다이얼로그.
- **다이얼로그 승인/취소** — 승인: `resolvePlanApply` 커밋 + 패치 비움 + remount(위와 동일). 취소: `setPlanApplyState(null)`(staged 유지).
- **버리기** `discardPlanStage()` — `clearPlanPatches() · setPendingPlan(0) · setSyncVersion(v=>v+1)`(remount 로 카드가 본편 값으로 복귀). 본편 무접촉.
- `PlanApplyReview` — 충돌 카드 `지금 본편 값(committedValue) ↔ 내 설계(after)` + [본편 유지(keep)][내 설계로(apply)] 토글(기본 keep) + 승인/취소. `ReconcileReview` 톤 재사용(`.rc-*` 또는 `.pa-*`).
- `syncSlot` 의 `<SyncConsole>` 에 `planPending·onPlanApply·onPlanDiscard` 추가 — editor·dive 두 stage 모두 같은 요소를 쓰므로 PLAY 중에도 PLAN +N 가시(D4).
- **SyncFlash** — payload 에 `plan?: number` 추가, "✓ 본편에 반영 — 3설계" 항목 렌더(0이면 생략, 현행 규칙 동일).

## 4. 데이터 흐름

```
PLAN 표면 편집 → upsertPlanPatch → planPatches state → savePlanPatches(planStageKey)
                                   ↘ overlayProject(본편+패치)로 PLAN 렌더 · is-plan-staged 표시
                                   ↘ onPlanPatchesChange → App pendingPlan → SyncConsole "PLAN +N"

PLAN +N 클릭 → 메뉴
  ⟳ 본편에 반영 → derivePlanConflicts(patches, committed)
      충돌 0 → resolvePlanApply 커밋 → 패치 비움 → syncVersion++ remount → 토스트 "N설계"
      충돌 ≥1 → PlanApplyReview (기본 keep · apply 명시 선택) → 승인 커밋 / 취소 staged 유지
  ✕ 전부 버리기 → 패치 비움 → syncVersion++ remount (본편 무접촉)
```

## 5. 테스트 계획 (TDD)

**`planStage.test.ts` (신규)** — upsert 같은 key 교체·최초 before 유지 · 원복(`after===before`) 시 패치 소멸 · applyPlanPatches 5종 kind 적용+대상 소멸 drop+committed 불변 · derivePlanConflicts before 불일치만 충돌 · resolvePlanApply keep drop/apply 적용/비충돌 전부 적용.

**`storage.test.ts` (+)** — planStageKey 저장/로드 왕복 · 깨진 페이로드 `[]` 폴백.

**`syncConsole.test.ts` (컴포넌트 +)** — planPending 0·pending 0 → null 유지 · planPending>0 → `PLAN +N` 배지 · 메뉴 열림 시 반영/버리기 항목 · onPlanApply/onPlanDiscard 호출.

**`planApplyReview.test.ts` (신규 스모크)** — 충돌 카드 committedValue·after 렌더 · 기본 keep · 토글 · 승인/취소.

**StoryXDesk 라우팅 (기존 계약 파일 +)** — PLAN 필드 편집이 `saveProject` 를 부르지 않고 planStageKey 에 패치가 쌓임 · overlay 값이 PLAN 표면에 보임. 기존 테스트 중 "바이블 편집 → project 즉시 반영" 단언은 3분법(교체 우선)으로 교정.

**런칭 게이트(라이브 preview)** — PLAN에서 캐논 문장 수정 → 본편 무변(localStorage 확인)·카드 보라 점선·`PLAN +1` 배지 → WRITE/PLAY 전환에도 배지 유지 → 버리기 → 카드 원복·배지 소멸 → 다시 수정 → 반영 → 본편 반영·토스트 "1설계"·배지 소멸 → (충돌 시나리오) PLAY 최신화로 같은 캐논 변경 후 PLAN 반영 → 검토 다이얼로그 기본 keep → 콘솔 0.

## 6. 리스크 + 대응

- **WRITE 회귀** — WRITE 저장 경로(`saveProject` effect·debounce prose commit) 무접촉. 라우팅은 PLAN 표면에 넘기는 핸들러 교체만. wm-title-input 직행 유지.
- **remount 불변식** — App key=`syncVersion` 만(슬라이스 C 불변식). 반영·버리기 모두 syncVersion++ 로 처리, 새 key 축 추가 금지.
- **이중 이력 혼선** — D6: staged 편집은 logCanonChange 안 남김. 기존 '변경 이력' 패널 단언 테스트가 있으면 3분법 교정.
- **패치·본편 드리프트** — 충돌은 반영 시점 감지(D5)라 staged 중 드리프트는 허용(설계실 자유). 대상 소멸은 조용히 drop — 검토 카드로 올리는 건 과설계로 보류.
- **App·StoryXDesk 큰 파일** — 표면 배선 위주(state·헬퍼·오버레이 전달). 매 편집 tsc.

## 7. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/lib/planStage.ts` | **신규** 순수 패치 모듈 |
| `src/lib/planStage.test.ts` | **신규** TDD |
| `src/lib/storage.ts` | planStageKey load/save/clear |
| `src/lib/storage.test.ts` | + 왕복·폴백 |
| `src/StoryXDesk.tsx` | planPatches state·staged 핸들러 라우팅·overlayProject·stagedKeys·onPlanPatchesChange |
| `src/components/SyncConsole.tsx` | PLAN +N 배지 + 메뉴 |
| `src/components/syncConsole.test.ts` | + 배지·메뉴 계약 |
| `src/components/PlanApplyReview.tsx` | **신규** 충돌 검토 다이얼로그(순수) |
| `src/components/planApplyReview.test.ts` | **신규** 스모크 |
| `src/components/SyncFlash.tsx` | + plan 항목 |
| `src/App.tsx` | pendingPlan·applyPlanStage·discardPlanStage·PlanApplyReview 오버레이·syncSlot 확장 |
| `src/styles.css` | `.is-plan-staged`(보라 점선)·배지 메뉴·다이얼로그 CSS |

## 8. 완료 기준

- `npm test` 녹색 · `npm run build` 성공 · `bash init.sh` 통과.
- 런칭 게이트(§5 라이브) 전 항목 — 특히 **PLAN 편집 중 본편 무변**·버리기 원복·충돌 기본 keep·콘솔 0.
- progress.md·session-handoff.md 갱신.
- **범위 밖 재확인** — AI 설계 대화 · 인물 추가/삭제/이름변경 staged · 헌장 staged · overlay 연속성 미리 검사.
