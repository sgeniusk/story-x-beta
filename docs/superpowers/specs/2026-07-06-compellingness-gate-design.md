# 흡인력 게이트 — critic-reviewer 검토망 승격 설계

> 2026-07-06 · 근거 = 흡인력 딥리서치 `docs/research/2026-07-05-compellingness-human-ai.md`(19확정/6기각).
> 사용자 결정 4건 — ① 게이트 위치 = **검토망 승격**(VS 재순위 아님) ② 합류 범위 = **연재 서사 전 회차** ③ 기준 = **기존 문학 기준 보존 + 흡인력 기준 추가** ④ 판정 강도 = **기존 검토와 동일**(정보성, 하드 차단 없음).

## 1. 문제

리서치 확정 결론 — 일반 품질 점수(LLM-심사 루브릭)는 흡인력 결손을 잡지 못한다(EQ-Bench가 LLM을 뉴요커보다 높게 평가하나 긴장 민감 지표는 역전). LLM 이야기는 결말 훨씬 전부터 예측 가능해지고(late-stage no-rate 인간 0.607 vs LLM 0.215), 서프라이즈가 인간의 1/2~1/4다. Story X 라이브 검토망(CORE 5인 + 매체 특화)에는 이 축을 전담하는 판정자가 없다 — critic-reviewer는 정의만 있고(문학 트랙, 피날레 전용 컨셉) 라이브 검토에 미배선.

Re3의 검증된 4단계 중 재순위(c)에 흡인력 기준을 넣으면 그것이 곧 흡인력 게이트다. Story X는 초안 1개 체제이므로, 재순위의 번역 = **검토 verdict가 게이트**(N개 초안 생성은 비용상 비목표).

## 2. 변경 지점

### 2.1 라인업 합류 — `src/lib/agentSeedData.ts`
- `getMediumReviewAgentIds(medium, format?)` 시그니처 확장. `format`이 주어지고 `isSerialFormat(format)`이며 medium이 `essay`·`academic`이 아니면 `critic-reviewer`를 마지막(6번째 이후)에 append(중복 가드 기존 로직 재사용).
- 호출처 2곳(StoryXDesk `reviewAgentIds`·`mediumReviewAgentIds` useMemo)이 `blueprint.format` 전달.
- format 미전달(기존 호출 호환)이면 현행과 동일 — 하위호환.

### 2.2 흡인력 기준 — `src/lib/agentReviewProcess.ts` + `.claude/agents/critic-reviewer.md`
- agentReviewProcess의 critic-reviewer 항목에 criteriaKeys 2개 추가(기존 3개 보존).
  - `tension_decay_audit` — 이 회차가 긴장을 소진만 하고 재장전하지 않는가. 열린 질문이 닫힐 때 새 질문이 열리는가(조기 해소 차단).
  - `predictability_audit` — 다음 회차 전개가 이 회차만 읽고 뻔히 예측되는가. 예측을 배반하되 캐논 안에서 배반하는가(서프라이즈).
- independentChecks·blockingSignals에 흡인력 항목 추가(기존 항목 보존). agenda에 "연재 회차의 긴장·서프라이즈 흡인력 판정" 역할 명시.
- `.claude/agents/critic-reviewer.md`(프롬프트 정체성 발화점)에 흡인력 게이트 섹션 추가 — 두 audit의 판정 지침 + "긴장 소실은 결말 훨씬 전부터 시작된다" 근거 문구. description을 피날레 전용에서 "연재 매 회차 흡인력 게이트 겸 피날레 문학 트랙"으로 갱신.
- `src/lib/agentPersonas.ts` PersonaCard role "메타 비평" → "긴장과 흡인력"(name·tint 유지).

### 2.3 결정론 신호 주입 — `src/lib/server/promptBuilders.ts` + `tools/storyx.mjs` 미러
`buildAgentReviewPrompt`에 critic-reviewer 한정 조기 소진 evidence 주입(stakes_progression_audit 선례 미러).

```
조건 — agentId === 'critic-reviewer'
  && payoffStatus && !payoffStatus.isStalled
  && payoffStatus.openPromises === 0 && payoffStatus.paidPromises > 0
  && contractStatus && !contractStatus.finalStretch
문구 — "- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 {remaining}회차.
  criteriaKey: tension_decay_audit. 이 회차가 새 질문·새 긴장을 장전하는지 특히 엄격히 본다."
```

