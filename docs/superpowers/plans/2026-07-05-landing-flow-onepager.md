# 랜딩 "작성 여정" 원페이저 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 랜딩(`MarketingLanding`)의 히어로 다음에 "작성 여정" 섹션을 추가한다 — 4단계 흐름(작가진 진입 → 세 방식 → 하나의 캐논 두 축 → 출간)으로 Story X 의 작성 흐름과 두 축(안 무너진다·끌어당긴다)을 한눈에 보여준다.

**Architecture:** 섹션 콘텐츠(세 방식·두 축·작가진·출간 매체)를 순수 상수 모듈 `src/landingFlow.ts` 로 뽑아 의미 불변식을 테스트로 못 박고(`landingFlow.test.ts`), `MarketingLanding`(App.tsx)이 그 상수를 map 렌더한다. 스타일은 `styles.css` 의 `.landing-page` 스코프에 `.lx-flow-*` 로 추가하며 기존 랜딩 토큰(`--lc-*`)·라이트 토글·반응형 관례를 계승한다.

**Tech Stack:** React + TypeScript + Vite, Vitest, 순수 CSS(styles.css, Linear "Midnight Command Center" `--lc-*` 토큰).

**Branch:** `feat/landing-flow-onepager` (이미 생성·스펙/리서치 커밋됨 `95e46bb`).

**Spec:** `docs/superpowers/specs/2026-07-05-landing-flow-onepager-design.md`

---

## File Structure

- **Create** `src/landingFlow.ts` — 섹션 콘텐츠 순수 상수(`flowModes`·`canonAxes`·`flowEntryAgents`·`flowPublishMedia`) + 타입. 단일 책임 = 랜딩 flow 콘텐츠 데이터.
- **Create** `src/landingFlow.test.ts` — 두 축·세 방식 의미 불변식 테스트.
- **Modify** `src/App.tsx` — 상단 import 추가 · `MarketingLanding` 의 `navLinks` 에 flow 항목 추가 · `hero-band` 다음에 `lx-flow-section` JSX 삽입.
- **Modify** `src/styles.css` — `.landing-page .lx-flow-*` 블록 추가(다크) + `.is-light` 오버라이드 + 768px 반응형 블록에 항목 추가.

---

## Task 1: 콘텐츠 상수 모듈 + 테스트 (TDD)

**Files:**
- Create: `src/landingFlow.ts`
- Test: `src/landingFlow.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/landingFlow.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { flowModes, canonAxes, flowEntryAgents, flowPublishMedia } from './landingFlow';

describe('landing flow section content', () => {
  it('has exactly three writing modes in play·write·plan order', () => {
    expect(flowModes.map((m) => m.key)).toEqual(['play', 'write', 'plan']);
    for (const m of flowModes) {
      expect(m.tag.length).toBeGreaterThan(0);
      expect(m.kr.length).toBeGreaterThan(0);
      expect(m.body.length).toBeGreaterThan(0);
    }
  });

  it('has exactly two canon axes: solid full, pull growing', () => {
    expect(canonAxes.map((a) => a.key)).toEqual(['solid', 'pull']);
    const solid = canonAxes.find((a) => a.key === 'solid')!;
    const pull = canonAxes.find((a) => a.key === 'pull')!;
    // 일관성(안 무너진다) = 꽉 참
    expect(solid.filled).toBe(solid.total);
    // 흡인력(끌어당긴다) = 자라는 축(0 < filled < total)
    expect(pull.filled).toBeGreaterThan(0);
    expect(pull.filled).toBeLessThan(pull.total);
    for (const a of canonAxes) expect(a.body.length).toBeGreaterThan(0);
  });

  it('names the human+AI collaboration on the pull(흡인력) axis', () => {
    // 두 축 프레임 회귀 방지 — 흡인력은 "AI가 펼치고 사람이 고른다"는 협업으로 살린다
    const pull = canonAxes.find((a) => a.key === 'pull')!;
    expect(pull.body).toContain('사람');
    expect(pull.body).toMatch(/AI|작가진/);
  });

  it('lists the founding writer agents and publish media', () => {
    expect(flowEntryAgents.length).toBeGreaterThanOrEqual(4);
    expect(flowPublishMedia).toEqual(['소설', '웹툰', '동화책', '오디오북']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/landingFlow.test.ts`
