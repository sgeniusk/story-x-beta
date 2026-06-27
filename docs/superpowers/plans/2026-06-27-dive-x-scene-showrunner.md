# Dive X 장면 연출 + 쇼러너 채널 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 작동 중인 Dive X 1:1 챗을 "사용자가 주인공으로 현재 장면을 연출하고, AI 쇼러너가 세계를 서술하며 그 자리의 인물을 연기하고, 별도 쇼러너 채널로 이야기를 위에서 고쳐 쓰는" 인터랙티브 스토리로 확장한다.

**Architecture:** 공유 상태 = `DiveSession.scene`(현재 장면). 장면 채널(기존 채팅)은 쇼러너 프롬프트로 장면+캐논을 받아 서술/대사 혼합 응답을 내고, 새 순수 파서 `parseSceneSegments`가 이를 내레이션 블록과 화자 말풍선으로 분해 렌더한다. 신규 쇼러너 채널은 연출자 지시에 응답하고 현재 장면을 승인형으로 교체한다. 멀티 캐릭터·캐논은 기존 응결 엔진을 그대로 재사용한다.

**Tech Stack:** TypeScript · React · Vite(dev 미들웨어 브리지) · vitest · Node `tools/storyx.mjs`(codex provider) · localStorage

**스펙:** `docs/superpowers/specs/2026-06-27-dive-x-scene-showrunner-design.md` · **브랜치:** `feat/dive-x-scene-showrunner`

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `src/lib/diveSession.ts` | 수정 | `DiveSession.scene?` 추가 · `parseSceneSegments` 순수 파서 신설 |
| `src/lib/diveSession.test.ts` | 수정 | scene 필드·파서 TDD |
| `src/lib/storage.test.ts` | 수정 | DiveState scene 라운드트립 회귀 핀 |
| `src/lib/diveClient.ts` | 수정 | `requestDiveShowrunner` + 타입 |
| `src/lib/diveClient.test.ts` | 수정 | showrunner 클라이언트 TDD |
| `tools/storyx.mjs` | 수정 | dive-chat 쇼러너+장면 개편 · dive-condense 장면 주입 · `dive-showrunner` 신규 |
| `vite.config.ts` | 수정 | `/api/dive-showrunner` 라우트 + dive-chat/condense `--scene` |
| `src/components/DiveDesk.tsx` | 수정 | 현재 장면 패널 · 세그먼트 렌더 · 쇼러너 시트 |
| `src/components/diveDesk.test.ts` | 수정 | 세그먼트 렌더 핀 |
| `src/styles.css` | 수정 | `.dx-scene`·`.dx-narration`·`.dx-speaker`·`.dx-showrunner*` |

> 영속은 추가 코드 불필요 — `DiveState.session`이 통째로 직렬화되므로 `scene`이 따라간다(Task 2는 회귀 테스트만). App.tsx도 무변경 — `DiveStage.onChange(session, project)`가 이미 세션 전체를 영속한다.

검증 명령: 단일 `npx vitest run <file>`, 전체 `npm test`, 빌드 `npm run build`, 타입 `npx tsc --noEmit`.

---

## Task 1: DiveSession scene 필드 + parseSceneSegments 파서

**Files:**
- Modify: `src/lib/diveSession.ts`
- Test: `src/lib/diveSession.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/diveSession.test.ts` 의 describe 안

```typescript
import { parseSceneSegments } from './diveSession';

  it('createDiveSession은 scene을 비워 둔다(하위호환)', () => {
    expect(createDiveSession('c', 'p').scene).toBeUndefined();
  });

  it('parseSceneSegments는 평문 줄을 내레이션으로', () => {
    const segs = parseSceneSegments('도윤네 집은 불이 꺼져 있다.');
    expect(segs).toEqual([{ kind: 'narration', text: '도윤네 집은 불이 꺼져 있다.' }]);
  });

  it('parseSceneSegments는 "이름: 대사" 줄을 화자 대사로', () => {
    const segs = parseSceneSegments('도윤 母: 누구세요?');
    expect(segs).toEqual([{ kind: 'dialogue', speaker: '도윤 母', text: '누구세요?' }]);
  });

  it('parseSceneSegments는 서술+대사 혼합을 줄 단위로 분해하고 빈 줄을 버린다', () => {
    const segs = parseSceneSegments('현관이 열려 있다.\n\n도윤 母: 누구세요? *문틈으로 본다*');
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual({ kind: 'narration', text: '현관이 열려 있다.' });
    expect(segs[1]).toEqual({ kind: 'dialogue', speaker: '도윤 母', text: '누구세요? *문틈으로 본다*' });
  });

  it('parseSceneSegments는 콜론 앞이 길거나(>20) 별표면 화자로 오인하지 않는다', () => {
    const long = '그러니까 내가 하고 싶은 말은 사실 이거였는데: 외계인이야';
    expect(parseSceneSegments(long)[0].kind).toBe('narration');
    expect(parseSceneSegments('*그가 웃는다: 짧게*')[0].kind).toBe('narration');
  });
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/diveSession.test.ts` · Expected: FAIL (parseSceneSegments 없음 · scene 속성 타입 에러)

