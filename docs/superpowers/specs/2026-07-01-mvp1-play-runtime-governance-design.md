# MVP-1 PLAY 런타임 거버넌스 — 설계

<!-- Canon Core(MVP-0) 위에 PLAY(DiveDesk) 런타임 검증을 얹는 첫 슬라이스의 설계 정본. 코드 착수 근거 문서. -->

> 작성 2026-07-01 · 상태 `draft` · 정본 근거 [`docs/research/2026-06-30-canon-governance.md`](../../research/2026-06-30-canon-governance.md) §5·§7·§8(MVP-1)·§13(Q2 player-first)·§14(위험2 reveal) · 선행 슬라이스 [Canon Core MVP-0](2026-06-30-canon-core-mvp0-design.md).

## 0. 한 문장

Canon Core 의 중요도 밴드(anchor/major/soft) 위에서, PLAY(DiveDesk) 가 받은 답을 **렌더 직전에 결정론으로 검사**해 앵커 위반은 캐논화를 차단하고 소프트 일탈은 "의외 전개 후보"로 표시한다 — player-first 몰입을 깨지 않으면서.

## 1. 범위 (이 슬라이스가 하는 것 / 안 하는 것)

**한다 (MVP-1 PLAY 슬라이스)**
- 순수 런타임 검증기 `validatePlayTurn` — 답 텍스트를 캐논 밴드별로 검사.
- DiveDesk 턴 루프 배선 — 답마다 verdict 계산·부착·표시.
- 여백 거터 마커(밴드 색) + 탭 peek + 하단 앰비언트 카운트.
- 앵커 위반 턴의 **캐논화 차단** — 응결 transcript 에서 제외.

**안 한다 (후속 MVP-2 Consolidation / 별도 spec)**
- per-candidate 승격 / 이번만 / 수정 결정 UX (정본 §8 MVP-2).
- LLM 응결 검증기(ConStory 4단) — 무거운 판정은 응결 시점(정본 §7).
- major 반전의 cause/cost 게이팅(그건 WRITE/응결 몫).
- WRITE(FloatingEditor)·PLAN 표면 — 이번엔 PLAY 만.

## 2. 설계 결정 (brainstorming 확정 · 2026-07-01)

| # | 결정 | 근거 |
|---|---|---|
| D1 판정 엔진 | **결정론 재사용**(PLAY), 무거운 LLM 은 응결(MVP-2)로 | 정본 §7 "PLAY 가볍게·응결 무겁게" · player-first Q2 몰입엔 매 턴 LLM 호출이 독 |
| D2 앵커 차단 | **표시 + 🔴 비정본 배지 + 캐논화 차단**(강제 재생성 없음, 선택적 수동 "다시") | "하드 차단"의 본질 = 정본 오염 차단이지 화면 숨김 아님 · 결정론 검출 오탐이 있어 침묵 재생성은 멀쩡한 답을 날릴 위험 |
| D3 배지 UX | **여백 거터 마커**(본문 무접촉)·색코드·탭 peek + 하단 카운트 | FloatingEditor 여백 주석 패턴과 일관 · player-first 최소 침습 + "충돌은 드러낸다" 유지 |
| D4 범위 | **PLAY 표시 + 앵커 캐논화 차단**, per-item 결정은 MVP-2 | 🔴 가 캐논화를 실제로 막아야 "하드 차단"이 장식이 아님 · 무거운 결정은 정본대로 응결로 |

## 3. 아키텍처

### 3.1 새 순수 모듈 — `src/lib/playRuntimeValidator.ts`

의존 — `canonImportance`(밴드) · `continuityContract`(모순 프리미티브) · `diveSession`(세그먼트) · `storyEngine` 타입. 순수(부수효과 0), TDD 대상.

```ts
export interface PlayConflict {
  factId: string;
  band: 'anchor' | 'major';
  factStatement: string;
  snippet: string;        // 답에서 충돌한 세그먼트
}
export interface PlaySurpriseCandidate {
  snippet: string;
  relatedThread?: string; // 걸린 열린 떡밥(있으면)
}
export interface PlayTurnVerdict {
  conflicts: PlayConflict[];
  surpriseCandidates: PlaySurpriseCandidate[];
  blocksCanonization: boolean;   // conflicts 에 anchor 하나라도 있으면 true
}

export function validatePlayTurn(
  replyText: string,
  canonFacts: CanonFact[],
  openThreads: string[]
): PlayTurnVerdict;
```

