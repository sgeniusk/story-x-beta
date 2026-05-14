import type { CreativeFormat } from './projectBlueprint';

export type ComicsProductionAgentId =
  | 'showrunner'
  | 'storyboard-agent'
  | 'speech-bubble-agent'
  | 'keyframe-art-director'
  | 'da-vinci'
  | 'frame-assembly-agent'
  | 'continuity-editor';

export type VisualLockId =
  | 'characterAppearance'
  | 'costumeAndProps'
  | 'paletteAndLighting'
  | 'cameraAndLens'
  | 'backgroundReuse'
  | 'speechBubbleRules'
  | 'negativePromptRules';

export interface ComicsProductionAgent {
  id: ComicsProductionAgentId;
  label: string;
  responsibility: string;
}

export interface ComicsVisualPhase {
  title: string;
  owner: ComicsProductionAgentId;
  outcome: string;
}

export interface ComicsVisualWorkflow {
  format: CreativeFormat;
  platformOutput: string;
  agents: ComicsProductionAgent[];
  phases: ComicsVisualPhase[];
  visualLocks: VisualLockId[];
  referencePolicy: {
    primaryGenerator: 'Midjourney';
    approvalRequired: boolean;
    rule: string;
  };
  qualityGates: string[];
}

const baseComicsAgents: ComicsProductionAgent[] = [
  {
    id: 'showrunner',
    label: '쇼러너',
    responsibility: '컷과 페이지가 작품 약속, 회차 후크, 다음 행동을 잃지 않게 잡습니다.'
  },
  {
    id: 'storyboard-agent',
    label: '웹툰 연출 에이전트',
    responsibility: '장면 비트를 스크롤, 페이지, 스와이프, 네컷 리듬으로 바꿉니다.'
  },
  {
    id: 'speech-bubble-agent',
    label: '말풍선 연출 에이전트',
    responsibility: '말풍선 위치, 대사 밀도, 시선 흐름, 표정 가림 위험을 검수합니다.'
  },
  {
    id: 'keyframe-art-director',
    label: '원화/키프레임 감독',
    responsibility: 'Midjourney 원화 후보를 만들고 선택된 이미지만 visual DNA로 잠급니다.'
  },
  {
    id: 'da-vinci',
    label: '다빈치 이미지 프롬프트 에이전트',
    responsibility: '승인된 원화와 비주얼 바이블을 컷별 이미지 프롬프트로 변환합니다.'
  },
  {
    id: 'frame-assembly-agent',
    label: '프레임 조립 에이전트',
    responsibility: '컷 순서, 여백, 내보내기 비율, 파일명을 매체별 산출물로 정리합니다.'
  },
  {
    id: 'continuity-editor',
    label: '연속성 감수 에이전트',
    responsibility: '이미지와 대사가 캐릭터, 세계관, 타임라인을 깨지 않는지 차단합니다.'
  }
];

const visualLocks: VisualLockId[] = [
  'characterAppearance',
  'costumeAndProps',
  'paletteAndLighting',
  'cameraAndLens',
  'backgroundReuse',
  'speechBubbleRules',
  'negativePromptRules'
];

export function getComicsProductionAgents(format: CreativeFormat): ComicsProductionAgent[] {
  if (format === 'four-cut-insta-toon') {
    return baseComicsAgents.filter((agent) => agent.id !== 'showrunner');
  }

  return baseComicsAgents;
}

export function buildComicsVisualWorkflow(format: CreativeFormat): ComicsVisualWorkflow {
  const platformOutput = getPlatformOutput(format);

  return {
    format,
    platformOutput,
    agents: getComicsProductionAgents(format),
    phases: [
      {
        title: '스토리 비트 고정',
        owner: 'showrunner',
        outcome: '컷으로 바꿔도 사라지면 안 되는 독자 약속과 마지막 후크를 고정합니다.'
      },
      {
        title: '컷 연출 보드',
        owner: 'storyboard-agent',
        outcome: '장면을 컷, 페이지, 스크롤, 스와이프 단위로 나누고 각 컷의 기능을 정합니다.'
      },
      {
        title: '말풍선 패스',
        owner: 'speech-bubble-agent',
        outcome: '대사 길이, 말풍선 위치, 표정과 동작을 가리는 위험을 먼저 줄입니다.'
      },
      {
        title: '원화/키프레임 선택',
        owner: 'keyframe-art-director',
        outcome: 'Midjourney로 키프레임 후보를 만들고 사용자가 선택한 원화만 참조 DNA로 잠급니다.'
      },
      {
        title: '컷별 이미지 프롬프트',
        owner: 'da-vinci',
        outcome: '선택된 원화, 캐릭터 시트, 배경 규칙을 컷별 이미지 프롬프트와 negative prompt로 바꿉니다.'
      },
      {
        title: '프레임 조립 게이트',
        owner: 'frame-assembly-agent',
        outcome: '비율, 여백, 컷 순서, 파일명, 게시 플랫폼 요구를 확인합니다.'
      },
      {
        title: '시각 연속성 차단',
        owner: 'continuity-editor',
        outcome: '같은 인물이 달라 보이거나 세계 규칙을 깨는 컷은 승인 전 차단합니다.'
      }
    ],
    visualLocks,
    referencePolicy: {
      primaryGenerator: 'Midjourney',
      approvalRequired: true,
      rule: '선택된 원화만 visual DNA가 되며, 미선택 후보는 canon이나 캐릭터 외형 기준으로 쓰지 않습니다.'
    },
    qualityGates: [
      '같은 인물이 컷마다 같은 사람으로 보이는가',
      '말풍선이 표정과 핵심 동작을 가리지 않는가',
      '배경과 소품이 이전 컷의 공간 규칙을 유지하는가',
      '이미지 프롬프트가 렌즈, 조명, 구도, negative prompt까지 검수 가능하게 쓰였는가',
      '플랫폼 비율과 컷 순서가 게시 형태에 맞는가'
    ]
  };
}

function getPlatformOutput(format: CreativeFormat) {
  switch (format) {
    case 'four-cut-insta-toon':
      return '1:1 정사각형 4컷 프레임';
    case 'insta-toon':
      return '1:1 캐러셀 컷 묶음';
    case 'serial-webtoon':
      return '세로 스크롤 웹툰 회차 보드';
    case 'graphic-novel':
      return '페이지 시퀀스와 챕터 보드';
    case 'short-comic':
      return '단편 만화/동화책/그래픽노블 페이지 보드';
    default:
      return '시각 스토리보드';
  }
}
