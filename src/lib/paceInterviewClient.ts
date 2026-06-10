// /api/pace-interview 브리지에 쇼러너 서술형 페이스 인터뷰 질문 생성을 요청하는 클라이언트.
// interviewClient 의 requestLlmInterview 패턴(fetch·status:'failed' 처리·reportAiCall·폴백)을 따른다.
import type { PaceQuestion } from './paceInterview';
import { reportAiCall } from './aiStatus';

export interface PaceInterviewInput {
  medium: string;
  format: string;
  payoffStatus: {
    isStalled: boolean;
    deferredStreak: number;
    openPromises: number;
  };
  unpaidPromises: string[];
  deferredStakes: string[];
  context: string;
}

export interface PaceInterviewResult {
  ok: boolean;
  questions?: PaceQuestion[];
  reason?: string;
}

// LLM 자유 문장 시드를 생성 후 strip 하기 위한 접두 계약.
// stripConsumedSeeds 의 SEED_PATTERN_PACE_LLM 이 이 접두를 기준으로 제거한다.
const PACE_LLM_PREFIX = '[페이스] ';

// 정규화된 PaceQuestion 배열로 변환한다 — 오형식 무시·최대 3질문·질문당 옵션 최대 3.
// label/intentSeed 가 비어있지 않은 옵션만 포함. 각 옵션 intentSeed 앞에 접두를 붙인다(이미 있으면 중복 금지).
export function normalizePaceQuestions(raw: unknown): PaceQuestion[] {
  if (!Array.isArray(raw)) return [];

  const questions: PaceQuestion[] = [];

  for (const item of raw) {
    if (questions.length >= 3) break;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;

    const record = item as Record<string, unknown>;
    const question = typeof record.question === 'string' ? record.question.trim() : '';
    if (!question) continue;

    const rawOptions = Array.isArray(record.options) ? record.options : [];
    const options = rawOptions
      .filter((opt): opt is Record<string, unknown> =>
        typeof opt === 'object' && opt !== null && !Array.isArray(opt)
      )
      .map((opt) => {
        const label = typeof opt.label === 'string' ? opt.label.trim() : '';
        const intentSeed = typeof opt.intentSeed === 'string' ? opt.intentSeed.trim() : '';
        return { label, intentSeed };
      })
      .filter((opt) => opt.label.length > 0 && opt.intentSeed.length > 0)
      .slice(0, 3)
      .map((opt) => ({
        label: opt.label,
        intentSeed: opt.intentSeed.startsWith(PACE_LLM_PREFIX)
          ? opt.intentSeed
          : `${PACE_LLM_PREFIX}${opt.intentSeed}`,
      }));

    questions.push({
      id: `llm-pace-${questions.length + 1}`,
      question,
      options,
    });
  }

  return questions;
}

// 내부 실행 함수 — fetch·status:'failed' 처리·폴백.
async function _runPaceInterview(input: PaceInterviewInput): Promise<PaceInterviewResult> {
  try {
    const response = await fetch('/api/pace-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})` };
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.status === 'failed') {
      const warning = typeof data.warning === 'string' ? data.warning : 'provider 호출 실패';
      return { ok: false, reason: warning };
    }

    const raw = Array.isArray(data.questions) ? data.questions : [];
    const questions = normalizePaceQuestions(raw);
    if (questions.length === 0) {
      return { ok: false, reason: '생성된 페이스 질문이 없습니다.' };
    }

    return { ok: true, questions };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// /api/pace-interview 브리지를 호출해 작품 맞춤 페이스 질문을 가져온다.
// 실패 경로(브리지 오류·provider 실패·빈 질문·fetch throw)는 전부 ok:false, reason 으로 반환.
// 호출 끝에 reportAiCall 로 글로벌 AI 상태 뱃지에 결과를 브로드캐스트.
export async function requestPaceInterview(input: PaceInterviewInput): Promise<PaceInterviewResult> {
  const result = await _runPaceInterview(input);
  reportAiCall({ mode: 'pace-interview', ok: result.ok, reason: result.reason });
  return result;
}
