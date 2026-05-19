// storyx 로컬 브리지(/api/draft)에 회차 초안 LLM 생성을 요청하는 클라이언트
import type { DraftChapterPayload } from './storyEngine';

export interface DraftRequestInput {
  medium: string;
  format: string;
  freewrite: string;
  title?: string;
  /** 기존 캐논·인물·세계를 담은 연속성 컨텍스트. 2화 이상에서 채워진다. */
  context?: string;
}

export interface LlmDraftResult {
  ok: boolean;
  payload?: DraftChapterPayload;
  reason?: string;
}

// 로컬 dev 서버에만 존재하는 /api/draft 브리지를 호출한다.
// 배포본(Vercel)이나 브리지 미연결 환경에서는 ok:false로 떨어지고, 호출 측이 deterministic 생성으로 폴백한다.
export async function requestLlmDraft(input: DraftRequestInput): Promise<LlmDraftResult> {
  try {
    const response = await fetch('/api/draft', {
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

    const prose = typeof data.prose === 'string' ? data.prose : '';
    if (prose.trim().length === 0) {
      return { ok: false, reason: '생성된 원고가 비어 있습니다.' };
    }

    return {
      ok: true,
      payload: {
        title: typeof data.title === 'string' ? data.title : '',
        hook: typeof data.hook === 'string' ? data.hook : '',
        outline: Array.isArray(data.outline) ? data.outline.filter((line): line is string => typeof line === 'string') : [],
        beats: normalizeBeats(data.beats),
        prose,
        newCanonFacts: normalizeCanonFacts(data.newCanonFacts)
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : '브리지에 연결할 수 없습니다.';
    return { ok: false, reason };
  }
}

// 브리지 응답의 beats를 { label, summary, tension? } 쌍으로 정규화한다. 구버전·누락 응답은 빈 배열로 떨어진다.
// tension은 브리지가 보낸 숫자만 그대로 통과시키고, 누락 시 chapterFromDraftPayload 쪽에서 기본값으로 보정된다.
function normalizeBeats(value: unknown): DraftChapterPayload['beats'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label : '',
      summary: typeof item.summary === 'string' ? item.summary : '',
      ...(typeof item.tension === 'number' && Number.isFinite(item.tension)
        ? { tension: item.tension }
        : {})
    }))
    .filter((beat) => beat.label.trim().length > 0 || beat.summary.trim().length > 0);
}

function normalizeCanonFacts(value: unknown): DraftChapterPayload['newCanonFacts'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      owner: typeof item.owner === 'string' ? item.owner : 'plot',
      statement: typeof item.statement === 'string' ? item.statement : ''
    }))
    .filter((fact) => fact.statement.trim().length > 0);
}
