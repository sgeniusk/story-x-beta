# 흡인력 게이트 (critic-reviewer 검토망 승격) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 연재 서사 라이브 검토망에 critic-reviewer를 긴장·서프라이즈 흡인력 판정자(6번째)로 합류시키고, 조기 소진 결정론 신호를 검토 프롬프트에 주입한다.

**Architecture:** spec `docs/superpowers/specs/2026-07-06-compellingness-gate-design.md` 정본. 검토 verdict가 곧 게이트(정보성, 하드 차단 없음). 라인업은 `getMediumReviewAgentIds` 확장, 기준은 agentReviewProcess criteriaKeys + `.claude/agents/critic-reviewer.md`(프롬프트 정체성), 신호는 `buildAgentReviewPrompt`의 stakes_progression_audit 선례 미러. dev 브리지·CLI·prod 라우트의 payoffStatus 배관 갭(잠복)을 함께 봉합한다.

**Tech Stack:** TypeScript(vite·vitest)·React·storyx.mjs CLI(프롬프트 byte-identical 미러 관례).

**불변식(전 태스크 공통)** — 검토는 정보성 유지(회차 확정 차단 없음) · 기존 문학 기준·criteriaKeys 3개 보존(추가만) · 에세이·학술·비연재 무접촉 · 신호는 computePayoffLedger·buildContractStatus 산출만 받음 · promptBuilders ↔ storyx.mjs byte-identical.

**알려진 한계(수정 금지)** — `short-novel`은 제품 결정상 4~8화 연재지만 `isSerialFormat`이 false(기존 백로그 "format 축 vs lengthClass 축 정합"). 이 조각은 기존 `isSerialFormat`을 따른다 — 백로그 해소 시 자동 편입.

---

### Task 1: 라인업 합류 — getMediumReviewAgentIds 연재 서사 확장

**Files:**
- Modify: `src/lib/agentSeedData.ts` (imports + `getMediumReviewAgentIds`, 62행 부근)
- Modify: `src/StoryXDesk.tsx` (호출처 2곳 — `const reviewAgentIds = getMediumReviewAgentIds(blueprint.medium);` 715행 부근, `const mediumReviewAgentIds = useMemo(...)` 876행 부근)
- Test: `src/lib/agentSeedData.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/agentSeedData.test.ts`의 describe 안에 추가

```ts
  it('연재 novel(long-novel)은 CORE 5 + critic-reviewer 흡인력 게이트 (2026-07-06)', () => {
    const ids = getMediumReviewAgentIds('novel', 'long-novel');
    expect(ids.slice(0, 5)).toEqual(MARGIN_CORE_AGENT_IDS);
    expect(ids[ids.length - 1]).toBe('critic-reviewer');
    expect(ids.length).toBe(6);
  });

  it('연재 comics(serial-webtoon)는 CORE + 특화 2 + critic-reviewer', () => {
    const ids = getMediumReviewAgentIds('comics', 'serial-webtoon');
    expect(ids).toContain('storyboard-agent');
    expect(ids).toContain('speech-bubble-agent');
    expect(ids[ids.length - 1]).toBe('critic-reviewer');
    expect(ids.length).toBe(8);
  });

  it('비연재 novel(short-novel)은 CORE 5인 유지 (흡인력 게이트 미합류)', () => {
    expect(getMediumReviewAgentIds('novel', 'short-novel')).toEqual(MARGIN_CORE_AGENT_IDS);
  });

  it('essay·academic 은 연재 format 이어도 critic-reviewer 미합류 (긴장 축 다름)', () => {
    expect(getMediumReviewAgentIds('essay', 'essay-series')).not.toContain('critic-reviewer');
    expect(getMediumReviewAgentIds('academic', 'long-novel')).not.toContain('critic-reviewer');
  });

  it('format 미전달이면 현행 동작 유지 (하위호환)', () => {
    expect(getMediumReviewAgentIds('novel')).toEqual(MARGIN_CORE_AGENT_IDS);
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/agentSeedData.test.ts`
Expected: FAIL — 신규 5케이스가 "Expected 2 arguments" 또는 길이 불일치로 실패(기존 5케이스는 통과).

