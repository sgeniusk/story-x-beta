# Codex Task Packet — Margin 통합 Phase 1 (우레일 마진 검토 모델)

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex 5.5 (gpt-5.5-codex @ xhigh)
> 브랜치: `design/margin-integration` · 베이스라인: 36 files / 220 tests 통과
> 이 패킷은 **검증 가능한 계약**이다. "완료"는 §6 게이트를 모두 통과해야만 성립한다.

## 0. 한 줄 목표
에디터 우레일의 작가진 검토 UI(`ex-review-*`)를 외주가 만든 **Margin(마지널리아) 검토 모델**로 교체한다. **도메인 로직은 손대지 않는다 — 어댑터로 결과만 변환한다.**

## 1. 스코프

### IN (이번에 한다)
1. `story x design/patch/src/` 의 컴포넌트·훅·lib·CSS 를 실제 `src/` 로 이식.
   - lib: `marginReview.ts`, `extendedPersonas.ts` → `src/lib/`
   - hooks: `useMarginReview.ts` → `src/hooks/`
   - components: `PixelAvatar.tsx`, `AnnotationCard.tsx`, `MarginColumn.tsx`, `MentionBar.tsx`, `CoreStrip.tsx`, `Spotlight.tsx` → `src/components/`
   - (`CanonSummaryCard.tsx` 도 이식하되 회차 끝 캐논 요약 위치에 연결. 연결점 불명확하면 import만 해두고 렌더는 생략 — 단 미사용 import 로 tsc 에러 내지 말 것.)
2. `story x design/patch/styles-additions.css` 전체를 `src/styles.css` **맨 끝**에 append. 추가 토큰은 `.sx-desk` 스코프.
3. `StoryXDesk.tsx` 의 작가진 검토 영역(`ReviewRow` + `ex-review-*` + `visibleReviewRuns` 렌더, 대략 5093~5260행)을 Margin 모델로 교체:
   - 레이아웃 4컬럼: `240px 1fr 320px 58px`, 집중 모드 `0 1fr 0 0`.
   - 본문 단락에 `data-pid` 부여 (mention bar anchor 추적 필수).
   - 본문 드래그 → MentionBar → 코어 호출 → pending → resolve 흐름.
   - `⌘K` → Spotlight (확장 페르소나 호출), `Esc` 닫힘.
   - severity 3단계(block/suggest/note) 시각 차이 + 인라인 diff 적용/거절.
4. 도메인 어댑터 `toMarginReview(run: AgentRun, anchor?: string): MarginReview` 작성:
   - `src/lib/agentReviewProcess.ts` 의 `getAgentValidationProcess(blueprint, manuscript) → { runs: AgentRun[] }` 를 그대로 사용.
   - 변환 규칙: 충돌/캐논 누락/결정요구 → `block` · was/is 수정제안 → `suggest`+`diffs` · 그 외 → `note`. `run.agentId`→`persona`, 요약→`head`, `run.output`→`body`.
   - `runAll`: 코어 5명을 도착 순서대로 `onPartial`. `summonOne`: 한 명 호출 (mention/spotlight 공용).
   - LLM mock 폴백 상태에서도 화면·인터랙션이 동작해야 한다(`setTimeout` 으로 흘려도 됨).

### OUT (이번에 하지 않는다 — Phase 2)
- ❌ 좌레일 기승전결 구조 스킴 재설계.
- ❌ M8 4카드(`HarnessReportCard`/`QualityGatesCard`/`MediaProjectionsCard`/`OntologyCard`)를 `DataPanel`/`studioMetrics` 로 교체. **이번엔 4카드 그대로 둔다.** (`DataPanel.tsx`·`studioMetrics.ts` 이식하지 말 것 — Phase 2.)
- ❌ 도메인 로직(`storyEngine`, `agentRunEngine`, `continuityContract`, `qualityGates` 등) 수정.
- ❌ 연속성 검사 약화. 충돌은 드러내야 한다.

## 2. 정본 소스
- 패치 원본: `story x design/patch/` (MIGRATION.md 포함 — 읽되 라인번호는 stale, 신뢰 금지)
- 패치 계약 타입: `story x design/patch/src/lib/marginReview.ts` (Severity/MarginReview/InlineDiff/splitIntoParagraphs/applyDiff/groupByAnchor)
- 훅 계약: `story x design/patch/src/hooks/useMarginReview.ts` (MarginReviewAdapter / UseMarginReviewResult)
- 통합 스케치(참조용, 붙여넣기 금지): `story x design/patch/src/StoryXDesk.integration.tsx`

