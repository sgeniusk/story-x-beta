// /api/spine-suggest 브리지에 쇼러너 4줄 척추 제안을 요청하는 클라이언트 (Phase A-3b).
// interviewClient/paceInterviewClient 패턴(fetch·status:'failed'·reportAiCall·폴백은 호출 측)을 따른다.
import type { StorySpine } from './storyEngine';
import { reportAiCall } from './aiStatus';

export interface SpineSuggestionInput {
  medium: string;
  format: string;
  freewrite: string;
  endingStatement?: string;
  protagonistCost?: string;
}

export interface SpineSuggestionResult {
  ok: boolean;
  spine?: StorySpine;
  reason?: string;
}

// provider 응답의 spine 객체를 StorySpine 으로 정규화. 4줄이 모두 비거나 객체가 아니면 null.
export function normalizeSpine(raw: unknown): StorySpine | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const read = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  const spine: StorySpine = {
    desire: read(r.desire),
    advance: read(r.advance),
    obstacle: read(r.obstacle),
    resolution: read(r.resolution)
  };
  if (!spine.desire && !spine.advance && !spine.obstacle && !spine.resolution) return null;
  return spine;
}

async function _runSpineSuggestion(input: SpineSuggestionInput): Promise<SpineSuggestionResult> {
  try {
    const response = await fetch('/api/spine-suggest', {
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

    const spine = normalizeSpine(data.spine);
    if (!spine) {
      return { ok: false, reason: '생성된 4줄 척추가 없습니다.' };
    }

    return { ok: true, spine };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/spine-suggest 브리지를 호출해 작품 맞춤 4줄 척추 제안을 가져온다.
// 실패 경로(브리지 오류·provider 실패·빈 척추·fetch throw)는 전부 ok:false, reason 으로 반환.
// 호출 측(charter UI)이 ok:false 면 결정론 폴백 또는 안내로 강등한다.
export async function requestSpineSuggestion(input: SpineSuggestionInput): Promise<SpineSuggestionResult> {
  const result = await _runSpineSuggestion(input);
  reportAiCall({ mode: 'spine-suggest', ok: result.ok, reason: result.reason });
  return result;
}
