# 작가 결정 갈림길 + 생성 측 회수 의무 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초안 생성 프롬프트가 페이오프 정체를 인지해 회수를 강제하고, 회차 생성 전 작가에게 결정론 갈림길 질문을 던져 작가 결정이 intent로 흘러들게 한다.

**Architecture:** 기존 `payoffLedger`(1단계)·`premise-progress`(2단계)의 측정값을 생성 경로(draft prompt)까지 연장하고, 신규 순수 모듈 `episodeBriefing.ts`가 레저·캐논에서 갈림길을 도출해 FloatingEditor 의도 메모 위 카드로 노출한다. LLM 추가 호출 없음 — 전부 결정론.

**Tech Stack:** TypeScript · Vitest(+jsdom) · React 18 · 기존 `.fc-*` floating 스타일 토큰.

**Spec:** `docs/superpowers/specs/2026-06-10-author-decision-forks-design.md`

---

### Task 1: `episodeBriefing.ts` — 갈림길 결정론 도출 (순수 함수)

**Files:**
- Create: `src/lib/episodeBriefing.ts`
- Test: `src/lib/episodeBriefing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/episodeBriefing.test.ts
import { describe, it, expect } from 'vitest';
import { buildEpisodeForks, composeIntentWithFork } from './episodeBriefing';
import { computePayoffLedger } from './payoffLedger';
import type { Chapter, StoryProject } from './storyEngine';
import { createEmptyProject } from './storyEngine';

function ch(episode: number, opts: Partial<Pick<Chapter, 'rewardArc' | 'stakesLedger'>> = {}): Chapter {
  return {
    id: `episode-${episode}`, episode, title: `${episode}화`, hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...opts
  };
}

function projectWith(chapters: Chapter[], openThreads: string[] = []): StoryProject {
  const project = createEmptyProject();
  return { ...project, chapters, openThreads };
}

describe('buildEpisodeForks', () => {
  it('레저·떡밥 데이터가 전혀 없으면 빈 배열 (거짓 질문 차단)', () => {
    const project = projectWith([ch(1), ch(2)]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toEqual([]);
  });

  it('정체 상태면 회수 갈림길(stalled-premise)이 첫 질문이고, 미회수 promise 가 옵션이다', () => {
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: '배신자의 정체', payoff: '' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { rewardArc: [{ promise: '오른편 장부의 주인', payoff: '' }] }),
      ch(4, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('stalled-premise');
    expect(forks[0].options.map((o) => o.label)).toContain('배신자의 정체');
    expect(forks[0].options[0].intentSeed.length).toBeGreaterThan(0);
  });

  it('정체가 아니면 진척 갈림길(open-promise)로 묻는다', () => {
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: '탑의 비밀', payoff: '' }, { promise: 'q', payoff: '회수됨' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('open-promise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['탑의 비밀']);
  });

  it('openThreads 가 있으면 떡밥 갈림길을 추가한다 (최대 3 옵션)', () => {
    const project = projectWith([], ['떡밥A', '떡밥B', '떡밥C', '떡밥D']);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('open-thread');
    expect(forks[0].options).toHaveLength(3);
  });
});

describe('composeIntentWithFork', () => {
  it('기존 메모에 줄바꿈으로 덧붙인다', () => {
    expect(composeIntentWithFork('기존 의도', '새 시드')).toBe('기존 의도\n새 시드');
  });

  it('빈 메모면 시드만 넣는다', () => {
    expect(composeIntentWithFork('  ', '새 시드')).toBe('새 시드');
  });

  it('이미 포함된 시드는 중복 추가하지 않는다', () => {
    expect(composeIntentWithFork('기존\n새 시드', '새 시드')).toBe('기존\n새 시드');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/episodeBriefing.test.ts`
