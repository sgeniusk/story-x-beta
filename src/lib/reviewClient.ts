// storyx 로컬 브리지(/api/review)에 작가진 검토 LLM 실행을 요청하는 클라이언트
import { normalizeProviderReviewOutput, type AiCliReviewResult, type AiCliScale } from './aiCliHarness';

export interface ReviewRequestInput {
  scale: AiCliScale;
  target: string;
  /** 매체별 검토 — novel은 쇼러너 등 서사 에이전트, essay는 인터뷰어·문체·연속성 */
  medium: string;
  /** 작품 계약(표면 약속·심층 질문·무게중심)과 캐논 맥락 — 검토 기준 */
  context: string;
}

export interface LlmReviewResult {
  ok: boolean;
  result?: AiCliReviewResult;
  reason?: string;
}

// 로컬 dev 서버에만 존재하는 /api/review 브리지를 호출한다.
// 배포본이나 브리지 미연결 환경에서는 ok:false로 떨어지고, 호출 측이 mock 검토로 폴백한다.
export async function requestLlmReview(input: ReviewRequestInput, projectTitle: string): Promise<LlmReviewResult> {
  try {
    const response = await fetch('/api/review', {
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

    const raw = typeof data.stdout === 'string' && data.stdout.trim().length > 0 ? data.stdout : '';
    if (!raw) {
      return { ok: false, reason: '검토 출력이 비어 있습니다.' };
    }

    const result = normalizeProviderReviewOutput(raw, {
      provider: 'claude',
      mode: 'review',
      scale: input.scale,
      projectTitle
    });

    return { ok: true, result };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}
