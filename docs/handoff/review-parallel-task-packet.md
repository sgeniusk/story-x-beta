# Codex Task Packet — 마진 전체 검토 병렬화

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `design/review-parallel` (main `db2d33a` = M10 Phase 1+2+3 머지본 위)
> 베이스라인: tsc exit 0 · 38 files / 234 tests · build 성공
> 검증 가능한 계약. "완료"는 §5 게이트 전부 통과해야 성립.

## 0. 한 줄 목표
`runMarginReviewAll`(src/StoryXDesk.tsx ~1345)의 코어 5명 검토를 **순차(~80초) → 병렬(~16초)** 로 바꾼다. 도메인 로직·검토 호출 경로·결과 처리 규칙은 그대로.

## 1. 현재 구조 (실측)
- `for (const agentId of MARGIN_CORE_AGENT_IDS)` 루프가 `await requestAgentReview(...)` 를 **한 명씩 순차** 실행. 한 명 ~16초 × 5 = ~80초.
- 각 응답마다 `setAgentRuns` 업데이트 + `onPartial(toMarginReview(run, resolveReviewAnchor(run, marginParagraphs, marginDefaultAnchor)))`.
- 시작 시 `seedPending?.([...MARGIN_CORE_AGENT_IDS])` 로 pending 5개 즉시 표시(Phase 3, 유지).
- 끝에 `reports` 배열로 pass/revise/blocked 집계 + `setLatestReviewResult`.
- mock 폴백 분기(res.ok 아닐 때 fallbackRunForAgent)도 있음.

## 2. 스코프

### IN
1. 순차 `for await` 루프를 **`Promise.all` / `Promise.allSettled` 병렬**로 교체. 5명을 동시에 `requestAgentReview` 호출.
2. 각 검토가 **도착하는 즉시** `onPartial` + `setAgentRuns` 로 마진에 반영(전원 완료를 기다리지 않음). 즉 `map → 각 Promise.then` 안에서 개별 반영, 마지막에 `await Promise.all` 로 집계.
3. **anchor 분산 보존** — Phase 3 의 핵심. 현재 `resolveReviewAnchor` 의 매칭 실패 fallback 은 호출 순번(reviewIndex) 기반 분산이다. 병렬에서도 **각 에이전트의 고정 index(MARGIN_CORE_AGENT_IDS 내 위치)** 를 anchor 분산에 넘겨, 순차일 때와 동일한 분산 결과가 나오게 한다. (도착 순서가 아니라 에이전트 index 로 분산해야 결정론적.)
4. `reports`/`candidates` 집계, `setLatestReviewResult`, `setGenerationNote`, `finally { setIsReviewing(false) }` 는 **전원 완료 후** 그대로 수행.
5. mock 폴백 분기도 병렬 안에서 동일하게 처리.

### OUT
- ❌ 도메인 로직(`agentReviewProcess`·`agentRunEngine`·`storyEngine` 등) 수정.
- ❌ `requestAgentReview`/`/api/review-agent` 시그니처·응답 스키마 변경.
- ❌ `resolveReviewAnchor`/`toMarginReview` 의 분류·매핑 규칙 변경(분산에 index 넘기는 것만).
- ❌ `summonMarginReviewAgent`(단일 호출) 변경 — 이미 단발이라 무관.
- ❌ pending seed 동작 변경(Phase 3 유지).

## 3. ⚠️ 함정
1. **anchor 분산 결정론** — 병렬이라 도착 순서가 매번 다르다. 분산은 반드시 **에이전트 고정 index**(루프 변수 i) 기준이어야 순차와 동일·재현 가능. 도착 순서로 분산하면 매 실행 결과가 달라진다(테스트 깨짐).
2. **상태 업데이트 경합** — 5개 `setAgentRuns((current) => ...)` 가 동시에 일어나도 함수형 업데이트라 안전. `setReviews` 도 마찬가지. 단, 배열 누적(`reports.push`)은 `Promise.all` 결과를 모아서 하거나 클로저 race 없게 처리.
3. **에러 격리** — 한 명 실패가 나머지를 막지 않게 `Promise.allSettled` 또는 각 Promise 내부 try/catch. 기존 mock 폴백 로직 보존.
4. **`isReviewing` 가드** — 중복 실행 방지. `finally` 에서 한 번만 해제.

## 4. 손대지 말 것
도메인 lib, 검토 호출 경로, Phase 1/2/3 의 다른 부분, `--sx-stage-*`.

## 5. 검증 게이트
```
npx tsc --noEmit   → exit 0
npm test           → 38 files / 234 tests 통과 (분산 결정론 유지로 기존 테스트 불변)
npm run build      → 성공
```
수동(코드 보장): `?stage=editor` 초안 생성 → 전체 검토 → pending 5개 즉시 → **5명이 거의 동시에**(~16초 내) 도착, 의견이 여러 단락에 분산. console error 0.

## 6. 보고 (§형식)
1. 변경 파일.
2. 병렬화 방식(Promise.all/allSettled, 도착 즉시 반영 구조) + anchor index 보존 방법.
3. 검증 3종 실제 출력.
4. 남은 위험.
5. 커밋하지 말 것 — Claude 가 검증 후 커밋.
