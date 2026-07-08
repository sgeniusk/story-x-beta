# PLAN 설계 대화 채널(설계실 2단계) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PLAN(바이블 설계실)에 승인형 패치 제안을 내는 AI 설계 파트너 대화 채널을 얹는다 — 제안 승인은 기존 stage\* 핸들러로 설계안(PLAN +N)에 합류, 하네스 점수 미리보기 동봉.

**Architecture:** 순수 모듈(planChat.ts — 카탈로그·transcript·정규화) + 6점 배선(vite 브리지·storyx.mjs 커맨드·promptBuilders 미러·prod Function·클라이언트·AiCallMode) + 프레젠테이션(PlanChatPanel) + FloatingDataWorkspace dock 「✦ 설계」 패널 + StoryXDesk 조립. 대화 버퍼는 localStorage 영속(`plan-chat` 키)이라 반영 remount에 생존. clear+remount 회귀 테스트(PR #20 잔여 MEDIUM) 동봉. 정본 spec = `docs/superpowers/specs/2026-07-07-plan-design-chat-design.md`.

**Tech Stack:** TypeScript + React + Vitest(renderToStaticMarkup / react-dom client mount) + vanilla CSS(`.fc-pd-*` 패널 관례·`--st-mode-plan` 악센트).

**불변식(전 태스크 공통)** — 승인 경로는 stage\* 핸들러 재사용(upsertPlanPatch 직접 호출 금지) · 제안은 기존 엔티티 필드 수정만(인물 CRUD·헌장·제목·creative-weight 불가) · story-core `'title'` 정규화 드랍 필수 핀 · LLM 호출은 사용자 발화 시에만 · 프롬프트 미러 byte-identical · App key=syncVersion만·반영/버리기·충돌 게이트 무접촉 · WRITE/PLAY 무접촉 · 새 transition/animation 없음(reduced-motion 블록 무접촉).

---

### Task 1: 순수 모듈 `planChat.ts` — 타입·카탈로그·transcript·정규화

**Files:**
- Create: `src/lib/planChat.ts`
- Test: `src/lib/planChat.test.ts` (신규)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/planChat.test.ts` 신규 파일 전체.

```ts
// planChat — 설계 대화 카탈로그·transcript·정규화 순수 검증.
import { describe, expect, it } from 'vitest';
import type { SeriesProject } from './storyEngine';
import {
  buildPlanChatCatalog, buildPlanChatTranscript, normalizePlanChatResponse,
  type PlanChatMessage
} from './planChat';

const longDesire = '가'.repeat(100);
const project = {
  characters: [{ id: 'c1', name: '리아나', desire: longDesire, wound: '처형장의 아침', currentState: '벨로트가 위장' }],
  worldRules: [{ id: 'w1', title: '인장의 법', rule: '인장 사용권을 넘기면 계약 가능' }],
  canonFacts: Array.from({ length: 45 }, (_, i) => ({ id: `k${i}`, statement: `사실 ${i}`, episode: 1 })),
  logline: '한 줄', audiencePromise: '약속', deepQuestion: '질문', formIntent: '형식', tone: '톤'
} as unknown as SeriesProject;

describe('buildPlanChatCatalog', () => {
  it('실존 id 집합·표시 라벨·카탈로그 텍스트를 만든다', () => {
    const catalog = buildPlanChatCatalog(project);
    expect(catalog.characterIds.has('c1')).toBe(true);
    expect(catalog.worldIds.has('w1')).toBe(true);
    expect(catalog.targetLabels['c1']).toBe('리아나');
    expect(catalog.text).toContain('id=c1');
    expect(catalog.text).toContain('id=w1');
    expect(catalog.text).toContain('logline=한 줄');
  });
  it('캐논은 최근 40개만 — 카탈로그 밖 id 는 검증 집합에도 없다', () => {
    const catalog = buildPlanChatCatalog(project);
    expect(catalog.canonIds.has('k44')).toBe(true);
    expect(catalog.canonIds.has('k4')).toBe(false);
    expect(catalog.text).not.toContain('id=k4 ');
  });
  it('카탈로그 값은 80자 절단', () => {
    const catalog = buildPlanChatCatalog(project);
    expect(catalog.text).toContain('가'.repeat(80));
    expect(catalog.text).not.toContain('가'.repeat(81));
  });
});

describe('buildPlanChatTranscript', () => {
  it('최근 8메시지를 작가:/파트너: 라벨로 잇는다', () => {
    const messages: PlanChatMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`, role: i % 2 === 0 ? 'user' : 'partner', text: `t${i}`
    }));
    const transcript = buildPlanChatTranscript(messages);
    expect(transcript).not.toContain('t1');
    expect(transcript).toContain('작가: t2');
    expect(transcript).toContain('파트너: t9');
  });
});

describe('normalizePlanChatResponse', () => {
  const catalog = buildPlanChatCatalog(project);
  const ok = (proposals: unknown[]) => normalizePlanChatResponse({ reply: '응답', proposals }, catalog);

  it('reply 비면 null·비객체 null', () => {
    expect(normalizePlanChatResponse({ reply: '  ' }, catalog)).toBeNull();
    expect(normalizePlanChatResponse(null, catalog)).toBeNull();
  });
  it('유효 character 제안을 targetLabel 과 함께 보존한다', () => {
    const turn = ok([{ kind: 'character', targetId: 'c1', field: 'desire', after: '형의 누명을 벗긴다', rationale: '방어에서 목표로' }]);
    expect(turn?.proposals).toHaveLength(1);
    expect(turn?.proposals[0]).toMatchObject({ kind: 'character', targetId: 'c1', field: 'desire', targetLabel: '리아나' });
  });
  it('없는 targetId·kind 외 값·빈 after 는 드랍', () => {
    const turn = ok([
      { kind: 'character', targetId: 'ghost', field: 'desire', after: 'x' },
      { kind: 'scene', after: 'x' },
      { kind: 'world', targetId: 'w1', after: '   ' }
    ]);
    expect(turn?.proposals).toHaveLength(0);
  });
  it('field 화이트리스트 — character 에 logline 불가, story-core 에 desire 불가', () => {
    const turn = ok([
      { kind: 'character', targetId: 'c1', field: 'logline', after: 'x' },
      { kind: 'story-core', field: 'desire', after: 'x' }
    ]);
    expect(turn?.proposals).toHaveLength(0);
  });
  it('[필수 핀] story-core title 은 드랍 — stageStoryCore(title)은 본편 직행이라 뚫리면 즉시 쓰기', () => {
    const turn = ok([{ kind: 'story-core', field: 'title', after: '새 제목' }]);
    expect(turn?.proposals).toHaveLength(0);
  });
  it('같은 (kind,targetId,field) 는 첫 것만·턴당 상한 3', () => {
    const turn = ok([
      { kind: 'story-core', field: 'logline', after: 'a' },
      { kind: 'story-core', field: 'logline', after: 'b' },
      { kind: 'story-core', field: 'tone', after: 'c' },
      { kind: 'world', targetId: 'w1', after: 'd' },
      { kind: 'canon', targetId: 'k44', after: 'e' }
    ]);
    expect(turn?.proposals).toHaveLength(3);
    expect(turn?.proposals[0].after).toBe('a');
  });
  it('rationale 은 trim 후 120자 절단', () => {
    const turn = ok([{ kind: 'world', targetId: 'w1', after: 'x', rationale: `  ${'나'.repeat(150)}  ` }]);
    expect(turn?.proposals[0].rationale).toBe('나'.repeat(120));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/planChat.test.ts`
Expected: FAIL — 모듈 부재(import 에러).

- [ ] **Step 3: 구현**

`src/lib/planChat.ts` 신규 파일 전체.

```ts
// PLAN 설계 대화(설계실 2단계) — 엔티티 카탈로그·transcript·파트너 응답 정규화 순수 모듈. spec 2026-07-07.
import type { SeriesProject } from './storyEngine';

export type PlanChatRole = 'user' | 'partner';

export interface PlanChatProposal {
  kind: 'character' | 'world' | 'canon' | 'story-core';
  targetId?: string;
  targetLabel?: string;  // 카드 표시용 — 카탈로그에서 파생(인물 이름 등)
  field?: string;        // character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone
  after: string;
  rationale: string;
  approved?: boolean;    // 승인 후 ✓ 상태(버퍼에 영속)
}

export interface PlanChatMessage {
  id: string;
  role: PlanChatRole;
  text: string;
  proposals?: PlanChatProposal[];
}

export interface PlanChatTurn {
  reply: string;
  proposals: PlanChatProposal[];
}

export interface PlanChatCatalog {
  text: string;
  characterIds: Set<string>;
  worldIds: Set<string>;
  canonIds: Set<string>;
  targetLabels: Record<string, string>;
}

const CATALOG_VALUE_LIMIT = 80;
// buildProjectContextDigest 의 CONTEXT_CANON_LIMIT 선례(40) — 비export 라 자체 상수로 둔다.
const CATALOG_CANON_LIMIT = 40;
const TRANSCRIPT_LIMIT = 8;
const MAX_PROPOSALS_PER_TURN = 3;
const MAX_RATIONALE = 120;

const CHARACTER_FIELDS = new Set(['desire', 'wound', 'currentState']);
// 'title' 은 의도적 제외 — stageStoryCore('title')은 staged 가 아니라 본편 직행(spec §4.1 필수 핀).
const STORY_CORE_FIELDS = new Set(['logline', 'audiencePromise', 'deepQuestion', 'formIntent', 'tone']);

function clip(value: string): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > CATALOG_VALUE_LIMIT ? trimmed.slice(0, CATALOG_VALUE_LIMIT) : trimmed;
}

// 파트너가 실존 id 만 겨냥하도록 프롬프트에 싣는 카탈로그 + 정규화 검증용 id 집합.
export function buildPlanChatCatalog(project: SeriesProject): PlanChatCatalog {
  const lines: string[] = [];
  const targetLabels: Record<string, string> = {};
  lines.push('[인물]');
  for (const character of project.characters) {
    targetLabels[character.id] = character.name;
    lines.push(`- id=${character.id} ${character.name} · 욕망=${clip(character.desire)} · 상처=${clip(character.wound)} · 현재=${clip(character.currentState)}`);
  }
  lines.push('[세계 규칙]');
  for (const rule of project.worldRules) {
    targetLabels[rule.id] = clip(rule.title).slice(0, 24);
    lines.push(`- id=${rule.id} ${clip(rule.title)} — ${clip(rule.rule)}`);
  }
  lines.push('[캐논 — 최근 순]');
  const recentCanon = project.canonFacts.slice(-CATALOG_CANON_LIMIT);
  for (const fact of recentCanon) {
    targetLabels[fact.id] = clip(fact.statement).slice(0, 20);
    lines.push(`- id=${fact.id} ${clip(fact.statement)}`);
  }
  lines.push('[스토리 코어]');
  lines.push(`- logline=${clip(project.logline)}`);
  lines.push(`- audiencePromise=${clip(project.audiencePromise)}`);
  lines.push(`- deepQuestion=${clip(project.deepQuestion)}`);
  lines.push(`- formIntent=${clip(project.formIntent)}`);
  lines.push(`- tone=${clip(project.tone)}`);
  return {
    text: lines.join('\n'),
    characterIds: new Set(project.characters.map((c) => c.id)),
    worldIds: new Set(project.worldRules.map((r) => r.id)),
    canonIds: new Set(recentCanon.map((f) => f.id)),
    targetLabels
  };
}

export function buildPlanChatTranscript(messages: PlanChatMessage[], limit = TRANSCRIPT_LIMIT): string {
  return messages
    .slice(-limit)
    .map((m) => `${m.role === 'user' ? '작가' : '파트너'}: ${m.text}`)
    .join('\n');
}

// provider 응답({ reply, proposals })을 정규화 — 무효 제안은 조용히 드랍(강등 관례), reply 비면 턴 실패(null).
export function normalizePlanChatResponse(raw: unknown, catalog: PlanChatCatalog): PlanChatTurn | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const reply = typeof record.reply === 'string' ? record.reply.trim() : '';
  if (!reply) return null;
  const list = Array.isArray(record.proposals) ? record.proposals : [];
  const seen = new Set<string>();
  const proposals: PlanChatProposal[] = [];
  for (const item of list) {
    if (proposals.length >= MAX_PROPOSALS_PER_TURN) break;
    if (typeof item !== 'object' || item === null) continue;
    const p = item as Record<string, unknown>;
    const kind = typeof p.kind === 'string' ? p.kind : '';
    const after = typeof p.after === 'string' ? p.after.trim() : '';
    if (!after) continue;
    const targetId = typeof p.targetId === 'string' ? p.targetId : '';
    const field = typeof p.field === 'string' ? p.field : '';
    if (kind === 'character') {
      if (!catalog.characterIds.has(targetId) || !CHARACTER_FIELDS.has(field)) continue;
    } else if (kind === 'world') {
      if (!catalog.worldIds.has(targetId)) continue;
    } else if (kind === 'canon') {
      if (!catalog.canonIds.has(targetId)) continue;
    } else if (kind === 'story-core') {
      if (!STORY_CORE_FIELDS.has(field)) continue;
    } else {
      continue;
    }
    const dedupKey = `${kind}:${targetId}:${field}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    const rationale = typeof p.rationale === 'string' ? p.rationale.trim().slice(0, MAX_RATIONALE) : '';
    const targetLabel = targetId ? catalog.targetLabels[targetId] : undefined;
    proposals.push({
      kind: kind as PlanChatProposal['kind'],
      ...(targetId ? { targetId } : {}),
      ...(targetLabel ? { targetLabel } : {}),
      ...(field && (kind === 'character' || kind === 'story-core') ? { field } : {}),
      after,
      rationale
    });
  }
  return { reply, proposals };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/planChat.test.ts`
Expected: PASS 전부.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/planChat.ts src/lib/planChat.test.ts
git commit -m "feat(plan-chat): 설계 대화 순수 모듈 — 카탈로그·transcript·정규화(title 드랍 필수 핀)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: storage — `plan-chat` 대화 버퍼 영속

**Files:**
- Modify: `src/lib/storage.ts` (`clearPlanPatches` 바로 아래, ~515행)
- Test: `src/lib/storage.test.ts` (기존 파일 끝에 describe 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/lib/storage.test.ts` 파일 끝에 추가. (이 테스트 파일이 이미 localStorage 를 쓰는 관례를 따른다 — 기존 describe 들을 참고하되 아래 코드는 자기완결적.)

```ts
describe('plan-chat 대화 버퍼 영속 (설계실 2단계)', () => {
  it('저장·로드 왕복 + 스키마 가드', async () => {
    const { loadPlanChatMessages, savePlanChatMessages, clearPlanChatMessages } = await import('./storage');
    clearPlanChatMessages();
    expect(loadPlanChatMessages()).toEqual([]);
    savePlanChatMessages([{ id: 'm1', role: 'user', text: '안녕' }]);
    expect(loadPlanChatMessages()).toEqual([{ id: 'm1', role: 'user', text: '안녕' }]);
    window.localStorage.setItem('serial-story-studio/plan-chat', JSON.stringify({ schema: 'wrong', messages: [] }));
    expect(loadPlanChatMessages()).toEqual([]);
    clearPlanChatMessages();
  });
  it('저장 시 최근 40메시지로 절단한다', async () => {
    const { loadPlanChatMessages, savePlanChatMessages, clearPlanChatMessages } = await import('./storage');
    const many = Array.from({ length: 50 }, (_, i) => ({ id: `m${i}`, role: 'user' as const, text: `t${i}` }));
    savePlanChatMessages(many);
    const loaded = loadPlanChatMessages();
    expect(loaded).toHaveLength(40);
    expect(loaded[0].id).toBe('m10');
    clearPlanChatMessages();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/storage.test.ts`
Expected: 신규 2개 FAIL(export 부재).

- [ ] **Step 3: 구현**

`src/lib/storage.ts` — 상단 import 에 `import type { PlanChatMessage } from './planChat';` 추가, `clearPlanPatches` 함수 바로 아래 삽입.

```ts
// PLAN 설계 대화 버퍼 — syncVersion remount·새로고침 생존(spec 2026-07-07). 패치(plan-stage)와 별개 키.
const planChatKey = 'serial-story-studio/plan-chat';
const PLAN_CHAT_MAX_MESSAGES = 40;

export interface PlanChatState {
  schema: 'storyx/plan-chat/v1';
  messages: PlanChatMessage[];
}

export function loadPlanChatMessages(): PlanChatMessage[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(planChatKey);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as Partial<PlanChatState>;
    if (!value || value.schema !== 'storyx/plan-chat/v1' || !Array.isArray(value.messages)) return [];
    return value.messages as PlanChatMessage[];
  } catch {
    return [];
  }
}

export function savePlanChatMessages(messages: PlanChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const state: PlanChatState = {
    schema: 'storyx/plan-chat/v1',
    messages: messages.slice(-PLAN_CHAT_MAX_MESSAGES)
  };
  window.localStorage.setItem(planChatKey, JSON.stringify(state));
}

export function clearPlanChatMessages(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(planChatKey);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/storage.test.ts`
Expected: PASS 전부(기존 포함).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat(plan-chat): 대화 버퍼 localStorage 영속 — schema v1·40메시지 cap(반영 remount 생존)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 프롬프트 — `buildPlanChatPrompt` + storyx.mjs 미러·커맨드 + 핀

**Files:**
- Modify: `src/lib/server/promptBuilders.ts` (`buildVsCandidatesPrompt` 끝, ~650행 뒤)
- Modify: `tools/storyx.mjs` — ① 미러 빌더(`buildVsCandidatesPrompt` 함수 뒤, ~2250행) ② `plan-chat` 커맨드 블록(`vs-candidates` 커맨드 블록 뒤, ~1223행)
- Test: `src/lib/server/promptBuilders.test.ts` (파일 끝)

- [ ] **Step 1: 핀 테스트 추가(실패 유도)**

`src/lib/server/promptBuilders.test.ts` 파일 끝에 추가. (`readFileSync`·`resolve` 는 파일 상단에 이미 import 되어 있다 — [vs-mirror] 가 사용.)

```ts
// PLAN 설계 대화 프롬프트 — 설계실 2단계. storyx.mjs 미러 byte-identical — 계약·지시문 전문 양쪽 동시 갱신.
import { buildPlanChatPrompt } from './promptBuilders';

describe('buildPlanChatPrompt — PLAN 설계 대화 (설계실 2단계)', () => {
  const PLAN_CHAT_JSON_CONTRACT =
    '  "reply": "...", "proposals": [{ "kind": "character", "targetId": "...", "field": "desire", "after": "...", "rationale": "..." }]';
  const PLAN_CHAT_ID_INSTRUCTION =
    '- 제안은 엔티티 카탈로그의 실존 id 만 겨냥합니다. kind 별 필드 — character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone · world/canon: 필드 없음.';
  it('역할·카탈로그·제안 상한·헌장 불가침·JSON 계약을 담는다', () => {
    const p = buildPlanChatPrompt({
      medium: 'novel', format: 'long-novel', activeSection: 'characters',
      contextDigest: '계약 요약', catalog: '- id=c1 리아나', dialogue: '작가: 안녕', query: '욕망을 다듬자'
    });
    expect(p).toContain('설계 파트너');
    expect(p).toContain('- id=c1 리아나');
    expect(p).toContain('proposals 는 0~3개');
    expect(p).toContain('결말 헌장은 절대 배신하지 않습니다');
    expect(p).toContain(PLAN_CHAT_ID_INSTRUCTION);
    expect(p).toContain(PLAN_CHAT_JSON_CONTRACT);
  });
  it('[plan-mirror] storyx.mjs 가 JSON 계약·id 지시문을 byte-identical 로 미러한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(PLAN_CHAT_JSON_CONTRACT);
    expect(cli).toContain(PLAN_CHAT_ID_INSTRUCTION);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/server/promptBuilders.test.ts`
Expected: 신규 describe 2개 it FAIL(빌더 부재), 기존 전부 PASS.

- [ ] **Step 3: TS 빌더 구현**

`src/lib/server/promptBuilders.ts` — 파일 상단 타입 선언부(`VsCandidatesPromptInput` 근처)에 입력 타입 추가.

```ts
// PLAN 설계 대화(설계실 2단계). 단일 설계 파트너 + 승인형 패치 제안 0~3개.
export interface PlanChatPromptInput {
  medium: string;
  format: CreativeFormat;
  activeSection: string;
  contextDigest: string;
  catalog: string;
  dialogue: string;
  query: string;
}
```

`buildVsCandidatesPrompt` 함수 바로 뒤에 빌더 추가.

```ts
// PLAN 설계 대화(설계실 2단계) 프롬프트 — 단일 설계 파트너 + 승인형 패치 제안.
// storyx.mjs 의 buildPlanChatPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildPlanChatPrompt(input: PlanChatPromptInput): string {
  const { medium, format, activeSection, contextDigest, catalog, dialogue, query } = input;
  return [
    'Story X PLAN 설계 대화(설계실) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 컨텍스트',
    contextDigest.trim() || '(컨텍스트 없음)',
    '',
    '## 엔티티 카탈로그 (제안은 반드시 아래 실존 id 만 겨냥)',
    catalog.trim() || '(카탈로그 없음)',
    '',
    '## 지금 보는 섹션',
    activeSection.trim() || '(미지정)',
    '',
    '## 최근 대화',
    dialogue.trim() || '(첫 대화)',
    '',
    '## 작가의 말',
    query.trim(),
    '',
    '## 역할',
    '당신은 Story X 설계실의 설계 파트너입니다. 바이블 큐레이터의 성격으로 — 작가의 설계를 대신 정하지 않고, 질문하고 다듬고 제안합니다.',
    '',
    '## 지시',
    '- reply 는 작가의 말에 대한 응답입니다. 짧고 구체적으로, 설계의 빈 곳·모순·기회를 짚습니다.',
    '- proposals 는 0~3개. 바이블 필드의 구체 수정안이 있을 때만 냅니다. 대화만 해도 됩니다.',
    '- 제안은 엔티티 카탈로그의 실존 id 만 겨냥합니다. kind 별 필드 — character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone · world/canon: 필드 없음.',
    '- rationale 에 그 제안의 근거를 한 문장으로 씁니다.',
    '- 결말 헌장은 절대 배신하지 않습니다. 새 인물 추가·헌장 개정은 제안하지 않습니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "reply": "...", "proposals": [{ "kind": "character", "targetId": "...", "field": "desire", "after": "...", "rationale": "..." }]',
    '}'
  ].join('\n');
}
```

- [ ] **Step 4: CLI 미러 + `plan-chat` 커맨드 구현**

`tools/storyx.mjs` ① `buildVsCandidatesPrompt` 함수(~2250행) 바로 뒤에 미러 빌더 추가 — 배열 내용은 Step 3 과 **문자 단위 동일**(방어 처리만 다름).

```js
// PLAN 설계 대화(설계실 2단계) 프롬프트 — src/lib/server/promptBuilders.ts 의 buildPlanChatPrompt 와
// 핵심 지시문 byte-identical 미러 — 변경 시 두 곳 동시 수정.
function buildPlanChatPrompt({ medium, format, activeSection, contextDigest, catalog, dialogue, query }) {
  return [
    'Story X PLAN 설계 대화(설계실) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 작품 컨텍스트',
    (contextDigest || '').trim() || '(컨텍스트 없음)',
    '',
    '## 엔티티 카탈로그 (제안은 반드시 아래 실존 id 만 겨냥)',
    (catalog || '').trim() || '(카탈로그 없음)',
    '',
    '## 지금 보는 섹션',
    (activeSection || '').trim() || '(미지정)',
    '',
    '## 최근 대화',
    (dialogue || '').trim() || '(첫 대화)',
    '',
    '## 작가의 말',
    (query || '').trim(),
    '',
    '## 역할',
    '당신은 Story X 설계실의 설계 파트너입니다. 바이블 큐레이터의 성격으로 — 작가의 설계를 대신 정하지 않고, 질문하고 다듬고 제안합니다.',
    '',
    '## 지시',
    '- reply 는 작가의 말에 대한 응답입니다. 짧고 구체적으로, 설계의 빈 곳·모순·기회를 짚습니다.',
    '- proposals 는 0~3개. 바이블 필드의 구체 수정안이 있을 때만 냅니다. 대화만 해도 됩니다.',
    '- 제안은 엔티티 카탈로그의 실존 id 만 겨냥합니다. kind 별 필드 — character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone · world/canon: 필드 없음.',
    '- rationale 에 그 제안의 근거를 한 문장으로 씁니다.',
    '- 결말 헌장은 절대 배신하지 않습니다. 새 인물 추가·헌장 개정은 제안하지 않습니다.',
    '- 한국어로 씁니다.',
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "reply": "...", "proposals": [{ "kind": "character", "targetId": "...", "field": "desire", "after": "...", "rationale": "..." }]',
    '}'
  ].join('\n');
}
```

② `vs-candidates` 커맨드 블록(`if (command === 'vs-candidates') { … }`, 종료 ~1223행) 바로 뒤에 커맨드 추가.

```js
if (command === 'plan-chat') {
  const provider = readFlag(args, '--provider', 'codex');
  const medium = readFlag(args, '--medium', 'novel');
  const format = readFlag(args, '--format', 'long-novel');
  const section = readFlag(args, '--section', '');
  const context = readFlag(args, '--context', '');
  const catalog = readFlag(args, '--catalog', '');
  const dialogue = readFlag(args, '--dialogue', '');
  const query = readFlag(args, '--query', '');
  const dryRun = args.includes('--dry-run');

  const prompt = buildPlanChatPrompt({ medium, format, activeSection: section, contextDigest: context, catalog, dialogue, query });

  if (dryRun) {
    printJson({ provider, medium, mode: 'plan-chat', dryRun: true, prompt, warning: 'dry-run 모드 — provider 호출 없이 프롬프트만 출력합니다.' });
    process.exit(0);
  }
  if (provider === 'mock') {
    printJson({ provider, medium, mode: 'plan-chat', status: 'complete', reply: '(mock) 설계 파트너 응답', proposals: [] });
    process.exit(0);
  }

  const commandPreview =
    provider === 'claude'
      ? ['claude', '--print', '--output-format', 'text', '--permission-mode', 'dontAsk', prompt]
      : ['codex', 'exec', '--sandbox', 'read-only', '--cd', process.cwd(), '--ephemeral', prompt];

  const { result: providerResult, raw: rawOutput, retried } = runProviderWithRetry(commandPreview);
  const isError = looksLikeProviderError(rawOutput, providerResult);
  const parsed = isError ? null : parseProviderJson(rawOutput);
  const reply = typeof parsed?.reply === 'string' ? parsed.reply : '';
  const proposals = Array.isArray(parsed?.proposals) ? parsed.proposals : [];

  printJson({
    provider,
    medium,
    mode: 'plan-chat',
    status: isError ? 'failed' : 'complete',
    exitCode: providerResult.status,
    reply,
    proposals,
    warning: isError
      ? (retried ? 'provider 호출이 재시도 후에도 실패했습니다.' : 'provider 호출이 실패했습니다.')
      : undefined
  });
  process.exit(isError ? 1 : 0);
}
```

- [ ] **Step 5: 통과 확인 + 미러 grep + dry-run**

Run: `npm test -- src/lib/server/promptBuilders.test.ts` → Expected: PASS 전부.
Run: `grep -cF '실존 id 만 겨냥합니다' src/lib/server/promptBuilders.ts tools/storyx.mjs` → Expected: 두 파일 각 1.
Run: `node tools/storyx.mjs plan-chat --dry-run --medium novel --format long-novel --query "테스트"` → Expected: 프롬프트에 역할·지시·JSON 계약 포함.
Run: `node tools/storyx.mjs plan-chat --provider mock --query "테스트"` → Expected: `status:'complete'`·`reply:'(mock) 설계 파트너 응답'`·`proposals:[]`.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/server/promptBuilders.ts tools/storyx.mjs src/lib/server/promptBuilders.test.ts
git commit -m "feat(plan-chat): 설계 대화 프롬프트+CLI 커맨드 — 미러 byte-identical, [plan-mirror] 핀(계약+지시문)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 배선 — vite 브리지 · prod Function · 클라이언트 · AiCallMode

**Files:**
- Modify: `vite.config.ts` (`storyxBridge('/api/vs-candidates', …)` 항목 바로 뒤, ~245행)
- Create: `api/plan-chat.ts`
- Create: `src/lib/planChatClient.ts`
- Modify: `src/lib/aiStatus.ts:7` (AiCallMode) + `aiCallModeLabel` switch(~81행)
- Test: `src/lib/planChatClient.test.ts` (신규 — vsCandidatesClient.test 관례: 정규화 계약 핀)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/lib/planChatClient.test.ts` 신규 파일 전체.

```ts
import { describe, it, expect } from 'vitest';
import type { SeriesProject } from './storyEngine';
import { buildPlanChatCatalog, normalizePlanChatResponse } from './planChat';

// planChatClient 는 normalizePlanChatResponse(planChat)를 재사용한다 — 정규화 계약을 클라이언트 경로에서 한 번 더 핀.
describe('planChatClient 정규화 계약', () => {
  const project = {
    characters: [{ id: 'c1', name: '리아나', desire: 'a', wound: 'b', currentState: 'c' }],
    worldRules: [], canonFacts: [],
    logline: '', audiencePromise: '', deepQuestion: '', formIntent: '', tone: ''
  } as unknown as SeriesProject;
  const catalog = buildPlanChatCatalog(project);

  it('reply+유효 제안을 턴으로 변환한다', () => {
    const turn = normalizePlanChatResponse(
      { reply: '좋아요', proposals: [{ kind: 'character', targetId: 'c1', field: 'desire', after: 'x', rationale: 'y' }] },
      catalog
    );
    expect(turn?.reply).toBe('좋아요');
    expect(turn?.proposals).toHaveLength(1);
  });
  it('reply 없는 응답은 null', () => {
    expect(normalizePlanChatResponse({ proposals: [] }, catalog)).toBeNull();
  });
});
```

그리고 `src/lib/aiStatus.ts` 의 `aiCallModeLabel` exhaustive switch 가 새 모드를 강제하는지 tsc 로 확인한다(별도 테스트 불필요 — Step 3 후 `npx tsc --noEmit`).

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/planChatClient.test.ts`
Expected: PASS (planChat 재사용이라 이미 녹색 — 이 태스크의 red 는 Step 3 의 tsc: `'plan-chat'` 추가 전에는 클라이언트가 컴파일되지 않음). `src/lib/planChatClient.ts` 를 먼저 만들면 `reportAiCall({ mode: 'plan-chat', … })` 가 타입 에러 — 그것이 red 신호.

- [ ] **Step 3: 구현 4점**

① `src/lib/aiStatus.ts:7` — 유니언 확장.

```ts
export type AiCallMode = 'draft' | 'review' | 'review-agent' | 'review-data' | 'interview' | 'pace-interview' | 'spine-suggest' | 'vs-candidates' | 'plan-chat';
```

`aiCallModeLabel` switch 의 `case 'vs-candidates':` 블록 뒤에 추가.

```ts
    case 'plan-chat':
      return '설계 대화';
```

② `src/lib/planChatClient.ts` 신규 파일 전체.

```ts
// /api/plan-chat 브리지에 설계 대화 턴을 요청하는 클라이언트. vsCandidatesClient 패턴(fetch·failed·reportAiCall).
import { reportAiCall } from './aiStatus';
import { normalizePlanChatResponse, type PlanChatCatalog, type PlanChatTurn } from './planChat';

export interface PlanChatInput {
  medium: string;
  format: string;
  activeSection: string;
  contextDigest: string;
  catalogText: string;
  dialogue: string;
  query: string;
}

export interface PlanChatResult {
  ok: boolean;
  turn?: PlanChatTurn;
  reason?: string;
}

async function _runPlanChat(input: PlanChatInput, catalog: PlanChatCatalog): Promise<PlanChatResult> {
  try {
    const response = await fetch('/api/plan-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})` };
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (data.status === 'failed') {
      const warning = typeof data.warning === 'string' ? data.warning : 'provider 호출 실패';
      return { ok: false, reason: warning };
    }
    const turn = normalizePlanChatResponse(data, catalog);
    if (!turn) {
      return { ok: false, reason: '설계 파트너 응답이 비어 있습니다.' };
    }
    return { ok: true, turn };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/plan-chat 을 호출해 설계 대화 턴을 가져온다. 실패는 전부 ok:false·reason(호출 측이 안내로 강등).
export async function requestPlanChat(input: PlanChatInput, catalog: PlanChatCatalog): Promise<PlanChatResult> {
  const result = await _runPlanChat(input, catalog);
  reportAiCall({ mode: 'plan-chat', ok: result.ok, reason: result.reason });
  return result;
}
```

③ `vite.config.ts` — `storyxBridge('/api/vs-candidates', …)` 항목 바로 뒤에 추가.

```ts
    storyxBridge('/api/plan-chat', (input) => [
      'tools/storyx.mjs',
      'plan-chat',
      '--provider',
      'codex',
      '--medium',
      String(input.medium ?? 'novel'),
      '--format',
      String(input.format ?? 'long-novel'),
      '--section',
      String(input.activeSection ?? ''),
      '--context',
      String(input.contextDigest ?? ''),
      '--catalog',
      String(input.catalogText ?? ''),
      '--dialogue',
      String(input.dialogue ?? ''),
      '--query',
      String(input.query ?? '')
    ]),
```

④ `api/plan-chat.ts` 신규 파일 전체 (vercel.json 변경 불필요 — 파일 시스템 자산 안 읽음).

```ts
// Vercel Function — PLAN 설계 대화(설계실 2단계).
// dev 에서는 vite.config.ts storyxBridge 가 같은 path 를 가로채 storyx.mjs 호출. prod 는 이 함수가 AI SDK 직결.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPlanChatPrompt } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';
import type { CreativeFormat } from '../src/lib/projectBlueprint';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    medium?: string;
    format?: string;
    activeSection?: string;
    contextDigest?: string;
    catalogText?: string;
    dialogue?: string;
    query?: string;
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const prompt = buildPlanChatPrompt({
    medium,
    format,
    activeSection: String(body.activeSection ?? ''),
    contextDigest: String(body.contextDigest ?? ''),
    catalog: String(body.catalogText ?? ''),
    dialogue: String(body.dialogue ?? ''),
    query: String(body.query ?? '')
  });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'plan-chat', status: 'complete', reply: '', proposals: [], warning: result.warning });
    return;
  }

  const reply = typeof result.data?.reply === 'string' ? result.data.reply : '';
  const proposals = Array.isArray(result.data?.proposals) ? result.data.proposals : [];
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'plan-chat',
    status: result.status,
    reply,
    proposals,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx tsc --noEmit` → Expected: 에러 0 (AiCallMode·라벨·클라이언트 전부 정합).
Run: `npm test -- src/lib/planChatClient.test.ts` → Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add vite.config.ts api/plan-chat.ts src/lib/planChatClient.ts src/lib/aiStatus.ts src/lib/planChatClient.test.ts
git commit -m "feat(plan-chat): 6점 배선 완성 — vite 브리지·prod Function·클라이언트·AiCallMode 설계 대화

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `PlanChatPanel` 프레젠테이션 + CSS

**Files:**
- Create: `src/components/PlanChatPanel.tsx`
- Modify: `src/styles.css` (`.fc-pd-health .track i` 규칙 바로 아래, ~9025행)
- Test: `src/components/planChatPanel.test.ts` (신규)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/planChatPanel.test.ts` 신규 파일 전체.

