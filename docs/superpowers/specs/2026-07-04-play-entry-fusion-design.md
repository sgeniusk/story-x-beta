# PLAY 진입 융합 + wm-bar 공통 셸 — 설계

> 작성일 2026-07-04 · 브랜치(예정) `feat/play-entry-fusion` · 코드 하네스 progress.md "PLAY 진입 융합" 트랙

## 배경 — 무엇이 어긋났나

Story X 의 의도된 여정은 **하나의 작품을 세 표면(WRITE·PLAN·PLAY)에서 굴리는 것**이다. PLAY 는 "이 작품을 이어서 굴리는 놀이터"로, 캐릭터와 실시간 대화하며 장면을 굴려 회차/캐논 소재를 만들고, 그 산출물은 `⟳최신화`(싱크 콘솔)로만 본편에 합류한다. 세 표면은 `storageKey` 하나를 공유한다.

그런데 지금 PLAY 토글을 누르면 App 이 `stage==='dive'` 분기에서 **DiveStart(자유 서술 인테이크)** 를 띄운다 — *"어떤 이야기로 들어갈까요? 인물과 상황을 자유롭게 적어주세요"*. 이건 **새 작품을 시작할 때** 하는 질문이다. 사용자는 이미 작품을 열어둔 채 그 작품의 한 모드로 PLAY 를 눌렀으므로 "현 작품 이어하기"를 기대하는데, "새 이야기 만들기" 질문이 나온다. 이것이 dogfooding 피드백 "PLAY 누르면 너무 다른 얘기부터 한다"의 정체다(융합 슬라이스 A 잔여 부채).

더해서 두 가지 문제가 붙어 있다.

1. **데이터 위험** — `seedAndEnter`(App.tsx)가 새 빈 프로젝트를 `saveProject`로 **현재 본편에 덮어쓴다**. 작품을 열어둔 채 PLAY→자유 서술로 진입하면 본편이 교체된다.
2. **바 연속감 부재** — wm-bar 소유자가 stage 마다 다르다. editor stage 는 StoryXDesk 가(제목 input·컨텍스트·충돌 배지·싱크 슬롯 채움), dive stage 는 App 이(정적 작품명 + 싱크만) 각각 렌더한다. 전환마다 바 구성이 바뀌어 "가운데 내비 바가 연결된 느낌"이 없다.

## 목표

- PLAY 진입 = **현재 작품의 인물·캐논·최근 회차에서 이어 플레이**로 시딩. 자유 서술 신규 인테이크는 PLAY 자리에서 제거.
- 본편 덮어쓰기 위험 제거 — PLAY 는 현 본편을 절대 갈아엎지 않는다(diveKey working 만 시딩, 싱크 콘솔 불변식 계승).
- wm-bar 를 **공통 셸(App 소유 지속 프레임) + 모드 슬롯** 구조로 통일 — 브랜드·작품명·3모드 토글·싱크는 세 모드에서 동일 위치·동일 마크업, 모드별 컨텍스트는 한 줄 아래.

## 비목표 (후속)

- 자유 서술로 **새 작품**을 시작해 바로 PLAY 로 들어가는 온보딩 갈래(freewrite 단계에 붙일 후속 조각). DiveStart 컴포넌트는 이 경로용으로 **삭제하지 않고 보존**한다.
- 집중 모드 크롬 숨김, publish 4번째 모드.
- PLAY 세션에서 어느 인물로 시작할지 고르는 UI(이번엔 `characters[0]` 자동).

---

## 설계 1 — PLAY 진입 = 이어 플레이 시딩

### 새 순수 모듈 `src/lib/playEntry.ts`

```ts
// 현재 작품에서 PLAY 세션을 이어 시딩하는 순수 로직
import type { SeriesProject } from './storyEngine';
import type { DiveState } from './storage';        // schema 'storyx/dive/v1'
import { createDiveSession } from './diveSession';

export function seedPlayFromProject(project: SeriesProject): DiveState | null;
```

동작(순수, TDD 대상):

