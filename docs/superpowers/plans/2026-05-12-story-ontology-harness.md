# Story Ontology Harness Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 작품 제작 전 단계에서 소설, 에세이, 웹툰, 인스타툰으로 확장 가능한 강한 이야기 원형과 문체를 만들고 검증하는 온톨로지 기반 하네스를 구축한다.

**Architecture:** 현재 앱의 `CreativeDevelopmentPackage`와 `SeriesProject` 앞단에 `StoryOntology`와 `StoryHarnessRun`을 둔다. 입력된 소재는 진단, 온톨로지 구축, 갈등 압력 테스트, 매체 적합성 테스트, 한국어 문체 감수 단계를 통과해야 제작실로 넘어간다.

**Tech Stack:** React, TypeScript, Vitest, local deterministic harness first. Claude Code skills and Codex skills are treated as portable prompt contracts, with GOMI writing and humanizer rules embedded as Korean prose quality gates.

---

## Why This Comes First

스토리가 약하면 뒤의 모든 제작이 흔들린다. 소설은 문장으로 오래 버텨야 하고, 웹툰은 장면과 컷으로 즉시 읽혀야 한다. 둘 다 출발점은 같다. 인물의 결핍, 욕망, 세계의 규칙, 갈등의 압력, 독자에게 한 약속이 서로 물려 있어야 한다.

이 계획은 “한 번 생성하고 끝”이 아니라, 이야기의 뼈대를 지식 그래프로 만들고 하네스가 계속 검사하는 구조를 목표로 한다. 좋은 이야기는 감으로만 만드는 것이 아니라, 감을 망치지 않는 검증 장치를 곁에 두고 만든다.

## Story Ontology Model

### Core Entities

- `StoryPremise`: 한 문장 전제, 장르 약속, 독자 보상.
- `DramaticQuestion`: 독자가 끝까지 따라갈 중심 질문.
- `ThemeClaim`: 작품이 반복해서 시험할 가치 판단.
- `CharacterNode`: 인물의 욕망, 결핍, 상처, 거짓 믿음, 필요, 금기.
- `RelationshipEdge`: 인물 사이의 빚, 비밀, 권력, 감정 변화.
- `WorldRuleNode`: 세계관 규칙, 비용, 예외, 금지 모순.
- `ConflictEngine`: 외부 갈등, 내부 갈등, 관계 갈등, 시스템 갈등.
- `PlotThread`: 떡밥, 약속, 지연, 회수 조건.
- `SceneFunction`: 장면이 수행해야 하는 기능.
- `Motif`: 반복 이미지, 소품, 문장, 컷 리듬.
- `VoiceRule`: 인물별 말투, 서술자 거리, 한국어 문장 톤.
- `CanonFact`: 확정된 사실과 출처.
- `MediaProjection`: 소설, 에세이, 웹툰, 인스타툰, 네컷 인스타툰으로 변환할 때 보존해야 할 요소.
- `VoiceBible`: 작성자의 문장 리듬, 은유 밀도, 어투, 금지 표현, 한국어 자연스러움 기준.

### Required Relations

- `CharacterNode.desire` must pressure `DramaticQuestion`.
- `CharacterNode.falseBelief` must collide with `ThemeClaim`.
- `WorldRuleNode.cost` must block an easy solution.
- `PlotThread.payoffCondition` must point to a later scene or episode.
- `SceneFunction` must change at least one of: relationship, information, power, risk, self-understanding.
- `MediaProjection` must preserve premise, character desire, conflict pressure, and canon facts.

## Harness Stages

### Stage 1: Story Sense Diagnosis

Purpose: determine whether the idea is blank, thin, flat, under-pressured, or ready to build.

Inputs:
- medium and format
- material
- story seed
- character seed
- audience
- constraints

Outputs:
- `diagnosisState`
- `missingFoundations`
- `recommendedIntervention`

