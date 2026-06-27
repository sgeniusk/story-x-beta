# Dive X 진행 선택지 + 계속 + 자유 응결 (묶음 A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자연어 입력을 기본으로 유지하되, 쇼러너가 제안하는 행동 선택지 칩과 ⏳계속 버튼으로 타이핑 부담을 덜고, 응결이 자유로운 비현실 입력을 캐논 안에서 매끄럽게 봉합하게 한다.

**Architecture:** `dive-chat` 응답을 `{reply, choices}`로 확장(추가 LLM 호출 없음). DiveDesk의 `send()`를 텍스트 인자를 받게 일반화해 칩 탭·⏳계속이 같은 한 턴을 재사용한다. `dive-condense` 프롬프트에 자유 봉합 한 줄을 더한다. 전부 기존 dive 파이프라인 위의 작은 증분.

**Tech Stack:** TypeScript · React · vitest · Node `tools/storyx.mjs`(codex) · Vite 브리지

**스펙:** `docs/superpowers/specs/2026-06-27-dive-x-choices-freeplay-design.md` · **브랜치:** `feat/dive-x-choices`

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `tools/storyx.mjs` | 수정 | dive-chat choices 출력+프롬프트 · dive-condense 자유봉합 한 줄 |
| `src/lib/diveClient.ts` | 수정 | `DiveChatResponse.choices?` |
| `src/lib/diveClient.test.ts` | 수정 | choices 통과 TDD |
| `src/components/DiveDesk.tsx` | 수정 | `send(textArg?)` 일반화 · `choices` 상태 · 칩 바 · ⏳계속 |
| `src/components/diveDesk.test.ts` | 수정 | ⏳계속 버튼 렌더 핀 |
| `src/styles.css` | 수정 | `.dx-choices`·`.dx-choice-chip`·`.dx-continue` |

검증: 단일 `npx vitest run <file>`, 전체 `npm test`, `npm run build`, `npx tsc --noEmit`.

---

## Task 1: storyx.mjs — dive-chat choices + dive-condense 자유봉합

**Files:**
- Modify: `tools/storyx.mjs`

먼저 `if (command === 'dive-chat')` 와 `if (command === 'dive-condense')` 블록을 읽어 현재 프롬프트·출력 줄을 확인한다.

- [ ] **Step 1: dive-chat — 프롬프트 choices 지시 + 출력 형식**

dive-chat prompt 배열에서 출력 형식 줄(현재 `'{ "reply": "서술 줄 + 인물 \\"이름: 대사\\" 줄 (행동은 *별표*). 2~5줄." }'`)을 다음으로 교체:
```javascript
    '응답 끝에, 주인공("나")이 이 장면에서 자연스럽게 취할 만한 행동·말 2~3개를 choices 배열로 제안하세요(짧은 동사구). 사용자는 이를 탭하거나 무시하고 자유롭게 입력할 수 있습니다.',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "reply": "서술 줄 + 인물 \\"이름: 대사\\" 줄 (행동은 *별표*). 2~5줄.", "choices": ["행동 2~3개"] }'
```
> 주의 — 기존 배열에 이미 `'## 출력 형식 …'` 줄과 reply-only JSON 줄이 있다. 그 두 줄을 위 세 줄로 교체(중복 `## 출력 형식` 금지). 실제 현재 텍스트를 보고 정확히 두 줄만 바꾼다.

- [ ] **Step 2: dive-chat — mock + 실 provider 출력에 choices**

mock 분기의 `printJson({...})`에 `choices: ['문 안으로 들어간다', '도윤에게 무슨 일인지 묻는다']` 추가. 실 provider 분기의 최종 `printJson({...})`에 `choices: normalizeStringList(parsed?.choices)` 추가(다른 필드 옆).

- [ ] **Step 3: dive-condense — 자유봉합 한 줄**

dive-condense prompt 배열 첫 두 줄(요청·재구성 지시) 바로 뒤에 추가:
```javascript
    '사용자가 자유롭게 들이민 비현실·즉흥 설정도 버리지 말고, 기존 캐논·현재 장면과 모순되지 않는 선에서 그럴듯한 인과로 봉합해 매끄러운 소설로 재구성하세요. 단 이미 확정된 하드 캐논을 임의로 뒤집지는 마세요.',
```