- `project.characters.length === 0` → **`null` 반환**(호출부가 "먼저 인물을 만들어주세요" 안내로 PLAN 유도).
- 주인공 = `project.characters[0]`(seedFromProposal 과 동일 관례). `characterId = characters[0].id`.
- `session = createDiveSession(characterId, project.id)`.
- **장면 파생** — 최근 회차 `project.chapters.at(-1)` 이 있으면 `scene = deriveContinuationScene(latest)`, 앞에 `직전 회차 이후 — ` 를 붙인다.
  - 회차가 0개면 `scene` 미설정(빈 채 진입, 작가가 🎬 에 첫 상황 직접 입력 — 현행 안전장치 유지).
- 반환 `{ schema: 'storyx/dive/v1', session, project }`. **project 는 loadProject() 로 받은 현재 본편 그대로**(빈 새 프로젝트 생성 금지).

`deriveContinuationScene(chapter)` 는 같은 파일의 순수 헬퍼. **실제 `Chapter` 필드 기준**(구현 중 발견 — `Chapter` 에 `summary` 필드 없음, `hook`·`beats: ChapterBeat[]`·`prose` 존재) 우선순위:
1. `prose` 마지막 문단(개행 기준 tail). 단 빈 초안 placeholder `FALLBACK_EMPTY_LINE`(storyEngine 에서 export)는 건너뛴다.
2. 없으면 마지막 `beats[].summary`(ChapterBeat 요약).
3. 없으면 `hook`.
4. 아무 단서 없으면 빈 문자열.

### App.tsx `stage==='dive'` 분기 교체

기존(제거 대상):
- `seedAndEnter` 의 `saveProject(project)` — **본편 덮어쓰기, 삭제**.
- `DiveStart` 렌더 블록 — PLAY 진입 경로에서 제거(컴포넌트 파일·import 는 후속 온보딩 경로용으로 보존하되, dive 분기에서 참조 제거).

교체 후 `stage==='dive'` 흐름:

1. `loadDiveState()` 복원본이 있으면 그대로(working 진실, 현행 유지).
2. `diveInit`(세션 내 방금 시딩) 있으면 그대로.
3. 둘 다 없으면(PLAY 첫 진입) → `seed = seedPlayFromProject(loadProject())`.
   - `seed === null`(인물 없음) → 안내 카드(`.dx-empty` 류): "이 작품에는 아직 인물이 없어요. PLAN 에서 인물을 먼저 만들어 주세요." + `PLAN 으로 이동` 버튼(`selectWorkspaceMode('plan')`). 본편·diveKey 무접촉.
   - `seed` 있으면 → `saveDiveState(seed)` (working 만), `setDiveInit(seed)`. **`saveProject` 호출 없음**. DiveDesk 진입.

`onWorkingChange` 는 현행 유지(`countPendingSync(project, loadProject())`).

### 불변식

- PLAY 는 committed(storageKey) 를 **읽기만** 한다. 쓰기는 오직 `⟳최신화`(reconcile 경로).
- 시딩된 project 는 현재 본편 스냅샷 — 인물·캐논·회차가 다 실려 DiveDesk 의 "📖 지난 이야기 N화" 크로니클과 캐논 컨텍스트가 그대로 붙는다.

---

## 설계 2 — wm-bar 공통 셸 + 모드 슬롯

### 소유권 재배치 (슬라이스 C 역전을 App 쪽으로 되돌림)

**공통 셸 = App 이 stage 스위치보다 위에서 소유하는 지속 프레임.** 세 모드에서 동일 위치·동일 마크업으로, 전환에도 재구성되지 않는다.

셸이 담는 것(App 소유·전 모드 공통):
- 브랜드 마크
- **작품 제목 input** — App 이 `workTitle` state 를 단일 소유. `title` 을 StoryXDesk 로 controlled prop 로 내려주고, StoryXDesk 는 자기 본문 제목 표시를 `props.title ?? project.title` 로 파생(단일 소유·분기 없음). 편집은 `onTitleChange` 로 App 에 올려 App 이 state 갱신 + storage 반영.
- **3모드 토글**(PLAY·WRITE·PLAN)
- **rightSlot** = 싱크 콘솔(`syncConsoleNode`, 이미 App state `pendingSync`) + `⋯` 오버플로 메뉴(출간·JSON 내보내기/가져오기).

