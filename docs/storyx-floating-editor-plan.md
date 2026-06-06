# Story X — Floating Editor (C방향) 이식 계획

> 멀티세션 작업 노트 + 체크리스트. 결정·매핑·단계·리스크를 한곳에 둔다. progress.md/session-handoff.md 는 프로젝트 표준대로 별도 갱신.

## 목표·범위
claude.ai design 에서 발산한 3방향 중 **방향 C "떠 있는 작업실"** 을 Story X 에 실제 구현한다.
- 범위(사용자 확정) — **편집 모드 + 진입 4화면**(랜딩·로그인·프로젝트·홈). 데이터 모드는 다음 단계.
- 진행 방식(확정) — `design/floating-editor` 브랜치, 단계별 tsc·test·4해상도 캡처 검증.

## 소스
- 디자인 번들 — `/tmp/storyx-design/story-x/` (claude.ai design export, README + chats/chat1.md + project/story-x/direction-{a,b,c}.html)
- 구현 대상 — `direction-c.html` (588줄, 최종본). 원본 보관 사본 → `docs/handoff/direction-c.html` 로 복사해 둔다.
- README 지시 — 픽셀 재현하되 프로토타입 내부 구조를 베끼지 말고 React 로 재현. chat 의도가 정본.

## C방향 핵심 (chat1.md 에서 확인된 사용자 의도)
1. 어두운 캔버스 위 **종이 시트(sheet, max 760px)** 가 떠 있고 본문이 주인공.
2. **떠 있는 상단바**(중앙 pill, backdrop blur) — 브랜드·제목·회차·저장·모드탭(편집/데이터)·출간·초안생성.
3. **좌우 분할 플로팅 독** — 왼쪽=구조(회차·곡선·상태), 오른쪽=작가진(작가실·집중). ≥1320px 분할, 이하 하단 한 줄 합본.
4. **넓은 여백 주석(margin note, 328px)** 이 본문 단락 옆에 정렬. ≤1080px 점 마커로, ≤768 인라인 점.
5. **출간은 탭이 아니라** 초안 생성 옆 별도 색(세이지 그린 아웃라인) 버튼.
6. 작가 의견이 달린 구절에 **작가별 색 ruled 밑줄 + 같은 색 점**. 의견 없는 단락엔 안 뜸. 밑줄 클릭→상세, 여백 호버→구절 강조.
7. 인터랙션 — 본문 드래그→작가 1명 호출 popover, "5명 전체 검토"→생각·읽기·표시·쓰기·완료 순차, 집중 모드, 모드 탭, 키보드(Esc/Enter).

