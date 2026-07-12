# PLAY-first 온보딩 (소설류 기본 진입) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 소설류 온보딩에서 자유 서술 다음 기본 CTA를 「플레이로 시작」으로 — 단발 제안 1콜(또는 프리셋 0콜) → 확인 카드 → 최소 프로젝트 생성 → 바로 `stage='dive'`.

**Architecture:** 순수 글루 2함수(`presetToDiveSetup`·`buildPlayFirstProject`, playEntry.ts)가 기존 `seedFromProposal`·`createEmptyProject`·`createDiveSession`을 조합해 `{project, diveState}`를 만든다. 새 `PlaySeedPanel` 컴포넌트가 확인 카드를 그리고, App(StoryXHome)이 새 `HomeFlowStep 'playseed'`로 배선한다. 응결·⟳최신화·PLAN·dev 브리지 `/api/dive-setup`(vite.config.ts:316, 살아 있음 확인)은 전부 기존 재사용.

**Tech Stack:** React + TypeScript, vitest(renderToStaticMarkup 컴포넌트 테스트·소스 핀 테스트 관례), 기존 diveClient/`requestDiveSetup`.

**Spec:** `docs/superpowers/specs/2026-07-12-play-first-onboarding-design.md`

**브랜치:** 시작 전 `git checkout -b feat/play-first-onboarding`. 커밋은 태스크별. 완료 후 PR.

**알려진 한계(범위 밖, 계획서에 기록만):** `/api/dive-setup` 포함 dive 계열 엔드포인트는 dev 브리지 전용 — prod Vercel `api/`에 dive 함수가 없는 것은 이 슬라이스 이전부터의 기존 상태(PLAY 전체가 dev 전용). prod 패리티는 별도 조각.

---

### Task 1: 순수 글루 — `presetToDiveSetup` + `buildPlayFirstProject` (playEntry.ts)

**Files:**
- Modify: `src/lib/playEntry.ts`
- Test: `src/lib/playEntry.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/playEntry.test.ts`에 기존 describe 옆에 추가한다.

```ts
import { presetToDiveSetup, buildPlayFirstProject } from './playEntry';
import { DIVE_SEED_CHARACTERS } from './diveSeedCharacters';

describe('presetToDiveSetup', () => {
  it('프리셋 시드를 DiveSetup 형태로 변환한다 — background→scene·인물 1·myRole 빈 값', () => {
    const seed = DIVE_SEED_CHARACTERS[0];
    const setup = presetToDiveSetup(seed);
    expect(setup.scene).toBe(seed.background);
    expect(setup.cast).toHaveLength(1);
    expect(setup.cast[0].name).toBe(seed.character.name);
    expect(setup.cast[0].desire).toBe(seed.character.desire);
    expect(setup.cast[0].voiceRules).toEqual(seed.character.voiceRules);
    expect(setup.myRole).toBe('');
  });
});

describe('buildPlayFirstProject', () => {
  const setup = {
    scene: '늦은 밤 편의점, 폐점 직전.',
    cast: [
      { name: '지호', role: '야간 알바', desire: '가게를 지키고 싶다', wound: '떠난 가족', voiceRules: ['짧게'] }
    ],
    myRole: '10년 만에 돌아온 단골'
  };

  it('cast 를 인물로 등록한 0회차 프로젝트와 scene 이 주입된 diveState 를 만든다', () => {
    const result = buildPlayFirstProject(setup, { medium: 'novel', format: 'long-novel' });
    expect(result).not.toBeNull();
    const { project, diveState } = result!;
    expect(project.chapters).toHaveLength(0);
    expect(project.characters).toHaveLength(1);
    expect(project.characters[0].name).toBe('지호');
    expect(project.characters[0].desire).toBe('가게를 지키고 싶다');
    expect(project.medium).toBe('novel');
    expect(project.format).toBe('long-novel');
    expect(diveState.schema).toBe('storyx/dive/v1');
    expect(diveState.session.scene).toBe('늦은 밤 편의점, 폐점 직전.');
    expect(diveState.session.characterId).toBe(project.characters[0].id);
    expect(diveState.session.projectId).toBe(project.id);
    expect(diveState.project).toBe(project);
  });

  it('제목은 myRole 앞 20자에서 파생한다', () => {
    const result = buildPlayFirstProject(setup, {});
    expect(result!.project.title).toBe('10년 만에 돌아온 단골'.slice(0, 20));
  });

  it('myRole 이 비면 scene 앞 20자, 둘 다 비면 폴백 제목', () => {
    const noRole = buildPlayFirstProject({ ...setup, myRole: '' }, {});
    expect(noRole!.project.title).toBe('늦은 밤 편의점, 폐점 직전.'.slice(0, 20));
    const empty = buildPlayFirstProject({ scene: '', cast: setup.cast, myRole: '' }, {});
    expect(empty!.project.title).toBe('플레이로 시작한 이야기');
  });

  it('cast 가 비면 null', () => {
    expect(buildPlayFirstProject({ scene: 'x', cast: [], myRole: 'y' }, {})).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: FAIL — `presetToDiveSetup`/`buildPlayFirstProject` export 없음.

- [ ] **Step 3: 최소 구현**

`src/lib/playEntry.ts`에 추가한다 (기존 import 유지, 새 import 추가).

```ts
import { createEmptyProject } from './storyEngine';
import { seedFromProposal, type DiveSetup } from './diveProposal';
import type { DiveSeedCharacter } from './diveSeedCharacters';
import type { CreativeFormat, CreativeMedium } from './projectBlueprint';

