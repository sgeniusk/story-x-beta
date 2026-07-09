# 계사부정·주술어부정 누적 오탐 정밀화 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (또는 subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** 자동 의미 연속성 게이트가 누적 캐논(23화·91팩트)에서 내던 재진술 FP 53건을 주어 일치·presence 보조용언·finalNeg 공유2+ 제약으로 16건까지 줄이되 recall(3/5)·기존 24 단위 테스트를 무손실 유지.

**Architecture:** `src/lib/continuityContract.ts` `findReversalMatch`의 계사부정 두 루프와 주술어부정 분기를 `sameSubject`(양쪽 `extractSubject` 확정 일치) 조건 안에만 두고, presence 축 side a `있다`에서 보조용언 "-어/-고 있다"를 제외한다. `sharesNonEntityPredicate`를 count 반환으로 확장해 finalNeg를 공유 술어 2개+로 조인다. 순수 함수·결정론 유지.

**Tech Stack:** TypeScript, Vitest, tsx(누적 하네스 재현).

---

### Task 1: 실패 테스트 4종 추가 (RED)

**Files:**
- Test: `src/lib/continuityContract.test.ts` (기존 describe 블록 끝, 현 line ~257 앞)

- [ ] **Step 1: 테스트 4개 작성**

```ts
  // 누적 오탐 방어 — reveal 팩트가 다른 주어 팩트를 오염시키지 않는다.
  it('does not flag a subject-mismatched mention against a copula-negated reveal fact', () => {
    const contract = createContinuityContract({
      hardCanon: ['첫 회송 날짜의 오른편 권한자는 레나 위클리프가 아니며 루시안이 오른편을 대리했다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '레나 위클리프는 리아나에게 동쪽 문 근처에 가지 말라고 경고했다');
    expect(result.allowed).toBe(true);
  });

  // 주어 일치 시 진짜 계사 반전은 여전히 잡는다(케이스 A 강화).
  it('still flags a copula reversal when the two statements share the same subject', () => {
    const contract = createContinuityContract({
      hardCanon: ['범인은 철수가 아니다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '범인은 철수다');
    expect(result.allowed).toBe(false);
    expect(result.layer).toBe('hard-canon');
  });

  // presence 축 — 보조용언 "-어 있다"는 존재사로 세지 않는다.
  it('does not flag auxiliary -어 있다 as a presence reversal against an existential 없다', () => {
    const contract = createContinuityContract({
      hardCanon: ['레나는 위임장 원본이 없다는 이유로 계약을 늦추고 있었다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '레나는 하급 회계 보좌로 기록되어 있다');
    expect(result.allowed).toBe(true);
  });

  // finalNeg — 주어는 같아도 공유 술어가 1개뿐이면 반전으로 보지 않는다.
  it('does not flag final-negation polarity when only one predicate token is shared', () => {
    const contract = createContinuityContract({
      hardCanon: ['오른편 봉투는 협박장이 아니라 위장이다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '오른편 봉투는 창고에서 발견되었다');
    expect(result.allowed).toBe(true);
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/continuityContract.test.ts`
Expected: 신규 4개 중 ⓐⓒ(reveal-FP·presence-aux) FAIL(현재 block), ⓑ는 이미 통과할 수 있음, ⓓ 통과 여부 불확실. 최소 2개 FAIL.

- [ ] **Step 3: 커밋(RED)**

```bash
git add src/lib/continuityContract.test.ts
git commit -m "test(continuity): 누적 계사부정·presence 오탐 방어 테스트 (RED)"
```

---

### Task 2: presence 축 보조용언 제외 (GREEN 일부)

**Files:**
- Modify: `src/lib/continuityContract.ts` (OPPOSITION_PATTERNS presence side a, 현 306행)

- [ ] **Step 1: 패턴 수정**

기존:
```ts
  { axis: 'presence', side: 'a', pattern: /나타났|나타나|발견|존재|있다/ },
```
변경:
```ts
  { axis: 'presence', side: 'a', pattern: /나타났|나타나|발견|존재|(?<![어아고]\s?)있다/ },
```

- [ ] **Step 2: presence 테스트 통과 확인**

Run: `npx vitest run src/lib/continuityContract.test.ts -t "auxiliary"`
Expected: PASS

---

### Task 3: 주어 일치 게이트 + finalNeg 공유2+ (GREEN 나머지)

**Files:**
- Modify: `src/lib/continuityContract.ts` `sharesNonEntityPredicate`(현 373행)·`findReversalMatch` 계사/finalNeg 블록(현 398~415행)

- [ ] **Step 1: sharesNonEntityPredicate → count 변형**

기존:
```ts
function sharesNonEntityPredicate(a: Set<string>, b: Set<string>, aText: string, bText: string): boolean {
  const entities = new Set([...markedEntities(aText), ...markedEntities(bText)]);
  for (const token of a) {
    if (token.length < 2 || entities.has(token) || isStateToken(token)) continue;
    if (b.has(token)) return true;
  }
  return false;
}
```
변경:
```ts
// 두 문장이 엔티티(주어·주제)가 아닌 공유 술어 토큰을 몇 개 갖는가 — 반전이 술어에 걸렸음을 보증.
function sharedNonEntityPredicateCount(a: Set<string>, b: Set<string>, aText: string, bText: string): number {
  const entities = new Set([...markedEntities(aText), ...markedEntities(bText)]);
  let n = 0;
  for (const token of a) {
    if (token.length < 2 || entities.has(token) || isStateToken(token)) continue;
    if (b.has(token)) n++;
  }
  return n;
}
```

