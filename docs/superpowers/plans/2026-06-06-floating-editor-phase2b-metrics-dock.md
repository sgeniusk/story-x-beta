# 플로팅 에디터 Phase 2b — 지표 독 패널 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** floating 독에 "지표" 버튼 1개를 추가해, 누르면 하니스·품질게이트·매체투사·온톨로지 4섹션을 floating-네이티브 `.fc-*` 톤으로 보여주는 패널을 띄운다.

**Architecture:** `FloatingEditor` 에 `metrics: StudioMetrics`(+슬라이더용 `onMediaAxisChange?`) prop 을 추가하고(순수 표현), 독에 "지표" 버튼 + `fc-p-metrics` 패널(4 접이식 섹션)을 신설한다. 데이터는 StoryXDesk 가 이미 계산한 `studioMetrics`(856) + `updateStoryModeAxis`(868)를 `floatingEditorProps` 로 주입(두 심볼 모두 floatingEditorProps 정의보다 위 → 호이스팅 문제 없음). 스타일은 `.fc-app` 스코프 `.fc-*` CSS 신설.

**Tech Stack:** React 18 + TS, Vite, Vitest + react-dom/client(jsdom), Playwright(시각).

**선행:** Phase 2a 머지(`389a997`) + 정렬(`488b5e8`), 스펙 `a8c9a35`(`docs/superpowers/specs/2026-06-06-floating-editor-phase2b-metrics-dock-design.md`). 기준선 306 tests green. `StudioMetrics`(src/lib/studioMetrics.ts) = `{ harness:{lead,tone,sub,layers:[{name,pass}]}, quality:{lead,tone,sub,gates:[{key,pass,note?}]}, media:{lead,tone,sub,axis,projections:[{medium,fit,current}]}, ontology:{lead,tone,sub,entities:[{kind,count}]} }`, tone = 'good'|'warn'|'neutral'.

---

## 파일 구조

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/components/FloatingEditor.tsx` | floating 표현 컴포넌트 | 수정 — props 2개, openPanel 'metrics', 독 "지표" 버튼, `fc-p-metrics` 패널(4섹션) |
| `src/components/floatingEditor.test.ts` | 단위 검증 | 수정 — 지표 패널·값·슬라이더 케이스 |
| `src/styles.css` | `.fc-app` 스코프 스타일 | 수정 — 지표 패널 `.fc-*` CSS |
| `src/StoryXDesk.tsx` | 단일 원천 주입 | 수정 — floatingEditorProps 에 metrics·onMediaAxisChange |

---

## Task 1: FloatingEditor — props + "지표" 독 버튼 + 4섹션 패널

**Files:** Modify `src/components/FloatingEditor.tsx`, `src/components/floatingEditor.test.ts`

- [ ] **Step 1: baseProps 에 metrics mock + import 추가, 실패 테스트 작성**

`floatingEditor.test.ts` 상단 import 에 추가:
```ts
import type { StudioMetrics } from '../lib/studioMetrics';
```
`baseProps()` return 객체에 추가:
```ts
    metrics: {
      harness: { lead: '95/100', tone: 'warn', sub: '보강 필요', layers: [
        { name: '진단', pass: true }, { name: '제작', pass: false },
      ]},
      quality: { lead: '2/7 통과', tone: 'warn', sub: '강제 실패 5', gates: [
        { key: 'hook_first_300', pass: false, note: '첫 300자 평이' },
        { key: 'voice_match_70', pass: true },
      ]},
      media: { lead: '소설 · 핵심 100%', tone: 'good', sub: '6개 매체', axis: 0.5, projections: [
        { medium: '소설', fit: 100, current: true },
      ]},
      ontology: { lead: '중심 질문 있음', tone: 'good', sub: '1개 미해결', entities: [
        { kind: '인물', count: 1 }, { kind: '세계', count: 1 },
      ]},
    } as StudioMetrics,
    onMediaAxisChange: vi.fn(),
