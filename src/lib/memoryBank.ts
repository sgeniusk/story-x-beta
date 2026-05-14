import type { CanonFact, Chapter, SeriesProject } from './storyEngine';
import { getProjectLocalization, type LocalizationPolicy } from './localization';

export type MemoryBankSyncPolicy = 'sync' | 'private-never-sync';
export type MemoryBankFileKind = 'json' | 'markdown' | 'placeholder';

export interface MemoryBankFile {
  path: string;
  kind: MemoryBankFileKind;
  content: string;
  syncPolicy: MemoryBankSyncPolicy;
}

export interface StoryMemoryBank {
  root: string;
  files: MemoryBankFile[];
  syncableFiles: MemoryBankFile[];
}

export interface MemoryBankContextPacket {
  agentId: string;
  sections: string[];
  memoryAnchors: string[];
  includesRawManuscript: boolean;
  content: string;
}

export type MemoryBankRecordKind = 'story-core' | 'character' | 'world' | 'canon' | 'voice' | 'visual' | 'audio';

export interface MemoryBankEditableRecord {
  id: string;
  kind: MemoryBankRecordKind;
  title: string;
  summary: string;
  sourcePath: string;
  syncPolicy: MemoryBankSyncPolicy;
  fields: Array<{
    label: string;
    value: string;
  }>;
  tags: string[];
}

export interface MemoryBankPacketSummary {
  agentId: string;
  label: string;
  sections: string[];
  anchorCount: number;
  includesRawManuscript: boolean;
  sourcePaths: string[];
}

export interface MemoryBankWorkbench {
  root: string;
  editableRecords: MemoryBankEditableRecord[];
  packetSummaries: MemoryBankPacketSummary[];
  safetyRules: string[];
}

export type MemoryApprovalDecision = 'approved' | 'revision' | 'hold';
export type MemoryApprovalSource = 'chapter-canon' | 'ai-review';

export interface MemoryApprovalSourceCandidate {
  id: string;
  owner: 'character' | 'world' | 'plot' | 'voice' | 'visual' | 'audio';
  status: string;
  statement: string;
  sourceAgentId: string;
  targetPath: string;
  rationale: string;
}

export interface MemoryApprovalQueueItem {
  id: string;
  source: MemoryApprovalSource;
  owner: MemoryApprovalSourceCandidate['owner'];
  status: string;
  decision?: MemoryApprovalDecision;
  statement: string;
  editableStatement: string;
  sourceAgentId: string;
  targetPath: string;
  rationale: string;
  impactAreas: string[];
  canSync: boolean;
}

export interface MemoryApprovalQueue {
  items: MemoryApprovalQueueItem[];
  summary: {
    total: number;
    undecided: number;
    approved: number;
    revision: number;
    hold: number;
    canSync: number;
  };
}

export interface BuildMemoryApprovalQueueOptions {
  project: SeriesProject;
  reviewCandidates?: MemoryApprovalSourceCandidate[];
  decisions?: Record<string, MemoryApprovalDecision>;
  statementOverrides?: Record<string, string>;
}

export const memoryBankTemplate = `memory-bank/storyx/{project_id}/
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
    voice-by-language.json
  localization/
    glossary.json
    name-policy.md
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
    raw-sources/  # sync 금지, 원문/인터뷰/민감자료 보관

Expanded guardrail paths:
- context/continuity-ledger.md
- private/raw-sources/`;

const folderList = [
  'context',
  'characters',
  'world',
  'voice',
  'localization',
  'visual',
  'audio',
  'production',
  'reviews',
  'private/raw-sources'
];

