# 온보딩 소재발굴 S2 — onboard-chat 엔진 + 「함께 구상」 갈래 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「준비 중」 비활성이던 「함께 구상」 갈래를 onboard-chat 대화 엔진(plan-chat 정본 미러, 카탈로그 없음)으로 활성화 — 구상 파트너와 채팅으로 소재를 캐다가 하이브리드 트리거(LLM 자발 제안 + 「이걸로 시작」 강제 응결)로 DiveSetup 응결 → 기존 playseed 확인 카드 → dive 진입.

**Architecture:** plan-chat 6층 미러(순수 모듈·클라이언트·프롬프트 정본+CLI 미러·dev 브리지·**prod Function**·영속) — 단 카탈로그 그라운딩 없음(프로젝트 미존재). transcript 는 OnboardingDraft 통합 영속(clearOnboardingDraft 가 클리어 공짜 처리). playseed 진입원 분기(playSeedEntry) 신설.

**Tech Stack:** React + TypeScript + Vitest(renderToStaticMarkup + 소스 핀) + storyx.mjs CLI(codex provider).

**Spec:** `docs/superpowers/specs/2026-07-12-onboard-chat-ideate-design.md`

---

## 배경 지식 (제로 컨텍스트 요약)

- **정본 선례 = plan-chat.** 태스크마다 대응 파일을 먼저 읽고 미러하라 — `src/lib/planChat.ts`(순수)·`src/lib/planChatClient.ts`(클라이언트)·`src/lib/server/promptBuilders.ts:663-702`(프롬프트 정본)·`tools/storyx.mjs` plan-chat 커맨드(~:1225)와 미러 빌더(~:2303)·`api/plan-chat.ts`(prod)·`vite.config.ts` plan-chat 브리지(~:245).
- onboard-chat 이 plan-chat 과 다른 점 — ① 카탈로그·contextDigest·activeSection 없음(빈 온보딩) ② proposals 대신 **optional setup 하나**(DiveSetup) ③ `condense` boolean 플래그(강제 응결 지시) ④ 영속이 localStorage 별도 키가 아니라 **OnboardingDraft 통합**.
- 온보딩은 `src/App.tsx` `StoryXHome`. 스텝 = `homeFlowStep` 상태, 패널은 `.hx-track` 가로 슬라이드(`translateX(-${homeFlowIndex*100}%)`). **mount 된 패널의 DOM 순서 인덱스 = homeFlowIndex.** 갈래 패널(freewrite/preset/ideate)은 상호배타 조건부 mount 로 source 다음 슬롯 공유.
- `HomeFlowStep` = `src/lib/projectBlueprint.ts:77`. **`isHomeFlowStep`(storage.ts:606)에 안 넣으면 새로고침 복원이 medium 롤백.**
- `appExperience.test.ts` 는 App.tsx **소스 문자열** 핀 테스트. 핀 교체는 의도적 계약 변경(약화 아님).
- 홈 CSS 는 라이트 `--nx-*` 토큰. **신규 버튼은 `color: var(--nx-ink)` 명시 필수**(다크 홈 UA 검정 상속 비가시 — S1 라이브 발견).
- 테스트 실행 `npx vitest run <파일>` · 전체 게이트 `bash init.sh`.
- 커밋은 **변경 파일만 명시적으로 add**(git add -A 금지).

---

### Task 1: parseDiveSetup 도메인 승격 (준비 리팩)

**Files:**
- Modify: `src/lib/diveProposal.ts` (parseDiveSetup 이식·export)
- Modify: `src/lib/storage.ts:368-389` (로컬 정의 삭제·재import)
- Test: `src/lib/diveProposal.test.ts` (기존 파일에 추가 — 없으면 신규)

- [ ] **Step 1: Write the failing test** — `diveProposal.test.ts` 에 추가

```ts
describe('parseDiveSetup', () => {
  it('유효 setup 은 통과하고 누락 옵션 필드는 백필된다', () => {
    const parsed = parseDiveSetup({ scene: '장면', cast: [{ name: '가온' }], myRole: '행인' });
    expect(parsed).toEqual({
      scene: '장면',
      cast: [{ name: '가온', role: '', desire: '', wound: '', voiceRules: [] }],
      myRole: '행인'
    });
  });

  it('손상 shape 은 all-or-nothing 으로 null 강등된다', () => {
    const broken: unknown[] = [
      null,
      {},
      { scene: '장면', myRole: '' },                        // cast 없음
      { scene: '장면', cast: [], myRole: '' },              // cast 빈 배열
      { scene: '장면', cast: [{ role: 'r' }], myRole: '' }, // name 없음
      { scene: '장면', cast: [{ name: '  ' }], myRole: '' },// name 공백
      { scene: 7, cast: [{ name: 'a' }], myRole: '' }       // scene 비문자열
    ];
    for (const bad of broken) expect(parseDiveSetup(bad)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — `npx vitest run src/lib/diveProposal.test.ts` → FAIL(export 없음)
- [ ] **Step 3: Implementation** — storage.ts:368-389 의 `parseDiveSetup` 본문과 주석 블록(368-370)을 **그대로**(재작성 금지) diveProposal.ts 로 옮기고 `export` 부여. `isRecord` 는 diveProposal 에 없으므로 로컬 헬퍼(`typeof value === 'object' && value !== null && !Array.isArray(value)`)로 함께 이식. storage.ts 는 정의를 지우고 `import { parseDiveSetup }` 추가(기존 `DiveSetup` import 군에 합류).
- [ ] **Step 4: Run** — `npx vitest run src/lib/diveProposal.test.ts src/lib/storage.test.ts && npx tsc --noEmit` → PASS(storage 기존 playSetup 가드 핀 무회귀)
- [ ] **Step 5: Commit** — `git add src/lib/diveProposal.ts src/lib/diveProposal.test.ts src/lib/storage.ts` · `refactor(dive): parseDiveSetup 을 DiveSetup 도메인 홈으로 승격 — onboard-chat 응결 검증 재사용 준비`

---

### Task 2: onboardChat.ts 순수 모듈

**Files:**
- Create: `src/lib/onboardChat.ts`
- Test: `src/lib/onboardChat.test.ts`

- [ ] **Step 1: Write the failing test** — 전체 내용

```ts
// 온보딩 구상 대화 순수 모듈 계약 — transcript 재조립·응결 setup 정규화
import { describe, expect, it } from 'vitest';
import {
  ONBOARD_CHAT_TRANSCRIPT_LIMIT,
  buildOnboardChatTranscript,
  normalizeOnboardChatResponse,
  type OnboardChatMessage
} from './onboardChat';