```ts
// PlanChatPanel — 버블·승인형 제안 카드·하네스 미리보기 순수 렌더 검증.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PlanChatPanel, type PlanChatPanelProps } from './PlanChatPanel';
import type { PlanChatMessage } from '../lib/planChat';

function render(over: Partial<PlanChatPanelProps> = {}) {
  return renderToStaticMarkup(
    createElement(PlanChatPanel, {
      messages: [], busy: false, note: null, harnessPreview: null,
      onSend: () => {}, onApproveProposal: () => {},
      ...over
    })
  );
}

const partnerMsg: PlanChatMessage = {
  id: 'm1', role: 'partner', text: '욕망을 좁혀볼까요?',
  proposals: [{ kind: 'character', targetId: 'c1', targetLabel: '리아나', field: 'desire', after: '형의 누명을 벗긴다', rationale: '방어에서 목표로' }]
};

describe('PlanChatPanel', () => {
  it('빈 대화면 안내 문구를 렌더한다', () => {
    expect(render()).toContain('설계 파트너와');
  });
  it('파트너 버블·제안 카드(라벨·근거·승인 버튼)를 렌더한다', () => {
    const html = render({ messages: [partnerMsg] });
    expect(html).toContain('욕망을 좁혀볼까요?');
    expect(html).toContain('리아나');
    expect(html).toContain('욕망');
    expect(html).toContain('형의 누명을 벗긴다');
    expect(html).toContain('방어에서 목표로');
    expect(html).toContain('설계안으로');
  });
  it('approved 제안은 ✓ 상태·비활성', () => {
    const approved = { ...partnerMsg, proposals: [{ ...partnerMsg.proposals![0], approved: true }] };
    const html = render({ messages: [approved] });
    expect(html).toContain('✓ 설계안 (미반영)');
    expect(html).toContain('disabled');
  });
  it('harnessPreview 한 줄을 렌더한다', () => {
    const html = render({ harnessPreview: { before: 71, after: 78, count: 2 } });
    expect(html).toContain('하네스 71 → 78');
    expect(html).toContain('설계안 2건 반영 시');
  });
  it('busy 면 대기 안내·note 면 실패 안내를 렌더한다', () => {
    expect(render({ busy: true })).toContain('수십 초');
    expect(render({ note: '브리지 응답 오류' })).toContain('브리지 응답 오류');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/planChatPanel.test.ts`
