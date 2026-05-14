# Story X Memory Bank

Story X의 메모리 뱅크는 긴 연재, 후속 시리즈, 매체 전환에서 캐릭터성·세계관·문체가 흔들리지 않도록 원고 전체를 계속 다시 먹이는 방식 대신 구조화된 기억만 꺼내 쓰는 시스템이다.

## Core Principle

- 원문 전체는 기본 컨텍스트가 아니다.
- 에이전트는 자기 역할에 필요한 구조 기억만 읽는다.
- 새 회차에서 승인된 사실만 canon과 ledger에 들어간다.
- private 원문, 인터뷰, 레퍼런스는 동기화하지 않는다.
- 재미를 죽이는 억지 정합성 대신, 충돌을 드러내고 반전·설정 변경·수정 중 하나로 결정한다.

## Folder Model

```text
memory-bank/storyx/{project_id}/
  manifest.json
  story-core.md
  context/
    canon.md
    timeline.md
    continuity-ledger.md
    unresolved-questions.md
  characters/
    {character_id}.json
    relationships.md
  world/
    rules.md
    settings.md
    institutions.md
  voice/
    author-voice-bible.md
    forbidden-phrases.md
  visual/
    style-bible.md
    character-appearance.json
    keyframe-selection.md
    speech-bubble-rules.md
    image-seeds.json
  audio/
    narration-bible.md
    pronunciation.md
    music-motifs.md
  production/
    episodes/
    panels/
    exports/
  reviews/
    persona-review-ledger.md
    failure-log.md
  private/
    raw-sources/  # sync 금지
```

## Sync Policy

`src/lib/memoryBank.ts` builds the logical bank from the current `SeriesProject`.

- `sync`: canon, timeline, character facts, world rules, voice bible, visual/audio bible, review logs.
- `private-never-sync`: raw manuscript, interviews, personal references, sensitive source material.

This keeps the collaboration layer useful without making every agent read private or oversized raw material.

## Context Packets

`buildMemoryBankContextPacket(project, agentId)` generates a small role-specific packet.

- Showrunner reads story core, canon, open threads, recent chapter hooks.
- Character custodian reads character state, canon, recent chapters.
- World keeper reads world rules, canon, unresolved questions.
- Voice curator reads voice bible and recent chapter summary.
- DaVinci reads visual bible, character appearance anchors, recent chapter summary.
- Speech Bubble Agent reads visual bible, speech-bubble rules, voice, and recent chapter summary.
- Keyframe Art Director reads visual bible, character appearance anchors, world mood, and reference-selection rules.
- Frame Assembly Agent reads visual bible, platform output rules, and recent panel/chapter summary.

The packet intentionally sets `includesRawManuscript: false`. If an agent needs raw material, it should ask for an explicit user-approved source excerpt instead of silently loading the whole project.

## Comics Visual Memory

만화와 웹툰은 텍스트보다 시각 일관성이 쉽게 깨지므로 visual memory를 더 세분화한다.

- `visual/keyframe-selection.md`: Midjourney 원화/키프레임 후보, 선택 기준, 승인된 기준 컷, 탈락 이유를 기록한다.
- `visual/speech-bubble-rules.md`: 말풍선 위치, 글자 수, 읽는 순서, 표정/손동작/소품 가림 금지를 기록한다.
- `visual/character-appearance.json`: 승인된 캐릭터 외형 앵커만 들어간다.
- `visual/image-seeds.json`: 다빈치가 컷별 이미지 프롬프트를 만들 때 반복할 스타일/negative prompt 규칙을 둔다.

Midjourney 후보는 사용자가 선택하기 전까지 visual DNA가 아니다. 선택되지 않은 이미지는 캐논이나 캐릭터 외형 기준으로 쓰지 않는다.

## Editor Surface

The editor right rail shows a Memory Bank card with:

- root path
- syncable file count
- private file count
- generated folder groups

This is currently an in-app logical preview. A later export step can write these files to disk, package them for Claude Code, or use them as RAG sources for a hosted Story X service.