const msg = (role: 'user' | 'partner', text: string): OnboardChatMessage => ({
  id: `m-${text}`,
  role,
  text
});

describe('buildOnboardChatTranscript', () => {
  it('작가/파트너 라벨로 직렬화한다', () => {
    const out = buildOnboardChatTranscript([msg('user', '심야 세탁소 얘기'), msg('partner', '누가 오나요?')]);
    expect(out).toBe('작가: 심야 세탁소 얘기\n파트너: 누가 오나요?');
  });

  it('기본 limit(8) 초과분은 앞에서 절단한다', () => {
    const many = Array.from({ length: 12 }, (_, i) => msg('user', `t${i}`));
    const out = buildOnboardChatTranscript(many);
    expect(out.split('\n')).toHaveLength(ONBOARD_CHAT_TRANSCRIPT_LIMIT);
    expect(out.startsWith('작가: t4')).toBe(true);
  });
});

describe('normalizeOnboardChatResponse', () => {
  const validSetup = { scene: '골목 세탁소', cast: [{ name: '노인' }], myRole: '단골' };

  it('reply 가 비면 턴 실패(null)다', () => {
    expect(normalizeOnboardChatResponse({ reply: '  ' })).toBeNull();
    expect(normalizeOnboardChatResponse('문자열')).toBeNull();
    expect(normalizeOnboardChatResponse(null)).toBeNull();
  });

  it('setup 없는 대화 턴은 setup null 로 통과한다', () => {
    expect(normalizeOnboardChatResponse({ reply: '어떤 인물이 떠오르나요?' })).toEqual({
      reply: '어떤 인물이 떠오르나요?',
      setup: null
    });
  });

  it('유효 setup 은 shape 가드(백필 포함)를 거쳐 실린다', () => {
    const turn = normalizeOnboardChatResponse({ reply: '이 정도면 시작해볼까요?', setup: validSetup });
    expect(turn?.setup).toEqual({
      scene: '골목 세탁소',
      cast: [{ name: '노인', role: '', desire: '', wound: '', voiceRules: [] }],
      myRole: '단골'
    });
  });

  it('손상 setup 은 setup 만 조용히 강등하고 reply 는 살린다', () => {
    const turn = normalizeOnboardChatResponse({ reply: '응답', setup: { scene: '장면', cast: [], myRole: '' } });
    expect(turn).toEqual({ reply: '응답', setup: null });
  });
});
```

- [ ] **Step 2: Run to verify FAIL** — 모듈 없음
- [ ] **Step 3: Implementation** — `src/lib/onboardChat.ts` 전체

```ts
// 온보딩 구상 대화(함께 구상) — transcript 재조립·응결 setup 정규화 순수 모듈. plan-chat(planChat.ts) 미러, 카탈로그 없음. spec 2026-07-12.
import { parseDiveSetup, type DiveSetup } from './diveProposal';

export type OnboardChatRole = 'user' | 'partner';

export interface OnboardChatMessage {
  id: string;
  role: OnboardChatRole;
  text: string;
  setup?: DiveSetup; // 응결 시드 카드 — partner 메시지에만 실린다
}

export interface OnboardChatTurn {
  reply: string;
  setup: DiveSetup | null;
}

export const ONBOARD_CHAT_TRANSCRIPT_LIMIT = 8; // plan-chat TRANSCRIPT_LIMIT 미러
export const ONBOARD_CHAT_MAX_MESSAGES = 40; // plan-chat PLAN_CHAT_MAX_MESSAGES 미러 — OnboardingDraft cap

export function buildOnboardChatTranscript(messages: OnboardChatMessage[], limit = ONBOARD_CHAT_TRANSCRIPT_LIMIT): string {
  return messages
    .slice(-limit)
    .map((m) => `${m.role === 'user' ? '작가' : '파트너'}: ${m.text}`)
    .join('\n');
}

