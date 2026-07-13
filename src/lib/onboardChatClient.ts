// /api/onboard-chat 브리지에 온보딩 구상 대화 턴을 요청하는 클라이언트. planChatClient 패턴(fetch·failed·reportAiCall).
import { reportAiCall } from './aiStatus';
import { normalizeOnboardChatResponse, type OnboardChatTurn } from './onboardChat';

export interface OnboardChatInput {
  medium: string;
  format: string;
  freewrite: string;
  dialogue: string;
  query: string;
  condense: boolean;
}

export interface OnboardChatResult {
  ok: boolean;
  turn?: OnboardChatTurn;
  reason?: string;
}

async function _runOnboardChat(input: OnboardChatInput): Promise<OnboardChatResult> {
  try {
    const response = await fetch('/api/onboard-chat', {
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
    const turn = normalizeOnboardChatResponse(data);
    if (!turn) {
      return { ok: false, reason: '구상 파트너 응답이 비어 있습니다.' };
    }
    return { ok: true, turn };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/onboard-chat 을 호출해 구상 대화 턴을 가져온다. 실패는 전부 ok:false·reason(호출 측이 안내로 강등).
export async function requestOnboardChat(input: OnboardChatInput): Promise<OnboardChatResult> {
  const result = await _runOnboardChat(input);
  reportAiCall({ mode: 'onboard-chat', ok: result.ok, reason: result.reason });
  return result;
}
