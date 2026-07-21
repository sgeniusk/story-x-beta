// /api/vs-candidates 브리지에 이번 화 전개 후보(VS)를 요청하는 클라이언트 (Phase C-1).
// spineSuggestClient 패턴(fetch·status:'failed'·reportAiCall·폴백은 호출 측)을 따른다.
import { reportAiCall } from './aiStatus';
import { normalizeVsCandidates, type VsCandidate } from './episodeBriefing';
import { storyXApiFetch } from './runtimeCapabilities';

export interface VsCandidatesInput {
  medium: string;
  format: string;
  contractDigest?: string;
  recentSummary: string;
  unpaidPromises: string[];
  canonStatements: string[];
}

export interface VsCandidatesResult {
  ok: boolean;
  candidates?: VsCandidate[];
  reason?: string;
}

async function _runVsCandidates(input: VsCandidatesInput): Promise<VsCandidatesResult> {
  try {
    const response = await storyXApiFetch('/api/vs-candidates', {
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
    const candidates = normalizeVsCandidates(data, input.canonStatements);
    if (candidates.length === 0) {
      return { ok: false, reason: '생성된 전개 후보가 없습니다.' };
    }
    return { ok: true, candidates };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/vs-candidates 를 호출해 전개 후보를 가져온다. 실패는 전부 ok:false·reason(호출 측이 안내로 강등).
export async function requestVsCandidates(input: VsCandidatesInput): Promise<VsCandidatesResult> {
  const result = await _runVsCandidates(input);
  reportAiCall({ mode: 'vs-candidates', ok: result.ok, reason: result.reason });
  return result;
}