const contextSectionsByAgent: Record<string, string[]> = {
  showrunner: ['story-core', 'canon', 'open-threads', 'recent-chapters'],
  'character-custodian': ['story-core', 'characters', 'canon', 'recent-chapters'],
  'world-keeper': ['story-core', 'world', 'canon', 'open-threads'],
  'genre-stylist': ['story-core', 'recent-chapters', 'voice', 'open-threads'],
  'continuity-editor': ['canon', 'world', 'characters', 'open-threads', 'recent-chapters'],
  'essay-interviewer': ['story-core', 'voice', 'open-threads'],
  'voice-curator': ['story-core', 'voice', 'recent-chapters'],
  'audio-narration-director': ['story-core', 'audio', 'recent-chapters'],
  'education-video-architect': ['story-core', 'open-threads', 'recent-chapters'],
  'sound-music-agent': ['story-core', 'audio', 'recent-chapters'],
  'storyboard-agent': ['story-core', 'visual', 'recent-chapters'],
  'speech-bubble-agent': ['story-core', 'visual', 'voice', 'recent-chapters'],
  'keyframe-art-director': ['story-core', 'visual', 'characters', 'world'],
  'frame-assembly-agent': ['story-core', 'visual', 'recent-chapters'],
  'da-vinci': ['story-core', 'visual', 'characters', 'recent-chapters']
};

export function buildStoryMemoryBank(project: SeriesProject): StoryMemoryBank {
  const root = `memory-bank/storyx/${slugProjectId(project.id)}`;
  const localization = getProjectLocalization(project);
  const files: MemoryBankFile[] = [];

  function addFile(relativePath: string, kind: MemoryBankFileKind, content: string, syncPolicy: MemoryBankSyncPolicy = 'sync') {
    files.push({
      path: `${root}/${relativePath}`,
      kind,
      content,
      syncPolicy
    });
  }

  addFile(
    'manifest.json',
    'json',
    stringifyJson({
      schemaVersion: 1,
      projectId: project.id,
      title: project.title,
      genre: project.genre,
      currentEpisode: project.currentEpisode,
      localization: {
        uiLocale: localization.uiLocale,
        workLanguage: localization.workLanguage,
        targetMarket: localization.targetMarket
      },
      memoryModel: 'storyx-structured-memory-bank',
      storagePolicy: {
        structuredFacts: 'sync',
        rawSources: 'private-never-sync',
        contextPackets: 'generated-on-demand'
      },
      folders: folderList
    })
  );
  addFile('story-core.md', 'markdown', renderStoryCore(project));
  addFile('context/canon.md', 'markdown', renderCanon(project.canonFacts));
  addFile('context/timeline.md', 'markdown', renderTimeline(project));
  addFile('context/continuity-ledger.md', 'markdown', renderContinuityLedger(project));
  addFile('context/unresolved-questions.md', 'markdown', renderOpenThreads(project.openThreads));

  project.characters.forEach((character) => {
    addFile(`characters/${slugProjectId(character.id)}.json`, 'json', stringifyJson(character));
  });
  addFile('characters/relationships.md', 'markdown', renderRelationships(project));

  addFile('world/rules.md', 'markdown', renderWorldRules(project));
  addFile('world/settings.md', 'markdown', renderWorldSettings(project));
  addFile('world/institutions.md', 'markdown', renderWorldInstitutions());

  addFile('voice/author-voice-bible.md', 'markdown', renderVoiceBible(project));
  addFile('voice/forbidden-phrases.md', 'markdown', renderForbiddenPhrases(project));
  addFile('voice/voice-by-language.json', 'json', stringifyJson(localization.voiceByLanguage));

  addFile('localization/glossary.json', 'json', stringifyJson({ schemaVersion: 1, terms: localization.glossary }));
  addFile('localization/name-policy.md', 'markdown', renderNamePolicy(localization));

  addFile('visual/style-bible.md', 'markdown', renderVisualStyleBible(project));
  addFile('visual/character-appearance.json', 'json', stringifyJson(buildCharacterAppearance(project)));
  addFile('visual/keyframe-selection.md', 'markdown', renderKeyframeSelection(project));
  addFile('visual/speech-bubble-rules.md', 'markdown', renderSpeechBubbleRules(project));
  addFile('visual/image-seeds.json', 'json', stringifyJson(buildImageSeeds(project)));

  addFile('audio/narration-bible.md', 'markdown', renderNarrationBible(project));
  addFile('audio/pronunciation.md', 'markdown', renderPronunciationGuide(project));
  addFile('audio/music-motifs.md', 'markdown', renderMusicMotifs(project));

  addFile('production/episodes/README.md', 'markdown', renderProductionReadme('episodes', '회차 원고, 후킹 문장, 승인된 캐논 업데이트를 묶습니다.'));
  addFile('production/panels/README.md', 'markdown', renderProductionReadme('panels', '웹툰/인스타툰/동화책 컷 구성과 이미지 프롬프트를 묶습니다.'));
  addFile('production/exports/README.md', 'markdown', renderProductionReadme('exports', '게시본, 다운로드 산출물, 매체 전환 패키지를 둡니다.'));

  addFile('reviews/persona-review-ledger.md', 'markdown', renderPersonaReviewLedger(project));
  addFile('reviews/failure-log.md', 'markdown', renderFailureLog(project));
  addFile('private/raw-sources/.gitkeep', 'placeholder', 'Raw manuscript, interviews, references, and private source files stay here. Do not sync.\n', 'private-never-sync');

  return {
    root,
    files,
    syncableFiles: files.filter((file) => file.syncPolicy === 'sync')
  };
}

