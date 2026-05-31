# Codex Task Packet — A3: 인용 무결성 게이트 + 환각 인용 탐지

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `feat/academic-a3` (main `020dddc` = A2 머지본 위)
> 베이스라인: tsc exit 0 · 39 files / 246 tests · build 성공
> 검증 가능한 계약. "완료"는 §6 게이트 전부 통과해야 성립.

## 0. 한 줄 목표
학술 본문의 인용(citation)을 로컬 휴리스틱으로 점검해 **환각·깨진 인용을 마진에 드러낸다**. AI 학술 글쓰기의 신뢰를 가르는 지점 — 출처가 실제로 그 주장을 지지하는지, 참고문헌 목록과 본문 인용이 일치하는지.

## 1. 확정 결정 (변경 금지)
- 로컬 휴리스틱만 (외부 문헌 API·LLM 호출 없이 결정론적). CrossRef 등 금지.
- 영어(APA) 학술 기준.
- academic 매체에서만 동작.

## 2. 스코프

### IN
1. **`src/lib/citationGate.ts` 신설** (순수 로직, 결정론적)
   - `extractCitations(text): Citation[]` — APA 인-텍스트 인용 추출. 패턴: `(Author, 2020)`, `(Author & Author, 2020, p. 12)`, `Author (2020)`, `(Author et al., 2020)`.
   - `Citation` 타입 — `{ id, raw, authors, year, page: string|null, paragraph, hasReference: boolean }`.
   - `extractReferences(text): Reference[]` — 참고문헌(References/Bibliography 섹션) 항목 추출. 휴리스틱 — "References"/"참고문헌" 헤더 이후 줄들, `Author (Year).` 패턴.
   - `auditCitations(text): CitationAudit` — 본문 인용 ↔ 참고문헌 대조. 산출:
     - `orphanCitations` — 본문에 있으나 참고문헌에 없음(환각 의심).
     - `uncitedReferences` — 참고문헌에 있으나 본문에서 안 쓰임.
     - `pageMissingQuotes` — 직접 인용("...")인데 페이지 번호 없음(APA 위반).
2. **`qualityGates.ts` 의 `citation_integrity` placeholder → 실제 판정**
   - `GateInput`에 `citationIssueCount?: number`(또는 boolean) 추가 활용.
   - academic 매체에서 orphan/pageMissing 이슈가 있으면 `evaluate` false(advisory 유지). reason에 이슈 수.
   - 다른 게이트·트랙 영향 0.
3. **마진 연결** (`src/StoryXDesk.tsx`)
   - A2의 `academicClaimReviews` useMemo(664~682) 패턴을 그대로 따라, citation 이슈를 `MarginReview[]`로 변환하는 useMemo 추가.
   - orphan citation → `severity: 'block'`("참고문헌에 없는 인용"), pageMissing → `severity: 'suggest'`("직접 인용에 페이지 누락"), uncitedReference → `severity: 'note'`.
   - persona는 기존 `critic-reviewer` 재사용(또는 `canon-librarian` — 사서 역할이 출처 색인에 맞음). anchor는 citation.paragraph.
   - academic 매체에서만. claim 리뷰와 **공존**(둘 다 마진에 합산).

### OUT
- ❌ 외부 문헌 DB 대조(실제 출처 존재 검증) — 로컬 텍스트 내 대조만.
- ❌ 반론·연구윤리 판정 (A4) — 해당 placeholder 유지.
- ❌ 기존 4매체·소설 마진·A2 claim 로직 변경.
- ❌ blocking 승격 (advisory까지만).

## 3. ⚠️ 함정
1. **결정론** — 정규식 기반, Math.random·LLM 없음.
2. **academic 전용 가드** — 다른 매체에서 citation 검사 안 됨.
3. **과탐지 경계** — APA 패턴이 명확한 것만. 괄호 안 연도 없는 일반 괄호는 인용 아님.
4. **A2 공존** — claim 마진과 citation 마진이 같은 단락에 겹쳐도 OK. 기존 MarginReview severity(block/suggest/note) 재사용, 새 타입 금지.
5. 참고문헌 섹션이 없는 짧은 글에서 모든 인용이 orphan으로 잡히지 않게 — References 섹션 자체가 없으면 orphan 판정을 보류(advisory note 1개로 "참고문헌 섹션 없음")하는 게 합리적.
6. 기존 246 tests 불변.

## 4. 손대지 말 것
M10 마진 핵심(marginReview.ts·useMarginReview), A2 claimLedger 로직, continuityContract·storyHarness·storyOntology, 기존 게이트 판정, 기존 4매체.

## 5. TDD
- `src/lib/citationGate.test.ts` 먼저:
  - extractCitations — APA 4형식 각각 추출, 일반 괄호 제외.
  - extractReferences — References 섹션 파싱.
  - auditCitations — orphan/uncited/pageMissing 각 케이스 + References 없을 때 보류.
  - 결정론 — 동일 입력 동일 출력.
- `qualityGates.test.ts` — citation_integrity academic 판정.
- 기존 246 불변.

## 6. 검증 게이트 (Definition of Done)
```
npx tsc --noEmit   → exit 0
npm test           → 39+ files / 246+ tests 통과
npm run build      → 성공
```
수동(코드 보장): academic 초안에서 참고문헌에 없는 인용이 마진에 block, 페이지 없는 직접인용이 suggest. 소설 영향 0. console error 0.

## 7. 보고 (§형식)
1. 변경/신설 파일.
2. citationGate API + APA 인용/참고문헌 휴리스틱 규칙.
3. 마진 연결 + academic 가드 + A2 공존 방식.
4. 검증 3종 실제 출력.
5. 남은 위험·이월(A4 연결점).
6. 커밋하지 말 것 — Claude가 검증 후 커밋.
