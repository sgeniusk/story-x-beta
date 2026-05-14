# Codex Agent Manifest

Codex can apply this system by reading project instructions and role manifests. Claude Code's `.claude/agents/*.md` files are useful source material, but they are not automatically native Codex agents.

## Shared Roles

| Role | Codex Use | Claude Code Asset |
| --- | --- | --- |
| Showrunner | Plan episode promise, escalation, and cliffhanger | `.claude/agents/serial-showrunner.md` |
| Character Custodian | Check desire, wound, voice, and relationship state | `.claude/agents/character-custodian.md` |
| World Keeper | Check rules, costs, geography, institutions, chronology | `.claude/agents/world-keeper.md` |
| Genre Stylist | Apply genre rhythm and prose texture | `.claude/agents/genre-stylist.md` |
| Essay Interviewer | For essays, ask questions that uncover the writer's lived material without inventing it | `.claude/agents/essay-interviewer.md` |
| Voice Curator | Preserve author style, Korean naturalness, and full-draft voice consistency | `.claude/agents/voice-curator.md` |
| Audio Narration Director | For audiobooks and narration videos, plan voice, pacing, pauses, emphasis, and listener rhythm | `.claude/agents/audio-narration-director.md` |
| Education Video Architect | For educational videos, define learning objectives, explanation sequence, examples, and caption density | `.claude/agents/education-video-architect.md` |
| Sound Music Agent | For music videos and children's song reading, plan hooks, motifs, music cues, and sound continuity | `.claude/agents/sound-music-agent.md` |
| Continuity Editor | Block contradictions and write new canon facts | `.claude/agents/continuity-editor.md` |
| Storyboard Agent | For comics, convert beats into panels, carousel rhythm, scroll rhythm, and page turns | `.claude/agents/storyboard-agent.md` |
| Carousel Editor | For insta-toons, check square-frame rhythm, swipe hooks, and save/share moments | Use `storyboard-agent` with insta-toon format |
| Speech Bubble Agent | For comics and four-cut insta-toons, check text density, bubble style, reading order, and whether balloons cover expressions or key action | `.claude/agents/speech-bubble-agent.md` |
| Keyframe Art Director | For comics, create and select Midjourney keyframe/reference candidates before any cut-by-cut prompt becomes binding | `.claude/agents/keyframe-art-director.md` |
| DaVinci Image Agent | For image-generating comics formats, create FLUX.2-ready cut-by-cut image prompts from approved plans | `.claude/agents/davinci-image-agent.md` |
| Frame Assembly Agent | For four-cut insta-toons, carousel posts, webtoon scrolls, and page sequences, plan final composition, ratios, spacing, and export naming | `.claude/agents/frame-assembly-agent.md` |

## Service Operations Roles

These agents sit outside the creative editor team. They help Story X become a usable paid service rather than only a draft generator.

| Role | Codex Use | Claude Code Asset |
| --- | --- | --- |
| Editor UX Director | Design focused editor layouts, center-stage creative surfaces, sidebars, and media-specific workspaces | `.claude/agents/editor-ux-director.md` |
| Creative Coach | Help blocked creators with questions, next actions, and momentum without taking authorship away | `.claude/agents/creative-coach.md` |
| Onboarding Architect | Improve first-run medium/format selection and first-project setup | `.claude/agents/onboarding-architect.md` |
| Work Library Manager | Manage projects, series, versions, canon, voice bible, exports, and download packages | `.claude/agents/work-library-manager.md` |
| Brand Homepage Director | Shape the Story X homepage, service message, positioning, and introduction pages | `.claude/agents/brand-homepage-director.md` |
| Monetization Strategist | Design pricing, credits, paid review tiers, media conversion upsells, and token-aware value | `.claude/agents/monetization-strategist.md` |
| Publishing Distribution Manager | Package finished works for publishing, downloads, audio, comics, storyboard conversion, and platform handoff | `.claude/agents/publishing-distribution-manager.md` |
| Insights Analyst | Turn usage patterns, review outcomes, failure logs, and growth memory into product improvements | `.claude/agents/insights-analyst.md` |

## Codex Workflow

1. Select medium: novel, essay, audiobook, or comics.
2. Select format: long, medium, short, personal essay, reflective essay, essay series, music video, educational video, children's song reading, insta-toon, short comic, or serial webtoon. Detailed comic subtypes such as four-cut insta-toon, storybook, and graphic novel are handled in the next planning step.
3. Build a story core before producing the final medium.
4. Decide which AI resource layers are needed: text, image, sound.
5. Build a blueprint with `src/lib/projectBlueprint.ts`.
6. Read the current project state from `src/lib/storyEngine.ts`.
7. Run the roles in order, either mentally in one thread or through explicit Codex subagents when requested.
8. Generate draft output and update canon, voice, audio, or visual facts.
9. Suggest natural follow-up transformations after a piece is complete, such as essay to audiobook or novel to screenplay.
10. Verify with `npm test` and `npm run build` after code changes.

