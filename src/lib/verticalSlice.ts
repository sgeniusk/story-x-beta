import {
  createDefaultDevelopmentInput,
  developCreativeProject,
  type CreativeDevelopmentInput,
  type StoryContract
} from './creativeDevelopment';
import { buildStoryMemoryBank, type MemoryApprovalSourceCandidate } from './memoryBank';
import { buildCreativeBlueprint, type CreativeFormat, type CreativeMedium } from './projectBlueprint';
import { createSeedProject, type SeriesProject } from './storyEngine';

export type VerticalSliceArtifactId = 'web-novel-episode-1' | 'insta-toon-four-cut' | 'audiobook-30s';
export type VerticalSliceEvidenceId =
  | 'story-contract-approved'
  | 'web-novel-first-300'
  | 'insta-toon-panel-purpose'
  | 'audiobook-first-30s'
  | 'canon-delta-pending';

export interface OneProjectVerticalSliceInput {
  material?: string;
  storySeed?: string;
  characterSeed?: string;
  artDirection?: string;
}

export interface VerticalSliceArtifact {
  id: VerticalSliceArtifactId;
  label: string;
  medium: CreativeMedium;
  format: CreativeFormat;
  storyContractRef: 'shared-story-contract';
  memoryRoot: string;
  proof: string;
  evidence: string[];
  qualityGates: string[];
  status: 'draft-proof' | 'needs-review';
}

export interface VerticalSliceEvidence {
  id: VerticalSliceEvidenceId;
  label: string;
  artifactId?: VerticalSliceArtifactId;
  requiredApproval: boolean;
}

export interface VerticalSliceProvenance {
  medium: 'story-core' | CreativeMedium;
  source: string;
  approvedFor: 'draft-proof' | 'storyboard-only' | 'timing-proof-only' | 'pending-memory-sync';
}

export interface OneProjectVerticalSlice {
  title: string;
  storyContractId: 'shared-story-contract';
  sharedStoryContract: StoryContract;
  memoryRoot: string;
  artifacts: VerticalSliceArtifact[];
  evidenceLedger: VerticalSliceEvidence[];
  memoryCandidates: MemoryApprovalSourceCandidate[];
  provenanceLog: VerticalSliceProvenance[];
  approvalRequiredBeforeSync: true;
  nextActions: string[];
}

const defaultSliceInput: Required<OneProjectVerticalSliceInput> = {
  material: '비 오는 정류장에서 매일 같은 우산을 빌려주는 사람',
  storySeed: '마지막에 그 우산이 미래의 내가 남긴 물건임을 알게 된다',
  characterSeed: '하린: 겁이 많지만 사라진 약속을 끝까지 확인하는 사람',
  artDirection: '담담한 흑백선, 우산만 푸른색으로 반복'
};

