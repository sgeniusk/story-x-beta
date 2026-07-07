# VS 후보 흡인력 2축 주석(긴장 배지) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VS 전개 후보에 LLM verbalize 긴장 축(`tension`/`tensionNote`)을 얹어 WRITE·PLAY 두 표면에 「새 긴장」/「회수만」 배지를 렌더한다 — 순서 불변, 주석만.

**Architecture:** 같은 VS 콜의 JSON 계약에 2필드 추가(프롬프트 미러 3점 세트 동시 갱신) → 서버는 무가공 통과(코드 무변경) → `normalizeVsCandidates`가 enum 검증·120자 절단·조용한 강등 → 두 표면이 각자 배지 렌더. 정본 spec = `docs/superpowers/specs/2026-07-07-vs-tension-annotation-design.md`.

**Tech Stack:** TypeScript + React(프레젠테이션 컴포넌트) + Vitest(renderToStaticMarkup/react-dom 클라이언트 마운트) + vanilla CSS(`.dx-vs-*`/`.fc-vs-*` 관례).

**불변식(전 태스크 공통)** — 후보 순서 보존(정렬 금지) · 확률 숫자 비노출 · 기존 rarity 게이지·canonSuspect 무변경 · 선택 배관(send/의도 시드) 무접촉 · 프롬프트 미러 byte-identical · 새 transition/animation 없음(reduced-motion 블록 무접촉).

---

### Task 1: 데이터 계약 — `VsCandidate.tension`/`tensionNote` + normalize 검증

**Files:**
- Modify: `src/lib/episodeBriefing.ts:24-73` (타입 + `normalizeVsCandidates`)
- Test: `src/lib/episodeBriefing.test.ts` (`describe('normalizeVsCandidates')` 블록 끝, ~543행 부근)

- [ ] **Step 1: 실패하는 테스트 4개 추가**

`src/lib/episodeBriefing.test.ts`의 `describe('normalizeVsCandidates', …)` 블록 안, 마지막 `it`('4개 초과는 상위 4개만') 뒤에 추가.

```ts
  it('tension arms/drains 를 보존하고 tensionNote 를 함께 싣는다', () => {
    const out = normalizeVsCandidates({ candidates: [
      { direction: 'A', probability: 0.5, tension: 'arms', tensionNote: '새 질문을 연다' },
      { direction: 'B', probability: 0.5, tension: 'drains' }
    ] }, []);
    expect(out[0].tension).toBe('arms');
    expect(out[0].tensionNote).toBe('새 질문을 연다');
    expect(out[1].tension).toBe('drains');
    expect(out[1].tensionNote).toBeUndefined();
  });
  it('비정상 tension 값·누락은 필드 자체를 생략한다(조용한 강등)', () => {
    const out = normalizeVsCandidates({ candidates: [
      { direction: 'A', probability: 0.5, tension: 'both' },
      { direction: 'B', probability: 0.5, tension: 1 },
      { direction: 'C', probability: 0.5 }
    ] }, []);
    expect('tension' in out[0]).toBe(false);
    expect('tension' in out[1]).toBe(false);
    expect('tension' in out[2]).toBe(false);
  });
  it('tensionNote 는 trim 후 120자 초과분을 절단한다', () => {
    const long = '가'.repeat(150);
    const out = normalizeVsCandidates({ candidates: [
      { direction: 'A', probability: 0.5, tension: 'arms', tensionNote: `  ${long}  ` }
    ] }, []);
    expect(out[0].tensionNote).toBe('가'.repeat(120));
  });
  it('tension 없는 tensionNote 는 버린다', () => {
    const out = normalizeVsCandidates({ candidates: [
      { direction: 'A', probability: 0.5, tensionNote: '홀로 온 근거' }
    ] }, []);
    expect(out[0].tensionNote).toBeUndefined();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/episodeBriefing.test.ts`
Expected: 신규 4개 FAIL(기존 통과) — `out[0].tension`이 undefined, TS 컴파일은 `tension` 필드 부재로 타입 에러 가능(그것도 red 신호로 인정).

- [ ] **Step 3: 타입 + normalize 구현**

`src/lib/episodeBriefing.ts:24-30` 타입 교체.

```ts
export type VsRarity = 'common' | 'surprising' | 'radical';
export type VsTension = 'arms' | 'drains';
export interface VsCandidate {
  direction: string;
  probability: number;     // LLM verbalize 추정, 내부용(비노출)
  rarity: VsRarity;
  canonSuspect?: boolean;
  tension?: VsTension;     // LLM verbalize — arms=새 긴장 장전 · drains=열린 질문 회수만. 비정상 값·누락은 생략(배지 무렌더 강등).
  tensionNote?: string;    // 판정 근거 한 문장(배지 title 툴팁). tension 유효할 때만, trim 후 120자 절단.
}
```