export function buildMemoryBankContextPacket(project: SeriesProject, agentId: string): MemoryBankContextPacket {
  const sections = contextSectionsByAgent[agentId] ?? ['story-core', 'canon', 'open-threads'];
  const memoryAnchors = collectMemoryAnchors(project);
  const contentBlocks = sections.map((section) => renderContextSection(project, section));

  return {
    agentId,
    sections,
    memoryAnchors,
    includesRawManuscript: false,
    content: [`# Context Packet: ${agentId}`, ...contentBlocks].join('\n\n')
  };
}

export function buildMemoryBankWorkbench(project: SeriesProject): MemoryBankWorkbench {
  const bank = buildStoryMemoryBank(project);
  const packetAgentIds = [
    'showrunner',
    'character-custodian',
    'world-keeper',
    'genre-stylist',
    'continuity-editor',
    'voice-curator',
    'storyboard-agent',
    'da-vinci',
    'audio-narration-director'
  ];

  return {
    root: bank.root,
    editableRecords: buildEditableRecords(project, bank.root),
    packetSummaries: packetAgentIds.map((agentId) => {
      const packet = buildMemoryBankContextPacket(project, agentId);

      return {
        agentId,
        label: getPacketLabel(agentId),
        sections: packet.sections,
        anchorCount: packet.memoryAnchors.length,
        includesRawManuscript: packet.includesRawManuscript,
        sourcePaths: packet.sections.map((section) => resolveSectionSourcePath(bank.root, section))
      };
    }),
    safetyRules: [
      'private/raw-sources는 에이전트 기본 패킷에 넣지 않습니다.',
      '캐논 충돌은 다수결로 통과시키지 않고 reveal, revision, blocked draft 중 하나로 분류합니다.',
      '캐릭터/세계관/문체 변경은 저장 전에 영향 범위를 먼저 확인합니다.',
      '원화 후보는 사용자가 선택한 뒤에만 visual DNA로 승격합니다.'
    ]
  };
}