- [ ] **Step 3: 최소 구현** — `src/lib/agentSeedData.ts`

import 블록을 다음으로 교체(값 import 추가 — 기존은 type-only).

```ts
import type { ValidationAgentId } from './agentReviewProcess';
import { isSerialFormat } from './projectBlueprint';
import type { CreativeFormat, CreativeMedium } from './projectBlueprint';
import type { AgentRun } from './storyEngine';
```

`getMediumReviewAgentIds`를 다음으로 교체.

```ts
// 흡인력 게이트(2026-07-06 spec) — 긴장 축이 서사와 다른 매체는 제외한다.
const COMPELLINGNESS_EXCLUDED_MEDIA: readonly CreativeMedium[] = ['essay', 'academic'];

// 한 매체의 라이브 검토 작가진 id 목록 — CORE + 매체 specialist(중복 가드). novel·academic 은 CORE 만.
// format 이 연재형이고 에세이·학술이 아니면 critic-reviewer 를 흡인력 판정자로 마지막에 합류(격리·발견 순서 보존).
export function getMediumReviewAgentIds(medium: CreativeMedium, format?: CreativeFormat): ValidationAgentId[] {
  const specialists = MEDIUM_REVIEW_SPECIALISTS[medium] ?? [];
  const merged = [...MARGIN_CORE_AGENT_IDS];
  for (const id of specialists) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }
  if (format && isSerialFormat(format) && !COMPELLINGNESS_EXCLUDED_MEDIA.includes(medium) && !merged.includes('critic-reviewer')) {
    merged.push('critic-reviewer');
  }
  return merged;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/agentSeedData.test.ts`
Expected: PASS (기존 5 + 신규 5).

- [ ] **Step 5: 호출처 배선** — `src/StoryXDesk.tsx` 2곳

715행 부근(runMarginReviewAll 안).

```ts
      const reviewAgentIds = getMediumReviewAgentIds(blueprint.medium, blueprint.format);
```

876행 부근(useMemo — deps에 `blueprint.format` 추가).

```ts
  const mediumReviewAgentIds = useMemo(
    () => getMediumReviewAgentIds(blueprint.medium, blueprint.format),
    [blueprint.medium, blueprint.format]
  );
```

- [ ] **Step 6: 타입·전체 테스트 확인**

Run: `npx tsc --noEmit && npx vitest run src/lib/agentSeedData.test.ts src/editorFocusLayout.test.ts`
Expected: PASS (editorFocusLayout 소스 핀 회귀 없음 — 깨지면 단언 문자열이 옛 호출 형태를 물고 있는지 확인하고 새 형태로 교정. 약화 금지).

- [ ] **Step 7: Commit**

```bash
git add src/lib/agentSeedData.ts src/lib/agentSeedData.test.ts src/StoryXDesk.tsx
git commit -m "feat(gate): 연재 서사 검토망에 critic-reviewer 흡인력 판정자 합류"
```

---

### Task 2: 흡인력 기준 — criteriaKeys·페르소나·에이전트 정의

**Files:**
- Modify: `src/lib/agentReviewProcess.ts` (critic-reviewer 항목, 305~315행 부근)
- Modify: `src/lib/extendedPersonas.ts` (57행 — critic-reviewer PersonaCard role)
- Modify: `.claude/agents/critic-reviewer.md`
- Test: `src/agentValidationProcess.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/agentValidationProcess.test.ts` 맨 아래 describe 추가(파일 상단 import에 `validationProcesses`가 없으면 추가 — 기존 import 경로는 `./lib/agentReviewProcess`)

```ts
describe('critic-reviewer 흡인력 게이트 승격 (2026-07-06)', () => {
  const critic = validationProcesses.find((p) => p.agentId === 'critic-reviewer');

  it('흡인력 criteriaKeys 2개가 추가되고 기존 문학 기준 3개는 보존된다', () => {
    expect(critic?.criteriaKeys).toEqual(
      expect.arrayContaining([
        'ambiguity_audit',
        'ethical_pressure_test',
        'silence_audit',
        'tension_decay_audit',
        'predictability_audit'
      ])
    );
  });

  it('agenda 가 긴장·서프라이즈 흡인력 판정 역할을 명시한다', () => {
    expect(critic?.agenda).toContain('긴장');
    expect(critic?.agenda).toContain('흡인력');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/agentValidationProcess.test.ts`