Rules:
- If the premise has no dramatic question, stop before drafting.
- If the character only serves the plot, route to character dimension work.
- If scenes happen but meaning does not accumulate, route to theme and conflict repair.

### Stage 2: Premise Forge

Purpose: turn raw material into a durable story promise.

Outputs:
- `oneSentencePremise`
- `dramaticQuestion`
- `readerPromise`
- `genreContract`
- `failureMode`

Quality gate:
- The premise must imply a character, a pressure, a cost, and a possible irreversible change.

### Stage 3: Ontology Builder

Purpose: build the story graph from the premise.

Outputs:
- `StoryOntology`
- `ontologyWarnings`
- `canonSeeds`

Quality gate:
- At least one world rule, one character wound, one desire, one false belief, one conflict engine, and one plot thread must exist.
- Every major claim must have a source: user input, generated proposal, or approved canon.

### Stage 4: Conflict Pressure Test

Purpose: check whether the story can generate multiple strong episodes or scenes.

Tests:
- Can the protagonist solve the problem too easily?
- Does the world rule force a cost?
- Does the antagonist or obstacle test the hero's false belief?
- Does each episode or scene change the story state?
- Is there a visible reason to turn the page or swipe the next cut?

Output:
- `pressureScore`
- `weakLinks`
- `repairSuggestions`

### Stage 5: Originality And Cliche Pass

Purpose: keep familiar genres useful without producing generic stories.

Checks:
- known genre promise
- overused trope
- one specific personal detail
- one irreversible cost
- one contradictory emotional choice

Rule:
- Do not remove genre pleasure. Twist the generic part by making the cost, setting, voice, or relationship more specific.

### Stage 6: Korean Voice Gate

Purpose: prevent awkward AI Korean before the story becomes a draft.

Skill sources:
- `gomi-writing`: Taewook-style planning, Korean structure, natural hybrid tech terminology.
- `humanizer`: AI Korean marker detection, comma rhythm, noun-heavy sentence repair, generic vocabulary reduction.
- `cw-prose-writing` or Claude writing skills: scene and prose drafting after story approval.

Checks:
- Does the premise sound like a Korean creator would actually say it?
- Are abstract nouns doing too much work?
- Are commas and connectors overused?
- Does each character have a speech rule that can produce natural Korean dialogue?
- Are English terms preserved only where they help?

Output:
- `koreanVoiceReport`
- `revisedPremise`
- `voiceRules`

### Stage 7: Media Projection

Purpose: adapt the same story ontology into each medium without losing the core story.

Novel projection:
- chapter promise
- viewpoint distance
- prose texture
- cliffhanger shape

Essay projection:
- interview question path
- lived material checklist
- surrounding-person privacy boundary
- author voice bible
- reflective turn

Webtoon projection:
- episode hook
- scroll rhythm
- visual anchor
- cut density

Insta-toon projection:
- first slide hook
- save/share final beat
- caption angle

Four-cut insta-toon projection:
- setup
- escalation
- twist preparation
- punchline or emotional turn

Rule:
- Media adaptation may change surface expression, but cannot change character desire, wound, world cost, or approved canon without a continuity issue.

## Continuity Without Boredom

LLM이 긴 작품에서 가장 자주 실패하는 지점은 단순한 망각이 아니다. 더 큰 문제는 기억을 억지로 맞추느라 장면이 설명문처럼 굳거나, 반대로 재미를 위해 캐릭터와 세계 규칙을 슬쩍 바꿔버리는 것이다.

이 시스템은 일관성을 `고정된 박제`가 아니라 `변화 규칙이 있는 생물`로 다룬다.

### Three Canon Layers

| Layer | Meaning | Can Change? | Example |
| --- | --- | --- | --- |
| Hard Canon | 절대 어기면 안 되는 사실 | 거의 불가. 바꾸려면 retcon 승인 필요 | 부모의 죽음, 마법의 비용, 주인공의 핵심 상처 |
| Living State | 사건에 따라 변해야 하는 현재 상태 | 가능. 단, 원인과 대가 필요 | 관계 온도, 신뢰도, 부상, 지위, 정보 보유량 |
| Soft Signal | 소문, 추측, 미확정 해석 | 가능. 반전 재료로 사용 | 목격담, 전설, 인물의 자기기만 |