- [ ] **Step 3: 구현** — `src/lib/diveSession.ts`

`DiveSession` 인터페이스에 `scene?: string;` 한 줄 추가(`pendingCondenseSuggested` 아래). 그리고 파일 끝에 추가:

```typescript
// 한 줄: "이름: 대사" → 화자 대사, 그 외 → 내레이션. 이름은 1~20자·별표 없음.
export interface SceneSegment {
  kind: 'narration' | 'dialogue';
  speaker?: string;
  text: string;
}

const SPEAKER_LINE = /^([^:：\n]{1,20})[:：]\s*(.+)$/;

export function parseSceneSegments(text: string): SceneSegment[] {
  const out: SceneSegment[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(SPEAKER_LINE);
    if (m && m[1].trim() && !m[1].includes('*')) {
      out.push({ kind: 'dialogue', speaker: m[1].trim(), text: m[2].trim() });
    } else {
      out.push({ kind: 'narration', text: line });
    }
  }
  return out;
}
```

> `[^:：\n]{1,20}` 가 콜론 앞 20자 이내만 화자로 받으므로 긴 문장 속 콜론은 내레이션으로 떨어진다. `createDiveSession`은 scene을 안 넣으므로 undefined(하위호환) — 변경 불필요.

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/lib/diveSession.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSession.ts src/lib/diveSession.test.ts
git commit -m "feat(dive-x): DiveSession.scene + parseSceneSegments(서술/화자 파서) (TDD)"
```

---

## Task 2: DiveState scene 영속 회귀 핀

**Files:**
- Test: `src/lib/storage.test.ts`

영속은 `parseDiveState`가 session을 통째로 보존하므로 자동 동작한다. 회귀로만 고정한다.

- [ ] **Step 1: 테스트 추가** — `src/lib/storage.test.ts` 의 DiveState describe 안

```typescript
  it('DiveState는 session.scene을 라운드트립으로 보존한다', () => {
    const session = { ...createDiveSession('seed-childhood', 'p'), scene: '도윤네 집 앞. 도윤은 학원.' };
    const state: DiveState = {
      schema: 'storyx/dive/v1',
      session,
      project: createEmptyProject({ title: 't' })
    };
    const parsed = parseDiveState(serializeDiveState(state));
    expect(parsed?.session.scene).toBe('도윤네 집 앞. 도윤은 학원.');
  });
```

(import는 기존 storage.test의 `createDiveSession`·`createEmptyProject`·`DiveState`·`parseDiveState`·`serializeDiveState` 재사용 — 이미 있으면 추가 안 함.)

- [ ] **Step 2: 통과 확인** — Run: `npx vitest run src/lib/storage.test.ts -t scene` · Expected: PASS (코드 변경 없이 통과 — 회귀 핀)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/storage.test.ts
git commit -m "test(dive-x): DiveState scene 라운드트립 회귀 핀"
```

---

## Task 3: storyx.mjs — dive-chat 쇼러너화 · dive-condense 장면 · dive-showrunner 신규

**Files:**
- Modify: `tools/storyx.mjs`

먼저 두 기존 명령에 `--scene` 을 읽어 프롬프트에 주입하고, 새 `dive-showrunner` 명령을 추가한다. 기존 헬퍼(`readFlag`·`printJson`·`parseProviderJson`·`runProviderWithRetry`·`looksLikeProviderError`·`readString`) 재사용.

- [ ] **Step 1: dive-chat 쇼러너화 + scene 주입**

`if (command === 'dive-chat')` 블록에서 (a) `const scene = readFlag(args, '--scene', '');` 를 다른 readFlag 옆에 추가하고, (b) prompt 배열의 역할/형식 줄과 장면 절을 아래로 교체한다. 기존 첫 두 줄("당신은 Dive X의 캐릭터 연기 엔진…", "사용자(\"나\")에게 직접 말하는…")을 다음으로 교체:

