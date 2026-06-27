# Dive X 가벼운 로컬 프로토타입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캐릭터와 자유 대화 → 일정 분량/분기에서 3인칭 회차로 응결 → 승인형 캐논 고정 → 다음 대화에서 캐릭터가 회수, 한 바퀴를 로컬에서 사용자가 직접 dogfooding하는 최소 프로토타입을 만든다.

**Architecture:** Dive X 연대기는 곧 `SeriesProject`다 — 응결 회차=`Chapter`, 기억=`canonFacts`. 신설은 (a) 실시간 채팅 버퍼를 다루는 순수 모듈 `diveSession.ts`, (b) 그 버퍼를 회차로 응결하는 LLM 라우트 2개, (c) 얇은 표면 `DiveDesk.tsx`뿐이고, 응결·캐논 추출·기억 주입·영속은 기존 엔진(`commitChapter`·`buildProjectContextDigest`·`storage.ts`)을 그대로 재사용한다.

**Tech Stack:** TypeScript · React · Vite(dev 미들웨어 브리지) · vitest · Node `tools/storyx.mjs`(codex provider) · localStorage

**스펙:** `docs/superpowers/specs/2026-06-27-dive-x-light-prototype-design.md` · **브랜치:** `feat/dive-x-prototype`

---

## File Structure

| 파일 | 책임 | 신설/수정 |
|---|---|---|
| `src/lib/diveSession.ts` | Dive 세션 순수 도메인(버퍼·응결 분기·압축·포맷) | 신설 |
| `src/lib/diveSession.test.ts` | 위 모듈 TDD | 신설 |
| `src/lib/diveSeedCharacters.ts` | 시드 캐릭터 3종(`CharacterProfile`) | 신설 |
| `src/lib/storage.ts` | `DiveState`(세션+연대기) 영속 — OnboardingDraft 패턴 미러 | 수정 |
| `src/lib/storage.test.ts` | 영속 라운드트립·무효 null TDD | 수정 |
| `tools/storyx.mjs` | `dive-chat`·`dive-condense` 명령 + 프롬프트 빌더 | 수정 |
| `vite.config.ts` | `/api/dive-chat`·`/api/dive-condense` 브리지 라우트 | 수정 |
| `src/lib/diveClient.ts` | 두 라우트 fetch 래퍼 | 신설 |
| `src/lib/diveClient.test.ts` | fetch 모킹 TDD | 신설 |
| `src/components/DiveDesk.tsx` | 얇은 표면(채팅·응결칩·승인 다이얼로그·연대기) | 신설 |
| `src/components/diveDesk.test.ts` | react-dom 렌더 핀 | 신설 |
| `src/App.tsx` | `'dive'` stage 라우팅 | 수정 |
| `src/styles.css` | `.dx-*` 스코프 스타일(Linear 다크) | 수정 |

검증 명령(전 태스크 공통): 단일 테스트 `npx vitest run <file> -t "<name>"`, 전체 `npm test`, 빌드 `npm run build`.

---

## Task 1: DiveSession 타입 + 세션 생성 + 메시지 누적

**Files:**
- Create: `src/lib/diveSession.ts`
- Test: `src/lib/diveSession.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/diveSession.test.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { createDiveSession, appendMessage } from './diveSession';

describe('diveSession', () => {
  it('createDiveSession은 빈 버퍼로 캐릭터·연대기를 묶는다', () => {
    const s = createDiveSession('char-1', 'proj-1');
    expect(s.characterId).toBe('char-1');
    expect(s.projectId).toBe('proj-1');
    expect(s.chatBuffer).toEqual([]);
    expect(s.lastCondensedTurn).toBe(0);
    expect(s.pendingCondenseSuggested).toBe(false);
  });

  it('appendMessage는 순차 turn과 id를 부여한다', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '안녕');
    s = appendMessage(s, 'character', '...왔어?');
    expect(s.chatBuffer.map((m) => m.turn)).toEqual([1, 2]);
    expect(s.chatBuffer.map((m) => m.role)).toEqual(['user', 'character']);
    expect(s.chatBuffer[0].text).toBe('안녕');
    expect(s.chatBuffer[0].id).toMatch(/^msg-/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: FAIL — "Cannot find module './diveSession'"

- [ ] **Step 3: 최소 구현** — `src/lib/diveSession.ts`

```typescript
// Dive X 실시간 채팅 세션의 순수 도메인 — 버퍼 누적·응결 분기·컨텍스트 압축
export type DiveRole = 'user' | 'character';

export interface DiveMessage {
  id: string;
  role: DiveRole;
  text: string;
  turn: number;
}

export interface DiveSession {
  characterId: string;
  projectId: string;
  chatBuffer: DiveMessage[];
  lastCondensedTurn: number;
  pendingCondenseSuggested: boolean;
}

export function createDiveSession(characterId: string, projectId: string): DiveSession {
  return {
    characterId,
    projectId,
    chatBuffer: [],
    lastCondensedTurn: 0,
    pendingCondenseSuggested: false
  };
}

