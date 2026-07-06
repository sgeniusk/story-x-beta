import { buildMemoryBankContextPacket } from './memoryBank';
import { getProjectLocalization } from './localization';
import type { AgentId, AgentRun, SeriesProject } from './storyEngine';
import type { ValidationAgentId } from './agentReviewProcess';

export type AiCliProvider = 'mock' | 'claude' | 'codex';
export type AiCliMode = 'draft' | 'review';
export type AiCliScale = 'small' | 'standard' | 'deep';

export interface ProviderCommandOptions {
  provider: Exclude<AiCliProvider, 'mock'>;
  prompt: string;
  cwd: string;
}

export interface AiCliRunOptions {
  provider: AiCliProvider;
  mode: AiCliMode;
  scale: AiCliScale;
  project: SeriesProject;
  agentIds?: ValidationAgentId[];
  cwd?: string;
}

export interface AiCliRuntimeCheck {
  provider: AiCliProvider;
  command: string;
  available: boolean;
  guidance: string;
}

export interface AiCliRunPlan {
  provider: AiCliProvider;
  mode: AiCliMode;
  scale: AiCliScale;
  commandPreview: string[];
  prompt: string;
  selectedAgentIds: string[];
  pendingWriteTargets: string[];
  expectedOutputSections: ['summary', 'agentReports', 'memoryCandidates', 'nextActions'];
  approvalRequiredBeforeSync: boolean;
  runOutputContract: {
    pendingReviewPath: 'reviews/pending';
    rawProviderOutputPath: 'reviews/provider-raw';
    memorySyncRequiresApproval: true;
  };
}

export type AiCliReviewStatus = 'pass' | 'revise' | 'blocked';
export type AiCliMemoryCandidateStatus = 'pending' | 'revision' | 'blocked' | 'reveal';

export interface AiCliAgentReport {
  agentId: ValidationAgentId;
  label: string;
  status: AiCliReviewStatus;
  note: string;
  evidence: string[];
  // 항목별 검토 결과. 잘된 점/잘못된 점을 짧은 항목 리스트로 나눠 담는다. 옛 출력 호환을 위해 기본값 [].
  strengths: string[];
  issues: string[];
}

export interface AiCliMemoryCandidate {
  id: string;
  owner: 'character' | 'world' | 'plot' | 'voice' | 'visual' | 'audio';
  status: AiCliMemoryCandidateStatus;
  statement: string;
  sourceAgentId: ValidationAgentId;
  targetPath: string;
  rationale: string;
}

export interface AiCliReviewResult {
  provider: AiCliProvider;
  mode: AiCliMode;
  scale: AiCliScale;
  generatedAt: string;
  summary: string;
  agentReports: AiCliAgentReport[];
  memoryCandidates: AiCliMemoryCandidate[];
  nextActions: string[];
  pendingReviewTarget: 'reviews/pending';
  approvalRequiredBeforeSync: true;
}

export interface NormalizeProviderReviewOutputOptions {
  provider: Exclude<AiCliProvider, 'mock'>;
  mode: AiCliMode;
  scale: AiCliScale;
  projectTitle: string;
}

const defaultAgentsByScale: Record<AiCliScale, ValidationAgentId[]> = {
  small: ['showrunner', 'continuity-editor', 'voice-curator'],
  standard: ['showrunner', 'character-custodian', 'world-keeper', 'genre-stylist', 'continuity-editor'],
  deep: [
    'showrunner',
    'character-custodian',
    'world-keeper',
    'genre-stylist',
    'continuity-editor',
    'voice-curator',
    'storyboard-agent',
    'speech-bubble-agent',
    'keyframe-art-director',
    'da-vinci',
    'frame-assembly-agent'
  ]
};

export function getProviderRuntimeChecks(providers: AiCliProvider[] = ['mock', 'claude', 'codex']): AiCliRuntimeCheck[] {
  return providers.map((provider) => ({
    provider,
    command: getProviderCommandName(provider),
    available: provider === 'mock',
    guidance:
      provider === 'mock'
        ? '비용 없이 deterministic 테스트를 실행합니다.'
        : `${getProviderCommandName(provider)} 실행 가능 여부는 storyx doctor에서 로컬 PATH로 확인합니다.`
  }));
}