const PLAY_FIRST_FALLBACK_TITLE = '플레이로 시작한 이야기';

/** 프리셋 시드 → DiveSetup. background 가 첫 장면, 인물 1, myRole 은 비워 사용자 자유. */
export function presetToDiveSetup(seed: DiveSeedCharacter): DiveSetup {
  const c = seed.character;
  return {
    scene: seed.background,
    cast: [{ name: c.name, role: c.role, desire: c.desire, wound: c.wound, voiceRules: c.voiceRules }],
    myRole: ''
  };
}

/**
 * PLAY-first 온보딩 글루 — 제안/프리셋 setup 에서 최소 프로젝트(회차 0)와
 * 첫 장면이 주입된 DiveState 를 만든다. 옛 seedAndEnter(6a95a52) 규칙 계승.
 * 설정 깊이 상한 — 헌장·결말·회차 구조는 만들지 않는다(스펙 결정 5).
 */
export function buildPlayFirstProject(
  setup: DiveSetup,
  meta: { medium?: CreativeMedium; format?: CreativeFormat }
): { project: SeriesProject; diveState: DiveState } | null {
  const { scene, characters, primaryCharacterId } = seedFromProposal(setup);
  if (!primaryCharacterId) return null;
  const title =
    (setup.myRole || setup.scene).trim().slice(0, 20) || PLAY_FIRST_FALLBACK_TITLE;
  const project: SeriesProject = {
    ...createEmptyProject({ title, medium: meta.medium, format: meta.format }),
    characters
  };
  const session = createDiveSession(primaryCharacterId, project.id);
  return {
    project,
    diveState: {
      schema: 'storyx/dive/v1',
      session: scene ? { ...session, scene } : session,
      project
    }
  };
}
```

주의 — `playEntry.ts`는 이미 `createDiveSession`(diveSession)·`DiveState`(storage)·`SeriesProject`(storyEngine) 를 import 하고 있다. 중복 import 하지 말 것.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/playEntry.test.ts`
Expected: PASS (기존 8 + 신규 6).

- [ ] **Step 5: Commit**

```bash
git add src/lib/playEntry.ts src/lib/playEntry.test.ts
git commit -m "feat(play-first): 순수 글루 — presetToDiveSetup·buildPlayFirstProject (TDD)"
```

---

### Task 2: `PlaySeedPanel` 확인 카드 컴포넌트