```
케이스 추가:
```ts
  it('지표 버튼을 누르면 지표 패널이 열린다', () => {
    const { host, unmount } = mount(baseProps());
    const btn = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('지표'));
    act(() => { btn?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(host.querySelector('#fc-p-metrics')?.classList.contains('show')).toBe(true);
    unmount();
  });

  it('지표 패널이 4섹션과 값을 렌더한다', () => {
    const { host, unmount } = mount(baseProps());
    const panel = host.querySelector('#fc-p-metrics') as HTMLElement;
    expect(panel.textContent).toContain('하니스');
    expect(panel.textContent).toContain('95/100');
    expect(panel.textContent).toContain('품질 게이트');
    expect(panel.textContent).toContain('hook_first_300');
    expect(panel.textContent).toContain('매체 투사');
    expect(panel.textContent).toContain('온톨로지');
    expect(panel.textContent).toContain('인물');
    unmount();
  });

  it('매체 슬라이더가 onMediaAxisChange 를 호출한다', () => {
    const onMediaAxisChange = vi.fn();
    const { host, unmount } = mount(baseProps({ onMediaAxisChange }));
    const slider = host.querySelector('#fc-p-metrics .fc-axis-input') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    nativeSetter.call(slider, '80');
    act(() => { slider.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onMediaAxisChange).toHaveBeenCalledWith(0.8);
    unmount();
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: FAIL — props 타입 없음(tsc), 지표 버튼·패널 없음.

- [ ] **Step 3: props 인터페이스 + destructure + import**

`FloatingEditor.tsx` 상단 import 에 추가:
```tsx
import type { StudioMetrics } from '../lib/studioMetrics';
```
`FloatingEditorProps` 끝에 추가:
```tsx
  metrics: StudioMetrics;
  onMediaAxisChange?: (axis: number) => void;
```
함수 destructure 에 추가: `metrics,` 와 `onMediaAxisChange,`.

- [ ] **Step 4: openPanel 타입 확장 + 섹션 토글 state**

`const [openPanel, setOpenPanel] = useState<'struct' | 'curve' | 'state' | 'writers' | null>(null);` 를
`...<'struct' | 'curve' | 'state' | 'writers' | 'metrics' | null>(null);` 로.
`togglePanel` 의 인자 타입도 동일하게 `'metrics'` 추가.
지표 섹션 접이용 로컬 state 추가(useState 들 근처) — warn 인 섹션을 기본 오픈:
```tsx
  const [openMetric, setOpenMetric] = useState<'harness' | 'quality' | 'media' | 'ontology'>(
    metrics.harness.tone === 'warn'
      ? 'harness'
      : (['quality', 'media', 'ontology'] as const).find((k) => metrics[k].tone === 'warn') ?? 'harness'
  );
```

- [ ] **Step 5: 독에 "지표" 버튼 추가**

"상태" 버튼(`title="작품 상태"`)과 그 다음 `<div className="sep" />` 사이에 삽입:
```tsx
          <button
            className={`tool${openPanel === 'metrics' ? ' on' : ''}`}
            onClick={() => togglePanel('metrics')}
            title="지표"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 12h4l3-8 4 16 3-8h4" />
            </svg>
            <span className="t">지표</span>
          </button>
```

- [ ] **Step 6: `fc-p-metrics` 패널(4 접이식 섹션) 추가**

다른 패널들(`fc-p-state` 등) 옆, 패널 블록 모음 안에 추가:
```tsx
      <div className={`panel${openPanel === 'metrics' ? ' show' : ''}`} id="fc-p-metrics">
        <div className="ph">
          <h4>작품 지표</h4>
          <button className="x" onClick={closeAll}>✕</button>
        </div>
        <div className="pb fc-metrics">
          {/* 하니스 */}
          <div className={`fc-metric tone-${metrics.harness.tone}${openMetric === 'harness' ? ' open' : ''}`}>
            <button className="fc-metric-h" onClick={() => setOpenMetric('harness')}>
              <span className="nm">하니스</span><span className="lead">{metrics.harness.lead}</span>
              <span className="sub">{metrics.harness.sub}</span>
            </button>
            <div className="fc-metric-b">
              {metrics.harness.layers.map((l) => (
                <span key={l.name} className={`fc-row${l.pass ? '' : ' fail'}`}>{l.pass ? '✓' : '!'} {l.name}</span>
              ))}
            </div>
          </div>
          {/* 품질 게이트 */}
          <div className={`fc-metric tone-${metrics.quality.tone}${openMetric === 'quality' ? ' open' : ''}`}>
            <button className="fc-metric-h" onClick={() => setOpenMetric('quality')}>
              <span className="nm">품질 게이트</span><span className="lead">{metrics.quality.lead}</span>
              <span className="sub">{metrics.quality.sub}</span>
            </button>
            <div className="fc-metric-b">
              {metrics.quality.gates.map((g) => (
                <span key={g.key} className={`fc-row${g.pass ? '' : ' fail'}`}>{g.key}{g.note ? ` · ${g.note}` : ''}</span>
              ))}
            </div>
          </div>
          {/* 매체 투사 */}
          <div className={`fc-metric tone-${metrics.media.tone}${openMetric === 'media' ? ' open' : ''}`}>
            <button className="fc-metric-h" onClick={() => setOpenMetric('media')}>
              <span className="nm">매체 투사</span><span className="lead">{metrics.media.lead}</span>
              <span className="sub">{metrics.media.sub}</span>
            </button>
            <div className="fc-metric-b">
              <div className="fc-axis">
                <div className="fc-axis-labels"><span>commercial</span><span>literary</span></div>
                {onMediaAxisChange && (
                  <input
                    className="fc-axis-input" type="range" min={0} max={100}
                    value={Math.round(metrics.media.axis * 100)}
                    onChange={(e) => onMediaAxisChange(Number(e.target.value) / 100)}
                    aria-label="작품 무게중심 (좌: 대중성 / 우: 작품성)"
                  />
                )}
              </div>
              {metrics.media.projections.map((p) => (
                <span key={p.medium} className={`fc-row${p.current ? ' cur' : ''}`}>{p.medium} · {p.fit}%</span>
              ))}
            </div>
          </div>
          {/* 온톨로지 */}
          <div className={`fc-metric tone-${metrics.ontology.tone}${openMetric === 'ontology' ? ' open' : ''}`}>
            <button className="fc-metric-h" onClick={() => setOpenMetric('ontology')}>
              <span className="nm">온톨로지</span><span className="lead">{metrics.ontology.lead}</span>
              <span className="sub">{metrics.ontology.sub}</span>
            </button>
            <div className="fc-metric-b">
              {metrics.ontology.entities.map((e) => (
                <span key={e.kind} className="fc-row">{e.kind} {e.count}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 7: 테스트 실행 — 통과 확인**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS (지표 버튼·4섹션·값·슬라이더). 단 슬라이더 케이스는 `.fc-axis-input` 가 `onMediaAxisChange` 있을 때만 렌더되므로 baseProps 에 `onMediaAxisChange: vi.fn()` 있어 렌더됨.

- [ ] **Step 8: tsc + 전체 테스트 + 커밋**

Run: `npx tsc --noEmit` (0) · `npx vitest run` (전체 통과).
```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(editor): floating 독 지표 패널 — 하니스·품질·매체·온톨로지 4섹션 (Phase 2b Task1)"
```
커밋 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## Task 2: `.fc-*` 지표 패널 스타일

**Files:** Modify `src/styles.css` (`.fc-app` 스코프 블록 내)

- [ ] **Step 1: 지표 패널 CSS 추가**

`.fc-app` 스코프 블록(예: `.fc-app .panel` 규칙 근처)에 추가:
```css
.fc-app .fc-metrics{display:flex;flex-direction:column;gap:8px}
.fc-app .fc-metric{border:1px solid var(--rule-soft);border-radius:10px;overflow:hidden}
.fc-app .fc-metric-h{display:flex;align-items:center;gap:8px;width:100%;padding:9px 11px;text-align:left;font-size:12px}
.fc-app .fc-metric-h .nm{font-weight:600;color:var(--ink)}
.fc-app .fc-metric-h .lead{margin-left:auto;color:var(--accent);font-weight:600}
.fc-app .fc-metric-h .sub{flex-basis:100%;color:var(--ink-faint);font-size:10.5px}
.fc-app .fc-metric.tone-warn .fc-metric-h .lead{color:var(--warn,#e0a23a)}
.fc-app .fc-metric-b{display:none;flex-direction:column;gap:4px;padding:0 11px 11px}
.fc-app .fc-metric.open .fc-metric-b{display:flex}
.fc-app .fc-row{font-size:11px;color:var(--ink-dim)}
.fc-app .fc-row.fail{color:var(--warn,#e0a23a)}
.fc-app .fc-row.cur{color:var(--ink);font-weight:600}
.fc-app .fc-axis{margin-bottom:6px}
.fc-app .fc-axis-labels{display:flex;justify-content:space-between;font-size:10px;color:var(--ink-faint);margin-bottom:3px}
.fc-app .fc-axis-input{width:100%}
```
(`--warn` 토큰이 `.fc-app` 에 없으면 fallback 색 사용 — 위 `var(--warn,#e0a23a)` 형태로 안전.)

- [ ] **Step 2: 시각 확인 (수동)**

dev 서버에서 `?stage=editor` → 지표 버튼 클릭 → 패널 4섹션이 floating 톤으로, 섹션 클릭 시 본문 펼침 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/styles.css
git commit -m "style(editor): floating 지표 패널 .fc-* 스타일 (Phase 2b Task2)"
```
Co-Authored-By 라인 포함.

---

## Task 3: StoryXDesk 배선 — studioMetrics 주입

**Files:** Modify `src/StoryXDesk.tsx` (floatingEditorProps, ~1224)

- [ ] **Step 1: floatingEditorProps 에 metrics·onMediaAxisChange 추가**

`floatingEditorProps` useMemo return 객체에(기존 `isGenerating,` 다음 등) 추가:
```tsx
      metrics: studioMetrics,
      onMediaAxisChange: updateStoryModeAxis,
```
deps 배열에 `studioMetrics`, `updateStoryModeAxis` 추가.
(둘 다 floatingEditorProps 정의보다 위(856·868)라 호이스팅 문제 없음.)

- [ ] **Step 2: tsc + 전체 테스트**

Run: `npx tsc --noEmit` (0) · `npx vitest run` (전체 통과).

- [ ] **Step 3: 커밋**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(editor): StoryXDesk floating 지표 패널에 studioMetrics 주입 (Phase 2b Task3)"
```
Co-Authored-By 라인 포함.

---

## Task 4: 전체 검증

**Files:** 없음(검증만)

- [ ] **Step 1: 하네스 게이트** — `bash init.sh` → tsc·vitest·build 통과.
- [ ] **Step 2: 라이브** — `npm run dev`, Playwright `?stage=editor` → 독 "지표" 버튼 클릭 → 패널 4섹션(하니스 95/100·품질 게이트 행·매체 슬라이더·온톨로지 카운트) floating 톤 렌더 · 슬라이더 드래그 시 매체 fit 변동 · 콘솔 0.
- [ ] **Step 3: 4해상도 시각** — 1440·1024·768·360 → 독 6버튼·지표 패널 이탈/겹침 없음. 캡처 `docs/handoff/screenshots/floating-phase2b/`.
- [ ] **Step 4: 상태 문서 + 커밋** — progress.md/session-handoff.md 에 2b 완료 기록(증거 SHA·캡처). `git commit`.

---

## 범위 밖
- 회차/곡선 패널 리치판(ChapterStructureTree/TensionShareChart) 이식 — 별도.
- 데이터(2c)·출간(2d) floating 화 · 옛 3컬럼 제거(2e).
- rank5 잔여(죽은 코드·PublishingStudio·Tier3 훅).

## 리스크·완화
- **StudioMetrics 형태 의존** — 타입 import 로 컴파일 보장. mock 도 같은 타입.
- **독 6버튼 360 모바일 좁아짐** — Task4 360 캡처로 확인, 필요 시 독 스크롤/축약.
- **`--warn` 토큰 부재** — `var(--warn,#e0a23a)` fallback 으로 안전.
- **슬라이더 React value tracker** — 테스트는 네이티브 setter 로 input 시뮬레이트(Phase 2a 의도메모와 동일 패턴).