## Memory Bank Protocol

Use `src/lib/memoryBank.ts` and `docs/storyx-memory-bank.md` whenever a task touches long-form continuity, series expansion, author voice, visual consistency, audio planning, or agent review memory.

The memory bank separates:

- Story core: logline, genre, tone, audience promise.
- Context: canon, timeline, continuity ledger, unresolved questions.
- Character memory: desire, wound, current state, voice rules, forbidden contradictions.
- World memory: rules, costs, settings, institutions.
- Voice memory: author style, Korean naturalness, forbidden phrases.
- Visual/audio memory: style bible, appearance anchors, image seeds, narration and music motifs.
- Review memory: persona review ledger and failure log.
- Private source memory: raw manuscripts, interviews, personal references. This stays under `private/raw-sources/` and is not included in normal context packets.

Agents should request a role-specific context packet instead of reading everything:

- Showrunner: story-core, canon, open-threads, recent-chapters.
- Character custodian: story-core, characters, canon, recent-chapters.
- World keeper: story-core, world, canon, open-threads.
- Voice curator: story-core, voice, recent-chapters.
- DaVinci: story-core, visual, characters, recent-chapters.
- Speech Bubble Agent: story-core, visual, voice, recent-chapters.
- Keyframe Art Director: story-core, visual, characters, world.
- Frame Assembly Agent: story-core, visual, recent-chapters.

Never use majority vote to override canon. A contradiction must become a deliberate reveal, an explicit rewrite, or a blocked draft.

## Comics Visual Workflow

Comics and webtoon work must split image consistency into separate responsibilities:

1. Storyboard Agent converts story beats into panels, scroll rhythm, swipe rhythm, or page turns.
2. Speech Bubble Agent checks bubble position, dialogue density, reading order, and whether text covers expressions, hands, or key props.
3. Keyframe Art Director uses Midjourney for early keyframe/reference candidates. Only user-approved keyframes become visual DNA.
4. DaVinci turns approved keyframes, character sheets, and visual bible facts into cut-by-cut image prompts with negative prompt rules.
5. Frame Assembly Agent checks platform ratio, margins, frame order, and export naming.
6. Continuity Editor blocks visual contradictions before character appearance, world rules, or canon are updated.

Rejected Midjourney candidates must not leak into canon or character appearance memory. They can stay in private references or failure logs only.

## Evaluator Development Update

Use `docs/story-x-12-creator-tester-report.md` as the raw evaluator report and `docs/storyx-evaluator-development-update.md` as the current implementation summary.

The evaluator agent should compress tester feedback into six P0 structures:

1. `Workflow Board`
2. `Story Contract`
3. `Refactor Impact Preview`
4. `Quality Gate System`
5. `Reference DNA Cards`
6. `AI Output Autopsy`

Codex should keep these structures concise and assign ownership clearly:

- Editor UX Director: workflow board and visible gates.
- Showrunner: story contract and audience promise.
- Character Custodian: refactor impact for identity, role, relationship, and dialogue.
- Voice Curator: Korean naturalness and voice drift.
- Storyboard Agent / DaVinci: panel readability and visual consistency.
- Audio Narration Director / Sound Music Agent: first 30 seconds, pronunciation, breath, music motifs.
- Insights Analyst: tester report reflection and output autopsy acceptance.

## Persona Review Loop

When the user asks Codex to test or review a Story X output, ask for the review scale first unless the user already specified it:

- `Quick`: low token use, 1 round, up to 3 agents.
- `Standard`: medium token use, 2 rounds, up to 5 agents.
- `Deep`: high token use, 3 rounds, up to 12 agents.

Use `src/lib/agentReviewProcess.ts` and `.claude/skills/storyx-persona-review/SKILL.md` as the shared protocol. Each persona should review independently before synthesis. The final response must include:

1. 검토의견
2. 변경사항
3. 성장 메모리 업데이트

Do not pass a canon contradiction by majority vote. Do not invent personal memories for essay work. Save useful lessons as proposed updates to the work bible, voice bible, visual/audio bible, or failure log.

## Practical Notes

- Codex skills available in this environment live outside the repo, usually under `~/.codex/skills` or `~/.agents/skills`.
- Project-local `.claude/skills` are still valuable documentation and can be ported into Codex skills later.
- `AGENTS.md` is the most portable project-level instruction file between coding agents.
- For essay work, Codex should ask for the user's lived material first. The system should not invent personal memories, surrounding people, or private motives.
