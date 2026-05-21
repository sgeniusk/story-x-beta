# Agent Guidance

Story X is a React/Vite app plus a local story-continuity, voice-consistency, and audio/video planning engine.

## Startup Workflow

Before writing code in a new session, the agent must read state files in this order so context is reconstructed without relying on chat history.

1. `progress.md` — Last Updated · Current Objective · Recommended Next Step · Files To Touch · Blockers.
2. `feature_list.json` — every milestone (M1~M7) with `id`, `name`, `description`, `status`, `dependencies`.
3. `session-handoff.md` — most recent handoff at top, including "Files NOT To Touch".
4. Run `bash init.sh` to confirm the environment, types, build, and tests pass before any change. Re-run before claiming done.
5. This file plus `CLAUDE.md` for domain and design rules.

The master roadmap lives at `~/.claude/plans/x-zippy-graham.md`.

## Definition of Done

A unit of work is done only when all of the following hold.

- `npm test` — 28 files / 149+ tests pass.
- `npm run build` — `tsc --noEmit && vite build` succeeds.
- The active feature in `progress.md` is updated with evidence (commit SHA, file paths, capture path).
- New generation behavior was preceded by a test update in `src/lib/storyEngine.test.ts`.
- Linear "Midnight Command Center" dark tokens are preserved (`--lc-*` / `--nx-*` / `--sx-*` values intact).
- `session-handoff.md` gets a fresh entry at the top before the session ends.

## Stay in Scope · Completion Gate

- One feature at a time. The `active` field in `feature_list.json` names the single in-flight milestone. Do not touch other milestones in the same session.
- Scope is the union of `files` listed in the active feature plus the touched paths in `progress.md`. Anything outside that list is out of scope.
- Closing a feature requires the Definition of Done above — no exceptions, no "I'll add tests later".

## End of Session · Before Ending

Before stopping work, in this exact order.

1. Re-run `bash init.sh` and capture the result line in `progress.md` under "Verification Evidence".
2. Update `progress.md` Current State + Recommended Next Step + Last Updated timestamp.
3. Prepend a new handoff block to `session-handoff.md` using the template at the bottom of that file.
4. Commit on the active branch with the milestone id in the subject (e.g. `M3-editor-polish: ...`).

## Development

- Run `npm test` before and after story-engine changes.
- Run `npm run build` before claiming the app is ready.
- Keep domain logic in `src/lib/storyEngine.ts`; keep UI state in React components or small helpers.
- Do not weaken continuity checks to make generation look cleaner. Surface conflicts instead.

## Story Workflow

The system models a writers' room:

- Showrunner sets episode promise and cliffhanger.
- Character custodian protects desire, wound, voice, and relationship state.
- World keeper protects magic, setting, chronology, and cost rules.
- Genre stylist applies genre-specific pacing and prose texture.
- Essay interviewer asks for the user's lived material before personal writing.
- Voice curator protects author style, Korean naturalness, and full-draft voice consistency.
- Audio narration director protects voice tone, pacing, pauses, and listener rhythm.
- Education video architect protects learning objective, explanation sequence, and caption density.
- Sound music agent protects hooks, motifs, music cues, and children's repetition.
- Continuity editor blocks contradictions and writes new canon facts.

## Studio Data Agents (M4 — 1차 신설)

스튜디오 단계의 데이터·작품성·메타 학습을 담당하는 6명. 매체별 편집 에이전트와 함께 작가진을 구성한다.

- Canon librarian (`canon-librarian`) — 캐논 사실을 3계층(Hard / Living / Soft)으로 분류하고 승인 게이트를 운영한다.
- Timeline keeper (`timeline-keeper`) — 사건 × 스레드 × 회차 grid, 페이오프 스케줄, 미해결 떡밥 부하를 관리한다.
- Bible curator (`bible-curator`) — 6개 카테고리(캐릭터·세계관·타임라인·문체 규칙·보이스 프로파일·관계도) 큐레이션과 PINNED·stale 감지.
- Critic reviewer (`critic-reviewer`) — 작품성 트랙: 양가성·윤리적 비용·침묵·모티프 변주·상징의 층·내면 모순.
- Essay curator (`essay-curator`) — 에세이 진실 계약: 도약, 자기반박, 노출 윤리, 호흡, GOMI 자연스러움.
- Memory evolution keeper (`memory-evolution-keeper`) — `evolutionMemory` 영속화, 학습된 원칙 표면화, drift 감지.

## Stage × Media Matrix

작가진은 4단계(랜딩 / 브릿지 / 스튜디오 / 출판) × 매체(소설 · 에세이 · 만화 · 오디오북)로 분리된다. 스튜디오 단계 1차 매핑.

