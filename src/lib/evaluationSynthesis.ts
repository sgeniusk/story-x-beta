import type { CreativeBlueprint } from './projectBlueprint';

export type EvaluationCapabilityId =
  | 'workflow-board'
  | 'story-contract'
  | 'refactor-impact-preview'
  | 'quality-gate-system'
  | 'reference-dna-cards'
  | 'ai-output-autopsy';

export type QualityGateId = 'story' | 'voice' | 'continuity' | 'visual' | 'audio' | 'platform';

export interface EvaluationCapability {
  id: EvaluationCapabilityId;
  label: string;
  testerSignal: string;
  productMove: string;
  guardrail: string;
  ownerAgents: string[];
}

export interface WorkflowBoardStep {
  title: string;
  purpose: string;
  owner: string;
  gateIds: QualityGateId[];
}

export interface TesterDrivenWorkflow {
  mediumLabel: string;
  formatLabel: string;
  activationMetric: string;
  steps: WorkflowBoardStep[];
  qualityGateIds: QualityGateId[];
  platformProof: string;
  approvalRule: string;
}

export interface ReferenceDnaCard {
  title: string;
  structuralEngine: string;
  emotionalEngine: string;
  appliesTo: string[];
  guardrail: string;
}

export const evaluationNorthStar = '창작자가 만든 하나의 이야기가 형태를 바꿔도 영혼을 잃지 않게 돕는다.';

export const p0EvaluationCapabilities: EvaluationCapability[] = [
  {
    id: 'workflow-board',
    label: 'Workflow Board',
    testerSignal: '프로젝트 이후 무엇을 해야 하는지 즉시 보여야 한다.',
    productMove: '매체별 필수 결정, 게이트, 샘플 검증 단계를 보드로 노출한다.',
    guardrail: '보드는 설명서가 아니라 다음 행동의 지도여야 한다.',
    ownerAgents: ['Editor UX Director', 'Onboarding Architect', 'Publishing Distribution Manager']
  },
  {
    id: 'story-contract',
    label: 'Story Contract',
    testerSignal: '생성 전 독자 약속, 욕망, 상처, 금지 클리셰가 잠겨야 한다.',
    productMove: '첫 canon object로 작품 계약서를 만든다.',
    guardrail: '계약은 창작을 묶는 규칙이 아니라 재미를 지키는 압력이다.',
    ownerAgents: ['Showrunner', 'Character Custodian', 'Continuity Editor']
  },
  {
    id: 'refactor-impact-preview',
    label: 'Refactor Impact Preview',
    testerSignal: '이름, 성별, 관계, 화자, 시각 참조 변경은 find-and-replace가 아니다.',
    productMove: '변경 전 장면, 대사, 이미지, 오디오, 소개문 영향 범위를 보여준다.',
    guardrail: '자동 적용보다 영향 확인과 사용자 승인을 먼저 둔다.',
    ownerAgents: ['Character Custodian', 'World Keeper', 'Voice Curator', 'DaVinci Image Agent']
  },
  {
    id: 'quality-gate-system',
    label: 'Quality Gate System',
    testerSignal: '예쁜 결과보다 약속, 문체, 캐논, 컷, 오디오, 플랫폼 준비 상태를 봐야 한다.',
    productMove: 'Story, Voice, Continuity, Visual, Audio, Platform 게이트를 산출물마다 붙인다.',
    guardrail: '게이트는 다수결이 아니다. 캐논 충돌은 차단하거나 의도적 반전으로 승격해야 한다.',
    ownerAgents: ['Continuity Editor', 'Voice Curator', 'Storyboard Agent', 'Audio Narration Director']
  },
  {
    id: 'reference-dna-cards',
    label: 'Reference DNA Cards',
    testerSignal: '레퍼런스는 스타일 복제가 아니라 구조와 감정 엔진 번역이어야 한다.',
    productMove: '표면 특징, 구조 엔진, 감정 엔진, 위험한 모방 요소를 분리한다.',
    guardrail: '표면 모방 금지. 문체, 장면, 캐릭터를 복제하지 않는다.',
    ownerAgents: ['Showrunner', 'Genre Stylist', 'Brand Homepage Director']
  },
  {
    id: 'ai-output-autopsy',
    label: 'AI Output Autopsy',
    testerSignal: 'AI는 무엇을 새로 만들고 무엇을 망가뜨렸는지 숨기면 안 된다.',
    productMove: '생성 뒤 새 canon 후보, 잠재 충돌, drift, 약한 지점, 승인 필요 항목을 보여준다.',
    guardrail: '기억은행 반영은 사용자 승인 뒤에만 한다.',
    ownerAgents: ['Insights Analyst', 'Continuity Editor', 'Work Library Manager']
  }
];

