# Dive X 제안 엔진 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 소재 한 줄 + 신기성 다이얼을 주면 서로 다른 비틈 벡터의 장면 전제 후보 3~5개를 추천하고, 고르면 그게 scene-showrunner DiveDesk로 시딩되는 진입 단계를 만든다.

**Architecture:** 순수 도메인(`diveProposal.ts`)이 후보 타입·비틈 벡터 카탈로그·`seedFromProposal`(후보→공유 모델) 변환을 소유한다. LLM 경로는 기존 dive 브리지 패턴 복제(`/api/dive-propose` + `tools/storyx.mjs` dive-propose 미러). 얇은 표면 `DiveStart.tsx`가 폼·후보 카드를 그리고, `App.tsx`가 `stage==='dive'` 진입에서 자동 시드 대신 DiveStart를 띄운다. 선택 후 기존 scene-showrunner·arc·응결 루프는 무변경.

**Tech Stack:** TypeScript, React(정적 렌더 테스트 `react-dom/server`), Vitest, Vite dev 브리지(`storyxBridge`), Node CLI(`tools/storyx.mjs`).

설계 정본 — `docs/superpowers/specs/2026-06-28-dive-x-proposal-engine-design.md`.

---

## File Structure

- **Create** `src/lib/diveProposal.ts` — 순수. 타입(`NoveltyLevel`·`CastSeed`·`DiveProposal`), `TWIST_VECTORS` 상수, `seedFromProposal`, `isValidProposal`.
- **Create** `src/lib/diveProposal.test.ts` — 위 순수 함수 TDD.
- **Modify** `src/lib/diveClient.ts` — `DiveProposalRequest`·`DiveProposalResponse` 타입 + `requestDiveProposals`(견고 정규화).
- **Modify** `src/lib/diveClient.test.ts` — `requestDiveProposals` fetch mock 테스트.
- **Modify** `tools/storyx.mjs` — `dive-propose` 커맨드(프롬프트 + mock + provider 분기).
- **Modify** `vite.config.ts` — `/api/dive-propose` 브리지 라우트 1개.
- **Create** `src/components/DiveStart.tsx` — 소재·다이얼·후보 카드 표면.
- **Create** `src/components/diveStart.test.ts` — 정적 렌더 테스트.
- **Modify** `src/App.tsx` — `stage==='dive'`에서 DiveStart 진입 + 선택 시 시드.
- **Modify** `src/styles.css` — `.dx-start`·`.dx-proposal-card`·`.dx-novelty-dial`·`.dx-twist-tag`.

---

## Task 1: 순수 도메인 — diveProposal.ts

**Files:**
- Create: `src/lib/diveProposal.ts`
- Test: `src/lib/diveProposal.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/diveProposal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TWIST_VECTORS, seedFromProposal, isValidProposal, type DiveProposal } from './diveProposal';

const sample: DiveProposal = {
  hook: '10년 산 가족이 외계인일지 모른다는 쪽지를 받았다',
  scene: '도윤네 집 앞. 도윤은 학원, 집엔 도윤 母만 있다.',
  cast: [
    { name: '도윤 母', role: '정체 모를 어머니', desire: '가족을 지킨다', wound: '말 못 할 비밀', voiceRules: ['부드럽게', '질문엔 되묻는다'] },
    { name: '도윤', role: '소꿉친구', desire: '평범하고 싶다', wound: '의심받는 가족', voiceRules: ['짧고 퉁명스럽게'] }
  ],
  myRole: '몰래 확인하러 온 사람',
  twist: '정체 전복',
  novelty: 'tilt'
};

describe('diveProposal', () => {
  it('비틈 벡터는 5종이고 라벨이 고유하다', () => {
    expect(TWIST_VECTORS).toHaveLength(5);
    expect(new Set(TWIST_VECTORS.map((v) => v.label)).size).toBe(5);
    for (const v of TWIST_VECTORS) expect(v.instruction).not.toBe('');
  });

  it('seedFromProposal은 scene을 그대로, cast를 CharacterProfile로, 첫 인물을 primary로 매핑한다', () => {
    const seed = seedFromProposal(sample);
    expect(seed.scene).toBe(sample.scene);
    expect(seed.characters).toHaveLength(2);
    const first = seed.characters[0];
    expect(first.name).toBe('도윤 母');
    expect(first.role).toBe('정체 모를 어머니');
    expect(Array.isArray(first.canonAnchors)).toBe(true);
    expect(Array.isArray(first.forbiddenContradictions)).toBe(true);
    expect(Array.isArray(first.relations)).toBe(true);
    expect(seed.primaryCharacterId).toBe(first.id);
    expect(new Set(seed.characters.map((c) => c.id)).size).toBe(2);
  });

  it('isValidProposal은 필수 필드 누락 후보를 거른다', () => {
    expect(isValidProposal(sample)).toBe(true);
    expect(isValidProposal({ ...sample, hook: '' })).toBe(false);
    expect(isValidProposal({ ...sample, cast: [] })).toBe(false);
    expect(isValidProposal({ hook: 'x', scene: 'y' })).toBe(false);
    expect(isValidProposal(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/diveProposal.test.ts`
