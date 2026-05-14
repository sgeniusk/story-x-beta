# Agent Guidance

Story X is a React/Vite app plus a local story-continuity, voice-consistency, and audio/video planning engine.

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