| 단계 | 역할 | 공통 에이전트 | 매체 전용 추가 |
|---|---|---|---|
| 랜딩 | 첫 만남 · 의도 설계 | `brand-homepage-director` · `onboarding-architect` · `creative-coach` · `studio-architect` | — |
| 브릿지 | 인터뷰 · 자유글 분석 | `essay-interviewer` · `creative-coach` · `interview-curator` | 에세이 — `docs/essay-interviewer-personas.md` + `src/lib/essayPersonas.ts` 의 6인 풀 |
| 스튜디오 | 편집 + 데이터 + 작품성 | 데이터 4명(`canon-librarian` · `timeline-keeper` · `bible-curator` · `memory-evolution-keeper`) + 작품성 1명(`critic-reviewer`) | 소설 — `showrunner` · `character-custodian` · `world-keeper` · `genre-stylist` · `voice-curator` · `continuity-editor` / 에세이 — `essay-interviewer` · `essay-curator` · `voice-curator` / 만화 — `storyboard-agent` · `speech-bubble-agent` · `keyframe-art-director` · `da-vinci` · `frame-assembly-agent` · `continuity-editor` / 오디오북 — `audio-narration-director` · `sound-music-agent` · `voice-curator` · `education-video-architect` |
| 출판 | 배포 · 사업 · 홍보 | `publishing-distribution-manager` · `monetization-strategist` · `insights-analyst` · `work-library-manager` · `book-designer` · `pr-specialist` · `platform-curator` · `business-strategist` | — |

매체 1순위는 **에세이**. M4 1차 작업은 위 표의 스튜디오 단계 공통 5명 + 에세이 매체 전용 3명을 우선 구현한다.

## Service Operations Workflow

The product also models a service operations room outside the creative editor:

- Editor UX director protects writing focus, central creative surfaces, sidebars, and media-specific workspaces.
- Creative coach helps blocked creators with questions and next actions without taking authorship away.
- Onboarding architect protects first-run selection, project setup, and first-project activation.
- Work library manager protects projects, series, versions, canon, voice bibles, exports, and output packages.
- Brand homepage director protects Story X positioning, homepage messaging, and introduction pages.
- Monetization strategist protects pricing, credits, paid review tiers, and token-aware upgrade moments.
- Publishing distribution manager protects downloads, publishing packages, platform handoff, and media conversion readiness.
- Insights analyst converts user behavior, review outcomes, and failure logs into product and agent improvements.

## Memory Bank Workflow

Story X keeps long-form continuity through a structured memory bank rather than by loading the whole manuscript into every prompt:

- Generate the logical memory bank with `src/lib/memoryBank.ts`.
- Keep canon, timeline, character, world, voice, visual, audio, production, and review records syncable.
- Keep raw manuscripts, interviews, private references, and sensitive source material under `memory-bank/**/private/raw-sources/` and never sync them by default.
- Build role-specific context packets for agents; each agent should read only the sections it needs.
- Do not pass canon contradictions by majority vote. Mark the conflict and decide whether it becomes a reveal, a revision, or a blocked draft.

## Evaluator Feedback Workflow

Tester and evaluator reports should become compact product rules, not a pile of new features:

- Use `docs/story-x-12-creator-tester-report.md` as raw evaluator input.
- Use `docs/storyx-evaluator-development-update.md` as the current reflection log.
- Keep the six P0 structures aligned: Workflow Board, Story Contract, Refactor Impact Preview, Quality Gate System, Reference DNA Cards, AI Output Autopsy.
- Preserve Story X's service direction: story first, medium second, user approval before memory updates.
- Reference DNA must translate structure and emotional engine only; surface imitation is blocked.

Project-level Claude Code agents live in `.claude/agents/`. Process skills live in `.claude/skills/`.

## Codex Compatibility

Codex can use the same operating model, but not by automatically loading Claude Code's `.claude/agents/*.md` files as native Claude subagents. For Codex sessions:

- Treat this `AGENTS.md` as the project-level instruction source.
- Read `docs/codex-agent-manifest.md` when you need the writing-room agent map.
- Read `docs/storyx-memory-bank.md` when you need the memory-bank folder model and context-packet rules.
- Read `docs/storyx-evaluator-development-update.md` when you need the latest evaluator-driven development direction.
- Use the same agent roles as conceptual specialists even if they run inside one Codex thread.
- If the user explicitly asks for parallel Codex subagents, split work by role: showrunner, character, world, genre, essay interviewer, voice curator, audio narration, education video, sound music, continuity, or service operations roles such as editor UX, creative coach, onboarding, library, brand, monetization, publishing, and insights.
- Keep `.claude/agents/` and `.claude/skills/` as Claude Code compatible assets; keep `docs/codex-agent-manifest.md` as the Codex-readable bridge.
