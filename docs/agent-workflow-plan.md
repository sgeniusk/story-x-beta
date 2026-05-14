# Creative Agent Workflow Plan

## Purpose

This document defines how the service should grow from a format router into a multi-agent creative operating system for novels, essays, audiobooks, comics, webtoons, insta-toons, short comics, and later comic subtypes such as four-cut insta-toons, storybooks, and graphic novels.

The `aitoon.skill` package was reviewed as reference material only. The useful ideas to carry forward are:

- split comics work by mode: webtoon versus insta-toon
- require character asset/reference checks before image work
- treat four-cut insta-toons as a fixed quadrant structure: top-left, top-right, bottom-left, bottom-right
- track speech bubble presence and position per cut
- separate story structure from image prompt generation
- finish visual work with a frame/composition assembly step

## Agent Architecture Plan

### Core Agents

| Agent | Applies To | Responsibility | Key Output |
| --- | --- | --- | --- |
| Showrunner Agent | All long or serial formats | Defines premise, episode promise, escalation, reveal, and hook | Beat contract |
| Character Agent | All formats | Protects desire, wound, voice, visual identity, and relationship state | Character delta |
| World Agent | Novels, webtoons, graphic novels | Protects setting rules, magic/technology limits, chronology, and locations | World constraint report |
| Genre Writing Agent | Novels, scripts, narrative comics | Applies genre rhythm, prose texture, and reader promise | Style pass |
| Essay Interviewer | Essays and memoir-like prose | Asks for lived material, missing memories, surrounding-person boundaries, and reflective questions | Interview packet |
| Voice Curator | Essays, novels, scripts | Maintains author voice, Korean naturalness, style preferences, and forbidden phrases | Voice bible |
| Audio Narration Director | Audiobooks, music videos, educational videos, children's readings | Plans voice tone, pacing, pauses, and listener rhythm | Narration sheet |
| Education Video Architect | Educational videos | Defines learning objective, explanation sequence, examples, and checks for understanding | Teaching sequence |
| Sound Music Agent | Music videos and children's readings | Designs hooks, motifs, repeated lines, music cues, and sound continuity | Cue sheet |
| Continuity Editor | All formats | Blocks contradictions and writes new canon facts | Approval report |

### Visual Agents

| Agent | Applies To | Responsibility | Key Output |
| --- | --- | --- | --- |
| Storyboard Agent | Webtoon, comics, graphic novel | Converts beats into panels, pages, scroll rhythm, or cut sequence | Panel/cut list |
| Visual Bible Agent | Comics formats | Maintains character sheet, outfit rules, props, locations, palette | Visual bible update |
| Speech Bubble Agent | Insta-toon, four-cut insta-toon, comics | Checks text density, bubble style, bubble position, and readability | Bubble placement table |
| DaVinci Image Agent | Image-generating comics formats | Creates FLUX.2-ready cut-by-cut prompts with reference image rules | Image prompt set |
| Frame Assembly Agent | Four-cut insta-toon, carousel posts | Plans final square frame, margins, borders, order, and export naming | Frame brief |

### DaVinci Prompting Rules

DaVinci follows the BFL FLUX.2 prompting guide for image-generation prompts:

- Write prompts in priority order: subject, action, style, context, then secondary details.
- Use positive descriptions only. Describe the intended result instead of negative prompts.
- For comics and sequential art, repeat the character identity, costume, props, and visual anchors in every cut.
- Use structured JSON-like fields for production workflows: scene, subjects, style, composition, lighting, mood, text, and aspect ratio.
- When text or speech bubbles are needed, quote the text and specify placement, size, and style.
- Use native Korean for Korean cultural details and character context.
- Match aspect ratio to medium: 1:1 for insta-toon and four-cut insta-toon, 9:16 for vertical webtoon, 4:3 for short comic and graphic-novel pages.

### Platform Agents

| Agent | Applies To | Responsibility | Key Output |
| --- | --- | --- | --- |
| Publishing Agent | Web novel, Instagram, webtoon platforms | Checks title, caption, thumbnail, tags, upload sequence | Publishing checklist |
| Analytics Agent | Serial formats | Tracks retention hooks, unanswered questions, reader promise | Iteration notes |

## Recommended Build Plan

### Phase 1: Router And Blueprint

- Keep `src/lib/projectBlueprint.ts` as the source of truth for medium and format selection.
- Add one blueprint per format, including novel, essay, and comics formats.
- Ensure every blueprint declares management focus, agent stack, skill stack, and production phases.
- Test every new format in `src/lib/projectBlueprint.test.ts`.

### Phase 2: Workspace Specialization

- Add a development room between blueprint and production workspace.
- The development room must collect:
  - material
  - story seed
  - art direction or prose style
  - character seed
  - audience
  - constraints
- The development room outputs a `CreativeDevelopmentPackage` before production begins.
- Keep `serial-writing-studio` for prose-first formats.
- Split `visual-storyboard-studio` into specialized states:
  - webtoon episode board
  - insta-toon carousel board
  - insta-toon detail board, including carousel or four-cut structure
  - short comic detail board, including storybook or graphic-novel structure
  - graphic novel page board
- Each workspace should show only the controls that matter for its format.

### Phase 3: Agent Output Contracts

