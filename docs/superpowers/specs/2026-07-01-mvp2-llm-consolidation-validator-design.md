# 슬라이스 B — LLM 응결 검증기 설계

<!-- 결정론 런타임 검증기가 놓친 다중 턴·의미적 모순을, 응결 승인 전 opt-in LLM 대조로 잡는 조각. 코드 착수 근거. -->

> 작성 2026-07-01 · 상태 `draft` · 정본 근거 [`docs/research/2026-06-30-canon-governance.md`](../../research/2026-06-30-canon-governance.md) §7(Consolidation Validator)·§12.2(ConStory 4단) · 선행 [MVP-2 응결 스튜디오 A-i](2026-07-01-mvp2-consolidation-studio-design.md).

## 0. 한 문장

응결 승인 다이얼로그에 opt-in "🔍 정밀 검토" 버튼을 두어, 응결된 본문을 기존 캐논과 LLM으로 pairwise 대조해 결정론이 놓친 모순을 경고 카드로 드러내고, 플레이어가 그걸 보고 승인/거절을 결정한다.

## 1. 범위

**한다 (슬라이스 B)**
- 새 LLM 엔드포인트 `dive-consolidate`(storyx.mjs 커맨드 + vite 브리지 + diveClient 래퍼).
- 순수 findings 정규화(견고 파싱·필터).
- approve 다이얼로그에 "정밀 검토" 버튼 + 로딩 + findings 경고 카드.

**안 한다 (후속)**
- per-finding 자동 수정·retcon(🔴 충돌을 캐논으로 되돌리기).
- missed-reveal 탐지·의미 dedup(문자열 dedup은 A-i에 있음).
- 자동 실행(응결마다 강제 LLM — player-first로 opt-in만).
- ArcDigest/Growth/Relation Snapshot.

## 2. 설계 결정 (brainstorming 확정 · 2026-07-01)

| # | 결정 | 근거 |
|---|---|---|
| D1 실행 시점 | **opt-in "정밀 검토" 버튼**(응결 자동 아님) | 정본 §7 "응결 무겁게"라도 매 응결 강제 LLM은 player-first 훼손 · 이미 느린 응결에 호출 2배 |
| D2 검사 범위 | **모순만**(본문↔캐논·본문 내부) | ConStory dominant 실패=Factual/Timeline · missed-reveal·의미 dedup은 후속 |
| D3 결과 처리 | 경고 카드 표시 → 플레이어 승인/거절 게이트 | per-finding 자동수정·retcon은 별도 슬라이스 · 정보로 승인 결정을 돕는다 |
| D4 브리지 | 기존 `storyxBridge`+storyx.mjs 커맨드 패턴 재사용 | dive-condense와 동형 · 새 인프라 0 |

## 3. 아키텍처

### 3.1 LLM 엔드포인트 — `tools/storyx.mjs` `dive-consolidate` 커맨드

`dive-condense`와 동형(프롬프트·mock·codex/claude·JSON 파싱). 입력 플래그 `--prose`·`--context`. 프롬프트 골자.

```
당신은 연속성 감수자입니다. 아래 [회차 본문]이 [기존 캐논]과, 또는 본문 내부에서 모순되는 곳만 찾으세요.
의도적 복선·나중에 회수될 반전은 모순이 아닙니다(회수 약속이 보이면 제외). 확정된 사실을 명시적으로 뒤집는 것만 모순입니다.
## 회차 본문
{prose}
## 기존 캐논 (모순 대상)
{context}
## 출력 — JSON 객체 하나만. 코드펜스 금지.
{ "findings": [{ "claim": "본문 속 모순 주장", "conflictsWith": "충돌하는 기존 캐논/본문 문장", "evidence": "왜 모순인지 한 줄", "severity": "high|low" }] }
```

- mock 폴백 — `{ findings: [] }`(안전 기본). codex/claude 경로는 `dive-condense`와 동일한 runProviderWithRetry·parseProviderJson·looksLikeProviderError 재사용.
- 출력 정규화 — `findings`가 배열이 아니면 `[]`.

### 3.2 vite 브리지 + 클라이언트

- `vite.config.ts` — `storyxBridge('/api/dive-consolidate', (input) => ['tools/storyx.mjs','dive-consolidate','--provider','codex','--prose',String(input.prose ?? ''),'--context',String(input.context ?? '')])`.
- `src/lib/diveClient.ts` — 타입 + 래퍼.

```ts
export interface ConsolidationFinding {
  claim: string;
  conflictsWith: string;
  evidence: string;
  severity: 'high' | 'low';
}
export interface DiveConsolidateRequest { prose: string; context: string; }
export interface DiveConsolidateResponse { status: string; findings: ConsolidationFinding[]; warning?: string; }

export function normalizeFindings(raw: unknown): ConsolidationFinding[];   // 견고 파싱·필터(순수, export)
export async function requestDiveConsolidate(req: DiveConsolidateRequest): Promise<DiveConsolidateResponse>;
```