export function buildMemoryApprovalQueue({
  project,
  reviewCandidates = [],
  decisions = {},
  statementOverrides = {}
}: BuildMemoryApprovalQueueOptions): MemoryApprovalQueue {
  const root = `memory-bank/storyx/${slugProjectId(project.id)}`;
  const chapterCandidates = project.chapters
    .flatMap((chapter) => chapter.newCanonFacts.map((fact) => ({ chapter, fact })))
    .map<MemoryApprovalQueueItem>(({ chapter, fact }) => {
      const decision = decisions[fact.id];
      const editableStatement = statementOverrides[fact.id] ?? fact.statement;

      return {
        id: fact.id,
        source: 'chapter-canon',
        owner: fact.owner,
        status: 'pending',
        decision,
        statement: fact.statement,
        editableStatement,
        sourceAgentId: 'continuity-editor',
        targetPath: `${root}/context/canon.md`,
        rationale: `${chapter.episode}화에서 발생한 새 사실 후보입니다. 승인 전까지 다음 회차 canon으로 고정하지 않습니다.`,
        impactAreas: resolveImpactAreas(fact.owner, `${root}/context/canon.md`),
        canSync: decision === 'approved'
      };
    });

  const aiCandidates = reviewCandidates.map<MemoryApprovalQueueItem>((candidate) => {
    const decision = decisions[candidate.id];
    const editableStatement = statementOverrides[candidate.id] ?? candidate.statement;

    return {
      id: candidate.id,
      source: 'ai-review',
      owner: candidate.owner,
      status: candidate.status,
      decision,
      statement: candidate.statement,
      editableStatement,
      sourceAgentId: candidate.sourceAgentId,
      targetPath: normalizeMemoryTargetPath(root, candidate.targetPath, candidate.owner),
      rationale: candidate.rationale,
      impactAreas: resolveImpactAreas(candidate.owner, candidate.targetPath),
      canSync: decision === 'approved' && candidate.status !== 'blocked'
    };
  });

  const items = [...chapterCandidates, ...aiCandidates];

  return {
    items,
    summary: {
      total: items.length,
      undecided: items.filter((item) => !item.decision).length,
      approved: items.filter((item) => item.decision === 'approved').length,
      revision: items.filter((item) => item.decision === 'revision').length,
      hold: items.filter((item) => item.decision === 'hold').length,
      canSync: items.filter((item) => item.canSync).length
    }
  };
}

function normalizeMemoryTargetPath(root: string, targetPath: string, owner: MemoryApprovalSourceCandidate['owner']) {
  if (!targetPath) {
    return `${root}/${resolveOwnerDefaultPath(owner)}`;
  }

  if (targetPath.startsWith('memory-bank/')) {
    return targetPath;
  }

  return `${root}/${targetPath.replace(/^\/+/, '')}`;
}

function resolveOwnerDefaultPath(owner: MemoryApprovalSourceCandidate['owner']) {
  const paths: Record<MemoryApprovalSourceCandidate['owner'], string> = {
    character: 'characters/relationships.md',
    world: 'world/rules.md',
    plot: 'context/canon.md',
    voice: 'voice/author-voice-bible.md',
    visual: 'visual/style-bible.md',
    audio: 'audio/narration-bible.md'
  };

  return paths[owner];
}

function resolveImpactAreas(owner: MemoryApprovalSourceCandidate['owner'], targetPath: string) {
  const baseByOwner: Record<MemoryApprovalSourceCandidate['owner'], string[]> = {
    character: ['characters', 'canon'],
    world: ['world', 'canon'],
    plot: ['canon', 'timeline'],
    voice: ['voice', 'draft'],
    visual: ['visual', 'production'],
    audio: ['audio', 'production']
  };
  const impactAreas = new Set(baseByOwner[owner]);

  if (targetPath.includes('production/')) {
    impactAreas.add('production');
  }

  if (targetPath.includes('reviews/')) {
    impactAreas.add('reviews');
  }

  return Array.from(impactAreas);
}

