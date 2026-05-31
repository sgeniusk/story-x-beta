# Codex Task Packet — A4: 반론 무결성 + 연구 윤리 게이트

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `feat/academic-a4` (main `d90cff2` = A3 머지본 위)
> 베이스라인: tsc exit 0 · 40 files / 253 tests · build 성공
> 검증 가능한 계약. "완료"는 §6 게이트 전부 통과해야 성립.

## 0. 한 줄 목표
academic 게이트의 마지막 두 placeholder를 실제 판정으로. **반론 무결성**(가장 강한 반론·대안 가설을 다뤘는가)과 **연구 윤리**(피험자 익명성·데이터 출처·이해충돌 공개)를 로컬 휴리스틱으로 점검해 마진에 드러낸다. essay 트랙의 `self_reversal`·`disclosure_scope` 로직을 학술용으로 확장 재활용.

## 1. 확정 결정 (변경 금지)
- 로컬 휴리스틱만 (외부 API·LLM 없이 결정론적).
- 영어(APA) 학술 기준.
- academic 매체에서만.

## 2. 스코프

### IN
1. **`src/lib/academicIntegrity.ts` 신설** (순수 로직, 결정론적) — 또는 기존 모듈에 함수 추가. 권장은 신설로 응집.
   - `auditCounterArgument(text): CounterArgumentAudit` — 반론·대안 가설 처리 점검.
     - 반론 마커 휴리스틱(영어): "however", "critics argue", "an alternative explanation", "one might object", "contrary to", "on the other hand", "limitation".
     - 산출 — `hasCounterArgument: boolean`, `hasAlternativeHypothesis: boolean`, `limitationsAcknowledged: boolean`. 핵심 주장(A2 claimLedger 재활용 가능)이 있는데 반론 마커가 0이면 일방적 주장 경고.
   - `auditResearchEthics(text): ResearchEthicsAudit` — 연구 윤리 점검.
     - 휴리스틱 — 피험자/데이터 언급("participants", "subjects", "interview", "survey", "dataset")이 있는데 익명성·동의·IRB·출처 표기("anonymized", "consent", "IRB", "approved", "de-identified")가 없으면 플래그.
     - 이해충돌("conflict of interest", "funding", "disclosure") 표기 권고.
     - 산출 — `subjectsReferenced`, `anonymityDeclared`, `consentDeclared`, `conflictDisclosed`, `issues: string[]`.
2. **`qualityGates.ts` 두 게이트 placeholder → 실제 판정**
   - `counter_argument_present` — academic에서 반론 미처리 시 false. **advisory 유지**(반론 부재가 곧 차단은 아님).
   - `research_ethics_disclosure` — academic에서 윤리 이슈 있으면 false. **연구윤리는 essay disclosure_scope처럼 blocking 승격 검토** — 단, A4에서는 일관성을 위해 advisory로 두되 reason을 강하게. (blocking 승격은 사용자 정책으로 남김. 주석 명시.)
   - `GateInput`에 필요한 필드 추가(`counterArgumentPresent?`, `researchEthicsSafe?` 또는 이슈 카운트). 기존 academic 헬퍼(`resolveUnsupportedClaimCount`·`resolveCitationIssueCount`) 패턴 따름.
3. **마진 연결** (`src/StoryXDesk.tsx`)
   - A2/A3 패턴(`academicClaimMarginReviews`·`academicCitationMarginReviews` useMemo)을 따라 `academicIntegrityMarginReviews` useMemo 추가.
   - 반론 부재 → `severity: 'suggest'`("반론·대안 가설 미처리"), 연구윤리 이슈 → `severity: 'block'`("연구 윤리 미공개 — 익명성/동의/출처").
   - persona는 `critic-reviewer`(반론) + `canon-librarian` 또는 `critic-reviewer`(윤리) 재활용. anchor는 관련 단락(없으면 첫 단락 또는 문서 레벨).
   - academic 전용, A2·A3 리뷰와 **공존**(셋 다 합산).

### OUT
- ❌ 외부 API·LLM.
- ❌ 학술 퍼블리시 (A5).
- ❌ 기존 4매체·essay·A2·A3 로직 변경(재활용은 읽기/패턴 차용만, essay 게이트 자체 수정 금지).
- ❌ blocking 승격(advisory까지).

## 3. ⚠️ 함정
1. **결정론** — 정규식·키워드, Math.random·LLM 없음.
2. **academic 전용 가드**.
3. **과탐지 경계** — 반론·윤리 마커가 명확할 때만. 짧은 글에서 false 폭발 방지(주장/피험자 언급이 있을 때만 점검).
4. **A2·A3 공존** — 세 종류 academic 마진이 같은 단락에 겹쳐도 OK. 기존 MarginReview severity 재사용.
5. essay의 `gate_self_reversal`·`gate_disclosure_scope`는 **읽고 패턴만 참고**, 그 게이트 자체는 건드리지 말 것.
6. 기존 253 tests 불변.

## 4. 손대지 말 것
M10 마진 핵심, A2 claimLedger·A3 citationGate 로직, essay 게이트, continuityContract·storyHarness·storyOntology, 기존 4매체.

## 5. TDD
- `src/lib/academicIntegrity.test.ts` 먼저:
  - auditCounterArgument — 반론 있음/없음, 대안가설, limitation 각 케이스.
  - auditResearchEthics — 피험자+익명성 없음(플래그), 동의 있음(통과), 이해충돌.
  - 결정론.
- `qualityGates.test.ts` — 두 게이트 academic 판정.
- 기존 253 불변.

## 6. 검증 게이트 (Definition of Done)
```
npx tsc --noEmit   → exit 0
npm test           → 40+ files / 253+ tests 통과
npm run build      → 성공
```
수동(코드 보장): academic 초안에서 반론 없는 일방 주장이 마진 suggest, 익명성 없는 피험자 언급이 block. 소설 영향 0. console error 0.

## 7. 보고 (§형식)
1. 변경/신설 파일.
2. academicIntegrity API + 반론/윤리 휴리스틱 규칙.
3. 마진 연결 + academic 가드 + A2·A3 공존.
4. 검증 3종 실제 출력.
5. 남은 위험·이월(A5 연결점 — academic 게이트 4개 모두 실판정 완료 후 퍼블리시).
6. 커밋하지 말 것 — Claude가 검증 후 커밋.