### 3.2 검출 로직

**밴드 버킷** — `factBand(fact)` 헬퍼(canonImportance 에 신설, `importanceBand(fact.importance ?? (fact.alwaysInclude ? 0.9 : 0))` 로 `selectCanonForContext.scoreOf` 와 동일 규칙). anchor / major / soft 3버킷.

**모순 검출 (재사용, DRY)** — 검증기가 **자체 미니 `ContinuityContract`** 를 만든다(프로젝트 전체 `buildContinuityContractFromProject` 가 아니라 캐논 fact 만, 밴드로 버킷):
- `hardCanon` = anchor 밴드 fact 들의 `statement`
- `livingState` = major 밴드 fact 들의 `statement`
- `softSignals` = soft 밴드 fact 들의 `statement`
+ `Map<statement, factId>` 역인덱스 동시 구축.

답을 `parseSceneSegments` 로 나눠 세그먼트마다 `classifyCanonChange(miniContract, segmentText)` 호출.
- `layer === 'hard-canon'` && `!allowed` → **anchor conflict**(band='anchor').
- `layer === 'living-state'` && `!allowed` → **major conflict**(band='major'). PLAY 는 가볍게라 cause/cost context 를 안 줌 → 반전이면 warn 로 잡힘(경고, 차단 아님).
- 역매핑 — 각 layer 항목이 정확히 `fact.statement` 이므로 `result.matchedSource === statement` → Map 으로 `factId`·`factStatement` 확정(동일 statement 복수 시 첫 fact). `findReversalMatch` 가 `source` 원문을 반환함이 검증됨(continuityContract.ts:341·344·350).
- 새 opposition 패턴·부정어 로직은 **작성 안 함** — 전부 continuityContract 재사용.

**의외 전개 후보 (보수적 휴리스틱, 미탐 선호)** — 세그먼트가 다음 **모두** 만족할 때만:
1. reveal/반전 마커 포함 — `사실`·`실은`·`알고 보니`·`…였다`·`나도`·`아니었` 등 소수 화이트리스트(과탐 방지로 좁게).
2. 캐논 엔티티(`deriveParticipants`)나 열린 떡밥 토큰을 건드림.
3. 그 세그먼트가 **anchor·major conflict 가 아님**(충돌이면 후보 아님).
→ `relatedThread` = 매칭된 열린 떡밥(있으면). 없으면 엔티티 기반.
- soft 밴드 fact 의 `soft-signal` 반전 매칭(`classifyCanonChange` layer='soft-signal')도 후보 소스로 합류 — 이미 "반전 재료로 자유" 판정된 것.

**`blocksCanonization`** = `conflicts.some(c => c.band === 'anchor')`.

### 3.3 세션 저장 — `diveSession.ts`

`DiveMessage` 에 optional `verdict?: PlayTurnVerdict` 추가(하위호환 — 구버전 메시지는 undefined = 무검증). `appendMessage(session, role, text, verdict?)` 4번째 인자 옵션 추가. 캐릭터 답을 append 할 때 verdict 부착.

`buildTranscript` / `selectCondenseSpan` 변경 없음. 대신 **응결 transcript 구성 시 `verdict?.blocksCanonization` 인 메시지를 제외**하는 필터를 DiveDesk.condense 에서 적용(span 을 buildTranscript 에 넘기기 전 `.filter(m => !m.verdict?.blocksCanonization)`). 순수 함수는 안 건드리고 호출부에서 거름.

### 3.4 UI 배선 — `DiveDesk.tsx` + `styles.css`

- **거터 마커** — 캐릭터 `.dx-turn` 에 `verdict` 있으면 왼쪽 세로선. 색 = 최악 밴드(anchor 🔴 red > major 🟡 amber > surprise ✦ lime). 클릭 → peek(어느 캐논 문장/떡밥, 간단 목록). 본문 세그먼트 렌더는 무변경.
- **하단 앰비언트 카운트** — 세션 전체 verdict 합산 `✦ N · 🔴 N`(0 이면 숨김), 작성창 위. 클릭 → 응결(기존 condense chip 동선 재사용). "응결 때 정리 →" 문구.
- **수동 "다시"(선택)** — 🔴 마커 peek 안에 "다시 생성" 1개(마지막 유저 입력 재전송). 강제 아님. (범위 최소화로 optional — 테스트 부담되면 후속.)
- 전부 `.dx-*` 스코프 CSS. 다크 토큰(`--lc-*`/`--nx-*`/`--sx-*`) 유지.