```javascript
    '당신은 이 이야기의 쇼러너입니다. 사용자("나")는 주인공이고, 당신은 현재 장면 안에서 세계를 서술하고 그 자리에 있는 인물을 연기합니다.',
    '서술(세계·상황·분위기)은 평문 줄로, 인물의 말은 "이름: 대사" 줄로, 행동·표정은 *별표*로 쓰세요. 한 응답에 여러 줄을 섞어도 됩니다.',
    '사용자가 한 행동·말에 세계와 인물이 반응하게 하세요. 현재 장면에 없는 인물은 등장시키지 말고, 사용자("나")의 말과 행동을 대신 지어내지 마세요. 3인칭 전지적 요약·메타 설명은 금지합니다.',
```

그리고 `## 캐릭터` 절 앞(또는 `## 기억` 앞)에 장면 절을 삽입:

```javascript
    '',
    '## 현재 장면',
    scene || '(장면 미설정 — 시작점 캐릭터와의 일상 대화로 진행)',
```

출력 형식 줄을 다음으로 교체:

```javascript
    '{ "reply": "서술 줄 + 인물 \\"이름: 대사\\" 줄 (행동은 *별표*). 2~5줄." }'
```

- [ ] **Step 2: dive-condense 에 scene 주입**

`if (command === 'dive-condense')` 블록에 `const scene = readFlag(args, '--scene', '');` 추가하고, prompt 배열의 `## 캐릭터` 앞에 삽입:

```javascript
    '',
    '## 현재 장면',
    scene || '(장면 미설정)',
```

- [ ] **Step 3: dive-showrunner 신규 명령** — `dive-condense` 블록 뒤에 추가

```javascript
if (command === 'dive-showrunner') {
  const provider = readFlag(args, '--provider', 'mock');
  const scene = readFlag(args, '--scene', '');
  const context = readFlag(args, '--context', '');
  const directive = readFlag(args, '--directive', '');
  const prompt = [
    '당신은 이 이야기의 쇼러너(연출자·신)입니다. 사용자는 이야기 위에서 당신에게 직접 지시합니다.',
    '지시에 연출자 목소리로 짧게 응답하고, 지시를 반영해 "현재 장면"을 새로 제안하세요(장면을 바꿀 필요가 없으면 sceneUpdate는 빈 문자열).',
    'sceneUpdate는 장소·상황·등장인물·사용자의 목적을 담은 새 현재 장면 전체입니다(누적이 아니라 교체본).',
    '',
    '## 현재 장면',
    scene || '(아직 없음)',
    '',
    '## 이야기 기억(캐논 — 모순 금지)',
    context || '(아직 없음)',
    '',
    `## 연출자의 지시\n${directive}`,
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "reply": "연출자에게 하는 짧은 응답", "sceneUpdate": "바뀐 현재 장면 전체 또는 빈 문자열" }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({ provider, mode: 'dive-showrunner', status: 'complete', reply: '뜻대로.', sceneUpdate: scene ? `${scene} (비가 내리기 시작한다)` : '' });
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
    provider,
    mode: 'dive-showrunner',
    status: isError ? 'failed' : 'complete',
    reply: readString(parsed?.reply) || '…',
    sceneUpdate: readString(parsed?.sceneUpdate),
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

- [ ] **Step 4: dry-run 스모크 (mock)**

```
node tools/storyx.mjs dive-chat --provider mock --scene "도윤네 집 앞" --query "문을 두드린다"
node tools/storyx.mjs dive-showrunner --provider mock --scene "도윤네 집 앞" --directive "비를 내려줘"
```
Expected: 각각 `mode:'dive-chat'` / `mode:'dive-showrunner'`(+`sceneUpdate`에 "비가 내리기 시작한다" 포함) JSON 한 줄.

- [ ] **Step 5: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat(dive-x): storyx 쇼러너화 — dive-chat 장면/서술·dive-condense 장면·dive-showrunner 신규"
```

---

## Task 4: vite 라우트 — /api/dive-showrunner + dive-chat/condense --scene

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: 기존 dive-chat·dive-condense 라우트에 --scene 추가, dive-showrunner 라우트 신규**

`/api/dive-chat` 의 buildArgs 배열에 `'--scene', String(input.scene ?? ''),` 를 (예: `--character` 다음에) 추가. `/api/dive-condense` buildArgs 에도 동일하게 `'--scene', String(input.scene ?? ''),` 추가. 그리고 두 라우트 옆에 신규 등록:

```typescript
    storyxBridge('/api/dive-showrunner', (input) => [
      'tools/storyx.mjs',
      'dive-showrunner',
      '--provider', 'codex',
      '--scene', String(input.scene ?? ''),
      '--context', String(input.context ?? ''),
      '--directive', String(input.directive ?? '')
    ]),