Expected: FAIL — `Cannot find module './diveProposal'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/diveProposal.ts`:

```ts
// Dive X 제안 엔진 순수 도메인 — 후보 타입·비틈 벡터 카탈로그·후보→공유 모델 시드 변환
import type { CharacterProfile } from './storyEngine';

export type NoveltyLevel = 'safe' | 'tilt' | 'bold';

export interface CastSeed {
  name: string;
  role: string;
  desire: string;
  wound: string;
  voiceRules: string[];
}

export interface DiveProposal {
  hook: string;
  scene: string;
  cast: CastSeed[];
  myRole: string;
  twist: string;
  novelty: NoveltyLevel;
}

// 한 소재에서 후보를 뽑을 때 각 후보에 서로 다른 축을 배정해 전형성 편향과 싸운다.
export const TWIST_VECTORS: Array<{ label: string; instruction: string }> = [
  { label: '정체 전복', instruction: '인물의 진짜 정체나 목적이 표면과 다르게.' },
  { label: '시간 구조', instruction: '반복·역행·이미 일어난 일 등 시간축을 비튼다.' },
  { label: '관계 역전', instruction: '기억·권력·앎의 비대칭으로 관계를 뒤집는다.' },
  { label: '장르 전환', instruction: '평범한 일상이 사실 다른 장르(재난·미스터리·SF)의 입구.' },
  { label: '톤 반전', instruction: '기대한 정서와 반대로(재회→작별, 위로→위협).' }
];

function slug(name: string, i: number): string {
  return `cast-${i}`;
}

export function seedFromProposal(p: DiveProposal): {
  scene: string;
  characters: CharacterProfile[];
  primaryCharacterId: string;
} {
  const characters: CharacterProfile[] = p.cast.map((c, i) => ({
    id: slug(c.name, i),
    name: c.name,
    role: c.role,
    desire: c.desire,
    wound: c.wound,
    currentState: '',
    voiceRules: Array.isArray(c.voiceRules) ? c.voiceRules : [],
    canonAnchors: [],
    forbiddenContradictions: [],
    relations: []
  }));
  return {
    scene: p.scene,
    characters,
    primaryCharacterId: characters[0]?.id ?? ''
  };
}

export function isValidProposal(x: unknown): x is DiveProposal {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.hook === 'string' && p.hook.trim() !== '' &&
    typeof p.scene === 'string' && p.scene.trim() !== '' &&
    Array.isArray(p.cast) && p.cast.length > 0
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/diveProposal.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diveProposal.ts src/lib/diveProposal.test.ts
git commit -m "feat(dive-x): 제안 엔진 순수 도메인 — 비틈 벡터·seedFromProposal (TDD)"
```

---

## Task 2: 브리지 클라이언트 — requestDiveProposals

**Files:**
- Modify: `src/lib/diveClient.ts`
- Test: `src/lib/diveClient.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('diveClient', ...)` block in `src/lib/diveClient.test.ts` (before its closing `});`):