function buildEditableRecords(project: SeriesProject, root: string): MemoryBankEditableRecord[] {
  const storyCore: MemoryBankEditableRecord = {
    id: `record-story-core-${project.id}`,
    kind: 'story-core',
    title: project.title,
    summary: project.logline,
    sourcePath: `${root}/story-core.md`,
    syncPolicy: 'sync',
    fields: [
      { label: 'logline', value: project.logline },
      { label: 'tone', value: project.tone },
      { label: 'audiencePromise', value: project.audiencePromise }
    ],
    tags: ['story-contract', 'north-star']
  };

  const characterRecords = project.characters.map<MemoryBankEditableRecord>((character) => ({
    id: `record-character-${character.id}`,
    kind: 'character',
    title: character.name,
    summary: character.role,
    sourcePath: `${root}/characters/${slugProjectId(character.id)}.json`,
    syncPolicy: 'sync',
    fields: [
      { label: 'desire', value: character.desire },
      { label: 'wound', value: character.wound },
      { label: 'currentState', value: character.currentState },
      { label: 'voiceRules', value: character.voiceRules.join(' / ') }
    ],
    tags: ['character', 'voice', ...character.canonAnchors.slice(0, 2)]
  }));

  const worldRecords = project.worldRules.map<MemoryBankEditableRecord>((rule) => ({
    id: `record-world-${rule.id}`,
    kind: 'world',
    title: rule.title,
    summary: rule.rule,
    sourcePath: `${root}/world/rules.md`,
    syncPolicy: 'sync',
    fields: [
      { label: 'rule', value: rule.rule },
      { label: 'forbiddenContradictions', value: rule.forbiddenContradictions.map((item) => item.claim).join(' / ') }
    ],
    tags: ['world', 'cost-rule']
  }));

  const canonRecords = project.canonFacts.map<MemoryBankEditableRecord>((fact) => ({
    id: `record-canon-${fact.id}`,
    kind: 'canon',
    title: `EP ${fact.episode} · ${fact.owner}`,
    summary: fact.statement,
    sourcePath: `${root}/context/canon.md`,
    syncPolicy: 'sync',
    fields: [{ label: 'statement', value: fact.statement }],
    tags: ['canon', fact.owner]
  }));

  const voiceRecord: MemoryBankEditableRecord = {
    id: `record-voice-${project.id}`,
    kind: 'voice',
    title: '문체 바이블',
    summary: project.tone,
    sourcePath: `${root}/voice/author-voice-bible.md`,
    syncPolicy: 'sync',
    fields: [
      { label: 'globalTone', value: project.tone },
      { label: 'characterVoiceRules', value: project.characters.flatMap((character) => character.voiceRules).join(' / ') }
    ],
    tags: ['voice', 'korean-naturalness']
  };

  const visualRecord: MemoryBankEditableRecord = {
    id: `record-visual-${project.id}`,
    kind: 'visual',
    title: '시각 바이블',
    summary: `${project.tone} 기반의 캐릭터 외형, 조명, 렌즈, 말풍선 기준`,
    sourcePath: `${root}/visual/style-bible.md`,
    syncPolicy: 'sync',
    fields: [
      { label: 'style', value: project.tone },
      { label: 'characterAppearance', value: project.characters.map((character) => character.name).join(' / ') }
    ],
    tags: ['visual', 'da-vinci', 'midjourney-keyframe']
  };

  const audioRecord: MemoryBankEditableRecord = {
    id: `record-audio-${project.id}`,
    kind: 'audio',
    title: '오디오 바이블',
    summary: `${project.tone} 기반의 낭독 속도, 쉼, 발음, 음악 모티프`,
    sourcePath: `${root}/audio/narration-bible.md`,
    syncPolicy: 'sync',
    fields: [
      { label: 'narrationTone', value: project.tone },
      { label: 'pronunciationTargets', value: project.characters.map((character) => character.name).join(' / ') }
    ],
    tags: ['audio', 'narration', 'music-cue']
  };

  return [storyCore, ...characterRecords, ...worldRecords, ...canonRecords, voiceRecord, visualRecord, audioRecord];
}

function getPacketLabel(agentId: string) {
  const labels: Record<string, string> = {
    showrunner: '쇼러너',
    'character-custodian': '캐릭터 큐레이터',
    'world-keeper': '배경 설계자',
    'genre-stylist': '장르 스타일리스트',
    'continuity-editor': '연속성 감수자',
    'voice-curator': '문체 큐레이터',
    'storyboard-agent': '웹툰 연출가',
    'da-vinci': '다빈치',
    'audio-narration-director': '오디오 연출가'
  };

  return labels[agentId] ?? agentId;
}

function resolveSectionSourcePath(root: string, section: string) {
  const paths: Record<string, string> = {
    'story-core': 'story-core.md',
    canon: 'context/canon.md',
    'open-threads': 'context/unresolved-questions.md',
    'recent-chapters': 'production/episodes/README.md',
    characters: 'characters/relationships.md',
    world: 'world/rules.md',
    voice: 'voice/author-voice-bible.md',
    visual: 'visual/style-bible.md',
    audio: 'audio/narration-bible.md'
  };

  return `${root}/${paths[section] ?? 'manifest.json'}`;
}

