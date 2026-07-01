# 슬라이스 B — LLM 응결 검증기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 응결 승인 다이얼로그의 opt-in "정밀 검토" 버튼으로, 응결 본문을 기존 캐논과 LLM으로 대조해 결정론이 놓친 모순을 경고 카드로 드러낸다.

**Architecture:** `dive-condense`와 동형의 `dive-consolidate` LLM 엔드포인트를 storyxBridge 패턴으로 추가하고, findings 정규화는 순수 함수(diveClient), 카드는 프레젠테이션 컴포넌트(ConsolidationFindings)로 TDD, DiveDesk approve 다이얼로그가 조립한다.

**Tech Stack:** TypeScript · Vitest · React(renderToStaticMarkup) · Node CLI(tools/storyx.mjs) · 기존 storyxBridge·diveClient postJson 재사용.

**정본 근거:** `docs/superpowers/specs/2026-07-01-mvp2-llm-consolidation-validator-design.md` · `docs/research/2026-06-30-canon-governance.md` §7·§12.2.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `tools/storyx.mjs` | `dive-consolidate` 커맨드(프롬프트·mock·codex) |
| `vite.config.ts` | `storyxBridge('/api/dive-consolidate', …)` |
| `src/lib/diveClient.ts` | 타입 + `normalizeFindings` + `requestDiveConsolidate` |
| `src/lib/diveClient.test.ts` | 정규화·요청 TDD |
| `src/components/ConsolidationFindings.tsx` | **신규** 경고 카드(순수) |
| `src/components/consolidationFindings.test.ts` | **신규** 렌더 TDD |
| `src/components/DiveDesk.tsx` | 정밀 검토 버튼·findings state·배선 |
| `src/styles.css` | `.dx-findings`·`.dx-finding` CSS |

---

## Task 1: `dive-consolidate` LLM 엔드포인트 (storyx.mjs + vite 브리지)

`dive-condense`와 동형. 응결 본문↔캐논 모순을 찾아 `{findings}` 반환. mock 폴백.

**Files:**
- Modify: `tools/storyx.mjs` (dive-setup 커맨드 다음, `if (command === 'draft')` 앞)
- Modify: `vite.config.ts` (dive-setup 브리지 다음)

- [ ] **Step 1: storyx.mjs 커맨드 추가** — 528행 `if (command === 'draft') {` 바로 위에 삽입.

```js
if (command === 'dive-consolidate') {
  const provider = readFlag(args, '--provider', 'mock');
  const prose = readFlag(args, '--prose', '');
  const context = readFlag(args, '--context', '');
  const prompt = [
    '당신은 연속성 감수자입니다. 아래 [회차 본문]이 [기존 캐논]과, 또는 본문 내부에서 명시적으로 모순되는 곳만 찾으세요.',
    '의도적 복선·나중에 회수될 반전은 모순이 아닙니다(회수 약속이 보이면 제외). 확정된 사실을 대놓고 뒤집는 것만 모순입니다.',
    '모순이 없으면 빈 배열을 반환하세요. 억지로 찾지 마세요.',
    '',
    '## 회차 본문',
    prose || '(비어 있음)',
    '',
    '## 기존 캐논 (모순 대상)',
    context || '(아직 없음)',
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "findings": [ { "claim": "본문 속 모순 주장", "conflictsWith": "충돌하는 기존 캐논/본문 문장", "evidence": "왜 모순인지 한 줄", "severity": "high|low" } ] }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({ provider, mode: 'dive-consolidate', status: 'complete', findings: [] });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'sonnet', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider, mode: 'dive-consolidate',
    status: isError ? 'failed' : 'complete',
    findings: Array.isArray(parsed?.findings) ? parsed.findings : [],
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}

```

- [ ] **Step 2: vite 브리지 추가** — `vite.config.ts` 293~298행 dive-setup 브리지의 `])` 뒤에 콤마를 붙이고 그 다음에 삽입.

기존:
```ts
    storyxBridge('/api/dive-setup', (input) => [
      'tools/storyx.mjs',
      'dive-setup',
      '--provider', 'codex',
      '--story', String(input.story ?? '')
    ])
  ]
```

교체:
```ts
    storyxBridge('/api/dive-setup', (input) => [
      'tools/storyx.mjs',
      'dive-setup',
      '--provider', 'codex',
      '--story', String(input.story ?? '')
    ]),
    storyxBridge('/api/dive-consolidate', (input) => [
      'tools/storyx.mjs',
      'dive-consolidate',
      '--provider', 'codex',
      '--prose', String(input.prose ?? ''),
      '--context', String(input.context ?? '')
    ])
  ]
```