- [ ] **Step 2: 계사부정·finalNeg 블록을 sameSubject 게이트로 감싸기**

기존(398~415행):
```ts
    // 계사 부정 — 한쪽이 "X가 아니"로 부정한 술어명사 X를 다른 쪽이 단정하면 반전(케이스 A: 형사).
    const claimCopula = copulaNegatedNouns(claim);
    const sourceCopula = copulaNegatedNouns(source);
    for (const noun of claimCopula) {
      if (expandedSource.has(noun) && !sourceCopula.has(noun)) return source;
    }
    for (const noun of sourceCopula) {
      if (expandedClaim.has(noun) && !claimCopula.has(noun)) return source;
    }
    // 주술어 부정 극성 — 한쪽만 주술어를 부정 + 같은 엔티티 + 공유 술어면 반전.
    // 부수 부정("없이도")은 마지막 절이 긍정이라 제외되고, 엔티티만 공유하면 술어 미공유로 제외된다.
    if (
      hasFinalNegation(claim) !== hasFinalNegation(source) &&
      hasSameEntity(source, claim, expandedSource, expandedClaim) &&
      sharesNonEntityPredicate(expandedClaim, expandedSource, claim, source)
    ) {
      return source;
    }
```
변경:
```ts
    // 누적 오탐 방어 — 계사부정·주술어부정은 두 문장의 주어가 확정 일치할 때만 반전으로 본다.
    // 반전은 정의상 "같은 주어에 대한 상반된 서술"이며, 성씨 조각(벨로트·위클리프) 공유만으로는
    // 반전이 아니다(누적 reveal 팩트가 다른 주어 팩트를 오염시키던 문제).
    const sourceSubject = extractSubject(source);
    const claimSubject = extractSubject(claim);
    const sameSubject = Boolean(sourceSubject && claimSubject && sourceSubject === claimSubject);
    // 계사 부정 — 한쪽이 "X가 아니"로 부정한 술어명사 X를 다른 쪽이 단정하면 반전(케이스 A: 형사).
    const claimCopula = copulaNegatedNouns(claim);
    const sourceCopula = copulaNegatedNouns(source);
    if (sameSubject) {
      for (const noun of claimCopula) {
        if (expandedSource.has(noun) && !sourceCopula.has(noun)) return source;
      }
      for (const noun of sourceCopula) {
        if (expandedClaim.has(noun) && !claimCopula.has(noun)) return source;
      }
    }
    // 주술어 부정 극성 — 한쪽만 주술어를 부정 + 같은 주어 + 공유 술어 2개+면 반전.
    // 부수 부정("없이도")은 마지막 절이 긍정이라 제외되고, 밀집 동일테마 우연 공유는 2개 요구로 거른다.
    if (
      sameSubject &&
      hasFinalNegation(claim) !== hasFinalNegation(source) &&
      sharedNonEntityPredicateCount(expandedClaim, expandedSource, claim, source) >= 2
    ) {
      return source;
    }
```

- [ ] **Step 3: 죽은 코드 정리 확인**

`hasSameEntity`가 다른 곳(`hasOpposingState`·`hasNumericDivergence`)에서 여전히 쓰이는지 확인 — 쓰이면 유지, 이 블록에서만 쓰였으면 그대로 둠(제거하지 말 것, 다른 호출부 존재).
Run: `grep -n "hasSameEntity\|sharesNonEntityPredicate" src/lib/continuityContract.ts`
Expected: `hasSameEntity`는 hasOpposingState·hasNumericDivergence에 남아 있음. `sharesNonEntityPredicate`(옛 이름) 잔여 참조 0.

- [ ] **Step 4: 전체 단위 테스트 통과 확인**

Run: `npx vitest run src/lib/continuityContract.test.ts`
Expected: PASS (기존 24 + 신규 4 = 28)

---

### Task 4: 누적 회귀 실측 + 전체 검증 (수용 기준)

- [ ] **Step 1: 누적 하네스 재실행**

Run: `npx tsx docs/reviews/2026-07-09-multichapter-continuity/gate-accumulation.ts`
Expected: `재진술 FP 16/91 · 정합신규 FP 1/4` · `recall 3/5`.

- [ ] **Step 2: init.sh 전체 통과**

Run: `bash init.sh`
Expected: tsc·vitest 전체·vite build 녹색.

- [ ] **Step 3: 커밋(GREEN)**

```bash
git add src/lib/continuityContract.ts
git commit -m "fix(continuity): 주어 일치·presence 보조용언·finalNeg 공유2+로 누적 오탐 정밀화 (53→16 FP)"
```

---

### Task 5: 상태 아티팩트 갱신

**Files:**
- Modify: `progress.md`(발견 트랙을 `done` 완료 트랙으로 승격), `session-handoff.md`(맨 위 인계)

- [ ] **Step 1: progress.md·handoff 갱신** — 실측 수치(53→16·recall 3/5·단위 28)·커밋 SHA·잔여 16 후속 명시.
- [ ] **Step 2: 커밋**

```bash
git add progress.md session-handoff.md
git commit -m "docs(continuity): 누적 오탐 정밀화 done — progress·handoff 갱신"
```