```

- [ ] **Step 2: 타입 체크** — Run: `npx tsc --noEmit` · Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add vite.config.ts
git commit -m "feat(dive-x): /api/dive-showrunner 라우트 + dive-chat/condense --scene"
```

---

## Task 5: diveClient — requestDiveShowrunner + scene 인자

**Files:**
- Modify: `src/lib/diveClient.ts`
- Test: `src/lib/diveClient.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/diveClient.test.ts`

```typescript
import { requestDiveShowrunner } from './diveClient';

  it('requestDiveShowrunner는 /api/dive-showrunner에 POST하고 reply·sceneUpdate를 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '뜻대로.', sceneUpdate: '비 오는 도윤네 집 앞' })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveShowrunner({ scene: '도윤네 집 앞', context: '', directive: '비를 내려줘' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-showrunner', expect.objectContaining({ method: 'POST' }));
    expect(res.sceneUpdate).toBe('비 오는 도윤네 집 앞');
  });
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/diveClient.test.ts` · Expected: FAIL (requestDiveShowrunner 없음)

- [ ] **Step 3: 구현 추가** — `src/lib/diveClient.ts`

`DiveChatRequest`에 `scene` 추가: `export interface DiveChatRequest { character: string; scene: string; context: string; dialogue: string; query: string; }`. `DiveCondenseRequest`에 `scene` 추가: `export interface DiveCondenseRequest { character: string; scene: string; context: string; transcript: string; episode: number; }`. 그리고 끝에 추가:

```typescript
export interface DiveShowrunnerRequest { scene: string; context: string; directive: string; }
export interface DiveShowrunnerResponse { status: string; reply: string; sceneUpdate: string; warning?: string; }

export function requestDiveShowrunner(req: DiveShowrunnerRequest): Promise<DiveShowrunnerResponse> {
  return postJson<DiveShowrunnerResponse>('/api/dive-showrunner', req);
}
```

> `scene`을 두 기존 요청 타입에 추가하면 DiveDesk 호출부(Task 6)가 scene을 넘기도록 tsc가 강제한다.

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/lib/diveClient.test.ts` · Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive-x): diveClient requestDiveShowrunner + scene 인자 (TDD)"
```

---

## Task 6: DiveDesk — 현재 장면 패널 · 세그먼트 렌더 · 쇼러너 시트

**Files:**
- Modify: `src/components/DiveDesk.tsx`
- Test: `src/components/diveDesk.test.ts`

현재 DiveDesk는 `send`/`condense`/`approve` + textarea 컴포저를 가진다. 아래를 더한다.

- [ ] **Step 1: import·상태 추가** — `src/components/DiveDesk.tsx`

`diveSession` import 목록에 `parseSceneSegments` 추가. `diveClient` import에 `requestDiveShowrunner` 추가. 컴포넌트 상태에 추가:

```tsx
  const [srOpen, setSrOpen] = useState(false);
  const [srInput, setSrInput] = useState('');
  const [srReply, setSrReply] = useState<string | null>(null);
  const [srSceneUpdate, setSrSceneUpdate] = useState('');
  const scene = session.scene ?? '';
```

- [ ] **Step 2: send/condense 가 scene을 넘기도록**

`send()`의 `requestDiveChat({...})` 호출에 `scene,` 추가(character 다음). `condense()`의 `requestDiveCondense({...})` 호출에도 `scene,` 추가. (tsc가 Task 5의 타입 변경으로 강제한다.)

- [ ] **Step 3: 장면 변경·쇼러너 핸들러 추가** — 컴포넌트 함수 안(approve 아래)에 추가

```tsx
  function setScene(next: string) {
    onChange({ ...session, scene: next }, project);
  }

  async function askShowrunner() {
    if (!srInput.trim() || busy) return;
    const directive = srInput.trim();
    setSrInput('');
    setBusy(true);
    try {
      const res = await requestDiveShowrunner({
        scene,
        context: buildProjectContextDigest(project),
        directive
      });
      setSrReply(res.reply || '…');
      setSrSceneUpdate(res.sceneUpdate || '');
    } catch {
      setSrReply('쇼러너 호출에 실패했어요. 다시 시도하세요.');
      setSrSceneUpdate('');
    } finally {
      setBusy(false);
    }
  }

  function applySceneUpdate() {
    setScene(srSceneUpdate);
    setSrSceneUpdate('');
    setSrReply(null);
  }
```

