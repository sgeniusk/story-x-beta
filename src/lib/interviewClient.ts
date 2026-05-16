// storyx 로컬 브리지(/api/interview)에 작가 인터뷰 질문 생성을 요청하는 클라이언트.
// 작가가 쓴 자유 서술을 읽고 그 작품에 맞는 질문을 LLM이 만든다.
import { getIntakePersona, type IntakeAgentId, type ProjectIntakeQuestion } from './projectIntake';

const KNOWN_AGENT_IDS: IntakeAgentId[] = [
  'showrunner',
  'character-custodian',
  'world-keeper',
  'voice-curator',
  'essay-interviewer',
  'continuity-editor',
  'creative-coach',
  'storyboard-agent',
  'speech-bubble-agent'
];

export interface InterviewRequestInput {
  medium: string;
  freewrite: string;
}

export interface LlmInterviewResult {
  ok: boolean;
  questions?: ProjectIntakeQuestion[];
  reason?: string;
}

// 로컬 dev 서버에만 존재하는 /api/interview 브리지를 호출한다.
// 실패하면 ok:false로 떨어지고, 호출 측이 매체별 고정 질문으로 폴백한다.
export async function requestLlmInterview(input: InterviewRequestInput): Promise<LlmInterviewResult> {
  try {
    const response = await fetch('/api/interview', {
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

    const raw = Array.isArray(data.questions) ? data.questions : [];
    const questions = normalizeQuestions(raw);
    if (questions.length === 0) {
      return { ok: false, reason: '생성된 인터뷰 질문이 없습니다.' };
    }

    return { ok: true, questions };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

function normalizeQuestions(raw: unknown[]): ProjectIntakeQuestion[] {
  return raw
    .filter(isRecord)
    .map((question, index) => {
      const agentId = normalizeAgentId(question.agentId);
      const text = typeof question.question === 'string' ? question.question.trim() : '';
      const rawOptions = Array.isArray(question.options) ? question.options : [];
      const options = rawOptions.filter(isRecord).map((option, optionIndex) => ({
        id: `llm-q${index}-o${optionIndex}`,
        label: typeof option.label === 'string' ? option.label.trim() : `선택지 ${optionIndex + 1}`,
        impact: typeof option.impact === 'string' ? option.impact.trim() : ''
      }));
      const recommendedLabel =
        typeof question.recommendedOptionLabel === 'string' ? question.recommendedOptionLabel.trim() : '';
      const recommended = options.find((option) => option.label === recommendedLabel) ?? options[0];

      return {
        id: `llm-q-${index}`,
        agentId,
        agentLabel: getIntakePersona(agentId).name,
        question: text,
        options,
        recommendedOptionId: recommended ? recommended.id : ''
      };
    })
    .filter((question) => question.question.length > 0 && question.options.length >= 2);
}

function normalizeAgentId(value: unknown): IntakeAgentId {
  return typeof value === 'string' && (KNOWN_AGENT_IDS as string[]).includes(value)
    ? (value as IntakeAgentId)
    : 'showrunner';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
