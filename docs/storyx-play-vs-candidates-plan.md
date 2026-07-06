# PLAY 전개 후보(VS) — 설계·구현 spec

PLAY "이어 굴리기"(DiveDesk)에서 다음 전개 후보 N개를 의외도와 함께 펼쳐, 사람이 긴장·의외를 직접 고르는 슬라이스. 흡인력 축 후속(리서치 `docs/research/2026-07-05-compellingness-human-ai.md` — Verbalized Sampling: 서프라이즈는 모델·프롬프트가 아니라 "후보를 펼쳐 사람이 고르는 구조"로 넘긴다).

데이터 계층은 이미 있고 WRITE가 쓰는 걸 그대로 재사용한다. 이 슬라이스는 **PLAY 표면(UI + 입력 조립)** 만 새로 짓는다.

## 확정된 결정 (brainstorming 합의)

- **의외도 표현** — 3칸 게이지 막대. 확률 숫자 비노출. rarity → 막대 채움(common 1칸 회색 · surprising 2칸 앰버 · radical 3칸 빨강).
- **트리거** — 명시 버튼 opt-in. 하단 컴포저에 「✦ 전개 후보」 버튼. 누를 때만 1회 생성. 기존 `res.choices` 가벼운 칩과 공존(대체 아님).
- **선택 후 동작** — 후보 `direction`을 기존 `send()` 괄호 연출로 태운다: `send('(전개 — ' + direction + ')')`. ⏳계속·⏭전개과 같은 계열이라 신규 배관 없음. dive-chat이 그 방향으로 이어감.
- **배치** — 버튼은 컴포저 액션 행 끝. 후보 다발은 컴포저 바로 위(`.dx-choices` 근처).
- **캐논 배지** — `canonSuspect` 후보에 「캐논 확인」 배지(WRITE의 `fc-fork-suspect`와 동일 문구·의미).
- **컴포넌트 경계 (B)** — `<VsCandidatePanel>` 추출. DiveDesk는 상태·fetch 오케스트레이션만, 패널은 props 받는 프레젠테이션. `DeviationReview`·`ConsolidationFindings` 추출 관례와 동일.

## 재사용 (손대지 않음)

- `requestVsCandidates(input)` — `src/lib/vsCandidatesClient.ts`. 이미 `/api/vs-candidates.ts` 브리지로 살아있고 `StoryXDesk.tsx:1008`(WRITE)이 소비 중.
- `normalizeVsCandidates` · `classifyRarity` · `VsRarity` · `VsCandidate{direction, rarity, canonSuspect}` — `src/lib/episodeBriefing.ts`.
- `buildRecentDialogue(session, limit=6)` — `src/lib/diveSession.ts`.
- `send()` 괄호 연출 패턴 · `project.canonFacts`/`medium`/`format` — DiveDesk 안에 이미 있음.

## 데이터 매핑 — `VsCandidatesInput` 조립

WRITE(`StoryXDesk.tsx:1008`)를 미러링하되, PLAY는 "지난 회차 요약"이 아니라 **라이브 대화**를 요약한다는 점만 다르다.

| 필드 | WRITE | PLAY (이 슬라이스) |
|---|---|---|
| `medium` | `blueprint.medium` | `project.medium ?? ''` |
| `format` | `blueprint.format` | `project.format ?? ''` |
| `recentSummary` | 마지막 회차 라벨+본문 slice | `[scene, buildRecentDialogue(session)]` 결합 |
| `unpaidPromises` | rewardArc 디둡(인라인) | `collectUnpaidPromises(project)` **← export 승격** |
| `canonStatements` | `canonFacts.map(f=>f.statement)` | 동일 |
| `contractDigest` | blueprint 계약 | v1 생략(optional) |

`collectUnpaidPromises`는 지금 `episodeBriefing.ts:145`에서 비공개(`function`)다. WRITE가 인라인한 rewardArc 디둡과 **동형**이므로, `export function`으로 올려 PLAY가 재사용한다(중복 로직 방지).

## 새로/바뀌는 코드

1. `src/lib/episodeBriefing.ts`
   - `collectUnpaidPromises` → `export function` 승격.
   - `rarityToBars(rarity: VsRarity): 1|2|3` 신규 export(common 1 · surprising 2 · radical 3). rarity 로직을 한곳에 모음.
2. `src/lib/diveSession.ts`
   - `buildVsCandidatesInput(session, project): VsCandidatesInput` 신규 export(순수 함수 — 위 매핑).
   - `buildPlayDirectionSeed(direction: string): string` 신규 export → `'(전개 — ' + direction.trim() + ')'`.
3. `src/components/VsCandidatePanel.tsx` (신규 파일)
   - props `{ candidates: VsCandidate[]; onPick(direction): void; onDismiss(): void }`.
   - 후보마다 `rarityToBars`로 3칸 막대 렌더 · `canonSuspect` 시 「캐논 확인」 배지 · 클릭 → `onPick(c.direction)`.
4. `src/components/DiveDesk.tsx`
   - 상태 `vsCandidates: VsCandidate[]` · `vsBusy: boolean` · `vsReason: string|null`.
   - `requestCandidates()` — `buildVsCandidatesInput` → `requestVsCandidates` → 결과 set(실패는 `vsReason` 안내로 강등).
   - 컴포저에 「✦ 전개 후보」 버튼(busy·pending 시 disabled).
   - 후보 있으면 컴포저 위에 `<VsCandidatePanel>` 렌더. onPick → `send(buildPlayDirectionSeed(direction))` 후 패널 clear. onDismiss → clear.
5. CSS — `.dx-vs-*`(패널·막대·배지). 기존 `--lc-*`/`--sx-*` 다크 토큰 · `fc-vs-*` 색 관례 참고.

## TDD 순서 (테스트 먼저)

1. `episodeBriefing.test.ts` — `rarityToBars` 세 값 매핑 · `collectUnpaidPromises` export 되어 import·호출 가능.
2. `diveSession.test.ts` — `buildPlayDirectionSeed('도윤이…')` → `'(전개 — 도윤이…)'` · `buildVsCandidatesInput`가 scene+대화로 recentSummary 만들고 canonStatements·unpaidPromises 채움.
3. `vsCandidatePanel.test.ts`(신규) — `<VsCandidatePanel candidates=[…]>`를 `renderToStaticMarkup`으로 렌더 → 3칸 막대 마크업 · rarity별 채움 칸 수 · `canonSuspect`에 「캐논 확인」 배지 · `direction` 텍스트. (경계 B의 순수-프레젠테이션 이점 — 클릭 없이 렌더만으로 검증.)
4. `diveDesk.test.ts` — 「✦ 전개 후보」 버튼이 컴포저에 렌더됨(기존 `renderToStaticMarkup`+`toContain` 스타일). onPick→`send` 상호작용은 위 순수 헬퍼+패널 테스트로 커버(정적 렌더로 클릭 플로우는 검증 범위 밖).

각 단계 red → green. 전체 `npm test` 녹색 + `npm run build` 통과가 완료 기준.

## Non-goals

- `/api/vs-candidates` 브리지·프롬프트 수정(그대로 재사용).
- 기존 `res.choices` 가벼운 칩 제거·변경(공존).
- 자동/매 턴 생성(명시 버튼 opt-in만).
- 흡인력 게이트(critic-reviewer 승격)는 별도 슬라이스.
