# Session Handoff

다음 세션이 즉시 이어 시작할 수 있도록 한 세션 끝에 이 파일을 갱신한다. 가장 최근 인계가 맨 위.

---

## 2026-05-29 20:50 — M10 Phase 3 검토 UX 다듬기 · Claude 총괄 재검증 통과

> Last Updated: 2026-05-29 20:50 KST · Branch: `design/margin-integration`

### Current Objective
**M10 Margin 통합 Phase 3 완료.** 실사용 테스트에서 발견한 두 결함 수정 — (A) 전체 검토 ~80초 동안 마진 빈 화면, (B) 의견이 첫 단락 클러스터링. Codex(gpt-5.5 @ xhigh) 구현, Claude 하네스(패킷)·총괄 검증.

### 총괄 재검증 결과 (Claude 직접)
- 게이트 — tsc exit 0 · `npm test` **38 files / 234 tests** · build 성공.
- 라이브 렌더(Playwright, `?stage=editor`, 실 LLM 초안 23단락) —
  - (A) "5명에게 전체 검토 맡기기" 클릭 **즉시 pending skeleton 5개**("읽고 있는 중…") 표시. 도착 시 확정 의견으로 교체, stillPending 0.
  - (B) 의견 5개가 서로 다른 단락(p1·p7·p13·p19·p2)에 **분산 anchored** (이전엔 전부 p19).
  - console error 0.
- 스코프 — 도메인 lib 8종 무변경 · 검토 호출 경로 무변경 · 잔여물 없음.

### 알려진 약점 (다음 후보)
- 마진 헤더 카운트는 pending 중 "0건"으로 표시(확정만 셈). "N/5 검토 중" 형태가 더 친절. 소소.
- 병렬 검토(순차 80초 → 병렬 ~16초)는 이번 스코프 밖. 별도 작업.

### Recommended Next Step
1. Phase 3 커밋 → main 머지(PR) 여부 사용자 결정.
2. L1 — Vercel env 등록(배포본 실 LLM).

---

## 2026-05-29 20:40 — M10 Phase 3 마진 검토 UX 수정 완료 · 커밋 전

> Last Updated: 2026-05-29 20:40 KST · Branch: `design/margin-integration`

### Current Objective
**M10 Margin 통합 Phase 3 구현 완료, 커밋 전 검증 대기.** 전체 검토 시작 직후 코어 5명 pending skeleton 이 즉시 뜨고, 실제 리뷰가 도착하면 같은 persona placeholder 를 교체한다. anchor 매칭 실패 리뷰는 첫 단락 몰림 대신 단락 순서 round-robin 으로 분산된다. 도메인 로직과 `/api/review-agent` 호출 경로는 건드리지 않았다.

### Recommended Next Step
1. Claude 총괄이 diff와 UI를 재확인한 뒤 커밋 여부 결정. 사용자 지시로 Codex는 커밋하지 않음.
2. 가능하면 실제 브라우저에서 `?stage=editor` → "5명에게 전체 검토 맡기기"를 눌러 pending 5장, 도착 순 교체, console error 0을 확인.
3. 이월 — 코어 5명 순차 호출 병렬화는 이번 스코프 밖. 별도 작업으로 분리.

### Branch · Commit · Verification
- Branch — `design/margin-integration`
- Commit — 없음(커밋 금지 지시 준수)
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 38 files / 234 tests · `npm run build` 성공 · 최종 `bash init.sh` 통과(38 files / 234 tests · 빌드 성공)
- HTTP smoke — dev server `http://127.0.0.1:5173/?stage=editor` 200

### What This Session Did
1. `src/lib/marginReview.test.ts` 에 TDD 케이스 3개 추가 — unmatched anchor 분산, evidence 매칭 우선, pending seed→persona replace.
2. `src/lib/marginReview.ts` 에 `resolveRunReviewAnchor`, `seedPendingMarginReviews`, `replacePendingMarginReview` 추가.
3. `src/hooks/useMarginReview.ts` 가 `corePersonaIds` 를 받아 전체 검토 시작 시 pending 5장을 즉시 seed 하도록 변경.
4. `StoryXDesk.tsx` 의 전체 검토 루프가 review index 를 넘겨 fallback anchor 를 결정론적으로 분산하도록 변경.
5. `MarginColumn` 헤더를 pending 중 `N/5 검토 중` 형태로 표시하고, 빈 상태/재실행 버튼이 pending 중 노출되지 않게 조정.
6. `AnnotationCard` pending 렌더를 persona + avatar + skeleton shimmer 로 분리.
7. `CoreStrip` 카운트가 pending 을 확정 의견으로 세지 않도록 변경.

### Files Touched
- 수정 `src/lib/marginReview.ts`
- 수정 `src/lib/marginReview.test.ts`
- 수정 `src/hooks/useMarginReview.ts`
- 수정 `src/components/MarginColumn.tsx`
- 수정 `src/components/AnnotationCard.tsx`
- 수정 `src/components/CoreStrip.tsx`
- 수정 `src/StoryXDesk.tsx`
- 수정 `src/styles.css`
- 수정 `progress.md`
- 수정 `session-handoff.md`

### Files NOT To Touch
- 도메인 lib: `storyEngine`, `agentRunEngine`, `agentReviewProcess`, `continuityContract`, `qualityGates`, `mediaProjection`, `storyOntology`, `storyHarness`, `koreanVoiceGate`
- `/api/*`, `requestAgentReview` 호출 경로와 응답 스키마
- 좌레일, DataPanel, `.claude/agents/*.md`, `--sx-stage-*` 6색

### Blockers
- Browser MCP/Playwright 자동 시각 검증은 이 세션에서 사용 불가. 대신 Vite dev HTTP 200 smoke 와 코드/테스트 게이트로 보증.

---

## 2026-05-29 14:25 — M10 Phase 1+2 커밋 완료 · Claude 총괄 재검증 통과

> Last Updated: 2026-05-29 14:25 KST · Branch: `design/margin-integration`

### Current Objective
**M10 Margin 디자인 통합 Phase 1+2 완료·커밋.** Codex(gpt-5.5 @ xhigh)가 구현, Claude가 하네스(Task Packet 2종)·총괄 재검증 담당. 커밋 3개 — `e09a5e5`(P1 우레일 마진), `9260642`(P2 좌레일 구조+DataPanel), handoff 갱신 커밋. origin push 는 별도 지시 시.

### 총괄 재검증 결과 (Claude 직접 재실행)
- 게이트 — `npx tsc --noEmit` exit 0 · `npm test` **38 files / 231 tests** · `npm run build` 성공(js 579.49kB / css 192.36kB).
- 라이브 렌더(Playwright, 1440×900) —
  - `?stage=editor` 구조 탭: 기승전결 트리. 지표 탭 클릭 → DataPanel 4카드(하니스 8/8·품질 4/8·매체 소설·온톨로지 7) 렌더 확인. 마진 col·코어 strip 보존.
  - `?stage=publish` DataPanel 렌더(구 인라인 4카드 0).
  - console error 0.
- 스코프 — 도메인 lib 8종 무변경(git 확인) · Phase 1 마진 파일 보존 · patch 잔여물 없음.
- 스크린샷 — `docs/handoff/screenshots/{06-margin-editor,07-phase2-metrics-tab}.png`.

### Recommended Next Step
1. (선택) origin push + Vercel preview 배포로 외부 시각 확인.
2. `story x design/` 원본 폴더는 미추적(커밋 제외) — 보관/삭제 결정 필요.
3. 알려진 한계 — `audiobook` 매체가 도메인 `mediaProjection.ts` target 에 없어 DataPanel current 가 top-fit fallback. 매체 풀 확장 시 정리.
4. 또는 M6.3 storyx CLI · agentRunEngine LLM 실연결 등 기존 백로그 복귀.

---

## 2026-05-29 14:03 — M10 Phase 2 좌레일 구조 스킴 + DataPanel 통합 (Codex 자가보고)

> Last Updated: 2026-05-29 14:03 KST

### Current Objective
**M10 Margin 디자인 통합 Phase 2** 구현 완료, 커밋 전 검증 대기. 편집 좌레일은 `구조 ↔ 지표` 세그먼트로 전환되고 기본은 구조 탭이다. 퍼블리시 좌레일의 기존 M8 4카드는 `DataPanel` 단일 컴포넌트로 통합됐다.

### Recommended Next Step
1. 총괄 검증 후 커밋 여부 결정. 사용자 지시로 이번 세션에서는 커밋하지 않음.
2. 가능하면 실제 브라우저/Playwright 환경에서 `?stage=editor` 지표 탭 클릭과 `?stage=publish` 좌레일 DataPanel 렌더를 시각 재확인.

### Branch · Commit · Verification
- Branch — `design/margin-integration`
- Commit — 없음(커밋 금지 지시 준수)
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 38 files / 231 tests · `npm run build` 성공 · 최종 `bash init.sh` 통과(38 files / 231 tests · 빌드 성공)
- HTTP smoke — dev server `http://127.0.0.1:5173/?stage=editor` 200 · `?stage=publish` 200

### What This Session Did
1. `src/lib/studioMetrics.ts` + `src/lib/studioMetrics.test.ts` 신설. TDD 순서로 RED 확인 후 어댑터 구현.
2. `src/components/DataPanel.tsx` 신설. 외주 DataPanel 계약을 이식하고 media axis range 입력으로 `storyMode` 슬라이더 연결 유지.
3. `src/StoryXDesk.tsx` 편집 좌레일에 `구조 ↔ 지표` 세그먼트 추가. `storyx.studio.railTab` localStorage 영속.
4. 구조 탭에서 `ChapterStructureTree` + `TensionShareChart` 를 좌레일 중심으로 올리고, 작품 상태/이번 회차 의도는 유지하되 하단으로 재배치.
5. publish 좌레일의 `HarnessReportCard`/`QualityGatesCard`/`MediaProjectionsCard`/`OntologyCard` 호출을 `DataPanel` 로 교체하고, 인라인 4카드 함수 제거.
6. `groupBeatsIntoActs()` 유지. 막 제목은 기존 `ChapterBeat.label` 우선, 없으면 `summary` 첫 문장, 없으면 기승전결 fallback.

### Files Touched
- 신설 `src/lib/studioMetrics.ts`
- 신설 `src/lib/studioMetrics.test.ts`
- 신설 `src/components/DataPanel.tsx`
- 수정 `src/StoryXDesk.tsx`
- 수정 `src/styles.css`
- 수정 `src/editorFocusLayout.test.ts`
- 수정 `progress.md`
- 수정 `session-handoff.md`

### Files NOT To Touch
- 도메인 lib: `storyHarness`, `qualityGates`, `mediaProjection`, `storyOntology`, `storyEngine`, `agentRunEngine`, `continuityContract`, `koreanVoiceGate`
- Phase 1 우레일 마진 모델: `marginReview`, `useMarginReview`, `MarginColumn` 등
- `.claude/agents/*.md`
- `--sx-stage-*` 6색 의미 매핑