### Character Integrity Contract

모든 주요 캐릭터는 다음 계약을 가진다.

- `coreDesire`: 끝까지 인물을 움직이는 욕망.
- `wound`: 과거의 상처.
- `falseBelief`: 인물이 진실이라고 믿지만 이야기 속에서 시험받는 착각.
- `agencyRange`: 이 인물이 할 수 있는 선택과 절대 하지 않을 선택.
- `voiceRules`: 한국어 말투, 문장 길이, 존댓말/반말, 감정을 피하는 방식.
- `growthLedger`: 변한 지점, 변하게 만든 사건, 치른 대가.
- `forbiddenRegression`: 성장 이후 함부로 되돌아가면 안 되는 행동.

Rule:
- 캐릭터는 성장할 수 있다.
- 캐릭터는 무너질 수도 있다.
- 하지만 성장이든 붕괴든 반드시 장면, 선택, 대가를 통해 기록되어야 한다.

### World Rule Contract

세계관 규칙은 재미를 막는 장벽이 아니라, 더 좋은 장면을 만드는 압력이어야 한다.

Every world rule must include:
- rule
- cost
- exception
- who benefits
- who is harmed
- forbidden shortcut
- story use

Rule:
- 세계 규칙은 문제를 쉽게 풀어주면 안 된다.
- 예외는 가능하지만, 예외는 더 큰 대가를 만들어야 한다.

### Novelty Engine

재미는 캐논을 깨서 만드는 것이 아니라, 캐논을 다른 압력 아래 놓아서 만든다.

Allowed novelty:
- 같은 욕망을 새로운 장소에 놓기
- 같은 세계 규칙을 다른 계급이나 관계에 적용하기
- 주인공의 장점을 단점으로 뒤집는 상황 만들기
- 기존 관계의 신뢰도를 시험하기
- 해결한 떡밥이 더 큰 질문을 열게 만들기
- 확정 사실이 아니라 소문과 해석을 반전시키기

Blocked novelty:
- 캐릭터가 이유 없이 성격을 바꾸는 전개
- 세계 규칙이 편의적으로 사라지는 전개
- 이전 회차의 대가가 없었던 일처럼 처리되는 전개
- 단지 충격을 주기 위해 핵심 상처나 욕망을 뒤집는 전개

### Context Pack Strategy

LLM에게 전체 작품을 한꺼번에 넣으려 하지 않는다. 매 생성마다 필요한 기억을 짧고 강하게 조립한다.

Every generation run receives:
- 10-line story promise
- hard canon facts
- current living state
- active character contracts
- current world rules and costs
- unresolved plot threads
- last 3 episode deltas
- required payoff or escalation target
- forbidden contradictions
- Korean voice rules

The harness should not ask the model to remember everything. The harness should decide what the model is allowed to forget and what it must never contradict.

### Repair Policy

When a draft violates continuity, the system must not silently force-fit the story.

Repair order:
1. Report the contradiction.
2. Explain which canon layer was hit.
3. Offer two repair options:
   - preserve canon and alter the scene
   - escalate into an intentional canon change with visible cost
4. Require user approval for hard canon changes.
5. Write approved changes into the growth ledger or canon ledger.

This keeps consistency from becoming boring. The story can still surprise the reader, but the surprise must feel earned.

## Agent And Skill Map

