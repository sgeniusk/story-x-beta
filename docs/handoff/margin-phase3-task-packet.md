# Codex Task Packet — Margin 통합 Phase 3 (검토 UX 다듬기)

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `design/margin-integration` (없으면 main 에서 새로 분기) · Phase 1+2 머지본(main `dc8e88b`) 위에 작업
> 베이스라인: tsc exit 0 · 38 files / 231 tests · build 성공
> 이 패킷은 **검증 가능한 계약**이다. "완료"는 §6 게이트를 모두 통과해야만 성립한다.

## 0. 한 줄 목표
M10 마진 모델의 실사용 테스트에서 드러난 두 UX 결함을 고친다 — (A) 전체 검토 ~80초 동안 마진이 "0건"으로 비어 보이는 문제, (B) 검토 의견이 첫 단락 한 곳에 뭉치는 문제. **도메인 로직·검토 호출 경로는 손대지 않는다.**

## 1. 배경 (실측)
- 로컬 LLM 기준 `/api/review-agent` 한 명당 ~16초, 코어 5명 순차 = ~80초.
- `runMarginReviewAll`(StoryXDesk.tsx ~1384)이 5명을 **순차 await** 하며 도착할 때마다 `onPartial` 한다.
- `useMarginReview.onRunAll`(src/hooks/useMarginReview.ts ~47)은 `setPending(true)` + `setReviews([])` 후 도착분만 채운다. → 첫 응답(16초) 전까지 마진은 완전히 빈 상태.
- `MarginColumn`(src/components/MarginColumn.tsx)은 `pending` prop 을 받지만 **빈 상태 문구만** 보여준다(pending 시 시각 피드백 사실상 없음).
- `MarginReview` 타입(src/lib/marginReview.ts)에는 이미 `pending?: boolean` 필드가 **선언만** 되어 있고 아무도 채우지 않는다.
- `resolveReviewAnchor`(StoryXDesk.tsx 1340~1355)는 run.summary/evidence 에 단락 첫 24자가 들어있으면 그 단락에 anchor, 아니면 **전부 fallback(첫 단락)**. → mock/요약형 응답에서 전원 첫 단락 클러스터링.

## 2. 스코프

### IN (이번에 한다)

#### A. 전체 검토 pending 표시
1. `useMarginReview.onRunAll` 이 전체 검토 시작 시 **코어 5명의 pending placeholder 를 즉시 seed** 한다. 각 페르소나 실제 의견이 도착하면 해당 placeholder 를 교체.
   - placeholder 식별 — `MarginReview.pending = true` 필드 사용(타입에 이미 있음).
   - `onRunAll` 시그니처에 코어 페르소나 id 목록이 필요하면 `MarginReviewAdapter` 에 `corePersonaIds: string[]` (또는 `runAll` 이 placeholder 를 직접 emit) 추가. **어느 쪽이든 깔끔한 계약 하나로.** 권장 — 어댑터가 `corePersonaIds` 를 노출하고 훅이 seed.
   - dedup 키는 현재 `persona+anchor`. pending placeholder 는 anchor 가 아직 없으므로 `persona` 기준으로 교체되게 한다(도착 시 같은 persona 의 pending 을 실제 의견으로 replace).
2. `MarginColumn` + `AnnotationCard` 가 `review.pending === true` 일 때 **스켈레톤/로딩 카드**(페르소나 이름·아바타 + "읽고 있어요…" 류 + shimmer)로 렌더. 도착하면 자연스럽게 실제 의견으로.
3. 마진 헤더 카운트("N건")는 **확정 의견만** 세거나 "N/5 검토 중" 형태로 진행을 드러낸다(빈 상태로 보이지 않게).

#### B. anchor 분산
4. `resolveReviewAnchor` 가 evidence 매칭에 실패한 run 들을 **첫 단락에 몰지 말고 단락에 분산**한다. 간단·결정론적이면 충분 — 예: 매칭 실패 시 호출 순번(index) 기반 round-robin 으로 단락 배정, 또는 이미 의견이 달린 단락을 피해 다음 빈 단락에. 단락 수가 의견 수보다 적으면 wrap.
   - 매칭 **성공**한 anchor 는 그대로 존중(분산은 fallback 에만 적용).
   - 같은 단락에 둘 이상 의견이 정당하게 anchored 될 수 있음(그건 OK). 분산은 "근거 없는 전원 첫 단락" 만 푼다.

### OUT (하지 않는다)
- ❌ 도메인 로직(`storyEngine`·`agentRunEngine`·`agentReviewProcess`·`continuityContract`·`qualityGates`·`mediaProjection`·`storyOntology`·`storyHarness`·`koreanVoiceGate`) 수정.
- ❌ `requestAgentReview`/`/api/*` 호출 경로·응답 스키마 변경.
- ❌ 순차 호출을 병렬로 바꾸는 리팩터(이번 스코프 아님 — pending UX 로 체감만 개선). 병렬화는 별도 작업.
- ❌ 좌레일·DataPanel·Phase 1/2 의 다른 부분 변경.

## 3. ⚠️ 함정
1. `MarginReview` 의 `pending` 필드는 이미 존재 — 새 타입 만들지 말고 재사용.
2. dedup 로직(`persona+anchor`)이 pending→실제 교체를 깨지 않게 주의. pending 은 anchor 미정이므로 persona 단독 매칭으로 교체.
3. `onRunAll` 재호출 시 이전 pending 잔여물이 남지 않게 `setReviews([])` 후 seed.
4. anchor 분산은 **결정론적**이어야 테스트 가능(Math.random 금지).
5. CoreStrip 의 페르소나별 카운트/필터가 pending 카드를 잘못 세지 않는지 확인.

## 4. 손대지 말 것
§2 OUT 도메인 8종, `.claude/agents/*.md`, `--sx-stage-*` 6색, 좌레일/DataPanel, 검토 호출 경로.

## 5. TDD
- 새 순수 로직은 테스트 먼저.
  - anchor 분산 — `src/lib/marginReview.test.ts` 에 "매칭 실패 run 들이 서로 다른 단락에 배정된다" 케이스 추가(또는 분산 헬퍼를 marginReview.ts 로 추출해 단위 테스트).
  - pending seed/replace — `useMarginReview` 의 seed→replace 동작을 검증할 수 있으면 훅 테스트 추가(어려우면 분산 헬퍼 테스트로 최소 보장 + 수동 확인).
- 기존 231 tests 불변 유지.

## 6. 검증 게이트 (Definition of Done)
```
npx tsc --noEmit   → exit 0
npm test           → 38+ files / 231+ tests 통과
npm run build      → 성공
```
수동(코드 보장):
- `?stage=editor` 초안 생성 후 "5명에게 전체 검토 맡기기" → **즉시 5개 pending 카드** 표시 → 도착 순서대로 실제 의견 교체.
- 의견들이 첫 단락에만 몰리지 않고 여러 단락에 분산 anchor.
- console error 0.

## 7. 산출물 보고 (§7 형식)
1. 변경/신설/삭제 파일.
2. pending seed/replace 계약(어댑터에 뭘 추가했는지) + anchor 분산 규칙.
3. 검증 3종 실제 출력.
4. 남은 위험·이월(병렬화 등).
5. 커밋하지 말 것 — Claude 가 검증 후 커밋한다.