export function buildProviderCommand({ provider, prompt, cwd }: ProviderCommandOptions): string[] {
  if (provider === 'claude') {
    return [
      'claude',
      '--print',
      '--output-format',
      'text',
      '--permission-mode',
      'dontAsk',
      '--max-budget-usd',
      '0.25',
      prompt
    ];
  }

  return ['codex', 'exec', '--sandbox', 'read-only', '--cd', cwd, '--ephemeral', prompt];
}

export function buildAiCliRunPlan(options: AiCliRunOptions): AiCliRunPlan {
  const selectedAgentIds = options.agentIds ?? defaultAgentsByScale[options.scale];
  const prompt = buildHarnessPrompt(options, selectedAgentIds);
  const commandPreview =
    options.provider === 'mock'
      ? ['storyx-mock', options.mode, '--scale', options.scale]
      : buildProviderCommand({
          provider: options.provider,
          prompt,
          cwd: options.cwd ?? '.'
        });

  return {
    provider: options.provider,
    mode: options.mode,
    scale: options.scale,
    commandPreview,
    prompt,
    selectedAgentIds,
    pendingWriteTargets: ['reviews/pending', 'production/episodes/pending', 'memory-candidates/pending'],
    expectedOutputSections: ['summary', 'agentReports', 'memoryCandidates', 'nextActions'],
    approvalRequiredBeforeSync: true,
    runOutputContract: {
      pendingReviewPath: 'reviews/pending',
      rawProviderOutputPath: 'reviews/provider-raw',
      memorySyncRequiresApproval: true
    }
  };
}

export function buildMockAiCliReviewResult(options: AiCliRunOptions, draftText = ''): AiCliReviewResult {
  const plan = buildAiCliRunPlan({ ...options, provider: 'mock' });
  const normalizedDraft = draftText.trim();
  const excerpt = normalizedDraft ? normalizedDraft.slice(0, 72) : options.project.logline.slice(0, 72);
  const agentReports = plan.selectedAgentIds.map<AiCliAgentReport>((agentId, index) => ({
    agentId: agentId as ValidationAgentId,
    label: getAgentLabel(agentId),
    status: getMockStatus(agentId, index),
    note: buildMockAgentNote(agentId, excerpt),
    evidence: [plan.mode, plan.scale, ...getMockEvidence(agentId)],
    strengths: getMockStrengths(agentId),
    issues: getMockIssues(agentId)
  }));
  const memoryCandidates = buildMockMemoryCandidates(options.project, plan.selectedAgentIds as ValidationAgentId[], excerpt);

  return {
    provider: 'mock',
    mode: options.mode,
    scale: options.scale,
    generatedAt: 'mock-deterministic',
    summary: `Story X mock review completed for ${options.project.title}. ${agentReports.length}개 에이전트가 구조 기억만 읽고 검토했습니다.`,
    agentReports,
    memoryCandidates,
    nextActions: [
      '수정할 후보는 승인 대기에서 revision으로 표시합니다.',
      '통과한 후보만 canon, character, world, voice memory에 반영합니다.',
      '실제 Claude/Codex 실행 전 검토 규모와 provider를 다시 확인합니다.'
    ],
    pendingReviewTarget: 'reviews/pending',
    approvalRequiredBeforeSync: true
  };
}

export function agentReportsToRuns(result: AiCliReviewResult): AgentRun[] {
  return result.agentReports.map((report) => ({
    agentId: report.agentId as AgentId,
    title: report.label,
    status: 'complete',
    output: `[${result.provider} ${result.scale}] ${report.note}`,
    evidence: report.evidence,
    strengths: report.strengths ?? [],
    issues: report.issues ?? []
  }));
}