Expected: FAIL — `Cannot find module './episodeBriefing'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/episodeBriefing.ts
// 회차 생성 전 작가에게 던질 갈림길 질문을 레저·캐논에서 결정론으로 도출한다 (작가 결정 유도 1단계).
// 정본 — docs/superpowers/specs/2026-06-10-author-decision-forks-design.md
import type { StoryProject } from './storyEngine';
import type { PayoffLedgerReport } from './payoffLedger';

export interface EpisodeForkOption {
  label: string;
  /** 선택 시 의도 메모에 합쳐질 한 줄 intent 문장. */
  intentSeed: string;
}

export interface EpisodeFork {
  id: string;
  source: 'stalled-premise' | 'open-promise' | 'open-thread';
  question: string;
  options: EpisodeForkOption[];
}

const MAX_FORKS = 3;
const MAX_OPTIONS = 3;

// 전 회차에서 payoff 가 비어 있는 promise 를 등장 순서대로 모은다 (중복 제거).
function collectUnpaidPromises(project: StoryProject): string[] {
  const unpaid: string[] = [];
  for (const chapter of project.chapters) {
    for (const entry of chapter.rewardArc ?? []) {
      const promise = entry.promise.trim();
      if (promise.length > 0 && entry.payoff.trim().length === 0 && !unpaid.includes(promise)) {
        unpaid.push(promise);
      }
    }
  }
  return unpaid;
}

export function buildEpisodeForks(project: StoryProject, ledger: PayoffLedgerReport): EpisodeFork[] {
  const forks: EpisodeFork[] = [];
  const unpaid = collectUnpaidPromises(project);

  if (ledger.measured && ledger.isStalled && unpaid.length > 0) {
    forks.push({
      id: 'fork-stalled-payoff',
      source: 'stalled-premise',
      question: `회수 없이 ${ledger.deferredStreak}회차째입니다. 이번 화에서 어느 약속을 실제로 회수할까요?`,
      options: unpaid.slice(-MAX_OPTIONS).map((promise) => ({
        label: promise,
        intentSeed: `이번 화에서 "${promise}"를 인물의 선택과 대가로 실제 회수한다.`
      }))
    });
  } else if (unpaid.length > 0) {
    forks.push({
      id: 'fork-open-promise',
      source: 'open-promise',
      question: '열린 약속 중 이번 화에서 진척시킬 것은 무엇인가요?',
      options: unpaid.slice(-MAX_OPTIONS).map((promise) => ({
        label: promise,
        intentSeed: `이번 화에서 "${promise}"에 인물의 행동으로 한 발 다가간다.`
      }))
    });
  }

  const threads = project.openThreads.filter((thread) => thread.trim().length > 0);
  if (threads.length > 0) {
    forks.push({
      id: 'fork-open-thread',
      source: 'open-thread',
      question: '열린 떡밥 중 이번 화의 중심에 둘 것은 무엇인가요?',
      options: threads.slice(0, MAX_OPTIONS).map((thread) => ({
        label: thread,
        intentSeed: `이번 화의 중심 사건은 "${thread}"다.`
      }))
    });
  }

  return forks.slice(0, MAX_FORKS);
}

// 갈림길 선택을 기존 의도 메모에 합친다 — append 원칙, 중복 무시.
export function composeIntentWithFork(currentIntent: string, seed: string): string {
  const base = currentIntent.trim();
  if (base.includes(seed)) return base;
  return base.length > 0 ? `${base}\n${seed}` : seed;
}
```