| Role | Purpose | Source |
| --- | --- | --- |
| Story Sense Diagnostician | Finds what the story lacks before generation | `story-sense` |
| Ontology Architect | Builds and validates story graph | New project module |
| Showrunner | Locks premise, episode promise, and hook | `.claude/agents/serial-showrunner.md` |
| Character Custodian | Protects desire, wound, false belief, voice | `.claude/agents/character-custodian.md` |
| World Keeper | Protects rules, cost, institutions, chronology | `.claude/agents/world-keeper.md` |
| Genre Stylist | Applies genre pleasure and pacing | `.claude/agents/genre-stylist.md` |
| Essay Interviewer | Asks questions so the writer's own lived material leads the essay | `.claude/agents/essay-interviewer.md` |
| GOMI Writer | Makes planning prose natural and Taewook-like | `gomi-writing` |
| Humanizer | Removes awkward AI Korean patterns | `humanizer` |
| Voice Curator | Maintains author voice, Korean naturalness, and style consistency | `.claude/agents/voice-curator.md` |
| Continuity Editor | Blocks contradiction and writes canon facts | `.claude/agents/continuity-editor.md` |
| Storyboard Agent | Projects story into panels or cuts | `.claude/agents/storyboard-agent.md` |
| DaVinci Image Agent | Creates FLUX.2 image prompts after story approval | `.claude/agents/davinci-image-agent.md` |

## File Structure

- Create: `src/lib/storyOntology.ts`
  - Owns `StoryOntology`, entity types, relations, validators.
- Create: `src/lib/storyHarness.ts`
  - Owns staged harness execution and scoring.
- Create: `src/lib/continuityContract.ts`
  - Owns canon layers, character integrity contracts, world rule contracts, context packs, and repair policy.
- Create: `src/lib/koreanVoiceGate.ts`
  - Owns GOMI/humanizer-inspired Korean quality rules.
- Create: `src/lib/mediaProjection.ts`
  - Owns novel, webtoon, insta-toon, four-cut projections from the ontology.
- Create: `src/lib/storyOntology.test.ts`
  - Tests ontology completeness and relation validation.
- Create: `src/lib/storyHarness.test.ts`
  - Tests diagnosis, pressure scoring, and stage outputs.
- Create: `src/lib/continuityContract.test.ts`
  - Tests hard canon protection, living state changes, context packs, and repair proposals.
- Create: `src/lib/koreanVoiceGate.test.ts`
  - Tests awkward Korean markers and revised premise output.
- Create: `src/lib/mediaProjection.test.ts`
  - Tests that projections preserve core ontology facts.
- Modify: `src/lib/creativeDevelopment.ts`
  - Add `storyOntology`, `harnessReport`, and `mediaProjection` to `CreativeDevelopmentPackage`.
- Modify: `src/App.tsx`
  - Add story quality panel before production workspace.
- Modify: `docs/agent-system.md`
  - Document ontology and harness path.
- Modify: `docs/codex-agent-manifest.md`
  - Add ontology and Korean voice roles.
- Modify: `README.md`
  - Explain why story harness runs before drafting or image generation.

## Chunk 1: Ontology Foundation

### Task 1: Add Story Ontology Types

**Files:**
- Create: `src/lib/storyOntology.ts`
- Test: `src/lib/storyOntology.test.ts`

- [ ] **Step 1: Write the failing ontology completeness test**

```ts
import { describe, expect, it } from 'vitest';
import { buildStoryOntology, validateStoryOntology } from './storyOntology';

describe('storyOntology', () => {
  it('requires premise, character desire, world cost, conflict, and plot thread', () => {
    const ontology = buildStoryOntology({
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '연재 미스터리와 감정 서사를 좋아하는 독자',
      constraints: '장편'
    });

    const report = validateStoryOntology(ontology);

    expect(report.valid).toBe(true);
    expect(ontology.premise.dramaticQuestion).toContain('찾');
    expect(ontology.characters[0].desire).toBeTruthy();
    expect(ontology.worldRules[0].cost).toBeTruthy();
    expect(ontology.conflictEngines.length).toBeGreaterThan(0);
    expect(ontology.plotThreads.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/storyOntology.test.ts`

Expected: FAIL because `storyOntology.ts` does not exist.