export function normalizeProviderReviewOutput(rawOutput: string, options: NormalizeProviderReviewOutputOptions): AiCliReviewResult {
  const parsed = parseProviderJson(rawOutput);
  const summary = readString(parsed?.summary) || summarizeRawProviderOutput(rawOutput, options.projectTitle);
  const agentReports = normalizeAgentReports(parsed?.agentReports);
  const memoryCandidates = normalizeMemoryCandidates(parsed?.memoryCandidates);
  const nextActions = normalizeStringList(parsed?.nextActions);

  return {
    provider: options.provider,
    mode: options.mode,
    scale: options.scale,
    generatedAt: new Date(0).toISOString(),
    summary,
    agentReports:
      agentReports.length > 0
        ? agentReports
        : [
            {
              agentId: 'continuity-editor',
              label: getAgentLabel('continuity-editor'),
              status: 'revise',
              note: '구조화되지 않은 provider 출력을 원문 검토 대상으로 보류했습니다.',
              evidence: ['provider-raw'],
              strengths: [],
              issues: ['provider 출력이 구조화되지 않아 항목별 검토를 분리하지 못했습니다.']
            }
          ],
    memoryCandidates,
    nextActions:
      nextActions.length > 0
        ? nextActions
        : ['구조화되지 않은 provider 출력은 reviews/provider-raw를 확인한 뒤 수동으로 memoryCandidates를 승인하세요.'],
    pendingReviewTarget: 'reviews/pending',
    approvalRequiredBeforeSync: true
  };
}

function buildHarnessPrompt(options: AiCliRunOptions, selectedAgentIds: ValidationAgentId[]) {
  const localization = getProjectLocalization(options.project);
  const packets = selectedAgentIds.map((agentId) => buildMemoryBankContextPacket(options.project, agentId));
  const packetText = packets.map((packet) => packet.content).join('\n\n---\n\n');
  const glossaryPreview = localization.glossary
    .slice(0, 5)
    .map((term) => `${term.source}${term.keepOriginal ? ' (keep original)' : ''}`)
    .join(', ');

  return [
    '# Story X AI CLI Harness',
    '',
    'Read AGENTS.md, docs/codex-agent-manifest.md, and docs/storyx-memory-bank.md as the operating contract.',
    `Mode: ${options.mode}`,
    `Scale: ${options.scale}`,
    `Project: ${options.project.title}`,
    '',
    'Language policy:',
    `- UI Locale: ${localization.uiLocale}`,
    `- Work Language: ${localization.workLanguage}`,
    `- Target Market: ${localization.targetMarket}`,
    `- Honorific Policy: ${localization.honorificPolicy}`,
    `- Name Policy: ${localization.namePolicy}`,
    `- Translation Policy: ${localization.translationPolicy}`,
    `- Glossary Preview: ${glossaryPreview || 'none'}`,
    '',
    'Rules:',
    '- 이야기가 먼저이고, 매체는 그 다음입니다.',
    '- 사용자 승인 전에는 canon, character, world, voice memory에 반영하지 마세요.',
    '- 새 기억 후보는 memoryCandidates에만 적고, blocked/revision/reveal 중 하나로 분류하세요.',
    '- 한국어 문장은 자연스럽게 쓰고, 번역투와 과한 AI식 설명을 피하세요.',
    '',
    // M4 청크 H — craft 검토 기준 키 (5-2 정본). agentReviewProcess.AgentValidationProcess.criteriaKeys 와 일치(개수 드리프트 방지 위해 카운트 비표기).
    'Craft 검토 기준 키 — 각 에이전트는 자기 키 기준으로 평가합니다:',
    '- showrunner: chapter_one_hook_check, chapter_end_hook_check, stakes_progression_audit',
    '- character-custodian: pressure_triangle_validation, flat_character_warning',
    '- world-keeper: motif_variation_audit, historical_consistency_extended',
    '- genre-stylist: scene_sequel_ratio, voice_match_score, read_aloud_audit',
    '- continuity-editor: open_threads_overload',
    '- critic-reviewer: ambiguity_audit, ethical_pressure_test, silence_audit, tension_decay_audit, predictability_audit',
    '- essay-curator: universal_leap_check, self_reversal_check, disclosure_scope_check',
    '',
    // M4 청크 H — 12 품질 게이트 (qualityGates.ts). StoryMode 가중치로 강제/권고 결정.
    '품질 게이트 12개 — Layer 4 검토 단계에서 평가, StoryMode 가중치로 강제(blocking)/권고(advisory) 분기:',
    '- common (항상 blocking): gate_scene_sequel_balance, gate_voice_match_70, gate_pressure_triangle_active',
    '- commercial (commercialWeight ≥ 0.5 면 blocking): gate_hook_first_300, gate_hook_last_200 (serial 만)',
    '- literary (literaryWeight ≥ 0.5 면 blocking): gate_ambiguity_at_finale (finale 만), gate_ethical_cost_present, gate_motif_variation, gate_historical_density',
    '- essay (에세이 매체만, gate_disclosure_scope 만 항상 blocking): gate_universal_leap, gate_self_reversal, gate_disclosure_scope',
    '',
    'Required output sections:',
    '1. summary',
    '2. agentReports',
    '3. memoryCandidates',
    '4. nextActions',
    '',
    'Context Packet',
    packetText
  ].join('\n');
}

