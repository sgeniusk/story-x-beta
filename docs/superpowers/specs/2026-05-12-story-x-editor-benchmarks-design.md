# Story X Editor Benchmarks Design

## Goal

Bring the strongest Scrivener, Novelcrafter, PlotLens, and open-source AI writing patterns into Story X without weakening its existing writers' room model.

## Product Shape

Story X should become a real production desk for long-form story work. The user can break a manuscript into scenes, inspect the same material as cards or rows, keep a living Codex of story entities, preserve snapshots before risky edits, and surface continuity conflicts instead of hiding them behind cleaner generation.

## Core Modules

- Binder: a hierarchical list of episodes, chapters, scenes, and research/reference material.
- Corkboard: scene cards with hook, synopsis, POV, status, label, tags, linked Codex entries, and canon candidates.
- Outliner: a dense table view for scene metadata, continuity state, word count, and linked story threads.
- Scrivenings: a compile-preview style reader that stitches selected scenes into a continuous manuscript.
- Codex: structured entries for characters, locations, world rules, objects, plot threads, motifs, and research notes.
- Snapshots: named scene or chapter save points with reason, timestamp, and text.
- Continuity Review: conflict issues with severity, source, claim, message, and evidence.

## Engine Boundary

Domain logic stays in `src/lib/storyEngine.ts`. React owns selected view modes, form state, and interaction state. The engine provides deterministic helpers so tests can prove behavior without relying on external AI providers.

## First Increment

The first increment should add the data model and deterministic workspace builder, then wire Story X to display:

- mode tabs for Binder, Corkboard, Outliner, and Scrivenings
- a Codex panel
- snapshot and continuity summaries
- compile preview for generated or seed scenes

AI provider integration, automatic manuscript extraction, exports, and source citations remain later work.
