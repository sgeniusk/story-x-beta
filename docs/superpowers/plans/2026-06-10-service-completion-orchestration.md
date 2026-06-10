# Story X 서비스 완성 오케스트레이션 플랜 (2026-06-10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 잔여 백로그 전체를 멀티에이전트 분업(Claude 오케스트레이션 + Codex 구현 + 저비용 모델 문서)으로 완료해 Story X 를 "완성도 있는 이야기를 만드는 완전한 서비스"로 끌어올린다.

**Architecture:** 트랙 2개 — 품질(Q: 이야기 완성도 실증·개선)과 서비스(S: UI 완결·CLI·1.0 기준). 코드 트랙은 worktree 격리 서브에이전트로 병렬 위임하고, Claude 가 메모리의 6단계 독립 검증 후 순차 머지. 라이브 실증(A/B)은 메인 스레드가 Playwright 로 직접 수행.

**Tech Stack:** React+Vite+vitest(TDD), tools/storyx.mjs(codex exec provider), Playwright MCP 라이브 검증.

---

## 우선순위 정렬 (사용자 핵심 목표 = 완성도 있는 이야기)

| 순서 | ID | 작업 | 트랙 | 실행 주체 | 근거 |
|---|---|---|---|---|---|
| 1 | Q1 | #3 헌터물 갈림길 사용/미사용 A/B 6축 실증 | 품질 | Claude 메인 (라이브) | handoff "다음 세션이 해야 할 한 가지" |
| 2 | S1 | (2d) 출간 모드 floating화 | 서비스 | Codex (worktree) | floating 마지막 미전환 모드 |
| 3 | Q2 | codex transient 폴백 raw 에러 가드+재시도 | 품질 | 서브에이전트 (worktree) | 브레드스 권고 — 프로즈 누수 차단 |
| 4 | S2 | rank6 — 1.0 시장증명 재정의 + 경량 검증 | 서비스 | 저비용 모델 초안 + Claude 확정 | M7 alpha 의 전제 |
| 5 | S3 | rank7 — academic 1.0 범위 결정 | 서비스 | 저비용 모델 초안 + Claude 확정 | (상단바 압축은 floating 전환으로 해소됨) |
| 6 | S4 | M6.3 storyx CLI (init/serve/memory sync) | 서비스 | Codex (Q2 머지 후 — storyx.mjs 충돌 방지) | M6 완결 조건 |
| 7 | Q3 | 갈림길 LLM 정제 2단계 | 품질 | Q1 결과 반영 후 스펙→위임 | follow-up (b) |
| 8 | Q4 | 회차 진도 인터뷰 | 품질 | Q1 관찰로 승격 판단 | follow-up (a) — "페이스 감각 부재" 관찰 시 승격 |
| 9 | S5 | comics specialist 7인 라이브 검증 | 서비스 | Claude 메인 (S1 머지 후 같이) | 매체검토 배선 잔여 검증 |
| 10 | Q5 | 결정 부채 보드 | 품질 | 별도 스펙 (이번 세션 범위 밖 가능) | follow-up (c) |
| 11 | S6 | M7-alpha-1.0 (30화 회귀) | 서비스 | S2 재정의 결과 따라 별도 세션 | rank6 의존 |

## 웨이브 구조

- **Wave 1 (병렬 디스패치):** S1·Q2·(S2+S3 문서 초안) 백그라운드 + Q1 라이브를 메인이 수행.
- **Wave 2 (검증·머지):** 각 산출을 Claude 가 6단계 독립 검증(아래) 후 main 에 순차 머지 → S4 디스패치 → Q3/Q4 결정.
- **Wave 3 (마무리):** S5 라이브, 상태 문서(progress·feature_list·handoff) 갱신, 잔여(Q5·S6)는 핸드오프에 등재.

## Codex/서브에이전트 위임 패킷 필수 조항 (memory: codex-delegation-verify)

모든 코드 위임 패킷에 다음을 명시한다.
1. 우회 주석으로 테스트 통과 금지 (false-green 금지).
2. 상태 문서(progress.md·feature_list.json·session-handoff.md) 수정 금지.
3. 공용 헬퍼 복사 금지 — `src/lib/` import 만.
4. 이동 심볼의 테스트 단언은 정의 파일로 재배치 (`componentSrc` 헬퍼), 삭제·약화 금지.
5. TDD — 실패 테스트 먼저, `npm test`·`tsc`·`npm run build` 녹색 후 커밋.

Claude 검증 6단계: (1) tsc·test·build 재실행 (2) git status·wc -l·mtime 실반영 확인 (3) gaming 스캔 (4) 상태 문서 무변경 (5) 헬퍼 중복·순환 import 점검 (6) 순수 이동 byte-identical + 단언 균형.

---

### Task Q1: #3 헌터물 갈림길 A/B 실증 (Claude 메인, 코드 변경 0)

**Files:**
- Create: `docs/reviews/2026-06-07-persona-live-test/05-hunter-ab-forks.md` (로그)
- Create: `docs/handoff/screenshots/hunter-ab-forks/` (캡처)

