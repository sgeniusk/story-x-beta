# 융합 셸 슬라이스 B — 싱크 콘솔(누적·⟳최신화, 가벼운 버전) 설계

<!-- PLAY 변경을 즉시 반영에서 staged 로 바꾸고, 상단 PLAY +N 배지 + ⟳최신화 로만 본편에 머지하는 git working-tree 모델의 첫 조각. 무거운 검토 게이트는 슬라이스 B-2. -->

> 작성 2026-07-02 · 상태 `draft` · 근거 session-handoff 2026-06-30 (2차) line 172 "싱크 콘솔(★ 사용자 발명)" + 목업 `.superpowers/brainstorm/60428-1782814983/content/sync-console.html` + 사용자 위임(2026-07-02) · 선행 슬라이스 A spec `docs/superpowers/specs/2026-07-02-fusion-shell-mode-toggle-design.md`.

## 0. 한 문장

지금 PLAY 변경을 `onChange` 마다 즉시 `saveProject` 로 본편에 반영하던 것을, **staged(diveKey working copy)에 쌓기만** 하고 상단 **`PLAY +N` 배지 + ⟳최신화** 버튼으로만 본편(storageKey)에 머지하는 git working-tree 모델로 바꾼다.

## 1. 범위

**한다** — PLAY staged 모델(즉시 `saveProject` 제거) · 순수 `countPendingSync` · 순수 `reconcileWorkingIntoCommitted`(append 머지) · 상단 싱크 콘솔(`PLAY +N` 배지 + ⟳최신화 버튼) · 최신화 후 STUDIO 표면 갱신.

**안 한다 (다음)** — 무거운 reconcile 검토 게이트(충돌 같음/다름·캐논 등록/보류, 승인형)는 **슬라이스 B-2** · PLAN staged(`PLAN +N`)는 후속(StoryXDesk 내부 staged 화 필요) · epilogue 풍 미니멀 재배치(C) · 이중 헤더 통합(C).

## 2. 설계 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 두 저장소 | committed=`storageKey`(본편·WRITE) · working=`diveKey.project`(PLAY 작업본) | git working-tree 비유 · PLAY 변경을 본편과 분리해 명시적 최신화 대상으로 |
| D2 append 머지 | 최신화 = working 통째 덮어쓰기 아니라 committed 에 없는 회차/캐논만 append | working 이 stale base 여도 WRITE 본편 편집 유실 방지(안전 우선) |
| D3 diveKey 가 진실 | pending·최신화 소스는 `loadDiveState().project` — DiveStage state 리프팅 안 함 | onChange 가 이미 saveDiveState 로 diveKey 영속 · App 이 콜백으로 pending 만 갱신 |
| D4 PLAY 진입 = working 우선 | 슬라이스 A line 305 `loadProject 로 project 교체` 되돌려 restored(working) 그대로 | staged 모델의 핵심 — WRITE→PLAY 리베이스(committed→working)는 B-2 게이트로 |
| D5 게이트 없음 | 최신화는 즉시 append 커밋(충돌 드러내기 없음) | 가벼운 버전 — 모델 전환 리스크와 게이트 통합 리스크 분리 |

## 3. 아키텍처

### 3.1 두 저장소 · 최신화 흐름

```
committed = storageKey (loadProject/saveProject)   ← 본편. WRITE 가 편집.
working   = diveKey.project (load/saveDiveState)    ← PLAY 작업본. 응결이 쌓임.

PLAY 응결/변경 → DiveStage onChange → saveDiveState(working)  [saveProject 제거]
                                     → App.onWorkingChange(working) → pendingSync 갱신
⟳최신화 → reconcileWorkingIntoCommitted(working, committed) → saveProject(reconciled)
        → pendingSync=0 · syncVersion++ (STUDIO remount 로 본편 반영)
```

### 3.2 순수 로직 (신규 모듈 `src/lib/syncConsole.ts`)

```ts
// 융합 셸 싱크 콘솔 — PLAY working copy 와 본편 committed 의 미반영 diff·머지(순수).
export interface PendingSync { chapters: number; canon: number; total: number; }

// working 에 있고 committed 에 없는 회차/캐논 수(id 기준). working 없으면 0.
export function countPendingSync(
  working: SeriesProject | null | undefined,
  committed: SeriesProject
): PendingSync;

// committed 에 없는 회차/캐논만 append 한 새 project(불변, WRITE 본편 편집 보존).
export function reconcileWorkingIntoCommitted(
  working: SeriesProject,
  committed: SeriesProject
): SeriesProject;
```

- diff 기준 = `Chapter.id`·`CanonFact.id`. committed 의 id 집합에 없는 것만 append.
- `reconcile` 는 committed 를 base 로 새 것만 뒤에 붙인다(기존 회차/캐논 순서·내용 보존). characters·world rules 등 다른 필드는 이번 범위 밖(회차·캐논만 머지 단위).

### 3.3 싱크 콘솔 UI (신규 순수 `src/components/SyncConsole.tsx`)

```ts
interface SyncConsoleProps {
  pending: PendingSync;
  onReconcile: () => void;
}
```

- `pending.total > 0` 일 때만 `▶ PLAY +N` 배지 + `⟳ 최신화` 버튼(pulse) 렌더. 0 이면 null(공간 안 차지).
- 목업 `.sc-sync` 톤(바이올렛 pending dot·최신화 버튼 그라디언트). `.sync-*` 스코프 다크 토큰.
- `WorkspaceModeBar` 우측에 나란히(이중 헤더 안 늘림 — 같은 상단 바 한 줄).