`normalizeVsCandidates`(51-73행) — 주석 갱신 + 상수 + push 확장.

```ts
// provider 응답({ candidates: [{ direction, probability, tension?, tensionNote? }] })을 VsCandidate[] 로 정규화.
// direction 빈 것 제외 · probability 0~1 clamp(누락 시 0.3) · rarity 변환 · canonSuspect(overlapsCanonFact)
// · tension enum 검증(그 외 값 생략) · tensionNote 는 tension 유효 시에만 trim+120자 절단 · 최대 4개.
const MAX_VS_CANDIDATES = 4;
const MAX_TENSION_NOTE = 120;
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
    const tension = r.tension === 'arms' || r.tension === 'drains' ? (r.tension as VsTension) : undefined;
    const tensionNote =
      tension && typeof r.tensionNote === 'string' ? r.tensionNote.trim().slice(0, MAX_TENSION_NOTE) : '';
    out.push({
      direction,
      probability,
      rarity: classifyRarity(probability),
      ...(overlapsCanonFact(direction, canonStatements) ? { canonSuspect: true } : {}),
      ...(tension ? { tension } : {}),
      ...(tension && tensionNote ? { tensionNote } : {})
    });
    if (out.length >= MAX_VS_CANDIDATES) break;
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/episodeBriefing.test.ts`
Expected: PASS (기존 단언 포함 전부 녹색 — rarity·canonSuspect·절단 무손상 확인).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/episodeBriefing.ts src/lib/episodeBriefing.test.ts
git commit -m "feat(vs): VsCandidate 긴장 축 2필드 — tension enum 검증·tensionNote 120자 절단·조용한 강등

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 프롬프트 미러 3점 세트 — 지시 1줄 + JSON 계약 2필드

**Files:**
- Modify: `src/lib/server/promptBuilders.ts:637-647` (`buildVsCandidatesPrompt` 지시·계약)
- Modify: `tools/storyx.mjs:2238-2248` (byte-identical 미러)
- Test: `src/lib/server/promptBuilders.test.ts:405-422` (`VS_JSON_CONTRACT` 핀 + 지시 단언)

- [ ] **Step 1: 핀 테스트 갱신(실패 유도)**

`src/lib/server/promptBuilders.test.ts:406`의 상수를 교체하고, 첫 `it`에 지시문 단언 1개 추가.

```ts
  const VS_JSON_CONTRACT =
    '  "candidates": [{ "direction": "...", "probability": 0.0, "tension": "arms", "tensionNote": "..." }]';
```

첫 `it`(407행) 본문의 `expect(p).toContain(VS_JSON_CONTRACT);` 앞에 추가.

```ts
    expect(p).toContain('새 질문·위험·갈등을 장전하면 "arms"');
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/server/promptBuilders.test.ts`
Expected: `buildVsCandidatesPrompt` describe의 2개 it 모두 FAIL(계약 문자열·지시문 미포함 + [vs-mirror] storyx.mjs 미포함).

- [ ] **Step 3: TS 프롬프트 구현**

`src/lib/server/promptBuilders.ts` — 641행 `'- 확률은 0과 1 사이 숫자입니다.',` 바로 뒤에 지시 1줄 삽입, 646행 계약 교체.

```ts
    '- 확률은 0과 1 사이 숫자입니다.',
    '- 각 방향의 "tension"을 판정합니다 — 새 질문·위험·갈등을 장전하면 "arms", 열린 질문·약속을 닫기만 하면 "drains". "tensionNote"에는 그 판정의 근거를 한 문장으로 씁니다.',
    '- 한국어로 씁니다.',
```

```ts
    '  "candidates": [{ "direction": "...", "probability": 0.0, "tension": "arms", "tensionNote": "..." }]',
```

- [ ] **Step 4: CLI 미러 동기화 (byte-identical)**

`tools/storyx.mjs` — 2242행 `'- 확률은 0과 1 사이 숫자입니다.',` 바로 뒤에 **같은 지시 1줄**, 2247행 계약을 **같은 문자열**로 교체(위 Step 3과 문자 단위 동일해야 [vs-mirror] 통과).

- [ ] **Step 5: 통과 확인 + dry-run 눈검증**

Run: `npm test -- src/lib/server/promptBuilders.test.ts`
Expected: PASS.