function parseProviderJson(rawOutput: string): Record<string, unknown> | null {
  const trimmed = rawOutput.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidates = [fencedJson, trimmed].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate);
      return isRecord(value) ? value : null;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function normalizeAgentReports(value: unknown): AiCliAgentReport[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((report, index) => {
    const agentId = normalizeAgentId(readString(report.agentId) || readString(report.agent), index);

    return {
      agentId,
      label: readString(report.label) || getAgentLabel(agentId),
      status: normalizeReviewStatus(readString(report.status)),
      note: readString(report.note) || readString(report.output) || 'provider 검토 의견이 비어 있습니다.',
      evidence: normalizeStringList(report.evidence),
      strengths: normalizeStringList(report.strengths),
      issues: normalizeStringList(report.issues)
    };
  });
}

function normalizeMemoryCandidates(value: unknown): AiCliMemoryCandidate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((candidate, index) => {
    const owner = normalizeMemoryOwner(readString(candidate.owner));
    const sourceAgentId = normalizeAgentId(readString(candidate.sourceAgentId) || readString(candidate.agentId), index);

    return {
      id: readString(candidate.id) || `provider-memory-${String(index + 1).padStart(2, '0')}`,
      owner,
      status: normalizeMemoryCandidateStatus(readString(candidate.status)),
      statement: readString(candidate.statement) || readString(candidate.note) || '내용이 비어 있는 provider memory candidate',
      sourceAgentId,
      targetPath: readString(candidate.targetPath) || `reviews/pending/${owner}-candidates.json`,
      rationale: readString(candidate.rationale) || 'provider가 제안한 후보이며 사용자 승인 전까지 sync하지 않습니다.'
    };
  });
}

function normalizeAgentId(value: string, index = 0): ValidationAgentId {
  const knownAgentIds: ValidationAgentId[] = [
    'showrunner',
    'character-custodian',
    'world-keeper',
    'genre-stylist',
    'continuity-editor',
    'essay-interviewer',
    'voice-curator',
    'audio-narration-director',
    'education-video-architect',
    'sound-music-agent',
    'storyboard-agent',
    'speech-bubble-agent',
    'keyframe-art-director',
    'da-vinci',
    'frame-assembly-agent'
  ];

  return knownAgentIds.includes(value as ValidationAgentId) ? (value as ValidationAgentId) : knownAgentIds[index % knownAgentIds.length];
}

function normalizeReviewStatus(value: string): AiCliReviewStatus {
  if (value === 'pass' || value === 'revise' || value === 'blocked') {
    return value;
  }

  if (value === '수정' || value === 'revision') {
    return 'revise';
  }

  if (value === '차단' || value === 'block') {
    return 'blocked';
  }

  return 'pass';
}

function normalizeMemoryCandidateStatus(value: string): AiCliMemoryCandidateStatus {
  if (value === 'pending' || value === 'revision' || value === 'blocked' || value === 'reveal') {
    return value;
  }

  if (value === '수정' || value === 'revise') {
    return 'revision';
  }

  if (value === '차단' || value === 'block') {
    return 'blocked';
  }

  return 'pending';
}

function normalizeMemoryOwner(value: string): AiCliMemoryCandidate['owner'] {
  if (value === 'character' || value === 'world' || value === 'plot' || value === 'voice' || value === 'visual' || value === 'audio') {
    return value;
  }

  return 'plot';
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => readString(item)).filter(Boolean);
  }

  const single = readString(value);
  return single ? [single] : [];
}