- [ ] **Step 4: 장면 패널 렌더** — `<header className="dx-head">…</header>` 바로 아래에 삽입

```tsx
      <div className="dx-scene">
        <label className="dx-scene-label">🎬 현재 장면</label>
        <textarea
          className="dx-scene-input"
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          placeholder="장소·상황·내 목적을 적어 장면을 깔아보세요 (비우면 일상 대화)"
          rows={2}
        />
        <button className="dx-sr-toggle" onClick={() => setSrOpen((v) => !v)}>🪄 쇼러너</button>
      </div>

      {srOpen && (
        <div className="dx-showrunner-sheet">
          {srReply && <div className="dx-showrunner">{srReply}</div>}
          {srSceneUpdate && (
            <div className="dx-sr-update">
              <p className="dx-sr-update-text">현재 장면을 이렇게 바꿀까요? — {srSceneUpdate}</p>
              <button onClick={applySceneUpdate}>장면 교체</button>
              <button onClick={() => setSrSceneUpdate('')}>취소</button>
            </div>
          )}
          <div className="dx-sr-compose">
            <input
              className="dx-input"
              value={srInput}
              onChange={(e) => setSrInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); askShowrunner(); } }}
              placeholder="쇼러너에게 지시 (예: 비를 내려줘 · 도윤 엄마를 의심하게)"
              disabled={busy}
            />
            <button className="dx-send" onClick={askShowrunner} disabled={busy}>지시</button>
            <span className="dx-sr-cost">· 포인트(추후)</span>
          </div>
        </div>
      )}
```

- [ ] **Step 5: 캐릭터 버블을 세그먼트 렌더로 교체**

기존 채팅 맵을 다음으로 교체:

```tsx
      <div className="dx-chat">
        {session.chatBuffer.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="dx-bubble dx-user">{renderDialogue(m.text)}</div>
          ) : (
            <div key={m.id} className="dx-turn">
              {parseSceneSegments(m.text).map((seg, i) =>
                seg.kind === 'narration' ? (
                  <div key={i} className="dx-narration">{renderDialogue(seg.text)}</div>
                ) : (
                  <div key={i} className="dx-bubble dx-character">
                    <span className="dx-speaker">{seg.speaker}</span>
                    {renderDialogue(seg.text)}
                  </div>
                )
              )}
            </div>
          )
        )}
      </div>
```

- [ ] **Step 6: 세그먼트 렌더 핀 테스트 추가** — `src/components/diveDesk.test.ts`

```typescript
  it('캐릭터 응답의 서술/화자 줄을 내레이션 블록과 화자 말풍선으로 분리 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = {
      ...session,
      chatBuffer: [{ id: 'm1', role: 'character', text: '현관이 열려 있다.\n도윤 母: 누구세요?', turn: 1 }]
    };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('class="dx-narration"');
    expect(html).toContain('현관이 열려 있다.');
    expect(html).toContain('class="dx-speaker"');
    expect(html).toContain('도윤 母');
    expect(html).toContain('누구세요?');
  });
```

- [ ] **Step 7: 게이트** — Run: `npx tsc --noEmit && npx vitest run src/components/diveDesk.test.ts` · Expected: tsc 0 · 테스트 통과(기존 2 + 신규 1)

- [ ] **Step 8: 커밋**

```bash
git add src/components/DiveDesk.tsx src/components/diveDesk.test.ts
git commit -m "feat(dive-x): DiveDesk 현재 장면 패널·서술/화자 세그먼트 렌더·쇼러너 시트 (TDD)"
```

---

## Task 7: 스타일 + 전체 게이트 + 라이브 검증

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: `.dx-*` 추가 스타일** — `src/styles.css` 의 `.dx-*` 블록 끝에 추가