- **오탐 가드 = `paidPromises > 0`** — `computePayoffLedger`는 rewardArc·stakesLedger 미사용 작품(measured=false)에서 `openPromises: 0`을 돌려주므로, "약속 시스템을 실제로 쓰다가 전부 회수된" 경우만 신호를 낸다. 1화 가드도 이것이 겸한다(약속을 심고 회수까지 한 1화는 실제로 조기 소진이 맞음).
- **배관 봉합 포함(구현 탐색 발견)** — dev 브리지 `/api/review-agent` 라우트는 `--payoff-status`를 전달하지 않고 CLI `review-agent` 커맨드도 파싱하지 않는다(기존 stakes_progression 정체 신호조차 dev 경로에선 미발화 — 잠복 갭). prod 라우트 `api/review-agent.ts`는 whitelist 재구성이라 새 필드가 떨어진다. 따라서 ① vite 브리지 review-agent에 `--payoff-status` 추가(draft 라우트 미러) ② CLI review-agent 커맨드에 `--payoff-status` 파싱 추가(paidPromises 포함) ③ prod 라우트 whitelist에 `paidPromises` 추가 ④ `reviewClient`·`promptBuilders` payoffStatus 타입에 `paidPromises: number` 추가. StoryXDesk는 이미 `computePayoffLedger` 산출을 통째로 전달한다.
- 조기 소진은 정체(isStalled)와 배타 — 둘 다 뜨는 조합 없음(정체 = 회수 없음, 조기 소진 = 전부 회수).
- 헌장 없는 작품(contractStatus null)은 신호 스킵(프롬프트 기준 지시는 그대로 발화).
- `tools/storyx.mjs`의 buildAgentReviewPrompt 미러를 byte-identical로 동기화(기존 미러 관례·동기화 테스트 유지).

### 2.4 판정·UI — 변경 없음
verdict는 기존 pass/revise/blocked 정보성 위계 그대로 마진에 표시. 마진 UI는 라인업 기반 렌더라 critic-reviewer PersonaCard(`평론가` `#7c87e5`)가 6번째로 자동 노출.

## 3. 불변식

- **검토망은 정보성** — 흡인력 판정이 회차 확정을 막지 않는다(하드 차단은 누수 게이트 하나뿐, 유지).
- **기존 문학 기준·피날레 트랙 무손상** — 양가성·윤리 비용·침묵·모티프 기준과 criteriaKeys 3개는 보존, 추가만 한다.
- **에세이·학술·단독 단편 무접촉** — 라인업 변화 없음(테스트가 핀).
- **측정 신호는 산출만 받는다** — 조기 소진 신호는 `computePayoffLedger`·`buildContractStatus` 산출로만 계산, 직접 합성 금지(payoffStatus 불변식 계승).
- **프롬프트 미러 byte-identical** — promptBuilders ↔ storyx.mjs.

## 4. 테스트 계획 (TDD)

1. `agentSeedData.test` — 연재 novel format이면 6인(critic-reviewer 마지막)·comics 연재면 CORE+특화 2+critic·essay/academic은 format 무관 현행·단독(비연재) novel 5인·format 미전달 하위호환.
2. `promptBuilders.test` — ⓐ critic-reviewer + 조기 소진 조건 충족 시 "[측정] 긴장 조기 소진" 주입 ⓑ openPromises > 0이면 미주입 ⓒ isStalled면 미주입(배타) ⓓ finalStretch면 미주입 ⓔ paidPromises 0(미측정·미사용 작품)이면 미주입 ⓕ 같은 조건이라도 showrunner 등 타 에이전트엔 미주입 ⓖ contractStatus 없으면 미주입.
3. `agentValidationProcess.test` — critic-reviewer criteriaKeys에 `tension_decay_audit`·`predictability_audit` 포함 핀(기존 3개 보존 핀).
4. 미러 동기화 테스트 기존 통과 유지.

## 5. 비목표

- N개 초안 생성 후 재순위(비용) · VS 후보 흡인력 재순위(후속 조각 후보) · 결정론 긴장 점수 게이트(qualityGates 확장 — 프록시 부정확) · 흡인력 판정의 하드 차단 · 에세이 흡인력 축(긴장과 다른 축).

## 6. 검증 (DoD)

- `npm test`·`npm run build`·`bash init.sh` 녹색.
- 라이브(preview) — 연재 작품에서 전체 검토 실행 → 마진에 평론가 카드 6번째 도착·흡인력 관점 note(긴장/예측 언급) 확인 · 에세이 작품은 5인 유지 · 콘솔 에러 0.