function summarizeRawProviderOutput(rawOutput: string, projectTitle: string) {
  const normalized = rawOutput.replace(/\s+/g, ' ').trim();
  const excerpt = normalized.slice(0, 220) || 'provider 출력이 비어 있습니다.';

  return `${projectTitle} provider raw output: ${excerpt}`;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildMockMemoryCandidates(project: SeriesProject, agentIds: ValidationAgentId[], excerpt: string): AiCliMemoryCandidate[] {
  const episode = project.currentEpisode + 1;
  const candidates: AiCliMemoryCandidate[] = [
    {
      id: `mock-memory-${episode}-plot`,
      owner: 'plot',
      status: 'pending',
      statement: `${episode}화 검토 대상은 "${excerpt}"를 중심 사건 후보로 둔다.`,
      sourceAgentId: 'showrunner',
      targetPath: 'reviews/pending/plot-candidates.json',
      rationale: '중심 사건은 원고 확정 전까지 canon이 아니라 승인 대기 후보로 남겨야 합니다.'
    },
    {
      id: `mock-memory-${episode}-voice`,
      owner: 'voice',
      status: 'pending',
      statement: '문체 큐레이터는 직접 편집된 문장을 다음 검토의 우선 증거로 사용한다.',
      sourceAgentId: 'voice-curator',
      targetPath: 'reviews/pending/voice-candidates.json',
      rationale: '사용자 직접 편집은 문체 취향 학습의 가장 강한 신호입니다.'
    }
  ];

  if (agentIds.includes('world-keeper')) {
    candidates.push({
      id: `mock-memory-${episode}-world`,
      owner: 'world',
      status: 'revision',
      statement: '새 설정은 기존 세계 규칙의 비용을 없애지 않는 경우에만 world/rules.md 후보가 된다.',
      sourceAgentId: 'world-keeper',
      targetPath: 'reviews/pending/world-candidates.json',
      rationale: '세계관 예외는 재미가 될 수 있지만 비용 없는 해결책이면 차단해야 합니다.'
    });
  }

  if (agentIds.includes('da-vinci')) {
    candidates.push({
      id: `mock-memory-${episode}-visual`,
      owner: 'visual',
      status: 'pending',
      statement: '선택된 원화만 visual DNA가 되며 미선택 이미지는 캐릭터 외형 기준으로 섞지 않는다.',
      sourceAgentId: 'da-vinci',
      targetPath: 'reviews/pending/visual-candidates.json',
      rationale: '그림 일관성은 후보 이미지가 아니라 승인된 기준 이미지에서 시작됩니다.'
    });
  }

  return candidates;
}

function getMockStatus(agentId: string, index: number): AiCliReviewStatus {
  if (agentId === 'continuity-editor' || agentId === 'world-keeper') {
    return 'revise';
  }

  return index % 7 === 6 ? 'blocked' : 'pass';
}

function buildMockAgentNote(agentId: string, excerpt: string) {
  switch (agentId) {
    case 'showrunner':
      return `mock 검토: "${excerpt}"의 독자 약속과 다음 장면 질문을 먼저 고정했습니다.`;
    case 'character-custodian':
      return 'mock 검토: 인물 욕망과 관계 온도는 유지되지만 직접 편집 후 대사 거리 재검토가 필요합니다.';
    case 'world-keeper':
      return 'mock 검토: 새 설정이 세계 규칙의 비용을 싸게 만들지 않는지 revision 후보로 남겼습니다.';
    case 'genre-stylist':
      return 'mock 검토: 장르 리듬은 유지되며 후크를 더 빨리 배치하면 좋습니다.';
    case 'continuity-editor':
      return 'mock 검토: 새 기억 후보는 승인 전까지 canon에 반영하지 않고 pending으로 격리했습니다.';
    case 'voice-curator':
      return 'mock 검토: 사용자 직접 편집 문장을 문체 취향의 우선 증거로 표시했습니다.';
    case 'da-vinci':
      return 'mock 검토: 시각 후보는 선택된 원화만 visual DNA로 승격해야 합니다.';
    default:
      return `mock 검토: ${getAgentLabel(agentId)} 기준으로 산출물의 다음 수정 행동을 정리했습니다.`;
  }
}

// 목 검토에서도 다이얼로그가 비지 않도록 에이전트별 잘된 점 샘플을 만든다
function getMockStrengths(agentId: string): string[] {
  switch (agentId) {
    case 'showrunner':
      return ['독자 약속이 첫 문단에서 한 문장으로 잡힙니다.', '마지막 장면이 다음 회차 행동을 분명히 부릅니다.'];
    case 'character-custodian':
      return ['인물의 욕망과 상처가 행동으로 드러납니다.', '관계 온도 변화가 장면 안에서 일어납니다.'];
    case 'world-keeper':
      return ['세계 규칙의 비용이 장면마다 유지됩니다.', '장소 이동과 시간순서가 무리 없이 이어집니다.'];
    case 'genre-stylist':
      return ['장르 리듬이 회차 목적을 살립니다.', '문장 질감이 장면 감정을 돕습니다.'];
    case 'continuity-editor':
      return ['새 사실이 기존 캐논과 충돌하지 않습니다.', '저장할 캐논 후보가 명확히 분리됐습니다.'];
    case 'voice-curator':
      return ['문체가 처음부터 끝까지 일관됩니다.', '한국어 문장이 번역투 없이 자연스럽습니다.'];
    default:
      return [`${getAgentLabel(agentId)} 기준에서 큰 문제는 보이지 않습니다.`];
  }
}

// 목 검토에서도 다이얼로그가 비지 않도록 에이전트별 잘못된 점 샘플을 만든다
function getMockIssues(agentId: string): string[] {
  switch (agentId) {
    case 'showrunner':
      return ['중간 장면의 압력이 잠시 느슨해집니다.'];
    case 'character-custodian':
      return ['직접 편집 이후 대사 거리를 다시 확인해야 합니다.'];
    case 'world-keeper':
      return ['새 설정이 기존 규칙을 싸게 만들 위험이 있어 revision 후보로 둡니다.'];
    case 'genre-stylist':
      return ['후크 배치가 한 박자 늦습니다.'];
    case 'continuity-editor':
      return ['새 기억 후보는 승인 전까지 canon에 넣지 않고 pending으로 둡니다.'];
    case 'voice-curator':
      return ['반복되는 AI식 표현 한두 곳을 다듬으면 좋겠습니다.'];
    default:
      return [`${getAgentLabel(agentId)} 관점에서 다음 수정 행동을 정리했습니다.`];
  }
}

function getMockEvidence(agentId: string) {
  switch (agentId) {
    case 'showrunner':
      return ['story-contract', 'episode-promise'];
    case 'character-custodian':
      return ['character-desire', 'relationship-state'];
    case 'world-keeper':
      return ['world-rule', 'cost'];
    case 'genre-stylist':
      return ['genre-beat', 'reader-reward'];
    case 'continuity-editor':
      return ['canon', 'memory-candidate'];
    case 'voice-curator':
      return ['voice-bible', 'manual-edit'];
    case 'da-vinci':
      return ['visual-bible', 'keyframe'];
    default:
      return ['context-packet'];
  }
}

// 검토 규모별 에이전트 목록 — 에이전트별 분리 검토에서 이 순서대로 호출한다
export function getReviewAgentIds(scale: AiCliScale): ValidationAgentId[] {
  return [...defaultAgentsByScale[scale]];
}

export function getAgentLabel(agentId: string) {
  const labels: Record<string, string> = {
    showrunner: '쇼러너',
    'character-custodian': '캐릭터 큐레이터',
    'world-keeper': '배경 설계자',
    'genre-stylist': '장르 스타일리스트',
    'continuity-editor': '연속성 감수자',
    'critic-reviewer': '평론가',
    'essay-curator': '에세이 큐레이터',
    'essay-interviewer': '에세이 인터뷰어',
    'voice-curator': '문체 큐레이터',
    'audio-narration-director': '오디오 연출가',
    'education-video-architect': '교육영상 설계자',
    'sound-music-agent': '사운드 뮤직 에이전트',
    'storyboard-agent': '웹툰 연출가',
    'speech-bubble-agent': '말풍선 연출가',
    'keyframe-art-director': '원화/키프레임 감독',
    'da-vinci': '다빈치',
    'frame-assembly-agent': '프레임 조립가'
  };

  return labels[agentId] ?? agentId;
}

function getProviderCommandName(provider: AiCliProvider) {
  switch (provider) {
    case 'claude':
      return 'claude';
    case 'codex':
      return 'codex';
    default:
      return 'storyx-mock';
  }
}