export function appendMessage(session: DiveSession, role: DiveRole, text: string): DiveSession {
  const lastTurn = session.chatBuffer.length
    ? session.chatBuffer[session.chatBuffer.length - 1].turn
    : session.lastCondensedTurn;
  const turn = lastTurn + 1;
  const message: DiveMessage = { id: `msg-${turn}`, role, text, turn };
  return { ...session, chatBuffer: [...session.chatBuffer, message] };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSession.ts src/lib/diveSession.test.ts
git commit -m "feat(dive-x): DiveSession 타입 + 세션 생성·메시지 누적 (TDD)"
```

---

## Task 2: 응결 분기 판정 + 구간 분리 + 응결 후 압축

**Files:**
- Modify: `src/lib/diveSession.ts`
- Test: `src/lib/diveSession.test.ts`

응결은 버퍼가 일정 길이에 도달하면 *제안*하고(하이브리드 트리거의 자동 측), 응결 시 오래된 구간을 회차로 보내고 최근 N개만 원문으로 남긴다(컨텍스트 압축의 실체).

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/diveSession.test.ts` 의 describe 안에 추가

```typescript
import {
  createDiveSession,
  appendMessage,
  shouldSuggestCondense,
  selectCondenseSpan,
  applyCondenseResult,
  CONDENSE_SUGGEST_TURNS,
  CONDENSE_KEEP_RECENT
} from './diveSession';

  it('shouldSuggestCondense는 버퍼가 임계값 이상일 때만 true', () => {
    let s = createDiveSession('c', 'p');
    expect(shouldSuggestCondense(s)).toBe(false);
    for (let i = 0; i < CONDENSE_SUGGEST_TURNS; i += 1) {
      s = appendMessage(s, i % 2 === 0 ? 'user' : 'character', `t${i}`);
    }
    expect(shouldSuggestCondense(s)).toBe(true);
  });

  it('selectCondenseSpan은 최근 KEEP_RECENT개를 남기고 나머지를 응결 대상으로', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 6; i += 1) s = appendMessage(s, 'user', `t${i}`);
    const { condense, keep } = selectCondenseSpan(s);
    expect(keep).toHaveLength(CONDENSE_KEEP_RECENT);
    expect(condense).toHaveLength(6 - CONDENSE_KEEP_RECENT);
    expect(condense[0].text).toBe('t0');
    expect(keep[keep.length - 1].text).toBe('t5');
  });

  it('applyCondenseResult는 버퍼를 keep 구간으로 줄이고 lastCondensedTurn을 갱신', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 6; i += 1) s = appendMessage(s, 'user', `t${i}`);
    s = { ...s, pendingCondenseSuggested: true };
    const after = applyCondenseResult(s);
    expect(after.chatBuffer).toHaveLength(CONDENSE_KEEP_RECENT);
    expect(after.lastCondensedTurn).toBe(6 - CONDENSE_KEEP_RECENT);
    expect(after.pendingCondenseSuggested).toBe(false);
    // 압축 후에도 turn 연속성 유지
    expect(appendMessage(after, 'user', 'next').chatBuffer.at(-1)?.turn).toBe(7);
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: FAIL — exports not found

- [ ] **Step 3: 구현 추가** — `src/lib/diveSession.ts` 끝에 추가

```typescript
export const CONDENSE_SUGGEST_TURNS = 12;
export const CONDENSE_KEEP_RECENT = 2;

export function shouldSuggestCondense(session: DiveSession): boolean {
  return session.chatBuffer.length >= CONDENSE_SUGGEST_TURNS;
}

export function selectCondenseSpan(session: DiveSession): {
  condense: DiveMessage[];
  keep: DiveMessage[];
} {
  const buffer = session.chatBuffer;
  if (buffer.length <= CONDENSE_KEEP_RECENT) {
    return { condense: [], keep: [...buffer] };
  }
  const splitAt = buffer.length - CONDENSE_KEEP_RECENT;
  return { condense: buffer.slice(0, splitAt), keep: buffer.slice(splitAt) };
}

export function applyCondenseResult(session: DiveSession): DiveSession {
  const { condense, keep } = selectCondenseSpan(session);
  const lastCondensedTurn = condense.length
    ? condense[condense.length - 1].turn
    : session.lastCondensedTurn;
  return {
    ...session,
    chatBuffer: keep,
    lastCondensedTurn,
    pendingCondenseSuggested: false
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSession.ts src/lib/diveSession.test.ts
git commit -m "feat(dive-x): 응결 분기 판정·구간 분리·응결 후 버퍼 압축 (TDD)"
```

---

## Task 3: 트랜스크립트·최근 대화 포매터

**Files:**
- Modify: `src/lib/diveSession.ts`
- Test: `src/lib/diveSession.test.ts`

응결 프롬프트에 넘길 전체 트랜스크립트와, 실시간 채팅 프롬프트에 넣을 최근 대화를 결정론적으로 만든다.

- [ ] **Step 1: 실패하는 테스트 추가**

```typescript
import { buildTranscript, buildRecentDialogue } from './diveSession';

  it('buildTranscript는 화자 라벨이 붙은 줄글로 직렬화', () => {
    let s = createDiveSession('c', 'p');
    s = appendMessage(s, 'user', '안녕');
    s = appendMessage(s, 'character', '왔구나.');
    expect(buildTranscript(s.chatBuffer)).toBe('나: 안녕\n상대: 왔구나.');
  });

  it('buildRecentDialogue는 버퍼의 최근 N턴만 포맷', () => {
    let s = createDiveSession('c', 'p');
    for (let i = 0; i < 8; i += 1) s = appendMessage(s, i % 2 === 0 ? 'user' : 'character', `t${i}`);
    const recent = buildRecentDialogue(s, 4);
    expect(recent.split('\n')).toHaveLength(4);
    expect(recent).toContain('t7');
    expect(recent).not.toContain('t3');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: FAIL — exports not found

- [ ] **Step 3: 구현 추가**

```typescript
function labelFor(role: DiveRole): string {
  return role === 'user' ? '나' : '상대';
}

export function buildTranscript(messages: DiveMessage[]): string {
  return messages.map((m) => `${labelFor(m.role)}: ${m.text}`).join('\n');
}

export function buildRecentDialogue(session: DiveSession, limit = 6): string {
  const recent = session.chatBuffer.slice(-limit);
  return buildTranscript(recent);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveSession.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSession.ts src/lib/diveSession.test.ts
git commit -m "feat(dive-x): 트랜스크립트·최근 대화 포매터 (TDD)"
```

---

## Task 4: 시드 캐릭터 3종

**Files:**
- Create: `src/lib/diveSeedCharacters.ts`
- Test: `src/lib/diveSeedCharacters.test.ts`

`CharacterProfile`(`src/lib/storyEngine.ts:64`) 형태 그대로. 전연령·건전, 톤 분산(일상/로맨스·판타지/모험·힐링/위로).

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/diveSeedCharacters.test.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { DIVE_SEED_CHARACTERS } from './diveSeedCharacters';

describe('diveSeedCharacters', () => {
  it('시드 캐릭터는 3종이고 id가 고유하다', () => {
    expect(DIVE_SEED_CHARACTERS).toHaveLength(3);
    const ids = DIVE_SEED_CHARACTERS.map((c) => c.character.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('각 시드는 이름·배경·CharacterProfile 필수 필드를 채운다', () => {
    for (const seed of DIVE_SEED_CHARACTERS) {
      expect(seed.character.name).not.toBe('');
      expect(seed.background).not.toBe('');
      expect(Array.isArray(seed.character.voiceRules)).toBe(true);
      expect(seed.character.role).not.toBe('');
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveSeedCharacters.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 구현** — `src/lib/diveSeedCharacters.ts`

```typescript
// Dive X 시드 캐릭터 3종 — 전연령·건전, 톤 분산(일상/판타지/힐링). 사용자가 최소 편집 가능.
import type { CharacterProfile } from './storyEngine';

export interface DiveSeedCharacter {
  character: CharacterProfile;
  background: string;
}

function seedProfile(partial: Pick<CharacterProfile, 'id' | 'name' | 'role' | 'desire' | 'wound' | 'currentState' | 'voiceRules'>): CharacterProfile {
  return {
    canonAnchors: [],
    forbiddenContradictions: [],
    relations: [],
    ...partial
  };
}

export const DIVE_SEED_CHARACTERS: DiveSeedCharacter[] = [
  {
    character: seedProfile({
      id: 'seed-childhood',
      name: '도윤',
      role: '무뚝뚝한 소꿉친구',
      desire: '곁을 지키고 싶지만 먼저 말하지 못한다',
      wound: '표현했다가 멀어진 기억',
      currentState: '같은 동네에 사는 오랜 친구',
      voiceRules: ['짧고 퉁명스럽게', '다정함은 행동으로만', '존댓말 안 씀']
    }),
    background: '같은 골목에서 자란 사이. 사소한 기억이 쌓여 있고, 비 오는 날이면 괜히 마주친다.'
  },
  {
    character: seedProfile({
      id: 'seed-swordsman',
      name: '하란',
      role: '과거를 숨긴 떠돌이 검객',
      desire: '잊으려던 약속을 끝내 지키려 한다',
      wound: '지키지 못한 동료',
      currentState: '함께 길을 떠난 동행',
      voiceRules: ['간결하고 묵직하게', '농담은 드물게', '위기 앞에서 더 차분해짐']
    }),
    background: '이름 없는 길 위에서 동행이 된 사이. 마을마다 사건이 기다리고, 둘은 서로의 과거를 조금씩 안다.'
  },
  {
    character: seedProfile({
      id: 'seed-radiodj',
      name: '세하',
      role: '새벽 라디오 DJ',
      desire: '닿지 못한 사람들에게 위로가 되고 싶다',
      wound: '정작 자기 이야기는 못 함',
      currentState: '새벽 방송으로만 만나는 목소리',
      voiceRules: ['느리고 따뜻하게', '질문을 많이 함', '침묵을 두려워하지 않음']
    }),
    background: '새벽 두 시의 방송. 익명의 사연과 응답이 회차마다 쌓이고, 목소리만으로 가까워진다.'
  }
];
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveSeedCharacters.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveSeedCharacters.ts src/lib/diveSeedCharacters.test.ts
git commit -m "feat(dive-x): 시드 캐릭터 3종 (일상·판타지·힐링)"
```

---

## Task 5: DiveState 영속 (세션 + 연대기)

**Files:**
- Modify: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

OnboardingDraft 패턴(`src/lib/storage.ts:289`)을 미러한다. 하나의 활성 연대기(세션+프로젝트)를 독립 키 `serial-story-studio/dive`에 묶어 저장한다.

- [ ] **Step 1: 실패하는 테스트 추가** — `src/lib/storage.test.ts`

```typescript
import { serializeDiveState, parseDiveState, type DiveState } from './storage';
import { createDiveSession } from './diveSession';
import { createEmptyProject } from './storyEngine';

  it('DiveState는 라운드트립으로 보존된다', () => {
    const state: DiveState = {
      schema: 'storyx/dive/v1',
      session: createDiveSession('seed-childhood', 'proj-x'),
      project: createEmptyProject({ title: '도윤과의 연대기' })
    };
    const parsed = parseDiveState(serializeDiveState(state));
    expect(parsed?.session.characterId).toBe('seed-childhood');
    expect(parsed?.project.title).toBe('도윤과의 연대기');
  });

  it('parseDiveState는 무효/구버전 입력에 null을 반환', () => {
    expect(parseDiveState(null)).toBeNull();
    expect(parseDiveState('{not json')).toBeNull();
    expect(parseDiveState(JSON.stringify({ schema: 'wrong' }))).toBeNull();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/storage.test.ts -t DiveState`
Expected: FAIL — exports not found

- [ ] **Step 3: 구현 추가** — `src/lib/storage.ts` (OnboardingDraft 블록 근처)

```typescript
import type { DiveSession } from './diveSession';

const diveKey = 'serial-story-studio/dive';

export interface DiveState {
  schema: 'storyx/dive/v1';
  session: DiveSession;
  project: SeriesProject;
}

export function serializeDiveState(state: DiveState): string {
  return JSON.stringify(state);
}

export function parseDiveState(raw: string | null): DiveState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<DiveState>;
    if (!value || value.schema !== 'storyx/dive/v1' || !value.session || !value.project) {
      return null;
    }
    return {
      schema: 'storyx/dive/v1',
      session: value.session as DiveSession,
      project: normalizeProject(value.project as SeriesProject)
    };
  } catch {
    return null;
  }
}

export function saveDiveState(state: DiveState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(diveKey, serializeDiveState(state));
}

export function loadDiveState(): DiveState | null {
  if (typeof window === 'undefined') return null;
  return parseDiveState(window.localStorage.getItem(diveKey));
}

export function clearDiveState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(diveKey);
}
```

> 참고 — `normalizeProject`·`SeriesProject` 는 같은 파일에 이미 존재(`src/lib/storage.ts:24`, import는 storyEngine). `DiveSession` import 경로만 추가.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/storage.test.ts -t DiveState`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(dive-x): DiveState(세션+연대기) localStorage 영속 (TDD)"
```

---

## Task 6: storyx.mjs `dive-chat` 명령

**Files:**
- Modify: `tools/storyx.mjs`

실시간 캐릭터 응답(1·2인칭). `review-agent` 명령 구조(`tools/storyx.mjs:179`)를 본떠 mock/codex 분기. 프롬프트는 짧게.

- [ ] **Step 1: 명령 핸들러 추가** — `tools/storyx.mjs`, 기존 `if (command === 'review-agent')` 블록 뒤에 추가

```javascript
if (command === 'dive-chat') {
  const provider = readFlag(args, '--provider', 'mock');
  const characterCard = readFlag(args, '--character', '');
  const context = readFlag(args, '--context', '');
  const dialogue = readFlag(args, '--dialogue', '');
  const userTurn = readFlag(args, '--query', '');
  const prompt = [
    '당신은 Dive X의 캐릭터 연기 엔진입니다. 아래 캐릭터로 1인칭/2인칭 대화를 이어가세요.',
    '사용자("나")에게 말을 거는 현재형 대사·행동으로만 답하고, 3인칭 서술이나 메타 설명은 금지합니다.',
    '',
    '## 캐릭터',
    characterCard || '(미정)',
    '',
    '## 기억(이미 확정된 사실 — 반드시 일관되게 반영)',
    context || '(아직 없음)',
    '',
    '## 최근 대화',
    dialogue || '(처음 — 먼저 자연스럽게 말을 거세요)',
    '',
    `## 나의 말\n${userTurn}`,
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{ "reply": "캐릭터의 대사/행동 (1~3문장)" }'
  ].join('\n');

  if (provider === 'mock') {
    printJson({ provider, mode: 'dive-chat', status: 'complete', reply: '…그래, 듣고 있어.' });
    process.exit(0);
  }
  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', '--model', 'haiku', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];
  const { result: providerResult, raw: rawOutput } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  printJson({
    provider,
    mode: 'dive-chat',
    status: isError ? 'failed' : 'complete',
    reply: readString(parsed?.reply) || '…',
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

> 모델 티어링 의도 — 채팅은 경량(`--model haiku` / codex 기본). 헬퍼 `readFlag`·`printJson`·`parseProviderJson`·`runProviderWithRetry`·`looksLikeProviderError`·`readString` 는 모두 같은 파일에 이미 존재.

- [ ] **Step 2: dry-run 스모크 (mock)**

Run: `node tools/storyx.mjs dive-chat --provider mock --query "안녕"`
Expected: `{"provider":"mock","mode":"dive-chat","status":"complete","reply":"…그래, 듣고 있어."}` 형태 JSON 한 줄

- [ ] **Step 3: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat(dive-x): storyx dive-chat 명령 (경량 모델 실시간 응답)"
```

---

## Task 7: storyx.mjs `dive-condense` 명령

**Files:**
- Modify: `tools/storyx.mjs`

대화 토막 → 3인칭 회차 + 캐논 후보. 출력은 `buildDraftPrompt`(`tools/storyx.mjs:1197`)와 동일한 회차 JSON 계약을 따라 `chapterFromDraftPayload`가 그대로 소비할 수 있게 한다.

- [ ] **Step 1: 명령 핸들러 추가** — `tools/storyx.mjs`, `dive-chat` 블록 뒤에 추가

```javascript
if (command === 'dive-condense') {
  const provider = readFlag(args, '--provider', 'mock');
  const characterCard = readFlag(args, '--character', '');
  const context = readFlag(args, '--context', '');
  const transcript = readFlag(args, '--transcript', '');
  const episode = readFlag(args, '--episode', '1');
  const prompt = [
    'Dive X 회차 응결 요청. 아래 실시간 대화를, 나와 캐릭터를 함께 주인공으로 한 3인칭 서사 회차로 압축하세요.',
    '대사를 그대로 옮기지 말고 장면으로 재구성하되, 일어난 사건·감정 변화·약속은 보존하세요.',
    '',
    '## 캐릭터',
    characterCard || '(미정)',
    '',
    '## 기존 기억(캐논 — 모순 금지)',
    context || '(아직 없음)',
    '',
    '## 응결할 대화',
    transcript,
    '',
    '## 출력 형식 — JSON 객체 하나만. 코드펜스 금지.',
    '{',
    '  "title": "이 회차 제목",',
    '  "hook": "다음을 부르는 한 줄",',
    '  "outline": ["장면 비트 1", "비트 2"],',
    '  "beats": [{ "label": "구성 단위", "summary": "한 문장", "tension": 0 }],',
    '  "prose": "3인칭 본문",',
    '  "newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 회차에서 확정된 새 사실(약속·사건·관계 변화)" }]',
    '}'
  ].join('\n');

  if (provider === 'mock') {
    printJson({
      provider, mode: 'dive-condense', status: 'complete',
      title: `${episode}화 — 응결`, hook: '...', outline: ['mock 비트'],
      beats: [{ label: '도입', summary: 'mock', tension: 0 }],
      prose: 'mock 3인칭 회차 본문.',
      newCanonFacts: [{ owner: 'character', statement: 'mock 캐논' }]
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
    provider, mode: 'dive-condense',
    status: isError ? 'failed' : 'complete',
    title: readString(parsed?.title) || `${episode}화`,
    hook: readString(parsed?.hook),
    outline: normalizeStringList(parsed?.outline),
    beats: Array.isArray(parsed?.beats) ? parsed.beats : [],
    prose: readString(parsed?.prose),
    newCanonFacts: Array.isArray(parsed?.newCanonFacts) ? parsed.newCanonFacts : [],
    warning: isError ? 'provider 호출 실패' : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

> 모델 티어링 의도 — 응결은 고급(`--model sonnet` / codex). `normalizeStringList` 도 같은 파일에 존재.

- [ ] **Step 2: dry-run 스모크 (mock)**

Run: `node tools/storyx.mjs dive-condense --provider mock --transcript "나: 안녕\n상대: 왔어?"`
Expected: `title`·`prose`·`newCanonFacts` 필드를 가진 JSON 한 줄

- [ ] **Step 3: 커밋**

```bash
git add tools/storyx.mjs
git commit -m "feat(dive-x): storyx dive-condense 명령 (대화→3인칭 회차+캐논 후보)"
```

---

## Task 8: vite 브리지 라우트 2개

**Files:**
- Modify: `vite.config.ts`

`storyxBridge`(`vite.config.ts:8`) 패턴 그대로. 기존 라우트 배열에 2개 추가.

- [ ] **Step 1: 라우트 추가** — `vite.config.ts`, 기존 storyxBridge 호출들과 같은 위치에 추가

```typescript
    storyxBridge('/api/dive-chat', (input) => [
      'tools/storyx.mjs',
      'dive-chat',
      '--provider', 'codex',
      '--character', String(input.character ?? ''),
      '--context', String(input.context ?? ''),
      '--dialogue', String(input.dialogue ?? ''),
      '--query', String(input.query ?? '')
    ]),
    storyxBridge('/api/dive-condense', (input) => [
      'tools/storyx.mjs',
      'dive-condense',
      '--provider', 'codex',
      '--character', String(input.character ?? ''),
      '--context', String(input.context ?? ''),
      '--transcript', String(input.transcript ?? ''),
      '--episode', String(input.episode ?? '1')
    ]),
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add vite.config.ts
git commit -m "feat(dive-x): /api/dive-chat·/api/dive-condense 브리지 라우트"
```

---

## Task 9: diveClient.ts — fetch 래퍼

**Files:**
- Create: `src/lib/diveClient.ts`
- Test: `src/lib/diveClient.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/diveClient.test.ts`

```typescript
import { describe, expect, it, vi, afterEach } from 'vitest';
import { requestDiveChat, requestDiveCondense } from './diveClient';

afterEach(() => vi.restoreAllMocks());

describe('diveClient', () => {
  it('requestDiveChat는 /api/dive-chat에 POST하고 reply를 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '왔어?' })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveChat({ character: 'c', context: '', dialogue: '', query: '안녕' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-chat', expect.objectContaining({ method: 'POST' }));
    expect(res.reply).toBe('왔어?');
  });

  it('requestDiveCondense는 회차 페이로드를 반환', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', title: '1화', prose: '본문', newCanonFacts: [] })
    }));
    const res = await requestDiveCondense({ character: 'c', context: '', transcript: '나: 안녕', episode: 1 });
    expect(res.title).toBe('1화');
    expect(res.prose).toBe('본문');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 구현** — `src/lib/diveClient.ts`

```typescript
// Dive X 로컬 브리지(/api/dive-chat·/api/dive-condense) fetch 래퍼
export interface DiveChatRequest { character: string; context: string; dialogue: string; query: string; }
export interface DiveChatResponse { status: string; reply: string; warning?: string; }

export interface DiveCondenseRequest { character: string; context: string; transcript: string; episode: number; }
export interface DiveCondensePayload {
  status: string;
  title: string;
  hook: string;
  outline: string[];
  beats: Array<{ label: string; summary: string; tension: number }>;
  prose: string;
  newCanonFacts: Array<{ owner: string; statement: string }>;
  warning?: string;
}

async function postJson<T>(route: string, body: unknown): Promise<T> {
  const res = await fetch(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return (await res.json()) as T;
}

export function requestDiveChat(req: DiveChatRequest): Promise<DiveChatResponse> {
  return postJson<DiveChatResponse>('/api/dive-chat', req);
}

export function requestDiveCondense(req: DiveCondenseRequest): Promise<DiveCondensePayload> {
  return postJson<DiveCondensePayload>('/api/dive-condense', req);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/diveClient.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/diveClient.ts src/lib/diveClient.test.ts
git commit -m "feat(dive-x): diveClient fetch 래퍼 (TDD)"
```

---

## Task 10: DiveDesk.tsx — 얇은 표면

**Files:**
- Create: `src/components/DiveDesk.tsx`
- Test: `src/components/diveDesk.test.ts`

채팅 + 응결칩 + 승인 다이얼로그 + 연대기. 응결 승인 시 `chapterFromDraftPayload(project, payload, request)`(payload→회차 + 내부에서 `commitChapter`·성장레저까지 수행, `ProductionResult.updatedProject` 반환)·`applyCondenseResult`(버퍼 압축)를 호출하고 `inspectLeak`로 회차 품질 바닥을 검사한다. **주의 — `chapterFromDraftPayload`는 이미 커밋된 `updatedProject`를 돌려주므로 별도 `commitChapter`를 또 부르면 이중 커밋이다.**

- [ ] **Step 1: 컴포넌트 구현** — `src/components/DiveDesk.tsx`

```tsx
// Dive X 얇은 표면 — 채팅·응결 제안·승인 다이얼로그·연대기. 엔진은 재사용.
import { useMemo, useState } from 'react';
import type { SeriesProject, ProductionRequest } from '../lib/storyEngine';
import { chapterFromDraftPayload, buildProjectContextDigest } from '../lib/storyEngine';
import { inspectLeak } from '../lib/leakGate';
import {
  type DiveSession,
  appendMessage,
  shouldSuggestCondense,
  buildTranscript,
  buildRecentDialogue,
  selectCondenseSpan,
  applyCondenseResult
} from '../lib/diveSession';
import { requestDiveChat, requestDiveCondense, type DiveCondensePayload } from '../lib/diveClient';
import { DIVE_SEED_CHARACTERS } from '../lib/diveSeedCharacters';

interface DiveDeskProps {
  session: DiveSession;
  project: SeriesProject;
  onChange: (session: DiveSession, project: SeriesProject) => void;
  onBack: () => void;
}

function characterCardText(project: SeriesProject, characterId: string): string {
  const c = project.characters.find((x) => x.id === characterId)
    ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === characterId)?.character;
  if (!c) return '';
  return `${c.name} — ${c.role}. 욕망: ${c.desire}. 말투: ${c.voiceRules.join(', ')}`;
}

export function DiveDesk({ session, project, onChange, onBack }: DiveDeskProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<DiveCondensePayload | null>(null);
  const [leakWarn, setLeakWarn] = useState<string | null>(null);
  const card = useMemo(() => characterCardText(project, session.characterId), [project, session.characterId]);
  const suggest = shouldSuggestCondense(session);

  async function send() {
    if (!input.trim() || busy) return;
    const userText = input.trim();
    setInput('');
    setBusy(true);
    let next = appendMessage(session, 'user', userText);
    onChange(next, project);
    const res = await requestDiveChat({
      character: card,
      context: buildProjectContextDigest(project),
      dialogue: buildRecentDialogue(next),
      query: userText
    });
    next = appendMessage(next, 'character', res.reply || '…');
    onChange(next, project);
    setBusy(false);
  }

  async function condense() {
    if (busy) return;
    setBusy(true);
    const { condense: span } = selectCondenseSpan(session);
    const episode = project.chapters.length + 1;
    const payload = await requestDiveCondense({
      character: card,
      context: buildProjectContextDigest(project),
      transcript: buildTranscript(span),
      episode
    });
    const leak = inspectLeak(payload.prose);
    setLeakWarn(leak.blocked ? '본문에 프롬프트/AI 누수가 감지됐습니다. 다시 응결하세요.' : null);
    setPending(leak.blocked ? null : payload);
    setBusy(false);
  }

  function approve() {
    if (!pending) return;
    const request: ProductionRequest = { genre: project.genre, intent: '', pressure: '' };
    const { updatedProject } = chapterFromDraftPayload(
      project,
      {
        title: pending.title,
        hook: pending.hook,
        outline: pending.outline,
        beats: pending.beats,
        prose: pending.prose,
        newCanonFacts: pending.newCanonFacts
      },
      request
    );
    // chapterFromDraftPayload가 내부에서 commitChapter까지 수행 → updatedProject를 그대로 쓴다(이중 커밋 금지).
    setPending(null);
    onChange(applyCondenseResult(session), updatedProject);
  }

  return (
    <div className="dx-desk">
      <header className="dx-head">
        <button className="dx-back" onClick={onBack}>← 뒤로</button>
        <span className="dx-title">{card}</span>
      </header>

      <div className="dx-chronicle">
        {project.chapters.map((ch) => (
          <article key={ch.id} className="dx-chapter">
            <h4>{ch.episode}화 「{ch.title}」</h4>
            <p>{ch.prose}</p>
          </article>
        ))}
      </div>

      <div className="dx-chat">
        {session.chatBuffer.map((m) => (
          <div key={m.id} className={`dx-bubble dx-${m.role}`}>{m.text}</div>
        ))}
      </div>

      {suggest && !pending && (
        <button className="dx-condense-chip" onClick={condense} disabled={busy}>
          이 장면을 한 회차로 응결할까요?
        </button>
      )}
      {leakWarn && <div className="dx-leak">{leakWarn}</div>}

      {pending && (
        <div className="dx-approve" role="dialog">
          <h4>응결된 회차 — {pending.title}</h4>
          <p className="dx-approve-prose">{pending.prose}</p>
          <ul className="dx-approve-canon">
            {pending.newCanonFacts.map((f, i) => <li key={i}>+ {f.statement}</li>)}
          </ul>
          <div className="dx-approve-actions">
            <button onClick={approve}>승인 — 캐논으로 고정</button>
            <button onClick={() => setPending(null)}>거절</button>
          </div>
        </div>
      )}

      <div className="dx-composer">
        <input
          className="dx-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="말을 걸어보세요"
          disabled={busy}
        />
        <button className="dx-send" onClick={send} disabled={busy}>보내기</button>
        <button className="dx-condense-manual" onClick={condense} disabled={busy || session.chatBuffer.length === 0}>
          지금 응결
        </button>
      </div>
    </div>
  );
}
```

> `chapterFromDraftPayload`(`src/lib/storyEngine.ts:1463`) 정확 시그니처 = `(project, payload: DraftChapterPayload, request: ProductionRequest) => ProductionResult`. `ProductionResult.updatedProject`는 이미 `commitChapter`+성장레저가 반영된 프로젝트다. 응결 후 다음 `send`는 `buildProjectContextDigest(updatedProject)`로 새 캐논을 주입 → 캐릭터가 회수.

- [ ] **Step 2: 렌더 핀 테스트** — `src/components/diveDesk.test.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DiveDesk } from './DiveDesk';
import { createDiveSession } from '../lib/diveSession';
import { createEmptyProject } from '../lib/storyEngine';

describe('DiveDesk', () => {
  it('연대기 회차와 채팅 버블을 렌더한다', () => {
    const project = createEmptyProject({ title: 't' });
    let session = createDiveSession('seed-childhood', project.id);
    session = { ...session, chatBuffer: [{ id: 'm1', role: 'user', text: '안녕', turn: 1 }] };
    const html = renderToStaticMarkup(
      createElement(DiveDesk, { session, project, onChange: () => {}, onBack: () => {} })
    );
    expect(html).toContain('안녕');
    expect(html).toContain('말을 걸어보세요');
  });
});
```

- [ ] **Step 3: 통과 확인**

Run: `npx vitest run src/components/diveDesk.test.ts`
Expected: PASS (1 test)

- [ ] **Step 4: 커밋**

```bash
git add src/components/DiveDesk.tsx src/components/diveDesk.test.ts
git commit -m "feat(dive-x): DiveDesk 얇은 표면 — 채팅·응결·승인·연대기 (TDD 렌더 핀)"
```

---

## Task 11: App.tsx `'dive'` stage 배선 + 스타일 + 라이브 검증

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: AppStage·라우팅 추가** — `src/App.tsx`

`type AppStage` 에 `'dive'` 추가(`src/App.tsx:145`):

```typescript
type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor' | 'publish' | 'dive';
```

`initialStage` useMemo 의 stageParam 화이트리스트에 `stageParam === 'dive'` 추가. 그리고 stage 렌더 분기에 추가:

```tsx
  if (stage === 'dive') {
    const seed = DIVE_SEED_CHARACTERS[0];
    const restored = loadDiveState();
    const initial = restored ?? {
      schema: 'storyx/dive/v1' as const,
      session: createDiveSession(seed.character.id, ''),
      project: (() => {
        const p = createEmptyProject({ title: `${seed.character.name}과의 연대기` });
        return { ...p, characters: [seed.character] };
      })()
    };
    return (
      <DiveStage initial={initial} onBack={() => setStage('editor')} />
    );
  }
```

상단 import 추가:

```typescript
import { DiveDesk } from './components/DiveDesk';
import { DIVE_SEED_CHARACTERS } from './lib/diveSeedCharacters';
import { createDiveSession } from './lib/diveSession';
import { loadDiveState, saveDiveState, type DiveState } from './lib/storage';
```

`App` 함수 밖에 작은 래퍼 컴포넌트 추가(영속 배선):

```tsx
function DiveStage({ initial, onBack }: { initial: DiveState; onBack: () => void }) {
  const [state, setState] = useState<DiveState>(initial);
  return (
    <DiveDesk
      session={state.session}
      project={state.project}
      onBack={onBack}
      onChange={(session, project) => {
        const next: DiveState = { schema: 'storyx/dive/v1', session, project };
        setState(next);
        saveDiveState(next);
      }}
    />
  );
}
```

> 시드 선택 UI는 비목표(YAGNI) — 1차는 시드[0] 고정 + localStorage 복원. 다른 시드를 시험하려면 `clearDiveState()` 후 시드 인덱스를 바꾼다.

- [ ] **Step 2: 스코프 스타일 추가** — `src/styles.css` 끝에 `.dx-*` 블록(Linear 다크 토큰 사용)

```css
.dx-desk { display: flex; flex-direction: column; gap: 12px; max-width: 760px; margin: 0 auto; padding: 24px; color: var(--nx-ink, #f7f7fb); background: var(--nx-page, #08090a); min-height: 100vh; }
.dx-head { display: flex; align-items: center; gap: 12px; }
.dx-chronicle { display: flex; flex-direction: column; gap: 8px; }
.dx-chapter { border: 1px solid #2a2a2a; border-radius: 10px; padding: 12px; background: rgba(124,92,255,0.06); }
.dx-chat { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; }
.dx-bubble { max-width: 78%; padding: 7px 11px; border-radius: 12px; font-size: 14px; }
.dx-user { align-self: flex-end; background: rgba(43,179,192,0.18); }
.dx-character { align-self: flex-start; background: #242424; }
.dx-condense-chip { align-self: center; padding: 8px 14px; border-radius: 20px; background: #1d3a1d; color: #7CFF6B; border: none; cursor: pointer; }
.dx-leak { color: #ff8a7a; font-size: 13px; }
.dx-approve { border: 1px solid #7c5cff55; border-radius: 12px; padding: 14px; background: rgba(124,92,255,0.08); }
.dx-approve-actions { display: flex; gap: 8px; margin-top: 10px; }
.dx-composer { display: flex; gap: 8px; position: sticky; bottom: 0; padding-top: 8px; }
.dx-input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #333; background: #111; color: inherit; }
```

- [ ] **Step 3: 게이트 — tsc·테스트·빌드**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: tsc 0 · 전체 테스트 녹색(신설 포함) · 빌드 성공

- [ ] **Step 4: 로컬 라이브 한 바퀴 (preview)**

`npm run dev` → `?stage=dive` 진입. 확인 —
  1. 시드 캐릭터(도윤)와 채팅 → 응답 도착(1·2인칭).
  2. 12메시지 도달 시 응결 칩 노출(또는 "지금 응결" 클릭).
  3. 응결 → 승인 다이얼로그에 3인칭 회차 + 캐논 후보. 누수면 경고.
  4. 승인 → 연대기에 회차 추가 · 버퍼 압축 · 새 캐논 고정.
  5. 새로고침 → `loadDiveState`로 연대기·세션 복원.
  6. 응결 후 다음 대화에서 캐릭터가 새 캐논을 회수하는지 체감(핵심 — `buildProjectContextDigest` 주입).
콘솔 에러 0 확인. 스크린샷 1장.

> codex 호출이 무거우면 채팅/응결은 mock provider로 갈음 가능(브리지 `--provider`를 임시 mock). 단 6번 "기억 회수" 체감은 실제 provider라야 의미.

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat(dive-x): App dive stage 배선 + .dx-* 다크 스타일 + 라이브 한 바퀴"
```

---

## Self-Review 결과 (스펙 대비)

- 스펙 §4.1 신설 모듈 → Task 1~3(diveSession)·4(시드)·10(DiveDesk) ✅
- 스펙 §4.2 재사용 → Task 10(chapterFromDraftPayload→내부 commitChapter·buildProjectContextDigest·inspectLeak)·5(storage·normalizeProject) ✅
- 스펙 §4.3 LLM 경로(dive-chat 경량·dive-condense 고급) → Task 6·7·8 ✅
- 스펙 §4.4 데이터 흐름 한 바퀴 → Task 11 Step 4 ✅
- 스펙 §5 영속(독립 키) → Task 5 ✅
- 스펙 §6 시드 3종 → Task 4 ✅
- 스펙 §4 승인형 캐논(자동 박제 금지) → Task 10 approve() ✅
- 스펙 §10 DoD(tsc·test·build·라이브) → Task 11 Step 3·4 ✅
- 품질 게이트(koreanVoiceGate)는 1차에서 leakGate만 배선(누수 차단). `inspectKoreanVoice` 점수 표시는 후속(YAGNI) — 스펙 §4.2의 "품질 바닥"은 leakGate로 최소 충족, voice 점수는 dogfooding 중 필요 판단 후 추가.

주의 — `chapterFromDraftPayload` 시그니처는 소스에서 확인 완료(`storyEngine.ts:1463`, `(project, payload, request) => ProductionResult`, 내부 commitChapter). 모델 티어링은 라우트에 `--provider codex` 단일이라 의도만 배선(스펙 §4.3·§7 비목표와 일치). `DiveCondensePayload.beats`(`{label,summary,tension}`)·`newCanonFacts`(`{owner,statement}`)는 각각 `DraftChapterPayloadBeat`·`DraftChapterPayloadCanonFact`와 형상 일치 — 그대로 payload로 전달 가능.