### Blockers
- Browser/Playwright MCP는 이 환경에서 사용 불가. `playwright` 패키지 없음, Chrome headless 실행은 exit -1, Computer Use Chrome state는 timeout. 자동 게이트와 HTTP 200까지 확인.

### Reference Documents
- `docs/handoff/margin-phase2-task-packet.md`
- `docs/handoff/margin-phase1-task-packet.md`
- `story x design/patch/MIGRATION.md` §6
- `story x design/patch/src/components/DataPanel.tsx`
- `story x design/patch/src/lib/studioMetrics.ts`

---

## 2026-05-28 00:25 — M9 핸드오프 패키지 완성 · design/linear-dark → main ff merge

> Last Updated: 2026-05-28 00:25 KST

### Current Objective
**M9 디자인 핸드오프 자료 준비** 완료. 외주 디자이너 또는 Claude Design 에 즉시 발송 가능한 패키지 산출. 다음 자연스러운 작업 — M6.3 storyx CLI · agentRunEngine LLM 실 연결 · Vercel env 등록 중 선택.

### Recommended Next Step
1. 패키지(`docs/handoff/`) 외부 발송 또는 Claude Design 에 위임 → 결과 통합 브랜치 신설
2. 병행: M6.3 `tools/storyx.mjs` 에 `init` · `serve` · `memory sync` 명령 확장
3. 또는: agentRunEngine 의 generic 출력을 LLM 호출로 교체 (Layer 5 Gap 끝)
4. 또는: Vercel Project Settings 에 `AI_GATEWAY_API_KEY` / `ANTHROPIC_API_KEY` 등록 → 배포본 실제 LLM 응답 검증 (curl)

### Branch · Commit · Verification
- Branch — `main` (design/linear-dark ff merge, head `bc9f803` 이후 핸드오프 산출 추가)
- 로컬은 origin/main 보다 94+ 커밋 앞섬 — push 는 별도 지시 시
- 검증 마지막 통과 — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 220 tests · `npm run build` 1.04s
- 신설 — `docs/handoff/design-brief.md` · `docs/handoff/token-map.md` · `docs/handoff/screenshots/{01..05}.png`
- 수정 — `feature_list.json` (M9 done + active M6.3) · `progress.md` · `session-handoff.md` · `docs/handoff/design-brief.md` 데모 URL 갱신
- Vercel production (외주 라이브 데모) — https://story-x-alpha.vercel.app (READY · `vercel deploy --prod` 1m · public 200 · `<title>Story X</title>` 검증 · LLM env 미설정으로 mock 폴백)
- Preview deployment (내부 검토용) — https://story-x-alpha-1jzhsnqr8-gomgomee-s-projects.vercel.app (SSO 401, Vercel Authentication 가드 유지)
- GitHub Repo — https://github.com/sgeniusk/story-x-beta (public, M9 핸드오프 커밋 + 94+ 커밋 origin 동기화)

