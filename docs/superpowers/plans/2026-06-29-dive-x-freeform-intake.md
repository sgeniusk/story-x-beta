# Dive X 자유 서술 진입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dive 앞문을 카드 선택에서 "자유 서술 한 칸 → 시스템이 주인공·관계인물·첫 장면을 추출 → 바로 대화 진입"으로 바꾸고, 제안 카드를 "막히면 제안 받기" 보조로 강등한다.

**Architecture:** 자유 서술 → 새 LLM 경로 `/api/dive-setup`이 단일 세팅 `{scene, cast, myRole}`을 추출. 시딩은 기존 `seedFromProposal`(파라미터 타입만 느슨하게)을 그대로 재사용. `DiveStart.tsx`가 자유 서술 1차 + 기존 제안 카드 흐름을 접이식 보조로 품는다. DiveDesk·scene-showrunner·응결 루프 무변경.

**Tech Stack:** TypeScript, React(정적 렌더 테스트), Vitest, Vite dev 브리지(`storyxBridge`), Node CLI(`tools/storyx.mjs`).

설계 정본 — `docs/superpowers/specs/2026-06-29-dive-x-freeform-intake-design.md`. 선행 — 제안 엔진 v1(main 머지).

---

## File Structure

- **Modify** `src/lib/diveProposal.ts` — `DiveSetup` 타입 추가, `seedFromProposal` 파라미터를 `Pick<DiveProposal,'scene'|'cast'>`로 느슨화(본문 무변경).
- **Modify** `src/lib/diveProposal.test.ts` — `DiveSetup` 시딩 케이스.
- **Modify** `src/lib/diveClient.ts` — `DiveSetup`/응답 타입 + `requestDiveSetup`(견고 파서).
- **Modify** `src/lib/diveClient.test.ts` — `requestDiveSetup` mock + null 폴백.
- **Modify** `tools/storyx.mjs` — `dive-setup` 커맨드.
- **Modify** `vite.config.ts` — `/api/dive-setup` 브리지 라우트.
- **Modify** `src/components/DiveStart.tsx` — 자유 서술 1차 + 제안 카드 보조 접이식, `onStart` prop 추가.
- **Modify** `src/components/diveStart.test.ts` — 자유 서술·시작하기·보조 토글 렌더.
- **Modify** `src/App.tsx` — `onStart` 배선(시드 공유 헬퍼).
- **Modify** `src/styles.css` — `.dx-start-story`·`.dx-inspire-toggle`·`.dx-inspire-panel`.

---

## Task 1: DiveSetup 타입 + seedFromProposal 느슨화

**Files:**
- Modify: `src/lib/diveProposal.ts`
- Test: `src/lib/diveProposal.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('diveProposal', ...)` block in `src/lib/diveProposal.test.ts` (before its closing `});`):

```ts
  it('seedFromProposal은 DiveSetup(twist·novelty 없음)도 받아 시딩한다', () => {
    const setup = {
      scene: '비 오는 편의점 야간',
      cast: [{ name: '단골', role: '첫사랑', desire: '알은척하고 싶다', wound: '먼저 떠난 사람', voiceRules: ['망설인다'] }],
      myRole: '야간 알바'
    };
    const seed = seedFromProposal(setup);
    expect(seed.scene).toBe('비 오는 편의점 야간');
    expect(seed.characters).toHaveLength(1);
    expect(seed.characters[0].name).toBe('단골');
    expect(seed.primaryCharacterId).toBe(seed.characters[0].id);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/diveProposal.test.ts`