```css
.dx-scene { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; border: 1px solid #34363d; border-radius: 10px; padding: 10px 12px; background: rgba(124,92,255,0.06); }
.dx-scene-label { font-size: 12px; color: #c4b6ff; align-self: center; }
.dx-scene-input { flex: 1; min-width: 220px; resize: none; field-sizing: content; min-height: 40px; max-height: 120px; padding: 8px 10px; border-radius: 8px; border: 1px solid #3a3c43; background: #16171a; color: #f2f3f7; font-family: inherit; font-size: 13px; line-height: 1.5; }
.dx-sr-toggle { background: #2a2350; color: #c4b6ff; border: 1px solid #7c5cff55; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.dx-showrunner-sheet { border: 1px solid #7c5cff55; border-radius: 10px; padding: 12px; background: rgba(124,92,255,0.08); display: flex; flex-direction: column; gap: 8px; }
.dx-showrunner { color: #d9cff7; font-style: italic; line-height: 1.6; }
.dx-sr-update { font-size: 13px; color: #d7dae1; }
.dx-sr-update-text { margin: 0 0 6px; }
.dx-sr-update button, .dx-sr-compose button { margin-right: 6px; }
.dx-sr-compose { display: flex; gap: 8px; align-items: center; }
.dx-sr-cost { color: #6f7480; font-size: 11px; }
.dx-turn { display: flex; flex-direction: column; gap: 6px; }
.dx-narration { align-self: center; max-width: 90%; color: #aeb3bd; font-style: italic; line-height: 1.6; text-align: center; padding: 2px 8px; }
.dx-speaker { display: block; font-size: 11px; color: #9aa0aa; margin-bottom: 3px; }
```

- [ ] **Step 2: 전체 게이트** — Run: `bash init.sh` · Expected: tsc · vitest · build 전체 통과

- [ ] **Step 3: 라이브 한 바퀴 (컨트롤러가 수행 — preview)**

`npm run dev` → `?stage=dive`. 확인 —
  1. 🎬 현재 장면 패널에 "도윤네 집 앞. 도윤은 학원. 가족이 외계인인지 확인하러 옴." 입력.
  2. 장면 안에서 "문을 두드린다" 전송 → 응답이 **내레이션 블록 + 화자 말풍선**(도윤母 등)으로 분리 렌더.
  3. 🪄 쇼러너 → "비를 내려줘" 지시 → 연출자 응답 + "장면을 이렇게 바꿀까요?" → 장면 교체 승인 → 현재 장면 패널 갱신.
  4. 응결 → 회차가 장면 맥락 반영, 새 인물 캐논 승격.
  5. 새로고침 → 장면·대화 영속.
콘솔 0. 스크린샷.

> codex 호출이 무거우면 채팅/쇼러너는 네트워크 직접 호출(fetch)로 왕복 확인하고, UI 분리 렌더는 react-dom 핀(Task 6)으로 갈음. 자동화 클릭이 React onClick 미발화이므로 컨트롤러가 직접 검증.

- [ ] **Step 4: 커밋**

```bash
git add src/styles.css
git commit -m "feat(dive-x): 장면 패널·내레이션·화자·쇼러너 시트 다크 스타일 + 라이브 한 바퀴"
```

---

## Self-Review 결과 (스펙 대비)

- 스펙 §3.1 diveSession scene+파서 → Task 1 ✅ · 영속 → Task 2 ✅ · diveClient → Task 5 ✅ · storyx 3건 → Task 3 ✅ · vite → Task 4 ✅ · DiveDesk 3요소 → Task 6 ✅ · styles → Task 7 ✅
- 스펙 §3.2 데이터 흐름(장면 채널·쇼러너 채널·응결) → Task 6 핸들러 + Task 3 프롬프트 ✅
- 스펙 §4 출력 예시(서술+화자) → Task 1 파서 + Task 6 렌더 + Task 3 형식 지시 ✅
- 스펙 승인형(sceneUpdate) → Task 6 `applySceneUpdate`(자동 교체 안 함, 버튼 승인) ✅
- 스펙 멀티캐릭터 캐논화 → 기존 응결 엔진 재사용(신규 코드 없음, Task 7 라이브 4번 확인) ✅
- App.tsx 무변경 — scene은 session에 실려 DiveStage가 영속(스펙 File Structure 주석과 일치) ✅
- 타입 일관성 — `scene`은 `DiveChatRequest`/`DiveCondenseRequest`(Task 5)에 추가되어 DiveDesk 호출(Task 6 Step 2)이 tsc로 강제됨. `parseSceneSegments`/`SceneSegment`(Task 1) ↔ DiveDesk(Task 6 Step 5) 시그니처 일치.
- 비목표(인물/캐논 직접 변경·실결제) 미포함 확인 — 쇼러너는 sceneUpdate(장면 교체)만, 포인트는 비활성 라벨(Task 6 Step 4 `dx-sr-cost`).