주의 — `createEmptyProject` 가 `storyEngine.ts` 에 export 돼 있는지 확인하고, 없으면 테스트 헬퍼에서 동등한 최소 `StoryProject` 리터럴을 직접 구성한다(다른 테스트 파일의 기존 프로젝트 픽스처 패턴을 재사용).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/episodeBriefing.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/episodeBriefing.ts src/lib/episodeBriefing.test.ts
git commit -m "feat(briefing): 회차 갈림길 결정론 도출 episodeBriefing (작가 결정 유도 1단계)"
```

---

### Task 2: `buildDraftPrompt` 정체 회수 의무 주입

**Files:**
- Modify: `src/lib/server/promptBuilders.ts:22-28` (DraftPromptInput) · `:184-218` (buildDraftPrompt)
- Test: `src/lib/server/promptBuilders.test.ts`

- [ ] **Step 1: Write the failing test** — 기존 `describe('buildDraftPrompt — …')` 블록에 추가

```ts
  it('정체 상태(payoffStatus.isStalled)면 연재 초안 프롬프트에 회수 의무를 주입한다', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x', title: 't', context: '',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 }
    });
    expect(p).toContain('전제 진척 정체');
    expect(p).toContain('3회차 연속');
    expect(p).toContain('열린 약속 4개');
    expect(p).toContain('최소 하나를');
  });

  it('정체가 아니거나 payoffStatus 가 없으면 회수 의무를 넣지 않는다', () => {
    const calm = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      payoffStatus: { isStalled: false, deferredStreak: 1, openPromises: 2 }
    });
    const absent = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x' });
    expect(calm).not.toContain('전제 진척 정체');
    expect(absent).not.toContain('전제 진척 정체');
  });

  it('단독 완결형은 정체여도 회수 의무를 넣지 않는다 (연재 전용)', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'short-novel', freewrite: 'x',
      payoffStatus: { isStalled: true, deferredStreak: 5, openPromises: 9 }
    });
    expect(p).not.toContain('전제 진척 정체');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: FAIL — `payoffStatus` 가 `DraftPromptInput` 에 없어 타입 에러, 또는 문구 미포함 단언 실패

- [ ] **Step 3: Implement**

`DraftPromptInput` 에 필드 추가(기존 `AgentReviewPromptInput.payoffStatus` 와 동형).

```ts
export interface DraftPromptInput {
  medium: string;
  format: CreativeFormat;
  freewrite: string;
  title?: string;
  context?: string;
  /** 아크 페이오프 — 정체 시 생성 프롬프트에 회수 의무를 주입한다. */
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number };
}
```

`buildDraftPrompt` 본문 — 구조분해에 `payoffStatus` 추가, `rules` 정의 직후에 삽입.

```ts
  const { medium, format, freewrite, title, context, payoffStatus } = input;
  // …(기존 role·rules 정의 그대로)…

  // 정체 측정값이 있으면 회수 의무를 생성 규칙으로 주입한다 (검토 evidence 와 동일 측정값 — 생성·검토 정합).
  const stallRules =
    isSerial && payoffStatus?.isStalled
      ? [
          `- [측정] 전제 진척 정체 — 회수 없이 ${payoffStatus.deferredStreak}회차 연속(열린 약속 ${payoffStatus.openPromises}개). 이번 회차는 새 약속을 만들지 말고, 열린 약속 중 최소 하나를 인물의 선택·대가·전환으로 실제 회수합니다. 그 회수를 rewardArc 의 payoff 에 기록합니다.`
        ]
      : [];
```

최종 join 배열에서 `...rules,` 바로 뒤에 `...stallRules,` 를 전개한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/server/promptBuilders.test.ts`
Expected: PASS (기존 + 신규 3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/promptBuilders.ts src/lib/server/promptBuilders.test.ts
git commit -m "feat(draft): 정체 시 생성 프롬프트에 회수 의무 주입 (payoffStatus → buildDraftPrompt)"
```

---

### Task 3: 배선 — api/draft · draftClient · StoryXDesk · storyx.mjs 미러

**Files:**
- Modify: `api/draft.ts:13-27`
- Modify: `src/lib/draftClient.ts:5-12`
- Modify: `src/StoryXDesk.tsx:1746-1752` (produceEpisode 내 requestLlmDraft 호출)
- Modify: `tools/storyx.mjs:227-235` (draft command) · `:710` (buildDraftPrompt 미러)
- Test: `src/lib/draftClient.test.ts`

