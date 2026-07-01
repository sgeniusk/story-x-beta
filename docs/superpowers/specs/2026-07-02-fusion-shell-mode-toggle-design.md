# 융합 셸 슬라이스 A — 3모드 토글 + 단일 project 소스 설계

<!-- PLAY/WRITE/PLAN 세 표면을 같은 작품 위에서 상단 토글로 왕복하게 만드는 융합의 첫 뼈대. 싱크 콘솔은 다음 슬라이스. -->

> 작성 2026-07-02 · 상태 `draft` · 근거 session-handoff 2026-06-30 (2차) "융합 = 항상 켜진 두 표면" + 사용자 brainstorming 결정(슬라이스 A) · 정본 `docs/research/2026-06-30-canon-governance.md`.

## 0. 한 문장

흩어진 `?stage=dive`(PLAY)와 `?stage=editor`(WRITE/PLAN) 이동을 상단 **PLAY/WRITE/PLAN 토글**로 통합하고, 세 표면이 `storageKey` 하나를 단일 project 소스로 공유하게 만든다.

## 1. 범위

**한다** — 상단 3모드 토글(`WorkspaceModeBar`) · storage 단일 소스 브리지(PLAY도 loadProject/saveProject) · StoryXDesk `initialStudioView`(WRITE=editor·PLAN=data 착지).

**안 한다 (다음)** — 싱크 콘솔·⟳최신화 게이트(슬라이스 B) · epilogue 풍 미니멀 재배치(C) · publish 4번째 모드 · StoryXDesk 내부 재작성.

## 2. 설계 결정 (brainstorming 확정 · 2026-07-02)

| # | 결정 | 근거 |
|---|---|---|
| D1 단일 소스 | `storageKey`(loadProject/saveProject) 유일 진실 · diveKey=세션 전용 | PLAY↔STUDIO 같은 작품 공유의 전제 · 이중 소스 분기 제거 |
| D2 토글 | 상단 `WorkspaceModeBar` 3버튼, stage+studioView 구동 | 재작성 아님 — 기존 부품(DiveDesk·StoryXDesk) 그대로 |
| D3 PLAN 착지 | StoryXDesk `initialStudioView` 프롭 | WRITE/PLAN 구분을 최소 프롭으로 · 내부 나머지 무변경 |

## 3. 아키텍처

### 3.1 단일 project 소스 브리지

현재 — DiveStage는 `DiveState{session,project}`(diveKey)를 소유, StoryXDesk는 `loadProject()`(storageKey)를 소유. **분리됨.**

변경 — `storageKey`를 유일 진실로.
- `DiveStage` — project를 `loadProject()`에서 초기화(세션은 diveKey에서). `onChange(session, project)` 시 `saveProject(project)` **추가** + `saveDiveState({session,project})` 유지(하위호환).
- PLAY 진입 시 project는 항상 storage 최신(STUDIO가 쓴 것 포함)을 반영.
- StoryXDesk는 무변경(이미 storageKey 사용) — PLAY가 쓴 것을 mount 시 픽업.

### 3.2 `WorkspaceModeBar` (신규 순수 컴포넌트)

```ts
export type WorkspaceMode = 'play' | 'write' | 'plan';
interface WorkspaceModeBarProps {
  mode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
  workTitle?: string;
}
```

- ▶ PLAY / ✎ WRITE / ◈ PLAN 3버튼(active 강조). 좌측 작품 제목. 순수 표현. 다크 토큰.

### 3.3 App 배선

- 상태 `workspaceMode: WorkspaceMode` 도출 — stage('dive'→play, 'editor'+studioView) 매핑, 또는 명시 state. 최소 = `studioView: 'editor'|'data'` state 추가.
- `WorkspaceModeBar`를 dive·editor 스테이지 상단에 렌더. onSelect —
  - play → `setStage('dive')`
  - write → `setStage('editor')` + `setStudioView('editor')`
  - plan → `setStage('editor')` + `setStudioView('data')`
- `<StoryXDesk initialStudioView={studioView} … />`.
- `DiveStage` — project 브리지(3.1).

### 3.4 StoryXDesk `initialStudioView`

- props에 `initialStudioView?: 'editor' | 'data'` 추가.
- 내부 초기 뷰 상태를 이 값으로 시드(기본 'editor' = 현행). 'data'면 데이터(캐논/바이블) 표면으로 착지. 내부 나머지 로직·나머지 뷰 전환 무변경.

## 4. 데이터 흐름

```
WorkspaceModeBar 토글
  play  → stage=dive → DiveStage(project=loadProject, session=diveKey)
                      → onChange: saveProject + saveDiveState
  write → stage=editor + studioView=editor → StoryXDesk(loadProject)
  plan  → stage=editor + studioView=data   → StoryXDesk(loadProject, data 착지)

단일 진실 = storageKey. PLAY 응결 커밋 → saveProject → WRITE/PLAN이 같은 회차 봄.
```

## 5. 테스트 계획 (TDD)

**`workspaceModeBar.test.ts` (신규)** — 3버튼 렌더 · active 모드 강조 클래스 · 클릭 시 onSelect(mode) 호출 · workTitle 표시.

**`storyEngine`/storage 또는 App 레벨** — DiveStage onChange가 `saveProject`도 호출(브리지) 회귀. (storage mock으로 saveProject 호출 검증, 또는 DiveStage 렌더+onChange 시뮬레이션.)

**StoryXDesk** — `initialStudioView='data'`면 데이터 표면 렌더(정적 렌더 스모크).

**런칭 게이트(라이브)** — PLAY에서 응결·승인 → WRITE 토글 시 그 회차가 STUDIO에 나타남(왕복). 모드 토글이 작품 상태를 잃지 않음. 콘솔 0.

## 6. 리스크 + 대응

- **project 이중 소스 분기** → storageKey 유일 진실 · PLAY 진입 시 loadProject 새로고침 · Dive onChange saveProject. 라이브 왕복 검증 필수.
- **App 스테이지 머신 교란** → 토글은 기존 setStage 재사용(새 라우팅 안 만듦) · studioView state만 추가. 기존 진입/뒤로 경로 보존.
- **StoryXDesk 초기 뷰 시드 리스크** → 프롭은 optional·기본 현행('editor'). 미전달 시 무변경(하위호환).
- **큰 파일 편집(App 1683·StoryXDesk 3300)** → 표면 편집만(라우팅·프롭 시드), 내부 로직 무변경. 매 편집 tsc.

## 7. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/components/WorkspaceModeBar.tsx` | **신규** 3모드 토글(순수) |
| `src/components/workspaceModeBar.test.ts` | **신규** TDD |
| `src/App.tsx` | studioView state · 토글 렌더 · DiveStage 브리지 · StoryXDesk 프롭 |
| `src/StoryXDesk.tsx` | `initialStudioView` 프롭 시드 |
| `src/lib/storage.ts` | (필요 시) 브리지 헬퍼 — 아니면 App에서 saveProject 직접 |
| `src/styles.css` | `.wm-*` 토글 CSS |

## 8. 완료 기준

- `npm test` 녹색 · `npm run build` 성공.
- 런칭 게이트 — PLAY↔WRITE/PLAN 왕복 시 같은 작품 공유(라이브), 상태 손실 0, 콘솔 0.
- progress/handoff 갱신.
- **범위 밖** — 싱크 콘솔·최신화 게이트·미니멀 재배치·publish 모드.
