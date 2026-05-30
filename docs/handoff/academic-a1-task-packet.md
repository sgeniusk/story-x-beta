# Codex Task Packet — A1: academic 매체 + 학술 트랙 골격

> 작성: Claude (하네스 엔지니어 / 총괄) · 실행: Codex gpt-5.5 @ xhigh
> 브랜치: `feat/academic-a1` (main `e172350` 위) · 베이스라인: tsc exit 0 · 38 files / 234 tests · build 성공
> 검증 가능한 계약. "완료"는 §6 게이트 전부 통과해야 성립.

## 0. 한 줄 목표
사회과학 글쓰기 확장의 1단계. `academic`을 **5번째 매체**로 추가하고, 학술 트랙·투영·구조 스킴의 **골격만** 깐다. 게이트 판정 로직·주장 레저·인용 검증은 A2~A5 이므로 **이번엔 placeholder/선언만**.

## 1. 확정 결정 (로드맵 §5 기준 — 변경 금지)
- **인용 검증** — 로컬 휴리스틱만. 외부 API 없음.
- **학술 관행** — 영어(APA) 우선. 한국어 KCI 후속.
- **매체 구조** — `CreativeMedium`에 `academic` 5번째 매체로. 상위 축 신설 없음.

## 2. 스코프

### IN (이번에 한다 — 골격)
1. **`academic` 매체 추가** (`src/lib/projectBlueprint.ts`)
   - `CreativeMedium` 타입에 `'academic'` 추가.
   - `getCreativeActionLabels`에 `academic` case (예: draft '초안 집필', review '논증 점검', lock '원고 확정', lockedChip '원고 확정됨', nextDraft '다음 절 집필'). 영어 APA 맥락에 맞게.
   - `CreativeFormat`에 학술 포맷 추가 — `'research-paper' | 'academic-column' | 'literature-review'` (영어 학술).
   - `mediumOptions`에 academic 항목(label '사회과학/학술', description·signal은 논증·근거·인용 중심).
   - `formatOptions`에 `academic:` 키 + 위 3 포맷 옵션.
   - `CreativeBlueprint.nextWorkspace` 유니온에 학술 작업장이 필요하면 `'academic-writing-studio'` 추가(없으면 가장 가까운 essay 계열 재사용 — 단 타입 에러 0).
   - `buildCreativeBlueprint`의 academic 분기(agentStack·skillStack·productionPhases). agentStack은 §5 페르소나 재활용.
2. **qualityGates academic 트랙** (`src/lib/qualityGates.ts`)
   - `GateTrack`에 `'academic'` 추가.
   - academic 게이트 **키만 선언**(placeholder) — `claim_evidence_mapping` · `citation_integrity` · `counter_argument_present` · `research_ethics_disclosure`. 각 `evaluate`는 **항상 통과 또는 advisory 고정**(실제 판정은 A2~A4, 주석으로 "A2~A4에서 구현" 명시).
   - `resolveRequirement`에 academic 분기 — 매체가 academic일 때만 노출(essay 패턴 `input.medium === 'essay'` 참고하여 `=== 'academic'`).
   - 영어 APA 기준임을 게이트 reason/주석에 명시.
3. **mediaProjection academic 투영** (`src/lib/mediaProjection.ts`)
   - `MediaTarget`에 `'academic'` 추가. `projectAllMedia`의 `targets` 배열에 추가(5→6).
   - `buildFields`에 academic case — 논제(thesis)·근거구조(evidence structure)·기여(contribution) 등 학술 필드. **핵심 4요소 보존**(premise.dramaticQuestion·characters[0].desire·worldRules[0].cost·plotThreads[0])은 다른 매체와 동일하게 유지돼야 PreservationReport 통과.
4. **좌레일 학술 구조 스킴** (`src/StoryXDesk.tsx`)
   - academic 매체일 때 기승전결 대신 **Introduction-Literature-Method-Discussion-Conclusion** 구조 스킴을 좌레일 구조 탭에 표시. 기존 `groupBeatsIntoActs`/구조 트리 패턴 재활용. academic이 아니면 기존 동작 불변.
5. **페르소나 매핑** (`interviewClient.ts` + 매체 풀)
   - academic 매체의 인터뷰어/검토 풀에 **기존** `essay-curator`·`critic-reviewer`·`interview-curator`·`essay-thesis`(주제 큐레이터) 연결. 신규 .md 페르소나는 만들지 마라(A3~A4).
   - `interviewClient.ts`의 매체 분기(`case 'essay'` 패턴)에 `case 'academic'` 추가 — essay 풀 재활용 또는 학술용 소규모 pick 함수. 없는 페르소나 id 참조 금지(findPersona fallback 있어도 깔끔히).

### OUT (하지 않는다 — 다음 단계)
- ❌ 주장 레저 실제 로직 (A2) · 인용 검증 로직 (A3) · 반론/문헌 에이전트 신설 (A4) · 학술 퍼블리시 (A5).
- ❌ 외부 문헌 API.
- ❌ 한국어 KCI 포맷.
- ❌ 기존 4매체 동작·테스트 변경.

## 3. ⚠️ 함정
1. **기존 5매체 투영 + 234 tests 불변**이 1차 게이트. academic 추가가 novel/essay/webtoon/insta-toon/four-cut 투영을 깨면 안 된다.
2. `CreativeMedium`(4종)과 `MediaTarget`(5종, webtoon/insta-toon/four-cut 포함)은 **다른 유니온**이다. academic은 둘 다에 추가하되 혼동 금지.
3. academic 게이트 evaluate는 **반드시 통과/advisory 고정** — 실제 판정을 넣으면 A2 스코프 침범 + 빈 입력에서 false block 위험.
4. `formatOptions`는 `Record<CreativeMedium, FormatOption[]>` 이라 academic 키 누락 시 타입 에러. 반드시 채운다.
5. 좌레일 구조 스킴은 academic 분기만 추가, 다른 매체 영향 0.
6. 페르소나는 **기존 것만 재활용**. 새 id 발명 금지.

## 4. 손대지 말 것
- 도메인 핵심 로직의 기존 판정(continuityContract·storyHarness·storyOntology 산식), M10 마진 모델, `--sx-stage-*`, 기존 4매체 라벨·포맷.

## 5. TDD
- 새 순수 로직은 테스트 먼저.
  - `mediaProjection.test.ts` — academic 투영이 핵심 4요소 보존 + academic 필드 존재.
  - `qualityGates.test.ts` — academic 트랙 게이트가 academic 매체에서만 노출, 기존 매체엔 영향 0.
  - projectBlueprint — academic blueprint 생성 스모크.
- 기존 234 tests 불변.

## 6. 검증 게이트 (Definition of Done)
```
npx tsc --noEmit   → exit 0
npm test           → 38+ files / 234+ tests 통과 (기존 불변 + 신규)
npm run build      → 성공
```
수동(코드 보장): 홈 매체 선택에 "사회과학/학술" 노출 → 선택 → 에디터 진입 → academic이면 좌레일에 Introduction-Literature-Method-Discussion-Conclusion 구조. 기존 4매체 정상. console error 0.

## 7. 보고 (§형식)
1. 변경/신설 파일.
2. academic 매체가 5곳(blueprint·gates·projection·desk·interview)에 어떻게 배선됐는지.
3. 게이트 placeholder가 A2~A4를 어떻게 비워뒀는지.
4. 검증 3종 실제 출력.
5. 남은 위험·이월.
6. 커밋하지 말 것 — Claude가 검증 후 커밋.
