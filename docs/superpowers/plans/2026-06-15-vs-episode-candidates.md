# VS 회차 후보 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회차 생성 전 갈림길 카드에 `[전개 후보 받기]` 버튼을 붙여, LLM이 "이번 화 전개 방향 4개 + 확률"을 verbalize(VS) 하고 흔함/의외/파격 라벨로 작가에게 제시한 뒤, 선택을 기존 의도 메모 배관으로 합류시킨다.

**Architecture:** spine-suggest 인프라(빌더↔storyx.mjs 미러 · CLI 명령 · prod api · vite 브리지 · 클라이언트)를 byte-identical로 복제하고, 도메인 순수함수(`classifyRarity`·`buildVsIntentSeed`·`normalizeVsCandidates`)는 `episodeBriefing.ts`(fork·`overlapsCanonFact`·`composeIntentWithFork`가 이미 있는 곳)에 추가한다. UI는 FloatingEditor의 `.fc-forks` 카드 옆에 `.fc-vs` 블록을 더한다. 결말 헌장 불가침 — VS는 경로만 흔든다.

**Tech Stack:** TypeScript · React · Vite(dev storyxBridge) · vitest(jsdom) · Vercel Functions(prod) · codex CLI(dev provider)

**Spec:** `docs/superpowers/specs/2026-06-15-vs-episode-candidates-design.md`

---

## File Structure

| 파일 | 책임 | 신규/수정 |
|---|---|---|
| `src/lib/episodeBriefing.ts` | VS 도메인 순수함수 — 타입·`classifyRarity`·`buildVsIntentSeed`·`normalizeVsCandidates`·VS 시드 소거 | 수정 |
| `src/lib/server/promptBuilders.ts` | `buildVsCandidatesPrompt` + `VsCandidatesPromptInput` | 수정 |
| `tools/storyx.mjs` | `buildVsCandidatesPrompt` byte-identical 미러 + `vs-candidates` 명령 | 수정 |
| `api/vs-candidates.ts` | prod Vercel Function | 신규 |
| `vite.config.ts` | `/api/vs-candidates` storyxBridge 라우트 | 수정 |
| `src/lib/vsCandidatesClient.ts` | fetch·normalize·reportAiCall | 신규 |
| `src/lib/aiStatus.ts` | `AiCallMode` + 라벨 | 수정 |
| `src/components/FloatingEditor.tsx` | `.fc-vs` 블록 + 핸들러 | 수정 |
| `src/StoryXDesk.tsx` | state·async 요청·floatingEditorProps 주입 | 수정 |
| `src/styles.css` | `.fc-vs-*` 다크 토큰 | 수정 |

**테스트:** `episodeBriefing.test.ts` · `promptBuilders.test.ts` · `vsCandidatesClient.test.ts`(신규) · `floatingEditor.test.ts`

---

## Task 1: 도메인 순수함수 — classifyRarity · buildVsIntentSeed · VS 시드 소거

**Files:**
- Modify: `src/lib/episodeBriefing.ts` (타입 추가 + `classifyRarity` + `buildVsIntentSeed` + `stripConsumedSeeds` 패턴)
- Test: `src/lib/episodeBriefing.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `episodeBriefing.test.ts` 끝에 추가

```ts
import { classifyRarity, buildVsIntentSeed } from './episodeBriefing';

describe('classifyRarity — VS 의외도 라벨 (Phase C-1)', () => {
  it('p≥0.4 는 흔함(common)', () => {
    expect(classifyRarity(0.4)).toBe('common');
    expect(classifyRarity(0.9)).toBe('common');
  });
  it('0.15≤p<0.4 는 의외(surprising)', () => {
    expect(classifyRarity(0.15)).toBe('surprising');
    expect(classifyRarity(0.39)).toBe('surprising');
  });
  it('p<0.15 는 파격(radical)', () => {
    expect(classifyRarity(0.14)).toBe('radical');
    expect(classifyRarity(0)).toBe('radical');
  });
});

describe('buildVsIntentSeed', () => {
  it('전개 방향을 시드 한 줄로 감싼다', () => {
    expect(buildVsIntentSeed('조력자가 배신한다')).toBe('이번 화의 전개: "조력자가 배신한다"');
  });
});