**Files:**
- Create: `src/components/PlaySeedPanel.tsx`
- Test: `src/components/playSeedPanel.test.ts`
- Modify: `src/styles.css` (hx 온보딩 네임스페이스 뒤에 `.hx-playseed-*` 블록 추가)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/playSeedPanel.test.ts` 신규.

```ts
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlaySeedPanel } from './PlaySeedPanel';
import { DIVE_SEED_CHARACTERS } from '../lib/diveSeedCharacters';

const baseProps = {
  setup: null,
  loading: false,
  error: '',
  presets: DIVE_SEED_CHARACTERS,
  onPickPreset: () => {},
  onConfirm: () => {},
  onBack: () => {}
};

describe('PlaySeedPanel', () => {
  it('주의사항 고정 문구와 프리셋 3칩을 항상 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, baseProps));
    expect(html).toContain('이 설정은 정확하지 않아도 됩니다');
    expect(html).toContain('플레이하며 완성해나가는 초안');
    const chips = html.match(/hx-playseed-preset/g) ?? [];
    expect(chips.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain(DIVE_SEED_CHARACTERS[0].character.name);
  });

  it('setup 이 없으면 「이대로 시작」이 비활성', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, baseProps));
    expect(html).toMatch(/이대로 시작[\s\S]{0,200}?disabled|disabled[\s\S]{0,200}?이대로 시작/);
  });

  it('setup 이 있으면 인물·첫 장면·내 역할 카드를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(PlaySeedPanel, {
        ...baseProps,
        setup: {
          scene: '늦은 밤 편의점.',
          cast: [{ name: '지호', role: '야간 알바', desire: '가게를 지키고 싶다', wound: '', voiceRules: [] }],
          myRole: '단골'
        }
      })
    );
    expect(html).toContain('지호');
    expect(html).toContain('야간 알바');
    expect(html).toContain('늦은 밤 편의점.');
    expect(html).toContain('단골');
    expect(html).toContain('이대로 시작');
  });

  it('error 를 안내 문구로 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(PlaySeedPanel, { ...baseProps, error: '조금만 더 적어주세요' })
    );
    expect(html).toContain('조금만 더 적어주세요');
  });

  it('loading 이면 준비 중 문구를 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(PlaySeedPanel, { ...baseProps, loading: true }));
    expect(html).toContain('플레이 상대를 준비하는 중');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/playSeedPanel.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 컴포넌트 구현**

`src/components/PlaySeedPanel.tsx` 신규.

```tsx
// PLAY-first 온보딩 확인 카드 — 제안/프리셋 설정을 보여주고 바로 플레이로. 수정 UI 없음(스펙 결정 3).
import type { DiveSetup } from '../lib/diveProposal';
import type { DiveSeedCharacter } from '../lib/diveSeedCharacters';

export const PLAY_SEED_DISCLAIMER =
  '이 설정은 정확하지 않아도 됩니다 — 플레이하며 완성해나가는 초안입니다.';

interface PlaySeedPanelProps {
  setup: DiveSetup | null;
  loading: boolean;
  error: string;
  presets: DiveSeedCharacter[];
  onPickPreset: (index: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function PlaySeedPanel({
  setup, loading, error, presets, onPickPreset, onConfirm, onBack
}: PlaySeedPanelProps) {
  return (
    <div className="hx-playseed">
      <p className="hx-playseed-disclaimer">{PLAY_SEED_DISCLAIMER}</p>

      <div className="hx-playseed-presets" role="group" aria-label="프리셋 상대">
        {presets.map((p, i) => (
          <button
            key={p.character.id}
            type="button"
            className="hx-playseed-preset"
            onClick={() => onPickPreset(i)}
            disabled={loading}
          >
            <strong>{p.character.name}</strong>
            <span>{p.character.role}</span>
          </button>
        ))}
      </div>

      {loading && <p className="hx-playseed-loading" role="status">플레이 상대를 준비하는 중…</p>}
      {error && !loading && <p className="hx-playseed-error">{error}</p>}

      {setup && !loading && (
        <div className="hx-playseed-card">
          <div className="hx-playseed-scene">
            <span className="hx-playseed-label">첫 장면</span>
            <p>{setup.scene}</p>
          </div>
          {setup.myRole && (
            <div className="hx-playseed-scene">
              <span className="hx-playseed-label">내 역할</span>
              <p>{setup.myRole}</p>
            </div>
          )}
          <ul className="hx-playseed-cast">
            {setup.cast.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong> · {c.role}
                {c.desire ? <em> — {c.desire}</em> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="hx-playseed-actions">
        <button type="button" className="hx-btn-ghost" onClick={onBack}>이전</button>
        <button type="button" className="hx-btn" onClick={onConfirm} disabled={!setup || loading}>
          이대로 시작
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CSS 추가**

`src/styles.css`에서 `hx-` 온보딩 블록(예: `.hx-freewrite-meter` 부근)을 찾아 그 뒤에 추가. 기존 hx 토큰/변수 관례를 따르고, transition 은 `--st-dur-*`/`--st-ease`만 쓴다(DoD).

```css
/* PLAY-first 온보딩 확인 카드 */
.hx-playseed { display: grid; gap: 16px; }
.hx-playseed-disclaimer { font-size: 13px; opacity: 0.75; margin: 0; }
.hx-playseed-presets { display: flex; gap: 8px; flex-wrap: wrap; }
.hx-playseed-preset {
  display: grid; gap: 2px; padding: 8px 14px; border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14); background: transparent; color: inherit;
  cursor: pointer; text-align: left;
  transition: border-color var(--st-dur-fast) var(--st-ease), background var(--st-dur-fast) var(--st-ease);
}
.hx-playseed-preset:hover:not(:disabled) { border-color: rgba(255, 255, 255, 0.34); }
.hx-playseed-preset span { font-size: 12px; opacity: 0.7; }
.hx-playseed-card { display: grid; gap: 12px; padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); }
.hx-playseed-label { font-size: 11px; letter-spacing: 0.08em; opacity: 0.6; display: block; margin-bottom: 2px; }
.hx-playseed-scene p { margin: 0; }
.hx-playseed-cast { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.hx-playseed-cast em { opacity: 0.75; font-style: normal; }
.hx-playseed-loading, .hx-playseed-error { margin: 0; font-size: 13px; }
.hx-playseed-actions { display: flex; gap: 8px; justify-content: flex-end; }
```

주의 — 온보딩(hx) 화면의 기존 배경이 다크인지 라이트인지 실제 렌더로 확인하고 border 알파값을 주변 hx 카드와 맞출 것(구현 시 인접 `.hx-aside-card` 스타일을 참조해 동일 계열로).

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/components/playSeedPanel.test.ts`
Expected: PASS 5.

- [ ] **Step 6: Commit**

```bash
git add src/components/PlaySeedPanel.tsx src/components/playSeedPanel.test.ts src/styles.css
git commit -m "feat(play-first): PlaySeedPanel 확인 카드 — 주의사항 핀·프리셋 3칩·제안 카드 (TDD)"
```

---

### Task 3: App 배선 — HomeFlowStep 'playseed' + 소설류 CTA 위계

**Files:**
- Modify: `src/lib/projectBlueprint.ts:77` (HomeFlowStep union)
- Modify: `src/App.tsx` (StoryXHome props·자유 서술 CTA·playseed 패널·App 핸들러)
- Test: `src/appExperience.test.ts` (소스 핀 테스트 추가)

- [ ] **Step 1: 실패하는 소스 핀 테스트 작성**

`src/appExperience.test.ts`에 추가 (이 파일의 기존 소스 단언 관례를 따른다 — App.tsx 소스를 읽어 정규식 단언).

```ts
describe('PLAY-first 온보딩 CTA 위계 (소설류)', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf-8');

  it('소설류 자유 서술 단계는 「플레이로 시작」이 기본(hx-btn), 인터뷰는 보조(hx-btn-ghost)', () => {
    expect(appSource).toContain('플레이로 시작');
    expect(appSource).toContain('인터뷰로 초안 만들기');
    // 소설 분기에서 플레이 CTA 가 hx-btn(기본), 인터뷰가 ghost 인지 — 두 라벨의 클래스 결합을 핀
    expect(appSource).toMatch(/hx-btn"[^>]*>[\s\S]{0,80}플레이로 시작/);
    expect(appSource).toMatch(/hx-btn-ghost"[^>]*>[\s\S]{0,80}인터뷰로 초안 만들기/);
  });

  it("HomeFlowStep 에 'playseed' 가 있고 PlaySeedPanel 이 배선된다", () => {
    const blueprintSource = readFileSync(new URL('./lib/projectBlueprint.ts', import.meta.url), 'utf-8');
    expect(blueprintSource).toContain("'playseed'");
    expect(appSource).toContain('PlaySeedPanel');
    expect(appSource).toContain("homeFlowStep === 'playseed'");
  });

  it('플레이 승인 핸들러는 saveProject→saveDiveState→clearOnboardingDraft→dive 순서를 지킨다', () => {
    const handler = appSource.match(/function handleStartPlay[\s\S]{0,600}?\n  \}/)?.[0] ?? '';
    const order = ['saveProject(', 'saveDiveState(', 'clearOnboardingDraft(', "setStage('dive')"];
    const idx = order.map((s) => handler.indexOf(s));
    expect(idx.every((v) => v >= 0)).toBe(true);
    expect([...idx]).toEqual([...idx].sort((a, b) => a - b));
  });
});
```

`readFileSync`·`URL` import 가 파일 상단에 없으면 추가한다 (`import { readFileSync } from 'node:fs';`).

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/appExperience.test.ts`
Expected: FAIL — 라벨·'playseed' 부재.

- [ ] **Step 3: HomeFlowStep 확장**

`src/lib/projectBlueprint.ts:77`

```ts
export type HomeFlowStep = 'medium' | 'freewrite' | 'playseed' | 'intake' | 'charter' | 'building';
```

주의 — `homeFlowSteps` 스텝 인디케이터 배열(App.tsx ~1431)과 `buildingPanelIndex` 필터가 있다. playseed 는 charter 처럼 **인디케이터 목록에 넣지 않고** `homeFlowStep === 'playseed'`일 때만 렌더한다(기존 charter 패턴 그대로). `buildingPanelIndex` 의 필터에 `s.id !== 'playseed'` 를 추가할 필요는 없다 — homeFlowSteps 배열에 아예 안 넣기 때문.

- [ ] **Step 4: StoryXHome 배선**

`src/App.tsx` — 네 군데.

(a) StoryXHome props 에 `onStartPlay` 추가.

```ts
function StoryXHome({
  medium, format, blueprint, onSelectMedium, onSelectFormat, onOpenLanding, onOpenEditor, onStartPlay
}: {
  // …기존 props…
  onStartPlay: (project: SeriesProject, diveState: DiveState) => void;
}) {
```

import 추가 — `import { PlaySeedPanel } from './components/PlaySeedPanel';` · `import { presetToDiveSetup, buildPlayFirstProject } from './lib/playEntry';` · `import { DIVE_SEED_CHARACTERS } from './lib/diveSeedCharacters';` · `import { requestDiveSetup } from './lib/diveClient';` · `DiveSetup` 타입.

(b) StoryXHome 내부 상태 + 핸들러 (`goToIntake` 부근에 배치).

```ts
const [playSetup, setPlaySetup] = useState<DiveSetup | null>(null);
const [playSeedLoading, setPlaySeedLoading] = useState(false);
const [playSeedError, setPlaySeedError] = useState('');

// 자유 서술 → 플레이 시드 제안. 서술이 비면 콜 없이 프리셋만 보여준다.
async function goToPlaySeed() {
  setHomeFlowStep('playseed');
  setPlaySeedError('');
  const story = freewriteText.trim();
  if (!story) return;
  setPlaySeedLoading(true);
  try {
    const res = await requestDiveSetup({ story });
    if (res.setup) setPlaySetup(res.setup);
    else setPlaySeedError('조금만 더 적어주세요 — 누구와, 어디서, 무슨 상황인지 한두 줄이면 충분해요.');
  } catch {
    setPlaySeedError('제안 요청에 실패했어요. 프리셋으로 시작하거나 다시 시도해 주세요.');
  } finally {
    setPlaySeedLoading(false);
  }
}

function confirmPlaySeed() {
  if (!playSetup) return;
  const built = buildPlayFirstProject(playSetup, { medium: blueprint.medium, format: blueprint.format });
  if (!built) {
    setPlaySeedError('인물을 만들지 못했어요 — 프리셋을 고르거나 서술을 조금 더 적어주세요.');
    return;
  }
  onStartPlay(built.project, built.diveState);
}
```

(c) 자유 서술 단계 aside(App.tsx ~1585-1599) — 소설류만 CTA 교체. 기존 코드

```tsx
<div className="hx-aside-actions">
  <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('medium')}>이전</button>
  <button type="button" className="hx-btn" onClick={goToIntake}>인터뷰로 계속</button>
</div>
```

를 다음으로 교체한다.

```tsx
<div className="hx-aside-actions">
  <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('medium')}>이전</button>
  {blueprint.medium === 'novel' ? (
    <>
      <button type="button" className="hx-btn-ghost" onClick={goToIntake}>인터뷰로 초안 만들기</button>
      <button type="button" className="hx-btn" onClick={goToPlaySeed}>플레이로 시작</button>
    </>
  ) : (
    <button type="button" className="hx-btn" onClick={goToIntake}>인터뷰로 계속</button>
  )}
