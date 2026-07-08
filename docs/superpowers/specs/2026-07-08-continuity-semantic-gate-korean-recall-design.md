# 자동 의미 연속성 게이트 한국어 recall 보강 — 설계

작성 2026-07-08. 예비비행 findings(`docs/reviews/2026-07-08-preflight-personas/findings.md`)에서 실측된 발견 해소. 목표 = **정밀한 직접 모순만** 잡는다(오탐 ~0, recall만 국소 보강).

## 문제 (실측 근본원인)

`classifyCanonChange`(continuityContract.ts)의 `findReversalMatch`가 hard-canon 직접 모순 2건을 놓쳤다(`gate-continuity.ts`로 실측).

- **케이스 A — 절 마스킹.** "윤민서는 형사가 아니라 민간인이다" vs 캐논 "윤민서는 강력계 형사**이며** 감정을 **드러내지 않는** 수사 습관을 갖고 있다". 형사/민간인은 대립 축(OPPOSITION_PATTERNS)에 없어 `hasOpposingState`=false → `shared≥2 && claimNegated!==sourceNegated` 경로 의존. 그런데 `hasNegation(source)`가 **문장 전체**를 보므로 무관한 부정("드러내지 않는")이 sourceNegated=true를 만들어 claim(true)과 극성이 같아짐 → 미검출.
- **케이스 B — 축 누락 + 엔티티 매칭 실패.** "한태겸은 살해되지 않았고 살아 있다" vs "…한태겸이 …살해되었고…". `OPPOSITION_PATTERNS` life 축은 `살아있/생존` vs `죽었/사망/죽은`만 있고 **`살해`가 없다** → source에 life 증거가 안 잡혀 `hasOpposingState`=false. 또 `살해되었고`가 명사 토큰 `살해`로 분해되지 않고, source 주어가 "폐쇄된…"으로 시작해 `extractSubject` 실패 → `hasSameEntity` 명사 overlap도 한태겸 1개(<2)라 실패.

## 변경 (continuityContract.ts 국소, 결정론 유지)

1. **절 단위 극성 (케이스 A)** — `findReversalMatch`의 `shared≥2` 반전 경로에서, `hasNegation(source)`(문장 전체) 대신 **공유 명사가 등장하는 절**의 부정만 본다. source를 연결어미(`으며/이며/며/고/,/지만/는데/으나/나`)로 절 분할 → claim과 공유 명사(술어명사)를 가진 절을 찾아 그 절의 `hasNegation`을 sourceNegated로 쓴다. claim도 동일하게 공유 명사 절 기준. → "…형사이며"(긍정) vs "형사가 아니라"(부정)만 맞물려 block, "드러내지 않는" 절은 간섭 못 함.
2. **death 축 확장 (케이스 B)** — `OPPOSITION_PATTERNS` life side 'b'에 `살해|피살|살인|살해되` 추가. `isStateToken`·STATE_STOPWORDS의 사망 계열에도 `살해` 동반 추가(명사 매칭에서 상태어로 제외, 기존 규율과 정합).
3. **엔티티 매칭 보강 (케이스 B)** — death 등 `!requiresSharedTarget` 축에서 `hasSameEntity`가 주어 추출 실패 시, **인명 후보 공유**(2자+ 한글 토큰이 양쪽 identityTokens에 공존)를 1개라도 만족하면 동일 엔티티로 인정하도록 완화. 단 이 완화는 **대립 축이 이미 성립한 경우에만**(hasOpposingState 내부) 적용해 오탐을 막는다.

## 불변식 / 정밀도 가드

- 결정론(LLM·외부 사전 없음) · living-state(원인+대가) / soft-signal 흐름 보존 · hard-canon 반전만 block.
- 3조건 동시일 때만 block — 같은 주어(또는 대립축+인명 공유) + 같은 술어/축 + 절 단위 반대 극성. 정당한 전개("민서는 백서연을 보호한다")·실제 반전("민서가 진범이다" = 선언된 술어를 부정하지 않음)은 통과.
- classifyCanonChange는 프롬프트 미러 대상 아님(순수 코드) — 미러/핀 동기화 불필요.

## 검증 (TDD)

- 신규 테스트(continuityContract.test.ts) — ① 케이스 A block ② 케이스 B block ③ 절 마스킹 반대: 무관한 부정이 있어도 오탐 0 ④ 실제 반전(민서=범인) 통과 ⑤ 정합 신규 통과 ⑥ 기존 11 케이스 회귀 0.
- 6-페르소나 실 캐논 오탐 스캔 — 각 작품 newCanonFacts를 계약으로 두고 자연스러운 후속 주장에 block 0 확인(`gate-continuity.ts` 확장).

## 범위 밖 (다음 검증 라운드)

- 장편을 **여러 화 이어 생성**해 실제 캐논 축적 대비 충돌 관찰(1화 배치로는 불가).
- **PLAY/WRITE/PLAN** 3모드 실사용 경로에서 연속성 관찰.
- 학술 A2/A4 한국어 문형 recall(별도).
