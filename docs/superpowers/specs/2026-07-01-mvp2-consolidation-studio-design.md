# MVP-2 응결 스튜디오 (슬라이스 A-i) — 설계

<!-- MVP-1 PLAY 검증기가 매 턴 쌓는 ✦ 의외 전개 후보를, 응결 순간에 캐논 결정으로 닫는 첫 조각. 코드 착수 근거. -->

> 작성 2026-07-01 · 상태 `draft` · 정본 근거 [`docs/research/2026-06-30-canon-governance.md`](../../research/2026-06-30-canon-governance.md) §7(Consolidation Validator)·§8(MVP-2)·§13(Q2 최소 몽타주) · 선행 [MVP-1 PLAY 거버넌스](2026-07-01-mvp1-play-runtime-governance-design.md).

## 0. 한 문장

MVP-1이 매 턴 표시한 ✦ 의외 전개 후보가 응결하면 증발하던 것을, **응결 승인 다이얼로그를 스튜디오로 올려** 후보마다 승격/수정/넘기기 결정을 받고 승격만 캐논으로 굳힌다.

## 1. 범위

**한다 (슬라이스 A-i)**
- 응결 span의 verdict에서 `DeviationCandidate` 도출(순수).
- 승인 다이얼로그에 ✦ 후보 카드 섹션 + 🔴/🟡 충돌 정보 배너.
- 후보당 결정 — 승격 / 수정 후 승격 / 넘기기.
- 승격 → `payload.newCanonFacts`에 얹어 함께 커밋(LLM 추출과 dedup).

**안 한다 (후속)**
- 🔴 retcon 경로(충돌을 캐논으로 되돌리기) — 이번엔 정보 표시만.
- LLM 응결 검증기(ConStory 4단 재추출, 슬라이스 B).
- ArcDigest · Growth Ledger · Relation Snapshot 갱신(정본 §8 나머지).
- LLM newCanonFacts 자체를 per-item 리뷰(자동 커밋 유지 — 최소 몽타주).

## 2. 설계 결정 (brainstorming 확정 · 2026-07-01)

| # | 결정 | 근거 |
|---|---|---|
| D1 후보 구성 | ✦만 결정 대상 · 🔴/🟡는 정보 배너 · LLM 추출 자동 | 정본 §13 Q2 "캐논 승인은 최소 몽타주" — 깨끗한 추출까지 리뷰시키면 몰입형이 승인 노동 |
| D2 결정 세트 | 승격 / 수정 후 승격 / 넘기기(기본) | 아직 캐논 아닌 ✦엔 이번만/거부가 넘기기와 동일 — 4종은 🔴 retcon 경로(후속)에서 의미 |
| D3 승격 경로 | `payload.newCanonFacts`에 얹어 기존 커밋 재사용 | reveal 기본 revealed(disclosed 반전에 정확)·importance/participants는 normalize 백필. 시그니처 무변경 |
| D4 표면 | 기존 approve 다이얼로그 업그레이드 | approve()가 곧 응결 순간 — 별도 표면 불필요 |

## 3. 아키텍처

### 3.1 후보 도출 — `playRuntimeValidator.ts`에 추가(순수)

```ts
export interface DeviationCandidate {
  id: string;          // 안정 키 (메시지 id + 인덱스)
  snippet: string;     // ✦ 세그먼트 원문(승격 statement 초안)
  relatedThread?: string;
}
export interface ConsolidationDeviations {
  surprises: DeviationCandidate[];
  conflictCounts: { anchor: number; major: number };
}

// 응결 대상 span의 메시지 verdict에서 결정 대상(✦)과 충돌 카운트를 모은다.
export function deriveDeviationCandidates(session: DiveSession): ConsolidationDeviations;
```

- 내부에서 `selectCondenseSpan(session).condense`(응결 대상 턴만, transcript와 동일 span)를 계산. 각 메시지 `verdict.surpriseCandidates` → `DeviationCandidate`(id=`${m.id}-s${i}`), `verdict.conflicts`의 band별 카운트 합산.
- 순수 — 부수효과 0, TDD 대상. `DiveSession`·`selectCondenseSpan`을 diveSession에서 import(타입 순환 아님 — diveSession→validator는 type-only 유지).

### 3.2 승격 dedup — `playRuntimeValidator.ts`에 추가(순수)

```ts
// 이미 LLM이 뽑은 캐논과 겹치지 않는 승격 후보의 statement만 남긴다.
export function dedupePromotions(
  promotedStatements: string[],
  existing: Array<{ statement: string }>
): string[];
```

- 정규화(trim·공백 축약) 후 **포함 매칭** — 승격 스니펫이 기존 statement에 포함되거나 그 역이면 중복으로 간주해 제외.
- 의미 중복(다른 표현·같은 사실)은 LLM 없이 못 잡음 → 후속. 이번엔 문자열 근접만. 플레이어가 겹치는 ✦를 직접 넘기기로 처리 가능해 무해.

### 3.3 UI — `DiveDesk.tsx` approve 다이얼로그 업그레이드

