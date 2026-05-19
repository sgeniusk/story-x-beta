// storyx 로컬 브리지(/api/review-agent)에 에이전트 1명씩 분리 검토를 요청하는 클라이언트.
// 각 에이전트가 자기 페르소나로 독립 호출되어, 한 번에 5모자를 쓰던 검토를 진짜 분리 검토로 바꾼다.
import {
  getAgentLabel,
  type AiCliAgentReport,
  type AiCliMemoryCandidate,
  type AiCliReviewStatus
} from './aiCliHarness';
import type { ValidationAgentId } from './agentReviewProcess';

export interface AgentReviewInput {
  agentId: string;
  target: string;
  medium: string;
  context: string;
}

export interface AgentReviewResult {
  ok: boolean;
  report?: AiCliAgentReport;
  memoryCandidates?: AiCliMemoryCandidate[];
  reason?: string;
}

type MemoryOwner = AiCliMemoryCandidate['owner'];

function normalizeOwner(value: unknown): MemoryOwner {
  return value === 'character' || value === 'world' || value === 'plot' || value === 'voice' || value === 'visual' || value === 'audio'
    ? value
    : 'plot';
}

function toReviewStatus(value: unknown): AiCliReviewStatus {
  return value === 'revise' || value === 'blocked' ? value : 'pass';
}

// 브리지 응답의 배열 필드를 빈 항목 없는 문자열 리스트로 정규화한다
function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

// 에이전트 1명에게 분리 검토를 요청한다. 브리지 미연결·실패 시 ok:false로 떨어진다.
export async function requestAgentReview(input: AgentReviewInput): Promise<AgentReviewResult> {
  try {
    const response = await fetch('/api/review-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: input.agentId,
        target: input.target,
        medium: input.medium,
        context: input.context
      })
    });

    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})` };
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (data.status === 'failed') {
      return { ok: false, reason: typeof data.warning === 'string' ? data.warning : 'provider 호출 실패' };
    }

    const agentId = input.agentId as ValidationAgentId;
    const report: AiCliAgentReport = {
      agentId,
      label: getAgentLabel(input.agentId),
      status: toReviewStatus(data.verdict),
      note: typeof data.note === 'string' && data.note.trim().length > 0 ? data.note : '검토 의견이 비어 있습니다.',
      evidence: toStringList(data.evidence),
      strengths: toStringList(data.strengths),
      issues: toStringList(data.issues)
    };

    const memoryCandidates: AiCliMemoryCandidate[] = (Array.isArray(data.memoryCandidates) ? data.memoryCandidates : [])
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item, index) => {
        const owner = normalizeOwner(item.owner);
        return {
          id: `${input.agentId}-mem-${index + 1}`,
          owner,
          status: 'pending' as const,
          statement: typeof item.statement === 'string' ? item.statement : '',
          sourceAgentId: agentId,
          targetPath: `reviews/pending/${owner}-candidates.json`,
          rationale: typeof item.rationale === 'string' ? item.rationale : '검토 에이전트가 제안한 후보입니다.'
        };
      })
      .filter((candidate) => candidate.statement.trim().length > 0);

    return { ok: true, report, memoryCandidates };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}