Run: `node tools/storyx.mjs vs-candidates --dry-run --medium novel --format long-novel --recent-summary "1화" --unpaid-json "[]"`
Expected: 출력 프롬프트에 tension 지시 줄 + 새 JSON 계약 포함.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/server/promptBuilders.ts tools/storyx.mjs src/lib/server/promptBuilders.test.ts
git commit -m "feat(vs): VS 프롬프트에 tension 판정 지시·JSON 계약 2필드 — 미러 3점 세트 동시 갱신(봉인 해제는 spec 명시)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: PLAY 표면 — VsCandidatePanel 긴장 배지 + `.dx-vs-tension` CSS

**Files:**
- Modify: `src/components/VsCandidatePanel.tsx:32-33` (direction 뒤·캐논 앞 배지)
- Modify: `src/styles.css:9203` 직후 (`.dx-vs-suspect` 아래 3줄)
- Test: `src/components/vsCandidatePanel.test.ts` (describe 끝, ~36행)

- [ ] **Step 1: 실패하는 테스트 4개 추가**

`src/components/vsCandidatePanel.test.ts`의 `describe('VsCandidatePanel', …)` 마지막 `it` 뒤에 추가.

```ts
  it('tension arms 후보에 「새 긴장」 배지·is-arms 클래스·title 툴팁', () => {
    const html = render([cand({ tension: 'arms', tensionNote: '죽은 형의 서명이라는 새 질문을 연다' })]);
    expect(html).toContain('새 긴장');
    expect(html).toContain('dx-vs-tension is-arms');
    expect(html).toContain('죽은 형의 서명이라는 새 질문을 연다');
  });
  it('tension drains 후보에 「회수만」 배지', () => {
    const html = render([cand({ tension: 'drains' })]);
    expect(html).toContain('회수만');
    expect(html).toContain('is-drains');
  });
  it('tension 없으면 긴장 배지 무렌더', () => {
    expect(render([cand({})])).not.toContain('dx-vs-tension');
  });
  it('arms+canonSuspect 병기 — 긴장 배지가 캐논 배지 앞(버튼 title=캐논 경고와 배지 title=근거 공존은 의도)', () => {
    const html = render([cand({ tension: 'arms', canonSuspect: true })]);
    expect(html.indexOf('새 긴장')).toBeGreaterThan(-1);
    expect(html.indexOf('새 긴장')).toBeLessThan(html.indexOf('캐논 확인'));
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/vsCandidatePanel.test.ts`
Expected: 신규 4개 중 3개 FAIL('무렌더'는 통과할 수 있음 — 나머지 red면 진행).

- [ ] **Step 3: 배지 렌더 구현**

`src/components/VsCandidatePanel.tsx` — 32행 `<span className="dx-vs-direction">…` 과 33행 `{c.canonSuspect && …}` 사이에 삽입. 1행 헤더 주석도 갱신.

```tsx
// PLAY 전개 후보(VS) 게이지 패널 — 의외도 3칸 막대·긴장 배지·캐논 배지·선택. 상태·fetch 는 DiveDesk 소유(프레젠테이션만).
```

```tsx
            <span className="dx-vs-direction">{c.direction}</span>
            {c.tension && (
              <em className={`dx-vs-tension is-${c.tension}`} title={c.tensionNote}>
                {c.tension === 'arms' ? '새 긴장' : '회수만'}
              </em>
            )}
            {c.canonSuspect && <em className="dx-vs-suspect">캐논 확인</em>}
```

- [ ] **Step 4: CSS 추가**

`src/styles.css` — 9203행 `.dx-vs-suspect { … }` 바로 아래 삽입(새 애니메이션 없음 — reduced-motion 블록 무접촉).

```css
.dx-vs-tension { flex: 0 0 auto; font-style: normal; font-size: 9px; padding: 1px 6px; border-radius: 999px; }
.dx-vs-tension.is-arms { background: color-mix(in srgb, #22d3ee 20%, transparent); color: #22d3ee; }
.dx-vs-tension.is-drains { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.45); }
```

- [ ] **Step 5: 통과 확인**

Run: `npm test -- src/components/vsCandidatePanel.test.ts`
Expected: PASS (기존 5개 포함 전부).

- [ ] **Step 6: 커밋**