Expected: FAIL(컴포넌트 부재).

- [ ] **Step 3: 컴포넌트 구현**

`src/components/PlanChatPanel.tsx` 신규 파일 전체.

```tsx
// PLAN 설계 대화 패널 — 파트너 버블·승인형 제안 카드·하네스 미리보기. 상태·fetch 는 StoryXDesk 소유(프레젠테이션만).
import { useState } from 'react';
import type { PlanChatMessage } from '../lib/planChat';

export interface PlanChatHarnessPreview {
  before: number;
  after: number;
  count: number;
}

export interface PlanChatPanelProps {
  messages: PlanChatMessage[];
  busy: boolean;
  note: string | null;
  harnessPreview: PlanChatHarnessPreview | null;
  onSend: (text: string) => void;
  onApproveProposal: (messageId: string, index: number) => void;
}

const KIND_LABELS: Record<string, string> = {
  character: '인물',
  world: '세계 규칙',
  canon: '캐논',
  'story-core': '스토리 코어'
};

const FIELD_LABELS: Record<string, string> = {
  desire: '욕망',
  wound: '상처',
  currentState: '현재 상태',
  logline: '로그라인',
  audiencePromise: '표면 약속',
  deepQuestion: '심층 질문',
  formIntent: '형식·구조',
  tone: '문체 톤'
};

export function PlanChatPanel({ messages, busy, note, harnessPreview, onSend, onApproveProposal }: PlanChatPanelProps) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    onSend(text);
  };
  return (
    <div className="pcp">
      {harnessPreview && (
        <div className="pcp-harness">
          하네스 {harnessPreview.before} → {harnessPreview.after} · 설계안 {harnessPreview.count}건 반영 시
        </div>
      )}
      {messages.length === 0 && (
        <p className="pcp-empty">설계 파트너와 인물·세계·캐논·스토리 코어를 함께 다듬으세요. 제안을 승인하면 설계안(미반영)으로 쌓입니다.</p>
      )}
      <div className="pcp-log">
        {messages.map((m) => (
          <div key={m.id} className={`pcp-msg is-${m.role}`}>
            <p className="pcp-text">{m.text}</p>
            {m.proposals?.map((p, i) => (
              <div key={i} className={`pcp-prop${p.approved ? ' is-approved' : ''}`}>
                <span className="pcp-prop-kind">
                  {KIND_LABELS[p.kind] ?? p.kind}
                  {p.targetLabel ? ` · ${p.targetLabel}` : ''}
                  {p.field ? ` · ${FIELD_LABELS[p.field] ?? p.field}` : ''}
                </span>
                <span className="pcp-prop-after">{p.after}</span>
                {p.rationale && <span className="pcp-prop-why">{p.rationale}</span>}
                <button
                  type="button"
                  className="pcp-prop-stage"
                  disabled={!!p.approved}
                  onClick={() => onApproveProposal(m.id, i)}
                >
                  {p.approved ? '✓ 설계안 (미반영)' : '설계안으로'}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      {busy && <p className="pcp-busy">파트너가 생각 중… (수십 초 걸릴 수 있어요)</p>}
      {note && <p className="pcp-note">{note}</p>}
      <div className="pcp-input">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="파트너에게 말하기 — 설계 고민을 그대로 적어보세요"
          rows={2}
          disabled={busy}
          aria-label="설계 파트너에게 보낼 말"
        />
        <button type="button" onClick={submit} disabled={busy || !draft.trim()}>보내기</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CSS 추가**

`src/styles.css` — `.fc-pd-health .track i` 규칙 바로 아래 삽입. transition/animation 없음(reduced-motion 블록 무접촉). 중립은 `.fc-app` 스코프 다크 토큰(`--bg-2`·`--rule-soft`·`--ink-dim`·`--paper` — 위 `.fc-pd-*` 규칙들과 동일 관례), 악센트는 전역 `--st-mode-plan`.

```css
/* PLAN 설계 대화 패널(설계실 2단계) — 파트너 버블·승인형 제안 카드. PLAN 모드색 악센트. */
.pcp{display:flex;flex-direction:column;gap:10px}
.pcp-harness{font-size:12px;color:var(--st-mode-plan);border:1px solid color-mix(in srgb, var(--st-mode-plan) 35%, transparent);border-radius:8px;padding:6px 10px}
.pcp-empty{font-size:12px;color:var(--ink-dim);line-height:1.6;margin:0}
.pcp-log{display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:46vh}
.pcp-msg{display:flex;flex-direction:column;gap:6px}
.pcp-msg .pcp-text{margin:0;font-size:13px;line-height:1.55;padding:8px 10px;border-radius:10px;background:var(--bg-2);color:var(--paper)}
.pcp-msg.is-user .pcp-text{background:color-mix(in srgb, var(--st-mode-plan) 14%, transparent);align-self:flex-end;max-width:88%}
.pcp-prop{display:flex;flex-direction:column;gap:3px;border:1px dashed color-mix(in srgb, var(--st-mode-plan) 55%, transparent);border-radius:10px;padding:8px 10px;background:color-mix(in srgb, var(--st-mode-plan) 7%, transparent)}
.pcp-prop.is-approved{border-style:solid;opacity:0.65}
.pcp-prop-kind{font-size:10px;color:var(--st-mode-plan)}
.pcp-prop-after{font-size:13px;color:var(--paper);line-height:1.5}
.pcp-prop-why{font-size:11px;color:var(--ink-dim)}
.pcp-prop-stage{align-self:flex-start;margin-top:3px;font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid color-mix(in srgb, var(--st-mode-plan) 45%, transparent);background:color-mix(in srgb, var(--st-mode-plan) 18%, transparent);color:var(--st-mode-plan);cursor:pointer}
.pcp-prop-stage:disabled{cursor:default;background:var(--bg-2);color:var(--ink-dim);border-color:var(--rule-soft)}
.pcp-busy,.pcp-note{font-size:12px;color:var(--ink-dim);margin:0}
.pcp-input{display:flex;gap:6px}
.pcp-input textarea{flex:1;resize:none;font-size:13px;padding:8px 10px;border-radius:10px;border:1px solid var(--rule-soft);background:var(--bg-2);color:var(--paper)}
.pcp-input textarea:disabled{opacity:0.5}
.pcp-input button{flex:0 0 auto;padding:8px 14px;border-radius:10px;border:1px solid var(--rule-soft);background:var(--bg-2);color:var(--paper);cursor:pointer}
.pcp-input button:disabled{opacity:0.4;cursor:default}
```

- [ ] **Step 5: 통과 확인**

Run: `npm test -- src/components/planChatPanel.test.ts`
Expected: PASS 전부.

- [ ] **Step 6: 커밋**

```bash
git add src/components/PlanChatPanel.tsx src/components/planChatPanel.test.ts src/styles.css
git commit -m "feat(plan-chat): PlanChatPanel 프레젠테이션 — 버블·승인형 제안 카드·하네스 미리보기·PLAN 모드색

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: FloatingDataWorkspace — dock 「✦ 설계」 + design 패널