</div>
```

aside 안내 카드(「다음 단계 — 작가 인터뷰」)도 소설류일 때 문구 분기.

```tsx
<div className="hx-aside-card">
  <div className="hx-aside-label">다음 단계</div>
  <div className="hx-aside-title">{blueprint.medium === 'novel' ? '플레이' : '작가 인터뷰'}</div>
  <p>
    {blueprint.medium === 'novel'
      ? '이 서술에서 인물과 첫 장면을 뽑아 바로 대화로 시작합니다. 비워도 프리셋으로 시작할 수 있어요.'
      : '이 서술을 기반으로 작가진이 인물·세계·문체를 빠르게 묻습니다. 비워도 인터뷰는 작동합니다.'}
  </p>
</div>
```

(d) playseed 패널 렌더 — charter 패턴(`{homeFlowStep === 'charter' && (…)}`, App.tsx ~1881)을 그대로 따라 그 부근에 추가.

```tsx
{homeFlowStep === 'playseed' && (
  <section className="hx-panel" aria-label="플레이 설정 확인">
    <p className="hx-eyebrow">03 · 플레이 준비</p>
    <h1 className="hx-h1">이 설정으로 바로 시작할까요?</h1>
    <PlaySeedPanel
      setup={playSetup}
      loading={playSeedLoading}
      error={playSeedError}
      presets={DIVE_SEED_CHARACTERS}
      onPickPreset={(i) => { setPlaySetup(presetToDiveSetup(DIVE_SEED_CHARACTERS[i])); setPlaySeedError(''); }}
      onConfirm={confirmPlaySeed}
      onBack={() => setHomeFlowStep('freewrite')}
    />
  </section>
)}
```

주의 — 기존 hx 패널들의 마크업 구조(`hx-panel` 안 eyebrow/h1)를 실제 파일에서 확인해 동일 결로 맞출 것.

- [ ] **Step 5: App 쪽 핸들러 + 프롭 전달**

App 컴포넌트(stage === 'home' 분기, ~line 526) 에서.

```tsx
function handleStartPlay(project: SeriesProject, diveState: DiveState) {
  saveProject(project);          // committed 본편 생성 — 온보딩 졸업 관할
  saveDiveState(diveState);      // working 시드
  clearOnboardingDraft();        // 다음 새 프로젝트 복원 오염 방지
  setPendingSync(0);
  setDiveInit(diveState);
  setStage('dive');
}
```

`<StoryXHome …기존 props… onStartPlay={handleStartPlay} />` 로 전달. `saveProject`·`saveDiveState` 가 App.tsx 상단 storage import 목록에 없으면 추가. `handleStartPlay` 는 App 함수 본문(다른 handle* 옆)에 **function 선언**으로 두어 Step 1 핀 정규식(`function handleStartPlay`)과 일치시킨다.

주의 — dive 진입 useEffect(App.tsx ~261-269)는 `loadDiveState() || diveInit` 이 있으면 시딩을 건너뛴다. handleStartPlay 가 둘 다 채우므로 `seedPlayFromProject` 재시딩과 충돌하지 않는다.

- [ ] **Step 6: 전체 테스트 + 타입 확인**

Run: `npx vitest run src/appExperience.test.ts && npx tsc --noEmit`
Expected: PASS · 타입 클린.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/lib/projectBlueprint.ts src/appExperience.test.ts
git commit -m "feat(play-first): 소설류 온보딩 기본 CTA 플레이로 — playseed 단계·dive 직행 배선 (TDD)"
```

