# Codex Task Packet — A2: 주장 레저 + 주장-근거 하네스

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `feat/academic-a2` (main `a89e34c` = A1 머지본 위)
> 베이스라인: tsc exit 0 · 38 files / 239 tests · build 성공
> 검증 가능한 계약. "완료"는 §6 게이트 전부 통과해야 성립.

## 0. 한 줄 목표
사회과학 확장의 **핵심 마일스톤**. 학술 본문에서 주장(claim)을 추출해 근거(evidence)와 매핑하는 `claimLedger`를 신설하고, **근거 없는 주장을 마진에 `block`으로 드러낸다**. 소설의 캐논 충돌과 같은 위상 — 무결성을 시스템이 강제한다.

## 1. 확정 결정 (변경 금지)
- 로컬 휴리스틱만 (외부 API·LLM 호출 없이 결정론적 텍스트 분석).
- 영어(APA) 학술 기준.
- academic 매체에서만 동작.

## 2. 스코프

### IN
1. **`src/lib/claimLedger.ts` 신설** (순수 로직, 결정론적)
   - `extractClaims(text): Claim[]` — 학술 본문에서 주장 문장 추출. 휴리스틱 — 주장 마커(영어: "we argue", "this suggests", "therefore", "demonstrates", "we find that" 등 / 한국어 보조: "~라고 주장한다", "~을 시사한다", "따라서") 기반.
   - `Claim` 타입 — `{ id, text, paragraph, evidenceType: EvidenceType | null, hasEvidence: boolean }`.
   - `EvidenceType` — `'data' | 'prior-work' | 'logic' | 'anecdote'`. 근거 마커 휴리스틱(인용 `(Author, 2020)`·수치·"because"·"for example" 등)으로 분류.
   - `mapClaimsToEvidence(claims, text): ClaimLedger` — 각 주장에 근접 근거를 매핑. 같은/인접 단락에 근거 마커가 없으면 `hasEvidence=false`.
   - `findUnsupportedClaims(ledger): Claim[]` — 근거 없는 주장 목록.
2. **`qualityGates.ts` 의 `claim_evidence_mapping` 게이트 placeholder → 실제 판정**
   - `GateInput`에 이미 있는 `claimEvidenceMapped?: boolean`을 활용하거나, 더 풍부히 하려면 `unsupportedClaimCount?: number` 추가.
   - academic 매체에서 미근거 주장이 있으면 `evaluate`가 false(advisory 유지 — blocking 승격은 사용자 정책이므로 A2는 advisory). reason에 미근거 주장 수 명시.
   - 다른 게이트·트랙 영향 0.
3. **마진 연결** (`src/StoryXDesk.tsx`)
   - academic 매체일 때, 주장 레저 결과를 `MarginReview[]`로 변환해 마진에 표시. 근거 없는 주장 → `severity: 'block'`, head "근거 없는 주장", body에 주장 문장 + 어떤 근거가 필요한지.
   - 기존 마진 검토(`runMarginReviewAll`)와 **공존** — 별도 트리거 또는 academic 검토에 합류. 충돌 없이.
   - 주장이 있는 단락에 anchor (claimLedger의 paragraph 사용). data-pid 재활용.

### OUT
- ❌ 인용 무결성 실제 검증 (A3) — citation_integrity 게이트는 placeholder 유지.
- ❌ 반론·연구윤리 판정 (A4).
- ❌ 외부 문헌 API.
- ❌ 기존 4매체·소설 마진 동작 변경.
- ❌ blocking 승격 (A2는 advisory까지만).

## 3. ⚠️ 함정
1. **결정론** — extractClaims/mapClaimsToEvidence는 Math.random·LLM 없이 순수 텍스트 휴리스틱. 같은 입력 → 같은 출력(테스트 가능).
2. **academic 전용** — novel/essay 등에서 claimLedger가 돌면 안 됨. 매체 가드 필수.
3. **과탐지 경계** — 모든 문장을 주장으로 잡으면 마진이 폭발. 주장 마커가 명확한 문장만. 보수적으로.
4. **마진 공존** — 기존 `useMarginReview`/`MarginReview` 계약 재사용. 새 severity 만들지 말 것(block/suggest/note 안에서).
5. 기존 239 tests 불변.

## 4. 손대지 말 것
M10 마진 모델 핵심(marginReview.ts 타입·useMarginReview 훅 로직), continuityContract·storyHarness·storyOntology, 기존 게이트 판정, 기존 4매체.

## 5. TDD
- `src/lib/claimLedger.test.ts` **먼저** 작성:
  - extractClaims — 주장 마커 문장만 추출, 일반 서술 제외.
  - evidenceType 분류 — 인용/수치/논리/일화 각각.
  - findUnsupportedClaims — 근거 없는 주장만.
  - 결정론 — 동일 입력 동일 출력.
- `qualityGates.test.ts` — claim_evidence_mapping이 academic에서 미근거 주장 시 false, 다른 매체 영향 0.
- 기존 239 불변.

## 6. 검증 게이트 (Definition of Done)
```
npx tsc --noEmit   → exit 0
npm test           → 38+ files / 239+ tests 통과 (신규 claimLedger 테스트 추가)
npm run build      → 성공
```
수동(코드 보장): academic 매체 초안에서 근거 없는 주장이 마진에 `block`으로 표시. 소설 매체는 영향 0. console error 0.

## 7. 보고 (§형식)
1. 변경/신설 파일.
2. claimLedger API + 주장/근거 휴리스틱 규칙(어떤 마커로 잡는지).
3. 마진 연결 방식 + academic 가드.
4. 검증 3종 실제 출력.
5. 남은 위험·이월(A3 인용 검증 연결점).
6. 커밋하지 말 것 — Claude가 검증 후 커밋.
