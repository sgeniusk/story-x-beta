# Story X PRD v0.2

Date: 2026-05-12

## 0. 2026-05-14 Evaluator Update

The 12-person synthetic creator tester panel in `docs/story-x-12-creator-tester-report.md` is now reflected as a product direction update. The panel's individual impressions were consolidated by the evaluator agent into a compact P0 set:

1. `Workflow Board`
2. `Story Contract`
3. `Refactor Impact Preview`
4. `Quality Gate System`
5. `Reference DNA Cards`
6. `AI Output Autopsy`

The update is implemented in `src/lib/evaluationSynthesis.ts` and summarized in `docs/storyx-evaluator-development-update.md`.

The updated activation metric is:

> 2분 안에 첫 workflow board 도착.

The updated north star is:

> 창작자가 만든 하나의 이야기가 형태를 바꿔도 영혼을 잃지 않게 돕는다.

## 1. Product Definition

Story X is a multimodal story production OS for creators who want one story core to become many finished forms: novel, web novel, webtoon, insta-toon, short comic, graphic novel, audiobook, audio drama, narrated video, music-backed story, and later motion/video formats.

The product should not start from "generate a chapter" or "make an image." It should start from a story promise, then guide the creator through the right workflow for the chosen format while preserving continuity, style, visual identity, and audio identity.

## 2. Why This PRD Changed

The original product direction was close to a story editor plus continuity engine. The service has now expanded into a cross-format creative system. That changes the product requirements:

- The user chooses the output form and scale, but Story X must provide the workflow.
- UI/UX is the first competitive layer because creators need to know what to do next.
- Output quality is the second layer: story, prose, image, music, narration, and consistency must be separately evaluated.
- Transformation safety is the third layer: when the creator changes a protagonist, gender, relationship, visual reference, or voice casting, the system must update connected story facts without creating shallow find-and-replace damage.
- Benchmarking must cover not only creation services, but also works and genre patterns so Story X can suggest "Hamlet-like pressure" or "Interstellar-like imagination" as reusable story DNA.

## 3. Benchmark Summary

### 3.1 Writing And Planning Tools

| Benchmark | Observed Strength | Product Requirement For Story X |
| --- | --- | --- |
| Scrivener | Binder, corkboard, outliner, snapshots, compile preview | Story X needs multiple views of the same story: structure tree, card board, dense metadata table, and stitched manuscript/audio/script preview. |
| Plottr | Visual timelines, scene cards, story bibles, tags, templates, series planning, export/import | Story X needs visual workflow maps, scene attributes, reusable format templates, series-level continuity, and platform-ready exports. |
| Novelcrafter | Codex and snippets for story bible and AI context | Story X needs a Codex that is not just notes, but active context for text, image, and audio generation. |
| Sudowrite | Write, Describe, Rewrite, Brainstorm, First Draft, Scenes, Draft, plugins | Story X needs local actions for idea generation, sensory expansion, rewrite, scene drafting, and custom workflow actions by format. |
| Campfire | Modular worldbuilding with characters, timelines, maps, manuscript-linked notes | Story X needs modular story objects and manuscript-linked references for world, location, chronology, and lore. |