export function buildOneProjectVerticalSlice(input: OneProjectVerticalSliceInput = {}): OneProjectVerticalSlice {
  const normalizedInput = normalizeVerticalSliceInput(input);
  const webNovelBlueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
  const instaToonBlueprint = buildCreativeBlueprint({ medium: 'comics', format: 'four-cut-insta-toon' });
  const audiobookBlueprint = buildCreativeBlueprint({ medium: 'audiobook', format: 'children-song-reading' });

  const webNovelPackage = developCreativeProject(webNovelBlueprint, buildDevelopmentInput(webNovelBlueprint, normalizedInput));
  const instaToonPackage = developCreativeProject(instaToonBlueprint, buildDevelopmentInput(instaToonBlueprint, normalizedInput));
  const audiobookPackage = developCreativeProject(audiobookBlueprint, buildDevelopmentInput(audiobookBlueprint, normalizedInput));

  const sharedStoryContract = webNovelPackage.storyContract;
  const project = buildVerticalSliceProject(webNovelPackage.title, webNovelPackage.logline, sharedStoryContract);
  const memoryRoot = buildStoryMemoryBank(project).root;

  return {
    title: webNovelPackage.title,
    storyContractId: 'shared-story-contract',
    sharedStoryContract,
    memoryRoot,
    artifacts: [
      {
        id: 'web-novel-episode-1',
        label: '웹소설 1화',
        medium: 'novel',
        format: 'long-novel',
        storyContractRef: 'shared-story-contract',
        memoryRoot,
        proof: `첫 300자: ${buildWebNovelFirst300(normalizedInput, webNovelPackage.characters[0]?.name ?? '주인공')}`,
        evidence: ['첫 300자', '다음 화 질문', '새 canon 후보'],
        qualityGates: webNovelPackage.qualityGates.map((gate) => gate.label),
        status: 'draft-proof'
      },
      {
        id: 'insta-toon-four-cut',
        label: '인스타툰 4컷',
        medium: 'comics',
        format: 'four-cut-insta-toon',
        storyContractRef: 'shared-story-contract',
        memoryRoot,
        proof: `4컷 목적: ${instaToonPackage.panelPlan.map((panel) => `${panel.position} ${panel.purpose}`).join(' / ')}`,
        evidence: instaToonPackage.panelPlan.map((panel) => panel.position),
        qualityGates: instaToonPackage.qualityGates.map((gate) => gate.label),
        status: 'needs-review'
      },
      {
        id: 'audiobook-30s',
        label: '오디오북 30초',
        medium: 'audiobook',
        format: 'children-song-reading',
        storyContractRef: 'shared-story-contract',
        memoryRoot,
        proof: `30초 낭독 샘플: ${buildAudiobookSample(normalizedInput)}`,
        evidence: ['문단', '화자', 'pause', 'music cue'],
        qualityGates: audiobookPackage.qualityGates.map((gate) => gate.label),
        status: 'needs-review'
      }
    ],
    evidenceLedger: [
      {
        id: 'story-contract-approved',
        label: 'Story Contract를 세 매체가 공유',
        requiredApproval: true
      },
      {
        id: 'web-novel-first-300',
        label: '웹소설 첫 300자 proof',
        artifactId: 'web-novel-episode-1',
        requiredApproval: true
      },
      {
        id: 'insta-toon-panel-purpose',
        label: '인스타툰 4컷 목적',
        artifactId: 'insta-toon-four-cut',
        requiredApproval: true
      },
      {
        id: 'audiobook-first-30s',
        label: '오디오북 첫 30초 proof',
        artifactId: 'audiobook-30s',
        requiredApproval: true
      },
      {
        id: 'canon-delta-pending',
        label: '새 기억 후보는 승인 대기',
        requiredApproval: true
      }
    ],
    memoryCandidates: buildVerticalSliceMemoryCandidates(sharedStoryContract, normalizedInput),
    provenanceLog: [
      {
        medium: 'story-core',
        source: 'Story X deterministic vertical slice',
        approvedFor: 'draft-proof'
      },
      {
        medium: 'comics',
        source: 'Story X deterministic vertical slice',
        approvedFor: 'storyboard-only'
      },
      {
        medium: 'audiobook',
        source: 'Story X deterministic vertical slice',
        approvedFor: 'timing-proof-only'
      },
      {
        medium: 'story-core',
        source: memoryRoot,
        approvedFor: 'pending-memory-sync'
      }
    ],
    approvalRequiredBeforeSync: true,
    nextActions: [
      '웹소설 1화 첫 300자와 마지막 질문을 승인합니다.',
      '인스타툰 4컷 목적과 말풍선 밀도를 검토합니다.',
      '오디오북 30초 샘플의 pause와 music cue를 확인합니다.',
      '승인된 변경만 memory bank에 sync합니다.'
    ]
  };
}

