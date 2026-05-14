export type FlowStepId = 'medium' | 'intake' | 'editor' | 'publish';
export type AgentLayer = 'front' | 'mid' | 'back';

export interface LayeredAgent {
  id: string;
  label: string;
  layer: AgentLayer;
  role: string;
  visibleToUser: boolean;
}

export interface AgentLayerModel {
  front: LayeredAgent[];
  mid: LayeredAgent[];
  back: LayeredAgent[];
}

export interface FlowAgentAssignment {
  frontAgent: LayeredAgent;
  midAgents: LayeredAgent[];
  backAgents: LayeredAgent[];
}

const agents: LayeredAgent[] = [
  {
    id: 'onboarding-guide',
    label: '온보딩 가이드',
    layer: 'front',
    role: '매체 선택과 첫 프로젝트 진입을 짧고 선명하게 돕습니다.',
    visibleToUser: true
  },
  {
    id: 'creative-coach',
    label: '창작 코치',
    layer: 'front',
    role: '막힌 사용자를 질문과 다음 행동으로 다시 움직이게 합니다.',
    visibleToUser: true
  },
  {
    id: 'editor-companion',
    label: '에디터 동반자',
    layer: 'front',
    role: '원고 편집과 작품 바이블 사이에서 지금 할 일을 안내합니다.',
    visibleToUser: true
  },
  {
    id: 'publishing-guide',
    label: '출간 가이드',
    layer: 'front',
    role: '출간 스냅샷, 다운로드, 매체 전환 제안을 사용자 언어로 보여줍니다.',
    visibleToUser: true
  },
  {
    id: 'flow-orchestrator',
    label: '플로우 오케스트레이터',
    layer: 'mid',
    role: '현재 단계와 다음 이동 조건을 판단하고 에이전트 호출 순서를 정합니다.',
    visibleToUser: false
  },
  {
    id: 'context-router',
    label: '컨텍스트 라우터',
    layer: 'mid',
    role: '메모리뱅크에서 역할별로 필요한 기억 조각만 전달합니다.',
    visibleToUser: false
  },
  {
    id: 'canon-refactor',
    label: '캐논 리팩터',
    layer: 'mid',
    role: '수정 사항의 영향 회차, 충돌 위험, reveal/revision/blocked 판단을 준비합니다.',
    visibleToUser: false
  },
  {
    id: 'quality-gate',
    label: '품질 게이트',
    layer: 'mid',
    role: 'story, voice, continuity, platform 기준을 통과했는지 확인합니다.',
    visibleToUser: false
  },
  {
    id: 'memory-bank-manager',
    label: '메모리뱅크 관리자',
    layer: 'back',
    role: '캐논, 캐릭터, 세계관, 문체, 변경 로그를 구조 기억으로 보관합니다.',
    visibleToUser: false
  },
  {
    id: 'work-library-manager',
    label: '작품 라이브러리 관리자',
    layer: 'back',
    role: '프로젝트, 시리즈, 회차, 버전, 산출물 패키지를 정리합니다.',
    visibleToUser: false
  },
  {
    id: 'publishing-ops',
    label: '배포 운영 관리자',
    layer: 'back',
    role: '게시 위치, 다운로드 묶음, 플랫폼 handoff, 배포 이력을 관리합니다.',
    visibleToUser: false
  },
  {
    id: 'insights-analyst',
    label: '인사이트 분석가',
    layer: 'back',
    role: '사용자 막힘, 검토 결과, 실패 로그를 다음 제품 개선으로 돌립니다.',
    visibleToUser: false
  }
];

export function getAgentLayerModel(): AgentLayerModel {
  return {
    front: agents.filter((agent) => agent.layer === 'front'),
    mid: agents.filter((agent) => agent.layer === 'mid'),
    back: agents.filter((agent) => agent.layer === 'back')
  };
}

export function buildFlowAgentMap(): Record<FlowStepId, FlowAgentAssignment> {
  const byId = new Map(agents.map((agent) => [agent.id, agent]));
  const pick = (id: string) => {
    const agent = byId.get(id);

    if (!agent) {
      throw new Error(`Unknown agent: ${id}`);
    }

    return agent;
  };

  return {
    medium: {
      frontAgent: pick('onboarding-guide'),
      midAgents: [pick('flow-orchestrator'), pick('quality-gate')],
      backAgents: [pick('work-library-manager')]
    },
    intake: {
      frontAgent: pick('creative-coach'),
      midAgents: [pick('context-router'), pick('flow-orchestrator'), pick('quality-gate')],
      backAgents: [pick('memory-bank-manager'), pick('insights-analyst')]
    },
    editor: {
      frontAgent: pick('editor-companion'),
      midAgents: [pick('context-router'), pick('canon-refactor'), pick('quality-gate')],
      backAgents: [pick('memory-bank-manager'), pick('work-library-manager')]
    },
    publish: {
      frontAgent: pick('publishing-guide'),
      midAgents: [pick('canon-refactor'), pick('quality-gate'), pick('flow-orchestrator')],
      backAgents: [pick('publishing-ops'), pick('work-library-manager'), pick('insights-analyst')]
    }
  };
}