Expected: FAIL — `Failed to resolve import "./landingFlow"` (모듈 미존재).

- [ ] **Step 3: Write minimal implementation**

Create `src/landingFlow.ts`:

```ts
// 랜딩 "작성 여정" 섹션 콘텐츠 — 세 작성 방식 + 캐논 두 축 + 진입 작가진 + 출간 매체
// 두 축(안 무너진다=일관성 · 끌어당긴다=흡인력) 프레임은 랜딩 서사의 핵심 — 축을 지우지 말 것.

export interface FlowMode {
  key: 'play' | 'write' | 'plan';
  tag: string;
  kr: string;
  body: string;
}

export interface CanonAxis {
  key: 'solid' | 'pull';
  icon: string;
  name: string;
  sub: string;
  body: string;
  filled: number;
  total: number;
}

export const flowEntryAgents: string[] = [
  '쇼러너',
  '캐릭터 큐레이터',
  '세계관 지킴이',
  '연속성 감수'
];

export const flowModes: FlowMode[] = [
  {
    key: 'play',
    tag: 'PLAY · 이어 굴리기',
    kr: '작품 안에서 행동한다',
    body: '작품 속으로 들어가 인물로서 말하고 선택합니다. 내가 움직이면 이야기가 반응하고 다음 장면이 열립니다.'
  },
  {
    key: 'write',
    tag: 'WRITE · 원고 다듬기',
    kr: '소설을 쓰듯 쓴다',
    body: '평소 소설을 쓰듯 문장을 직접 쓰고 고칩니다. AI가 초안을 대주고, 문체와 결은 작가가 정합니다.'
  },
  {
    key: 'plan',
    tag: 'PLAN · 설계 고정',
    kr: '구성과 큰 흐름을 짠다',
    body: '인물의 욕망·세계 규칙·사건의 뼈대를 작가진과 함께 설계하고 잠급니다. 이야기가 어디로 가는지 위에서 봅니다.'
  }
];

export const canonAxes: CanonAxis[] = [
  {
    key: 'solid',
    icon: '⛊',
    name: '안 무너진다',
    sub: '일관성',
    body: '세계·인물·사건이 30화 뒤에도 어긋나지 않습니다. 충돌은 감춰지지 않고 작가의 결정으로 정리됩니다.',
    filled: 4,
    total: 4
  },
  {
    key: 'pull',
    icon: '✦',
    name: '끌어당긴다',
    sub: '흡인력',
    body: '장면·문장·디테일이 독자를 끝까지 끕니다. AI가 여러 결을 펼치고, 긴장과 의외를 사람이 고릅니다.',
    filled: 3,
    total: 4
  }
];

export const flowPublishMedia: string[] = ['소설', '웹툰', '동화책', '오디오북'];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/landingFlow.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/landingFlow.ts src/landingFlow.test.ts
git commit -m "feat(landing): 작성 여정 콘텐츠 상수 + 두 축·세 방식 불변식 테스트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: MarketingLanding 에 섹션 렌더 + 내비 링크

**Files:**
- Modify: `src/App.tsx` (import 추가 · `navLinks` · `hero-band` 다음 JSX 삽입)

- [ ] **Step 1: 상단 import 추가**

`src/App.tsx` 최상단 import 블록(다른 `./` 로컬 import 근처)에 추가:

```ts
import { flowModes, canonAxes, flowEntryAgents, flowPublishMedia } from './landingFlow';
```

- [ ] **Step 2: navLinks 에 flow 항목 추가**

`MarketingLanding` 안의 `navLinks` 배열(현재 `핵심 원칙`·`매체 전환` 2개)을 다음으로 교체 — `작성 흐름` 을 맨 앞에:

```ts
  const navLinks = [
    { label: '작성 흐름', target: 'flow' },
    { label: '핵심 원칙', target: 'features' },
    { label: '매체 전환', target: 'media-bridge' }
  ];