Expected: FAIL — criteriaKeys에 tension_decay_audit 없음.

- [ ] **Step 3: agentReviewProcess 구현** — critic-reviewer 항목을 다음으로 교체(기존 항목 전체를 아래로)

```ts
  {
    agentId: 'critic-reviewer',
    label: '작품성 평론가',
    agenda: '연재 회차의 긴장·서프라이즈 흡인력을 판정하고, 결말·핵심 결정 장면에서 양가성, 윤리적 비용, 침묵, 모티프 변주, 상징의 층, 내면 모순을 점검합니다 (대중성을 막지 않고 보조).',
    independentChecks: [
      '이 회차가 긴장을 소진만 하고 재장전하지 않는가 — 열린 질문이 닫힐 때 새 질문이 열리는가',
      '다음 회차 전개가 이 회차만 읽고 뻔히 예측되는가 — 예측을 배반하되 캐논 안에서 배반하는가',
      '결말에 대안 해석이 1개 이상 가능한가',
      '핵심 결정의 대안 비용이 명시되는가',
      '중심 사건의 묘사 직접성이 1~5 중 적절한가',
      '3회 이상 등장 모티프가 의미 변주되는가'
    ],
    evidenceTargets: ['ending', 'decision scene', 'motif ledger', 'symbol layers', 'narrator card'],
    outputFormat: ['통과', '권고', '대안 해석', '윤리 비용 표', '모티프 변주 리포트', '재작성 권고'],
    evolutionMemory: ['작가가 채택한 양가성 패턴', '효과적이었던 침묵 사례', '실패한 모티프 변주'],
    blockingSignals: ['결말이 한 줄 요약으로 닫힘', '핵심 결정의 대안 비용이 0', '남은 회차가 많은데 열린 긴장이 0'],
    criteriaKeys: ['ambiguity_audit', 'ethical_pressure_test', 'silence_audit', 'tension_decay_audit', 'predictability_audit']
  },
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/agentValidationProcess.test.ts`
Expected: PASS.

- [ ] **Step 5: PersonaCard role 갱신** — `src/lib/extendedPersonas.ts` 57행

```ts
  { id: 'critic-reviewer',        name: '평론가',          role: '긴장과 흡인력',       tint: '#7c87e5', isCore: false, group: '확장' },
```

- [ ] **Step 6: 에이전트 정의 갱신** — `.claude/agents/critic-reviewer.md`

frontmatter description을 다음으로 교체.

```yaml
description: Use proactively on every serial-fiction chapter as the compellingness gate — tension decay and predictability — and on finale chapters or pivotal decision scenes to test the literary track (ambiguity, ethical cost, silence, motif depth, symbolic layering) per docs/research/story_x_creative_principles.md.
```

본문 `You are the literary craft critic.` 바로 아래에 다음 섹션을 삽입(기존 체크리스트·문단은 그대로 유지).

```markdown
## Compellingness Gate (연재 회차 상시 — 2026-07-05 흡인력 딥리서치)

LLM serials lose tension long before the ending (late-stage unpredictability: human 0.607 vs LLM 0.215) and general quality rubrics cannot see this loss. On every serial chapter, run these two checks FIRST:

- **`tension_decay_audit`** — does this chapter only spend tension without reloading it? When an open question closes, does a new one open? Premature resolution is the primary failure — if all promises are paid and nothing new is armed while many episodes remain, flag revise with the exact sentence where tension died.
- **`predictability_audit`** — after reading only this chapter, is the next chapter's development obvious? The chapter should betray prediction *within canon* — surprise that violates canon is not surprise, it is a continuity bug (leave those to continuity-editor).

Verdict stays informational (pass / revise / blocked) — you gate by evidence, not by force. Do not demand shock for its own sake; surprise has a sweet spot and serves immersion.
```

- [ ] **Step 7: 전체 게이트 확인**