- `normalizeFindings` — 배열 아니면 `[]`. 각 항목 — claim/conflictsWith/evidence는 string 강제(비면 스킵), severity는 `'high'|'low'`만(그 외 `'low'`). `requestDiveProposals`의 방어적 정규화와 동형.

### 3.3 UI — `DiveDesk.tsx` approve 다이얼로그

- state — `findings: ConsolidationFinding[] | null`(null=미검토), `reviewing: boolean`.
- approve 다이얼로그(DeviationReview 아래)에 **"🔍 정밀 검토" 버튼**. onClick → `reviewing=true` → `requestDiveConsolidate({ prose: pending.prose, context: buildProjectContextDigest(project) })` → `setFindings(res.findings)` → `reviewing=false`. 실패 시 `findings=[]`(안전).
- findings 렌더 — 새 프레젠테이션 컴포넌트 `ConsolidationFindings.tsx`(순수). `high`=🔴, `low`=🟡, claim↔conflictsWith·evidence. findings가 빈 배열이면 "모순 없음 ✓".
- 응결 취소/승인/거절 시 `findings=null`·`reviewing=false` 초기화.
- 전부 `.dx-*` 다크 스코프.

### 3.4 데이터 흐름

```
approve 다이얼로그 열림(pending)
  → [🔍 정밀 검토] 클릭 → reviewing=true
  → requestDiveConsolidate(pending.prose, digest) → findings
  → ConsolidationFindings 카드 렌더(high 🔴 / low 🟡 / 없으면 ✓)
  → 플레이어가 보고 승인 또는 거절(재응결)
```

## 4. 테스트 계획 (TDD — 테스트 먼저)

**`diveClient.test.ts`**
- `normalizeFindings` — 배열 아닌 입력 → `[]` · 잘린 항목 스킵 · severity 이상치 → `'low'`.
- `requestDiveConsolidate` — `/api/dive-consolidate`에 POST · findings 통과 · 실패/빈 응답 안전(`[]`).

**`consolidationFindings.test.ts` (신규 컴포넌트)**
- high/low 카드 렌더(🔴/🟡·claim·evidence) · 빈 findings → "모순 없음" · null 미검토 → 렌더 안 함.

**`diveDesk.test.ts`**
- pending 다이얼로그에 "정밀 검토" 버튼 렌더(회귀).

**런칭 게이트** — mock/실패 응답에도 크래시 0(빈 findings) · high 모순은 카드로 노출 · 정밀 검토는 opt-in(자동 호출 0).

## 5. 리스크 + 대응

- **codex 지연(수십 초)** → opt-in이라 플레이어가 대기를 감수하고 누름 · `reviewing` 로딩 표시 · diveClient 타임아웃(기존 120초) 재사용.
- **LLM 위양성(의도적 복선을 모순으로)** → 프롬프트에 "회수 약속 보이면 제외"(정본 §12.1 원리) 명시 · 결과는 경고일 뿐 강제 차단 아님(플레이어 판단).
- **결과 스키마 흔들림** → `normalizeFindings` 견고 파싱(문자열 강제·severity 화이트리스트).
- **비용** → opt-in + 회차 단위 1회. 매 턴 아님.

## 6. 파일 영향

| 파일 | 변경 |
|---|---|
| `tools/storyx.mjs` | `dive-consolidate` 커맨드(프롬프트·mock·codex) |
| `vite.config.ts` | `storyxBridge('/api/dive-consolidate', …)` |
| `src/lib/diveClient.ts` | 타입 + `normalizeFindings` + `requestDiveConsolidate` |
| `src/lib/diveClient.test.ts` | 정규화·요청 TDD |
| `src/components/ConsolidationFindings.tsx` | **신규** 경고 카드(순수) |
| `src/components/consolidationFindings.test.ts` | **신규** 렌더 TDD |
| `src/components/DiveDesk.tsx` | 정밀 검토 버튼·findings state·카드 배선 |
| `src/components/diveDesk.test.ts` | 버튼 렌더 회귀 |
| `src/styles.css` | `.dx-findings`·`.dx-finding` CSS |

## 7. 완료 기준 (Definition of Done)

- `npm test` 전체 녹색 · `npm run build`(tsc+vite) 성공.
- 런칭 게이트 — 정밀 검토 opt-in(자동 0) · mock/실패에도 크래시 0 · high 모순 카드 노출.
- 라이브 — approve에서 "정밀 검토" → (codex 또는 mock) findings 렌더, 콘솔 0. codex 지연은 코드 경로를 단위 테스트로 커버.
- `progress.md`·`session-handoff.md` 갱신.
- **범위 밖(후속)** — per-finding 수정·retcon · missed-reveal/의미 dedup · 자동 실행.
