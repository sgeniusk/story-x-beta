# Codex Task Packet — A5: 학술 퍼블리시 (사회과학 확장 완결)

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `feat/academic-a5` (main `3c8ba7a` = A4 머지본 위)
> 베이스라인: tsc exit 0 · 41 files / 265 tests · build 성공
> 검증 가능한 계약. "완료"는 §6 게이트 전부 통과해야 성립. **로드맵 A1~A5의 마지막 단계.**

## 0. 한 줄 목표
A2~A4가 만든 학술 무결성 결과(주장-근거·인용·반론·연구윤리)를 **퍼블리시 화면에서 산출물로** 보여준다. academic 매체일 때 참고문헌 목록(APA), 주장-근거 지도, 인용 무결성 요약, 게이트 4종 통과 현황을 한 화면에 모은다.

## 1. 확정 결정 (변경 금지)
- 로컬 휴리스틱만 (외부 API·LLM 없이 결정론적). A2~A4 모듈 재사용.
- 영어(APA) 학술 기준.
- academic 매체에서만 추가 섹션 노출. 다른 매체 퍼블리시 동작 불변.

## 2. 스코프

### IN
1. **학술 퍼블리시 요약 빌더** — `src/lib/academicPublish.ts` 신설(순수, 결정론).
   - `buildAcademicPublishSummary(text): AcademicPublishSummary` — A2~A4 모듈을 호출해 묶는다:
     - `claimLedger` (A2 `mapClaimsToEvidence`) → 주장 수·근거 매핑 수·미근거 주장 수.
     - `citationAudit` (A3 `auditCitations`) → 인용 수·orphan·pageMissing.
     - `integrity` (A4 `auditCounterArgument`·`auditResearchEthics`) → 반론·윤리 상태.
     - `references` — A3 `extractReferences` 결과를 APA 정렬(저자 알파벳순) 목록으로.
     - `gateStatus` — 4 academic 게이트 pass/advisory-fail 요약(qualityGates `evaluateQualityGates` 재사용, medium='academic').
   - 새 판정 로직 만들지 말 것 — A2~A4 함수 조합만.
2. **PublishScreen academic 섹션** (`src/components/PublishScreen.tsx`)
   - `medium === 'academic'`일 때만 렌더되는 추가 섹션:
     - **참고문헌 (References)** — APA 정렬 목록. 비었으면 "참고문헌 없음" 안내.
     - **주장-근거 지도** — 주장별 근거 유형 칩(data/prior-work/logic/anecdote), 미근거 주장은 경고색.
     - **인용 무결성** — 총 인용·orphan·pageMissing 카운트.
     - **학술 게이트 현황** — 4 게이트 통과/주의.
   - props로 `academicSummary?: AcademicPublishSummary` 추가(optional). academic 아니면 undefined로 기존 동작 그대로.
   - 기존 publishConfig·4 카드·게이트 카드 구조와 톤 일치(Linear 다크, `--sx-*`). 필요한 CSS는 `publish-screen.css`에 추가.
3. **App.tsx 배선**
   - publish stage에서 `medium === 'academic'`이면 `buildAcademicPublishSummary(...본문...)`를 만들어 `academicSummary` prop으로 전달. 본문 소스는 기존 publish 데이터 흐름(chapters/heroEcho 등)에서 academic 원고 텍스트를 잇는다. 없으면 빈 요약.
   - ⚠️ App.tsx의 publish stage 블록이 **중복**되어 보이면(있다면) 정리하되, 동작 동일 보장. 확신 없으면 첫 블록만 수정.

### OUT
- ❌ A2~A4 판정 로직 변경(재사용만).
- ❌ blocking 승격(게이트는 advisory 유지, 화면은 현황만 표시).
- ❌ 외부 API. ❌ 기존 4매체 퍼블리시 변경. ❌ 실제 파일 export(PDF 등)는 후속.

## 3. ⚠️ 함정
1. **결정론** — A2~A4가 이미 결정론적. 조합도 그대로.
2. **academic 전용** — 다른 매체 퍼블리시에 학술 섹션 안 보임. props optional 가드.
3. **A2~A4 재사용** — import해서 조합. 같은 로직 재구현 금지(중복·드리프트 위험).
4. **PublishScreen Props 중복** — 현재 파일에 `onBack` 등 중복 선언 흔적이 보일 수 있음(라인 19·22). 타입 깨지면 정리하되 기존 렌더 보존.
5. 기존 265 tests 불변.

## 4. 손대지 말 것
M10 마진, A2 claimLedger·A3 citationGate·A4 academicIntegrity의 판정 로직, essay 게이트, 기존 4매체 퍼블리시, 도메인 코어.

## 5. TDD
- `src/lib/academicPublish.test.ts` 먼저:
  - buildAcademicPublishSummary — 주장/인용/반론/윤리/참고문헌/게이트 요약이 A2~A4 결과와 일치.
  - References APA 정렬(저자순).
  - 결정론.
- 기존 265 불변.

## 6. 검증 게이트 (Definition of Done)
```
npx tsc --noEmit   → exit 0
npm test           → 41+ files / 265+ tests 통과
npm run build      → 성공
```
수동(코드 보장): academic 매체 `?stage=publish`에서 참고문헌·주장-근거 지도·인용 무결성·게이트 현황 4섹션 렌더. 소설 등 다른 매체 퍼블리시 영향 0. console error 0.

## 7. 보고 (§형식)
1. 변경/신설 파일.
2. academicPublish 요약 구조 + A2~A4 재사용 방식.
3. PublishScreen academic 섹션 + App.tsx 배선 + (중복 블록 처리했으면 그 내용).
4. 검증 3종 실제 출력.
5. 남은 위험·이월(실제 PDF export·blocking 정책 등 로드맵 이후).
6. 커밋하지 말 것 — Claude가 검증 후 커밋. **이것으로 사회과학 로드맵 A1~A5 완결.**
