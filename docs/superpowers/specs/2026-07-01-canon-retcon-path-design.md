# 🔴 retcon 경로 설계

<!-- 응결 스튜디오에서 정보로만 보이던 캐논 충돌을, 플레이어가 명시적으로 '정본 교체(retcon)'할 수 있게 만드는 조각. -->

> 작성 2026-07-01 · 상태 `draft` · 정본 근거 [`docs/research/2026-06-30-canon-governance.md`](../../research/2026-06-30-canon-governance.md) §5(재해석↔모순)·§7·§9(retcon budget) · 선행 [MVP-2 응결 스튜디오 A-i](2026-07-01-mvp2-consolidation-studio-design.md).

## 0. 한 문장

응결 스튜디오에서 카운트 배너로만 보이던 🔴/🟡 충돌을, `새 주장 ↔ 옛 정본` retcon 카드로 올려 플레이어가 **정본 교체(retcon)** 또는 **버리기(기본)** 를 고르게 하고, retcon은 옛 캐논 fact의 statement를 제자리 교체한다.

## 1. 범위

**한다** — 충돌을 retcon 카드로 표시 · retcon/버리기 결정 · retcon 시 옛 fact statement 제자리 교체(factId·importance·reveal 보존) · 응결 커밋에 반영.

**안 한다 (후속)** — retcon 예산 상한(§9)·옛 fact 삭제(교체만)·retcon 이력 로그·관계 스냅샷·LLM 검증기가 찾은 finding의 retcon(그건 슬라이스 B finding 경로, 별도).

## 2. 설계 결정 (2026-07-01)

| # | 결정 | 근거 |
|---|---|---|
| D1 표면 | 응결 approve 다이얼로그(DeviationReview)에 retcon 카드 | 정본 §7 무거운 결정은 응결 · 배너를 actionable로 승격 |
| D2 메커니즘 | 옛 fact statement 제자리 교체(factId 유지) | 모순 두 캐논 공존 방지 · importance/reveal/앵커성 보존 |
| D3 기본 | 버리기(현행 유지, blocksCanonization 제외) · retcon은 명시 액션만 | 승인형(§9) · 실수로 정본 뒤집기 방지 |

## 3. 아키텍처

### 3.1 `playRuntimeValidator.ts` — 충돌 목록 + 순수 헬퍼

```ts
export interface DeviationConflict {
  id: string;        // `${messageId}-c${i}` 안정 키
  factId: string;
  band: 'anchor' | 'major';
  newClaim: string;  // 충돌한 답 세그먼트(snippet)
  oldCanon: string;  // 뒤집힌 기존 캐논(factStatement)
}
```

- `ConsolidationDeviations`에 `conflicts: DeviationConflict[]` 추가(`conflictCounts`는 하위호환 유지).
- `deriveDeviationCandidates` — 응결 span의 `verdict.conflicts`를 `DeviationConflict[]`로 수집(id=`${m.id}-c${i}`). `factId` 빈 충돌은 retcon 대상 불가라 제외(교체할 fact가 없음).
- `buildRetconUpdates(conflicts, decisions: Record<string, 'keep' | 'retcon'>): Array<{ factId: string; statement: string }>` — retcon 결정된 것만 `{factId, statement:newClaim}`. 순수.

### 3.2 `storyEngine.ts` — retcon 적용(순수)

```ts
export function applyRetcons(
  project: SeriesProject,
  updates: Array<{ factId: string; statement: string }>
): SeriesProject;
```

- `project.canonFacts`를 map — `factId` 일치 fact의 `statement`를 새 값으로 교체(그 외 필드·순서 보존). 일치 없으면 무시. 새 객체 반환(불변).

### 3.3 UI — `DeviationReview.tsx`

- props 추가 — `retconDecisions: Record<string, 'keep' | 'retcon'>`, `onRetconToggle: (id: string) => void`.
- `conflicts.length > 0`이면 배너 대신 **retcon 목록** — 카드마다 `새 주장` / `↔ 옛 정본` + 토글 버튼(`정본 교체`↔`교체됨`). retcon 선택 시 경고색.
- 충돌 없으면 기존과 동일(surprises만). `conflicts`가 빈 배열이면 배너/목록 없음.

### 3.4 `DiveDesk.tsx`

- state `retconDecisions: Record<string,'keep'|'retcon'>`. approve():
  - `const retcons = buildRetconUpdates(deviations.conflicts, retconDecisions)`
  - `const base = applyRetcons(project, retcons)` → 이 `base`로 `chapterFromDraftPayload(base, { ...payload, newCanonFacts:[...pending.newCanonFacts, ...promoted] }, request)`.
- 닫기(승인/거절)에서 `retconDecisions` 초기화.

## 4. 데이터 흐름

```
condense → deviations.conflicts (factId 있는 충돌만)
approve:
  retcons = buildRetconUpdates(conflicts, retconDecisions)   // retcon 결정만
  base = applyRetcons(project, retcons)                       // 옛 fact statement 교체
  chapterFromDraftPayload(base, payload+promoted, request)    // 갱신된 캐논 위에 커밋
```

## 5. 테스트 계획 (TDD)

**`playRuntimeValidator.test.ts`** — `deriveDeviationCandidates`가 conflicts 목록 채움(id·factId·newClaim·oldCanon) · factId 빈 충돌 제외 · `buildRetconUpdates`가 retcon 결정만 `{factId,statement}`로.

**`storyEngine.test.ts`** — `applyRetcons`가 factId 일치 fact statement 교체·그 외 보존·불일치 무시·불변(원본 미변).

**`deviationReview.test.ts`** — conflicts 있으면 retcon 카드(새 주장·옛 정본) 렌더 · retcon 토글 상태 반영.

**런칭 게이트** — 버리기(기본)면 캐논 불변 · retcon만 옛 fact 교체 · retcon 후 모순되는 두 캐논 공존 0.

## 6. 리스크

- **정본 뒤집기 비가역** → 기본 버리기·명시 액션만·retcon 카드에 경고색. 예산 상한은 후속.
- **factId 없는 충돌** → 교체 대상 없음 → retcon 목록에서 제외(derive에서 필터).
- **importance 재계산** → statement만 교체, importance는 기존 유지(normalize가 필요 시 후속 보정).

## 7. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/lib/playRuntimeValidator.ts` | `DeviationConflict`·conflicts 수집·`buildRetconUpdates` |
| `src/lib/storyEngine.ts` | `applyRetcons` |
| `src/components/DeviationReview.tsx` | retcon 카드·props |
| `src/components/DiveDesk.tsx` | retconDecisions state·approve 적용 |
| `src/styles.css` | retcon 카드 CSS |
| 각 `*.test.ts` | TDD |

## 8. 완료 기준

- `npm test` 녹색 · `npm run build` 성공 · 런칭 게이트 통과 · progress/handoff 갱신.
- **범위 밖** — 예산 상한·fact 삭제·이력 로그·finding retcon.