**Files:**
- Modify: `src/components/FloatingDataWorkspace.tsx` (`DataPanelId`:44 · props:15-35 · dock:163-175 · panels:233-243 뒤)
- Test: `src/components/floatingDataWorkspace.test.ts` (describe 끝)

- [ ] **Step 1: 실패하는 테스트 추가**

`src/components/floatingDataWorkspace.test.ts` — describe 마지막 `it` 뒤에 추가.

```ts
  it('설계 독 버튼이 설계 패널을 열고 designSlot 을 렌더한다', () => {
    const { host, click, unmount } = mount(baseProps({
      designSlot: createElement('div', { 'data-testid': 'design-slot' }, '설계 대화'),
    }));
    const btn = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('설계'));
    expect(btn).not.toBeUndefined();
    click(btn ?? null);
    expect(host.querySelector('#fc-pd-design')?.classList.contains('show')).toBe(true);
    expect(host.querySelector('[data-testid="design-slot"]')).not.toBeNull();
    unmount();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/floatingDataWorkspace.test.ts`
Expected: 신규 1개 FAIL(버튼 부재 — `expect(btn).not.toBeUndefined()` 에서), 기존 7개 PASS. (designSlot prop 부재로 tsc 에러가 먼저 나도 red 신호로 인정.)

- [ ] **Step 3: 구현**