```bash
git add src/components/VsCandidatePanel.tsx src/components/vsCandidatePanel.test.ts src/styles.css
git commit -m "feat(vs): PLAY 후보 패널 긴장 배지 — 새 긴장 청록·회수만 무채, 캐논 배지와 독립 병기

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: WRITE 표면 — FloatingEditor `.fc-vs` 긴장 배지 + CSS

**Files:**
- Modify: `src/components/FloatingEditor.tsx:843-844` (`fc-vs-dir` 뒤·`fc-fork-suspect` 앞)
- Modify: `src/styles.css:9144` 직후 (`.fc-vs-dir` 아래 3줄)
- Test: `src/components/floatingEditor.test.ts:538-560` (`FloatingEditor VS 전개 후보` describe)

- [ ] **Step 1: 실패하는 테스트 1개 추가**

`src/components/floatingEditor.test.ts` — `describe('FloatingEditor VS 전개 후보 (C-1 Task8)', …)` 안 '[VS] vsCandidates 를 rarity 라벨과 함께 렌더한다' it 뒤에 추가.

```ts
  it('[VS] tension 배지를 렌더한다 — arms 새 긴장·drains 회수만', () => {
    const { host, unmount } = mount(baseProps({
      onRequestVsCandidates: () => {},
      onIntentChange: () => {},
      vsCandidates: [
        { direction: '배신한다', probability: 0.1, rarity: 'radical', tension: 'arms', tensionNote: '새 적을 만든다' },
        { direction: '화해한다', probability: 0.5, rarity: 'common', tension: 'drains' },
      ],
    }));
    expect(host.textContent).toContain('새 긴장');
    expect(host.textContent).toContain('회수만');
    unmount();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/floatingEditor.test.ts`
Expected: 신규 1개 FAIL, 기존 3개 [VS] 단언 PASS.

- [ ] **Step 3: 배지 렌더 구현**

`src/components/FloatingEditor.tsx` — 843행 `<span className="fc-vs-dir">…` 과 844행 `{c.canonSuspect && …}` 사이에 삽입.

```tsx
                      <span className="fc-vs-dir">{c.direction}</span>
                      {c.tension && (
                        <em className={`fc-vs-tension is-${c.tension}`} title={c.tensionNote}>
                          {c.tension === 'arms' ? '새 긴장' : '회수만'}
                        </em>
                      )}
                      {c.canonSuspect && <em className="fc-fork-suspect">캐논 확인</em>}
```

- [ ] **Step 4: CSS 추가**

`src/styles.css` — 9144행 `.fc-vs-dir { … }` 바로 아래 삽입(`.dx-vs-tension`과 같은 값 — 표면별 클래스 관례 유지).

```css
.fc-vs-tension { flex: 0 0 auto; font-style: normal; font-size: 9px; padding: 1px 6px; border-radius: 999px; }
.fc-vs-tension.is-arms { background: color-mix(in srgb, #22d3ee 20%, transparent); color: #22d3ee; }
.fc-vs-tension.is-drains { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.45); }
```

- [ ] **Step 5: 통과 확인**

Run: `npm test -- src/components/floatingEditor.test.ts`
Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts src/styles.css
git commit -m "feat(vs): WRITE fc-vs 긴장 배지 — PLAY와 같은 규칙, rarity 알약 옆 병기

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 전체 검증 — init.sh + 라이브 (spec §6 DoD)

**Files:**
- Modify: `progress.md` (새 완료 트랙 절 + 최근 검증)
- (검증만, 코드 무변경)

- [ ] **Step 1: 하네스 전체 녹색**

Run: `bash init.sh`
Expected: tsc · vitest 전체 · vite build 통과.

- [ ] **Step 2: 라이브 검증 (preview 5175)**

preview_start(launch.json `storyx`) → 백업 주입(스니펫 `docs/handoff/2026-06-11-demo-video-kit.md`, 캐논 많은 백업 권장 `docs/reviews/2026-06-07-persona-live-test/backups/02-work-backup-ch23.json`).

1. `?stage=editor` WRITE — 작품 상태 패널 `.fc-vs` 「전개 후보 받기」 클릭(React onClick 안 태우면 `dispatchEvent(new MouseEvent('click',{bubbles:true}))` 우회) → 실 codex 응답 후보에 긴장 배지 렌더 확인(`preview_inspect`로 `.fc-vs-tension` computed color 실측).
2. `?stage=dive` PLAY — 컴포저 「✦ 전개 후보」 → 게이지+긴장 배지 병기·hover title(tensionNote) 존재 확인(`preview_eval`로 title 속성 읽기).
3. 후보 4개의 「새 긴장」/「회수만」 분포가 방향 텍스트와 정합하는지 눈 판정.
4. `preview_console_logs` 에러 0.

주의 — LLM이 tension 필드를 안 돌려줘도 배지만 없을 뿐 정상(조용한 강등·normalize 단위 테스트가 커버). 반복 요청 2~3회로 필드 도착률 관찰해 progress.md에 기록.

- [ ] **Step 3: progress.md 갱신 + 커밋**

progress.md 상단에 완료 트랙 절 추가(구현·불변식·검증 증거) + '최근 검증' 갱신.

```bash
git add progress.md
git commit -m "docs: VS 긴장 배지 슬라이스 검증 기록 — init.sh·라이브 게이트

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