## 현재 → C방향 데이터 매핑 (Explore 정밀 조사)
| C방향 | Story X 실제 |
|---|---|
| persona key `show/char/world/style/cont` | `showrunner·character-custodian·world-keeper·genre-stylist·continuity-editor` (`MARGIN_CORE_AGENT_IDS`, agentSeedData.ts) |
| persona 색 oklch | `extendedPersonas.ts` CORE_PERSONAS.tint (#e4f222·#dfa88f·#9fbbe0·#c0a8dd·#9fc9a2 — 거의 일치) |
| 여백 주석 / diff was→is | `MarginReview{persona, anchor, severity, head, body, diffs:InlineDiff[]}` (lib/marginReview.ts) |
| 단락 anchor | `ParagraphAnchor`(p1,p2…), 본문 = `editorText`/CreativeStage contentEditable |
| 검토 맡기기 / 한 명 호출 / 반영·보류 | `runMarginReviewAll` · `summonMarginReviewAgent` · `acceptMarginDiff` · reject (StoryXDesk + useMarginReview) |
| 회차구조·곡선·상태 패널 | `ChapterStructureTree` · `TensionShareChart` · `WorkStateGrid` · `AgentIntentCard` (좌레일 컴포넌트) |
| 집중 모드 | `isFocusMode` state (StoryXDesk:588) |

## 접근 — 병행 신설 후 스왑
- 새 컴포넌트 `src/components/FloatingEditor.tsx` 에 C방향 레이아웃을 React 로 재현. 실제 데이터/콜백을 props 로 받는다.
- CSS 는 styles.css 에 **`.fc-*` 네임스페이스**로 추가(기존 `.sx-*` 와 충돌 없이). oklch 토큰은 `.fc-app` 스코프 변수로 — 전역 Linear `--sx-*`/`--nx-*`/`--lc-*` 토큰은 보존(DoD).
- StoryXDesk 편집 모드 렌더 지점에서 플래그(초기 `?editor=floating`)가 켜지면 FloatingEditor 를, 아니면 기존 셸을 렌더 → 기존 `editorFocusLayout.test.ts` green 유지.
- 새 구조 단언은 `floatingEditor.test.ts` 로 추가(TDD). 완성·검증 후 floating 을 기본으로 스왑하고 그때 기존 테스트를 갱신.

## 단계 체크리스트
### 1. 편집 모드 floating (이번 핵심) — ✅ 데이터 배선 완료 (2026-06-05)
> 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-05-floating-editor-data-wiring*`. 브랜치 `design/floating-data-wiring`. 캡처 `docs/handoff/screenshots/floating-c-wired/`.
- [x] `floatingEditor.test.ts` 작성(RED→GREEN) — react-dom+jsdom 렌더, props·콜백·시안제거 단언
- [x] styles.css 에 `.fc-*` CSS 블록 (체크포인트 · 데이터 배선 단계엔 미변경 보존)
- [x] `FloatingEditor.tsx` — 레이아웃 + props 인터페이스 (시안 데이터 제거 → 순수 표현 컴포넌트)
- [x] 데이터 배선 — editorText·5 persona(CORE_PERSONAS)·MarginReview·회차구조/곡선/상태·검토 콜백
- [x] 인터랙션 — 드래그 호출 popover·전체 검토·반영/보류·집중·모드탭(no-op)·구절 밑줄(diff.from)
- [x] StoryXDesk 플래그 렌더 연결 (isFloatingPreview && isDraftMode → props 주입)
- [x] 검증 — tsc 0·297 tests·build + `?editor=floating` 1440·360 캡처(실 페르소나·검토 5건·콘솔 0). 768/1024 는 `.fc-*` 미변경이라 체크포인트 기검증과 동일
- [ ] `docs/handoff/direction-c.html` 원본 사본 보관 (선택)
### 2. 스왑 + 테스트 갱신
- [ ] floating 을 편집 모드 기본으로, 기존 3컬럼 셸 제거
- [ ] `editorFocusLayout.test.ts` 편집 모드 단언을 새 구조로 갱신(데이터/출간/캐논 단언은 보존)
### 3. 진입 4화면 톤 통일
- [ ] 랜딩·로그인·프로젝트·홈을 C방향 다크 editorial 톤으로
- [ ] 5화면 톤 일관 캡처

## 리스크
- **editorFocusLayout.test.ts 박제** — 편집 모드 직접 변경 시 수십 단언 붕괴. → 병행 신설로 격리, 스왑 시점에 일괄 갱신.
- **토큰 충돌** — C oklch vs DoD `--sx-*` 유지. → `.fc-app` 스코프 지역 변수로, 전역 토큰 불변.
- **데이터 배선 정확성** — mock→실제. marginReview 타입/콜백 시그니처 정확히 맞춰야.
- **시각 회귀** — 데이터 모드·출간은 이번에 안 건드림. 편집 모드만.

## 손대지 말 것
- `src/lib/storyEngine.ts` 외 도메인 모듈, `.claude/agents/*.md` 페르소나 정본, 연속성 검증.
- 데이터 모드·출간·캐논 로직(이번 범위 밖).
- 전역 Linear 다크 토큰(`--sx-*`/`--nx-*`/`--lc-*`) 정의값.

## 검증 기준 (각 단계)
`npx tsc --noEmit` 0 · `npm test` green · `npm run build` · `?stage=editor&editor=floating` 4해상도 가로 스크롤 0·본문 항상 보임·세로 글자 쪼개짐/회색 박스/화면 밖 이탈 없음.