- Define typed outputs for each agent:
  - `BeatContract`
  - `CharacterDelta`
  - `VisualBibleEntry`
  - `PanelPlan`
  - `SpeechBubblePlan`
  - `ImagePromptSet`
  - `ContinuityReport`
- Add tests that validate required fields before a draft can be accepted.

### Phase 4: Asset And Canon Persistence

- Store project bible, character references, visual bible, canon facts, and produced chapters/cuts separately.
- Add import/export for Markdown, JSON, image prompt sheets, and carousel briefs.

### Phase 5: Real Generation Integrations

- Replace local deterministic generators with LLM/image model calls behind stable interfaces.
- Keep continuity checks local and deterministic where possible.
- Treat model output as draft data that must pass agent validation before saving.

## Media Workflows

### Novel

1. Select `소설`.
2. Select `장편`, `중편`, or `단편`.
3. Build story bible: premise, genre, characters, world rules, audience promise.
4. Run Showrunner Agent to define story arc or chapter promise.
5. Run Character Agent and World Agent.
6. Run Genre Writing Agent.
7. Run Continuity Editor.
8. Save chapter, memory anchors, and new canon facts.

### Essay

1. Select `에세이`.
2. Select `개인 에세이`, `회고 에세이`, or `에세이 연재`.
3. Run Essay Interviewer before drafting. Ask about facts, remembered details, avoided feelings, present-day interpretation, and why this story matters now.
4. Mark surrounding people as real people, anonymized composites, omitted figures, or fully fictionalized stand-ins.
5. Run Voice Curator to create a voice bible: sentence rhythm, metaphor density, formality, favorite phrases, forbidden AI-like phrases.
6. Run GOMI Writer and Humanizer checks for natural Korean.
7. Draft only after enough user-supplied material exists.
8. Save voice bible, privacy notes, and revised questions for the next essay.

### Audiobook / Audio-Video

1. Select `오디오북`.
2. Select `뮤직비디오`, `교육영상`, or `동요읽기`.
3. Build the listening promise: who listens, what they should feel or learn, and what phrase or idea should remain.
4. Run Audio Narration Director for voice tone, pacing, pauses, emphasis, and repeated lines.
5. Run Sound Music Agent for music cues, sound effects, motifs, and chorus or hook structure.
6. For `교육영상`, run Education Video Architect for learning objective, example order, captions, and recap.
7. Build a scene or caption board only after narration rhythm is clear.
8. Save audio cues, narrator rules, caption density, and continuity notes.

### Web Novel

1. Select `소설 > 장편`.
2. Lock reader promise, episode cadence, cliffhanger style, and season arc.
3. Generate episode beat contract.
4. Draft episode with genre rhythm.
5. Validate character/world continuity.
6. Save new canon and open thread changes.
7. Prepare next-episode hook.

### Screenplay

1. Select `소설` until a dedicated screenplay medium is added.
2. Use scene objective, visual action, dialogue pressure, and act structure.
3. Run Showrunner Agent for sequence purpose.
4. Run Character Agent for playable intent.
5. Run Genre Writing Agent in screenplay mode.
6. Run Continuity Editor for chronology and reveal timing.
7. Export scenes to Fountain later.

### Webtoon

1. Select `만화 > 웹툰 연재`.
2. Build visual bible: character sheet, costume rules, recurring props, locations.
3. Define episode promise and scroll hook.
4. Run Storyboard Agent for cut/scroll sequence.
5. Run Speech Bubble Agent for text density and readability.
6. Run DaVinci Image Agent for each cut if image generation is needed.
7. Run Continuity Editor and save visual canon.

### Insta-Toon Carousel

1. Select `만화 > 인스타툰`.
2. Choose subtype in the next step: carousel or four-cut.
3. Define carousel promise: first slide hook, middle rhythm, save/share final slide.
4. Confirm character reference and tone.
5. Build 1-10 slide plan.
6. Write slide text and visual instruction.
7. Run Speech Bubble Agent.
8. Run DaVinci Image Agent and Frame Assembly Agent.

### Four-Cut Insta-Toon

1. Select `만화 > 인스타툰`.
2. Choose `네컷` in the next detail step.
3. Confirm character reference image and prompt, or create a character reference brief.
4. Reduce story to one situation and one reversal.
5. Fill the four-cut table:
   - cut 1: top-left setup
   - cut 2: top-right escalation
   - cut 3: bottom-left twist setup
   - cut 4: bottom-right punchline or emotional turn
6. Add dialogue, speech bubble style, and bubble position per cut.
7. Generate four DaVinci image prompts with fixed 1:1 square rules.
8. Run Frame Assembly Agent for final square composition.

### Short Comic

1. Select `만화 > 단편 만화`.
2. Choose subtype in the next step: short comic, storybook, or graphic novel.
3. Lock page count and panel density.
4. Define page-turn promise.
5. Produce panel plan.
6. Validate visual continuity and dialogue density.
7. Export page/cut brief.

### Graphic Novel

1. Select `만화 > 단편 만화`.
2. Choose `그래픽노블` in the next detail step.
3. Build chapter rhythm, recurring image motifs, and page sequence.
4. Run Showrunner, Character, World, and Storyboard Agents.
5. Validate page rhythm and visual canon.
6. Save chapter/page bible updates.