- [ ] **Step 3: Implement minimal ontology builder**

Create `StoryOntology` with:
- `premise`
- `theme`
- `characters`
- `worldRules`
- `conflictEngines`
- `plotThreads`
- `canonSeeds`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/storyOntology.test.ts`

Expected: PASS.

### Task 2: Add Relation Validation

**Files:**
- Modify: `src/lib/storyOntology.ts`
- Modify: `src/lib/storyOntology.test.ts`

- [ ] **Step 1: Write failing tests for invalid relations**

Test missing dramatic question, missing world cost, and plot thread without payoff condition.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/storyOntology.test.ts`

- [ ] **Step 3: Implement validators**

Validators should produce warnings, not silent fixes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/storyOntology.test.ts`

## Chunk 2: Harness Engine

### Task 3: Add Story Harness Stages

**Files:**
- Create: `src/lib/storyHarness.ts`
- Test: `src/lib/storyHarness.test.ts`

- [ ] **Step 1: Write failing harness test**

```ts
import { describe, expect, it } from 'vitest';
import { runStoryHarness } from './storyHarness';

describe('storyHarness', () => {
  it('runs diagnosis, premise, ontology, pressure, Korean voice, and projection stages', () => {
    const result = runStoryHarness({
      medium: 'novel',
      formatLabel: '장편',
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '감정 미스터리를 좋아하는 독자',
      constraints: '장기 연재'
    });

    expect(result.stages.map((stage) => stage.id)).toEqual([
      'story-sense',
      'premise-forge',
      'ontology-builder',
      'pressure-test',
      'korean-voice-gate',
      'media-projection'
    ]);
    expect(result.qualityScore).toBeGreaterThanOrEqual(70);
    expect(result.readyForProduction).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/storyHarness.test.ts`

- [ ] **Step 3: Implement staged harness**

Each stage returns:
- `id`
- `title`
- `status`
- `findings`
- `requiredRepairs`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/storyHarness.test.ts`

### Task 4: Add Pressure Scoring

**Files:**
- Modify: `src/lib/storyHarness.ts`
- Modify: `src/lib/storyHarness.test.ts`

- [ ] **Step 1: Write failing tests for weak stories**

Weak story examples:
- no cost
- no contradiction
- passive protagonist
- no open thread

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/storyHarness.test.ts`

- [ ] **Step 3: Implement scoring**

Suggested scoring:
- premise clarity: 20
- character pressure: 20
- world cost: 15
- plot thread: 15
- theme collision: 10
- media adaptability: 10
- Korean voice: 10

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/storyHarness.test.ts`

## Chunk 2.5: Continuity Contract And Context Packs

### Task 4A: Add Canon Layer Contracts

**Files:**
- Create: `src/lib/continuityContract.ts`
- Test: `src/lib/continuityContract.test.ts`

- [ ] **Step 1: Write failing tests for canon layers**

```ts
import { describe, expect, it } from 'vitest';
import { classifyCanonChange, createContinuityContract } from './continuityContract';

describe('continuityContract', () => {
  it('blocks hard canon changes but allows living state changes with cause and cost', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라진 오빠를 찾고 있다'],
      livingState: ['서윤은 이안을 아직 믿지 않는다'],
      softSignals: ['탑의 안내인은 오빠를 본 적 있다고 주장한다']
    });

    expect(classifyCanonChange(contract, '서윤은 오빠를 찾고 싶어 하지 않는다').allowed).toBe(false);
    expect(
      classifyCanonChange(contract, '서윤은 이안을 조금 신뢰하기 시작한다', {
        cause: '이안이 자신의 출입권을 포기했다',
        cost: '다음 회차에서 탑에 들어갈 방법이 사라졌다'
      }).allowed
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/continuityContract.test.ts`

- [ ] **Step 3: Implement canon layer classification**

The result should include:
- `allowed`
- `layer`
- `severity`
- `reason`
- `requiredApproval`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/continuityContract.test.ts`

### Task 4B: Add Character Growth Ledger

**Files:**
- Modify: `src/lib/continuityContract.ts`
- Modify: `src/lib/continuityContract.test.ts`

- [ ] **Step 1: Write failing tests for earned character change**

Test that a character can change trust level, fear, relationship, or self-understanding only when a cause and cost are recorded.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/continuityContract.test.ts`

- [ ] **Step 3: Implement growth ledger**

Ledger entry fields:
- `characterId`
- `before`
- `after`
- `triggerScene`
- `choice`
- `cost`
- `futureConsequence`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/continuityContract.test.ts`

### Task 4C: Add Context Pack Builder

**Files:**
- Modify: `src/lib/continuityContract.ts`
- Modify: `src/lib/storyHarness.ts`
- Modify: `src/lib/continuityContract.test.ts`

- [ ] **Step 1: Write failing context pack test**

The context pack must include:
- story promise
- hard canon
- living state
- character contracts
- world costs
- unresolved threads
- last three deltas
- forbidden contradictions
- Korean voice rules

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/continuityContract.test.ts`

- [ ] **Step 3: Implement context pack builder**

Do not include full manuscript history. Include compressed, decision-ready state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/continuityContract.test.ts`

### Task 4D: Add Continuity Repair Proposals

**Files:**
- Modify: `src/lib/continuityContract.ts`
- Modify: `src/lib/storyHarness.ts`
- Modify: `src/lib/continuityContract.test.ts`

- [ ] **Step 1: Write failing repair proposal test**

When a hard canon violation occurs, expect two proposals:
- preserve canon and alter scene
- intentional canon change with visible cost and approval required

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/continuityContract.test.ts`

- [ ] **Step 3: Implement repair proposal generation**

Repairs must be explicit. The harness must never silently rewrite a contradiction into compliance.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/continuityContract.test.ts`

## Chunk 3: Korean Voice Gate

### Task 5: Add GOMI/Humanizer Inspired Korean Checks

**Files:**
- Create: `src/lib/koreanVoiceGate.ts`
- Test: `src/lib/koreanVoiceGate.test.ts`

- [ ] **Step 1: Write failing Korean voice tests**

```ts
import { describe, expect, it } from 'vitest';
import { inspectKoreanVoice } from './koreanVoiceGate';

describe('koreanVoiceGate', () => {
  it('flags stiff AI-like Korean and suggests natural story planning prose', () => {
    const report = inspectKoreanVoice(
      '이 이야기는 핵심적으로 중요한 인물의 효과적인 성장과 지속가능한 서사 구조를 제공합니다.'
    );

    expect(report.flags).toContain('generic-ai-vocabulary');
    expect(report.flags).toContain('noun-heavy-sentence');
    expect(report.revisedText).toContain('인물');
    expect(report.score).toBeLessThan(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/koreanVoiceGate.test.ts`

- [ ] **Step 3: Implement rules**

Rules:
- flag words: `핵심적`, `효과적`, `지속가능한`, `중요하다`, `혁신적`
- flag excessive comma rhythm
- flag noun-heavy phrases ending in `구조`, `시스템`, `요소`, `과정` when overused
- preserve mixed English terms such as `harness`, `ontology`, `prompt`, `canon`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/koreanVoiceGate.test.ts`

### Task 6: Add Character Voice Rules

**Files:**
- Modify: `src/lib/koreanVoiceGate.ts`
- Modify: `src/lib/storyOntology.ts`
- Test: `src/lib/koreanVoiceGate.test.ts`

- [ ] **Step 1: Write failing test for character voice**

Test that every major character gets:
- sentence length tendency
- honorific level
- forbidden speech pattern
- emotional detour pattern

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/koreanVoiceGate.test.ts`

- [ ] **Step 3: Implement voice rule generation**

Use character role, wound, and contradiction to derive Korean dialogue constraints.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/koreanVoiceGate.test.ts`

## Chunk 4: Media Projection

### Task 7: Add Media Projection Contracts

**Files:**
- Create: `src/lib/mediaProjection.ts`
- Test: `src/lib/mediaProjection.test.ts`

- [ ] **Step 1: Write failing projection preservation test**

Test that novel, webtoon, insta-toon, and four-cut outputs keep the same:
- dramatic question
- protagonist desire
- world cost
- canon seeds

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/mediaProjection.test.ts`

- [ ] **Step 3: Implement projections**

Projection outputs:
- `novel.chapterPromise`
- `webtoon.scrollHook`
- `instaToon.carouselHook`
- `fourCut.quadrants`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/mediaProjection.test.ts`

## Chunk 5: Integrate With Development Room

### Task 8: Add Harness Output To CreativeDevelopmentPackage

**Files:**
- Modify: `src/lib/creativeDevelopment.ts`
- Modify: `src/lib/creativeDevelopment.test.ts`

- [ ] **Step 1: Write failing integration test**

Expect `developCreativeProject` to include:
- `storyOntology`
- `harnessReport`
- `mediaProjection`
- `readyForProduction`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/creativeDevelopment.test.ts`

- [ ] **Step 3: Implement integration**

Call `runStoryHarness` before panel/image prompt generation. If `readyForProduction` is false, still show the result but mark repairs as required.

- [ ] **Step 4: Run tests**

Run:
- `npm test -- src/lib/creativeDevelopment.test.ts`
- `npm test`

### Task 9: Add Story Quality Panel To UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add UI after data exists**

Panel sections:
- `스토리 진단`
- `온톨로지`
- `갈등 압력`
- `한국어 문체`
- `매체 변환`
- `제작 가능 여부`

- [ ] **Step 2: Run build**

Run: `npm run build`

- [ ] **Step 3: Browser verification**

Open `http://127.0.0.1:3001/`, select `소설 > 장편` and `만화 > 인스타툰`, run the development room, and verify story quality panels render without layout overlap.

## Chunk 6: Documentation And Agent Bridge

### Task 10: Update Project Agent Docs

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/agent-system.md`
- Modify: `docs/codex-agent-manifest.md`
- Modify: `README.md`

- [ ] **Step 1: Document the story-first production path**

Required sequence:
1. Story diagnosis
2. Ontology build
3. Harness pressure test
4. Korean voice gate
5. Media projection
6. Draft or storyboard
7. Image prompt generation

- [ ] **Step 2: Document skill bridge**

Explain:
- Claude Code skills live in `.claude/skills` or user skill folders.
- Codex can reflect the same rules by reading project docs and implementing deterministic gates.
- GOMI writing and humanizer rules become Korean quality gates, not a replacement for user taste.

- [ ] **Step 3: Run verification**

Run:
- `npm test`
- `npm run build`

## Acceptance Criteria

- A raw story idea cannot jump straight to draft generation without a harness report.
- The system stores story ontology separately from prose, panels, and image prompts.
- The system separates hard canon, living state, and soft signals.
- Character change requires a recorded cause, choice, cost, and future consequence.
- Hard canon changes require explicit repair proposals and user approval.
- Generation context is built as a compressed context pack instead of a full manuscript dump.
- Weak premises produce clear repair suggestions instead of polished but hollow drafts.
- Korean prose checks catch stiff AI-style wording before draft generation.
- GOMI writing principles are represented as planning and polish rules.
- Humanizer principles are represented as measurable Korean text flags.
- Every media format receives a projection from the same ontology.
- DaVinci image prompts run only after story and visual continuity have enough anchors.

## Later Extensions

- Add persistent ontology storage.
- Add graph visualization for character/world/thread relations.
- Add user approval gates for canon changes.
- Add actual LLM harness adapters for Claude, OpenAI, and local models.
- Add Obsidian/GOMI export so approved story bibles can become vault notes.
- Add comparative drafts: same ontology, different genre stylist passes.