`src/components/FloatingDataWorkspace.tsx` 세 곳.

① `FloatingDataWorkspaceProps`(15-35행) — `metaRightSlot?: ReactNode;` 뒤에 추가.

```ts
  /** 설계실 2단계 — dock 「✦ 설계」 패널 내용(PlanChatPanel). StoryXDesk 가 조립해 주입. */
  designSlot?: ReactNode;
```

② `DataPanelId`(44행) 확장.

```ts
type DataPanelId = 'metrics' | 'review' | 'canon' | 'bible' | 'state' | 'design';
```

③ dock — `상태` 버튼(163-168행)과 `집중` 버튼 사이에 삽입.

```tsx
          <button className={`tool${openPanel === 'design' ? ' on' : ''}`} onClick={() => togglePanel('design')} title="설계 대화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="t">✦ 설계</span>
          </button>
```

④ 패널 — `#fc-pd-state` 패널 블록(233-243행) 바로 뒤에 삽입.

```tsx
      <div className={`panel${openPanel === 'design' ? ' show' : ''}`} id="fc-pd-design">
        <div className="ph"><h4>설계 대화</h4><button className="x" onClick={closeAll}>✕</button></div>
        <div className="pb">{props.designSlot ?? null}</div>
      </div>
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/components/floatingDataWorkspace.test.ts`
Expected: PASS 전부(8개).

