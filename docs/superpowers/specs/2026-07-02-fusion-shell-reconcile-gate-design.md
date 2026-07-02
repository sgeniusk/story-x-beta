# 융합 셸 슬라이스 B-2 — reconcile 충돌 게이트 설계

<!-- ⟳최신화가 즉시 append 하던 것을, working 새 캐논/회차가 본편과 모순이면 검토 다이얼로그(retcon 교체/버리기)를 먼저 띄우는 무거운 게이트. 충돌 0이면 현행 즉시 반영 유지(player-first). -->

> 작성 2026-07-02 · 상태 `draft` · 근거 목업 `sync-console.html` "⟳최신화 검토" 패널 + handoff 2026-06-30 2차 line 172 "무거운 캐논 검토 게이트" + 사용자 결정(충돌 게이트 중심). 선행 슬라이스 B spec `docs/superpowers/specs/2026-07-02-fusion-shell-sync-console-design.md`.

## 0. 한 문장

슬라이스 B의 `⟳최신화`가 무조건 append 머지하던 것을, working 의 새 캐논/회차가 본편(committed) 캐논과 **모순이면 검토 다이얼로그**(충돌 카드 · retcon 교체/버리기)를 먼저 띄우고, **충돌 0이면 현행대로 즉시 반영**(player-first)하는 승인형 게이트로 만든다.

## 1. 범위

**한다** — 순수 `deriveReconcilePlan`(working↔committed 충돌 감지) · 순수 `applyReconcile`(retcon + 충돌 제외 append) · `ReconcileReview.tsx`(충돌 카드 + retcon/keep 토글) · App reconcileSync 분기(충돌 0=즉시·충돌≥1=다이얼로그).

**안 한다** — 미반영 회차/캐논 **항목별** 승인(회차는 그대로 자동 append=최소 몽타주) · PLAN staged · 의미 중복 dedup(LLM) · retcon 예산 상한 · 충돌 이력 로그.

## 2. 설계 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 게이트 조건 | 충돌 0 → 즉시 append(현행) · 충돌 ≥1 → 다이얼로그 | 대부분 최신화는 매끄럽게(player-first). 무거운 검토는 충돌 있을 때만 |
| D2 충돌 감지 | `classifyCanonChange`(committed 캐논 contract) 재사용 — working 새 캐논 statement + 미반영 회차 prose 검사 | playRuntimeValidator 의 `buildBandContract`·`firstConflictLayer` 재사용(새 대립 로직 0) |
| D3 충돌 처리 | retcon(옛 캐논 교체) / keep(옛 것 유지·새 것 버림) | 응결 스튜디오 retcon 경로(`buildRetconUpdates`·`applyRetcons`) 그대로. 기본=keep(승인형 안전) |
| D4 비충돌은 자동 | 충돌 아닌 회차/캐논은 항목 검토 없이 append | 최소 몽타주(MVP-2 원칙) — 굳힐 것만 결정, 나머지 자동 |

## 3. 아키텍처

### 3.1 순수 로직

**`deriveReconcilePlan`** — `src/lib/playRuntimeValidator.ts`(buildBandContract 있는 곳).
```ts
export interface ReconcilePlan { conflicts: DeviationConflict[]; }
export function deriveReconcilePlan(working: SeriesProject, committed: SeriesProject): ReconcilePlan;
```
- committed 캐논으로 `buildBandContract` → contract.
- 검사 대상 = working 의 **미반영**(committed id 에 없는) 캐논 statement + 미반영 회차 prose 세그먼트(`parseSceneSegments` 또는 문장 분할).
- `firstConflictLayer`(벗긴 변형 포함)로 대립 판정. hard-canon/living-state 대립이면 `DeviationConflict{ id, factId(committed 옛 fact), band, newClaim(working 텍스트), oldCanon }`.
- id 는 `reconcile-c${index}`. factId 없으면(교체 대상 없음) 제외(retcon 불가).

**`applyReconcile`** — `src/lib/syncConsole.ts`(reconcile 홈).
```ts
export function applyReconcile(
  working: SeriesProject,
  committed: SeriesProject,
  conflicts: DeviationConflict[],
  decisions: Record<string, 'keep' | 'retcon'>
): SeriesProject;
```
- `buildRetconUpdates(conflicts, decisions)` → `applyRetcons(committed, updates)` = base(옛 캐논 교체).
- 충돌 캐논 statement(newClaim)에 해당하는 working canonFact 는 append 제외(retcon 으로 반영됐거나 keep 으로 버림) — 충돌 newClaim 집합으로 working.canonFacts 필터.
- `reconcileWorkingIntoCommitted(workingSansConflictCanon, base)` = 비충돌 회차/캐논 append.
- committed 불변.

### 3.2 `ReconcileReview.tsx` (신규 순수)

```ts
interface ReconcileReviewProps {
  conflicts: DeviationConflict[];
  decisions: Record<string, 'keep' | 'retcon'>;
  onToggle: (id: string, decision: 'keep' | 'retcon') => void;
  onApprove: () => void;
  onCancel: () => void;
}
```
- 충돌 카드마다 `옛 정본(oldCanon) ↔ 새 주장(newClaim)` + [교체(retcon)][유지(keep)] 토글. 기본 keep(활성 안 함). DeviationReview retcon 카드 톤(`.dx-*` 또는 신규 `.rc-*`).
- 하단 "최신화 반영"(onApprove) · "취소"(onCancel). 충돌 요약(anchor/major 카운트).

