# Dive X 진전 엔진 (묶음 C-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 쇼러너가 세션 StoryArc(극적 질문·긴장·다음 전개)를 들고 매 턴 이야기를 한 걸음 진전시키고, ⏭전개 버튼으로 강한 전개를 당기게 한다.

**Architecture:** `dive-chat`이 현재 arc(JSON)를 입력받아 응답을 nextBeat 방향으로 진전시키고 갱신된 arc를 `{reply, choices, arc}`로 함께 낸다(추가 LLM 호출 0). DiveDesk가 그 arc를 세션에 저장·영속하고 🎯로 표시한다. 가벼운 LLM-유지 방식 — Story X의 무거운 storyHarness는 안 돌린다.

**Tech Stack:** TypeScript · React · vitest · Node `tools/storyx.mjs`(codex) · Vite 브리지

**스펙:** `docs/superpowers/specs/2026-06-27-dive-x-arc-engine-design.md` · **브랜치:** `feat/dive-x-arc`

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `src/lib/diveSession.ts` | 수정 | `StoryArc` 타입 + `DiveSession.arc?` |
| `src/lib/diveSession.test.ts` | 수정 | arc 기본 undefined 핀 |
| `tools/storyx.mjs` | 수정 | dive-chat `--arc` 입력·프롬프트·`arc` 출력 · dive-condense `--arc` |
| `vite.config.ts` | 수정 | dive-chat·dive-condense에 `--arc` |
| `src/lib/diveClient.ts` | 수정 | 요청에 `arc?` · `DiveChatResponse.arc?` |
| `src/lib/diveClient.test.ts` | 수정 | arc 통과 TDD |
| `src/components/DiveDesk.tsx` | 수정 | arc 주입·응답 arc 저장·⏭전개·🎯 표시 |
| `src/components/diveDesk.test.ts` | 수정 | ⏭전개 렌더 핀 |
| `src/styles.css` | 수정 | `.dx-arc`·`.dx-escalate` |

검증: 단일 `npx vitest run <file>`, 전체 `npm test`, `npm run build`, `npx tsc --noEmit`.

---

## Task 1: diveSession — StoryArc + DiveSession.arc

**Files:**
- Modify: `src/lib/diveSession.ts`, `src/lib/diveSession.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/diveSession.test.ts` describe 안

```typescript
  it('createDiveSession은 arc를 비워 둔다', () => {
    expect(createDiveSession('c', 'p').arc).toBeUndefined();
  });
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/diveSession.test.ts` · Expected: FAIL(arc 속성 타입 에러)

- [ ] **Step 3: 구현** — `src/lib/diveSession.ts`

`DiveSession` 인터페이스에 `arc?: StoryArc;` 추가(`scene?` 옆). 그리고 `DiveSession` 인터페이스 위(또는 파일 상단 타입 영역)에 추가:
```typescript
export interface StoryArc {
  dramaticQuestion: string;
  tension: number;
  nextBeat: string;
}
```
`createDiveSession`은 arc를 설정하지 않는다(undefined 유지).

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/lib/diveSession.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSession.ts src/lib/diveSession.test.ts
git commit -m "feat(dive-x): StoryArc 타입 + DiveSession.arc (TDD)"
```

---

## Task 2: storyx.mjs — dive-chat arc 입출력 + dive-condense arc

**Files:**
- Modify: `tools/storyx.mjs`

먼저 dive-chat·dive-condense 블록을 읽는다. 기존 헬퍼(`readFlag`·`readString`·`normalizeStringList`·`parseProviderJson` 등) 재사용.

- [ ] **Step 1: dive-chat — arc 입력 + 프롬프트**

`if (command === 'dive-chat')` 에서 `const arc = readFlag(args, '--arc', '');` 추가(다른 readFlag 옆).

prompt 배열에서 choices 지시 줄(현재 `'응답 끝에, 주인공("나")이 …choices 배열로 제안하세요…'`) 바로 앞에 다음 두 줄을 삽입:
```javascript
    '이 이야기의 큰 그림(arc)을 들고 끌고 가세요. 응답을 arc.nextBeat 방향으로 한 걸음 진전시키고, tension이 낮거나 이야기가 정체되면 전개(단서·사건·전환)를 미세요. 이미 잡힌 dramaticQuestion은 웬만하면 유지하세요. arc가 비었으면 장면·기억에서 새로 잡으세요.',
    '',
    '## 이야기 아크 (JSON)',
    arc || '(아직 없음 — 새로 잡으세요)',