## 3. ⚠️ 알려진 함정 (반드시 처리)
1. **패치가 strict-clean 하다고 가정하지 말 것.** Read 상 stray brace 등 의심 징후 있음. 이식 후 `npx tsc --noEmit` 으로 직접 확인하고, 패치 파일의 컴파일 에러는 Codex가 고친다. (의미는 보존, 문법만 교정.)
2. **`extendedPersonas.ts` 가 불완전** — 코어 5 + voice/critic 2명만 채워져 있고 나머지는 주석. `.claude/agents/*.md` 의 실제 파일명(id)에 1:1 맞춰 확장 페르소나 목록을 채운다. id 가 실제 파일과 안 맞으면 Spotlight 호출이 깨진다. (`PersonaMeta.pixel` 은 기존 `pixelClass` 매핑 재사용.)
3. **`data-pid`** 를 manuscript 단락 `<p>` 마다 빠짐없이 부여. 안 그러면 mention anchor 가 동작 안 함.
4. **deprecate**: 교체로 죽는 `.ex-review-*` / `ReviewRow` / `.sx-diff-toggle` / `.sx-manuscript-editor.is-edited` 좌측 글로우 관련 CSS·코드는 제거하되, **다른 화면에서 참조하는지 먼저 grep 확인** 후 제거 (과잉 삭제 금지).
5. **반응형**: `styles-additions.css §12` — <1280px 마진+strip 을 우측 drawer 로, <900px 좌레일도 drawer. drawer 토글 클래스 `.drawer-open`/`.binder-open` 를 StoryXDesk 상태로 연결.

## 4. 손대지 말 것
- `src/lib/storyEngine.ts` 스토리 바이블 형태, `agentRunEngine.ts`, `continuityContract.ts`, `qualityGates.ts`, `mediaProjection.ts`, `storyOntology.ts`, `storyHarness.ts`, `koreanVoiceGate.ts`.
- `.claude/agents/*.md` 페르소나 정본.
- M8 4카드 컴포넌트(이번 라운드 미변경).
- `--sx-stage-*` 6색 의미 매핑(생각·읽기·표시·쓰기·완료·대기).
- 기존 도메인 테스트 파일 (UI만 바꾸므로 220 tests 불변이어야 함).

## 5. TDD
- 이번 작업은 UI 교체라 도메인 테스트는 불변(220 통과 유지)이 1차 게이트.
- 단, **새 순수 로직**(`toMarginReview` 어댑터, `splitIntoParagraphs`/`applyDiff` 사용처)은 `src/lib/marginReview.test.ts` 를 신설해 최소 테스트를 **먼저** 추가한 뒤 구현(프로젝트 규칙: 새 생성 동작은 테스트 먼저).
  - 예: severity 분류 규칙 3종, applyDiff 본문 치환, splitIntoParagraphs 빈줄 분리, toMarginReview 의 AgentRun→MarginReview 매핑.

## 6. 검증 게이트 (Definition of Done — 전부 통과해야 완료)
```
npx tsc --noEmit        → exit 0
npm test                → 36+ files / 220+ tests 통과 (기존 220 불변 + 신규 어댑터 테스트 추가분)
npm run build           → tsc --noEmit && vite build 성공
```
수동 확인 항목(코드로 보장):
- `?stage=editor` 진입 시 마진 column 렌더 (런타임 에러 0).
- severity 3단계 시각 차이 존재.
- ⌘K Spotlight 열림/닫힘, MentionBar 호출 경로 연결.

## 7. 산출물 보고 (작업 끝에 반드시)
1. 변경/신설/삭제 파일 목록.
2. `toMarginReview` 변환 규칙 최종본(코드에서 결정한 실제 매핑).
3. 검증 결과 3종(tsc/test/build) 실제 출력 요약.
4. 남은 위험·미결(특히 §3 함정 중 처리 못 한 것)·Phase 2 로 넘긴 것.
5. 커밋은 하지 말 것 — Claude(총괄)가 검증 후 커밋한다.