한 줄 아래(모드별, **활성 표면이 렌더** — 차이가 자연스러운 곳):
- WRITE → 회차 픽커(이전/다음 회차) + 저장 상태(dm-save)
- PLAN → `캐논 N` · `⚠ 충돌 N` 칩
- PLAY → 🎬 현재 장면 상태(선택적) — 이미 DiveDesk 안에 있음

이 분리가 핵심이다. **네비게이션 프레임(브랜드+제목+토글+싱크)은 지속·동일**, **모드 컨텍스트는 한 줄 아래**에서 다르다. 사용자가 원한 "연결된 느낌"은 프레임이 제자리에 살아있어 나온다.

### WRITE↔PLAN 무리마운트 유지 (controlled 전환)

토글이 App 셸로 올라가므로 WRITE↔PLAN 전환도 App 이 구동한다. 슬라이스 C 의 "remount 없는 내부 전환" 불변식을 지키기 위해:

- StoryXDesk 의 `activeTrack` 을 **controlled 화** — App 이 `studioView`('editor'|'data') state 를 소유하고 prop 으로 내린다. StoryXDesk 는 prop→track 을 동기화(useEffect 또는 파생)하되 `key` 는 `syncVersion` 만 유지(studioView 를 key 에 넣지 않는다 → 깜빡임·편집 상태 소실 방지).
- 토글 `onSelect`:
  - `play` → `selectWorkspaceMode('play')`(stage='dive').
  - `write`/`plan` → App `setStudioView('editor'|'data')` + stage='editor'. StoryXDesk 내부 track 은 prop 반영으로 전환.

### App 변경 요약

- `stage==='editor'` 와 `stage==='dive'` **둘 다** 공통 셸(`WorkspaceModeBar`)을 App 이 렌더. StoryXDesk 는 더 이상 `WorkspaceModeBar` 를 렌더하지 않는다.
- App 이 `workTitle` state 소유(초기값 `loadProject().title`, `onTitleChange` 로 갱신+`saveProject` title 반영). remount(syncVersion) 시 재로드.
- 오버플로 메뉴 항목(출간·export·import): 출간=`setStage('publish')`, export/import=storage 헬퍼로 App 에서 호출(StoryXDesk 의 `handleExportProject`/`handleImportClick` 로직을 순수 storage 헬퍼로 추출해 공유). 만약 추출 비용이 크면 이번 조각에선 오버플로를 editor 모드에서만 노출하고 dive 모드에선 생략(연속감 핵심은 토글·제목·싱크라 허용). — **결정: export/import 헬퍼 추출(공유)** 로 간다(작은 순수화).

### StoryXDesk 변경 요약

- `WorkspaceModeBar` 렌더 제거. 관련 슬롯 구성(titleSlot input·rightSlot·overflowItems) 제거 또는 App 이관.
- `activeTrack` controlled 화(`studioView` prop 동기화).
- 제목 표시 `props.title ?? project.title`.
- 모드 컨텍스트(회차 픽커·캐논/충돌 칩)는 DeskMetaLine 계열 하위 줄 유지(현행 metaLeft/metaRightSlot 활용).
- `bibleAlertCount`(충돌 수)는 여전히 StoryXDesk 내부(`validateContinuity(project, draftClaims)` 기반) — 충돌 칩은 하위 줄에 둔다. 셸 planBadge 는 숫자에서 **dot 유무로 축소**.
  - ⚠ 위험 가시성 불변식(슬라이스 C): 충돌은 항상 드러낸다 — PLAN 모드 하위 줄 칩으로 보장. PLAY/WRITE 에서 PLAN 충돌 배지를 토글에 띄우던 것을 없애므로, **다른 모드에 있을 때 PLAN 충돌을 못 본다**는 후퇴가 생긴다. 이를 막기 위해 **토글의 PLAN 버튼에 작은 dot 배지** 만 셸에 남긴다.
  - **dot 값은 콜백 보고 방식**(App 재파생 아님). StoryXDesk 가 실제 `bibleAlertCount` 를 `onBibleAlertChange(count)` 로 App 에 올리고(effect), App 은 `bibleAlert` state 로 받아 셸 토글 dot(`count>0`)에 먹인다. 토글 dot 과 PLAN 하위 줄 칩이 **같은 숫자원**을 쓰므로 불일치 없음. dive stage 에선 마지막 보고값 유지(경고 dot 이라 stale-safe). App 재파생(draftClaims 없는 validateContinuity)은 PLAN 칩과 값이 어긋날 수 있어 채택 안 함.