- [ ] **Step 3: mock CLI 검증**

Run: `node tools/storyx.mjs dive-consolidate --provider mock --prose "서준은 죽었다" --context "서준은 살아 있다"`
Expected: JSON 한 줄 — `{"provider":"mock","mode":"dive-consolidate","status":"complete","findings":[]}`.

- [ ] **Step 4: tsc(설정 파일 포함) 확인**

Run: `npx tsc --noEmit`
Expected: 오류 0.

- [ ] **Step 5: 커밋**

```bash
git add tools/storyx.mjs vite.config.ts
git commit -m "feat(dive): dive-consolidate LLM 엔드포인트 — 응결 본문↔캐논 모순 검출"
```

---

## Task 2: `normalizeFindings` + `requestDiveConsolidate` (diveClient)

findings 견고 파싱(순수) + fetch 래퍼.

**Files:**
- Modify: `src/lib/diveClient.ts`
- Test: `src/lib/diveClient.test.ts`

- [ ] **Step 1: 실패 테스트 추가** — `diveClient.test.ts` 최상위 describe 안(마지막 `});` 앞). import에 `requestDiveConsolidate, normalizeFindings` 추가.

```ts
  it('normalizeFindings — 배열 아니면 [], 잘린 항목 스킵, severity 화이트리스트', () => {
    expect(normalizeFindings(null)).toEqual([]);
    expect(normalizeFindings('x')).toEqual([]);
    const out = normalizeFindings([
      { claim: '서준은 죽었다', conflictsWith: '서준은 살아 있다', evidence: '생사 모순', severity: 'high' },
      { conflictsWith: 'x', evidence: 'y', severity: 'high' }, // claim 없음 → 스킵
      { claim: '약한 것', severity: '이상치' } // severity 이상치 → low, 빈 필드 허용
    ]);
    expect(out).toEqual([
      { claim: '서준은 죽었다', conflictsWith: '서준은 살아 있다', evidence: '생사 모순', severity: 'high' },
      { claim: '약한 것', conflictsWith: '', evidence: '', severity: 'low' }
    ]);
  });

  it('requestDiveConsolidate는 /api/dive-consolidate에 POST하고 findings를 정규화한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', findings: [{ claim: 'c', conflictsWith: 'd', evidence: 'e', severity: 'high' }] })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveConsolidate({ prose: 'p', context: 'ctx' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-consolidate', expect.objectContaining({ method: 'POST' }));
    expect(res.findings).toEqual([{ claim: 'c', conflictsWith: 'd', evidence: 'e', severity: 'high' }]);
  });

  it('requestDiveConsolidate는 findings 누락 응답에 빈 배열로 안전', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'failed' }) }));
    const res = await requestDiveConsolidate({ prose: 'p', context: '' });
    expect(res.findings).toEqual([]);
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveClient.test.ts -t Consolidate`
Expected: FAIL — import 없음.

- [ ] **Step 3: 구현** — `src/lib/diveClient.ts` 끝에 추가.

```ts
export interface ConsolidationFinding {
  claim: string;
  conflictsWith: string;
  evidence: string;
  severity: 'high' | 'low';
}
export interface DiveConsolidateRequest { prose: string; context: string; }
export interface DiveConsolidateResponse { status: string; findings: ConsolidationFinding[]; warning?: string; }

// LLM findings 견고 파싱 — 배열 아니면 [], claim 없으면 스킵, severity는 high|low만.
export function normalizeFindings(raw: unknown): ConsolidationFinding[] {
  if (!Array.isArray(raw)) return [];
  const out: ConsolidationFinding[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const claim = typeof r.claim === 'string' ? r.claim.trim() : '';
    if (!claim) continue;
    out.push({
      claim,
      conflictsWith: typeof r.conflictsWith === 'string' ? r.conflictsWith.trim() : '',
      evidence: typeof r.evidence === 'string' ? r.evidence.trim() : '',
      severity: r.severity === 'high' ? 'high' : 'low'
    });
  }
  return out;
}

export async function requestDiveConsolidate(req: DiveConsolidateRequest): Promise<DiveConsolidateResponse> {
  const raw = await postJson<Partial<DiveConsolidateResponse>>('/api/dive-consolidate', req);
  return {
    status: typeof raw.status === 'string' ? raw.status : 'complete',
    findings: normalizeFindings(raw.findings),
    warning: raw.warning
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: PASS(전체 — 기존 + 신규).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive): normalizeFindings·requestDiveConsolidate — LLM 검증 findings 견고 파싱"
```