- [ ] **Step 5: 커밋**

```bash
git add src/components/FloatingDataWorkspace.tsx src/components/floatingDataWorkspace.test.ts
git commit -m "feat(plan-chat): PLAN dock에 ✦ 설계 패널 — DataPanelId design + designSlot 주입

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: StoryXDesk 배선 — 상태·send·approve·하네스 미리보기·designSlot 조립

**Files:**
- Modify: `src/StoryXDesk.tsx` — ① import ② planPatches 블록 뒤(~1281행) 상태·overlayHarness ③ stage\* 핸들러 뒤(~1680행) send/approve ④ isBibleMode 반환(~2214행) designSlot

큰 파일(소스 단언 테스트 editorFocusLayout.test 가 물고 있음 — 이 태스크는 기존 단언과 충돌하는 삭제가 없어 무접촉). 검증은 tsc+빌드+전체 테스트, 렌더 검증은 Task 9 라이브.

- [ ] **Step 1: import 추가**

파일 상단 import 블록에 추가(기존 import 문 스타일에 맞춰).

```ts
import { buildPlanChatCatalog, buildPlanChatTranscript, type PlanChatMessage } from './lib/planChat';
import { requestPlanChat } from './lib/planChatClient';
import { PlanChatPanel } from './components/PlanChatPanel';
```

`loadPlanChatMessages`·`savePlanChatMessages` 는 기존 `./lib/storage` import 문에 심볼 추가. `runStoryHarness`·`StoryHarnessReport`·`buildProjectContextDigest` 는 이미 import 되어 있다(확인 후 중복 추가 금지).

- [ ] **Step 2: 상태 + 영속 + overlayHarness 추가**

`planStagedKeys` 선언(1281행) 바로 아래 삽입.

```ts
  // PLAN 설계 대화(설계실 2단계) — 버퍼는 localStorage 영속(반영 remount 생존), 제안 승인은 stage* 재사용.
  const [planChatMessages, setPlanChatMessages] = useState<PlanChatMessage[]>(() => loadPlanChatMessages());
  const [planChatBusy, setPlanChatBusy] = useState(false);
  const [planChatNote, setPlanChatNote] = useState<string | null>(null);
  useEffect(() => {
    savePlanChatMessages(planChatMessages);
  }, [planChatMessages]);
  // 설계안 반영 시 하네스 미리보기 — overlayProject 재채점. qualityGatesReport 는 committed 재사용(spec §2.4 명시 결정).
  const overlayHarnessReport: StoryHarnessReport = useMemo(
    () =>
      runStoryHarness({
        medium: blueprint.medium,
        formatLabel: blueprint.formatLabel,
        material: overlayProject.logline || '',
        storySeed: overlayProject.deepQuestion || overlayProject.audiencePromise || '',
        characterSeed: overlayProject.characters[0]
          ? `${overlayProject.characters[0].name}: ${overlayProject.characters[0].desire}`
          : '',
        audience: overlayProject.audiencePromise || '',
        constraints: blueprint.formatLabel || '',
        canonFacts: overlayProject.canonFacts,
        qualityGatesReport,
        chapters: overlayProject.chapters
      }),
    [blueprint.medium, blueprint.formatLabel, overlayProject, qualityGatesReport]
  );