---

## 데이터 흐름

```
App
 ├ workTitle(state) ──title──▶ StoryXDesk (props.title ?? project.title)
 │        ▲ onTitleChange
 ├ studioView(state) ──prop──▶ StoryXDesk activeTrack (controlled, no remount)
 │        ▲ onStudioViewChange (동기화 기록용)
 ├ pendingSync(state) ─▶ syncConsoleNode ─▶ 셸 rightSlot
 ├ 공통 셸 WorkspaceModeBar (brand·title·toggle·sync·overflow·PLAN dot)
 │        토글 onSelect: play→stage=dive / write·plan→stage=editor+studioView
 └ stage 스위치
     ├ editor → StoryXDesk (셸 아래 본문 + 모드 컨텍스트 하위 줄)
     └ dive   → seedPlayFromProject(loadProject()) → DiveDesk (본편 읽기전용, working 시딩)
```

## 테스트 계획 (TDD)

순수 우선:
- `playEntry.test.ts` — `seedPlayFromProject`: 인물 0→null · 회차 있음→scene="직전 회차 이후 — …"(summary 우선) · 회차 0→scene 미설정 · characterId=characters[0].id · project 동일 참조 보존(빈 프로젝트 안 만듦). `deriveContinuationScene`: summary 우선·prose tail 폴백·공백.
- (bibleAlert dot 은 순수 함수 추출 없이 콜백 보고 방식 — 별도 순수 테스트 대상 아님, 조립 라이브 검증.)
- storage export/import 헬퍼 추출 시 순수 라운드트립 테스트.
- `workspaceModeBar.test.ts` — 셸이 title input·toggle·rightSlot·PLAN dot 를 렌더(슬롯 계약).

조립(라이브):
- StoryXDesk activeTrack controlled 전환은 tsc + 라이브(remount 없는 DOM 마커 생존).

## 라이브 검증 게이트 (preview, 포트 5175)

1. 작품 열고 PLAY 토글 → **자유 서술 인테이크 안 나옴**, 현 작품 인물로 바로 DiveDesk, 🎬 장면에 "직전 회차 이후 —" 시딩, "📖 지난 이야기 N화" 크로니클 표시.
2. 인물 0 작품에서 PLAY → 안내 카드 + PLAN 이동 버튼, 본편 무변.
3. PLAY 진입 전후 `loadProject()` 회차 수 불변(본편 덮어쓰기 0).
4. PLAY↔WRITE↔PLAN 전환 시 **브랜드·제목 input·토글·싱크가 같은 자리 고정**(공통 셸), WRITE↔PLAN DOM 마커 생존(remount 없음).
5. 제목 편집이 세 모드에서 동일 input, 편집→저장→새로고침 지속.
6. PLAN 충돌 있을 때 다른 모드에서도 토글 PLAN 버튼 dot 표시, PLAN 하위 줄 `⚠ 충돌 N` 칩.
7. 오버플로 ⋯ 출간·내보내기·가져오기 동작(추출 헬퍼).
8. fresh reload 콘솔 0.

## 손대지 말 것 (계승 불변식)

- **App key = syncVersion 만**(⟳최신화 remount). studioView 를 key 에 넣지 않는다.
- **충돌 0 = 즉시 반영 / 기본 keep**(reconcile·PLAN staged 철학).
- **PLAY 는 committed 읽기 전용**, 쓰기는 ⟳최신화만.
- **PLAN 표면 편집은 패치로만**(PLAN staged 불변식) — 이번 조각은 PLAN staged 를 안 건드린다.
- 위험 가시성 — 충돌은 항상 드러낸다.

## 알려진 잔여 (후속)

- 자유 서술 새 작품→PLAY 온보딩 갈래(freewrite 단계).
- PLAY 세션 주인공 선택 UI(현재 characters[0] 자동).
- 토글 PLAN 배지를 dot→숫자 복원할지 결정.
- 홈 랜딩 원페이저(작성 흐름·서비스 특성 요약) — **별도 조각**(사용자 요청, 이 조각 완료 후).