```

출력 형식 줄(현재 `'{ "reply": …, "choices": ["행동 2~3개"] }'`)을 다음으로 교체:
```javascript
    '{ "reply": "...", "choices": ["행동 2~3개"], "arc": { "dramaticQuestion": "이 이야기의 핵심 질문", "tension": 0, "nextBeat": "다음에 밀어붙일 전개" } }'
```

- [ ] **Step 2: dive-chat — mock + 실 provider 출력에 arc**

mock 분기 printJson에 `arc: { dramaticQuestion: '도윤의 가족은 정말 외계인인가?', tension: 30, nextBeat: '집 안에서 결정적 단서가 드러난다' }` 추가.

실 provider 분기 printJson에 추가(다른 필드 옆):
```javascript
    arc: (() => {
      const a = parsed?.arc;
      if (!a || typeof a !== 'object') return undefined;
      return {
        dramaticQuestion: readString(a.dramaticQuestion),
        tension: typeof a.tension === 'number' ? Math.max(0, Math.min(100, Math.round(a.tension))) : 0,
        nextBeat: readString(a.nextBeat)
      };
    })(),
```

- [ ] **Step 3: dive-condense — arc 주입**

`if (command === 'dive-condense')` 에 `const arc = readFlag(args, '--arc', '');` 추가하고, prompt 배열의 `## 현재 장면` 절 바로 뒤에 삽입:
```javascript
    '',
    '## 이야기 아크 (JSON — 긴장·다음 전개를 반영해 페이오프 있는 회차로)',
    arc || '(없음)',
```

- [ ] **Step 4: dry-run 스모크**

```
node tools/storyx.mjs dive-chat --provider mock --scene "도윤네 집 앞" --arc "" --query "초인종을 누른다"
```
Expected: `reply`·`choices`·`arc`(dramaticQuestion·tension·nextBeat) 포함 JSON 한 줄.

- [ ] **Step 5: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat(dive-x): dive-chat StoryArc 입출력(매 턴 진전) + dive-condense arc 주입"
```

---

## Task 3: vite — dive-chat/condense에 --arc

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: --arc 추가**

`/api/dive-chat` storyxBridge buildArgs에 `'--arc', String(input.arc ?? ''),` 추가(예: `--query` 앞). `/api/dive-condense` buildArgs에도 `'--arc', String(input.arc ?? ''),` 추가.

- [ ] **Step 2: 타입 체크** — Run: `npx tsc --noEmit` · Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add vite.config.ts
git commit -m "feat(dive-x): dive-chat/condense 브리지에 --arc"
```

---

## Task 4: diveClient — arc 요청/응답 타입

**Files:**
- Modify: `src/lib/diveClient.ts`, `src/lib/diveClient.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/diveClient.test.ts`

```typescript
  it('requestDiveChat는 arc를 통과시킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '...', arc: { dramaticQuestion: 'Q', tension: 40, nextBeat: 'B' } })
    }));
    const res = await requestDiveChat({ character: 'c', scene: '', context: '', dialogue: '', query: '응' });
    expect(res.arc).toEqual({ dramaticQuestion: 'Q', tension: 40, nextBeat: 'B' });
  });
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/diveClient.test.ts` · Expected: FAIL(arc 타입 없음)

- [ ] **Step 3: 구현** — `src/lib/diveClient.ts`

`DiveChatRequest`에 `arc?: string;`, `DiveCondenseRequest`에 `arc?: string;` 추가. `DiveChatResponse`에 추가:
```typescript
  arc?: { dramaticQuestion: string; tension: number; nextBeat: string };
```
(`DiveChatResponse`는 현재 `{ status, reply, choices?, warning? }` — arc를 한 줄 더한다.)

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/lib/diveClient.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive-x): diveClient arc 요청/응답 타입 (TDD)"
```

---

## Task 5: DiveDesk — arc 주입·저장·⏭전개·🎯 + 스타일 + 라이브

**Files:**
- Modify: `src/components/DiveDesk.tsx`, `src/components/diveDesk.test.ts`, `src/styles.css`

- [ ] **Step 1: send 에서 arc 주입 + 응답 arc 저장**

`send()`의 `requestDiveChat({...})` 인자에 `arc: JSON.stringify(session.arc ?? {}),` 추가(scene 다음). 그리고 캐릭터 응답을 받은 뒤(`next = appendMessage(next, 'character', res.reply || '…');` 다음 줄) arc를 세션에 반영:
```tsx
      if (res.arc) next = { ...next, arc: res.arc };
      onChange(next, project);
      setChoices(res.choices ?? []);
