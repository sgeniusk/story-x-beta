# Serial Story Studio

This project builds a Korean long-form serial fiction studio. Treat continuity as a product requirement, not an editing afterthought.

## Operating Rules

- Read `docs/agent-system.md` before changing the story workflow.
- Preserve the story bible shape in `src/lib/storyEngine.ts`: characters, world rules, canon facts, open threads, chapters.
- New generation behavior must update tests in `src/lib/storyEngine.test.ts` first.
- When using Claude Code, prefer the project subagents in `.claude/agents/` for long-form writing work.
- Keep Korean UI copy concise and operational. The first screen should remain the usable studio, not a landing page.

## Recommended Agent Chain

1. `serial-showrunner`
2. `character-custodian`
3. `world-keeper`
4. `genre-stylist`
5. `continuity-editor`

The final output should include a chapter draft, memory anchors used, new canon facts, and any continuity risks.