function renderContextSection(project: SeriesProject, section: string) {
  switch (section) {
    case 'story-core':
      return [
        '## Story Core',
        `Title: ${project.title}`,
        `Logline: ${project.logline}`,
        `Tone: ${project.tone}`,
        `Audience Promise: ${project.audiencePromise}`
      ].join('\n');
    case 'canon':
      return ['## Canon', ...toList(project.canonFacts.slice(-8).map((fact) => `${fact.statement} (EP ${fact.episode}, ${fact.owner})`))].join('\n');
    case 'open-threads':
      return ['## Open Threads', ...toList(project.openThreads)].join('\n');
    case 'recent-chapters':
      return ['## Recent Chapters', ...renderRecentChapterBullets(project.chapters)].join('\n');
    case 'characters':
      return [
        '## Characters',
        ...toList(project.characters.map((character) => `${character.name}: ${character.role}. 욕망: ${character.desire}. 현재 상태: ${character.currentState}`))
      ].join('\n');
    case 'world':
      return ['## World Rules', ...toList(project.worldRules.map((rule) => `${rule.title}: ${rule.rule}`))].join('\n');
    case 'voice':
      return ['## Voice', `Tone: ${project.tone}`, ...toList(project.characters.flatMap((character) => character.voiceRules))].join('\n');
    case 'visual':
      return [
        '## Visual',
        `Core mood: ${project.tone}`,
        ...toList([
          ...project.characters.map((character) => `${character.name}: keep role silhouette readable as ${character.role}`),
          'Midjourney keyframes require user approval before becoming visual DNA.',
          'Speech bubbles must not cover faces, hands, or key props.'
        ])
      ].join('\n');
    case 'audio':
      return ['## Audio', `Narration tone: ${project.tone}`, 'Pacing: 단서 장면은 느리게, 반전 직전은 짧은 호흡으로.'].join('\n');
    default:
      return `## ${section}\n- No dedicated packet renderer yet.`;
  }
}

function renderStoryCore(project: SeriesProject) {
  return [
    `# ${project.title}`,
    '',
    `- Project ID: ${project.id}`,
    `- Genre: ${project.genre}`,
    `- Current Episode: ${project.currentEpisode}`,
    '',
    '## Logline',
    project.logline,
    '',
    '## Tone',
    project.tone,
    '',
    '## Audience Promise',
    project.audiencePromise
  ].join('\n');
}

function renderCanon(canonFacts: CanonFact[]) {
  return ['# Canon', '', ...toList(canonFacts.map((fact) => `EP ${fact.episode} / ${fact.owner}: ${fact.statement}`))].join('\n');
}

function renderTimeline(project: SeriesProject) {
  return [
    '# Timeline',
    '',
    ...toList(
      project.chapters.map((chapter) => `EP ${chapter.episode} ${chapter.title}: ${chapter.hook}`),
      '아직 생성된 회차 없음'
    )
  ].join('\n');
}

function renderContinuityLedger(project: SeriesProject) {
  const approvedUpdates = project.chapters.flatMap((chapter) =>
    chapter.newCanonFacts.map((fact) => `EP ${chapter.episode} / ${fact.owner}: ${fact.statement}`)
  );
  const anchors = project.chapters.flatMap((chapter) =>
    chapter.memoryAnchors.map((anchor) => `EP ${chapter.episode}: ${anchor}`)
  );

  return [
    '# Continuity Ledger',
    '',
    '## Approved Canon Updates',
    ...toList(approvedUpdates, '아직 회차에서 승인된 새 캐논 없음'),
    '',
    '## Memory Anchors',
    ...toList(anchors, '아직 회차 앵커 없음'),
    '',
    '## Guardrail',
    '초안이 멋져 보여도 캐논 충돌은 숨기지 않고 차단하거나 명시적 반전으로 승격합니다.'
  ].join('\n');
}

function renderOpenThreads(openThreads: string[]) {
  return ['# Unresolved Questions', '', ...toList(openThreads)].join('\n');
}

function renderRelationships(project: SeriesProject) {
  return [
    '# Relationships',
    '',
    ...toList(project.characters.map((character) => `${character.name}: ${character.currentState}`)),
    '',
    '## Rule',
    '관계 변화는 이전 회차의 감정값과 사건 비용을 통과해야 canon으로 승인됩니다.'
  ].join('\n');
}