- [ ] **Step 1: Write the failing test** — `draftClient.test.ts` 의 기존 fetch 모킹 패턴을 따라 추가

```ts
  it('payoffStatus 를 /api/draft 요청 body 로 전달한다', async () => {
    let captured: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ status: 'failed', warning: 'x' }), { status: 200 });
    }));
    await requestLlmDraft({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 }
    });
    expect(captured.payoffStatus).toEqual({ isStalled: true, deferredStreak: 3, openPromises: 4 });
  });
```

(파일의 실제 모킹 헬퍼가 다르면 그 헬퍼를 재사용 — 단언 대상은 "body 에 payoffStatus 포함" 하나다.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/draftClient.test.ts`
Expected: FAIL — `payoffStatus` 타입 에러

- [ ] **Step 3: Implement**

`draftClient.ts` — 필드만 추가하면 `JSON.stringify(input)` 가 자동 동봉한다.

```ts
export interface DraftRequestInput {
  medium: string;
  format: string;
  freewrite: string;
  title?: string;
  context?: string;
  /** 아크 페이오프 측정값 — 정체 시 생성 프롬프트가 회수를 강제한다. */
  payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number };
}
```

`api/draft.ts` — body 파싱에 추가(`api/review-agent.ts:26-35` 와 동형 가드).

```ts
  const body = (req.body ?? {}) as {
    medium?: string; format?: string; freewrite?: string; title?: string; context?: string;
    payoffStatus?: { isStalled?: boolean; deferredStreak?: number; openPromises?: number };
  };
  // …기존 파싱…
  const payoffStatus =
    body.payoffStatus && typeof body.payoffStatus === 'object' && typeof body.payoffStatus.deferredStreak === 'number'
      ? {
          isStalled: Boolean(body.payoffStatus.isStalled),
          deferredStreak: body.payoffStatus.deferredStreak,
          openPromises: typeof body.payoffStatus.openPromises === 'number' ? body.payoffStatus.openPromises : 0
        }
      : undefined;

  const prompt = buildDraftPrompt({ medium, format, freewrite, title, context, payoffStatus });
```

`StoryXDesk.tsx` `produceEpisode` — 검토 호출부(`:1034`·`:1140`·`:1819`)와 동형으로 동봉.

```ts
      const llm = await requestLlmDraft({
        medium: blueprint.medium,
        format: blueprint.format,
        freewrite: draftPrompt || request.intent,
        title: project.title,
        context: buildProjectContextDigest(project),
        payoffStatus: computePayoffLedger(project.chapters)
      });
```

(`computePayoffLedger` 는 StoryXDesk 에 이미 import 돼 있다. `PayoffLedgerReport` 는 `payoffStatus` 필요 필드의 상위집합이라 구조적으로 호환.)

`tools/storyx.mjs` — (a) `buildDraftPrompt({ medium, format, freewrite, title, context, payoffStatus })` 시그니처에 파라미터 추가 + promptBuilders.ts 와 동일한 `stallRules` 블록 미러. (b) draft command 에 플래그 추가.

```js
  const payoffStatusRaw = readFlag(args, '--payoff-status', '');
  let payoffStatus;
  try {
    const parsed = payoffStatusRaw ? JSON.parse(payoffStatusRaw) : null;
    if (parsed && typeof parsed.deferredStreak === 'number') {
      payoffStatus = {
        isStalled: Boolean(parsed.isStalled),
        deferredStreak: parsed.deferredStreak,
        openPromises: typeof parsed.openPromises === 'number' ? parsed.openPromises : 0
      };
    }
  } catch { /* 오형식 플래그는 무시 — 프롬프트 무변화 */ }
  const prompt = buildDraftPrompt({ medium, format, freewrite, title, context, payoffStatus });