- [ ] **Step 4: dry-run 스모크**

```
node tools/storyx.mjs dive-chat --provider mock --scene "도윤네 집 앞" --query "초인종을 누른다"
```
Expected: `reply`·`choices`(배열) 포함 JSON 한 줄.

- [ ] **Step 5: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat(dive-x): dive-chat 행동 선택지(choices) + dive-condense 자유 봉합"
```

---

## Task 2: diveClient — DiveChatResponse.choices

**Files:**
- Modify: `src/lib/diveClient.ts`
- Test: `src/lib/diveClient.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/diveClient.test.ts` 의 기존 `requestDiveChat` 테스트 아래에 추가

```typescript
  it('requestDiveChat는 choices를 통과시킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '...', choices: ['문 연다', '기다린다'] })
    }));
    const res = await requestDiveChat({ character: 'c', scene: '', context: '', dialogue: '', query: '응' });
    expect(res.choices).toEqual(['문 연다', '기다린다']);
  });
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/diveClient.test.ts` · Expected: FAIL(타입에 choices 없음)

- [ ] **Step 3: 구현** — `src/lib/diveClient.ts` 의 `DiveChatResponse`에 필드 추가

```typescript
export interface DiveChatResponse { status: string; reply: string; choices?: string[]; warning?: string; }
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/lib/diveClient.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive-x): diveClient DiveChatResponse.choices (TDD)"
```

---

## Task 3: DiveDesk — send(textArg) 일반화 · 칩 바 · ⏳계속

**Files:**
- Modify: `src/components/DiveDesk.tsx`
- Test: `src/components/diveDesk.test.ts`

현재 `send()`는 인자가 없고 `input`만 읽으며, 보내기 버튼은 `onClick={send}`다. 칩/계속이 텍스트를 직접 넘기도록 일반화한다.

- [ ] **Step 1: choices 상태 추가**

다른 useState 옆에 추가:
```tsx
  const [choices, setChoices] = useState<string[]>([]);
```

- [ ] **Step 2: send를 textArg 받게 일반화**

기존 `async function send() { ... }` 전체를 다음으로 교체:
```tsx
  async function send(textArg?: string) {
    const userText = (textArg ?? input).trim();
    if (!userText || busy || pending !== null) return;
    if (textArg === undefined) setInput('');
    setBusy(true);
    setChoices([]);
    let next = appendMessage(session, 'user', userText);
    onChange(next, project);
    try {
      const res = await requestDiveChat({
        character: card,
        scene,
        context: buildProjectContextDigest(project),
        dialogue: buildRecentDialogue(next),
        query: userText
      });
      next = appendMessage(next, 'character', res.reply || '…');
      onChange(next, project);
      setChoices(res.choices ?? []);
    } catch {
      next = appendMessage(next, 'character', '…(지금은 대답하기 어려워.)');
      onChange(next, project);
    } finally {
      setBusy(false);
    }
  }
```

- [ ] **Step 3: condense/askShowrunner 시작 시 칩 비우기**

`condense()`의 `setBusy(true);` 바로 아래에 `setChoices([]);` 추가. `askShowrunner()`의 `setBusy(true);` 아래에도 `setChoices([]);` 추가.

- [ ] **Step 4: 보내기 버튼 onClick 수정 + 칩 바 + ⏳계속 렌더**

보내기 버튼을 `onClick={send}` → `onClick={() => send()}` 로 바꾼다(인자로 이벤트가 넘어가지 않게).

`<div className="dx-chat">…</div>` 와 그 아래 `{busy && (…상태…)}` 사이(즉 채팅과 상태바 사이)에 칩 바 삽입:
```tsx
      {choices.length > 0 && !busy && pending === null && (
        <div className="dx-choices">
          {choices.map((c, i) => (
            <button key={i} className="dx-choice-chip" onClick={() => send(c)}>{c}</button>
          ))}
        </div>
      )}