describe('stripConsumedSeeds — VS 시드 소거', () => {
  it('VS 전개 시드는 소거하고 작가 자필은 보존한다', () => {
    const intent = '작가 자필 메모\n이번 화의 전개: "조력자가 배신한다"';
    expect(stripConsumedSeeds(intent)).toBe('작가 자필 메모');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/episodeBriefing.test.ts`
Expected: FAIL — `classifyRarity`/`buildVsIntentSeed` is not a function

- [ ] **Step 3: 구현** — `episodeBriefing.ts`의 `EpisodeFork` 인터페이스 다음(line 19 부근)에 타입, 파일 하단 export 영역에 함수 추가

```ts
export type VsRarity = 'common' | 'surprising' | 'radical';
export interface VsCandidate {
  direction: string;
  probability: number;     // LLM verbalize 추정, 내부용(비노출)
  rarity: VsRarity;
  canonSuspect?: boolean;
}

// VS 의외도 — LLM verbalize 확률을 흔함/의외/파격 라벨로 결정론 변환(Phase C-1). 임계는 라이브 후 조정 가능.
export function classifyRarity(probability: number): VsRarity {
  if (probability >= 0.4) return 'common';
  if (probability >= 0.15) return 'surprising';
  return 'radical';
}

// VS 후보 선택을 의도 메모에 합칠 한 줄 시드. composeIntentWithFork 가 append, stripConsumedSeeds 가 소거.
export function buildVsIntentSeed(direction: string): string {
  return `이번 화의 전개: "${direction}"`;
}
```

`stripConsumedSeeds`의 패턴 상수 영역(line 230 부근, `SEED_PATTERN_PACE_LLM` 다음)에 추가:

```ts
// VS 전개 후보(buildVsIntentSeed) 시드 — 생성 후 자동 소거.
const SEED_PATTERN_VS = /^이번 화의 전개: "/u;
```

그리고 `stripConsumedSeeds`의 `kept` filter(line 244 부근)에 한 줄 추가:

```ts
    if (SEED_PATTERN_VS.test(trimmed)) return false;
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/episodeBriefing.test.ts`
Expected: PASS (전체 녹색)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/episodeBriefing.ts src/lib/episodeBriefing.test.ts
git commit -m "feat(quality): VS 도메인 — classifyRarity·buildVsIntentSeed·시드 소거 (C-1 Task1)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: normalizeVsCandidates — raw → VsCandidate[]

**Files:**
- Modify: `src/lib/episodeBriefing.ts`
- Test: `src/lib/episodeBriefing.test.ts`

`overlapsCanonFact`(line 87, module-private)와 `classifyRarity`가 같은 모듈에 있으므로 normalize도 여기 둔다. (spec 인터페이스는 vsCandidatesClient.ts에 적었으나 `overlapsCanonFact` 의존 때문에 episodeBriefing 으로 이동 — 클라이언트가 import 한다.)

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { normalizeVsCandidates } from './episodeBriefing';

describe('normalizeVsCandidates', () => {
  it('candidates 가 배열이 아니면 빈 배열', () => {
    expect(normalizeVsCandidates({}, [])).toEqual([]);
    expect(normalizeVsCandidates(null, [])).toEqual([]);
  });
  it('direction·probability 를 읽어 rarity 를 매긴다', () => {
    const out = normalizeVsCandidates(
      { candidates: [{ direction: '배신', probability: 0.1 }] }, []
    );
    expect(out[0]).toMatchObject({ direction: '배신', probability: 0.1, rarity: 'radical' });
  });
  it('probability 누락/비숫자 → 0.3(의외) 기본', () => {
    const out = normalizeVsCandidates({ candidates: [{ direction: 'X' }] }, []);
    expect(out[0].probability).toBe(0.3);
    expect(out[0].rarity).toBe('surprising');
  });
  it('확률은 0~1 로 clamp', () => {
    const out = normalizeVsCandidates(
      { candidates: [{ direction: 'A', probability: 1.5 }, { direction: 'B', probability: -2 }] }, []
    );
    expect(out[0].probability).toBe(1);
    expect(out[1].probability).toBe(0);
  });
  it('빈 direction 후보는 제외', () => {
    const out = normalizeVsCandidates({ candidates: [{ direction: '', probability: 0.5 }] }, []);
    expect(out).toEqual([]);
  });
  it('기확정 캐논과 크게 겹치면 canonSuspect 배지', () => {
    const out = normalizeVsCandidates(
      { candidates: [{ direction: '레나가 백작에게 정체를 고백한다', probability: 0.5 }] },
      ['레나가 백작에게 정체를 고백한다']
    );
    expect(out[0].canonSuspect).toBe(true);
  });
  it('4개 초과는 상위 4개만', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ direction: `D${i}`, probability: 0.5 }));
    expect(normalizeVsCandidates({ candidates: five }, [])).toHaveLength(4);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/episodeBriefing.test.ts`
Expected: FAIL — `normalizeVsCandidates` is not a function

- [ ] **Step 3: 구현** — `episodeBriefing.ts`에 추가 (`classifyRarity` 다음)

```ts
// provider 응답({ candidates: [{ direction, probability }] })을 VsCandidate[] 로 정규화.
// direction 빈 것 제외 · probability 0~1 clamp(누락 시 0.3) · rarity 변환 · canonSuspect(overlapsCanonFact) · 최대 4개.
const MAX_VS_CANDIDATES = 4;
export function normalizeVsCandidates(raw: unknown, canonStatements: string[]): VsCandidate[] {
  if (typeof raw !== 'object' || raw === null) return [];
  const list = (raw as Record<string, unknown>).candidates;
  if (!Array.isArray(list)) return [];
  const out: VsCandidate[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const direction = typeof r.direction === 'string' ? r.direction.trim() : '';
    if (!direction) continue;
    let probability = typeof r.probability === 'number' && Number.isFinite(r.probability) ? r.probability : 0.3;
    probability = Math.min(1, Math.max(0, probability));
    out.push({
      direction,
      probability,
      rarity: classifyRarity(probability),
      ...(overlapsCanonFact(direction, canonStatements) ? { canonSuspect: true } : {})
    });
    if (out.length >= MAX_VS_CANDIDATES) break;
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/episodeBriefing.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/episodeBriefing.ts src/lib/episodeBriefing.test.ts
git commit -m "feat(quality): normalizeVsCandidates — raw→VsCandidate[] (C-1 Task2)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: buildVsCandidatesPrompt — 빌더 + storyx.mjs 미러

**Files:**
- Modify: `src/lib/server/promptBuilders.ts` (line 38 부근에 input 타입, line 592 `buildSpineSuggestionPrompt` 다음에 빌더)
- Modify: `tools/storyx.mjs` (line 1822 미러 빌더 다음에 byte-identical 미러)
- Test: `src/lib/server/promptBuilders.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `promptBuilders.test.ts` 끝에 추가 (spine-mirror 패턴, line 199~233 참조)

```ts
import { buildVsCandidatesPrompt } from './promptBuilders';
import { readFileSync } from 'node:fs';

describe('buildVsCandidatesPrompt — VS 전개 후보 (Phase C-1)', () => {
  const VS_JSON_CONTRACT = '  "candidates": [{ "direction": "...", "probability": 0.0 }]';
  it('방향 4개·꼬리 분포·결말 불가침·JSON 계약을 담는다', () => {
    const p = buildVsCandidatesPrompt({
      medium: 'novel', format: 'long-novel',
      contractDigest: '결말: X', recentSummary: '1화 흐름', unpaidPromises: ['약속A']
    });
    expect(p).toContain('방향 4개');
    expect(p).toContain('파격');
    expect(p).toContain('결말 헌장은 절대 배신하지 않습니다');
    expect(p).toContain('약속A');
    expect(p).toContain(VS_JSON_CONTRACT);
  });
  it('[vs-mirror] storyx.mjs 가 JSON 출력 계약을 byte-identical 로 미러한다', () => {
    const src = readFileSync(new URL('../../../tools/storyx.mjs', import.meta.url), 'utf8');
    expect(src).toContain(VS_JSON_CONTRACT);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: FAIL — `buildVsCandidatesPrompt` is not a function

- [ ] **Step 3: 구현 (promptBuilders.ts)** — `SpineSuggestionPromptInput` 다음에 타입, `buildSpineSuggestionPrompt` 다음에 빌더

```ts
export interface VsCandidatesPromptInput {
  medium: string;
  format: CreativeFormat;
  contractDigest?: string;
  recentSummary: string;
  unpaidPromises: string[];
}

// 이번 화 전개 후보(Verbalized Sampling) 프롬프트 — Phase C-1. "방향 4개 + 확률"을 verbalize 시켜 꼬리분포 의외성을 띄운다.
// storyx.mjs 의 buildVsCandidatesPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildVsCandidatesPrompt(input: VsCandidatesPromptInput): string {
  const { medium, format, contractDigest, recentSummary, unpaidPromises } = input;
  return [
    'Story X 이번 화 전개 후보(Verbalized Sampling) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 헌장 (결말·4줄 척추·위치)',
    contractDigest?.trim() || '(헌장 없음)',
    '',
    '## 최근 회차 흐름',
    recentSummary.trim() || '(아직 회차 없음)',
    '',
    '## 미회수 약속',
    unpaidPromises.length > 0 ? unpaidPromises.map((p) => `- ${p}`).join('\n') : '(없음)',
    '',
    '## 역할',
    '당신은 Story X의 쇼러너입니다. 이번 화가 어떻게 전개될지 서로 다른 방향 4개를, 각 방향이 실제로 선택될 법한 확률과 함께 제안합니다.',
    '',
    '## 지시',
    '- 방향 4개를 생성하되, 흔할 법한 전개부터 꼬리(의외)까지 확률 분포를 펼칩니다. 적어도 하나는 확률 0.15 미만의 파격을 포함합니다.',
    '- 결말 헌장은 절대 배신하지 않습니다. 결말로 수렴하는 경로만 의외로 흔듭니다.',
    '- 각 방향은 인물의 선택과 대가가 드러나는 한 문장으로 씁니다. 일반론·해설 금지.',
    '- 확률은 0과 1 사이 숫자입니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "candidates": [{ "direction": "...", "probability": 0.0 }]',
    '}'
  ].join('\n');
}
```

- [ ] **Step 4: 구현 (storyx.mjs 미러)** — line 1822 `buildSpineSuggestionPrompt` 미러 다음에 byte-identical 복제

```js
// 이번 화 전개 후보(Verbalized Sampling) 프롬프트 — Phase C-1.
// src/lib/server/promptBuilders.ts 의 buildVsCandidatesPrompt 와 핵심 지시문 byte-identical 미러 — 변경 시 두 곳 동시 수정.
function buildVsCandidatesPrompt({ medium, format, contractDigest, recentSummary, unpaidPromises }) {
  const promises = Array.isArray(unpaidPromises) ? unpaidPromises : [];
  return [
    'Story X 이번 화 전개 후보(Verbalized Sampling) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 헌장 (결말·4줄 척추·위치)',
    (contractDigest || '').trim() || '(헌장 없음)',
    '',
    '## 최근 회차 흐름',
    (recentSummary || '').trim() || '(아직 회차 없음)',
    '',
    '## 미회수 약속',
    promises.length > 0 ? promises.map((p) => `- ${p}`).join('\n') : '(없음)',
    '',
    '## 역할',
    '당신은 Story X의 쇼러너입니다. 이번 화가 어떻게 전개될지 서로 다른 방향 4개를, 각 방향이 실제로 선택될 법한 확률과 함께 제안합니다.',
    '',
    '## 지시',
    '- 방향 4개를 생성하되, 흔할 법한 전개부터 꼬리(의외)까지 확률 분포를 펼칩니다. 적어도 하나는 확률 0.15 미만의 파격을 포함합니다.',
    '- 결말 헌장은 절대 배신하지 않습니다. 결말로 수렴하는 경로만 의외로 흔듭니다.',
    '- 각 방향은 인물의 선택과 대가가 드러나는 한 문장으로 씁니다. 일반론·해설 금지.',
    '- 확률은 0과 1 사이 숫자입니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "candidates": [{ "direction": "...", "probability": 0.0 }]',
    '}'
  ].join('\n');
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/lib/server/promptBuilders.ts tools/storyx.mjs src/lib/server/promptBuilders.test.ts
git commit -m "feat(quality): buildVsCandidatesPrompt + storyx 미러 (C-1 Task3)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: storyx.mjs vs-candidates 명령

**Files:**
- Modify: `tools/storyx.mjs` (line 842 `spine-suggest` 명령 블록 다음 + usage 배열)

spine-suggest 명령(line 798~842)을 복제하되 변경 — 입력 플래그(`--contract-digest`·`--recent-summary`·`--unpaid-json`), 빌더 호출, mode `vs-candidates`, 정규화는 raw candidates 통과(rarity/canonSuspect 는 클라이언트가).

- [ ] **Step 1: 구현** — line 842 다음에 추가

```js
if (command === 'vs-candidates') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const contractDigest = readFlag(args, '--contract-digest', '');
  const recentSummary = readFlag(args, '--recent-summary', '');
  let unpaidPromises = [];
  try { unpaidPromises = JSON.parse(readFlag(args, '--unpaid-json', '[]')); } catch { unpaidPromises = []; }
  const dryRun = args.includes('--dry-run');

  const prompt = buildVsCandidatesPrompt({ medium, format, contractDigest, recentSummary, unpaidPromises });

  if (dryRun) {
    printJson({ provider, medium, format, mode: 'vs-candidates', dryRun: true, prompt, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }
  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'vs-candidates', status: 'complete', candidates: [] });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  // Q2 가드 — transient 실패 시 1회 재시도, 에러 raw 는 후보로 승격하지 않는다.
  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];

  printJson({
    provider,
    medium,
    mode: 'vs-candidates',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    candidates,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

usage 배열(line 860 `spine-suggest` 줄 다음)에 추가:

```js
    'npm run storyx -- vs-candidates --provider codex --medium novel --format long-novel --recent-summary "최근 회차" --dry-run',
```

- [ ] **Step 2: dry-run 스모크**

Run: `npm run storyx -- vs-candidates --provider codex --medium novel --format long-novel --recent-summary "1화 흐름" --dry-run`
Expected: JSON 출력에 `"mode": "vs-candidates"` + prompt 에 "방향 4개" 포함

- [ ] **Step 3: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat(quality): storyx vs-candidates 명령 (C-1 Task4)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: api/vs-candidates.ts — prod Vercel Function

**Files:**
- Create: `api/vs-candidates.ts`

`api/spine-suggest.ts` 복제 — buildVsCandidatesPrompt 호출, candidates 배열 통과(normalize 는 클라이언트).

- [ ] **Step 1: 작성**

```ts
// Vercel Function — 이번 화 전개 후보(VS, Phase C-1).
// dev 에서는 vite.config.ts storyxBridge 가 같은 path 를 가로채 storyx.mjs 호출. prod 는 이 함수가 AI SDK 직결.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildVsCandidatesPrompt } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';
import type { CreativeFormat } from '../src/lib/projectBlueprint';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    medium?: string;
    format?: string;
    contractDigest?: string;
    recentSummary?: string;
    unpaidPromises?: string[];
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const contractDigest = String(body.contractDigest ?? '');
  const recentSummary = String(body.recentSummary ?? '');
  const unpaidPromises = Array.isArray(body.unpaidPromises) ? body.unpaidPromises.map(String) : [];

  const prompt = buildVsCandidatesPrompt({ medium, format, contractDigest, recentSummary, unpaidPromises });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'vs-candidates', status: 'complete', candidates: [], warning: result.warning });
    return;
  }

  const candidates = Array.isArray(result.data?.candidates) ? result.data.candidates : [];
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'vs-candidates',
    status: result.status,
    candidates,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
```

- [ ] **Step 2: 타입 확인**

Run: `npx tsc --noEmit`
Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add api/vs-candidates.ts
git commit -m "feat(quality): api/vs-candidates prod 라우트 (C-1 Task5)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: vite.config.ts 브리지 라우트

**Files:**
- Modify: `vite.config.ts` (line 225 spine-suggest 라우트 다음, plugins 배열 안)

- [ ] **Step 1: 구현** — `storyxBridge('/api/spine-suggest', ...)` 블록 다음에 추가

```ts
    storyxBridge('/api/vs-candidates', (input) => [
      'tools/storyx.mjs',
      'vs-candidates',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--contract-digest',
      String(input.contractDigest ?? ''),
      '--recent-summary',
      String(input.recentSummary ?? ''),
      '--unpaid-json',
      JSON.stringify(Array.isArray(input.unpaidPromises) ? input.unpaidPromises : [])
    ])
```

- [ ] **Step 2: 타입 확인**

Run: `npx tsc --noEmit`
Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add vite.config.ts
git commit -m "feat(quality): vite /api/vs-candidates 브리지 (C-1 Task6)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: vsCandidatesClient.ts + aiStatus

**Files:**
- Create: `src/lib/vsCandidatesClient.ts`
- Modify: `src/lib/aiStatus.ts` (line 7 union + line 79 label)
- Test: `src/lib/vsCandidatesClient.test.ts` (신규)

- [ ] **Step 1: aiStatus 확장** — `AiCallMode` union 끝에 `| 'vs-candidates'`, `aiCallModeLabel` switch 에 케이스 추가

```ts
// line 7:
export type AiCallMode = 'draft' | 'review' | 'review-agent' | 'review-data' | 'interview' | 'pace-interview' | 'spine-suggest' | 'vs-candidates';

// aiCallModeLabel switch 의 'spine-suggest' 케이스 다음:
    case 'vs-candidates':
      return '전개 후보';
```

- [ ] **Step 2: 실패 테스트 작성** — `vsCandidatesClient.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { normalizeVsCandidates } from './episodeBriefing';

// vsCandidatesClient 는 normalizeVsCandidates(episodeBriefing)를 재사용한다 — 정규화 계약을 클라이언트 경로에서 한 번 더 핀.
describe('vsCandidatesClient 정규화 계약', () => {
  it('provider candidates 를 rarity 라벨까지 변환한다', () => {
    const out = normalizeVsCandidates({ candidates: [{ direction: '배신', probability: 0.1 }] }, []);
    expect(out).toEqual([{ direction: '배신', probability: 0.1, rarity: 'radical' }]);
  });
  it('빈 응답은 빈 배열', () => {
    expect(normalizeVsCandidates({ candidates: [] }, [])).toEqual([]);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/lib/vsCandidatesClient.test.ts`
Expected: FAIL — 파일/모듈 해석 오류 또는 import 실패

- [ ] **Step 4: 구현** — `vsCandidatesClient.ts` (spineSuggestClient.ts 복제 + normalize 위임)

```ts
// /api/vs-candidates 브리지에 이번 화 전개 후보(VS)를 요청하는 클라이언트 (Phase C-1).
// spineSuggestClient 패턴(fetch·status:'failed'·reportAiCall·폴백은 호출 측)을 따른다.
import { reportAiCall } from './aiStatus';
import { normalizeVsCandidates, type VsCandidate } from './episodeBriefing';

export interface VsCandidatesInput {
  medium: string;
  format: string;
  contractDigest?: string;
  recentSummary: string;
  unpaidPromises: string[];
  canonStatements: string[];
}

export interface VsCandidatesResult {
  ok: boolean;
  candidates?: VsCandidate[];
  reason?: string;
}

async function _runVsCandidates(input: VsCandidatesInput): Promise<VsCandidatesResult> {
  try {
    const response = await fetch('/api/vs-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})` };
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (data.status === 'failed') {
      const warning = typeof data.warning === 'string' ? data.warning : 'provider 호출 실패';
      return { ok: false, reason: warning };
    }
    const candidates = normalizeVsCandidates(data, input.canonStatements);
    if (candidates.length === 0) {
      return { ok: false, reason: '생성된 전개 후보가 없습니다.' };
    }
    return { ok: true, candidates };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/vs-candidates 를 호출해 전개 후보를 가져온다. 실패는 전부 ok:false·reason(호출 측이 안내로 강등).
export async function requestVsCandidates(input: VsCandidatesInput): Promise<VsCandidatesResult> {
  const result = await _runVsCandidates(input);
  reportAiCall({ mode: 'vs-candidates', ok: result.ok, reason: result.reason });
  return result;
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/vsCandidatesClient.test.ts && npx tsc --noEmit`
Expected: PASS + tsc 0

- [ ] **Step 6: 커밋**

```bash
git add src/lib/vsCandidatesClient.ts src/lib/vsCandidatesClient.test.ts src/lib/aiStatus.ts
git commit -m "feat(quality): vsCandidatesClient + aiStatus mode (C-1 Task7)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: FloatingEditor — .fc-vs 블록

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (import line 8 · props line 72 · 구조분해 line 120 · pickFork line 173 다음 · fork JSX line 723 다음)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `floatingEditor.test.ts`에 추가 (기존 react-dom 렌더 패턴 따라)

```ts
it('[VS] onRequestVsCandidates 가 있으면 전개 후보 버튼을 렌더한다', () => {
  const html = renderFloating({ onRequestVsCandidates: () => {}, onIntentChange: () => {} });
  expect(html).toContain('전개 후보 받기');
});
it('[VS] vsCandidates 를 rarity 라벨과 함께 렌더한다', () => {
  const html = renderFloating({
    onRequestVsCandidates: () => {}, onIntentChange: () => {},
    vsCandidates: [{ direction: '배신한다', probability: 0.1, rarity: 'radical' }]
  });
  expect(html).toContain('배신한다');
  expect(html).toContain('파격');
});
it('[VS] onRequestVsCandidates 미주입이면 블록 미렌더', () => {
  const html = renderFloating({ onIntentChange: () => {} });
  expect(html).not.toContain('전개 후보 받기');
});
```

> `renderFloating` 은 기존 floatingEditor.test.ts 의 헬퍼다(없으면 같은 파일의 다른 it 의 renderToStaticMarkup 패턴을 그대로 복제하되 props 만 병합). rarity 라벨 매핑은 구현 Step 의 `rarityLabel` 이 'radical'→'파격'.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — '전개 후보 받기' 미렌더

- [ ] **Step 3: 구현 (import)** — line 8 수정

```ts
import { composeIntentWithFork, buildVsIntentSeed, type EpisodeFork, type VsCandidate } from '../lib/episodeBriefing';
```

- [ ] **Step 4: 구현 (props 타입)** — line 72 `onUnlock?: () => void;` 다음에 추가

```ts
  /** VS 전개 후보(Phase C-1) — onRequestVsCandidates 없으면 블록 미렌더. */
  vsCandidates?: VsCandidate[];
  onRequestVsCandidates?: () => void;
  isVsLoading?: boolean;
  vsNote?: string | null;
  /** 후보 선택 시 호출(후보 닫기 등) — intent 합류는 내부에서 처리. */
  onSelectVsCandidate?: (direction: string) => void;
```

구조분해(line 120 `onUnlock,` 다음)에 추가:

```ts
  vsCandidates,
  onRequestVsCandidates,
  isVsLoading = false,
  vsNote,
  onSelectVsCandidate,
```

- [ ] **Step 5: 구현 (핸들러 + 라벨)** — `pickFork`(line 173) 다음에 추가

```ts
  const rarityLabel = (r: VsCandidate['rarity']) =>
    r === 'common' ? '흔함' : r === 'surprising' ? '의외' : '파격';
  function pickVsCandidate(direction: string) {
    if (!onIntentChange) return;
    const seed = buildVsIntentSeed(direction);
    const current = intentRef.current ? intentRef.current.value : intentMemo;
    const next = composeIntentWithFork(current, seed);
    if (intentRef.current) intentRef.current.value = next;
    onIntentChange(next);
    onSelectVsCandidate?.(direction);
  }
```

- [ ] **Step 6: 구현 (JSX)** — `.fc-forks` 블록(line 709~723 닫는 부분) 다음에 추가

```tsx
          {onRequestVsCandidates && (
            <div className="fc-vs">
              <div className="fc-vs-head">
                <div className="fc-forks-title">이번 화 전개 후보 — 쇼러너 제안</div>
                <button
                  type="button"
                  className="fc-vs-ask"
                  disabled={isVsLoading || !onIntentChange}
                  onClick={onRequestVsCandidates}
                >
                  {isVsLoading ? '뽑는 중…' : '전개 후보 받기'}
                </button>
              </div>
              {vsNote && <div className="fc-vs-note">{vsNote}</div>}
              {vsCandidates && vsCandidates.length > 0 && (
                <div className="fc-vs-opts">
                  {vsCandidates.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`fc-vs-opt fc-vs-${c.rarity}${c.canonSuspect ? ' is-canon-suspect' : ''}`}
                      disabled={!onIntentChange}
                      onClick={() => pickVsCandidate(c.direction)}
                    >
                      <span className="fc-vs-rarity">{rarityLabel(c.rarity)}</span>
                      <span className="fc-vs-dir">{c.direction}</span>
                      {c.canonSuspect && <em className="fc-fork-suspect">캐논 확인</em>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
```

- [ ] **Step 7: 통과 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(quality): FloatingEditor .fc-vs 전개 후보 블록 (C-1 Task8)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: StoryXDesk 배선 + CSS

**Files:**
- Modify: `src/StoryXDesk.tsx` (import line 135 · state · async 핸들러 · floatingEditorProps line 1351 부근)
- Modify: `src/styles.css` (`.fc-vs-*` 토큰)
- Test: `src/editorFocusLayout.test.ts` (소스 핀)

- [ ] **Step 1: import + state** — line 135 import 에 `normalizeVsCandidates` 불필요(클라이언트가 함). `requestVsCandidates`·`VsCandidate` 추가, `collectUnpaidPromises` 는 `buildEpisodeForks` 로 대체 불가하므로 미회수 약속은 `project.chapters` 의 `rewardArc` 에서 인라인 도출. StoryXDesk 상단 다른 useState 군 옆에 추가:

```ts
import { requestVsCandidates } from './lib/vsCandidatesClient';
import type { VsCandidate } from './lib/episodeBriefing';

// floatingEditorProps useMemo 위:
const [vsCandidates, setVsCandidates] = useState<VsCandidate[]>([]);
const [isVsLoading, setIsVsLoading] = useState(false);
const [vsNote, setVsNote] = useState<string | null>(null);
```

- [ ] **Step 2: async 요청 핸들러** — `floatingEditorProps` useMemo 위에 추가. `buildContractStatus`(이미 import) 로 digest, 최근 회차 요약은 마지막 회차 title+logline, 미회수 약속은 rewardArc 미회수 promise.

```ts
const handleRequestVsCandidates = useCallback(async () => {
  setIsVsLoading(true);
  setVsNote(null);
  const status = buildContractStatus(project);
  const contractDigest = status
    ? `위치 ${status.position}/${status.plannedEpisodes} · 잔여 ${status.remaining} · 미회수 ${status.unpaidCount}`
    : '';
  const last = project.chapters[project.chapters.length - 1];
  const recentSummary = last ? `${chapterLabel(last)} ${last.title} — ${last.prose.slice(0, 200)}` : '';
  const unpaidPromises = project.chapters
    .flatMap((c) => c.rewardArc ?? [])
    .filter((e) => e.promise.trim() && e.payoff.trim().length === 0)
    .map((e) => e.promise.trim());
  const result = await requestVsCandidates({
    medium: project.medium,
    format: project.format,
    contractDigest,
    recentSummary,
    unpaidPromises,
    canonStatements: project.canonFacts.map((f) => f.statement)
  });
  setIsVsLoading(false);
  if (result.ok && result.candidates) setVsCandidates(result.candidates);
  else setVsNote(result.reason ?? '전개 후보를 가져오지 못했습니다.');
}, [project]);
```

> `project.medium`·`project.format` 접근은 기존 `blueprint` 도출부(StoryXDesk 상단 `createBlueprint`/`project.medium` 사용처)를 따른다. 필드명이 다르면 그 사용처와 일치시킨다.

- [ ] **Step 3: floatingEditorProps 주입** — line 1351 `episodeForks:` 다음에 추가

```ts
      vsCandidates,
      onRequestVsCandidates: handleRequestVsCandidates,
      isVsLoading,
      vsNote,
      onSelectVsCandidate: () => { setVsCandidates([]); setVsNote(null); },
```

- [ ] **Step 4: CSS** — `styles.css`의 `.fc-fork` 토큰 근처에 추가

```css
.fc-vs { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--fc-rule, rgba(255,255,255,0.08)); }
.fc-vs-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.fc-vs-ask { font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--fc-rule, rgba(255,255,255,0.12)); background: transparent; color: var(--fc-ink, #e7e7ea); cursor: pointer; }
.fc-vs-ask:disabled { opacity: 0.5; cursor: default; }
.fc-vs-note { font-size: 12px; color: var(--fc-ink-dim, #9a9aa2); margin-top: 6px; }
.fc-vs-opts { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.fc-vs-opt { display: flex; align-items: center; gap: 8px; text-align: left; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--fc-rule, rgba(255,255,255,0.1)); background: var(--fc-card, rgba(255,255,255,0.03)); color: var(--fc-ink, #e7e7ea); cursor: pointer; }
.fc-vs-opt:disabled { opacity: 0.5; cursor: default; }
.fc-vs-rarity { flex: 0 0 auto; font-size: 11px; padding: 2px 7px; border-radius: 999px; }
.fc-vs-common .fc-vs-rarity { background: rgba(255,255,255,0.08); color: #b8b8c0; }
.fc-vs-surprising .fc-vs-rarity { background: rgba(163,230,53,0.16); color: #a3e635; }
.fc-vs-radical .fc-vs-rarity { background: rgba(251,113,133,0.18); color: #fb7185; }
.fc-vs-dir { flex: 1 1 auto; font-size: 13px; }
```

- [ ] **Step 5: 소스 핀 테스트** — `editorFocusLayout.test.ts`에 추가 (floatingEditorProps 배선 핀)

```ts
it('[VS C-1] StoryXDesk 가 onRequestVsCandidates·vsCandidates 를 floating 에 배선한다', () => {
  const src = readFileSync(new URL('./StoryXDesk.tsx', import.meta.url), 'utf8');
  expect(src).toContain('onRequestVsCandidates: handleRequestVsCandidates');
  expect(src).toContain('requestVsCandidates({');
});
```

- [ ] **Step 6: 검증**

Run: `npx vitest run src/editorFocusLayout.test.ts && npx tsc --noEmit && npx vite build`
Expected: PASS + tsc 0 + build 성공

- [ ] **Step 7: 커밋**

```bash
git add src/StoryXDesk.tsx src/styles.css src/editorFocusLayout.test.ts
git commit -m "feat(quality): StoryXDesk VS 배선 + .fc-vs CSS (C-1 Task9)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 통합 검증 + 라이브 + 상태 문서

**Files:**
- Verify: `init.sh`
- Live: preview
- Modify: `progress.md` · `session-handoff.md`

- [ ] **Step 1: 전체 게이트**

Run: `bash init.sh`
Expected: tsc 0 · vitest 전체 녹색(episodeBriefing +9·promptBuilders +2·vsCandidatesClient +2·floatingEditor +3·editorFocusLayout +1) · build 통과

- [ ] **Step 2: 라이브(preview)** — 회차 2개 이상 작품에서
  - `[전개 후보 받기]` 클릭 → 4개 후보 + 흔함/의외/파격 배지 렌더
  - 파격 후보 클릭 → 의도 메모에 `이번 화의 전개: "..."` 합류 → 후보 닫힘
  - 초안 생성 → 결말 헌장 정합(연속성 감수자 통과) → 새로고침 후 의도 메모에서 VS 시드 소거 확인
  - 콘솔 에러 0 (fresh reload 기준)

- [ ] **Step 3: 상태 문서 갱신** — `progress.md` '최근 검증'에 VS C-1 블록, `session-handoff.md` 맨 위에 인계 노트(한 것·손대지 말 것·다음 한 가지)

- [ ] **Step 4: 커밋**

```bash
git add progress.md session-handoff.md
git commit -m "docs: VS 회차 후보(C-1) 완료 — 검증·인계 (C-1 Task10)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (작성자 체크)

- **Spec coverage** — ① 도메인(T1·T2) ② 프롬프트·미러(T3) ③ CLI(T4) ④ prod(T5) ⑤ 브리지(T6) ⑦ 클라이언트·aiStatus(T7) ⑧ UI(T8) ⑨ 배선·CSS(T9) ⑩ 검증(T10). spec §4 터치포인트 10개 전부 매핑됨.
- **결말 불가침** — T3 프롬프트 문구 "결말 헌장은 절대 배신하지 않습니다" + T10 라이브에서 연속성 정합 확인.
- **타입 일관성** — `VsCandidate`/`VsRarity`(T1) → `normalizeVsCandidates`(T2) → 클라이언트(T7) → FloatingEditor props(T8) → StoryXDesk state(T9)까지 동일 심볼. `classifyRarity`·`buildVsIntentSeed`·`normalizeVsCandidates` 시그니처 일관.
- **spec 이탈 1건(의도적)** — `normalizeVsCandidates` 를 spec 의 vsCandidatesClient.ts 대신 episodeBriefing.ts 에 둠(`overlapsCanonFact` 의존). T2·T7 에 명시.
- **열린 디테일** — T9 의 `project.medium`/`project.format` 필드명은 기존 사용처 확인 후 일치(주석으로 명시). 미회수 약속·recentSummary 도출은 인라인 코드로 완결.
