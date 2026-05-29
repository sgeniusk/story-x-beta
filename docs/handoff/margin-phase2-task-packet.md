# Codex Task Packet — Margin 통합 Phase 2 (좌레일 구조 스킴 + DataPanel 4카드)

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `design/margin-integration` (Phase 1 커밋 `e09a5e5` 위에 이어서)
> 베이스라인(Phase 1 직후): tsc exit 0 · 37 files / 226 tests · build 성공
> 이 패킷은 **검증 가능한 계약**이다. "완료"는 §6 게이트를 모두 통과해야만 성립한다.

## 0. 한 줄 목표
좌레일을 (A) 회차 **기승전결 구조 스킴 중심**으로 끌어올리고, (B) 외주의 `DataPanel`/`studioMetrics` 로 **편집 좌레일에 "구조 ↔ 지표" 세그먼트**를 도입해 M8 4카드를 가벼운 4카드로 교체한다. **도메인 로직은 손대지 않는다 — 어댑터로 변환만 한다.**

## 1. 스코프

### IN (이번에 한다)

#### A. 좌레일 구조 스킴 (의뢰서 `story x design/docs/storyx-editor-rails-brief.md` §"좌측 레일")
1. 편집 모드 좌레일(`src/StoryXDesk.tsx` 라인 2620 `.sx-project-rail`, draft 분기 2644~2691)에서 **"회차 구조"(`ChapterStructureTree`, 함수 라인 3334)를 좌레일의 중심**으로 끌어올린다.
2. 현재 `groupBeatsIntoActs()`(라인 3318)가 평탄 beats 를 기/승/전/결 4막으로 묶는다. 이를 **위계가 한눈에 들어오는 구조 트리**로 시각 강화 — 상위 4막(기승전결) → 하위 beat 단위. 각 막에 **AI가 정한 제목**(beat.label/summary 활용; 없으면 막 이름 fallback).
3. 작가가 **단위를 선택·이동**하면 그게 편집 기준이 된다 — 기존 `activeBeatId`(라인 969) / `selectBeat()`(라인 1717) 상태를 그대로 쓴다. 선택 단위 시각 강조.
4. "작품 상태"·"이번 회차 의도"는 **유지**하되 구조가 중심이 되도록 위계 재배치. "긴장·분량 곡선"도 유지.

#### B. DataPanel 4카드 (MIGRATION.md §6)
5. `story x design/patch/src/components/DataPanel.tsx` + `story x design/patch/src/lib/studioMetrics.ts` 를 `src/` 로 이식.
6. 편집 좌레일에 **"구조 ↔ 지표" 세그먼트 토글**을 둔다. 기본 탭은 **"구조"**(편집 중심 유지). "지표" 탭에서 `<DataPanel metrics={...} />` 로 4카드(하니스/품질/매체/온톨로지) 노출.
7. 도메인 → `StudioMetrics` 어댑터 작성 (`toStudioMetrics` 또는 4개 `toXMetric`). **기존 useMemo 산출물을 입력으로 변환만** 한다:
   - `harnessReport`(라인 1126, `StoryHarnessReport`) → `metrics.harness` (8 레이어 pass/fail, lead 예 "8/8 통과", tone)
   - `qualityGatesReport`(라인 1171, `QualityGatesReport`) → `metrics.quality` (gates, lead 예 "4/5")
   - `mediaProjections`(라인 1169, `MediaProjection[]`) → `metrics.media` (fit 막대 + axis: storyMode 의 commercial↔literary 비율로 0~1)
   - `storyOntology`(라인 1149, `StoryOntology`) → `metrics.ontology` (엔티티 수 + 미해결 실)
8. **퍼블리시 모드 좌레일(라인 2635~2641)의 기존 4카드 호출은 DataPanel 로 교체** — 같은 4카드를 두 곳에서 인라인 1차컷으로 그리던 걸 DataPanel 단일 컴포넌트로 통일. `storyMode`/`setStoryMode`(라인 1101) 슬라이더 연결 유지(품질 카드 또는 매체 axis).
9. 교체로 죽는 인라인 카드 함수(`HarnessReportCard`/`QualityGatesCard`/`MediaProjectionsCard`/`OntologyCard`, 라인 3179~)와 관련 CSS 는 **다른 화면 참조를 grep 확인한 뒤** 제거(과잉삭제 금지). `editorFocusLayout.test.ts` 등에서 이 카드 클래스를 단언하면 DataPanel 계약으로 갱신.