```ts
  it('requestDiveProposals는 /api/dive-propose에 POST하고 유효 후보만 통과시킨다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'complete',
        proposals: [
          { hook: '쪽지를 받았다', scene: '집 앞', cast: [{ name: '母', role: 'r', desire: 'd', wound: 'w', voiceRules: [] }], myRole: '나', twist: '정체 전복', novelty: 'tilt' },
          { hook: '', scene: '빈 후보', cast: [] }
        ]
      })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveProposals({ topic: '소꿉친구', novelty: 'tilt' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-propose', expect.objectContaining({ method: 'POST' }));
    expect(res.proposals).toHaveLength(1);
    expect(res.proposals[0].hook).toBe('쪽지를 받았다');
  });

  it('requestDiveProposals는 proposals 누락 시 빈 배열로 폴백한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'failed', warning: 'x' }) }));
    const res = await requestDiveProposals({ topic: '', novelty: 'safe' });
    expect(res.proposals).toEqual([]);
    expect(res.warning).toBe('x');
  });
```

Then update the import line at the top of the file to include the new function:

```ts
import { requestDiveChat, requestDiveCondense, requestDiveShowrunner, requestDiveProposals } from './diveClient';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: FAIL — `requestDiveProposals is not a function` / no export.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/diveClient.ts` (end of file). Add the import at the top of the file:

```ts
import { isValidProposal, type DiveProposal, type NoveltyLevel } from './diveProposal';
```

Then at the end:

```ts
export interface DiveProposalRequest { topic: string; novelty: NoveltyLevel; }
export interface DiveProposalResponse { status: string; proposals: DiveProposal[]; warning?: string; }

export async function requestDiveProposals(req: DiveProposalRequest): Promise<DiveProposalResponse> {
  const raw = await postJson<Partial<DiveProposalResponse>>('/api/dive-propose', req);
  const proposals = Array.isArray(raw.proposals) ? raw.proposals.filter(isValidProposal) : [];
  return { status: typeof raw.status === 'string' ? raw.status : 'complete', proposals, warning: raw.warning };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: PASS (all diveClient tests incl. 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive-x): requestDiveProposals 브리지 클라이언트 + 견고 정규화 (TDD)"
```

---

## Task 3: LLM 경로 — storyx.mjs dive-propose + vite 라우트

**Files:**
- Modify: `tools/storyx.mjs` (새 `if (command === 'dive-propose')` 블록 — 기존 `dive-showrunner` 블록 바로 뒤, line ~426)
- Modify: `vite.config.ts` (`storyxBridge('/api/dive-showrunner', ...)` 뒤에 라우트 추가, line ~285)

- [ ] **Step 1: Add the storyx.mjs command**

In `tools/storyx.mjs`, immediately after the `if (command === 'dive-showrunner') { ... }` block (ends ~line 426), insert:

