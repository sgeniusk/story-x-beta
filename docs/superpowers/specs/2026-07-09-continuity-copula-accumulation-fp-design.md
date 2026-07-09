# 계사부정·presence 누적 오탐 정밀화 — 설계

> 2026-07-09 · 브랜치 `feat/continuity-copula-accumulation-fp`. 발견 정본 `docs/reviews/2026-07-09-multichapter-continuity/findings.md`.

## 배경
2026-07-08 #32(자동 의미 게이트 한국어 recall 보강)는 각 소재 **1화 격리**에서 오탐 0을 실측했다. 2026-07-09 결정론 하네스가 같은 게이트를 **실제 23화·91팩트 누적 캐논**에 돌리자 정밀도가 붕괴했다 — 재진술 FP **53/91**, 정합신규 3/4. detector별 분류 결과 **53건 중 ~51건이 #32가 추가한 계사부정(X가아니) 매처 과발화**, 2건이 presence 축 보조용언 혼동.

근인 — 미스터리·로판의 반전(reveal)은 본디 부정형으로 서술된다("권한자는 레나 위클리프가 아니며…"). 이런 팩트가 캐논에 쌓이면 `copulaNegatedNouns`가 그 술어명사(대개 인명)를 "부정된 명사"로 잡고, `findReversalMatch` 둘째 루프가 **claim이 그 명사를 언급하기만 하면**(주어·주제로 등장해도) 반전으로 판정한다. claim이 그 명사를 **술어로 단정**하는지는 확인하지 않는다.

## 목표
- 91팩트 누적에서 재진술 FP **53 → 0**(목표), 정합신규 FP **3 → 0**.
- recall 무손실 — 직접 모순 차단 3/5 유지(2건 miss는 범위 밖).
- 첫째 루프의 의도된 케이스 A(claim이 "X가 아니"로 부정 → 진짜 반전) 보존.
- 결정론 유지 — LLM·외부 사전 없음. `classifyCanonChange`는 프롬프트 미러 아님(순수 코드).

## 수정 1 — 계사부정 엔티티 가드
`src/lib/continuityContract.ts` `findReversalMatch`(현 399~406행) 계사부정 두 루프.

핵심 판별 = claim이 부정된 명사 X를 **주어·주제로 언급**(FP)하는가, **술어명사로 단정**(진짜 반전)하는가. `markedEntities(text)`(은/는/이/가/께서 표지 명사)가 이미 이 구분을 준다 — X가 claim의 표지 엔티티면 claim은 X를 *주어*로 쓰는 것이고, 표지 엔티티가 아니면서 술어 위치에 오면 *단정*이다.

- **둘째 루프**(source 부정·claim 단정) — `sourceCopula`의 noun X가 `markedEntities(claim)`에 있으면 **스킵**. 즉 claim이 X를 주어·주제로 언급할 뿐이면 반전 아님.
- **첫째 루프**(claim 부정·source 단정) — 대칭 안전을 위해 같은 가드 — `claimCopula`의 noun X가 `markedEntities(source)`에 있으면 스킵.

### 판별 검증(왜 옳은가)
- FP 케이스 — source "권한자는 레나 위클리프**가 아니며**"(sourceCopula={위클리프}), claim "레나 위클리프**는** …경고했다". claim에서 "위클리프"는 `markedEntities`(레나 위클리프는)에 포함 → **스킵 → allowed**. ✓
- 진짜 반전 보존 — source "범인은 철수**가 아니다**"(sourceCopula={철수}), claim "범인**은** 철수**다**". claim에서 "철수"는 표지 엔티티 아님(범인만 표지) → 스킵 안 함 → **block**. ✓
- 케이스 A 보존(첫째 루프) — claim "윤민서는 **형사가 아니라** 민간인"(claimCopula={형사}), source "윤민서는 강력계 **형사이며**". source에서 "형사"는 표지 엔티티 아님 → 스킵 안 함 → **block**. ✓

## 수정 2 — presence 축 보조용언 제외
`OPPOSITION_PATTERNS` presence side a(현 306행) `있다`가 보조용언 "-어/-고 있다/있었"일 때 존재사로 세지 않게 한다.

- 원인 — 재진술 "레나…기록되**어 있다**"의 aux "있다"가 side a로 잡혀, "위임장 원본이 **없다**"(side b, 존재 부정=정당) 팩트와 반전 판정. side b `없다`는 정당하므로 유지, **side a `있다`만 정밀화**.
- 방법 — presence side a의 `있다` 매칭을 앞에 verbal 연결어미(어/아/고 + 선택적 공백)가 오는 경우 제외한다. 존재("증거가 있다", "there is")는 유지, 상태보조("되어 있다", "-고 있었")는 제외. `있었`도 동일 처리.
- 구현 노트 — OPPOSITION_PATTERNS의 side a 정규식을 `/나타났|나타나|발견|존재|(?<![어아고]\s?)있다/` 형태의 부정 lookbehind로 좁히거나, presence 판정을 별도 술어함수로 분리(가독성 우선 시 후자). lookbehind는 Node ES2018+ 지원.

## 테스트 (TDD — 테스트 먼저)
`src/lib/continuityContract.test.ts` 신규 케이스.
- ⓐ reveal-FP — source "…권한자는 레나 위클리프가 아니며…", claim "레나 위클리프는 …경고했다" → `allowed=true`.
- ⓑ 진짜 반전 보존 — source "범인은 철수가 아니다", claim "범인은 철수다" → `allowed=false`·layer hard-canon.
- ⓒ 케이스 A 회귀 — claim "윤민서는 형사가 아니라 민간인이다", source "윤민서는 강력계 형사이며 …" → block.
- ⓓ presence aux FP — claim "레나는 하급 회계 보좌로 기록되어 있다", source "레나는 위임장 원본이 없다는 이유로 늦추고 있었다" → `allowed=true`.
- 기존 24 케이스(18+#32 6) 회귀 0.

**누적 회귀 실측(수용 기준)** — `npx tsx docs/reviews/2026-07-09-multichapter-continuity/gate-accumulation.ts` 재실행 → 재진술 FP **0/91**·정합신규 FP **0/4**·recall **3/5 유지**. 이 하네스가 회귀 픽스처(코드 변경 0, 픽스처 재사용).

## 불변식 · 범위 밖
- 보존 — 정밀한 직접 모순만·결정론·living-state cause/cost·soft-signal 자유·classifyCanonChange 프롬프트 미러 아님.
- 범위 밖 — recall 누락 2건(멸문↔번영 미등록 축·레오르 death형 "죽지" 미매치). 멸문-miss는 후반 캐논이 supersede해 정당한 non-block일 수 있어 별도 판단 필요. 캐논 화차 태그 시효 모델(설계 후보)도 별도.