- 컴포넌트 상태 — 응결(`condense`) 성공 시 `deriveDeviationCandidates(session)` 계산해 `deviations` state 저장(내부에서 transcript와 같은 span 사용). 후보별 결정 map `decisions: Record<id, 'skip'|'promote'>` + 수정 텍스트 map `edits: Record<id, string>`(기본 snippet, 편집 시 갱신). 기본 결정 = skip(최소 몽타주 — 굳힐 것만 탭).
- `pending` 다이얼로그 안에 **의외 전개 섹션** 추가.
  - 🔴/🟡 카운트 > 0 이면 상단 정보 배너 — "이번 응결에서 정본 충돌 N건은 캐논에서 빠졌습니다."(retcon 후속). "충돌은 드러낸다" 충족.
  - ✦ 후보 카드 목록 — 각 카드 = 편집 가능한 statement(input) + 승격 토글. relatedThread 있으면 작은 라벨.
- `approve()` 변경 — 승격(`decisions[id]==='promote'`)한 카드의 `edits[id]`(없으면 snippet)를 모아 `dedupePromotions(promoted, payload.newCanonFacts)` → `{ owner:'plot', statement }`로 매핑해 `payload.newCanonFacts`에 concat → 기존 `chapterFromDraftPayload` 흐름 그대로. 승격 0이면 현행과 동일.
- 응결 취소(`setPending(null)`)·거절 시 `deviations`도 초기화.
- 전부 `.dx-*` 다크 스코프.

### 3.4 데이터 흐름

```
condense() 성공 → pending 세팅 + deviations = deriveDeviationCandidates(session)
approve():
  promoted = deviations.surprises.filter(c => decisions[c.id]==='promote')
                       .map(c => edits[c.id] ?? c.snippet)
  fresh = dedupePromotions(promoted, pending.newCanonFacts)
  payload.newCanonFacts += fresh.map(s => ({ owner:'plot', statement:s }))
  chapterFromDraftPayload(project, payload, request) → commit (normalize가 importance/reveal 백필)
```

## 4. 테스트 계획 (TDD — 테스트 먼저)

**`playRuntimeValidator.test.ts` (도출·dedup)**
- `deriveDeviationCandidates` — verdict의 surprise → 후보(안정 id)·conflict band → 카운트. 응결 span 밖 메시지 무시.
- verdict 없는(구버전) 메시지 섞여도 안전.
- `dedupePromotions` — 기존 statement에 포함되는 승격은 제외 · 무관한 승격은 유지 · 정규화(공백) 매칭.

**`diveDesk.test.ts` (렌더·커밋)**
- pending + deviations 있으면 ✦ 카드 렌더 · 🔴 카운트 배너.
- (렌더 계약) 승격 토글된 카드 statement가 다이얼로그에 노출.

**`storyEngine.test.ts` 또는 통합**
- 승격 스니펫이 `payload.newCanonFacts`에 얹혀 커밋되면 `project.canonFacts`에 reveal=revealed(기본)로 등장 · 넘긴 ✦는 canon 0.

**런칭 게이트** — 넘긴 ✦는 캐논 0, 승격만 등록. dedup으로 LLM 팩트와 중복 캐논 0.

## 5. 리스크 + 대응

- **의미 중복 미탐** → 문자열 dedup만이라 다른 표현의 같은 사실은 이중 등록 가능. 플레이어가 넘기기로 처리 가능·후속 LLM 응결 검증기가 정리. 무해 표시.
- **스니펫이 prose-y** → 1인칭·구어 스니펫이 캐논 문장으로 거칠 수 있음. **수정** 액션이 그 해소. 기본 skip이라 강제 아님.
- **최소 몽타주 훼손** → 기본 결정 skip·굳힐 것만 탭. 카드가 많아도 무결정 통과 가능.
- **owner 고정 'plot'** → 인물 반전이 plot로 분류될 수 있음. normalize의 인물 승격 경로가 이후 교정. 최소 슬라이스라 수용.

## 6. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/lib/playRuntimeValidator.ts` | `deriveDeviationCandidates`·`dedupePromotions`·타입 추가 |
| `src/lib/playRuntimeValidator.test.ts` | 도출·dedup TDD |
| `src/components/DiveDesk.tsx` | deviations state·✦ 카드 섹션·🔴 배너·approve 승격 배선 |
| `src/components/diveDesk.test.ts` | ✦ 카드·배너·승격 렌더 TDD |
| `src/styles.css` | `.dx-devcard`·`.dx-devbanner` 등 스튜디오 CSS |

## 7. 완료 기준 (Definition of Done)

- `npm test` 전체 녹색 · `npm run build`(tsc+vite) 성공.
- 런칭 게이트 — 넘긴 ✦ 캐논 0 · 승격 ✦만 reveal=revealed로 등록 · dedup 중복 0.
- 라이브 — 응결 시 ✦ 카드·🔴 배너 렌더, 승격 후 캐논 뷰에 등장, 콘솔 0.
- `progress.md`·`session-handoff.md` 갱신.
- **범위 밖(후속)** — 🔴 retcon · LLM 응결 검증기(B) · ArcDigest/Growth/Relation Snapshot.