```

- [ ] **Step 4: Run full gate**

Run: `npx vitest run && npx tsc --noEmit`
Expected: 전체 GREEN (기존 364+ 신규)

- [ ] **Step 5: Commit**

```bash
git add api/draft.ts src/lib/draftClient.ts src/StoryXDesk.tsx tools/storyx.mjs src/lib/draftClient.test.ts
git commit -m "feat(draft): payoffStatus 배선 — StoryXDesk→draftClient→api/draft→프롬프트 + storyx.mjs 미러"
```

---

### Task 4: FloatingEditor 갈림길 카드 + StoryXDesk 주입

**Files:**
- Modify: `src/components/FloatingEditor.tsx:35-76` (props) · `:598-628` (memo 영역)
- Modify: `src/StoryXDesk.tsx:1233-1262` (floatingEditorProps)
- Modify: `src/styles.css` (기존 `.fc-*` 블록 말미)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: Write the failing test** — 기존 jsdom 렌더 패턴(`floatingEditor.test.ts`)에 추가

```ts
  it('episodeForks 가 있으면 갈림길 카드를 렌더하고, 클릭 시 onIntentChange 로 시드가 합쳐진다', async () => {
    const seen: string[] = [];
    const { host, click, unmount } = mount(baseProps({
      intentMemo: '기존 의도',
      onIntentChange: (text: string) => seen.push(text),
      episodeForks: [{
        id: 'fork-open-thread', source: 'open-thread',
        question: '열린 떡밥 중 이번 화의 중심에 둘 것은 무엇인가요?',
        options: [{ label: '떡밥A', intentSeed: '이번 화의 중심 사건은 "떡밥A"다.' }]
      }]
    }));
    const button = host.querySelector('.fc-fork-opt') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(host.textContent).toContain('열린 떡밥');
    await click(button);
    expect(seen.at(-1)).toBe('기존 의도\n이번 화의 중심 사건은 "떡밥A"다.');
    unmount();
  });

  it('episodeForks 가 없으면 갈림길 카드를 렌더하지 않는다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.fc-forks')).toBeNull();
    unmount();
  });
```

(파일의 기존 `mount`·`baseProps`·`click` 헬퍼를 그대로 사용한다 — `floatingEditor.test.ts:29` 참조. `click` 시그니처가 다르면 기존 테스트의 클릭 방식을 복제한다.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — `episodeForks` prop 타입 에러

- [ ] **Step 3: Implement**

FloatingEditor props 에 추가.

```tsx
import { composeIntentWithFork, type EpisodeFork } from '../lib/episodeBriefing';
// props interface 에
  /** 회차 생성 전 작가 결정 갈림길 — 없으면 카드 미렌더. */
  episodeForks?: EpisodeFork[];
```

memo 영역(`<div className="memo">` 내부, `mh` 헤더 위)에 카드 렌더 + 선택 핸들러. textarea 는 uncontrolled(defaultValue)이므로 ref 로 직접 값을 갱신하고 `onIntentChange` 를 같이 부른다.

```tsx
  const intentRef = useRef<HTMLTextAreaElement | null>(null);
  function pickFork(seed: string) {
    if (!onIntentChange) return;
    const current = intentRef.current ? intentRef.current.value : intentMemo;
    const next = composeIntentWithFork(current, seed);
    if (intentRef.current) intentRef.current.value = next;
    onIntentChange(next);
  }