---

### Task 4: init.sh 녹색 + 라이브 통짜 검증

**Files:** 없음 (검증 전용. 발견 시 수정 커밋)

- [ ] **Step 1: init.sh**

Run: `bash init.sh`
Expected: npm test 전체 녹색 · build(tsc+vite) 성공.

- [ ] **Step 2: 라이브 — 커스텀 경로 통짜**

preview(5175)에서 localStorage 완전 초기화 후

1. 랜딩 → 「창작 시작」 → 매체 소설/장편 → 자유 서술 입력.
2. CTA 확인 — 「플레이로 시작」이 기본(hx-btn), 「인터뷰로 초안 만들기」 보조. **비-소설 매체(에세이)로 바꾸면 기존 「인터뷰로 계속」 단일 CTA 그대로**(무변경 회귀).
3. 「플레이로 시작」 → playseed 패널: 로딩 → 실 codex 제안 카드(인물·첫 장면·내 역할) + 주의사항 문구 + 프리셋 3칩.
4. 「이대로 시작」 → dive 진입. 🎬 첫 장면이 **제안된 scene**(0회차 폴백 아님)인지, shellBar 제목이 파생 제목인지.
5. 대화 1턴 → 응답 정상.
6. 「이 장면을 한 회차로 응결할까요?」 → 응결 → 승인 → ⟳최신화 → WRITE 에서 1화 합류 확인.
7. 전 구간 콘솔 에러 0.