```js
if (command === 'dive-propose') {
  const provider = readFlag(args, '--provider', 'mock');
  const topic = readFlag(args, '--topic', '');
  const novelty = readFlag(args, '--novelty', 'tilt');
  const vectors = [
    { label: '정체 전복', instruction: '인물의 진짜 정체나 목적이 표면과 다르게.' },
    { label: '시간 구조', instruction: '반복·역행·이미 일어난 일 등 시간축을 비튼다.' },
    { label: '관계 역전', instruction: '기억·권력·앎의 비대칭으로 관계를 뒤집는다.' },
    { label: '장르 전환', instruction: '평범한 일상이 사실 다른 장르의 입구.' },
    { label: '톤 반전', instruction: '기대한 정서와 반대로.' }
  ];
  const strength = novelty === 'safe' ? '비틈을 옅게, 친숙하고 정통적으로.'
    : novelty === 'bold' ? '비틈을 과감하게, 고-콘셉트로.'
    : '한 겹만 비튼다.';
  const prompt = [
    '당신은 인터랙티브 스토리의 진입 전제를 설계하는 작가입니다.',
    `사용자 소재 — ${topic || '(자유)'}`,
    `신기성 — ${strength}`,
    '아래 5개 비틈 벡터를 각 후보에 하나씩 배정해, 서로 뚜렷이 다른 장면 전제 후보 4개를 만드세요(클리셰 금지).',
    ...vectors.map((v) => `- ${v.label}: ${v.instruction}`),
    '각 후보는 한 문장 훅, 현재 장면(장소·상황·내 목적), 캐스트 2~3명(이름·역할·desire·wound·voiceRules), 내 진입점을 담습니다.',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "proposals": [ { "hook": "", "scene": "", "cast": [ { "name": "", "role": "", "desire": "", "wound": "", "voiceRules": [] } ], "myRole": "", "twist": "라벨", "novelty": "' + novelty + '" } ] }'
  ].join('\n');

  if (provider === 'mock') {
    const mk = (hook, scene, name, twist) => ({
      hook, scene,
      cast: [{ name, role: '소재 속 인물', desire: '가까워지고 싶다', wound: '말 못 한 마음', voiceRules: ['짧게'] }],
      myRole: '이야기에 들어선 나', twist, novelty
    });
    printJson({
      provider, mode: 'dive-propose', status: 'complete',
      proposals: [
        mk(`${topic || '그 사람'}이 사실 나를 찾아온 이유가 따로 있다`, `${topic || '그 사람'}과 마주 선 골목. 무언가 숨기는 눈빛.`, topic || '그 사람', '정체 전복'),
        mk(`오늘이 ${topic || '이 만남'}의 세 번째 반복인 걸 그 사람만 안다`, '같은 장면이 다시 시작된다. 어딘가 익숙하다.', topic || '그 사람', '시간 구조'),
        mk(`나는 기억 못 하는데 그 사람만 우리 과거를 다 안다`, '처음 보는 얼굴이 내 이름을 부른다.', topic || '그 사람', '관계 역전')
      ]
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
    provider, mode: 'dive-propose',
    status: isError ? 'failed' : 'complete',
    proposals: Array.isArray(parsed?.proposals) ? parsed.proposals : [],
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

- [ ] **Step 2: Verify the mock shape via CLI**

Run: `node tools/storyx.mjs dive-propose --provider mock --topic 소꿉친구 --novelty tilt`
Expected: JSON with `"mode":"dive-propose"`, `"status":"complete"`, and `proposals` array of length 3, each having `hook`, `scene`, `cast` (non-empty), `twist`, `novelty`. Eyeball that the three `twist` labels differ (정체 전복 / 시간 구조 / 관계 역전).

- [ ] **Step 3: Add the vite bridge route**

In `vite.config.ts`, after the `storyxBridge('/api/dive-showrunner', ...)` entry (ends ~line 285), add a comma and:

```ts
    storyxBridge('/api/dive-propose', (input) => [
      'tools/storyx.mjs',
      'dive-propose',
      '--provider', 'codex',
      '--topic', String(input.topic ?? ''),
      '--novelty', String(input.novelty ?? 'tilt')
    ])
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors).

- [ ] **Step 5: Commit**

```bash
git add tools/storyx.mjs vite.config.ts
git commit -m "feat(dive-x): dive-propose 커맨드 + /api/dive-propose 브리지 라우트"
```

---

## Task 4: 표면 — DiveStart.tsx + 스타일

**Files:**
- Create: `src/components/DiveStart.tsx`
- Create: `src/components/diveStart.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `src/components/diveStart.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveStart } from './DiveStart';

