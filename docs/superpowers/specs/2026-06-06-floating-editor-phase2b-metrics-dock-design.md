# 플로팅 에디터 Phase 2b — 지표 독 패널 설계

> 작성일 2026-06-06 · 상태 승인 대기(스펙 리뷰) · 선행 Phase 2a 머지(`389a997`) + 가운데 정렬(`488b5e8`)

## 배경

플로팅 에디터가 편집 기본이 됐지만(2a), 옛 3컬럼 좌레일의 "지표" 지능 — **하니스·품질게이트·매체투사·온톨로지** — 은 floating 에 없다. 그 4개는 이미 `DataPanel`(src/components/DataPanel.tsx)로 통합돼 `studioMetrics`(StoryXDesk:856, `toStudioMetrics`)를 입력으로 렌더된다. Phase 2b 는 같은 데이터를 **floating 독의 새 "지표" 패널**에 floating-네이티브 `.fc-*` 스타일로 흡수한다.

## 범위

floating 독에 "지표" 패널 1개 추가(4 섹션). **회차/곡선 패널의 리치판(ChapterStructureTree/TensionShareChart) 업그레이드는 범위 밖 — 별도(사용자 결정).** 현 간단판 유지. 데이터/출간 모드(2c/2d)·옛 3컬럼 제거(2e)도 범위 밖.

## 설계

### 1. 독 버튼 "지표"
floating 좌측 독(`.fc-app .dock`)에 "지표" 버튼 1개 추가 — 위치는 "상태" 다음, "작가실" 앞. 아이콘은 게이지/차트 계열 인라인 SVG(기존 독 버튼과 동일 패턴). `openPanel` 유니온 타입에 `'metrics'` 추가, `togglePanel('metrics')` 연결.

### 2. 지표 패널 `fc-p-metrics` (.fc-* 네이티브, 4 접이식 섹션)
`StudioMetrics`(src/lib/studioMetrics.ts) 형태를 floating 톤으로 렌더. 각 섹션은 헤더(title·lead·tone 점)와 접이식 본문.
- **하니스** — `harness.lead`(예 "95/100") · `harness.sub`(예 "보강 필요") · `harness.layers[]`(6개, `{name, pass}` → ✓/! + 이름).
- **품질 게이트** — `quality.lead`(예 "2/7 통과") · `quality.sub` · `quality.gates[]`(12개, `{key, pass, note?}` → 통과/실패 표시 + key + note).
- **매체 투사** — `media.lead` · `media.sub` · `media.projections[]`(`{medium, fit, current}`) · **commercial↔literary 슬라이더**(`media.axis` 0~1, `onMediaAxisChange` 있을 때만 input range).
- **온톨로지** — `ontology.lead` · `ontology.sub` · `ontology.entities[]`(`{kind, count}` — 인물·관계·세계·갈등·플롯·캐논).
- tone(`good`/`warn`/`neutral`)에 따라 섹션 점/강조색을 floating 액센트로 매핑.

섹션 접이 상태는 FloatingEditor 로컬 state(기존 `openPanel`과 별개의 섹션 토글, 또는 DataPanel 처럼 한 번에 하나 열림). DataPanel 방식(한 번에 하나, warn 인 것 우선 오픈)을 따른다.

### 3. 데이터 흐름
`FloatingEditorProps` 에 추가 — `metrics: StudioMetrics`, `onMediaAxisChange?: (axis: number) => void`. 순수 표현 유지(계산·상태는 StoryXDesk). `floatingEditorProps`(StoryXDesk)에서 이미 계산된 `studioMetrics`(856) + `updateStoryModeAxis`(매체축 세터, DataPanel 에 쓰던 것)를 주입.

### 4. 스타일
`src/styles.css` 의 `.fc-app` 스코프 블록에 지표 패널용 `.fc-*` 규칙 신설 — 메트릭 섹션 헤더·layer/gate 행·축 슬라이더. 전역 `--sx-*` 토큰 안 씀, `.fc-app` 지역 oklch 변수만. 기존 `.fc-app .panel` 골격 재사용.

## 인터페이스 변경 — FloatingEditorProps 추가
```ts
  metrics: StudioMetrics;                       // 하니스·품질·매체·온톨로지 (studioMetrics)
  onMediaAxisChange?: (axis: number) => void;   // commercial↔literary 슬라이더
```
`StudioMetrics` 타입은 `../lib/studioMetrics` 에서 import.

## 데이터 흐름 요약
StoryXDesk `studioMetrics`(useMemo, 856) → `floatingEditorProps.metrics` → FloatingEditor 지표 패널 4섹션 렌더. 슬라이더 → `onMediaAxisChange` → `updateStoryModeAxis` → storyMode 갱신 → studioMetrics 재계산 → 패널 반영.

## 에러·엣지 케이스
- 빈 프로젝트(0 회차·0 캐논) — 각 메트릭은 빈/0 값으로 안전 렌더(layers/gates/entities 빈 배열 또는 기본값). studioMetrics 는 항상 4 섹션 반환.
- 슬라이더 미주입(`onMediaAxisChange` 없음) — 축 표시만, input 없음(DataPanel 과 동일 분기).
- 패널 열림 중 studioMetrics 변경(편집으로 지표 갱신) — 패널은 props 로 재렌더(본문 contentEditable 와 무관, bodyVersion 영향 없음).

## 범위 밖
- 회차/곡선 리치판(ChapterStructureTree/TensionShareChart) 이식 — 별도.
- 데이터(캐논/바이블) 모드 floating 화(2c) · 출간 floating 화(2d) · 옛 3컬럼 제거(2e).
- rank5 잔여(죽은 코드 결정·PublishingStudio·Tier3 훅).

## 테스트
`src/components/floatingEditor.test.ts` 확장(react-dom+jsdom) —
- 지표 버튼 클릭 → `fc-p-metrics` 패널 노출(show).
- 4 섹션 렌더 + 값 표시 — 하니스 lead, 품질 게이트 행 수(gates.length), 온톨로지 entity 카운트.
- 슬라이더 onMediaAxisChange 호출(네이티브 setter 로 input 시뮬레이트).
- baseProps 에 `metrics` mock 추가(StudioMetrics 형태).
- 게이트 — `tsc 0` · `npm test` green · `npm run build` · Playwright(지표 패널 floating 톤 렌더·콘솔 0·4해상도).

## 리스크
- **studioMetrics 형태 의존** — StudioMetrics 인터페이스(harness.layers·quality.gates·media.projections·ontology.entities) 변경 시 패널 깨짐. 타입 import 로 컴파일 보장.
- **floating 톤 일관** — sx 카드 재사용이 아니라 fc 네이티브 재구현이므로, DataPanel 과 시각이 달라도 OK(의도). 단 floating 액센트 매핑이 어색하지 않게.
- **독 버튼 6개** — 360 모바일에서 독이 좁아질 수 있음 — 시각 회귀로 확인.

## 검증 기준
`npx tsc --noEmit` 0 · `npm test` green · `npm run build` · `?stage=editor` 지표 버튼 → 패널 4섹션 floating 톤 렌더 · 슬라이더 동작 · 콘솔 0 · 4해상도 독·패널 이탈 없음.