Expected: FAIL — TypeScript error: object missing `hook`/`twist`/`novelty` is not assignable to `DiveProposal` (the test won't compile against the current strict signature).

- [ ] **Step 3: Write minimal implementation**

In `src/lib/diveProposal.ts`, add the `DiveSetup` type after the `DiveProposal` interface:

```ts
export interface DiveSetup {
  scene: string;
  cast: CastSeed[];
  myRole: string;
}
```

Then change the `seedFromProposal` signature line from:

```ts
export function seedFromProposal(p: DiveProposal): {
```

to (body unchanged — it only reads `p.scene` and `p.cast`):

```ts
export function seedFromProposal(p: Pick<DiveProposal, 'scene' | 'cast'>): {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/diveProposal.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diveProposal.ts src/lib/diveProposal.test.ts
git commit -m "feat(dive-x): DiveSetup 타입 + seedFromProposal 느슨화(scene·cast만)"
```

---

## Task 2: 브리지 클라이언트 — requestDiveSetup

**Files:**
- Modify: `src/lib/diveClient.ts`
- Test: `src/lib/diveClient.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('diveClient', ...)` block in `src/lib/diveClient.test.ts` (before its closing `});`):

```ts
  it('requestDiveSetup은 /api/dive-setup에 POST하고 setup을 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', setup: { scene: '편의점', cast: [{ name: '단골', role: '첫사랑', desire: 'd', wound: 'w', voiceRules: [] }], myRole: '알바' } })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveSetup({ story: '편의점 알바와 첫사랑 단골' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-setup', expect.objectContaining({ method: 'POST' }));
    expect(res.setup?.scene).toBe('편의점');
    expect(res.setup?.cast).toHaveLength(1);
  });

  it('requestDiveSetup은 빈약·누락 추출 시 setup null로 폴백한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'complete', setup: { scene: '', cast: [] } }) }));
    const res = await requestDiveSetup({ story: '음' });
    expect(res.setup).toBeNull();
  });
```

Update the import line at the top of the file to include the new function:

```ts
import { requestDiveChat, requestDiveCondense, requestDiveShowrunner, requestDiveProposals, requestDiveSetup } from './diveClient';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: FAIL — `requestDiveSetup is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/diveClient.ts`, update the diveProposal import line to also bring in `DiveSetup`:

```ts
import { isValidProposal, type DiveProposal, type DiveSetup, type NoveltyLevel } from './diveProposal';
```

Append at the end of the file:

```ts
export interface DiveSetupRequest { story: string; }
export interface DiveSetupResponse { status: string; setup: DiveSetup | null; warning?: string; }

function isValidSetup(x: unknown): x is DiveSetup {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  return typeof s.scene === 'string' && s.scene.trim() !== '' && Array.isArray(s.cast) && s.cast.length > 0;
}

export async function requestDiveSetup(req: DiveSetupRequest): Promise<DiveSetupResponse> {
  const raw = await postJson<Partial<DiveSetupResponse>>('/api/dive-setup', req);
  return {
    status: typeof raw.status === 'string' ? raw.status : 'complete',
    setup: isValidSetup(raw.setup) ? raw.setup : null,
    warning: raw.warning
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: PASS (all diveClient tests incl. 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive-x): requestDiveSetup 브리지 클라이언트 + null 폴백 (TDD)"
```

---

## Task 3: LLM 경로 — storyx.mjs dive-setup + vite 라우트

**Files:**
- Modify: `tools/storyx.mjs` (새 `if (command === 'dive-setup')` 블록 — 기존 `dive-propose` 블록 바로 뒤)
- Modify: `vite.config.ts` (`/api/dive-propose` 라우트 뒤에 추가)

- [ ] **Step 1: Add the storyx.mjs command**

In `tools/storyx.mjs`, immediately after the `if (command === 'dive-propose') { ... }` block, insert:

```js
if (command === 'dive-setup') {
  const provider = readFlag(args, '--provider', 'mock');
  const story = readFlag(args, '--story', '');
  const prompt = [
    '당신은 인터랙티브 스토리의 진입 세팅을 설계하는 작가입니다.',
    '사용자가 자유롭게 쓴 아래 서술에 **충실하게** 주인공·관계인물·첫 장면을 뽑으세요.',
    '서술에 없는 비틈·반전을 새로 지어내지 마세요. 서술을 존중하되 자연스럽게 구체화만.',
    '',
    '## 사용자 서술',
    story || '(비어 있음 — 잔잔한 일상 만남으로 시작)',
    '',
    'myRole = 사용자가 연기할 주인공의 입장. cast = 관계인물 2~3(이름·역할·desire·wound·voiceRules). scene = 장소·상황·내 목적을 담은 첫 현재 장면.',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "scene": "", "cast": [ { "name": "", "role": "", "desire": "", "wound": "", "voiceRules": [] } ], "myRole": "" }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({
      provider, mode: 'dive-setup', status: 'complete',
      setup: {
        scene: story ? `${story.slice(0, 40)} — 그 장면의 한가운데.` : '늦은 밤, 처음 마주친 자리.',
        cast: [{ name: '상대', role: story ? '서술 속 상대' : '낯선 사람', desire: '가까워지고 싶다', wound: '말 못 한 사정', voiceRules: ['짧게', '망설인다'] }],
        myRole: '이야기에 들어선 나'
      }
    });
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
    provider, mode: 'dive-setup',
    status: isError ? 'failed' : 'complete',
    setup: parsed && parsed.scene ? { scene: parsed.scene, cast: Array.isArray(parsed.cast) ? parsed.cast : [], myRole: parsed.myRole || '' } : null,
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

- [ ] **Step 2: Verify the mock shape via CLI**

Run: `node tools/storyx.mjs dive-setup --provider mock --story "편의점 야간 알바와 첫사랑 단골"`
Expected: JSON with `"mode":"dive-setup"`, `"status":"complete"`, and a `setup` object having non-empty `scene`, `cast` (length ≥1), `myRole`.

- [ ] **Step 3: Add the vite bridge route**

In `vite.config.ts`, after the `storyxBridge('/api/dive-propose', ...)` entry, add a comma and:

```ts
    storyxBridge('/api/dive-setup', (input) => [
      'tools/storyx.mjs',
      'dive-setup',
      '--provider', 'codex',
      '--story', String(input.story ?? '')
    ])
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/storyx.mjs vite.config.ts
git commit -m "feat(dive-x): dive-setup 커맨드 + /api/dive-setup 브리지 라우트"
```

---

## Task 4: 표면 재구성 — DiveStart 자유 서술 1차 + 제안 카드 보조

**Files:**
- Modify: `src/components/DiveStart.tsx`
- Modify: `src/components/diveStart.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Update the test**

Replace the body of `src/components/diveStart.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveStart } from './DiveStart';

describe('DiveStart', () => {
  it('자유 서술 칸과 시작하기 버튼을 1차로 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DiveStart, { onStart: () => {}, onPick: () => {}, onBack: () => {} })
    );
    expect(html).toContain('어떤 인물과');
    expect(html).toContain('시작하기');
    expect(html).toContain('dx-start-story');
  });

  it('제안 카드 보조 토글을 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DiveStart, { onStart: () => {}, onPick: () => {}, onBack: () => {} })
    );
    expect(html).toContain('막히면 제안 받기');
    expect(html).toContain('dx-inspire-toggle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/diveStart.test.ts`
Expected: FAIL — `onStart` is not a prop / "어떤 인물과" not found (current DiveStart renders the old topic form).

- [ ] **Step 3: Rewrite DiveStart.tsx**

Replace the entire contents of `src/components/DiveStart.tsx` with:

```tsx
// Dive X 진입 — 자유 서술로 인물·상황을 풀어 쓰면 세팅을 뽑아 바로 대화로. 제안 카드는 보조.
import { useState } from 'react';
import { requestDiveSetup, requestDiveProposals } from '../lib/diveClient';
import type { DiveProposal, DiveSetup, NoveltyLevel } from '../lib/diveProposal';

interface DiveStartProps {
  onStart: (setup: DiveSetup) => void;
  onPick: (proposal: DiveProposal) => void;
  onBack: () => void;
}

const NOVELTY_OPTIONS: Array<{ id: NoveltyLevel; label: string }> = [
  { id: 'safe', label: '안전' },
  { id: 'tilt', label: '살짝 비틈' },
  { id: 'bold', label: '과감' }
];

export function DiveStart({ onStart, onPick, onBack }: DiveStartProps) {
  const [story, setStory] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  // 보조 — 제안 카드
  const [inspireOpen, setInspireOpen] = useState(false);
  const [novelty, setNovelty] = useState<NoveltyLevel>('tilt');
  const [proposals, setProposals] = useState<DiveProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  async function start() {
    setStarting(true);
    setError('');
    try {
      const res = await requestDiveSetup({ story });
      if (res.setup) onStart(res.setup);
      else setError('조금만 더 적어주세요 — 누구와, 어디서, 무슨 상황인지 한두 줄이면 충분해요.');
    } catch {
      setError('시작 요청에 실패했어요.');
    } finally {
      setStarting(false);
    }
  }

  async function propose() {
    setLoadingProposals(true);
    setError('');
    try {
      const res = await requestDiveProposals({ topic: story, novelty });
      setProposals(res.proposals);
    } catch {
      setError('제안 요청에 실패했어요.');
    } finally {
      setLoadingProposals(false);
    }
  }

  return (
    <div className="dx-start">
      <button className="dx-back" onClick={onBack}>← 뒤로</button>
      <h2 className="dx-start-title">어떤 이야기로 들어갈까요?</h2>
      <label className="dx-start-label">어떤 인물과, 어떤 상황에서 시작하고 싶어요? 자유롭게 적어주세요.</label>
      <textarea
        className="dx-start-story"
        placeholder="예: 비 오는 날 편의점 야간 알바인데, 매일 우산을 사가는 단골이 사실 내가 잊은 첫사랑이라는 걸 오늘 알게 됨"
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <button className="dx-propose" onClick={start} disabled={starting}>
        {starting ? '시작하는 중…' : '시작하기'}
      </button>
      {error && <p className="dx-start-error">{error}</p>}

      <button className="dx-inspire-toggle" onClick={() => setInspireOpen((v) => !v)}>
        {inspireOpen ? '제안 닫기' : '막히면 제안 받기'}
      </button>
      {inspireOpen && (
        <div className="dx-inspire-panel">
          <div className="dx-novelty-dial">
            {NOVELTY_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={o.id === novelty ? 'dx-novelty-on' : 'dx-novelty-off'}
                onClick={() => setNovelty(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button className="dx-propose" onClick={propose} disabled={loadingProposals}>
            {loadingProposals ? '제안 만드는 중…' : '제안 받기'}
          </button>
          <div className="dx-proposal-list">
            {proposals.map((p, i) => (
              <button key={i} className="dx-proposal-card" onClick={() => onPick(p)}>
                <span className="dx-twist-tag">{p.twist}</span>
                <strong className="dx-proposal-hook">{p.hook}</strong>
                <span className="dx-proposal-scene">{p.scene}</span>
                <span className="dx-proposal-cast">{p.cast.map((c) => c.name).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/diveStart.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add styles**

In `src/styles.css`, immediately after the existing `.dx-start-input { ... }` rule, add:

```css
.dx-start-story { background: #16171a; color: #f2f3f7; border: 1px solid #3a3c43; border-radius: 8px; padding: 12px; min-height: 120px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.6; }
.dx-inspire-toggle { align-self: flex-start; background: #1c1d21; color: #c4b6ff; border: 1px solid #34363d; border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; margin-top: 8px; }
.dx-inspire-panel { display: flex; flex-direction: column; gap: 10px; border: 1px solid #34363d; border-radius: 10px; padding: 14px; background: rgba(124,92,255,0.04); }
```

- [ ] **Step 6: Commit**

```bash
git add src/components/DiveStart.tsx src/components/diveStart.test.ts src/styles.css
git commit -m "feat(dive-x): DiveStart 자유 서술 1차 + 제안 카드 보조 강등 (TDD)"
```

---

## Task 5: 배선 — App.tsx onStart

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the DiveProposal type import**

In `src/App.tsx`, update the diveProposal import line (currently `import { seedFromProposal } from './lib/diveProposal';`) to:

```ts
import { seedFromProposal, type DiveProposal, type DiveSetup } from './lib/diveProposal';
```

- [ ] **Step 2: Replace the `stage === 'dive'` DiveStart branch**

In `src/App.tsx`, find the `return ( <DiveStart ... /> )` block inside `if (stage === 'dive')` and replace the whole `return ( <DiveStart .../> )` with a shared-seed version:

```tsx
    const seedAndEnter = (src: Pick<DiveProposal, 'scene' | 'cast'>, title: string) => {
      const { scene, characters, primaryCharacterId } = seedFromProposal(src);
      const project = { ...createEmptyProject({ title: title.slice(0, 20) || 'Dive' }), characters };
      const session = { ...createDiveSession(primaryCharacterId, project.id), scene };
      const init: DiveState = { schema: 'storyx/dive/v1', session, project };
      saveDiveState(init);
      setDiveInit(init);
    };
    return (
      <DiveStart
        onBack={() => setStage('editor')}
        onStart={(setup: DiveSetup) => seedAndEnter(setup, setup.myRole || setup.scene)}
        onPick={(p: DiveProposal) => seedAndEnter(p, p.hook)}
      />
    );
```

> This replaces the previous inline `onPick` block. The `restored`/`diveInit` early-returns above it stay unchanged.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites green).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(dive-x): 자유 서술 onStart 배선 — 공유 시드 헬퍼"
```

---

## Task 6: 라이브 검증 + 마무리

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: `tsc --noEmit && vite build` 성공.

- [ ] **Step 2: Live one-loop check**

`preview_start` → open `?stage=dive` (clear `serial-story-studio/dive` first). Verify:
1. 자유 서술 큰 칸 + 시작하기 + "막히면 제안 받기" 토글이 보인다.
2. 자유 서술 입력 → 시작하기 → (codex ~90초) → 바로 DiveDesk 진입, 🎬 현재 장면에 서술이 반영된 scene, 캐스트 시딩.
3. 뒤로 → "막히면 제안 받기" 펼침 → 다이얼 + 제안 받기 → 카드 → 선택 시 동일 진입.
4. 콘솔 에러 0.

`preview_console_logs`(errors)·`preview_screenshot`로 증거 확보. codex 지연이 길면 실 provider 경로는 CLI(`node tools/storyx.mjs dive-setup --provider codex --story "..."`)로 별도 결정론 확인.

- [ ] **Step 3: Update progress.md + session-handoff.md**

`progress.md` Dive X 절에 자유 서술 진입 done 추가(증거 — 커밋 SHA·라이브 캡처). `session-handoff.md` 맨 위 새 인계(손대지 말 것 — scene-showrunner·응결 무변경, 제안 카드 보조 보존 / 다음 — 선택지 액션 강화 or 취향 프로필).

- [ ] **Step 4: Final commit**

```bash
git add progress.md session-handoff.md
git commit -m "docs(dive-x): 자유 서술 진입 완료 — progress·handoff 갱신"
```

---

## Self-Review (작성자 체크 결과)

- **Spec coverage** — §3.1 단위 전부(diveProposal DiveSetup→T1, dive-setup route→T3, requestDiveSetup→T2, DiveStart 재구성→T4, App onStart→T5, styles→T4) · §3.2 흐름→T5 · §6 DoD→T5(test)+T6(build·라이브). 누락 없음.
- **Placeholder scan** — 모든 코드 단계 실제 코드. 스타일 토큰은 기존 `.dx-*` hex 어휘 재사용.
- **Type consistency** — `DiveSetup`(T1) ↔ `requestDiveSetup`(T2) ↔ `dive-setup` 출력(T3) ↔ `DiveStart.onStart`(T4) ↔ `App.onStart`(T5) 일치. `seedFromProposal`는 T1에서 `Pick<DiveProposal,'scene'|'cast'>`로 느슨화 → `DiveSetup`·`DiveProposal` 둘 다 수용. `setDiveInit`·`createEmptyProject`·`createDiveSession`·`saveDiveState`는 기존 App 심볼.