## 4. 데이터 흐름

```
유저 입력 → appendMessage(user)
         → requestDiveChat → res.reply
         → validatePlayTurn(res.reply, project.canonFacts, project.openThreads) = verdict
         → appendMessage(character, res.reply, verdict)
         → 렌더: 거터 마커(밴드색) + 하단 카운트
condense → span 중 verdict.blocksCanonization 제외 → buildTranscript → requestDiveCondense
```

## 5. 테스트 계획 (TDD — 테스트 먼저)

**신규 `src/lib/playRuntimeValidator.test.ts`** (핵심)
- 앵커 fact 모순 답 → conflicts[band='anchor'] + `blocksCanonization===true`.
- major fact 모순 답 → conflicts[band='major'] + `blocksCanonization===false`.
- soft fact 반전 / reveal 마커 + 열린떡밥 엔티티 → surpriseCandidates 1+, conflicts 0.
- 청정한 잡담(캐논 무관) → 빈 verdict(conflicts 0·surprise 0·block false).
- **오탐 가드** — 다른 엔티티에 대한 대립어(공유 엔티티 없음) → conflict 0 · reveal 마커 없는 중립 서술 → surprise 0.

**`diveSession.test.ts`**
- `appendMessage` 4번째 verdict 부착 확인.
- blocksCanonization 메시지를 제외한 span 이 buildTranscript 에서 빠지는 필터 동작(호출부 헬퍼로 검증).

**`diveDesk.test.ts`**
- verdict 있는 턴에 거터 마커 밴드 클래스 렌더 · 하단 카운트 수치 · 앵커 턴이 응결 transcript 에서 빠짐.

**런칭 게이트** — 앵커 모순 대사는 절대 캐논 진입 안 함(회귀). 의외 후보는 **미탐 선호**(중립 잡담에 ✦ 안 뜸).

## 6. 리스크 + 대응

- **결정론 모순 검출 오탐** → 앵커 차단이 멀쩡한 답의 캐논화를 막을 수 있음. 대응 — 공유 엔티티 가드(continuityContract 이미 보유)·세그먼트 단위 검사로 지역화·오탐 가드 테스트. 차단은 "캐논화만" 막지 화면·대화는 안 막아 피해 최소.
- **의외 후보 과탐 = 몰입 파괴** → 마커 화이트리스트를 좁게, 미탐 선호 원칙 테스트로 못박음.
- **verdict 저장이 localStorage 부풀림** → verdict 는 작고 conflicts/surprise 없으면 빈 배열. 필요시 후속 정리.
- **밴드↔contract layer 두 티어 혼동** → 이 슬라이스는 **importance 밴드가 진실원천**, contract layer 는 모순 검출 프리미티브로만 빌려 씀(anchor→hardCanon 매핑은 검출 목적 한정, 저장 안 함).

## 7. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/lib/playRuntimeValidator.ts` | **신규** 순수 검증기 |
| `src/lib/playRuntimeValidator.test.ts` | **신규** TDD |
| `src/lib/canonImportance.ts` | `factBand(fact)` export 추가 |
| `src/lib/diveSession.ts` | `DiveMessage.verdict?` · `appendMessage` verdict 인자 |
| `src/lib/diveSession.test.ts` | verdict 부착·제외 테스트 |
| `src/components/DiveDesk.tsx` | validatePlayTurn 호출·마커·카운트·응결 제외 |
| `src/components/diveDesk.test.ts` | 마커·카운트·제외 테스트 |
| `src/styles.css` | `.dx-` 거터 마커·앰비언트 카운트·peek CSS |

## 8. 완료 기준 (Definition of Done)

- `npm test` 전체 녹색 · `npm run build`(tsc+vite) 성공.
- 런칭 게이트(앵커 모순 대사 캐논 진입 0) 통과.
- 라이브 — DiveDesk 에서 앵커 모순 답에 🔴 마커·응결 제외 확인, 중립 잡담에 ✦ 미발생 확인, 콘솔 0.
- `progress.md` 갱신 + `session-handoff.md` 인계.