describe('DiveStart', () => {
  it('소재 입력·신기성 다이얼·제안 버튼을 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(DiveStart, { onPick: () => {}, onBack: () => {} })
    );
    expect(html).toContain('소재');
    expect(html).toContain('제안 받기');
    expect(html).toContain('dx-novelty-dial');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/diveStart.test.ts`
Expected: FAIL — `Cannot find module './DiveStart'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/DiveStart.tsx`:

```tsx
// Dive X 진입 — 소재 한 줄 + 신기성 다이얼로 장면 전제 후보를 추천받아 고른다
import { useState } from 'react';
import { requestDiveProposals } from '../lib/diveClient';
import type { DiveProposal, NoveltyLevel } from '../lib/diveProposal';

interface DiveStartProps {
  onPick: (proposal: DiveProposal) => void;
  onBack: () => void;
}

const NOVELTY_OPTIONS: Array<{ id: NoveltyLevel; label: string }> = [
  { id: 'safe', label: '안전' },
  { id: 'tilt', label: '살짝 비틈' },
  { id: 'bold', label: '과감' }
];

export function DiveStart({ onPick, onBack }: DiveStartProps) {
  const [topic, setTopic] = useState('');
  const [novelty, setNovelty] = useState<NoveltyLevel>('tilt');
  const [proposals, setProposals] = useState<DiveProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function propose() {
    setLoading(true);
    setError('');
    try {
      const res = await requestDiveProposals({ topic, novelty });
      setProposals(res.proposals);
      if (res.proposals.length === 0) setError('제안을 만들지 못했어요. 소재를 바꿔 다시 시도해 보세요.');
    } catch {
      setError('제안 요청에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dx-start">
      <button className="dx-back" onClick={onBack}>← 뒤로</button>
      <h2 className="dx-start-title">어떤 이야기로 들어갈까요?</h2>
      <label className="dx-start-label">소재 한 줄</label>
      <textarea
        className="dx-start-input"
        placeholder="예: 소꿉친구 / 폐가 / 마지막 기차"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
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
      <button className="dx-propose" onClick={propose} disabled={loading}>
        {loading ? '제안 만드는 중…' : '제안 받기'}
      </button>
      {error && <p className="dx-start-error">{error}</p>}
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
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/diveStart.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Add styles**

Append to `src/styles.css` (Linear 다크 토큰 사용 — 기존 `.dx-*` 규칙 인근):

```css
.dx-start { display: flex; flex-direction: column; gap: 12px; max-width: 640px; margin: 0 auto; padding: 24px; }
.dx-start-title { color: var(--lc-text-primary); font-size: 20px; margin: 4px 0; }
.dx-start-label { color: var(--lc-text-secondary); font-size: 13px; }
.dx-start-input { background: var(--lc-surface-raised); color: var(--lc-text-primary); border: 1px solid var(--lc-border); border-radius: 8px; padding: 10px; min-height: 56px; resize: vertical; }
.dx-novelty-dial { display: flex; gap: 6px; }
.dx-novelty-on { background: var(--sx-accent); color: #fff; border: none; border-radius: 999px; padding: 6px 14px; cursor: pointer; }
.dx-novelty-off { background: var(--lc-surface-raised); color: var(--lc-text-secondary); border: 1px solid var(--lc-border); border-radius: 999px; padding: 6px 14px; cursor: pointer; }
.dx-propose { background: var(--sx-accent); color: #fff; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; align-self: flex-start; }
.dx-propose:disabled { opacity: 0.6; cursor: default; }
.dx-start-error { color: var(--lc-text-secondary); font-size: 13px; }
.dx-proposal-list { display: flex; flex-direction: column; gap: 10px; }
.dx-proposal-card { display: flex; flex-direction: column; gap: 6px; text-align: left; background: var(--lc-surface-raised); border: 1px solid var(--lc-border); border-radius: 10px; padding: 14px; cursor: pointer; }
.dx-proposal-card:hover { border-color: var(--sx-accent); }
.dx-twist-tag { align-self: flex-start; font-size: 11px; color: var(--nx-accent, var(--sx-accent)); border: 1px solid var(--lc-border); border-radius: 999px; padding: 2px 8px; }
.dx-proposal-hook { color: var(--lc-text-primary); font-size: 15px; }
.dx-proposal-scene { color: var(--lc-text-secondary); font-size: 13px; }
.dx-proposal-cast { color: var(--lc-text-tertiary, var(--lc-text-secondary)); font-size: 12px; }
```

> Note: if any `--lc-*`/`--sx-*`/`--nx-*` token name above does not exist in `src/styles.css`, grep the existing `.dx-*` rules and reuse the exact token names they use (do not invent tokens).

- [ ] **Step 6: Commit**

```bash
git add src/components/DiveStart.tsx src/components/diveStart.test.ts src/styles.css
git commit -m "feat(dive-x): DiveStart 진입 표면 — 소재·신기성 다이얼·후보 카드 (TDD)"
```

---

## Task 5: 배선 — App.tsx 진입 교체

**Files:**
- Modify: `src/App.tsx` (`stage === 'dive'` 블록 line ~274-292, 그리고 import 추가)

- [ ] **Step 1: Add imports**

In `src/App.tsx`, near the existing dive imports (line ~77-79), add:

```ts
import { DiveStart } from './components/DiveStart';
import { seedFromProposal } from './lib/diveProposal';
import { createEmptyProject } from './lib/storyEngine';
```

> If `createEmptyProject` is already imported elsewhere in `App.tsx`, do not duplicate the import — reuse the existing one.

- [ ] **Step 2: Replace the `stage === 'dive'` block**

Replace the entire `if (stage === 'dive') { ... }` block (line ~274-292) with:

```tsx
  if (stage === 'dive') {
    const restored = loadDiveState();
    if (restored) {
      return <DiveStage initial={restored} onBack={() => setStage('editor')} />;
    }
    if (diveInit) {
      return <DiveStage initial={diveInit} onBack={() => setStage('editor')} />;
    }
    return (
      <DiveStart
        onBack={() => setStage('editor')}
        onPick={(p) => {
          const { scene, characters, primaryCharacterId } = seedFromProposal(p);
          const project = {
            ...createEmptyProject({ title: p.hook.slice(0, 20) || 'Dive' }),
            characters
          };
          const session = { ...createDiveSession(primaryCharacterId, project.id), scene };
          const init: DiveState = { schema: 'storyx/dive/v1', session, project };
          saveDiveState(init);
          setDiveInit(init);
        }}
      />
    );
  }
```

- [ ] **Step 3: Add the diveInit state**

In the `App()` function body, near the other `useState` declarations (line ~197-201), add:

```ts
  const [diveInit, setDiveInit] = useState<DiveState | null>(null);
```

> Remove the now-unused `DIVE_SEED_CHARACTERS` import if TypeScript/lint flags it as unused (it is no longer referenced in App.tsx after this change). DiveDesk still imports it for its own fallback, so only remove the App.tsx import line.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites green, including new diveProposal/diveClient/diveStart tests).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(dive-x): dive 진입을 DiveStart 제안 흐름으로 교체"
```

---

## Task 6: 라이브 검증 + 마무리

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: `tsc --noEmit && vite build` 성공.

- [ ] **Step 2: Live one-loop check**

Start dev server, open `?stage=dive` (clear localStorage `serial-story-studio/dive` first if a session is restored). Verify:
1. DiveStart 화면 — 소재 입력 + 신기성 다이얼 + 제안 버튼이 보인다.
2. 소재 입력 후 "제안 받기" → 후보 카드 3개 이상, 각 카드의 `twist` 태그가 서로 다르다.
3. 카드 선택 → DiveDesk 진입, 🎬 현재 장면 패널에 선택한 `scene`이 들어가 있고, 캐스트가 시딩됐다.
4. 콘솔 에러 0.

Use preview tools (preview_start → preview_snapshot/preview_console_logs) per the harness verification workflow. Capture a screenshot as evidence.

- [ ] **Step 3: Update progress.md**

Update `progress.md` '최근 검증' + 활성 작업을 이 기능 완료로 갱신(증거 — 커밋 SHA·`docs/superpowers/plans/2026-06-28-dive-x-proposal-engine.md`·라이브 캡처 경로).

- [ ] **Step 4: Session handoff**

`session-handoff.md` 맨 위에 인계 노트 추가 — 손대지 말 것(scene-showrunner·arc·응결 무변경) + 다음 조각(취향 프로필 #1 또는 스티어링 #3).

- [ ] **Step 5: Final commit**

```bash
git add progress.md session-handoff.md
git commit -m "docs(dive-x): 제안 엔진 v1 완료 — progress·handoff 갱신"
```

---

## Self-Review (작성자 체크 결과)

- **Spec coverage** — §3 후보 모양→Task1, §4 비틈 벡터×다이얼→Task1(카탈로그)+Task3(프롬프트 배정)+Task4(다이얼 UI), §5.1 단위 전부→Task1~5, §5.3 흐름→Task5, §9 DoD→Task5(test)+Task6(build·라이브). 누락 없음.
- **Placeholder scan** — 모든 코드 단계가 실제 코드. 스타일 토큰만 "존재 확인" 주석 가드(발명 금지).
- **Type consistency** — `DiveProposal`/`CastSeed`/`NoveltyLevel`(Task1) ↔ `requestDiveProposals`(Task2) ↔ `DiveStart`(Task4) ↔ `seedFromProposal`(Task1→Task5) 시그니처 일치. `DiveState`·`createDiveSession`·`createEmptyProject`·`saveDiveState`·`loadDiveState`는 기존 App.tsx에서 이미 사용 중인 동일 심볼.