Benchmark sources: [Plottr features](https://plottr.com/features/), [Sudowrite features](https://docs.sudowrite.com/getting-started/dQph1snuwbfMWG9wRjsNug/features/dq7YUMNy5ZMvKUJiRAisyT), [Novelcrafter Codex/Snippets](https://www.novelcrafter.com/help/categories/snippets#section-faq), [Campfire](https://www.campfirewriting.com/).

### 3.2 Comics, Webtoon, And Image Tools

| Benchmark | Observed Strength | Product Requirement For Story X |
| --- | --- | --- |
| GenToon | AI comic generation, character consistency, reference images, smart speech bubbles, export formats | Story X must treat character reference, panel plan, bubble plan, and export package as first-class workflow steps. |
| Komik Studio and similar AI comic tools | Story, panel, visual consistency, page editor | Story X needs a production room organized around story beats, cuts, panels, speech, and visual locks. |
| Midjourney Character Reference | Uses a character image to preserve facial and clothing traits in new scenes | Story X needs character reference assets and prompts that repeat visual anchors per cut. |
| Runway Gen-4 | Consistent characters, locations, and treatments across scenes | Story X should prepare scene references and visual continuity packets before any video or motion output. |
| Krea | Multi-model image/video workspace and custom model training for consistent outputs | Story X should store reference boards and model/provider-specific prompt instructions separately from story canon. |

Benchmark sources: [GenToon features](https://www.gentoon.ai/en/features), [Midjourney Character Reference](https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference), [Runway Gen-4](https://runwayml.com/research/introducing-runway-gen-4), [Krea docs](https://docs.krea.ai/get-started/what-is-krea).

### 3.3 Audio, Audiobook, And Music Tools

| Benchmark | Observed Strength | Product Requirement For Story X |
| --- | --- | --- |
| ElevenLabs Studio and Audiobooks | Upload manuscripts, chapter structure, auto-assign voices, pronunciation dictionaries, music/SFX tracks, export | Story X needs audio casting, pronunciation ledger, chapter export, narration timing, and regeneration history. |
| Descript | Edit audio/video by editing the transcript; timeline gives precise clip control | Story X should align audio to text at paragraph, line, and character-voice level, then allow text-driven fixes. |
| Udio | Upload audio to extend, remix, stylize, inpaint, or run sessions | Story X should treat music as editable cues and motifs, not one-off background tracks. |
| Suno and similar music systems | Prompt-to-song and extension workflows | Story X needs lyric/cue sheets, mood locks, motif continuity, and rights warnings for generated music. |

Benchmark sources: [ElevenLabs Studio](https://elevenlabs.io/docs/product/projects/overview), [ElevenLabs Audiobooks](https://elevenlabs.io/docs/eleven-creative/products/audiobooks), [Descript audio workflow](https://help.descript.com/hc/en-us/articles/10601764003341-Record-edit-and-export-your-audio-podcast), [Udio audio upload workflows](https://help.udio.com/en/articles/10754328-create-music-with-your-own-audio).

### 3.4 Platform And Market Signals

| Signal | Product Requirement For Story X |
| --- | --- |
| Korean webtoon charts show romance fantasy, family reincarnation, progression/action fantasy, martial arts fantasy, and clear hook packaging remain important. | Story X needs trend-aware packaging checks: title, first-line premise, thumbnail/caption, and platform fit. |
| English WEBTOON trending rewards clear hooks, cadence, discoverability, and instantly readable premises. | Story X should evaluate whether a format has a visible first-click promise. |
| Audiobook markets are expanding AI narration, duet performances, serialized audio, and audio-first discovery. | Story X must support narrator casting, duet or ensemble rules, release cadence, and listener rhythm checks. |

Benchmark sources: [Korean Webtoon Rankings May 2026](https://klitreads.com/2026/05/08/korean-webtoon-rankings-may-2026-biweekly/), [Korean Webnovel Trends May 2026](https://klitreads.com/2026/05/01/korean-webnovel-trends-biweekly-may-1-2026/), [Spotify 2025 audiobook trends](https://newsroom.spotify.com/2025-12-03/wrapped-audiobook-trends/), [Audible 2025 audiobook trends](https://www.audible.com/blog/top-audiobook-trends-2025).

## 4. Product Principles

1. Story first, medium second.
2. The user chooses the form; Story X provides the workflow.
3. Every format has a visible production checklist and hidden quality gates.
4. Continuity should block contradictions, not smooth them over.
5. Visual and audio identity are canon, not decoration.
6. Changing a story entity is a refactor, not a text replacement.
7. Benchmark data should become product behavior, not a research appendix.
8. The product should help beginners move forward and help advanced creators stay in control.

## 5. Target Users

### 5.1 Solo Creator

Wants to turn ideas into serial stories, insta-toons, webtoons, audiobooks, and social content without managing many disconnected tools.

Needs:

- guided workflows
- reusable characters and worlds
- fast iteration
- export packages
- clear quality warnings

### 5.2 Writer With Existing Manuscript

Has a novel, essay, or serial draft and wants to adapt it into audiobook, comic, or platform-native release.

Needs:

- import
- canon extraction
- character and world consistency
- audio or visual adaptation plans
- transformation safety

### 5.3 Visual Story Creator

Works in comics, webtoon, or insta-toon formats and cares about panel rhythm, character consistency, speech bubbles, and visual style.

Needs:

- character reference bible
- cut/panel workflow
- bubble density checks
- platform crop/export presets
- image generation prompt sheets

### 5.4 Audio Creator

Wants audiobook, audio drama, narrated essay, podcast-like adaptation, or music-backed story.

Needs:

- narrator casting
- pronunciation control
- dialogue voice assignment
- music and sound cue sheets
- chapter or episode export

## 6. Core Information Architecture

Story X should be organized around five top-level systems.

### 6.1 Project Router

The router asks:

- What medium are you making?
- What scale or format?
- Is this new work, imported work, or adaptation?
- What is the final delivery channel?

Output:

- `CreativeBlueprint`
- `FormatWorkflow`
- required agents
- required quality gates
- default workspace layout

### 6.2 Story Core

The story core is the source of truth across all media.

Required objects:

- premise
- dramatic question
- audience promise
- protagonist contract
- relationship map
- world rules
- chronology
- theme claim
- plot threads
- canon facts
- soft signals and rumors

### 6.3 Format Workflow Library

Every output format has its own required steps. The workflow library decides which rooms, agents, checklists, and exports appear.

### 6.4 Quality Gate System

Quality gates evaluate the work before it can be marked ready.

Gate categories:

- UI/UX progress clarity
- story strength
- prose or dialogue quality
- continuity
- visual identity
- image quality
- audio voice quality
- music fit
- platform packaging
- export readiness

### 6.5 Reference DNA Database

A structured database of works, genre patterns, motifs, and trend signals. It lets users ask for a reference by analogy without copying the surface.

Example:

- "Hamlet-like pressure" means delayed revenge, inner paralysis, corruption around the throne, and action postponed by doubt.
- "Interstellar-like imagination" means family promise, cosmic scale, time cost, grief across distance, and awe-driven science fantasy.

## 7. Format Workflows

### 7.1 Long Novel

1. Select novel and long-form scale.
2. Build story core.
3. Create series bible and Codex.
4. Build act, season, or volume arc.
5. Create chapter cards with POV, promise, conflict, world cost, and cliffhanger.
6. Draft chapter.
7. Run story, prose, continuity, and voice gates.
8. Save canon deltas.
9. Compile preview and export.

Quality focus:

- strong premise
- chapter-to-chapter escalation
- character growth ledger
- prose voice
- continuity

### 7.2 Web Novel

1. Select web novel or serial long novel.
2. Lock platform promise, cadence, title style, and reader reward.
3. Build episode template: hook, acceleration, emotional choice, reveal, cliffhanger.
4. Draft episode.
5. Run continuity and retention gates.
6. Update open threads and next-episode hook.

Quality focus:

- fast premise compression
- click-driving first sentence
- cliffhanger discipline
- character and world continuity
- platform trend fit

### 7.3 Webtoon

1. Select webtoon.
2. Build visual bible: character sheets, outfits, props, locations, palette, expression range.
3. Build episode promise and scroll rhythm.
4. Convert beats into cuts.
5. Plan speech bubble density and position.
6. Generate or brief images by cut.
7. Run visual continuity, bubble readability, and story gates.
8. Export vertical scroll package.

Quality focus:

- vertical rhythm
- visual anchors
- character consistency
- readable bubbles
- hook every scroll segment

### 7.4 Insta-Toon Carousel

1. Select insta-toon.
2. Choose carousel length: 4, 6, 8, or 10 slides.
3. Define first-slide hook.
4. Define audience emotion: 공감, 위로, 웃김, 반전, 정보, 저장 가치.
5. Confirm character reference, speech tone, and visual style.
6. Build slide rhythm:
   - slide 1: hook
   - slide 2-3: relatable context
   - slide 4-6: pressure, misunderstanding, or turn
   - final slide: save/share beat
7. Plan text and speech bubbles per slide.
8. Generate image prompts or production briefs.
9. Run mobile readability, character consistency, and caption package gates.
10. Export carousel order, captions, hashtags, alt text, and image naming.

Quality focus:

- first slide clarity
- visual consistency
- small-screen text density
- save/share final beat
- no decorative overbuilding

### 7.5 Four-Cut Insta-Toon

1. Select insta-toon, then four-cut.
2. Confirm 1:1 square output.
3. Confirm character reference and recurring prop.
4. Reduce story to one situation and one reversal.
5. Fill fixed quadrant table:
   - top-left: setup
   - top-right: escalation
   - bottom-left: twist setup
   - bottom-right: punchline or emotional turn
6. Plan bubbles, text count, face direction, and eye path.
7. Generate four panel prompts.
8. Run frame assembly gate.
9. Export final square and separated panel assets.

Quality focus:

- clean setup
- one strong reversal
- bubble placement
- expression readability
- consistent character silhouette

### 7.6 Short Comic And Graphic Novel

1. Select comic format.
2. Choose short comic, storybook, or graphic novel.
3. Lock page count and panel density.
4. Build page-turn promise.
5. Create page and panel board.
6. Run dialogue density and visual continuity gates.
7. Export page brief, panel prompts, and final assembly notes.

Quality focus:

- page rhythm
- panel economy
- visual motifs
- repeated image logic
- dialogue restraint

### 7.7 Audiobook

1. Select audiobook.
2. Import or write manuscript.
3. Detect chapters and speaker candidates.
4. Build audio bible:
   - narrator style
   - character voices
   - pronunciation dictionary
   - pacing
   - pause rules
   - emotion range
5. Generate sample passage before full production.
6. Review pronunciation, intonation, breath, silence gaps, and dialogue changes.
7. Generate chapter audio.
8. Run audio quality gate.
9. Export chapter files, whole-book file, metadata, and distribution checklist.

Quality focus:

- narrator fit
- stable voices
- pronunciation
- emotional delivery
- chapter-level regeneration

### 7.8 Audio Drama

1. Select audio drama.
2. Convert story into scene script.
3. Cast narrator and characters.
4. Build soundscape plan: room tone, transition cues, SFX, music motifs.
5. Produce line-by-line voice plan.
6. Run timing and intelligibility gate.
7. Export scene tracks and mixed preview.

Quality focus:

- speaker separation
- emotional performance
- SFX restraint
- music motif continuity
- listener orientation

### 7.9 Music-Backed Story Or Story Song

1. Select music-backed story.
2. Decide whether output is background score, theme song, children's song, or lyrical story.
3. Build motif bible: rhythm, tempo, mood, refrain, instrumentation.
4. Link music cues to story beats.
5. Generate or brief music.
6. Run rights, mood, and repetition gates.
7. Export cue sheet, lyrics, music prompt, and usage notes.

Quality focus:

- music supports story instead of overpowering it
- refrain is memorable
- emotional transitions fit the narrative
- rights and style prompts are safe

### 7.10 Narrated Video Or Video Essay

1. Select narrated video.
2. Define viewer promise and duration.
3. Build script and scene board.
4. Generate narration plan.
5. Generate caption density rules.
6. Create visual beat list.
7. Add music and SFX cues.
8. Run pacing, caption, and audio mix gates.
9. Export script, voiceover, captions, and scene prompts.

Quality focus:

- clear explanation
- caption readability
- voice pacing
- visual support
- retention beats

## 8. Required Feature Sets

### F1. Benchmark Library

Story X must include an internal benchmark library with service references by category.

Fields:

- service name
- category
- benchmarked feature
- relevant workflow pattern
- UI/UX lesson
- quality lesson
- safety lesson
- source URL
- date reviewed

Acceptance criteria:

- A product manager can inspect why a workflow exists.
- A designer can see which UI pattern inspired a feature.
- A workflow can reference multiple benchmarks.

### F2. Format Workflow Builder

The system must generate a workflow from selected medium, scale, and destination.

Fields:

- format id
- input requirements
- required steps
- optional steps
- required agents
- quality gates
- outputs
- export package

Acceptance criteria:

- Selecting "인스타툰" produces a carousel or four-cut workflow.
- Selecting "오디오북" produces a chapter, narrator, pronunciation, and export workflow.
- Selecting "웹툰" produces a visual bible, scroll rhythm, panel, bubble, and export workflow.

### F3. Story Core And Codex

The Codex must store story objects that affect all outputs.

Objects:

- character
- narrator
- world rule
- location
- prop
- relationship
- plot thread
- motif
- visual reference
- audio voice
- music motif
- canon fact
- soft signal

Acceptance criteria:

- Story objects are linked to scenes, cuts, slides, chapters, and audio lines.
- Every generated output can show which Codex entries influenced it.
- Missing key entries trigger workflow warnings.

### F4. Quality Gate Engine

Each workflow must have visible and hidden gates.

Visible gates:

- checklist progress
- blocked issues
- warnings
- export readiness

Hidden gates:

- continuity check
- context pack completeness
- image reference completeness
- audio pronunciation completeness
- platform packaging completeness

Acceptance criteria:

- A blocked contradiction cannot be saved as approved canon.
- A visual workflow cannot export without reference checks.
- An audiobook cannot be marked ready without pronunciation and voice review.

### F5. Story Refactor Engine

Story X must support safe story-wide changes.

Example change:

- "남자 주인공을 여자 주인공으로 바꾸기"

Required impact analysis:

- name
- pronoun or Korean honorific behavior
- relationship labels
- dialogue voice
- character wound
- social position
- romance or power dynamic
- visual reference
- voice casting
- existing canon facts
- generated images
- generated audio
- platform description

Workflow:

1. User requests change.
2. System builds impact map.
3. System shows safe auto changes and risky manual approvals.
4. User approves.
5. System applies patch.
6. System reruns quality gates.
7. System records refactor snapshot.

Acceptance criteria:

- No entity-level change is applied as plain text replacement only.
- Every refactor produces a before/after diff and a rollback snapshot.
- Connected outputs are marked stale until regenerated or approved.

### F6. Reference DNA Database

The system must store reference works and analyze them as reusable story DNA.

Fields:

- work title
- medium
- genre
- surface traits
- structural engine
- emotional engine
- character engine
- world engine
- visual/audio language
- best-fit outputs
- trend fit
- risks
- transformation prompts

Example entry:

| Work | Surface | Deep DNA | Best Use |
| --- | --- | --- | --- |
| Hamlet | prince, throne, revenge, ghost, betrayal | delayed action under moral pressure; corruption around power; self-doubt blocking revenge | male protagonist political revenge, family betrayal, tragic court fantasy |
| Interstellar | space, wormhole, planets, time dilation | family promise under cosmic time cost; awe plus grief; love as continuity across distance | SF family epic, fantasy pilgrimage, audiobook with emotional narration |
| Pride and Prejudice | manners, class, misunderstanding, romance | judgment correction through repeated social tests | romance comedy, relationship-driven serial, dialogue-heavy audiobook |
| Solo Leveling | weak-to-strong, gates, system, monsters | visible progression loop, competence fantasy, escalating spectacle | male-action web novel, webtoon action adaptation, game-system fantasy |

Acceptance criteria:

- Users can search by "느낌", "구조", "주인공 유형", "매체 적합성", or "트렌드".
- The system suggests deep traits, not copyable plot.
- Each reference includes anti-plagiarism guidance.

### F7. Agent System

Agents remain conceptual specialists even when executed in one thread.

Core agents:

- Showrunner
- Character Custodian
- World Keeper
- Genre Stylist
- Continuity Editor
- Voice Curator
- Storyboard Agent
- Visual Bible Agent
- Speech Bubble Agent
- Image Prompt Agent
- Audio Narration Director
- Sound Music Agent
- Publishing Agent
- Benchmark Analyst
- Reference DNA Analyst
- Refactor Safety Agent

Acceptance criteria:

- Each workflow declares which agents are active.
- Each agent has typed outputs.
- Continuity Editor can block output from any format.

## 9. UI/UX Requirements

### 9.1 First Screen

The first screen should not be a landing page. It should be a production router.

Required controls:

- New project
- Import project
- Choose medium
- Choose format
- Choose final destination
- Start from benchmark/reference

### 9.2 Format Selection

Format selection must show:

- recommended use
- expected workload
- required assets
- output package
- quality risks

Example:

- Insta-toon: needs character reference, slide count, text density check, square export.
- Audiobook: needs manuscript, narrator, pronunciation dictionary, voice sample, chapter export.

### 9.3 Workflow Screen

Each workflow screen should have:

- left rail: project state and Codex
- center: current production board
- right rail: quality gates and benchmark/reference suggestions
- bottom or side: export package

### 9.4 Benchmark UX

The user should not see a giant research database first. Benchmark data should appear as:

- workflow recommendations
- why this step exists
- quality checklist
- reference suggestions
- trend warnings

## 10. Quality Requirements

### 10.1 Story Quality

Required checks:

- Does the premise imply a character, pressure, cost, and irreversible change?
- Does each scene or cut change information, relationship, power, risk, or self-understanding?
- Does the ending or final slide pay off the promise?

### 10.2 Prose And Style Quality

Required checks:

- voice consistency
- Korean naturalness
- sentence rhythm
- cliche density
- POV and tense
- dialogue purpose

### 10.3 Continuity Quality

Required checks:

- hard canon contradiction
- living state drift
- chronology conflict
- relationship regression
- world rule shortcut
- unearned character change

### 10.4 Image Quality

Required checks:

- character face and silhouette consistency
- costume and prop continuity
- style lock
- composition and crop
- speech bubble space
- text readability

### 10.5 Audio Quality

Required checks:

- narrator fit
- character voice distinction
- pronunciation
- emotion and intonation
- silence gaps
- music/SFX balance
- chapter-level export integrity

### 10.6 Platform Packaging Quality

Required checks:

- title clarity
- thumbnail or first-slide hook
- caption
- tags
- export dimensions
- file naming
- upload order

## 11. Data Model Draft

```ts
interface BenchmarkService {
  id: string;
  name: string;
  category: 'writing' | 'comic' | 'image' | 'audio' | 'music' | 'platform';
  benchmarkedFeatures: string[];
  workflowLessons: string[];
  qualityLessons: string[];
  safetyLessons: string[];
  sourceUrls: string[];
  reviewedAt: string;
}

interface FormatWorkflow {
  id: string;
  label: string;
  medium: string;
  scale: string;
  requiredInputs: string[];
  steps: WorkflowStep[];
  activeAgents: string[];
  qualityGates: string[];
  exportPackage: string[];
}

interface ReferenceDNA {
  id: string;
  title: string;
  medium: string;
  genre: string[];
  surfaceTraits: string[];
  structuralEngine: string[];
  emotionalEngine: string[];
  bestFitOutputs: string[];
  trendFit: string;
  risks: string[];
}

interface RefactorImpact {
  requestedChange: string;
  affectedEntities: string[];
  safeAutoChanges: string[];
  riskyChanges: string[];
  staleOutputs: string[];
  requiredGates: string[];
}
```

## 12. MVP Scope

### P0: Planning And Data Foundation

- Create this PRD.
- Create initial benchmark service dataset.
- Create initial format workflow dataset.
- Create initial reference DNA dataset with 20-30 works.
- Add PRD-derived product map to docs.

### P1: Product Router And Workflow Preview

- Update UI to select medium, format, scale, and destination.
- Show workflow preview before project creation.
- Show required assets and quality gates.
- Add benchmark-backed "why this workflow" panel.

### P2: Format-Specific Workspaces

- Insta-toon workspace.
- Webtoon workspace.
- Long novel/web novel workspace.
- Audiobook workspace.
- Reference DNA side panel.

### P3: Quality Gates And Refactor Safety

- Implement deterministic quality gate engine.
- Add refactor impact analysis.
- Add stale output tracking.
- Add rollback snapshots.

### P4: Generation Integrations

- LLM drafting.
- Image provider adapters.
- Audio provider adapters.
- Music provider adapters.
- Export pipelines.

## 13. Success Metrics

### Activation

- Creator reaches first workflow board within 2 minutes.
- Creator understands required next step without documentation.

### Creation Quality

- User can complete one insta-toon workflow with all gates visible.
- User can complete one audiobook chapter workflow with voice and pronunciation review.
- User can generate one long-form chapter with canon deltas.

### Safety

- Story refactor produces an impact map before applying changes.
- Continuity gate blocks known contradictions.
- Visual and audio outputs are marked stale after relevant story changes.

### Retention

- Users reuse the same story core across at least two output forms.
- Users return to Codex or Reference DNA DB before generating new output.

## 14. Non-Goals For The Next Increment

- Full automated publishing to external platforms.
- Full video generation.
- Full rights/legal verification.
- Real-time multi-user collaboration.
- Replacing professional human editing, acting, illustration, or audio mastering.

## 15. Key Risks

### Risk: Too many formats make the product feel unfocused.

Mitigation:

- Use a strong router.
- Show one workflow at a time.
- Keep story core shared across all formats.

### Risk: Benchmark data becomes static research nobody uses.

Mitigation:

- Attach benchmark lessons to workflow steps and quality gates.
- Store source links and reviewed dates.

### Risk: AI output looks impressive but weakens the story.

Mitigation:

- Require quality gates before approval.
- Keep Continuity Editor as blocking authority.

### Risk: Refactors silently corrupt long projects.

Mitigation:

- Treat refactors like code changes: impact map, diff, approval, test gates, rollback.

### Risk: Audio and image providers vary in quality.

Mitigation:

- Store provider-agnostic story, visual, and audio bibles.
- Put provider-specific prompts in adapters.

## 16. Open Questions

- Should Story X prioritize Korean web novel/webtoon workflows before global novel/audiobook workflows?
- Should Reference DNA DB be manually curated first or partially generated from public-domain summaries?
- How much of benchmark data should be visible to users versus used internally?
- Which output form should be the first paid workflow: insta-toon, web novel, or audiobook?
- Should audio drama be a separate top-level format or an advanced audiobook mode?

## 17. Immediate Next Step

Build the data layer implied by this PRD:

1. `BenchmarkService[]`
2. `FormatWorkflow[]`
3. `ReferenceDNA[]`
4. `QualityGate[]`
5. `RefactorImpact`

Then update the Story X UI so users can choose a format and see the exact workflow Story X recommends before generation begins.
