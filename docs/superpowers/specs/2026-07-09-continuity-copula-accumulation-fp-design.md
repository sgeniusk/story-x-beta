# 계사부정·주술어부정 누적 오탐 정밀화 — 설계 (스파이크 검증본)

> 2026-07-09 · 브랜치 `feat/continuity-copula-accumulation-fp`. 발견 정본 `docs/reviews/2026-07-09-multichapter-continuity/findings.md`. 아래 수치는 실제 스파이크로 실측(23화·91팩트 백업).

## 배경
2026-07-08 #32는 각 소재 **1화 격리**에서 오탐 0을 실측했다. 2026-07-09 결정론 하네스가 같은 게이트를 **실제 23화·91팩트 누적 캐논**에 돌리자 정밀도가 붕괴 — 재진술 FP **53/91**, 정합신규 3/4. 미스터리·로판의 반전(reveal)은 본디 부정형으로 서술되어("권한자는 레나 위클리프가 아니며 루시안이…"), 이런 팩트가 캐논에 쌓이면 #32의 계사부정·주술어부정 매처가 그 엔티티를 언급·공유하는 아무 팩트나 반전으로 오판한다.

## 스파이크에서 배운 것 (설계 근거)
naive "엔티티 가드"(claim의 표지 엔티티면 스킵)는 53→44에 그쳤다 — 성씨 조각(벨로트·위클리프)이 여러 엔티티에 공유돼, 표지 여부로는 못 거른다. **진짜 지렛대는 주어 일치**였다 — 반전은 정의상 "같은 주어에 대한 상반된 서술"이므로, source·claim의 주어가 확정 일치할 때만 계사부정·주술어부정을 발화하면 조각 오매칭이 대량 소멸한다. 실측 —

| 단계 | 재진술 FP | recall | 단위 |
|---|---|---|---|
| naive 엔티티 가드 | 53→44 | 3/5 | 24✓ |
| 주어 일치(copula+finalNeg) | 53→19 | 3/5 | 24✓ |
| + presence 보조용언 + finalNeg 공유2+ | **53→16** | 3/5 | 24✓ |

## 목표
- 재진술 FP **53 → 16**(70% 감축), 정합신규 FP **3 → 1**. 잔여 16은 문서화 후속(밀집 동일테마 reveal).
- recall 무손실 — 직접 모순 차단 3/5 유지.
- 기존 24 단위 회귀 0. 결정론 유지(LLM·사전 없음).

## 수정 1 — 주어 일치 게이트 (계사부정 두 루프)
`src/lib/continuityContract.ts` `findReversalMatch`(현 398~406행). 계사부정 두 루프를 **`sameSubject` 조건 안에만** 둔다.
```ts
const sSubj = extractSubject(source);
const cSubj = extractSubject(claim);
const sameSubject = Boolean(sSubj && cSubj && sSubj === cSubj);
...
if (sameSubject) {
  for (const noun of claimCopula) {
    if (expandedSource.has(noun) && !sourceCopula.has(noun)) return source;   // 케이스 A
  }
  for (const noun of sourceCopula) {
    if (expandedClaim.has(noun) && !claimCopula.has(noun)) return source;
  }
}
```
- `extractSubject`는 이미 문두 주격(SUBJECT_RE) + 문중 주격/주제 폴백을 가진다. 다단어·불명 주어는 `undefined` → `sameSubject=false` → 발화 안 함(FP 소멸).
- 검증 — 케이스 A(claim "윤민서는 형사가 아니라…" subj 윤민서, source "윤민서는 강력계 형사이며" subj 윤민서 → 일치 → block ✓). FP("권한자는…" subj 권한자 vs "벨로트 백작가의…" subj 사용권 → 불일치 → 스킵 ✓).

## 수정 2 — 주술어 부정 극성 게이트 (finalNeg)
같은 블록 하단 finalNeg 분기(현 409~415행). `hasSameEntity`(토큰 ≥2 폴백으로 느슨) 대신 **`sameSubject`** 를 요구하고, 공유 술어를 **2개 이상**으로 올린다.
```ts
if (
  sameSubject &&
  hasFinalNegation(claim) !== hasFinalNegation(source) &&
  sharedNonEntityPredicateCount(expandedClaim, expandedSource, claim, source) >= 2
) {
  return source;
}
```
- `sharesNonEntityPredicate`(boolean, 1개면 true)를 `sharedNonEntityPredicateCount`(number)로 교체 — 반환 타입만 확장, 내부 로직 동일. 호출부는 `>= 2`.
- 이유 — 밀집 동일테마 reveal 팩트가 주어 토큰 + 술어 1개를 우연 공유하는 오발화를 거른다.

## 수정 3 — presence 축 보조용언 제외
`OPPOSITION_PATTERNS` presence side a(현 306행). `있다`가 보조용언 "-어/-고 있다"일 때 존재사로 세지 않는다.
```ts
{ axis: 'presence', side: 'a', pattern: /나타났|나타나|발견|존재|(?<![어아고]\s?)있다/ },
```
- 존재("증거가 있다") 유지, 상태보조("기록되어 있다") 제외. side b `없다`는 정당하므로 무변경.

## 테스트 (TDD — 테스트 먼저)
`src/lib/continuityContract.test.ts` 신규 케이스.
- ⓐ reveal-FP — hardCanon "…권한자는 레나 위클리프가 아니며 루시안이 오른편…", claim "레나 위클리프는 리아나에게 동쪽 문에 가지 말라고 경고했다" → `allowed=true`(주어 불일치).
- ⓑ 진짜 반전 보존(주어 일치) — hardCanon "윤민서는 강력계 형사이며 감정을 드러내지 않는다", claim "윤민서는 형사가 아니라 민간인이다" → `allowed=false`·hard-canon(케이스 A, 기존 line 173 케이스가 그대로 통과해야 함).
- ⓒ presence aux FP — hardCanon "레나는 위임장 원본이 없다는 이유로 계약을 늦추고 있었다", claim "레나는 하급 회계 보좌로 기록되어 있다" → `allowed=true`.
- ⓓ finalNeg 공유2+ 가드 — 주어는 같으나 공유 술어 1개뿐인 동일테마 reveal 쌍 → `allowed=true`(공유<2).
- 기존 24 케이스 회귀 0(특히 line 173·187·194·208·221·234·250 부정 극성·death 축 케이스가 주어 일치로도 통과하는지 확인).

**누적 회귀 실측(수용 기준)** — `npx tsx docs/reviews/2026-07-09-multichapter-continuity/gate-accumulation.ts` → 재진술 FP **16/91**·정합신규 **1/4**·recall **3/5**. 이 하네스가 회귀 픽스처.

## 불변식 · 범위 밖
- 보존 — 정밀한 직접 모순만·결정론·living-state cause/cost·soft-signal 자유·classifyCanonChange 프롬프트 미러 아님.
- 범위 밖(후속) — 잔여 FP 16(밀집 동일테마 reveal, 공격적 제약 시 recall 트레이드오프) · recall 누락 2건(멸문↔번영 미등록 축·레오르 death형 "죽지" 미매치, 멸문-miss는 후반 캐논이 supersede해 정당 non-block 가능) · 캐논 화차 태그 시효 모델(구조적 재설계).