```

컴포저의 `지금 응결` 버튼 바로 뒤에 ⏳계속 버튼 추가:
```tsx
        <button
          className="dx-continue"
          onClick={() => send('(가만히 지켜본다. 시간이 잠시 흐른다.)')}
          disabled={busy || pending !== null}
        >⏳ 계속</button>
```

- [ ] **Step 5: ⏳계속 렌더 핀 테스트 추가** — `src/components/diveDesk.test.ts`

```typescript
  it('⏳ 계속 버튼이 항상 렌더된다', () => {
    const project = createEmptyProject({ title: 't' });
    const session = createDiveSession('seed-childhood', project.id);
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('계속');
  });
```

- [ ] **Step 6: 게이트** — Run: `npx tsc --noEmit && npx vitest run src/components/diveDesk.test.ts` · Expected: tsc 0 · 테스트 통과

- [ ] **Step 7: 커밋**

```bash
git add src/components/DiveDesk.tsx src/components/diveDesk.test.ts
git commit -m "feat(dive-x): 행동 선택지 칩 + ⏳계속 — send(textArg) 일반화 (TDD)"
```

---

## Task 4: 스타일 + 전체 게이트 + 라이브

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 스타일 추가** — `src/styles.css` 의 `.dx-*` 블록 끝에 추가

```css
.dx-choices { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0 8px; }
.dx-choice-chip { background: #16171a; color: #c4b6ff; border: 1px solid #3a3c43; border-radius: 16px; padding: 7px 13px; font-size: 13px; cursor: pointer; }
.dx-choice-chip:hover { border-color: #7c5cff88; }
.dx-continue { background: #1c1d21; color: #c9cdd6; border: 1px solid #3a3c43; border-radius: 8px; padding: 10px 14px; font-size: 14px; cursor: pointer; }
.dx-continue:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] **Step 2: 전체 게이트** — Run: `bash init.sh` · Expected: tsc·vitest·build 전체 통과

- [ ] **Step 3: 라이브 한 바퀴 (컨트롤러 — preview)**

`?stage=dive`. 확인 — ① 대화 응답 아래 행동 선택지 칩 2~3개 노출 ② 칩 탭 → 그 행동으로 한 턴 진행 ③ ⏳계속 → 장면 진전 ④ 자유로운 비현실 입력("근처 총을 들고 쏜다") 후 응결 → 매끄럽게 봉합된 회차. 콘솔 0. 스크린샷.
> codex 느리면 dive-chat 직접 fetch로 choices 산출 확인 + 칩 렌더는 controller가 검증.

- [ ] **Step 4: 커밋**

```bash
git add src/styles.css
git commit -m "feat(dive-x): 선택지 칩·계속 버튼 스타일 + 라이브 한 바퀴"
```

---

## Self-Review (스펙 대비)

- §2.1 ⏳계속 → Task 3 Step 4(버튼) + send 일반화(Step 2) ✅
- §2.2 선택지 칩(인라인, 탭=send, 보낼 때 clear) → Task 1(출력) · Task 2(타입) · Task 3(상태·칩 바·clear) ✅
- §2.3 자유 응결 → Task 1 Step 3 ✅
- §3.1 수정 단위 4파일 + 2 테스트 → Task 1~4 ✅
- 자연어 우선(칩 무시 가능·타이핑 유지) → send 일반화로 타이핑 경로 불변, 칩은 보조 ✅
- 타입 일관성 — `DiveChatResponse.choices?`(Task 2) ↔ DiveDesk `res.choices ?? []`(Task 3) 일치. `send(textArg?: string)` 시그니처 ↔ 보내기 `() => send()`·칩 `() => send(c)`·계속 `() => send('…')` 모두 일치.
- 비목표(되돌리기·캐논 god편집·실결제) 미포함 ✅
- 주의 — Task 3 Step 4의 보내기 버튼 `onClick={send}` → `onClick={() => send()}` 변경 누락 시 클릭 이벤트가 textArg로 들어가 버그. 명시함.