---

## Task 3: `ConsolidationFindings` 컴포넌트 + CSS

findings 경고 카드. null=미검토(렌더 안 함)·[]="모순 없음"·항목=🔴/🟡 카드.

**Files:**
- Create: `src/components/ConsolidationFindings.tsx`
- Create: `src/components/consolidationFindings.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: 실패 테스트 작성** — `src/components/consolidationFindings.test.ts` 신규.

```ts
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ConsolidationFindings } from './ConsolidationFindings';

describe('ConsolidationFindings', () => {
  it('high/low 모순 카드를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(ConsolidationFindings, {
        findings: [
          { claim: '서준은 죽었다', conflictsWith: '서준은 살아 있다', evidence: '생사 모순', severity: 'high' as const }
        ]
      })
    );
    expect(html).toContain('서준은 죽었다');
    expect(html).toContain('서준은 살아 있다');
    expect(html).toContain('dx-finding-high');
  });

  it('빈 findings면 모순 없음을 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(ConsolidationFindings, { findings: [] }));
    expect(html).toContain('모순 없음');
  });

  it('null(미검토)이면 아무것도 렌더 안 함', () => {
    const html = renderToStaticMarkup(createElement(ConsolidationFindings, { findings: null }));
    expect(html).toBe('');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/consolidationFindings.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 컴포넌트 구현** — `src/components/ConsolidationFindings.tsx` 신규.

```tsx
// 응결 정밀 검토(LLM) 결과 — 정본 모순 경고 카드. 순수 표현.
import type { ConsolidationFinding } from '../lib/diveClient';

interface ConsolidationFindingsProps {
  findings: ConsolidationFinding[] | null;
}

export function ConsolidationFindings({ findings }: ConsolidationFindingsProps) {
  if (findings === null) return null;
  if (findings.length === 0) return <div className="dx-findings dx-findings-clear">✓ 정본 모순 없음</div>;
  return (
    <div className="dx-findings">
      {findings.map((f, i) => (
        <div key={i} className={`dx-finding dx-finding-${f.severity}`}>
          <span className="dx-finding-sev">{f.severity === 'high' ? '🔴' : '🟡'}</span>
          <span className="dx-finding-claim">{f.claim}</span>
          {f.conflictsWith && <span className="dx-finding-vs">↔ {f.conflictsWith}</span>}
          {f.evidence && <span className="dx-finding-ev">{f.evidence}</span>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/consolidationFindings.test.ts`
Expected: PASS(3/3).

- [ ] **Step 5: CSS 추가** — `src/styles.css`의 `.dx-devcard-toggle.is-on` 규칙 다음에.

```css
/* 슬라이스 B — 정밀 검토(LLM) findings 경고 카드 */
.dx-findings { margin: 8px 0; display: flex; flex-direction: column; gap: 6px; }
.dx-findings-clear { font-size: 12px; color: #7CFF6B; }
.dx-finding { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; font-size: 12px; border-radius: 8px; padding: 7px 10px; }
.dx-finding-high { background: rgba(248,113,113,0.1); color: #fca5a5; }
.dx-finding-low { background: rgba(251,191,36,0.08); color: #fbbf24; }
.dx-finding-claim { color: #e8e8ee; font-weight: 600; }
.dx-finding-vs { color: #a8b0ba; }
.dx-finding-ev { flex-basis: 100%; color: #8a8f98; }
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/ConsolidationFindings.tsx src/components/consolidationFindings.test.ts src/styles.css
git commit -m "feat(dive): ConsolidationFindings — 정밀 검토 모순 경고 카드(순수 표현)"
```

---

## Task 4: DiveDesk 조립 — 정밀 검토 버튼·findings state

approve 다이얼로그에 opt-in 버튼과 결과 카드를 끼운다.

**Files:**
- Modify: `src/components/DiveDesk.tsx`

- [ ] **Step 1: import 추가** — diveClient import에 `requestDiveConsolidate`·`ConsolidationFinding` 추가하고 컴포넌트 import.

기존 `import { requestDiveChat, requestDiveCondense, requestDiveShowrunner, type DiveCondensePayload } from '../lib/diveClient';` 교체:

```ts
import { requestDiveChat, requestDiveCondense, requestDiveShowrunner, requestDiveConsolidate, type DiveCondensePayload, type ConsolidationFinding } from '../lib/diveClient';
import { ConsolidationFindings } from './ConsolidationFindings';
```

- [ ] **Step 2: state + 핸들러 추가** — `deviations` useMemo 아래에.

```ts
  const [findings, setFindings] = useState<ConsolidationFinding[] | null>(null);
  const [reviewing, setReviewing] = useState(false);

  async function reviewConsolidation() {
    if (!pending || reviewing) return;
    setReviewing(true);
    try {
      const res = await requestDiveConsolidate({ prose: pending.prose, context: buildProjectContextDigest(project) });
      setFindings(res.findings);
    } catch {
      setFindings([]);
    } finally {
      setReviewing(false);
    }
  }
```

- [ ] **Step 3: 다이얼로그에 버튼·카드 삽입 + 닫기 시 초기화** — approve 다이얼로그의 `<ul className="dx-approve-canon">` 바로 위에 삽입.

```tsx
          <div className="dx-review-row">
            <button className="dx-review-btn" onClick={reviewConsolidation} disabled={reviewing}>
              {reviewing ? '검토 중…' : '🔍 정밀 검토'}
            </button>
          </div>
          <ConsolidationFindings findings={findings} />
```

- [ ] **Step 4: 초기화 배선** — `approve()`의 `setEdits({});` 다음과, 거절 버튼 onClick, 두 곳에 findings/reviewing 리셋 추가.

`approve()` 안 `setEdits({});` 다음:
```ts
    setFindings(null);
```

거절 버튼 — 기존 `onClick={() => { setPending(null); setDecisions({}); setEdits({}); }}` 를 교체:
```tsx
            <button onClick={() => { setPending(null); setDecisions({}); setEdits({}); setFindings(null); }}>거절</button>
```

- [ ] **Step 5: CSS 버튼 스타일** — `src/styles.css`의 `.dx-findings` 블록 앞에 추가.

```css
.dx-review-row { margin: 8px 0 4px; }
.dx-review-btn { background: transparent; color: #c4b6ff; border: 1px solid #7c5cff66; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.dx-review-btn:disabled { opacity: 0.6; cursor: default; }
```

- [ ] **Step 6: tsc + 기존 diveDesk 테스트**

Run: `npx tsc --noEmit && npx vitest run src/components/diveDesk.test.ts`
Expected: tsc 0 · diveDesk 기존 테스트 녹색(회귀 없음).

- [ ] **Step 7: 커밋**

```bash
git add src/components/DiveDesk.tsx src/styles.css
git commit -m "feat(dive): 정밀 검토 배선 — opt-in LLM 검증 버튼·findings 카드"
```

---

## Task 5: 전체 게이트 + 상태 문서 갱신

**Files:**
- Modify: `progress.md`, `session-handoff.md`

- [ ] **Step 1: 전체 테스트** — Run: `npm test` · Expected: 전체 녹색.
- [ ] **Step 2: 빌드** — Run: `npm run build` · Expected: 성공.
- [ ] **Step 3: 라이브 검증(preview)** — `?stage=dive`에서 응결 후 approve 다이얼로그의 "정밀 검토" 클릭 → (mock/codex) findings 렌더, 콘솔 0. mock 경로는 "모순 없음 ✓" 확인. 카드 CSS 실측(high #fca5a5).
- [ ] **Step 4: progress.md 갱신** — "활성 트랙 — 슬라이스 B" 절 추가(done·SHA·검증). "최근 검증" 갱신.
- [ ] **Step 5: session-handoff.md 갱신** — 맨 위 인계. 손대지 말 것 = 정밀 검토는 opt-in(자동 아님)·findings는 경고일 뿐 강제 차단 아님·프롬프트 "회수 약속 제외" 유지·per-finding 수정은 후속.
- [ ] **Step 6: 커밋**

```bash
git add progress.md session-handoff.md
git commit -m "docs(canon): 슬라이스 B LLM 응결 검증기 done — 정밀 검토·모순 카드"
```

---

## 완료 기준 (Definition of Done)

- `npm test` 전체 녹색 · `npm run build` 성공.
- 런칭 게이트 — 정밀 검토 opt-in(자동 호출 0) · mock/실패 응답 크래시 0 · high 모순 카드 노출.
- `progress.md`·`session-handoff.md` 갱신.
- **범위 밖(후속)** — per-finding 수정·retcon · missed-reveal/의미 dedup · 자동 실행.