export const evaluationDrivenRoadmap = {
  now: [
    'P0 최소 구조를 제작 패키지와 홈페이지에 노출',
    'Story Contract, Workflow Board, Quality Gates, Refactor Impact Preview, AI Output Autopsy를 생성 결과에 포함',
    '평가담당 에이전트의 공통 의견을 서비스 운영실 책임으로 매핑'
  ],
  next: [
    'Creator Memory Bank UI 탭화',
    'Panel/Audio Line Alignment',
    'Platform Packaging Lab',
    'Creative Coach Mode'
  ],
  later: [
    'Fandom Memory Simulator',
    'Market Signal Layer',
    'Multimodal Staleness Engine',
    'Reader/Listener Test Clips'
  ]
};

export function buildTesterDrivenWorkflow(blueprint: CreativeBlueprint): TesterDrivenWorkflow {
  const mediumSteps = getMediumSpecificSteps(blueprint);
  const qualityGateIds = getQualityGateIds(blueprint);

  return {
    mediumLabel: blueprint.mediumLabel,
    formatLabel: blueprint.formatLabel,
    activationMetric: '2분 안에 첫 workflow board 도착',
    steps: [
      {
        title: 'Story Contract',
        purpose: '독자/청자 약속, 주인공 욕망, 금지 클리셰, 형식 약속을 첫 canon으로 잠급니다.',
        owner: 'Showrunner',
        gateIds: ['story', 'continuity']
      },
      {
        title: 'Reference DNA',
        purpose: '레퍼런스의 표면이 아니라 구조 엔진과 감정 엔진만 가져옵니다.',
        owner: 'Genre Stylist',
        gateIds: ['story', 'voice']
      },
      ...mediumSteps,
      {
        title: 'Quality Gates',
        purpose: '생성 전후로 story, voice, continuity, visual/audio, platform 준비 상태를 확인합니다.',
        owner: 'Continuity Editor',
        gateIds: qualityGateIds
      },
      {
        title: 'AI Output Autopsy',
        purpose: '새 canon 후보, 손상 위험, 승인할 메모리 업데이트를 분리합니다.',
        owner: 'Insights Analyst',
        gateIds: ['continuity', 'platform']
      }
    ],
    qualityGateIds,
    platformProof: getPlatformProof(blueprint),
    approvalRule: '새 기억은 사용자 승인 뒤 memory bank에 반영합니다.'
  };
}

export function buildReferenceDnaCards(blueprint: CreativeBlueprint): ReferenceDnaCard[] {
  if (blueprint.medium === 'comics') {
    return [
      {
        title: '그래픽 노블형 이미지-텍스트 책임 분배',
        structuralEngine: '텍스트가 말하지 않는 것을 이미지가 드러내고, 이미지가 침묵할 때 문장이 압력을 만든다.',
        emotionalEngine: '설명보다 시선 흐름과 침묵 컷으로 감정을 누적한다.',
        appliesTo: ['인스타툰', '단편 만화', '웹툰 연재'],
        guardrail: '표면 모방 금지. 특정 작가의 그림체나 캐릭터를 복제하지 않는다.'
      }
    ];
  }

  if (blueprint.medium === 'audiobook') {
    return [
      {
        title: '오디오드라마형 시간 경험',
        structuralEngine: '문단, 화자, 발음, 쉼, 음악 큐를 시간축으로 정렬한다.',
        emotionalEngine: '청자가 스킵할 수 없는 호흡 속에서 긴장과 안심을 교대시킨다.',
        appliesTo: ['오디오북', '교육영상', '동요읽기'],
        guardrail: '표면 모방 금지. 유명 목소리, 곡, 사운드트랙을 복제하지 않는다.'
      }
    ];
  }

  if (blueprint.medium === 'essay') {
    return [
      {
        title: '개인 서사형 모호함 보존',
        structuralEngine: '사실, 그때의 감정, 지금의 해석을 분리하고 아직 모르는 부분은 질문으로 남긴다.',
        emotionalEngine: '고통을 깔끔하게 정리하기보다 말하지 못한 압력을 남긴다.',
        appliesTo: ['개인 에세이', '회고 에세이', '에세이 연재'],
        guardrail: '표면 모방 금지. 사용자가 말하지 않은 사적 기억을 발명하지 않는다.'
      }
    ];
  }

  return [
    {
      title: '장편 연재형 보상 루프',
      structuralEngine: '회차마다 답 하나와 새 질문 하나를 남기며 장기 약속을 전진시킨다.',
      emotionalEngine: '능력, 관계, 비밀의 보상이 주인공의 자기증명과 연결된다.',
      appliesTo: ['장편', '중편', '단편'],
      guardrail: '표면 모방 금지. 기존 작품의 설정, 문체, 캐릭터를 복제하지 않는다.'
    }
  ];
}

