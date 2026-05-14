# Story X Editor Benchmarks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first Story X production desk increment inspired by Scrivener, Novelcrafter, PlotLens, and open-source AI writing tools.

**Architecture:** Extend `src/lib/storyEngine.ts` with editor workspace types and deterministic builders. Update `src/StoryXTestPage.tsx` to render the new desk using static engine data plus local UI state. Keep storage and generation behavior compatible with existing projects.

**Tech Stack:** React, TypeScript, Vite, Vitest, lucide-react, localStorage.

---

## Files

- Modify: `src/lib/storyEngine.ts`
- Modify: `src/lib/storyEngine.test.ts`
- Modify: `src/StoryXTestPage.tsx`
- Modify: `src/styles.css`
- Add: `docs/superpowers/specs/2026-05-12-story-x-editor-benchmarks-design.md`
- Add: `docs/superpowers/plans/2026-05-12-story-x-editor-benchmarks.md`

## Task 1: Engine Workspace Model

- [x] Add tests for workspace view modes, Codex entries, snapshots, continuity issues, and compile preview.
- [x] Run `npm test -- src/lib/storyEngine.test.ts` and confirm the new tests fail.
- [x] Add editor workspace types and `buildStoryEditorWorkspace(project)`.
- [x] Add helpers for scene cards, outline rows, Codex entries, snapshots, and compile preview.
- [x] Run `npm test -- src/lib/storyEngine.test.ts` and confirm the file passes.

## Task 2: Story X UI Integration

- [x] Import the workspace builder into `src/StoryXTestPage.tsx`.
- [x] Replace static lesson content with a production desk: view tabs, binder tree, corkboard, outliner, scrivenings preview, Codex, snapshots, and continuity review.
- [x] Keep the existing profile modal and top navigation.
- [x] Update CSS for the dense desk layout, responsive behavior, and stable card/table dimensions.

## Task 3: Verification

- [x] Run `npm test` after story-engine changes.
- [x] Run `npm run build` before claiming readiness.
- [x] Report any remaining gaps, especially AI provider integration and automatic source citation.
