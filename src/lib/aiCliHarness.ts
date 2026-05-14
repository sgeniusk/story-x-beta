import { buildMemoryBankContextPacket } from './memoryBank';
import type { SeriesProject } from './storyEngine';
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

function buildHarnessPrompt(options: AiCliRunOptions, selectedAgentIds: ValidationAgentId[]) {
  const packets = selectedAgentIds.map((agentId) => buildMemoryBankContextPacket(options.project, agentId));
  const packetText = packets.map((packet) => packet.content).join('\n\n---\n\n');

  return [
    '# Story X AI CLI Harness',
    '',
    'Read AGENTS.md, docs/codex-agent-manifest.md, and docs/storyx-memory-bank.md as the operating contract.',
    `Mode: ${options.mode}`,
    `Scale: ${options.scale}`,
    `Project: ${options.project.title}`,
    '',
    'Rules:',
    '- 이야기가 먼저이고, 매체는 그 다음입니다.',
    '- 사용자 승인 전에는 canon, character, world, voice memory에 반영하지 마세요.',
    '- 새 기억 후보는 memoryCandidates에만 적고, blocked/revision/reveal 중 하나로 분류하세요.',
    '- 한국어 문장은 자연스럽게 쓰고, 번역투와 과한 AI식 설명을 피하세요.',
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