function getMediumSpecificSteps(blueprint: CreativeBlueprint): WorkflowBoardStep[] {
  if (blueprint.medium === 'comics') {
    return [
      {
        title: '컷/스와이프 보드',
        purpose: '첫 컷 훅, 컷별 정보량, 말풍선 밀도, 저장/공유 포인트를 정합니다.',
        owner: 'Storyboard Agent',
        gateIds: ['visual', 'platform']
      },
      {
        title: '캐릭터 참조 패킷',
        purpose: '인물 외형, 의상, 소품, 컷별 변화 허용 범위를 고정합니다.',
        owner: 'DaVinci Image Agent',
        gateIds: ['visual', 'continuity']
      }
    ];
  }

  if (blueprint.medium === 'audiobook') {
    return [
      {
        title: '화자/발음/호흡 보드',
        purpose: '화자 캐스팅, 발음 사전, 문단별 pause, 청취 피로 지점을 정합니다.',
        owner: 'Audio Narration Director',
        gateIds: ['audio', 'voice']
      },
      {
        title: '음악/SFX 큐',
        purpose: '음악 모티프, 반복 후렴, 효과음 밀도, 자막 리듬을 장면별로 연결합니다.',
        owner: 'Sound Music Agent',
        gateIds: ['audio', 'platform']
      }
    ];
  }

  if (blueprint.medium === 'essay') {
    return [
      {
        title: 'Lived Material Interview',
        purpose: '사용자가 말한 사실, 감정, 주변 인물 보호 범위, 아직 물어야 할 빈칸을 나눕니다.',
        owner: 'Essay Interviewer',
        gateIds: ['story', 'voice']
      },
      {
        title: 'Voice Sample Lock',
        purpose: '문장 길이, 은유 밀도, 금지 표현, 한국어 자연스러움을 샘플로 고정합니다.',
        owner: 'Voice Curator',
        gateIds: ['voice', 'continuity']
      }
    ];
  }

  return [
    {
      title: 'Episode Promise Board',
      purpose: '이번 회차의 후크, 보상, 위험, 다음 화 클릭 질문을 정합니다.',
      owner: 'Showrunner',
      gateIds: ['story', 'platform']
    },
    {
      title: 'Scene Function Board',
      purpose: '각 장면이 선택, 갈등, 관계 변화, 복선 회수 중 무엇을 담당하는지 정합니다.',
      owner: 'Character Custodian',
      gateIds: ['story', 'continuity']
    }
  ];
}

function getQualityGateIds(blueprint: CreativeBlueprint): QualityGateId[] {
  if (blueprint.medium === 'comics') {
    return ['story', 'voice', 'continuity', 'visual', 'platform'];
  }

  if (blueprint.medium === 'audiobook') {
    return ['story', 'voice', 'continuity', 'audio', 'platform'];
  }

  return ['story', 'voice', 'continuity', 'platform'];
}

function getPlatformProof(blueprint: CreativeBlueprint) {
  if (blueprint.medium === 'comics') {
    return '첫 3컷, 첫 장 저장 포인트, 썸네일/비율';
  }

  if (blueprint.medium === 'audiobook') {
    return '첫 30초, 화자 약속, 챕터 도입부';
  }

  if (blueprint.medium === 'essay') {
    return '첫 300자, 첫 질문, 게시 제목';
  }

  return '첫 300자, 첫 문장, 에피소드 훅';
}