- [ ] **Step 1:** dev 서버 기동 + #3 헌터물 작품 상태 확보(기존 localStorage 또는 1화 재생성 — `03-hunter-multichar.md` 의 시드 재사용).
- [ ] **Step 2:** **B암(미사용)** — 갈림길 카드 무시, 의도 메모 없이 2~3화 연속 생성 + 5인 검토. 6축 기록.
- [ ] **Step 3:** 상태 백업(export JSON) 후 같은 분기점으로 복원, **A암(사용)** — 갈림길 옵션 클릭→의도 메모 합성으로 2~3화 생성 + 5인 검토. 6축 기록.
- [ ] **Step 4:** 6축 비교표 + 관찰(특히 "선택은 하는데 페이스 감각이 안 들어간다" 여부 — Q4 승격 판단 입력) 로그 작성.
- [ ] **Step 5:** 커밋 `docs(review): #3 헌터물 갈림길 A/B 6축 실증`.

### Task S1: (2d) 출간 모드 floating화 (Codex 위임, worktree)

**Files:**
- Create: `src/components/FloatingPublishWorkspace.tsx`
- Modify: `src/StoryXDesk.tsx` (isPublishingMode early-return, `PublishingStudio` JSX 2462행·정의 2581행 참조)
- Modify: `src/styles.css` (`.fc-publish-*` 스코프)
- Test: `src/lib/floatingEditor.test.ts` 또는 신규 `floatingPublish.test.ts`

- [ ] 2c 패턴 그대로: `FloatingDataWorkspace`(270줄) 의 셸 언어(`.fc-*`)·MetricSummary 재사용, `DataPanel`(.sx-desk 전용) 사용 금지.
- [ ] `isPublishingMode` 일 때 early-return 으로 FloatingPublishWorkspace 렌더. PublishingStudio 의 콘텐츠(Platform Proof·체크리스트·릴리즈 잠금·잠금 버튼 onConfirmChapterLock)를 floating 카드로 이식. 잠금 후 `setLatestChapter` 동기화(P2 회귀 금지).
- [ ] TDD: jsdom 렌더 테스트 RED→GREEN → 옛 PublishingStudio JSX 는 보존(삭제는 후속 — 2f 전례).
- [ ] 커밋 `feat(publish): 출간 모드 floating화 — FloatingPublishWorkspace`.

### Task Q2: codex transient 폴백 raw 에러 가드 + 재시도 (서브에이전트, worktree)

**Files:**
- Modify: `tools/storyx.mjs` (`runProvider`:943 · `normalizeProviderOutput`:980 부근 · build/draft 경로)
- Modify: `src/lib/draftClient.ts` (빈/에러 응답 폴백 메시지 경로 확인)
- Test: 기존 storyx dry-run 패턴 + `storyEngine.test.ts` 의 `buildFallbackDraft` 케이스 보존

- [ ] 증상: codex transient 실패 시 raw 에러 텍스트("Reading additional input from stdin" 류·stderr)가 폴백 초안 프로즈로 누수(#3 1화 발견). 가드 — provider raw 출력이 JSON 파싱 실패 + 에러 패턴 매칭이면 본문으로 합류시키지 않고 `buildFallbackDraft` 결정론 폴백 + 1회 재시도.
- [ ] 재시도는 runProvider 1회 한정(타임아웃 300s 유지), 재시도도 실패하면 폴백+실패 배너 경로(rank2 기구현) 사용.
- [ ] 커밋 `fix(provider): codex transient raw 에러 프로즈 누수 가드 + 1회 재시도`.

### Task S2+S3: rank6 시장증명 재정의 + academic 1.0 범위 (저비용 모델 초안)

**Files:**
- Create: `docs/decisions/2026-06-10-market-proof-1.0.md`
- Create: `docs/decisions/2026-06-10-academic-scope-1.0.md`
- Modify (Claude 확정 후): `feature_list.json` M7 done_criteria

- [ ] 입력: `docs/reviews/2026-06-01-multiagent-review.md` rank6·7 절 + `FINAL-REPORT-romancefantasy.md` + 페르소나 테스트 로그. 산출: M7 done_criteria 재정의안(기술 회귀 + 외부 작가 N명 완성 시장증명 + 경량 검증 방법), academic 1.0 포함/제외 범위안.
- [ ] Claude 가 검토·확정 후 feature_list.json 반영.

### Task S4: M6.3 storyx CLI (Codex 위임, Q2 머지 후)

**Files:**
- Modify: `tools/storyx.mjs` (init/serve/memory sync 3 명령), `package.json`, `README.md`

- [ ] `init` — 새 프로젝트 scaffold(JSON 시드). `serve` — vite dev 래핑. `memory sync` — export JSON ↔ 파일 동기화(M6.1 exportAllData 스키마 `storyx/export/v1` 재사용).
- [ ] dry-run 테스트 + README 안내. 커밋 `feat(cli): storyx init/serve/memory-sync`.

### Task W3: 상태 문서 갱신 + 핸드오프

- [ ] progress.md 최근 검증 갱신 · feature_list.json 상태 반영 · session-handoff.md 맨 위 새 노트 · init.sh 최종 녹색.