### OUT (이번에 하지 않는다)
- ❌ 도메인 로직(`storyHarness`·`qualityGates`·`mediaProjection`·`storyOntology`·`storyEngine`·`agentRunEngine`·`continuityContract`·`koreanVoiceGate`) 수정. 어댑터로 변환만.
- ❌ ChapterBeat 타입에 새 필수 필드 추가(스키마 변경 금지). 구조 트리는 **기존 beats + groupBeatsIntoActs** 로만 만든다. 막 제목이 없으면 fallback.
- ❌ Phase 1 의 우레일 마진 모델 변경(이미 커밋됨, 보존).
- ❌ 연속성/품질 게이트 약화. 충돌·미통과는 드러낸다(tone='warn').

## 2. 정본 소스
- 좌레일 의뢰 — `story x design/docs/storyx-editor-rails-brief.md`
- DataPanel 통합 지침 — `story x design/patch/MIGRATION.md` §6 (위계 원칙: head=lead 한 줄 · 펼침 detail · 한 번에 한 카드 · 기본 펼침 warn 카드)
- 컴포넌트/타입 원본 — `story x design/patch/src/components/DataPanel.tsx`, `story x design/patch/src/lib/studioMetrics.ts`
- Phase 1 산출(참고) — `src/lib/marginReview.ts` 어댑터 패턴이 좋은 본보기

## 3. ⚠️ 알려진 함정 (반드시 처리)
1. **M8 4카드는 퍼블리시 좌레일에 있다**(2635~2641, `isPublishingMode` 분기). 편집 좌레일(2644~2691)에는 없다. DataPanel 은 **편집 좌레일 "지표" 탭에 신규 도입** + 퍼블리시 좌레일 기존 4카드도 DataPanel 로 통일 — 두 위치를 혼동하지 마라.
2. **DataPanel.tsx 의 `MediaProjection` 타입은 studioMetrics 의 로컬 타입**이다(medium/fit/current). `src/lib/mediaProjection.ts` 의 도메인 `MediaProjection` 과 **이름이 같지만 다른 타입** — import 충돌 주의. studioMetrics 쪽은 그대로 두고 어댑터에서 도메인→studioMetrics 로 매핑.
3. 패치 strict-clean 가정 금지 — 이식 후 `npx tsc --noEmit` 으로 직접 검증·교정.
4. 세그먼트 토글 상태는 localStorage 영속 권장(`storyx.studio.railTab` 등) — 기존 트윅 영속 패턴 따름.
5. 죽은 CSS/함수 제거 전 grep — 다른 화면(`?stage=publish` 등)에서 쓰는지 확인.

## 4. 손대지 말 것
- 도메인 lib 8종(§1 OUT 목록), `.claude/agents/*.md`, `--sx-stage-*` 6색.
- Phase 1 우레일 마진 모델 파일(marginReview·useMarginReview·MarginColumn 등) — 보존.
- 기존 도메인 테스트(UI 교체이므로 도메인 테스트 불변).

## 5. TDD
- 새 순수 로직(`toStudioMetrics` / `toHarnessMetric` 등 어댑터)은 `src/lib/studioMetrics.test.ts` 를 **먼저** 추가하고 구현.
  - 예: harnessReport 8레이어 → lead "N/8 통과" + tone, qualityGatesReport → "통과/전체" + warn 판정, mediaProjections → fit 정렬·current 표시, storyOntology → 엔티티 카운트·threads.

## 6. 검증 게이트 (Definition of Done — 전부 통과)
```
npx tsc --noEmit   → exit 0
npm test           → 38+ files / 226+ tests 통과 (기존 불변 + 신규 어댑터 테스트)
npm run build      → 성공
```
수동(코드 보장):
- `?stage=editor` — 좌레일 "구조" 탭에 기승전결 트리(막→beat 위계), 단위 선택 동작. "지표" 탭에 DataPanel 4카드.
- `?stage=publish` — 좌레일 4카드가 DataPanel 로 렌더(런타임 에러 0).
- 세그먼트 토글 + localStorage 보존.

## 7. 산출물 보고 (작업 끝에 반드시)
1. 변경/신설/삭제 파일 목록.
2. `toStudioMetrics` 어댑터 최종 매핑(도메인 타입 → StudioMetrics 필드).
3. 좌레일 구조 트리가 데이터를 받는 방식(기존 beats/groupBeatsIntoActs 활용 방법).
4. 검증 결과 3종 실제 출력.
5. 남은 위험·미결·이월.
6. 커밋하지 말 것 — Claude(총괄)가 검증 후 커밋한다.
