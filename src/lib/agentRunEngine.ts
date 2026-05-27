// M4 청크 F · Layer 5 — 에이전트 실행 엔진.
// 정본 — docs/storyx-harness-architecture.md § 7 청크 F.
//
// 책임 — 검토 스케일(quick/standard/deep) 별로 어떤 ValidationAgentId 들을 돌릴지 결정하고,
//   각 에이전트의 페르소나·검토 기준을 바탕으로 AgentRun[] 산출.
// 기존 storyEngine.buildAgentRuns 의 하드코딩 5명을 폐기하고(Gap 4), 23명 에이전트 매트릭스 전체를 다룬다.
//
// 1차 컷의 generation 은 결정론적 — agenda·criteriaKeys 를 그대로 노출. LLM 기반 실 검토는 청크 H 통합에서.
import {
  getAgentValidationProcess,
  reviewScales,
  type PersonaReviewScaleId,
  type ValidationAgentId
} from './agentReviewProcess';
import type {
  AgentRun,
  AgentRunStatus,
  Chapter,
  ContinuityIssue,
  ProductionRequest,
  SeriesProject
} from './storyEngine';

export interface AgentRunEngineInput {
  project: SeriesProject;
  request: ProductionRequest;
  chapter: Chapter;
  issues: ContinuityIssue[];
  /** 기본 standard. */
  scale?: PersonaReviewScaleId;
  /** 명시 안 하면 scale.defaultAgents 사용. agentLimit 으로 자름. */
  requestedAgentIds?: ValidationAgentId[];
}

export interface AgentRunPlan {
  scale: PersonaReviewScaleId;
  agents: ValidationAgentId[];
  runs: AgentRun[];
}

// 메인 엔진 — 스케일/요청 에이전트를 받아 AgentRun[] 산출.
export function planAgentRuns(input: AgentRunEngineInput): AgentRunPlan {
  const scale = input.scale ?? 'standard';
  const scaleDef = reviewScales[scale];
  const candidates = input.requestedAgentIds ?? scaleDef.defaultAgents;
  // agentLimit 으로 잘라 token budget 보호.
  const agents = candidates.slice(0, scaleDef.agentLimit);
  const runs = agents.map((agentId) => buildAgentRun(agentId, input));
  return { scale, agents, runs };
}

// 에이전트 1명의 AgentRun. continuity-editor 만 issues 기반으로 block/revise/pass 분기.
function buildAgentRun(agentId: ValidationAgentId, input: AgentRunEngineInput): AgentRun {
  const process = getAgentValidationProcess(agentId);
  const status = resolveStatus(agentId, input.issues);
  const { output, evidence } = describeAgentRun(agentId, input, status);
  return {
    agentId,
    title: process.label,
    status,
    output,
    evidence
  };
}

function resolveStatus(agentId: ValidationAgentId, issues: ContinuityIssue[]): AgentRunStatus {
  if (agentId !== 'continuity-editor') return 'pass';
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  return errorCount > 0 ? 'block' : warningCount > 0 ? 'revise' : 'pass';
}

interface AgentRunDescription {
  output: string;
  evidence: string[];
}

// 에이전트별 generic 출력. 청크 H 에서 LLM 호출로 교체될 자리.
function describeAgentRun(
  agentId: ValidationAgentId,
  input: AgentRunEngineInput,
  status: AgentRunStatus
): AgentRunDescription {
  const { project, request, chapter, issues } = input;
  switch (agentId) {
    case 'showrunner':
      return {
        output: `${project.audiencePromise} 기준으로 ${chapter.title} 의 중심 사건과 다음 편 후크를 배치했습니다.`,
        evidence: [request.intent, chapter.hook].filter((s) => s.length > 0)
      };
    case 'character-custodian':
      return {
        output: '인물의 욕망·상처·말투 규칙을 회차 행동에 반영했습니다.',
        evidence: project.characters.flatMap((c) => c.canonAnchors)
      };
    case 'world-keeper':
      return {
        output: '세계 규칙·비용의 일관성을 검토했습니다.',
        evidence: project.worldRules.map((rule) => rule.rule)
      };
    case 'genre-stylist':
      return {
        output: '장르 리듬·문체 질감의 흐름을 검토했습니다.',
        evidence: [request.pressure].filter((s) => s.length > 0)
      };
    case 'continuity-editor': {
      const errorCount = issues.filter((i) => i.severity === 'error').length;
      return {
        output:
          status === 'block'
            ? `캐논 충돌 ${errorCount}건 — 해당 회차는 수정이 필요합니다.`
            : status === 'revise'
              ? '경고가 있어 가벼운 수정이 권장됩니다.'
              : '치명적 캐논 충돌 없이 다음 회차를 승인했습니다.',
        evidence: chapter.memoryAnchors
      };
    }
    default: {
      // 다른 18 에이전트는 agenda 를 그대로 노출. LLM 단계에서 정밀화.
      const process = getAgentValidationProcess(agentId);
      return {
        output: process.agenda,
        evidence: process.criteriaKeys ?? []
      };
    }
  }
}