function renderWorldRules(project: SeriesProject) {
  return [
    '# World Rules',
    '',
    ...project.worldRules.flatMap((rule) => [
      `## ${rule.title}`,
      rule.rule,
      '',
      'Forbidden contradictions:',
      ...toList(rule.forbiddenContradictions.map((item) => `${item.claim} - ${item.reason}`)),
      ''
    ])
  ].join('\n').trim();
}

function renderWorldSettings(project: SeriesProject) {
  return [
    '# Settings',
    '',
    '## Primary Locations',
    ...toList(project.worldRules.map((rule) => `${rule.title}에서 파생되는 장소와 비용 규칙을 장면별로 확장합니다.`))
  ].join('\n');
}

function renderWorldInstitutions() {
  return ['# Institutions', '', '- 조직, 권력 구조, 소속 변화는 승인된 회차 이후 이 파일에 추가합니다.'].join('\n');
}

function renderVoiceBible(project: SeriesProject) {
  return [
    '# Author Voice Bible',
    '',
    `## Global Tone`,
    project.tone,
    '',
    '## Character Voice Rules',
    ...project.characters.flatMap((character) => [`### ${character.name}`, ...toList(character.voiceRules), '']),
    '## Korean Naturalness',
    '- 번역투 연결어를 줄이고 장면의 감각, 행동, 침묵으로 감정을 전달합니다.',
    '- 한 문단 안에서 같은 추상 명사를 반복하지 않습니다.'
  ].join('\n').trim();
}

function renderForbiddenPhrases(project: SeriesProject) {
  const forbidden = [
    ...project.characters.flatMap((character) =>
      character.forbiddenContradictions.map((item) => `${character.name}: ${item.claim} - ${item.reason}`)
    ),
    ...project.worldRules.flatMap((rule) => rule.forbiddenContradictions.map((item) => `${rule.title}: ${item.claim} - ${item.reason}`))
  ];

  return ['# Forbidden Claims And Phrases', '', ...toList(forbidden)].join('\n');
}

function renderNamePolicy(localization: LocalizationPolicy) {
  return [
    '# Name Policy',
    '',
    `- UI Locale: ${localization.uiLocale}`,
    `- Work Language: ${localization.workLanguage}`,
    `- Target Market: ${localization.targetMarket}`,
    `- ${localization.namePolicy}`,
    `- ${localization.translationPolicy}`,
    '',
    '## Glossary Rule',
    '캐릭터 이름, 장소, 마법/기술 용어는 glossary.json에서 먼저 고정한 뒤 원고와 출간 문구에 반영합니다.'
  ].join('\n');
}

function renderVisualStyleBible(project: SeriesProject) {
  return [
    '# Visual Style Bible',
    '',
    `- Story mood: ${project.tone}`,
    '- 다빈치는 인물 외형, 의상, 카메라, 조명, 배경 규칙을 컷별로 분리해 프롬프트를 작성합니다.',
    '- Midjourney 원화/키프레임은 사용자가 선택한 뒤에만 visual DNA로 승격합니다.',
    '- 말풍선은 표정, 손동작, 핵심 소품을 가리지 않는 위치를 우선합니다.',
    '- 예쁜 단일 이미지보다 같은 작품으로 보이는 반복 가능한 시각 언어를 우선합니다.',
    '',
    '## Characters',
    ...toList(project.characters.map((character) => `${character.name}: ${character.role}, desire-driven silhouette, consistent costume anchors required.`))
  ].join('\n');
}

function buildCharacterAppearance(project: SeriesProject) {
  return project.characters.map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role,
    stableAnchors: character.canonAnchors,
    needsDesignPass: true
  }));
}