// provider 응답({ reply, setup? })을 정규화 — reply 비면 턴 실패(null), 손상 setup 은 setup 만 조용히 강등(무효 제안 드랍 관례).
export function normalizeOnboardChatResponse(raw: unknown): OnboardChatTurn | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const reply = typeof record.reply === 'string' ? record.reply.trim() : '';
  if (!reply) return null;
  return { reply, setup: parseDiveSetup(record.setup) };
}
```

- [ ] **Step 4: Run to verify PASS**
- [ ] **Step 5: Commit** — `git add src/lib/onboardChat.ts src/lib/onboardChat.test.ts` · `feat(onboard-chat): 구상 대화 순수 모듈 — transcript·응결 setup 정규화 (plan-chat 미러)`

---

### Task 3: 프롬프트 정본 + storyx.mjs 미러·커맨드 + [onboard-mirror] 핀

**Files:**
- Modify: `src/lib/server/promptBuilders.ts` (입력 타입 + buildOnboardChatPrompt — buildPlanChatPrompt 뒤)
- Modify: `tools/storyx.mjs` (onboard-chat 커맨드 + 미러 빌더 + usage)
- Test: `src/lib/server/promptBuilders.test.ts` (기존 [plan-mirror] 블록 뒤에 추가)

- [ ] **Step 1: Write the failing test** — [plan-mirror] 블록(:432-454)을 먼저 읽고 동형으로 추가

```ts
describe('buildOnboardChatPrompt', () => {
  const ONBOARD_CHAT_JSON_CONTRACT =
    '  "reply": "...", "setup": { "scene": "...", "cast": [{ "name": "...", "role": "...", "desire": "...", "wound": "...", "voiceRules": ["..."] }], "myRole": "..." }';
  const ONBOARD_CHAT_RIPENESS_INSTRUCTION =
    '- setup 은 소재가 무르익었을 때만 포함합니다 — 상대 인물, 첫 장면, 작가가 연기할 역할이 대화에서 잡혔을 때. 아직이면 setup 필드를 넣지 않습니다.';
  const ONBOARD_CHAT_CONDENSE_INSTRUCTION =
    '- 작가가 이 소재로 시작하기로 했습니다. 이번 턴에는 reply 를 한 문장으로 짧게 하고, 지금까지 나온 재료를 응결한 setup 을 반드시 포함합니다.';

  const baseInput = {
    medium: 'novel',
    format: 'long-novel' as CreativeFormat,
    freewrite: '심야에만 여는 세탁소',
    dialogue: '작가: 세탁소 얘기',
    query: '노인이 주인이면 어때?',
    condense: false
  };

  it('구상 파트너 역할·시드 섹션·응결 조건·JSON 계약을 담는다', () => {
    const prompt = buildOnboardChatPrompt(baseInput);
    expect(prompt).toContain('구상 파트너');
    expect(prompt).toContain('아직 작품이 없습니다');
    expect(prompt).toContain('## 먼저 적어둔 자유 서술');
    expect(prompt).toContain('심야에만 여는 세탁소');
    expect(prompt).toContain(ONBOARD_CHAT_RIPENESS_INSTRUCTION);
    expect(prompt).toContain('myRole 에만');
    expect(prompt).toContain(ONBOARD_CHAT_JSON_CONTRACT);
    expect(prompt).not.toContain(ONBOARD_CHAT_CONDENSE_INSTRUCTION);
  });

  it('condense=true 면 강제 응결 지시가 삽입된다', () => {
    const prompt = buildOnboardChatPrompt({ ...baseInput, condense: true });
    expect(prompt).toContain(ONBOARD_CHAT_CONDENSE_INSTRUCTION);
  });

  it('[onboard-mirror] storyx.mjs 미러가 계약·응결 조건·condense 지시와 byte-identical 이다', () => {
    const cli = readFileSync(resolvePath(process.cwd(), 'tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(ONBOARD_CHAT_JSON_CONTRACT);
    expect(cli).toContain(ONBOARD_CHAT_RIPENESS_INSTRUCTION);
    expect(cli).toContain(ONBOARD_CHAT_CONDENSE_INSTRUCTION);
  });
});
```

(readFileSync/resolvePath import 는 기존 [plan-mirror] 테스트가 쓰는 것 재사용. `CreativeFormat` import 확인.)

- [ ] **Step 2: Run to verify FAIL**
- [ ] **Step 3: Implementation**

① `promptBuilders.ts` — 타입 군(:41 근처 PlanChatPromptInput 옆)에 추가

```ts
export interface OnboardChatPromptInput {
  medium: string;
  format: CreativeFormat;
  freewrite: string;
  dialogue: string;
  query: string;
  condense: boolean;
}
```

② `buildPlanChatPrompt`(:702) 뒤에 정본 — **아래 문자열 그대로(재작성 금지)**

```ts
// 온보딩 구상 대화(함께 구상) 프롬프트 — 단일 구상 파트너 + 하이브리드 응결(자발 제안·강제 지시).
// storyx.mjs 의 buildOnboardChatPrompt 와 핵심 지시문 byte-identical 유지 — 변경 시 두 곳 동시 수정.
export function buildOnboardChatPrompt(input: OnboardChatPromptInput): string {
  const { medium, format, freewrite, dialogue, query, condense } = input;
  return [
    'Story X 온보딩 구상 대화(함께 구상) 요청.',
    `매체: ${medium} / 포맷: ${format}`,
    '',
    '## 먼저 적어둔 자유 서술 (있으면 소재의 씨앗)',
    freewrite.trim() || '(없음)',
    '',
    '## 최근 대화',
    dialogue.trim() || '(첫 대화)',
    '',
    '## 작가의 말',
    query.trim(),
    '',
    '## 역할',
    '당신은 Story X 온보딩의 구상 파트너입니다. 작가는 아직 작품이 없습니다 — 수다 떨듯 소재를 함께 캐고, 인물과 장면이 잡히면 플레이 시드를 제안합니다.',
    '',
    '## 지시',
    '- reply 는 작가의 말에 대한 응답입니다. 짧고 구체적으로 — 한 턴에 질문은 하나만, 작가가 낸 재료를 되받아 넓힙니다.',
    '- setup 은 소재가 무르익었을 때만 포함합니다 — 상대 인물, 첫 장면, 작가가 연기할 역할이 대화에서 잡혔을 때. 아직이면 setup 필드를 넣지 않습니다.',
    '- setup.cast 는 상대 인물 1~3명 — name·role·desire·wound·voiceRules 를 대화에 나온 재료로 채웁니다. 작가 자신의 역할은 cast 에 넣지 않고 myRole 에만 씁니다.',
    '- setup.scene 은 플레이가 시작될 첫 장면 한 단락, setup.myRole 은 작가가 연기할 주인공의 입장 한 줄입니다.',
    '- 대화에 없는 설정을 지어내지 않습니다. 빈 곳은 대화에서 나온 재료의 자연스러운 구체화로만 채웁니다.',
    '- 한국어로 씁니다.',
    ...(condense
      ? ['- 작가가 이 소재로 시작하기로 했습니다. 이번 턴에는 reply 를 한 문장으로 짧게 하고, 지금까지 나온 재료를 응결한 setup 을 반드시 포함합니다.']
      : []),
    '',
    '## 출력 형식 — 아래 JSON 객체 하나만 출력하세요. 코드펜스나 다른 텍스트 금지.',
    '{',
    '  "reply": "...", "setup": { "scene": "...", "cast": [{ "name": "...", "role": "...", "desire": "...", "wound": "...", "voiceRules": ["..."] }], "myRole": "..." }',
    '}'
  ].join('\n');
}
```

③ `tools/storyx.mjs` — plan-chat 미러 빌더(~:2303-2339)를 먼저 읽고, 그 **뒤**에 `buildOnboardChatPrompt` 미러를 추가(위 ②의 배열 문자열과 byte-identical, TS 구조분해만 JS `(input.x || '').trim()` 널 가드로 — plan-chat 미러의 변환 관례 그대로. `...(condense ? [...] : [])` 스프레드도 동일 구조 유지). 동시 갱신 주석 동반.

④ `tools/storyx.mjs` — plan-chat 커맨드 블록(~:1225-1271)을 먼저 읽고 동형으로 `onboard-chat` 커맨드 추가

- 플래그 — `--provider`(기본 codex)·`--medium`·`--format`·`--freewrite`·`--dialogue`·`--query`·`--dry-run` 은 readFlag, **`--condense` 는 존재 플래그**(`args.includes('--condense')`).
- `--dry-run` 은 프롬프트만 출력.
- **mock provider** — `--condense` 면 `{ reply: '좋아요, 이 소재로 시작해요.', setup: { scene: '목업 첫 장면 — 심야 세탁소 카운터.', cast: [{ name: '목업 상대', role: '주인', desire: '가게를 지키고 싶다', wound: '잃어버린 단골', voiceRules: ['짧게 말한다'] }], myRole: '단골 손님' } }`, 아니면 `{ reply: '그 소재에서 누가 제일 먼저 떠오르나요?', setup: null }`.
- 실 provider — `runProviderWithRetry` → `parseProviderJson` → 출력 `{ provider, medium, mode: 'onboard-chat', status, exitCode, reply, setup: parsed?.setup ?? null, warning? }` (엄격 검증은 클라이언트 normalize 몫 — plan-chat proposals 얕은 통과 관례).
- usage 배열에 onboard-chat 한 줄 추가.

- [ ] **Step 4: Run** — `npx vitest run src/lib/server/promptBuilders.test.ts` PASS + 수동 스모크 `node tools/storyx.mjs onboard-chat --provider mock --query "테스트" --condense` (setup 포함 JSON) · `--dry-run` (프롬프트 출력).
- [ ] **Step 5: Commit** — `git add src/lib/server/promptBuilders.ts src/lib/server/promptBuilders.test.ts tools/storyx.mjs` · `feat(onboard-chat): 구상 대화 프롬프트 정본 + storyx.mjs 미러·커맨드 — [onboard-mirror] 핀`

---

### Task 4: 클라이언트 + aiStatus + dev 브리지 + prod Function

**Files:**
- Create: `src/lib/onboardChatClient.ts` · `api/onboard-chat.ts`
- Modify: `src/lib/aiStatus.ts`(유니온+라벨) · `vite.config.ts`(브리지)
- Test: `src/lib/onboardChatClient.test.ts`

- [ ] **Step 1: Write the failing test** — planChatClient.test.ts 를 먼저 읽고 동형(normalize 재사용 계약 핀)

```ts
// onboard-chat 클라이언트 계약 — 응답 정규화 재사용 핀(planChatClient 관례)
import { describe, expect, it } from 'vitest';
import { normalizeOnboardChatResponse } from './onboardChat';

describe('onboardChatClient 정규화 계약', () => {
  it('클라이언트가 재사용하는 normalize 는 유효 setup 을 통과시킨다', () => {
    const turn = normalizeOnboardChatResponse({
      reply: '시작해볼까요?',
      setup: { scene: '장면', cast: [{ name: '상대' }], myRole: '나' }
    });
    expect(turn?.setup?.cast[0]?.name).toBe('상대');
  });

  it('reply 없는 응답은 턴 실패로 강등된다', () => {
    expect(normalizeOnboardChatResponse({ setup: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify** — 이 테스트는 Task 2 산출로 이미 통과 가능 — 클라이언트 파일 생성 후 `npx tsc --noEmit` 이 실질 게이트.
- [ ] **Step 3: Implementation**

① `src/lib/onboardChatClient.ts` — planChatClient.ts 를 읽고 미러. 입력 `OnboardChatInput { medium, format, freewrite, dialogue, query, condense }` → `POST /api/onboard-chat`. 실패 전 경로 `{ok:false, reason}` 강등(!response.ok / status==='failed' → warning / normalize null → '응답이 비어 있습니다' / catch → 연결 오류), 성공은 `normalizeOnboardChatResponse` 재통과 후 `{ok:true, turn}`. 래퍼 `requestOnboardChat` 이 `reportAiCall({ mode: 'onboard-chat', ok, reason })`.

② `src/lib/aiStatus.ts` — `AiCallMode` 유니온(:7)에 `'onboard-chat'`, 라벨 switch(:83 근처)에 `'구상 대화'`.

③ `vite.config.ts` — plan-chat 브리지 등록 블록 뒤에

```ts
storyxBridge('/api/onboard-chat', (input) => [
  'tools/storyx.mjs', 'onboard-chat', '--provider', 'codex',
  '--medium', String(input.medium ?? 'novel'),
  '--format', String(input.format ?? 'long-novel'),
  '--freewrite', String(input.freewrite ?? ''),
  '--dialogue', String(input.dialogue ?? ''),
  '--query', String(input.query ?? ''),
  ...(input.condense ? ['--condense'] : [])
]),
```

(등록 위치·형식은 기존 plan-chat 항목과 동일 패턴 — 파일을 읽고 확정.)

④ `api/onboard-chat.ts` — api/plan-chat.ts 를 읽고 미러. body 에서 `condense: Boolean(body.condense)`, `buildOnboardChatPrompt` import(정본), `runLlmJson`, mock 강등 `{ provider:'mock', medium, mode:'onboard-chat', status:'complete', reply:'', setup:null, warning }`, 정상 응답 `{ provider, medium, mode:'onboard-chat', status, reply, setup: data?.setup ?? null, warning? }`. 파일 첫 줄 한국어 헤더 주석.

- [ ] **Step 4: Run** — `npx vitest run src/lib/onboardChatClient.test.ts && npx tsc --noEmit`
- [ ] **Step 5: Commit** — `git add src/lib/onboardChatClient.ts src/lib/onboardChatClient.test.ts src/lib/aiStatus.ts vite.config.ts api/onboard-chat.ts` · `feat(onboard-chat): 클라이언트·aiStatus·dev 브리지 + prod Function — dive-* prod 누락 반복 금지`

---

### Task 5: 영속 — OnboardingDraft 확장 + HomeFlowStep 'ideate'

**Files:**
- Modify: `src/lib/projectBlueprint.ts:77`(유니온) · `src/lib/storage.ts`(OnboardingDraft·parse·isHomeFlowStep·hasMeaningfulOnboardingInput)
- Test: `src/lib/storage.test.ts` (기존 파일에 추가)

- [ ] **Step 1: Write the failing test** — 기존 draft 픽스처 스타일을 먼저 읽고 추가

```ts
it("homeFlowStep 'ideate' 가 복원에서 살아남는다 (medium 롤백 방지)", () => { /* base 픽스처 + homeFlowStep:'ideate' 라운드트립 */ });

it('onboardChatMessages 는 백필·손상 항목 드랍·setup 가드를 거친다', () => {
  // 부재 → [] 백필
  // 유효 user/partner 메시지 → 보존
  // 손상 항목(role 오타·text 비문자열·id 없음) → 그 항목만 드랍
  // partner 메시지의 손상 setup({scene:'s', cast:[], myRole:''}) → setup 만 드랍하고 메시지는 보존
});

it("playSeedEntry 는 'preset' 백필·'ideate' 복원된다", () => { /* 부재→'preset', 'ideate'→보존, 오타 값→'preset' */ });

it('구상 대화가 있으면 의미 있는 온보딩 입력으로 친다', () => { /* hasMeaningfulOnboardingInput — 대화 1개만 있어도 true */ });
```

- [ ] **Step 2: Run to verify FAIL**
- [ ] **Step 3: Implementation**

① `projectBlueprint.ts:77` — 유니온에 `'ideate'`(source 와 freewrite 사이 순서로).
② `storage.ts` — `isHomeFlowStep` 에 `'ideate'` 추가. `OnboardingDraft` 에 두 필드 추가(주석 동반)

```ts
  // 함께 구상 대화(S2) — 온보딩 수명과 일치, clearOnboardingDraft 가 함께 지운다. cap 은 App append 시 ONBOARD_CHAT_MAX_MESSAGES.
  onboardChatMessages?: OnboardChatMessage[];
  // playseed 진입원(S2) — onBack 이 돌아갈 갈래. 'preset' | 'ideate' (S3 에서 확장).
  playSeedEntry?: PlaySeedEntry;
```

`export type PlaySeedEntry = 'preset' | 'ideate';` 를 storage.ts 에 선언(App 과 공유). `parseOnboardingDraft` 에 파서 추가 — `parseOnboardChatMessages(value)` 헬퍼(비배열 → `[]`, 항목별 id/text string·role 'user'|'partner' 검증 실패 시 그 항목 드랍, setup 은 `parseDiveSetup` 실패 시 필드 드랍) + `playSeedEntry: value === 'ideate' ? 'ideate' : 'preset'` 백필. `hasMeaningfulOnboardingInput` 에 `(draft.onboardChatMessages?.length ?? 0) > 0` OR 조건 추가.

- [ ] **Step 4: Run** — `npx vitest run src/lib/storage.test.ts && npx tsc --noEmit`
- [ ] **Step 5: Commit** — `git add src/lib/projectBlueprint.ts src/lib/storage.ts src/lib/storage.test.ts` · `feat(storage): HomeFlowStep ideate + 구상 대화·playSeedEntry 영속 (OnboardingDraft 통합)`

---

### Task 6: OnboardChatPanel 컴포넌트 + CSS

**Files:**
- Create: `src/components/OnboardChatPanel.tsx`
- Modify: `src/styles.css`(`.ocp-*` 블록 — `.hx-playseed` 근처)
- Test: `src/components/onboardChatPanel.test.ts`

- [ ] **Step 1: Write the failing test** — planChatPanel.test.ts 스타일(renderToStaticMarkup)

검증 항목 — ① 빈 상태 안내 렌더 ② 작가/파트너 버블 구분 클래스 ③ 파트너 메시지 setup 카드(scene·myRole·cast 이름 + 「이 설정으로 계속」 버튼) ④ busy 시 busyNote 렌더(role=status)·컴포저 disabled ⑤ messages 빈 배열이면 「이걸로 시작」 disabled ⑥ note 렌더.

- [ ] **Step 2: Run to verify FAIL**
- [ ] **Step 3: Implementation** — 파일 첫 줄 한국어 헤더. props

```ts
export interface OnboardChatPanelProps {
  messages: OnboardChatMessage[];
  busy: boolean;
  busyNote?: string;   // App 이 경과 타이머로 조립 — busy 중에만 렌더
  note: string | null; // 실패·응결 미완 강등 안내
  onSend: (text: string) => void;
  onCondense: () => void;           // 「이걸로 시작」 상시 버튼
  onUseSetup: (setup: DiveSetup) => void; // 시드 카드 승인 → playseed
}
```

- 컴포저는 로컬 state(draft) + Enter 전송(Shift+Enter 줄바꿈, PlanChatPanel 관례) — busy 시 전송 차단.
- 시드 카드 — scene 인용·myRole·cast(이름 · 역할) 목록 + 「이 설정으로 계속」(busy 시 disabled).
- 「이걸로 시작」 — `disabled={busy || messages.length === 0}`.
- CSS — `.home-page .ocp-*`(버블·카드·컴포저), 라이트 `--nx-*` 토큰, **모든 버튼 `color: var(--nx-ink)`**(승인 CTA 는 `.hx-btn` 재사용 가능하면 재사용). 실제 토큰명은 이웃 `.hx-playseed`·`.hx-preset` 블록에서 확인(추측 금지).

- [ ] **Step 4: Run to verify PASS**
- [ ] **Step 5: Commit** — `git add src/components/OnboardChatPanel.tsx src/components/onboardChatPanel.test.ts src/styles.css` · `feat(onboard-chat): 구상 대화 패널 — 버블·시드 카드·이걸로 시작 (프레젠테이션 전용)`

---

### Task 7: App 배선 + 핀 교체

**Files:**
- Modify: `src/App.tsx` · `src/appExperience.test.ts`

- [ ] **Step 1: Write the failing test (핀 교체)** — `describe('온보딩 소재발굴 (S1 …)')`(:177-210) 를 S1+S2 핀으로 갱신

```ts
it('소설류 2단계는 소재발굴 3갈래 카드다 — 함께 구상 활성(S2)', () => {
  expect(blueprintSource).toContain("'source'");
  expect(blueprintSource).toContain("'ideate'");
  expect(app).toContain('소재발굴');
  expect(app).toContain('함께 구상');
  expect(app).toContain('인기 프리셋');
  expect(app).not.toContain('준비 중'); // S2 — 함께 구상 활성화
  expect(app).toContain("setHomeFlowStep('ideate')");
});

it('함께 구상 갈래는 onboard-chat 으로 응결해 playseed 에 합류한다', () => {
  expect(app).toContain('OnboardChatPanel');
  expect(app).toContain("homeFlowStep === 'ideate'");
  expect(app).toContain('sendOnboardChat');
  expect(app).toContain('requestOnboardChat');
  expect(app).toContain("setPlaySeedEntry('ideate')");
});

it('playseed 의 이전 버튼은 진입원 갈래로 돌아간다', () => {
  expect(app).toContain('playSeedEntry');
  expect(app).toMatch(/usesSourceDiscovery \? playSeedEntry : 'freewrite'/);
});
```

기존 프리셋 0콜 핀·playseed 배선 핀·**handleStartPlay 순서 핀(:203-209)은 그대로 유지**.

- [ ] **Step 2: Run to verify FAIL**
- [ ] **Step 3: Implementation** — 모두 `StoryXHome`. 앵커 라인은 현 브랜치 기준 — 편집 시 주변을 읽고 확정.

**(a) import** — `OnboardChatPanel`·`requestOnboardChat`·`buildOnboardChatTranscript`·`ONBOARD_CHAT_MAX_MESSAGES`·`type OnboardChatMessage`·`type PlaySeedEntry`.

**(b) 상태** — playseed 상태군(:1242 근처) 뒤에

```ts
  // 함께 구상(S2) — 구상 대화 상태. 온보딩 draft 로 영속·복원, 매체 변경 시 클리어.
  const [onboardChatMessages, setOnboardChatMessages] = useState<OnboardChatMessage[]>(
    () => restoredDraft?.onboardChatMessages ?? []
  );
  const [onboardChatBusy, setOnboardChatBusy] = useState(false);
  const [onboardChatNote, setOnboardChatNote] = useState<string | null>(null);
  const [onboardChatElapsed, setOnboardChatElapsed] = useState(0);
  // playseed 진입원 — onBack 이 돌아갈 갈래(기본 preset). goToPlaySeed 재배선(S3) 때 확장.
  const [playSeedEntry, setPlaySeedEntry] = useState<PlaySeedEntry>(
    () => restoredDraft?.playSeedEntry ?? 'preset'
  );
```

경과 타이머 effect — playSeedElapsed 타이머(:1250-1262 근처)와 동형으로 `onboardChatBusy` 의존 1초 setInterval(시작 시 0 리셋).

**(c) 매체 변경 클리어 effect** — 인터뷰 캐시 클리어 effect(:1317 근처)와 **별도로**

```ts
  // 매체를 바꾸면 구상 대화를 비운다 — 소재가 매체에 묶이므로. freewrite 텍스트와 달리 갈래 전환만으로는 지우지 않는다.
  useEffect(() => {
    setOnboardChatMessages([]);
    setOnboardChatNote(null);
  }, [blueprint.medium]);
```

(주의 — 이 effect 는 마운트 직후에도 한 번 돈다. restoredDraft 복원과 경합하지 않도록 **첫 실행 스킵 ref 가드**(`const mediumClearSkipRef = useRef(true)` 패턴)를 둘 것. 기존 App 에 동류 가드 관례가 있으면 그것을 따른다.)

**(d) draft 저장 effect**(:1267-1314) — 직렬화 객체에 `onboardChatMessages`·`playSeedEntry` 추가 + 의존성 배열 갱신.

**(e) 핸들러** — `pickStoryPreset` 근처에

```ts
  // 함께 구상 턴 — 하이브리드 응결: condense=true 면 강제 응결 지시(고정 문구 버블 동반).
  async function sendOnboardChat(text: string, condense = false) {
    if (onboardChatBusy) return;
    const trimmed = text.trim() || (condense ? '이 소재로 시작할게요.' : '');
    if (!trimmed) return;
    const userMessage: OnboardChatMessage = { id: `oc-${Date.now()}`, role: 'user', text: trimmed };
    const next = [...onboardChatMessages, userMessage].slice(-ONBOARD_CHAT_MAX_MESSAGES);
    setOnboardChatMessages(next);
    setOnboardChatBusy(true);
    setOnboardChatNote(null);
    const result = await requestOnboardChat({
      medium: blueprint.medium,
      format: blueprint.format,
      freewrite: freewriteText,
      dialogue: buildOnboardChatTranscript(next),
      query: trimmed,
      condense
    });
    if (result.ok && result.turn) {
      const turn = result.turn;
      setOnboardChatMessages((prev) =>
        [...prev, {
          id: `oc-${Date.now()}-p`,
          role: 'partner' as const,
          text: turn.reply,
          ...(turn.setup ? { setup: turn.setup } : {})
        }].slice(-ONBOARD_CHAT_MAX_MESSAGES)
      );
      if (condense && !turn.setup) {
        setOnboardChatNote('소재가 아직 얕아 시드를 만들지 못했어요 — 한두 턴 더 나눠주세요.');
      }
    } else {
      setOnboardChatNote(result.reason ?? '구상 파트너 응답에 실패했어요. 다시 보내주세요.');
    }
    setOnboardChatBusy(false);
  }

  // 시드 카드 승인 — pickStoryPreset 동형으로 playseed 에 합류(확인 카드 이후 경로 공유).
  function useOnboardSetup(setup: DiveSetup) {
    setPlaySetup(setup);
    setPlayPartnerIndex(0);
    setPlaySeedError('');
    setPlaySeedEntry('ideate');
    setHomeFlowStep('playseed');
  }
```

`pickStoryPreset` 에 `setPlaySeedEntry('preset')` 1줄 추가.

**(f) 카드 활성화**(:1668-1672) — disabled·`hx-source-soon` span 제거

```tsx
                <button type="button" className="hx-source-card" onClick={() => setHomeFlowStep('ideate')}>
                  <strong>함께 구상</strong>
                  <p>작가진과 채팅하며 소재를 캐냅니다. 잡히면 그대로 플레이가 열립니다.</p>
                </button>
```

**(g) ideate 패널** — 자유 서술 패널과 프리셋 패널 사이(갈래 상호배타 mount 패밀리)

```tsx
        {usesSourceDiscovery && homeFlowStep === 'ideate' && (
          <section className="hx-panel" aria-label="함께 구상">
            <div className="hx-main">
              <p className="hx-eyebrow">02 · 함께 구상</p>
              <h1 className="hx-h1">수다 떨듯 소재를 캐봅시다.</h1>
              <p className="hx-lead">떠오르는 조각을 던지면 구상 파트너가 되받아 넓힙니다. 소재가 잡히면 플레이 시드를 제안해요.</p>
              <OnboardChatPanel
                messages={onboardChatMessages}
                busy={onboardChatBusy}
                busyNote={`${formatElapsed(onboardChatElapsed)} 경과 · 보통 30초~1분 걸려요. 새로고침하지 마세요.`}
                note={onboardChatNote}
                onSend={(text) => void sendOnboardChat(text)}
                onCondense={() => void sendOnboardChat('', true)}
                onUseSetup={useOnboardSetup}
              />
              <div className="hx-aside-actions">
                <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('source')}>이전</button>
              </div>
            </div>
          </section>
        )}
```

(`formatElapsed` 는 generationProgress 의 기존 export — App 에 이미 import 돼 있는지 확인 후 재사용.)

**(h) isSourceBranch**(:1533) — `|| homeFlowStep === 'ideate'` 추가(인디케이터 source 접기·슬라이드 인덱스 공유).

**(i) playseed onBack**(:2201) — `onBack={() => setHomeFlowStep(usesSourceDiscovery ? playSeedEntry : 'freewrite')}`. goToPlaySeed 휴면 주석(:1356-1357)의 "onBack('preset' 고정)" 문구를 playSeedEntry 분기 완료·S3 확장 예정으로 갱신.

- [ ] **Step 4: Run** — `npx vitest run src/appExperience.test.ts && npx tsc --noEmit` → PASS
- [ ] **Step 5: Full gate** — `bash init.sh` 전체 녹색
- [ ] **Step 6: Commit** — `git add src/App.tsx src/appExperience.test.ts` · `feat(onboarding): 함께 구상 갈래 활성화 — onboard-chat 배선·하이브리드 응결·playseed 진입원 분기 (S2)`

---

### Task 8: 라이브 통짜 검증 (편집장 직접 — preview MCP)

**Files:** 없음 (발견 시 별도 수정)

- [ ] **Step 1:** preview 서버 기동 → localStorage 완전 초기화 → fresh reload, 콘솔 0.
- [ ] **Step 2:** 소설 선택 → 소재발굴 → 「함께 구상」 카드 활성(「준비 중」 없음) → ideate 패널 진입, 인디케이터가 「소재발굴」 하이라이트 유지.
- [ ] **Step 3:** 실 codex 2~3턴 — 파트너 응답 코헤런트·busy 중 경과 타이머와 새로고침 금지 문구 렌더.
- [ ] **Step 4:** 응결 — ⓐ 대화 유도("이제 시작하자")로 자발 setup 카드 또는 ⓑ 「이걸로 시작」 강제 응결. 시드 카드 렌더(장면·내 역할·cast) → 「이 설정으로 계속」 → playseed 확인 카드(상대 선택 동작·상대 변경) → 「이대로 시작」 → dive 진입(세션 상대 정확).
- [ ] **Step 5:** dive 1턴 실 대화 — 응결 소재가 세션에 반영됐는지.
- [ ] **Step 6:** 복원 — ideate 대화 중 새로고침 → 스텝·대화 복원. playseed 에서 새로고침 → 「이전」이 ideate 로 복귀(playSeedEntry 영속).
- [ ] **Step 7:** 회귀 — 프리셋 갈래 0콜 완주·onBack='preset' / 자유 서술 → 「인터뷰로 계속」 무변경 / 에세이(비소설) 기존 직행 무변경 / dive 진입 후 새 온보딩 시작 시 대화 잔존 없음(clearOnboardingDraft).
- [ ] **Step 8:** 전 구간 콘솔 에러 0. 다크 홈에서 신규 버튼 가시성 확인.
- 검증 팁 — React 클릭은 `dispatchEvent(bubbles:true)`, 같은 tick DOM 읽기는 stale(별도 호출 재확인). HMR 중간 에러는 fresh reload 로 판정.

---

## Self-Review

- 스펙 커버리지 — parseDiveSetup 승격(T1)·순수 모듈(T2)·프롬프트+미러 핀(T3)·클라이언트/브리지/prod(T4)·영속+ideate(T5)·패널(T6)·배선+핀 교체(T7)·라이브(T8). 하이브리드 응결은 T3(condense 지시)·T7(sendOnboardChat 이중 경로)·T8(양쪽 실측)에 분산 구현.
- 타입 일관성 — `OnboardChatMessage`(T2↔T5 storage↔T6 props↔T7 상태) · `condense`(T3 프롬프트↔T4 payload/브리지/Function↔T7 핸들러) · `PlaySeedEntry`(T5 storage↔T7 상태) 이름 일치.
- 갈래 인덱스 — ideate 는 freewrite/preset 과 같은 상호배타 조건부 mount 패밀리 + isSourceBranch 접기로 캐러셀 정합.