React 클릭은 `dispatchEvent(MouseEvent bubbles:true)` 우회, textarea 는 preview_fill ([[preview-click-react-quirk]]·[[preview-live-verify-env]]).

- [ ] **Step 3: 라이브 — 프리셋 0콜 경로**

localStorage 초기화 후 자유 서술 **비운 채** 「플레이로 시작」 → 네트워크에 /api/dive-setup 콜 없음 확인 → 프리셋 칩(도윤) 클릭 → 카드 채워짐 → 시작 → dive 진입·1턴.

- [ ] **Step 4: progress.md·session-handoff.md 갱신 + PR**

progress.md 활성 트랙 갱신(증거 = 커밋 SHA·라이브 게이트 결과), session-handoff.md 맨 위 인계 노트 추가.

```bash
git add progress.md session-handoff.md
git commit -m "docs(progress): PLAY-first 온보딩 슬라이스 검증 결과"
gh pr create --title "feat: PLAY-first 온보딩 — 소설류 기본 진입" --body "..."
```

PR 본문에 스펙 링크·라이브 게이트 결과·알려진 한계(prod dive 패리티 기존 갭) 포함.

---

## Self-Review 기록

- 스펙 커버리지 — 흐름(T3)·확인 카드(T2)·글루(T1)·CTA 위계(T3)·라이브 게이트(T4) 전부 태스크 존재. 비목표(에세이 결·플레이 중 초안 트리거·장르 팩)는 계획에 없음(정상).
- 플레이스홀더 — 코드 블록 전부 실코드. "주의" 항목은 구현자가 실파일 확인할 지점 명시용.
- 타입 일관성 — `buildPlayFirstProject(setup, meta)`·`presetToDiveSetup(seed)`·`onStartPlay(project, diveState)`·`handleStartPlay` 명칭이 T1↔T3↔소스 핀 테스트에서 일치.