```
(기존 `onChange(next, project); setChoices(...)` 두 줄을 위 세 줄로 교체.)

- [ ] **Step 2: condense 에 arc 주입**

`condense()`의 `requestDiveCondense({...})` 인자에 `arc: JSON.stringify(session.arc ?? {}),` 추가(scene 다음).

- [ ] **Step 3: ⏭전개 버튼 + 🎯 표시**

컴포저의 ⏳계속 버튼 바로 뒤에 추가:
```tsx
        <button
          className="dx-escalate"
          onClick={() => send('(이야기를 다음 국면으로 크게 밀어붙인다.)')}
          disabled={busy || pending !== null}
        >⏭ 전개</button>
```

장면 패널 `<div className="dx-scene">…</div>` 바로 아래(닫는 `</div>` 다음)에 🎯 표시:
```tsx
      {session.arc?.dramaticQuestion && (
        <div className="dx-arc">🎯 {session.arc.dramaticQuestion}</div>
      )}
```

- [ ] **Step 4: ⏭전개 렌더 핀 테스트** — `src/components/diveDesk.test.ts` 의 `⏳ 계속` 테스트 아래에 추가

```typescript
  it('⏭ 전개 버튼이 렌더된다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('전개');
  });
```

- [ ] **Step 5: 스타일** — `src/styles.css` 의 `.dx-*` 블록 끝에 추가

```css
.dx-arc { color: #e7b94e; font-size: 13px; padding: 2px 4px; }
.dx-escalate { background: #3a2a10; color: #e7b94e; border: 1px solid #7a5a20; border-radius: 8px; padding: 10px 14px; font-size: 14px; cursor: pointer; }
.dx-escalate:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] **Step 6: 게이트** — Run: `bash init.sh` · Expected: tsc·vitest·build 전체 통과

- [ ] **Step 7: 라이브 한 바퀴 (컨트롤러 — preview)**

`?stage=dive`. 확인 — ① dive-chat 응답에 arc(dramaticQuestion·nextBeat) 산출 → 🎯 한 줄 표시 ② 대화가 매 턴 nextBeat 방향으로 진전 ③ ⏭전개 → 긴장 고조·강한 전개 ④ 응결이 arc 반영 페이오프. 콘솔 0. 스크린샷.
> codex 느리면 dive-chat 직접 fetch로 arc 산출 확인 + UI는 controller 검증.

- [ ] **Step 8: 커밋**

```bash
git add src/components/DiveDesk.tsx src/components/diveDesk.test.ts src/styles.css
git commit -m "feat(dive-x): DiveDesk arc 주입·저장·⏭전개·🎯 표시 + 라이브 (TDD)"
```

---

## Self-Review (스펙 대비)

- §2.1 StoryArc + DiveSession.arc → Task 1 ✅ · 영속은 DiveState가 session 통째 직렬화로 자동(scene과 동일, 별도 코드 불필요)
- §2.2 매 턴 진전(dive-chat arc 입출력) → Task 2·3·4·5 Step 1 ✅
- §2.3 ⏭전개 → Task 5 Step 3 ✅
- §2.4 🎯 표시 → Task 5 Step 3 ✅
- §2.5 응결 arc 연동 → Task 2 Step 3 · Task 5 Step 2 ✅
- 타입 일관성 — `StoryArc{dramaticQuestion,tension,nextBeat}`(Task 1) ↔ `DiveChatResponse.arc`(Task 4) ↔ storyx arc 출력(Task 2) ↔ DiveDesk `res.arc`/`session.arc`(Task 5) 모두 동일 3필드. `arc?: string`(요청, Task 4) ↔ DiveDesk `JSON.stringify(session.arc ?? {})`(Task 5) 일치.
- 비목표(멀티캐릭터·storyHarness·되돌리기·arc 수동편집) 미포함 ✅
- 주의 — Task 4의 요청 `arc?`는 옵셔널이라 DiveDesk가 안 넘겨도 tsc 안 깨짐. Task 5 Step 1·2에서 반드시 넘긴다(명시).
