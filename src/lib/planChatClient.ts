// /api/plan-chat 브리지에 설계 대화 턴을 요청하는 클라이언트. vsCandidatesClient 패턴(fetch·failed·reportAiCall).
import { reportAiCall } from './aiStatus';
import { normalizePlanChatResponse, type PlanChatCatalog, type PlanChatTurn } from './planChat';
import { storyXApiFetch } from './runtimeCapabilities';

export interface PlanChatInput {
  medium: string;
  format: string;
  activeSection: string;
  contextDigest: string;
  catalogText: string;
  dialogue: string;
  query: string;
}

export interface PlanChatResult {
  ok: boolean;
  turn?: PlanChatTurn;
  reason?: string;
}

async function _runPlanChat(input: PlanChatInput, catalog: PlanChatCatalog): Promise<PlanChatResult> {
  try {
    const response = await storyXApiFetch('/api/plan-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})` };
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (data.status === 'failed') {
      const warning = typeof data.warning === 'string' ? data.warning : 'provider 호출 실패';
      return { ok: false, reason: warning };
    }
    const turn = normalizePlanChatResponse(data, catalog);
    if (!turn) {
      return { ok: false, reason: '설계 파트너 응답이 비어 있습니다.' };
    }
    return { ok: true, turn };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/plan-chat 을 호출해 설계 대화 턴을 가져온다. 실패는 전부 ok:false·reason(호출 측이 안내로 강등).
export async function requestPlanChat(input: PlanChatInput, catalog: PlanChatCatalog): Promise<PlanChatResult> {
  const result = await _runPlanChat(input, catalog);
  reportAiCall({ mode: 'plan-chat', ok: result.ok, reason: result.reason });
  return result;
}