### 3.3 App 배선

- state `reconcilePlan: ReconcilePlan | null`(다이얼로그 표시) · `reconcileDecisions: Record<string,'keep'|'retcon'>`.
- `reconcileSync` 수정 —
  ```
  const working = loadDiveState()?.project; if (!working) return;
  const committed = loadProject();
  const plan = deriveReconcilePlan(working, committed);
  if (plan.conflicts.length === 0) { commitReconciled(reconcileWorkingIntoCommitted(working, committed)); return; }
  setReconcilePlan(plan); setReconcileDecisions({});
  ```
- 다이얼로그 승인 `confirmReconcile()` — `commitReconciled(applyReconcile(working, committed, plan.conflicts, decisions))` + `setReconcilePlan(null)`.
- 취소 — `setReconcilePlan(null)`(최신화 안 함, staged 유지).
- `commitReconciled(next)` 헬퍼 — `saveProject(next) · setPendingSync(0) · setSyncVersion(v=>v+1)`(현행 reconcileSync 로직 추출).
- `ReconcileReview` 를 editor·dive 렌더에 오버레이(`reconcilePlan &&`).

## 4. 데이터 흐름

```
⟳최신화 → deriveReconcilePlan(working, committed)
  충돌 0 → reconcileWorkingIntoCommitted 즉시 커밋(현행)
  충돌 ≥1 → ReconcileReview 다이얼로그
              교체(retcon) → applyRetcons(committed 옛 캐논 → newClaim)
              유지(keep)   → committed 옛 캐논 유지, working 새 캐논 버림
              승인 → applyReconcile(충돌 제외 append + retcon) → 커밋
              취소 → staged 유지(최신화 안 함)
```

## 5. 테스트 계획 (TDD)

**`playRuntimeValidator.test.ts` (+deriveReconcilePlan)** — 충돌 없으면 `conflicts:[]` · working 새 캐논이 committed 앵커와 모순(생사/반의어)이면 conflict 1(factId=committed 옛 fact·oldCanon·newClaim) · 미반영 회차 prose 모순도 감지 · factId 없는 대립은 제외.

**`syncConsole.test.ts` (+applyReconcile)** — retcon 결정 → committed 옛 캐논 statement 교체 + 그 충돌 캐논 append 안 함 · keep 결정 → committed 유지 + working 충돌 캐논 버림 · 비충돌 회차/캐논은 append · committed 불변.

**`reconcileReview` 컴포넌트 (신규 · react-dom 스모크)** — 충돌 카드 렌더(oldCanon·newClaim) · 토글 data 속성 · 승인/취소 버튼.

**런칭 게이트(라이브)** — 충돌 없는 최신화는 즉시 반영(다이얼로그 안 뜸) · 충돌 있는 최신화는 다이얼로그 → retcon 시 본편 캐논 교체·모순 공존 0 · keep 시 본편 유지·working 새 것 안 들어옴 · 취소 시 staged 유지 · 콘솔 0.

## 6. 리스크 + 대응

- **충돌 감지 진입점 차이** → deriveDeviationCandidates(session 기반)와 별개. working↔committed 진입점 신규 함수. buildBandContract·firstConflictLayer 재사용(대립 로직 무변경).
- **충돌 캐논 이중 반영** → applyReconcile 이 충돌 newClaim 집합으로 working append 제외. retcon 은 committed 제자리 교체(공존 방지, retcon 경로 불변식 계승).
- **player-first 훼손** → 충돌 0 이면 다이얼로그 안 뜸(현행 즉시 반영). 무거운 검토는 충돌 있을 때만.
- **큰 파일(App)** → 표면 배선만(state 2개·헬퍼·다이얼로그 오버레이). reconcileSync 분기. 매 편집 tsc.

## 7. 파일 영향

| 파일 | 변경 |
|---|---|
| `src/lib/playRuntimeValidator.ts` | `deriveReconcilePlan` + `ReconcilePlan` |
| `src/lib/playRuntimeValidator.test.ts` | +deriveReconcilePlan TDD |
| `src/lib/syncConsole.ts` | `applyReconcile` |
| `src/lib/syncConsole.test.ts` | +applyReconcile TDD |
| `src/components/ReconcileReview.tsx` | **신규** 충돌 카드 다이얼로그(순수) |
| `src/components/reconcileReview.test.ts` | **신규** 스모크 |
| `src/App.tsx` | reconcilePlan·decisions state · reconcileSync 분기 · commitReconciled · 다이얼로그 오버레이 |
| `src/styles.css` | `.rc-*` 다이얼로그 CSS |

## 8. 완료 기준

- `npm test` 녹색 · `npm run build` 성공.
- 런칭 게이트(§5) — 충돌 0 즉시 반영 · 충돌 시 다이얼로그 retcon/keep/취소 · 모순 공존 0 · 콘솔 0.
- progress/handoff 갱신.
- **범위 밖** — 회차 항목별 승인 · PLAN staged · 의미 dedup · retcon 예산.