function buildVerticalSliceMemoryCandidates(
  storyContract: StoryContract,
  input: Required<OneProjectVerticalSliceInput>
): MemoryApprovalSourceCandidate[] {
  return [
    {
      id: 'vertical-slice-story-contract',
      owner: 'plot',
      status: 'pending',
      statement: `Story Contract: ${storyContract.audiencePromise} / 금지 클리셰 ${storyContract.forbiddenCliches.join(', ')}`,
      sourceAgentId: 'showrunner',
      targetPath: 'reviews/vertical-slice-approval.md',
      rationale: '한 프로젝트를 여러 매체로 전환하기 전, 공통 스토리 계약을 사용자가 승인해야 합니다.'
    },
    {
      id: 'vertical-slice-web-novel',
      owner: 'plot',
      status: 'pending',
      statement: `웹소설 첫 proof: ${input.material}에서 시작해 ${input.storySeed}로 다음 화 질문을 엽니다.`,
      sourceAgentId: 'genre-stylist',
      targetPath: 'reviews/vertical-slice-approval.md',
      rationale: '초안 첫 300자와 다음 화 질문은 출간 전 승인 후보로 남겨야 합니다.'
    },
    {
      id: 'vertical-slice-insta-toon',
      owner: 'visual',
      status: 'pending',
      statement: `인스타툰 4컷 proof: ${input.artDirection} 기준으로 컷 목적과 저장 컷을 설계합니다.`,
      sourceAgentId: 'storyboard-agent',
      targetPath: 'reviews/vertical-slice-approval.md',
      rationale: '스토리보드는 완성 이미지가 아니라 승인 전 시각 전환 후보로 관리해야 합니다.'
    },
    {
      id: 'vertical-slice-audiobook',
      owner: 'audio',
      status: 'pending',
      statement: `오디오북 30초 proof: ${input.material}와 ${input.storySeed}를 pause, 화자, music cue로 시험합니다.`,
      sourceAgentId: 'audio-narration-director',
      targetPath: 'reviews/vertical-slice-approval.md',
      rationale: '낭독 리듬과 음악 큐는 원고 canon과 분리해 승인 후 audio bible에 반영해야 합니다.'
    }
  ];
}

function normalizeVerticalSliceInput(input: OneProjectVerticalSliceInput): Required<OneProjectVerticalSliceInput> {
  return {
    material: clean(input.material, defaultSliceInput.material),
    storySeed: clean(input.storySeed, defaultSliceInput.storySeed),
    characterSeed: clean(input.characterSeed, defaultSliceInput.characterSeed),
    artDirection: clean(input.artDirection, defaultSliceInput.artDirection)
  };
}

function buildDevelopmentInput(
  blueprint: ReturnType<typeof buildCreativeBlueprint>,
  input: Required<OneProjectVerticalSliceInput>
): CreativeDevelopmentInput {
  return {
    ...createDefaultDevelopmentInput(blueprint),
    material: input.material,
    storySeed: input.storySeed,
    characterSeed: input.characterSeed,
    artDirection: input.artDirection
  };
}

function buildVerticalSliceProject(title: string, logline: string, storyContract: StoryContract): SeriesProject {
  const seed = createSeedProject();

  return {
    ...seed,
    id: 'one-project-vertical-slice',
    title,
    logline,
    audiencePromise: storyContract.audiencePromise,
    tone: storyContract.genreExpectation
  };
}

function buildWebNovelFirst300(input: Required<OneProjectVerticalSliceInput>, characterName: string) {
  return [
    `${characterName}은 ${input.material}를 처음에는 우연이라고 생각했다.`,
    `비가 그친 뒤에도 우산 끝에서는 물방울이 떨어졌고, 손잡이 안쪽에는 오래전 자신만 알던 문장이 남아 있었다.`,
    `${input.storySeed}.`
  ]
    .join(' ')
    .slice(0, 300);
}

function buildAudiobookSample(input: Required<OneProjectVerticalSliceInput>) {
  return [
    `화자: ${input.material}.`,
    'pause 0.6s',
    `낮은 목소리로 질문: ${input.storySeed}.`,
    'music cue: 잔잔한 피아노 한 음, 빗소리 낮게'
  ].join(' ');
}

function clean(value: string | undefined, fallback: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : fallback;
}