```

```tsx
          {episodeForks && episodeForks.length > 0 && (
            <div className="fc-forks">
              <div className="fc-forks-title">이번 화 갈림길 — 작가의 결정</div>
              {episodeForks.map((fork) => (
                <div key={fork.id} className="fc-fork">
                  <div className="fc-fork-q">{fork.question}</div>
                  <div className="fc-fork-opts">
                    {fork.options.map((opt) => (
                      <button key={opt.label} type="button" className="fc-fork-opt"
                        disabled={!onIntentChange} onClick={() => pickFork(opt.intentSeed)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="memo">
            {/* 기존 mh + textarea — textarea 에 ref={intentRef} 추가 */}
```

`src/styles.css` `.fc-*` 블록 말미에 추가(토큰은 기존 변수 재사용).

```css
.fc-forks { margin-bottom: 10px; display: grid; gap: 8px; }
.fc-forks-title { font-size: 11px; letter-spacing: 0.04em; color: var(--lc-text-dim, #8b93a7); }
.fc-fork-q { font-size: 12px; margin-bottom: 4px; }
.fc-fork-opts { display: flex; flex-wrap: wrap; gap: 6px; }
.fc-fork-opt {
  font-size: 11px; padding: 4px 10px; border-radius: 999px;
  border: 1px solid var(--lc-border, #2a3142); background: transparent;
  color: inherit; cursor: pointer;
}
.fc-fork-opt:hover:not(:disabled) { border-color: var(--p-show, #e8b04b); }
.fc-fork-opt:disabled { opacity: 0.4; cursor: default; }
```

`StoryXDesk.tsx` `floatingEditorProps` useMemo 에 주입.

```ts
import { buildEpisodeForks } from './lib/episodeBriefing';
// useMemo 내부
      episodeForks: buildEpisodeForks(project, computePayoffLedger(project.chapters)),
```

(useMemo 의존성 배열에 `project` 가 이미 있는지 확인 — 없으면 추가.)

- [ ] **Step 4: Run full gate**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: 전체 GREEN

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts src/StoryXDesk.tsx src/styles.css
git commit -m "feat(editor): 갈림길 카드 — 작가 결정이 의도 메모로 합쳐지는 fc-forks UI"
```

---

### Task 5: 라이브 검증 + 상태 문서

**Files:**
- Modify: `progress.md` · `session-handoff.md`
- Evidence: `docs/handoff/screenshots/author-decision-forks/` 캡처

- [ ] **Step 1: 라이브 검증 (Playwright 또는 수동)**

1. `bash init.sh` GREEN 확인 후 dev 서버 기동.
2. 기존 회차 누적 작품(#2 백업 `docs/reviews/2026-06-07-persona-live-test/backups/02-work-backup-ch23.json` localStorage 복원 가능)으로 진입.
3. 확인 항목 — (a) 의도 메모 위에 갈림길 카드 렌더·옵션 클릭 시 메모에 한 줄 append (b) 정체 상태 작품에서 회차 생성 시 dev 브리지 로그의 프롬프트에 "전제 진척 정체" 포함 (c) 갈림길 없는 새 작품에서 카드 미렌더 (d) 콘솔 에러 0.
4. 캡처 저장.

- [ ] **Step 2: progress.md·session-handoff.md 갱신**

작가 결정 갈림길 트랙 항목 추가 — 커밋 SHA·테스트 수·캡처 경로. 다음 단계로 "#3 헌터물 테스트에서 갈림길 사용/미사용 6축 비교" 명시.

- [ ] **Step 3: Commit**

```bash
git add progress.md session-handoff.md docs/handoff/screenshots/author-decision-forks/
git commit -m "docs: 작가 결정 갈림길 + 생성 측 회수 의무 완료 — progress·handoff 갱신"
```

---

## Follow-ups (이 계획 범위 밖 — 별도 스펙)

- **갈림길 LLM 정제 2단계** — 결정론 도출 결과가 어색하면 인터뷰 프롬프트 패턴(`buildEpisodeForkPrompt`)으로 질문·옵션을 다듬는다. 라이브 검증 결과를 보고 결정.
- **결정 부채 보드** — 미정 핵심 결정(미회수 promise·미캐논 인물 관계) 누적 추적을 FloatingDataWorkspace 정제 보드에 노출.
- **#3 헌터물 페르소나 테스트** — 갈림길 사용/미사용 A/B 6축 비교로 효과 실증.