### What the Last Session Did
1. **design/linear-dark → main ff merge** — main 이 superset 인 design/linear-dark 까지 fast-forward. 87 파일 변경(M4 모듈 + M8 카드 + Linear 다크 폴리시) 모두 main 에 반영.
2. **`docs/handoff/design-brief.md` 신설** — 4파트 구조 의도 + 자유도(Decisive)/금지선(Don't) + 의뢰 항목 7개 각 항목에 문제·코드 위치·기대 결과 + 기술 컨텍스트(파일/페르소나/토큰/폰트) + 검증·완료 기준 + Option A/B/C 의뢰 방식.
3. **`docs/handoff/token-map.md` 신설** — 토큰 4 레이어(`--sx-*` 스튜디오 / `--nx-*` 브릿지 / `--lc-*` 랜딩 / 사용자 트윅) 각 라인 번호 + 한 줄 cascade 다이어그램 + 손대도 OK / 손대지 말 것 + 추가 시 권장 위치.
4. **Playwright 스크린샷 5종** — 1440×900 / Linear 다크 톤. 랜딩 다크·라이트, 홈 매체 선택, 스튜디오 편집기(작가진 5명 + 좌레일 + 알파 03%), 퍼블리시 4 카드.
5. **`feature_list.json`** — M9-design-handoff-prep status `todo` → `done`. active `M9-design-handoff-prep` → `M6.3-storyx-cli`.

### Files To Touch (next milestone — M6.3 storyx CLI 또는 LLM 연결)
- 수정 `tools/storyx.mjs` — `init` · `serve` · `memory sync` 서브커맨드 + flag 파싱
- 또는 수정 `src/lib/agentRunEngine.ts` `describeAgentRun` — LLM 호출 도입 (현재 generic)
- 또는 Vercel CLI — `vercel env add AI_GATEWAY_API_KEY production`

### Files NOT To Touch
- `docs/handoff/*` (핸드오프 발송 전 동결)
- M4 완성본 (storyEngine, storyOntology, storyHarness, continuityContract, koreanVoiceGate, qualityGates, agentRunEngine, mediaProjection)
- M8 카드 컴포넌트 (외주 결과로 재작성 예정 — `StoryXDesk.tsx` 인라인 스타일 1차 컷 보존)

### Blockers
없음. 단, 외주/Claude Design 의 결과 통합은 본 세션 범위 밖.

### Known Issues
- 04-studio-editor 스크린샷은 편집 모드 좌레일 — 바이블 모드의 M8 4 카드(`HarnessReportCard` 등)는 별도 캡처가 필요할 수 있음. 외주 요청 시 추가 캡처 가능 (`?stage=editor` 후 좌레일 모드 토글).
- 05-publish 스크린샷은 medium=novel 기본 — book-designer/pr-specialist/platform-curator/business-strategist 4 카드 노출. 다른 매체 캡처는 외주가 추가 요청 시.
- 스크린샷 캡처 중 Playwright MCP가 `.playwright-mcp/` 가 아닌 프로젝트 루트에 저장 — `docs/handoff/screenshots/` 로 수동 이동. 재캡처 시 절대경로 또는 사후 이동 권장.

### Reference Documents
- `docs/handoff/design-brief.md` — 핸드오프 brief (단일 진입)
- `docs/handoff/token-map.md` — 토큰 4 레이어
- `docs/claude-design-handoff-prompt.md` — 깊은 비전·자유도 (357줄, brief 가 참조)
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/agent-system.md` — 23 ValidationAgentId + 16 criteriaKeys
- `~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마스터 로드맵

---

## 2026-05-22 22:50 — M4 완료 + M8 UI 통합 + Linear 다크 폴리시 · 디자인 핸드오프 준비로 인계

> Last Updated: 2026-05-22 22:50 KST

### Current Objective
**M9 디자인 핸드오프 자료 준비** (다음 세션 첫 작업). M4 8/8 청크 완료 + M8 UI 통합 4 카드 + Linear 다크 폴리시까지 마침. 다음 세션에서 외주 디자이너에게 보낼 brief + 스크린샷 + 토큰 표 작성.

### Recommended Next Step
1. `docs/handoff/design-brief.md` 신설 — 4파트 구조 의도 + 거친 부분 + 의뢰 항목 7개
2. Playwright 스크린샷 5종 — 랜딩(낮/밤), 브릿지, 홈(매체 선택), 스튜디오, 퍼블리시
3. 토큰 매핑 표 — nx-* · sx-* · lc-* 현황
4. 의뢰 항목 정리 — 전체 일관성·좌레일 가독성·검토/대화 UI·인라인 diff·확장 피드백·편집기 호흡·M8 카드 다듬기
5. 외주 의뢰 후 병행 — M6.3 storyx CLI · D (agentRunEngine LLM 연결) · Vercel env 등록

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 220 tests · `npm run build` 1.04s
- Local dev — http://127.0.0.1:5173 동작 중
- Vercel preview — https://story-x-alpha-184suo6gf-gomgomee-s-projects.vercel.app
- 8 commits 이번 세션 — M4.H 후속 · M8.1 · M8.2~4 · M8.5 · M8.6 (예정)

### What the Last Session Did
1. **M4 청크 H 후속** — creativeDevelopment 4 신규 optional 필드(storyOntology/harnessReport/mediaProjections/continuityContract) + agent-system.md 신설 12 에이전트 + 16 criteriaKeys 표. **M4 8/8 완전 완료.**
2. **M8.1** HarnessReportCard — 점수·6 스테이지·readyForProduction 좌레일 노출
3. **M8.2** QualityGatesCard — 12 게이트 + StoryMode 슬라이더 (commercial ↔ literary 100%) + localStorage 영속
4. **M8.3** MediaProjectionsCard — 5 매체 투영 + 핵심 4 보존 신호
5. **M8.4** OntologyCard — 인물·세계·갈등·플롯 4 카테고리
6. **Vercel preview 배포** — `story-x-alpha-184suo6gf-...vercel.app` (mock 폴백 상태)
7. **M8.5** .home-page Linear 다크 토큰 12개 오버라이드 — 매체 선택 단계 어색함 해결. 브릿지 로그인/프로젝트 라이트 유지.
8. **M8.6** 편집기 여백 축소 (clamp 10~16px) + sx-manuscript-editor.is-edited 좌측 라임 글로우 + sx-diff-toggle 강조

### Files To Touch (next milestone — M9)
- 신설 `docs/handoff/design-brief.md`
- 신설 `docs/handoff/screenshots/` (Playwright 자동 캡처 또는 수동)
- 신설 `docs/handoff/token-map.md`
- 갱신 `feature_list.json` M9 진행 표시

### Files NOT To Touch
- M4 완성본 (storyEngine, storyOntology, storyHarness, continuityContract, koreanVoiceGate, qualityGates, agentRunEngine, mediaProjection)
- M8 카드 컴포넌트 (디자인 핸드오프 후 외주 결과로 재작성 예정)
- 매체 선택 등 단계 폴리시 (외주 결과 받은 뒤 통합)

### Blockers
없음. 단, 디자인 핸드오프 후에는 다음 항목들이 의뢰 결과를 기다림.

### 핸드오프 의뢰 항목 (7개)
1. 전체 사이트 4파트 톤 일관성 (랜딩·브릿지·홈·스튜디오·퍼블리시)
2. 좌레일 가독성 (AgentIntentCard, M8 4 카드, statusbar)
3. 에이전트 검토·대화 UI 재설계 — 현재 거칠다
4. 인라인 diff 하이라이트 (textarea 위 실시간 빨강/라임) — ContentEditable 또는 overlay
5. 확장(집중 모드) 버튼 시각 피드백 강화
6. 편집기 호흡 — 여백·타이포·hover
7. M8 4 카드 본격 다듬기 (현재 인라인 스타일 1차 컷)

### Known Issues
- AgentIntentCard ("쇼러너가 잡은 다음 회...") 카드는 동작은 하지만 (textarea 입력 + 토글 펼치기) 시각 피드백 부족. 외주 의뢰 항목 #2 에 포함.
- prose diff 가 별도 보기 토글 (sx-diff-toggle) — 인라인 실시간 하이라이트 X. 외주 의뢰 항목 #4 에 포함.
- 확장 버튼 (ex-focus-btn) 동작은 정상이나 변화가 미묘. 외주 의뢰 항목 #5 에 포함.
- M5 Vercel Functions 5 라우트 모두 mock 폴백 — env 등록 필요. 핸드오프와 병행해서 처리 가능.

### Reference Documents
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/agent-system.md` — 23 에이전트 매트릭스 + 16 criteriaKeys
- `docs/vercel-env-setup.md` — Vercel env 등록 안내
- `~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마스터 로드맵

---

## 2026-05-22 20:50 — M4.H 통합·리팩터 핵심 3 작업 완료 (1차 컷)

> Last Updated: 2026-05-22 20:50 KST

### Current Objective
M4 청크 H 의 핵심 3 작업 완료 — Gap 3·8·10 모두 해결. creativeDevelopment 통합·docs 갱신은 분량이 커 다음 묶음으로 분리. M4 청크 진행 7.5/8 (청크 H 60%).

### Recommended Next Step
1. M4 청크 H 후속 — creativeDevelopment.ts 통합 (storyOntology · harnessReport · mediaProjection)
2. docs/agent-system.md · docs/codex-agent-manifest.md 신설 에이전트 반영
3. 그 뒤 M4 완료, M7 v1.0-alpha 완성 루프

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 219 tests · `npm run build` 통과
- 수정 — `src/lib/aiCliHarness.ts` (buildHarnessPrompt), `src/lib/canonRefactor.ts` (ID 링크), `src/lib/storyEngine.ts` (validateContinuity)

### What the Last Session Did
1. **buildHarnessPrompt 16 기준 + 12 게이트 라인 추가** — Gap 10 프롬프트측
   - 16 craft 검토 기준 키를 에이전트별로 노출 (showrunner 3 · character 2 · world 2 · genre 3 · continuity 1 · critic 3 · essay 3)
   - 12 품질 게이트를 트랙별로 노출 (common 3 · commercial 2 · literary 4 · essay 3)
   - StoryMode 가중치 강제/권고 분기 설명 포함
2. **canonRefactor.findAffectedChapters ID 링크** — Gap 8
   - `CanonChangeEntryInput.targetCanonId?: string` optional 필드 신설
   - 새 helper `chapterReferencesCanonId` — chapter.newCanonFacts.id 직접 매칭
   - ID 매칭 우선, 없으면 기존 chapterContains 부분문자열 fallback (호환성)
3. **storyEngine.validateContinuity 의미적 충돌 감지** — Gap 3
   - `createContinuityContract({ hardCanon: canonFacts.map(f => f.statement) })`
   - 각 claim 에 `classifyCanonChange` 호출, hard-canon 위반(반전 신호)만 추가 issue
   - dedup — character/world issue 가 이미 잡은 claim 은 contract issue 추가 안 함 (중복 방지)

### Files To Touch (next milestone — M4 청크 H 후속)
- 수정 `src/lib/creativeDevelopment.ts` — `developCreativeProject` 가 storyOntology · runStoryHarness · projectAllMedia 결과를 `CreativeDevelopmentPackage` 에 통합
- 갱신 `docs/agent-system.md` — critic-reviewer · essay-curator 등 신설 에이전트 반영
- 갱신 `docs/codex-agent-manifest.md` — 신설 12 에이전트 매트릭스

### Files NOT To Touch
- M4.A~G 완성본
- `src/lib/storyEngine.test.ts` `surfaces continuity conflicts` 케이스 (dedup 으로 보존)

### Blockers
없음.

### Known Issues
- validateContinuity 의 contractIssues 가 기존 흐름과 dedup 됨 — character/world issue 가 잡힌 claim 은 hard-canon classify 결과를 무시. 두 시스템이 같은 claim 을 다르게 분류할 가능성 있음 (1차 컷에서 부분 매칭 호환성 우선).
- canonRefactor 의 targetCanonId 가 채워지지 않은 기존 변경은 그대로 부분문자열 매칭 흐름 (점진 마이그레이션).
- creativeDevelopment 통합 미완 — M4 완전 완료는 다음 묶음 후.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 H, § 6 Gap 12개

---

## 2026-05-22 15:42 — M4.G 매체 투영 (Layer 7) 완료

> Last Updated: 2026-05-22 15:42 KST

### Current Objective
M4 청크 G 완료 — 같은 StoryOntology 가 5 매체(novel/essay/webtoon/insta-toon/four-cut) 로 투영, 핵심 4 보존. 다음 자연스러운 작업 — M4 청크 H (통합 단계, M4 의 마지막 청크).

### Recommended Next Step
1. M4 청크 H 시작 — 가장 큰 통합 작업
   · `canonRefactor.ts` 엔티티 ID 링크 기반 영향 탐지 (Gap 8)
   · `storyEngine.validateContinuity` 를 `continuityContract.classifyCanonChange` 로 리팩터 (청크 C 에서 미룬 부분)
   · `aiCliHarness.buildHarnessPrompt` 에 16 기준·12 게이트 반영 (Gap 10 프롬프트측)
   · `creativeDevelopment.ts` 에 storyOntology·harnessReport·mediaProjection 통합
   · `docs/agent-system.md`·`docs/codex-agent-manifest.md` 신설 에이전트 반영

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 219 tests · `npm run build` 통과
- 신설 — `src/lib/mediaProjection.ts` + `.test.ts` (9 케이스)

### What the Last Session Did
1. **mediaProjection.ts 신설** — Layer 7 매체 투영
   - `MediaTarget` — 5 매체(novel/essay/webtoon/insta-toon/four-cut)
   - `projectMedia(ontology, target)` — 한 매체로 투영, fields + preservation 산출
   - `projectAllMedia(ontology)` — 5 매체 한 번에 (UI 비교용)
2. **매체별 필드 (Stage 7 정본)**
   - novel: chapterPromise · viewpointDistance · proseTexture · cliffhangerShape
   - essay: interviewQuestionPath · livedMaterialChecklist · privacyBoundary · voiceBible · reflectiveTurn
   - webtoon: episodeHook · scrollRhythm · visualAnchor · cutDensity
   - insta-toon: firstSlideHook · saveShareFinalBeat · captionAngle
   - four-cut: setup · escalation · twistPreparation · punchline
3. **핵심 보존 검증 (PreservationReport)**
   - 4 키 모두 체크 — premise.dramaticQuestion · characters[0].desire · worldRules[0].cost · plotThreads[0]
   - preserved=false 면 missing 에 누락 키 채워짐
   - 모든 매체가 같은 ontology 에서 동일한 preservedCore 보고 — 표면만 매체별, 핵심 동일
4. **TDD 9 케이스** — 5 매체 각 필드 + 보존 true/false + projectAllMedia + 매체 간 핵심 일관성

### Files To Touch (next milestone — M4 청크 H)
- 수정 `src/lib/canonRefactor.ts` — 엔티티 ID 링크 (Gap 8)
- 수정 `src/lib/storyEngine.ts` `validateContinuity` — `continuityContract.classifyCanonChange` 호출 (청크 C 에서 미룬 리팩터)
- 수정 `src/lib/aiCliHarness.ts` `buildHarnessPrompt` — 16 기준·12 게이트 반영
- 수정 `src/lib/creativeDevelopment.ts` — storyOntology·harnessReport·mediaProjection 통합
- 갱신 `docs/agent-system.md` · `docs/codex-agent-manifest.md`

### Files NOT To Touch
- M4.A · M4.B · M4.C · M4.D · M4.E · M4.F 완성본
- `src/lib/verticalSlice.ts` (필요 시만 호출 연결)

### Blockers
없음.

### Known Issues
- mediaProjection 의 필드 값들이 1차 컷에서 generic placeholder ('담담하고 선명한 한국어' 등) — 청크 H 통합에서 LLM 또는 작가 입력 기반으로 정밀화.
- projectMedia 가 ontology 의 첫 항목만 사용 (worldRules[0], plotThreads[0]) — 복수 항목 처리는 추후.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 G
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Stage 7

---

## 2026-05-22 15:27 — M4.F 에이전트 실행 엔진 (Layer 5) 완료

> Last Updated: 2026-05-22 15:27 KST

### Current Objective
M4 청크 F 완료 — Layer 5 에이전트 실행 엔진. 4가지 변경(신설·교체·폐기·확장) 모두 적용. 다음 자연스러운 작업 — M4 청크 G (mediaProjection, Layer 7).

### Recommended Next Step
1. M4 청크 G 시작 — `src/lib/mediaProjection.ts` 신설 (소설/웹툰/인스타툰/네컷 투영, 온톨로지 핵심 보존)
2. `verticalSlice.ts` 호출 연결

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 35 files / 210 tests · `npm run build` 통과
- 신설 — `src/lib/agentRunEngine.ts` + `.test.ts` (8 케이스)
- 폐기 — `src/lib/agentOrchestration.ts` + `.test.ts` 삭제 (Gap 2·11)
- 수정 — `src/lib/storyEngine.ts` (buildAgentRuns wrapper 화 + AgentRun.agentId 타입), `src/lib/agentReviewProcess.ts` (criteriaKeys 신설 + 7곳)

### What the Last Session Did
1. **agentRunEngine.ts 신설** — Layer 5 검토 스케일별 에이전트 실행
   - `planAgentRuns(input)` → `AgentRunPlan { scale, agents, runs }`
   - 스케일 결정 — quick(3) / standard(5) / deep(21) 의 defaultAgents 또는 명시 requestedAgentIds
   - agentLimit 으로 자동 자름 (token budget 보호)
   - continuity-editor 만 issues 기반 block/revise/pass 분기. 나머지는 pass.
   - 에이전트별 generic 출력 (showrunner/character-custodian/world-keeper/genre-stylist/continuity-editor 5명 + 그 외 18명은 agenda 그대로)
2. **storyEngine.buildAgentRuns 교체** — Gap 4 — 하드코딩 5명을 `planAgentRuns(input).runs` 호출로 위임
3. **agentOrchestration.ts + .test.ts 삭제** — Gap 2·11 — 선언만 있던 3계층 모델 폐기 (다른 import 없음 확인)
4. **agentReviewProcess.ts criteriaKeys 추가**
   - `AgentValidationProcess.criteriaKeys?: string[]` 신설 필드
   - 7 에이전트에 16 craft 기준 키 채움
     · showrunner: 3 (chapter_one_hook_check, chapter_end_hook_check, stakes_progression_audit)
     · character-custodian: 2 (pressure_triangle_validation, flat_character_warning)
     · world-keeper: 2 (motif_variation_audit, historical_consistency_extended)
     · genre-stylist: 3 (scene_sequel_ratio, voice_match_score, read_aloud_audit)
     · continuity-editor: 1 (open_threads_overload)
     · critic-reviewer: 3 (ambiguity_audit, ethical_pressure_test, silence_audit)
     · essay-curator: 3 (universal_leap_check, self_reversal_check, disclosure_scope_check)
5. **AgentRun.agentId 타입 확장** — `AgentId` → `ValidationAgentId`. 신설 12 에이전트도 AgentRun 의 source 가 될 수 있게 통합.

### Files To Touch (next milestone — M4 청크 G)
- 신설 `src/lib/mediaProjection.ts` + `.test.ts` — 매체별 투영(소설/웹툰/인스타툰/네컷), 온톨로지 핵심 보존
- 연결 `src/lib/verticalSlice.ts` 호출

### Files NOT To Touch
- M4.A · M4.B · M4.C · M4.D · M4.E 완성본
- 기존 AgentId union (확장 안 함 — ValidationAgentId 와 분리 유지)

### Blockers
없음.

### Known Issues
- `describeAgentRun` 의 generic 출력은 결정론 — LLM 호출은 청크 H 통합 단계에서 도입.
- buildAgentRuns wrapper 는 input 에 scale/requestedAgentIds 를 전달하지 않음 (standard 기본). 호출 흐름이 scale 을 전달하도록 청크 H 에서 storyEngine 확장.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 F, § 5-2 (16 검토 기준)

---

## 2026-05-22 14:54 — M4.E 품질 게이트 12개 + 바이블 13 카테고리 완료

> Last Updated: 2026-05-22 14:54 KST

### Current Objective
M4 청크 E 완료 — `qualityGates.ts` 가 12 게이트(common/commercial/literary/essay 트랙)를 `StoryMode` 가중치로 강제/권고 결정. `storyEngine.ts` 에 13 바이블 카테고리 optional 필드(pressureTriangle, narratorCard, voiceSignatureId, motifLedger, symbolLayers, formalDesign, historicalAnchors, personaCard, disclosureLedger, stakesLedger, rewardArc) 추가. 다음 자연스러운 작업 — M4 청크 F (agentRunEngine, Layer 5).

### Recommended Next Step
1. M4 청크 F 시작 — `src/lib/agentRunEngine.ts` 신설 (검토 스케일별 에이전트 실행, AgentRun[] 산출)
2. `storyEngine.buildAgentRuns()` 를 `agentRunEngine` 호출로 교체 (Gap 4)
3. `agentOrchestration.ts` 폐기 (Gap 2·11)
4. `agentReviewProcess.ts` 에 `critic-reviewer`·`essay-curator` + 16개 검토 기준 추가

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 35 files / 204 tests · `npm run build` 954ms
- 신설 — `src/lib/qualityGates.ts` + `.test.ts` (9 케이스)
- 수정 — `src/lib/storyEngine.ts` (11 신설 타입 + 11 신설 optional 필드), `src/lib/storyEngine.test.ts` (3 신설 케이스)

### What the Last Session Did
1. **qualityGates.ts 신설** — Layer 4 품질 게이트 12개
   - 12 GateKey + 4 GateTrack (common/commercial/literary/essay) + GateRequirement (blocking/advisory)
   - StoryMode { commercialWeight, literaryWeight } 가중치로 강제/권고 분기
     · common 게이트: 항상 blocking
     · commercial 게이트: commercialWeight ≥ 0.5 면 blocking, 아니면 advisory
     · literary 게이트: literaryWeight ≥ 0.5 면 blocking, 아니면 advisory
     · essay 게이트: 에세이 매체에서만 평가, gate_disclosure_scope 만 항상 blocking
   - 조건부 평가 — gate_hook_last_200 (serial 만), gate_ambiguity_at_finale (finale 만), essay 게이트 (essay 매체만)
   - 휴리스틱 — gate_hook_first_300 (첫 300자 행동/긴장 token), gate_hook_last_200 (마지막 200자 cliff token)
2. **storyEngine.ts 13 바이블 카테고리 확장** — 모두 optional
   - CharacterProfile.pressureTriangle?: PressureTriangle (want/desire/taboo)
   - SeriesProject — narratorCard, voiceSignatureId, motifLedger, symbolLayers, formalDesign, historicalAnchors, personaCard, disclosureLedger (8개)
   - Chapter — stakesLedger, rewardArc (2개)
   - 11 신설 타입(PressureTriangle, NarratorCard, MotifLedgerEntry, SymbolLayer, FormalDesign, HistoricalAnchor, PersonaCard, DisclosureEntry, StakesLedgerEntry, RewardArcEntry)
   - 기존 createEmptyProject 와 호환 — 신설 필드는 undefined 기본
3. **TDD 12 케이스** — qualityGates 9 (모드별 분기 + 트랙 분리 + 조건부 평가) + storyEngine 3 (pressureTriangle 보존, stakesLedger/rewardArc 보존, 8개 optional 필드 undefined 기본)

### Files To Touch (next milestone — M4 청크 F)
- 신설 `src/lib/agentRunEngine.ts` + `.test.ts` — 검토 스케일별 에이전트 실행, `AgentRun[]` 산출
- 수정 `src/lib/storyEngine.ts` `buildAgentRuns()` — agentRunEngine 호출로 교체 (Gap 4)
- 삭제 `src/lib/agentOrchestration.ts` + `.test.ts` (Gap 2·11)
- 수정 `src/lib/agentReviewProcess.ts` — `critic-reviewer`·`essay-curator` + 16개 검토 기준 추가 (5-2절)

### Files NOT To Touch
- M4.A · M4.B · M4.C · M4.D 완성본
- `src/lib/koreanStyle.ts` (흡수 패턴 유지)

### Blockers
없음.

### Known Issues
- qualityGates 의 휴리스틱(첫/마지막 token 매칭) 은 1차 컷 — 의미론적 정확도 낮음. 청크 F·H 에서 LLM 기반 정밀화.
- voiceSignatureId 는 string id 만 — voiceSignature 본체 저장은 별도 모듈 (koreanVoiceGate.VoiceSignature) 에서 점진 연결.
- storyEngine.buildAgentRuns 는 아직 하드코딩 (Gap 4 미해결). 청크 F 에서 교체.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 5-1 (바이블 13), § 5-3 (게이트 12), § 7 청크 E

---

## 2026-05-21 23:31 — M4.D 한국어 문체 게이트 (Layer 4 일부) 완료

> Last Updated: 2026-05-21 23:31 KST

### Current Objective
M4 청크 D 완료 — `inspectKoreanVoice` 가 generic AI 어휘·명사 과다·번역투·쉼표 과다·추상 감정어·voice signature mismatch 6 종 flag 를 산출. 기존 `koreanStyle.ts` 의 6 케이스는 보존(흡수 패턴, 폐기 아님). 다음 자연스러운 작업 — M4 청크 E (qualityGates 12개 + SeriesProject 13 바이블 카테고리).

### Recommended Next Step
1. M4 청크 E 시작 — `src/lib/qualityGates.ts` 신설 (12 게이트, modeRequirement, evaluate, onFail)
2. `SeriesProject`/`CharacterProfile` 에 13개 바이블 카테고리 필드 추가 (5-1절)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 34 files / 192 tests · `npm run build` 통과
- 신설 — `src/lib/koreanVoiceGate.ts` + `.test.ts` (6 케이스)

### What the Last Session Did
1. **koreanVoiceGate.ts 신설** — Layer 4 일부 (한국어 문체 게이트)
   - `inspectKoreanVoice(text, signatures?)` — 6 종 flag
     · generic-ai-vocabulary (`핵심적·효과적·지속가능한·혁신적·다채로운·중요한 의미`)
     · noun-heavy-sentence (`구조·시스템·요소·과정·방식·체계·관점·특성` ≥ 2)
     · translation-ese / comma-overflow / abstract-emotion (koreanStyle 흡수)
     · voice-signature-mismatch (forbiddenWords 발견 시)
   - `VoiceSignature` 인터페이스 — ownerLabel + sentenceLength + forbiddenWords + preferredRegister + preserveTokens
   - `createEmptyVoiceSignature` — 기본 preserveTokens 4개 (harness/ontology/prompt/canon)
   - `revisedText` — generic AI 어휘 제거 + preserveTokens 는 보존
   - `score` — 100 - flags×15 - mismatch×5
2. **흡수 패턴** — koreanStyle.ts 의 evaluateKoreanProse 를 내부적으로 호출. 기존 API 와 6 테스트 보존.
3. **TDD 6 케이스** — Task 5 generic + noun-heavy, clean text 100점, signature mismatch, preserveTokens, koreanStyle 흡수, createEmptyVoiceSignature 기본값

### Files To Touch (next milestone — M4 청크 E)
- 신설 `src/lib/qualityGates.ts` + `.test.ts` — 12개 게이트 (gate_hook_first_300 · gate_scene_sequel_balance · gate_voice_match_70 · gate_pressure_triangle_active · gate_ambiguity_at_finale · gate_ethical_cost_present · gate_motif_variation · gate_historical_density · gate_universal_leap · gate_self_reversal · gate_disclosure_scope)
- 수정 `src/lib/storyEngine.ts` `SeriesProject`/`CharacterProfile` — 13 바이블 카테고리 필드 추가

### Files NOT To Touch
- `src/lib/koreanStyle.ts` 와 `.test.ts` (보존 — 흡수만, 폐기 아님)
- M4.A · M4.B · M4.C 완성본

### Blockers
없음.

### Known Issues
- isNounHeavy 휴리스틱 — `구조/시스템/요소/과정/방식/체계/관점/특성` 패턴 카운트. 일반 한국어 문장에서도 가끔 잡을 가능성. 청크 H 통합에서 LLM 기반 정밀화.
- VoiceSignature 가 아직 어디서도 build 되지 않음 — 다음 청크에서 SeriesProject 에 voice_signature 필드 추가하면서 연결.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 5-3 (게이트 12개), § 7 청크 D
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Chunk 3 Task 5

---

## 2026-05-21 23:25 — M4.C 연속성 계약 (Layer 1) 완료

> Last Updated: 2026-05-21 23:25 KST

### Current Objective
M4 청크 C 1차 컷 완료 — 캐논 3계층 분류 + 성장 레저 + 컨텍스트 팩 + 리페어 제안 + evolution-memory.md 슬롯. 다음 자연스러운 작업 — M4 청크 D (koreanVoiceGate, Layer 4 일부).

### Recommended Next Step
1. M4 청크 D 시작 — `src/lib/koreanVoiceGate.ts` 신설, `koreanStyle.ts` 흡수, voice_signature 도입
2. 기존 `koreanStyle.test.ts` 통과 유지 (보존 필수)
3. 청크 H (통합 단계) 에서 `storyEngine.validateContinuity` 를 `continuityContract.classifyCanonChange` 로 리팩터

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 33 files / 186 tests · `npm run build` 923ms
- 신설 — `src/lib/continuityContract.ts` + `.test.ts` (11 케이스)
- 수정 — `src/lib/memoryBank.ts` memoryBankTemplate (Gap 9)

### What the Last Session Did
1. **4A 캐논 3계층 분류** — `classifyCanonChange(contract, claim, ctx)` 가 hard-canon/living-state/soft-signal/unrelated 중 하나로 layer 판정 + allowed/severity/requiredApproval/matchedSource 반환
2. **4B 성장 레저** — `validateGrowthEntry` 가 필수 7 필드(특히 cost) 누락을 잡아낸다. `appendGrowthEntry` 는 불변(immutable) 패턴.
3. **4C 컨텍스트 팩** — `buildContextPack` 가 작품 전체 원고 대신 압축된 결정-가능 상태만 담는다. `lastDeltas` 는 최근 3개로 자동 압축.
4. **4D 리페어 제안** — `proposeContinuityRepair` 가 hard canon 위반에 두 가지 제안(보존 vs 의도적 변경) 산출. 침묵 리라이트 금지.
5. **휴리스틱 (1차 컷)** — 한국어 명사 토큰 ≥ 2 공유 + 부정 마커 차이 → "반전". LLM 기반 정밀화는 청크 F·H 에서.
6. **memoryBank evolution-memory.md** — memoryBankTemplate 의 context/ 폴더에 한 줄 추가 (Gap 9).

### Files To Touch (next milestone — M4 청크 D)
- 신설 `src/lib/koreanVoiceGate.ts` + `.test.ts` — voice_signature, 캐릭터 voice rule, GOMI/Humanizer-inspired Korean checks
- 흡수 — `koreanStyle.ts` 의 기능을 koreanVoiceGate 가 노출. 기존 `koreanStyle.test.ts` 보존 (이름은 두고 내용만 유지).

### Files NOT To Touch
- M4.A · M4.B 완성본 (CanonFact owner, storyEngine seed, storyOntology, storyHarness)
- `src/lib/koreanStyle.test.ts` 기존 케이스 (보존)
- 기존 `storyEngine.validateContinuity` 흐름 (청크 H 에서 리팩터)

### Blockers
없음.

### Known Issues
- 한국어 명사 토큰 추출이 휴리스틱 — 조사 패턴(`은|는|이|가|을|를|...`) 정규식 기반. 형태소 분석기 없이 첫 컷. 청크 D 의 koreanVoiceGate 와 함께 점진 정밀화.
- `validateContinuity` 가 아직 부분문자열 매칭 — 리팩터는 청크 H 에서. 1차 컷의 의도된 분리(기존 통과 테스트 보호).

### Reference Documents
- `docs/storyx-harness-architecture.md` § 3-4 (캐논 3계층), § 7 청크 C
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Chunk 2.5 (Task 4A·4B·4C·4D)

---

## 2026-05-21 21:53 — M4.B 온톨로지 기반 (Layer 0) 완료

> Last Updated: 2026-05-21 21:53 KST

### Current Objective
M4 스토리 하네스 구현의 청크 B (Layer 0) 완료 — storyOntology 와 storyHarness 두 모듈이 작가 입력을 받아 작품 그래프 + 6단계 스테이지 점수를 산출. 다음 자연스러운 작업 — M4 청크 C (Layer 1, continuityContract 신설 + validateContinuity 리팩터).

### Recommended Next Step
1. M4 청크 C 시작 — `src/lib/continuityContract.ts` 신설 (3계층 — Hard Canon · Living State · Soft Signal)
2. `storyEngine.validateContinuity` 를 `continuityContract` 호출로 리팩터 (Gap 3 — 부분문자열 매칭 폐기)
3. `memoryBank.ts` 에 `evolution-memory.md` 영속 파일 추가 (Gap 9)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 32 files / 175 tests · `npm run build` 성공 (901ms)
- 신설 — `src/lib/storyOntology.ts` + `.test.ts` (5 케이스) · `src/lib/storyHarness.ts` + `.test.ts` (4 케이스)

### What the Last Session Did
1. **storyOntology.ts 신설** — 작가 입력을 받아 작품 그래프 첫 컷 생성
   - 8 타입 — StoryPremise · ThemeClaim · CharacterNode · RelationshipEdge · WorldRuleNode · ConflictEngine · PlotThread · CanonSeed
   - `buildStoryOntology(input)` — material/storySeed/characterSeed/audience/constraints 휴리스틱 구조화
   - `validateStoryOntology(ontology)` — 6 종 경고 (missing-dramatic-question · missing-world-cost · thread-without-payoff · no-character · no-conflict · no-plot-thread) silent fix 금지
2. **storyHarness.ts 신설** — 6단계 스테이지 점수 합산
   - story-sense (10) · premise-forge (10) · ontology-builder (30) · pressure-test (25) · korean-voice-gate (10) · media-projection (10) = 100
   - `runStoryHarness(input)` 호출 시 모든 stage 실행 + qualityScore ≥ 70 일 때 readyForProduction
   - 각 stage 가 findings + requiredRepairs 산출 — 작가에게 다음 행동을 명시
3. **TDD 9 케이스** — 모두 정본 Chunk 1·2 의 스켈레톤 + Task 2/4 검증 케이스
   - storyOntology 5: 핵심 엔티티 채워짐 / 4종 누락 경고 케이스
   - storyHarness 4: 6 stage 순서 + readyForProduction / 약한 스토리 미달 / 빈 입력 block / 매체 미지정 warning

### Files To Touch (next milestone — M4 청크 C)
- 신설 `src/lib/continuityContract.ts` + `.test.ts` — 캐논 3계층, growthLedger, 컨텍스트 팩, 리페어 제안
- 수정 `src/lib/storyEngine.ts` `validateContinuity` — continuityContract 호출로 리팩터
- 수정 `src/lib/memoryBank.ts` — `evolution-memory.md` 추가 (Gap 9)

### Files NOT To Touch
- M4.A 완성본 (storyEngine.ts CanonFact/normalizeCanonOwner/produceNextChapter)
- 기존 통과 테스트들 (storyEngine.test.ts 의 다른 it)

### Blockers
없음.

### Known Issues
- buildStoryOntology 의 휴리스틱이 첫 컷 — 한국어 자연어 파싱 정밀도는 낮음. 다음 청크에서 LLM 기반 확장 또는 작가 직접 입력 폼 도입 검토.
- 점수 분포가 정적 — 매체/모드 가중치(commercialWeight/literaryWeight) 별 동적 조정은 청크 E (qualityGates) 에서 도입.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 3-1 (Layer 구조), § 7 청크 B
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Chunk 1·2

---

## 2026-05-21 20:41 — M4.A 캐논 기반 정리 (선행) 완료

> Last Updated: 2026-05-21 20:41 KST

### Current Objective
M4 스토리 하네스 구현의 청크 A (캐논 기반 정리) 완료 — CanonFact.owner 타입 통일 + produceNextChapter 시드 모티프 제거. 다음 자연스러운 작업 — M4 청크 B (storyOntology + storyHarness Layer 0 신설).

### Recommended Next Step
1. M4 청크 B 시작 — `src/lib/storyOntology.ts` + `storyHarness.ts` 신설 (TDD)
2. 청크 B 의 6단계 스테이지 (진단·전제·온톨로지·압력·문체·매체) 와 점수 시스템

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 166 tests · `npm run build` 성공
- 신규 테스트 2개 (Gap 5 owner 통일, Gap 7 빈 프로젝트 가드)
- 수정 — `src/lib/storyEngine.ts` 3곳, `src/lib/storyEngine.test.ts` 2 it 추가

### What the Last Session Did
1. **TDD — 테스트 우선 추가** (storyEngine.test.ts)
   - "chapterFromDraftPayload 가 매체별 owner(voice/visual/audio) 를 plot 으로 다운캐스트하지 않는다" (Gap 5)
   - "produceNextChapter 가 빈 프로젝트(인물 0명)에서도 throw 없이 chapter 를 만들고 시드 모티프를 새지 않는다" (Gap 7)
2. **storyEngine.ts CanonFact.owner 6개 통일** — `'character'|'world'|'plot'|'voice'|'visual'|'audio'`. aiCliHarness·memoryBank 와 일관.
3. **normalizeCanonOwner 6개 확장** — 6개 모두 통과시키고 모르는 값만 plot 폴백.
4. **produceNextChapter 시드 모티프 제거**
   - 작품 묶임 텍스트(달의 탑·오빠의 표식·이안) 모두 제거
   - `project.characters[0]?.name ?? '주인공'`, `[1]?.name ?? '동료'` 가드
   - intent/pressure trim + 빈 값 generic 대체 ("오래 미뤄 둔 결정에 직면하는 것" 등)
   - hook·outline·prose·beats 모두 작가 입력 + 장르 메타로만 산출

### Files To Touch (next milestone — M4 청크 B)
- 신설 `src/lib/storyOntology.ts` + `.test.ts` — 엔티티·관계·검증자
- 신설 `src/lib/storyHarness.ts` + `.test.ts` — 6단계 스테이지·점수

### Files NOT To Touch
- M3.6 / M4.5 / M5 / M6 완성본 (이전 세션들)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
없음. M5 인증 블로커는 별개로 사용자 액션 영역.

### Known Issues
- 청크 A 의 produceNextChapter 가 deterministic fallback 으로 충분히 generic 화됐지만, 캐릭터·intent 가 모두 빈 경우 텍스트가 다소 평이함. LLM 응답이 정상 흐를 때는 사용되지 않는 경로라 1차 컷에서는 OK.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 A~H 정의

---

## 2026-05-21 15:30 — M6.2.1 evolution history UI (AiStatusBadge popover) 완료

> Last Updated: 2026-05-21 15:30 KST

### Current Objective
사용자가 헤더의 작은 AI 상태 뱃지를 클릭하면 popover 가 열리고, 작품 전체 AI 활동 이력을 시간순으로 본다. M6.2 의 인프라가 처음으로 가시화됨. 다음 자연스러운 작업 — M6.3 storyx CLI 또는 M4 스토리 하네스 (Layer 0~7) 또는 evolution 이벤트 종류 확장(검토 결과·메모리 결정 자동 누적).

### Recommended Next Step
1. dev 서버에서 자유서술 → 인터뷰 클릭 → 뱃지가 라임 "AI 활성" 또는 노란 "AI 폴백" 으로 변함 → 클릭 → popover 에 이벤트 노출 확인
2. evolutionMemory 가 글로벌 한 키 — projectId 별 분리 또는 storyx CLI 작업 우선순위 결정
3. M4 또는 M6.3 으로 진입

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 529kb js · 175kb css (1.03s) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 수정 — `src/components/AiStatusBadge.tsx` (재작성)
- 하네스 — `feature_list.json` M6.2.1 신설 + active

### What the Last Session Did
1. **`AiStatusBadge.tsx` 재작성**
   - `span` → `button` (클릭 가능), `cursor: pointer`
   - `isOpen` state + 바깥 클릭 / Escape 닫기 hook
   - `loadEvolutionHistory()` 으로 최근 이벤트 가져오기 (status 변경 시 자동 갱신)
   - popover — 헤더(제목 + 카운터 + 비우기 + 닫기) + 이벤트 리스트
2. **이벤트 표시**
   - 색 분기 — 성공(라임) / 주의(앰버, review-revise·memory-revised·held) / 실패(빨강, review-blocked·memory-rejected·summary 에 "실패" 포함)
   - 메타 — 상대 시간(초/분/시간/일) · source(mode label) · detail
   - 빈 상태 안내 — "아직 누적된 AI 활동이 없습니다…"
3. **비우기 버튼** — confirm 후 `clearEvolutionHistory()` + popover 닫기
4. **닫기 X 버튼** — popover 만 닫기 (state 보존)
5. **lucide 아이콘** — Activity (헤더) · Trash2 (비우기) · X (닫기)

### Files To Touch (next milestone)
- **M6.3 storyx CLI** — `tools/storyx.mjs` 또는 신규 CLI 에 init/serve/memory sync
- **M4 스토리 하네스 Layer 0~7** — `docs/storyx-harness-architecture.md` 청크 A~H TDD
- **(보강) evolution 이벤트 자동 누적 확장** — 메모리 큐 결정·검토 결과 등도 자동 append (현재는 llm-call 만)

### Files NOT To Touch
- `src/lib/evolutionMemory.ts` (M6.2 정본)
- `src/lib/aiStatus.ts` (M6.2 정본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백
- (로컬 LLM) `claude` CLI 401

### Known Issues
- evolutionHistory 가 글로벌 한 키 — 여러 작품 간 이력이 섞임. projectId 별 분리 검토.
- llm-call kind 만 자동 누적 — review-pass/revise/blocked 등 다른 kind 는 호출 측에서 명시적 append 가 필요. 현재는 reviewClient 가 reportAiCall 만 호출하므로 모든 검토가 llm-call 로 기록됨.
- popover 가 width 340px 고정 — 모바일 미고려.

### Reference Documents
- `docs/vercel-env-setup.md`
- `~/.claude/plans/x-zippy-graham.md`

---

## 2026-05-21 15:22 — M6.2 evolutionMemory 누적 저장 완료

> Last Updated: 2026-05-21 15:22 KST

### Current Objective
모든 LLM 호출이 시간순 evolution history 에 자동 누적되고, export/import 페이로드에 포함되어 백업·이동 가능. 다음 자연스러운 작업 — M6.3 storyx CLI 확장 또는 M4 스토리 하네스 구현 (Layer 0~7) 또는 evolution history UI 노출.

### Recommended Next Step
1. dev 서버에서 LLM 호출 발생 → localStorage 의 `serial-story-studio/evolution-history` 누적 확인
2. M6.1 내보내기 → JSON 파일에 `evolutionHistory.events` 포함 확인
3. 그 뒤 M6.3 (CLI) 또는 evolution-history UI 패널 신설 (M6.2.1) 또는 M4 시작

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 524kb js · 175kb css (1.22s) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 신설 — `src/lib/evolutionMemory.ts`
- 수정 — `src/lib/aiStatus.ts` · `src/lib/storage.ts` · `feature_list.json`

### What the Last Session Did
1. **`src/lib/evolutionMemory.ts` 신설**
   - `EvolutionEventKind` — llm-call / review-pass·revise·blocked / memory-approved·revised·rejected·held / draft-generated / release-locked
   - `EvolutionEvent` — { id, at, kind, source?, summary, detail? }
   - `EvolutionHistory` — schema='storyx/evolution-history/v1' + events[]
   - `loadEvolutionHistory` · `saveEvolutionHistory` · `clearEvolutionHistory`
   - `appendEvolutionEvent` — id·at 자동 생성, MAX 500 trim
   - `replaceEvolutionHistory` — import 페이로드 검증 + 통째 덮어쓰기
2. **`src/lib/aiStatus.ts` 훅 추가**
   - `reportAiCall` 에서 `appendEvolutionEvent({ kind: 'llm-call', source: mode, summary, detail: reason })` 자동 호출
   - SSR · quota 실패 시 silent (UI 신호는 그대로 흐름)
3. **`src/lib/storage.ts` export/import 페이로드 확장**
   - `StoryXExportPayload` 에 `evolutionHistory?: EvolutionHistory` 추가
   - `exportAllData` 에서 `loadEvolutionHistory()` 포함
   - `importAllData` 에서 `replaceEvolutionHistory(payload.evolutionHistory)` 호출, message 에 "진화 메모리 N개 포함" 표시

### Files To Touch (next milestone)
- **M6.2.1 (선택) UI 노출** — 스튜디오 ⚙ 설정 또는 별도 패널에 최근 N개 이벤트 표시. 작가가 자기 작품의 학습 흐름을 본다.
- **M6.3 storyx CLI** — `tools/storyx.mjs` 또는 신규 CLI 에 init/serve/memory sync. 파일 영속 (vault 모드).
- **M4 스토리 하네스 (Layer 0~7)** — `docs/storyx-harness-architecture.md` 청크 A~H TDD.

### Files NOT To Touch
- `src/lib/agentReviewProcess.ts` 의 `evolutionMemory: string[]` 필드 (정적 카테고리 안내문 — 별개)
- `src/lib/publishing.ts` (M3.6 완성본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백
- (로컬 LLM) `claude` CLI 401 — 사용자 액션 필요

### Known Issues
- evolution history 가 작품마다 분리 없이 글로벌 한 키 — 여러 작품 사이 누적이 섞임. M6.3 (또는 storage 확장)에서 projectId 별 분리 고려.
- UI 노출 없음 — 백업/복원에는 즉시 가치, 작가가 history 를 보는 흐름은 다음 단계.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 가이드
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵

---

## 2026-05-21 15:18 — M6.1 프로젝트 export/import (JSON 파일) 완료

> Last Updated: 2026-05-21 15:18 KST

### Current Objective
M6 영속성·메모리 싱크의 첫 컷 완료 — 사용자가 작품 전체(project + snapshots + preferences)를 한 JSON 으로 백업/복원할 수 있다. 다음 자연스러운 작업 — M6.2 evolutionMemory 누적 또는 M6.3 storyx CLI 확장.

### Recommended Next Step
1. dev 서버에서 스튜디오 → ⚙ 설정 → 프로젝트 데이터 → 내보내기 동작 확인
2. 내보낸 JSON 을 다른 브라우저/계정에서 가져오기 시연
3. 그 뒤 M6.2 (evolutionMemory) 또는 M4 (스토리 하네스 Layer 0~7) 우선순위 결정

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 523kb js · 174kb css (847ms) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 수정 — `src/lib/storage.ts` · `src/StoryXDesk.tsx` · `src/styles.css` · `feature_list.json`

### What the Last Session Did
1. **`src/lib/storage.ts` 확장**
   - `StoryXExportPayload` 타입 (schema='storyx/export/v1', exportedAt, project, snapshots, preferences)
   - `exportAllData()` — 5 localStorage 키(project · snapshots · landingTheme · studio.accent · studio.canvas) 한 묶음
   - `importAllData(input)` — 문자열/객체 둘 다 받고 검증 후 덮어쓰기. ImportOutcome { ok, message } 반환
   - `normalizeTheme` · `isRecord` · `readPreference` · `writePreference` 헬퍼
2. **`src/StoryXDesk.tsx` 핸들러**
   - `fileInputRef` + `handleExportProject` (Blob 다운로드) + `handleImportClick` + `handleImportFile` (confirm → 덮어쓰기 → reload)
   - lucide import 에 `Download`, `Upload` 추가
3. **설정 패널 확장**
   - 트윅·캔버스 두 그룹 다음에 "프로젝트 데이터" 그룹 추가
   - 내보내기/가져오기 두 버튼 + 숨김 file input
   - hint 텍스트 갱신 — "가져오기는 현재 작품을 덮어쓰니 먼저 내보내기를 권장합니다."
4. **`src/styles.css`** — `.sx-studio-data-action` 클래스 (기존 chip 톤과 일관)
5. **TypeScript 두 곳 수정** — `landingTheme` 좁히기 + `payload.project as unknown as SeriesProject` 우회

### Files To Touch (next milestone)
- **M6.2 선택 시** — `src/lib/memoryBank.ts` 에 `evolutionMemory.history` 추가, `exportAllData` 페이로드에 포함
- **M6.3 선택 시** — `tools/storyx.mjs` 또는 신규 `tools/storyx-cli.mjs` 에 init/serve/memory sync 명령
- **M4 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H TDD

### Files NOT To Touch
- `src/lib/publishing.ts` (M3.6 완성본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백. `docs/vercel-env-setup.md` 참고.
- (로컬 LLM) `claude` CLI 401. 사용자 액션 필요.

### Known Issues
- 가져오기가 성공하면 즉시 `window.location.reload()` — 작업 중인 미저장 변경이 있으면 손실. M6.2 에서 dirty state 체크 추가 고려.
- import 페이로드 검증이 schema 와 project 객체 여부만 — 깊은 필드 검증 없음. normalizeProject 가 누락 필드를 채우지만 악의적 입력엔 약함.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 가이드
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본

---

## 2026-05-21 15:58 — M5 Vercel Functions 5 라우트 완료

> Last Updated: 2026-05-21 15:58 KST

### Current Objective
5 라우트(`/api/draft`·`/api/review`·`/api/review-agent`·`/api/review-data`·`/api/interview`) 가 production 배포본에서 직접 LLM 호출. dev 환경에서는 기존 storyxBridge 미들웨어가 같은 path 를 가로채 storyx.mjs 를 호출 (병행 유지).

### Recommended Next Step
1. 사용자가 Vercel Project Settings 에 `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 설정
2. `vercel deploy` 또는 git push 로 새 배포
3. `curl POST .vercel.app/api/interview` 로 한 줄 검증 — `"provider": "ai-gateway"` / `"anthropic"` 응답 확인
4. 다음 자연스러운 작업 — M6 영속성·메모리 싱크 또는 M4 스토리 하네스 구현(Layer 0~7)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests · `npm run build` 519kb js (963ms)
- 새 파일 — `api/*.ts` 5개, `src/lib/server/{promptBuilders,llmRunner}.ts`, `docs/vercel-env-setup.md`
- 수정 — `vercel.json` functions config, `feature_list.json` M5 done

### What the Last Session Did
1. **AI SDK 의존성 설치** — `ai` + `@ai-sdk/anthropic` + `@vercel/node`
2. **공유 모듈 신설**
   - `src/lib/server/promptBuilders.ts` — buildInterviewPrompt + buildDraftPrompt + buildReviewPrompt + buildAgentReviewPrompt + buildDataReviewPrompt + loadAgentPersona + parseLlmJson
   - `src/lib/server/llmRunner.ts` — runLlmJson 헬퍼 (AI Gateway 우선, Anthropic 직결 fallback, 키 없으면 mock)
3. **5 Vercel Functions 신설**
   - `api/interview.ts` · `api/draft.ts` · `api/review.ts` · `api/review-agent.ts` · `api/review-data.ts`
   - 모두 같은 패턴 — body 파싱 → prompt 빌드 → runLlmJson → 클라이언트 응답 형태로 정규화
4. **`vercel.json` 갱신** — `functions.api/review-agent.ts.includeFiles: ".claude/agents/**"` 로 페르소나 .md 를 serverless 번들에 포함
5. **`docs/vercel-env-setup.md` 신설** — env 변수 두 가지(`AI_GATEWAY_API_KEY` / `ANTHROPIC_API_KEY`), 로컬 vs 배포본 동작 차이, curl 검증 예시

### Files To Touch (next milestone)
- **M6 선택 시** — `src/lib/storage.ts` 확장으로 파일/클라우드 영속, `storyx` CLI 확장
- **M4 (Layer 0~7) 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H TDD

### Files NOT To Touch
- `tools/storyx.mjs` (로컬 CLI 호환 — 같은 로직이 promptBuilders.ts 에 복제됐지만 양쪽 유지)
- `vite.config.ts` storyxBridge (dev 전용)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 가 Vercel Project Settings 에 없으면 mock 폴백
- (로컬 LLM) `claude` CLI 401 — 사용자가 `claude login` 또는 ANTHROPIC_API_KEY 설정 필요

### Known Issues
- promptBuilders.ts 와 storyx.mjs 가 같은 로직 두 곳에 — 변경 시 양쪽 함께 수정 필요. 추후 storyx.mjs 를 .ts 마이그레이션 또는 promptBuilders 를 child_process 에서 import 하는 방식 고려.
- `LanguageModel` 타입에 `'anthropic/...'` 문자열 직접 캐스팅. AI SDK v6 가 provider/model string 을 정식 지원하지만 타입 시그니처는 LanguageModel 인스턴스를 요구해서 `as unknown as LanguageModel` 우회.
- 빌드 chunk 519kb (gzip 160kb) — 500kb 경고. M6 또는 별도 작업에서 manualChunks 또는 dynamic import 로 분할 고려.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 + 배포 검증 안내
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본

---

## 2026-05-21 15:48 — M3.6.1 퍼블리시 화면 실데이터 + 4 카드 CTA LLM 호출 + agentFileMap 확장 완료

> Last Updated: 2026-05-21 15:48 KST

### Current Objective
퍼블리시 stage 가 정적 4 카드에서 진짜 출간 도구로 진화. 다음 자연스러운 작업은 M5 Vercel Functions 또는 M4 스토리 하네스 구현(Layer 0~7).

### Recommended Next Step
1. 사용자가 `claude login` 으로 401 블로커 해제
2. dev 서버에서 스튜디오 → 출간 클릭 → PublishScreen 진입 → 4 카드 CTA 호출 → 결과 인라인 노출까지 end-to-end 검증
3. 검증 후 M5 (Vercel Functions) 우선순위 결정

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests · `npm run build` 519kb js (1.39s)
- 추적 — 14 modified + 3 new

### What the Last Session Did
1. **PublishScreen 실데이터 표시**
   - publishingPlan 의 모든 필드 노출 — title · releaseNotice · checklist · snapshotItems · changeLogReview · packageItems · platformProof · releaseLock
   - 출간 게이트 영역에 status 색(ready=라임, review=앰버) + 아이콘
2. **잠금 버튼 동작**
   - `releaseLock.canLock` 에 연동, 토글 동작
   - blocker 있으면 "N개 게이트가 아직 review 상태" 안내
3. **4 카드 CTA → requestAgentReview LLM 호출**
   - 4 상태 (idle / loading / success / failed) 인라인 렌더링
   - 성공 시 status chip + note + strengths + issues 표시
   - 실패 시 reason + "다시 호출" 버튼
   - buildAgentContext 헬퍼로 컨텍스트 추출 (작품의 핵심 결만)
4. **storyx.mjs agentFileMap 확장 — M4 신설 12명 모두 추가**
   - 스튜디오 6 + 랜딩 1 + 브릿지 1 + 출판 4
   - 출판 4명도 review-agent 흐름으로 호출 가능해짐
5. **매체별 deliverables 변동** — essay/novel/comics/audiobook 에 따라 카드 산출물 리스트 다름

### Files To Touch (next milestone)
- **M5 선택 시** — `vite.config.ts` 의 5 storyxBridge 를 Vercel Functions 로. `api/draft.ts` · `api/review-agent.ts` · `api/interview.ts` · `api/review-data.ts` · `api/review.ts` 신설. agentFileMap 의 .md 페르소나를 serverless 번들에 포함해야 함.
- **M4 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H 순서로 TDD.

### Files NOT To Touch
- `src/lib/publishing.ts` PublishingPlan 타입 (그대로 사용)
- `src/lib/agentReviewProcess.ts` ValidationAgentId (craft 검토용으로 분리 유지)
- `.claude/agents/*.md` (페르소나 정본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
- `claude` CLI 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요

### Known Issues
- 빈 `ANTHROPIC_API_KEY=` 가 OAuth 토큰을 가릴 가능성 — `~/.zshrc` 점검 권장
- Vercel 배포본 — 5 storyxBridge 가 Vite plugin 이라 production 에선 mock 폴백. M5 에서 해결.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-22 15:18 — M3.6 퍼블리시 파트 신설 + AI 상태 표시기 + 인터뷰 폴백 신호 완료

> Last Updated: 2026-05-22 15:18 KST

### Current Objective
4파트 구조의 마지막 파트(퍼블리시) 1차 컷 완료. 다음 자연스러운 작업은 (a) M3.6.1 PublishScreen 실데이터 연동 또는 (b) M5 Vercel Functions 중 사용자 선택.

### Recommended Next Step
사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정으로 인증 해제 → dev 서버에서 4파트 흐름 끝까지 확인. 그 뒤 M3.6.1(실데이터) 또는 M5(Vercel) 우선순위 결정.

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests 통과 · `npm run build` 성공 (511kb js · 174kb css)
- 추적 — 11 modified + 3 new + 1 new (PublishScreen)

### What the Last Session Did
1. **M3.6 퍼블리시 파트 신설**
   - `src/components/PublishScreen.tsx` 신설 — 정적 4 카드 (book-designer · pr-specialist · platform-curator · business-strategist) + 분위기(다크 + 앰버 액센트)
   - `src/App.tsx` AppStage 에 `'publish'` 추가, URL stageParam 파싱, mediumDisplayLabel 매핑, 분기 라우팅
   - `src/StoryXDesk.tsx` onOpenPublish prop 추가, 출간 버튼이 prop 있으면 stage 전환 / 없으면 legacy 내부 모드 폴백
2. **글로벌 AI 상태 표시기 (이전 작업)**
   - `src/lib/aiStatus.ts` · `src/hooks/useAiStatus.ts` · `src/components/AiStatusBadge.tsx` 신설
   - 4 클라이언트(draft · review-agent · review-data · interview)가 wrap 패턴으로 reportAiCall
   - 헤더 두 곳(hx-nav · sx-topbar-actions)에 뱃지 노출
3. **인터뷰 폴백 신호 + 라인업 띠 (이전 작업)**
   - LLM 호출 실패 시 노란 띠 + claude login 안내
   - 성공 시 라임 라인업 띠 (한강風 · 박완서風 …)
   - 사전질문 자동선택 제거, 추천에는 점선 외곽선 + "추천" 뱃지

### Files To Touch (next milestone)
- (M3.6.1 선택 시) `src/components/PublishScreen.tsx` — props 확장으로 publishingPlan 전달
- (M3.6.1 선택 시) `src/App.tsx` — stage 'publish' 분기에 project + blueprint 전달
- (M5 선택 시) `vite.config.ts` 의 5 storyxBridge → Vercel Functions

### Files NOT To Touch
- `src/lib/publishing.ts` `PublishingPlan` 타입 (legacy 호환 유지)
- `.claude/agents/*.md` (M4 완성본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
- `claude` CLI 인증 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요. 코드 작업은 인증과 무관하게 진행 가능.

### Known Issues
- 빈 `ANTHROPIC_API_KEY=` export 가 OAuth 토큰을 가릴 가능성 — `~/.zshrc` 점검 권장
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장
- PublishScreen 의 CTA 4개 + 최종 잠금 버튼은 placeholder. M3.6.1 에서 실 연동.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 20:21 — M4.5 매체 페르소나 풀 ↔ 로컬 LLM 인터뷰 플로우 연결 완료

> Last Updated: 2026-05-21 20:21 KST

### Current Objective
로컬에서 4개 매체 인터뷰가 페르소나 톤 가이드와 함께 LLM 호출까지 정상 동작. 사용자 인증(`claude login` 또는 `ANTHROPIC_API_KEY`) 확인 후 실호출 테스트 → 그 뒤 M3.6 퍼블리시 화면 또는 M5 Vercel Functions 선택.

### Recommended Next Step
1. 사용자가 `claude login` 또는 `export ANTHROPIC_API_KEY=...` 실행해 401 블로커 해제
2. dev 서버 (`npm run dev`) 띄우고 매체 = essay 로 자유 서술 입력 → 인터뷰 질문이 한강風·박완서風 등의 결로 생성되는지 확인
3. 라인업 확인되면 `requestLlmInterview` 결과의 `personaLineup` 을 UI 에 표시할지 결정 — "오늘 인터뷰: 한강風 · 박완서風 · 김연수風" 같은 띠

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests 통과
- `node tools/storyx.mjs interview --provider mock --personas-json '[...]'` 스모크 OK

### What the Last Session Did
1. `src/lib/interviewClient.ts` 재작성 — 매체별 pick 함수 4개 import, `buildPersonaLineup(medium, freewrite)` 신설, POST body 에 `personaLineup` 추가, `LlmInterviewResult` 에 `personaLineup` 응답 필드 추가
2. `vite.config.ts` `/api/interview` 브리지 — `--personas-json` 인자로 `JSON.stringify(input.personaLineup)` 전달
3. `tools/storyx.mjs` interview 커맨드 — `--personas-json` 플래그 파싱, `buildInterviewPrompt({ medium, format, freewrite, personas })` 시그니처 확장
4. `buildInterviewPrompt` — `personas.length > 0` 일 때 "## 페르소나 톤 가이드" 섹션 주입 (label · tone · questionStarters · blockingSignals)
5. 30 files / 164 tests 통과 유지

### Files To Touch (next milestone)
- (선택) `src/StoryXDesk.tsx` 또는 인터뷰 화면 — `personaLineup` 표시 띠
- (선택) `vite.config.ts` 나머지 4개 브리지를 Vercel Functions 로 이관 (M5)
- (선택) 퍼블리시 화면 신설 (M3.6)

### Files NOT To Touch
- `src/lib/essayPersonas.ts` · `novelPersonas.ts` · `comicPersonas.ts` · `audiobookPersonas.ts` (정본)
- `src/lib/mediaPersonas.ts` (정본)
- `src/lib/agentReviewProcess.ts` validationProcesses (M4 완성본)
- `.claude/agents/*.md` (M4 완성본)

### Blockers
- `claude` CLI 인증 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요. 코드 작업은 인증과 무관하게 완료.

### Known Issues
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장
- EssayPersona 에 `category` 필드 없음 — interviewClient.ts 에서 `as unknown as MediaPersona[]` 캐스팅으로 우회. 향후 EssayPersona 에 `category: 'essay'` 추가하면 캐스트 제거 가능.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/essay-interviewer-personas.md` — 에세이 페르소나
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 19:43 — M4 (4단계 매트릭스 + 신설 12명 + 매체 풀 4개) 완료, M5 Vercel Functions로 인계

> Last Updated: 2026-05-21 19:43 KST

### Current Objective
M5 — 서버측 LLM Vercel Functions. 배포본 Vercel 에서 mock 폴백이 아닌 실제 LLM 응답.

### Recommended Next Step
`vite.config.ts` 의 5개 `storyxBridge` 미들웨어를 Vercel Functions(`/api/draft`, `/api/review-agent`, `/api/interview`, `/api/review-data`, `/api/data-review`)로 마이그레이션. 공유 요청/응답 스키마를 `src/lib/aiBridgeContract.ts` 같은 곳에 박고, 클라이언트 4개 모듈이 그 스키마를 임포트하도록.

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `bash init.sh` 30 files / 164 tests · 빌드 성공
- M4 8 커밋 — effba1a · f5c2baf · 251518a · a3da8b7 · dc65884 · 739d1e0 · cfb65c6 · 8b82c26

### What the Last Session Did
1. 스튜디오 단계 신설 6명 — canon-librarian · timeline-keeper · bible-curator · critic-reviewer · essay-curator · memory-evolution-keeper
2. 랜딩 단계 신설 — studio-architect
3. 브릿지 단계 신설 — interview-curator
4. 출판 단계 신설 4명 — book-designer · pr-specialist · platform-curator · business-strategist (service ops 카테고리, ValidationAgentId 미등록)
5. 에세이 페르소나 풀 6명 (한강·박완서·김연수·김애란·신형철 + 가공) — docs + 런타임 + 테스트
6. 소설·만화·오디오북 페르소나 풀 각 6명 — 매체별 license-safety 정책 차등 (소설 5+1, 만화 3가공, 오디오북 전부 가공)
7. UI 통합 — StoryXDesk agentPersonas 에 8명 매핑 + 8개 pixel-agent CSS 클래스
8. AGENTS.md Stage × Media Matrix 전 셀 박힘

### 자산 현황
- 작가진 풀 — `.claude/agents/` 32 파일
- ValidationAgentId — 23개 (스토리 craft 15 + 신설 8: 6 스튜디오 + 1 랜딩 + 1 브릿지)
- 매체 페르소나 풀 — 4 매체 × 6명 = 24명
- 30 files / 164 tests

### Files To Touch (M5)
- `vite.config.ts` 의 `storyxBridge()` 5 미들웨어
- 신설 `/api/*.ts` Vercel Functions (Next.js App Router 또는 vanilla Vercel Function 형태)
- `src/lib/aiBridgeContract.ts` (신설 권장) — 공유 요청/응답 스키마
- `src/lib/draftClient.ts` · `reviewClient.ts` · `interviewClient.ts` · `dataReviewClient.ts` — 새 스키마 import

### Files NOT To Touch
- `src/StoryXDesk.tsx` agentPersonas (M4 완성본)
- `.claude/agents/*.md` (M4 완성본)
- `src/lib/agentReviewProcess.ts` validationProcesses (M4 완성본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
없음.

### Known Issues
- Vercel 환경변수 `ANTHROPIC_API_KEY` 필요 — M5 시작 시 사용자 확인
- AI Gateway 사용 가능 (`provider/model` 스트링 권장 — Vercel knowledge update)

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵 (M5 라인업)
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/essay-interviewer-personas.md` — 에세이 페르소나
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 13:30 — M3.5 스튜디오 설정 패널 완료, M3.7 리터럴 색 정리로 인계

> Last Updated: 2026-05-21 13:30 KST

### Current Objective
M3.7 — 에디터 안의 리터럴 색 박스 정리. 트윅 5색 × 캔버스 3톤 조합 어디서나 톤 일관.

### Recommended Next Step
라임 + 피치 블랙이 아닌 조합(예 — 바이올렛 + 인디고)을 띄워 가장 어색해지는 셀렉터부터. 우선 후보 — `sx-app-breadcrumb` 영역, `sx-save-chip`, "쇼러너가 잡은 이번" 카드 배경, 알파 셀프체크 바, prose textarea. 리터럴 hex를 `var(--sx-page)`·`var(--sx-paper)`·`var(--sx-card)` 등으로 교체.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시 예정)
- Verification — `npx tsc --noEmit` 통과 · `npm run build` 성공 · 28 files / 149 tests 통과
- 캡처 — `.playwright-mcp/studio-settings-default.jpeg` (라임+피치) · `studio-settings-aether-indigo.jpeg` (바이올렛+인디고)

### What the Last Session Did
1. 미사용 `src/assets/story-x-hero-forest-wind.png` 제거
2. 스튜디오 편집기 설정 패널 신설 (M3.5)
   - 토픽바 우측에 `Settings` 톱니 토글
   - 펼침 패널 — 트윅 chip 5색·캔버스 chip 3톤
   - state + `localStorage 'storyx.studio.accent'`·`'storyx.studio.canvas'`
   - `<main className="sx-desk">` 인라인 style 로 `--sx-brand`/`--sx-page` 등 오버라이드 → 라이브 적용
3. 관련 lucide·CSSProperties import 정리, 토큰 정의 모듈 레벨 상수로 분리

### Files To Touch (this milestone)
- `src/StoryXDesk.tsx` — 인라인 색이 있다면 토큰으로
- `src/styles.css` `.sx-desk` 하위 — 리터럴 hex·rgba를 토큰 호출로

### Files NOT To Touch
- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` 영역
- `:root --nx-*` 라이트 토큰
- `.sx-desk` 토큰 정의 (인라인 오버라이드 메커니즘 유지)
- 149 테스트 통과 상태

### Blockers
없음.

### Known Issues
- design 패키지 README/index.html은 텍스트로 받기 전까지 보류
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `progress.md` · `feature_list.json` — 코드 하네스 상태

---

## 2026-05-21 11:46 — M3 4파트 구조 완료, M3.5 스튜디오 설정으로 인계

> Last Updated: 2026-05-21 11:46 KST

### Current Objective
M3.5 — 스튜디오 편집기 설정 패널 (트윅 = 강조색, 캔버스 = 창 배경색)

### Recommended Next Step
스튜디오 헤더(또는 우측 패널)에 "편집기 설정" 진입점 추가 → 모달/드롭다운 안에 트윅 색 피커 + 캔버스 토널 선택 + localStorage 저장. 한 컴포넌트 끝내고 `bash init.sh` 통과 후 다음.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시 예정)
- Verification — `bash init.sh` 28 files / 149 tests 통과 · 빌드 성공
- 4 화면 캡처 — `.playwright-mcp/landing-dark.jpeg` · `landing-light.jpeg` · `bridge-projects.jpeg` · `studio-editor.jpeg`

### What the Last Session Did
1. 디자인 패키지 fetch — 바이너리/외부 캐시라 classifier 차단. 사용자 결정으로 로고 외 요구만 반영
2. 흰 로고 변형 두 개 생성 — `story-x-symbol-light.svg`, `story-x-logo-lockup-light.svg`
3. `:root --nx-*` 라이트로 복원 → 브릿지(로그인·프로젝트·홈) 다시 흰 배경
4. 랜딩 낮↔밤 토글 — useState + localStorage + Sun/Moon nav 버튼 + `.landing-page.is-light` 오버라이드
5. 스튜디오 mockup은 라이트 모드에서도 항상 다크 유지 (`.landing-page.is-light .hero-showcase` 재고정)
6. `LandingBrand` `theme` prop → 다크 컨텍스트는 흰 SVG, 라이트는 검정 SVG. CSS invert 해킹 제거
7. `StoryXDesk` 로고 import를 흰 변형으로 교체

### 4파트 구조 정리 (확정)
- **랜딩** — 낮/밤 토글, Linear 분위기, 흰/검정 pill CTA
- **브릿지** — 로그인 → 프로젝트 → 인터뷰 → 로딩, 흰 배경, Notion-Linear 톤
- **스튜디오** — 편집·바이블·데이터, 항상 다크 + 흰 로고
- **퍼블리시** — 출간 버튼 누른 뒤 화면, 분위기 미정 (M3.6 신설 대기)

### Files To Touch (this milestone)
- `src/StoryXDesk.tsx` — 설정 모달/드롭다운 컴포넌트 + state
- `src/styles.css` `.sx-desk` — 설정 패널 스타일
- `src/lib/storage.ts` — 설정 영속화 (선택)

### Files NOT To Touch
- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` LINEAR 블록
- `:root --nx-*` 라이트 토큰
- 149 테스트 통과 상태

### Blockers
없음.

### Known Issues
- design 패키지의 README/index.html은 아직 못 읽었음 — 필요해지면 사용자가 텍스트로 붙여 주기로 약속됨
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `progress.md` · `feature_list.json` — 코드 하네스 상태

---

## 2026-05-21 00:34 — M2 완료, M3 디자인 폴리시로 인계

> Last Updated: 2026-05-21 00:34 KST

### Current Objective
M3 — 에디터·보조 화면 Linear 폴리시 (owner: design-handoff)

### Recommended Next Step
새 세션에서 design 의뢰 프롬프트로 시작, `src/StoryXDesk.tsx` 상단 토픽바부터 리터럴 색 박스를 토큰 기반으로 교체.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시됨)
- Commit — `e7a971a` "M1+M2: 하네스 설계 문서 + Linear 다크 랜딩 재작성"
- Verification — `npm test` 28 files / 149 tests · `npm run build` 성공

### What the Last Session Did
1. `docs/storyx-harness-architecture.md` 통합 설계 문서 (M1)
2. 랜딩을 Linear "Midnight Command Center" 다크로 재작성 (M2)
3. `:root --nx-*` 와 `.sx-desk --sx-*` 토큰 값 Linear 등가로 cascade
4. 코딩 에이전트 하네스 산출물 신설

---

## Handoff Template

새 인계를 작성할 때 다음 템플릿을 맨 위에 복사한다.

```
## YYYY-MM-DD HH:MM — 한 줄 요약

> Last Updated: YYYY-MM-DD HH:MM KST

### Current Objective

### Recommended Next Step

### Branch · Commit · Verification

### What the Last Session Did
1.

### Files To Touch (this milestone)
-

### Files NOT To Touch
-

### Blockers

### Known Issues
-

### Reference Documents
-
```