function renderKeyframeSelection(project: SeriesProject) {
  return [
    '# Keyframe Selection',
    '',
    '- Primary generator: Midjourney',
    '- Status: 후보 생성 전',
    '- Rule: 선택된 원화만 캐릭터 외형, 팔레트, 렌즈, 조명의 기준이 됩니다.',
    '- Rejected candidates must stay out of canon and visual DNA.',
    '',
    '## Selection Criteria',
    ...toList([
      '같은 인물로 반복 가능한 얼굴과 실루엣',
      `작품 톤과 일치: ${project.tone}`,
      '의상/소품/배경 규칙이 프롬프트로 재현 가능',
      '웹툰/인스타툰 컷에서 작은 화면으로도 읽힘'
    ])
  ].join('\n');
}

function renderSpeechBubbleRules(project: SeriesProject) {
  return [
    '# Speech Bubble Rules',
    '',
    '- 말풍선은 얼굴, 손, 핵심 소품을 가리지 않습니다.',
    '- 모바일 화면에서 한 컷당 대사 밀도를 제한합니다.',
    '- 읽는 순서는 좌상단에서 우하단, 또는 스크롤 방향을 기준으로 명시합니다.',
    '- 장면의 감정을 설명하기보다 표정과 행동이 보이도록 비워 둡니다.',
    '',
    '## Voice Anchors',
    ...toList(project.characters.flatMap((character) => character.voiceRules.map((rule) => `${character.name}: ${rule}`)))
  ].join('\n');
}

function buildImageSeeds(project: SeriesProject) {
  return {
    style: project.tone,
    recurringMotifs: project.worldRules.map((rule) => rule.title),
    negativePromptPolicy: ['캐릭터 외형 임의 변경 금지', '세계관 비용 규칙을 지우는 연출 금지']
  };
}

function renderNarrationBible(project: SeriesProject) {
  return [
    '# Narration Bible',
    '',
    `- Tone: ${project.tone}`,
    '- 문장 단위 쉼보다 장면 목적 단위의 호흡을 우선합니다.',
    '- 미스터리 단서 직후에는 짧은 침묵을 두고, 감정 고백은 속도를 늦춥니다.'
  ].join('\n');
}

function renderPronunciationGuide(project: SeriesProject) {
  return ['# Pronunciation Guide', '', ...toList(project.characters.map((character) => `${character.name}: 고유명사 발음 고정 필요`))].join('\n');
}

function renderMusicMotifs(project: SeriesProject) {
  return ['# Music Motifs', '', ...toList(project.worldRules.map((rule) => `${rule.title}: recurring motif candidate`))].join('\n');
}

function renderProductionReadme(folder: string, description: string) {
  return [`# ${folder}`, '', description, '', '이 폴더는 생성 결과를 직접 쓰기보다 승인된 산출물 패키지의 위치와 기준을 기록합니다.'].join('\n');
}

function renderPersonaReviewLedger(project: SeriesProject) {
  return [
    '# Persona Review Ledger',
    '',
    `- Current episode: ${project.currentEpisode}`,
    '- 쇼러너, 캐릭터, 월드, 장르, 연속성 검토가 남긴 결정과 반려 사유를 회차별로 기록합니다.'
  ].join('\n');
}

function renderFailureLog(project: SeriesProject) {
  return [
    '# Failure Log',
    '',
    '- 실패한 초안, 캐논 충돌, 문체 붕괴, 재미 약화 사유를 숨기지 않고 기록합니다.',
    `- Current known open threads: ${project.openThreads.length}`
  ].join('\n');
}

function renderRecentChapterBullets(chapters: Chapter[]) {
  return toList(
    chapters.slice(-3).map((chapter) => {
      const anchors = chapter.memoryAnchors.length > 0 ? ` Anchors: ${chapter.memoryAnchors.join(' / ')}` : '';
      return `EP ${chapter.episode} ${chapter.title}: ${chapter.hook}.${anchors}`;
    }),
    'No generated chapters yet.'
  );
}

function collectMemoryAnchors(project: SeriesProject) {
  return unique([
    ...project.canonFacts.slice(-6).map((fact) => fact.statement),
    ...project.chapters.slice(-3).flatMap((chapter) => chapter.memoryAnchors)
  ]).slice(-8);
}

function slugProjectId(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'project';
}

function stringifyJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function toList(items: string[], empty = '기록 없음') {
  return items.length > 0 ? items.map((item) => `- ${item}`) : [`- ${empty}`];
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}