```

- [ ] **Step 3: hero-band 다음에 flow 섹션 삽입**

`MarketingLanding` 의 `hero-band` `</section>` 닫는 줄 바로 다음, `feature-section` `<section ...>` 시작 줄 바로 앞에 아래 JSX 를 삽입:

```tsx
      <section className="lx-flow-section" id="flow" aria-label="작성 여정">
        <div className="lx-flow-inner">
          <span className="lx-eyebrow">어떻게 쓰나요</span>
          <h2 className="section-h2">
            작가진과 시작해, 세 가지 방식으로
            <br />
            하나의 캐논을 조각합니다.
          </h2>
          <p className="lx-flow-lead">
            첫 순간부터 혼자가 아닙니다. AI 작가진과 뼈대를 세우고, 세 개의 작업 표면에서 그 캐논을 서로
            다른 각도로 다듬습니다. 조각이 향하는 곳은 두 가지 — <b>안 무너지고</b>,{' '}
            <b className="lx-flow-pull-em">끝까지 끌어당기는</b> 이야기입니다.
          </p>

          <div className="lx-flow-step">
            <span className="lx-flow-stepno">① 새 작품 · 설계 착수</span>
            <div className="lx-flow-entry">
              <div className="lx-flow-entry-head">작가진과 브레인스토밍하며 뼈대를 세웁니다</div>
              <p className="lx-flow-entry-body">
                매체를 고르면 쇼러너가 질문을 던지고, 캐릭터 큐레이터·세계관 지킴이가 인물의 욕망과 세계의
                첫 규칙을 같이 잡습니다. 결말에서 거꾸로 4줄 척추를 세워{' '}
                <b className="lx-flow-seed-em">캐논의 씨앗</b>을 심습니다.
              </p>
              <div className="lx-flow-agents">
                {flowEntryAgents.map((agent) => (
                  <span key={agent} className="lx-flow-agent">
                    {agent}
                  </span>
                ))}
                <span className="lx-flow-agent is-seed">→ 캐논의 씨앗</span>
              </div>
            </div>
          </div>

          <div className="lx-flow-conn">
            <span>세 방식으로 이 캐논을 키웁니다</span>
          </div>

          <span className="lx-flow-stepno lx-flow-stepno-center">② STUDIO · 세 가지 작성 방식</span>
          <div className="lx-flow-modes">
            {flowModes.map((mode) => (
              <article key={mode.key} className={`lx-flow-mode is-${mode.key}`}>
                <span className="lx-flow-mode-tag">{mode.tag}</span>
                <div className="lx-flow-mode-kr">{mode.kr}</div>
                <p className="lx-flow-mode-body">{mode.body}</p>
              </article>
            ))}
          </div>

          <div className="lx-flow-merge" aria-hidden="true">
            ↘ ↓ ↙
          </div>

          <div className="lx-flow-core">
            <span className="lx-flow-stepno lx-flow-stepno-center">③ 하나의 캐논 · ⟳ 최신화</span>
            <div className="lx-flow-core-head">조각은 두 방향으로 단단해집니다</div>
            <p className="lx-flow-core-sub">
              세 방식이 만든 변화는 <b>⟳ 최신화</b>로 한 캐논에 합류합니다
            </p>
            <div className="lx-flow-axes">
              {canonAxes.map((axis) => (
                <div key={axis.key} className={`lx-flow-axis is-${axis.key}`}>
                  <div className="lx-flow-axis-name">
                    <span aria-hidden="true">{axis.icon}</span> {axis.name}
                    <span className="lx-flow-axis-sub">{axis.sub}</span>
                  </div>
                  <p className="lx-flow-axis-body">{axis.body}</p>
                  <div className="lx-flow-axis-bars" aria-hidden="true">
                    {Array.from({ length: axis.total }, (_, i) => (
                      <i key={i} className={i < axis.filled ? 'is-on' : ''} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="lx-flow-grow">회차가 쌓일수록 — 흔들리지 않고, 더 끌어당깁니다</div>
          </div>

          <div className="lx-flow-out">
            <span className="lx-flow-stepno">④ 출간</span>
            <span className="lx-flow-out-text">완성된 이야기는</span>
            {flowPublishMedia.map((medium) => (
              <span key={medium} className="lx-flow-out-chip">
                {medium}
              </span>
            ))}
            <span className="lx-flow-out-text">으로 표현됩니다</span>
          </div>
        </div>
      </section>
```

- [ ] **Step 4: 타입·빌드 검증**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc 에러 0 · 전체 테스트 PASS(Task 1 포함).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(landing): MarketingLanding 에 작성 여정 섹션 + 내비 링크

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: CSS — `.lx-flow-*` (다크 · 라이트 · 반응형)

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: flow 섹션 CSS 블록 추가**

`src/styles.css` 의 매체 전환 CSS 끝(`.landing-page .bridge-*` 규칙군 다음, `@media (max-width: 768px)` 랜딩 블록 앞 — 대략 line 7020 부근의 매체 전환 마지막 규칙 뒤)에 아래를 삽입. 위치를 정확히 못 찾으면 `.landing-page .landing-closing` 규칙 정의 바로 앞에 넣어도 됨(스코프만 `.landing-page` 유지되면 됨):

```css
/* ── 작성 여정 (flow) ── */
.landing-page .lx-flow-section {
  --flow-play: #a6e22e;
  --flow-write: #60a5fa;
  --flow-plan: #c4b6ff;
  --flow-pull: #f0c878;
  background: var(--lc-graphite);
  border-top: 1px solid var(--lc-charcoal);
  padding: 144px 32px;
}
.landing-page.is-light .lx-flow-section {
  --flow-play: #4d7c0f;
  --flow-write: #2563eb;
  --flow-plan: #6d5ae0;
  --flow-pull: #b45309;
}
.landing-page .lx-flow-inner {
  max-width: var(--lc-page-max);
  margin: 0 auto;
}
.landing-page .lx-flow-lead {
  margin: 20px 0 0;
  max-width: 640px;
  font-size: 15px;
  color: var(--lc-storm);
  line-height: 1.6;
}
.landing-page .lx-flow-lead b {
  color: var(--lc-steel);
  font-weight: 590;
}
.landing-page .lx-flow-lead .lx-flow-pull-em {
  color: var(--flow-pull);
}
.landing-page .lx-flow-stepno {
  display: inline-block;
  font-family: 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--lc-fog);
}
.landing-page .lx-flow-stepno-center {
  display: block;
  text-align: center;
}
.landing-page .lx-flow-step {
  margin-top: 48px;
}
.landing-page .lx-flow-entry {
  margin-top: 10px;
  background: var(--lc-pitch);
  border: 1px solid var(--lc-charcoal);
  border-radius: 8px;
  padding: 20px 22px;
}
.landing-page .lx-flow-entry-head {
  font-size: 17px;
  font-weight: 510;
  color: var(--lc-porcelain);
}
.landing-page .lx-flow-entry-body {
  margin: 8px 0 14px;
  font-size: 14px;
  color: var(--lc-storm);
  line-height: 1.6;
  max-width: 620px;
}
.landing-page .lx-flow-seed-em {
  color: var(--flow-play);
  font-weight: 560;
}
.landing-page .lx-flow-agents {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.landing-page .lx-flow-agent {
  font-size: 12px;
  color: var(--lc-steel);
  background: var(--lc-slate);
  border: 1px solid var(--lc-charcoal);
  border-radius: 999px;
  padding: 4px 11px;
}
.landing-page .lx-flow-agent.is-seed {
  color: var(--flow-play);
  border-color: color-mix(in srgb, var(--flow-play) 40%, transparent);
}
.landing-page .lx-flow-conn {
  display: flex;
  justify-content: center;
  margin: 20px 0 8px;
  font-size: 12px;
  color: var(--lc-fog);
}
.landing-page .lx-flow-conn span {
  padding: 0 14px;
}
.landing-page .lx-flow-modes {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.landing-page .lx-flow-mode {
  background: var(--lc-pitch);
  border: 1px solid var(--lc-charcoal);
  border-radius: 10px;
  padding: 18px 16px;
  transition: border-color 160ms ease, transform 160ms ease;
}
.landing-page .lx-flow-mode:hover {
  transform: translateY(-2px);
}
.landing-page .lx-flow-mode.is-play:hover {
  border-color: color-mix(in srgb, var(--flow-play) 45%, transparent);
}
.landing-page .lx-flow-mode.is-write:hover {
  border-color: color-mix(in srgb, var(--flow-write) 45%, transparent);
}
.landing-page .lx-flow-mode.is-plan:hover {
  border-color: color-mix(in srgb, var(--flow-plan) 45%, transparent);
}
.landing-page .lx-flow-mode-tag {
  font-family: 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.landing-page .lx-flow-mode.is-play .lx-flow-mode-tag {
  color: var(--flow-play);
}
.landing-page .lx-flow-mode.is-write .lx-flow-mode-tag {
  color: var(--flow-write);
}
.landing-page .lx-flow-mode.is-plan .lx-flow-mode-tag {
  color: var(--flow-plan);
}
.landing-page .lx-flow-mode-kr {
  margin: 5px 0 8px;
  font-size: 16px;
  font-weight: 510;
  color: var(--lc-porcelain);
}
.landing-page .lx-flow-mode-body {
  margin: 0;
  font-size: 13px;
  color: var(--lc-storm);
  line-height: 1.6;
}
.landing-page .lx-flow-merge {
  display: flex;
  justify-content: center;
  margin: 12px 0 4px;
  color: var(--lc-fog);
  font-size: 15px;
  letter-spacing: 0.5em;
}
.landing-page .lx-flow-core {
  margin-top: 6px;
  background: var(--lc-pitch);
  border: 1px solid var(--lc-ash);
  border-radius: 12px;
  padding: 22px 24px;
}
.landing-page .lx-flow-core-head {
  text-align: center;
  margin-top: 4px;
  font-size: 18px;
  font-weight: 510;
  color: var(--lc-porcelain);
}
.landing-page .lx-flow-core-sub {
  text-align: center;
  margin: 5px 0 16px;
  font-size: 13px;
  color: var(--lc-storm);
}
.landing-page .lx-flow-core-sub b {
  color: var(--lc-steel);
  font-weight: 560;
}
.landing-page .lx-flow-axes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.landing-page .lx-flow-axis {
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--lc-charcoal);
}
.landing-page .lx-flow-axis.is-pull {
  border-color: color-mix(in srgb, var(--flow-pull) 32%, transparent);
}
.landing-page .lx-flow-axis-name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: var(--lc-steel);
}
.landing-page .lx-flow-axis.is-pull .lx-flow-axis-name {
  color: var(--flow-pull);
}
.landing-page .lx-flow-axis-sub {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--lc-fog);
  letter-spacing: 0.04em;
}
.landing-page .lx-flow-axis-body {
  margin: 7px 0 0;
  font-size: 13px;
  color: var(--lc-storm);
  line-height: 1.6;
}
.landing-page .lx-flow-axis-bars {
  display: flex;
  gap: 4px;
  margin-top: 12px;
}
.landing-page .lx-flow-axis-bars i {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: var(--lc-charcoal);
}
.landing-page .lx-flow-axis.is-solid .lx-flow-axis-bars i.is-on {
  background: var(--lc-storm);
}
.landing-page .lx-flow-axis.is-pull .lx-flow-axis-bars i.is-on {
  background: var(--flow-pull);
}
.landing-page .lx-flow-grow {
  text-align: center;
  margin-top: 14px;
  font-size: 12px;
  color: var(--lc-fog);
  letter-spacing: 0.02em;
}
.landing-page .lx-flow-out {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--lc-fog);
}
.landing-page .lx-flow-out-chip {
  background: var(--lc-slate);
  border: 1px solid var(--lc-charcoal);
  border-radius: 7px;
  padding: 4px 10px;
  color: var(--lc-steel);
  font-size: 12px;
}
```

- [ ] **Step 2: 768px 반응형 규칙 추가**

`src/styles.css` 의 기존 `@media (max-width: 768px)` 랜딩 블록에서, `.feature-section, .lx-bridge-section, .landing-closing { padding: 80px 20px; }` 규칙의 셀렉터 목록에 `.landing-page .lx-flow-section` 을 추가하고, 같은 미디어 블록 안에 모드·축 스택 규칙을 추가한다:

```css
  .landing-page .feature-section,
  .landing-page .lx-bridge-section,
  .landing-page .lx-flow-section,
  .landing-page .landing-closing {
    padding: 80px 20px;
  }
  .landing-page .lx-flow-modes,
  .landing-page .lx-flow-axes {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 3: 빌드 검증**

Run: `bash init.sh`
Expected: tsc · vitest · vite build 전체 통과.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "feat(landing): 작성 여정 섹션 CSS(다크·라이트·반응형)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 라이브 검증 + 상태 파일 갱신

**Files:**
- Modify: `progress.md`, `session-handoff.md`

- [ ] **Step 1: preview 서버 기동 후 랜딩 렌더 확인**

`preview_start`(launch.json 의 dev 서버, 포트 5175) → 랜딩(`?` 기본 stage=landing)으로 이동. 아래 6게이트를 preview 도구로 확인(캡처는 `preview_screenshot`, 구조는 `preview_snapshot`, 색·정렬은 `preview_inspect`):

1. 히어로 다음에 `lx-flow-section` 렌더 · 4단계 모두 표시(작가진 칩 4 + 씨앗 · 3모드 · 두 축 · 출간 매체 4).
2. 두 축 게이지 — solid 바 4/4 `is-on` vs pull 3/4(4번째 바 muted). `preview_inspect` 로 `.lx-flow-axis.is-pull .lx-flow-axis-bars i` 배경 확인(마지막만 `--lc-charcoal`).
3. 내비 "작성 흐름" 클릭 → `#flow` 앵커 스크롤(`preview_click` 실패 시 [[preview-click-react-quirk]] 우회).
4. 라이트 토글(밤/낮 버튼) → flow 섹션 텍스트 대비 유지(흰 배경에서 mode-tag·axis 텍스트 안 사라짐). `preview_inspect` 로 라이트 시 `--flow-*` 값이 어두운 변형인지 확인.
5. 좁은 뷰포트(`preview_resize` mobile 375px) → 모드·축 1열 스택 · 가로 오버플로 0.
6. fresh reload(`preview_eval` `window.location.reload()`) → 콘솔 0(`preview_console_logs` level error).

- [ ] **Step 2: 발견 이슈 있으면 소스 수정 후 Step 1 재검증**

CSS·JSX 문제를 소스에서 고치고(브라우저 eval 임시수정 금지) 재확인. 없으면 다음.

- [ ] **Step 3: progress.md 갱신**

`progress.md` 의 활성 트랙을 "랜딩 작성 여정 원페이저 `done`"으로 추가하고 '최근 검증' 한 줄을 이 슬라이스 결과로 갱신(절대 테스트 수치는 여기 한 곳만). 커밋 SHA·라이브 게이트 결과 증거 포함.

- [ ] **Step 4: session-handoff.md 인계 노트 추가**

맨 위에 이 세션 인계 블록 추가 — 한 것 · 손대지 말 것(두 축 프레임·`landingFlow.ts` 불변식) · 다음 한 가지. **후속 스코핑 2건**(흡인력 게이트 = critic-reviewer 승격 · 서프라이즈 주입 VS UX = PLAY 후보 다발)을 "다음 후보"로 명시해 인계.

- [ ] **Step 5: Commit**

```bash
git add progress.md session-handoff.md
git commit -m "docs: 랜딩 작성 여정 원페이저 done — 라이브 검증·상태 갱신

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 검증 (Definition of Done)

- `npm test` 전체 녹색(신규 `landingFlow.test.ts` 4) · `npm run build`(tsc+vite) 성공 · `bash init.sh` 통과.
- 라이브 6게이트 전부 통과(위 Task 4 Step 1).
- `progress.md` done 갱신 · `session-handoff.md` 인계(후속 스코핑 2건 포함).

## 범위 밖 (후속 별도 조각 — 인계만)

- **흡인력 게이트** — `critic-reviewer` 를 긴장·서프라이즈 기준 흡인력 게이트로 승격(Re3 재순위 단계). brainstorming 필요·새 세션.
- **서프라이즈 주입(VS) UX** — PLAY "이어 굴리기"에서 다음 전개 후보 N개를 확률과 함께 펼쳐 사람이 고르는 UX. brainstorming 필요·새 세션.
- 근거 = `docs/research/2026-07-05-compellingness-human-ai.md`.