Run: `grep -rn "메타 비평" src` → 결과가 extendedPersonas.ts 밖(테스트 등)에도 있으면 그 단언을 새 role 문자열로 교정(약화 금지).
Run: `npx tsc --noEmit && npx vitest run`
Expected: 전체 PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/agentReviewProcess.ts src/lib/extendedPersonas.ts src/agentValidationProcess.test.ts .claude/agents/critic-reviewer.md
git commit -m "feat(gate): critic-reviewer 흡인력 기준(tension_decay·predictability) 추가"
```

---

### Task 3: 조기 소진 신호 — buildAgentReviewPrompt + storyx.mjs 미러

**Files:**
- Modify: `src/lib/server/promptBuilders.ts` (AgentReviewPromptInput 83행 부근 + buildAgentReviewPrompt 427행 부근)
- Modify: `tools/storyx.mjs` (buildAgentReviewPrompt 미러, 1330행 부근)
- Test: `src/lib/server/promptBuilders.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/server/promptBuilders.test.ts`의 "정체 측정 evidence 주입" describe 아래에 추가

```ts
// 흡인력 게이트 조기 소진 신호 — storyx.mjs 미러 byte-identical(문구 변경 시 양쪽 동시 갱신).
describe('buildAgentReviewPrompt — 흡인력 조기 소진 신호 (2026-07-06 흡인력 게이트)', () => {
  const TENSION_DRAIN_PIN = '- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 ';
  const base = { persona: '', target: '본문', medium: 'novel', context: '' };
  const drained = { isStalled: false, deferredStreak: 0, openPromises: 0, paidPromises: 3 };
  const midContract = { remaining: 12, unpaidCount: 0, overBudget: false, finalStretch: false };

  it('critic-reviewer + 전부 회수 + 종반 아님이면 조기 소진 신호를 주입한다', () => {
    const p = buildAgentReviewPrompt({ ...base, agentId: 'critic-reviewer', payoffStatus: drained, contractStatus: midContract });
    expect(p).toContain(TENSION_DRAIN_PIN);
    expect(p).toContain('tension_decay_audit');
    expect(p).toContain('12회차');
  });

  it('열린 약속이 남아 있으면 미주입', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: { ...drained, openPromises: 2 }, contractStatus: midContract
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('정체(isStalled)면 미주입 — 정체 신호와 배타', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: { ...drained, isStalled: true, deferredStreak: 3 }, contractStatus: midContract
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('paidPromises 0(rewardArc 미사용·미측정 작품)이면 미주입 — 오탐 가드', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: { ...drained, paidPromises: 0 }, contractStatus: midContract
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('종반(finalStretch)이면 미주입 — 회수 국면은 소진이 정상', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: drained, contractStatus: { ...midContract, remaining: 3, finalStretch: true }
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('contractStatus 없으면 미주입(헌장 없는 작품)', () => {
    const p = buildAgentReviewPrompt({ ...base, agentId: 'critic-reviewer', payoffStatus: drained });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('같은 조건이라도 타 에이전트(showrunner)엔 미주입', () => {
    const p = buildAgentReviewPrompt({ ...base, agentId: 'showrunner', payoffStatus: drained, contractStatus: midContract });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('[mirror] storyx.mjs 가 조기 소진 문구를 byte-identical 로 포함한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(TENSION_DRAIN_PIN);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: FAIL — 신규 describe 9케이스 중 주입 케이스·mirror 케이스 실패(미주입 케이스 일부는 우연 통과 가능·정상). `paidPromises` 필드가 타입에 없어 tsc 단계에서 컴파일 에러가 먼저 나면 그것이 RED 증거.

- [ ] **Step 3: promptBuilders.ts 구현**

AgentReviewPromptInput(83행 부근)의 payoffStatus를 다음으로 교체.

```ts
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number; paidPromises?: number };
```

`buildAgentReviewPrompt` 안 `payoffEvidence` 선언 바로 아래에 추가.

```ts
  // 흡인력 게이트 조기 소진 신호(2026-07-06) — critic-reviewer 한정. paidPromises>0 이 오탐 가드
  // (computePayoffLedger 는 rewardArc 미사용 작품에서 openPromises 0 을 돌려주므로, 약속을 실제로 쓰다가
  // 전부 회수된 경우만 신호). 정체(isStalled)와 배타, 종반(finalStretch)은 소진이 정상이라 제외. storyx.mjs 미러.
  const compellingnessEvidence =
    agentId === 'critic-reviewer' &&
    payoffStatus && !payoffStatus.isStalled &&
    payoffStatus.openPromises === 0 && (payoffStatus.paidPromises ?? 0) > 0 &&
    contractStatus && !contractStatus.finalStretch
      ? [
          `- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 ${contractStatus.remaining}회차. criteriaKey: tension_decay_audit. 이 회차가 새 질문·새 긴장을 장전하는지 특히 엄격히 본다.`
        ]
      : [];
```

return 배열의 `...payoffEvidence,` 바로 다음 줄에 추가.

```ts
    ...compellingnessEvidence,
```

- [ ] **Step 4: storyx.mjs 미러 구현** — `buildAgentReviewPrompt`(1330행 부근)의 `payoffEvidence` 선언 바로 아래에 추가(JS라 타입 없음, 문구 byte-identical)

```js
  // 흡인력 게이트 조기 소진 신호(2026-07-06) — promptBuilders.ts 미러. critic-reviewer 한정, paidPromises>0 오탐 가드.
  const compellingnessEvidence =
    agentId === 'critic-reviewer' &&
    payoffStatus && !payoffStatus.isStalled &&
    payoffStatus.openPromises === 0 && (payoffStatus.paidPromises ?? 0) > 0 &&
    contractStatus && !contractStatus.finalStretch
      ? [
          `- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 ${contractStatus.remaining}회차. criteriaKey: tension_decay_audit. 이 회차가 새 질문·새 긴장을 장전하는지 특히 엄격히 본다.`
        ]
      : [];
```

같은 함수 return 배열에서 `...payoffEvidence,`를 찾아 바로 다음 줄에 추가.

```js
    ...compellingnessEvidence,
```

- [ ] **Step 5: 통과 확인**

Run: `npx tsc --noEmit && npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: PASS (신규 9케이스 + 기존 전부).

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/promptBuilders.ts src/lib/server/promptBuilders.test.ts tools/storyx.mjs
git commit -m "feat(gate): 검토 프롬프트에 흡인력 조기 소진 신호 주입 (critic-reviewer 한정, CLI 미러)"
```

---

### Task 4: payoffStatus 배관 봉합 — reviewClient·브리지·CLI·prod 라우트

dev 브리지 `/api/review-agent`는 `--payoff-status`를 전달하지 않고 CLI도 파싱하지 않아, 기존 정체 신호(stakes_progression_audit)조차 dev에서 미발화였다(잠복 갭). 이 태스크가 봉합한다.

**Files:**
- Modify: `src/lib/reviewClient.ts` (19행 payoffStatus 타입)
- Modify: `vite.config.ts` (`storyxBridge('/api/review-agent', ...)` 161~177행)
- Modify: `tools/storyx.mjs` (review-agent 커맨드, 180~200행 부근)
- Modify: `api/review-agent.ts` (17행 타입 + 27~36행 정규화)
- Test: `src/lib/reviewClient.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/reviewClient.test.ts`에 describe 추가(기존 contractStatus describe 패턴 미러)

```ts
describe('requestAgentReview — payoffStatus 전달 (흡인력 게이트 2026-07-06)', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('payoffStatus(paidPromises 포함)를 /api/review-agent 요청 body 로 전달한다', async () => {
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ status: 'complete', verdict: 'pass', note: '', evidence: [], strengths: [], issues: [], memoryCandidates: [] }), { status: 200 });
    }));
    await requestAgentReview({
      agentId: 'critic-reviewer', target: '원고', medium: 'novel', context: '',
      payoffStatus: { isStalled: false, deferredStreak: 0, openPromises: 0, paidPromises: 3 }
    });
    expect(captured.payoffStatus).toEqual({ isStalled: false, deferredStreak: 0, openPromises: 0, paidPromises: 3 });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/reviewClient.test.ts`
Expected: FAIL — `paidPromises`가 타입에 없어 tsc/vitest 컴파일 에러(RED 증거). 이미 body 스프레드가 있으면 타입 에러만 날 수 있다.

- [ ] **Step 3: reviewClient 타입 넓힘** — `src/lib/reviewClient.ts` 19행

```ts
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number; paidPromises?: number };
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/reviewClient.test.ts`
Expected: PASS.

- [ ] **Step 5: dev 브리지 배선** — `vite.config.ts`의 `storyxBridge('/api/review-agent', ...)` 배열에서 `...(input.contractStatus != null` 블록 **앞**에 추가(draft 라우트 126~128행과 동일 패턴)

```ts
      ...(input.payoffStatus != null
        ? ['--payoff-status', JSON.stringify(input.payoffStatus)]
        : []),
```

- [ ] **Step 6: CLI 파싱 배선** — `tools/storyx.mjs` review-agent 커맨드(180행 부근)에서 `const contractStatusRaw = ...` 블록 **앞**에 추가하고, 커맨드의 `buildAgentReviewPrompt({ agentId, persona, target, medium, context, contractStatus })` 호출을 `buildAgentReviewPrompt({ agentId, persona, target, medium, context, payoffStatus, contractStatus })`로 교체

```js
  // 정체·흡인력 측정 신호 — 있으면 검토 프롬프트에 주입(흡인력 게이트 2026-07-06). 오형식은 무시.
  const payoffStatusRaw = readFlag(args, '--payoff-status', '');
  let payoffStatus;
  try {
    const parsedPayoff = payoffStatusRaw ? JSON.parse(payoffStatusRaw) : null;
    if (parsedPayoff && typeof parsedPayoff.deferredStreak === 'number') {
      payoffStatus = {
        isStalled: Boolean(parsedPayoff.isStalled),
        deferredStreak: parsedPayoff.deferredStreak,
        openPromises: typeof parsedPayoff.openPromises === 'number' ? parsedPayoff.openPromises : 0,
        paidPromises: typeof parsedPayoff.paidPromises === 'number' ? parsedPayoff.paidPromises : 0
      };
    }
  } catch { /* 오형식 플래그는 무시 */ }
```

- [ ] **Step 7: prod 라우트 배선** — `api/review-agent.ts`

17행 타입에 `paidPromises` 추가.

```ts
    payoffStatus?: { isStalled?: boolean; deferredStreak?: number; openPromises?: number; paidPromises?: number };
```

27~36행 정규화 객체에 `paidPromises` 필드 추가(openPromises 줄 다음).

```ts
          openPromises: typeof body.payoffStatus.openPromises === 'number' ? body.payoffStatus.openPromises : 0,
          paidPromises: typeof body.payoffStatus.paidPromises === 'number' ? body.payoffStatus.paidPromises : 0
```

- [ ] **Step 8: CLI 스모크 + 전체 게이트**

Run: `node tools/storyx.mjs review-agent --provider mock --agent critic-reviewer --target "본문" --medium novel --payoff-status '{"isStalled":false,"deferredStreak":0,"openPromises":0,"paidPromises":3}' --contract-status '{"remaining":12,"unpaidCount":0,"overBudget":false,"finalStretch":false}'`
Expected: mock JSON 정상 출력(크래시 0 — 프롬프트는 mock 경로라 미노출, 파싱 무사고 확인용).

Run: `npx tsc --noEmit && npx vitest run`
Expected: 전체 PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/reviewClient.ts src/lib/reviewClient.test.ts vite.config.ts tools/storyx.mjs api/review-agent.ts
git commit -m "fix(gate): review-agent 경로 payoffStatus 배관 봉합 (dev 브리지·CLI 파싱·prod whitelist)"
```

---

### Task 5: 전체 검증 게이트

- [ ] **Step 1: init.sh**

Run: `bash init.sh`
Expected: tsc 0 · vitest 전체 녹색 · build 성공.

- [ ] **Step 2: 최종 커밋 확인**

Run: `git status --short && git log --oneline -5`
Expected: 워킹트리 클린, Task 1~4 커밋 4개.

라이브(preview) 검증은 편집장이 수행 — 연재 작품에서 전체 검토 실행 → 마진에 평론가 카드(#7c87e5) 6번째 도착·흡인력 관점 note 확인 · 에세이 작품 5인 유지 · 콘솔 에러 0.