```

- [ ] **Step 3: send·approve 핸들러 추가**

`stageCreativeWeight` 함수(~1679행) 바로 아래 삽입. medium/format 소스는 페이스 인터뷰 핸들러(askShowrunnerPace)와 동일한 `blueprint.medium`·`blueprint.format` 을 쓴다(다르면 그 핸들러의 실제 소스에 맞춘다).

```ts
  // 설계 대화 — 사용자 발화 시에만 LLM 1콜. 컨텍스트·카탈로그는 overlayProject(현 설계안 반영 상태) 기준.
  async function sendPlanChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed || planChatBusy) return;
    const userMsg: PlanChatMessage = { id: `pc-${Date.now()}`, role: 'user', text: trimmed };
    const next = [...planChatMessages, userMsg];
    setPlanChatMessages(next);
    setPlanChatBusy(true);
    setPlanChatNote(null);
    const catalog = buildPlanChatCatalog(overlayProject);
    const result = await requestPlanChat(
      {
        medium: blueprint.medium,
        format: blueprint.format,
        activeSection:
          dataView.kind === 'bible' ? dataView.section : dataView.kind === 'canon' ? dataView.category : 'board',
        contextDigest: buildProjectContextDigest(overlayProject),
        catalogText: catalog.text,
        dialogue: buildPlanChatTranscript(next),
        query: trimmed
      },
      catalog
    );
    if (result.ok && result.turn) {
      const partnerMsg: PlanChatMessage = {
        id: `pc-${Date.now()}-p`,
        role: 'partner',
        text: result.turn.reply,
        ...(result.turn.proposals.length > 0 ? { proposals: result.turn.proposals } : {})
      };
      setPlanChatMessages((prev) => [...prev, partnerMsg]);
    } else {
      setPlanChatNote(result.reason ?? '설계 파트너 응답 실패');
    }
    setPlanChatBusy(false);
  }

  // 제안 승인 — 기존 stage* 핸들러 재사용(upsert 불변식·D6 자동 상속). 'title' 은 normalize 가 이미 드랍.
  function approvePlanProposal(messageId: string, index: number) {
    const message = planChatMessages.find((m) => m.id === messageId);
    const proposal = message?.proposals?.[index];
    if (!message || !proposal || proposal.approved) return;
    if (proposal.kind === 'character' && proposal.targetId && proposal.field) {
      stageCharacterMemory(proposal.targetId, proposal.field as 'desire' | 'wound' | 'currentState', proposal.after);
    } else if (proposal.kind === 'world' && proposal.targetId) {
      stageWorldMemory(proposal.targetId, proposal.after);
    } else if (proposal.kind === 'canon' && proposal.targetId) {
      stageCanonMemory(proposal.targetId, proposal.after);
    } else if (proposal.kind === 'story-core' && proposal.field) {
      stageStoryCore(
        proposal.field as 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone',
        proposal.after
      );
    } else {
      return;
    }
    setPlanChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, proposals: m.proposals?.map((p, i) => (i === index ? { ...p, approved: true } : p)) }
          : m
      )
    );
  }