### 3.4 App 배선

- state `pendingSync: PendingSync` — 마운트 시 `countPendingSync(loadDiveState()?.project, loadProject())` 초기화.
- state `syncVersion: number`(0) — 최신화 시 ++, STUDIO `key` 에 포함해 remount.
- `DiveStage` props `onWorkingChange(project)` 추가 → onChange 내부에서 호출 → App `setPendingSync(countPendingSync(project, loadProject()))`.
- **`DiveStage` onChange 에서 `saveProject` 제거**(saveDiveState 만 유지).
- PLAY 진입 시 line 305 되돌림 — `const merged = restored;`(working 우선). seedAndEnter 의 최초 `saveProject`(새 작품 골격 committed 심기)는 유지 — WRITE/PLAN 이 빈 본편 안 보게.
- 최신화 핸들러 `reconcileSync()` —
  ```
  const working = loadDiveState()?.project;
  if (!working) return;
  saveProject(reconcileWorkingIntoCommitted(working, loadProject()));
  setPendingSync({ chapters:0, canon:0, total:0 });
  setSyncVersion(v => v + 1);
  ```
- `SyncConsole` 를 dive·editor 상단(WorkspaceModeBar 옆)에 렌더. 모든 모드에서 pending 표시·최신화 가능(목업 = WRITE 보며 PLAY +N 최신화).
- StoryXDesk `key={\`${studioView}-${syncVersion}\`}` — 최신화 후 본편 재로드.

## 4. 데이터 흐름 (왕복)

```
PLAY 응결 → working(diveKey) 에 회차 추가 · committed 불변 → PLAY +1 배지
WRITE 토글 → 본편(committed) 은 아직 그 회차 없음(staged)
⟳최신화 → reconcile append → committed 에 회차 합류 → syncVersion++ → WRITE 가 회차 봄 · 배지 사라짐
WRITE 원고 편집 → committed 직접 수정(append 머지가 기존 회차 보존하므로 다음 최신화에도 안전)
```

## 5. 테스트 계획 (TDD)

**`syncConsole.test.ts` (신규 · 순수)**
- `countPendingSync` — working=null → 0 · working 이 committed +2회차 → chapters:2 · +1캐논 → canon:1 · working==committed → 0.
- `reconcileWorkingIntoCommitted` — 새 회차만 append(기존 committed 회차 내용·순서 보존) · 중복 id 안 넣음 · committed 의 WRITE 편집(같은 id 다른 텍스트) 유지(working 옛 버전으로 롤백 안 함).

**`syncConsole` 컴포넌트 (신규 · react-dom 렌더 스모크)** — pending.total=0 → null · total=3 → 배지 "PLAY +3" · ⟳최신화 클릭 → onReconcile 호출.

**런칭 게이트(라이브)** — PLAY 응결 2회 → 상단 `PLAY +2` 배지 · WRITE 토글 시 본편에 그 회차 **없음**(staged 확인) · ⟳최신화 → 회차 합류·배지 사라짐 · WRITE 원고 한 줄 편집 후 다시 PLAY 응결→최신화 시 WRITE 편집 보존 · 콘솔 0.

## 6. 리스크 + 대응

- **PLAY 미반영 작업 유실** → working 은 diveKey 에 항상 영속(saveDiveState). 최신화 안 하고 나가도 재진입 시 복원. 검증 필수.
- **WRITE 본편 편집 롤백** → D2 append 머지(통째 덮어쓰기 금지). committed 를 base 로 새 회차만 append. TDD 로 직접 단언.
- **STUDIO 최신화 후 미갱신** → syncVersion 을 StoryXDesk key 에 포함(명시적 최신화 클릭 시 remount, 편집 유실 없음 — WRITE 는 committed 직접 편집이라 이미 저장됨).
- **슬라이스 A 불변식 2건 변경** → "즉시 saveProject"·"PLAY 진입 loadProject 교체"를 staged 모델로 **의도적 진화**(되돌림 아님). handoff 불변식은 당시 기준, 본 spec 이 새 계약. 명시 기록.
- **큰 파일 편집(App)** → 표면 배선만(state 2개·콜백·핸들러·prop). 내부 로직 무변경. 매 편집 tsc.

## 7. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/lib/syncConsole.ts` | **신규** countPendingSync·reconcileWorkingIntoCommitted(순수) |
| `src/lib/syncConsole.test.ts` | **신규** TDD |
| `src/components/SyncConsole.tsx` | **신규** 배지+최신화 버튼(순수) |
| `src/components/syncConsole.test.ts` | **신규** 컴포넌트 스모크 |
| `src/App.tsx` | pendingSync·syncVersion state · DiveStage saveProject 제거·onWorkingChange · PLAY 진입 working 우선 · reconcileSync · SyncConsole 렌더 · StoryXDesk key |
| `src/styles.css` | `.sync-*` 배지·버튼 CSS |

## 8. 완료 기준

- `npm test` 녹색 · `npm run build` 성공.
- 런칭 게이트(§5 라이브) — staged 확인 · 최신화 머지 · WRITE 편집 보존 · 미반영 유실 0 · 콘솔 0.
- progress/handoff 갱신.
- **범위 밖** — 무거운 검토 게이트(B-2) · PLAN staged · 미니멀 재배치.
