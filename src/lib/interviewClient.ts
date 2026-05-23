// storyx 로컬 브리지(/api/interview)에 작가 인터뷰 질문 생성을 요청하는 클라이언트.
// 작가가 쓴 자유 서술을 읽고 그 작품에 맞는 질문을 LLM이 만든다.
// 매체별 페르소나 풀(에세이·소설·만화·오디오북)을 점수로 선별해 LLM 프롬프트에 톤 가이드로 주입한다.
import { getIntakePersona, type IntakeAgentId, type ProjectIntakeQuestion } from './projectIntake';
import { pickEssayInterviewers } from './essayPersonas';
import { pickNovelInterviewers } from './novelPersonas';
import { pickComicInterviewers } from './comicPersonas';
import { pickAudiobookInterviewers } from './audiobookPersonas';
import type { MediaPersona } from './mediaPersonas';
import { reportAiCall } from './aiStatus';

const KNOWN_AGENT_IDS: IntakeAgentId[] = [
  'showrunner',
  'character-custodian',
  'world-keeper',
  'voice-curator',
  'essay-interviewer',
  'essay-thesis',
  'continuity-editor',
  'creative-coach',
  'storyboard-agent',
  'speech-bubble-agent'
];

export interface InterviewRequestInput {
  medium: string;
  /** 포맷 — 연재형/단독 완결형 구분. 단편은 회차 가정 없는 질문을 만들게 한다. */
  format: string;
  freewrite: string;
}

export interface LlmInterviewResult {
  ok: boolean;
  questions?: ProjectIntakeQuestion[];
  reason?: string;
  /** 이번 인터뷰에 LLM 톤 가이드로 주입된 페르소나 라인업 — UI에 라인업 띠를 노출하는 용도 */
  personaLineup?: Array<Pick<MediaPersona, 'id' | 'label' | 'tone' | 'category' | 'isFictionalized'>>;
}

// 자유 서술과 매체에 맞춰 상위 3 페르소나를 고른다. interview-curator(브릿지 단계)의 핵심 결정.
function buildPersonaLineup(medium: string, freewrite: string): MediaPersona[] {
  const charLength = freewrite.length;
  switch (medium) {
    case 'essay':
      // pickEssayInterviewers 는 EssayPersona[] 반환 — 구조가 MediaPersona 와 호환된다.
      return pickEssayInterviewers(freewrite, charLength, 3) as unknown as MediaPersona[];
    case 'novel':
      return pickNovelInterviewers(freewrite, charLength, 3);
    case 'comic':
      return pickComicInterviewers(freewrite, charLength, 3);
    case 'audiobook':
      return pickAudiobookInterviewers(freewrite, charLength, 3);
    default:
      return [];
  }
}

// 로컬 dev 서버에만 존재하는 /api/interview 브리지를 호출한다.
// 실패하면 ok:false로 떨어지고, 호출 측이 매체별 고정 질문으로 폴백한다.
// 호출 끝에 reportAiCall 로 글로벌 AI 상태 뱃지에 결과를 브로드캐스트.
export async function requestLlmInterview(input: InterviewRequestInput): Promise<LlmInterviewResult> {
  const result = await _runLlmInterview(input);
  reportAiCall({ mode: 'interview', ok: result.ok, reason: result.reason });
  return result;
}

async function _runLlmInterview(input: InterviewRequestInput): Promise<LlmInterviewResult> {
  const lineup = buildPersonaLineup(input.medium, input.freewrite);
  const personaLineup = lineup.map((persona) => ({
    id: persona.id,
    label: persona.label,
    tone: persona.tone,
    category: persona.category ?? (input.medium as MediaPersona['category']),
    isFictionalized: persona.isFictionalized
  }));

  try {
    const response = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, personaLineup: lineup })
    });

    if (!response.ok) {
      return { ok: false, reason: `브리지 응답 오류 (${response.status})`, personaLineup };
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.status === 'failed') {
      const warning = typeof data.warning === 'string' ? data.warning : 'provider 호출 실패';
      return { ok: false, reason: warning, personaLineup };
    }

    const raw = Array.isArray(data.questions) ? data.questions : [];
    const questions = normalizeQuestions(raw);
    if (questions.length === 0) {
      return { ok: false, reason: '생성된 인터뷰 질문이 없습니다.', personaLineup };
    }

    return { ok: true, questions, personaLineup };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason, personaLineup };
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