```

- [ ] **Step 4: designSlot 조립 + FloatingDataWorkspace 전달**

`isBibleMode` 분기의 `return` 직전(centerSlot 선언 뒤)에 슬롯 조립을 추가하고, `<FloatingDataWorkspace …>` props 에 `designSlot={planChatSlot}` 을 추가.

```tsx
    const planChatSlot = (
      <PlanChatPanel
        messages={planChatMessages}
        busy={planChatBusy}
        note={planChatNote}
        harnessPreview={
          planPatches.length > 0
            ? {
                before: harnessReport.qualityScore,
                after: overlayHarnessReport.qualityScore,
                count: planPatches.length
              }
            : null
        }
        onSend={sendPlanChat}
        onApproveProposal={approvePlanProposal}
      />
    );
```

```tsx
          centerSlot={centerSlot}
          designSlot={planChatSlot}
```

- [ ] **Step 5: 전체 확인**

Run: `npx tsc --noEmit` → Expected: 에러 0.
Run: `npm test` → Expected: 전체 PASS.
Run: `npm run build` → Expected: 성공.

- [ ] **Step 6: 커밋**

```bash
git add src/StoryXDesk.tsx
git commit -m "feat(plan-chat): StoryXDesk 배선 — 설계 대화 상태·승인=stage* 재사용·하네스 미리보기·designSlot

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: clear+remount 회귀 테스트 (PR #20 잔여 MEDIUM)

**Files:**
- Test: `src/lib/planStageRemount.test.ts` (신규)

- [ ] **Step 1: 회귀 테스트 작성**

StoryXDesk 전체 마운트는 무거워, **동일한 effect 배선(useState(load) + save effect)을 재현한 축소 하네스**로 App 의 버리기 시퀀스를 핀 박는다.

```ts
// PR #20 잔여 MEDIUM — clear+remount 불변식 자동 회귀.
// 버리기(clearPlanPatches) 후 옛 인스턴스가 스테일 패치를 재저장하지 않고, remount 인스턴스는 빈 패치로 시작한다.
// StoryXDesk 의 planPatches 배선(useState(loadPlanPatches) + savePlanPatches effect)과 동일 형태의 축소 하네스.
import { describe, expect, it } from 'vitest';
import { act, createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PlanPatch } from './planStage';
import { clearPlanPatches, loadPlanPatches, savePlanPatches } from './storage';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PATCH: PlanPatch = { kind: 'story-core', field: 'logline', label: '로그라인', before: 'a', after: 'b' };

let exposedStage: ((patch: PlanPatch) => void) | null = null;

function Harness() {
  const [patches, setPatches] = useState<PlanPatch[]>(() => loadPlanPatches());
  useEffect(() => {
    savePlanPatches(patches);
  }, [patches]);
  exposedStage = (patch) => setPatches((prev) => [...prev, patch]);
  return createElement('div', { 'data-count': String(patches.length) });
}

describe('PLAN staged clear+remount 회귀 (PR #20 MEDIUM)', () => {
  it('버리기 후 옛 인스턴스 재렌더·unmount 를 거쳐도 스테일 패치가 재저장되지 않는다', () => {
    clearPlanPatches();
    const host = document.createElement('div');
    document.body.appendChild(host);

    // 1) 옛 인스턴스 — 패치 1건 staged → 영속 확인
    const root = createRoot(host);
    act(() => { root.render(createElement(Harness)); });
    act(() => { exposedStage?.(PATCH); });
    expect(loadPlanPatches()).toHaveLength(1);

    // 2) App discardPlanStage 시퀀스 — clear 후 옛 인스턴스가 state 무변경 재렌더를 겪어도 재저장 없음
    clearPlanPatches();
    act(() => { root.render(createElement(Harness)); });
    expect(loadPlanPatches()).toHaveLength(0);

    // 3) 옛 인스턴스 unmount → 새 인스턴스 mount(remount) — 빈 패치로 시작, storage 도 빈 상태 유지
    act(() => { root.unmount(); });
    expect(loadPlanPatches()).toHaveLength(0);
    const root2 = createRoot(host);
    act(() => { root2.render(createElement(Harness)); });
    expect(loadPlanPatches()).toHaveLength(0);
    expect(host.querySelector('div')?.getAttribute('data-count')).toBe('0');

    act(() => { root2.unmount(); });
    host.remove();
    clearPlanPatches();
  });
});
```

- [ ] **Step 2: 통과 확인 (이 태스크는 현행 동작의 핀 — red 없이 green 이 정상)**

Run: `npm test -- src/lib/planStageRemount.test.ts`
Expected: PASS. (만약 FAIL 하면 그것이 실제 버그 발견 — 즉시 보고하고 멈춘다.)

변이 확인(핀 강제력): `Harness` 의 `useState(() => loadPlanPatches())` 를 `useState<PlanPatch[]>([PATCH])` 로 잠깐 바꾸면 3) 단계가 FAIL 하는지 확인 후 되돌린다(되돌림 후 재실행 green).

- [ ] **Step 3: 커밋**

```bash
git add src/lib/planStageRemount.test.ts
git commit -m "test(plan): clear+remount 불변식 자동 회귀 — PR #20 잔여 MEDIUM 해소(축소 하네스)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 전체 검증 — init.sh + 라이브 (spec §6 DoD) + progress.md

**Files:**
- Modify: `progress.md` (새 완료 트랙 절 + 최근 검증)
- (검증만, 코드 무변경)

- [ ] **Step 1: 하네스 전체 녹색**

Run: `bash init.sh`
Expected: tsc · vitest 전체 · vite build 통과.

- [ ] **Step 2: 라이브 검증 (preview 5175, ch23 백업)**

preview_start(launch.json `story-x`) → 백업 주입(스니펫 `docs/handoff/2026-06-11-demo-video-kit.md`) → `?stage=editor` 진입 후 상단 토글로 PLAN 전환.

1. dock 「✦ 설계」 버튼 → `#fc-pd-design` 패널 렌더·PlanChatPanel 안내 문구.
2. 입력에 설계 고민(예: "주인공 욕망이 밋밋해. 2막을 조여줘") → 보내기 → 실 codex 응답 reply 버블(수십 초, React 클릭 안 먹으면 `dispatchEvent(new MouseEvent('click',{bubbles:true}))` — textarea 는 `preview_fill` 유효).
3. 제안 카드 도착 시 「설계안으로」 클릭 → ⓐ 카드 ✓ 전환 ⓑ 워크벤치 해당 필드 「설계안 (미반영)」 태그 ⓒ SyncConsole 「✦ PLAN +N」 배지 증가 ⓓ 하네스 미리보기 줄 등장(`preview_inspect`로 `.pcp-harness` 실측).
4. 반영(⟳ 또는 PLAN 메뉴) → remount 후 「✦ 설계」 다시 열어 대화 버퍼 생존 확인.
5. `preview_console_logs` 에러 0.
6. 제안이 안 오는 턴(대화만)도 정상 — reply 버블만 추가.

- [ ] **Step 3: progress.md 갱신 + 커밋**

progress.md 상단에 완료 트랙 절 추가(구현·불변식·검증 증거·라이브 게이트) + '최근 검증' 갱신.

```bash
git add progress.md
git commit -m "docs: PLAN 설계 대화 채널 검증 기록 — init.sh·라이브 게이트

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
